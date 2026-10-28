import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * 统一金额格式化（千分位展示）
 * @param value 金额数值
 * @param decimals 小数位数，默认保留两位
 * @returns 格式化后的金额字符串
 */
export function formatMoney(value: number | string | null | undefined, decimals = 2): string {
  const num = Number(value);
  if (Number.isNaN(num) || !Number.isFinite(num)) return '—';
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}
