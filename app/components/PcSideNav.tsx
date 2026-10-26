'use client';

import { useEffect, useState } from 'react';
import { motion, LayoutGroup, useReducedMotion, type Transition } from 'framer-motion';
import { Home, TrendingUp, ChevronRight, LucideIcon } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';

interface TabItem {
  id: string;
  label: string;
  Icon: LucideIcon;
}

const TABS: TabItem[] = [
  { id: 'home', label: '首页', Icon: Home },
  { id: 'market', label: '行情', Icon: TrendingUp }
];

export interface PcSideNavProps {
  value: string;
  onChange: (tab: string) => void;
}

export default function PcSideNav({ value, onChange }: PcSideNavProps) {
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();

  useEffect(() => setMounted(true), []);

  if (!mounted || isMobile) return null;

  const spring: Transition = reduceMotion
    ? { duration: 0.2 }
    : { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 };

  const tapSpring: Transition = reduceMotion ? { duration: 0.15 } : { type: 'spring', stiffness: 600, damping: 32 };

  return (
    <div
      className={`pc-side-nav-container ${isHovered ? '' : 'collapsed'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <nav className="pc-side-nav" role="navigation" aria-label="侧边导航">
        <div className="pc-side-nav-handle">
          <ChevronRight size={16} strokeWidth={2.5} color="var(--muted)" />
        </div>
        <div className="pc-side-nav-content">
          <LayoutGroup id="pc-side-nav-group">
            {TABS.map(({ id, label, Icon }) => {
              const active = value === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`pc-side-nav-item ${active ? 'is-active' : ''}`}
                  onClick={() => onChange(id)}
                  aria-current={active ? 'page' : undefined}
                >
                  {active && (
                    <motion.div
                      layoutId="pc-tab-pill"
                      className="pc-side-nav-pill"
                      transition={spring}
                      initial={false}
                    />
                  )}
                  <span className="pc-side-nav-item-inner">
                    <span className="pc-side-nav-icon-wrap">
                      <Icon className="pc-side-nav-icon" aria-hidden strokeWidth={2} />
                    </span>
                    <motion.span
                      className="pc-side-nav-label"
                      animate={{
                        opacity: active ? 1 : 0.5,
                        fontWeight: active ? 600 : 500
                      }}
                      transition={tapSpring}
                    >
                      {label}
                    </motion.span>
                  </span>
                </button>
              );
            })}
          </LayoutGroup>
        </div>
      </nav>
    </div>
  );
}
