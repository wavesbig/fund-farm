'use client';

import * as React from 'react';
import UsageTipsCarousel from './UsageTipsCarousel';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export interface ScanProgress {
  stage?: string;
  current?: number;
  total?: number;
}

export interface ScanProgressModalProps {
  scanProgress: ScanProgress;
  onCancel?: () => void;
}

export default function ScanProgressModal({ scanProgress, onCancel }: ScanProgressModalProps) {
  const isVerify = scanProgress.stage === 'verify';
  const progressPercent =
    Number(scanProgress.total) > 0
      ? Math.min(100, Math.round(((scanProgress.current || 0) / Number(scanProgress.total)) * 100))
      : 0;

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel?.()}>
      <DialogContent
        overlayClassName="!z-[12000]"
        showCloseButton={false}
        className="!z-[12010] w-[360px] max-w-[92vw] p-6 text-center rounded-2xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl"
      >
        <div className="flex justify-center mb-4">
          <Spinner className="size-10 text-primary" />
        </div>
        <DialogTitle className="font-semibold text-base mb-1 text-center">
          {isVerify ? '正在验证基金…' : '正在识别中…'}
        </DialogTitle>
        <DialogDescription className="text-muted-foreground text-xs mb-3 text-center">
          {Number(scanProgress.total) > 0
            ? isVerify
              ? `已验证 ${scanProgress.current || 0} / ${scanProgress.total} 只基金`
              : `已处理 ${scanProgress.current || 0} / ${scanProgress.total} 张图片`
            : '正在全力分析图片中的基金持仓数据…'}
        </DialogDescription>
        {Number(scanProgress.total) > 0 && (
          <div className="w-full mb-4">
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        )}
        <UsageTipsCarousel />
        <Button
          type="button"
          variant="destructive"
          onClick={onCancel}
          className="w-full mt-2 rounded-xl h-9.5 text-xs font-medium cursor-pointer"
        >
          终止识别
        </Button>
      </DialogContent>
    </Dialog>
  );
}
