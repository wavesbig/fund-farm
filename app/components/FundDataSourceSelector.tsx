'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { isNil, isNumber } from 'lodash';
import { Loader2 } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { fetchFundValuationBySource, fetchBestValuationSource, fetchFundBestSource, isQdiiFund } from '@/app/api/fund';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useStorageStore } from '@/app/stores';
import DataSourceAccuracyBadge from './DataSourceAccuracyBadge';
import { cn } from '@/lib/utils';

function formatGszzlEstimate(gszzl: any) {
  if (isNil(gszzl)) return '--';
  const n = isNumber(gszzl) ? gszzl : Number(gszzl);
  if (!Number.isFinite(n)) return '--';
  return `${n > 0 ? '+' : ''}${n.toFixed(2)}%`;
}

export interface FundDataSourceSelectorProps {
  fund?: {
    code: string;
    dataSource?: number | string;
    autoSource?: boolean;
    zzl?: number;
    jzrq?: string;
    [key: string]: any;
  } | null;
  onClose: () => void;
  onSelect: (sourceId: number, autoSource: boolean) => void;
}

export default function FundDataSourceSelector({ fund, onClose, onSelect }: FundDataSourceSelectorProps) {
  const isAdded = useStorageStore((s) => s.funds?.some((item) => item.code === fund?.code));
  const [sourceId, setSourceId] = useState('1');
  const [loading, setLoading] = useState(true);
  const [estimates, setEstimates] = useState<Record<number, string | null>>({
    1: null,
    2: null,
    3: null,
    4: null
  });
  const [bestSource, setBestSource] = useState<number | null>(null);
  const [isYesterdayAccuracy, setIsYesterdayAccuracy] = useState(false);
  const [isTodayAccuracy, setIsTodayAccuracy] = useState(false);
  const [accuracyDiffs, setAccuracyDiffs] = useState<Record<string, number>>({});

  // 是否为 QDII 基金（决定是否展示数据源 4）
  const [isQdii, setIsQdii] = useState(false);

  // 自动数据源状态
  const [autoSource, setAutoSource] = useState(Boolean(fund?.autoSource));
  const [autoLoading, setAutoLoading] = useState(false);

  // 调用 RPC 获取最佳数据源
  const fetchAndApplyBestSource = useCallback(async (fundCode: string) => {
    if (!fundCode) return;
    setAutoLoading(true);
    try {
      const bestId = await fetchFundBestSource(fundCode);
      if (bestId != null) {
        setSourceId(String(bestId));
      } else {
        sonnerToast.warning('未找到最佳数据源，已自动关闭');
        setAutoSource(false);
      }
    } catch {
      sonnerToast.warning('获取最佳数据源失败，已自动关闭');
      setAutoSource(false);
    } finally {
      setAutoLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fund?.dataSource) {
      setSourceId(String(fund.dataSource));
    }

    if (!fund?.code) {
      setEstimates({ 1: '--', 2: '--', 3: '--', 4: '--' });
      setLoading(false);
      setBestSource(null);
      setIsYesterdayAccuracy(false);
      setIsTodayAccuracy(false);
      setAccuracyDiffs({});
      setIsQdii(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setBestSource(null);
    setIsYesterdayAccuracy(false);
    setIsTodayAccuracy(false);
    setAccuracyDiffs({});
    setIsQdii(false);

    const actualZzl = isNumber(fund.zzl) && Number.isFinite(fund.zzl) ? fund.zzl : null;

    isQdiiFund(fund.code).then((qdii) => {
      if (!isMounted) return;
      setIsQdii(qdii);

      const estimatePromises = [
        fetchFundValuationBySource(fund.code, 1).catch(() => null),
        fetchFundValuationBySource(fund.code, 2).catch(() => null),
        fetchFundValuationBySource(fund.code, 3).catch(() => null)
      ];
      if (qdii) {
        estimatePromises.push(fetchFundValuationBySource(fund.code, 4).catch(() => null));
      }

      const bestSourcePromise =
        actualZzl != null && fund.jzrq
          ? fetchBestValuationSource(fund.code, fund.jzrq, actualZzl).catch(() => null)
          : Promise.resolve(null);

      Promise.all([Promise.all(estimatePromises), bestSourcePromise]).then(([estResults, bestResult]) => {
        if (!isMounted) return;
        const [v1, v2, v3, v4] = estResults;
        const e1 = formatGszzlEstimate(v1?.gszzl);
        const e2 = formatGszzlEstimate(v2?.gszzl);
        const e3 = formatGszzlEstimate(v3?.gszzl);
        const e4 = qdii ? formatGszzlEstimate(v4?.gszzl) : null;
        setEstimates({ 1: e1, 2: e2, 3: e3, 4: e4 });

        if (bestResult) {
          setBestSource(bestResult.bestSource);

          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const isTodayNav = fund.jzrq === todayStr && actualZzl != null;

          if (isTodayNav) {
            const rtDiffs: Record<string, number> = {};
            [v1, v2, v3].forEach((v, i) => {
              if (v?.gszzl != null && Number.isFinite(Number(v.gszzl))) {
                rtDiffs[String(i + 1)] = Math.abs(Number(v.gszzl) - actualZzl);
              }
            });
            if (v4?.gszzl != null && Number.isFinite(Number(v4.gszzl))) {
              rtDiffs['4'] = Math.abs(Number(v4.gszzl) - actualZzl);
            }
            if (Object.keys(rtDiffs).length > 0) {
              let minDiff = Infinity;
              let bestSrc: number | null = null;
              for (const [src, d] of Object.entries(rtDiffs)) {
                if (d < minDiff) {
                  minDiff = d;
                  bestSrc = Number(src);
                }
              }
              setBestSource(bestSrc);
              setIsYesterdayAccuracy(false);
              setIsTodayAccuracy(true);
              setAccuracyDiffs(rtDiffs);
            } else {
              setIsYesterdayAccuracy(Boolean(bestResult.isYesterdayAccuracy));
              setIsTodayAccuracy(Boolean(bestResult.isTodayAccuracy));
              if (bestResult.diffs) {
                setAccuracyDiffs(bestResult.diffs);
              }
            }
          } else {
            setIsYesterdayAccuracy(Boolean(bestResult.isYesterdayAccuracy));
            setIsTodayAccuracy(Boolean(bestResult.isTodayAccuracy));
            if (bestResult.diffs) {
              setAccuracyDiffs(bestResult.diffs);
            } else if (bestResult.diff != null && bestResult.bestSource != null) {
              setAccuracyDiffs({ [bestResult.bestSource]: bestResult.diff });
            }
          }
        }

        setLoading(false);
      });
    });

    if (fund.autoSource) {
      fetchAndApplyBestSource(fund.code);
    }

    return () => {
      isMounted = false;
    };
  }, [fund?.code, fund?.dataSource, fund?.autoSource, fund?.zzl, fund?.jzrq, fetchAndApplyBestSource]);

  const handleAutoToggle = useCallback(
    (checked: boolean) => {
      setAutoSource(checked);
      if (checked && fund?.code) {
        fetchAndApplyBestSource(fund.code);
      }
    },
    [fund?.code, fetchAndApplyBestSource]
  );

  const handleConfirm = () => {
    onSelect(parseInt(sourceId, 10), autoSource);
    onClose();
  };

  const isManualDisabled = autoSource;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} className="glass card modal max-w-[400px] w-[90vw] z-[999] p-6">
        <DialogTitle className="sr-only">切换数据源</DialogTitle>
        <div className="title flex items-center justify-between gap-4 mb-5">
          <span className="text-lg font-semibold text-foreground shrink-0">切换数据源</span>
        </div>

        <div className="mb-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-[var(--muted)] gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-sm">正在获取估算数据...</span>
            </div>
          ) : (
            <RadioGroup
              value={sourceId}
              onValueChange={(v) => {
                if (!isManualDisabled) setSourceId(v);
              }}
              className={cn(
                'flex flex-col gap-3 transition-opacity',
                isManualDisabled && 'opacity-75 pointer-events-none'
              )}
            >
              {[
                { id: '1', name: '数据源 1', est: estimates[1] },
                { id: '2', name: '数据源 2', est: estimates[2] },
                { id: '3', name: '数据源 3', est: estimates[3] },
                ...(isQdii ? [{ id: '4', name: '数据源 4', est: estimates[4] }] : [])
              ].map((item) => {
                const isSelected = sourceId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!isManualDisabled) setSourceId(item.id);
                    }}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer select-none',
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-[var(--border)] bg-[var(--secondary)] hover:bg-white/5',
                      isManualDisabled && 'cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <RadioGroupItem value={item.id} id={`source-${item.id}`} className="mt-1" />
                      <div className="flex-1 flex justify-between items-center w-full min-w-0">
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Label
                              htmlFor={`source-${item.id}`}
                              className="text-sm font-medium text-foreground cursor-pointer"
                            >
                              {item.name}
                            </Label>
                            {bestSource === Number(item.id) && (isYesterdayAccuracy || isTodayAccuracy) && (
                              <DataSourceAccuracyBadge label={isTodayAccuracy ? '今日最准' : '昨日最准'} />
                            )}
                            {item.id === '4' && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-[18px] min-h-0 leading-none font-medium border-orange-500/50 text-orange-500 bg-orange-500/10"
                              >
                                限免
                              </Badge>
                            )}
                          </div>
                          {accuracyDiffs[item.id] != null && (
                            <span className="text-[10px] text-[var(--muted)] px-1.5 py-0.5 rounded bg-muted/50 w-fit tabular-nums">
                              {isTodayAccuracy ? '今日预测误差' : '昨日预测误差'}: {accuracyDiffs[item.id].toFixed(2)}%
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                          <span className="text-[10px] text-[var(--muted)] px-1.5 py-0.5 rounded bg-muted/50">
                            当前预测
                          </span>
                          <span
                            className={cn(
                              'text-sm font-semibold tabular-nums',
                              !item.est || item.est === '--'
                                ? 'text-[var(--muted)]'
                                : item.est.startsWith('+')
                                  ? 'text-[var(--danger)]'
                                  : 'text-[var(--success)]'
                            )}
                          >
                            {item.est || '--'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1 h-9 bg-white/5" onClick={onClose}>
            取消
          </Button>
          <Button
            type="button"
            className="flex-1 h-9 font-medium"
            onClick={handleConfirm}
            disabled={loading || autoLoading}
          >
            确定
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
