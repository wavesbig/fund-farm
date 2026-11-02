'use client';

import * as React from 'react';
import { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '../hooks/useIsMobile';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { useModalStore } from '../stores';

export interface AllSectorsModalProps {
  onClose: () => void;
}

interface SectorRecord {
  id?: string;
  sector_id?: string;
  sector_name?: string;
  sector_type?: string;
  change_pct?: number | string;
  net_inflow?: number;
  [key: string]: any;
}

export default function AllSectorsModal({ onClose }: AllSectorsModalProps) {
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);

  const initialFilter = useModalStore((s) => s.allSectorsFilter) || 'industry';
  const initialSort = useModalStore((s) => s.allSectorsSort) || 'change_pct';
  const initialSortOrder = useModalStore((s) => s.allSectorsSortOrder) || 'desc';

  const [sectorFilter, setSectorFilter] = useState<string>(initialFilter);
  const [sectorSort, setSectorSort] = useState<string>(initialSort);
  const [sectorSortOrder, setSectorSortOrder] = useState<'desc' | 'asc'>(initialSortOrder);

  const handleSortChange = (key: string) => {
    if (!key || sectorSort === key) {
      setSectorSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSectorSort(key);
      setSectorSortOrder('desc');
    }
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (v: string) => {
    if (v) {
      setSectorFilter(v);
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const { data: sectorEstimates } = useQuery<SectorRecord[]>({
    queryKey: ['hotSectors'],
    queryFn: async () => [],
    staleTime: 120000
  });

  const filteredAndSortedSectors = useMemo(() => {
    if (!sectorEstimates) return [];

    let result = sectorEstimates;
    if (sectorFilter !== 'all') {
      result = result.filter((s) => s.sector_type === sectorFilter);
    }

    result = [...result].sort((a, b) => {
      const valA = Number(a[sectorSort]) || 0;
      const valB = Number(b[sectorSort]) || 0;
      return sectorSortOrder === 'desc' ? valB - valA : valA - valB;
    });

    return result;
  }, [sectorEstimates, sectorFilter, sectorSort, sectorSortOrder]);

  const formatPercent = (val: any) => {
    if (val === undefined || val === null || val === '---' || val === '') return '--';
    const num = parseFloat(val);
    if (!Number.isFinite(num)) return '0.00%';
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  const getColorClass = (val: any) => {
    const num = parseFloat(val);
    if (!Number.isFinite(num) || num === 0) return 'text-foreground';
    return num > 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]';
  };

  const Content = (
    <div className="flex flex-col h-[60vh] sm:h-[70vh]">
      <div className="flex flex-col gap-3 p-4 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium shrink-0 text-foreground">板块类别</span>
          <ToggleGroup
            type="single"
            value={sectorFilter}
            onValueChange={handleFilterChange}
            className="bg-black/5 dark:bg-white/10 p-0.5 rounded-md border border-black/5 dark:border-white/5 gap-0 shadow-inner overflow-x-auto no-scrollbar"
          >
            <ToggleGroupItem
              value="industry"
              className="h-6 px-2.5 text-xs rounded-sm border-0 bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm transition-[background-color,color,box-shadow] duration-150 ease-out cursor-pointer whitespace-nowrap"
            >
              行业
            </ToggleGroupItem>
            <ToggleGroupItem
              value="concept"
              className="h-6 px-2.5 text-xs rounded-sm border-0 bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm transition-[background-color,color,box-shadow] duration-150 ease-out cursor-pointer whitespace-nowrap"
            >
              概念
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium shrink-0 text-foreground">排序类别</span>
          <ToggleGroup
            type="single"
            value={sectorSort}
            onValueChange={handleSortChange}
            className="bg-black/5 dark:bg-white/10 p-0.5 rounded-md border border-black/5 dark:border-white/5 gap-0 shadow-inner overflow-x-auto no-scrollbar"
          >
            <ToggleGroupItem
              value="change_pct"
              className="h-6 px-2.5 text-xs flex items-center gap-1 rounded-sm border-0 bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm transition-[background-color,color,box-shadow] duration-150 ease-out cursor-pointer whitespace-nowrap"
            >
              <span>按涨幅</span>
              <span className="inline-flex flex-col leading-none text-[8px] scale-80 origin-center opacity-60">
                <span
                  className={cn(sectorSort === 'change_pct' && sectorSortOrder === 'asc' && 'opacity-100 font-bold')}
                >
                  ▲
                </span>
                <span
                  className={cn(sectorSort === 'change_pct' && sectorSortOrder === 'desc' && 'opacity-100 font-bold')}
                >
                  ▼
                </span>
              </span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="net_inflow"
              className="h-6 px-2.5 text-xs flex items-center gap-1 rounded-sm border-0 bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm transition-[background-color,color,box-shadow] duration-150 ease-out cursor-pointer whitespace-nowrap"
            >
              <span>按资金流入</span>
              <span className="inline-flex flex-col leading-none text-[8px] scale-80 origin-center opacity-60">
                <span
                  className={cn(sectorSort === 'net_inflow' && sectorSortOrder === 'asc' && 'opacity-100 font-bold')}
                >
                  ▲
                </span>
                <span
                  className={cn(sectorSort === 'net_inflow' && sectorSortOrder === 'desc' && 'opacity-100 font-bold')}
                >
                  ▼
                </span>
              </span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-0 scrollbar-y-styled" ref={scrollRef}>
        {filteredAndSortedSectors.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">暂无数据</div>
        ) : (
          <div className="fund-history-table-wrapper border border-[var(--border)] rounded-xl bg-[var(--card)] mt-4 overflow-hidden">
            <table className="fund-history-table w-full border-collapse text-xs text-foreground">
              <thead>
                <tr className="border-b border-[var(--border)] bg-muted/40">
                  <th className="py-2.5 px-3 font-semibold text-left text-[var(--muted)] sticky top-0 bg-background/80 backdrop-blur-xs z-1">
                    板块名称
                  </th>
                  <th
                    className="py-2.5 px-3 font-semibold text-right text-[var(--muted)] sticky top-0 bg-background/80 backdrop-blur-xs z-1 cursor-pointer select-none"
                    onClick={() => handleSortChange('change_pct')}
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>涨跌幅</span>
                      <span className="inline-flex flex-col leading-none text-[8px] opacity-60">
                        <span
                          className={cn(
                            sectorSort === 'change_pct' && sectorSortOrder === 'asc' && 'opacity-100 font-bold'
                          )}
                        >
                          ▲
                        </span>
                        <span
                          className={cn(
                            sectorSort === 'change_pct' && sectorSortOrder === 'desc' && 'opacity-100 font-bold'
                          )}
                        >
                          ▼
                        </span>
                      </span>
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3 font-semibold text-right text-[var(--muted)] sticky top-0 bg-background/80 backdrop-blur-xs z-1 cursor-pointer select-none"
                    onClick={() => handleSortChange('net_inflow')}
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>资金流入</span>
                      <span className="inline-flex flex-col leading-none text-[8px] opacity-60">
                        <span
                          className={cn(
                            sectorSort === 'net_inflow' && sectorSortOrder === 'asc' && 'opacity-100 font-bold'
                          )}
                        >
                          ▲
                        </span>
                        <span
                          className={cn(
                            sectorSort === 'net_inflow' && sectorSortOrder === 'desc' && 'opacity-100 font-bold'
                          )}
                        >
                          ▼
                        </span>
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedSectors.map((sector) => {
                  const pctStr = sector.change_pct != null ? String(sector.change_pct) : '0.00';

                  return (
                    <tr
                      key={sector.id || sector.sector_id}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-2 px-3 font-medium truncate max-w-[150px] sm:max-w-none text-foreground">
                        {sector.sector_name}
                      </td>
                      <td className={cn('py-2 px-3 text-right font-semibold tabular-nums', getColorClass(pctStr))}>
                        {formatPercent(pctStr)}
                      </td>
                      <td className={cn('py-2 px-3 text-right tabular-nums', getColorClass(sector.net_inflow))}>
                        {sector.net_inflow ? (sector.net_inflow / 100000000).toFixed(2) + '亿' : '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={true} onOpenChange={(v) => !v && onClose()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="shrink-0 flex flex-row items-center justify-between gap-2 space-y-0 px-4 pb-3 pt-3 text-left border-b border-[var(--border)]">
            <DrawerTitle className="text-base font-semibold text-foreground">全部板块</DrawerTitle>
            <DrawerClose className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </DrawerClose>
          </DrawerHeader>
          {Content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={true} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <DialogHeader className="shrink-0 flex flex-row items-center justify-between gap-2 space-y-0 px-6 pb-4 pt-5 text-left border-b border-[var(--border)]">
          <DialogTitle className="text-base font-semibold text-foreground">全部板块</DialogTitle>
        </DialogHeader>
        {Content}
      </DialogContent>
    </Dialog>
  );
}
