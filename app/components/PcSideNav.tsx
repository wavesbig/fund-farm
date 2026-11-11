'use client';

import { useEffect, useState } from 'react';
import { Home, TrendingUp, ChevronRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
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

  useEffect(() => setMounted(true), []);

  if (!mounted || isMobile) return null;

  return (
    <div
      className={`pc-side-nav-container ${isHovered ? '' : 'collapsed'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <nav className="pc-side-nav" role="navigation" aria-label="侧边导航">
        <div className="pc-side-nav-handle">
          <ChevronRight
            className={cn('size-4 text-muted-foreground transition-transform duration-200', isHovered && 'rotate-180')}
            strokeWidth={2}
          />
        </div>
        <div className="pc-side-nav-content">
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
                <span className="pc-side-nav-item-inner">
                  <span className="pc-side-nav-icon-wrap">
                    <Icon
                      className="pc-side-nav-icon transition-transform duration-150"
                      aria-hidden
                      strokeWidth={active ? 2.2 : 1.8}
                    />
                  </span>
                  <span className="pc-side-nav-label">{label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
