'use client';

import * as React from 'react';
import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star, Github, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { storageStore } from '@/app/stores/storageStore';

export interface StarGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GITHUB_REPO_URL = 'https://github.com/wavesbig/fund-farm';

export default function StarGuideModal({ open, onOpenChange }: StarGuideModalProps) {
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
    <motion.aside
      role="complementary"
      aria-label="Star 引导提示"
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.95 }}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[60] w-[calc(100vw-2rem)] sm:w-[320px] p-3.5 rounded-2xl glass card border border-border/80 shadow-2xl backdrop-blur-md text-left overflow-hidden select-none"
    >
      {/* 顶部行：图标 + 标题 + 关闭 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="size-6 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
            <Star className="size-3.5 text-amber-400 fill-amber-400" />
          </div>
          <span className="font-semibold text-xs text-foreground truncate">喜欢养基场吗？</span>
          <Sparkles className="size-3 text-amber-300 animate-pulse shrink-0" />
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="size-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer shrink-0"
          title="关闭"
          aria-label="关闭提示"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* 简要说明文字 */}
      <p className="text-[11px] text-muted-foreground mt-2 mb-3 leading-relaxed">
        养基场是一款完全开源免费的基金管理工具。如果它对你有帮助，不妨在 GitHub 点个 Star 支持我们～
      </p>

      {/* 底部紧凑按钮操作 */}
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
        >
          稍后再说
        </Button>

        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={handleGoToStar}
          className="h-7 px-3 text-[11px] font-medium rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs bg-amber-500 hover:bg-amber-600 text-white border-0 transition-colors"
        >
          <Github className="size-3" />
          <span>点亮 Star ⭐</span>
        </Button>
      </div>
    </motion.aside>
  );
}
