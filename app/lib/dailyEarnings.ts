/**
 * 每日收益数据管理（按作用域分桶）：
 * {
 *   [scope]: {
 *     [code]: Array<{ date: string, earnings: number, rate?: number|null, baseCostAmount?: number|null }>
 *   }
 * }
 * - scope: 'all'（全局）或自定义分组 id
 * - date: YYYY-MM-DD
 * - earnings: 当日收益（元）
 * - rate: 当日收益率（百分比数值，如 1.23 表示 +1.23%），基于用户成本价计算，即 (当日收益 / 成本金额) × 100
 * - baseCostAmount: 当日成本快照金额（元），用于冻结当日收益率分母
 */
import { isArray, isNumber, isObject, isPlainObject, isString } from 'lodash';
import { storageStore } from '@/app/stores';
import { DAILY_EARNINGS_SCOPE_ALL } from '@/app/constants';

export interface DailyEarningsItem {
  date: string;
  earnings: number;
  rate?: number | null;
  baseCostAmount?: number | null;
}

export type ScopedDailyEarningsMap = Record<string, Record<string, DailyEarningsItem[]>>;

const STORAGE_KEY = 'fundDailyEarnings';

function normalizeItem(item: unknown): DailyEarningsItem | null {
  if (!item || !isObject(item)) return null;
  const rec = item as Record<string, unknown>;
  const date = rec.date;
  const earnings = rec.earnings;
  const rate = rec.rate;
  const baseCostAmount = rec.baseCostAmount;
  if (!isString(date) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (!isNumber(earnings) || !Number.isFinite(earnings)) return null;
  const normalizedRate = isNumber(rate) && Number.isFinite(rate) ? rate : null;
  const normalizedBaseCostAmount =
    isNumber(baseCostAmount) && Number.isFinite(baseCostAmount) && baseCostAmount > 0 ? baseCostAmount : null;
  return { date, earnings, rate: normalizedRate, baseCostAmount: normalizedBaseCostAmount };
}

function getStored(): ScopedDailyEarningsMap {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = storageStore.getItem(STORAGE_KEY);
    if (!isPlainObject(parsed)) return {};
    // 兼容旧格式：{ [code]: list } -> { all: { [code]: list } }
    const hasScopeBucket = Object.values(parsed as Record<string, unknown>).some((v) => isPlainObject(v));
    if (!hasScopeBucket) {
      return { [DAILY_EARNINGS_SCOPE_ALL]: parsed as Record<string, DailyEarningsItem[]> };
    }
    return parsed as ScopedDailyEarningsMap;
  } catch {
    return {};
  }
}

function setStored(data: ScopedDailyEarningsMap): void {
  if (typeof window === 'undefined') return;
  try {
    storageStore.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('dailyEarnings persist failed', e);
  }
}

