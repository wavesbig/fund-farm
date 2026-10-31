'use client';

import { useEffect } from 'react';

const THEME_COLORS: Record<string, string> = {
  dark: '#0b0f19',
  light: '#f1f5f9'
};

function getThemeColor(): string {
  if (typeof document === 'undefined') return THEME_COLORS.dark;
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  return THEME_COLORS[theme] ?? THEME_COLORS.dark;
}

function applyThemeColor(): void {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', getThemeColor());
}

/**
 * 根据当前亮/暗主题同步 PWA theme-color meta，使 Android 状态栏与页面主题一致。
 * 监听 document.documentElement 的 data-theme 变化并更新 meta。
 */
export default function ThemeColorSync() {
  useEffect(() => {
    applyThemeColor();
    const observer = new MutationObserver(() => applyThemeColor());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
    return () => observer.disconnect();
  }, []);

  return null;
}
