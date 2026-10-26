'use client';

import * as React from 'react';
import { useState } from 'react';
import { Cloud, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ConfirmModal from './ConfirmModal';

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
          className="glass card modal max-w-[420px] w-[90vw] z-[99]"
          overlayClassName="modal-overlay"
          showCloseButton={!isConflict}
        >
          <DialogTitle asChild>
            <div className="flex items-center gap-2.5 font-semibold text-lg text-foreground mb-2">
              {isConflict ? (
                <AlertTriangle className="w-5 h-5 text-[var(--danger)]" />
              ) : (
                <Cloud className="w-5 h-5 text-primary" />
              )}
              <span>{isConflict ? '发现配置冲突' : '云端暂无配置'}</span>
            </div>
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-[var(--muted)] mb-5">
            {isConflict ? '检测到本地配置与云端不一致，请选择操作：' : '是否将本地配置同步到云端？'}
          </DialogDescription>
          <div className="flex flex-col gap-3">
            <Button
              variant={isConflict ? 'outline' : 'default'}
              className="w-full h-10 font-medium"
              onClick={handlePrimaryClick}
            >
              {isConflict ? '保留本地 (覆盖云端)' : '同步本地到云端'}
            </Button>
            <Button
              variant={isConflict ? 'default' : 'secondary'}
              className="w-full h-10 font-medium"
              onClick={handleSecondaryClick}
            >
              {isConflict ? '使用云端 (覆盖本地)' : '暂不同步'}
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
          icon={<Cloud className="w-5 h-5 text-[var(--danger)]" />}
          confirmVariant="danger"
        />
      )}
    </>
  );
}
