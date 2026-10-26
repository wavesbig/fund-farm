'use client';

import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { RotateCcw, Repeat, X } from 'lucide-react';
import { DatePicker, NumericInput } from './Common';
import { isBoolean, isNumber } from 'lodash';
import ConfirmModal from './ConfirmModal';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { DEFAULT_TZ } from '@/app/constants';

dayjs.extend(utc);
dayjs.extend(timezone);

const getBrowserTimeZone = () => {
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || DEFAULT_TZ;
  }
  return DEFAULT_TZ;
};
const TZ = getBrowserTimeZone();
dayjs.tz.setDefault(TZ);
const nowInTz = () => dayjs().tz(TZ);
const formatDate = (input?: string | Date) => dayjs.tz(input, TZ).format('YYYY-MM-DD');

export type DcaCycle = 'daily' | 'weekly' | 'biweekly' | 'monthly';

const CYCLES: { value: DcaCycle; label: string }[] = [
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每周' },
  { value: 'biweekly', label: '每两周' },
  { value: 'monthly', label: '每月' }
];

const WEEKDAY_OPTIONS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' }
];

const computeFirstDate = (cycle: DcaCycle, weeklyDay?: number | null, monthlyDay?: number | null) => {
  const today = nowInTz().startOf('day');

  if (cycle === 'weekly' || cycle === 'biweekly') {
    const todayDay = today.day();
    let target = isNumber(weeklyDay) ? weeklyDay : todayDay;
    if (target < 1 || target > 5) {
      target = 1;
    }
    let candidate = today;
    for (let i = 0; i < 14; i += 1) {
      if (candidate.day() === target && !candidate.isBefore(today)) {
        break;
      }
      candidate = candidate.add(1, 'day');
    }
    return candidate.format('YYYY-MM-DD');
  }

  if (cycle === 'monthly') {
    const baseDay = today.date();
    const day = isNumber(monthlyDay) && monthlyDay >= 1 && monthlyDay <= 28 ? monthlyDay : Math.min(28, baseDay);

    let candidate = today.date(day);
    if (candidate.isBefore(today)) {
      candidate = today.add(1, 'month').date(day);
    }
    return candidate.format('YYYY-MM-DD');
  }

  return formatDate(today.toDate());
};

const resolveDailyFirstDate = (savedFirstDate?: string) => {
  const autoFirstDate = computeFirstDate('daily');
  if (!savedFirstDate) return autoFirstDate;

  return dayjs.tz(savedFirstDate, TZ).isAfter(dayjs.tz(autoFirstDate, TZ)) ? savedFirstDate : autoFirstDate;
};

export interface DcaPlan {
  type?: string;
  fundCode?: string;
  fundName?: string;
  amount?: number | string;
  feeRate?: number | string;
  cycle?: DcaCycle;
  firstDate?: string;
  weeklyDay?: number | null;
  monthlyDay?: number | null;
  enabled?: boolean;
  [key: string]: any;
}

export interface DcaFund {
  code: string;
  name?: string;
  [key: string]: any;
}

export interface DcaModalProps {
  fund: DcaFund | null;
  plan?: DcaPlan | null;
  onClose: () => void;
  onConfirm?: (plan: DcaPlan) => void;
  onReset?: (fundCode?: string) => void;
}

