'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { RefreshCw, X, AlertTriangle, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { formatMoney, cn } from '@/lib/utils';
import { isArray, isNil } from 'lodash';

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
  onSelectAll?: (codes: Set<string>) => void;
  onConfirm: (groupId: string, expandAfterAdd: boolean, autoDataSource: boolean, autoImportTags: boolean) => void;
  onRetryOcr?: () => void;
  refreshing?: boolean;
  groups?: any[];
  existingAllCodes?: string[];
  existingFavCodes?: string[];
  isOcrScan?: boolean;
  currentGroup?: string;
  isScanImporting?: boolean;
  scanImportProgress?: { current?: number; total?: number; success?: number; failed?: number };
}

export default function ScanImportConfirmModal({
  scannedFunds,
  selectedScannedCodes,
  onClose,
  onToggle,
  onSelectAll,
  onConfirm,
  onRetryOcr,
  groups = [],
  existingAllCodes = [],
  existingFavCodes = [],
  isOcrScan = false,
  currentGroup = 'all',
  isScanImporting = false,
  scanImportProgress
}: ScanImportConfirmModalProps) {
  const [selectedGroupId, setSelectedGroupId] = useState(currentGroup);
  const [expandAfterAdd, setExpandAfterAdd] = useState(true);
  const [autoDataSource, setAutoDataSource] = useState(false);
  const [autoImportTags, setAutoImportTags] = useState(true);

  const allCodeSet = useMemo(() => new Set((existingAllCodes || []).filter(Boolean)), [existingAllCodes]);
  const favCodeSet = useMemo(() => new Set((existingFavCodes || []).filter(Boolean)), [existingFavCodes]);

  const handleConfirm = () => {
    if (isScanImporting || selectedScannedCodes.size === 0) return;
    onConfirm(selectedGroupId, expandAfterAdd, autoDataSource, autoImportTags);
  };

  const formatAmount = (val: any) => {
    if (isNil(val) || val === '') return null;
    const num = parseFloat(String(val).replace(/,/g, ''));
    if (isNaN(num)) return null;
    return num;
  };

  // 可选基金（排除未找到代码的）
  const selectableCodes = useMemo(() => {
    return scannedFunds.filter((item) => item.status !== 'invalid').map((item) => item.code);
  }, [scannedFunds]);

  const isAllSelected = selectableCodes.length > 0 && selectableCodes.every((c) => selectedScannedCodes.has(c));

  const handleToggleSelectAll = () => {
    if (isScanImporting) return;
    if (onSelectAll) {
      if (isAllSelected) {
        onSelectAll(new Set());
      } else {
        onSelectAll(new Set(selectableCodes));
      }
    } else {
      selectableCodes.forEach((c) => {
        if (isAllSelected && selectedScannedCodes.has(c)) {
          onToggle(c);
        } else if (!isAllSelected && !selectedScannedCodes.has(c)) {
          onToggle(c);
        }
      });
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !isScanImporting && onClose()}>
      <DialogContent
        className="glass card modal max-w-[500px] w-[94vw] max-h-[85vh] p-5 flex flex-col overflow-hidden z-[99]"
        overlayClassName="modal-overlay"
        showCloseButton={false}
      >
        {/* 顶部标题栏 */}
        <DialogTitle asChild>
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="font-semibold text-base text-foreground">确认导入基金</span>
              {isOcrScan && onRetryOcr && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRetryOcr}
                  disabled={isScanImporting}
                  className="h-7 px-2 text-xs text-primary hover:text-primary/80 gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>重新识别</span>
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground"
              onClick={onClose}
              disabled={isScanImporting}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogTitle>

        {/* 主内容区域：单层滚动容器 */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 pt-3 scrollbar-y-styled">
          {/* 提示信息 */}
          {isOcrScan && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-foreground">
              <AlertTriangle className="w-4 h-4 text-primary shrink-0" />
              <span>拍照识别结果基于 OCR 与大模型匹配，请确认基金及金额是否正确。</span>
            </div>
          )}

          {scannedFunds.length === 0 ? (
            <div className="text-xs text-muted-foreground py-10 text-center leading-relaxed">
              未识别到有效的基金代码，请尝试更清晰的持仓截图。
            </div>
          ) : (
            <div className="flex flex-col gap-2">
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
                const hasHoldingData = !isNil(holdAmounts) && !isNil(holdGains);
                const isAlreadyInTarget = targetGroup === 'all' ? inAll : targetGroup === 'fav' ? inFav : inGroup;
                const isDisabled = (isAlreadyInTarget && !hasHoldingData) || isInvalid || isScanImporting;
                const displayName = item.name || (isInvalid ? '未找到基金' : '未知基金');

                return (
                  <div
                    key={item.code}
                    className={cn(
                      'w-full p-3 rounded-xl border border-[var(--border)] bg-background/40 transition-colors select-none text-left',
                      isSelected && 'border-primary/50 bg-primary/10',
                      isAlreadyInTarget && !hasHoldingData && 'opacity-60',
                      isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-background/60'
                    )}
                    onClick={() => {
                      if (isDisabled) return;
                      onToggle(item.code);
                    }}
                  >
                    <div className="flex items-center justify-between gap-3 w-full">
                      {/* 左侧基金信息 */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground truncate">{displayName}</span>
                          <span className="text-xs text-muted-foreground font-mono shrink-0">#{item.code}</span>
                        </div>

                        {/* 持仓与收益数据 */}
                        {hasHoldingData && !isDisabled && (
                          <div className="flex items-center gap-3 pt-1.5 text-xs">
                            {!isNil(holdAmounts) && (
                              <span className="text-muted-foreground">
                                持有金额：
                                <span className="text-foreground font-medium tabular-nums font-mono">
                                  {formatMoney(holdAmounts)}
                                </span>
                              </span>
                            )}
                            {!isNil(holdGains) && (
                              <span className="text-muted-foreground">
                                持有收益：
                                <span
                                  className={cn(
                                    'font-medium tabular-nums font-mono',
                                    holdGains >= 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'
                                  )}
                                >
                                  {holdGains >= 0 ? '+' : '-'}
                                  {formatMoney(Math.abs(holdGains))}
                                </span>
                              </span>
                            )}
                            {isAlreadyInTarget && (
                              <span className="text-[11px] text-[var(--danger)] bg-[var(--danger)]/15 px-1.5 py-0.5 rounded ml-auto">
                                已存在
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 右侧操作复选框 / 状态 */}
                      <div className="shrink-0 flex items-center pl-2">
                        {isAlreadyInTarget && !hasHoldingData ? (
                          <span className="text-[11px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded-md">
                            已添加
                          </span>
                        ) : isInvalid ? (
                          <span className="text-[11px] text-[var(--danger)] bg-[var(--danger)]/10 px-2 py-0.5 rounded-md">
                            未找到
                          </span>
                        ) : (
                          <Checkbox
                            checked={isSelected}
                            disabled={isDisabled}
                            onCheckedChange={() => onToggle(item.code)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 导入选项 */}
          {scannedFunds.length > 0 && (
            <div className="flex flex-col gap-2.5 pt-3 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">添加后展开详情</span>
                <Switch
                  checked={expandAfterAdd}
                  onCheckedChange={(checked) => setExpandAfterAdd(Boolean(checked))}
                  disabled={isScanImporting}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">导入基金标签</span>
                <Switch
                  checked={autoImportTags}
                  onCheckedChange={(checked) => setAutoImportTags(Boolean(checked))}
                  disabled={isScanImporting}
                />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground whitespace-nowrap">添加到分组：</span>
                <Select
                  value={selectedGroupId}
                  onValueChange={(value) => setSelectedGroupId(value)}
                  disabled={isScanImporting}
                >
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
          )}
        </div>

        {/* 底部操作栏：固定底部 */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] shrink-0 mt-3">
          <div className="flex items-center gap-2">
            {selectableCodes.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                disabled={isScanImporting}
                onClick={handleToggleSelectAll}
              >
                {isAllSelected ? '取消全选' : '全选'}
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              已选 <span className="font-semibold text-primary">{selectedScannedCodes.size}</span> /{' '}
              {scannedFunds.length} 支
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 px-4 text-xs"
              onClick={onClose}
              disabled={isScanImporting}
            >
              取消
            </Button>
            <Button
              type="button"
              className="h-9 px-4 text-xs font-medium gap-1.5"
              onClick={handleConfirm}
              disabled={selectedScannedCodes.size === 0 || isScanImporting}
            >
              {isScanImporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    正在导入 ({scanImportProgress?.current || 0}/
                    {scanImportProgress?.total || selectedScannedCodes.size})...
                  </span>
                </>
              ) : (
                `确认导入 (${selectedScannedCodes.size})`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
