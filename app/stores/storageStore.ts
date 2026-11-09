import { create } from 'zustand';
import { isArray, isBoolean, isEqual, isFunction, isNumber, isObject, isString } from 'lodash';
import { getFundCodesFromTagRecord } from '@/app/lib/fundHelpers';
import { DEFAULT_SORT_RULES, SORT_DISPLAY_MODES, type SortRule } from '@/app/constants';
import type { Fund, FundGroup } from '@/types';

type ValueOrUpdater<T> = T | ((prev: T) => T);

export interface SetItemOptions {
  skipZustandUpdate?: boolean;
}

/**
 * 签名函数：用于检测 funds 列表是否发生实质性变更（jzrq, dwjz 等核心字段）
 */
export const getFundCodesSignature = (value: unknown, extraFields: string[] = []): string => {
  try {
    const list = isArray(value) ? value : JSON.parse(String(value || '[]'));
    if (!isArray(list)) return '';
    const fields = Array.from(
      new Set(['jzrq', 'dwjz', 'dataSource', 'showImageChart', ...(isArray(extraFields) ? extraFields : [])])
    );
    const items = list
      .map((item: any) => {
        if (!item?.code) return null;
        const extras = fields.map((field) => item?.[field] ?? '').join(':');
        return `${item.code}:${extras}`;
      })
      .filter(Boolean);
    return Array.from(new Set(items)).join('|');
  } catch {
    return '';
  }
};

/**
 * 签名函数：用于检测 tags 存储是否发生实质性变更
 */
export const getTagsStoreSignature = (value: unknown): string => {
  try {
    const list = isArray(value) ? value : JSON.parse(String(value || '[]'));
    if (!isArray(list)) return '';
    return list
      .map((r: any) => {
        const codes = getFundCodesFromTagRecord(r).sort().join(',');
        return `${codes}\u001e${String(r?.id ?? '').trim()}\u001e${String(r?.name ?? '').trim()}\u001e${String(r?.theme ?? '').trim()}`;
      })
      .sort()
      .join('|');
  } catch {
    return '';
  }
};

/**
 * 辅助函数：确保 groups 数组中始终包含预置的分组节点（如“自选”），且所有节点的数据结构合法
 */
export const ensurePresetGroups = (groupsInput: unknown): FundGroup[] => {
  const list: FundGroup[] = isArray(groupsInput) ? [...(groupsInput as FundGroup[])] : [];
  const favIndex = list.findIndex((g) => g && (g.id === 'fav' || g.isPreset));
  if (favIndex === -1) {
    list.unshift({
      id: 'fav',
      name: '自选',
      isPreset: true,
      codes: []
    });
  } else {
    list[favIndex] = {
      ...list[favIndex],
      id: 'fav',
      name: '自选',
      isPreset: true,
      codes: isArray(list[favIndex].codes) ? list[favIndex].codes : []
    };
  }
  return list.map((g) => ({
    ...g,
    codes: isArray(g?.codes) ? g.codes : []
  }));
};

/**
 * 仅以下 key 参与云端同步
 */
const SYNC_KEYS = new Set([
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
  'transactions',
  'dcaPlans',
  'customSettings',
  'fundDailyEarnings',
  'fundDividends',
  'fundValuationTimeseries'
]);

export { SORT_DISPLAY_MODES, DEFAULT_SORT_RULES };

export const normalizePendingTrades = (value: unknown): any[] => {
  if (!isArray(value)) return [];
  const seenIds = new Set<string>();
  const next: any[] = [];

  for (const trade of value) {
    if (!trade || !isObject(trade)) continue;
    const id = (trade as any).id == null ? '' : String((trade as any).id);
    if (id) {
      if (seenIds.has(id)) continue;
      seenIds.add(id);
    }
    next.push(trade);
  }

  return next;
};

const normalizeStorageValue = (key: string, value: string): string => {
  if (key !== 'pendingTrades') return value;
  try {
    const parsed = isString(value) ? JSON.parse(value) : value;
    return JSON.stringify(normalizePendingTrades(parsed));
  } catch {
    return value;
  }
};

