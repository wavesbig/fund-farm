import { useState, useCallback, useLayoutEffect, useEffect } from 'react';
import { storageStore } from '../stores';

export interface UseThemeReturn {
  theme: string;
  showThemeTransition: boolean;
  setShowThemeTransition: React.Dispatch<React.SetStateAction<boolean>>;
  handleThemeToggle: () => void;
}

/**
 * 在主题切换时临时关闭所有 CSS 过渡并强制执行样式刷新，
 * 避免全屏各元素由于过渡时长不一导致的色彩拖尾与闪烁
 */
function suppressThemeTransitions(action: () => void) {
  if (typeof document === 'undefined') {
    action();
    return;
  }
  const style = document.createElement('style');
  style.append(document.createTextNode('*,*::before,*::after{transition:none !important}'));
  document.head.append(style);
  action();
  void document.body.offsetHeight; // 强制同步样式重绘
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      style.remove();
    });
  });
}

/**
 * 管理应用主题（dark/light）
 * - useLayoutEffect 在首帧前恢复，避免 SSR hydration 闪烁
 * - useEffect 同步到 document.documentElement 并持久化到 localStorage
 */
export function useTheme(): UseThemeReturn {
  // 初始固定为 dark，避免 SSR 与客户端首屏不一致导致 hydration 报错
  const [theme, setTheme] = useState<string>('dark');
  const [showThemeTransition, setShowThemeTransition] = useState<boolean>(false);

  const handleThemeToggle = useCallback(() => {
    suppressThemeTransitions(() => {
      setTheme((t) => {
        const next = t === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try {
          storageStore.setItem('theme', next);
        } catch {}
        return next;
      });
    });
  }, []);

  // 首帧前同步主题（与 layout 中脚本设置的 data-theme 一致），减少图标闪烁
  useLayoutEffect(() => {
    try {
      const fromDom = document.documentElement.getAttribute('data-theme');
      if (fromDom === 'light' || fromDom === 'dark') {
        setTheme(fromDom);
        return;
      }
      const fromStorage = storageStore.getItem('theme');
      if (fromStorage === 'light' || fromStorage === 'dark') {
        setTheme(fromStorage);
        document.documentElement.setAttribute('data-theme', fromStorage);
      }
    } catch {}
  }, []);

  // 主题变化时同步到 document 并持久化
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      storageStore.setItem('theme', theme);
    } catch {}
  }, [theme]);

  return { theme, showThemeTransition, setShowThemeTransition, handleThemeToggle };
}
