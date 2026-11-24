'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export interface UpdatePromptModalProps {
  updateContent?: string;
  open: boolean;
  onClose?: () => void;
  onRefresh?: () => void;
}

export default function UpdatePromptModal({ updateContent, open, onClose, onRefresh }: UpdatePromptModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent
        className="glass card modal max-w-[420px] w-[90vw] p-5 gap-0 flex flex-col z-[200]"
        showCloseButton={false}
        role="dialog"
        aria-modal="true"
        aria-label="更新提示"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 mb-3 text-base font-semibold">
            <Sparkles className="size-5 text-emerald-500 shrink-0" />
            <span>更新提示</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            检测到新版本，是否刷新浏览器以更新？
            <br />
            更新内容如下：
          </p>
          {updateContent && (
            <div className="scrollbar-y-styled bg-secondary/40 p-3 rounded-lg text-xs leading-relaxed max-h-[200px] overflow-y-auto whitespace-pre-wrap border border-border/60">
              {updateContent}
            </div>
          )}
        </div>

        <div className="pt-3 mt-1 border-t border-border flex items-center justify-end gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 px-4 text-xs font-medium bg-muted/30 border-border hover:bg-muted/60 text-foreground cursor-pointer"
          >
            取消
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={onRefresh}
            className="h-9 px-4.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
          >
            刷新浏览器
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
