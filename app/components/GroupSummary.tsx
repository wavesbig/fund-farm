'use client';

import * as React from 'react';
import { isBoolean, isNumber, isObject } from 'lodash';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useIsMobile } from '@/app/hooks/useIsMobile';
import { PinIcon, PinOffIcon, EyeIcon, EyeOffIcon, SwitchIcon } from './Icons';
import FitText from './FitText';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { formatMoney } from '@/lib/utils';
import { SUMMARY_TAB_ID } from '@/app/constants';
import type { Fund, Holding, Group } from '@/types';

export interface CountUpProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  style?: React.CSSProperties;
  maxFontSize?: number;
  minFontSize?: number;
  as?: 'span' | 'div';
}

// 数字滚动组件（初始化时无动画，后续变更再动画）
function CountUp({
  value,
  prefix = '',
  suffix = '',
  decimals = 2,
  className = '',
  style = {},
  maxFontSize,
  minFontSize,
  as = 'span'
}: CountUpProps) {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const previousValue = useRef<number>(value);
  const isFirstChange = useRef<boolean>(true);
  const rafIdRef = useRef<number | null>(null);
  const displayValueRef = useRef<number>(value);

  useEffect(() => {
    if (previousValue.current === value) return;

    if (isFirstChange.current) {
      isFirstChange.current = false;
      previousValue.current = value;
      displayValueRef.current = value;
      setDisplayValue(value);
      return;
    }

    const start = displayValueRef.current;
    const end = value;
    const duration = 300;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      const current = start + (end - start) * ease;
      displayValueRef.current = current;
      setDisplayValue(current);

      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = value;
        rafIdRef.current = null;
      }
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [value]);

  const text = `${prefix}${formatMoney(Math.abs(displayValue), decimals)}${suffix}`;
  const styleFontSize = isNumber(style.fontSize) ? style.fontSize : parseFloat(String(style.fontSize || ''));
  const resolvedMaxFontSize = maxFontSize ?? (Number.isFinite(styleFontSize) ? styleFontSize : undefined);

  return (
    <FitText
      as={as}
      className={`tabular-nums ${className}`}
      style={style}
      maxFontSize={resolvedMaxFontSize}
      minFontSize={minFontSize}
    >
      {text}
    </FitText>
  );
}

export interface GroupSummaryTotals {
  totalAsset: number;
  totalProfitToday: number;
  totalHoldingReturn: number;
  hasHolding: boolean;
  returnRate: number;
  todayReturnRate: number;
  hasAnyTodayData: boolean;
}

export interface GroupSummaryProps {
  funds: Fund[];
  holdings: Record<string, Holding>;
  portfolioTabId?: string;
  groups?: Group[];
  getProfit: (fundOrCode: any, holdingOrTabId?: any) => any;
  summaryTotalsOverride?: GroupSummaryTotals | null;
  stickyTop?: number;
  isSticky?: boolean;
  onToggleSticky?: (sticky: boolean) => void;
  masked?: boolean;
  onToggleMasked?: () => void;
  shouldShowMarketIndex?: boolean;
  navbarHeight?: number;
}

