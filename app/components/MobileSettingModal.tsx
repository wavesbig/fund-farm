'use client';

import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { Settings2, RefreshCw, X, RotateCcw, GripVertical, ArrowUpToLine } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import ConfirmModal from './ConfirmModal';
import SuccessModal from './SuccessModal';
import SyncPersonalSettingsModal from './SyncPersonalSettingsModal';
import { cn } from '@/lib/utils';

export interface TableColumnOption {
  id: string;
  header: string;
}

interface MobileSettingReorderItemProps {
  item: TableColumnOption;
  index: number;
  columnVisibility?: Record<string, boolean>;
  onToggleColumnVisibility?: (id: string, visible: boolean) => void;
  setIsReordering: (val: boolean) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onMoveToTop?: (id: string) => void;
}

function MobileSettingReorderItem({
  item,
  index,
  columnVisibility,
  onToggleColumnVisibility,
  setIsReordering,
  onDragStart,
  onDragEnd,
  onMoveToTop
}: MobileSettingReorderItemProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      key={item.id || `col-${index}`}
      value={item}
      className="mobile-setting-item glass flex items-center gap-2 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)]"
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      onDragStart={() => {
        setIsReordering(true);
        onDragStart?.();
      }}
      onDragEnd={() => {
        setIsReordering(false);
        onDragEnd?.();
      }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 35,
        mass: 1,
        layout: { duration: 0.2 }
      }}
      style={{ touchAction: 'pan-y' }}
      dragListener={false}
      dragControls={dragControls}
    >
      <div
        className="drag-handle flex items-center px-2 cursor-grab text-[var(--muted)] hover:text-foreground touch-none select-none"
        onPointerDown={(e) => {
          dragControls.start(e);
        }}
        role="button"
        tabIndex={0}
        aria-label="拖拽排序"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      {onMoveToTop && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onMoveToTop(item.id)}
          title="置顶"
          className="w-7 h-7 p-0 text-[var(--muted)] hover:text-foreground shrink-0"
        >
          <ArrowUpToLine className="w-3.5 h-3.5" />
        </Button>
      )}
      <div className="flex-1 flex flex-col gap-0.5 text-sm select-none">
        <span className="font-medium text-foreground">{item.header}</span>
        {item.id === 'totalChangePercent' && (
          <span className="text-xs text-[var(--muted)]">估值涨幅与持有收益的汇总</span>
        )}
        {item.id === 'todayProfit' && <span className="text-xs text-[var(--muted)]">下方百分比数字为收益率</span>}
      </div>
      {onToggleColumnVisibility && (
        <Switch
          checked={columnVisibility?.[item.id] !== false}
          onCheckedChange={(checked) => {
            onToggleColumnVisibility(item.id, Boolean(checked));
          }}
          title={columnVisibility?.[item.id] === false ? '显示' : '隐藏'}
        />
      )}
    </Reorder.Item>
  );
}

export interface MobileSettingModalProps {
  open: boolean;
  onClose: () => void;
  columns?: TableColumnOption[];
  columnVisibility?: Record<string, boolean>;
  onColumnReorder?: (newOrder: string[]) => void;
  onToggleColumnVisibility?: (id: string, visible: boolean) => void;
  onResetColumnOrder?: () => void;
  onResetColumnVisibility?: () => void;
  showFullFundName?: boolean;
  onToggleShowFullFundName?: (show: boolean) => void;
  syncOptions?: Array<{ id: string; name: string; description?: string }>;
  currentGroupName?: string;
  onSyncSettings?: (targetIds: string[]) => boolean | void;
  onSyncSuccess?: () => void;
}

