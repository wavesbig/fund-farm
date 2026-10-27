'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface SyncOption {
  id: string;
  name: string;
  description?: string;
}

export interface SyncPersonalSettingsModalProps {
  open: boolean;
  onClose: () => void;
  options?: SyncOption[];
  sourceName?: string;
  onConfirm?: (targetIds: string[]) => boolean | number | void;
}

export default function SyncPersonalSettingsModal({
  open,
  onClose,
  options = [],
  sourceName = '当前',
  onConfirm
}: SyncPersonalSettingsModalProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const selectedNames = useMemo(
    () => options.filter((item) => selected.has(item.id)).map((item) => item.name),
    [options, selected]
  );
  const targetText = selectedNames.length > 0 ? selectedNames.join('、') : '请选择目标分组';

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose?.();
  };

  const handleConfirm = () => {
    const targetIds = Array.from(selected);
    if (targetIds.length === 0) return;
    const result = onConfirm?.(targetIds);
    if (result !== false) {
      setSelected(new Set());
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="max-w-[460px] w-[92vw] p-0 gap-0 overflow-hidden rounded-2xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl z-[10003]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 py-4.5 border-b border-border/60 shrink-0 text-left bg-muted/10">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-xs">
              <RefreshCw className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                同步个性化设置
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 truncate max-w-[300px]">
                同步「{sourceName}」的表头设置到其他分组
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 sm:p-6 space-y-3.5 max-h-[60vh] overflow-y-auto scrollbar-y-styled">
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-xs text-muted-foreground leading-relaxed">
            将「<span className="font-medium text-foreground">{sourceName}</span>」分组的个性化设置应用到：
            <span className="font-medium text-primary ml-1">{targetText}</span>
          </div>

          <div className="space-y-2">
            {options.length === 0 ? (
              <div className="text-muted-foreground text-center py-8 text-xs">暂无其它可同步分组</div>
            ) : (
              options.map((item) => {
                const isChecked = selected.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border border-border/70 bg-card/60 hover:bg-card/90 cursor-pointer select-none transition-all shadow-xs',
                      isChecked && 'border-primary/40 bg-primary/10'
                    )}
                    onClick={() => toggleSelect(item.id)}
                  >
                    <Checkbox checked={isChecked} onCheckedChange={() => toggleSelect(item.id)} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs sm:text-sm tracking-tight text-foreground">{item.name}</div>
                      {item.description && (
                        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.description}</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-3.5 border-t border-border/60 shrink-0 bg-muted/20 flex flex-row items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs font-medium text-muted-foreground hover:text-foreground h-9 px-4 rounded-lg cursor-pointer"
            onClick={onClose}
          >
            取消
          </Button>
          <Button
            type="button"
            size="sm"
            className="text-xs font-medium h-9 px-5 rounded-lg shadow-xs cursor-pointer"
            onClick={handleConfirm}
            disabled={selected.size === 0}
          >
            同步 ({selected.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
