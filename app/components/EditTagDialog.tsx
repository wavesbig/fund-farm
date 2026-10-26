'use client';

import * as React from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { TAG_THEME_OPTIONS } from '@/app/constants';

const MAX_TAG_NAME_LEN = 10;

export interface EditTagDialogPayload {
  name: string;
  theme: string;
}

export interface EditTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (payload: EditTagDialogPayload) => void;
  initialName?: string;
  initialTheme?: string;
}

export default function EditTagDialog({
  open,
  onOpenChange,
  onEdit,
  initialName = '',
  initialTheme = 'default'
}: EditTagDialogProps) {
  const nameId = useId();
  const themeId = useId();
  const [name, setName] = useState(initialName);
  const [themeKey, setThemeKey] = useState(initialTheme);
  /** 防止连点导致 onEdit 执行两次 */
  const submitGuardRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setThemeKey(initialTheme);
    submitGuardRef.current = false;
  }, [open, initialName, initialTheme]);

  const selectedTheme = useMemo(() => {
    return (TAG_THEME_OPTIONS as any[]).find((x) => x.key === themeKey) ?? TAG_THEME_OPTIONS[0];
  }, [themeKey]);

  const parsedName = name.trim().slice(0, MAX_TAG_NAME_LEN);
  const canSubmit = parsedName.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="glass card modal max-w-[420px] w-[90vw] z-[999] p-5"
        overlayClassName="modal-overlay"
      >
        <DialogTitle className="sr-only">编辑标签</DialogTitle>

        <div className="title flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 font-semibold text-base text-foreground">
            <Tag className="w-5 h-5 text-primary" />
            <span>编辑标签</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="text-xs font-medium text-[var(--muted)]">预览</div>
            <div className="rounded-xl border border-[var(--border)] p-3 bg-black/10 min-h-[46px] flex items-center">
              <div className="flex flex-wrap gap-1.5">
                {!parsedName ? (
                  <Badge
                    variant={selectedTheme.badgeVariant}
                    className={cn('font-normal text-xs', selectedTheme.badgeClassName)}
                  >
                    示例
                  </Badge>
                ) : (
                  <Badge
                    variant={selectedTheme.badgeVariant}
                    className={cn('font-normal text-xs', selectedTheme.badgeClassName)}
                  >
                    {parsedName}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={nameId} className="text-xs font-medium text-[var(--muted)]">
              标签名称
            </label>
            <Input
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入标签名称"
              maxLength={MAX_TAG_NAME_LEN}
              autoComplete="off"
              className="h-9 bg-black/20 text-[16PX] md:text-sm"
            />
            <p className="text-[11px] text-[var(--muted)] leading-relaxed">
              名称最多 {MAX_TAG_NAME_LEN} 个字，超出部分会自动截断。
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div id={themeId} className="text-xs font-medium text-[var(--muted)]">
              标签主题
            </div>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={themeId}>
              {(TAG_THEME_OPTIONS as any[]).map((opt) => {
                const active = opt.key === themeKey;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    className="inline-flex"
                    onClick={() => setThemeKey(opt.key)}
                    aria-checked={active}
                    role="radio"
                  >
                    <Badge
                      variant={opt.badgeVariant}
                      className={cn(
                        'cursor-pointer font-normal text-xs transition-all duration-200',
                        opt.badgeClassName,
                        active
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105'
                          : 'opacity-80 hover:opacity-100'
                      )}
                    >
                      {opt.label}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <Button type="button" variant="outline" className="flex-1 h-9 bg-white/5" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            type="button"
            className="flex-1 h-9 font-medium"
            disabled={!canSubmit}
            onClick={() => {
              if (!canSubmit || submitGuardRef.current) return;
              submitGuardRef.current = true;
              onEdit?.({
                name: parsedName,
                theme: themeKey
              });
              onOpenChange(false);
            }}
          >
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
