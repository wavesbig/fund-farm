'use client';

import React, { memo, RefObject, TransitionStartFunction } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SUMMARY_TAB_ID } from '@/app/constants';
import { GridIcon, ListIcon, PlusIcon, SettingsIcon, SortIcon } from './Icons';
import type { FundGroup, SortRule } from '@/types';

export interface FilterBarProps {
  filterBarRef: RefObject<HTMLDivElement | null>;
  navbarHeight: number;
  shouldShowMarketIndex: boolean;
  showGroupDropdown: boolean;
  isMobile: boolean;
  hasTabOverflow: boolean;
  canLeft: boolean;
  canRight: boolean;
  scrollTabsLeftBtn: () => void;
  scrollTabsToLeftEnd: () => void;
  scrollTabsRightBtn: () => void;
  scrollTabsToRightEnd: () => void;
  scrollAreaRef: RefObject<HTMLDivElement | null>;
  tabsRef: RefObject<HTMLDivElement | null>;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseLeaveOrUp: () => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleWheel: (e: React.WheelEvent) => void;
  updateTabOverflow: () => void;
  showPortfolioSummaryTab: boolean;
  currentTab: string;
  handleTabClick: (tabId: string) => void;
  fundsCount: number;
  groups: FundGroup[];
  favoritesCount: number;
  isGroupDropdownTabActive: boolean;
  setGroupModalOpen: (open: boolean) => void;
  setGroupManageOpen: (open: boolean) => void;
  viewMode: string;
  applyViewMode: (mode: 'card' | 'list') => void;
  setSortSettingOpen: (open: boolean) => void;
  mobileSortDisplayMode: string;
  pcSortDisplayMode: string;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  sortOrder: string;
  setSortOrder: (order: string | ((prev: string) => string)) => void;
  sortRules: SortRule[];
  startTransition: TransitionStartFunction;
}

