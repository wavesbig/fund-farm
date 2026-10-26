'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import UsageTipsCarousel from './UsageTipsCarousel';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

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
  return (
    <motion.div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="识别进度"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass card modal w-[340px] max-w-[90vw] text-center p-6"
      >
        <div className="flex justify-center mb-4">
          <Spinner className="size-10 text-primary" />
        </div>
        <div className="font-semibold text-base mb-2">
          {scanProgress.stage === 'verify' ? '正在验证基金…' : '正在识别中…'}
        </div>
        {Number(scanProgress.total) > 0 && (
          <div className="text-muted-foreground text-xs mb-5">
            {scanProgress.stage === 'verify'
              ? `已验证 ${scanProgress.current} / ${scanProgress.total} 只基金`
              : `已处理 ${scanProgress.current} / ${scanProgress.total} 张图片`}
          </div>
        )}
        <UsageTipsCarousel />
        <Button
          type="button"
          variant="destructive"
          onClick={onCancel}
          className="w-full mt-2 rounded-xl h-10 font-medium"
        >
          终止识别
        </Button>
      </motion.div>
    </motion.div>
  );
}
