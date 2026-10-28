import { v4 as uuidv4 } from 'uuid';
import dayjs, { type Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { isArray, isFunction, isNumber, isObject, isPlainObject, isString } from 'lodash';
import {
  DEFAULT_TZ,
  TAG_THEME_OPTIONS,
  DCA_SCOPE_GLOBAL,
  SUMMARY_TAB_ID,
  SUMMARY_SOURCE_GLOBAL,
  DEFAULT_FUND_TAG_THEME
} from '@/app/constants';
import { getPrevTradingDay, countTradingDaysBetween } from './tradingCalendar';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);

export const getBrowserTimeZone = (): string => {
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || DEFAULT_TZ;
  }
  return DEFAULT_TZ;
};

export const TZ: string = getBrowserTimeZone();
dayjs.tz.setDefault(TZ);
export const nowInTz = (): Dayjs => dayjs().tz(TZ);
export const toTz = (input?: string | number | Date | Dayjs | null): Dayjs => (input ? dayjs.tz(input, TZ) : nowInTz());
export const formatDate = (input?: string | number | Date | Dayjs | null): string => toTz(input).format('YYYY-MM-DD');

export { DCA_SCOPE_GLOBAL, SUMMARY_TAB_ID, SUMMARY_SOURCE_GLOBAL, DEFAULT_FUND_TAG_THEME };
export const hasOwn = (obj: object, key: PropertyKey): boolean => Object.prototype.hasOwnProperty.call(obj, key);

/** 与 AddTagDialog TAG_THEME_OPTIONS 的 key 一致（单一数据源，避免漏改） */
const ALLOWED_FUND_TAG_THEMES = new Set(TAG_THEME_OPTIONS.map((o) => o.key));

export function normalizeFundTagTheme(t?: string | null): string {
  const s = String(t ?? '').trim();
  return ALLOWED_FUND_TAG_THEMES.has(s) ? s : DEFAULT_FUND_TAG_THEME;
}

export interface FundTagInstance {
  id: string;
  name: string;
  theme: string;
}

/**
 * 单只基金已选标签实例（允许同名多枚）。
 */
export function normalizeFundTagInstanceListFromInput(rows?: unknown[] | null): FundTagInstance[] {
  const out: FundTagInstance[] = [];
  const usedIds = new Set<string>();
  for (const r of rows || []) {
    if (!r || !isObject(r)) continue;
    const rec = r as Record<string, unknown>;
    const name = String(rec.name ?? '').trim();
    if (!name || name.length > 24) continue;
    let id = String(rec.id ?? '').trim();
    if (!id || usedIds.has(id)) id = uuidv4();
    usedIds.add(id);
    out.push({
      id,
      name,
      theme: normalizeFundTagTheme(rec.theme as string)
    });
    if (out.length >= 30) break;
  }
  return out;
}

/** 从基金对象中移除旧版内联字段 `tags`（已迁移到独立 `tags` 存储） */
export function stripLegacyTagsFromFundObject<T extends object>(f: T): T {
  if (!f || !isObject(f) || !hasOwn(f, 'tags')) return f;
  const { tags: _removed, ...rest } = f as Record<string, unknown>;
  return rest as T;
}

/** 从标签记录读取基金代码列表（仅 `fundCodes`） */
export function getFundCodesFromTagRecord(r: unknown): string[] {
  if (!r || !isObject(r)) return [];
  const rec = r as { fundCodes?: unknown };
  if (!isArray(rec.fundCodes)) return [];
  return [...new Set(rec.fundCodes.map((c) => String(c).trim()).filter(Boolean))];
}

export interface StoredTagRow {
  id: string;
  name: string;
  theme: string;
  fundCodes: string[];
}

/** 仅保留 id / name / theme / fundCodes（fundCodes 可为空：仅存在于可选池、尚未挂到任何基金） */
export function sanitizeTagRowForStorage(r: unknown): StoredTagRow | null {
  if (!r || !isObject(r)) return null;
  const rec = r as Record<string, unknown>;
  const name = String(rec.name ?? '').trim();
  const codes = getFundCodesFromTagRecord(r);
  if (!name) return null;
  return {
    id: String(rec.id ?? '').trim() || uuidv4(),
    name,
    theme: String(rec.theme ?? '').trim() || DEFAULT_FUND_TAG_THEME,
    fundCodes: codes.sort()
  };
}

