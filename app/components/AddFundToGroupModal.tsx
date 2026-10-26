'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { isArray, isObject } from 'lodash';
import { Search, Info, Check } from 'lucide-react';
import { CloseIcon, PlusIcon } from './Icons';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getTagThemeBadgeProps } from './AddTagDialog';
import { cn, formatMoney } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Fund, Holding } from '@/types';

export interface AddFundToGroupModalProps {
  allFunds: Fund[];
  currentGroupCodes: string[];
  holdings?: Record<string, Holding>;
  fundTagListsByCode?: Record<string, any[]>;
  fundTagRecords?: any[];
  onClose?: () => void;
  onAdd: (codes: string[]) => void;
}

export default function AddFundToGroupModal({
  allFunds,
  currentGroupCodes,
  holdings = {},
  fundTagListsByCode = {},
  fundTagRecords = [],
  onClose,
  onAdd
}: AddFundToGroupModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const availableFunds = useMemo(() => {
    const base = (allFunds || []).filter((f) => !(currentGroupCodes || []).includes(f.code));
    const query = String(searchQuery ?? '')
      .trim()
      .toLowerCase();
    if (!query) return base;
    return base.filter((f) => (f.name && f.name.toLowerCase().includes(query)) || (f.code && f.code.includes(query)));
  }, [allFunds, currentGroupCodes, searchQuery]);

  /** 全局标签池 id → theme 查找表，确保渲染主题与用户最新配置一致 */
  const tagThemeById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const r of fundTagRecords || []) {
      if (r?.id) map[String(r.id)] = String(r.theme ?? 'default').trim() || 'default';
    }
    return map;
  }, [fundTagRecords]);

  const getHoldingAmount = (fund: Fund) => {
    const holding = holdings[fund?.code];
    if (!holding || !holding.share || holding.share <= 0) return null;
    const nav = Number(fund?.dwjz) || Number(fund?.gsz) || 0;
    if (!nav) return null;
    return holding.share * nav;
  };

  const toggleSelect = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose?.();
    }
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="glass card modal max-w-[500px] w-[90vw] p-6 z-[99]"
        overlayClassName="modal-overlay"
      >
        <DialogTitle className="sr-only">添加基金到分组</DialogTitle>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5 font-semibold text-base">
            <PlusIcon width="20" height="20" />
            <span>添加基金到分组</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <CloseIcon width="18" height="18" />
          </Button>
        </div>

        <Alert className="mb-4" variant="info">
          <Info className="h-4 w-4" />
          <AlertDescription>
            在此添加的基金不会代入原有持仓金额。如需带金额迁移，请使用「分组迁移」功能。
          </AlertDescription>
        </Alert>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索基金名称或编号"
            className="pl-9 h-10"
          />
        </div>

        <div className="group-manage-list-container scrollbar-y-styled max-h-[50vh] overflow-y-auto pr-1">
          {availableFunds.length === 0 ? (
            <div className="empty-state text-muted-foreground text-center py-10 text-sm">
              <p>{searchQuery.trim() ? '未找到匹配的基金' : '所有基金已在该分组中'}</p>
            </div>
          ) : (
            <div className="group-manage-list flex flex-col gap-2">
              {availableFunds.map((fund) => {
                const isSelected = selected.has(fund.code);
                return (
                  <div
                    key={fund.code}
                    className={cn(
                      'group-manage-item glass flex items-center p-3 rounded-xl border border-border/60 transition-all cursor-pointer hover:bg-accent/40',
                      isSelected && 'border-primary/50 bg-primary/10 shadow-xs'
                    )}
                    onClick={() => toggleSelect(fund.code)}
                  >
                    <div
                      className={cn(
                        'size-5 rounded-md border mr-3 flex items-center justify-center transition-colors',
                        isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-input/40'
                      )}
                    >
                      {isSelected && <Check className="size-3.5 stroke-[3]" />}
                    </div>
                    <div className="fund-info flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{fund.name}</div>
                      <div className="text-xs flex items-center flex-wrap gap-1.5 mt-0.5">
                        <span className="text-muted-foreground font-mono">#{fund.code}</span>
                        {isArray(fundTagListsByCode[fund.code]) && fundTagListsByCode[fund.code].length > 0 && (
                          <span className="inline-flex flex-wrap gap-1">
                            {fundTagListsByCode[fund.code].map((raw, idx) => {
                              if (!raw || !isObject(raw) || !(raw as any).name) return null;
                              const name = String((raw as any).name).trim();
                              if (!name) return null;
                              const theme =
                                (raw as any).id && tagThemeById[String((raw as any).id)]
                                  ? tagThemeById[String((raw as any).id)]
                                  : String((raw as any).theme ?? 'default').trim() || 'default';
                              const { variant, className: themeCls } = getTagThemeBadgeProps(theme);
                              return (
                                <Badge
                                  key={`${name}-${idx}`}
                                  variant={variant as any}
                                  className={cn('font-normal text-[11px] py-0 px-1.5', themeCls)}
                                >
                                  {name}
                                </Badge>
                              );
                            })}
                          </span>
                        )}
                      </div>
                      {getHoldingAmount(fund) != null && (
                        <div className="text-muted-foreground text-xs mt-1">
                          持仓金额：
                          <span className="text-foreground font-medium ml-1">
                            {formatMoney(getHoldingAmount(fund))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1 rounded-xl h-11">
            取消
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={() => onAdd(Array.from(selected))}
            disabled={selected.size === 0}
            className="flex-1 rounded-xl h-11 font-medium"
          >
            确定 ({selected.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
