'use client';

import * as React from 'react';
import { CloseIcon } from './Icons';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { PendingTrade } from '@/types';

export interface PendingTradesModalProps {
  open: boolean;
  trades?: PendingTrade[];
  onClose?: () => void;
  onRevoke?: (trade: PendingTrade) => void;
}

export default function PendingTradesModal({ open, trades = [], onClose, onRevoke }: PendingTradesModalProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="glass card modal trade-modal max-w-[420px] w-[90vw] p-6 z-[999]"
        overlayClassName="modal-overlay"
        overlayStyle={{ zIndex: 998 }}
      >
        <DialogTitle className="sr-only">待交易队列</DialogTitle>

        <div className="flex items-center justify-between mb-5 font-semibold text-base">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📥</span>
            <span>待交易队列</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <CloseIcon width="18" height="18" />
          </Button>
        </div>

        <div className="pending-list scrollbar-y-styled max-h-[300px] overflow-y-auto">
          <div className="pending-list-items flex flex-col gap-2.5 pt-0">
            {trades.map((trade, idx) => (
              <div key={trade.id || idx} className="trade-pending-item p-3 rounded-xl border border-border/60 glass">
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`font-semibold text-sm ${trade.type === 'buy' ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}
                  >
                    {trade.type === 'buy' ? '买入' : '卖出'}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {trade.date} {trade.isAfter3pm ? '(15:00后)' : ''}
                  </span>
                </div>
                <div className="flex justify-between text-xs my-0.5">
                  <span className="text-muted-foreground">份额/金额</span>
                  <span>{trade.share ? `${trade.share} 份` : `${trade.amount}`}</span>
                </div>
                <div className="flex justify-between items-center text-xs mt-1">
                  <span className="text-muted-foreground">状态</span>
                  <div className="flex items-center gap-2">
                    <span className="trade-pending-status text-xs text-muted-foreground/80">等待净值更新...</span>
                    <Button
                      type="button"
                      size="xs"
                      variant="destructive"
                      onClick={() => onRevoke?.(trade)}
                      className="px-2.5 h-6 text-xs"
                    >
                      撤销
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
