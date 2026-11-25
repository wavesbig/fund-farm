'use client';

import React, { memo, RefObject } from 'react';
import Image from 'next/image';
import githubImg from '../assets/github.svg';
import SearchBar from './SearchBar';
import RefreshButton from './RefreshButton';
import UserMenu from './UserMenu';
import BrandLogo from './BrandLogo';
import { Moon, Star, Sun } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '../hooks/useTheme';

export interface NavbarProps {
  navbarRef?: RefObject<HTMLDivElement | null>;
  containerWidth?: string | number;
  refreshing: boolean;
  isSyncing?: boolean;
  selectedFunds: any[];
  toggleSelectFund: (fund: any) => void;
  dropdownRef?: RefObject<HTMLDivElement | null>;
  inputRef?: RefObject<HTMLInputElement | null>;
  searchTerm: string;
  handleSearchInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  searchResults: any[];
  isSearching: boolean;
  isScanning: boolean;
  handleScanClick: (e?: React.MouseEvent) => void;
  addFund: (e?: any) => void;
  refreshMs: number;
  manualRefresh: () => void;
  fundsLength: number;
  refreshCycleStartRef?: RefObject<number>;
  theme?: string;
  handleThemeToggle?: () => void;
  userAvatar?: string | null;
}

export const Navbar = memo(function Navbar({
  navbarRef,
  containerWidth,
  refreshing,
  isSyncing = false,
  selectedFunds,
  toggleSelectFund,
  dropdownRef,
  inputRef,
  searchTerm,
  handleSearchInput,
  showDropdown,
  setShowDropdown,
  searchResults,
  isSearching,
  isScanning,
  handleScanClick,
  addFund,
  refreshMs,
  manualRefresh,
  fundsLength,
  refreshCycleStartRef,
  theme: themeProp,
  handleThemeToggle: handleThemeToggleProp,
  userAvatar
}: NavbarProps) {
  // 优雅降级：支持优先使用外部传入的主题状态，亦可直接使用 Hook
  const themeHook = useTheme();
  const theme = themeProp ?? themeHook.theme;
  const handleThemeToggle = handleThemeToggleProp ?? themeHook.handleThemeToggle;

  return (
    <header className="navbar" ref={navbarRef}>
      {refreshing && <div className="loading-bar" />}
      <div
        className="navbar-inner"
        style={{
          maxWidth: containerWidth ? `${containerWidth}px` : '1200px'
        }}
      >
        {/* 1. 品牌 Logo 与 SQLite 本地同步指示 */}
        <BrandLogo isSyncing={isSyncing} />

        {/* 2. 基金搜索与快速添加区域（高度恒定锁定，绝不被选中的标签挤压跳变） */}
        <div className="navbar-add-fund" role="region" aria-label="添加基金">
          <div className="search-container" ref={dropdownRef}>
            <SearchBar
              inputRef={inputRef}
              searchTerm={searchTerm}
              handleSearchInput={handleSearchInput}
              showDropdown={showDropdown}
              setShowDropdown={setShowDropdown}
              searchResults={searchResults}
              isSearching={isSearching}
              selectedFunds={selectedFunds}
              toggleSelectFund={toggleSelectFund}
              isScanning={isScanning}
              handleScanClick={handleScanClick}
              addFund={addFund}
            />
          </div>
        </div>

        {/* 3. 顶部操作栏（尺寸与圆角严格归一化为 34px） */}
        <div className="actions flex items-center gap-1 sm:gap-1.5 shrink-0">
          {process.env.NEXT_PUBLIC_GITHUB_REPO_URL && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-[34px] px-2 sm:px-2.5 gap-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] [data-theme=light]:hover:bg-black/[0.04] transition-colors cursor-pointer hidden sm:inline-flex items-center group"
                  onClick={() => window.open(process.env.NEXT_PUBLIC_GITHUB_REPO_URL, '_blank')}
                  aria-label="在 GitHub 上为养基场点个 Star"
                >
                  <Image
                    unoptimized
                    alt="GitHub"
                    src={githubImg}
                    width={16}
                    height={16}
                    className="opacity-70 group-hover:opacity-100 transition-opacity shrink-0"
                  />
                  <span className="text-xs font-medium hidden md:inline">Star</span>
                  <Star className="size-3 text-amber-500 fill-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                <p>在 GitHub 为养基场点 Star 支持</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* 刷新按钮（进度环已归一化为 34px 同心圆角） */}
          <RefreshButton
            refreshMs={refreshMs}
            manualRefresh={manualRefresh}
            refreshing={refreshing}
            fundsLength={fundsLength}
            refreshCycleStartRef={refreshCycleStartRef}
          />

          {/* 主题切换按钮 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 sm:size-[34px] rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] [data-theme=light]:hover:bg-black/[0.04] transition-colors cursor-pointer"
                aria-label={theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题'}
                onClick={handleThemeToggle}
              >
                <span className="grid place-items-center size-4 overflow-hidden">
                  <span
                    className={cn(
                      '[grid-area:1/1] transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:scale-100 motion-reduce:blur-[0px]',
                      theme === 'dark'
                        ? 'scale-100 opacity-100 blur-[0px]'
                        : 'scale-[0.25] opacity-0 blur-[4px] pointer-events-none'
                    )}
                  >
                    <Sun className="size-4" strokeWidth={1.8} />
                  </span>
                  <span
                    className={cn(
                      '[grid-area:1/1] transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:scale-100 motion-reduce:blur-[0px]',
                      theme === 'dark'
                        ? 'scale-[0.25] opacity-0 blur-[4px] pointer-events-none'
                        : 'scale-100 opacity-100 blur-[0px]'
                    )}
                  >
                    <Moon className="size-4" strokeWidth={1.8} />
                  </span>
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              <p>{theme === 'dark' ? '切换到亮色' : '切换到暗色'}</p>
            </TooltipContent>
          </Tooltip>

          {/* 4. 用户中心菜单：移动端有固定底栏“我的”Tab，顶部隐藏冗余入口，彻底为搜索框释放宽度 */}
          <div className="hidden sm:inline-flex">
            <UserMenu userAvatar={userAvatar} />
          </div>
        </div>
      </div>
    </header>
  );
});

export default Navbar;
