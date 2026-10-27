'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent
} from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Settings2, X, RotateCcw, Minus } from 'lucide-react';
import { useIsMobile } from '@/app/hooks/useIsMobile';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import ConfirmModal from './ConfirmModal';
import { cn } from '@/lib/utils';

export interface MarketIndexItem {
  code: string;
  name: string;
  price?: number;
  change?: number;
  changePercent?: number;
}

interface SortableIndexItemProps {
  item: MarketIndexItem;
  canRemove: boolean;
  onRemove: (code: string) => void;
}

function SortableIndexItem({ item, canRemove, onRemove }: SortableIndexItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.code });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isDragging ? 'grabbing' : 'grab',
    width: '100%',
    touchAction: 'none',
    ...(isDragging && {
      position: 'relative',
      zIndex: 10,
      opacity: 0.9,
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
    })
  };

  const isUp = (item.change ?? 0) >= 0;
  const colorClass = isUp ? 'text-[var(--danger)]' : 'text-[var(--success)]';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative flex flex-col gap-1 rounded-xl border border-border/70 bg-card/60 hover:bg-card/90 p-2.5 transition-all select-none shadow-xs backdrop-blur-sm'
      )}
      {...attributes}
      {...listeners}
    >
      {canRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.code);
          }}
          className="absolute top-1.5 right-1.5 size-5 rounded-full bg-destructive/15 text-destructive hover:bg-destructive/25 flex items-center justify-center transition-colors cursor-pointer"
          aria-label={`移除 ${item.name}`}
        >
          <Minus className="size-3" />
        </button>
      )}
      <div className="text-xs font-semibold tracking-tight pr-4 truncate text-foreground">{item.name}</div>
      <div className={cn('text-base font-bold tabular-nums font-mono', colorClass)}>
        {typeof item.price === 'number' ? item.price.toFixed(2) : String(item.price ?? '-')}
      </div>
      <div className={cn('text-xs font-medium tabular-nums font-mono flex items-center gap-1', colorClass)}>
        <span>{((item.change ?? 0) >= 0 ? '+' : '') + (item.change ?? 0).toFixed(2)}</span>
        <span>{((item.changePercent ?? 0) >= 0 ? '+' : '') + (item.changePercent ?? 0).toFixed(2)}%</span>
      </div>
    </div>
  );
}

export interface MarketSettingModalProps {
  open: boolean;
  onClose?: () => void;
  indices?: MarketIndexItem[];
  selectedCodes?: string[];
  onChangeSelected?: (codes: string[]) => void;
  onResetDefault?: () => void;
}

