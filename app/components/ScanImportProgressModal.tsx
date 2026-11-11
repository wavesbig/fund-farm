'use client';

import * as React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export interface ScanImportProgress {
  current?: number;
  total?: number;
  success?: number;
  failed?: number;
}

export interface ScanImportProgressModalProps {
  scanImportProgress: ScanImportProgress;
}

export default function ScanImportProgressModal({ scanImportProgress }: ScanImportProgressModalProps) {
  const total = Number(scanImportProgress.total) || 0;
  const current = Number(scanImportProgress.current) || 0;
  const progressPercent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <Dialog open>
      <DialogContent
        overlayClassName="!z-[12000]"
        showCloseButton={false}
        className="!z-[12010] w-[340px] max-w-[92vw] p-6 text-center rounded-2xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl"
      >
        <div className="flex justify-center mb-4">
          <Spinner className="size-10 text-primary" />
        </div>
        <DialogTitle className="font-semibold text-base mb-1 text-center">正在导入基金…</DialogTitle>
        {total > 0 && (
          <DialogDescription className="text-muted-foreground text-xs mb-3 text-center">
            进度 {current} / {total}
          </DialogDescription>
        )}
        {total > 0 && (
          <div className="w-full mb-3">
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        )}
        <div className="text-muted-foreground text-xs leading-relaxed">
          成功 {scanImportProgress.success ?? 0}，失败 {scanImportProgress.failed ?? 0}
        </div>
      </DialogContent>
    </Dialog>
  );
}
