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

            {/* 默认状态图标 (养基场 金鸡破晓 · 步步高升 Logo) */}
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
              <defs>
                <linearGradient id="brandLogoComb" x1="8" y1="1.5" x2="16.5" y2="8" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
                <linearGradient id="brandLogoBody" x1="2" y1="22" x2="22" y2="4" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
              <rect x="8" y="5" width="2.2" height="4.5" rx="1.1" fill="url(#brandLogoComb)" />
              <rect x="11.2" y="3" width="2.2" height="6.5" rx="1.1" fill="url(#brandLogoComb)" />
              <rect x="14.4" y="1.5" width="2.2" height="8" rx="1.1" fill="url(#brandLogoComb)" />
              <path
                d="M3.5 17C3.5 13.5 6.5 9.5 12 9C15 8.8 17.5 10 18.5 11.5L21.5 12.5L18.5 13.5C18.2 16.5 15.5 20.5 9 20.5C5.5 20.5 3.5 19 3.5 17Z"
                fill="url(#brandLogoBody)"
              />
              <path
                d="M5 17.5C8 16 11.5 14 15.5 11.5C18 10 20 7.5 21.5 5"
                stroke="#FFFFFF"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeOpacity="0.92"
              />
              <circle cx="15.5" cy="11" r="1.2" fill="#FFFFFF" />
              <circle cx="15.8" cy="11" r="0.6" fill="#0F172A" />
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
