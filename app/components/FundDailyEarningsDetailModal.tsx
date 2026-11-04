'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { isArray, isNumber } from 'lodash';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { X } from 'lucide-react';
import { useIsMobile } from '@/app/hooks/useIsMobile';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/utils';
import type { DailyEarningItem } from '@/types';

export interface FundDailyEarningsDetailModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  series?: DailyEarningItem[];
  title?: string;
  masked?: boolean;
}

function buildTableRows(series?: DailyEarningItem[]): DailyEarningItem[] {
  if (!isArray(series) || series.length === 0) return [];
  return [...series].reverse();
}

export default function FundDailyEarningsDetailModal({
  open,
  onOpenChange,
  series = [],
  title = '收益明细',
  masked = false
}: FundDailyEarningsDetailModalProps) {
  const isMobile = useIsMobile();
  const [visibleCount, setVisibleCount] = useState(30);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setVisibleCount(30);
  }, [open, series]);

  const data = useMemo(() => buildTableRows(series), [series]);

  const columns = useMemo<ColumnDef<DailyEarningItem>[]>(
    () => [
      {
        accessorKey: 'date',
        header: '日期',
        cell: (info) => (info.getValue() as string) || '—',
        meta: { align: 'left' }
      },
      {
        accessorKey: 'earnings',
        header: '收益',
        cell: (info) => {
          const v = info.getValue() as number | undefined;
          const isValid = isNumber(v) && Number.isFinite(v);
          if (masked) return '***';
          if (!isValid || v === undefined) return '—';
          const sign = v > 0 ? '+' : v < 0 ? '-' : '';
          const cls = v > 0 ? 'up' : v < 0 ? 'down' : '';
          return (
            <span className={cls}>
              {sign}
              {formatMoney(Math.abs(v))}
            </span>
          );
        },
        meta: { align: 'right' }
      },
      {
        accessorKey: 'rate',
        header: '收益率',
        cell: (info) => {
          const v = info.getValue() as number | undefined;
          const row = info.row?.original;
          const earnings = Number(row?.earnings);
          const baseCostAmount = Number(row?.baseCostAmount);
          const derivedRate =
            Number.isFinite(earnings) && Number.isFinite(baseCostAmount) && baseCostAmount > 0
              ? (earnings / baseCostAmount) * 100
              : null;
          const rateValue = v != null && Number.isFinite(v) ? v : derivedRate;
          if (masked) return '***';
          if (rateValue == null || !Number.isFinite(rateValue)) return '—';
          const sign = rateValue > 0 ? '+' : '';
          const cls = rateValue > 0 ? 'up' : rateValue < 0 ? 'down' : '';
          return (
            <span className={cls}>
              {sign}
              {rateValue.toFixed(2)}%
            </span>
          );
        },
        meta: { align: 'right' }
      }
    ],
    [masked]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  const rows = table.getRowModel().rows.slice(0, visibleCount);
  const hasMore = table.getRowModel().rows.length > visibleCount;

  const handleOpenChange = (next: boolean) => {
    if (!next) onOpenChange?.(false);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (!target || !hasMore) return;
    const distance = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (distance < 40) {
      setVisibleCount((prev) => {
        const next = prev + 30;
        const total = table.getRowModel().rows.length;
        return next > total ? total : next;
      });
    }
  };

  const header = (
    <div className="title" style={{ marginBottom: 12, justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{title}</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-[var(--muted)] hover:text-[var(--text)]"
        onClick={() => onOpenChange?.(false)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );

  const body = (
    <div
      ref={scrollRef}
      className="scrollbar-y-styled"
      style={{
        maxHeight: '60vh',
        overflowY: 'auto',
        paddingRight: 4
      }}
      onScroll={handleScroll}
    >
      {data.length === 0 && (
        <div style={{ padding: '16px 0', textAlign: 'center' }}>
          <span className="muted" style={{ fontSize: 13 }}>
            暂无数据
          </span>
        </div>
      )}
      {data.length > 0 && (
        <div
          className="fund-history-table-wrapper"
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            background: 'var(--card)'
          }}
        >
          <table
            className="fund-history-table"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
              color: 'var(--text)'
            }}
          >
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr
                  key={hg.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--table-row-alt-bg)',
                    boxShadow: '0 1px 0 0 var(--border)'
                  }}
                >
                  {hg.headers.map((h, index) => {
                    const align = (h.column.columnDef.meta as { align?: string } | undefined)?.align || 'left';
                    return (
                      <th
                        key={h.id}
                        style={{
                          padding: '8px 12px',
                          fontWeight: 600,
                          color: 'var(--muted)',
                          textAlign: align as any,
                          background: 'var(--table-row-alt-bg)',
                          position: 'sticky',
                          top: 0,
                          zIndex: 1,
                          borderTopLeftRadius: index === 0 ? 'var(--radius)' : undefined,
                          borderTopRightRadius: index === hg.headers.length - 1 ? 'var(--radius)' : undefined
                        }}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: '1px solid var(--border)'
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const align = (cell.column.columnDef.meta as { align?: string } | undefined)?.align || 'left';
                    return (
                      <td
                        key={cell.id}
                        style={{
                          padding: '8px 12px',
                          color: 'var(--text)',
                          textAlign: align as any,
                          fontVariantNumeric: 'tabular-nums'
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data.length > 0 && hasMore && (
        <div style={{ padding: '12px 0', textAlign: 'center' }}>
          <span className="muted" style={{ fontSize: 13 }}>
            向下滚动以加载更多...
          </span>
        </div>
      )}
    </div>
  );

  if (!open) return null;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange} direction="bottom">
        <DrawerContent className="glass" defaultHeight="70vh" minHeight="40vh" maxHeight="90vh">
          <DrawerHeader className="flex flex-row items-center justify-between gap-2 py-3">
            <DrawerTitle className="flex items-center gap-2.5 text-left">
              <span>{title}</span>
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-[var(--muted)] hover:text-[var(--text)]">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="flex-1 px-4 pb-4">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="glass card modal"
        overlayClassName="modal-overlay"
        overlayStyle={{ zIndex: 9998 }}
        style={{
          maxWidth: '520px',
          width: '90vw',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9999
        }}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {header}
        {body}
      </DialogContent>
    </Dialog>
  );
}
