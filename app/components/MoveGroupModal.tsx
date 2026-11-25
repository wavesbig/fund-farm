'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { isArray } from 'lodash';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import ConfirmModal from './ConfirmModal';
import { AlertTriangle, FolderInput, X } from 'lucide-react';
import type { FundGroup } from '@/types';

export interface MoveFundsParams {
  codes: string[];
  fromTab?: string;
  targetId: string;
  dryRun: boolean;
  overwrite: boolean;
}

export interface MoveGroupModalProps {
  open: boolean;
  onClose?: () => void;
  fromTab?: string;
  groups?: FundGroup[];
  selectedCodes?: string[];
  onMoveFunds?: (params: MoveFundsParams) => Promise<any>;
  disabled?: boolean;
}

export default function MoveGroupModal({
  open,
  onClose,
  fromTab,
  groups = [],
  selectedCodes = [],
  onMoveFunds,
  disabled = false
}: MoveGroupModalProps) {
  const [targetId, setTargetId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [confirmOverwriteOpen, setConfirmOverwriteOpen] = useState(false);

  const isFromCustomGroup =
    !!fromTab && fromTab !== 'all' && fromTab !== 'fav' && groups.some((g) => g?.id === fromTab);

  const allowedTargets = useMemo(() => {
    const list = (groups || []).filter((g) => g?.id && g.id !== fromTab);
    if (isFromCustomGroup || fromTab === 'fav') {
      return [{ id: 'all', name: '全部' }, ...list];
    }
    return list;
  }, [groups, fromTab, isFromCustomGroup]);

  useEffect(() => {
    if (!open) return;
    setTargetId('');
    setSubmitting(false);
    setConflicts([]);
    setConfirmOverwriteOpen(false);
  }, [open]);

  const selectedCount = selectedCodes?.length || 0;
  const canSubmit = !disabled && !submitting && selectedCount > 0 && !!targetId;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await onMoveFunds?.({
        codes: selectedCodes,
        fromTab,
        targetId,
        dryRun: true,
        overwrite: false
      });
      const nextConflicts = isArray(res?.conflicts) ? res.conflicts : [];
      if (nextConflicts.length > 0) {
        setConflicts(nextConflicts);
        setConfirmOverwriteOpen(true);
        return;
      }
      await onMoveFunds?.({
        codes: selectedCodes,
        fromTab,
        targetId,
        dryRun: false,
        overwrite: false
      });
      onClose?.();
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverwriteConfirm = async () => {
    if (disabled || submitting) return;
    setSubmitting(true);
    try {
      await onMoveFunds?.({
        codes: selectedCodes,
        fromTab,
        targetId,
        dryRun: false,
        overwrite: true
      });
      setConfirmOverwriteOpen(false);
      onClose?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={!!open}
        onOpenChange={(next) => {
          if (!next) onClose?.();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="glass card modal max-w-[420px] w-[90vw] p-5 z-[100] gap-0 flex flex-col max-h-[85vh]"
          overlayClassName="modal-overlay"
          onPointerDownOutside={(event) => {
            if (confirmOverwriteOpen) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (confirmOverwriteOpen) event.preventDefault();
          }}
        >
          <DialogTitle className="sr-only">迁移到分组</DialogTitle>
          <div className="flex items-center justify-between mb-5 font-semibold text-base text-foreground">
            <div className="flex items-center gap-2">
              <FolderInput className="w-5 h-5 text-primary" />
              <span>迁移到分组</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="关闭"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-4">
            <DialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
              已选 {selectedCount} 支基金。请选择要迁移到的目标分组。
            </DialogDescription>

            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground block font-normal">目标分组</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择目标分组" />
                </SelectTrigger>
                <SelectContent className="z-[110]">
                  {allowedTargets.length === 0 ? (
                    <SelectItem value="__disabled__" disabled>
                      暂无可迁移的分组
                    </SelectItem>
                  ) : (
                    allowedTargets.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-3 mt-1 border-t border-border flex items-center justify-end gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              className="h-9 px-4 text-xs font-medium bg-muted/30 border-border hover:bg-muted/60 text-foreground cursor-pointer"
              onClick={onClose}
              disabled={submitting}
            >
              取消
            </Button>
            <Button
              type="button"
              variant="default"
              className="h-9 px-4.5 text-xs font-medium bg-primary text-primary-foreground shadow-xs cursor-pointer disabled:opacity-40"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {submitting ? '处理中...' : '确认迁移'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {confirmOverwriteOpen && (
        <ConfirmModal
          title="覆盖确认"
          message={`目标分组已存在 ${conflicts.length} 支基金的持仓数据。继续迁移将覆盖目标分组的持仓数据，是否继续？`}
          icon={<AlertTriangle className="size-5 shrink-0 text-destructive" aria-hidden />}
          confirmVariant="danger"
          confirmText="继续迁移"
          onCancel={() => setConfirmOverwriteOpen(false)}
          onConfirm={handleOverwriteConfirm}
        />
      )}
    </>
  );
}
