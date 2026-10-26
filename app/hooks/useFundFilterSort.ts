'use client';

import { useState, useRef, useEffect, useMemo, useDeferredValue } from 'react';
import dayjs from 'dayjs';
import { isArray, isNumber, isString, isPlainObject } from 'lodash';
import { asyncPool } from '@/app/lib/asyncHelper';
import { fetchFundPeriodReturns } from '@/app/api/fund';
import { isNavUpdated } from '@/app/lib/fundHelpers';
import { SUMMARY_TAB_ID } from '@/app/constants';
import type { Fund, FundGroup, Holding, DailyEarningItem } from '@/types';

export interface UseFundFilterSortOptions {
  funds: Fund[];
  currentTab: string;
  favorites: Set<string>;
  activeGroupCodeSet: Set<string> | null;
  shouldShowGroupFundSearch: boolean;
  deferredGroupFundSearchTerm: string;
  fundTagListsByCode?: Record<string, any[]>;
  groups: FundGroup[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  holdingsForTabWithLinked: Record<string, Holding>;
  getHoldingProfitForTab: (fund: Fund, holding?: Holding) => any;
  todayStr: string;
  currentFundDailyEarnings?: Record<string, DailyEarningItem[]>;
}

export interface UseFundFilterSortReturn {
  scopedFunds: Fund[];
  displayFundsRaw: Fund[];
  displayFunds: Fund[];
  fundExtraDataByCode: Record<string, any>;
}

export function useFundFilterSort({
  funds,
  currentTab,
  favorites,
  activeGroupCodeSet,
  shouldShowGroupFundSearch,
  deferredGroupFundSearchTerm,
  fundTagListsByCode,
  groups,
  sortBy,
  sortOrder,
  holdingsForTabWithLinked,
  getHoldingProfitForTab,
  todayStr,
  currentFundDailyEarnings
}: UseFundFilterSortOptions): UseFundFilterSortReturn {
  // 当前 tab 作用域下的基金（不包含“列表搜索”过滤）
  const scopedFunds = useMemo(() => {
    return funds.filter((f) => {
      if (currentTab === 'all') return true;
      if (currentTab === 'fav') return favorites.has(f.code);
      if (!activeGroupCodeSet) return true;
      return activeGroupCodeSet.has(f.code);
    });
  }, [funds, currentTab, favorites, activeGroupCodeSet]);

  const [fundExtraDataByCode, setFundExtraDataByCode] = useState<Record<string, any>>({});
  const fundExtraDataCacheRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    // 始终尝试为当前列表基金获取额外数据（阶段涨跌幅、连涨连跌），用于展示图标或排序
    const codes = scopedFunds.map((f) => f.code);
    if (codes.length === 0) return;

    let cancelled = false;
    const missing: string[] = [];
    const cachedBatch: Record<string, any> = {};

    for (const code of codes) {
      if (!fundExtraDataCacheRef.current.has(code)) {
        missing.push(code);
      } else {
        cachedBatch[code] = fundExtraDataCacheRef.current.get(code);
      }
    }

    if (Object.keys(cachedBatch).length > 0) {
      setFundExtraDataByCode((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [code, value] of Object.entries(cachedBatch)) {
          if (next[code] !== value) {
            next[code] = value;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }

    if (missing.length === 0) return;

    (async () => {
      // 这里的 fetchFundPeriodReturns 已包含阶段涨跌幅和连涨连跌数据
      await asyncPool(4, missing, async (code: string) => {
        const value = await fetchFundPeriodReturns(code);
        fundExtraDataCacheRef.current.set(code, value);
        if (cancelled) return;
        setFundExtraDataByCode((prev) => {
          if (prev[code] === value) return prev;
          return { ...prev, [code]: value };
        });
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [scopedFunds]);

  // 过滤和排序后的基金列表（包含“列表搜索”过滤）
  const displayFundsRaw = useMemo(() => {
    let filtered = [...scopedFunds];

    const q = String(shouldShowGroupFundSearch ? (deferredGroupFundSearchTerm ?? '') : '').trim();
    if (q) {
      const qLower = q.toLowerCase();
      filtered = filtered.filter((f) => {
        const name = String(f?.name ?? '').toLowerCase();
        const code = String(f?.code ?? '').toLowerCase();
        let hasTagMatch = false;
        if (f?.code && Array.isArray(fundTagListsByCode?.[f.code])) {
          hasTagMatch = fundTagListsByCode[f.code].some(
            (t) => t?.name && String(t.name).toLowerCase().includes(qLower)
          );
        }
        return name.includes(qLower) || code.includes(qLower) || hasTagMatch;
      });
    }

    if (currentTab !== 'all' && currentTab !== 'fav' && currentTab !== SUMMARY_TAB_ID && sortBy === 'default') {
      const group = groups.find((g) => g.id === currentTab);
      if (group && group.codes) {
        const codeMap = new Map(group.codes.map((code, index) => [code, index]));
        filtered.sort((a, b) => {
          const indexA = codeMap.get(a.code) ?? Number.MAX_SAFE_INTEGER;
          const indexB = codeMap.get(b.code) ?? Number.MAX_SAFE_INTEGER;
          return indexA - indexB;
        });
      }
    }

    const profitByCode =
      sortBy === 'holdingAmount' || sortBy === 'holdingRatio' || sortBy === 'todayProfit' || sortBy === 'holding'
        ? new Map(filtered.map((f) => [f.code, getHoldingProfitForTab(f, holdingsForTabWithLinked[f.code])]))
        : null;

    const estimateProfitByCode =
      sortBy === 'estimateProfit'
        ? new Map(
            filtered.map((f) => {
              const hasTodayData = isNavUpdated(f.jzrq, todayStr, f.confirmDays);
              const holding = holdingsForTabWithLinked[f.code];
              const profit = getHoldingProfitForTab(f, holding);
              const total = profit ? profit.profitTotal : null;
              if (hasTodayData) return [f.code, total];

              const principal =
                holding && isNumber(holding.cost) && isNumber(holding.share) ? holding.cost * holding.share : 0;
              const hasTodayEstimate = !f.noValuation && isString(f.gztime) && f.gztime.startsWith(todayStr);
              const estimateChangeValue = f.noValuation ? null : isNumber(f.gszzl) ? Number(f.gszzl) : null;
              const holdingProfitPercentValue = total != null && principal > 0 ? (total / principal) * 100 : null;
              const hasEstimatePercent = hasTodayEstimate && estimateChangeValue != null;
              const hasHoldingPercent = holdingProfitPercentValue != null;
              const fallbackEstimateProfitPercentValue =
                hasEstimatePercent || hasHoldingPercent
                  ? (hasEstimatePercent ? estimateChangeValue : 0) + (hasHoldingPercent ? holdingProfitPercentValue : 0)
                  : null;

              const val =
                fallbackEstimateProfitPercentValue != null && principal > 0
                  ? principal * (fallbackEstimateProfitPercentValue / 100)
                  : null;
              return [f.code, val];
            })
          )
        : null;

    return filtered.sort((a, b) => {
      if (sortBy === 'yield') {
        const getYieldValue = (fund: Fund) => {
          if (fund.noValuation) {
            return { value: 0, hasValue: false };
          }
          if (isNumber(fund.gszzl)) {
            return { value: Number(fund.gszzl), hasValue: true };
          }
          return { value: 0, hasValue: false };
        };

        const { value: valA, hasValue: hasA } = getYieldValue(a);
        const { value: valB, hasValue: hasB } = getYieldValue(b);

        if (!hasA && !hasB) return 0;
        if (!hasA) return 1;
        if (!hasB) return -1;

        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      if (sortBy === 'holdingAmount') {
        const pa = profitByCode?.get(a.code);
        const pb = profitByCode?.get(b.code);
        const amountA = pa?.amount ?? Number.NEGATIVE_INFINITY;
        const amountB = pb?.amount ?? Number.NEGATIVE_INFINITY;
        return sortOrder === 'asc' ? amountA - amountB : amountB - amountA;
      }
      if (sortBy === 'holdingRatio') {
        const pa = profitByCode?.get(a.code);
        const pb = profitByCode?.get(b.code);
        const amountA = pa?.amount;
        const amountB = pb?.amount;
        const hasA = amountA != null && Number.isFinite(amountA) && amountA > 0;
        const hasB = amountB != null && Number.isFinite(amountB) && amountB > 0;
        if (!hasA && !hasB) return 0;
        if (!hasA) return 1;
        if (!hasB) return -1;
        return sortOrder === 'asc' ? amountA - amountB : amountB - amountA;
      }
      if (sortBy === 'yesterdayIncrease') {
        const valA = Number(a.zzl);
        const valB = Number(b.zzl);
        const hasA = Number.isFinite(valA);
        const hasB = Number.isFinite(valB);

        if (!hasA && !hasB) return 0;
        if (!hasA) return 1;
        if (!hasB) return -1;

        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      if (sortBy === 'todayProfit') {
        const pa = profitByCode?.get(a.code);
        const pb = profitByCode?.get(b.code);
        const valA = pa?.profitToday;
        const valB = pb?.profitToday;
        const hasA = valA != null && Number.isFinite(valA);
        const hasB = valB != null && Number.isFinite(valB);

        if (!hasA && !hasB) return 0;
        if (!hasA) return 1;
        if (!hasB) return -1;

        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      if (sortBy === 'holding') {
        const pa = profitByCode?.get(a.code);
        const pb = profitByCode?.get(b.code);
        const valA = pa?.profitTotal;
        const valB = pb?.profitTotal;
        const hasA = valA != null && Number.isFinite(valA);
        const hasB = valB != null && Number.isFinite(valB);
        if (!hasA && !hasB) return 0;
        if (!hasA) return 1;
        if (!hasB) return -1;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      if (sortBy === 'estimateProfit') {
        const valA = estimateProfitByCode ? estimateProfitByCode.get(a.code) : null;
        const valB = estimateProfitByCode ? estimateProfitByCode.get(b.code) : null;
        const hasA = valA != null && Number.isFinite(valA);
        const hasB = valB != null && Number.isFinite(valB);
        if (!hasA && !hasB) return 0;
        if (!hasA) return 1;
        if (!hasB) return -1;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      if (sortBy === 'yesterdayProfit') {
        const getYesterdayProfit = (code: string, jzrq?: string | null) => {
          const list = currentFundDailyEarnings?.[code];
          if (!isArray(list) || list.length === 0) return null;
          let matchedDaily: any = null;
          if (isString(jzrq)) {
            if (jzrq === todayStr) {
              for (let i = list.length - 1; i >= 0; i--) {
                if (list[i]?.date && list[i].date < todayStr) {
                  matchedDaily = list[i];
                  break;
                }
              }
            } else {
              for (const item of list) {
                if (item?.date === jzrq) {
                  matchedDaily = item;
                  break;
                }
              }
            }
          }
          if (!matchedDaily && jzrq !== todayStr) matchedDaily = list[list.length - 1];
          return matchedDaily && Number.isFinite(Number(matchedDaily.earnings)) ? Number(matchedDaily.earnings) : null;
        };
        const valA = getYesterdayProfit(a.code, a.jzrq);
        const valB = getYesterdayProfit(b.code, b.jzrq);
        const hasA = valA != null && Number.isFinite(valA);
        const hasB = valB != null && Number.isFinite(valB);
        if (!hasA && !hasB) return 0;
        if (!hasA) return 1;
        if (!hasB) return -1;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      if (sortBy === 'holdingDays') {
        const ha = holdingsForTabWithLinked[a.code];
        const hb = holdingsForTabWithLinked[b.code];
        const valA = ha?.firstPurchaseDate ? dayjs(todayStr).diff(dayjs(ha.firstPurchaseDate), 'day') : null;
        const valB = hb?.firstPurchaseDate ? dayjs(todayStr).diff(dayjs(hb.firstPurchaseDate), 'day') : null;
        const hasA = valA != null && Number.isFinite(valA);
        const hasB = valB != null && Number.isFinite(valB);
        if (!hasA && !hasB) return 0;
        if (!hasA) return 1;
        if (!hasB) return -1;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      if (sortBy === 'holdingCost') {
        const getCost = (h?: Holding) =>
          h?.cost != null && h?.share != null && Number.isFinite(Number(h.cost)) && Number.isFinite(Number(h.share))
            ? Number(h.cost) * Number(h.share)
            : null;
        const valA = getCost(holdingsForTabWithLinked[a.code]);
        const valB = getCost(holdingsForTabWithLinked[b.code]);
        const hasA = valA != null && Number.isFinite(valA);
        const hasB = valB != null && Number.isFinite(valB);
        if (!hasA && !hasB) return 0;
        if (!hasA) return 1;
        if (!hasB) return -1;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      if (sortBy === 'sinceAddedChangePercent') {
        const getSinceAddedChangeValue = (f: Fund) => {
          const addBaseNavRaw = f.addBaseNav != null && String(f.addBaseNav) !== '' ? Number(f.addBaseNav) : null;
          const addBaseNav =
            addBaseNavRaw != null && Number.isFinite(addBaseNavRaw) && addBaseNavRaw > 0 ? addBaseNavRaw : null;
          const sinceAddedCurrentNav = (() => {
            if (f.noValuation) {
              const v = Number(f.dwjz);
              return Number.isFinite(v) && v > 0 ? v : null;
            }
            const v = Number(f.gsz);
            return Number.isFinite(v) && v > 0 ? v : null;
          })();
          return addBaseNav != null && sinceAddedCurrentNav != null
            ? (sinceAddedCurrentNav / addBaseNav - 1) * 100
            : null;
        };
        const valA = getSinceAddedChangeValue(a);
        const valB = getSinceAddedChangeValue(b);
        const hasA = valA != null && Number.isFinite(valA);
        const hasB = valB != null && Number.isFinite(valB);
        if (!hasA && !hasB) return 0;
        if (!hasA) return 1;
        if (!hasB) return -1;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      if (sortBy === 'consecutiveTrend') {
        const getTrendValue = (code: string) => {
          const trend = fundExtraDataByCode[code]?.consecutiveTrend;
          if (!trend || !Number.isFinite(trend.days)) return 0;
          return trend.type === 'up' ? trend.days : -trend.days;
        };
        const valA = getTrendValue(a.code);
        const valB = getTrendValue(b.code);
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      if (['last1Week', 'last1Month', 'last3Months', 'last6Months', 'last1Year'].includes(sortBy)) {
        const keyMap: Record<string, string> = {
          last1Week: 'week',
          last1Month: 'month',
          last3Months: 'month3',
          last6Months: 'month6',
          last1Year: 'year1'
        };
        const key = keyMap[sortBy];
        const valA = fundExtraDataByCode[a.code]?.[key];
        const valB = fundExtraDataByCode[b.code]?.[key];
        const hasA = valA != null && Number.isFinite(valA);
        const hasB = valB != null && Number.isFinite(valB);
        if (!hasA && !hasB) return 0;
        if (!hasA) return 1;
        if (!hasB) return -1;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      if (sortBy === 'tags') {
        const getTagKey = (fund: Fund) => {
          const code = String(fund?.code ?? '').trim();
          const list = code && fundTagListsByCode ? fundTagListsByCode[code] : null;
          if (!isArray(list) || list.length === 0) return '';
          return list
            .map((t) => (t?.name != null ? String(t.name).trim() : ''))
            .filter(Boolean)
            .join('、');
        };
        const keyA = getTagKey(a);
        const keyB = getTagKey(b);
        const hasA = !!keyA;
        const hasB = !!keyB;
        if (!hasA && !hasB) return 0;
        if (!hasA) return 1;
        if (!hasB) return -1;
        return sortOrder === 'asc' ? keyA.localeCompare(keyB, 'zh-CN') : keyB.localeCompare(keyA, 'zh-CN');
      }
      if (sortBy === 'name') {
        const nameA = a.name ?? '';
        const nameB = b.name ?? '';
        return sortOrder === 'asc' ? nameA.localeCompare(nameB, 'zh-CN') : nameB.localeCompare(nameA, 'zh-CN');
      }
      return 0;
    });
  }, [
    scopedFunds,
    currentTab,
    groups,
    sortBy,
    sortOrder,
    holdingsForTabWithLinked,
    getHoldingProfitForTab,
    deferredGroupFundSearchTerm,
    shouldShowGroupFundSearch,
    currentFundDailyEarnings,
    fundExtraDataByCode,
    todayStr,
    fundTagListsByCode
  ]);

  const displayFunds = useDeferredValue(displayFundsRaw);

  return {
    scopedFunds,
    displayFundsRaw,
    displayFunds,
    fundExtraDataByCode
  };
}
