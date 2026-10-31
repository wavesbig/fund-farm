'use client';

import * as React from 'react';
import { useState } from 'react';
import { Coins, X } from 'lucide-react';
import { useStorageStore } from '../stores/storageStore';
import { useModalStore } from '../stores';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export type DividendMethod = 'reinvest' | 'cash';

export interface DividendMethodFund {
  code: string;
  name?: string;
  [key: string]: any;
}

export interface DividendMethodModalProps {
  fund: DividendMethodFund | null;
  groupId?: string;
  onClose: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const OPTIONS: { value: DividendMethod; label: string; desc: string }[] = [
  { value: 'reinvest', label: '红利再投资', desc: '分红自动转为基金份额' },
  { value: 'cash', label: '现金分红', desc: '分红以现金形式发放' }
];

export default function DividendMethodModal({ fund, groupId, onClose, showToast }: DividendMethodModalProps) {
  const holdings = useStorageStore((s) => s.holdings);
  const groupHoldings = useStorageStore((s) => s.groupHoldings);
  const setHoldings = useStorageStore((s) => s.setHoldings);
  const setGroupHoldings = useStorageStore((s) => s.setGroupHoldings);

  const currentHolding = groupId ? groupHoldings?.[groupId]?.[fund?.code || ''] : holdings?.[fund?.code || ''];
  const [selected, setSelected] = useState<DividendMethod>(
    (currentHolding?.dividendMethod as DividendMethod) || 'reinvest'
  );
  const [syncAll, setSyncAll] = useState<boolean>(false);

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose?.();
  };

  const handleConfirm = () => {
    const code = fund?.code;
    if (!code) return;

    if (!groupId) {
      setHoldings((prev) => {
        const next = { ...prev };
        if (syncAll) {
          for (const k of Object.keys(next)) {
            if (next[k] && Number(next[k].share) > 0) {
              next[k] = { ...next[k], dividendMethod: selected };
            }
          }
        } else {
          const current = next[code] || { share: 0, cost: 0 };
          next[code] = { ...current, dividendMethod: selected };
        }
        return next;
      });
    } else {
      setGroupHoldings((prev) => {
        const next = { ...prev };
        const bucket = { ...(next[groupId] || {}) };
        if (syncAll) {
          for (const k of Object.keys(bucket)) {
            if (bucket[k] && Number(bucket[k].share) > 0) {
              bucket[k] = { ...bucket[k], dividendMethod: selected };
            }
          }
        } else {
          const current = bucket[code] || { share: 0, cost: 0 };
          bucket[code] = { ...current, dividendMethod: selected };
        }
        next[groupId] = bucket;
        return next;
      });
    }

    useModalStore.setState({ dividendMethodModal: { open: false, fund: null, groupId: undefined } });
    showToast?.(syncAll ? '已同步所有持仓基金分红方式' : '分红方式已更新', 'success');
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="glass card modal max-w-[380px] w-[90vw] !z-[99] p-5"
        overlayClassName="modal-overlay"
      >
        <DialogTitle className="sr-only">分红方式</DialogTitle>

        <div className="flex items-center justify-between mb-5 font-semibold text-base text-foreground">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            <span>分红方式</span>
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

        <div className="text-center mb-5">
          <div className="font-semibold text-base text-foreground mb-1">{fund?.name}</div>
          <div className="text-xs text-muted-foreground tabular-nums">#{fund?.code}</div>
        </div>

        <div className="space-y-2.5 mb-5">
          {OPTIONS.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelected(opt.value)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border border-primary bg-primary/10'
                    : 'border border-border bg-muted/30 hover:bg-muted/60'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    isSelected ? 'border-primary' : 'border-border'
                  }`}
                >
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <div>
                  <div className={`font-semibold text-sm mb-0.5 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-2.5 mb-5 px-1 cursor-pointer select-none">
          <Checkbox checked={syncAll} onCheckedChange={(val) => setSyncAll(Boolean(val))} />
          <span className="text-xs text-muted-foreground">
            {groupId ? '同步到该分组所有持仓基金' : '同步到所有持仓基金'}
          </span>
        </label>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-muted/30 border-border hover:bg-muted/60 text-foreground"
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="flex-1 bg-primary text-primary-foreground font-medium"
          >
            确认
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