export default function GroupSummary({
  funds,
  holdings,
  portfolioTabId,
  groups = [],
  getProfit,
  summaryTotalsOverride = null,
  stickyTop,
  isSticky = false,
  onToggleSticky,
  masked,
  onToggleMasked
}: GroupSummaryProps) {
  const isMobile = useIsMobile();
  const [showPercent, setShowPercent] = useState<boolean>(true);
  const [showTodayPercent, setShowTodayPercent] = useState<boolean>(false);
  const [isMasked, setIsMasked] = useState<boolean>(masked ?? false);
  const [isAssetMasked, setIsAssetMasked] = useState<boolean>(false);
  const assetSize = 26;
  const metricSize = 20;

  useEffect(() => {
    if (isBoolean(masked)) {
      setIsMasked(masked);
    }
  }, [masked]);

  const portfolioScopeLabel = useMemo(() => {
    const tab = portfolioTabId;
    if (tab === 'all') return '全部资产';
    if (tab === 'fav') return '自选资产';
    if (tab === SUMMARY_TAB_ID) return '汇总资产';
    const group = (groups || []).find((g) => g.id === tab);
    return group ? `${group.name}资产` : '分组资产';
  }, [portfolioTabId, groups]);

  const derivedSummary = useMemo(() => {
    let totalAsset = 0;
    let totalProfitToday = 0;
    let totalHoldingReturn = 0;
    let totalCost = 0;
    let hasHolding = false;
    let hasAnyTodayData = false;

    (funds || []).forEach((fund) => {
      const holding = holdings?.[fund.code];
      const profit = getProfit(fund, holding);

      if (profit) {
        hasHolding = true;
        totalAsset += Math.round(profit.amount * 100) / 100;
        if (profit.profitToday != null) {
          totalProfitToday += profit.profitToday;
          hasAnyTodayData = true;
        }
        if (profit.profitTotal !== null) {
          totalHoldingReturn += profit.profitTotal;
          if (holding && isNumber(holding.cost) && isNumber(holding.share)) {
            totalCost += Number(holding.cost) * Number(holding.share);
          }
        }
      }
    });

    const roundedTotalProfitToday = Math.round(totalProfitToday * 100) / 100;
    const returnRate = totalCost > 0 ? (totalHoldingReturn / totalCost) * 100 : 0;
    const todayReturnRate = totalCost > 0 ? (roundedTotalProfitToday / totalCost) * 100 : 0;

    return {
      totalAsset,
      totalProfitToday: roundedTotalProfitToday,
      totalHoldingReturn,
      hasHolding,
      returnRate,
      todayReturnRate,
      hasAnyTodayData
    };
  }, [funds, holdings, getProfit]);

  const summary =
    summaryTotalsOverride != null && isObject(summaryTotalsOverride)
      ? {
          totalAsset: summaryTotalsOverride.totalAsset,
          totalProfitToday: summaryTotalsOverride.totalProfitToday,
          totalHoldingReturn: summaryTotalsOverride.totalHoldingReturn,
          hasHolding: summaryTotalsOverride.hasHolding,
          returnRate: summaryTotalsOverride.returnRate,
          todayReturnRate: summaryTotalsOverride.todayReturnRate,
          hasAnyTodayData: summaryTotalsOverride.hasAnyTodayData
        }
      : derivedSummary;

  const style = useMemo(() => {
    const s: React.CSSProperties = {};
    if (isSticky) {
      s.top = `calc(${stickyTop || 0}px + var(--market-index-height, 0px) + 14px)`;
    }
    return s;
  }, [isSticky, stickyTop]);

  if (!summary.hasHolding) return null;

  const todayProfitPrefix = summary.totalProfitToday > 0 ? '+' : summary.totalProfitToday < 0 ? '-' : '';
  const holdingReturnPrefix = summary.totalHoldingReturn > 0 ? '+' : summary.totalHoldingReturn < 0 ? '-' : '';

  return (
    <div className={isSticky ? 'group-summary-sticky' : ''} style={style}>
      <div className="glass card group-summary-card mb-3 p-4 md:px-6 md:py-5 relative rounded-xl border border-border shadow-sm">
        <span
          className="sticky-toggle-btn absolute top-2 right-2 w-7 h-7 p-1.5 opacity-80 rounded-md z-10 text-muted-foreground hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors flex items-center justify-center"
          onClick={() => {
            onToggleSticky?.(!isSticky);
          }}
        >
          {isSticky ? <PinIcon width="14" height="14" /> : <PinOffIcon width="14" height="14" />}
        </span>
        <div className="flex items-end justify-between min-w-0">
          <div className="flex-[4] min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="text-sm font-medium text-muted-foreground tracking-wide" key={portfolioTabId}>
                {portfolioScopeLabel}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="fav-button p-0.5 inline-flex items-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => {
                      if (onToggleMasked) {
                        onToggleMasked();
                      } else {
                        setIsMasked((value) => !value);
                      }
                    }}
                    aria-label={isMasked ? '显示资产' : '隐藏资产'}
                  >
                    {isMasked ? <EyeOffIcon width="15" height="15" /> : <EyeIcon width="15" height="15" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isMasked ? '点击显示所有持仓数据' : '点击隐藏所有持仓数据'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div
              className="text-2xl md:text-3xl font-bold tracking-tight min-w-0 cursor-pointer overflow-hidden tabular-nums"
              onClick={() => setIsAssetMasked((v) => !v)}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="block w-full">
                    {isMasked || isAssetMasked ? (
                      <span className="mask-text relative top-0.5" style={{ fontSize: assetSize }}>
                        ******
                      </span>
                    ) : (
                      <CountUp value={summary.totalAsset} maxFontSize={assetSize} minFontSize={16} as="div" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isMasked || isAssetMasked ? '点击显示资产金额' : '点击隐藏资产金额'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="flex gap-4 flex-[5] min-w-0">
            <div className="text-right flex-1 min-w-0">
              <div className="text-sm font-medium text-muted-foreground mb-1.5 flex justify-end items-center gap-1">
                当日收益{showTodayPercent ? '(%)' : ''} <SwitchIcon className="opacity-70" />
              </div>
              <div
                className={`${
                  summary.hasAnyTodayData
                    ? summary.totalProfitToday > 0
                      ? 'up'
                      : summary.totalProfitToday < 0
                        ? 'down'
                        : 'text-foreground'
                    : 'text-muted-foreground'
                } text-lg md:text-xl font-semibold tracking-tight tabular-nums overflow-hidden ${
                  summary.hasAnyTodayData ? 'cursor-pointer' : 'cursor-default'
                }`}
                onClick={() => summary.hasAnyTodayData && setShowTodayPercent(!showTodayPercent)}
              >
                {summary.hasAnyTodayData ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="block w-full">
                        {isMasked ? (
                          <span className="mask-text" style={{ fontSize: metricSize }}>
                            ******
                          </span>
                        ) : (
                          <>
                            {showTodayPercent ? (
                              <CountUp
                                value={Math.abs(summary.todayReturnRate)}
                                prefix={todayProfitPrefix}
                                suffix="%"
                                maxFontSize={metricSize}
                                minFontSize={14}
                                as="div"
                                style={{ textAlign: 'right' }}
                              />
                            ) : (
                              <CountUp
                                value={Math.abs(summary.totalProfitToday)}
                                prefix={todayProfitPrefix}
                                maxFontSize={metricSize}
                                minFontSize={14}
                                as="div"
                                style={{ textAlign: 'right' }}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>点击切换金额/百分比</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <span className="inline-block" style={{ fontSize: metricSize }}>
                    --
                  </span>
                )}
              </div>
            </div>
            <div className={`text-right ${isMobile ? 'flex-1' : ''} min-w-0`}>
              <div className="text-sm font-medium text-muted-foreground mb-1.5 flex justify-end items-center gap-1">
                持有收益{showPercent ? '(%)' : ''} <SwitchIcon className="opacity-70" />
              </div>
              <div
                className={`${
                  summary.totalHoldingReturn > 0 ? 'up' : summary.totalHoldingReturn < 0 ? 'down' : 'text-foreground'
                } text-lg md:text-xl font-semibold tracking-tight tabular-nums cursor-pointer overflow-hidden`}
                onClick={() => setShowPercent(!showPercent)}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="block w-full">
                      {isMasked ? (
                        <span className="mask-text" style={{ fontSize: metricSize }}>
                          ******
                        </span>
                      ) : (
                        <>
                          {showPercent ? (
                            <CountUp
                              value={Math.abs(summary.returnRate)}
                              prefix={holdingReturnPrefix}
                              suffix="%"
                              maxFontSize={metricSize}
                              minFontSize={14}
                              as="div"
                              style={{ textAlign: 'right' }}
                            />
                          ) : (
                            <CountUp
                              value={Math.abs(summary.totalHoldingReturn)}
                              maxFontSize={metricSize}
                              minFontSize={14}
                              as="div"
                              style={{ textAlign: 'right' }}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>点击切换金额/百分比</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
