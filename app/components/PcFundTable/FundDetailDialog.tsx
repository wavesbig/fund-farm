'use client';

import React from 'react';
import { useModalStore } from '@/app/stores';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FundCard from '../FundCard';

export interface FundDetailDialogProps {
  blockDialogClose: boolean;
  cardDialogRow: any;
  getFundCardProps?: (row: any) => any;
  setCardDialogRow: (row: any) => void;
}

export function FundDetailDialog({
  blockDialogClose,
  cardDialogRow,
  getFundCardProps,
  setCardDialogRow
}: FundDetailDialogProps) {
  const isAnySubModalOpen = useModalStore(
    (s) =>
      s.dataSourceModal.open ||
      s.tradeModal.open ||
      s.holdingModal.open ||
      s.dcaModal.open ||
      s.dividendMethodModal.open ||
      s.convertModal.open ||
      s.fundTagsEdit.open ||
      s.historyModal.open ||
      s.actionModal.open ||
      s.selectHoldingGroupModal.open ||
      s.addHistoryModal.open
  );

  const finalBlockClose = blockDialogClose || isAnySubModalOpen;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && document.body.hasAttribute('data-photo-viewer-open')) return;
        if (!open && !finalBlockClose) setCardDialogRow(null);
      }}
    >
      <DialogContent
        className="sm:max-w-2xl max-h-[88vh] flex flex-col p-0 overflow-hidden"
        onPointerDownOutside={(e) => {
          if (document.body.hasAttribute('data-photo-viewer-open')) {
            e.preventDefault();
            return;
          }
          if (finalBlockClose) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (document.body.hasAttribute('data-photo-viewer-open')) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between gap-2 space-y-0 px-6 pb-4 pt-6 text-left border-b border-[var(--border)]">
          <DialogTitle className="text-base font-semibold text-[var(--text)]">基金详情</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 scrollbar-y-styled">
          {cardDialogRow && getFundCardProps ? (
            <FundCard {...getFundCardProps(cardDialogRow)} layoutMode="drawer" />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FundDetailDialog;
