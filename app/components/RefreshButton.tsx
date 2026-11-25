'use client';

import * as React from 'react';
import { useEffect, useRef } from 'react';
import { RotateCw } from 'lucide-react';
import { useModalStore } from '../stores';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface RefreshButtonProps {
  refreshCycleStartRef: React.MutableRefObject<number>;
  refreshMs: number;
  manualRefresh: () => void;
  refreshing: boolean;
  fundsLength: number;
}

export default function RefreshButton({
  refreshCycleStartRef,
  refreshMs,
  manualRefresh,
  refreshing,
  fundsLength
}: RefreshButtonProps) {
  // 从 Zustand 读取设备冲突弹框状态，暂停刷新进度条；避免 page.jsx 订阅此状态导致全量重渲染
  const deviceConflictModal = useModalStore((s) => s.deviceConflictModal);
  const paused = deviceConflictModal.open;
  const wrapRef = useRef<HTMLDivElement>(null);

  // 直接通过 CSS 变量更新进度环，避免每 100ms 触发 React 重渲染导致卡顿
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || fundsLength === 0 || refreshMs <= 0) {
      el?.style.setProperty('--progress', '0');
      return;
    }
    if (refreshing) {
      el.style.setProperty('--progress', '0');
      return;
    }

    const updateProgress = () => {
      if (paused || (typeof document !== 'undefined' && document.hidden)) return;
      const elapsed = Date.now() - refreshCycleStartRef.current;
      const p = Math.min(1, Math.max(0, elapsed / refreshMs));
      el.style.setProperty('--progress', String(p));
    };

    updateProgress();
    const t = setInterval(updateProgress, 250);
    return () => clearInterval(t);
  }, [fundsLength, refreshMs, paused, refreshing, refreshCycleStartRef]);

  const tooltipText =
    fundsLength === 0
      ? '暂无基金自选，添加后即可刷新'
      : refreshing
        ? '正在刷新最新估值...'
        : `立即刷新（每 ${Math.round(refreshMs / 1000)} 秒自动更新）`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={wrapRef}
          className={cn('refresh-btn-wrap', refreshing && 'is-refreshing')}
          style={{ ['--progress' as any]: 0 }}
        >
          <button
            type="button"
            className="icon-button active:opacity-75 transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.06] [data-theme=light]:hover:bg-black/[0.04] rounded-lg cursor-pointer"
            aria-label="立即刷新"
            onClick={manualRefresh}
            disabled={refreshing || fundsLength === 0}
            aria-busy={refreshing}
          >
            <RotateCw
              className={cn('size-4 transition-transform duration-500', refreshing && 'animate-spin')}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </button>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}