export function recordDailyEarnings(
  code: string,
  earnings: number,
  dateStr: string,
  rate?: number | null,
  scope: string = DAILY_EARNINGS_SCOPE_ALL,
  baseCostAmount?: number | null
): DailyEarningsItem[] {
  if (!isString(code) || !code) return getDailyEarnings(code, scope);
  if (!isNumber(earnings) || !Number.isFinite(earnings)) return getDailyEarnings(code, scope);
  if (!isString(dateStr) || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return getDailyEarnings(code, scope);

  const normalizedRate = isNumber(rate) && Number.isFinite(rate) ? rate : null;
  const normalizedBaseCost =
    isNumber(baseCostAmount) && Number.isFinite(baseCostAmount) && baseCostAmount > 0 ? baseCostAmount : null;

  const all = getStored();
  const scoped = isPlainObject(all[scope]) ? all[scope] : {};
  const list = isArray(scoped[code]) ? scoped[code] : [];
  const existingIndex = list.findIndex((item) => item.date === dateStr);

  const nextList =
    existingIndex >= 0
      ? list.map((item, i) =>
          i === existingIndex
            ? { date: dateStr, earnings, rate: normalizedRate, baseCostAmount: normalizedBaseCost }
            : item
        )
      : [...list, { date: dateStr, earnings, rate: normalizedRate, baseCostAmount: normalizedBaseCost }];

  nextList.sort((a, b) => a.date.localeCompare(b.date));

  all[scope] = { ...scoped, [code]: nextList };
  setStored(all);
  return nextList.map(normalizeItem).filter((i): i is DailyEarningsItem => Boolean(i));
}

export function getDailyEarnings(code: string, scope: string = DAILY_EARNINGS_SCOPE_ALL): DailyEarningsItem[] {
  const all = getStored();
  const scoped = isPlainObject(all[scope]) ? all[scope] : {};
  const list = isArray(scoped[code]) ? scoped[code] : [];
  return list.map(normalizeItem).filter((i): i is DailyEarningsItem => Boolean(i));
}

export function clearDailyEarnings(code: string, scope: string | null = null): void {
  const all = getStored();
  let changed = false;
  const next = { ...all };
  if (scope && isPlainObject(next[scope]) && code in next[scope]) {
    const bucket = { ...next[scope] };
    delete bucket[code];
    next[scope] = bucket;
    changed = true;
  } else if (!scope) {
    Object.keys(next).forEach((sc) => {
      if (!isPlainObject(next[sc])) return;
      if (!(code in next[sc])) return;
      const bucket = { ...next[sc] };
      delete bucket[code];
      next[sc] = bucket;
      changed = true;
    });
  }
  if (!changed) return;
  setStored(next);
}

export function getAllDailyEarnings(scope: string = DAILY_EARNINGS_SCOPE_ALL): Record<string, DailyEarningsItem[]> {
  const all = getStored();
  const scoped = all[scope];
  return isPlainObject(scoped) ? scoped : {};
}

export function getAllDailyEarningsScoped(): ScopedDailyEarningsMap {
  return getStored();
}

export function setAllDailyEarningsScoped(scopedMap: unknown): void {
  const next = isPlainObject(scopedMap) ? (scopedMap as ScopedDailyEarningsMap) : {};
  setStored(next);
}

/**
 * 合并所有 scope 的收益数据（累加同日收益，同一基金在不同 scope 独立持有）
 * @param scopedDaily - { [scope]: { [code]: Array<{date, earnings, ...}> } }
 * @returns - { [code]: Array<{date, earnings, ...}> }
 */
export function mergeAllScopedDailyEarnings(scopedDaily: unknown): Record<string, DailyEarningsItem[]> {
  const merged: Record<string, Map<string, DailyEarningsItem>> = {};
  if (!isPlainObject(scopedDaily)) return {};
  Object.values(scopedDaily as Record<string, unknown>).forEach((bucket) => {
    if (!isPlainObject(bucket)) return;
    Object.entries(bucket as Record<string, unknown>).forEach(([code, list]) => {
      if (!isArray(list)) return;
      if (!merged[code]) {
        merged[code] = new Map();
      }
      const dateMap = merged[code];
      list.forEach((item) => {
        if (!item?.date) return;
        const existing = dateMap.get(item.date);
        if (existing) {
          // 累加 earnings 和 baseCostAmount
          dateMap.set(item.date, {
            ...existing,
            earnings: (existing.earnings || 0) + (item.earnings || 0),
            baseCostAmount: (existing.baseCostAmount || 0) + (item.baseCostAmount || 0),
            rate: null // 合并不同分组的收益后，重置 rate 为 null 促使消费端重算
          });
        } else {
          dateMap.set(item.date, { ...item });
        }
      });
    });
  });
  // 将 Map 转换回数组
  const result: Record<string, DailyEarningsItem[]> = {};
  Object.entries(merged).forEach(([code, dateMap]) => {
    result[code] = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  });
  return result;
}

/**
 * 合并全局 holdings 和分组 holdings（累加持仓，计算加权平均成本）
 * @param globalHoldings - 全局 holdings
 * @param groupHoldings - 分组 holdings
 * @returns - 合并后的 holdings
 */
export function mergeAllHoldings(
  globalHoldings: unknown,
  groupHoldings: unknown
): Record<string, { share: number; cost: number; [key: string]: unknown }> {
  const merged: Record<string, { share: number; cost: number; [key: string]: unknown }> = {};
  // 合并全局 holdings
  if (isPlainObject(globalHoldings)) {
    Object.entries(globalHoldings as Record<string, unknown>).forEach(([code, holding]) => {
      if (isPlainObject(holding)) {
        const h = holding as { share?: number; cost?: number; [key: string]: unknown };
        if (isNumber(h.share) && h.share > 0) {
          merged[code] = { ...h, share: h.share, cost: h.cost ?? 0 };
        }
      }
    });
  }
  // 累加分组 holdings
  if (isPlainObject(groupHoldings)) {
    Object.values(groupHoldings as Record<string, unknown>).forEach((group) => {
      if (!isPlainObject(group)) return;
      Object.entries(group as Record<string, unknown>).forEach(([code, holding]) => {
        if (!isPlainObject(holding)) return;
        const h = holding as { share?: number; cost?: number; [key: string]: unknown };
        if (!isNumber(h.share) || h.share <= 0) return;
        if (merged[code]) {
          // 计算加权平均成本
          const existingTotalCost = (merged[code].share || 0) * (merged[code].cost || 0);
          const newTotalCost = h.share * (h.cost || 0);
          const totalShare = (merged[code].share || 0) + h.share;
          merged[code] = {
            ...merged[code],
            share: totalShare,
            cost: totalShare > 0 ? (existingTotalCost + newTotalCost) / totalShare : 0
          };
        } else {
          merged[code] = { ...h, share: h.share, cost: h.cost ?? 0 };
        }
      });
    });
  }
  return merged;
}

/**
 * 将多基金的每日收益按日期合并为组合序列（同日 earnings 求和；组合层面 rate 无统一定义，置为 null）。
 * @param fundDailyEarningsMap - 与 localStorage 结构一致：{ [code]: Array<{date, earnings, rate?}> }
 */
export function aggregatePortfolioDailyEarnings(
  fundDailyEarningsMap: Record<string, unknown> | null | undefined
): Array<{ date: string; earnings: number; rate: null }> {
  if (!isPlainObject(fundDailyEarningsMap)) return [];
  const byDate = new Map<string, number>();
  for (const code of Object.keys(fundDailyEarningsMap!)) {
    const list = fundDailyEarningsMap![code];
    if (!isArray(list)) continue;
    for (const raw of list) {
      const item = normalizeItem(raw);
      if (!item) continue;
      byDate.set(item.date, (byDate.get(item.date) ?? 0) + item.earnings);
    }
  }
  return [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, earnings]) => ({ date, earnings, rate: null }));
}

