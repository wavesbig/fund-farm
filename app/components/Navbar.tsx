'use client';

import React, { memo, RefObject } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import githubImg from '../assets/github.svg';
import SearchBar from './SearchBar';
import RefreshButton from './RefreshButton';
import UserMenu from './UserMenu';
import { CloseIcon } from './Icons';
import { Moon, Search, Sun } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const UpdateChecker = dynamic<{ onModalOpenChange?: (open: boolean) => void }>(() => import('./UpdateChecker'), {
  ssr: false
});

export interface NavbarProps {
  navbarRef: RefObject<HTMLDivElement | null>;
  containerWidth?: string | number;
  refreshing: boolean;
  isSyncing: boolean;
  isSearchFocused: boolean;
  selectedFunds: any[];
  toggleSelectFund: (fund: any) => void;
  dropdownRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  searchTerm: string;
  handleSearchInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  setIsSearchFocused: (focused: boolean) => void;
  searchResults: any[];
  isSearching: boolean;
  isScanning: boolean;
  handleScanClick: (e?: React.MouseEvent) => void;
  addFund: (code: string, e?: React.MouseEvent) => void;
  error: string | null;
  setIsUpdateModalOpen: (open: boolean) => void;
  isMobile: boolean;
  handleMobileSearchClick: () => void;
  refreshMs: number;
  manualRefresh: () => void;
  fundsLength: number;
  refreshCycleStartRef: RefObject<number>;
  theme: string;
  handleThemeToggle: () => void;
  user: any;
  userAvatar: string | null;
  navbarHeight: number;
  lastSyncTime: string | null;
  syncUserConfig: (userId?: any, isForce?: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setPortfolioEarningsOpen: (open: boolean) => void;
  handleLogout: () => void;
  setIsLogoutConfirmOpen: (open: boolean) => void;
  setTutorialDrawerOpen: (open: boolean) => void;
  setUpdateLogOpen: (open: boolean) => void;
}

export const Navbar = memo(function Navbar({
  navbarRef,
  containerWidth,
  refreshing,
  isSyncing,
  isSearchFocused,
  selectedFunds,
  toggleSelectFund,
  dropdownRef,
  inputRef,
  searchTerm,
  handleSearchInput,
  showDropdown,
  setShowDropdown,
  setIsSearchFocused,
  searchResults,
  isSearching,
  isScanning,
  handleScanClick,
  addFund,
  error,
  setIsUpdateModalOpen,
  isMobile,
  handleMobileSearchClick,
  refreshMs,
  manualRefresh,
  fundsLength,
  refreshCycleStartRef,
  theme,
  handleThemeToggle,
  user,
  userAvatar,
  navbarHeight,
  lastSyncTime,
  syncUserConfig,
  setSettingsOpen,
  setPortfolioEarningsOpen,
  handleLogout,
  setIsLogoutConfirmOpen,
  setTutorialDrawerOpen,
  setUpdateLogOpen
}: NavbarProps) {
  return (
    <header className="navbar" ref={navbarRef}>
      {refreshing && <div className="loading-bar"></div>}
      <div
        className="navbar-inner"
        style={{
          maxWidth: containerWidth ? (isMobile ? '100%' : `${containerWidth}px`) : '1200px'
        }}
      >
        <div className="brand">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                style={{
                  width: 24,
                  height: 24,
                  marginRight: 4,
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
              >
                {/* 同步中图标 */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    margin: 'auto',
                    opacity: isSyncing ? 1 : 0,
                    transform: isSyncing ? 'translateY(0px)' : 'translateY(4px)',
                    transition: 'opacity 0.25s ease, transform 0.25s ease'
                  }}
                >
                  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" stroke="var(--primary)" />
                  <path d="M12 12v9" stroke="var(--accent)" />
                  <path d="m16 16-4-4-4 4" stroke="var(--accent)" />
                </svg>
                {/* 默认图标 */}
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    margin: 'auto',
                    opacity: isSyncing ? 0 : 1,
                    transform: isSyncing ? 'translateY(-4px)' : 'translateY(0px)',
                    transition: 'opacity 0.25s ease, transform 0.25s ease'
                  }}
                >
                  <circle cx="12" cy="12" r="10" stroke="var(--accent)" strokeWidth="2" />
                  <path d="M5 14c2-4 7-6 14-5" stroke="var(--primary)" strokeWidth="2" />
                </svg>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isSyncing ? '正在实时保存...' : '已实时保存至本地 SQLite'}</p>
            </TooltipContent>
          </Tooltip>
          <span className="text-[17px] font-semibold tracking-tight text-foreground">基估宝</span>
        </div>

        <div className="navbar-add-fund" role="region" aria-label="添加基金">
          <div className="search-container" ref={dropdownRef}>
            {selectedFunds.length > 0 && (
              <div className="selected-inline-chips" style={{ marginBottom: 8, marginLeft: 0 }}>
                {selectedFunds.map((fund) => (
                  <div key={fund.CODE} className="fund-chip">
                    <span>{fund.NAME}</span>
                    <button onClick={() => toggleSelectFund(fund)} className="remove-chip">
                      <CloseIcon width="14" height="14" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <SearchBar
              inputRef={inputRef}
              searchTerm={searchTerm}
              handleSearchInput={handleSearchInput}
              showDropdown={showDropdown}
              setShowDropdown={setShowDropdown}
              isSearchFocused={isSearchFocused}
              setIsSearchFocused={setIsSearchFocused}
              searchResults={searchResults}
              isSearching={isSearching}
              selectedFunds={selectedFunds}
              toggleSelectFund={toggleSelectFund}
              isScanning={isScanning}
              handleScanClick={handleScanClick}
              addFund={addFund}
            />
          </div>
          {error && (
            <div className="muted" style={{ marginTop: 8, color: 'var(--danger)' }}>
              {error}
            </div>
          )}
        </div>

        <div className="actions">
          <UpdateChecker onModalOpenChange={setIsUpdateModalOpen} />
          {process.env.NEXT_PUBLIC_GITHUB_REPO_URL && (
            <span className="github-icon-wrap">
              <Image
                unoptimized
                alt="项目Github地址"
                src={githubImg}
                style={{ width: '30px', height: '30px', cursor: 'pointer' }}
                onClick={() => window.open(process.env.NEXT_PUBLIC_GITHUB_REPO_URL, '_blank')}
              />
            </span>
          )}
          {isMobile && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-primary/5 dark:hover:bg-white/10 transition-colors"
                  aria-label="筛选基金"
                  onClick={handleMobileSearchClick}
                >
                  <Search className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>筛选</p>
              </TooltipContent>
            </Tooltip>
          )}
          <RefreshButton
            refreshMs={refreshMs}
            manualRefresh={manualRefresh}
            refreshing={refreshing}
            fundsLength={fundsLength}
            refreshCycleStartRef={refreshCycleStartRef}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-primary/5 dark:hover:bg-white/10 transition-colors"
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
                    <Sun className="size-4" />
                  </span>
                  <span
                    className={cn(
                      '[grid-area:1/1] transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:scale-100 motion-reduce:blur-[0px]',
                      theme === 'dark'
                        ? 'scale-[0.25] opacity-0 blur-[4px] pointer-events-none'
                        : 'scale-100 opacity-100 blur-[0px]'
                    )}
                  >
                    <Moon className="size-4" />
                  </span>
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{theme === 'dark' ? '亮色' : '暗色'}</p>
            </TooltipContent>
          </Tooltip>
          <UserMenu
            user={user}
            userAvatar={userAvatar}
            navbarHeight={navbarHeight}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenPortfolioEarnings={() => setPortfolioEarningsOpen(true)}
            onLogout={handleLogout}
            onLogoutConfirmOpenChange={setIsLogoutConfirmOpen}
            onTutorial={() => {
              setTutorialDrawerOpen(true);
            }}
            onUpdateLog={() => setUpdateLogOpen(true)}
          />
        </div>
      </div>
    </header>
  );
});

export default Navbar;
