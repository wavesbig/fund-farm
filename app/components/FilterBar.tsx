'use client';

import React, { memo, RefObject, TransitionStartFunction } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  Settings2,
  LayoutGrid,
  List,
  Plus
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { SUMMARY_TAB_ID } from '@/app/constants';
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
  const activeSortRule = sortRules.find((s) => s.id === sortBy) || sortRules.find((s) => s.id === 'default');
  const activeSortLabel = activeSortRule?.alias || activeSortRule?.label || activeSortRule?.name || '默认排序';
  const isSorted = sortBy !== 'default';

  return (
    <div
      ref={filterBarRef}
      className="filter-bar"
      style={{
        top: `${navbarHeight}px`,
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
                <button
                  type="button"
                  className={`tabs-scroll-btn left ${!canLeft ? 'opacity-30 cursor-not-allowed' : ''}`}
                  disabled={!canLeft}
                  title="单击向左滚动，双击滚动到最左端"
                  onClick={scrollTabsLeftBtn}
                  onDoubleClick={scrollTabsToLeftEnd}
                >
                  <ChevronLeft className="size-4" strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  className={`tabs-scroll-btn right ${!canRight ? 'opacity-30 cursor-not-allowed' : ''}`}
                  disabled={!canRight}
                  title="单击向右滚动，双击滚动到最右端"
                  onClick={scrollTabsRightBtn}
                  onDoubleClick={scrollTabsToRightEnd}
                >
                  <ChevronRight className="size-4" strokeWidth={1.8} />
                </button>
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
              {showPortfolioSummaryTab && (
                <button
                  type="button"
                  key="portfolio-summary"
                  className={`tab ${currentTab === SUMMARY_TAB_ID ? 'active' : ''}`}
                  onClick={() => handleTabClick(SUMMARY_TAB_ID)}
                >
                  汇总
                </button>
              )}
              <button
                type="button"
                key="all"
                className={`tab ${currentTab === 'all' ? 'active' : ''}`}
                onClick={() => handleTabClick('all')}
              >
                全部 ({fundsCount})
              </button>
              {!showGroupDropdown &&
                groups.map((g) => {
                  const isFav = g.id === 'fav' || g.isPreset;
                  const count = isFav ? favoritesCount : g.codes?.length || 0;
                  const label = isFav ? '自选' : g.name;
                  return (
                    <button
                      type="button"
                      key={g.id}
                      className={`tab ${currentTab === g.id ? 'active' : ''}`}
                      onClick={() => handleTabClick(g.id)}
                    >
                      {label} ({count})
                    </button>
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
                        'h-4 py-0 text-sm shadow-none',
                        isGroupDropdownTabActive && 'border-primary/70 text-primary ring-1 ring-primary/25'
                      )}
                      style={{
                        background: isGroupDropdownTabActive
                          ? 'color-mix(in srgb, var(--primary) 12%, var(--card-bg))'
                          : 'var(--card-bg)',
                        boxShadow: isGroupDropdownTabActive
                          ? '0 0 0 1px rgba(255, 255, 255, 0.05), 0 4px 14px color-mix(in srgb, var(--primary) 20%, transparent)'
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="toolbar-icon-btn"
                    onClick={() => setGroupModalOpen(true)}
                    aria-label="新增分组"
                  >
                    <Plus className="size-3.5" strokeWidth={2} />
                  </button>
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
              <button
                type="button"
                className="toolbar-icon-btn"
                onClick={() => setGroupManageOpen(true)}
                aria-label="管理分组"
              >
                <SlidersHorizontal className="size-3.5" strokeWidth={1.8} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>管理分组</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div
        className="sort-group shrink-0"
        style={{
          display: currentTab === SUMMARY_TAB_ID ? 'none' : 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        {/* 视图切换按钮组：shadcn ToggleGroup 标准化 */}
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(val) => {
            if (val) applyViewMode(val as 'card' | 'list');
          }}
          size="sm"
          className="h-8 p-0.5 rounded-lg border border-border/60 bg-muted/30 shrink-0 gap-0.5"
          aria-label="视图模式切换"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="card"
                aria-label="卡片视图"
                className="size-7 p-0 rounded-md data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-xs text-muted-foreground/70 hover:text-foreground cursor-pointer transition-all"
              >
                <LayoutGrid className="size-3.5" strokeWidth={1.8} />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              <p>卡片视图</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="list"
                aria-label="表格视图"
                className="size-7 p-0 rounded-md data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-xs text-muted-foreground/70 hover:text-foreground cursor-pointer transition-all"
              >
                <List className="size-3.5" strokeWidth={1.8} />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              <p>表格视图</p>
            </TooltipContent>
          </Tooltip>
        </ToggleGroup>

        {/* 使用标准 shadcn/ui Separator 替代手写 divider */}
        <Separator orientation="vertical" className="h-5" />

        <div className="sort-items shrink-0 flex items-center gap-2">
          {isDropdownSort ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-8 px-2.5 gap-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer select-none',
                    'bg-[rgba(255,255,255,0.07)] hover:bg-[rgba(255,255,255,0.12)] border-[rgba(255,255,255,0.08)] [data-theme=light]:bg-[rgba(0,0,0,0.05)] [data-theme=light]:border-[rgba(0,0,0,0.04)] text-foreground shadow-xs',
                    isSorted && 'border-primary/40 text-primary bg-primary/10 hover:bg-primary/15'
                  )}
                >
                  <ArrowUpDown
                    className={cn('size-3.5', isSorted ? 'text-primary' : 'text-muted-foreground')}
                    strokeWidth={1.8}
                  />
                  <span className="truncate max-w-[120px]">{activeSortLabel}</span>
                  {isSorted && (
                    <span className="font-mono text-xs font-semibold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                  <ChevronDown className="size-3 text-muted-foreground opacity-70 ml-0.5" strokeWidth={1.8} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold px-2 py-1.5">
                  排序规则
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={sortBy}
                  onValueChange={(nextSortBy) => {
                    startTransition(() => {
                      if (nextSortBy === sortBy) {
                        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                      } else {
                        setSortBy(nextSortBy);
                        if (nextSortBy !== sortBy) setSortOrder('desc');
                      }
                    });
                  }}
                >
                  {sortRules
                    .filter((s) => s.enabled)
                    .map((s) => (
                      <DropdownMenuRadioItem
                        key={s.id}
                        value={s.id}
                        className="text-xs cursor-pointer flex items-center justify-between py-1.5"
                      >
                        <span className="truncate">{s.alias || s.label || s.name || s.id}</span>
                        {sortBy === s.id && (
                          <span className="text-[11px] font-mono text-primary font-medium ml-2">
                            {sortOrder === 'asc' ? '升序 ↑' : '降序 ↓'}
                          </span>
                        )}
                      </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />

                <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold px-2 py-1.5">
                  排序方向
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={sortOrder}
                  onValueChange={(nextOrder) => {
                    startTransition(() => {
                      setSortOrder(nextOrder);
                    });
                  }}
                >
                  <DropdownMenuRadioItem value="desc" className="text-xs cursor-pointer py-1.5">
                    <ArrowDown className="size-3.5 mr-2 text-muted-foreground" strokeWidth={1.8} />
                    <span>降序（从高到低）</span>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="asc" className="text-xs cursor-pointer py-1.5">
                    <ArrowUp className="size-3.5 mr-2 text-muted-foreground" strokeWidth={1.8} />
                    <span>升序（从低到高）</span>
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => setSortSettingOpen(true)}
                  className="text-xs cursor-pointer py-1.5 gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Settings2 className="size-3.5" strokeWidth={1.8} />
                  <span>自定义排序偏好...</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1.5 max-w-full">
              <div className="tab-capsule overflow-x-auto no-scrollbar max-w-full">
                {sortRules
                  .filter((s) => s.enabled)
                  .map((s) => {
                    const isActive = sortBy === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          startTransition(() => {
                            if (isActive) {
                              setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                            } else {
                              setSortBy(s.id);
                              setSortOrder('desc');
                            }
                          });
                        }}
                        className={cn(
                          'h-7 px-2.5 text-xs font-medium rounded-md transition-all cursor-pointer select-none flex items-center gap-1 border border-transparent',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                            : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.06] [data-theme=light]:hover:bg-black/[0.04]'
                        )}
                      >
                        <span>{s.alias || s.label || s.name || s.id}</span>
                        {isActive && <span className="font-mono text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                      </button>
                    );
                  })}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="toolbar-icon-btn"
                    onClick={() => setSortSettingOpen(true)}
                    aria-label="排序偏好设置"
                  >
                    <Settings2 className="size-3.5" strokeWidth={1.8} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>排序偏好设置</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default FilterBar;