export interface StorageStoreState {
  onSync: ((key: string, prevValue: string | null, nextValue: string | null) => void) | null;
  setOnSync: (callback: ((key: string, prevValue: string | null, nextValue: string | null) => void) | null) => void;

  funds: Fund[];
  tags: any[];
  groups: FundGroup[];
  favorites: Set<string>;
  collapsedCodes: Set<string>;
  collapsedTrends: Set<string>;
  collapsedValuationTrends: Set<string>;
  collapsedEarnings: Set<string>;
  refreshMs: number;
  holdings: Record<string, any>;
  groupHoldings: Record<string, any>;
  pendingTrades: any[];
  transactions: Record<string, any>;
  dcaPlans: Record<string, any>;
  customSettings: Record<string, any>;
  fundDailyEarnings: Record<string, any>;
  fundDividends: Record<string, any>;
  valuationSeries: Record<string, any>;

  sortBy: string;
  sortOrder: 'desc' | 'asc';
  pcSortDisplayMode: string;
  mobileSortDisplayMode: string;
  sortRules: SortRule[];

  initFunds: () => void;
  initTags: () => void;
  initGroups: () => void;
  initFavorites: () => void;
  initRefreshMs: () => void;
  initHoldings: () => void;
  initGroupHoldings: () => void;
  initPendingTrades: () => void;
  initTransactions: () => void;
  initDcaPlans: () => void;
  initCustomSettings: () => void;
  initFundDailyEarnings: () => void;
  initFundDividends: () => void;
  initCollapsed: () => void;
  initSort: () => void;

  setFunds: (nextFunds: ValueOrUpdater<Fund[]>) => void;
  setTags: (nextTags: ValueOrUpdater<any[]>) => void;
  setGroups: (nextGroups: ValueOrUpdater<FundGroup[]>) => void;
  setFavorites: (nextFavs: ValueOrUpdater<Set<string>>) => void;
  setCollapsedCodes: (nextVal: ValueOrUpdater<Set<string>>) => void;
  setCollapsedTrends: (nextVal: ValueOrUpdater<Set<string>>) => void;
  setCollapsedValuationTrends: (nextVal: ValueOrUpdater<Set<string>>) => void;
  setCollapsedEarnings: (nextVal: ValueOrUpdater<Set<string>>) => void;
  setRefreshMs: (ms: number) => void;
  setHoldings: (nextHoldings: ValueOrUpdater<Record<string, any>>) => void;
  setGroupHoldings: (nextGroupHoldings: ValueOrUpdater<Record<string, any>>) => void;
  setPendingTrades: (nextPendingTrades: ValueOrUpdater<any[]>) => void;
  setTransactions: (nextTransactions: ValueOrUpdater<Record<string, any>>) => void;
  setDcaPlans: (nextDcaPlans: ValueOrUpdater<Record<string, any>>) => void;
  setCustomSettings: (nextCustomSettings: ValueOrUpdater<Record<string, any>>) => void;
  setSortBy: (nextSortBy: ValueOrUpdater<string>) => void;
  setSortOrder: (nextSortOrder: ValueOrUpdater<'desc' | 'asc'>) => void;
  setPcSortDisplayMode: (nextMode: ValueOrUpdater<string>) => void;
  setMobileSortDisplayMode: (nextMode: ValueOrUpdater<string>) => void;
  setSortRules: (nextRules: ValueOrUpdater<SortRule[]>) => void;
  _persistSortSettings: (patch?: {
    pcSortDisplayMode?: string;
    mobileSortDisplayMode?: string;
    sortRules?: SortRule[];
  }) => void;
  setFundDailyEarnings: (nextFundDailyEarnings: ValueOrUpdater<Record<string, any>>) => void;
  setFundDividends: (nextFundDividends: ValueOrUpdater<Record<string, any>>) => void;
  setValuationSeries: (nextValuationSeries: ValueOrUpdater<Record<string, any>>) => void;

  setItem: (key: string, value: any, options?: SetItemOptions) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  getItem: <T = any>(key: string, defaultValue?: T) => T;
}

/**
 * 管理 localStorage 数据的 Zustand Store
 */
