'use client';

import React from 'react';
import PcSideNav from './PcSideNav';
import MobileBottomNav from './MobileBottomNav';

export interface NavLayoutProps {
  children: React.ReactNode;
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
      <PcSideNav value={mainTab} onChange={setMainTab} />
      <div ref={containerRef} className={containerClassName} style={{ width: isMobile ? '100%' : containerWidth }}>
        {children}

        {isMobile && (
          <MobileBottomNav value={mainTab} onChange={setMainTab} hidden={mobileBottomNavHidden && mainTab === 'home'} />
        )}
      </div>
    </>
  );
}
