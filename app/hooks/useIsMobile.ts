import { useSyncExternalStore } from 'react';

// 全局订阅函数
function subscribe(callback: () => void): () => void {
  // 只在浏览器环境下执行
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(max-width: 640px)');

  // 兼容旧版 Safari 的 listener 写法
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', callback);
    return () => mediaQuery.removeEventListener('change', callback);
  } else {
    // 兼容老版本浏览器
    (mediaQuery as any).addListener(callback);
    return () => (mediaQuery as any).removeListener(callback);
  }
}

// 获取当前快照
function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 640px)').matches;
}

// 服务端渲染时的默认快照
function getServerSnapshot(): boolean {
  return false;
}

/**
 * 监听是否为移动端 (<= 640px)
 * 基于 useSyncExternalStore，性能极高且全局只维持一个监听器
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
