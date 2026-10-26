'use client';

import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useShallow } from 'zustand/react/shallow';
import { Settings2, RotateCcw, X, GripVertical, ArrowUpToLine } from 'lucide-react';
import { useStorageStore, DEFAULT_SORT_RULES } from '@/app/stores';
import { useIsMobile } from '@/app/hooks/useIsMobile';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ConfirmModal from './ConfirmModal';
import { cn } from '@/lib/utils';

export interface SortRule {
  id: string;
  label: string;
  alias?: string;
  enabled?: boolean;
  order?: 'asc' | 'desc';
  [key: string]: any;
}

interface SortSettingReorderItemProps {
  item: SortRule;
  editingId: string | null;
  editingAlias: string;
  setEditingAlias: (val: string) => void;
  startEditAlias: (item: SortRule) => void;
  commitAlias: () => void;
  cancelAlias: () => void;
  handleToggle: (id: string) => void;
  setIsReordering?: (val: boolean) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onMoveToTop?: (id: string) => void;
}

function SortSettingReorderItem({
  item,
  editingId,
  editingAlias,
  setEditingAlias,
  startEditAlias,
  commitAlias,
  cancelAlias,
  handleToggle,
  setIsReordering,
  onDragStart,
  onDragEnd,
  onMoveToTop
}: SortSettingReorderItemProps) {
  const isMobile = useIsMobile();
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      key={item.id}
      value={item}
      className={cn(
        'glass flex items-center gap-2 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)]',
        isMobile ? 'mobile-setting-item' : 'pc-table-setting-item'
      )}
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 35,
        mass: 1,
        layout: { duration: 0.2 }
      }}
      style={isMobile ? { touchAction: 'pan-y' } : undefined}
      dragListener={false}
      dragControls={dragControls}
      onDragStart={() => {
        setIsReordering?.(true);
        onDragStart?.();
      }}
      onDragEnd={() => {
        setIsReordering?.(false);
        onDragEnd?.();
      }}
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
      <div className="flex-1 flex flex-col gap-0.5 select-none">
        {editingId === item.id ? (
          <div className="flex gap-1.5">
            <Input
              autoFocus
              value={editingAlias}
              onChange={(e) => setEditingAlias(e.target.value)}
              onBlur={commitAlias}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitAlias();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelAlias();
                }
              }}
              placeholder="输入别名，如涨跌幅"
              className="h-8 text-[16PX] md:text-sm bg-black/20"
            />
          </div>
        ) : (
          <>
            <button
              type="button"
              title="点击修改别名"
              onClick={() => startEditAlias(item)}
              className="text-left text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer p-0 border-none bg-transparent"
            >
              {item.label}
            </button>
            {item.alias && <span className="text-xs text-[var(--muted)]">{item.alias}</span>}
          </>
        )}
      </div>
      {item.id !== 'default' && (
        <Switch
          checked={Boolean(item.enabled)}
          onCheckedChange={() => handleToggle(item.id)}
          title={item.enabled ? '关闭' : '开启'}
        />
      )}
    </Reorder.Item>
  );
}

export interface SortSettingModalProps {
  open: boolean;
  onClose?: () => void;
}

