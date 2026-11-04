'use client';

import * as React from 'react';
import { isArray, isFunction } from 'lodash';
import { useIsMobile } from '@/app/hooks/useIsMobile';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { formatMoney } from '@/lib/utils';

export interface SparklinePoint {
  earnings?: number | string;
  value?: number | string;
  [key: string]: any;
}

export interface GroupAccountSummaryCardProps {
  onActivate?: () => void;
  groupName?: string;
  totalAsset?: number | null;
  holdingReturn?: number | null;
  holdingReturnPercent?: number;
  accountReturn?: number | null;
  accountReturnPercent?: number;
  hasAnyTodayData?: boolean;
  upCount?: number;
  downCount?: number;
  sparkSeries?: SparklinePoint[];
  masked?: boolean;
}

function formatSignedAmount(value: number | null | undefined, decimals = 2) {
  if (value == null || !Number.isFinite(value)) return '—';
  const r = Number(value.toFixed(decimals));
  const abs = formatMoney(Math.abs(r), decimals);
  if (r > 0) return `+${abs}`;
  if (r < 0) return `-${abs}`;
  return abs;
}

function formatSignedPercent(pct: number | undefined, decimals = 2) {
  if (pct == null || !Number.isFinite(pct)) return '—';
  const r = Number(pct.toFixed(decimals));
  const abs = Math.abs(r).toFixed(decimals);
  if (r > 0) return `+${abs}%`;
  if (r < 0) return `-${abs}%`;
  return `${abs}%`;
}

function formatAmountPlain(value: number | null | undefined, decimals = 2) {
  if (value == null || !Number.isFinite(value)) return '—';
  return formatMoney(Math.abs(value), decimals);
}

function roundedForDisplayTone(v: number | null | undefined, decimals = 2) {
  if (v == null || !Number.isFinite(v)) return null;
  return Number(v.toFixed(decimals));
}

function toneSignedAmount(v: number | null | undefined, decimals = 2) {
  const r = roundedForDisplayTone(v, decimals);
  if (r == null || r === 0) {
    return { className: 'muted', color: 'var(--muted)' };
  }
  if (r > 0) {
    return { className: 'up', color: 'var(--danger)' };
  }
  return { className: 'down', color: 'var(--success)' };
}

function tonePercent(pct: number | undefined, decimals = 2) {
  const r = roundedForDisplayTone(pct, decimals);
  if (r == null || r === 0) {
    return { className: 'muted', color: 'var(--muted)' };
  }
  if (r > 0) {
    return { className: 'up', color: 'var(--danger)' };
  }
  return { className: 'down', color: 'var(--success)' };
}

function GroupCardTitleIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M5 6.5C5 5.67157 5.67157 5 6.5 5H9.17157C9.70201 5 10.2107 5.21071 10.5858 5.58579L11.4142 6.41421C11.7893 6.78929 12.298 7 12.8284 7H17.5C18.3284 7 19 7.67157 19 8.5V17.5C19 18.3284 18.3284 19 17.5 19H6.5C5.67157 19 5 18.3284 5 17.5V6.5Z"
        stroke="var(--primary)"
        strokeWidth="1.35"
        strokeLinejoin="round"
        fill="var(--primary)"
        fillOpacity={0.1}
      />
      <path
        d="M7.5 14.5L10 12l2 2.5L16.5 9"
        stroke="var(--primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16.5" cy="9" r="1.15" fill="var(--primary)" />
      <circle cx="12" cy="14.5" r="1.15" fill="var(--primary)" />
      <circle cx="10" cy="12" r="1.15" fill="var(--primary)" />
      <circle cx="7.5" cy="14.5" r="1.15" fill="var(--primary)" />
    </svg>
  );
}

