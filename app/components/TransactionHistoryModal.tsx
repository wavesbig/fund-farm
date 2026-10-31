'use client';

import * as React from 'react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { History, X } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { formatMoney } from '@/lib/utils';

export interface TransactionHistoryFund {
  code: string;
  name?: string;
  [key: string]: any;
}

export interface TransactionRecord {
  id: string | number;
  type: 'buy' | 'sell';
  share?: number | string;
  amount?: number | string;
  price?: number | string;
  date?: string;
  timestamp?: number;
  isDca?: boolean;
  [key: string]: any;
}

export interface PendingTransactionRecord {
  id: string | number;
  type: 'buy' | 'sell';
  share?: number | string;
  amount?: number | string;
  date?: string;
  isAfter3pm?: boolean;
  isDca?: boolean;
  [key: string]: any;
}

export interface TransactionHistoryModalProps {
  fund: TransactionHistoryFund | null;
  transactions?: TransactionRecord[];
  pendingTransactions?: PendingTransactionRecord[];
  nestedModalOpen?: boolean;
  onClose: () => void;
  onDeleteTransaction: (id: string | number) => void;
  onDeletePending: (id: string | number) => void;
  onAddHistory: () => void;
  onMergeAllGroups?: () => void;
  canMergeAllGroups?: boolean;
}

