'use client';

import * as React from 'react';
import { useCallback, useRef, useEffect } from 'react';
import { Star, Github, X, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { storageStore } from '@/app/stores/storageStore';

export interface StarGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GITHUB_REPO_URL = 'https://github.com/wavesbig/fund-farm';

export default function StarGuideModal({ open, onOpenChange }: StarGuideModalProps) {
  const mountTimeRef = useRef(0);

  useEffect(() => {
    if (open) {
      mountTimeRef.current = Date.now();
    }
  }, [open]);

  const handleDismiss = useCallback(() => {
    storageStore.setItem('hasSeenStarGuide', true);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleGoToStar = useCallback(() => {
    storageStore.setItem('hasSeenStarGuide', true);
    if (typeof window !== 'undefined') {
      window.open(GITHUB_REPO_URL, '_blank', 'noopener,noreferrer');
    }
    onOpenChange(false);
  }, [onOpenChange]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="glass card modal max-w-[380px] w-[90vw] p-5 gap-0 flex flex-col z-[150] text-center relative overflow-hidden"
        overlayClassName="modal-overlay"
        onPointerDownOutside={(e) => {
          if (mountTimeRef.current > 0 && Date.now() - mountTimeRef.current < 400) {
            e.preventDefault();
            return;
          }
          handleDismiss();
        }}
        onInteractOutside={(e) => {
          if (mountTimeRef.current > 0 && Date.now() - mountTimeRef.current < 400) {
            e.preventDefault();
            return;
          }
          handleDismiss();
        }}
      >
        <DialogTitle className="sr-only">支持养基场开源</DialogTitle>

        {/* 右上角关闭按钮 */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="关闭"
          onClick={handleDismiss}
          className="absolute right-3 top-3 size-7 text-muted-foreground hover:text-foreground cursor-pointer z-10"
        >
          <X className="size-4" />
        </Button>

        {/* 顶部柔和微光与装饰图标 */}
        <div className="relative mx-auto mt-1 mb-3 flex items-center justify-center">
          <div className="absolute -inset-2 bg-amber-500/15 rounded-full blur-xl pointer-events-none" />
          <div className="size-13 rounded-2xl bg-gradient-to-br from-amber-500/20 via-primary/10 to-amber-500/5 border border-amber-500/30 flex items-center justify-center shadow-xs relative">
            <Star className="size-6 text-amber-400 fill-amber-400 drop-shadow-xs" />
            <Sparkles className="size-3 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
          </div>
        </div>

        {/* 标题与文案 */}
        <h3 className="text-base font-semibold text-foreground tracking-tight">喜欢养基场吗？</h3>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed px-1">
          养基场是一款完全免费且开源的基金管理工具。如果它对你的资产记录有帮助，不妨去 GitHub 点亮一颗 Star
          支持我们，让更多人发现它！
        </p>

        {/* 底部操作按钮 */}
        <div className="mt-5 space-y-2">
          <Button
            type="button"
            variant="default"
            onClick={handleGoToStar}
            className="w-full h-9 rounded-xl font-medium text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs bg-amber-500 hover:bg-amber-600 text-white border-0 transition-colors"
          >
            <Github className="size-3.5" />
            <span>去 GitHub 点亮 Star ⭐</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="w-full h-7.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
          >
            下次一定 / 稍后再说
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
