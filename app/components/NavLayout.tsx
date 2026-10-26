'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  showThemeTransition,
  setShowThemeTransition,
  mobileBottomNavHidden
}: NavLayoutProps) {
  return (
    <>
      <PcSideNav value={mainTab} onChange={setMainTab} />
      <div ref={containerRef} className={containerClassName} style={{ width: isMobile ? '100%' : containerWidth }}>
        <AnimatePresence>
          {showThemeTransition && (
            <motion.div
              className="theme-transition-overlay"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="theme-transition-circle"
                initial={{ scale: 0, opacity: 0.5 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                onAnimationComplete={() => setShowThemeTransition(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {children}

        {isMobile && (
          <MobileBottomNav value={mainTab} onChange={setMainTab} hidden={mobileBottomNavHidden && mainTab === 'home'} />
        )}
      </div>
    </>
  );
}