export const FilterBar = memo(function FilterBar({
  filterBarRef,
  navbarHeight,
  shouldShowMarketIndex,
  showGroupDropdown,
  isMobile,
  hasTabOverflow,
  canLeft,
  canRight,
  scrollTabsLeftBtn,
  scrollTabsToLeftEnd,
  scrollTabsRightBtn,
  scrollTabsToRightEnd,
  scrollAreaRef,
  tabsRef,
  handleMouseDown,
  handleMouseLeaveOrUp,
  handleMouseMove,
  handleWheel,
  updateTabOverflow,
  showPortfolioSummaryTab,
  currentTab,
  handleTabClick,
  fundsCount,
  groups,
  favoritesCount,
  isGroupDropdownTabActive,
  setGroupModalOpen,
  setGroupManageOpen,
  viewMode,
  applyViewMode,
  setSortSettingOpen,
  mobileSortDisplayMode,
  pcSortDisplayMode,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  sortRules,
  startTransition
}: FilterBarProps) {
  const isDropdownSort = (isMobile ? mobileSortDisplayMode : pcSortDisplayMode) === 'dropdown';

  return (
    <div
      ref={filterBarRef}
      className="filter-bar"
      style={{
        top: `calc(${navbarHeight}px + var(--market-index-height, 0px))`,
        marginTop: !shouldShowMarketIndex ? navbarHeight : 0,
        marginBottom: 8,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12
      }}
    >
      <div className="tabs-container">
        <div
          className="tabs-scroll-wrapper"
          style={{
            position: 'relative',
            flex: 1,
            minWidth: 0,
            paddingLeft: !showGroupDropdown && !isMobile && hasTabOverflow ? 32 : 0,
            paddingRight: !showGroupDropdown && !isMobile && hasTabOverflow ? 32 : 0,
            transition: 'padding 0.2s ease'
          }}
        >
          <AnimatePresence>
            {!showGroupDropdown && !isMobile && hasTabOverflow && (
              <>
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, y: '-50%', x: 0 }}
                  animate={{ opacity: 1, scale: 1, y: '-50%', x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: '-50%', x: 0 }}
                  whileHover={canLeft ? { scale: 1.1, y: '-50%', x: 0 } : {}}
                  whileTap={canLeft ? { scale: 0.95, y: '-50%', x: 0 } : {}}
                  transition={{ duration: 0.15 }}
                  className={`tabs-scroll-btn left ${!canLeft ? 'opacity-30 cursor-not-allowed' : ''}`}
                  disabled={!canLeft}
                  title="单击向左滚动，双击滚动到最左端"
                  onClick={scrollTabsLeftBtn}
                  onDoubleClick={scrollTabsToLeftEnd}
                >
                  <ChevronLeft size={16} />
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, y: '-50%', x: 0 }}
                  animate={{ opacity: 1, scale: 1, y: '-50%', x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: '-50%', x: 0 }}
                  whileHover={canRight ? { scale: 1.1, y: '-50%', x: 0 } : {}}
                  whileTap={canRight ? { scale: 0.95, y: '-50%', x: 0 } : {}}
                  transition={{ duration: 0.15 }}
                  className={`tabs-scroll-btn right ${!canRight ? 'opacity-30 cursor-not-allowed' : ''}`}
                  disabled={!canRight}
                  title="单击向右滚动，双击滚动到最右端"
                  onClick={scrollTabsRightBtn}
                  onDoubleClick={scrollTabsToRightEnd}
                >
                  <ChevronRight size={16} />
                </motion.button>
              </>
            )}
          </AnimatePresence>
          <div
            className="tabs-scroll-area"
            ref={scrollAreaRef}
            data-mask-left={!showGroupDropdown && canLeft}
            data-mask-right={!showGroupDropdown && canRight}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeaveOrUp}
            onMouseUp={handleMouseLeaveOrUp}
            onMouseMove={handleMouseMove}
            onWheel={handleWheel}
            onScroll={updateTabOverflow}
          >
            <div className="tabs" ref={tabsRef}>
              <AnimatePresence mode="popLayout">
                {showPortfolioSummaryTab && (
                  <motion.button
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    key="portfolio-summary"
                    className={`tab ${currentTab === SUMMARY_TAB_ID ? 'active' : ''}`}
                    onClick={() => handleTabClick(SUMMARY_TAB_ID)}
                    transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 1 }}
                  >
                    汇总
                  </motion.button>
                )}
                <motion.button
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key="all"
                  className={`tab ${currentTab === 'all' ? 'active' : ''}`}
                  onClick={() => handleTabClick('all')}
                  transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 1 }}
                >
                  全部 ({fundsCount})
                </motion.button>
                {!showGroupDropdown &&
                  groups.map((g) => {
                    const isFav = g.id === 'fav' || g.isPreset;
                    const count = isFav ? favoritesCount : g.codes?.length || 0;
                    const label = isFav ? '自选' : g.name;
                    return (
                      <motion.button
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        key={g.id}
                        className={`tab ${currentTab === g.id ? 'active' : ''}`}
                        onClick={() => handleTabClick(g.id)}
                        transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 1 }}
                      >
                        {label} ({count})
                      </motion.button>
                    );
                  })}
                {showGroupDropdown && (
                  <div key="group-dropdown" style={{ minWidth: isMobile ? 170 : 210, maxWidth: isMobile ? 230 : 300 }}>
                    <Select
                      value={isGroupDropdownTabActive ? currentTab : ''}
                      onValueChange={(value) => handleTabClick(value)}
                    >
                      <SelectTrigger
                        className={cn(
                          'h-4 py-0 text-xs shadow-none',
                          isGroupDropdownTabActive && 'border-primary/70 text-primary ring-1 ring-primary/25'
                        )}
                        style={{
                          background: isGroupDropdownTabActive
                            ? 'color-mix(in srgb, var(--primary) 12%, var(--card-bg))'
                            : 'var(--card-bg)',
                          boxShadow: isGroupDropdownTabActive
                            ? '0 0 0 1px rgba(255, 255, 255, 0.05), 0 6px 18px rgba(34, 211, 238, 0.12)'
                            : undefined,
                          height: 32
                        }}
                        aria-label="选择分组"
                      >
                        <SelectValue placeholder="选择分组" />
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        align="start"
                        style={{
                          width: isMobile ? 230 : 300
                        }}
                      >
                        <SelectGroup>
                          {groups.map((g) => {
                            const isFav = g.id === 'fav' || g.isPreset;
                            const count = isFav ? favoritesCount : g.codes?.length || 0;
                            const label = isFav ? '自选' : g.name;
                            return (
                              <SelectItem key={g.id} value={g.id}>
                                {label} ({count})
                              </SelectItem>
                            );
                          })}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </AnimatePresence>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setGroupModalOpen(true)}
                    aria-label="新增分组"
                  >
                    <PlusIcon width="16" height="16" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>新增分组</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
        {groups.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground"
                onClick={() => setGroupManageOpen(true)}
                aria-label="管理分组"
              >
                <SortIcon width="16" height="16" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>管理分组</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div
        className="sort-group"
        style={{
          display: currentTab === SUMMARY_TAB_ID ? 'none' : 'flex',
          alignItems: 'center',
          gap: 12
        }}
      >
        {/* 使用标准 shadcn/ui ToggleGroup 替代手写按扭 */}
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(val) => {
            if (val === 'card' || val === 'list') {
              applyViewMode(val);
            }
          }}
          className="bg-muted/30 border border-border/50 p-0.5 rounded-lg"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="card"
                aria-label="卡片视图"
                className="size-7 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-md transition-colors"
              >
                <GridIcon width="15" height="15" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>
              <p>卡片视图</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="list"
                aria-label="表格视图"
                className="size-7 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-md transition-colors"
              >
                <ListIcon width="15" height="15" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>
              <p>表格视图</p>
            </TooltipContent>
          </Tooltip>
        </ToggleGroup>

        {/* 使用标准 shadcn/ui Separator 替代手写 divider */}
        <Separator orientation="vertical" className="h-5" />

        <div className="sort-items" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setSortSettingOpen(true)}
                type="button"
              >
                <span>排序</span>
                <SettingsIcon width="14" height="14" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>排序个性化设置</p>
            </TooltipContent>
          </Tooltip>

          {isDropdownSort ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Select
                value={sortBy}
                onValueChange={(nextSortBy) => {
                  startTransition(() => {
                    setSortBy(nextSortBy);
                    if (nextSortBy !== sortBy) setSortOrder('desc');
                  });
                }}
              >
                <SelectTrigger
                  className="h-4 min-w-[110px] py-0 text-xs shadow-none"
                  style={{ background: 'var(--card-bg)', height: 36 }}
                >
                  <SelectValue placeholder="选择排序规则" />
                </SelectTrigger>
                <SelectContent>
                  {sortRules
                    .filter((s) => s.enabled)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.alias || s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select
                value={sortOrder}
                onValueChange={(value) => {
                  startTransition(() => {
                    setSortOrder(value);
                  });
                }}
              >
                <SelectTrigger
                  className="h-4 min-w-[84px] py-0 text-xs shadow-none"
                  style={{ background: 'var(--card-bg)', height: 36 }}
                >
                  <SelectValue placeholder="排序方向" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">降序</SelectItem>
                  <SelectItem value="asc">升序</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="chips">
              {sortRules
                .filter((s) => s.enabled)
                .map((s) => (
                  <Badge
                    key={s.id}
                    variant={sortBy === s.id ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer text-xs transition-colors py-1 px-2.5 font-normal',
                      sortBy === s.id
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'hover:bg-accent text-muted-foreground'
                    )}
                    onClick={() => {
                      startTransition(() => {
                        if (sortBy === s.id) {
                          setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                        } else {
                          setSortBy(s.id);
                          setSortOrder('desc');
                        }
                      });
                    }}
                  >
                    <span>{s.alias || s.name}</span>
                    {sortBy === s.id && <span className="ml-0.5">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </Badge>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default FilterBar;
