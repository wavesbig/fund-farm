'use client';

import * as React from 'react';
import { useMemo, useRef } from 'react';
import { X, Search } from 'lucide-react';

import { Field, FieldContent } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface SearchFundProps {
  value?: string;
  onSearch?: (term: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function SearchFund({
  value,
  onSearch,
  placeholder = '筛选当前分组基金名称、代码或标签...',
  disabled = false
}: SearchFundProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const showClear = useMemo(() => {
    if (disabled) return false;
    return String(value ?? '').length > 0;
  }, [value, disabled]);

  return (
    <div className="mt-3 mb-3 w-full sm:max-w-[400px]">
      <Field orientation="horizontal" className="items-stretch gap-2">
        <FieldContent className="relative min-w-0">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70 pointer-events-none"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <Input
            value={value ?? ''}
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'h-9 w-full rounded-lg pl-9 text-[16PX] md:text-sm bg-card border-border shadow-xs text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-[border-color,box-shadow,background-color] duration-150 ease-out',
              showClear ? 'pr-9' : ''
            )}
            ref={inputRef}
            onBlur={() => {
              // 仅在移动端键盘收起时恢复位置，避免 PC 端失焦时页面抖动跳跃
              if (typeof window !== 'undefined' && window.innerWidth > 640) return;
              const el = inputRef.current;
              if (!el) return;
              setTimeout(() => {
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    try {
                      el.scrollIntoView({
                        block: 'center',
                        inline: 'nearest',
                        behavior: 'smooth'
                      });
                    } catch {}

                    try {
                      const rect = el.getBoundingClientRect();
                      const targetTop = window.scrollY + rect.top - (window.innerHeight / 2 - rect.height / 2);
                      window.scrollTo({
                        top: Math.max(0, targetTop),
                        behavior: 'smooth'
                      });
                    } catch {}
                  });
                });
              }, 220);
            }}
          />
          {showClear && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="absolute right-2 top-1/2 -translate-y-1/2 size-6 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                  aria-label="清空搜索"
                  onMouseDown={(e) => {
                    // 避免点击导致 input 失焦
                    e.preventDefault();
                  }}
                  onClick={() => {
                    onSearch?.('');
                    inputRef.current?.focus();
                  }}
                >
                  <X className="size-3.5" strokeWidth={2} aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>清空</p>
              </TooltipContent>
            </Tooltip>
          )}
        </FieldContent>
      </Field>
    </div>
  );
}
