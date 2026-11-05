'use client';

import * as React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface BrandLogoProps {
  isSyncing?: boolean;
}

export const BrandLogo = React.memo(function BrandLogo({ isSyncing = false }: BrandLogoProps) {
  return (
    <div className="brand flex items-center gap-2 select-none shrink-0 min-w-max">
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="size-6 relative inline-flex items-center justify-center overflow-hidden cursor-help"
            aria-label={isSyncing ? '正在实时保存...' : '已实时保存至本地 SQLite'}
          >
            {/* 同步中图标 (实时落盘) */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute inset-0 m-auto transition-[opacity,transform] duration-250 ease-out"
              style={{
                opacity: isSyncing ? 1 : 0,
                transform: isSyncing ? 'translateY(0px)' : 'translateY(4px)'
              }}
            >
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" stroke="var(--primary)" />
              <path d="M12 12v9" stroke="var(--accent)" />
              <path d="m16 16-4-4-4 4" stroke="var(--accent)" />
            </svg>

            {/* 默认状态图标 (已保存状态) */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="absolute inset-0 m-auto transition-[opacity,transform] duration-250 ease-out"
              style={{
                opacity: isSyncing ? 0 : 1,
                transform: isSyncing ? 'translateY(-4px)' : 'translateY(0px)'
              }}
            >
              <circle cx="12" cy="12" r="10" stroke="var(--accent)" strokeWidth="2" />
              <path d="M5 14c2-4 7-6 14-5" stroke="var(--primary)" strokeWidth="2" />
            </svg>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>
          <p>{isSyncing ? '正在实时保存...' : '已实时保存至本地 SQLite'}</p>
        </TooltipContent>
      </Tooltip>

      <span className="text-[17px] font-semibold tracking-tight text-foreground">养基场</span>
    </div>
  );
});

export default BrandLogo;
