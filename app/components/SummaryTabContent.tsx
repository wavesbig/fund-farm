'use client';

import * as React from 'react';
import GroupSummary from './GroupSummary';
import GroupAccountSummaryCard, { type SparklinePoint } from './GroupAccountSummaryCard';
import { SUMMARY_TAB_ID, SUMMARY_SOURCE_GLOBAL } from '@/app/constants';
import type { Fund, FundGroup, Holding } from '@/types';

export interface SummaryCardItem {
  groupId: string;
  groupName: string;
  totalAsset: number;
  holdingReturn: number;
  holdingReturnPercent: number;
  accountReturn: number;
  accountReturnPercent: number;
  hasAnyTodayData: boolean;
  upCount: number;
  downCount: number;
  sparkSeries?: SparklinePoint[];
}

export interface SummaryTabContentProps {
  funds: Fund[];
  holdings: Record<string, Holding>;
  groups: FundGroup[];
  getProfit: (code: string, tabId: string) => any;
  summaryTabPortfolioTotals: any;
  navbarHeight: number;
  filterBarHeight: number;
  isGroupSummarySticky: boolean;
  setIsGroupSummarySticky: (next: boolean) => void;
  maskAmounts: boolean;
  setMaskAmounts: React.Dispatch<React.SetStateAction<boolean>> | ((val: (v: boolean) => boolean) => void);
  shouldShowMarketIndex: boolean;
  summaryCardItems: SummaryCardItem[];
  isMobile: boolean;
  startTransition: React.TransitionStartFunction;
  setCurrentTab: (tab: string) => void;
}

export default function SummaryTabContent({
  funds,
  holdings,
  groups,
  getProfit,
  summaryTabPortfolioTotals,
  navbarHeight,
  filterBarHeight,
  isGroupSummarySticky,
  setIsGroupSummarySticky,
  maskAmounts,
  setMaskAmounts,
  shouldShowMarketIndex,
  summaryCardItems,
  isMobile,
  startTransition,
  setCurrentTab
}: SummaryTabContentProps) {
  return (
    <>
      <GroupSummary
        funds={funds}
        holdings={holdings}
        portfolioTabId={SUMMARY_TAB_ID}
        groups={groups}
        getProfit={getProfit}
        summaryTotalsOverride={summaryTabPortfolioTotals}
        stickyTop={navbarHeight + filterBarHeight + (isMobile ? -14 : 0)}
        isSticky={isGroupSummarySticky}
        onToggleSticky={(next: boolean) => setIsGroupSummarySticky(next)}
        masked={maskAmounts}
        onToggleMasked={() => (setMaskAmounts as any)((v: boolean) => !v)}
        shouldShowMarketIndex={shouldShowMarketIndex}
        navbarHeight={navbarHeight}
      />
      {summaryCardItems.length > 0 && (
        <div
          className="grid"
          style={{
            marginTop: isGroupSummarySticky ? 50 : 10,
            gridColumn: 'span 12',
            gap: isMobile ? 10 : 16
          }}
        >
          {summaryCardItems.map((row) => (
            <div
              key={row.groupId}
              style={{
                minWidth: 0,
                gridColumn: isMobile ? 'span 12' : 'span 6'
              }}
            >
              <GroupAccountSummaryCard
                onActivate={() =>
                  startTransition(() => setCurrentTab(row.groupId === SUMMARY_SOURCE_GLOBAL ? 'all' : row.groupId))
                }
                groupName={row.groupName}
                totalAsset={row.totalAsset}
                holdingReturn={row.holdingReturn}
                holdingReturnPercent={row.holdingReturnPercent}
                accountReturn={row.accountReturn}
                accountReturnPercent={row.accountReturnPercent}
                hasAnyTodayData={row.hasAnyTodayData}
                upCount={row.upCount}
                downCount={row.downCount}
                sparkSeries={row.sparkSeries}
                masked={maskAmounts}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
