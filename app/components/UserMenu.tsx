'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence } from 'framer-motion';
import { CircleHelp, CloudUpload, History, Loader2, LogOut, Settings, TrendingUp, User } from 'lucide-react';
import { useIsMobile } from '@/app/hooks/useIsMobile';
import ConfirmModal from './ConfirmModal';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
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

export interface UserMenuProps {
  user?: any;
  userAvatar?: string | null;
  navbarHeight?: number;
  lastSyncTime?: string | number | Date | null;
  isSyncing?: boolean;
  onSync?: () => Promise<void> | void;
  onOpenSettings?: () => void;
  onOpenPortfolioEarnings?: () => void;
  onLogout?: () => void;
  onLogoutConfirmOpenChange?: (open: boolean) => void;
  onTutorial?: () => void;
  onUpdateLog?: () => void;
}

export default function UserMenu({
  userAvatar,
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

  useEffect(() => {
    onLogoutConfirmOpenChange?.(logoutConfirmOpen);
  }, [logoutConfirmOpen, onLogoutConfirmOpenChange]);

  return (
    <>
      <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground relative"
                aria-label="个人中心"
              >
                {userAvatar ? (
                  <div className="size-5 rounded-full overflow-hidden ring-1 ring-primary/30">
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
          </TooltipTrigger>
          <TooltipContent>
            <p>个人中心</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent align="end" className="w-48 p-1.5" sideOffset={8}>
          {!isMobile && (
            <>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenPortfolioEarnings?.();
                  }}
                >
                  <TrendingUp />
                  <span>我的收益</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setUserMenuOpen(false);
                    onTutorial?.();
                  }}
                >
                  <CircleHelp />
                  <span>使用帮助</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setUserMenuOpen(false);
                    onUpdateLog?.();
                  }}
                >
                  <History />
                  <span>更新日志</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuGroup>
            <DropdownMenuItem
              disabled={isSyncing}
              onClick={async () => {
                setUserMenuOpen(false);
                await onSync?.();
              }}
            >
              {isSyncing ? <Loader2 className="animate-spin text-primary" /> : <CloudUpload />}
              <span>{isSyncing ? '正在同步数据...' : '同步数据'}</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => {
                setUserMenuOpen(false);
                onOpenSettings?.();
              }}
            >
              <Settings />
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
            <LogOut />
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
            onConfirm={async () => {
              setLogoutConfirmOpen(false);
              if (onLogout) {
                onLogout();
              } else {
                await useAuthStore.getState().logout();
              }
            }}
            onCancel={() => setLogoutConfirmOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
