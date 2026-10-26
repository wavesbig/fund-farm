'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
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

  // 刷新周期进度 0~1，用于环形进度条
  const [refreshProgress, setRefreshProgress] = useState(0);

  // 刷新进度条：每 100ms 更新一次进度
  useEffect(() => {
    if (fundsLength === 0 || refreshMs <= 0) return;
    const t = setInterval(() => {
      if (paused) return; // 暂停时光条静止
      const elapsed = Date.now() - refreshCycleStartRef.current;
      const p = Math.min(1, elapsed / refreshMs);
      setRefreshProgress(p);
    }, 100);
    return () => clearInterval(t);
  }, [fundsLength, refreshMs, paused, refreshCycleStartRef]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn('refresh-btn-wrap', refreshing && 'is-refreshing')}
          style={{ ['--progress' as any]: refreshing ? 0 : refreshProgress }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="icon-button"
                aria-label="立即刷新"
                onClick={manualRefresh}
                disabled={refreshing || fundsLength === 0}
                aria-busy={refreshing}
              >
                <RotateCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>立即刷新</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{`刷新周期 ${Math.round(refreshMs / 1000)} 秒`}</p>
      </TooltipContent>
    </Tooltip>
  );
}
