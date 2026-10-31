'use client';

import React, { useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { CalendarIcon, MinusIcon, PlusIcon, TrendUpIcon, TrendDownIcon } from './Icons';
import { DEFAULT_TZ } from '@/app/constants';

dayjs.extend(utc);
dayjs.extend(timezone);

const getBrowserTimeZone = (): string => {
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || DEFAULT_TZ;
  }
  return DEFAULT_TZ;
};

const TZ = getBrowserTimeZone();
dayjs.tz.setDefault(TZ);
const nowInTz = () => dayjs().tz(TZ);
const toTz = (input?: string | Date) => (input ? dayjs.tz(input, TZ) : nowInTz());
const formatDate = (input?: dayjs.Dayjs) => (input ? input.format('YYYY-MM-DD') : toTz().format('YYYY-MM-DD'));

export interface ConsecutiveTrendBadgeProps {
  trend?: {
    type?: 'up' | 'down' | string;
    days?: number;
  } | null;
}

export function ConsecutiveTrendBadge({ trend }: ConsecutiveTrendBadgeProps) {
  if (!trend || !trend.type || !trend.days || trend.days < 3) return null;

  const isUp = trend.type === 'up';
  // 连涨红(danger)，连跌绿(success)
  const color = isUp ? 'var(--danger)' : 'var(--success)';
  const Icon = isUp ? TrendUpIcon : TrendDownIcon;

  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <span
          className="consecutive-trend-badge"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1px',
            color: color,
            fontSize: '12px',
            fontWeight: 'bold',
            marginRight: '4px',
            verticalAlign: 'middle',
            position: 'relative',
            bottom: '1px',
            cursor: 'default'
          }}
        >
          <Icon width="12" height="12" />
          <span style={{ lineHeight: 1 }}>{trend.days}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        连续{trend.days}天{isUp ? '上涨' : '下跌'}
      </TooltipContent>
    </Tooltip>
  );
}

export interface DatePickerProps {
  value?: string;
  onChange: (dateStr: string) => void;
  position?: 'top' | 'bottom';
  minDate?: string;
}

export function DatePicker({ value, onChange, position = 'bottom', minDate = undefined }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const today = nowInTz().startOf('day');
  const selected = value ? toTz(value).toDate() : undefined;
  const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六'];

  const disabled = minDate ? { before: toTz(minDate).startOf('day').toDate() } : { after: today.toDate() };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" className="input date-picker-trigger w-full justify-between font-normal">
          <span>{value || '选择日期'}</span>
          <CalendarIcon width="16" height="16" className="muted" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="date-picker-dropdown glass card w-auto overflow-hidden p-0 !z-[13000]"
        align="start"
        side={position === 'top' ? 'top' : 'bottom'}
      >
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          captionLayout="dropdown"
          formatters={{
            formatWeekdayName: (date) => weekdayLabels[date.getDay()]
          }}
          classNames={{
            dropdown_root: 'relative rounded-md border-0 shadow-none has-focus:border-0 has-focus:ring-0',
            today:
              'rounded-md bg-primary/15 text-primary data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground'
          }}
          disabled={disabled}
          onSelect={(d) => {
            if (!d) return;
            const next = toTz(d).startOf('day');
            if (minDate && next.isBefore(toTz(minDate).startOf('day'))) return;
            if (!minDate && next.isAfter(today)) return;
            onChange(formatDate(next));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export interface NumericInputProps {
  value: string | number;
  onChange: (value: string) => void;
  step?: number;
  min?: number;
  placeholder?: string;
}

export function NumericInput({ value, onChange, step = 1, min = 0, placeholder }: NumericInputProps) {
  const decimals = String(step).includes('.') ? String(step).split('.')[1].length : 0;
  const fmt = (n: number) => Number(n).toFixed(decimals);
  const inc = () => {
    const v = parseFloat(String(value));
    const base = isNaN(v) ? 0 : v;
    const next = base + step;
    onChange(fmt(next));
  };
  const dec = () => {
    const v = parseFloat(String(value));
    const base = isNaN(v) ? 0 : v;
    const next = Math.max(min, base - step);
    onChange(fmt(next));
  };
  return (
    <div className="relative flex items-center">
      <input
        type="number"
        inputMode="decimal"
        step="any"
        className="input no-zoom tabular-nums text-[16PX] md:text-sm w-full pr-14"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <div className="absolute right-1 top-1 bottom-1 flex flex-col justify-center gap-1">
        <button
          className="icon-button flex items-center justify-center w-10 h-5 hover:bg-white/10 transition-colors rounded cursor-pointer"
          type="button"
          onClick={inc}
          aria-label="增加数值"
        >
          <PlusIcon width="12" height="12" />
        </button>
        <button
          className="icon-button flex items-center justify-center w-10 h-5 hover:bg-white/10 transition-colors rounded cursor-pointer"
          type="button"
          onClick={dec}
          aria-label="减少数值"
        >
          <MinusIcon width="12" height="12" />
        </button>
      </div>
    </div>
  );
}

export interface StatProps {
  label: React.ReactNode;
  value: React.ReactNode;
  delta?: number;
}

export function Stat({ label, value, delta }: StatProps) {
  const dir = delta !== undefined ? (delta > 0 ? 'up' : delta < 0 ? 'down' : '') : '';
  return (
    <div className="stat" style={{ flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <span
        className="label"
        style={{
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--muted)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {label}
      </span>
      <span
        className={`value ${dir} tabular-nums`}
        style={{ fontSize: '17px', fontWeight: 600, lineHeight: 1.25, whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}
      >
        {value}
      </span>
    </div>
  );
}
