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
        className="pc-table-setting-item glass flex items-center gap-2 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)]"
        layout
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
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
          type: 'spring',
          stiffness: 500,
          damping: 35,
          mass: 1,
          layout: { duration: 0.2 }
        }}
      >
        <div className="drag-handle flex items-center px-2 cursor-grab text-[var(--muted)] hover:text-foreground touch-none select-none">
          <GripVertical className="w-4 h-4" />
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
              'w-7 h-7 p-0 shrink-0 transition-colors',
              isPinned ? 'text-primary hover:text-primary/80' : 'text-[var(--muted)] hover:text-foreground'
            )}
          >
            <Pin className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => handleMoveToTop(item.id)}
          title="置顶"
          className="w-7 h-7 p-0 text-[var(--muted)] hover:text-foreground shrink-0"
        >
          <ArrowUpToLine className="w-3.5 h-3.5" />
        </Button>
        <div className="flex-1 flex flex-col gap-0.5 text-sm select-none">
          <span className="font-medium text-foreground">{item.header}</span>
          {item.id === 'totalChangePercent' && (
            <span className="text-xs text-[var(--muted)]">估值涨幅与持有收益的汇总</span>
          )}
          {item.id === 'todayProfit' && <span className="text-xs text-[var(--muted)]">下方百分比数字为收益率</span>}
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
          className="pc-table-setting-overlay fixed inset-0 bg-black/50 backdrop-blur-xs flex justify-end z-[10001]"
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
            className="pc-table-setting-drawer glass w-[380px] max-w-[90vw] h-full flex flex-col bg-[var(--background)]/95 border-l border-[var(--border)] shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pc-table-setting-header flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5 min-w-0">
                <Settings2 className="w-5 h-5 text-primary" />
                <span className="font-semibold text-base text-foreground">个性化设置</span>
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
              <Button
                variant="ghost"
                size="icon"
                title="关闭"
                onClick={onClose}
                className="w-8 h-8 rounded-full text-[var(--muted)] hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="pc-table-setting-body flex-1 overflow-y-auto p-4 scrollbar-y-styled" ref={scrollRef}>
              {onToggleShowFullFundName && (
                <div className="flex items-center justify-between py-3 border-b border-[var(--border)] mb-4">
                  <span className="text-sm font-medium text-foreground">展示完整基金名称</span>
                  <Switch
                    checked={Boolean(showFullFundName)}
                    onCheckedChange={(checked) => {
                      onToggleShowFullFundName(Boolean(checked));
                    }}
                    title={showFullFundName ? '关闭' : '开启'}
                  />
                </div>
              )}
              <h3 className="text-sm font-semibold text-foreground mb-2">表头设置</h3>
              <div className="flex items-center justify-between mb-3 gap-2">
                <p className="text-xs text-[var(--muted)] m-0">拖拽调整列顺序</p>
                {onResetColumnOrder && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 p-0 text-[var(--muted)] hover:text-foreground"
                    title="重置列顺序"
                    onClick={() => setResetOrderConfirmOpen(true)}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              {localColumns.length === 0 ? (
                <div className="text-[var(--muted)] text-center py-6 text-sm">暂无可配置列</div>
              ) : (
                <>
                  {pinnedItems.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs text-[var(--muted)] mb-2 pl-2 font-medium">固定在左侧</div>
                      <Reorder.Group
                        axis="y"
                        values={pinnedItems}
                        onReorder={handlePinnedReorder}
                        className="pc-table-setting-list flex flex-col gap-2"
                      >
                        <AnimatePresence mode="popLayout">{pinnedItems.map(renderItem)}</AnimatePresence>
                      </Reorder.Group>
                    </div>
                  )}
                  {unpinnedItems.length > 0 && (
                    <div>
                      <div className="text-xs text-[var(--muted)] mb-2 pl-2 font-medium">随表格滚动</div>
                      <Reorder.Group
                        axis="y"
                        values={unpinnedItems}
                        onReorder={handleUnpinnedReorder}
                        className="pc-table-setting-list flex flex-col gap-2"
                      >
                        <AnimatePresence mode="popLayout">{unpinnedItems.map(renderItem)}</AnimatePresence>
                      </Reorder.Group>
                    </div>
                  )}
                </>
              )}
              {onResetSizing && (
                <Button
                  variant="outline"
                  className="w-full mt-5 h-9 text-xs gap-1.5"
                  onClick={() => {
                    onResetSizing();
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
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
