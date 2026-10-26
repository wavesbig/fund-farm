'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { RefreshCw, X, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { formatMoney, cn } from '@/lib/utils';
import { useUserStore } from '@/app/stores';

export interface ScannedFundItem {
  code: string;
  name?: string;
  status?: string;
  holdAmounts?: number | string;
  holdGains?: number | string;
  [key: string]: any;
}

export interface ScanImportConfirmModalProps {
  scannedFunds: ScannedFundItem[];
  selectedScannedCodes: Set<string>;
  onClose: () => void;
  onToggle: (code: string) => void;
  onConfirm: (groupId: string, expandAfterAdd: boolean, autoDataSource: boolean, autoImportTags: boolean) => void;
  onRetryOcr?: () => void;
  refreshing?: boolean;
  groups?: any[];
  existingAllCodes?: string[];
  existingFavCodes?: string[];
  isOcrScan?: boolean;
  currentGroup?: string;
}

export default function ScanImportConfirmModal({
  scannedFunds,
  selectedScannedCodes,
  onClose,
  onToggle,
  onConfirm,
  onRetryOcr,
  groups = [],
  existingAllCodes = [],
  existingFavCodes = [],
  isOcrScan = false,
  currentGroup = 'all'
}: ScanImportConfirmModalProps) {
  const user = useUserStore((s) => s.user);
  const [selectedGroupId, setSelectedGroupId] = useState(currentGroup);
  const [expandAfterAdd, setExpandAfterAdd] = useState(true);
  const [autoDataSource, setAutoDataSource] = useState(Boolean(user));
  const [autoImportTags, setAutoImportTags] = useState(true);
  const allCodeSet = useMemo(() => new Set((existingAllCodes || []).filter(Boolean)), [existingAllCodes]);
  const favCodeSet = useMemo(() => new Set((existingFavCodes || []).filter(Boolean)), [existingFavCodes]);

  const handleConfirm = () => {
    onConfirm(selectedGroupId, expandAfterAdd, autoDataSource, autoImportTags);
  };

  const formatAmount = (val: any) => {
    if (!val) return null;
    const num = parseFloat(String(val).replace(/,/g, ''));
    if (isNaN(num)) return null;
    return num;
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="glass card modal max-w-[480px] w-[92vw] z-[99] p-5 max-h-[88vh] flex flex-col"
        overlayClassName="modal-overlay"
        showCloseButton={false}
      >
        <DialogTitle asChild>
          <div className="title flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-base text-foreground">确认导入基金</span>
              {isOcrScan && onRetryOcr && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRetryOcr}
                  className="h-7 px-2 text-xs text-primary hover:text-primary/80 gap-1 p-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>重新识别</span>
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full text-[var(--muted)] hover:text-foreground"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogTitle>

        {isOcrScan && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-foreground mb-3 shrink-0">
            <AlertTriangle className="w-4 h-4 text-primary shrink-0" />
            <span>拍照识别方案目前还在优化，请确认识别结果是否正确。</span>
          </div>
        )}

        {scannedFunds.length === 0 ? (
          <div className="text-xs text-[var(--muted)] py-6 text-center leading-relaxed">
            未识别到有效的基金代码，请尝试更清晰的截图或手动搜索。
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-3 pr-1 scrollbar-y-styled">
            <div className="search-results flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1">
              {scannedFunds.map((item) => {
                const isSelected = selectedScannedCodes.has(item.code);
                const isInvalid = item.status === 'invalid';
                const targetGroup = selectedGroupId;
                const inAll = allCodeSet.has(item.code);
                const inFav = favCodeSet.has(item.code);
                const groupCodes =
                  targetGroup && targetGroup !== 'all' && targetGroup !== 'fav'
                    ? groups.find((g: any) => g.id === targetGroup)?.codes || []
                    : [];
                const inGroup =
                  targetGroup && targetGroup !== 'all' && targetGroup !== 'fav'
                    ? groupCodes.includes(item.code)
                    : false;
                const holdAmounts = formatAmount(item.holdAmounts);
                const holdGains = formatAmount(item.holdGains);
                const hasHoldingData = holdAmounts !== null && holdGains !== null;
                const isAlreadyInTarget = targetGroup === 'all' ? inAll : targetGroup === 'fav' ? inFav : inGroup;
                const isDisabled = (isAlreadyInTarget && !hasHoldingData) || isInvalid;
                const displayName = item.name || (isInvalid ? '未找到基金' : '未知基金');

                return (
                  <div
                    key={item.code}
                    className={cn(
                      'search-item p-3 rounded-xl border border-[var(--border)] bg-background/30 flex flex-col gap-1.5 transition-colors select-none',
                      isSelected && 'border-primary/40 bg-primary/10',
                      isAlreadyInTarget && !hasHoldingData && 'opacity-60',
                      isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-background/50'
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (isDisabled) return;
                      onToggle(item.code);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="fund-info flex items-baseline gap-2">
                        <span className="font-semibold text-sm text-foreground">{displayName}</span>
                        <span className="text-xs text-[var(--muted)] tabular-nums">#{item.code}</span>
                      </div>
                      {isAlreadyInTarget && !hasHoldingData ? (
                        <span className="text-[11px] text-[var(--muted)] bg-white/5 px-2 py-0.5 rounded-md">
                          已添加
                        </span>
                      ) : isInvalid ? (
                        <span className="text-[11px] text-[var(--danger)] bg-[var(--danger)]/10 px-2 py-0.5 rounded-md">
                          未找到
                        </span>
                      ) : (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onToggle(item.code)}
                          className="shrink-0"
                        />
                      )}
                    </div>
                    {hasHoldingData && !isDisabled && (
                      <div className="flex items-center gap-3 pt-1 text-xs">
                        {holdAmounts !== null && (
                          <span className="text-[var(--muted)]">
                            持有金额：
                            <span className="text-foreground font-medium tabular-nums">{formatMoney(holdAmounts)}</span>
                          </span>
                        )}
                        {holdGains !== null && (
                          <span className="text-[var(--muted)]">
                            持有收益：
                            <span
                              className={cn(
                                'font-medium tabular-nums',
                                holdGains >= 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'
                              )}
                            >
                              {holdGains >= 0 ? '+' : '-'}
                              {formatMoney(Math.abs(holdGains))}
                            </span>
                          </span>
                        )}
                        {isAlreadyInTarget && (
                          <span className="text-[11px] text-[var(--danger)] bg-[var(--danger)]/15 px-2 py-0.5 rounded-md ml-auto">
                            已存在
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2.5 pt-2 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted)]">添加后展开详情</span>
                <Switch checked={expandAfterAdd} onCheckedChange={(checked) => setExpandAfterAdd(Boolean(checked))} />
              </div>
              {user && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--muted)]">自动数据源</span>
                  <Switch checked={autoDataSource} onCheckedChange={(checked) => setAutoDataSource(Boolean(checked))} />
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted)]">导入基金标签</span>
                <Switch checked={autoImportTags} onCheckedChange={(checked) => setAutoImportTags(Boolean(checked))} />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[var(--muted)] whitespace-nowrap">添加到分组：</span>
                <Select value={selectedGroupId} onValueChange={(value) => setSelectedGroupId(value)}>
                  <SelectTrigger className="flex-1 h-8 text-xs">
                    <SelectValue placeholder="选择分组" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    {groups
                      .filter((g: any) => g.id !== 'all')
                      .map((g: any) => {
                        const isFav = g.id === 'fav' || g.isPreset;
                        return (
                          <SelectItem key={g.id} value={g.id}>
                            {isFav ? '自选' : g.name}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-[var(--border)] shrink-0">
          <Button type="button" variant="outline" className="h-9 px-4 text-xs" onClick={onClose}>
            取消
          </Button>
          <Button
            type="button"
            className="h-9 px-4 text-xs font-medium"
            onClick={handleConfirm}
            disabled={selectedScannedCodes.size === 0}
          >
            确认导入 ({selectedScannedCodes.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
