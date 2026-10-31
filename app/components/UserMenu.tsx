'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence } from 'framer-motion';
import { CircleHelp, History, LogOut, Settings, TrendingUp, User } from 'lucide-react';
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
  onOpenSettings?: () => void;
  onOpenPortfolioEarnings?: () => void;
  onLogout?: () => void;
  onLogoutConfirmOpenChange?: (open: boolean) => void;
  onTutorial?: () => void;
  onUpdateLog?: () => void;
}

export default function UserMenu({
  userAvatar,
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
                  onSelect={() => {
                    setUserMenuOpen(false);
                    setTimeout(() => onOpenPortfolioEarnings?.(), 100);
                  }}
                >
                  <TrendingUp />
                  <span>我的收益</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={() => {
                    setUserMenuOpen(false);
                    setTimeout(() => onTutorial?.(), 100);
                  }}
                >
                  <CircleHelp />
                  <span>使用帮助</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={() => {
                    setUserMenuOpen(false);
                    setTimeout(() => onUpdateLog?.(), 100);
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
              onSelect={() => {
                setUserMenuOpen(false);
                setTimeout(() => onOpenSettings?.(), 100);
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
