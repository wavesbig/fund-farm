'use client';

import * as React from 'react';
import { useRef, useState } from 'react';
import { AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { Folder, GripVertical, Plus, Settings2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ConfirmModal from './ConfirmModal';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FundGroup } from '@/types';

const MAX_GROUP_NAME_LENGTH = 8;
const truncateGroupName = (value: string) => [...(value || '')].slice(0, MAX_GROUP_NAME_LENGTH).join('');

interface GroupManageReorderItemProps {
  item: FundGroup;
  onRename: (id: string, newName: string, isComposing?: boolean) => void;
  onDeleteClick: (id: string, name: string) => void;
}

function GroupManageReorderItem({ item, onRename, onDeleteClick }: GroupManageReorderItemProps) {
  const dragControls = useDragControls();
  const isComposingRef = useRef(false);
  const isPreset = Boolean(item.isPreset || item.id === 'fav');

  return (
    <Reorder.Item
      key={item.id}
      value={item}
      className={cn(
        'group-manage-item glass transition-colors duration-200 flex items-center gap-2 rounded-xl p-2 bg-[var(--card)] border border-[var(--border)]',
        isPreset &&
          'border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent dark:from-primary/15 dark:via-primary/5 dark:to-transparent shadow-[0_2px_12px_rgba(34,211,238,0.06)] dark:shadow-[0_0_15px_rgba(34,211,238,0.08)]'
      )}
      layout
      style={{ touchAction: 'pan-y' }}
      dragListener={false}
      dragControls={dragControls}
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
      {isPreset ? (
        <div className="flex flex-1 items-center gap-2.5 px-3 h-9 select-none">
          <span className="text-[14PX] font-medium text-foreground tracking-wide">{item.name || '自选'}</span>
          <Badge
            variant="outline"
            className="font-medium text-[11PX] px-2 py-0.5 min-h-0 h-5 leading-none shrink-0 shadow-xs pointer-events-none border border-primary/30 bg-primary/15 text-primary backdrop-blur-md"
          >
            预置
          </Badge>
        </div>
      ) : (
        <input
          className={cn(
            'input flex-1 h-9 rounded-lg px-3 bg-black/20 text-[16PX] md:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary border border-transparent transition-colors',
            !item.name.trim() && 'border-[var(--danger)] focus:ring-[var(--danger)]'
          )}
          value={item.name}
          onChange={(e) =>
            onRename(item.id, e.target.value, (e.nativeEvent as any).isComposing || isComposingRef.current)
          }
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={(e) => {
            isComposingRef.current = false;
            onRename(item.id, e.currentTarget.value);
          }}
          onBlur={(e) => {
            if (!isComposingRef.current) onRename(item.id, e.currentTarget.value);
          }}
          placeholder="请输入分组名称..."
        />
      )}
      {isPreset ? (
        <div className="w-9 h-9 shrink-0" />
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 shrink-0 text-[var(--danger)] hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]"
              onClick={() => onDeleteClick(item.id, item.name)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>删除分组</p>
          </TooltipContent>
        </Tooltip>
      )}
    </Reorder.Item>
  );
}

export interface GroupManageModalProps {
  groups: FundGroup[];
  onClose: () => void;
  onSave: (groups: FundGroup[]) => void;
}

export default function GroupManageModal({ groups, onClose, onSave }: GroupManageModalProps) {
  const [items, setItems] = useState<FundGroup[]>(groups);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const handleReorder = (newOrder: FundGroup[]) => {
    setItems(newOrder);
  };

  const handleRename = (id: string, newName: string, isComposing = false) => {
    const nextName = isComposing ? newName || '' : truncateGroupName(newName);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, name: nextName } : item)));
  };

  const handleDeleteClick = (id: string, name: string) => {
    const itemToDelete = items.find((it) => it.id === id);
    if (itemToDelete?.isPreset || id === 'fav') return;
    const isNew = !groups.find((g) => g.id === id);
    const isEmpty = itemToDelete && (!itemToDelete.codes || itemToDelete.codes.length === 0);

    if (isNew || isEmpty) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    } else {
      setDeleteConfirm({ id, name });
    }
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      setItems((prev) => prev.filter((item) => item.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    }
  };

  const handleAddRow = () => {
    const newGroup: FundGroup = {
      id: `group_${Date.now()}`,
      name: '',
      codes: []
    };
    setItems((prev) => [...prev, newGroup]);
  };

  const handleConfirm = () => {
    const hasEmpty = items.some((it) => !(it.isPreset || it.id === 'fav') && !it.name.trim());
    if (hasEmpty) return;
    onSave(
      items.map((item) =>
        item.isPreset || item.id === 'fav'
          ? { ...item, name: '自选', isPreset: true }
          : { ...item, name: truncateGroupName(item.name).trim() }
      )
    );
    onClose();
  };

  const isAllValid = items.every((it) => it.isPreset || it.id === 'fav' || it.name.trim() !== '');

  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent
          className="glass card modal max-w-[500px] w-[90vw] z-[99]"
          overlayClassName="modal-overlay"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => {
            if (deleteConfirm) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (deleteConfirm) event.preventDefault();
          }}
        >
          <DialogTitle asChild>
            <div className="title flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5 font-semibold text-lg text-foreground">
                <Settings2 className="w-5 h-5 text-primary" />
                <span>管理分组</span>
              </div>
            </div>
          </DialogTitle>

          <div className="group-manage-list-container scrollbar-y-styled max-h-[60vh] overflow-y-auto pr-1">
            {items.length === 0 ? (
              <div className="empty-state text-[var(--muted)] text-center py-10">
                <Folder className="w-10 h-10 mx-auto mb-3 opacity-40 text-muted-foreground" />
                <p>暂无自定义分组</p>
              </div>
            ) : (
              <Reorder.Group
                axis="y"
                values={items}
                onReorder={handleReorder}
                className="group-manage-list flex flex-col gap-2"
                layoutScroll
                style={{ touchAction: 'pan-y' }}
              >
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <GroupManageReorderItem
                      key={item.id}
                      item={item}
                      onRename={handleRename}
                      onDeleteClick={handleDeleteClick}
                    />
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            )}
            <Button
              variant="outline"
              onClick={handleAddRow}
              className="w-full mt-3 h-10 rounded-xl border-dashed border-[var(--border)] bg-background/20 text-[var(--muted)] hover:text-foreground hover:bg-background/40 flex items-center justify-center gap-2 text-sm transition-[background-color,border-color,color] duration-150 ease-out"
            >
              <Plus className="w-4 h-4" />
              <span>新增分组</span>
            </Button>
          </div>

          <div className="mt-6">
            {!isAllValid && <div className="text-[var(--danger)] text-sm mb-3 text-center">所有分组名称均不能为空</div>}
            <Button className="w-full h-10 font-medium" onClick={handleConfirm} disabled={!isAllValid}>
              完成
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {deleteConfirm && (
          <div onPointerDown={(e) => e.stopPropagation()}>
            <ConfirmModal
              title="删除确认"
              message={`确定要删除分组 "${deleteConfirm.name}" 吗？分组内的基金数据会被删除。`}
              onConfirm={handleConfirmDelete}
              onCancel={() => setDeleteConfirm(null)}
            />
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
