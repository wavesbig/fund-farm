'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { MutableRefObject, Dispatch, SetStateAction } from 'react';
import { isArray, isFunction, isNil, isNumber, isPlainObject, isString } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import {
  useStorageStore,
  storageStore,
  useModalStore,
  getFundCodesSignature,
  ensurePresetGroups,
  SORT_DISPLAY_MODES
} from '../stores';
import { fetchSqliteData, saveSqliteData } from '../lib/sqliteClient';
import { DAILY_EARNINGS_SCOPE_ALL, DCA_SCOPE_GLOBAL, DEFAULT_FUND_TAG_THEME } from '@/app/constants';
import { normalizeCode, cleanCodeArray, normalizeNumber, dedupeByCode } from '../lib/normalize';
import {
  hasOwn,
  stripLegacyTagsFromFundObject,
  getFundCodesFromTagRecord,
  sanitizeTagRowForStorage,
  migrateDcaPlansToScoped,
  nowInTz,
  toTz
} from '../lib/fundHelpers';
import { calculateYtdReturnRate, mergeAllScopedDailyEarnings, mergeAllHoldings } from '../lib/dailyEarnings';

export const normalizeFundDailyEarningsScoped = (source: any): Record<string, any> => {
  if (!isPlainObject(source)) return {};
  const values = Object.values(source);
  const hasScoped = values.some((v) => isPlainObject(v));
  if (!hasScoped) {
    return { [DAILY_EARNINGS_SCOPE_ALL]: source };
  }
  return source;
};

const mergeValuationFieldsByGztime = (localFund: any, cloudFund: any) => {
  if (!isPlainObject(cloudFund)) return cloudFund;
  if (!isPlainObject(localFund)) return cloudFund;

  const localGzRaw = localFund.gztime;
  const cloudGzRaw = cloudFund.gztime;

  if (!isString(localGzRaw) || !isString(cloudGzRaw)) return cloudFund;

  const localGz = toTz(localGzRaw);
  const cloudGz = toTz(cloudGzRaw);
  if (!localGz?.isValid?.() || !cloudGz?.isValid?.()) return cloudFund;

  if (!localGz.isAfter(cloudGz)) return cloudFund;

  const patch: Record<string, any> = {};
  if (!isNil(localFund.gsz)) patch.gsz = localFund.gsz;
  if (!isNil(localFund.gszzl)) patch.gszzl = localFund.gszzl;
  if (!isNil(localFund.gztime)) patch.gztime = localFund.gztime;

  return { ...cloudFund, ...patch };
};

export interface UseSyncManagerDeps {
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  refreshAllRef: MutableRefObject<((codes: string[]) => Promise<void>) | null | undefined>;
  setTempSeconds: Dispatch<SetStateAction<number>> | ((sec: number) => void);
  setFundTagRecords: Dispatch<SetStateAction<any[]>> | ((records: any[]) => void);
}

export interface UseSyncManagerReturn {
  isSyncing: boolean;
  lastSyncTime: string | null;
  scheduleSync: () => void;
  syncUserConfig: (
    userId?: string | null,
    showTip?: boolean,
    payload?: any,
    isPartial?: boolean,
    options?: any
  ) => Promise<void>;
  applyCloudConfig: (
    cloudData: any,
    cloudUpdatedAt?: string | null,
    options?: {
      silent?: boolean;
      forceTakeover?: boolean;
      userId?: string | null;
      refreshAfterApply?: boolean;
    }
  ) => Promise<void>;
  triggerCustomSettingsSync: () => void;
  skipSyncRef: MutableRefObject<boolean>;
  storageHelper: typeof storageStore;
}

/**
 * 云端同步管理 Hook
 *
 * @param {object} deps
 * @param {Function} deps.showToast
 * @param {React.RefObject} deps.refreshAllRef - ref to refreshAll from useRefreshManager (avoids circular dependency)
 * @param {Function} deps.setTempSeconds - UI state setter
 * @param {Function} deps.setFundTagRecords - tag state setter
 */
