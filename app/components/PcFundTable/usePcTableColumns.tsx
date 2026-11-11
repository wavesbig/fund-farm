'use client';

import React, { useMemo } from 'react';
import { isString } from 'lodash';
import type { ColumnDef } from '@tanstack/react-table';
import { Sparkles, Settings2, Trash2, SlidersHorizontal, ListChecks } from 'lucide-react';
import { useModalStore } from '@/app/stores';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import DataSourceAccuracyBadge from '../DataSourceAccuracyBadge';
import BatchRemoveHeader from './BatchRemoveHeader';
import FundNameCell from './FundNameCell';

export interface UsePcTableColumnsOptions {
  currentTab?: string;
  isGroupTab?: boolean;
  showFullFundName: boolean;
  getFundCardProps?: (row: any) => any;
  handleOpenCardDialog: (row: any) => void;
  masked?: boolean;
  relatedSectorByCode: Record<string, string>;
  sectorQuoteByLabel: Record<string, any>;
  periodReturnsByCode: Record<string, any>;
  dataSourceAccuracyLabels: Record<string, string>;
  batchRemoveEnabled: boolean;
  batchSelectableCount: number;
  selectedCount: number;
  selectedCodes: Set<string>;
  onRemoveFunds?: (codes: string[]) => boolean | void;
  onMoveFunds?: (payload: any) => Promise<any> | void;
  setAllSelected: (checked: boolean) => void;
  setSelectedCodes: React.Dispatch<React.SetStateAction<Set<string>>>;
  setIsEditMode: (val: boolean) => void;
  setMoveGroupOpen: (val: boolean) => void;
  setSettingModalOpen: (val: boolean) => void;
  onFundTagsClick?: (row: any) => void;
  isEditMode: boolean;
  toggleSelected: (code: string, checked: boolean) => void;
  favorites?: Set<string>;
  sortBy?: string;
  onToggleFavoriteRef: React.MutableRefObject<any>;
  onFundTagsClickRef: React.MutableRefObject<any>;
  onRemoveFundRef: React.MutableRefObject<any>;
  onHoldingAmountClickRef: React.MutableRefObject<any>;
  fundExtraDataByCode?: Record<string, any>;
}

