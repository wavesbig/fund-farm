'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, TrendingUp, BarChart3, Activity, CheckCircle, PlusCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from '@tanstack/react-table';
import { fetchFundValuationRanking, fetchFundPeriodReturns } from '../api/fund';
import { cn } from '@/lib/utils';
import { useStorageStore, useModalStore } from '../stores';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '../hooks/useIsMobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MobileFundCardDrawer from './MobileFundCardDrawer';
import FundCard from './FundCard';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';

interface FundDetailDialogProps {
  cardDialogRow: any;
  getFundCardProps: (row: any) => any;
  setCardDialogRow: (row: any) => void;
}

function FundDetailDialog({ cardDialogRow, getFundCardProps, setCardDialogRow }: FundDetailDialogProps) {
  const isAnySubModalOpen = useModalStore(
    (s) =>
      s.dataSourceModal.open ||
      s.tradeModal.open ||
      s.holdingModal.open ||
      s.dcaModal.open ||
      s.dividendMethodModal.open ||
      s.convertModal.open ||
      s.fundTagsEdit.open ||
      s.historyModal.open ||
      s.actionModal.open ||
      s.selectHoldingGroupModal.open ||
      s.addHistoryModal.open
  );

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isAnySubModalOpen) setCardDialogRow(null);
      }}
    >
      <DialogContent
        className="sm:max-w-2xl max-h-[88vh] flex flex-col p-0 overflow-hidden"
        onPointerDownOutside={(e) => {
          if (isAnySubModalOpen) e.preventDefault();
        }}
      >
        <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between gap-2 space-y-0 px-6 pb-4 pt-6 text-left border-b border-[var(--border)]">
          <DialogTitle className="text-base font-semibold text-[var(--text)]">基金详情</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 scrollbar-y-styled">
          {cardDialogRow && getFundCardProps ? (
            <FundCard {...getFundCardProps(cardDialogRow)} layoutMode="drawer" />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export interface MarketTabProps {
  onAddFund?: (fund: { code: string; name: string }) => void;
  getFundCardProps?: (row: any) => any;
  isActive?: boolean;
}

export default function MarketTab({ onAddFund, getFundCardProps, isActive }: MarketTabProps) {
  const [detailFund, setDetailFund] = useState<any>(null);
  const [detailFundExtra, setDetailFundExtra] = useState<any>(null);
  const [pageIndex, setPageIndex] = useState(1);

  useEffect(() => {
    if (detailFund) {
      setDetailFundExtra(null);
      fetchFundPeriodReturns(detailFund.bzdm)
        .then((data) => {
          setDetailFundExtra(data);
        })
        .catch(() => {});
    }
  }, [detailFund]);

  const [activeTab, setActiveTab] = useState<'increase' | 'decrease' | 'hot' | 'actual'>('increase');
  const [sectorFilter, setSectorFilter] = useState<'industry' | 'concept' | 'all'>('industry');
  const [sectorSort, setSectorSort] = useState<'change_pct' | 'net_inflow'>('change_pct');
  const [sectorSortOrder, setSectorSortOrder] = useState<'desc' | 'asc'>('desc');
  const isMobile = useIsMobile();

  const funds = useStorageStore((s) => s.funds);

  // Queries for Hot Sectors
  const { data: sectorEstimates, isLoading: sectorsLoading } = useQuery({
    queryKey: ['hotSectors'],
    queryFn: async () => [],
    enabled: Boolean(isActive),
    staleTime: 120000
  });

  const filteredAndSortedSectors = useMemo(() => {
    if (!sectorEstimates) return [];

    let result = sectorEstimates as any[];
    if (sectorFilter !== 'all') {
      result = result.filter((s) => s.sector_type === sectorFilter);
    }

    result = [...result].sort((a, b) => {
      const valA = a[sectorSort] || 0;
      const valB = b[sectorSort] || 0;
      return sectorSortOrder === 'desc' ? valB - valA : valA - valB;
    });

    return result.slice(0, isMobile ? 4 : 10);
  }, [sectorEstimates, sectorFilter, sectorSort, sectorSortOrder, isMobile]);

  // Query for Valuation Ranking
  const { data: rankingData, isLoading: rankingLoading } = useQuery({
    queryKey: ['valuationRanking', activeTab, pageIndex],
    queryFn: async () => {
      let sort = 3;
      let order = 'desc';

      if (activeTab === 'decrease') {
        sort = 3;
        order = 'asc';
      } else if (activeTab === 'hot') {
        sort = 4;
        order = 'desc';
      } else if (activeTab === 'actual') {
        sort = 5;
        order = 'desc';
      }

      const res = await fetchFundValuationRanking(sort, order, pageIndex, 20);
      return res?.Data?.list || [];
    },
    enabled: Boolean(isActive),
    staleTime: 120000
  });

  const formatPercent = (val: any) => {
    if (val === undefined || val === null || val === '---' || val === '') return '--';
    const num = parseFloat(val);
    if (!Number.isFinite(num)) return '0.00%';
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  const getColorClass = (val: any) => {
    const num = parseFloat(val);
    if (!Number.isFinite(num) || num === 0) return 'text-[var(--foreground)]';
    return num > 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]';
  };

  const rankingTableColumns = useMemo<ColumnDef<any>[]>(() => {
    const columns: ColumnDef<any>[] = [
      {
        accessorKey: 'bzdm',
        header: '基金名称',
        meta: { align: 'text-left', flex: 2 },
        cell: (info) => {
          const fund = info.row.original;
          const isAdded = funds?.some?.((f) => f.code === fund.bzdm);
          return (
            <div className="w-full">
              <div className="flex items-start gap-1.5 mb-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isAdded && onAddFund) {
                          onAddFund({ code: fund.bzdm, name: fund.jjjc });
                        }
                      }}
                      className={cn(
                        'focus:outline-none flex-shrink-0 mt-[2px]',
                        isAdded
                          ? 'text-[var(--success)] cursor-default'
                          : 'text-muted-foreground opacity-50 hover:opacity-100 hover:text-primary transition-colors cursor-pointer'
                      )}
                      disabled={isAdded}
                    >
                      {isAdded ? <CheckCircle size={16} /> : <PlusCircle size={16} />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isAdded ? '已添加' : '添加'}</p>
                  </TooltipContent>
                </Tooltip>
                <span
                  className="font-medium text-sm sm:text-base whitespace-normal break-all leading-snug cursor-pointer hover:text-primary transition-colors"
                  onClick={() => setDetailFund(fund)}
                >
                  {fund.jjjc}
                </span>
              </div>
              <div className="flex items-center gap-2 pl-5">
                <span className="text-xs text-muted-foreground font-mono">#{fund.bzdm}</span>
                {fund.FType && (
                  <span className="fund-tag text-xs px-1.5 py-0.5 rounded-sm opacity-75 border border-current">
                    {fund.FType.split('-')[0]}
                  </span>
                )}
              </div>
            </div>
          );
        }
      },
      {
        accessorKey: 'jzzzl',
        header: '最新涨幅',
        meta: { align: 'text-right', flex: 1 },
        cell: (info) => {
          const fund = info.row.original;
          return (
            <div className="flex flex-col items-end justify-center w-full">
              <span className={cn('text-sm sm:text-base font-semibold', getColorClass(fund.jzzzl))}>
                {formatPercent(fund.jzzzl)}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">{fund.gxrq?.slice(5)}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'gszzl',
        header: '估算涨幅',
        meta: { align: 'text-right', flex: 1 },
        cell: (info) => {
          const fund = info.row.original;
          return (
            <div className="flex flex-col items-end justify-center w-full">
              <span className={cn('text-sm sm:text-base font-bold', getColorClass(fund.gszzl))}>
                {formatPercent(fund.gszzl)}
              </span>
            </div>
          );
        }
      }
    ];

    return columns;
  }, [funds, onAddFund]);

  const rankingTable = useReactTable({
    data: rankingData || [],
    columns: rankingTableColumns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="market-tab-container flex flex-col min-h-[60vh]">
      {/* 热门板块 */}
      {(sectorsLoading || (sectorEstimates && (sectorEstimates as any[]).length > 0)) && (
        <div className="market-section">
          <div className="market-section-header">
            <div className="flex items-center gap-2 sm:gap-3">
              <h2 className="market-section-title whitespace-nowrap flex-shrink-0">热门板块</h2>
              <ToggleGroup
                type="single"
                value={sectorFilter}
                onValueChange={(v) => v && setSectorFilter(v as any)}
                className="bg-black/5 dark:bg-white/10 p-0.5 rounded-md border border-black/5 dark:border-white/5 gap-0 shadow-inner"
              >
                <ToggleGroupItem
                  value="industry"
                  className="h-7 px-2.5 text-xs rounded-sm border-0 bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm transition-all cursor-pointer"
                >
                  行业
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="concept"
                  className="h-7 px-2.5 text-xs rounded-sm border-0 bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm transition-all cursor-pointer"
                >
                  概念
                </ToggleGroupItem>
              </ToggleGroup>

              <ToggleGroup
                type="single"
                value={sectorSort}
                onValueChange={(v) => {
                  if (!v) {
                    setSectorSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                  } else {
                    setSectorSort(v as any);
                    setSectorSortOrder('desc');
                  }
                }}
                className="bg-black/5 dark:bg-white/10 p-0.5 rounded-md border border-black/5 dark:border-white/5 gap-0 shadow-inner"
              >
                <ToggleGroupItem
                  value="change_pct"
                  className="h-7 px-2.5 text-xs flex items-center gap-0.5 rounded-sm border-0 bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm transition-all cursor-pointer"
                >
                  按涨幅
                  <span
                    style={{
                      display: 'inline-flex',
                      flexDirection: 'column',
                      lineHeight: 1,
                      fontSize: '9px',
                      transform: 'scale(0.85)',
                      transformOrigin: 'center',
                      opacity: sectorSort === 'change_pct' ? 1 : 0.3
                    }}
                  >
                    <span style={{ opacity: sectorSort === 'change_pct' && sectorSortOrder === 'asc' ? 1 : 0.3 }}>
                      ▲
                    </span>
                    <span style={{ opacity: sectorSort === 'change_pct' && sectorSortOrder === 'desc' ? 1 : 0.3 }}>
                      ▼
                    </span>
                  </span>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="net_inflow"
                  className="h-7 px-2.5 text-xs flex items-center gap-0.5 rounded-sm border-0 bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm transition-all cursor-pointer"
                >
                  按资金流入
                  <span
                    style={{
                      display: 'inline-flex',
                      flexDirection: 'column',
                      lineHeight: 1,
                      fontSize: '9px',
                      transform: 'scale(0.85)',
                      transformOrigin: 'center',
                      opacity: sectorSort === 'net_inflow' ? 1 : 0.3
                    }}
                  >
                    <span style={{ opacity: sectorSort === 'net_inflow' && sectorSortOrder === 'asc' ? 1 : 0.3 }}>
                      ▲
                    </span>
                    <span style={{ opacity: sectorSort === 'net_inflow' && sectorSortOrder === 'desc' ? 1 : 0.3 }}>
                      ▼
                    </span>
                  </span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <button
              type="button"
              className="market-section-more"
              onClick={() =>
                useModalStore.setState({
                  allSectorsModalOpen: true,
                  allSectorsFilter: sectorFilter,
                  allSectorsSort: sectorSort,
                  allSectorsSortOrder: sectorSortOrder
                })
              }
            >
              全部 <ChevronRight size={14} />
            </button>
          </div>

          <div className="market-sector-grid">
            {sectorsLoading
              ? Array.from({ length: isMobile ? 4 : 10 }).map((_, i) => (
                  <div key={`skeleton-sector-${i}`} className="market-sector-card glass">
                    <div className="market-sector-main items-center mt-0.5">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="market-sector-leader flex items-center mt-1 h-[18px]">
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))
              : filteredAndSortedSectors?.map((sector: any) => {
                  const pctStr = sector.change_pct != null ? String(sector.change_pct) : '0.00';

                  return (
                    <div key={sector.id || sector.sector_id} className="market-sector-card glass">
                      <div className="market-sector-main">
                        <span className="market-sector-name">{sector.sector_name}</span>
                        {sectorSort === 'change_pct' ? (
                          <span className={cn('market-sector-pct', getColorClass(pctStr))}>
                            {formatPercent(pctStr)}
                          </span>
                        ) : (
                          <span className={cn('market-sector-pct', getColorClass(sector.net_inflow))}>
                            {sector.net_inflow ? (sector.net_inflow / 100000000).toFixed(2) + '亿' : '--'}
                          </span>
                        )}
                      </div>
                      <div className="market-sector-leader">
                        {sectorSort === 'change_pct' ? (
                          <>资金流入: {sector.net_inflow ? (sector.net_inflow / 100000000).toFixed(2) + '亿' : '--'}</>
                        ) : (
                          <>
                            涨跌幅: <span className={getColorClass(pctStr)}>{formatPercent(pctStr)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      )}

      {/* 榜单栏 */}
      <div className="market-ranking-section glass" id="market-ranking-section">
        <div className="market-ranking-tabs" style={{ padding: '8px 12px' }}>
          <div className="tabs-container">
            <div className="tabs-scroll-area">
              <div className="tabs">
                <button
                  type="button"
                  key="increase"
                  className={cn('tab', activeTab === 'increase' && 'active')}
                  onClick={() => {
                    setActiveTab('increase');
                    setPageIndex(1);
                  }}
                >
                  估值涨幅
                </button>
                <button
                  type="button"
                  key="decrease"
                  className={cn('tab', activeTab === 'decrease' && 'active')}
                  onClick={() => {
                    setActiveTab('decrease');
                    setPageIndex(1);
                  }}
                >
                  估值跌幅
                </button>
                <button
                  type="button"
                  key="hot"
                  className={cn('tab', activeTab === 'hot' && 'active')}
                  onClick={() => {
                    setActiveTab('hot');
                    setPageIndex(1);
                  }}
                >
                  成交热度
                </button>
                <button
                  type="button"
                  key="actual"
                  className={cn('tab', activeTab === 'actual' && 'active')}
                  onClick={() => {
                    setActiveTab('actual');
                    setPageIndex(1);
                  }}
                >
                  实际涨幅
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pc-fund-table" style={{ width: '100%', overflow: 'hidden' }}>
          <style>{`
                .market-ranking-table-row {
                  display: flex !important;
                  width: 100%;
                  gap: 0 !important;
                  padding: 12px 16px !important;
                  --row-bg: var(--bg);
                  background-color: var(--row-bg) !important;
                  transition: background-color 0.15s ease;
                  cursor: default;
                  border-bottom: none !important;
                }
                @media (min-width: 640px) {
                  .market-ranking-table-row:hover,
                  .market-ranking-table-row.row-even:hover {
                    --row-bg: var(--table-row-hover-bg);
                    background-color: var(--table-row-hover-bg) !important;
                  }
                }
                .market-ranking-table-row:nth-child(even),
                .market-ranking-table-row.row-even {
                  background-color: var(--table-row-alt-bg) !important;
                }
                .market-ranking-table-header {
                  display: flex !important;
                  width: 100%;
                  gap: 0 !important;
                  padding: 12px 16px !important;
                  background: rgba(255, 255, 255, 0.05);
                  border-bottom: 1px solid var(--border);
                }
                [data-theme="light"] .market-ranking-table-header {
                  background: rgba(0, 0, 0, 0.04) !important;
                }
              `}</style>

          {rankingTable.getHeaderGroups().map((hg) => (
            <div key={hg.id} className="table-header-row market-ranking-table-header">
              {hg.headers.map((header) => {
                const meta = header.column.columnDef.meta as { align?: string; flex?: number } | undefined;
                const align = meta?.align || 'text-center';
                const flex = meta?.flex || 1;
                const isRight = align === 'text-right';

                return (
                  <div
                    key={header.id}
                    className={`table-header-cell ${align}`}
                    style={{
                      flex,
                      padding: '0 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isRight ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: '0.5px'
                      }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          <div className="market-ranking-list">
            {rankingLoading ? (
              Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={`skeleton-ranking-${index}`}
                  className={`table-row market-ranking-table-row ${index % 2 === 1 ? 'row-even' : ''}`}
                >
                  <div
                    className="table-cell text-left"
                    style={{ flex: 2, padding: '0 8px', display: 'flex', alignItems: 'center' }}
                  >
                    <div className="w-full">
                      <div className="flex items-center gap-1.5 mb-1.5 mt-0.5">
                        <Skeleton className="size-4 rounded-full flex-shrink-0" />
                        <Skeleton className="h-[18px] w-28 sm:w-40" />
                      </div>
                      <div className="flex items-center gap-2 pl-5">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-[14px] w-8" />
                      </div>
                    </div>
                  </div>
                  <div
                    className="table-cell text-right"
                    style={{
                      flex: 1,
                      padding: '0 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <Skeleton className="h-[18px] w-14 sm:w-16" />
                    <Skeleton className="h-3 w-10 sm:w-12" />
                  </div>
                  <div
                    className="table-cell text-right"
                    style={{
                      flex: 1,
                      padding: '0 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      justifyContent: 'center'
                    }}
                  >
                    <Skeleton className="h-[18px] w-14 sm:w-16" />
                  </div>
                </div>
              ))
            ) : rankingTable.getRowModel().rows.length > 0 ? (
              rankingTable.getRowModel().rows.map((row, index) => (
                <div key={row.id} className={`table-row market-ranking-table-row ${index % 2 === 1 ? 'row-even' : ''}`}>
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as { align?: string; flex?: number } | undefined;
                    const align = meta?.align || 'text-center';
                    const flex = meta?.flex || 1;
                    const isRight = align === 'text-right';

                    return (
                      <div
                        key={cell.id}
                        className={`table-cell ${align}`}
                        style={{
                          flex,
                          padding: '0 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isRight ? 'flex-end' : 'flex-start'
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm opacity-50">暂无数据</div>
            )}
          </div>

          <div className="py-5 flex justify-end border-t border-[var(--border)] pr-4">
            <Pagination className="justify-end w-auto mx-0">
              <PaginationContent>
                {[1, 2, 3, 4, 5].map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      onClick={(e) => {
                        e.preventDefault();
                        if (pageIndex !== p) {
                          setPageIndex(p);
                          setTimeout(() => {
                            const el = document.getElementById('market-ranking-section');
                            if (el) {
                              const navbar = document.querySelector('.navbar');
                              const navHeight = navbar ? navbar.getBoundingClientRect().height : 68;

                              const indexAccordion = document.querySelector('.market-index-accordion-root');
                              const indexHeight = indexAccordion ? indexAccordion.getBoundingClientRect().height : 0;

                              const offset = navHeight + indexHeight + 16;
                              const y = el.getBoundingClientRect().top + window.scrollY - offset;
                              window.scrollTo({ top: y, behavior: 'smooth' });
                            }
                          }, 10);
                        }
                      }}
                      isActive={pageIndex === p}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>

      {(() => {
        const mappedFund = detailFund
          ? {
              code: detailFund.bzdm,
              name: detailFund.jjjc,
              dwjz: detailFund.dwjz === '---' || !detailFund.dwjz ? null : detailFund.dwjz,
              gsz: detailFund.gsz === '---' || !detailFund.gsz ? null : detailFund.gsz,
              gszzl: !isNaN(parseFloat(detailFund.gszzl)) ? parseFloat(detailFund.gszzl) : null,
              gztime: detailFund.gztime || null,
              jzrq: detailFund.gxrq || detailFund.jzrq || null,
              zzl: !isNaN(parseFloat(detailFund.jzzzl)) ? parseFloat(detailFund.jzzzl) : null,
              fundExtraData: detailFundExtra
            }
          : null;

        const detailCardProps = mappedFund && getFundCardProps ? getFundCardProps({ rawFund: mappedFund }) : null;

        return (
          detailFund &&
          detailCardProps &&
          (isMobile ? (
            <MobileFundCardDrawer
              open={Boolean(detailFund)}
              onOpenChange={(open) => !open && setDetailFund(null)}
              getFundCardProps={() => detailCardProps}
              cardSheetRow={mappedFund}
            />
          ) : (
            <FundDetailDialog
              cardDialogRow={mappedFund}
              getFundCardProps={() => detailCardProps}
              setCardDialogRow={(row) => setDetailFund(row)}
            />
          ))
        );
      })()}
    </div>
  );
}
