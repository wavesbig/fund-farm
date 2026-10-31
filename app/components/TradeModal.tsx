'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { isNumber, isUndefined } from 'lodash';
import { fetchFundPingzhongdata, fetchSmartFundNetValue } from '../api/fund';
import { DatePicker, NumericInput } from './Common';
import ConfirmModal from './ConfirmModal';
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PendingTradesModal from './PendingTradesModal';
import { Spinner } from '@/components/ui/spinner';
import { formatMoney } from '@/lib/utils';
import type { PendingTrade } from '@/types';
import { DEFAULT_TZ } from '@/app/constants';

dayjs.extend(utc);
dayjs.extend(timezone);

const getBrowserTimeZone = () => {
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || DEFAULT_TZ;
  }
  return DEFAULT_TZ;
};
const TZ = getBrowserTimeZone();
dayjs.tz.setDefault(TZ);
const nowInTz = () => dayjs().tz(TZ);
const toTz = (input?: string | Date) => (input ? dayjs.tz(input, TZ) : nowInTz());
const formatDate = (input?: string | Date) => toTz(input).format('YYYY-MM-DD');

export type TradeType = 'buy' | 'sell';

export interface TradeFund {
  code: string;
  name?: string;
  gsz?: number | string | null;
  dwjz?: number | string | null;
  [key: string]: any;
}

export interface TradeHolding {
  share: number;
  cost?: number;
  firstPurchaseDate?: string;
  [key: string]: any;
}

export interface TradeConfirmPayload {
  share: number | null;
  price: number;
  date: string;
  isAfter3pm: boolean;
  totalCost?: number;
  feeRate?: number;
  feeMode?: string;
  feeValue?: string;
}

export interface TradeModalProps {
  type: TradeType;
  fund: TradeFund | null;
  holding?: TradeHolding | null;
  onClose: () => void;
  onConfirm: (payload: TradeConfirmPayload) => void;
  pendingTrades?: PendingTrade[];
  onDeletePending?: (tradeId: string | number) => void;
}

