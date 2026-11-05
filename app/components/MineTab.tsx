'use client';

import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export interface MineTabProps {
  visible?: boolean;
  user?: any;
  userAvatar?: string;
  lastSyncDisplay?: string;
  onLogin?: () => void;
  onMyEarnings?: () => void;
  onTutorial?: () => void;
  onUpdateLog?: () => void;
  onFeedback?: () => void;
  onSponsorSupport?: () => void;
  onOpenWeChat?: () => void;
}

export default function MineTab({
  visible = true,
  user,
  userAvatar,
  lastSyncDisplay,
  onMyEarnings,
  onTutorial,
  onUpdateLog,
  onFeedback
}: MineTabProps) {
  return (
    <div className="mine-tab" style={{ display: visible ? undefined : 'none' }} aria-hidden={!visible || undefined}>
      <section className="mine-profile-card glass" aria-label="个人信息" style={{ position: 'relative' }}>
        <div className="mine-profile-row">
          <div className="mine-profile-avatar">
            {userAvatar ? (
              <Image
                src={userAvatar}
                alt="用户头像"
                width={56}
                height={56}
                unoptimized
                className="outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10 rounded-full"
                style={{ borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="mineComb" x1="8" y1="1.5" x2="16.5" y2="8" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#EF4444" />
                  </linearGradient>
                  <linearGradient id="mineBody" x1="2" y1="22" x2="22" y2="4" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="50%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
                <rect x="8" y="5" width="2.2" height="4.5" rx="1.1" fill="url(#mineComb)" />
                <rect x="11.2" y="3" width="2.2" height="6.5" rx="1.1" fill="url(#mineComb)" />
                <rect x="14.4" y="1.5" width="2.2" height="8" rx="1.1" fill="url(#mineComb)" />
                <path
                  d="M3.5 17C3.5 13.5 6.5 9.5 12 9C15 8.8 17.5 10 18.5 11.5L21.5 12.5L18.5 13.5C18.2 16.5 15.5 20.5 9 20.5C5.5 20.5 3.5 19 3.5 17Z"
                  fill="url(#mineBody)"
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
            )}
          </div>
          <div className="mine-profile-text">
            <div className="mine-profile-title">养基场</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              实时基金估值与持仓管理
            </div>
          </div>
        </div>
      </section>

      <ul className="mine-menu-list" role="list">
        <li>
          <button type="button" className="mine-menu-row glass" onClick={onMyEarnings}>
            <span className="mine-menu-label">我的收益</span>
            <ChevronRight className="mine-menu-chevron" aria-hidden strokeWidth={2} />
          </button>
        </li>
        <li>
          <button type="button" className="mine-menu-row glass" onClick={onTutorial}>
            <span className="mine-menu-label">使用帮助</span>
            <ChevronRight className="mine-menu-chevron" aria-hidden strokeWidth={2} />
          </button>
        </li>
        <li>
          <button type="button" className="mine-menu-row glass" onClick={onUpdateLog}>
            <span className="mine-menu-label">更新日志</span>
            <ChevronRight className="mine-menu-chevron" aria-hidden strokeWidth={2} />
          </button>
        </li>
        <li>
          <button type="button" className="mine-menu-row glass" onClick={onFeedback}>
            <span className="mine-menu-label">问题反馈</span>
            <ChevronRight className="mine-menu-chevron" aria-hidden strokeWidth={2} />
          </button>
        </li>
        <li>
          <button
            type="button"
            className="mine-menu-row glass"
            style={{ color: 'var(--danger, #f87171)' }}
            onClick={() => useAuthStore.getState().logout()}
          >
            <span className="mine-menu-label">锁定访问 / 退出</span>
            <ChevronRight className="mine-menu-chevron" aria-hidden strokeWidth={2} />
          </button>
        </li>
      </ul>
    </div>
  );
}
