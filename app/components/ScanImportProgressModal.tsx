'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Spinner } from '@/components/ui/spinner';

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
  return (
    <motion.div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="导入进度"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass card modal w-[320px] max-w-[90vw] text-center p-6"
      >
        <div className="flex justify-center mb-4">
          <Spinner className="size-10 text-primary" />
        </div>
        <div className="font-semibold text-base mb-2">正在导入基金…</div>
        {Number(scanImportProgress.total) > 0 && (
          <div className="text-muted-foreground text-xs mb-3">
            进度 {scanImportProgress.current} / {scanImportProgress.total}
          </div>
        )}
        <div className="text-muted-foreground text-xs leading-relaxed">
          成功 {scanImportProgress.success ?? 0}，失败 {scanImportProgress.failed ?? 0}
        </div>
      </motion.div>
    </motion.div>
  );
}
