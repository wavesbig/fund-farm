'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TrashIcon } from './Icons';

export interface ConfirmModalProps {
  title: string;
  message?: string;
  messageContent?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  icon?: React.ReactNode;
  confirmVariant?: 'danger' | 'primary' | 'secondary';
}

export default function ConfirmModal({
  title,
  message,
  messageContent,
  onConfirm,
  onCancel,
  confirmText = '确定删除',
  icon,
  confirmVariant = 'danger'
}: ConfirmModalProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) onCancel();
  };

  const buttonVariant =
    confirmVariant === 'primary' ? 'default' : confirmVariant === 'secondary' ? 'secondary' : 'destructive';

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        overlayClassName="!z-[12000]"
        showCloseButton={false}
        className="!z-[12010] max-w-[400px] flex flex-col gap-5 p-6"
      >
        <DialogHeader className="flex flex-row items-center gap-3 text-left">
          {icon || <TrashIcon width="20" height="20" className="shrink-0 text-[var(--danger)]" />}
          <DialogTitle className="flex-1 text-base font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription asChild>
          <div className="text-left text-sm leading-relaxed text-[var(--muted-foreground)]">
            {messageContent || message}
          </div>
        </DialogDescription>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="min-w-0 flex-1 cursor-pointer h-auto min-h-[48px] py-3 sm:h-11 sm:min-h-0 sm:py-0 rounded-xl"
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
          >
            取消
          </Button>
          <Button
            type="button"
            variant={buttonVariant}
            className="min-w-0 flex-1 cursor-pointer h-auto min-h-[48px] py-3 sm:h-11 sm:min-h-0 sm:py-0 rounded-xl"
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
