'use client';

import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { ArrowLeftRight, ChevronRight, Info, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DatePicker, NumericInput } from './Common';
import { fetchSmartFundNetValueBackward } from '../api/fund';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/utils';

const format2 = (v: number | string) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  return n.toFixed(2);
};

export interface FundConvertFund {
  code: string;
  name?: string;
  [key: string]: any;
}

export interface FundConvertPayload {
  outFundCode: string;
  outFundName?: string;
  outAmount: number;
  inFundCode: string;
  inFundName?: string;
  inAmount: number;
  date: string;
}

export interface FundConvertModalProps {
  fund: FundConvertFund | null;
  maxOutAmount?: number | string;
  allFunds?: any[];
  nestedModalOpen?: boolean;
  onClose: () => void;
  onPickInFund?: (options: { excludeCodes: (string | undefined)[]; initialSelectedCode: string }) => Promise<any>;
  onConfirm?: (payload: FundConvertPayload) => void;
}

export default function FundConvertModal({
  fund,
  maxOutAmount = 0,
  nestedModalOpen = false,
  onClose,
  onPickInFund,
  onConfirm
}: FundConvertModalProps) {
  const [outAmount, setOutAmount] = useState<string>('');
  const [inAmount, setInAmount] = useState<string>('');
  const [inFund, setInFund] = useState<FundConvertFund | null>(null);
  const [confirmDate, setConfirmDate] = useState<string>(() => dayjs().format('YYYY-MM-DD'));
  const [outNetValue, setOutNetValue] = useState<number | string | null>(null);
  const [outNetValueDate, setOutNetValueDate] = useState<string | null>(null);
  const [inNetValue, setInNetValue] = useState<number | string | null>(null);
  const [inNetValueDate, setInNetValueDate] = useState<string | null>(null);
  const [loadingNetValue, setLoadingNetValue] = useState<boolean>(false);
  const [outNetValueError, setOutNetValueError] = useState<string | null>(null);
  const [inNetValueError, setInNetValueError] = useState<string | null>(null);
  const ignoreDialogCloseUntilRef = useRef<number>(0);
  const prevNestedModalOpenRef = useRef<boolean>(false);

  useEffect(() => {
    setOutAmount('');
    setInAmount('');
    setInFund(null);
    setConfirmDate(dayjs().format('YYYY-MM-DD'));
    setOutNetValue(null);
    setOutNetValueDate(null);
    setInNetValue(null);
    setInNetValueDate(null);
    setOutNetValueError(null);
    setInNetValueError(null);
    setLoadingNetValue(false);
  }, [fund?.code]);

  const maxOut = useMemo(() => {
    const n = Number(maxOutAmount);
    return Number.isFinite(n) && n > 0 ? Number(n.toFixed(2)) : 0;
  }, [maxOutAmount]);

  const outAmt = useMemo(() => Number.parseFloat(outAmount), [outAmount]);
  const inAmt = useMemo(() => Number.parseFloat(inAmount), [inAmount]);

  const outValid = Number.isFinite(outAmt) && outAmt > 0 && outAmt <= maxOut;
  const inValid = Number.isFinite(inAmt) && inAmt > 0;
  const canSubmit = !!fund?.code && !!inFund?.code && outValid && inValid && !!confirmDate;

  useEffect(() => {
    if (nestedModalOpen) {
      ignoreDialogCloseUntilRef.current = Date.now() + 1200;
    } else if (prevNestedModalOpenRef.current) {
      ignoreDialogCloseUntilRef.current = Date.now() + 1200;
    }
    prevNestedModalOpenRef.current = nestedModalOpen;
  }, [nestedModalOpen]);

  const handleOpenChange = (open: boolean) => {
    if (!open && (nestedModalOpen || Date.now() < ignoreDialogCloseUntilRef.current)) return;
    if (!open) onClose?.();
  };

  const hintMax = maxOut > 0 ? `最多可转出 ${formatMoney(maxOut)}` : '暂无可转出金额';
  const refStartDate = useMemo(() => {
    const d = dayjs(confirmDate, 'YYYY-MM-DD', true);
    if (!d.isValid()) return null;
    return d.subtract(1, 'day').format('YYYY-MM-DD');
  }, [confirmDate]);

  useEffect(() => {
    if (!fund?.code || !refStartDate) return;

    const getNetValues = async () => {
      setLoadingNetValue(true);
      setOutNetValue(null);
      setOutNetValueDate(null);
      setInNetValue(null);
      setInNetValueDate(null);
      setOutNetValueError(null);
      setInNetValueError(null);

      try {
        const tasks = [
          fetchSmartFundNetValueBackward(fund.code, refStartDate),
          inFund?.code ? fetchSmartFundNetValueBackward(inFund.code, refStartDate) : Promise.resolve(null)
        ];
        const [outRes, inRes] = await Promise.all(tasks);
        if (outRes && outRes.value) {
          setOutNetValue(outRes.value);
          setOutNetValueDate(outRes.date);
        } else {
          setOutNetValueError('未找到该日期的净值数据');
        }
        if (inFund?.code) {
          if (inRes && inRes.value) {
            setInNetValue(inRes.value);
            setInNetValueDate(inRes.date);
          } else {
            setInNetValueError('未找到该日期的净值数据');
          }
        }
      } catch {
        setOutNetValueError('获取净值失败');
        if (inFund?.code) setInNetValueError('获取净值失败');
      } finally {
        setLoadingNetValue(false);
      }
    };

    const timer = setTimeout(getNetValues, 500);
    return () => clearTimeout(timer);
  }, [fund?.code, inFund?.code, refStartDate]);

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="glass card modal gap-0 max-w-[420px] w-[90vw] max-h-[90vh] flex flex-col !z-[999] p-5"
        overlayClassName="modal-overlay"
        onPointerDownOutside={(event) => {
          if (nestedModalOpen || Date.now() < ignoreDialogCloseUntilRef.current) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (nestedModalOpen || Date.now() < ignoreDialogCloseUntilRef.current) event.preventDefault();
        }}
      >
        <DialogTitle className="sr-only">转换</DialogTitle>

        <div className="flex items-center justify-between mb-5 font-semibold text-base text-foreground">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-purple-400" />
            <span>转换</span>
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

        <Alert className="mb-4 shrink-0 bg-blue-500/10 border-blue-500/30 text-blue-400" variant="info">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">需要基金转换完成后再添加</AlertDescription>
        </Alert>

        <div className="scrollbar-y-styled overflow-y-auto pr-1 flex-1 space-y-4">
          <div>
            <div className="font-semibold text-base text-foreground mb-1">{fund?.name}</div>
            <div className="text-xs text-muted-foreground tabular-nums">#{fund?.code}</div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">转出基金</label>
            <div className="w-full rounded-xl px-3 py-2 bg-white/5 border border-border text-sm text-foreground opacity-90 truncate">
              {fund?.name || '-'}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">
              转出金额 <span className="text-red-500">*</span>
            </label>
            <div className={`rounded-xl ${!outAmount || !outValid ? 'border border-red-500' : 'border border-border'}`}>
              <NumericInput value={outAmount} onChange={setOutAmount} step={100} min={0} placeholder="请输入转出金额" />
            </div>
            {maxOut > 0 && (
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
                    className="h-7 text-xs bg-muted/30 border-border hover:bg-muted/60 text-foreground"
                    onClick={() => setOutAmount(format2(maxOut * opt.value))}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1.5 tabular-nums">* {hintMax}</div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">
              转入基金 <span className="text-red-500">*</span>
            </label>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const picked = await onPickInFund?.({
                  excludeCodes: [fund?.code],
                  initialSelectedCode: inFund?.code || ''
                });
                if (picked?.code) setInFund(picked);
              }}
              className="w-full justify-between bg-muted/30 border-border hover:bg-muted/60 text-foreground h-10 px-3 rounded-xl font-normal"
            >
              <span className="truncate text-sm">
                {inFund?.name ? `${inFund.name} #${inFund.code}` : '点击选择基金（单选）'}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
            </Button>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">
              转入金额 <span className="text-red-500">*</span>
            </label>
            <div className={`rounded-xl ${!inAmount || !inValid ? 'border border-red-500' : 'border border-border'}`}>
              <NumericInput value={inAmount} onChange={setInAmount} step={100} min={0} placeholder="请输入转入金额" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">确认转换日期</label>
            <DatePicker value={confirmDate} onChange={setConfirmDate} />
            {loadingNetValue && <div className="text-xs text-muted-foreground mt-1">正在获取净值...</div>}
            {!loadingNetValue && outNetValueError && (
              <div className="text-xs text-red-500 mt-1">参考净值(转出): {outNetValueError}</div>
            )}
            {!loadingNetValue && inFund?.code && inNetValueError && (
              <div className="text-xs text-red-500 mt-1">参考净值(转入): {inNetValueError}</div>
            )}
            {outNetValue && !loadingNetValue && (
              <div className="text-xs text-emerald-400 mt-1 tabular-nums">
                参考净值(转出): {outNetValue} ({outNetValueDate})
              </div>
            )}
            {inFund?.code && inNetValue && !loadingNetValue && (
              <div className="text-xs text-emerald-400 mt-1 tabular-nums">
                参考净值(转入): {inNetValue} ({inNetValueDate})
              </div>
            )}
          </div>
        </div>

        <div className="pt-3 mt-1 border-t border-border flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-muted/30 border-border hover:bg-muted/60 text-foreground"
          >
            取消
          </Button>
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              if (!canSubmit || !fund || !inFund) return;
              onConfirm?.({
                outFundCode: fund.code,
                outFundName: fund.name,
                outAmount: outAmt,
                inFundCode: inFund.code,
                inFundName: inFund.name,
                inAmount: inAmt,
                date: confirmDate
              });
            }}
            className="flex-1 bg-primary text-primary-foreground font-medium"
          >
            确认转换
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
