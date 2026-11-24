'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { isArray, isNumber } from 'lodash';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { storageStore } from '../stores';
import PcFundTable from './PcFundTable';
import MobileFundTable from './MobileFundTable';
import FundCard from './FundCard';

export interface FundListViewProps {
  viewMode: 'list' | 'card' | string;
  isMobile: boolean;
  isGroupSummarySticky?: boolean;
  navbarHeight: number;
  filterBarHeight: number;
  pcFundTableData: any[];
  userId?: string;
  currentTab: string;
  groups: any[];
  favorites: any;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  sortRules: any[];
  setSortBy: (sortBy: string) => void;
  setSortOrder: React.Dispatch<React.SetStateAction<'asc' | 'desc'>>;
  startTransition: (fn: () => void) => void;
  handleReorder: (oldIndex: number, newIndex: number) => void;
  handleRemoveFundEntry: (fund: any) => void;
  removeFundsFromCurrentTabHandler: (funds: any[]) => void;
  handleMoveFunds: (payload: any) => Promise<any> | void;
  pcBatchClearSelectionRef?: React.MutableRefObject<any>;
  handleToggleFavoriteRow: (code: string) => void;
  handleHoldingAmountClickRow: (row: any, meta?: any) => void;
  handleHoldingProfitClickRow: (row: any, meta?: any) => void;
  triggerCustomSettingsSync: () => void;
  fundDetailDialogCloseRef?: React.MutableRefObject<any>;
  maskAmounts?: boolean;
  getFundCardPropsForRow: (row: any) => any;
  openFundTagsEdit: (code: string) => void;
  fundExtraDataByCode?: Record<string, any>;
  fundDetailDrawerCloseRef?: React.MutableRefObject<any>;
  mobileBatchClearSelectionRef?: React.MutableRefObject<any>;
  handleFundCardDrawerOpenChange: (open: boolean) => void;
  handleMobileSettingModalOpenChange: (open: boolean) => void;
  displayFunds: any[];
  linkedHoldingsForAllFav: any;
  todayStr: string;
  dcaPlansForTab: Record<string, any>;
  holdingsForTabWithLinked: Record<string, any>;
  percentModes: Record<string, any>;
  todayPercentModes: Record<string, any>;
  currentFundDailyEarnings: Record<string, any>;
  valuationSeries: Record<string, any>;
  collapsedCodes: Record<string, any>;
  collapsedTrends: Record<string, any>;
  collapsedValuationTrends: Record<string, any>;
  collapsedEarnings: Record<string, any>;
  transactionsForTab: Record<string, any>;
  theme: string;
  isTradingDay: boolean;
  getHoldingProfitForTab: (fund: any, holding?: any) => any;
  toggleFavorite: (code: string) => void;
  openHoldingModal: (fund: any) => void;
  openActionModal: (fund: any) => void;
  openDataSourceModal: (fund: any) => void;
  togglePercentMode: (code: string) => void;
  toggleTodayPercentMode: (code: string) => void;
  toggleCollapse: (code: string) => void;
  toggleTrendCollapse: (code: string) => void;
  toggleValuationTrendCollapse: (code: string) => void;
  toggleEarningsCollapse: (code: string) => void;
  fundTagListsByCode: Record<string, any>;
  groupTotalHoldingAmount?: number;
}

