'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TAG_THEME_OPTIONS } from '@/app/constants';
import { cn } from '@/lib/utils';

export interface FundTag {
  id?: string;
  name: string;
  theme?: string;
}

export interface FundTagOption {
  id: string;
  name: string;
  tags?: FundTag[];
}

export interface SyncFundTagsModalProps {
  open: boolean;
  onClose: () => void;
  options?: FundTagOption[];
  sourceName?: string;
  sourceTags?: FundTag[];
  onConfirm?: (targetIds: string[]) => boolean | void;
}

export default function SyncFundTagsModal({
  open,
  onClose,
  options = [],
  sourceName = '当前基金',
  sourceTags = [],
  onConfirm
}: SyncFundTagsModalProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const selectedNames = useMemo(
    () => options.filter((item) => selected.has(item.id)).map((item) => item.name),
    [options, selected]
  );
  const targetText = selectedNames.length > 0 ? selectedNames.join('、') : '请选择';

  const themeClassByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const opt of TAG_THEME_OPTIONS as any[]) {
      map.set(opt.key, opt.badgeClassName || '');
    }
    return map;
  }, []);

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
        className="glass card modal max-w-[460px] w-[90vw] p-5 gap-0 flex flex-col max-h-[85vh] z-[200]"
        overlayClassName="modal-overlay z-[200]"
      >
        <DialogTitle className="sr-only">同步基金标签</DialogTitle>

        <div className="title flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 font-semibold text-lg text-foreground">
            <RefreshCw className="w-5 h-5 text-primary" />
            <span>同步基金标签</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="关闭"
            className="w-8 h-8 rounded-full text-[var(--muted)] hover:text-foreground hover:bg-white/10"
            onClick={onClose}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="text-xs text-[var(--muted)] mb-3 flex items-center flex-wrap gap-1 leading-relaxed">
          <span>将「{sourceName}」的标签</span>
          {sourceTags && sourceTags.length > 0 && (
            <span className="inline-flex flex-wrap gap-1">
              {sourceTags.map((tag, idx) => {
                const themeClass = themeClassByKey.get(tag.theme || 'default') || '';
                const isDefault = !tag.theme || tag.theme === 'default';
                return (
                  <Badge
                    key={tag.id || idx}
                    variant={isDefault ? 'outline' : 'default'}
                    className={cn('font-normal text-[11px]', themeClass)}
                  >
                    {tag.name}
                  </Badge>
                );
              })}
            </span>
          )}
          <span>完全替换至（{targetText}）。</span>
        </div>

        <div className="group-manage-list-container scrollbar-y-styled max-h-[46vh] overflow-y-auto pr-1">
          {options.length === 0 ? (
            <div className="empty-state text-[var(--muted)] text-center py-8 text-sm">暂无其它可选基金</div>
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
                      <div className="text-xs flex items-center flex-wrap gap-1.5 mt-0.5">
                        <span className="text-[var(--muted)] tabular-nums">#{item.id}</span>
                        {item.tags && item.tags.length > 0 && (
                          <span className="inline-flex flex-wrap gap-1">
                            {item.tags.map((tag, idx) => {
                              const themeClass = themeClassByKey.get(tag.theme || 'default') || '';
                              const isDefault = !tag.theme || tag.theme === 'default';
                              return (
                                <Badge
                                  key={tag.id || idx}
                                  variant={isDefault ? 'outline' : 'default'}
                                  className={cn('font-normal text-[11px]', themeClass)}
                                >
                                  {tag.name}
                                </Badge>
                              );
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-3 mt-1 border-t border-border flex items-center justify-end gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            className="h-9 px-4 text-xs font-medium bg-muted/30 border-border hover:bg-muted/60 text-foreground cursor-pointer"
            onClick={onClose}
          >
            取消
          </Button>
          <Button
            type="button"
            variant="default"
            className="h-9 px-4.5 text-xs font-medium bg-primary text-primary-foreground shadow-xs cursor-pointer disabled:opacity-40"
            onClick={handleConfirm}
            disabled={selected.size === 0}
          >
            同步 ({selected.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