export default function TransactionHistoryModal({
  fund,
  transactions = [],
  pendingTransactions = [],
  nestedModalOpen = false,
  onClose,
  onDeleteTransaction,
  onDeletePending,
  onAddHistory,
  onMergeAllGroups,
  canMergeAllGroups = false
}: TransactionHistoryModalProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'pending' | 'history';
    item: TransactionRecord | PendingTransactionRecord;
  } | null>(null);
  const [mergeConfirmOpen, setMergeConfirmOpen] = useState<boolean>(false);
  const ignoreDialogCloseUntilRef = useRef<number>(0);
  const prevNestedModalOpenRef = useRef<boolean>(false);

  const effectiveNestedModalOpen = nestedModalOpen || !!deleteConfirm || mergeConfirmOpen;

  useEffect(() => {
    if (effectiveNestedModalOpen) {
      ignoreDialogCloseUntilRef.current = Date.now() + 1200;
    } else if (prevNestedModalOpenRef.current) {
      ignoreDialogCloseUntilRef.current = Date.now() + 1200;
    }
    prevNestedModalOpenRef.current = effectiveNestedModalOpen;
  }, [effectiveNestedModalOpen]);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
  }, [transactions]);

  const handleDeleteClick = (item: TransactionRecord | PendingTransactionRecord, type: 'pending' | 'history') => {
    setDeleteConfirm({ type, item });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    const { type, item } = deleteConfirm;
    if (type === 'pending') {
      onDeletePending(item.id);
    } else {
      onDeleteTransaction(item.id);
    }
    setDeleteConfirm(null);
  };

  const handleCloseClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onClose?.();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && (effectiveNestedModalOpen || Date.now() < ignoreDialogCloseUntilRef.current)) return;
    if (!open) {
      onClose?.();
    }
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="glass card modal tx-history-modal max-w-[480px] w-[90vw] max-h-[80vh] flex flex-col !z-[999] p-5"
        overlayClassName="modal-overlay"
        overlayStyle={{ zIndex: 998 }}
        onPointerDownOutside={(event) => {
          if (effectiveNestedModalOpen || Date.now() < ignoreDialogCloseUntilRef.current) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (effectiveNestedModalOpen || Date.now() < ignoreDialogCloseUntilRef.current) event.preventDefault();
        }}
      >
        <DialogTitle className="sr-only">交易记录</DialogTitle>

        <div className="flex items-center justify-between mb-5 shrink-0 font-semibold text-base text-foreground">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <span>交易记录</span>
            {canMergeAllGroups && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMergeConfirmOpen(true)}
                className="h-7 px-2.5 rounded-full text-xs bg-white/5 border-border text-primary hover:bg-white/10"
              >
                从全部分组合并
              </Button>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCloseClick}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="mb-4 shrink-0 flex justify-between items-center">
          <div>
            <div className="font-semibold text-base text-foreground mb-1">{fund?.name}</div>
            <div className="text-xs text-muted-foreground tabular-nums">#{fund?.code}</div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={onAddHistory}
            className="h-8 px-3 text-xs font-medium bg-primary text-primary-foreground"
          >
            添加记录
          </Button>
        </div>

        <div className="scrollbar-y-styled overflow-y-auto flex-1 pr-1">
          {pendingTransactions.length > 0 && (
            <div className="mb-5">
              <div className="text-xs text-muted-foreground mb-2 pl-1 font-medium">待处理队列</div>
              <div className="space-y-2">
                {pendingTransactions.map((item) => (
                  <div key={item.id} className="tx-history-pending-item p-3 rounded-xl bg-white/5 border border-border">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-semibold text-sm ${item.type === 'buy' ? 'text-primary' : 'text-red-500'}`}
                        >
                          {item.type === 'buy' ? '买入' : '卖出'}
                        </span>
                        {item.type === 'buy' && item.isDca && (
                          <span className="text-[10PX] px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                            定投
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {item.date} {item.isAfter3pm ? '(15:00后)' : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>份额/金额</span>
                      <span className="tabular-nums text-foreground">
                        {item.share ? `${Number(item.share).toFixed(2)} 份` : `${formatMoney(item.amount)}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-2 pt-1 border-t border-border/40">
                      <span className="text-amber-400">等待净值更新...</span>
                      <Button
                        type="button"
                        size="xs"
                        variant="destructive"
                        className="h-6 px-2.5 text-xs bg-destructive/10 border border-destructive/25 text-destructive hover:bg-destructive/20 hover:border-destructive/40 transition-colors"
                        onClick={() => handleDeleteClick(item, 'pending')}
                      >
                        撤销
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-xs text-muted-foreground mb-2 pl-1 font-medium">历史记录</div>
            {sortedTransactions.length === 0 ? (
              <div className="text-center py-5 text-xs text-muted-foreground">暂无历史交易记录</div>
            ) : (
              <div className="space-y-2">
                {sortedTransactions.map((item) => (
                  <div key={item.id} className="tx-history-record-item p-3 rounded-xl bg-white/5 border border-border">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-semibold text-sm ${item.type === 'buy' ? 'text-primary' : 'text-red-500'}`}
                        >
                          {item.type === 'buy' ? '买入' : '卖出'}
                        </span>
                        {item.type === 'buy' && item.isDca && (
                          <span className="text-[10PX] px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                            定投
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">{item.date}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                      <span>成交份额</span>
                      <span className="tabular-nums text-foreground">{Number(item.share).toFixed(2)} 份</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                      <span>成交金额</span>
                      <span className="tabular-nums text-foreground">{formatMoney(item.amount)}</span>
                    </div>
                    {item.price && (
                      <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                        <span>成交净值</span>
                        <span className="tabular-nums text-foreground">{Number(item.price).toFixed(4)}</span>
                      </div>
                    )}
                    <div className="flex justify-end items-center text-xs mt-2 pt-1 border-t border-border/40">
                      <Button
                        type="button"
                        size="xs"
                        variant="destructive"
                        className="h-6 px-2.5 text-xs bg-destructive/10 border border-destructive/25 text-destructive hover:bg-destructive/20 hover:border-destructive/40 transition-colors"
                        onClick={() => handleDeleteClick(item, 'history')}
                      >
                        删除记录
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {deleteConfirm && (
            <ConfirmModal
              key="delete-confirm"
              title={deleteConfirm.type === 'pending' ? '撤销交易' : '删除记录'}
              message={
                deleteConfirm.type === 'pending'
                  ? '确定要撤销这笔待处理交易吗？'
                  : '确定要删除这条交易记录吗？\n注意：删除记录不会恢复已变更的持仓数据。'
              }
              onConfirm={handleConfirmDelete}
              onCancel={() => setDeleteConfirm(null)}
              confirmText="确认删除"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mergeConfirmOpen && (
            <ConfirmModal
              key="merge-all-groups-confirm"
              title="从全部分组合并"
              message={
                '是否确认从全部分组复制合并该基金交易记录至当前分组？\n将同时复制「待处理队列」与「历史记录」，原分组数据不受影响。'
              }
              onConfirm={() => {
                onMergeAllGroups?.();
                setMergeConfirmOpen(false);
              }}
              onCancel={() => setMergeConfirmOpen(false)}
              confirmText="确定"
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
