'use client';

import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { isFunction } from 'lodash';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Settings2, X, ArrowLeftRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { DatePicker } from './Common';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ =
  typeof Intl !== 'undefined' && Intl.DateTimeFormat
    ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai'
    : 'Asia/Shanghai';

export interface HoldingEditFund {
  code: string;
  name?: string;
  dwjz?: number | string;
  gsz?: number | string;
  [key: string]: any;
}

export interface HoldingRecord {
  id?: string | number;
  share?: number | string;
  cost?: number | string;
  firstPurchaseDate?: string;
  [key: string]: any;
}

export interface SaveHoldingPayload {
  share: number;
  cost: number;
  firstPurchaseDate?: string;
}

export interface HoldingEditModalProps {
  fund: HoldingEditFund | null;
  holding?: HoldingRecord | null;
  nav?: number;
  onClose: () => void;
  onSave: (payload: SaveHoldingPayload) => void;
  onOpenTrade?: () => void;
}

export default function HoldingEditModal({ fund, holding, nav, onClose, onSave, onOpenTrade }: HoldingEditModalProps) {
  const [mode, setMode] = useState<'amount' | 'share'>('amount');
  const [dateMode, setDateMode] = useState<'date' | 'days'>('date');

  const dwjz = Number(nav ?? (fund?.dwjz || fund?.gsz || 0));
  const dwjzRef = useRef<number>(dwjz);
  useEffect(() => {
    dwjzRef.current = dwjz;
  }, [dwjz]);

  const [share, setShare] = useState<string>('');
  const [cost, setCost] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [profit, setProfit] = useState<string>('');
  const [firstPurchaseDate, setFirstPurchaseDate] = useState<string>('');
  const [holdingDaysInput, setHoldingDaysInput] = useState<string>('');

  const holdingSig = useMemo(() => {
    if (!holding) return '';
    return `${holding.id ?? ''}|${holding.share ?? ''}|${holding.cost ?? ''}|${holding.firstPurchaseDate ?? ''}`;
  }, [holding]);

  useEffect(() => {
    if (holding) {
      const s = Number(holding.share || 0);
      const c = Number(holding.cost || 0);
      setShare(String(s));
      setCost(String(c));
      setFirstPurchaseDate(holding.firstPurchaseDate || '');

      if (holding.firstPurchaseDate) {
        const days = dayjs.tz(undefined, TZ).diff(dayjs.tz(holding.firstPurchaseDate, TZ), 'day');
        setHoldingDaysInput(days > 0 ? String(days) : '');
      } else {
        setHoldingDaysInput('');
      }

      const price = dwjzRef.current;
      if (price > 0) {
        const a = s * price;
        const p = (price - c) * s;
        setAmount(a.toFixed(2));
        setProfit(p.toFixed(2));
      }
    }
  }, [holding, holdingSig]);

  const handleModeChange = (newMode: 'amount' | 'share') => {
    if (newMode === mode) return;
    setMode(newMode);

    if (newMode === 'share') {
      if (amount && dwjz > 0) {
        const a = parseFloat(amount);
        const p = parseFloat(profit || '0');
        const s = a / dwjz;
        const principal = a - p;
        const c = s > 0 ? principal / s : 0;

        setShare(Number(s.toFixed(6)).toString());
        setCost(Number(c.toFixed(6)).toString());
      }
    } else {
      if (share && dwjz > 0) {
        const s = parseFloat(share);
        const c = parseFloat(cost || '0');
        const a = s * dwjz;
        const p = (dwjz - c) * s;

        setAmount(a.toFixed(2));
        setProfit(p.toFixed(2));
      }
    }
  };

  const handleDateModeToggle = () => {
    const newMode = dateMode === 'date' ? 'days' : 'date';
    setDateMode(newMode);

    if (newMode === 'days' && firstPurchaseDate) {
      const days = dayjs.tz(undefined, TZ).diff(dayjs.tz(firstPurchaseDate, TZ), 'day');
      setHoldingDaysInput(days > 0 ? String(days) : '');
    } else if (newMode === 'date' && holdingDaysInput) {
      const days = parseInt(holdingDaysInput, 10);
      if (Number.isFinite(days) && days >= 0) {
        const date = dayjs.tz(undefined, TZ).subtract(days, 'day').format('YYYY-MM-DD');
        setFirstPurchaseDate(date);
      }
    }
  };

  const handleHoldingDaysChange = (value: string) => {
    setHoldingDaysInput(value);
    const days = parseInt(value, 10);
    if (Number.isFinite(days) && days >= 0) {
      const date = dayjs.tz(undefined, TZ).subtract(days, 'day').format('YYYY-MM-DD');
      setFirstPurchaseDate(date);
    }
  };

  const handleFirstPurchaseDateChange = (value: string) => {
    setFirstPurchaseDate(value);
    if (value) {
      const days = dayjs.tz(undefined, TZ).diff(dayjs.tz(value, TZ), 'day');
      setHoldingDaysInput(days > 0 ? String(days) : '');
    } else {
      setHoldingDaysInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalShare = 0;
    let finalCost = 0;

    if (mode === 'share') {
      if (!share || !cost) return;
      finalShare = Number(Number(share).toFixed(2));
      finalCost = Number(cost);
    } else {
      if (!amount || !dwjz) return;
      const a = Number(amount);
      const p = Number(profit || '0');
      const rawShare = a / dwjz;
      finalShare = Number(rawShare.toFixed(6));
      const principal = a - p;
      finalCost = finalShare > 0 ? principal / finalShare : 0;
    }

    const trimmedDate = firstPurchaseDate ? firstPurchaseDate.trim() : '';

    onSave({
      share: finalShare,
      cost: finalCost,
      ...(trimmedDate && { firstPurchaseDate: trimmedDate })
    });
    onClose();
  };

  const isValid =
    mode === 'share'
      ? share && cost && !isNaN(Number(share)) && !isNaN(Number(cost))
      : amount && !isNaN(Number(amount)) && (!profit || !isNaN(Number(profit))) && dwjz > 0;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose?.();
    }
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="glass card modal max-w-[400px] w-[90vw] !z-[999] p-5"
        overlayClassName="modal-overlay"
      >
        <DialogTitle className="sr-only">设置持仓</DialogTitle>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            <span className="font-semibold text-base text-foreground">设置持仓</span>
            {isFunction(onOpenTrade) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenTrade}
                className="h-7 px-2.5 rounded-full text-xs bg-white/5 border-border text-primary hover:bg-white/10"
              >
                今日买入？去加仓
              </Button>
            )}
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

        <div className="mb-4">
          <div className="font-semibold text-base text-foreground mb-1">{fund?.name}</div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground tabular-nums">#{fund?.code}</span>
            <Badge variant="outline" className="bg-white/5 border-border text-muted-foreground font-normal">
              最新净值：<span className="font-semibold text-primary ml-1 tabular-nums">{dwjz}</span>
            </Badge>
          </div>
        </div>

        <div className="mb-5 bg-white/5 p-1 rounded-xl flex gap-1">
          <Button
            type="button"
            variant={mode === 'amount' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleModeChange('amount')}
            className={`flex-1 h-8 rounded-lg text-sm font-medium ${
              mode === 'amount'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            按金额
          </Button>
          <Button
            type="button"
            variant={mode === 'share' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleModeChange('share')}
            className={`flex-1 h-8 rounded-lg text-sm font-medium ${
              mode === 'share'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            按份额
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'amount' ? (
            <>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">
                  持有金额 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  className="tabular-nums text-[16PX] md:text-sm"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="请输入持有总金额"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">持有收益</label>
                <Input
                  type="number"
                  step="any"
                  className="tabular-nums text-[16PX] md:text-sm"
                  value={profit}
                  onChange={(e) => setProfit(e.target.value)}
                  placeholder="请输入持有总收益 (可为负)"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">
                  持有份额 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  className="tabular-nums text-[16PX] md:text-sm"
                  value={share}
                  onChange={(e) => setShare(e.target.value)}
                  placeholder="请输入持有份额"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">
                  持仓成本价 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  className="tabular-nums text-[16PX] md:text-sm"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="请输入持仓成本价"
                  required
                />
              </div>
            </>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">{dateMode === 'date' ? '首次买入日期' : '持有天数'}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDateModeToggle}
                    className="h-6 px-2 text-xs flex items-center gap-1 text-primary hover:bg-white/5"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    {dateMode === 'date' ? '按天数' : '按日期'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{dateMode === 'date' ? '切换到持有天数' : '切换到日期'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            {dateMode === 'date' ? (
              <DatePicker value={firstPurchaseDate} onChange={handleFirstPurchaseDateChange} position="top" />
            ) : (
              <Input
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                className="tabular-nums text-[16PX] md:text-sm"
                value={holdingDaysInput}
                onChange={(e) => handleHoldingDaysChange(e.target.value)}
                placeholder="请输入持有天数"
              />
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-white/5 border-border hover:bg-white/10 text-foreground"
            >
              取消
            </Button>
            <Button type="submit" disabled={!isValid} className="flex-1 bg-primary text-primary-foreground font-medium">
              保存
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