export default function MobileSettingModal({
  open,
  onClose,
  columns = [],
  columnVisibility,
  onColumnReorder,
  onToggleColumnVisibility,
  onResetColumnOrder,
  onResetColumnVisibility,
  showFullFundName,
  onToggleShowFullFundName,
  syncOptions = [],
  currentGroupName = '当前',
  onSyncSettings,
  onSyncSuccess
}: MobileSettingModalProps) {
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncSuccessOpen, setSyncSuccessOpen] = useState(false);

  const [localColumns, setLocalColumns] = useState<TableColumnOption[]>(columns);
  const isDraggingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const localColumnsRef = useRef(localColumns);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localColumnsRef.current = localColumns;
  }, [localColumns]);

  useEffect(() => {
    if (open && !isDraggingRef.current && !timerRef.current) {
      setLocalColumns(columns);
    }
  }, [open, columns]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      const newOrder = localColumnsRef.current.map((item) => item.id);
      onColumnReorder?.(newOrder);
    }
  }, [open, onColumnReorder]);

  useEffect(() => {
    if (!open) {
      setResetConfirmOpen(false);
      setSyncModalOpen(false);
      setSyncSuccessOpen(false);
    }
  }, [open]);

  const handleReorder = (newItems: TableColumnOption[]) => {
    setLocalColumns(newItems);
  };

  const handleMoveToTop = (itemId: string) => {
    const itemToMove = localColumns.find((item) => item.id === itemId);
    if (!itemToMove) return;
    const remainingItems = localColumns.filter((item) => item.id !== itemId);
    const newItems = [itemToMove, ...remainingItems];
    setLocalColumns(newItems);

    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      const newOrder = localColumnsRef.current.map((item) => item.id);
      onColumnReorder?.(newOrder);
      timerRef.current = null;
    }, 1000);
  };

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={(v) => {
          if (!v) onClose();
        }}
        direction="bottom"
        handleOnly={isReordering}
      >
        <DrawerContent className="glass" defaultHeight="77vh" minHeight="40vh" maxHeight="90vh">
          <DrawerHeader className="mobile-setting-header flex-row items-center justify-between gap-2 py-4 px-4 text-base font-semibold border-b border-[var(--border)]">
            <div className="flex min-w-0 items-center gap-2.5">
              <DrawerTitle className="flex items-center gap-2 text-left font-semibold text-base text-foreground">
                <Settings2 className="w-5 h-5 text-primary" />
                <span>个性化设置</span>
              </DrawerTitle>
              {onSyncSettings && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSyncModalOpen(true)}
                  className="h-7 px-2.5 rounded-full text-xs gap-1 text-primary bg-white/5 border-primary/30 shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>同步</span>
                </Button>
              )}
            </div>
            <DrawerClose
              className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-foreground transition-colors"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </DrawerClose>
          </DrawerHeader>

          <div
            className="mobile-setting-body flex flex-1 flex-col overflow-y-auto p-4 scrollbar-y-styled"
            ref={scrollRef}
          >
            {onToggleShowFullFundName && (
              <div className="flex items-center justify-between py-3 border-b border-[var(--border)] mb-4">
                <span className="text-sm font-medium text-foreground">展示完整基金名称</span>
                <Switch
                  checked={Boolean(showFullFundName)}
                  onCheckedChange={(checked) => {
                    onToggleShowFullFundName?.(Boolean(checked));
                  }}
                  title={showFullFundName ? '关闭' : '开启'}
                />
              </div>
            )}
            <h3 className="text-sm font-semibold text-foreground mb-2">表头设置</h3>
            <div className="flex items-center justify-between mb-3 gap-2">
              <p className="text-xs text-[var(--muted)] m-0">拖拽调整列顺序</p>
              {(onResetColumnOrder || onResetColumnVisibility) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 p-0 text-[var(--muted)] hover:text-foreground"
                  onClick={() => setResetConfirmOpen(true)}
                  title="重置表头设置"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
            {localColumns.length === 0 ? (
              <div className="text-[var(--muted)] text-center py-6 text-sm">暂无可配置列</div>
            ) : (
              <Reorder.Group
                axis="y"
                values={localColumns}
                onReorder={handleReorder}
                className="mobile-setting-list flex flex-col gap-2"
                layoutScroll
                style={{ touchAction: 'pan-y' }}
              >
                <AnimatePresence mode="popLayout">
                  {localColumns.map((item, index) => (
                    <MobileSettingReorderItem
                      key={item.id || `col-${index}`}
                      item={item}
                      index={index}
                      columnVisibility={columnVisibility}
                      onToggleColumnVisibility={onToggleColumnVisibility}
                      setIsReordering={setIsReordering}
                      onDragStart={() => {
                        isDraggingRef.current = true;
                        if (timerRef.current) {
                          clearTimeout(timerRef.current);
                          timerRef.current = null;
                        }
                      }}
                      onDragEnd={() => {
                        isDraggingRef.current = false;
                        if (timerRef.current) {
                          clearTimeout(timerRef.current);
                        }
                        timerRef.current = setTimeout(() => {
                          const newOrder = localColumnsRef.current.map((it) => it.id);
                          onColumnReorder?.(newOrder);
                          timerRef.current = null;
                        }, 1000);
                      }}
                      onMoveToTop={handleMoveToTop}
                    />
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <AnimatePresence>
        {resetConfirmOpen && (
          <ConfirmModal
            key="mobile-reset-confirm"
            title="重置表头设置"
            message="是否重置表头顺序和显示/隐藏为默认值？"
            icon={<RotateCcw className="w-5 h-5 shrink-0 text-primary" />}
            confirmVariant="primary"
            onConfirm={() => {
              if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
              }
              onResetColumnOrder?.();
              onResetColumnVisibility?.();
              setResetConfirmOpen(false);
            }}
            onCancel={() => setResetConfirmOpen(false)}
            confirmText="重置"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {syncModalOpen && (
          <SyncPersonalSettingsModal
            open={syncModalOpen}
            onClose={() => setSyncModalOpen(false)}
            options={syncOptions}
            sourceName={currentGroupName}
            onConfirm={(targetIds) => {
              const result = onSyncSettings?.(targetIds);
              if (result !== false) {
                setSyncModalOpen(false);
                if (onSyncSuccess) onSyncSuccess();
                else setSyncSuccessOpen(true);
              }
              return result;
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {syncSuccessOpen &&
          typeof document !== 'undefined' &&
          createPortal(
            <SuccessModal
              message="同步成功"
              onClose={() => setSyncSuccessOpen(false)}
              overlayStyle={{ zIndex: 10004 }}
              cardStyle={{ maxWidth: '420px', width: '90vw', zIndex: 10005 }}
            />,
            document.body
          )}
      </AnimatePresence>
    </>
  );
}
