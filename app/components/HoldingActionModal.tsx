'use client';

import * as React from 'react';
import { useEffect, useRef } from 'react';
import { History, Settings2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export interface HoldingActionFund {
  code: string;
  name?: string;
  [key: string]: any;
}

export type HoldingActionType = 'buy' | 'sell' | 'dca' | 'convert' | 'dividend' | 'edit' | 'clear' | 'history';

export interface HoldingActionModalProps {
  fund: HoldingActionFund | null;
  onClose?: () => void;
  onAction: (action: HoldingActionType) => void;
  hasHistory?: boolean;
  pendingCount?: number;
  groupName?: string;
  nestedModalOpen?: boolean;
}

export default function HoldingActionModal({
  fund,
  onClose,
  onAction,
  hasHistory = false,
  pendingCount = 0,
  groupName,
  nestedModalOpen = false
}: HoldingActionModalProps) {
  const ignoreDialogCloseUntilRef = useRef<number>(0);
  const prevNestedModalOpenRef = useRef<boolean>(false);

  useEffect(() => {
    if (nestedModalOpen) {
      ignoreDialogCloseUntilRef.current = Date.now() + 1200;
    } else if (prevNestedModalOpenRef.current) {
      ignoreDialogCloseUntilRef.current = Date.now() + 1200;
    }
    prevNestedModalOpenRef.current = nestedModalOpen;
  }, [nestedModalOpen]);

  const handleOpenChange = (open: boolean) => {
    if (!open && (nestedModalOpen || Date.now() < ignoreDialogCloseUntilRef.current)) return;
    if (!open) {
      onClose?.();
    }
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="glass card modal max-w-[320px] !z-[99] p-5"
        overlayClassName="modal-overlay"
        onPointerDownOutside={(event) => {
          if (nestedModalOpen || Date.now() < ignoreDialogCloseUntilRef.current) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (nestedModalOpen || Date.now() < ignoreDialogCloseUntilRef.current) event.preventDefault();
        }}
      >
        <DialogTitle className="sr-only">持仓操作</DialogTitle>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            <span className="font-semibold text-base text-foreground">持仓操作</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onAction('history')}
                  className="h-7 px-2.5 text-xs flex items-center gap-1 relative bg-muted/30 border-border hover:bg-muted/60 text-foreground"
                >
                  <History className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>交易记录</span>
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-background" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>查看交易记录</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-center mb-5">
          <div className="font-semibold text-base mb-1 flex items-center justify-center gap-2 flex-wrap">
            <span className="text-foreground">{fund?.name}</span>
            {groupName ? (
              <Badge variant="outline" className="text-xs font-normal text-muted-foreground bg-white/5 border-border">
                {groupName}
              </Badge>
            ) : null}
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">#{fund?.code}</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onAction('buy')}
            className="bg-primary/10 border-primary/25 text-primary hover:bg-primary/20 hover:border-primary/40 text-sm font-medium h-9 transition-colors"
          >
            加仓
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onAction('sell')}
            className="bg-destructive/10 border-destructive/25 text-destructive hover:bg-destructive/20 hover:border-destructive/40 text-sm font-medium h-9 transition-colors"
          >
            减仓
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onAction('dca')}
            className="dca-btn text-sm font-medium h-9 transition-colors"
          >
            定投
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onAction('convert')}
            className="bg-accent/10 border-accent/25 text-accent hover:bg-accent/20 hover:border-accent/40 text-sm font-medium h-9 transition-colors"
          >
            转换
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onAction('dividend')}
            className="col-span-2 bg-amber-500/10 border-amber-500/25 text-amber-500 dark:text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/40 text-sm font-medium h-9 transition-colors"
          >
            分红方式
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onAction('edit')}
            className="col-span-2 bg-muted/30 border-border text-foreground hover:bg-muted/60 text-sm font-medium h-9 transition-colors"
          >
            编辑持仓
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => onAction('clear')}
            className="col-span-2 mt-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 font-medium h-9 shadow-sm hover:shadow transition-all"
          >
            清空持仓
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
