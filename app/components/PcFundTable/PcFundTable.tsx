'use client';

import React, { memo, useState, useRef, useCallback, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { isFunction, isNumber, throttle } from 'lodash';
import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable, type Row } from '@tanstack/react-table';
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowUpDown, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import { useModalStore, storageStore } from '@/app/stores';
import ConfirmModal from '../ConfirmModal';
import PcTableSettingModal from '../PcTableSettingModal';
import MoveGroupModal from '../MoveGroupModal';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';

import {
  EditModeContext,
  SortableRowContext,
  NON_FROZEN_COLUMN_IDS,
  COLUMN_HEADERS,
  sortableRowA11yProps,
  type PcFundTableProps
} from './types';
import FundDetailDialog from './FundDetailDialog';
import usePcTableColumns from './usePcTableColumns';
import { useFundDataEnhancer } from './useFundDataEnhancer';
import { usePcGroupConfig } from './usePcGroupConfig';

interface SortableRowProps {
  row: Row<any>;
  children: React.ReactNode;
  disabled?: boolean;
}

function SortableRow({ row, children, disabled }: SortableRowProps) {
  const { attributes, listeners, transform, transition, setNodeRef, setActivatorNodeRef, isDragging } = useSortable({
    id: row.original.code,
    disabled
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 999, opacity: 0.85 } : {})
  };

  const contextValue = useMemo(
    () => ({
      setActivatorNodeRef,
      listeners,
      activatorProps: sortableRowA11yProps(attributes)
    }),
    [setActivatorNodeRef, listeners, attributes]
  );

  return (
    <SortableRowContext.Provider value={contextValue}>
      <tr
        ref={setNodeRef}
        data-state={row.getIsSelected?.() ? 'selected' : undefined}
        className={cn(
          'pc-table-row group border-b border-border/50 transition-colors',
          isDragging ? 'shadow-lg bg-muted/90' : ''
        )}
        style={style}
      >
        {children}
      </tr>
    </SortableRowContext.Provider>
  );
}

interface MemoizedTableRowProps {
  row: Row<any>;
  index: number;
  sortBy: string;
  getCommonPinningStyles: (column: any, isHeader?: boolean) => React.CSSProperties;
  isFavorites?: boolean;
  isSelected?: boolean;
  masked?: boolean;
  periodReturns?: any;
  relatedSector?: any;
  sectorQuote?: any;
  fundExtraData?: any;
  columnOrder: string[];
  columnVisibility: Record<string, boolean>;
  columnSizing: Record<string, number>;
}

const MemoizedTableRow = memo(
  function MemoizedTableRow({ row, index, sortBy, getCommonPinningStyles, masked }: MemoizedTableRowProps) {
    const isEven = index % 2 === 1;
    return (
      <SortableRow row={row} disabled={sortBy !== 'default'}>
        {row.getVisibleCells().map((cell) => {
          const column = cell.column;
          const isPinned = column.getIsPinned();
          const isLeft = isPinned === 'left';
          const isRight = isPinned === 'right';
          const isLastLeft = isLeft && isFunction(column.getIsLastColumn) ? column.getIsLastColumn('left') : isLeft;
          const isFirstRight =
            isRight && isFunction(column.getIsFirstColumn) ? column.getIsFirstColumn('right') : isRight;

          const pinClass = isPinned
            ? `pc-table-cell-pinned ${isLeft ? 'pinned-cell-left' : ''} ${isLastLeft ? 'pinned-cell-left-last' : ''} ${isRight ? 'pinned-cell-right' : ''} ${isFirstRight ? 'pinned-cell-right-first' : ''}`.trim()
            : '';

          const cellClassName = (column.columnDef.meta as any)?.cellClassName || '';
          const isNameColumn = column.id === 'fundName';
          const isRightAligned = NON_FROZEN_COLUMN_IDS.includes(column.id);
          const align = isNameColumn ? 'text-left' : isRightAligned ? 'text-right' : 'text-center';
          const style = getCommonPinningStyles(column, false);

          return (
            <td
              key={cell.id}
              data-masked={masked}
              className={cn(
                'px-3 py-2.5 align-middle whitespace-nowrap text-xs transition-colors h-[54px]',
                align,
                cellClassName,
                pinClass,
                isEven ? 'pc-table-cell-even' : 'pc-table-cell-odd'
              )}
              style={style}
            >
              {flexRender(column.columnDef.cell, cell.getContext())}
            </td>
          );
        })}
      </SortableRow>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.index === nextProps.index &&
      prevProps.sortBy === nextProps.sortBy &&
      prevProps.isFavorites === nextProps.isFavorites &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.masked === nextProps.masked &&
      prevProps.periodReturns === nextProps.periodReturns &&
      prevProps.relatedSector === nextProps.relatedSector &&
      prevProps.sectorQuote === nextProps.sectorQuote &&
      prevProps.fundExtraData === nextProps.fundExtraData &&
      prevProps.columnOrder === nextProps.columnOrder &&
      prevProps.columnVisibility === nextProps.columnVisibility &&
      prevProps.columnSizing === nextProps.columnSizing &&
      prevProps.row.original === nextProps.row.original
    );
  }
);

