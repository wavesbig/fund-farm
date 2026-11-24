'use client';

import * as React from 'react';
import { useEffect, useRef } from 'react';
import {
  SlidersHorizontal,
  History,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  ArrowLeftRight,
  Coins,
  FileEdit,
  Trash2
} from 'lucide-react';
import { isNumber, isNil } from 'lodash';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface HoldingActionFund {
  code: string;
  name?: string;
  [key: string]: any;
}

export type HoldingActionType = 'buy' | 'sell' | 'dca' | 'convert' | 'dividend' | 'edit' | 'clear' | 'history';

export interface HoldingActionModalProps {
  fund: HoldingActionFund | null;
  holding?: any;
  onClose?: () => void;
  onAction: (action: HoldingActionType) => void;
  hasHistory?: boolean;
  pendingCount?: number;
  groupName?: string;
  nestedModalOpen?: boolean;
}

export default function HoldingActionModal({
  fund,
  holding,
  onClose,
  onAction,
  pendingCount = 0,
  groupName,
  nestedModalOpen = false
}: HoldingActionModalProps) {
  const ignoreDialogCloseUntilRef = useRef<number>(0);
  const prevNestedModalOpenRef = useRef<boolean>(false);

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
    if (!open) {
      onClose?.();
    }
  };

  const shareNum = !isNil(holding?.share)
    ? isNumber(holding.share)
      ? holding.share
      : parseFloat(String(holding.share))
    : 0;
  const costNum = !isNil(holding?.cost)
    ? isNumber(holding.cost)
      ? holding.cost
      : parseFloat(String(holding.cost))
    : 0;
  const hasShare = Number.isFinite(shareNum) && shareNum > 0;

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="glass card modal max-w-[420px] w-[90vw] z-[100] p-5"
        overlayClassName="modal-overlay"
        onPointerDownOutside={(event) => {
          if (nestedModalOpen || Date.now() < ignoreDialogCloseUntilRef.current) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (nestedModalOpen || Date.now() < ignoreDialogCloseUntilRef.current) event.preventDefault();
        }}
      >
        {/* 顶部 Header: 标题、关闭按钮 */}
        <div className="flex items-center justify-between mb-4 font-semibold text-base text-foreground">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-5 text-primary" />
            <DialogTitle className="text-base font-semibold leading-none text-foreground">持仓操作</DialogTitle>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* 基金与持仓信息看板 */}
        <div className="mb-4 p-3 rounded-lg bg-white/5 border border-border">
          <div className="font-semibold text-sm text-foreground mb-1 flex items-center justify-between gap-2">
            <span className="truncate">{fund?.name || '未知基金'}</span>
            {groupName ? (
              <Badge
                variant="outline"
                className="text-xs font-normal text-muted-foreground bg-white/5 border-border shrink-0"
              >
                {groupName}
              </Badge>
            ) : null}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>#{fund?.code}</span>
            {hasShare ? (
              <div className="flex items-center gap-2.5">
                <span>
                  持仓: <strong className="font-medium text-foreground">{shareNum.toLocaleString()}</strong> 份
                </span>
                {costNum > 0 && (
                  <span>
                    成本: <strong className="font-medium text-foreground">{costNum.toFixed(4)}</strong>
                  </span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground/70">当前暂无持仓份额</span>
            )}
          </div>
        </div>

        {/* 核心交易操作 2x2 网格 */}
        <div className="space-y-3 mb-2">
          <div className="grid grid-cols-2 gap-2.5">
            {/* 买入加仓 */}
            <Button
              type="button"
              variant="outline"
              onClick={() => onAction('buy')}
              className="h-11 px-3 flex items-center justify-start gap-2 bg-emerald-500/10 border-emerald-500/25 text-emerald-500 hover:bg-emerald-500/20 hover:border-emerald-500/40 text-xs font-medium cursor-pointer"
            >
              <ArrowDownLeft className="size-4 shrink-0" />
              <span>买入加仓</span>
            </Button>

            {/* 卖出减仓 */}
            <Button
              type="button"
              variant="outline"
              disabled={!hasShare}
              onClick={() => onAction('sell')}
              className="h-11 px-3 flex items-center justify-start gap-2 bg-rose-500/10 border-rose-500/25 text-rose-500 hover:bg-rose-500/20 hover:border-rose-500/40 text-xs font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowUpRight className="size-4 shrink-0" />
              <span>卖出减仓</span>
            </Button>

            {/* 智能定投 */}
            <Button
              type="button"
              variant="outline"
              onClick={() => onAction('dca')}
              className="h-11 px-3 flex items-center justify-start gap-2 bg-muted/20 border-border hover:bg-muted/40 text-foreground text-xs font-medium cursor-pointer"
            >
              <CalendarClock className="size-4 shrink-0 text-indigo-400" />
              <span>定投计划</span>
            </Button>

            {/* 编辑持仓 */}
            <Button
              type="button"
              variant="outline"
              onClick={() => onAction('edit')}
              className="h-11 px-3 flex items-center justify-start gap-2 bg-muted/20 border-border hover:bg-muted/40 text-foreground text-xs font-medium cursor-pointer"
            >
              <FileEdit className="size-4 shrink-0 text-primary" />
              <span>编辑持仓</span>
            </Button>

            {/* 基金转换 */}
            <Button
              type="button"
              variant="outline"
              onClick={() => onAction('convert')}
              className="h-11 px-3 flex items-center justify-start gap-2 bg-muted/20 border-border hover:bg-muted/40 text-foreground text-xs font-medium cursor-pointer"
            >
              <ArrowLeftRight className="size-4 shrink-0 text-sky-400" />
              <span>基金转换</span>
            </Button>

            {/* 分红方式 */}
            <Button
              type="button"
              variant="outline"
              onClick={() => onAction('dividend')}
              className="h-11 px-3 flex items-center justify-start gap-2 bg-muted/20 border-border hover:bg-muted/40 text-foreground text-xs font-medium cursor-pointer"
            >
              <Coins className="size-4 shrink-0 text-amber-400" />
              <span>分红方式</span>
            </Button>
          </div>

          {/* 交易记录 */}
          <Button
            type="button"
            variant="outline"
            onClick={() => onAction('history')}
            className="w-full h-10 px-3 flex items-center justify-between bg-muted/20 border-border hover:bg-muted/40 text-foreground text-xs font-medium cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <History className="size-4 text-muted-foreground" />
              <span>交易记录</span>
            </div>
            {pendingCount > 0 ? (
              <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-normal">
                {pendingCount} 笔待处理
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground font-normal">明细流水</span>
            )}
          </Button>
        </div>

        {/* 标准 Dialog Footer: 危险操作居左，标准关闭居右 */}
        <div className="pt-3 mt-1 border-t border-border flex items-center justify-between gap-2.5 shrink-0">
          {hasShare ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onAction('clear')}
              className="h-9 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              <span>清空持仓</span>
            </Button>
          ) : (
            <div />
          )}

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 px-4 text-xs font-medium bg-muted/30 border-border hover:bg-muted/60 text-foreground cursor-pointer"
          >
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