export default function DcaModal({ fund, plan, onClose, onConfirm, onReset }: DcaModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [feeRate, setFeeRate] = useState<string>('0');
  const [cycle, setCycle] = useState<DcaCycle>('monthly');
  const [enabled, setEnabled] = useState<boolean>(true);
  const [resetConfirmOpen, setResetConfirmOpen] = useState<boolean>(false);
  const [weeklyDay, setWeeklyDay] = useState<number>(() => {
    const d = nowInTz().day();
    return d >= 1 && d <= 5 ? d : 1;
  });
  const [monthlyDay, setMonthlyDay] = useState<number>(() => {
    const d = nowInTz().date();
    return d >= 1 && d <= 28 ? d : 1;
  });
  const [firstDate, setFirstDate] = useState<string>(() => computeFirstDate('monthly', null, null));
  const ignoreDialogCloseUntilRef = useRef<number>(0);
  const prevResetConfirmOpenRef = useRef<boolean>(false);
  const monthlyDayRef = useRef<HTMLButtonElement>(null);
  const skipNextAutoComputeRef = useRef<boolean>(false);

  useEffect(() => {
    skipNextAutoComputeRef.current = true;
    if (!plan) {
      setFirstDate(computeFirstDate('monthly', weeklyDay, monthlyDay));
      return;
    }
    if (plan.amount != null) {
      setAmount(String(plan.amount));
    }
    if (plan.feeRate != null) {
      setFeeRate(String(plan.feeRate));
    }
    if (isBoolean(plan.enabled)) {
      setEnabled(plan.enabled);
    }
    if (isNumber(plan.weeklyDay)) {
      setWeeklyDay(plan.weeklyDay);
    }
    if (isNumber(plan.monthlyDay)) {
      setMonthlyDay(plan.monthlyDay);
    }
    if (plan.cycle && CYCLES.some((c) => c.value === plan.cycle)) {
      setCycle(plan.cycle);
      setFirstDate(
        plan.cycle === 'daily'
          ? resolveDailyFirstDate(plan.firstDate)
          : plan.firstDate || computeFirstDate(plan.cycle, plan.weeklyDay, plan.monthlyDay)
      );
    } else {
      setFirstDate(plan.firstDate || computeFirstDate('monthly', null, null));
    }
  }, [plan, weeklyDay, monthlyDay]);

  useEffect(() => {
    if (skipNextAutoComputeRef.current) {
      skipNextAutoComputeRef.current = false;
      return;
    }
    if (cycle === 'daily') return;
    setFirstDate(computeFirstDate(cycle, weeklyDay, monthlyDay));
  }, [cycle, weeklyDay, monthlyDay]);

  useEffect(() => {
    if (cycle !== 'monthly') return;
    if (monthlyDayRef.current) {
      try {
        monthlyDayRef.current.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      } catch {}
    }
  }, [cycle, monthlyDay]);

  useEffect(() => {
    if (resetConfirmOpen) {
      ignoreDialogCloseUntilRef.current = Date.now() + 1200;
    } else if (prevResetConfirmOpenRef.current) {
      ignoreDialogCloseUntilRef.current = Date.now() + 1200;
    }
    prevResetConfirmOpenRef.current = resetConfirmOpen;
  }, [resetConfirmOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    const rate = parseFloat(feeRate);
    if (!fund?.code) return;
    if (!amt || amt <= 0) return;
    if (isNaN(rate) || rate < 0) return;
    if (!cycle) return;
    if ((cycle === 'weekly' || cycle === 'biweekly') && (weeklyDay < 1 || weeklyDay > 5)) return;
    if (cycle === 'monthly' && (monthlyDay < 1 || monthlyDay > 28)) return;

    onConfirm?.({
      type: 'dca',
      fundCode: fund.code,
      fundName: fund.name,
      amount: amt,
      feeRate: rate,
      cycle,
      firstDate,
      weeklyDay: cycle === 'weekly' || cycle === 'biweekly' ? weeklyDay : null,
      monthlyDay: cycle === 'monthly' ? monthlyDay : null,
      enabled
    });
  };

  const isValid = (): boolean => {
    const amt = parseFloat(amount);
    const rate = parseFloat(feeRate);
    if (!fund?.code || !cycle || !firstDate) return false;
    if (!(amt > 0) || isNaN(rate) || rate < 0) return false;
    if ((cycle === 'weekly' || cycle === 'biweekly') && (weeklyDay < 1 || weeklyDay > 5)) return false;
    if (cycle === 'monthly' && (monthlyDay < 1 || monthlyDay > 28)) return false;
    return true;
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && (resetConfirmOpen || Date.now() < ignoreDialogCloseUntilRef.current)) return;
    if (!open) {
      onClose?.();
    }
  };

  return (
    <>
      {resetConfirmOpen && (
        <ConfirmModal
          title="重置定投数据"
          message={`是否重置「${fund?.name || fund?.code || '该基金'}」在当前分组下的定投数据？确认后将清除该基金在当前分组内的定投设置。`}
          icon={<RotateCcw className="w-5 h-5 shrink-0 text-primary" />}
          confirmText="确认重置"
          confirmVariant="danger"
          onCancel={() => setResetConfirmOpen(false)}
          onConfirm={() => {
            setResetConfirmOpen(false);
            onReset?.(fund?.code);
          }}
        />
      )}
      <Dialog open onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="glass card modal dca-modal max-w-[420px] max-h-[90vh] flex flex-col !z-[999] w-[90vw] p-5"
          overlayClassName="modal-overlay"
          onPointerDownOutside={(event) => {
            if (resetConfirmOpen || Date.now() < ignoreDialogCloseUntilRef.current) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (resetConfirmOpen || Date.now() < ignoreDialogCloseUntilRef.current) event.preventDefault();
          }}
        >
          <DialogTitle className="sr-only">定投设置</DialogTitle>
          <div className="scrollbar-y-styled overflow-y-auto pr-1 flex-1">
            <div className="flex items-center justify-between mb-5 font-semibold text-base text-foreground">
              <div className="flex items-center gap-2">
                <Repeat className="w-5 h-5 text-primary" />
                <span>定投设置</span>
              </div>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setResetConfirmOpen(true)}
                      disabled={!plan}
                      className="h-8 w-8 text-primary disabled:opacity-40"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="z-[1010]">
                    <p>{plan ? '重置当前分组定投数据' : '暂无定投数据可重置'}</p>
                  </TooltipContent>
                </Tooltip>
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
            </div>

            <div className="mb-4">
              <div className="font-semibold text-base text-foreground mb-1">{fund?.name}</div>
              <div className="text-xs text-muted-foreground tabular-nums">#{fund?.code}</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-border">
                <span className="text-sm font-medium text-foreground">是否启用定投</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{enabled ? '已启用' : '已暂停'}</span>
                  <Switch checked={enabled} onCheckedChange={setEnabled} />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">
                  定投金额 <span className="text-red-500">*</span>
                </label>
                <div
                  className={`rounded-xl ${!amount || parseFloat(amount) <= 0 ? 'border border-red-500' : 'border border-border'}`}
                >
                  <NumericInput
                    value={amount}
                    onChange={setAmount}
                    step={100}
                    min={0}
                    placeholder="请输入每次定投金额"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">
                    买入费率 (%) <span className="text-red-500">*</span>
                  </label>
                  <div className={`rounded-xl ${feeRate === '' ? 'border border-red-500' : 'border border-border'}`}>
                    <NumericInput value={feeRate} onChange={setFeeRate} step={0.1} min={0} placeholder="0.12" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">
                    定投周期 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-xl">
                    {CYCLES.map((opt) => (
                      <Button
                        key={opt.value}
                        type="button"
                        variant={cycle === opt.value ? 'default' : 'ghost'}
                        size="xs"
                        onClick={() => setCycle(opt.value)}
                        className={`h-7 text-xs ${
                          cycle === opt.value
                            ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {(cycle === 'weekly' || cycle === 'biweekly') && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">
                    扣款星期 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {WEEKDAY_OPTIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        type="button"
                        variant={weeklyDay === opt.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setWeeklyDay(opt.value)}
                        className={`h-8 text-xs ${
                          weeklyDay === opt.value
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'bg-white/5 border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {cycle === 'monthly' && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">
                    扣款日 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-7 gap-1 max-h-36 overflow-y-auto scrollbar-y-styled p-1 bg-white/5 rounded-xl border border-border">
                    {Array.from({ length: 28 }).map((_, idx) => {
                      const day = idx + 1;
                      const active = monthlyDay === day;
                      return (
                        <Button
                          key={day}
                          ref={active ? monthlyDayRef : null}
                          type="button"
                          variant={active ? 'default' : 'ghost'}
                          size="xs"
                          onClick={() => setMonthlyDay(day)}
                          className={`h-7 text-xs tabular-nums ${
                            active
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
                          }`}
                        >
                          {day}日
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">首次扣款日期</label>
                {cycle === 'daily' ? (
                  <DatePicker value={firstDate} onChange={setFirstDate} minDate={nowInTz().format('YYYY-MM-DD')} />
                ) : (
                  <div className="h-9 px-3 flex items-center rounded-md border border-border bg-white/5 text-sm tabular-nums text-foreground">
                    {firstDate}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {cycle === 'daily'
                    ? '* 选择首次扣款日期（不能晚于今天）'
                    : '* 基于当前日期和所选周期自动计算：每日=当天；每周/每两周=最近的工作日；每月=最近的所选日。'}
                </div>
              </div>
            </form>
          </div>

          <div className="pt-3 mt-1 border-t border-border flex gap-3">
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
              disabled={!isValid()}
              onClick={handleSubmit}
              className="flex-1 bg-primary text-primary-foreground font-medium"
            >
              保存定投
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
