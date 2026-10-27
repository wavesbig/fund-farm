'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import UsageTipsCarousel from './UsageTipsCarousel';
import { Button } from '@/components/ui/button';

export interface SuccessModalProps {
  message: string;
  onClose: () => void;
  overlayStyle?: React.CSSProperties;
  cardStyle?: React.CSSProperties;
}

export default function SuccessModal({ message, onClose, overlayStyle, cardStyle }: SuccessModalProps) {
  return (
    <motion.div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="成功提示"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: 'none' }}
      style={{ pointerEvents: 'auto', ...overlayStyle }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="max-w-[420px] w-[92vw] p-6 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl text-left"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        style={{ pointerEvents: 'auto', ...cardStyle }}
      >
        <div className="text-center py-2">
          <div className="size-12 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mx-auto shadow-xs mb-3.5">
            <CheckCircle2 className="size-6" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">{message}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 mb-4 leading-relaxed">
            操作已成功完成，您可以继续使用。
          </p>
          <UsageTipsCarousel style={{ marginBottom: 0 }} />
          <Button
            type="button"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-full mt-5 h-9.5 text-xs font-medium rounded-lg shadow-xs cursor-pointer"
          >
            完成并关闭
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