/** 用于判断标签列表是否实质变化（避免无意义的 setItem） */
export function serializeTagRecordsForCompare(rows?: unknown[] | null): string {
  return JSON.stringify(
    [...(rows || [])]
      .map((r) => {
        const rec = r as Record<string, unknown>;
        return {
          id: String(rec?.id ?? ''),
          name: String(rec?.name ?? '').trim(),
          theme: String(rec?.theme ?? '').trim(),
          fundCodes: getFundCodesFromTagRecord(r).slice().sort()
        };
      })
      .sort((a, b) => a.id.localeCompare(b.id))
  );
}

/** 同名标签合并为一条，基金代码取并集（用于迁移与保存去重） */
export function mergeTagRowsByName(rows?: unknown[] | null): StoredTagRow[] {
  const byName = new Map<string, StoredTagRow>();
  for (const row of rows || []) {
    if (!row || !isObject(row)) continue;
    const rec = row as Record<string, unknown>;
    const nm = String(rec.name ?? '').trim();
    if (!nm) continue;
    const codes = getFundCodesFromTagRecord(row);
    const ex = byName.get(nm);
    if (ex) {
      ex.fundCodes = [...new Set([...ex.fundCodes, ...codes])].sort();
    } else {
      byName.set(nm, {
        id: String(rec.id ?? '').trim(),
        name: nm,
        theme: String(rec.theme ?? '').trim() || DEFAULT_FUND_TAG_THEME,
        fundCodes: [...codes].sort()
      });
    }
  }
  return Array.from(byName.values());
}

export function cloneHoldingDeep<T>(src: T): T | null {
  if (!isPlainObject(src)) return null;
  try {
    return isFunction(structuredClone) ? structuredClone(src) : JSON.parse(JSON.stringify(src));
  } catch {
    return { ...src };
  }
}

/** 规范化单条持仓（与 collectLocalPayload 清洗逻辑对齐） */
export function normalizeHoldingEntryForSeed(value: unknown): Record<string, unknown> | null {
  if (!isPlainObject(value)) return null;
  const val = value as Record<string, unknown>;
  const parsedShare = isNumber(val.share) ? val.share : isString(val.share) ? Number(val.share) : NaN;
  const parsedCost = isNumber(val.cost) ? val.cost : isString(val.cost) ? Number(val.cost) : NaN;
  const nextShare = Number.isFinite(parsedShare) ? parsedShare : null;
  const nextCost = Number.isFinite(parsedCost) ? parsedCost : null;
  if (nextShare === null && nextCost === null) return null;
  return { ...val, share: nextShare, cost: nextCost };
}

/** 旧版扁平 dcaPlans（code -> plan）→ { __global__: { ... } } */
export function migrateDcaPlansToScoped(raw: unknown): Record<string, Record<string, any>> {
  if (!isPlainObject(raw)) return { [DCA_SCOPE_GLOBAL]: {} };
  const r = raw as Record<string, Record<string, any>>;
  if (r[DCA_SCOPE_GLOBAL] !== undefined && isPlainObject(r[DCA_SCOPE_GLOBAL])) {
    return r;
  }
  return { [DCA_SCOPE_GLOBAL]: { ...r } };
}

/**
 * 判断基金净值是否"已更新"（结合确认天数与真实交易日历）。
 *
 * - confirmDays <= 1（普通 A 股基金）：净值日期 >= 今天或之前最近的交易日
 *   即视为已更新。例如周六查看周五净值 → 已更新；国庆长假查看节前净值 → 已更新。
 * - confirmDays >= 2（QDII 等跨境基金）：净值日期与今天之间相隔的交易日数
 *   < confirmDays 即视为已更新。使用交易日而非自然日，精确覆盖周末与长假。
 *
 * @param jzrq - 基金净值日期，格式 YYYY-MM-DD
 * @param todayStr - 今天日期，格式 YYYY-MM-DD
 * @param confirmDays - 申赎确认天数（SSBCFMDATA）
 */
export function isNavUpdated(jzrq?: string | null, todayStr?: string | null, confirmDays?: number | null): boolean {
  if (!isString(jzrq) || !jzrq) return false;
  if (!todayStr) return false;
  if (jzrq === todayStr) return true;

  const days = Number(confirmDays) || 1;

  if (days <= 1) {
    // A 股基金：净值日期 >= 上一个最近交易日即为已更新
    const prevTD = getPrevTradingDay(toTz(todayStr));
    if (!prevTD) return false;
    return toTz(jzrq).startOf('day').isSameOrAfter(prevTD, 'day');
  }

  // QDII 等延迟基金：净值日期与今天之间的交易日数 < confirmDays
  const tradingDays = countTradingDaysBetween(jzrq, todayStr, toTz);
  return tradingDays >= 0 && tradingDays < days;
}