const FundListView = React.memo(function FundListView({
  viewMode,
  isMobile,
  isGroupSummarySticky,
  navbarHeight,
  filterBarHeight,
  pcFundTableData,
  userId,
  currentTab,
  groups,
  favorites,
  sortBy,
  sortOrder,
  sortRules,
  setSortBy,
  setSortOrder,
  startTransition,
  handleReorder,
  handleRemoveFundEntry,
  removeFundsFromCurrentTabHandler,
  handleMoveFunds,
  pcBatchClearSelectionRef,
  handleToggleFavoriteRow,
  handleHoldingAmountClickRow,
  handleHoldingProfitClickRow,
  triggerCustomSettingsSync,
  fundDetailDialogCloseRef,
  maskAmounts,
  getFundCardPropsForRow,
  openFundTagsEdit,
  fundExtraDataByCode,
  fundDetailDrawerCloseRef,
  mobileBatchClearSelectionRef,
  handleFundCardDrawerOpenChange,
  handleMobileSettingModalOpenChange,
  displayFunds,
  linkedHoldingsForAllFav,
  todayStr,
  dcaPlansForTab,
  holdingsForTabWithLinked,
  percentModes,
  todayPercentModes,
  currentFundDailyEarnings,
  valuationSeries,
  collapsedCodes,
  collapsedTrends,
  collapsedValuationTrends,
  collapsedEarnings,
  transactionsForTab,
  theme,
  isTradingDay,
  getHoldingProfitForTab,
  toggleFavorite,
  openHoldingModal,
  openActionModal,
  openDataSourceModal,
  togglePercentMode,
  toggleTodayPercentMode,
  toggleCollapse,
  toggleTrendCollapse,
  toggleValuationTrendCollapse,
  toggleEarningsCollapse,
  fundTagListsByCode,
  groupTotalHoldingAmount
}: FundListViewProps) {
  const [cardPageIndex, setCardPageIndex] = useState<number>(0);
  const [cardPageSize, setCardPageSize] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = storageStore.getItem('fundCardPageSize');
        if (stored && isNumber(stored) && stored > 0) return stored;
      } catch {}
    }
    return 12; // 默认每页 12 支，在双列网格下为整整齐齐的 6 行
  });

  useEffect(() => {
    setCardPageIndex(0);
  }, [currentTab, sortBy, sortOrder]);

  const totalCards = displayFunds.length;
  const pageCount = Math.max(1, Math.ceil(totalCards / cardPageSize));
  const safePageIndex = Math.min(cardPageIndex, pageCount - 1);
  const pagedCards = useMemo(() => {
    const start = safePageIndex * cardPageSize;
    return displayFunds.slice(start, start + cardPageSize);
  }, [displayFunds, safePageIndex, cardPageSize]);

  return (
    <div
      className={viewMode === 'card' ? 'grid' : 'table-container glass'}
      style={{ marginTop: isGroupSummarySticky ? 50 : 0 }}
    >
      <div
        className={viewMode === 'card' ? 'grid col-12' : ''}
        style={viewMode === 'card' ? { gridColumn: 'span 12', gap: 16 } : {}}
      >
        {/* PC 列表：使用 PcFundTable + 右侧冻结操作列 */}
        {viewMode === 'list' && !isMobile && (
          <PcFundTable
            stickyTop={navbarHeight + filterBarHeight}
            data={pcFundTableData}
            relatedSectorSessionKey={userId ?? ''}
            currentTab={currentTab}
            groups={groups}
            favorites={favorites}
            sortBy={sortBy}
            sortOrder={sortOrder}
            sortRules={sortRules}
            onSortChange={(id: string) => {
              startTransition(() => {
                if (sortBy === id) {
                  setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                } else {
                  setSortBy(id);
                  setSortOrder('desc');
                }
              });
            }}
            onReorder={handleReorder}
            onRemoveFund={handleRemoveFundEntry}
            onRemoveFunds={removeFundsFromCurrentTabHandler}
            onMoveFunds={handleMoveFunds}
            batchSelectionClearRef={pcBatchClearSelectionRef}
            onToggleFavorite={handleToggleFavoriteRow}
            onHoldingAmountClick={handleHoldingAmountClickRow}
            onHoldingProfitClick={handleHoldingProfitClickRow}
            onCustomSettingsChange={triggerCustomSettingsSync}
            closeDialogRef={fundDetailDialogCloseRef}
            masked={maskAmounts}
            getFundCardProps={getFundCardPropsForRow}
            onFundTagsClick={openFundTagsEdit}
            fundExtraDataByCode={fundExtraDataByCode}
          />
        )}

        {/* 移动端列表：使用 MobileFundTable */}
        {viewMode === 'list' && isMobile && (
          <MobileFundTable
            data={pcFundTableData}
            relatedSectorSessionKey={userId ?? ''}
            currentTab={currentTab}
            groups={groups}
            onMoveFunds={handleMoveFunds}
            favorites={favorites}
            sortBy={sortBy}
            sortOrder={sortOrder}
            sortRules={sortRules}
            onSortChange={(id: string) => {
              startTransition(() => {
                if (sortBy === id) {
                  setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                } else {
                  setSortBy(id);
                  setSortOrder('desc');
                }
              });
            }}
            stickyTop={navbarHeight + filterBarHeight}
            closeDrawerRef={fundDetailDrawerCloseRef}
            onReorder={handleReorder}
            onRemoveFund={handleRemoveFundEntry}
            onRemoveFunds={removeFundsFromCurrentTabHandler}
            onToggleFavorite={handleToggleFavoriteRow}
            onHoldingAmountClick={handleHoldingAmountClickRow}
            onHoldingProfitClick={handleHoldingProfitClickRow}
            batchSelectionClearRef={mobileBatchClearSelectionRef}
            onCustomSettingsChange={triggerCustomSettingsSync}
            onFundCardDrawerOpenChange={handleFundCardDrawerOpenChange}
            onMobileSettingModalOpenChange={handleMobileSettingModalOpenChange}
            getFundCardProps={getFundCardPropsForRow}
            masked={maskAmounts}
            onFundTagsClick={openFundTagsEdit}
            fundExtraDataByCode={fundExtraDataByCode}
          />
        )}

        {/* 卡片视图：使用 FundCard，默认紧凑折叠深层冗余长图表/表格以保证极速流畅 */}
        {viewMode === 'card' &&
          pagedCards.map((f) => (
            <div key={f.code} className="col-6" style={{ position: 'relative', overflow: 'hidden' }}>
              <FundCard
                fundCode={f.code}
                defaultCollapsedDeepDetails={true}
                isHoldingLinked={
                  (currentTab === 'all' || currentTab === 'fav') && linkedHoldingsForAllFav.linked?.has?.(f?.code)
                }
                todayStr={todayStr}
                currentTab={currentTab}
                favorites={favorites}
                dcaPlans={dcaPlansForTab}
                holdings={holdingsForTabWithLinked}
                percentModes={percentModes}
                todayPercentModes={todayPercentModes}
                fundDailyEarnings={currentFundDailyEarnings}
                valuationSeries={valuationSeries}
                collapsedCodes={collapsedCodes}
                collapsedTrends={collapsedTrends}
                collapsedValuationTrends={collapsedValuationTrends}
                collapsedEarnings={collapsedEarnings}
                transactions={transactionsForTab}
                theme={theme}
                isTradingDay={isTradingDay}
                getHoldingProfit={getHoldingProfitForTab}
                onToggleFavorite={toggleFavorite}
                onRemoveFund={handleRemoveFundEntry}
                onHoldingClick={openHoldingModal}
                onActionClick={openActionModal}
                onDataSourceClick={openDataSourceModal}
                onPercentModeToggle={togglePercentMode}
                onTodayPercentModeToggle={toggleTodayPercentMode}
                onToggleCollapse={toggleCollapse}
                onToggleTrendCollapse={toggleTrendCollapse}
                onToggleValuationTrendCollapse={toggleValuationTrendCollapse}
                onToggleEarningsCollapse={toggleEarningsCollapse}
                masked={maskAmounts}
                fundTags={isArray(fundTagListsByCode[f.code]) ? fundTagListsByCode[f.code] : []}
                onFundTagsClick={openFundTagsEdit}
                fundExtraData={fundExtraDataByCode?.[f.code]}
                groupTotalHoldingAmount={groupTotalHoldingAmount}
                hasDca={f.hasDca}
                hasPending={f.hasPending}
                userId={userId}
              />
            </div>
          ))}

        {/* 卡片视图底部统一样式分页栏 */}
        {viewMode === 'card' && totalCards > 0 && (
          <div className="col-12 mt-3" style={{ gridColumn: 'span 12' }}>
            <div className="p-3 rounded-xl bg-card/70 border border-border/80 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground backdrop-blur-xs">
              <div className="flex items-center gap-2">
                <span>
                  共 <strong className="font-semibold text-foreground">{totalCards}</strong> 支基金
                </span>
                <span className="text-border">|</span>
                <div className="flex items-center gap-1.5">
                  <span>每页</span>
                  <Input
                    key={cardPageSize}
                    defaultValue={cardPageSize}
                    type="number"
                    min={1}
                    className="w-14 h-7 text-[16PX] text-center px-1 font-mono text-xs rounded-md border-border/80 bg-background/50"
                    onBlur={(e) => {
                      let val = parseInt(e.target.value, 10);
                      if (isNaN(val) || val < 1) val = 12;
                      e.target.value = String(val);
                      if (val !== cardPageSize) {
                        setCardPageSize(val);
                        setCardPageIndex(0);
                        if (typeof window !== 'undefined') {
                          storageStore.setItem('fundCardPageSize', val);
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                  />
                  <span>条</span>
                </div>
              </div>

              {pageCount > 1 && (
                <div className="flex items-center justify-end">
                  <Pagination className="mx-0 w-auto">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (safePageIndex > 0) {
                              setCardPageIndex(safePageIndex - 1);
                              if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className={safePageIndex <= 0 ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: pageCount }, (_, i) => {
                        if (i === 0 || i === pageCount - 1 || (i >= safePageIndex - 1 && i <= safePageIndex + 1)) {
                          return (
                            <PaginationItem key={i}>
                              <PaginationLink
                                href="#"
                                isActive={safePageIndex === i}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCardPageIndex(i);
                                  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="cursor-pointer"
                              >
                                {i + 1}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                        if (i === safePageIndex - 2 || i === safePageIndex + 2) {
                          return (
                            <PaginationItem key={i}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (safePageIndex < pageCount - 1) {
                              setCardPageIndex(safePageIndex + 1);
                              if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className={
                            safePageIndex >= pageCount - 1 ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default FundListView;
