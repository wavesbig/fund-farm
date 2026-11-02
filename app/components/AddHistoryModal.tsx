'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { fetchSmartFundNetValue } from '../api/fund';
import { DatePicker } from './Common';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface AddHistoryFund {
  code: string;
  name?: string;
  [key: string]: any;
}

export interface AddHistoryRecordPayload {
  fundCode: string;
  type: string;
  date: string;
  amount: number;
  share: number;
  price: number;
  timestamp: number;
}

export interface AddHistoryModalProps {
  fund: AddHistoryFund | null;
  onClose: () => void;
  onConfirm: (payload: AddHistoryRecordPayload) => void;
}

export default function AddHistoryModal({ fund, onClose, onConfirm }: AddHistoryModalProps) {
  const [type, setType] = useState<'buy' | 'sell' | ''>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<string>('');
  const [share, setShare] = useState<string>('');
  const [netValue, setNetValue] = useState<number | null>(null);
  const [netValueDate, setNetValueDate] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fund?.code || !date) return;

    const getNetValue = async () => {
      setLoading(true);
      setError(null);
      setNetValue(null);
      setNetValueDate(null);

      try {
        const result = await fetchSmartFundNetValue(fund.code, date);
        if (result && result.value) {
          setNetValue(result.value);
          setNetValueDate(result.date);
        } else {
          setError('未找到该日期的净值数据');
        }
      } catch (err) {
        console.error(err);
        setError('获取净值失败');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(getNetValue, 500);
    return () => clearTimeout(timer);
  }, [fund?.code, date]);

  useEffect(() => {
    if (netValue && amount) {
      setShare((parseFloat(amount) / netValue).toFixed(2));
    }
  }, [netValue, amount]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmount(val);
    if (netValue && val) {
      setShare((parseFloat(val) / netValue).toFixed(2));
    } else if (!val) {
      setShare('');
    }
  };

  const handleSubmit = () => {
    if (!type || !date || !netValue || !amount || !share || !fund?.code || !netValueDate) return;

    onConfirm({
      fundCode: fund.code,
      type,
      date: netValueDate,
      amount: parseFloat(amount),
      share: parseFloat(share),
      price: netValue,
      timestamp: new Date(netValueDate).getTime()
    });
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose?.();
    }
  };

  const handleCloseClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onClose?.();
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="glass card modal max-w-[420px] w-[90vw] !z-[9999] p-5"
        overlayClassName="modal-overlay"
        overlayStyle={{ zIndex: 9998 }}
      >
        <DialogTitle className="sr-only">添加历史记录</DialogTitle>

        <div className="flex items-center justify-between mb-5 font-semibold text-base text-foreground">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-primary" />
            <span>添加历史记录</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCloseClick}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="mb-4">
          <div className="font-semibold text-base text-foreground mb-1">{fund?.name}</div>
          <div className="text-xs text-muted-foreground tabular-nums">#{fund?.code}</div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">
              交易类型 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={type === 'buy' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setType('buy')}
                className={`h-9 text-xs font-medium transition-[background-color,color] duration-150 ease-out ${
                  type === 'buy'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                买入
              </Button>
              <Button
                type="button"
                variant={type === 'sell' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setType('sell')}
                className={`h-9 text-xs font-medium transition-[background-color,color] duration-150 ease-out ${
                  type === 'sell'
                    ? 'bg-destructive text-destructive-foreground font-semibold shadow-sm'
                    : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                卖出
              </Button>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">
              交易日期 <span className="text-red-500">*</span>
            </label>
            <DatePicker value={date} onChange={setDate} />
            {loading && <div className="text-xs text-muted-foreground mt-1">正在获取净值...</div>}
            {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
            {netValue && !loading && (
              <div className="text-xs text-emerald-400 mt-1 tabular-nums">
                参考净值: {netValue} ({netValueDate})
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">
              金额 <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              inputMode="decimal"
              className="text-[16PX] md:text-sm tabular-nums"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              step="0.01"
              disabled={!netValue}
            />
          </div>

          {share && (
            <div className="p-2.5 rounded-lg bg-white/5 border border-border flex justify-between text-xs text-muted-foreground">
              <span>折算份额:</span>
              <span className="font-semibold text-foreground tabular-nums">{share} 份</span>
            </div>
          )}

          <div className="text-[11PX] text-muted-foreground leading-relaxed pt-3 border-t border-border">
            * 此处补录的买入/卖出仅作记录展示，不会改变当前持仓金额与份额；实际持仓请在持仓设置中维护。
          </div>

          <div className="flex gap-3 pt-2">
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
              disabled={!type || !date || !netValue || !amount || !share || loading}
              onClick={handleSubmit}
              className="flex-1 bg-primary text-primary-foreground font-medium"
            >
              确认添加
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