export function usePcTableColumns(options: UsePcTableColumnsOptions): ColumnDef<any, any>[] {
  const {
    currentTab,
    isGroupTab,
    showFullFundName,
    getFundCardProps,
    handleOpenCardDialog,
    masked,
    relatedSectorByCode,
    sectorQuoteByLabel,
    periodReturnsByCode,
    dataSourceAccuracyLabels,
    batchRemoveEnabled,
    batchSelectableCount,
    selectedCount,
    selectedCodes,
    onRemoveFunds,
    onMoveFunds,
    setAllSelected,
    setSelectedCodes,
    setIsEditMode,
    setMoveGroupOpen,
    setSettingModalOpen,
    onFundTagsClick,
    isEditMode,
    toggleSelected,
    favorites,
    sortBy,
    onToggleFavoriteRef,
    onFundTagsClickRef,
    onRemoveFundRef,
    onHoldingAmountClickRef,
    fundExtraDataByCode
  } = options;

  return useMemo<ColumnDef<any, any>[]>(
    () => [
      {
        accessorKey: 'fundName',
        header: () => {
          if (!batchRemoveEnabled) return '基金名称';
          if (isEditMode) {
            const allCount = batchSelectableCount;
            const checked = allCount > 0 && selectedCount === allCount;
            const indeterminate = selectedCount > 0 && selectedCount < allCount;
            return (
              <BatchRemoveHeader
                checked={checked}
                indeterminate={indeterminate}
                selectedCount={selectedCount}
                totalCount={allCount}
                onToggleAll={(nextChecked) => setAllSelected(nextChecked)}
                onClear={() => setSelectedCodes(new Set())}
                onRemove={() => {
                  if (!onRemoveFunds || selectedCount === 0) return;
                  const codes = Array.from(selectedCodes);
                  const shouldClear = onRemoveFunds(codes);
                  if (shouldClear !== false) {
                    setSelectedCodes(new Set());
                    setIsEditMode(false);
                  }
                }}
                onMove={() => {
                  if (!onMoveFunds || selectedCount === 0) return;
                  setMoveGroupOpen(true);
                }}
                onClose={() => {
                  setIsEditMode(false);
                  setSelectedCodes(new Set());
                }}
                disabled={selectedCount === 0}
              />
            );
          }
          return (
            <div className="inline-flex items-center gap-1.5">
              <span>基金名称</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center size-6 rounded text-muted-foreground/70 hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation?.();
                      setIsEditMode(true);
                    }}
                    aria-label="批量管理"
                  >
                    <ListChecks className="size-3.5" strokeWidth={1.8} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>批量管理与操作</TooltipContent>
              </Tooltip>
            </div>
          );
        },
        size: 300,
        minSize: 280,
        enablePinning: true,
        cell: (info) => (
          <FundNameCell
            info={info}
            showFullFundName={showFullFundName}
            onOpenCardDialog={getFundCardProps ? handleOpenCardDialog : undefined}
            favorites={favorites}
            isGroupTab={isGroupTab}
            currentTab={currentTab}
            batchRemoveEnabled={batchRemoveEnabled}
            sortBy={sortBy}
            onToggleFavoriteRef={onToggleFavoriteRef}
            onFundTagsClickRef={onFundTagsClickRef}
            canEditFundTags={!!onFundTagsClick}
            fundExtraDataByCode={fundExtraDataByCode}
          />
        ),
        meta: {
          align: 'left',
          cellClassName: 'name-cell'
        }
      },
      {
        id: 'dataSource',
        header: '数据源',
        size: 90,
        minSize: 80,
        cell: (info) => {
          const original = info.row.original || {};
          const autoSource = !!original.rawFund?.autoSource;
          const dataSource = original.rawFund?.dataSource || 1;
          const text = autoSource ? `自动源${dataSource}` : `数据源${dataSource}`;
          const accuracyLabel = dataSourceAccuracyLabels?.[original.rawFund?.code || original.code];
          return (
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Badge
                variant="outline"
                className={cn(
                  'font-normal text-xs cursor-pointer hover:border-primary/50 transition-colors',
                  autoSource ? 'border-primary/30 text-primary bg-primary/5' : 'text-muted-foreground border-border'
                )}
                style={autoSource ? { gap: '2px' } : {}}
                onClick={(e) => {
                  e.stopPropagation();
                  useModalStore.setState({ dataSourceModal: { open: true, fund: original.rawFund } });
                }}
              >
                {autoSource && <Sparkles size={10} style={{ opacity: 0.8 }} />}
                {text}
              </Badge>
              <DataSourceAccuracyBadge label={accuracyLabel} />
            </div>
          );
        },
        meta: {
          align: 'center'
        }
      },
      {
        id: 'relatedSector',
        header: '关联板块',
        size: 180,
        minSize: 120,
        cell: (info) => {
          const original = info.row.original || {};
          const code = original.code;
          const value = (code && relatedSectorByCode?.[code]) || '';
          const display = value || '—';
          const labelKey = value ? String(value).trim() : '';
          const quote = labelKey ? sectorQuoteByLabel?.[labelKey] : null;
          const nameFromQuote = quote?.name != null ? String(quote.name).trim() : '';
          const firstLine = nameFromQuote || display;
          const pct = quote?.pct;
          const pctText = pct != null ? `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%` : null;
          const pctCls = pct != null ? (pct > 0 ? 'up' : pct < 0 ? 'down' : '') : '';
          return (
            <div
              style={{
                width: '100%',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 2
              }}
            >
              {pctText != null ? (
                <span
                  className={pctCls}
                  style={{
                    fontWeight: 700,
                    textAlign: 'right',
                    fontSize: 'clamp(16px, 1.35vw, 18.5px)',
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {pctText}
                </span>
              ) : null}
              <span
                style={{
                  display: 'block',
                  width: '100%',
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'right',
                  fontSize: pctText != null ? '13px' : '15.5px'
                }}
              >
                {firstLine}
              </span>
            </div>
          );
        },
        meta: {
          align: 'right',
          cellClassName: 'related-sector-cell'
        }
      },
      {
        id: 'period1w',
        header: '近1周',
        size: 88,
        minSize: 72,
        cell: (info) => {
          const original = info.row.original || {};
          const code = original.code;
          const value = code ? periodReturnsByCode[code]?.week : null;
          const cls = value > 0 ? 'up' : value < 0 ? 'down' : '';
          const text = value != null && Number.isFinite(value) ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%` : '—';
          return (
            <div style={{ textAlign: 'right' }}>
              <div
                className={cls}
                style={{
                  fontWeight: 700,
                  fontSize: 'clamp(16px, 1.35vw, 18.5px)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {text}
              </div>
            </div>
          );
        },
        meta: { align: 'right', cellClassName: 'period-return-cell' }
      },
      {
        id: 'period1m',
        header: '近1月',
        size: 88,
        minSize: 72,
        cell: (info) => {
          const original = info.row.original || {};
          const code = original.code;
          const value = code ? periodReturnsByCode[code]?.month : null;
          const cls = value > 0 ? 'up' : value < 0 ? 'down' : '';
          const text = value != null && Number.isFinite(value) ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%` : '—';
          return (
            <div style={{ textAlign: 'right' }}>
              <div
                className={cls}
                style={{
                  fontWeight: 700,
                  fontSize: 'clamp(16px, 1.35vw, 18.5px)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {text}
              </div>
            </div>
          );
        },
        meta: { align: 'right', cellClassName: 'period-return-cell' }
      },
      {
        id: 'period3m',
        header: '近3月',
        size: 88,
        minSize: 72,
        cell: (info) => {
          const original = info.row.original || {};
          const code = original.code;
          const value = code ? periodReturnsByCode[code]?.month3 : null;
          const cls = value > 0 ? 'up' : value < 0 ? 'down' : '';
          const text = value != null && Number.isFinite(value) ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%` : '—';
          return (
            <div style={{ textAlign: 'right' }}>
              <div
                className={cls}
                style={{
                  fontWeight: 700,
                  fontSize: 'clamp(16px, 1.35vw, 18.5px)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {text}
              </div>
            </div>
          );
        },
        meta: { align: 'right', cellClassName: 'period-return-cell' }
      },
      {
        id: 'period6m',
        header: '近6月',
        size: 88,
        minSize: 72,
        cell: (info) => {
          const original = info.row.original || {};
          const code = original.code;
          const value = code ? periodReturnsByCode[code]?.month6 : null;
          const cls = value > 0 ? 'up' : value < 0 ? 'down' : '';
          const text = value != null && Number.isFinite(value) ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%` : '—';
          return (
            <div style={{ textAlign: 'right' }}>
              <div
                className={cls}
                style={{
                  fontWeight: 700,
                  fontSize: 'clamp(16px, 1.35vw, 18.5px)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {text}
              </div>
            </div>
          );
        },
        meta: { align: 'right', cellClassName: 'period-return-cell' }
      },
      {
        id: 'period1y',
        header: '近1年',
        size: 88,
        minSize: 72,
        cell: (info) => {
          const original = info.row.original || {};
          const code = original.code;
          const value = code ? periodReturnsByCode[code]?.year1 : null;
          const cls = value > 0 ? 'up' : value < 0 ? 'down' : '';
          const text = value != null && Number.isFinite(value) ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%` : '—';
          return (
            <div style={{ textAlign: 'right' }}>
              <div
                className={cls}
                style={{
                  fontWeight: 700,
                  fontSize: 'clamp(16px, 1.35vw, 18.5px)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {text}
              </div>
            </div>
          );
        },
        meta: { align: 'right', cellClassName: 'period-return-cell' }
      },
      {
        accessorKey: 'latestNav',
        header: '最新净值',
        size: 100,
        minSize: 80,
        cell: (info) => {
          const original = info.row.original || {};
          const rawDate = original.latestNavDate ?? '-';
          const date = isString(rawDate) && rawDate.length > 5 ? rawDate.slice(5) : rawDate;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 'clamp(16px, 1.35vw, 18.5px)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {info.getValue() ?? '—'}
              </div>
              <span className="muted" style={{ fontSize: '13px' }}>
                {date}
              </span>
            </div>
          );
        },
        meta: {
          align: 'right',
          cellClassName: 'value-cell'
        }
      },
      {
        accessorKey: 'estimateNav',
        header: '估算净值',
        size: 100,
        minSize: 80,
        cell: (info) => {
          const original = info.row.original || {};
          const rawDate = original.estimateNavDate ?? '-';
          const date = isString(rawDate) && rawDate.length > 5 ? rawDate.slice(5) : rawDate;
          const estimateNav = info.getValue();
          const hasEstimateNav = estimateNav != null && estimateNav !== '—';
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 'clamp(16px, 1.35vw, 18.5px)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {estimateNav ?? '—'}
              </div>
              {hasEstimateNav && date && date !== '-' ? (
                <span className="muted" style={{ fontSize: '13px' }}>
                  {date}
                </span>
              ) : null}
            </div>
          );
        },
        meta: {
          align: 'right',
          cellClassName: 'value-cell'
        }
      },
      {
        accessorKey: 'yesterdayChangePercent',
        header: '最新涨幅',
        size: 135,
        minSize: 100,
        cell: (info) => {
          const original = info.row.original || {};
          const value = original.yesterdayChangeValue;
          const rawDate = original.yesterdayDate ?? '-';
          const date = isString(rawDate) && rawDate.length > 5 ? rawDate.slice(5) : rawDate;
          const cls = value > 0 ? 'up' : value < 0 ? 'down' : '';
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 }}>
              <div
                className={cls}
                style={{
                  fontWeight: 700,
                  fontSize: 'clamp(16px, 1.35vw, 18.5px)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {info.getValue() ?? '—'}
              </div>
              <span className="muted" style={{ fontSize: '13px' }}>
                {date}
              </span>
            </div>
          );
        },
        meta: {
          align: 'right',
          cellClassName: 'change-cell'
        }
      },
      {
        accessorKey: 'estimateChangePercent',
        header: '估算涨幅',
        size: 135,
        minSize: 100,
        cell: (info) => {
          const original = info.row.original || {};
          const value = original.estimateChangeValue;
          const isMuted = original.estimateChangeMuted;
          const rawTime = original.estimateTime ?? '-';
          const time = isString(rawTime) && rawTime.length > 5 ? rawTime.slice(5) : rawTime;
          const cls = isMuted ? 'muted' : value > 0 ? 'up' : value < 0 ? 'down' : '';
          const text = info.getValue();
          const hasText = text != null && text !== '—';
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 }}>
              <div
                className={cls}
                style={{
                  fontWeight: 700,
                  fontSize: 'clamp(16px, 1.35vw, 18.5px)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {text ?? '—'}
              </div>
              {hasText && time && time !== '-' ? (
                <span className="muted" style={{ fontSize: '13px' }}>
                  {time}
                </span>
              ) : null}
            </div>
          );
        },
        meta: {
          align: 'right',
          cellClassName: 'est-change-cell'
        }
      },
      {
        accessorKey: 'sinceAddedChangePercent',
        header: '自添加来',
        size: 135,
        minSize: 100,
        cell: (info) => {
          const original = info.row.original || {};
          const value = original.sinceAddedChangeValue;
          const cls = value == null ? 'muted' : value > 0 ? 'up' : value < 0 ? 'down' : '';
          const rawDate = original.sinceAddedDateRaw ?? '';
          const displayDate = original.sinceAddedDate ?? '';
          const text = info.getValue();
          const hasText = text != null && text !== '—';
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 }}>
              <div
                className={cls}
                style={{
                  fontWeight: 700,
                  fontSize: 'clamp(16px, 1.35vw, 18.5px)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {text ?? '—'}
              </div>
              {hasText && displayDate ? (
                <span
                  className="muted"
                  style={{ fontSize: '13px' }}
                  title={rawDate && rawDate !== displayDate ? rawDate : undefined}
                >
                  {displayDate}
                </span>
              ) : null}
            </div>
          );
        },
        meta: {
          align: 'right',
          cellClassName: 'since-added-cell'
        }
      },
      {
        accessorKey: 'totalChangePercent',
        header: '估算收益',
        size: 135,
        minSize: 100,
        cell: (info) => {
          const original = info.row.original || {};
          const value = original.estimateProfitValue;
          const hasProfit = value != null;
          const cls = hasProfit ? (value > 0 ? 'up' : value < 0 ? 'down' : '') : 'muted';
          const amountStr = hasProfit ? (original.estimateProfit ?? '') : '—';
          const percentStr = original.estimateProfitPercent ?? '';

          return (
            <div style={{ width: '100%' }}>
              <span
                className={cls}
                style={{
                  fontWeight: 700,
                  display: 'block',
                  fontSize: 'clamp(16px, 1.35vw, 18.5px)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {masked && hasProfit ? <span className="mask-text">******</span> : amountStr}
              </span>
              {hasProfit && percentStr && !masked ? (
                <span
                  className={`${cls} estimate-profit-percent`}
                  style={{
                    display: 'block',
                    fontSize: 'clamp(13px, 1.05vw, 14.5px)',
                    opacity: 0.9,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {percentStr}
                </span>
              ) : null}
            </div>
          );
        },
        meta: {
          align: 'right',
          cellClassName: 'total-change-cell'
        }
      },
      {
        accessorKey: 'holdingAmount',
        header: '持仓金额',
        size: 135,
        minSize: 100,
        cell: (info) => {
          const original = info.row.original || {};
          const holdingLocked = (currentTab === 'all' || currentTab === 'fav') && !!original.isHoldingLinked;
          const holdingLinkedTitle = '持仓来自自定义分组汇总，点击选择分组后操作';
          if (original.holdingAmountValue == null) {
            return (
              <div
                role="button"
                tabIndex={0}
                className="muted"
                title={holdingLocked ? holdingLinkedTitle : '编辑持仓'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation?.();
                  onHoldingAmountClickRef.current?.(original, { hasHolding: false });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onHoldingAmountClickRef.current?.(original, { hasHolding: false });
                  }
                }}
              >
                未设置 <Settings2 className="size-3 inline-block ml-1 opacity-70" />
              </div>
            );
          }
          return (
            <div
              title={holdingLocked ? holdingLinkedTitle : '编辑持仓'}
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                width: '100%',
                minWidth: 0
              }}
              onClick={(e) => {
                e.stopPropagation?.();
                onHoldingAmountClickRef.current?.(original, { hasHolding: true });
              }}
            >
              <div style={{ flex: '1 1 0', minWidth: 0 }}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 'clamp(16px, 1.35vw, 18.5px)',
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {masked ? <span className="mask-text">******</span> : (info.getValue() ?? '—')}
                </span>
              </div>
              <button
                className="icon-button no-hover inline-flex items-center justify-center size-7 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                onClick={(e) => {
                  e.stopPropagation?.();
                  onHoldingAmountClickRef.current?.(original, { hasHolding: true });
                }}
                style={{
                  border: 'none',
                  marginLeft: 4,
                  flexShrink: 0,
                  backgroundColor: 'transparent',
                  color: holdingLocked ? 'var(--muted)' : undefined,
                  cursor: 'pointer'
                }}
                aria-label="编辑持仓"
              >
                <Settings2 className="size-3.5" />
              </button>
            </div>
          );
        },
        meta: {
          align: 'right',
          cellClassName: 'holding-amount-cell'
        }
      },
      {
        accessorKey: 'holdingRatio',
        header: '持仓占比',
        size: 100,
        minSize: 80,
        cell: (info) => {
          const original = info.row.original || {};
          const value = original.holdingRatioValue;
          if (value == null) {
            return (
              <div className="muted" style={{ textAlign: 'right', fontSize: '13px' }}>
                —
              </div>
            );
          }
          const text = `${(value * 100).toFixed(2)}%`;
          return (
            <span
              style={{
                fontWeight: 700,
                display: 'block',
                textAlign: 'right',
                fontSize: 'clamp(16px, 1.35vw, 18.5px)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {masked ? <span className="mask-text">******</span> : text}
            </span>
          );
        },
        meta: {
          align: 'right',
          cellClassName: 'holding-ratio-cell'
        }
      },
      {
        accessorKey: 'holdingCost',
        header: '持仓成本',
        size: 135,
        minSize: 100,
        cell: (info) => {
          const original = info.row.original || {};
          if (original.holdingCostValue == null) {
            return (
              <div className="muted" style={{ textAlign: 'right', fontSize: '13px' }}>
                —
              </div>
            );
          }
          return (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                width: '100%',
                minWidth: 0
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 'clamp(16px, 1.35vw, 18.5px)',
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {masked ? <span className="mask-text">******</span> : (info.getValue() ?? '—')}
              </span>
            </div>
          );
        },
        meta: {
          align: 'right',
          cellClassName: 'holding-cost-cell'
        }
      },
      {
        accessorKey: 'costNav',
        header: '成本净值',
        size: 100,
        minSize: 80,
        cell: (info) => {
          const original = info.row.original || {};
          if (original.costNavValue == null) {
            return (
              <div className="muted" style={{ textAlign: 'right', fontSize: '13px' }}>
                —
              </div>
            );
          }
          return (
            <span
              style={{
                fontWeight: 700,
                display: 'block',
                textAlign: 'right',
                fontSize: 'clamp(16px, 1.35vw, 18.5px)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {masked ? <span className="mask-text">******</span> : (info.getValue() ?? '—')}
            </span>
          );
        },
        meta: {
          align: 'right',
          cellClassName: 'cost-nav-cell'
        }
      },
      {
        accessorKey: 'holdingDays',
        header: '持有天数',
        size: 100,
        minSize: 80,
        cell: (info) => {
          const original = info.row.original || {};
          const value = original.holdingDaysValue;
          if (value == null) {
            return (
              <div className="muted" style={{ textAlign: 'right', fontSize: '13px' }}>
                —
              </div>
            );
          }
          return <div style={{ fontWeight: 700, textAlign: 'right' }}>{value}</div>;
        },
        meta: {
          align: 'right',
          cellClassName: 'holding-days-cell'
        }
      },
      {
        accessorKey: 'todayProfit',
        header: '当日收益',
        size: 135,
        minSize: 100,
        cell: (info) => {
          const original = info.row.original || {};
          const value = original.todayProfitValue;
          const hasProfit = value != null;
          const cls = hasProfit ? (value > 0 ? 'up' : value < 0 ? 'down' : '') : 'muted';
          const amountStr = hasProfit ? (info.getValue() ?? '') : '—';
          const percentStr = original.todayProfitPercent ?? '';
          return (
            <div style={{ width: '100%' }}>
              <span
                className={cls}
                style={{
                  fontWeight: 700,
                  display: 'block',
                  fontSize: 'clamp(16px, 1.35vw, 18.5px)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {masked && hasProfit ? <span className="mask-text">******</span> : amountStr}
              </span>
              {percentStr && !masked ? (
                <span
                  className={`${cls} today-profit-percent`}
                  style={{
                    display: 'block',
                    fontSize: 'clamp(13px, 1.05vw, 14.5px)',
                    opacity: 0.9,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {percentStr}
                </span>
              ) : null}
            </div>
          );
        },
        meta: {
          align: 'right',
          cellClassName: 'profit-cell'
        }
      },
      {
        accessorKey: 'yesterdayProfit',
        header: '昨日收益',
        size: 135,
        minSize: 100,
        cell: (info) => {
          const original = info.row.original || {};
          const value = original.yesterdayProfitValue;
          const hasProfit = value != null;
          const cls = hasProfit ? (value > 0 ? 'up' : value < 0 ? 'down' : '') : 'muted';
          const amountStr = hasProfit ? (info.getValue() ?? '') : '—';
          const percentStr = original.yesterdayProfitPercent ?? '';
          const pctVal = original.yesterdaySecondLinePctValue;
          const pctCls =
            pctVal != null && Number.isFinite(pctVal) ? (pctVal > 0 ? 'up' : pctVal < 0 ? 'down' : '') : 'muted';
          return (
            <div style={{ width: '100%' }}>
              <span
                className={cls}
                style={{
                  fontWeight: 700,
                  display: 'block',
                  fontSize: 'clamp(16px, 1.35vw, 18.5px)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {masked && hasProfit ? <span className="mask-text">******</span> : amountStr}
              </span>
              {percentStr && !masked ? (
                <span
                  className={`${pctCls} yesterday-profit-percent`}
                  style={{
                    display: 'block',
                    fontSize: 'clamp(13px, 1.05vw, 14.5px)',
                    opacity: 0.9,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {percentStr}
                </span>
              ) : null}
            </div>
          );
        },
        meta: {
          align: 'right',
          cellClassName: 'yesterday-profit-cell'
        }
      },
      {
        accessorKey: 'holdingProfit',
        header: '持有收益',
        size: 135,
        minSize: 100,
        cell: (info) => {
          const original = info.row.original || {};
          const value = original.holdingProfitValue;
          const hasTotal = value != null;
          const cls = hasTotal ? (value > 0 ? 'up' : value < 0 ? 'down' : '') : 'muted';
          const amountStr = hasTotal ? (info.getValue() ?? '') : '—';
          const percentStr = original.holdingProfitPercent ?? '';
          return (
            <div style={{ width: '100%' }}>
              <span
                className={cls}
                style={{
                  fontWeight: 700,
                  display: 'block',
                  fontSize: 'clamp(16px, 1.35vw, 18.5px)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {masked && hasTotal ? <span className="mask-text">******</span> : amountStr}
              </span>
              {percentStr && !masked ? (
                <span
                  className={`${cls} holding-profit-percent`}
                  style={{
                    display: 'block',
                    fontSize: 'clamp(13px, 1.05vw, 14.5px)',
                    opacity: 0.9,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {percentStr}
                </span>
              ) : null}
            </div>
          );
        },
        meta: {
          align: 'right',
          cellClassName: 'holding-cell'
        }
      },
      {
        id: 'actions',
        header: () => (
          <div className="inline-flex items-center justify-center gap-1.5 w-full">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">操作</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center size-6 rounded text-muted-foreground/70 hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation?.();
                    setSettingModalOpen(true);
                  }}
                  aria-label="自定义表格列与显示偏好"
                >
                  <SlidersHorizontal className="size-3.5" strokeWidth={1.8} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>自定义列与显示偏好</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ),
        size: 80,
        minSize: 80,
        maxSize: 80,
        enableResizing: false,
        enablePinning: true,
        meta: {
          align: 'center',
          isAction: true,
          cellClassName: 'action-cell'
        },
        cell: (info) => {
          const original = info.row.original || {};

          const handleClick = (e: React.MouseEvent) => {
            e.stopPropagation?.();
            onRemoveFundRef.current?.(original);
          };

          return (
            <div className="flex items-center justify-center w-full py-1">
              <button
                type="button"
                className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 active:scale-95 transition-all cursor-pointer"
                title="删除"
                onClick={handleClick}
              >
                <Trash2 className="size-3.5" strokeWidth={1.8} />
              </button>
            </div>
          );
        }
      }
    ],
    [
      currentTab,
      showFullFundName,
      getFundCardProps,
      handleOpenCardDialog,
      masked,
      relatedSectorByCode,
      sectorQuoteByLabel,
      periodReturnsByCode,
      dataSourceAccuracyLabels,
      batchRemoveEnabled,
      batchSelectableCount,
      selectedCount,
      selectedCodes,
      onRemoveFunds,
      onMoveFunds,
      setAllSelected,
      setSelectedCodes,
      setIsEditMode,
      setMoveGroupOpen,
      setSettingModalOpen,
      onFundTagsClick,
      isEditMode,
      favorites,
      sortBy,
      onToggleFavoriteRef,
      onFundTagsClickRef,
      onRemoveFundRef,
      onHoldingAmountClickRef,
      fundExtraDataByCode,
      isGroupTab
    ]
  );
}

export default usePcTableColumns;
