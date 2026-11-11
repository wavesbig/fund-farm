'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { isArray, isPlainObject } from 'lodash';
import { Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { migrateDcaPlansToScoped } from '../lib/fundHelpers';
import type { Fund, FundGroup, GroupHoldingsMap, PendingTrade } from '@/types';

export interface SelectHoldingGroupModalProps {
  fund: Fund | null;
  groups?: FundGroup[];
  groupHoldings?: GroupHoldingsMap;
  dcaPlans?: any;
  pendingTrades?: PendingTrade[];
  onClose?: () => void;
  onNext?: (groupId: string) => void;
}

export default function SelectHoldingGroupModal({
  fund,
  groups = [],
  groupHoldings = {},
  dcaPlans,
  pendingTrades,
  onClose,
  onNext
}: SelectHoldingGroupModalProps) {
  const scopedDca = useMemo(() => {
    return migrateDcaPlansToScoped(dcaPlans);
  }, [dcaPlans]);

  const availableGroups = useMemo(() => {
    const code = fund?.code;
    if (!code) return [];
    return (groups || []).filter((g) => {
      if (!g?.id) return false;
      const holding = groupHoldings?.[g.id]?.[code];
      const share = Number(holding?.share);
      return Number.isFinite(share) && share >= 0;
    });
  }, [fund?.code, groups, groupHoldings]);

  const [selectedGroupId, setSelectedGroupId] = useState(() => availableGroups[0]?.id || '');

  const canNext = !!selectedGroupId;

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose?.();
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="glass card modal max-w-[420px] w-[90vw] p-6 z-[99]"
        overlayClassName="modal-overlay"
      >
        <DialogTitle className="sr-only">选择持仓分组</DialogTitle>
        <div className="flex items-center justify-between mb-5 font-semibold text-base">
          <div className="flex items-center gap-2.5">
            <span>选择持仓分组</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="关闭"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="text-center mb-4">
          <div className="font-semibold text-base mb-1">{fund?.name}</div>
          <div className="text-muted-foreground text-xs font-mono">#{fund?.code}</div>
        </div>

        <div className="group-manage-list-container scrollbar-y-styled max-h-[46vh] overflow-y-auto pr-1">
          {availableGroups.length === 0 ? (
            <div className="empty-state text-muted-foreground text-center py-8 text-sm">
              <p>暂无可操作的持仓分组</p>
            </div>
          ) : (
            <div className="group-manage-list flex flex-col gap-2">
              {availableGroups.map((group) => {
                const active = selectedGroupId === group.id;
                const code = fund?.code;
                const hasDca = isPlainObject(scopedDca) && (scopedDca as any)[group.id]?.[code || '']?.enabled === true;
                const hasPending =
                  isArray(pendingTrades) &&
                  pendingTrades.some((t) => t && t.fundCode === code && (t as any).groupId === group.id);

                return (
                  <div
                    key={group.id}
                    className={cn(
                      'group-manage-item glass flex items-center p-3 rounded-xl border border-border/60 transition-[background-color,border-color] duration-150 ease-out cursor-pointer hover:bg-accent/40',
                      active && 'border-primary/50 bg-primary/10 shadow-xs'
                    )}
                    onClick={() => setSelectedGroupId(group.id)}
                  >
                    <div
                      className={cn(
                        'size-5 rounded-md border mr-3 flex items-center justify-center transition-colors',
                        active ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-input/40'
                      )}
                    >
                      {active && <Check className="size-3.5 stroke-[3]" />}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center">
                      <span className="font-semibold text-sm leading-none">{group.name || '未命名分组'}</span>
                      {hasPending && (
                        <span className="pending-indicator ml-1.5 shrink-0 text-[10px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30">
                          待
                        </span>
                      )}
                      {hasDca && (
                        <span className="dca-indicator ml-1.5 shrink-0 text-[10px] px-1 py-0.5 rounded bg-sky-500/15 text-sky-500 border border-sky-500/30">
                          定
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1 rounded-xl h-11">
            取消
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={!canNext}
            onClick={() => {
              if (!selectedGroupId) return;
              onNext?.(selectedGroupId);
            }}
            className="flex-1 rounded-xl h-11 font-medium"
          >
            下一步
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