export default function MarketSettingModal({
  open,
  onClose,
  indices = [],
  selectedCodes = [],
  onChangeSelected,
  onResetDefault
}: MarketSettingModalProps) {
  const isMobile = useIsMobile();
  const selectedList = useMemo(() => {
    if (!indices?.length || !selectedCodes?.length) return [];
    const map = new Map(indices.map((it) => [it.code, it]));
    return selectedCodes.map((code) => map.get(code)).filter(Boolean) as MarketIndexItem[];
  }, [indices, selectedCodes]);

  const allIndices = indices || [];
  const selectedSet = useMemo(() => new Set(selectedCodes || []), [selectedCodes]);

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) setResetConfirmOpen(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleToggleCode = (code: string) => {
    if (!code) return;
    if (selectedSet.has(code)) {
      if (selectedCodes.length <= 1) return;
      const next = selectedCodes.filter((c) => c !== code);
      onChangeSelected?.(next);
    } else {
      const next = [...selectedCodes, code];
      onChangeSelected?.(next);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = selectedCodes.indexOf(String(active.id));
    const newIndex = selectedCodes.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(selectedCodes, oldIndex, newIndex);
    onChangeSelected?.(next);
  };

  const body = (
    <div className="flex flex-col gap-5 px-4 pb-4 pt-2 text-foreground">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex flex-col gap-0.5">
            <div className="text-sm font-semibold text-foreground">已添加指数</div>
            <div className="text-xs text-[var(--muted)]">拖动下方指数卡片即可调整排序</div>
          </div>
        </div>

        {selectedList.length === 0 ? (
          <div className="text-xs text-[var(--muted)] py-3">暂未添加指数，请在下方选择想要关注的指数。</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToParentElement]}
          >
            <SortableContext items={selectedCodes} strategy={rectSortingStrategy}>
              <div
                className="grid gap-2.5"
                style={{
                  gridTemplateColumns: isMobile ? 'repeat(3, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))'
                }}
              >
                {selectedList.map((item) => (
                  <SortableIndexItem
                    key={item.code}
                    item={item}
                    canRemove={selectedCodes.length > 1}
                    onRemove={handleToggleCode}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="text-xs text-[var(--muted)] font-medium">点击标签可添加或移除指数</div>
          {onResetDefault && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setResetConfirmOpen(true)}
              className="w-7 h-7 p-0 text-[var(--muted)] hover:text-foreground"
              aria-label="恢复默认指数"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {allIndices.map((item) => {
            const active = selectedSet.has(item.code);
            return (
              <Button
                key={item.code || item.name}
                type="button"
                variant={active ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleToggleCode(item.code)}
                className="h-7 px-3 text-xs rounded-full"
              >
                {item.name}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (!open) return null;

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={(v) => {
          if (!v) onClose?.();
        }}
        direction="bottom"
      >
        <DrawerContent className="glass" defaultHeight="77vh" minHeight="40vh" maxHeight="90vh">
          <DrawerHeader className="flex flex-row items-center justify-between gap-2 py-3.5 px-4 border-b border-border/60 bg-muted/10 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-xs">
                <Settings2 className="size-4" />
              </div>
              <DrawerTitle className="text-left font-semibold text-base tracking-tight text-foreground truncate">
                指数个性化设置
              </DrawerTitle>
            </div>
            <DrawerClose className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <X className="size-4" />
            </DrawerClose>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto scrollbar-y-styled pt-2">{body}</div>
        </DrawerContent>
        <AnimatePresence>
          {resetConfirmOpen && (
            <ConfirmModal
              key="mobile-index-reset-confirm"
              title="恢复默认指数"
              message="是否恢复已添加指数为默认配置？"
              icon={<RotateCcw className="size-4 text-primary" />}
              confirmVariant="primary"
              confirmText="恢复默认"
              onConfirm={() => {
                onResetDefault?.();
                setResetConfirmOpen(false);
              }}
              onCancel={() => setResetConfirmOpen(false)}
            />
          )}
        </AnimatePresence>
      </Drawer>
    );
  }

  const pcContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="market-index-setting-overlay"
          className="pc-table-setting-overlay fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-end z-[10001]"
          role="dialog"
          aria-modal="true"
          aria-label="指数个性化设置"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.aside
            className="w-[840px] max-w-[90vw] h-full flex flex-col bg-card/95 backdrop-blur-2xl border-l border-border/80 shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border/60 bg-muted/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-xs">
                  <Settings2 className="size-4" />
                </div>
                <span className="font-semibold text-base tracking-tight text-foreground">指数个性化设置</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 scrollbar-y-styled">{body}</div>
          </motion.aside>
        </motion.div>
      )}
      {resetConfirmOpen && (
        <ConfirmModal
          key="pc-index-reset-confirm"
          title="恢复默认指数"
          message="是否恢复已添加指数为默认配置？"
          icon={<RotateCcw className="size-4 text-primary" />}
          confirmVariant="primary"
          confirmText="恢复默认"
          onConfirm={() => {
            onResetDefault?.();
            setResetConfirmOpen(false);
          }}
          onCancel={() => setResetConfirmOpen(false)}
        />
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(pcContent, document.body);
}
