'use client';

import * as React from 'react';
import { useEffect, useState, useRef, useMemo } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { RotateCcw, Repeat, Calendar as CalendarIcon, Sparkles, X } from 'lucide-react';
import { DatePicker } from './Common';
import { isBoolean, isNumber, isNil } from 'lodash';
import ConfirmModal from './ConfirmModal';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Segmented } from '@/components/ui/segmented';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { DEFAULT_TZ } from '@/app/constants';
import { formatMoney, cn } from '@/lib/utils';

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

const CYCLE_OPTIONS: { value: DcaCycle; label: string }[] = [
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

const COMMON_AMOUNTS = [100, 200, 500, 1000, 2000];
const COMMON_FEES = ['0', '0.10', '0.12', '0.15'];
const COMMON_MONTH_DAYS = [1, 5, 10, 15, 20, 25, 28];

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
    if (!isNil(plan.amount)) {
      setAmount(String(plan.amount));
    }
    if (!isNil(plan.feeRate)) {
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
    if (plan.cycle && CYCLE_OPTIONS.some((c) => c.value === plan.cycle)) {
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

  const numAmount = parseFloat(amount);
  const numFeeRate = parseFloat(feeRate);

  const isValid = (): boolean => {
    if (!fund?.code || !cycle || !firstDate) return false;
    if (!numAmount || numAmount <= 0) return false;
    if (isNaN(numFeeRate) || numFeeRate < 0) return false;
    if ((cycle === 'weekly' || cycle === 'biweekly') && (weeklyDay < 1 || weeklyDay > 5)) return false;
    if (cycle === 'monthly' && (monthlyDay < 1 || monthlyDay > 28)) return false;
    return true;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isValid()) return;

    onConfirm?.({
      type: 'dca',
      fundCode: fund.code,
      fundName: fund.name,
      amount: numAmount,
      feeRate: numFeeRate,
      cycle,
      firstDate,
      weeklyDay: cycle === 'weekly' || cycle === 'biweekly' ? weeklyDay : null,
      monthlyDay: cycle === 'monthly' ? monthlyDay : null,
      enabled
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && (resetConfirmOpen || Date.now() < ignoreDialogCloseUntilRef.current)) return;
    if (!open) {
      onClose?.();
    }
  };

  // 计划试算摘要信息
  const summaryInfo = useMemo(() => {
    const today = nowInTz().startOf('day');
    const firstDay = dayjs.tz(firstDate, TZ).startOf('day');
    const diffDays = firstDay.diff(today, 'day');

    let countdownText = '今天';
    if (diffDays === 1) countdownText = '明天';
    else if (diffDays === 2) countdownText = '后天';
    else if (diffDays > 2) countdownText = `${diffDays}天后`;
    else if (diffDays < 0) countdownText = '已过去';

    const weekdayCn = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][firstDay.day()];

    let cycleDesc = '';
    let periodsPerYear = 12;
    if (cycle === 'daily') {
      cycleDesc = '每日(交易日)';
      periodsPerYear = 242;
    } else if (cycle === 'weekly') {
      cycleDesc = `每周${WEEKDAY_OPTIONS.find((w) => w.value === weeklyDay)?.label.slice(1) || ''}`;
      periodsPerYear = 50;
    } else if (cycle === 'biweekly') {
      cycleDesc = `每两周${WEEKDAY_OPTIONS.find((w) => w.value === weeklyDay)?.label.slice(1) || ''}`;
      periodsPerYear = 25;
    } else if (cycle === 'monthly') {
      cycleDesc = `每月${monthlyDay}日`;
      periodsPerYear = 12;
    }

    const estimatedFee = numAmount && !isNaN(numFeeRate) ? (numAmount * numFeeRate) / 100 : 0;
    const estimatedAnnual = numAmount ? numAmount * periodsPerYear : 0;

    return {
      cycleDesc,
      countdownText,
      weekdayCn,
      estimatedFee,
      estimatedAnnual
    };
  }, [firstDate, cycle, weeklyDay, monthlyDay, numAmount, numFeeRate]);

  return (
    <>
      {resetConfirmOpen && (
        <ConfirmModal
          title="重置定投数据"
          message={`是否重置「${fund?.name || fund?.code || '该基金'}」在当前分组下的定投数据？确认后将清除该基金在当前分组内的定投设置。`}
          icon={<RotateCcw className="size-5 shrink-0 text-primary" />}
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
          className="glass card modal dca-modal max-w-[420px] max-h-[85vh] flex flex-col !z-[999] w-[90vw] p-5"
          overlayClassName="modal-overlay"
          onPointerDownOutside={(event) => {
            if (resetConfirmOpen || Date.now() < ignoreDialogCloseUntilRef.current) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (resetConfirmOpen || Date.now() < ignoreDialogCloseUntilRef.current) event.preventDefault();
          }}
        >
          <DialogTitle className="sr-only">定投设置</DialogTitle>

          {/* 全局标准统一模态框 Header */}
          <div className="flex items-center justify-between mb-4 font-semibold text-base text-foreground shrink-0">
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
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-40 cursor-pointer"
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
                className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 表单内容滚动区域 */}
          <div className="scrollbar-y-styled overflow-y-auto pr-1 flex-1 space-y-4">
            {/* 基金信息与启停状态栏 */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-border">
              <div className="min-w-0 flex-1 mr-2">
                <div className="font-semibold text-sm text-foreground truncate" title={fund?.name}>
                  {fund?.name || '未知基金'}
                </div>
                <div className="text-xs text-muted-foreground font-mono mt-0.5">#{fund?.code}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-[10px] px-1.5 py-0 h-5 font-normal gap-1 transition-colors',
                    enabled
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                      : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20'
                  )}
                >
                  <span
                    className={cn('size-1.5 rounded-full', enabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500')}
                  />
                  {enabled ? '已开启' : '已暂停'}
                </Badge>
                <Switch
                  checked={enabled}
                  onCheckedChange={setEnabled}
                  className="data-[state=checked]:bg-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 金额输入区 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dca-amount" className="text-xs text-muted-foreground block">
                    定投金额 <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-[11px] text-muted-foreground">扣款日自动生成买入</span>
                </div>

                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm font-semibold text-muted-foreground pointer-events-none select-none">
                    ¥
                  </span>
                  <Input
                    id="dca-amount"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="请输入每次定投金额"
                    className="pl-7 pr-9 h-9 font-semibold tabular-nums text-[16PX] md:text-sm text-foreground bg-white/5 border-border"
                  />
                  {amount && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setAmount('')}
                      className="absolute right-2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="size-3" />
                    </Button>
                  )}
                </div>

                {/* 快捷金额标签 */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COMMON_AMOUNTS.map((val) => {
                    const isSelected = numAmount === val;
                    return (
                      <Button
                        key={val}
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        size="xs"
                        onClick={() => setAmount(String(val))}
                        className={cn(
                          'font-mono text-xs cursor-pointer transition-all h-6.5',
                          isSelected ? 'shadow-xs' : 'text-muted-foreground hover:text-foreground bg-white/5'
                        )}
                      >
                        ¥{val}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* 买入费率 */}
              <div className="p-3 rounded-xl bg-white/5 border border-border flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <Label htmlFor="dca-fee" className="text-xs text-muted-foreground block">
                    买入费率 (%) <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-[11px] text-muted-foreground">普遍一折为 0.12%</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative w-22">
                    <Input
                      id="dca-fee"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={feeRate}
                      onChange={(e) => setFeeRate(e.target.value)}
                      placeholder="0.12"
                      className="pr-6 h-8 text-[16PX] md:text-xs font-mono tabular-nums text-right bg-white/5"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                      %
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {COMMON_FEES.map((rate) => (
                      <Button
                        key={rate}
                        type="button"
                        variant={feeRate === rate ? 'secondary' : 'ghost'}
                        size="xs"
                        onClick={() => setFeeRate(rate)}
                        className={cn(
                          'font-mono text-[11px] px-1.5 h-7 cursor-pointer',
                          feeRate === rate && 'bg-primary/10 text-primary border border-primary/20 font-semibold'
                        )}
                      >
                        {rate}%
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 定投周期选择（Segmented 原语） */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground block">
                  定投周期 <span className="text-destructive">*</span>
                </Label>

                <Segmented<DcaCycle>
                  value={cycle}
                  onChange={(val) => setCycle(val)}
                  options={CYCLE_OPTIONS}
                  size="default"
                  layoutId="dca-cycle-segmented"
                  className="w-full bg-white/5 p-1 rounded-xl border border-border"
                  itemClassName="text-xs font-medium py-1.5"
                />
              </div>

              {/* 周期对应的扣款时机配置 */}
              {(cycle === 'weekly' || cycle === 'biweekly') && (
                <div className="space-y-2 animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground block">
                      扣款星期 <span className="text-destructive">*</span>
                    </Label>
                    <span className="text-[11px] text-muted-foreground">非交易日顺延至次日</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {WEEKDAY_OPTIONS.map((opt) => {
                      const isSelected = weeklyDay === opt.value;
                      return (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setWeeklyDay(opt.value)}
                          className={cn(
                            'text-xs cursor-pointer font-medium h-8',
                            isSelected
                              ? 'shadow-xs font-semibold'
                              : 'bg-white/5 border-border text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {opt.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {cycle === 'monthly' && (
                <div className="space-y-2 animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground block">
                      扣款日 <span className="text-destructive">*</span>
                    </Label>
                    <span className="text-[11px] font-mono text-primary font-medium">当前选中：每月{monthlyDay}日</span>
                  </div>

                  {/* 常用日快捷 Button 栏 */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                    {COMMON_MONTH_DAYS.map((day) => {
                      const isSelected = monthlyDay === day;
                      return (
                        <Button
                          key={day}
                          type="button"
                          variant={isSelected ? 'secondary' : 'outline'}
                          size="xs"
                          onClick={() => setMonthlyDay(day)}
                          className={cn(
                            'font-mono text-xs px-2.5 h-6.5 shrink-0 cursor-pointer bg-white/5 border-border',
                            isSelected && 'bg-primary/15 text-primary border-primary/30 font-semibold'
                          )}
                        >
                          {day}日
                        </Button>
                      );
                    })}
                  </div>

                  {/* 1~28 日历方格矩阵 */}
                  <div className="p-2 bg-white/5 rounded-xl border border-border">
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 28 }).map((_, idx) => {
                        const day = idx + 1;
                        const isSelected = monthlyDay === day;
                        return (
                          <Button
                            key={day}
                            ref={isSelected ? monthlyDayRef : null}
                            type="button"
                            variant={isSelected ? 'default' : 'ghost'}
                            size="xs"
                            onClick={() => setMonthlyDay(day)}
                            className={cn(
                              'h-7 w-full font-mono text-xs tabular-nums cursor-pointer rounded-md p-0',
                              isSelected
                                ? 'shadow-xs font-semibold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            )}
                          >
                            {day}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 首次扣款日 */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground block">首次扣款日期</Label>

                {cycle === 'daily' ? (
                  <DatePicker value={firstDate} onChange={setFirstDate} minDate={nowInTz().format('YYYY-MM-DD')} />
                ) : (
                  <div className="h-9 px-3 flex items-center justify-between rounded-md border border-border bg-white/5 text-xs font-mono text-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="size-4 text-primary" />
                      <span className="font-semibold">{firstDate}</span>
                      <span className="text-muted-foreground font-sans">({summaryInfo.weekdayCn})</span>
                    </div>
                    <Badge variant="secondary" className="text-[11px] px-2 py-0 h-5 font-normal">
                      {summaryInfo.countdownText}
                    </Badge>
                  </div>
                )}
              </div>

              {/* 策略测算与年化投入预览卡片 */}
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Sparkles className="size-3.5" />
                    <span>定投执行规划摘要</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {enabled ? '保存后生效' : '当前处于暂停状态'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-card/60 border border-border/50">
                    <div className="text-[11px] text-muted-foreground">扣款节奏</div>
                    <div className="font-medium text-foreground mt-0.5 truncate">{summaryInfo.cycleDesc}</div>
                  </div>

                  <div className="p-2 rounded-lg bg-card/60 border border-border/50">
                    <div className="text-[11px] text-muted-foreground">首次扣款</div>
                    <div className="font-mono text-foreground mt-0.5 truncate">
                      {firstDate} ({summaryInfo.countdownText})
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-card/60 border border-border/50">
                    <div className="text-[11px] text-muted-foreground">预估单期手续费</div>
                    <div className="font-mono text-foreground mt-0.5">¥{formatMoney(summaryInfo.estimatedFee)}</div>
                  </div>

                  <div className="p-2 rounded-lg bg-card/60 border border-primary/20 bg-primary/5">
                    <div className="text-[11px] text-primary">预估年投入本金</div>
                    <div className="font-mono font-semibold text-primary mt-0.5">
                      ¥{formatMoney(summaryInfo.estimatedAnnual)}
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* 模态框底部 Footer - 统一为标准 PC 右对齐规范 */}
          <div className="pt-3 mt-1 border-t border-border flex items-center justify-end gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 px-4 text-xs font-medium bg-muted/30 border-border hover:bg-muted/60 text-foreground cursor-pointer"
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={!isValid()}
              onClick={() => handleSubmit()}
              className="h-9 px-4.5 text-xs font-medium bg-primary text-primary-foreground shadow-xs cursor-pointer disabled:opacity-40"
            >
              保存定投计划
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