export default function SortSettingModal({ open, onClose }: SortSettingModalProps) {
  const isMobile = useIsMobile();
  const { sortRules, pcSortDisplayMode, mobileSortDisplayMode } = useStorageStore(
    useShallow((s) => ({
      sortRules: s.sortRules,
      pcSortDisplayMode: s.pcSortDisplayMode,
      mobileSortDisplayMode: s.mobileSortDisplayMode
    }))
  );
  const { setSortRules, setPcSortDisplayMode, setMobileSortDisplayMode } = useStorageStore.getState();

  const sortDisplayMode = isMobile ? mobileSortDisplayMode : pcSortDisplayMode;
  const onChangeSortDisplayMode = isMobile ? setMobileSortDisplayMode : setPcSortDisplayMode;

  const [localRules, setLocalRules] = useState<SortRule[]>(sortRules || []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAlias, setEditingAlias] = useState('');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const isDraggingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const localRulesRef = useRef(localRules);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localRulesRef.current = localRules;
  }, [localRules]);

  useEffect(() => {
    if (open) {
      if (!isDraggingRef.current && !timerRef.current) {
        const defaultRule = (sortRules || []).find((item) => item.id === 'default');
        const otherRules = (sortRules || []).filter((item) => item.id !== 'default');
        const ordered = defaultRule ? [defaultRule, ...otherRules] : otherRules;
        setLocalRules(ordered);
      }
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open, sortRules]);

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
      setSortRules(localRulesRef.current);
    }
  }, [open, setSortRules]);

  const handleReorder = (nextItems: SortRule[]) => {
    const defaultRule = (localRules || []).find((item) => item.id === 'default');
    const combined = defaultRule ? [defaultRule, ...nextItems] : nextItems;
    setLocalRules(combined);
  };

  const handleToggle = (id: string) => {
    const next = (localRules || []).map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item));
    setLocalRules(next);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setSortRules(next);
  };

  const handleMoveToTop = (itemId: string) => {
    const defaultRule = (localRules || []).find((item) => item.id === 'default');
    const otherRules = (localRules || []).filter((item) => item.id !== 'default');

    const itemToMove = otherRules.find((r) => r.id === itemId);
    if (!itemToMove) return;
    const remainingRules = otherRules.filter((r) => r.id !== itemId);

    const combined = defaultRule ? [defaultRule, itemToMove, ...remainingRules] : [itemToMove, ...remainingRules];
    setLocalRules(combined);

    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setSortRules(localRulesRef.current);
      timerRef.current = null;
    }, 1000);
  };

  const startEditAlias = (item: SortRule) => {
    if (!item || item.id === 'default') return;
    setEditingId(item.id);
    setEditingAlias(item.alias || '');
  };

  const commitAlias = () => {
    if (!editingId) return;
    let nextRules: SortRule[] | null = null;
    setLocalRules((prev) => {
      const next = prev.map((item) =>
        item.id === editingId ? { ...item, alias: editingAlias.trim() || undefined } : item
      );
      nextRules = next;
      return next;
    });
    if (nextRules) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      queueMicrotask(() => {
        if (nextRules) setSortRules(nextRules);
      });
    }
    setEditingId(null);
    setEditingAlias('');
  };

  const cancelAlias = () => {
    setEditingId(null);
    setEditingAlias('');
  };

  if (!open) return null;

  const body = (
    <div
      ref={scrollRef}
      className={cn(
        'flex flex-col overflow-y-auto p-4 scrollbar-y-styled',
        isMobile ? 'mobile-setting-body flex-1' : 'pc-table-setting-body flex-1'
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-foreground m-0">排序形式</h3>
        <div className="flex justify-end ml-auto">
          <RadioGroup
            value={sortDisplayMode}
            onValueChange={(value) => onChangeSortDisplayMode?.(value as any)}
            className="flex flex-row items-center gap-4"
          >
            <label
              htmlFor="sort-display-mode-buttons"
              className="inline-flex items-center gap-1.5 text-xs text-foreground cursor-pointer select-none"
            >
              <RadioGroupItem id="sort-display-mode-buttons" value="buttons" />
              <span>按钮</span>
            </label>
            <label
              htmlFor="sort-display-mode-dropdown"
              className="inline-flex items-center gap-1.5 text-xs text-foreground cursor-pointer select-none"
            >
              <RadioGroupItem id="sort-display-mode-dropdown" value="dropdown" />
              <span>下拉单选</span>
            </label>
          </RadioGroup>
        </div>
      </div>

      <div className="flex flex-col gap-1 mb-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground m-0">排序规则</h3>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="重置排序规则"
            onClick={() => setResetConfirmOpen(true)}
            className="w-7 h-7 p-0 text-[var(--muted)] hover:text-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
        <p className="text-xs text-[var(--muted)] m-0 leading-relaxed">
          可拖拽调整优先级，右侧开关控制是否启用该排序规则。点击规则名称可编辑别名（例如“估算涨幅”的别名为“涨跌幅”）。
        </p>
      </div>

      {localRules.length === 0 ? (
        <div className="text-center py-6 text-sm text-[var(--muted)]">暂无可配置的排序规则。</div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* 默认排序固定在顶部，且不可排序、不可关闭 */}
          {localRules.find((item) => item.id === 'default') && (
            <div
              className={cn(
                'glass flex items-center p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)]',
                isMobile ? 'mobile-setting-item' : 'pc-table-setting-item'
              )}
            >
              <div className="w-4 h-4 ml-1 mr-2" />
              <div className="flex-1 flex flex-col gap-0.5 select-none">
                <span className="text-sm font-medium text-foreground">
                  {localRules.find((item) => item.id === 'default')?.label || '默认'}
                </span>
              </div>
            </div>
          )}

          {/* 其他规则支持拖拽 and 开关 */}
          <Reorder.Group
            axis="y"
            values={localRules.filter((item) => item.id !== 'default')}
            onReorder={handleReorder}
            className={cn('flex flex-col gap-2', isMobile ? 'mobile-setting-list' : 'pc-table-setting-list')}
            layoutScroll={isMobile}
            style={isMobile ? { touchAction: 'pan-y' } : undefined}
          >
            <AnimatePresence mode="popLayout">
              {localRules
                .filter((item) => item.id !== 'default')
                .map((item) => (
                  <SortSettingReorderItem
                    key={item.id}
                    item={item}
                    editingId={editingId}
                    editingAlias={editingAlias}
                    setEditingAlias={setEditingAlias}
                    startEditAlias={startEditAlias}
                    commitAlias={commitAlias}
                    cancelAlias={cancelAlias}
                    handleToggle={handleToggle}
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
                        setSortRules(localRulesRef.current);
                        timerRef.current = null;
                      }, 1000);
                    }}
                    onMoveToTop={handleMoveToTop}
                  />
                ))}
            </AnimatePresence>
          </Reorder.Group>
        </div>
      )}
    </div>
  );

  const resetConfirm = (
    <AnimatePresence>
      {resetConfirmOpen && (
        <ConfirmModal
          key="reset-sort-rules-confirm"
          title="重置排序规则"
          message="是否将排序规则恢复为默认配置？这会重置顺序、开关状态以及别名设置。"
          icon={<RotateCcw className="w-5 h-5 shrink-0 text-primary" />}
          confirmVariant="primary"
          confirmText="恢复默认"
          onConfirm={() => {
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
            setResetConfirmOpen(false);
            queueMicrotask(() => {
              setSortRules(DEFAULT_SORT_RULES);
            });
          }}
          onCancel={() => setResetConfirmOpen(false)}
        />
      )}
    </AnimatePresence>
  );

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={(v) => {
          if (!v) onClose?.();
        }}
        direction="bottom"
        handleOnly={isReordering}
      >
        <DrawerContent className="glass" defaultHeight="70vh" minHeight="40vh" maxHeight="90vh">
          <DrawerHeader className="flex flex-row items-center justify-between gap-2 py-4 px-4 border-b border-[var(--border)]">
            <DrawerTitle className="flex items-center gap-2 text-left font-semibold text-base text-foreground">
              <Settings2 className="w-5 h-5 text-primary" />
              <span>排序个性化设置</span>
            </DrawerTitle>
            <DrawerClose
              className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-foreground transition-colors"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </DrawerClose>
          </DrawerHeader>
          {body}
        </DrawerContent>
        {resetConfirm}
      </Drawer>
    );
  }

  if (typeof document === 'undefined') return null;

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="sort-setting-overlay"
          className="pc-table-setting-overlay fixed inset-0 bg-black/50 backdrop-blur-xs flex justify-end z-[10001]"
          role="dialog"
          aria-modal="true"
          aria-label="排序个性化设置"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.aside
            className="pc-table-setting-drawer glass w-[420px] max-w-[90vw] h-full flex flex-col bg-[var(--background)]/95 border-l border-[var(--border)] shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pc-table-setting-header flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <Settings2 className="w-5 h-5 text-primary" />
                <span className="font-semibold text-base text-foreground">排序个性化设置</span>
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

            {body}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(
    <>
      {content}
      {resetConfirm}
    </>,
    document.body
  );
}
