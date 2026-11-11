'use client';

import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion, Reorder } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Settings2, RefreshCw, X, RotateCcw, Pin, GripVertical, ArrowUpToLine } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import ConfirmModal from './ConfirmModal';
import SuccessModal from './SuccessModal';
import SyncPersonalSettingsModal from './SyncPersonalSettingsModal';
import { cn } from '@/lib/utils';
import type { TableColumnOption } from './MobileSettingModal';

export interface PcTableSettingModalProps {
  open: boolean;
  onClose: () => void;
  columns?: TableColumnOption[];
  columnVisibility?: Record<string, boolean>;
  pinnedColumns?: string[];
  onColumnReorder?: (newOrder: string[]) => void;
  onToggleColumnVisibility?: (id: string, visible: boolean) => void;
  onTogglePinColumn?: (id: string) => void;
  onResetColumnOrder?: () => void;
  onResetColumnVisibility?: () => void;
  onResetSizing?: () => void;
  showFullFundName?: boolean;
  onToggleShowFullFundName?: (show: boolean) => void;
  syncOptions?: Array<{ id: string; name: string; description?: string }>;
  currentGroupName?: string;
  onSyncSettings?: (targetIds: string[]) => boolean | number | void;
}

export default function PcTableSettingModal({
  open,
  onClose,
  columns = [],
  columnVisibility,
  pinnedColumns = [],
  onColumnReorder,
  onToggleColumnVisibility,
  onTogglePinColumn,
  onResetColumnOrder,
  onResetColumnVisibility,
  onResetSizing,
  showFullFundName,
  onToggleShowFullFundName,
  syncOptions = [],
  currentGroupName = '当前',
  onSyncSettings
}: PcTableSettingModalProps) {
  const [resetOrderConfirmOpen, setResetOrderConfirmOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncSuccessOpen, setSyncSuccessOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [localColumns, setLocalColumns] = useState<TableColumnOption[]>(columns);
  const isDraggingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const localColumnsRef = useRef(localColumns);

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
      setResetOrderConfirmOpen(false);
      setSyncModalOpen(false);
      setSyncSuccessOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const pinnedItems = localColumns.filter((c) => pinnedColumns.includes(c.id));
  const unpinnedItems = localColumns.filter((c) => !pinnedColumns.includes(c.id));

  const handlePinnedReorder = (newPinnedItems: TableColumnOption[]) => {
    const newOrder = [...newPinnedItems, ...unpinnedItems];
    setLocalColumns(newOrder);
  };

  const handleUnpinnedReorder = (newUnpinnedItems: TableColumnOption[]) => {
    const newOrder = [...pinnedItems, ...newUnpinnedItems];
    setLocalColumns(newOrder);
  };

  const handleMoveToTop = (itemId: string) => {
    const isPinned = pinnedColumns.includes(itemId);
    if (isPinned) {
      const localPinned = localColumns.filter((c) => pinnedColumns.includes(c.id));
      const localUnpinned = localColumns.filter((c) => !pinnedColumns.includes(c.id));
      const itemToMove = localPinned.find((c) => c.id === itemId);
      if (!itemToMove) return;
      const remainingPinned = localPinned.filter((c) => c.id !== itemId);
      const newOrder = [itemToMove, ...remainingPinned, ...localUnpinned];
      setLocalColumns(newOrder);
    } else {
      const localPinned = localColumns.filter((c) => pinnedColumns.includes(c.id));
      const localUnpinned = localColumns.filter((c) => !pinnedColumns.includes(c.id));
      const itemToMove = localUnpinned.find((c) => c.id === itemId);
      if (!itemToMove) return;
      const remainingUnpinned = localUnpinned.filter((c) => c.id !== itemId);
      const newOrder = [...localPinned, itemToMove, ...remainingUnpinned];
      setLocalColumns(newOrder);
    }

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

  const renderItem = (item: TableColumnOption) => {
    const isPinned = pinnedColumns.includes(item.id);
    const isVisible = columnVisibility?.[item.id] !== false;

    return (
      <Reorder.Item
        key={item.id}
        value={item}
        className="flex items-center gap-2 p-2.5 rounded-xl border border-border/70 bg-card/60 hover:bg-card/90 transition-[background-color,border-color,box-shadow] duration-150 ease-out shadow-xs backdrop-blur-sm"
        layout
        initial={{ opacity: 0, scale: 0.98, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.14, ease: 'easeOut' } }}
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
        transition={{
          duration: 0.2,
          ease: 'easeOut'
        }}
      >
        <div className="flex items-center px-1.5 cursor-grab text-muted-foreground/60 hover:text-foreground touch-none select-none">
          <GripVertical className="size-4" />
        </div>
        {onTogglePinColumn && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title={isPinned ? '取消固定' : '固定在左侧'}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePinColumn(item.id);
              if (!isPinned && scrollRef.current) {
                scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className={cn(
              'size-7 p-0 rounded-lg shrink-0 transition-colors',
              isPinned
                ? 'text-primary bg-primary/10 hover:bg-primary/20'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Pin className="size-3.5" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => handleMoveToTop(item.id)}
          title="置顶"
          className="size-7 p-0 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
        >
          <ArrowUpToLine className="size-3.5" />
        </Button>
        <div className="flex-1 flex flex-col gap-0.5 text-xs select-none min-w-0 pr-1">
          <span className="font-semibold tracking-tight text-foreground truncate">{item.header}</span>
          {item.id === 'totalChangePercent' && (
            <span className="text-[11px] text-muted-foreground">估值涨幅与持有收益的汇总</span>
          )}
          {item.id === 'todayProfit' && (
            <span className="text-[11px] text-muted-foreground">下方百分比数字为收益率</span>
          )}
        </div>
        {onToggleColumnVisibility && (
          <Switch
            checked={isVisible}
            onCheckedChange={(checked) => {
              onToggleColumnVisibility(item.id, Boolean(checked));
            }}
            title={isVisible ? '隐藏' : '显示'}
          />
        )}
      </Reorder.Item>
    );
  };

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="drawer"
          className="pc-table-setting-overlay fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-end z-[10001]"
          role="dialog"
          aria-modal="true"
          aria-label="个性化设置"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.aside
            className="w-[380px] max-w-[90vw] h-full flex flex-col bg-card border-l border-border shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border bg-card shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-xs">
                  <Settings2 className="size-4" />
                </div>
                <span className="font-semibold text-base tracking-tight text-foreground">个性化设置</span>
                {onSyncSettings && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSyncModalOpen(true)}
                    className="h-6.5 px-2.5 rounded-full text-[11px] gap-1 text-primary bg-primary/10 hover:bg-primary/20 border-primary/25 shrink-0 font-medium"
                  >
                    <RefreshCw className="size-3" />
                    <span>同步</span>
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                title="关闭"
                onClick={onClose}
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scrollbar-y-styled" ref={scrollRef}>
              {onToggleShowFullFundName && (
                <div className="flex items-center justify-between py-3 border-b border-border/60 mb-4">
                  <span className="text-xs font-semibold tracking-tight text-foreground">展示完整基金名称</span>
                  <Switch
                    checked={Boolean(showFullFundName)}
                    onCheckedChange={(checked) => {
                      onToggleShowFullFundName(Boolean(checked));
                    }}
                    title={showFullFundName ? '关闭' : '开启'}
                  />
                </div>
              )}
              <h3 className="text-xs font-semibold tracking-tight text-foreground mb-2">表头设置</h3>
              <div className="flex items-center justify-between mb-3 gap-2">
                <p className="text-xs text-muted-foreground m-0">拖拽调整列顺序</p>
                {onResetColumnOrder && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                    title="重置列顺序"
                    onClick={() => setResetOrderConfirmOpen(true)}
                  >
                    <RotateCcw className="size-3.5" />
                  </Button>
                )}
              </div>
              {localColumns.length === 0 ? (
                <div className="text-muted-foreground text-center py-6 text-xs">暂无可配置列</div>
              ) : (
                <>
                  {pinnedItems.length > 0 && (
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold text-muted-foreground/70 mb-2 pl-1 uppercase tracking-wider">
                        固定在左侧
                      </div>
                      <Reorder.Group
                        axis="y"
                        values={pinnedItems}
                        onReorder={handlePinnedReorder}
                        className="flex flex-col gap-2"
                      >
                        <AnimatePresence initial={false}>{pinnedItems.map(renderItem)}</AnimatePresence>
                      </Reorder.Group>
                    </div>
                  )}
                  {unpinnedItems.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold text-muted-foreground/70 mb-2 pl-1 uppercase tracking-wider">
                        随表格滚动
                      </div>
                      <Reorder.Group
                        axis="y"
                        values={unpinnedItems}
                        onReorder={handleUnpinnedReorder}
                        className="flex flex-col gap-2"
                      >
                        <AnimatePresence initial={false}>{unpinnedItems.map(renderItem)}</AnimatePresence>
                      </Reorder.Group>
                    </div>
                  )}
                </>
              )}
              {onResetSizing && (
                <Button
                  variant="outline"
                  className="w-full mt-5 h-8.5 text-xs font-medium rounded-lg gap-1.5 border-border/70 hover:border-primary/40 transition-colors"
                  onClick={() => {
                    onResetSizing();
                  }}
                >
                  <RotateCcw className="size-3.5" />
                  <span>重置列宽</span>
                </Button>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
      {resetOrderConfirmOpen && (
        <ConfirmModal
          key="reset-order-confirm"
          title="重置列设置"
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
            setResetOrderConfirmOpen(false);
          }}
          onCancel={() => setResetOrderConfirmOpen(false)}
          confirmText="重置"
        />
      )}
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
              setSyncSuccessOpen(true);
            }
            return result;
          }}
        />
      )}
      {syncSuccessOpen && (
        <SuccessModal
          message="同步成功"
          onClose={() => setSyncSuccessOpen(false)}
          overlayStyle={{ zIndex: 10004 }}
          cardStyle={{ maxWidth: '420px', width: '90vw', zIndex: 10005 }}
        />
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}
