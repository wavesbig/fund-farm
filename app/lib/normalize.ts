import { isArray } from 'lodash';

/**
 * 通用数据规范化工具函数
 * 从 page.jsx / useSyncManager.js 中提取，消除重复定义。
 */

/**
 * 将任意值规范化为 trimmed 字符串。
 * @param value
 * @returns
 */
export function normalizeCode(value: unknown): string {
  return String(value ?? '').trim();
}

/**
 * 将输入数组中的 code 进行去重 + 可选白名单过滤。
 * @param input
 * @param allowedSet - 可选白名单 Set
 * @returns
 */
export function cleanCodeArray(input: unknown, allowedSet: Set<any> | null = null): string[] {
  const arr = isArray(input) ? input : [];
  const next: string[] = [];
  const seen = new Set<string>();
  for (const v of arr) {
    const code = normalizeCode(v);
    if (!code) continue;
    if (allowedSet && !allowedSet.has(code)) continue;
    if (seen.has(code)) continue;
    seen.add(code);
    next.push(code);
  }
  return next;
}

/**
 * 将值规范化为有限数字或 null。
 * @param value
 * @returns
 */
export const normalizeNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

/**
 * 按 code 去重基金列表（保留第一个出现的）。
 * @param list
 * @returns
 */
export const dedupeByCode = <T extends { code?: string }>(list: T[]): T[] => {
  const seen = new Set<string>();
  return list.filter((f) => {
    const c = f?.code;
    if (!c || seen.has(c)) return false;
    seen.add(c);
    return true;
  });
};
