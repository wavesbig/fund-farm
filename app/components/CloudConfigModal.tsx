'use client';

import * as React from 'react';
import { useState } from 'react';
import { Cloud, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ConfirmModal from './ConfirmModal';
import { cn } from '@/lib/utils';

export interface CloudConfigModalProps {
  onConfirm?: () => void;
  onCancel?: () => void;
  type?: 'empty' | 'conflict';
}

export default function CloudConfigModal({ onConfirm, onCancel, type = 'empty' }: CloudConfigModalProps) {
  const [pendingAction, setPendingAction] = useState<'local' | 'cloud' | null>(null);
  const isConflict = type === 'conflict';

  const handlePrimaryClick = () => {
    if (isConflict) {
      setPendingAction('local');
    } else {
      onConfirm?.();
    }
  };

  const handleSecondaryClick = () => {
    if (isConflict) {
      setPendingAction('cloud');
    } else {
      onCancel?.();
    }
  };

  const handleConfirmModalCancel = () => {
    setPendingAction(null);
  };

  const handleConfirmModalConfirm = () => {
    if (pendingAction === 'local') {
      onConfirm?.();
    } else if (pendingAction === 'cloud') {
      onCancel?.();
    }
    setPendingAction(null);
  };

  const confirmTitle = pendingAction === 'local' ? '确认使用本地配置覆盖云端？' : '确认使用云端配置覆盖本地？';

  const confirmMessage =
    pendingAction === 'local'
      ? '此操作会将当前本地配置同步到云端，覆盖云端原有配置，且可能无法恢复，请谨慎操作。'
      : '此操作会使用云端配置覆盖当前本地配置，导致本地修改丢失，且可能无法恢复，请谨慎操作。';

  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open && !isConflict) onCancel?.();
        }}
      >
        <DialogContent
          className="max-w-[440px] w-[92vw] p-0 gap-0 overflow-hidden rounded-2xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl z-[99]"
          showCloseButton={!isConflict}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="px-6 py-4.5 border-b border-border/60 shrink-0 text-left bg-muted/10">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'size-9 rounded-xl flex items-center justify-center shrink-0 border shadow-xs',
                  isConflict
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    : 'bg-primary/10 text-primary border-primary/20'
                )}
              >
                {isConflict ? <AlertTriangle className="size-5" /> : <Cloud className="size-5" />}
              </div>
              <div>
                <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                  {isConflict ? '发现配置冲突' : '云端暂无配置'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {isConflict ? '检测到本地配置与云端不一致，请选择保留方案' : '检测到云端尚无配置记录，是否立即同步？'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 flex flex-col gap-3">
            <Button
              variant={isConflict ? 'outline' : 'default'}
              className="w-full h-9.5 text-xs font-medium rounded-lg cursor-pointer"
              onClick={handlePrimaryClick}
            >
              {isConflict ? '保留本地配置 (覆盖云端)' : '同步本地到云端'}
            </Button>
            <Button
              variant={isConflict ? 'default' : 'ghost'}
              className="w-full h-9.5 text-xs font-medium rounded-lg cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={handleSecondaryClick}
            >
              {isConflict ? '使用云端配置 (覆盖本地)' : '暂不同步'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {pendingAction && (
        <ConfirmModal
          title={confirmTitle}
          message={confirmMessage}
          onConfirm={handleConfirmModalConfirm}
          onCancel={handleConfirmModalCancel}
          confirmText="确认覆盖"
          icon={<Cloud className="size-5" />}
          confirmVariant="danger"
        />
      )}
    </>
  );
}