export const useStorageStore = create<StorageStoreState>((set, get) => ({
  // 云端同步回调，由 Page 组件注入
  onSync: null,

  /** 注入同步回调 */
  setOnSync: (callback) => set({ onSync: callback }),

  funds: [],
  tags: [],
  groups: [],
  favorites: new Set(),
  collapsedCodes: new Set(),
  collapsedTrends: new Set(),
  collapsedValuationTrends: new Set(),
  collapsedEarnings: new Set(),
  refreshMs: 30000,
  holdings: {},
  groupHoldings: {},
  pendingTrades: [],
  transactions: {},
  dcaPlans: {},
  customSettings: {},
  fundDailyEarnings: {},
  fundDividends: {},

  // 估值分时序列（每次调用估值接口记录，用于分时图，不持久化）
  valuationSeries: {},

  // 排序相关状态
  sortBy: 'default',
  sortOrder: 'desc',
  pcSortDisplayMode: 'dropdown',
  mobileSortDisplayMode: 'dropdown',
  sortRules: DEFAULT_SORT_RULES,

  initFunds: () => {
    if (typeof window !== 'undefined') {
      const saved = get().getItem('funds', []);
      set({ funds: isArray(saved) ? saved : [] });
    }
  },

  initTags: () => {
    if (typeof window !== 'undefined') {
      const saved = get().getItem('tags', []);
      set({ tags: isArray(saved) ? saved : [] });
    }
  },

  initGroups: () => {
    if (typeof window !== 'undefined') {
      const raw = get().getItem('groups', []);
      const ensured = ensurePresetGroups(raw);
      set({ groups: ensured });
      if (JSON.stringify(raw) !== JSON.stringify(ensured)) {
        get().setItem('groups', JSON.stringify(ensured));
      }
    }
  },

  initFavorites: () => {
    if (typeof window !== 'undefined') {
      const saved = get().getItem('favorites', []);
      set({ favorites: new Set(isArray(saved) ? saved : []) });
    }
  },

  initRefreshMs: () => {
    if (typeof window !== 'undefined') {
      const raw = get().getItem('refreshMs', 30000);
      const savedMs = parseInt(String(raw), 10);
      set({ refreshMs: Number.isFinite(savedMs) && savedMs >= 5000 ? savedMs : 30000 });
    }
  },

  initHoldings: () => {
    if (typeof window !== 'undefined') {
      set({ holdings: get().getItem('holdings', {}) });
    }
  },

  initGroupHoldings: () => {
    if (typeof window !== 'undefined') {
      set({ groupHoldings: get().getItem('groupHoldings', {}) });
    }
  },

  initPendingTrades: () => {
    if (typeof window !== 'undefined') {
      set({ pendingTrades: get().getItem('pendingTrades', []) });
    }
  },

  initTransactions: () => {
    if (typeof window !== 'undefined') {
      set({ transactions: get().getItem('transactions', {}) });
    }
  },

  initDcaPlans: () => {
    if (typeof window !== 'undefined') {
      set({ dcaPlans: get().getItem('dcaPlans', {}) });
    }
  },

  initCustomSettings: () => {
    if (typeof window !== 'undefined') {
      set({ customSettings: get().getItem('customSettings', {}) });
    }
  },

  initFundDailyEarnings: () => {
    if (typeof window !== 'undefined') {
      const parsed = get().getItem('fundDailyEarnings', {});
      if (parsed && isObject(parsed) && !isArray(parsed)) {
        const values = Object.values(parsed);
        const hasScoped = values.some((v) => v && isObject(v) && !isArray(v));
        if (!hasScoped && Object.keys(parsed).length > 0) {
          // 迁移旧版扁平格式为 { "all": 原对象 }
          set({ fundDailyEarnings: { all: parsed } });
          return;
        }
      }
      set({ fundDailyEarnings: parsed });
    }
  },

  initFundDividends: () => {
    if (typeof window !== 'undefined') {
      set({ fundDividends: get().getItem('fundDividends', {}) });
    }
  },

  initCollapsed: () => {
    if (typeof window !== 'undefined') {
      const cc = get().getItem('collapsedCodes', []);
      const ct = get().getItem('collapsedTrends', []);
      const cvt = get().getItem('collapsedValuationTrends', []);
      const ce = get().getItem('collapsedEarnings', []);
      set({
        collapsedCodes: new Set(isArray(cc) ? cc : []),
        collapsedTrends: new Set(isArray(ct) ? ct : []),
        collapsedValuationTrends: new Set(isArray(cvt) ? cvt : []),
        collapsedEarnings: new Set(isArray(ce) ? ce : [])
      });
    }
  },

  /**
   * 初始化排序相关状态，从 localStorage 恢复持久化的排序偏好
   */
  initSort: () => {
    if (typeof window === 'undefined') return;

    const savedSortBy = get().getItem('localSortBy');
    const savedSortOrder = get().getItem('localSortOrder');

    const nextState: Partial<StorageStoreState> = {};
    if (savedSortBy) nextState.sortBy = savedSortBy;
    if (savedSortOrder === 'asc' || savedSortOrder === 'desc') nextState.sortOrder = savedSortOrder;

    // 从 customSettings 读取排序规则和展示模式
    try {
      const settings = (get().getItem('customSettings', {}) || {}) as Record<string, any>;
      if (settings && isObject(settings)) {
        // 展示模式：优先读取按端口分别存储的字段，向后兼容旧版单一字段
        if (isString(settings.localSortDisplayMode) && SORT_DISPLAY_MODES.has(settings.localSortDisplayMode)) {
          nextState.pcSortDisplayMode = settings.localSortDisplayMode;
          nextState.mobileSortDisplayMode = settings.localSortDisplayMode;
        } else {
          if (isString(settings.pcLocalSortDisplayMode) && SORT_DISPLAY_MODES.has(settings.pcLocalSortDisplayMode)) {
            nextState.pcSortDisplayMode = settings.pcLocalSortDisplayMode;
          }
          if (
            isString(settings.mobileLocalSortDisplayMode) &&
            SORT_DISPLAY_MODES.has(settings.mobileLocalSortDisplayMode)
          ) {
            nextState.mobileSortDisplayMode = settings.mobileLocalSortDisplayMode;
          }
        }

        // 排序规则：优先从 customSettings.localSortRules 读取，兼容旧版独立 localSortRules 字段
        let rulesFromSettings = null;
        if (isArray(settings.localSortRules)) {
          rulesFromSettings = settings.localSortRules;
        }
        if (!rulesFromSettings) {
          const legacyRules = get().getItem('localSortRules');
          if (isArray(legacyRules)) rulesFromSettings = legacyRules;
        }

        if (rulesFromSettings && rulesFromSettings.length) {
          const defaultMap = new Map(DEFAULT_SORT_RULES.map((r) => [r.id, r]));
          const merged: SortRule[] = [];
          for (const stored of rulesFromSettings) {
            const base = defaultMap.get(stored.id);
            if (!base) continue;
            merged.push({
              ...base,
              enabled: isBoolean(stored.enabled) ? stored.enabled : base.enabled,
              alias: isString(stored.alias) && stored.alias.trim() ? stored.alias.trim() : base.alias
            });
          }
          // 追加新版本新增但本地未记录的规则
          DEFAULT_SORT_RULES.forEach((rule) => {
            if (!merged.some((r) => r.id === rule.id)) merged.push(rule);
          });
          nextState.sortRules = merged;
        }
      }
    } catch {
      // ignore
    }

    if (Object.keys(nextState).length) set(nextState as Partial<StorageStoreState>);
  },

  setFunds: (nextFunds) => {
    const next = isFunction(nextFunds) ? nextFunds(get().funds) : nextFunds;
    set({ funds: next });
    get().setItem('funds', JSON.stringify(next), { skipZustandUpdate: true });
  },

  setTags: (nextTags) => {
    const next = isFunction(nextTags) ? nextTags(get().tags) : nextTags;
    set({ tags: next });
    get().setItem('tags', JSON.stringify(next), { skipZustandUpdate: true });
  },

  setGroups: (nextGroups) => {
    const raw = isFunction(nextGroups) ? nextGroups(get().groups) : nextGroups;
    const next = ensurePresetGroups(raw);
    set({ groups: next });
    get().setItem('groups', JSON.stringify(next), { skipZustandUpdate: true });
  },

  setFavorites: (nextFavs) => {
    const next = isFunction(nextFavs) ? nextFavs(get().favorites) : nextFavs;
    set({ favorites: next });
    get().setItem('favorites', JSON.stringify(Array.from(next)), { skipZustandUpdate: true });
  },

  setCollapsedCodes: (nextVal) => {
    const next = isFunction(nextVal) ? nextVal(get().collapsedCodes) : nextVal;
    set({ collapsedCodes: next });
    get().setItem('collapsedCodes', JSON.stringify(Array.from(next)), { skipZustandUpdate: true });
  },

  setCollapsedTrends: (nextVal) => {
    const next = isFunction(nextVal) ? nextVal(get().collapsedTrends) : nextVal;
    set({ collapsedTrends: next });
    get().setItem('collapsedTrends', JSON.stringify(Array.from(next)), { skipZustandUpdate: true });
  },

  setCollapsedValuationTrends: (nextVal) => {
    const next = isFunction(nextVal) ? nextVal(get().collapsedValuationTrends) : nextVal;
    set({ collapsedValuationTrends: next });
    get().setItem('collapsedValuationTrends', JSON.stringify(Array.from(next)), { skipZustandUpdate: true });
  },

  setCollapsedEarnings: (nextVal) => {
    const next = isFunction(nextVal) ? nextVal(get().collapsedEarnings) : nextVal;
    set({ collapsedEarnings: next });
    get().setItem('collapsedEarnings', JSON.stringify(Array.from(next)), { skipZustandUpdate: true });
  },

  setRefreshMs: (ms) => {
    set({ refreshMs: ms });
    get().setItem('refreshMs', String(ms), { skipZustandUpdate: true });
  },

  setHoldings: (nextHoldings) => {
    const next = isFunction(nextHoldings) ? nextHoldings(get().holdings) : nextHoldings;
    set({ holdings: next });
    get().setItem('holdings', JSON.stringify(next), { skipZustandUpdate: true });
  },

  setGroupHoldings: (nextGroupHoldings) => {
    const next = isFunction(nextGroupHoldings) ? nextGroupHoldings(get().groupHoldings) : nextGroupHoldings;
    set({ groupHoldings: next });
    get().setItem('groupHoldings', JSON.stringify(next), { skipZustandUpdate: true });
  },

  setPendingTrades: (nextPendingTrades) => {
    const next = normalizePendingTrades(
      isFunction(nextPendingTrades) ? nextPendingTrades(get().pendingTrades) : nextPendingTrades
    );
    set({ pendingTrades: next });
    get().setItem('pendingTrades', JSON.stringify(next), { skipZustandUpdate: true });
  },

  setTransactions: (nextTransactions) => {
    const next = isFunction(nextTransactions) ? nextTransactions(get().transactions) : nextTransactions;
    set({ transactions: next });
    get().setItem('transactions', JSON.stringify(next), { skipZustandUpdate: true });
  },

  setDcaPlans: (nextDcaPlans) => {
    const next = isFunction(nextDcaPlans) ? nextDcaPlans(get().dcaPlans) : nextDcaPlans;
    set({ dcaPlans: next });
    get().setItem('dcaPlans', JSON.stringify(next), { skipZustandUpdate: true });
  },

  setCustomSettings: (nextCustomSettings) => {
    const next = isFunction(nextCustomSettings) ? nextCustomSettings(get().customSettings) : nextCustomSettings;
    set({ customSettings: next });
    get().setItem('customSettings', JSON.stringify(next), { skipZustandUpdate: true });
  },

  setSortBy: (nextSortBy) => {
    const val = isFunction(nextSortBy) ? nextSortBy(get().sortBy) : nextSortBy;
    set({ sortBy: val });
    get().setItem('localSortBy', val, { skipZustandUpdate: true });
  },

  setSortOrder: (nextSortOrder) => {
    const val = isFunction(nextSortOrder) ? nextSortOrder(get().sortOrder) : nextSortOrder;
    set({ sortOrder: val });
    get().setItem('localSortOrder', val, { skipZustandUpdate: true });
  },

  setPcSortDisplayMode: (nextMode) => {
    const val = isFunction(nextMode) ? nextMode(get().pcSortDisplayMode) : nextMode;
    set({ pcSortDisplayMode: val });
    get()._persistSortSettings({ pcSortDisplayMode: val });
  },

  setMobileSortDisplayMode: (nextMode) => {
    const val = isFunction(nextMode) ? nextMode(get().mobileSortDisplayMode) : nextMode;
    set({ mobileSortDisplayMode: val });
    get()._persistSortSettings({ mobileSortDisplayMode: val });
  },

  setSortRules: (nextRules) => {
    const val = isFunction(nextRules) ? nextRules(get().sortRules) : nextRules;
    set({ sortRules: val });
    get()._persistSortSettings({ sortRules: val });
  },

  /**
   * 将排序展示模式和规则合并写入 customSettings 持久化
   */
  _persistSortSettings: (patch = {}) => {
    try {
      const current = (get().customSettings || {}) as Record<string, any>;
      const next = {
        ...current,
        localSortRules: patch.sortRules !== undefined ? patch.sortRules : get().sortRules,
        pcLocalSortDisplayMode:
          patch.pcSortDisplayMode !== undefined ? patch.pcSortDisplayMode : get().pcSortDisplayMode,
        mobileLocalSortDisplayMode:
          patch.mobileSortDisplayMode !== undefined ? patch.mobileSortDisplayMode : get().mobileSortDisplayMode
      };
      // 删除旧字段兼容历史数据
      delete (next as any).localSortDisplayMode;
      set({ customSettings: next });
      get().setItem('customSettings', JSON.stringify(next), { skipZustandUpdate: true });
    } catch {
      // ignore
    }
  },

  setFundDailyEarnings: (nextFundDailyEarnings) => {
    const next = isFunction(nextFundDailyEarnings)
      ? nextFundDailyEarnings(get().fundDailyEarnings)
      : nextFundDailyEarnings;
    set({ fundDailyEarnings: next });
    get().setItem('fundDailyEarnings', JSON.stringify(next), { skipZustandUpdate: true });
  },

  setFundDividends: (nextFundDividends) => {
    const next = isFunction(nextFundDividends) ? nextFundDividends(get().fundDividends) : nextFundDividends;
    set({ fundDividends: next });
    get().setItem('fundDividends', JSON.stringify(next), { skipZustandUpdate: true });
  },

  setValuationSeries: (nextValuationSeries) => {
    const next = isFunction(nextValuationSeries) ? nextValuationSeries(get().valuationSeries) : nextValuationSeries;
    set({ valuationSeries: next });
  },

  /**
   * 核心写入方法：同步更新 localStorage 和 Store 状态，并触发同步
   */
  setItem: (key: string, value: any, options: SetItemOptions = {}) => {
    const strVal = isString(value)
      ? value
      : isNumber(value) || isBoolean(value)
        ? String(value)
        : JSON.stringify(value);
    const normalizedValue = normalizeStorageValue(key, strVal);
    const prevValue = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    let skipStorageWrite = false;

    // 检查内容是否真的发生了变化 (优先使用字符串快速对比，避免大对象的 JSON.parse + isEqual 开销)
    if (prevValue !== null) {
      if (prevValue === normalizedValue) {
        skipStorageWrite = true;
      } else {
        try {
          const parsedNew = JSON.parse(normalizedValue);
          const parsedOld = JSON.parse(prevValue);
          if (isEqual(parsedNew, parsedOld)) skipStorageWrite = true;
        } catch {
          if (prevValue === normalizedValue) skipStorageWrite = true;
        }
      }
    }

    // 更新本地存储
    if (!skipStorageWrite && typeof window !== 'undefined') {
      window.localStorage.setItem(key, normalizedValue);
    }

    // 仅在非 setter 触发且存储真正变动时才同步更新 Store 状态，避免双重派发或无意义的重渲染
    if (!options?.skipZustandUpdate && !skipStorageWrite) {
      try {
        const parsed = JSON.parse(normalizedValue);
        if (key === 'funds') set({ funds: parsed });
        else if (key === 'groups') set({ groups: ensurePresetGroups(parsed) });
        else if (key === 'favorites') set({ favorites: new Set(parsed) });
        else if (key === 'collapsedCodes') set({ collapsedCodes: new Set(parsed) });
        else if (key === 'collapsedTrends') set({ collapsedTrends: new Set(parsed) });
        else if (key === 'collapsedValuationTrends') set({ collapsedValuationTrends: new Set(parsed) });
        else if (key === 'collapsedEarnings') set({ collapsedEarnings: new Set(parsed) });
        else if (key === 'refreshMs') set({ refreshMs: Number(parsed) });
        else if (key === 'holdings') set({ holdings: parsed });
        else if (key === 'groupHoldings') set({ groupHoldings: parsed });
        else if (key === 'pendingTrades') set({ pendingTrades: parsed });
        else if (key === 'transactions') set({ transactions: parsed });
        else if (key === 'dcaPlans') set({ dcaPlans: parsed });
        else if (key === 'customSettings') set({ customSettings: parsed });
        else if (key === 'fundDailyEarnings') set({ fundDailyEarnings: parsed });
        else if (key === 'fundDividends') set({ fundDividends: parsed });
        else if (key === 'tags') set({ tags: isArray(parsed) ? parsed : [] });
        else if (key === 'localSortBy') set({ sortBy: parsed });
        else if (key === 'localSortOrder') set({ sortOrder: parsed === 'asc' ? 'asc' : 'desc' });
      } catch {
        // 如果不是 JSON，或者是 refreshMs 这种数字字符串
        if (key === 'refreshMs') set({ refreshMs: Number(normalizedValue) });
        else if (key === 'localSortBy') set({ sortBy: normalizedValue });
        else if (key === 'localSortOrder') set({ sortOrder: normalizedValue === 'asc' ? 'asc' : 'desc' });
      }
    }

    if (skipStorageWrite) return;

    // 触发同步逻辑
    const { onSync } = get();
    if (onSync && SYNC_KEYS.has(key)) {
      if (key === 'funds') {
        if (getFundCodesSignature(prevValue) === getFundCodesSignature(normalizedValue)) {
          return;
        }
      }
      if (key === 'tags') {
        if (getTagsStoreSignature(prevValue) === getTagsStoreSignature(normalizedValue)) {
          return;
        }
      }

      onSync(key, prevValue, normalizedValue);
    }
  },

  /**
   * 删除 key
   */
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    const prevValue = key === 'funds' || key === 'tags' ? window.localStorage.getItem(key) : null;
    window.localStorage.removeItem(key);

    const { onSync } = get();
    if (onSync && SYNC_KEYS.has(key)) {
      onSync(key, prevValue, null);
    }
  },

  /**
   * 清空所有存储
   */
  clear: () => {
    if (typeof window === 'undefined') return;
    window.localStorage.clear();
    const { onSync } = get();
    if (onSync) {
      onSync('__clear__', null, null);
    }
  },

  /**
   * 获取数据（封装 JSON 解析）
   */
  getItem: <T = any>(key: string, defaultValue?: T): T => {
    if (typeof window === 'undefined') return defaultValue as T;
    const val = window.localStorage.getItem(key);
    if (val === null) return defaultValue as T;
    try {
      return JSON.parse(val);
    } catch {
      return defaultValue !== undefined ? defaultValue : (val as unknown as T);
    }
  }
}));

/** 非 React 代码中使用的快捷方式 */
export const storageStore = {
  setItem: (key: string, val: any, options?: SetItemOptions) => useStorageStore.getState().setItem(key, val, options),
  getItem: <T = any>(key: string, def?: T): T => useStorageStore.getState().getItem(key, def),
  removeItem: (key: string) => useStorageStore.getState().removeItem(key),
  clear: () => useStorageStore.getState().clear()
};
