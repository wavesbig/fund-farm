'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
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
  onConfirm?: (targetIds: string[]) => boolean | void;
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
  const targetText = selectedNames.length > 0 ? selectedNames.join('、') : '请选择';

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
        showCloseButton={false}
        className="glass card modal max-w-[460px] w-[90vw] z-[10003]"
        overlayClassName="modal-overlay z-[10002]"
      >
        <DialogTitle className="sr-only">同步个性化设置</DialogTitle>

        <div className="title flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 font-semibold text-lg text-foreground">
            <RefreshCw className="w-5 h-5 text-primary" />
            <span>同步个性化设置</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-full text-[var(--muted)] hover:text-foreground hover:bg-white/10"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-xs text-[var(--muted)] mb-3 leading-relaxed">
          将「{sourceName}」分组当前个性化设置同步至（{targetText}）分组。
        </p>

        <div className="group-manage-list-container scrollbar-y-styled max-h-[46vh] overflow-y-auto pr-1">
          {options.length === 0 ? (
            <div className="empty-state text-[var(--muted)] text-center py-8 text-sm">暂无其它可同步分组</div>
          ) : (
            <div className="group-manage-list flex flex-col gap-2">
              {options.map((item) => {
                const isChecked = selected.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'group-manage-item glass flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] cursor-pointer select-none transition-colors hover:bg-white/5',
                      isChecked && 'border-primary/40 bg-primary/10'
                    )}
                    onClick={() => toggleSelect(item.id)}
                  >
                    <Checkbox checked={isChecked} onCheckedChange={() => toggleSelect(item.id)} className="shrink-0" />
                    <div className="fund-info flex-1 min-w-0">
                      <div className="font-semibold text-sm text-foreground">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-[var(--muted)] mt-0.5 truncate">{item.description}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-5">
          <Button variant="outline" className="flex-1 h-10 bg-white/5 hover:bg-white/10" onClick={onClose}>
            取消
          </Button>
          <Button className="flex-1 h-10 font-medium" onClick={handleConfirm} disabled={selected.size === 0}>
            同步 ({selected.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
