'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UpdateIcon } from './Icons';

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
        className="glass card max-w-[400px] p-6"
        showCloseButton={false}
        role="dialog"
        aria-modal="true"
        aria-label="更新提示"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 mb-3 text-base font-semibold">
            <UpdateIcon width="20" height="20" className="text-emerald-500 shrink-0" />
            <span>更新提示</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mb-6">
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

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1 rounded-xl h-10">
            取消
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={onRefresh}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10"
          >
            刷新浏览器
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
