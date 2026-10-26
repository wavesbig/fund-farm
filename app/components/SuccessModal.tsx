'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
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
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass card modal"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        style={{ pointerEvents: 'auto', ...cardStyle }}
      >
        <div className="success-message text-center py-5">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="mb-2 font-semibold text-lg">{message}</h3>
          <p className="text-sm text-muted-foreground mb-5">操作已完成，您可以继续使用。</p>
          <UsageTipsCarousel style={{ marginBottom: 0 }} />
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-full mt-5 font-medium rounded-xl h-11"
          >
            关闭
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
