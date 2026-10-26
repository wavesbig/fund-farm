'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { isArray } from 'lodash';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import ConfirmModal from './ConfirmModal';
import { AlertTriangleIcon } from './Icons';
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
          className="sm:max-w-md max-h-[88vh] flex flex-col p-0 overflow-hidden"
          onPointerDownOutside={(event) => {
            if (confirmOverwriteOpen) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (confirmOverwriteOpen) event.preventDefault();
          }}
        >
          <DialogHeader className="flex-shrink-0 px-6 pb-4 pt-6 text-left border-b border-[var(--border)]">
            <DialogTitle className="text-base font-semibold text-[var(--text)]">迁移到分组</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-4">
            <DialogDescription className="text-left text-sm leading-relaxed text-[var(--muted-foreground)]">
              已选 {selectedCount} 支基金。请选择要迁移到的分组。
            </DialogDescription>

            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium text-[var(--text)]">目标分组</div>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择目标分组" />
                </SelectTrigger>
                <SelectContent>
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
          <div className="flex-shrink-0 px-6 py-4 border-t border-[var(--border)] flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1 rounded-xl h-11"
              onClick={onClose}
              disabled={submitting}
            >
              取消
            </Button>
            <Button
              type="button"
              variant="default"
              className="flex-1 rounded-xl h-11 font-medium"
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
          icon={<AlertTriangleIcon width="20" height="20" className="shrink-0 text-[var(--danger)]" aria-hidden />}
          confirmVariant="danger"
          confirmText="继续迁移"
          onCancel={() => setConfirmOverwriteOpen(false)}
          onConfirm={handleOverwriteConfirm}
        />
      )}
    </>
  );
}
