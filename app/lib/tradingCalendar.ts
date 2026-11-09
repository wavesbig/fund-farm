import type { Dayjs } from 'dayjs';

/**
 * A股交易日历：基于 chinese-days 节假日数据，严格判断某日期是否为交易日
 * 交易日 = 周一至周五 且 不在法定节假日
 * 调休补班日（周末变工作日）A股仍休市，故不视为交易日
 */

const CDN_BASE = 'https://cdn.jsdelivr.net/npm/chinese-days@1/dist/years';
const yearCache = new Map<number, Set<string>>(); // year -> Set<dateStr> (holidays)

/**
 * 加载某年的节假日数据
 * @param year
 * @returns 节假日日期集合，格式 YYYY-MM-DD
 */
export async function loadHolidaysForYear(year: number): Promise<Set<string>> {
  if (yearCache.has(year)) {
    return yearCache.get(year)!;
  }
  try {
    const res = await fetch(`${CDN_BASE}/${year}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const holidays = new Set<string>(Object.keys(data?.holidays ?? {}));
    yearCache.set(year, holidays);
    return holidays;
  } catch (e) {
    console.warn(`[tradingCalendar] 加载 ${year} 年节假日失败:`, e);
    // 不永久缓存空集合，以便后续重试
    return new Set();
  }
}

/**
 * 检查某年份的节假日数据是否已成功加载
 */
export function isHolidaysLoaded(year: number, cache: Map<number, Set<string>> = yearCache): boolean {
  return cache.has(year);
}

/**
 * 加载多个年份的节假日数据
 * @param years
 */
export async function loadHolidaysForYears(years: number[]): Promise<void> {
  await Promise.all([...new Set(years)].map(loadHolidaysForYear));
}

/**
 * 判断某日期是否为 A股交易日
 * @param date - dayjs 对象
 * @param cache - 可选，已加载的年份缓存，默认使用内部 yearCache
 */
export function isTradingDay(date: Dayjs, cache: Map<number, Set<string>> = yearCache): boolean {
  const dayOfWeek = date.day(); // 0=周日, 6=周六
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;

  const dateStr = date.format('YYYY-MM-DD');
  const year = date.year();
  const holidays = cache.get(year);
  if (!holidays) return true; // 未加载该年数据时，仅排除周末
  return !holidays.has(dateStr);
}

/**
 * 返回 date 当天或之前最近的一个 A 股交易日（dayjs 对象）。
 * 如果 date 自身是交易日则返回自身。最多向前回溯 30 天。
 * @param date - dayjs 对象
 * @returns 最近的交易日，找不到时返回 null
 */
export function getPrevTradingDay(date: Dayjs): Dayjs | null {
  let d = date.startOf('day');
  let attempts = 30;
  while (attempts-- > 0) {
    if (isTradingDay(d)) return d;
    d = d.subtract(1, 'day');
  }
  return null;
}

/**
 * 计算 startDateStr 与 endDateStr 之间有多少个 A 股交易日
 * （不含 start 当天，含 end 当天；若 start >= end 返回 0）。
 * @param startDateStr - 起始日期 YYYY-MM-DD
 * @param endDateStr   - 结束日期 YYYY-MM-DD
 * @param toDayjs    - 将日期字符串转为 dayjs 对象的函数
 * @returns 交易日天数
 */
export function countTradingDaysBetween(
  startDateStr: string,
  endDateStr: string,
  toDayjs: (dateStr: string) => Dayjs
): number {
  const start = toDayjs(startDateStr).startOf('day');
  const end = toDayjs(endDateStr).startOf('day');
  const totalDays = end.diff(start, 'day');
  if (totalDays <= 0) return 0;
  let count = 0;
  let d = start.add(1, 'day');
  // 安全上限：最多遍历 1500 天（约 4 年交易日计算）
  const limit = Math.min(totalDays, 1500);
  for (let i = 0; i < limit; i++) {
    if (isTradingDay(d)) count++;
    d = d.add(1, 'day');
  }
  return count;
}
