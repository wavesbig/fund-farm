'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { Home, User, TrendingUp, LucideIcon } from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  Icon: LucideIcon;
}

const TABS: TabItem[] = [
  { id: 'home', label: '首页', Icon: Home },
  { id: 'market', label: '行情', Icon: TrendingUp },
  { id: 'mine', label: '我的', Icon: User }
];

export interface MobileBottomNavProps {
  value: string;
  onChange: (tab: string) => void;
  hidden?: boolean;
}

export default function MobileBottomNav({ value, onChange, hidden }: MobileBottomNavProps) {
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => setMounted(true), []);

  if (!mounted || typeof document === 'undefined') return null;

  const slideVariants: Variants = {
    visible: {
      y: 0,
      opacity: 1,
      transition: reduceMotion ? { duration: 0.15 } : { duration: 0.2, ease: 'easeOut' }
    },
    hidden: {
      y: '120%',
      opacity: 0,
      transition: reduceMotion ? { duration: 0.15 } : { duration: 0.2, ease: 'easeIn' }
    }
  };

  const node = (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          className="mobile-bottom-nav-shell"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={slideVariants}
        >
          <nav className="mobile-bottom-nav-bar" role="navigation" aria-label="主导航">
            <div className="mobile-bottom-nav-track">
              {TABS.map(({ id, label, Icon }) => {
                const active = value === id;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`mobile-bottom-nav-tab ${active ? 'is-active' : ''}`}
                    onClick={() => onChange(id)}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className="mobile-bottom-nav-tab-inner">
                      <span className="mobile-bottom-nav-icon-wrap">
                        <Icon className="mobile-bottom-nav-icon" aria-hidden strokeWidth={2} />
                      </span>
                      <span className="mobile-bottom-nav-label">{label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(node, document.body);
}
