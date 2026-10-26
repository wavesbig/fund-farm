'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { HelpCircle, Calendar, Settings, LogOut, User, List, CloudUpload, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/app/hooks/useIsMobile';
import ConfirmModal from './ConfirmModal';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useAuthStore } from '../stores/authStore';
import { cn } from '@/lib/utils';

export interface UserMenuProps {
  user?: any;
  userAvatar?: string | null;
  navbarHeight: number;
  lastSyncTime?: string | number | Date | null;
  isSyncing?: boolean;
  onSync?: () => Promise<void> | void;
  onOpenSettings?: () => void;
  onOpenPortfolioEarnings?: () => void;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  onLogoutConfirmOpenChange?: (open: boolean) => void;
  onTutorial?: () => void;
  onUpdateLog?: () => void;
}

export default function UserMenu({
  user,
  userAvatar,
  navbarHeight,
  lastSyncTime,
  isSyncing,
  onSync,
  onOpenSettings,
  onOpenPortfolioEarnings,
  onLogout,
  onLogoutConfirmOpenChange,
  onTutorial,
  onUpdateLog
}: UserMenuProps) {
  const isMobile = useIsMobile();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onLogoutConfirmOpenChange?.(logoutConfirmOpen);
  }, [logoutConfirmOpen, onLogoutConfirmOpenChange]);

  useEffect(() => {
    setUserMenuOpen(false);
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  return (
    <>
      <div className="user-menu-container relative inline-block" ref={userMenuRef}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={cn('icon-button user-menu-trigger', user && 'logged-in')}
              aria-label={user ? '用户菜单' : '登录'}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              {user ? (
                <div className="user-avatar-small flex items-center justify-center font-medium">
                  {userAvatar ? (
                    <Image
                      src={userAvatar}
                      alt="用户头像"
                      width={20}
                      height={20}
                      unoptimized
                      className="rounded-full"
                    />
                  ) : (
                    user.email?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
              ) : (
                <User className="w-4 h-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{user ? user.email || '用户' : '用户菜单'}</p>
          </TooltipContent>
        </Tooltip>

        <AnimatePresence>
          {userMenuOpen && (
            <motion.div
              className="user-menu-dropdown glass absolute right-0 z-50 min-w-[180px] rounded-xl border border-[var(--border)] bg-[var(--card)]/95 shadow-xl p-1.5"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{ transformOrigin: 'top right', top: navbarHeight + (isMobile ? -20 : 10) }}
            >
              {user ? (
                <>
                  <div className="user-menu-header p-2.5 flex items-center gap-2.5 border-b border-[var(--border)] mb-1">
                    <div className="user-avatar-large w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                      {userAvatar ? (
                        <Image
                          src={userAvatar}
                          alt="用户头像"
                          width={36}
                          height={36}
                          unoptimized
                          className="rounded-full"
                        />
                      ) : (
                        user.email?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <div className="user-info flex flex-col min-w-0">
                      <span className="user-email text-xs font-semibold text-foreground truncate">{user.email}</span>
                      <span className="user-status text-[10px] text-[var(--success)] font-medium">已登录</span>
                      {lastSyncTime && (
                        <span className="text-[10px] text-[var(--muted)] mt-0.5 tabular-nums">
                          同步于 {dayjs(lastSyncTime).format('MM-DD HH:mm')}
                        </span>
                      )}
                    </div>
                  </div>

                  {!isMobile && (
                    <>
                      <button
                        className="user-menu-item w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-white/10 transition-colors text-left cursor-pointer"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onOpenPortfolioEarnings?.();
                        }}
                      >
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>我的收益</span>
                      </button>
                      <button
                        className="user-menu-item w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-white/10 transition-colors text-left cursor-pointer"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onTutorial?.();
                        }}
                      >
                        <HelpCircle className="w-4 h-4 text-primary" />
                        <span>使用帮助</span>
                      </button>
                      <button
                        className="user-menu-item w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-white/10 transition-colors text-left cursor-pointer"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onUpdateLog?.();
                        }}
                      >
                        <List className="w-4 h-4 text-primary" />
                        <span>更新日志</span>
                      </button>
                    </>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="user-menu-item w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-white/10 transition-colors text-left cursor-pointer"
                        disabled={isSyncing}
                        onClick={async () => {
                          setUserMenuOpen(false);
                          await onSync?.();
                        }}
                      >
                        {isSyncing ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                        ) : (
                          <CloudUpload className="w-4 h-4 text-primary shrink-0" />
                        )}
                        <span>{isSyncing ? '同步中...' : '同步配置'}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>手动同步配置到云端</p>
                    </TooltipContent>
                  </Tooltip>

                  <button
                    className="user-menu-item w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-white/10 transition-colors text-left cursor-pointer"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onOpenSettings?.();
                    }}
                  >
                    <Settings className="w-4 h-4 text-[var(--muted)]" />
                    <span>设置</span>
                  </button>

                  <button
                    className="user-menu-item w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors text-left cursor-pointer"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setLogoutConfirmOpen(true);
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>登出</span>
                  </button>
                </>
              ) : (
                <>
                  {!isMobile && (
                    <>
                      <button
                        className="user-menu-item w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-white/10 transition-colors text-left cursor-pointer"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onOpenPortfolioEarnings?.();
                        }}
                      >
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>我的收益</span>
                      </button>
                      <button
                        className="user-menu-item w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-white/10 transition-colors text-left cursor-pointer"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onTutorial?.();
                        }}
                      >
                        <HelpCircle className="w-4 h-4 text-primary" />
                        <span>使用帮助</span>
                      </button>
                      <button
                        className="user-menu-item w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-white/10 transition-colors text-left cursor-pointer"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onUpdateLog?.();
                        }}
                      >
                        <List className="w-4 h-4 text-primary" />
                        <span>更新日志</span>
                      </button>
                    </>
                  )}
                  <button
                    className="user-menu-item w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-white/10 transition-colors text-left cursor-pointer"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onOpenSettings?.();
                    }}
                  >
                    <Settings className="w-4 h-4 text-[var(--muted)]" />
                    <span>设置</span>
                  </button>
                  <div className="h-px bg-[var(--border)] my-1" />
                  <button
                    className="user-menu-item w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors text-left cursor-pointer"
                    onClick={async () => {
                      setUserMenuOpen(false);
                      await useAuthStore.getState().logout();
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>锁定访问 / 退出</span>
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {logoutConfirmOpen && (
          <ConfirmModal
            title="确认登出"
            message="确定要退出当前账号吗？"
            icon={<LogOut className="w-5 h-5 shrink-0 text-[var(--danger)]" />}
            confirmText="确认登出"
            onConfirm={() => {
              setLogoutConfirmOpen(false);
              onLogout?.();
            }}
            onCancel={() => setLogoutConfirmOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
