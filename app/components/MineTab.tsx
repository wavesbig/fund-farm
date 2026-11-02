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
              <span className="mine-profile-avatar-fallback">基</span>
            )}
          </div>
          <div className="mine-profile-text">
            <div className="mine-profile-title">基估宝</div>
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