/**
 * 估算 YTD (今年以来) 收益率。采用每日收益率累乘法（时间加权收益率近似）。
 * @param fundDailyEarningsMap - 全局收益记录 { [code]: Array<{date, earnings, baseCostAmount?}> }
 * @param holdings - 当前全局持仓，用作降级时的分母
 * @returns YTD 收益率百分比，如 1.23 表示 +1.23%。若无有效数据则返回 null。
 */
export function calculateYtdReturnRate(
  fundDailyEarningsMap: Record<string, unknown> | null | undefined,
  holdings: Record<string, { share?: number; cost?: number }> | null | undefined
): number | null {
  if (!isPlainObject(fundDailyEarningsMap)) return null;

  const currentYear = new Date().getFullYear();
  const yearStartStr = `${currentYear}-01-01`;

  // 按日期聚合每日的总收益和总成本快照
  const dailyStats = new Map<string, { earnings: number; cost: number; hasCost: boolean }>();

  for (const code of Object.keys(fundDailyEarningsMap!)) {
    const list = fundDailyEarningsMap![code];
    if (!isArray(list)) continue;
    for (const raw of list) {
      const item = normalizeItem(raw);
      if (!item) continue;
      if (item.date >= yearStartStr) {
        const stat = dailyStats.get(item.date) || { earnings: 0, cost: 0, hasCost: false };
        stat.earnings += item.earnings;
        // 如果有当天的快照成本，则累加
        if (isNumber(item.baseCostAmount) && item.baseCostAmount > 0) {
          stat.cost += item.baseCostAmount;
          stat.hasCost = true;
        } else if (isNumber(item.rate) && item.rate !== 0) {
          // 如果没有快照成本但存了单日收益率，反推当天的成本
          const impliedCost = item.earnings / (item.rate / 100);
          if (impliedCost > 0) {
            stat.cost += impliedCost;
            stat.hasCost = true;
          }
        }
        dailyStats.set(item.date, stat);
      }
    }
  }

  if (dailyStats.size === 0) return null;

  // 计算当前持仓总成本（作为部分历史数据无 baseCostAmount 时的 fallback）
  let currentTotalCost = 0;
  if (isPlainObject(holdings)) {
    for (const code of Object.keys(holdings!)) {
      const holding = holdings![code];
      if (isObject(holding) && isNumber(holding.share) && isNumber(holding.cost)) {
        currentTotalCost += holding.share * holding.cost; // 份额 × 单位成本 = 总成本
      }
    }
  }

  // 按日期排序并累乘每日收益率
  const sortedDates = [...dailyStats.keys()].sort();
  let compounded = 1;
  let hasValidData = false;

  for (const date of sortedDates) {
    const stat = dailyStats.get(date)!;
    // 优先使用当天所有基金记录的成本快照和；如果没有，则降级使用当前的持仓总成本
    const dailyCost = stat.hasCost && stat.cost > 0 ? stat.cost : currentTotalCost;

    if (dailyCost > 0) {
      const dailyRate = stat.earnings / dailyCost;
      compounded *= 1 + dailyRate;
      hasValidData = true;
    }
  }

  if (!hasValidData) return null;

  return Number(((compounded - 1) * 100).toFixed(2));
}
