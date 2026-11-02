'use client';

import * as React from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Plus, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { TAG_THEME_OPTIONS } from '@/app/constants';

const TAG_THEME_KEY_SET = new Set((TAG_THEME_OPTIONS as any[]).map((o) => o.key));

const MAX_TAG_NAME_LEN = 10;
const MAX_BATCH_TAGS = 30;

/** 按英文分号 ; 或中文分号 ； 拆分，去空，允许同名多段，单段超长截断至 MAX_TAG_NAME_LEN */
export function parseTagNamesInput(raw?: string): string[] {
  const s = String(raw ?? '');
  const parts = s.split(/[;；]+/);
  const out: string[] = [];
  for (const part of parts) {
    const name = part.trim().slice(0, MAX_TAG_NAME_LEN);
    if (!name) continue;
    out.push(name);
    if (out.length >= MAX_BATCH_TAGS) break;
  }
  return out;
}

/**
 * 与 FundTagsEditDialog 一致的 Badge variant 与主题色 class（表格标签列等复用）
 */
export function getTagThemeBadgeProps(rawTheme?: string): { variant: 'default' | 'outline'; className: string } {
  const keyRaw = String(rawTheme ?? '').trim();
  const key = TAG_THEME_KEY_SET.has(keyRaw) ? keyRaw : 'default';
  const opt = (TAG_THEME_OPTIONS as any[]).find((o) => o.key === key) ?? TAG_THEME_OPTIONS[0];
  const isDefault = key === 'default';
  return {
    variant: isDefault ? 'outline' : 'default',
    className: opt.badgeClassName || ''
  };
}

export interface AddTagDialogPayload {
  names: string[];
  theme: string;
}

export interface AddTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (payload: AddTagDialogPayload) => void;
}

export default function AddTagDialog({ open, onOpenChange, onAdd }: AddTagDialogProps) {
  const nameId = useId();
  const themeId = useId();
  const [name, setName] = useState('');
  const [themeKey, setThemeKey] = useState('default');
  /** 防止连点「添加」导致 onAdd 执行两次、产生重复标签 */
  const submitGuardRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setName('');
    setThemeKey('default');
    submitGuardRef.current = false;
  }, [open]);

  const selectedTheme = useMemo(() => {
    return (TAG_THEME_OPTIONS as any[]).find((x) => x.key === themeKey) ?? TAG_THEME_OPTIONS[0];
  }, [themeKey]);

  const parsedNames = useMemo(() => parseTagNamesInput(name), [name]);
  const canSubmit = parsedNames.length > 0;

  const previewNames = useMemo(() => {
    if (parsedNames.length <= 12) return { items: parsedNames, rest: 0 };
    return { items: parsedNames.slice(0, 12), rest: parsedNames.length - 12 };
  }, [parsedNames]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="glass card modal max-w-[420px] w-[90vw] z-[999] p-5"
        overlayClassName="modal-overlay"
      >
        <DialogTitle className="sr-only">添加标签</DialogTitle>

        <div className="title flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 font-semibold text-base text-foreground">
            <Tag className="w-5 h-5 text-primary" />
            <span>添加标签</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="text-xs font-medium text-[var(--muted)]">预览</div>
            <div className="rounded-xl border border-[var(--border)] p-3 bg-black/10 min-h-[46px] flex items-center">
              <div className="flex flex-wrap gap-1.5">
                {parsedNames.length === 0 ? (
                  <Badge
                    variant={selectedTheme.badgeVariant}
                    className={cn('font-normal text-xs', selectedTheme.badgeClassName)}
                  >
                    示例
                  </Badge>
                ) : (
                  <>
                    {previewNames.items.map((n) => (
                      <Badge
                        key={n}
                        variant={selectedTheme.badgeVariant}
                        className={cn('font-normal text-xs', selectedTheme.badgeClassName)}
                      >
                        {n}
                      </Badge>
                    ))}
                    {previewNames.rest > 0 && (
                      <span className="text-xs text-[var(--muted)] self-center">+{previewNames.rest} 个</span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={nameId} className="text-xs font-medium text-[var(--muted)]">
              标签名称
            </label>
            <Textarea
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="可输入一个或多个，用 ; 或 ； 分隔"
              rows={3}
              maxLength={2000}
              autoComplete="off"
              className="min-h-[72px] resize-y bg-black/20 text-[16PX] md:text-sm"
            />
            <p className="text-[11px] text-[var(--muted)] leading-relaxed">
              支持批量：多个标签请用英文分号 <span className="font-mono text-foreground">;</span> 或中文分号{' '}
              <span className="font-mono text-foreground">；</span> 分隔，将按当前所选主题统一添加。每个名称最多{' '}
              {MAX_TAG_NAME_LEN} 个字，超出部分会自动截断；单次最多添加 {MAX_BATCH_TAGS} 个。
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
                        'cursor-pointer font-normal text-xs transition-[opacity,transform,box-shadow] duration-150 ease-out',
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
            className="flex-1 h-9 gap-1 font-medium"
            disabled={!canSubmit}
            onClick={() => {
              if (!canSubmit || submitGuardRef.current) return;
              submitGuardRef.current = true;
              onAdd?.({
                names: parsedNames,
                theme: themeKey
              });
              onOpenChange(false);
            }}
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>添加{parsedNames.length > 1 ? `（${parsedNames.length}）` : ''}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