export const PcFundTable = memo(function PcFundTable({
  data = [],
  onRemoveFund,
  onRemoveFunds,
  onMoveFunds,
  currentTab,
  groups = [],
  favorites = new Set(),
  onToggleFavorite,
  onHoldingAmountClick,
  sortBy = 'default',
  sortOrder = 'desc',
  sortRules = [],
  onSortChange,
  onReorder,
  onCustomSettingsChange,
  getFundCardProps,
  closeDialogRef,
  batchSelectionClearRef,
  stickyTop = 0,
  masked = false,
  relatedSectorSessionKey,
  onFundTagsClick,
  fundExtraDataByCode = {}
}: PcFundTableProps) {
  const fundDeleteConfirm = useModalStore((s) => s.fundDeleteConfirm);
  const fundDeleteBulkConfirm = useModalStore((s) => s.fundDeleteBulkConfirm);
  const blockDialogClose = !!fundDeleteConfirm || !!fundDeleteBulkConfirm;

  const [pagination, setPagination] = useState(() => {
    let size = 20;
    try {
      if (typeof window !== 'undefined') {
        const stored = storageStore.getItem('fundTablePageSize');
        if (stored && isNumber(stored) && stored > 0) size = stored;
      }
    } catch (e) {}
    return {
      pageIndex: 0,
      pageSize: size
    };
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [currentTab, sortBy, sortOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    }),
    useSensor(KeyboardSensor)
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [cardDialogRow, setCardDialogRow] = useState<any>(null);
  const handleOpenCardDialog = useCallback((row: any) => {
    setCardDialogRow(row);
  }, []);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const portalHeaderRef = useRef<HTMLDivElement>(null);
  const [showPortalHeader, setShowPortalHeader] = useState(false);
  const [effectiveStickyTop, setEffectiveStickyTop] = useState(stickyTop);
  const [portalHorizontal, setPortalHorizontal] = useState({ left: 0, right: 0 });
  const topScrollbarRef = useRef<HTMLDivElement>(null);
  const portalTopScrollbarRef = useRef<HTMLDivElement>(null);
  const [showTopScrollbar, setShowTopScrollbar] = useState(false);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);

  const autoScrollRafRef = useRef<number | null>(null);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRafRef.current) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
  }, []);

  const startAutoScroll = useCallback((direction: number) => {
    if (autoScrollRafRef.current) return;
    const tick = () => {
      window.scrollBy(0, direction * 12);
      autoScrollRafRef.current = requestAnimationFrame(tick);
    };
    autoScrollRafRef.current = requestAnimationFrame(tick);
  }, []);

  const handleDragMove = useCallback(
    (event: any) => {
      const { active } = event;
      if (!active) return;
      const pointerY = (event as any).activatorEvent?.clientY ?? 0;
      const edgeThreshold = 80;
      const windowHeight = window.innerHeight;

      if (pointerY > 0 && pointerY < edgeThreshold) {
        startAutoScroll(-1);
      } else if (pointerY > windowHeight - edgeThreshold) {
        startAutoScroll(1);
      } else {
        stopAutoScroll();
      }
    },
    [startAutoScroll, stopAutoScroll]
  );

  const handleDragStart = useCallback((event: any) => {
    const { active } = event;
    setActiveId(String(active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: any) => {
      stopAutoScroll();
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) return;

      const oldIndex = data.findIndex((item: any) => item.code === active.id);
      const newIndex = data.findIndex((item: any) => item.code === over.id);

      if (oldIndex !== -1 && newIndex !== -1 && onReorder) {
        onReorder(oldIndex, newIndex);
      }
    },
    [data, onReorder, stopAutoScroll]
  );

  const handleDragCancel = useCallback(() => {
    stopAutoScroll();
    setActiveId(null);
  }, [stopAutoScroll]);

  const isGroupTab = useMemo(
    () => Boolean(currentTab && currentTab !== 'all' && currentTab !== 'holding' && currentTab !== 'custom'),
    [currentTab]
  );

  const groupKey = isGroupTab ? currentTab : 'all';

  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(() => new Set());
  const [moveGroupOpen, setMoveGroupOpen] = useState(false);

  const batchRemoveEnabled = Boolean(
    (currentTab === 'holding' && onRemoveFunds) || (isGroupTab && (onRemoveFunds || onMoveFunds))
  );

  const batchSelectableCodes = useMemo(() => {
    if (!batchRemoveEnabled) return [];
    return data.map((item: any) => item.code).filter(Boolean);
  }, [batchRemoveEnabled, data]);

  const batchSelectableCount = batchSelectableCodes.length;

  useEffect(() => {
    setSelectedCodes(new Set());
    setIsEditMode(false);
  }, [currentTab]);

  useEffect(() => {
    setSelectedCodes((prev) => {
      if (prev.size === 0) return prev;
      const validCodes = new Set(data.map((item: any) => item.code));
      const next = new Set(prev);
      let changed = false;
      for (const c of next) {
        if (!validCodes.has(c)) {
          next.delete(c);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [data]);

  useEffect(() => {
    if (!batchSelectionClearRef) return undefined;
    batchSelectionClearRef.current = () => {
      setSelectedCodes(new Set());
      setIsEditMode(false);
    };
    return () => {
      batchSelectionClearRef.current = null;
    };
  }, [batchSelectionClearRef]);

  const selectedCount = selectedCodes.size;
  const toggleSelected = useCallback((code: string, checked: boolean) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (checked) next.add(code);
      else next.delete(code);
      return next;
    });
  }, []);

  const setAllSelected = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedCodes(new Set(batchSelectableCodes));
      } else {
        setSelectedCodes(new Set());
      }
    },
    [batchSelectableCodes]
  );

  const [settingModalOpen, setSettingModalOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const {
    currentGroupName,
    settingSyncOptions,
    currentGroupPc,
    columnOrder,
    setColumnOrder,
    columnVisibility,
    setColumnVisibility,
    columnSizing,
    setColumnSizing,
    handleResetSizing,
    handleResetColumnOrder,
    handleResetColumnVisibility,
    handleToggleColumnVisibility,
    handleTogglePinColumn,
    handleSyncPcSettings,
    showFullFundName,
    handleToggleShowFullFundName
  } = usePcGroupConfig({
    groupKey,
    groups,
    onCustomSettingsChange
  });

  const {
    relatedSectorByCode,
    sectorQuoteByLabel,
    periodReturnsByCode,
    dataSourceAccuracyLabels,
    getFundCardPropsWithRelatedSector
  } = useFundDataEnhancer({
    data,
    columnVisibility,
    relatedSectorSessionKey,
    getFundCardProps
  });

  useEffect(() => {
    if (closeDialogRef) {
      closeDialogRef.current = () => setCardDialogRow(null);
      return () => {
        closeDialogRef.current = null;
      };
    }
  }, [closeDialogRef]);

  const onToggleFavoriteRef = useRef(onToggleFavorite);
  onToggleFavoriteRef.current = onToggleFavorite;
  const onFundTagsClickRef = useRef(onFundTagsClick);
  onFundTagsClickRef.current = onFundTagsClick;
  const onRemoveFundRef = useRef(onRemoveFund);
  onRemoveFundRef.current = onRemoveFund;
  const onHoldingAmountClickRef = useRef(onHoldingAmountClick);
  onHoldingAmountClickRef.current = onHoldingAmountClick;

  const columns = usePcTableColumns({
    currentTab,
    isGroupTab,
    showFullFundName,
    getFundCardProps,
    handleOpenCardDialog,
    masked,
    relatedSectorByCode,
    sectorQuoteByLabel,
    periodReturnsByCode,
    dataSourceAccuracyLabels,
    batchRemoveEnabled,
    batchSelectableCount,
    selectedCount,
    selectedCodes,
    onRemoveFunds,
    onMoveFunds,
    setAllSelected,
    setSelectedCodes,
    setIsEditMode,
    setMoveGroupOpen,
    setSettingModalOpen,
    onFundTagsClick,
    isEditMode,
    toggleSelected,
    favorites,
    sortBy,
    onToggleFavoriteRef,
    onFundTagsClickRef,
    onRemoveFundRef,
    onHoldingAmountClickRef,
    fundExtraDataByCode
  });

  const table = useReactTable({
    data,
    columns,
    enableColumnPinning: true,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    onColumnSizingChange: (updater) => {
      setColumnSizing((prev) => {
        const next = isFunction(updater) ? updater(prev) : updater;
        const { actions, ...rest } = next || {};
        return rest || {};
      });
    },
    state: {
      columnSizing,
      columnOrder,
      columnVisibility,
      columnPinning: {
        left: ['fundName', ...columnOrder.filter((id) => (currentGroupPc?.pcTableColumnPinned || []).includes(id))],
        right: ['actions']
      },
      pagination
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    defaultColumn: {
      minSize: 40,
      size: 100,
      maxSize: 600,
      cell: (info) => info.getValue() ?? '—'
    }
  });

  const headerGroup = table.getHeaderGroups()[0];
  const tableRows = table.getRowModel().rows;

  const getCommonPinningStyles = useCallback((column: any, isHeader?: boolean) => {
    const isPinned = column.getIsPinned();
    const isNameColumn = column.id === 'fundName' || (column.columnDef as any)?.accessorKey === 'fundName';
    const widthStyle = `var(--col-${column.id}, ${column.getSize()}px)`;
    const style: React.CSSProperties = {
      width: widthStyle,
      minWidth: widthStyle,
      maxWidth: widthStyle
    };
    if (!isPinned) {
      return {
        ...style,
        zIndex: isHeader ? 1 : 0
      };
    }

    const isLeft = isPinned === 'left';
    const isRight = isPinned === 'right';

    return {
      ...style,
      position: 'sticky' as const,
      left: isLeft ? `var(--col-${column.id}-start, ${column.getStart('left')}px)` : undefined,
      right: isRight ? `var(--col-${column.id}-after, ${column.getAfter('right')}px)` : undefined,
      zIndex: isPinned ? (isHeader ? 30 : 10) : isHeader ? 1 : 0,
      textAlign: isNameColumn ? 'left' : 'center'
    } as React.CSSProperties;
  }, []);

  const getSortHeaderMeta = useCallback(
    (columnId: string) => {
      const sortMap: Record<string, string> = {
        fundName: 'name',
        tags: 'tags',
        yesterdayChangePercent: 'yesterdayIncrease',
        estimateChangePercent: 'yield',
        totalChangePercent: 'estimateProfit',
        holdingAmount: 'holdingAmount',
        holdingRatio: 'holdingRatio',
        todayProfit: 'todayProfit',
        yesterdayProfit: 'yesterdayProfit',
        holdingProfit: 'holding',
        holdingDays: 'holdingDays',
        holdingCost: 'holdingCost',
        sinceAddedChangePercent: 'sinceAddedChangePercent',
        period1w: 'last1Week',
        period1m: 'last1Month',
        period3m: 'last3Months',
        period6m: 'last6Months',
        period1y: 'last1Year'
      };
      const sortKey = sortMap[columnId];
      const isSorted = !!sortBy && sortKey === sortBy;
      let isSortEnabled = !!sortKey && (sortRules || []).some((rule) => rule?.id === sortKey && !!rule?.enabled);

      if (sortBy === 'default' && sortKey === 'name') {
        isSortEnabled = false;
      }

      return { sortKey, isSorted, isSortEnabled };
    },
    [sortBy, sortRules]
  );

  const totalHeaderWidth = headerGroup?.headers?.reduce((acc, h) => acc + h.column.getSize(), 0) ?? 0;

  const columnSizingState = table.getState().columnSizing;
  const columnOrderState = table.getState().columnOrder;
  const columnPinningState = table.getState().columnPinning;

  const tableCssVariables = useMemo(() => {
    const vars: Record<string, string> = {};
    table.getAllLeafColumns().forEach((column) => {
      vars[`--col-${column.id}`] = `${column.getSize()}px`;
      vars[`--col-${column.id}-start`] = `${column.getStart('left')}px`;
      vars[`--col-${column.id}-after`] = `${column.getAfter('right')}px`;
    });
    return vars as React.CSSProperties;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, columnSizingState, columnOrderState, columnPinningState]);

  // 同步浮动 Portal 表头与吸顶水平位置
  useEffect(() => {
    const getEffectiveStickyTop = () => {
      const baseStickyTop = stickyTop;
      const stickySummaryCard = document.querySelector<HTMLElement>('.group-summary-sticky .group-summary-card');
      if (!stickySummaryCard) return baseStickyTop;

      const stickySummaryWrapper = stickySummaryCard.closest<HTMLElement>('.group-summary-sticky');
      if (!stickySummaryWrapper) return baseStickyTop;

      const wrapperRect = stickySummaryWrapper.getBoundingClientRect();
      const isSummaryStuck = wrapperRect.top <= baseStickyTop + 1;

      return isSummaryStuck ? baseStickyTop + stickySummaryWrapper.offsetHeight : baseStickyTop;
    };

    const updateVerticalState = () => {
      const nextStickyTop = getEffectiveStickyTop() - 2;
      setEffectiveStickyTop((prev) => (prev === nextStickyTop ? prev : nextStickyTop));

      const tableEl = tableContainerRef.current;
      const scrollEl = tableEl?.closest('.table-scroll-area');
      const targetEl = scrollEl || tableEl;
      const rect = targetEl?.getBoundingClientRect();

      if (!rect || (rect.width === 0 && rect.height === 0)) {
        setShowPortalHeader(false);
        setShowTopScrollbar(false);
        return;
      }

      const headerEl = tableEl?.querySelector('thead tr');
      const headerHeight = headerEl?.getBoundingClientRect?.().height ?? 44;
      const hasPassedHeader = rect.top + headerHeight <= nextStickyTop;
      const hasTableInView = rect.bottom > nextStickyTop + headerHeight + 50;

      const nextPortalVisible = hasPassedHeader && hasTableInView;
      setShowPortalHeader((prev) => (prev === nextPortalVisible ? prev : nextPortalVisible));

      setPortalHorizontal((prev) => {
        const next = {
          left: rect.left,
          right: typeof window !== 'undefined' ? Math.max(0, window.innerWidth - rect.right) : 0
        };
        if (prev.left === next.left && prev.right === next.right) return prev;
        return next;
      });

      const scrollWidth = scrollEl?.scrollWidth || 0;
      const clientWidth = scrollEl?.clientWidth || 0;
      const hasOverflow = scrollWidth > clientWidth + 1;
      const isBottomOut = rect.bottom > window.innerHeight && rect.top < window.innerHeight;
      const nextTopScrollbarVisible = hasOverflow && isBottomOut;

      setShowTopScrollbar((prev) => (prev === nextTopScrollbarVisible ? prev : nextTopScrollbarVisible));
      if (hasOverflow && scrollWidth > 0) {
        setTableScrollWidth((prev) => (prev === scrollWidth ? prev : scrollWidth));
      }
    };

    const throttledVerticalUpdate = throttle(updateVerticalState, 1000 / 60, { leading: true, trailing: true });

    updateVerticalState();
    window.addEventListener('scroll', throttledVerticalUpdate, { passive: true });
    window.addEventListener('resize', throttledVerticalUpdate, { passive: true });

    let ro: ResizeObserver | null = null;
    if (tableContainerRef.current) {
      ro = new ResizeObserver(() => throttledVerticalUpdate());
      ro.observe(tableContainerRef.current);
      const scrollEl = tableContainerRef.current.closest('.table-scroll-area');
      if (scrollEl) ro.observe(scrollEl);
    }

    return () => {
      window.removeEventListener('scroll', throttledVerticalUpdate);
      window.removeEventListener('resize', throttledVerticalUpdate);
      if (ro) ro.disconnect();
      throttledVerticalUpdate.cancel();
    };
  }, [stickyTop]);

  // 跨元素横向滚动同步
  useEffect(() => {
    const tableEl = tableContainerRef.current;
    const scrollEl = tableEl?.closest('.table-scroll-area');
    if (!scrollEl) return;

    const elements = [scrollEl, portalHeaderRef.current, topScrollbarRef.current, portalTopScrollbarRef.current].filter(
      Boolean
    ) as HTMLElement[];

    if (elements.length <= 1) return;

    const currentScrollLeft = scrollEl.scrollLeft;
    elements.forEach((el) => {
      if (el !== scrollEl && Math.abs(el.scrollLeft - currentScrollLeft) > 1) {
        el.scrollLeft = currentScrollLeft;
      }
    });

    let isSyncing = false;
    const createScrollHandler = (sourceEl: HTMLElement) => () => {
      if (isSyncing) return;
      isSyncing = true;
      const val = sourceEl.scrollLeft;
      elements.forEach((targetEl) => {
        if (targetEl !== sourceEl && Math.abs(targetEl.scrollLeft - val) > 1) {
          targetEl.scrollLeft = val;
        }
      });
      isSyncing = false;
    };

    const handlers = elements.map((el) => ({
      el,
      handler: createScrollHandler(el)
    }));

    handlers.forEach(({ el, handler }) => {
      el.addEventListener('scroll', handler, { passive: true });
    });

    return () => {
      handlers.forEach(({ el, handler }) => {
        el.removeEventListener('scroll', handler);
      });
    };
  }, [showPortalHeader, showTopScrollbar, tableScrollWidth]);

  const renderTableHeader = (forPortal = false) => {
    if (!headerGroup) return null;
    return (
      <tr className="border-b border-border" style={{ backgroundColor: 'var(--table-pinned-header-bg)' }}>
        {headerGroup.headers.map((header) => {
          const style = getCommonPinningStyles(header.column, true);
          const isNameColumn =
            header.column.id === 'fundName' || (header.column.columnDef as any)?.accessorKey === 'fundName';
          const isRightAligned = NON_FROZEN_COLUMN_IDS.includes(header.column.id);
          const align = isNameColumn ? 'text-left' : isRightAligned ? 'text-right' : 'text-center';

          const colId = header.column.id || (header.column.columnDef as any)?.accessorKey;
          const { sortKey, isSorted, isSortEnabled } = getSortHeaderMeta(colId);

          const isPinned = header.column.getIsPinned();
          const isLeft = isPinned === 'left';
          const isRight = isPinned === 'right';
          const isLastLeft =
            isLeft && isFunction(header.column.getIsLastColumn) ? header.column.getIsLastColumn('left') : isLeft;
          const isFirstRight =
            isRight && isFunction(header.column.getIsFirstColumn) ? header.column.getIsFirstColumn('right') : isRight;

          const pinClass = isPinned
            ? `pc-table-header-pinned ${isLeft ? 'pinned-cell-left' : ''} ${isLastLeft ? 'pinned-cell-left-last' : ''} ${isRight ? 'pinned-cell-right' : ''} ${isFirstRight ? 'pinned-cell-right-first' : ''}`.trim()
            : '';

          return (
            <th
              key={header.id}
              className={cn(
                'h-11 px-3 align-middle font-medium text-xs text-muted-foreground whitespace-nowrap select-none relative transition-colors',
                align,
                isSortEnabled ? 'cursor-pointer hover:text-foreground hover:bg-muted/30' : '',
                pinClass
              )}
              style={{
                ...style,
                backgroundColor: 'var(--table-pinned-header-bg)'
              }}
              onClick={() => {
                if (isSortEnabled && onSortChange) {
                  onSortChange(sortKey);
                }
              }}
            >
              <div
                className={cn(
                  'inline-flex items-center gap-1.5',
                  isRightAligned ? 'justify-end w-full' : isNameColumn ? 'justify-start' : 'justify-center'
                )}
              >
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                {isSortEnabled && (
                  <span className="inline-flex items-center text-muted-foreground ml-0.5">
                    {isSorted ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="size-3.5 text-primary" strokeWidth={2} />
                      ) : (
                        <ArrowDown className="size-3.5 text-primary" strokeWidth={2} />
                      )
                    ) : (
                      <ArrowUpDown
                        className="size-3 text-muted-foreground/40 hover:text-foreground transition-colors"
                        strokeWidth={1.8}
                      />
                    )}
                  </span>
                )}
              </div>
              {!forPortal && (
                <div
                  onMouseDown={header.column.getCanResize() ? header.getResizeHandler() : undefined}
                  onTouchStart={header.column.getCanResize() ? header.getResizeHandler() : undefined}
                  className={cn(
                    'resizer',
                    header.column.getIsResizing() ? 'isResizing' : '',
                    header.column.getCanResize() ? '' : 'disabled'
                  )}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </th>
          );
        })}
      </tr>
    );
  };

  return (
    <EditModeContext.Provider value={{ isEditMode, selectedCodes, toggleSelected }}>
      <>
        <div className="table-pc-wrap w-full flex flex-col gap-2" style={{ display: 'flex', flexDirection: 'column' }}>
          {/* shadcn UI Data-Table 现代化卡片容器 */}
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden flex flex-col">
            {showTopScrollbar && !showPortalHeader && (
              <div className="pc-fund-table-top-scrollbar border-b border-border/40" ref={topScrollbarRef}>
                <div className="pc-fund-table-top-scrollbar-inner" style={{ width: `${tableScrollWidth}px` }} />
              </div>
            )}
            <div className="table-scroll-area overflow-x-auto w-full">
              <div className="table-scroll-area-inner" ref={tableContainerRef} style={tableCssVariables}>
                <style>{`
                  /* 确保原生 table 单元格严格使用固定列宽 */
                  .pc-table-fixed {
                    table-layout: fixed !important;
                    border-collapse: separate !important;
                    border-spacing: 0 !important;
                  }

                  /* 表头整体背景：100% 实心背景色，彻底杜绝半透明透光 */
                  .pc-table-fixed thead tr {
                    background-color: var(--table-pinned-header-bg) !important;
                  }

                  .pc-table-fixed th {
                    background-color: var(--table-pinned-header-bg) !important;
                  }

                  /* 固定列表头：高优先级实心背景与层级 */
                  .pc-table-header-pinned {
                    position: sticky !important;
                    background-color: var(--table-pinned-header-bg) !important;
                    z-index: 30 !important;
                  }

                  /* 数据行基础背景（实心） */
                  .pc-table-row {
                    background-color: var(--card) !important;
                  }

                  .pc-table-cell-odd {
                    background-color: var(--card) !important;
                  }

                  .pc-table-cell-even {
                    background-color: var(--table-row-alt-bg) !important;
                  }

                  /* 固定数据单元格：必须具备独立 100% 实心背景，彻底杜绝横向滚动时底层内容透出 */
                  .pc-table-cell-pinned {
                    position: sticky !important;
                    z-index: 10 !important;
                  }

                  .pc-table-cell-pinned.pc-table-cell-odd {
                    background-color: var(--card) !important;
                  }

                  .pc-table-cell-pinned.pc-table-cell-even {
                    background-color: var(--table-row-alt-bg) !important;
                  }

                  /* 悬停状态：数据行与固定列同步平滑切换为 100% 实心高亮色 */
                  .pc-table-row:hover .pc-table-cell-odd,
                  .pc-table-row:hover .pc-table-cell-even,
                  .pc-table-row:hover .pc-table-cell-pinned,
                  .pc-table-row:hover td {
                    background-color: var(--table-row-hover-bg) !important;
                  }

                  /* 固定列边缘阴影与分界线：现代轻量卡片级投影 */
                  .pinned-cell-left-last {
                    border-right: 1px solid var(--border) !important;
                    box-shadow: 3px 0 6px -2px rgba(0, 0, 0, 0.08);
                  }

                  [data-theme='dark'] .pinned-cell-left-last {
                    box-shadow: 4px 0 10px -2px rgba(0, 0, 0, 0.5);
                  }

                  .pinned-cell-right-first {
                    border-left: 1px solid var(--border) !important;
                    box-shadow: -3px 0 6px -2px rgba(0, 0, 0, 0.08);
                  }

                  [data-theme='dark'] .pinned-cell-right-first {
                    box-shadow: -4px 0 10px -2px rgba(0, 0, 0, 0.5);
                  }

                  /* 列宽手柄：2px 隐蔽发丝线，悬停展开为高亮指示条 */
                  .resizer {
                    position: absolute;
                    right: 0;
                    top: 20%;
                    height: 60%;
                    width: 2px;
                    background: var(--border);
                    cursor: col-resize;
                    user-select: none;
                    touch-action: none;
                    transition: all 0.15s ease;
                    z-index: 35;
                    opacity: 0.5;
                  }

                  .resizer:hover,
                  .resizer.isResizing {
                    top: 0;
                    height: 100%;
                    background: var(--primary);
                    box-shadow: 0 0 0 1px var(--primary);
                    opacity: 1;
                  }

                  .resizer.disabled {
                    display: none;
                  }
                `}</style>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                  onDragCancel={handleDragCancel}
                  modifiers={[restrictToVerticalAxis]}
                  autoScroll={false}
                >
                  <SortableContext items={data.map((item: any) => item.code)} strategy={verticalListSortingStrategy}>
                    <table
                      className="w-full caption-bottom text-sm pc-table-fixed"
                      style={{ width: `${Math.max(totalHeaderWidth, 1)}px`, minWidth: '100%' }}
                    >
                      <thead>{renderTableHeader(false)}</thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {tableRows.map((row, index) => (
                          <MemoizedTableRow
                            key={row.original.code || row.id}
                            row={row}
                            index={index}
                            sortBy={sortBy}
                            getCommonPinningStyles={getCommonPinningStyles}
                            isFavorites={favorites?.has?.(row.original.code)}
                            isSelected={selectedCodes?.has?.(row.original.code)}
                            masked={masked}
                            periodReturns={periodReturnsByCode[row.original.code]}
                            relatedSector={relatedSectorByCode[row.original.code]}
                            sectorQuote={
                              relatedSectorByCode[row.original.code]
                                ? sectorQuoteByLabel[String(relatedSectorByCode[row.original.code]).trim()]
                                : null
                            }
                            fundExtraData={fundExtraDataByCode[row.original.code]}
                            columnOrder={columnOrder}
                            columnVisibility={columnVisibility}
                            columnSizing={columnSizing}
                          />
                        ))}
                      </tbody>
                    </table>
                  </SortableContext>
                </DndContext>

                {table.getRowModel().rows.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground w-full">
                    <p className="text-sm font-medium">暂无数据</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">当前分组下暂无匹配的基金数据</p>
                  </div>
                )}

                {resetConfirmOpen && (
                  <ConfirmModal
                    title="重置列宽"
                    message="是否重置表格列宽为默认值？"
                    icon={<RotateCcw className="size-5 shrink-0 text-primary" />}
                    confirmVariant="primary"
                    onConfirm={handleResetSizing}
                    onCancel={() => setResetConfirmOpen(false)}
                    confirmText="重置"
                  />
                )}

                {showPortalHeader &&
                  ReactDOM.createPortal(
                    <div
                      style={{
                        position: 'fixed',
                        top: effectiveStickyTop,
                        left: portalHorizontal.left,
                        right: portalHorizontal.right,
                        zIndex: 25,
                        backgroundColor: 'var(--table-pinned-header-bg)'
                      }}
                      className="shadow-md border-b border-border overflow-hidden flex flex-col"
                    >
                      {showTopScrollbar && (
                        <div
                          className="pc-fund-table-top-scrollbar"
                          ref={portalTopScrollbarRef}
                          style={{ backgroundColor: 'var(--table-pinned-header-bg)' }}
                        >
                          <div
                            className="pc-fund-table-top-scrollbar-inner"
                            style={{ width: `${tableScrollWidth}px` }}
                          />
                        </div>
                      )}
                      <div
                        ref={portalHeaderRef}
                        style={{
                          ...tableCssVariables,
                          overflowX: 'auto',
                          scrollbarWidth: 'none',
                          backgroundColor: 'var(--table-pinned-header-bg)'
                        }}
                      >
                        <table
                          className="w-full caption-bottom text-sm pc-table-fixed"
                          style={{
                            width: `${Math.max(totalHeaderWidth, 1)}px`,
                            minWidth: '100%',
                            backgroundColor: 'var(--table-pinned-header-bg)'
                          }}
                        >
                          <thead>{renderTableHeader(true)}</thead>
                        </table>
                      </div>
                    </div>,
                    document.body
                  )}
              </div>
            </div>

            {/* 分页栏 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-border bg-card text-xs text-muted-foreground">
              <div className="flex items-center gap-2 flex-shrink-0">
                <span>
                  共 <strong className="font-semibold text-foreground">{data.length}</strong> 支基金
                </span>
                <span className="text-border">|</span>
                <div className="flex items-center gap-1.5">
                  <span>每页</span>
                  <Input
                    key={table.getState().pagination.pageSize}
                    defaultValue={table.getState().pagination.pageSize}
                    type="number"
                    min={1}
                    className="w-14 h-7 text-[16PX] text-center px-1 font-mono text-xs rounded-md border-border/80"
                    onBlur={(e) => {
                      let val = parseInt(e.target.value, 10);
                      if (isNaN(val) || val < 1) val = 20;
                      e.target.value = String(val);
                      if (val !== table.getState().pagination.pageSize) {
                        table.setPageSize(val);
                        if (typeof window !== 'undefined') {
                          storageStore.setItem('fundTablePageSize', val);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                  />
                  <span>条</span>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (table.getCanPreviousPage()) {
                            table.previousPage();
                            if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className={!table.getCanPreviousPage() ? 'opacity-50 pointer-events-none' : ''}
                      />
                    </PaginationItem>
                    {Array.from({ length: table.getPageCount() }, (_, i) => {
                      const pageIndex = table.getState().pagination.pageIndex;
                      if (i === 0 || i === table.getPageCount() - 1 || (i >= pageIndex - 1 && i <= pageIndex + 1)) {
                        return (
                          <PaginationItem key={i}>
                            <PaginationLink
                              href="#"
                              isActive={pageIndex === i}
                              onClick={(e) => {
                                e.preventDefault();
                                table.setPageIndex(i);
                                if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      if (i === pageIndex - 2 || i === pageIndex + 2) {
                        return (
                          <PaginationItem key={i}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (table.getCanNextPage()) {
                            table.nextPage();
                            if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className={!table.getCanNextPage() ? 'opacity-50 pointer-events-none' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          </div>
        </div>

        {/* 详情卡片弹框 */}
        {!!(cardDialogRow && getFundCardProps) && (
          <FundDetailDialog
            cardDialogRow={cardDialogRow}
            setCardDialogRow={setCardDialogRow}
            getFundCardProps={getFundCardPropsWithRelatedSector}
            blockDialogClose={blockDialogClose}
          />
        )}

        {/* 表格设置弹框 */}
        {settingModalOpen && (
          <PcTableSettingModal
            open={settingModalOpen}
            onClose={() => setSettingModalOpen(false)}
            columns={columnOrder.map((id) => ({ id, header: COLUMN_HEADERS[id] ?? id }))}
            columnVisibility={columnVisibility}
            pinnedColumns={currentGroupPc?.pcTableColumnPinned || []}
            onColumnReorder={(newOrder) => setColumnOrder(newOrder)}
            onToggleColumnVisibility={handleToggleColumnVisibility}
            onTogglePinColumn={handleTogglePinColumn}
            onResetColumnOrder={handleResetColumnOrder}
            onResetColumnVisibility={handleResetColumnVisibility}
            onResetSizing={() => setResetConfirmOpen(true)}
            showFullFundName={showFullFundName}
            onToggleShowFullFundName={handleToggleShowFullFundName}
            syncOptions={settingSyncOptions}
            currentGroupName={currentGroupName}
            onSyncSettings={handleSyncPcSettings}
          />
        )}

        {/* 移动分组弹框 */}
        {moveGroupOpen && (
          <MoveGroupModal
            open={moveGroupOpen}
            onClose={() => setMoveGroupOpen(false)}
            fromTab={currentTab}
            groups={groups}
            selectedCodes={Array.from(selectedCodes)}
            onMoveFunds={async (params) => {
              if (onMoveFunds) {
                const res = await onMoveFunds(params);
                setSelectedCodes(new Set());
                setIsEditMode(false);
                return res;
              }
            }}
          />
        )}
      </>
    </EditModeContext.Provider>
  );
});

export default PcFundTable;
