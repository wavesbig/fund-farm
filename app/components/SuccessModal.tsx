'use client';

import * as React from 'react';
import { CheckCircle2 } from 'lucide-react';
import UsageTipsCarousel from './UsageTipsCarousel';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export interface SuccessModalProps {
  message: string;
  onClose: () => void;
  overlayStyle?: React.CSSProperties;
  cardStyle?: React.CSSProperties;
}

export default function SuccessModal({ message, onClose, overlayStyle, cardStyle }: SuccessModalProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        overlayClassName="!z-[12000]"
        showCloseButton={false}
        className="!z-[12010] max-w-[420px] w-[92vw] p-6 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl text-left"
        style={cardStyle}
      >
        <div className="text-center py-2">
          <div className="size-12 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mx-auto shadow-xs mb-3.5">
            <CheckCircle2 className="size-6" />
          </div>
          <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight text-foreground text-center">
            {message}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1 mb-4 leading-relaxed text-center">
            操作已成功完成，您可以继续使用。
          </DialogDescription>
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
      </DialogContent>
    </Dialog>
  );
}
