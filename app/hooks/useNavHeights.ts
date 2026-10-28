import { useState, useRef, useEffect, type RefObject } from 'react';

export interface UseNavHeightsParams {
  groups?: any[];
  currentTab?: string;
  shouldShowMarketIndex?: boolean;
}

export interface UseNavHeightsReturn {
  navbarRef: RefObject<any>;
  filterBarRef: RefObject<any>;
  navbarHeight: number;
  filterBarHeight: number;
}

/**
 * 追踪 Navbar 和 FilterBar 的动态高度
 * - 监听 resize 事件（rAF 节流），deps 变化时重新测量
 */
export function useNavHeights({ groups, currentTab }: UseNavHeightsParams = {}): UseNavHeightsReturn {
  const navbarRef = useRef<any>(null);
  const filterBarRef = useRef<any>(null);
  const [navbarHeight, setNavbarHeight] = useState<number>(0);
  const [filterBarHeight, setFilterBarHeight] = useState<number>(0);

  useEffect(() => {
    let rafId: number | null = null;
    const updateHeights = () => {
      if (navbarRef.current) {
        setNavbarHeight(navbarRef.current.offsetHeight);
      }
      if (filterBarRef.current) {
        setFilterBarHeight(filterBarRef.current.offsetHeight);
      }
    };
    // rAF 节流，避免 resize 事件以 60fps 频率触发 setState
    const onResize = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        updateHeights();
      });
    };

    // 初始延迟一下，确保渲染完成
    const timer = setTimeout(updateHeights, 100);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(timer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [groups, currentTab]); // groups 或 tab 变化可能导致 filterBar 高度变化

  return {
    navbarRef,
    filterBarRef,
    navbarHeight,
    filterBarHeight
  };
}
