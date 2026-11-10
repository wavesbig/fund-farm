'use client';

import React from 'react';
import { FolderPlus, Trash2, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export interface BatchRemoveHeaderProps {
  checked: boolean;
  indeterminate: boolean;
  selectedCount: number;
  totalCount: number;
  onToggleAll: (checked: boolean) => void;
  onMove: () => void;
  onRemove: () => void;
  onClear: () => void;
  onClose?: () => void;
  disabled?: boolean;
}

export function BatchRemoveHeader({
  checked,
  indeterminate,
  selectedCount,
  totalCount,
  onToggleAll,
  onMove,
  onRemove,
  onClear,
  onClose,
  disabled
}: BatchRemoveHeaderProps) {
  return (
    <div className="inline-flex items-center justify-between gap-3 w-full min-w-0 py-0.5">
      <div className="inline-flex items-center gap-2 min-w-0">
        <label
          onClick={(e) => e.stopPropagation?.()}
          title={checked ? '取消全选' : '全选'}
          className="inline-flex items-center gap-2 cursor-pointer select-none"
        >
          <Checkbox
            checked={indeterminate ? 'indeterminate' : checked}
            onCheckedChange={(val) => onToggleAll?.(!!val)}
            onClick={(e) => e.stopPropagation?.()}
            aria-label="全选"
            className="size-4"
          />
          <span className="text-xs font-medium text-foreground whitespace-nowrap">
            已选 {selectedCount}/{totalCount}
          </span>
        </label>
        {selectedCount > 0 && (
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => {
              e.stopPropagation?.();
              onClear?.();
            }}
            type="button"
            className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            清空
          </Button>
        )}
      </div>

      <div className="inline-flex items-center gap-1.5 flex-shrink-0">
        <Button
          variant="outline"
          size="xs"
          onClick={(e) => {
            e.stopPropagation?.();
            onMove?.();
          }}
          disabled={!!disabled}
          type="button"
          className="h-6 px-2 gap-1 text-xs text-primary border-primary/30 hover:bg-primary/10 hover:text-primary"
        >
          <FolderPlus className="size-3" />
          <span>移动分组</span>
        </Button>
        <Button
          variant="outline"
          size="xs"
          onClick={(e) => {
            e.stopPropagation?.();
            onRemove?.();
          }}
          disabled={!!disabled}
          type="button"
          className="h-6 px-2 gap-1 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3" />
          <span>批量删除</span>
        </Button>
        {onClose && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation?.();
              onClose?.();
            }}
            type="button"
            aria-label="退出编辑"
            className="size-6 text-muted-foreground hover:text-foreground rounded"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default BatchRemoveHeader;