export default function TradeModal({
  type,
  fund,
  holding,
  onClose,
  onConfirm,
  pendingTrades = [],
  onDeletePending
}: TradeModalProps) {
  const isBuy = type === 'buy';
  const [share, setShare] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [feeRate, setFeeRate] = useState<string>('0');
  const [, setMinBuyAmount] = useState<number>(0);
  const [loadingBuyMeta, setLoadingBuyMeta] = useState<boolean>(false);
  const [buyMetaError, setBuyMetaError] = useState<string | null>(null);
  const [date, setDate] = useState<string>(() => formatDate());
  const [isAfter3pm, setIsAfter3pm] = useState<boolean>(nowInTz().hour() >= 15);
  const [calcShare, setCalcShare] = useState<string | null>(null);

  const parseNumberish = (input: any): number | null => {
    if (input === null || isUndefined(input)) return null;
    if (isNumber(input)) return Number.isFinite(input) ? input : null;
    const cleaned = String(input).replace(/[^\d.]/g, '');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  };

  useEffect(() => {
    if (!isBuy || !fund?.code) return;
    let cancelled = false;

    setLoadingBuyMeta(true);
    setBuyMetaError(null);

    fetchFundPingzhongdata(fund.code)
      .then((pz: any) => {
        if (cancelled) return;
        const rate = parseNumberish(pz?.fund_Rate);
        const minsg = parseNumberish(pz?.fund_minsg);

        if (Number.isFinite(minsg)) {
          setMinBuyAmount(minsg!);
        } else {
          setMinBuyAmount(0);
        }

        if (Number.isFinite(rate)) {
          setFeeRate((prev) => {
            const prevNum = parseNumberish(prev);
            const shouldOverride = prev === '' || prev === '0' || prevNum === 0 || prevNum === null;
            return shouldOverride ? rate!.toFixed(2) : prev;
          });
        }
      })
      .catch((e: any) => {
        if (cancelled) return;
        setBuyMetaError(e?.message || '买入信息加载失败');
        setMinBuyAmount(0);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingBuyMeta(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isBuy, fund?.code]);

  const currentPendingTrades = useMemo(() => {
    return pendingTrades.filter((t) => t.fundCode === fund?.code);
  }, [pendingTrades, fund]);

  const pendingSellShare = useMemo(() => {
    return currentPendingTrades
      .filter((t) => t.type === 'sell')
      .reduce((acc, curr) => acc + (Number(curr.share) || 0), 0);
  }, [currentPendingTrades]);

  const availableShare = holding ? Math.max(0, holding.share - pendingSellShare) : 0;

  const [showPendingList, setShowPendingList] = useState<boolean>(false);

  useEffect(() => {
    if (showPendingList && currentPendingTrades.length === 0) {
      setShowPendingList(false);
    }
  }, [showPendingList, currentPendingTrades]);

  const getEstimatePrice = (): number => (isNumber(fund?.gsz) ? (fund?.gsz as number) : Number(fund?.dwjz || 0));

  const [price, setPrice] = useState<number>(getEstimatePrice());
  const [loadingPrice, setLoadingPrice] = useState<boolean>(false);
  const [actualDate, setActualDate] = useState<string | null>(null);

  useEffect(() => {
    if (date && fund?.code) {
      setLoadingPrice(true);
      setActualDate(null);

      let queryDate = date;
      if (isAfter3pm) {
        queryDate = toTz(date).add(1, 'day').format('YYYY-MM-DD');
      }

      fetchSmartFundNetValue(fund.code, queryDate)
        .then((result: any) => {
          if (result) {
            setPrice(result.value);
            setActualDate(result.date);
          } else {
            setPrice(0);
            setActualDate(null);
          }
        })
        .finally(() => setLoadingPrice(false));
    }
  }, [date, isAfter3pm, isBuy, fund]);

  const [feeMode, setFeeMode] = useState<'rate' | 'amount'>('rate');
  const [feeValue, setFeeValue] = useState<string>('0');
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  const sellShare = parseFloat(share) || 0;
  const sellPrice = parseFloat(String(price)) || 0;
  const sellAmount = sellShare * sellPrice;

  let sellFee = 0;
  if (feeMode === 'rate') {
    const rate = parseFloat(feeValue) || 0;
    sellFee = sellAmount * (rate / 100);
  } else {
    sellFee = parseFloat(feeValue) || 0;
  }

  const estimatedReturn = sellAmount - sellFee;

  useEffect(() => {
    if (!isBuy) return;
    const a = parseFloat(amount);
    const f = parseFloat(feeRate);
    const p = parseFloat(String(price));
    if (a > 0 && !isNaN(f)) {
      if (p > 0) {
        const netAmount = a / (1 + f / 100);
        const s = netAmount / p;
        setCalcShare(s.toFixed(6));
      } else {
        setCalcShare('待确认');
      }
    } else {
      setCalcShare(null);
    }
  }, [isBuy, amount, feeRate, price]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBuy) {
      if (!amount || !feeRate || !date || calcShare === null) return;
      setShowConfirm(true);
    } else {
      if (!share || !date) return;
      setShowConfirm(true);
    }
  };

  const handleFinalConfirm = () => {
    if (isBuy) {
      onConfirm({
        share: calcShare === '待确认' ? null : Number(calcShare),
        price: Number(price),
        totalCost: Number(amount),
        date: actualDate || date,
        isAfter3pm,
        feeRate: Number(feeRate)
      });
      return;
    }
    onConfirm({
      share: Number(share),
      price: Number(price),
      date: actualDate || date,
      isAfter3pm,
      feeMode,
      feeValue
    });
  };

  const isValid = isBuy ? !!amount && !!feeRate && !!date && calcShare !== null && !loadingBuyMeta : !!share && !!date;

  const handleSetShareFraction = (fraction: number) => {
    if (availableShare > 0) {
      setShare(Number((availableShare * fraction).toFixed(6)).toString());
    }
  };

  const [revokeTrade, setRevokeTrade] = useState<PendingTrade | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose?.();
    }
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="glass card modal trade-modal max-w-[420px] w-[90vw] !z-[99] p-5"
        overlayClassName="modal-overlay"
        overlayStyle={{ zIndex: 99 }}
      >
        <DialogTitle className="sr-only">{isBuy ? '加仓' : '减仓'}</DialogTitle>
        <div className="flex items-center justify-between mb-5 font-semibold text-base text-foreground">
          <div className="flex items-center gap-2">
            {isBuy ? (
              <ArrowDownLeft className="w-5 h-5 text-primary" />
            ) : (
              <ArrowUpRight className="w-5 h-5 text-destructive" />
            )}
            <span>{showConfirm ? (isBuy ? '买入确认' : '卖出确认') : isBuy ? '加仓' : '减仓'}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {!showConfirm && currentPendingTrades.length > 0 && (
          <Alert variant="warning" className="cursor-pointer mb-4" onClick={() => setShowPendingList(true)}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex justify-between items-center w-full">
              <span>当前有 {currentPendingTrades.length} 笔待处理交易</span>
              <span className="underline">查看详情 &gt;</span>
            </AlertDescription>
          </Alert>
        )}

        {!showConfirm && (
          <div className="mb-4">
            <div className="font-semibold text-base text-foreground mb-1">{fund?.name}</div>
            <div className="text-xs text-muted-foreground tabular-nums">#{fund?.code}</div>
          </div>
        )}

        {showConfirm ? (
          isBuy ? (
            <div className="text-sm">
              <div className="trade-confirm-card space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">基金名称</span>
                  <span className="font-semibold text-foreground">{fund?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">买入金额</span>
                  <span className="tabular-nums font-medium text-foreground">{formatMoney(amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">买入费率</span>
                  <span className="tabular-nums font-medium text-foreground">{Number(feeRate).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">参考净值</span>
                  <span className="tabular-nums font-medium text-foreground">
                    {loadingPrice ? '查询中...' : price ? `${Number(price).toFixed(4)}` : '待查询 (加入队列)'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">预估份额</span>
                  <span className="tabular-nums font-medium text-foreground">
                    {calcShare === '待确认' ? '待确认' : `${Number(calcShare).toFixed(2)} 份`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">买入日期</span>
                  <span className="tabular-nums text-foreground">{date}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border/50">
                  <span className="text-muted-foreground">交易时段</span>
                  <span className="text-foreground">{isAfter3pm ? '15:00后' : '15:00前'}</span>
                </div>
                <div className="text-xs text-muted-foreground text-right pt-1">
                  {loadingPrice
                    ? '正在获取该日净值...'
                    : `*基于${price === getEstimatePrice() ? '当前净值/估值' : '当日净值'}测算`}
                </div>
              </div>

              {holding && calcShare !== '待确认' && (
                <div className="mb-5">
                  <div className="text-xs text-muted-foreground mb-2">持仓变化预览</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="trade-preview-card p-2.5 rounded-lg bg-white/5 border border-border">
                      <div className="text-xs text-muted-foreground mb-1">持有份额</div>
                      <div className="text-xs tabular-nums">
                        <span className="opacity-70">{holding.share.toFixed(2)}</span>
                        <span className="mx-1">→</span>
                        <span className="font-semibold text-foreground">
                          {(holding.share + Number(calcShare)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    {price ? (
                      <div className="trade-preview-card p-2.5 rounded-lg bg-white/5 border border-border">
                        <div className="text-xs text-muted-foreground mb-1">持有市值 (估)</div>
                        <div className="text-xs tabular-nums">
                          <span className="opacity-70">{formatMoney(holding.share * Number(price))}</span>
                          <span className="mx-1">→</span>
                          <span className="font-semibold text-foreground">
                            {formatMoney((holding.share + Number(calcShare)) * Number(price))}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 bg-muted/30 border-border hover:bg-muted/60 text-foreground"
                >
                  返回修改
                </Button>
                <Button
                  type="button"
                  onClick={handleFinalConfirm}
                  disabled={loadingPrice}
                  className="flex-1 bg-primary text-primary-foreground font-medium"
                >
                  {loadingPrice ? '请稍候' : price ? '确认买入' : '加入待处理队列'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm">
              <div className="trade-confirm-card space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">基金名称</span>
                  <span className="font-semibold text-foreground">{fund?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">卖出份额</span>
                  <span className="tabular-nums font-medium text-foreground">{sellShare.toFixed(2)} 份</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">预估卖出单价</span>
                  <span className="tabular-nums font-medium text-foreground">
                    {loadingPrice ? '查询中...' : price ? `${sellPrice.toFixed(4)}` : '待查询 (加入队列)'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">卖出费率/费用</span>
                  <span className="tabular-nums text-foreground">
                    {feeMode === 'rate' ? `${feeValue}%` : `${feeValue}`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">预估手续费</span>
                  <span className="tabular-nums text-foreground">{price ? `${formatMoney(sellFee)}` : '待计算'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">卖出日期</span>
                  <span className="tabular-nums text-foreground">{date}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border/50">
                  <span className="text-muted-foreground">预计回款</span>
                  <span className="text-red-500 font-bold tabular-nums">
                    {loadingPrice ? '计算中...' : price ? `${formatMoney(estimatedReturn)}` : '待计算'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground text-right pt-1">
                  {loadingPrice
                    ? '正在获取该日净值...'
                    : `*基于${price === getEstimatePrice() ? '当前净值/估值' : '当日净值'}测算`}
                </div>
              </div>

              {holding && (
                <div className="mb-5">
                  <div className="text-xs text-muted-foreground mb-2">持仓变化预览</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="trade-preview-card p-2.5 rounded-lg bg-white/5 border border-border">
                      <div className="text-xs text-muted-foreground mb-1">持有份额</div>
                      <div className="text-xs tabular-nums">
                        <span className="opacity-70">{holding.share.toFixed(2)}</span>
                        <span className="mx-1">→</span>
                        <span className="font-semibold text-foreground">{(holding.share - sellShare).toFixed(2)}</span>
                      </div>
                    </div>
                    {price ? (
                      <div className="trade-preview-card p-2.5 rounded-lg bg-white/5 border border-border">
                        <div className="text-xs text-muted-foreground mb-1">持有市值 (估)</div>
                        <div className="text-xs tabular-nums">
                          <span className="opacity-70">{formatMoney(holding.share * sellPrice)}</span>
                          <span className="mx-1">→</span>
                          <span className="font-semibold text-foreground">
                            {formatMoney((holding.share - sellShare) * sellPrice)}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 bg-muted/30 border-border hover:bg-muted/60 text-foreground"
                >
                  返回修改
                </Button>
                <Button
                  type="button"
                  onClick={handleFinalConfirm}
                  disabled={loadingPrice}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium shadow-sm"
                >
                  {loadingPrice ? '请稍候' : price ? '确认卖出' : '加入待处理队列'}
                </Button>
              </div>
            </div>
          )
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isBuy ? (
              <div className="relative">
                <div style={{ pointerEvents: loadingBuyMeta ? 'none' : 'auto', opacity: loadingBuyMeta ? 0.55 : 1 }}>
                  <div className="mb-4">
                    <label className="text-xs text-muted-foreground block mb-1.5">
                      加仓金额 <span className="text-red-500">*</span>
                    </label>
                    <div className={`rounded-xl ${!amount ? 'border border-red-500' : 'border border-border'}`}>
                      <NumericInput
                        value={amount}
                        onChange={setAmount}
                        step={100}
                        min={0}
                        placeholder="请输入加仓金额"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1.5">
                        买入费率 (%) <span className="text-red-500">*</span>
                      </label>
                      <div className={`rounded-xl ${!feeRate ? 'border border-red-500' : 'border border-border'}`}>
                        <NumericInput value={feeRate} onChange={setFeeRate} step={0.1} min={0} placeholder="0.12" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1.5">
                        加仓日期 <span className="text-red-500">*</span>
                      </label>
                      <DatePicker value={date} onChange={setDate} />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="text-xs text-muted-foreground block mb-1.5">交易时段</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={!isAfter3pm ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setIsAfter3pm(false)}
                        className={`h-8 text-xs font-medium ${
                          !isAfter3pm
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-white/5 border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        15:00前
                      </Button>
                      <Button
                        type="button"
                        variant={isAfter3pm ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setIsAfter3pm(true)}
                        className={`h-8 text-xs font-medium ${
                          isAfter3pm
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-white/5 border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        15:00后
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mb-3">
                    {buyMetaError ? <span className="text-red-500">{buyMetaError}</span> : null}
                    {loadingPrice ? (
                      <span>正在查询净值数据...</span>
                    ) : price === 0 ? null : (
                      <div className="flex flex-col gap-1">
                        <span className="tabular-nums">参考净值: {Number(price).toFixed(4)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {loadingBuyMeta && (
                  <div className="absolute inset-0 flex items-center justify-center gap-2.5 p-3 rounded-xl bg-black/30 backdrop-blur-xs">
                    <Spinner className="size-5" />
                    <span className="text-xs text-muted-foreground">正在加载买入费率/最小金额...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">
                    卖出份额 <span className="text-red-500">*</span>
                  </label>
                  <div className={`rounded-xl ${!share ? 'border border-red-500' : 'border border-border'}`}>
                    <NumericInput
                      value={share}
                      onChange={setShare}
                      step={1}
                      min={0}
                      placeholder={holding ? `最多可卖 ${availableShare.toFixed(2)} 份` : '请输入卖出份额'}
                    />
                  </div>
                  {holding && holding.share > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {[
                        { label: '1/4', value: 0.25 },
                        { label: '1/3', value: 1 / 3 },
                        { label: '1/2', value: 0.5 },
                        { label: '全部', value: 1 }
                      ].map((opt) => (
                        <Button
                          key={opt.label}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetShareFraction(opt.value)}
                          className="h-7 text-xs bg-white/5 border-border hover:bg-white/10 text-foreground"
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  )}
                  {holding && (
                    <div className="text-xs text-muted-foreground mt-1.5 tabular-nums">
                      当前持仓: {holding.share.toFixed(2)} 份{' '}
                      {pendingSellShare > 0 && (
                        <span className="text-amber-400 ml-2">冻结: {pendingSellShare.toFixed(2)} 份</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs text-muted-foreground">
                        {feeMode === 'rate' ? '卖出费率 (%)' : '卖出费用 (元)'}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setFeeMode((m) => (m === 'rate' ? 'amount' : 'rate'));
                          setFeeValue('0');
                        }}
                        className="text-primary text-xs hover:underline cursor-pointer"
                      >
                        切换为{feeMode === 'rate' ? '金额' : '费率'}
                      </button>
                    </div>
                    <div className="border border-border rounded-xl">
                      <NumericInput
                        value={feeValue}
                        onChange={setFeeValue}
                        step={feeMode === 'rate' ? 0.1 : 1}
                        min={0}
                        placeholder={feeMode === 'rate' ? '0.00' : '0.00'}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">
                      卖出日期 <span className="text-red-500">*</span>
                    </label>
                    <DatePicker value={date} onChange={setDate} />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">交易时段</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={!isAfter3pm ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsAfter3pm(false)}
                      className={`h-8 text-xs font-medium ${
                        !isAfter3pm
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-white/5 border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      15:00前
                    </Button>
                    <Button
                      type="button"
                      variant={isAfter3pm ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsAfter3pm(true)}
                      className={`h-8 text-xs font-medium ${
                        isAfter3pm
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-white/5 border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      15:00后
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mb-3">
                  {loadingPrice ? (
                    <span>正在查询净值数据...</span>
                  ) : price === 0 ? null : (
                    <div className="flex flex-col gap-1">
                      <span className="tabular-nums">参考净值: {price.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-muted/30 border-border hover:bg-muted/60 text-foreground"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={!isValid || loadingPrice || (isBuy && loadingBuyMeta)}
                className="flex-1 bg-primary text-primary-foreground font-medium"
              >
                确定
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
      <AnimatePresence>
        {revokeTrade && (
          <ConfirmModal
            key="revoke-confirm"
            title="撤销交易"
            message={`确定要撤销这笔 ${revokeTrade.share ? `${revokeTrade.share}份` : `${revokeTrade.amount}`} 的${revokeTrade.type === 'buy' ? '买入' : '卖出'}申请吗？`}
            onConfirm={() => {
              onDeletePending?.(revokeTrade.id);
              setRevokeTrade(null);
            }}
            onCancel={() => setRevokeTrade(null)}
            confirmText="确认撤销"
          />
        )}
      </AnimatePresence>
      <PendingTradesModal
        open={showPendingList}
        trades={currentPendingTrades}
        onClose={() => setShowPendingList(false)}
        onRevoke={(t) => setRevokeTrade(t)}
      />
    </Dialog>
  );
}
