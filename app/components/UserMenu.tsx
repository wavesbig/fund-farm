'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import Image from 'next/image';
import { AnimatePresence } from 'framer-motion';
import { CircleHelp, History, LogOut, Settings, TrendingUp, User } from 'lucide-react';
import { useIsMobile } from '@/app/hooks/useIsMobile';
import ConfirmModal from './ConfirmModal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '../stores/authStore';
import { useModalStore } from '../stores/modalStore';
import { toast } from 'sonner';

export interface UserMenuProps {
  userAvatar?: string | null;
  onOpenSettings?: () => void;
  onOpenPortfolioEarnings?: () => void;
  onLogout?: () => void;
  onTutorial?: () => void;
  onUpdateLog?: () => void;
}

export default function UserMenu({
  userAvatar,
  onOpenSettings,
  onOpenPortfolioEarnings,
  onLogout,
  onTutorial,
  onUpdateLog
}: UserMenuProps) {
  const isMobile = useIsMobile();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const handleOpenPortfolioEarnings = useCallback(() => {
    if (onOpenPortfolioEarnings) {
      onOpenPortfolioEarnings();
    } else {
      useModalStore.setState({ portfolioEarningsOpen: true });
    }
  }, [onOpenPortfolioEarnings]);

  const handleOpenTutorial = useCallback(() => {
    if (onTutorial) {
      onTutorial();
    } else if (isMobile) {
      useModalStore.setState({ tutorialDrawerOpen: true });
    } else {
      window.open('https://www.yuque.com/u267605/ookgim/im06q8tembbld6im?singleDoc', '_blank');
    }
  }, [onTutorial, isMobile]);

  const handleOpenUpdateLog = useCallback(() => {
    if (onUpdateLog) {
      onUpdateLog();
    } else {
      useModalStore.setState({ updateLogOpen: true });
    }
  }, [onUpdateLog]);

  const handleOpenSettings = useCallback(() => {
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      useModalStore.setState({ settingsOpen: true });
    }
  }, [onOpenSettings]);

  const handleConfirmLogout = useCallback(async () => {
    setLogoutConfirmOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      try {
        await useAuthStore.getState().logout();
        toast.info('已锁定访问');
      } catch (err: any) {
        toast.error(err?.message || '锁定失败');
      }
    }
  }, [onLogout]);

  return (
    <>
      <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-[34px] rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] [data-theme=light]:hover:bg-black/[0.04] transition-colors relative cursor-pointer"
            aria-label="个人中心"
          >
            {userAvatar ? (
              <div className="size-5 rounded-full overflow-hidden outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10">
                <Image
                  src={userAvatar}
                  alt="用户头像"
                  width={20}
                  height={20}
                  unoptimized
                  className="size-full object-cover"
                />
              </div>
            ) : (
              <User className="size-4" />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48 p-1.5" sideOffset={8}>
          {!isMobile && (
            <>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setUserMenuOpen(false);
                    setTimeout(handleOpenPortfolioEarnings, 150);
                  }}
                >
                  <TrendingUp className="size-4" />
                  <span>我的收益</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setUserMenuOpen(false);
                    setTimeout(handleOpenTutorial, 150);
                  }}
                >
                  <CircleHelp className="size-4" />
                  <span>使用帮助</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setUserMenuOpen(false);
                    setTimeout(handleOpenUpdateLog, 150);
                  }}
                >
                  <History className="size-4" />
                  <span>更新日志</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setUserMenuOpen(false);
                setTimeout(handleOpenSettings, 150);
              }}
            >
              <Settings className="size-4" />
              <span>系统设置</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              setUserMenuOpen(false);
              setLogoutConfirmOpen(true);
            }}
          >
            <LogOut className="size-4" />
            <span>锁定访问 / 退出</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AnimatePresence>
        {logoutConfirmOpen && (
          <ConfirmModal
            title="锁定访问"
            message="确定要锁定访问吗？锁定后需要输入访问密码重新解锁。"
            icon={<LogOut className="size-5 shrink-0 text-destructive" />}
            confirmText="确认锁定"
            onConfirm={handleConfirmLogout}
            onCancel={() => setLogoutConfirmOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