function Sparkline({ series, className = '' }: { series?: SparklinePoint[]; className?: string }) {
  if (!isArray(series) || series.length < 2) return null;
  const values = series.map((p) => Number(p?.earnings ?? p?.value)).filter((n) => Number.isFinite(n));
  if (values.length < 2) return null;
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const w = 96;
  const h = 40;
  const pad = 2;
  const innerW = w - 2 * pad;
  const innerH = h - 2 * pad;
  const pts = series.map((p, i) => {
    const v = Number(p?.earnings ?? p?.value);
    const t = series.length > 1 ? i / (series.length - 1) : 0;
    const x = pad + t * innerW;
    const y = pad + (1 - (v - min) / (max - min)) * innerH;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  });
  const last = values[values.length - 1];
  const first = values[0];
  const stroke = last >= first ? 'var(--danger)' : 'var(--success)';
  return (
    <svg width={w} height={h} className={className} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <path d={pts.join(' ')} fill="none" stroke={stroke} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function GroupAccountSummaryCard({
  onActivate,
  groupName,
  totalAsset,
  holdingReturn,
  holdingReturnPercent,
  accountReturn,
  accountReturnPercent,
  hasAnyTodayData = false,
  upCount = 0,
  downCount = 0,
  sparkSeries = [],
  masked = false
}: GroupAccountSummaryCardProps) {
  const isMobile = useIsMobile();
  const holdingTone = toneSignedAmount(holdingReturn, 2);
  const holdingPctTone = tonePercent(holdingReturnPercent, 2);
  const accountTone = hasAnyTodayData
    ? toneSignedAmount(accountReturn, 2)
    : { className: 'muted', color: 'var(--muted)' };
  const accountPctTone = hasAnyTodayData
    ? tonePercent(accountReturnPercent, 2)
    : { className: 'muted', color: 'var(--muted)' };

  const interactive = isFunction(onActivate);

  return (
    <div
      className="glass card"
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `切换到${groupName || '分组'}` : undefined}
      onClick={interactive ? () => onActivate() : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onActivate();
              }
            }
          : undefined
      }
      style={{
        marginBottom: 8,
        padding: isMobile ? '12px 14px' : '14px 16px',
        background: 'var(--card)',
        borderRadius: 12,
        border: '1px solid var(--border)',
        boxShadow: '0 2px 5px rgba(50, 50, 93, 0.05), 0 1px 1px rgba(0, 0, 0, 0.03)',
        cursor: interactive ? 'pointer' : undefined,
        outlineOffset: interactive ? 2 : undefined
      }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex shrink-0 leading-none" aria-hidden>
            <GroupCardTitleIcon size={isMobile ? 20 : 22} />
          </span>
          <span className="font-semibold text-base truncate text-foreground">{groupName}</span>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 text-sm tabular-nums font-medium">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="up">
                {upCount}
                <span className="ml-0.5">▲</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>估算上涨</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="down">
                {downCount}
                <span className="ml-0.5">▼</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>估算下跌</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="flex justify-between items-end mb-2">
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-0.5">账户资产</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
            {masked ? <span className="mask-text">******</span> : formatAmountPlain(totalAsset ?? 0, 2)}
          </div>
        </div>
        <Sparkline series={sparkSeries} />
      </div>

      <div className="flex justify-between gap-2.5 md:gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-muted-foreground mb-0.5">持有收益</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`${holdingTone.className} text-lg font-bold font-mono tabular-nums`}
              style={{ color: holdingTone.color }}
            >
              {masked ? <span className="mask-text">******</span> : formatSignedAmount(holdingReturn ?? 0, 2)}
            </span>
            {!masked && (
              <span
                className={`${holdingPctTone.className} text-xs font-semibold px-1.5 py-0.5 rounded-md bg-white/5 tabular-nums font-mono`}
                style={{ color: holdingPctTone.color }}
              >
                {formatSignedPercent(holdingReturnPercent, 2)}
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0 text-right">
          <div className="text-sm font-medium text-muted-foreground mb-0.5">当日收益</div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <span
              className={`${accountTone.className} text-lg font-bold font-mono tabular-nums`}
              style={{ color: accountTone.color }}
            >
              {masked ? (
                <span className="mask-text">******</span>
              ) : !hasAnyTodayData ? (
                '--'
              ) : (
                formatSignedAmount(accountReturn ?? 0, 2)
              )}
            </span>
            {!masked && hasAnyTodayData && (
              <span
                className={`${accountPctTone.className} text-xs font-semibold px-1.5 py-0.5 rounded-md bg-white/5 tabular-nums font-mono`}
                style={{ color: accountPctTone.color }}
              >
                {formatSignedPercent(accountReturnPercent, 2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