export function useSyncManager({
  showToast,
  refreshAllRef,
  setTempSeconds,
  setFundTagRecords
}: UseSyncManagerDeps): UseSyncManagerReturn {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const deviceIdRef = useRef<string>('');

  const syncDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedRef = useRef<string>('');
  const skipSyncRef = useRef<boolean>(false);
  const userIdRef = useRef<string | null>(null);
  const deviceConflictModalOpenRef = useRef<boolean>(false);
  const dirtyKeysRef = useRef<Set<string>>(new Set());
  const syncUserConfigRef = useRef<((...args: any[]) => Promise<void>) | null>(null);

  // deviceId init
  useEffect(() => {
    try {
      const key = 'rtfDeviceId';
      let id = storageStore.getItem(key);
      if (!id) {
        id = uuidv4();
        storageStore.setItem(key, id);
      }
      deviceIdRef.current = id;
    } catch {
      deviceIdRef.current = uuidv4();
    }
  }, []);

  // lastSyncTime init
  useEffect(() => {
    const stored = storageStore.getItem('localUpdatedAt');
    if (stored) {
      setLastSyncTime(stored);
    } else {
      setLastSyncTime(null);
    }
  }, []);

  // deviceConflictModalOpenRef sync
  useEffect(() => {
    const unsub = useModalStore.subscribe((s) => {
      deviceConflictModalOpenRef.current = s.deviceConflictModal.open;
    });
    deviceConflictModalOpenRef.current = useModalStore.getState().deviceConflictModal.open;
    return unsub;
  }, []);

  // --- getComparablePayload ---
  function getComparablePayload(payload: any): string {
    if (!isPlainObject(payload)) return '';
    const rawFunds = isArray(payload.funds) ? payload.funds : [];
    const fundCodes = rawFunds.map((fund: any) => normalizeCode(fund?.code || fund?.CODE)).filter(Boolean);
    const uniqueFundCodes = Array.from(new Set(fundCodes)).sort();

    const favorites = isArray(payload.favorites)
      ? Array.from(
          new Set(payload.favorites.map(normalizeCode).filter((code: string) => uniqueFundCodes.includes(code)))
        ).sort()
      : [];

    const collapsedCodes = isArray(payload.collapsedCodes)
      ? Array.from(
          new Set(payload.collapsedCodes.map(normalizeCode).filter((code: string) => uniqueFundCodes.includes(code)))
        ).sort()
      : [];

    const collapsedTrends = isArray(payload.collapsedTrends)
      ? Array.from(
          new Set(payload.collapsedTrends.map(normalizeCode).filter((code: string) => uniqueFundCodes.includes(code)))
        ).sort()
      : [];

    const collapsedValuationTrends = isArray(payload.collapsedValuationTrends)
      ? Array.from(
          new Set(
            payload.collapsedValuationTrends.map(normalizeCode).filter((code: string) => uniqueFundCodes.includes(code))
          )
        ).sort()
      : [];

    const collapsedEarnings = isArray(payload.collapsedEarnings)
      ? Array.from(
          new Set(payload.collapsedEarnings.map(normalizeCode).filter((code: string) => uniqueFundCodes.includes(code)))
        ).sort()
      : [];

    const groups = isArray(payload.groups)
      ? payload.groups
          .map((group: any) => {
            const id = normalizeCode(group?.id);
            if (!id) return null;
            const name = isString(group?.name) ? group.name : '';
            const codes = isArray(group?.codes)
              ? Array.from(
                  new Set(group.codes.map(normalizeCode).filter((code: string) => uniqueFundCodes.includes(code)))
                ).sort()
              : [];
            const isPreset = Boolean(group?.isPreset || id === 'fav');
            return { id, name, codes, ...(isPreset ? { isPreset: true } : {}) };
          })
          .filter(Boolean)
      : [];

    const validGroupIds = new Set(groups.map((g: any) => g.id));

    const holdingsSource = isPlainObject(payload.holdings) ? payload.holdings : {};
    const holdings: Record<string, any> = {};
    Object.keys(holdingsSource)
      .map(normalizeCode)
      .filter((code) => uniqueFundCodes.includes(code))
      .sort()
      .forEach((code) => {
        const value = holdingsSource[code] || {};
        const share = normalizeNumber(value.share);
        const cost = normalizeNumber(value.cost);
        if (share === null && cost === null) return;
        holdings[code] = { share, cost };
      });

    const ghSource = isPlainObject(payload.groupHoldings) ? payload.groupHoldings : {};
    const groupHoldingsNorm: Record<string, any> = {};
    Object.keys(ghSource)
      .map(normalizeCode)
      .filter((gid) => validGroupIds.has(gid))
      .sort()
      .forEach((gid) => {
        const bucket = ghSource[gid] || {};
        const inner: Record<string, any> = {};
        Object.keys(bucket)
          .map(normalizeCode)
          .filter((code) => uniqueFundCodes.includes(code))
          .sort()
          .forEach((code) => {
            const value = bucket[code] || {};
            const share = normalizeNumber(value.share);
            const cost = normalizeNumber(value.cost);
            if (share === null && cost === null) return;
            inner[code] = { share, cost };
          });
        if (Object.keys(inner).length) groupHoldingsNorm[gid] = inner;
      });

    const pendingTrades = isArray(payload.pendingTrades)
      ? payload.pendingTrades
          .map((trade: any) => {
            const fundCode = normalizeCode(trade?.fundCode);
            if (!fundCode) return null;
            const row: Record<string, any> = {
              id: trade?.id ? String(trade.id) : '',
              fundCode,
              type: trade?.type || '',
              share: normalizeNumber(trade?.share),
              amount: normalizeNumber(trade?.amount),
              feeRate: normalizeNumber(trade?.feeRate),
              feeMode: trade?.feeMode || '',
              feeValue: normalizeNumber(trade?.feeValue),
              date: trade?.date || '',
              isAfter3pm: !!trade?.isAfter3pm,
              isDca: !!trade?.isDca
            };
            const g = trade?.groupId != null && trade.groupId !== '' ? normalizeCode(trade.groupId) : null;
            if (g) {
              if (!validGroupIds.has(g)) return null;
              row.groupId = g;
            }
            return row;
          })
          .filter((trade: any) => trade && uniqueFundCodes.includes(trade.fundCode))
          .sort((a: any, b: any) => {
            const gidA = a.groupId || '';
            const gidB = b.groupId || '';
            const keyA =
              a.id ||
              `${gidA}|${a.fundCode}|${a.type}|${a.date}|${a.share ?? ''}|${a.amount ?? ''}|${a.feeMode}|${a.feeValue ?? ''}|${a.feeRate ?? ''}|${a.isAfter3pm ? 1 : 0}|${a.isDca ? 1 : 0}`;
            const keyB =
              b.id ||
              `${gidB}|${b.fundCode}|${b.type}|${b.date}|${b.share ?? ''}|${b.amount ?? ''}|${b.feeMode}|${b.feeValue ?? ''}|${b.feeRate ?? ''}|${b.isAfter3pm ? 1 : 0}|${b.isDca ? 1 : 0}`;
            return keyA.localeCompare(keyB);
          })
      : [];

    const transactionsSource = isPlainObject(payload.transactions) ? payload.transactions : {};
    const transactions: Record<string, any> = {};
    Object.keys(transactionsSource)
      .map(normalizeCode)
      .filter((code) => uniqueFundCodes.includes(code))
      .sort()
      .forEach((code) => {
        const list = isArray(transactionsSource[code]) ? transactionsSource[code] : [];
        const normalized = list
          .map((t: any) => {
            const id = t?.id ? String(t.id) : '';
            const type = t?.type || '';
            const share = normalizeNumber(t?.share);
            const amount = normalizeNumber(t?.amount);
            const price = normalizeNumber(t?.price);
            const date = t?.date || '';
            const timestamp = Number.isFinite(t?.timestamp) ? t.timestamp : 0;
            const isDca = !!t?.isDca;
            const isHistoryOnly = !!t?.isHistoryOnly;
            const row: Record<string, any> = { id, type, share, amount, price, date, timestamp, isDca, isHistoryOnly };
            const g = t?.groupId != null && t.groupId !== '' ? normalizeCode(t.groupId) : null;
            if (g) {
              if (!validGroupIds.has(g)) return null;
              row.groupId = g;
            }
            return row;
          })
          .filter((t: any) => t && (t.id || t.timestamp))
          .sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
        if (normalized.length > 0) transactions[code] = normalized;
      });

    const dcaScoped = migrateDcaPlansToScoped(isPlainObject(payload.dcaPlans) ? payload.dcaPlans : {});
    const dcaPlans: Record<string, any> = {};
    Object.keys(dcaScoped)
      .sort()
      .forEach((scopeKeyRaw) => {
        const scopeKey = normalizeCode(scopeKeyRaw);
        if (scopeKey !== DCA_SCOPE_GLOBAL && !validGroupIds.has(scopeKey)) return;
        const bucket = dcaScoped[scopeKeyRaw];
        if (!isPlainObject(bucket)) return;
        const inner: Record<string, any> = {};
        Object.keys(bucket)
          .map(normalizeCode)
          .filter((code) => uniqueFundCodes.includes(code))
          .sort()
          .forEach((code) => {
            const plan = bucket[code] || {};
            const amount = normalizeNumber(plan.amount);
            const feeRate = normalizeNumber(plan.feeRate);
            const cycle = ['daily', 'weekly', 'biweekly', 'monthly'].includes(plan.cycle) ? plan.cycle : '';
            const firstDate = plan.firstDate ? String(plan.firstDate) : '';
            const enabled = !!plan.enabled;
            const weeklyDay = normalizeNumber(plan.weeklyDay);
            const monthlyDay = normalizeNumber(plan.monthlyDay);
            const lastDate = plan.lastDate ? String(plan.lastDate) : '';
            if (
              amount === null &&
              feeRate === null &&
              !cycle &&
              !firstDate &&
              !enabled &&
              weeklyDay === null &&
              monthlyDay === null &&
              !lastDate
            )
              return;
            inner[code] = {
              amount,
              feeRate,
              cycle,
              firstDate,
              enabled,
              weeklyDay: weeklyDay !== null ? weeklyDay : null,
              monthlyDay: monthlyDay !== null ? monthlyDay : null,
              lastDate
            };
          });
        if (Object.keys(inner).length) dcaPlans[scopeKey] = inner;
      });

    const customSettings = isPlainObject(payload.customSettings) ? payload.customSettings : {};
    const fundDailyEarningsSource = normalizeFundDailyEarningsScoped(payload.fundDailyEarnings);
    const fundDailyEarningsSig = Object.keys(fundDailyEarningsSource)
      .sort()
      .flatMap((scopeKey) => {
        const bucket = fundDailyEarningsSource[scopeKey];
        if (!isPlainObject(bucket)) return [];
        return Object.keys(bucket)
          .map(normalizeCode)
          .filter((code) => uniqueFundCodes.includes(code))
          .sort()
          .map((code) => {
            const list = isArray(bucket[code]) ? bucket[code] : [];
            const last = list.length ? list[list.length - 1] : null;
            const date = last?.date ? String(last.date) : '';
            const earnings = Number(last?.earnings);
            return `${scopeKey}|${code}|${date}|${Number.isFinite(earnings) ? earnings.toFixed(2) : ''}|${list.length}`;
          });
      });

    const tagRows = isArray(payload.tags) ? payload.tags : [];
    const tagsSig = tagRows
      .map((r: any) => {
        const codes = getFundCodesFromTagRecord(r)
          .map((c: string) => normalizeCode(c))
          .filter(Boolean)
          .sort()
          .join(',');
        return `${codes}|${String(r?.id ?? '')}|${String(r?.name ?? '')}|${String(r?.theme ?? '')}`;
      })
      .sort()
      .join('\n');

    return JSON.stringify({
      funds: uniqueFundCodes,
      tagsSig,
      favorites,
      groups,
      collapsedCodes,
      collapsedTrends,
      collapsedValuationTrends,
      refreshMs: Number.isFinite(payload.refreshMs) ? payload.refreshMs : 30000,
      holdings,
      groupHoldings: groupHoldingsNorm,
      pendingTrades,
      transactions,
      dcaPlans,
      customSettings,
      fundDailyEarningsSig
    });
  }

  // --- collectLocalPayload ---
  const collectLocalPayload = (keys: Set<string> | null = null): Record<string, any> => {
    try {
      const all: Record<string, any> = {};
      if (!keys || keys.has('fundValuationTimeseries')) {
        all.fundValuationTimeseries = storageStore.getItem('fundValuationTimeseries', {});
      }
      if (!keys || keys.has('funds')) {
        all.funds = storageStore.getItem('funds', []);
      }
      if (!keys || keys.has('favorites')) {
        all.favorites = storageStore.getItem('favorites', []);
      }
      if (!keys || keys.has('groups')) {
        all.groups = storageStore.getItem('groups', []);
      }
      if (!keys || keys.has('collapsedCodes')) {
        all.collapsedCodes = storageStore.getItem('collapsedCodes', []);
      }
      if (!keys || keys.has('collapsedTrends')) {
        all.collapsedTrends = storageStore.getItem('collapsedTrends', []);
      }
      if (!keys || keys.has('collapsedValuationTrends')) {
        all.collapsedValuationTrends = storageStore.getItem('collapsedValuationTrends', []);
      }
      if (!keys || keys.has('collapsedEarnings')) {
        all.collapsedEarnings = storageStore.getItem('collapsedEarnings', []);
      }
      if (!keys || keys.has('refreshMs')) {
        all.refreshMs = storageStore.getItem('refreshMs', 30000);
      }
      if (!keys || keys.has('holdings')) {
        all.holdings = storageStore.getItem('holdings', {});
      }
      if (!keys || keys.has('groupHoldings')) {
        all.groupHoldings = storageStore.getItem('groupHoldings', {});
      }
      if (!keys || keys.has('pendingTrades')) {
        all.pendingTrades = storageStore.getItem('pendingTrades', []);
      }
      if (!keys || keys.has('transactions')) {
        all.transactions = storageStore.getItem('transactions', {});
      }
      if (!keys || keys.has('dcaPlans')) {
        all.dcaPlans = storageStore.getItem('dcaPlans', {});
      }
      if (!keys || keys.has('customSettings')) {
        all.customSettings = storageStore.getItem('customSettings', {});
      }
      if (!keys || keys.has('fundDailyEarnings')) {
        all.fundDailyEarnings = storageStore.getItem('fundDailyEarnings', {});
      }
      if (!keys || keys.has('tags')) {
        all.tags = storageStore.getItem('tags', []);
      }

      if (!keys) {
        all.funds = isArray(all.funds) ? all.funds.map(stripLegacyTagsFromFundObject) : [];
        const fundCodes = new Set(isArray(all.funds) ? all.funds.map((f: any) => f?.code).filter(Boolean) : []);

        const cleanedHoldings = isPlainObject(all.holdings)
          ? Object.entries(all.holdings).reduce((acc: Record<string, any>, [code, value]: [string, any]) => {
              if (!fundCodes.has(code) || !isPlainObject(value)) return acc;
              const parsedShare = isNumber(value.share)
                ? value.share
                : isString(value.share)
                  ? Number(value.share)
                  : NaN;
              const parsedCost = isNumber(value.cost) ? value.cost : isString(value.cost) ? Number(value.cost) : NaN;
              const nextShare = Number.isFinite(parsedShare) ? parsedShare : null;
              const nextCost = Number.isFinite(parsedCost) ? parsedCost : null;
              if (nextShare === null && nextCost === null) return acc;
              acc[code] = {
                ...value,
                share: nextShare,
                cost: nextCost
              };
              return acc;
            }, {})
          : {};

        const cleanedFavorites = isArray(all.favorites) ? all.favorites.filter((code: any) => fundCodes.has(code)) : [];
        const cleanedCollapsed = isArray(all.collapsedCodes)
          ? all.collapsedCodes.filter((code: any) => fundCodes.has(code))
          : [];
        const cleanedCollapsedTrends = isArray(all.collapsedTrends)
          ? all.collapsedTrends.filter((code: any) => fundCodes.has(code))
          : [];
        const cleanedCollapsedValuationTrends = isArray(all.collapsedValuationTrends)
          ? all.collapsedValuationTrends.filter((code: any) => fundCodes.has(code))
          : [];
        const cleanedCollapsedEarnings = isArray(all.collapsedEarnings)
          ? all.collapsedEarnings.filter((code: any) => fundCodes.has(code))
          : [];
        const cleanedGroups = ensurePresetGroups(
          isArray(all.groups)
            ? all.groups.map((g: any) => ({
                ...g,
                codes: isArray(g.codes) ? g.codes.filter((c: any) => fundCodes.has(c)) : []
              }))
            : []
        );

        const validGroupIdSet = new Set(cleanedGroups.map((g: any) => g?.id).filter(Boolean));

        const cleanedGroupHoldings = isPlainObject(all.groupHoldings)
          ? Object.entries(all.groupHoldings).reduce((acc: Record<string, any>, [gid, bucket]: [string, any]) => {
              if (!validGroupIdSet.has(gid) || !isPlainObject(bucket)) return acc;
              const inner = Object.entries(bucket).reduce((bacc: Record<string, any>, [code, value]: [string, any]) => {
                if (!fundCodes.has(code) || !isPlainObject(value)) return bacc;
                const parsedShare = isNumber(value.share)
                  ? value.share
                  : isString(value.share)
                    ? Number(value.share)
                    : NaN;
                const parsedCost = isNumber(value.cost) ? value.cost : isString(value.cost) ? Number(value.cost) : NaN;
                const nextShare = Number.isFinite(parsedShare) ? parsedShare : null;
                const nextCost = Number.isFinite(parsedCost) ? parsedCost : null;
                if (nextShare === null && nextCost === null) return bacc;
                bacc[code] = {
                  ...value,
                  share: nextShare,
                  cost: nextCost
                };
                return bacc;
              }, {});
              if (Object.keys(inner).length) acc[gid] = inner;
              return acc;
            }, {})
          : {};

        const scopedDca = migrateDcaPlansToScoped(isPlainObject(all.dcaPlans) ? all.dcaPlans : {});
        const cleanedDcaPlans = Object.entries(scopedDca).reduce(
          (acc: Record<string, any>, [scopeKey, bucket]: [string, any]) => {
            const sk = String(scopeKey);
            if (sk !== DCA_SCOPE_GLOBAL && !validGroupIdSet.has(sk)) return acc;
            if (!isPlainObject(bucket)) return acc;
            const inner = Object.entries(bucket).reduce((bacc: Record<string, any>, [code, plan]: [string, any]) => {
              if (!fundCodes.has(code) || !isPlainObject(plan)) return bacc;
              bacc[code] = plan;
              return bacc;
            }, {});
            if (Object.keys(inner).length) acc[sk] = inner;
            return acc;
          },
          {}
        );
        if (!cleanedDcaPlans[DCA_SCOPE_GLOBAL]) cleanedDcaPlans[DCA_SCOPE_GLOBAL] = {};

        const dailyScoped = normalizeFundDailyEarningsScoped(all.fundDailyEarnings);
        const cleanedFundDailyEarnings = Object.entries(dailyScoped).reduce(
          (acc: Record<string, any>, [scopeKey, bucket]: [string, any]) => {
            if (!isPlainObject(bucket)) return acc;
            if (scopeKey !== DAILY_EARNINGS_SCOPE_ALL && !validGroupIdSet.has(scopeKey)) return acc;
            const normalizedBucket = Object.entries(bucket).reduce(
              (bacc: Record<string, any>, [code, list]: [string, any]) => {
                if (!fundCodes.has(code) || !isArray(list)) return bacc;
                const normalized = list
                  .map((item: any) => {
                    const date = item?.date ? String(item.date) : '';
                    const earnings = Number(item?.earnings);
                    const rateRaw = item?.rate;
                    const rate = rateRaw === null || rateRaw === undefined || rateRaw === '' ? null : Number(rateRaw);
                    const baseCostAmountRaw = item?.baseCostAmount;
                    const baseCostAmount =
                      baseCostAmountRaw === null || baseCostAmountRaw === undefined || baseCostAmountRaw === ''
                        ? null
                        : Number(baseCostAmountRaw);
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
                    if (!Number.isFinite(earnings)) return null;
                    return {
                      date,
                      earnings,
                      ...(Number.isFinite(rate) ? { rate } : { rate: null }),
                      ...(Number.isFinite(baseCostAmount) && (baseCostAmount ?? 0) > 0
                        ? { baseCostAmount }
                        : { baseCostAmount: null })
                    };
                  })
                  .filter(Boolean)
                  .sort((a: any, b: any) => a.date.localeCompare(b.date));
                if (normalized.length === 0) return bacc;
                bacc[code] = normalized;
                return bacc;
              },
              {}
            );
            if (Object.keys(normalizedBucket).length === 0) return acc;
            acc[scopeKey] = normalizedBucket;
            return acc;
          },
          {}
        );

        const cleanedTags = isArray(all.tags)
          ? all.tags
              .map((r: any) => {
                const codes = getFundCodesFromTagRecord(r).filter((c: string) => fundCodes.has(c));
                const name = String(r?.name ?? '').trim();
                if (!name) return null;
                return sanitizeTagRowForStorage({
                  ...r,
                  id: String(r?.id ?? '').trim() || uuidv4(),
                  name,
                  theme: String(r?.theme ?? '').trim() || DEFAULT_FUND_TAG_THEME,
                  fundCodes: codes
                });
              })
              .filter(Boolean)
          : [];

        // 合并所有 scope 的收益数据和 holdings 来计算 YTD 收益率
        const mergedEarningsForYtd = mergeAllScopedDailyEarnings(cleanedFundDailyEarnings);
        const mergedHoldingsForYtd = mergeAllHoldings(cleanedHoldings, cleanedGroupHoldings);
        const ytdReturnRate = calculateYtdReturnRate(mergedEarningsForYtd, mergedHoldingsForYtd);

        return {
          funds: all.funds,
          tags: cleanedTags,
          favorites: cleanedFavorites,
          groups: cleanedGroups,
          collapsedCodes: cleanedCollapsed,
          collapsedTrends: cleanedCollapsedTrends,
          collapsedValuationTrends: cleanedCollapsedValuationTrends,
          collapsedEarnings: cleanedCollapsedEarnings,
          refreshMs: all.refreshMs,
          holdings: cleanedHoldings,
          groupHoldings: cleanedGroupHoldings,
          pendingTrades: all.pendingTrades,
          transactions: all.transactions,
          dcaPlans: cleanedDcaPlans,
          customSettings: isPlainObject(all.customSettings) ? all.customSettings : {},
          fundDailyEarnings: cleanedFundDailyEarnings,
          fundValuationTimeseries: isPlainObject(all.fundValuationTimeseries) ? all.fundValuationTimeseries : {},
          ytdReturnRate
        };
      } else {
        // 增量同步时，也一并计算并上报 ytdReturnRate，以免云端 ytd_return_rate 长期为空
        try {
          const rawHoldings = storageStore.getItem('holdings', {});
          const rawGroupHoldings = storageStore.getItem('groupHoldings', {});
          const rawEarnings = storageStore.getItem('fundDailyEarnings', {});
          const scopedDaily = normalizeFundDailyEarningsScoped(rawEarnings);
          // 合并所有 scope 的收益数据和 holdings
          const mergedEarnings = mergeAllScopedDailyEarnings(scopedDaily);
          const mergedHoldings = mergeAllHoldings(rawHoldings, rawGroupHoldings);
          const ytdReturnRate = calculateYtdReturnRate(mergedEarnings, mergedHoldings);
          all.ytdReturnRate = ytdReturnRate;
        } catch (e) {
          console.warn('Failed to calculate ytdReturnRate for partial sync', e);
        }
      }

      return all;
    } catch {
      if (keys) return {};
      return {
        funds: [],
        tags: [],
        favorites: [],
        groups: [],
        collapsedCodes: [],
        collapsedTrends: [],
        collapsedValuationTrends: [],
        collapsedEarnings: [],
        refreshMs: 30000,
        holdings: {},
        groupHoldings: {},
        pendingTrades: [],
        transactions: {},
        dcaPlans: { [DCA_SCOPE_GLOBAL]: {} },
        customSettings: {},
        exportedAt: nowInTz().toISOString()
      };
    }
  };

  // --- flushSync & scheduleSync ---
  // 所有数据变动实时微批处理（100ms 内连带变动合并）保存至本地 SQLite 数据库
  const flushSync = useCallback(async (options: { keepalive?: boolean } = {}) => {
    if (skipSyncRef.current) return;
    if (syncDebounceRef.current) {
      clearTimeout(syncDebounceRef.current);
      syncDebounceRef.current = null;
    }
    const dirtyKeys = new Set(dirtyKeysRef.current);
    if (dirtyKeys.size === 0) return;
    dirtyKeysRef.current.clear();

    const payload = collectLocalPayload(dirtyKeys);

    try {
      setIsSyncing(true);
      const res = await saveSqliteData(payload, options);
      if (res?.success) {
        const now = res.updatedAt || nowInTz().toISOString();
        storageStore.setItem('localUpdatedAt', now);
        setLastSyncTime(now);
      }
    } catch (err) {
      console.warn('[SyncManager] SQLite real-time save error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const scheduleSync = useCallback(() => {
    if (skipSyncRef.current) return;
    if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
    syncDebounceRef.current = setTimeout(() => {
      flushSync();
    }, 100);
  }, [flushSync]);

  // 页面关闭或切换后台时，立即冲刷未落盘数据，利用 keepalive 保证请求送达
  useEffect(() => {
    const handleFlushOnExit = () => {
      if (dirtyKeysRef.current.size > 0) {
        flushSync({ keepalive: true }).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleFlushOnExit);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleFlushOnExit();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleFlushOnExit);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [flushSync]);

  // --- syncUserConfig ---
  const syncUserConfig = useCallback(
    async (
      _userId: string | null = null,
      showTip = false,
      payload: any = null,
      _isPartial = false,
      _options: any = null
    ) => {
      try {
        setIsSyncing(true);
        const baseData = payload || collectLocalPayload();
        const now = nowInTz().toISOString();

        // 立即保存至本地 SQLite
        await saveSqliteData(baseData);
        storageStore.setItem('localUpdatedAt', now);
        setLastSyncTime(now);

        if (showTip) {
          useModalStore.setState({
            successModal: {
              open: true,
              message: '配置与数据已成功保存'
            }
          });
        }
      } catch (e) {
        console.error('实时同步数据异常', e);
        showToast('数据保存失败，请重试', 'error');
      } finally {
        setIsSyncing(false);
        skipSyncRef.current = false;
      }
    },
    [showToast]
  );

  // 保持 syncUserConfigRef 与最新 syncUserConfig 同步
  useEffect(() => {
    syncUserConfigRef.current = syncUserConfig;
  }, [syncUserConfig]);

  // --- storageHelper ---
  const setOnSync = useStorageStore((s) => s.setOnSync);

  const storageHelper = useMemo(() => storageStore, []);

  // 将 setOnSync 注册移到 useEffect 中，避免在 useMemo 中执行副作用
  useEffect(() => {
    const triggerSync = (key: string) => {
      if (key === '__clear__') {
        return;
      }
      dirtyKeysRef.current.add(key);

      if (key === 'fundValuationTimeseries') {
        return;
      }

      if (!skipSyncRef.current) {
        const now = nowInTz().toISOString();
        storageStore.setItem('localUpdatedAt', now);
        setLastSyncTime(now);
      }
      scheduleSync();
    };

    setOnSync(triggerSync);
  }, [setOnSync, scheduleSync]);

  // --- cross-tab storage listener ---
  useEffect(() => {
    const keys = new Set([
      'funds',
      'tags',
      'favorites',
      'groups',
      'collapsedCodes',
      'collapsedTrends',
      'collapsedValuationTrends',
      'collapsedEarnings',
      'refreshMs',
      'holdings',
      'groupHoldings',
      'pendingTrades',
      'dcaPlans',
      'customSettings',
      'fundDailyEarnings'
    ]);
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === 'localUpdatedAt') {
        setLastSyncTime(e.newValue);
      }
      if (!keys.has(e.key)) return;

      import('../stores/storageStore').then(({ getFundCodesSignature, getTagsStoreSignature }) => {
        if (e.key === 'funds') {
          const prevSig = getFundCodesSignature(e.oldValue);
          const nextSig = getFundCodesSignature(e.newValue);
          if (prevSig === nextSig) return;
        }
        if (e.key === 'tags') {
          const prevSig = getTagsStoreSignature(e.oldValue);
          const nextSig = getTagsStoreSignature(e.newValue);
          if (prevSig === nextSig) return;
        }
        scheduleSync();
      });
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
    };
  }, [scheduleSync]);

  // --- triggerCustomSettingsSync ---
  const triggerCustomSettingsSync = useCallback(() => {
    queueMicrotask(() => {
      dirtyKeysRef.current.add('customSettings');
      if (!skipSyncRef.current) {
        const now = nowInTz().toISOString();
        storageStore.setItem('localUpdatedAt', now);
        setLastSyncTime(now);
      }
      scheduleSync();
    });
  }, [scheduleSync]);

  // --- applyCloudConfig ---
  const applyCloudConfig = useCallback(
    async (
      cloudData: any,
      cloudUpdatedAt?: string | null,
      options: {
        silent?: boolean;
        forceTakeover?: boolean;
        userId?: string | null;
        refreshAfterApply?: boolean;
      } = {}
    ) => {
      if (!isPlainObject(cloudData)) return;
      skipSyncRef.current = true;
      try {
        if (cloudUpdatedAt) {
          storageStore.setItem('localUpdatedAt', cloudUpdatedAt);
        }
        let localFundsForMerge: any[] = [];
        try {
          localFundsForMerge = storageStore.getItem('funds', []) as any[];
        } catch {}
        const localFundByCode = new Map(
          localFundsForMerge
            .map(stripLegacyTagsFromFundObject)
            .filter((f) => f && f.code != null)
            .map((f) => [String(f.code), f])
        );

        const cloudFunds = isArray(cloudData.funds)
          ? dedupeByCode(cloudData.funds.map(stripLegacyTagsFromFundObject))
          : [];
        let nextFunds: any[];
        if (cloudFunds.length === 0 && localFundsForMerge.length > 0 && !options.forceTakeover) {
          nextFunds = localFundsForMerge;
        } else {
          nextFunds = cloudFunds.map((cf: any) =>
            mergeValuationFieldsByGztime(localFundByCode.get(String(cf?.code)), cf)
          );
          useStorageStore.getState().setFunds(nextFunds);
        }
        const nextFundCodes = new Set(nextFunds.map((f: any) => f.code));

        if (hasOwn(cloudData, 'tags')) {
          const cleanedTagRows = (isArray(cloudData.tags) ? cloudData.tags : [])
            .map((r: any) => {
              const codes = getFundCodesFromTagRecord(r).filter((c: string) => nextFundCodes.has(c));
              const name = String(r?.name ?? '').trim();
              if (!name) return null;
              return sanitizeTagRowForStorage({
                ...r,
                id: String(r?.id ?? '').trim() || uuidv4(),
                name,
                theme: String(r?.theme ?? '').trim() || DEFAULT_FUND_TAG_THEME,
                fundCodes: codes
              });
            })
            .filter(Boolean);
          setFundTagRecords(cleanedTagRows);
          storageStore.setItem('tags', JSON.stringify(cleanedTagRows));
        } else {
          try {
            const localTags = storageStore.getItem('tags', []) as any[];
            const normalized = localTags
              .map((r) => {
                const codes = getFundCodesFromTagRecord(r).filter((c: string) => nextFundCodes.has(c));
                return sanitizeTagRowForStorage({
                  ...r,
                  id: String(r.id || '').trim() || uuidv4(),
                  name: String(r.name || '').trim(),
                  theme: String(r.theme || '').trim() || DEFAULT_FUND_TAG_THEME,
                  fundCodes: codes
                });
              })
              .filter(Boolean);
            setFundTagRecords(normalized);
          } catch {
            setFundTagRecords([]);
          }
        }

        const nextFavorites = cleanCodeArray(cloudData.favorites, nextFundCodes);
        useStorageStore.getState().setFavorites(new Set(nextFavorites));

        const nextGroups = ensurePresetGroups(
          isArray(cloudData.groups)
            ? cloudData.groups
                .map((g: any) => ({
                  ...g,
                  id: String(g?.id ?? '').trim() || uuidv4(),
                  name: String(g?.name ?? '').trim(),
                  codes: cleanCodeArray(g?.codes, nextFundCodes)
                }))
                .filter((g: any) => g.name.length > 0 || g.id === 'fav' || g.isPreset)
            : []
        );
        useStorageStore.getState().setGroups(nextGroups);

        const nextCollapsed = isArray(cloudData.collapsedCodes) ? cloudData.collapsedCodes : [];
        useStorageStore.getState().setCollapsedCodes(new Set(nextCollapsed));

        if (isArray(cloudData.collapsedTrends)) {
          useStorageStore.getState().setCollapsedTrends(new Set(cloudData.collapsedTrends));
        }
        if (isArray(cloudData.collapsedValuationTrends)) {
          useStorageStore.getState().setCollapsedValuationTrends(new Set(cloudData.collapsedValuationTrends));
        }
        if (isArray(cloudData.collapsedEarnings)) {
          useStorageStore.getState().setCollapsedEarnings(new Set(cloudData.collapsedEarnings));
        }

        const nextRefreshMs =
          Number.isFinite(cloudData.refreshMs) && cloudData.refreshMs >= 5000 ? cloudData.refreshMs : 30000;
        useStorageStore.getState().setRefreshMs(nextRefreshMs);
        setTempSeconds(Math.round(nextRefreshMs / 1000));

        const nextHoldings = isPlainObject(cloudData.holdings) ? cloudData.holdings : {};
        if (
          Object.keys(nextHoldings).length > 0 ||
          options.forceTakeover ||
          Object.keys(useStorageStore.getState().holdings || {}).length === 0
        ) {
          useStorageStore.getState().setHoldings(nextHoldings);
        }

        const cloudGroupIds = new Set(nextGroups.map((g: any) => g?.id).filter(Boolean));

        const nextGroupHoldings = isPlainObject(cloudData.groupHoldings) ? cloudData.groupHoldings : {};
        if (
          Object.keys(nextGroupHoldings).length > 0 ||
          options.forceTakeover ||
          Object.keys(useStorageStore.getState().groupHoldings || {}).length === 0
        ) {
          useStorageStore.getState().setGroupHoldings(nextGroupHoldings);
        }

        if (hasOwn(cloudData, 'pendingTrades')) {
          const nextPendingTrades = isArray(cloudData.pendingTrades)
            ? cloudData.pendingTrades.filter((trade: any) => {
                if (!trade || !nextFundCodes.has(trade.fundCode)) return false;
                if (trade.groupId && !cloudGroupIds.has(trade.groupId)) return false;
                return true;
              })
            : [];
          useStorageStore.getState().setPendingTrades(nextPendingTrades);
        } else {
          try {
            const localPending = storageStore.getItem('pendingTrades', []) as any[];
            useStorageStore.getState().setPendingTrades(isArray(localPending) ? localPending : []);
          } catch {}
        }

        if (hasOwn(cloudData, 'transactions')) {
          const nextTransactions = isPlainObject(cloudData.transactions) ? cloudData.transactions : {};
          useStorageStore.getState().setTransactions(nextTransactions);
        } else {
          try {
            const localTx = storageStore.getItem('transactions', {});
            useStorageStore.getState().setTransactions(isPlainObject(localTx) ? localTx : {});
          } catch {}
        }

        if (hasOwn(cloudData, 'dcaPlans')) {
          const cloudDcaScoped = migrateDcaPlansToScoped(isPlainObject(cloudData.dcaPlans) ? cloudData.dcaPlans : {});
          const nextDcaPlans: Record<string, any> = {};
          Object.entries(cloudDcaScoped).forEach(([scopeKey, bucket]: [string, any]) => {
            if (scopeKey !== DCA_SCOPE_GLOBAL && !cloudGroupIds.has(scopeKey)) return;
            if (!isPlainObject(bucket)) return;
            const inner: Record<string, any> = {};
            Object.entries(bucket).forEach(([code, plan]: [string, any]) => {
              if (!nextFundCodes.has(code) || !isPlainObject(plan)) return;
              inner[code] = plan;
            });
            if (Object.keys(inner).length) nextDcaPlans[scopeKey] = inner;
          });
          if (!nextDcaPlans[DCA_SCOPE_GLOBAL]) nextDcaPlans[DCA_SCOPE_GLOBAL] = {};
          useStorageStore.getState().setDcaPlans(nextDcaPlans);
        } else {
          try {
            const localDca = storageStore.getItem('dcaPlans', {});
            useStorageStore.getState().setDcaPlans(migrateDcaPlansToScoped(isPlainObject(localDca) ? localDca : {}));
          } catch {}
        }

        const cloudDaily = normalizeFundDailyEarningsScoped(cloudData.fundDailyEarnings);
        const nextFundDailyEarnings = Object.entries(cloudDaily).reduce(
          (acc: Record<string, any>, [scopeKey, bucket]: [string, any]) => {
            if (!isPlainObject(bucket)) return acc;
            if (scopeKey !== DAILY_EARNINGS_SCOPE_ALL && !cloudGroupIds.has(scopeKey)) return acc;
            const normalizedBucket = Object.entries(bucket).reduce(
              (bacc: Record<string, any>, [code, list]: [string, any]) => {
                if (!nextFundCodes.has(code) || !isArray(list)) return bacc;
                const normalized = list
                  .map((item: any) => {
                    const date = item?.date ? String(item.date) : '';
                    const earnings = Number(item?.earnings);
                    const rateRaw = item?.rate;
                    const rate = rateRaw === null || rateRaw === undefined || rateRaw === '' ? null : Number(rateRaw);
                    const baseCostAmountRaw = item?.baseCostAmount;
                    const baseCostAmount =
                      baseCostAmountRaw === null || baseCostAmountRaw === undefined || baseCostAmountRaw === ''
                        ? null
                        : Number(baseCostAmountRaw);
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
                    if (!Number.isFinite(earnings)) return null;
                    return {
                      date,
                      earnings,
                      ...(Number.isFinite(rate) ? { rate } : { rate: null }),
                      ...(Number.isFinite(baseCostAmount) && (baseCostAmount ?? 0) > 0
                        ? { baseCostAmount }
                        : { baseCostAmount: null })
                    };
                  })
                  .filter(Boolean)
                  .sort((a: any, b: any) => a.date.localeCompare(b.date));
                if (normalized.length === 0) return bacc;
                bacc[code] = normalized;
                return bacc;
              },
              {}
            );
            if (Object.keys(normalizedBucket).length === 0) return acc;
            acc[scopeKey] = normalizedBucket;
            return acc;
          },
          {}
        );
        useStorageStore.getState().setFundDailyEarnings(nextFundDailyEarnings);

        if (hasOwn(cloudData, 'fundValuationTimeseries')) {
          const nextTimeseries = isPlainObject(cloudData.fundValuationTimeseries)
            ? cloudData.fundValuationTimeseries
            : {};
          const localTimeseries = storageStore.getItem('fundValuationTimeseries', {}) as Record<string, any>;
          const mergedTimeseries = { ...localTimeseries };

          const mergeSeries = (cloudArr: any[], localArr: any[]) => {
            const pointsMap = new Map();
            localArr.forEach((pt: any) => {
              if (pt && pt.date && pt.time) pointsMap.set(`${pt.date}_${pt.time}`, pt);
            });
            cloudArr.forEach((pt: any) => {
              if (pt && pt.date && pt.time) pointsMap.set(`${pt.date}_${pt.time}`, pt);
            });
            let mergedArr = Array.from(pointsMap.values()).sort((a, b) => {
              if (a.date !== b.date) return a.date.localeCompare(b.date);
              return a.time.localeCompare(b.time);
            });
            const maxDate = mergedArr.reduce((max, pt) => (pt.date > max ? pt.date : max), '');
            if (maxDate) mergedArr = mergedArr.filter((pt) => pt.date === maxDate);
            return mergedArr;
          };

          Object.keys(nextTimeseries).forEach((code) => {
            if (!nextFundCodes.has(code)) return;
            const cloudEntry = nextTimeseries[code];
            const localEntry = mergedTimeseries[code];
            if (isArray(cloudEntry)) {
              const localArr = isArray(localEntry) ? localEntry : [];
              mergedTimeseries[code] = { 1: mergeSeries(cloudEntry, localArr) };
              return;
            }
            if (isPlainObject(cloudEntry)) {
              const localDsMap = isPlainObject(localEntry) ? localEntry : {};
              const mergedDsMap = { ...localDsMap };
              Object.keys(cloudEntry).forEach((ds) => {
                if (!isArray(cloudEntry[ds])) return;
                const localArr = isArray(mergedDsMap[ds]) ? mergedDsMap[ds] : [];
                mergedDsMap[ds] = mergeSeries(cloudEntry[ds], localArr);
              });
              mergedTimeseries[code] = mergedDsMap;
            }
          });

          const cleanedTimeseries: Record<string, any> = {};
          Object.keys(mergedTimeseries).forEach((code) => {
            if (nextFundCodes.has(code)) {
              cleanedTimeseries[code] = mergedTimeseries[code];
            }
          });
          storageStore.setItem('fundValuationTimeseries', JSON.stringify(cleanedTimeseries));
        }

        if (isPlainObject(cloudData.customSettings)) {
          try {
            const merged = { ...cloudData.customSettings };
            useStorageStore.getState().setCustomSettings(merged);
            if (merged.localSortRules && isArray(merged.localSortRules)) {
              useStorageStore.getState().setSortRules(merged.localSortRules);
            }
            if (isString(merged.localSortDisplayMode) && SORT_DISPLAY_MODES.has(merged.localSortDisplayMode as any)) {
              useStorageStore.getState().setPcSortDisplayMode(merged.localSortDisplayMode);
              useStorageStore.getState().setMobileSortDisplayMode(merged.localSortDisplayMode);
            } else {
              if (
                isString(merged.pcLocalSortDisplayMode) &&
                SORT_DISPLAY_MODES.has(merged.pcLocalSortDisplayMode as any)
              ) {
                useStorageStore.getState().setPcSortDisplayMode(merged.pcLocalSortDisplayMode);
              }
              if (
                isString(merged.mobileLocalSortDisplayMode) &&
                SORT_DISPLAY_MODES.has(merged.mobileLocalSortDisplayMode as any)
              ) {
                useStorageStore.getState().setMobileSortDisplayMode(merged.mobileLocalSortDisplayMode);
              }
            }
          } catch {}
        }

        if (options.forceTakeover) {
          const currentUserId = options.userId || userIdRef.current;
          if (currentUserId) {
            await syncUserConfig(currentUserId, true, null, false, { forceTakeover: true });
          }
        }

        if (nextFunds.length) {
          const codes = Array.from(new Set(nextFunds.map((f: any) => f.code)));
          const localCodesSet = new Set(localFundsForMerge.map((f: any) => f?.code).filter(Boolean));
          const hasNewFunds = codes.some((code) => !localCodesSet.has(code));
          const shouldRefreshAfterApply = options.refreshAfterApply || hasNewFunds;

          if (shouldRefreshAfterApply && isFunction(refreshAllRef.current)) {
            await refreshAllRef.current(codes);
          }
          const currentUserId = userIdRef.current;
          if (currentUserId) {
            try {
              const latestFunds = storageStore.getItem('funds', []) as any[];
              const localSig = getFundCodesSignature(latestFunds, ['gztime']);
              const cloudSig = getFundCodesSignature(isArray(cloudData.funds) ? cloudData.funds : [], ['gztime']);
              if (localSig !== cloudSig) {
                await syncUserConfig(
                  currentUserId,
                  false,
                  { funds: isArray(latestFunds) ? latestFunds : [] },
                  true,
                  options
                );
              }
            } catch (e) {
              console.error('刷新后强制同步 funds 到云端失败', e);
            }
          }
        }

        const payload = collectLocalPayload();
        lastSyncedRef.current = getComparablePayload(payload);
      } finally {
        skipSyncRef.current = false;
      }
    },
    [setTempSeconds, setFundTagRecords, syncUserConfig, refreshAllRef]
  );

  // 页面启动时，自动从服务端 SQLite 加载全部数据（严格仅在挂载时运行一次，避免依赖重构触发重复覆盖）
  const hasInitSqliteRef = useRef(false);
  useEffect(() => {
    if (hasInitSqliteRef.current) return;
    hasInitSqliteRef.current = true;

    let isMounted = true;
    const initFromSqlite = async () => {
      try {
        const res = await fetchSqliteData();
        if (!isMounted) return;
        if (res?.data && isPlainObject(res.data) && Object.keys(res.data).length > 0) {
          // SQLite 已有数据，应用到 Store
          await applyCloudConfig(res.data, res.updatedAt || nowInTz().toISOString(), { silent: true });
          setLastSyncTime(res.updatedAt || nowInTz().toISOString());
        } else {
          // SQLite 尚无数据，若浏览器本地有持仓数据，自动同步至 SQLite 完成首次初始化迁移
          const initialPayload = collectLocalPayload();
          if (
            initialPayload &&
            (initialPayload.funds?.length > 0 || Object.keys(initialPayload.holdings || {}).length > 0)
          ) {
            await saveSqliteData(initialPayload);
            setLastSyncTime(nowInTz().toISOString());
          }
        }
      } catch (e) {
        console.warn('[SyncManager] Init from SQLite failed:', e);
      }
    };

    initFromSqlite();
    return () => {
      isMounted = false;
    };
  }, [applyCloudConfig]);

  return {
    isSyncing,
    lastSyncTime,
    scheduleSync,
    syncUserConfig,
    applyCloudConfig,
    triggerCustomSettingsSync,
    skipSyncRef,
    storageHelper
  };
}
