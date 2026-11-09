'use client';

import * as React from 'react';

export interface BrandLogoProps {
  isSyncing?: boolean;
}

export const BrandLogo = React.memo(function BrandLogo({ isSyncing = false }: BrandLogoProps) {
  return (
    <div className="brand flex items-center gap-2 select-none shrink-0 min-w-max">
      <div
        className="size-7 relative inline-flex items-center justify-center shrink-0"
        aria-label="养基场"
      >
        {/* 同步中图标 */}
        <svg
          width="22"
          height="22"
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

        {/* 默认状态图标 (养基场 纯矢量超清小金鸡 Logo) */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 32 32"
          fill="none"
          className="absolute inset-0 m-auto transition-[opacity,transform] duration-250 ease-out shrink-0 drop-shadow-sm"
          style={{
            opacity: isSyncing ? 0 : 1,
            transform: isSyncing ? 'translateY(-4px)' : 'translateY(0px)'
          }}
        >
          <defs>
            <linearGradient id="chickBody" x1="16" y1="6" x2="16" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="chickComb" x1="16" y1="2" x2="16" y2="10" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F87171" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
            <linearGradient id="chickBeak" x1="16" y1="16" x2="16" y2="21" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FB923C" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
            <linearGradient id="badgeGrad" x1="22" y1="20" x2="30" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* 鸡冠（三瓣鲜红饱满肉冠） */}
          <circle cx="11.5" cy="7" r="3" fill="url(#chickComb)" />
          <circle cx="16" cy="5.2" r="3.8" fill="url(#chickComb)" />
          <circle cx="20.5" cy="7" r="3" fill="url(#chickComb)" />

          {/* 身体主干（圆润软萌金鸡） */}
          <path
            d="M16 8C9.5 8 5 13 5 19.5C5 25.5 9.8 29.5 16 29.5C22.2 29.5 27 25.5 27 19.5C27 13 22.5 8 16 8Z"
            fill="url(#chickBody)"
          />

          {/* 翅膀 */}
          <path
            d="M5.2 19C4 21 4.5 23.5 6.5 24.5C7.2 23 8 20.5 7.5 18C6.2 18 5.5 18.5 5.2 19Z"
            fill="#F59E0B"
            opacity="0.6"
          />
          <path
            d="M26.8 19C28 21 27.5 23.5 25.5 24.5C24.8 23 24 20.5 24.5 18C25.8 18 26.5 18.5 26.8 19Z"
            fill="#F59E0B"
            opacity="0.6"
          />

          {/* 眼睛（大而有神，带高光点睛） */}
          <ellipse cx="11.2" cy="16.5" rx="2" ry="2.5" fill="#0F172A" />
          <circle cx="10.4" cy="15.5" r="0.8" fill="#FFFFFF" />

          <ellipse cx="20.8" cy="16.5" rx="2" ry="2.5" fill="#0F172A" />
          <circle cx="20" cy="15.5" r="0.8" fill="#FFFFFF" />

          {/* 腮红 */}
          <ellipse cx="7.8" cy="19.5" rx="1.8" ry="1.1" fill="#F43F5E" opacity="0.35" />
          <ellipse cx="24.2" cy="19.5" rx="1.8" ry="1.1" fill="#F43F5E" opacity="0.35" />

          {/* 鸡嘴 */}
          <path
            d="M13 17.2C14.8 16.6 17.2 16.6 19 17.2C18.5 19.8 17.2 21.8 16 22C14.8 21.8 13.5 19.8 13 17.2Z"
            fill="url(#chickBeak)"
          />

          {/* 右下角复利生长小徽章（涨势向上小绿箭 📈） */}
          <circle cx="24.5" cy="24.5" r="5.5" fill="#0B0F19" />
          <circle cx="24.5" cy="24.5" r="4.5" fill="url(#badgeGrad)" />
          <path
            d="M22.5 25.5L25 23M25 23H23M25 23V25"
            stroke="#FFFFFF"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <span className="text-[17px] font-semibold tracking-tight text-foreground">养基场</span>
    </div>
  );
});

export default BrandLogo;
