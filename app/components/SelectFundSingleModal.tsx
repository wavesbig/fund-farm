'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { Search, Layers, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface SingleSelectFundItem {
  code: string;
  name?: string;
  [key: string]: any;
}

export interface SelectFundSingleModalProps {
  title?: string;
  allFunds?: SingleSelectFundItem[];
  excludeCodes?: (string | undefined)[];
  initialSelectedCode?: string;
  onClose: () => void;
  onConfirm?: (fund: SingleSelectFundItem) => void;
}

export default function SelectFundSingleModal({
  title = '选择基金',
  allFunds = [],
  excludeCodes = [],
  initialSelectedCode = '',
  onClose,
  onConfirm
}: SelectFundSingleModalProps) {
  const [selectedCode, setSelectedCode] = useState<string>(initialSelectedCode || '');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const availableFunds = useMemo(() => {
    const excluded = new Set((excludeCodes || []).filter(Boolean) as string[]);
    const base = (allFunds || []).filter((f) => f?.code && !excluded.has(f.code));
    const query = String(searchQuery ?? '')
      .trim()
      .toLowerCase();
    if (!query) return base;
    return base.filter((f) => (f.name && f.name.toLowerCase().includes(query)) || (f.code && f.code.includes(query)));
  }, [allFunds, excludeCodes, searchQuery]);

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose?.();
  };

  const canConfirm = !!selectedCode;

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="glass card modal max-w-[500px] w-[90vw] !z-[999] p-5"
        overlayClassName="modal-overlay"
        overlayStyle={{ zIndex: 999 }}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="flex items-center justify-between mb-5 font-semibold text-base text-foreground">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <span>{title}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="text"
            className="pl-9 text-[16PX] md:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索基金名称或编号"
          />
        </div>

        <div className="group-manage-list-container scrollbar-y-styled max-h-[50vh] overflow-y-auto pr-1">
          {availableFunds.length === 0 ? (
            <div className="text-center py-10 text-xs text-muted-foreground">
              <p>{searchQuery.trim() ? '未找到匹配的基金' : '暂无可选基金'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableFunds.map((fund) => {
                const active = selectedCode === fund.code;
                return (
                  <div
                    key={fund.code}
                    className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer ${
                      active ? 'border-primary bg-primary/10' : 'border-border bg-white/5 hover:bg-white/10'
                    }`}
                    onClick={() => setSelectedCode(fund.code)}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 mr-3 ${
                        active ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-transparent'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-foreground truncate">{fund.name}</div>
                      <div className="text-xs text-muted-foreground tabular-nums">#{fund.code}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-border mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-white/5 border-border hover:bg-white/10 text-foreground"
          >
            取消
          </Button>
          <Button
            type="button"
            disabled={!canConfirm}
            onClick={() => {
              const picked = (allFunds || []).find((f) => f?.code === selectedCode) || null;
              if (!picked) return;
              onConfirm?.(picked);
            }}
            className="flex-1 bg-primary text-primary-foreground font-medium"
          >
            确定
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
