'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

  const isDanger = confirmVariant === 'danger';
  const isPrimary = confirmVariant === 'primary';

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        overlayClassName="!z-[12000]"
        showCloseButton={false}
        className="!z-[12010] max-w-[420px] w-[92vw] p-5 sm:p-6 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl flex flex-col gap-4 text-left"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-row items-center gap-3 text-left space-y-0">
          <div
            className={cn(
              'size-10 rounded-xl flex items-center justify-center shrink-0 border shadow-xs',
              isDanger && 'bg-destructive/10 text-destructive border-destructive/20',
              isPrimary && 'bg-primary/10 text-primary border-primary/20',
              !isDanger && !isPrimary && 'bg-muted/30 text-muted-foreground border-border/50'
            )}
          >
            {icon || <Trash2 className="size-5" />}
          </div>
          <DialogTitle className="flex-1 text-base font-semibold tracking-tight text-foreground truncate">
            {title}
          </DialogTitle>
        </DialogHeader>

        <DialogDescription asChild>
          <div className="text-left text-xs sm:text-sm leading-relaxed text-muted-foreground pl-0.5">
            {messageContent || message}
          </div>
        </DialogDescription>

        <DialogFooter className="flex flex-row items-center justify-end gap-2.5 pt-2 sm:pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs font-medium text-muted-foreground hover:text-foreground h-9 px-4 rounded-lg cursor-pointer"
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
            size="sm"
            className="text-xs font-medium h-9 px-4.5 rounded-lg shadow-xs cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
