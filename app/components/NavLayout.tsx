'use client';

import React from 'react';
import PcSideNav from './PcSideNav';
import MobileBottomNav from './MobileBottomNav';

export interface NavLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  mainTab: string;
  setMainTab: (tab: string) => void;
  isMobile: boolean;
  containerRef?: React.Ref<HTMLDivElement>;
  containerClassName?: string;
  containerWidth?: string | number;
  showThemeTransition?: boolean;
  setShowThemeTransition: (show: boolean) => void;
  mobileBottomNavHidden?: boolean;
}

export default function NavLayout({
  children,
  header,
  mainTab,
  setMainTab,
  isMobile,
  containerRef,
  containerClassName,
  containerWidth,
  showThemeTransition: _showThemeTransition,
  setShowThemeTransition: _setShowThemeTransition,
  mobileBottomNavHidden
}: NavLayoutProps) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:px-3 focus:py-1.5 focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:text-sm focus:font-medium focus:shadow-md"
      >
        跳至主内容
      </a>
      <PcSideNav value={mainTab} onChange={setMainTab} />
      {header}
      <main
        id="main-content"
        ref={containerRef}
        className={containerClassName}
        style={{ width: isMobile ? '100%' : containerWidth }}
      >
        {children}

        {isMobile && <MobileBottomNav value={mainTab} onChange={setMainTab} />}
      </main>
    </>
  );
}
