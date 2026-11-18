import { useState, useRef, useEffect, type RefObject } from 'react';

export interface UseNavHeightsParams {
  groups?: any[];
  currentTab?: string;
  shouldShowMarketIndex?: boolean;
  isAuthenticated?: boolean;
}

export interface UseNavHeightsReturn {
  navbarRef: RefObject<any>;
  filterBarRef: RefObject<any>;
  navbarHeight: number;
  filterBarHeight: number;
}

const DEFAULT_PC_NAVBAR_HEIGHT = 56;
const DEFAULT_MOBILE_NAVBAR_HEIGHT = 52;

function getDefaultNavbarHeight(): number {
  if (typeof window !== 'undefined' && window.innerWidth <= 640) {
    return DEFAULT_MOBILE_NAVBAR_HEIGHT;
  }
  return DEFAULT_PC_NAVBAR_HEIGHT;
}

/**
 * 追踪 Navbar 和 FilterBar 的动态高度
 * - 提供合理的初始安全兜底高度，避免首帧或未测量前贴顶被 fixed 导航栏遮挡
 * - 结合 ResizeObserver 实时监听 DOM 挂载与尺寸变化
 * - 响应式监听 resize 与认证登录状态切换
 */
export function useNavHeights({ groups, currentTab, isAuthenticated }: UseNavHeightsParams = {}): UseNavHeightsReturn {
  const navbarRef = useRef<any>(null);
  const filterBarRef = useRef<any>(null);

  // 初始赋予合理的导航栏高度，杜绝首次加载或登录切换时高度为 0 导致被顶部遮挡
  const [navbarHeight, setNavbarHeight] = useState<number>(getDefaultNavbarHeight);
  const [filterBarHeight, setFilterBarHeight] = useState<number>(0);

  useEffect(() => {
    let rafId: number | null = null;

    const updateHeights = () => {
      if (navbarRef.current) {
        const h = navbarRef.current.offsetHeight;
        if (h > 0) {
          setNavbarHeight(h);
        }
      }
      if (filterBarRef.current) {
        const h = filterBarRef.current.offsetHeight;
        if (h > 0) {
          setFilterBarHeight(h);
        }
      }
    };

    // 立即测量一次
    updateHeights();

    // 监听窗口尺寸变化
    const onResize = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        updateHeights();
      });
    };

    window.addEventListener('resize', onResize);

    // 使用 ResizeObserver 监听元素自身尺寸变化（包括首次挂载、字体加载、内容撑开）
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updateHeights();
      });

      if (navbarRef.current) {
        ro.observe(navbarRef.current);
      }
      if (filterBarRef.current) {
        ro.observe(filterBarRef.current);
      }
    }

    // 短暂延迟兜底，确保动画或异步排版完成后尺寸准确
    const timer = setTimeout(updateHeights, 60);

    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(timer);
      if (rafId) cancelAnimationFrame(rafId);
      if (ro) ro.disconnect();
    };
  }, [groups, currentTab, isAuthenticated]);

  return {
    navbarRef,
    filterBarRef,
    navbarHeight,
    filterBarHeight
  };
}
