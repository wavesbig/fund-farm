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
        overlayClassName="modal-overlay z-[300]"
        showCloseButton={false}
        className="glass card modal max-w-[420px] w-[90vw] p-5 gap-0 flex flex-col z-[300] text-left"
        style={cardStyle}
      >
        <div className="text-center py-1">
          <div className="size-12 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mx-auto shadow-xs mb-3">
            <CheckCircle2 className="size-6" />
          </div>
          <DialogTitle className="text-base font-semibold tracking-tight text-foreground text-center">
            {message}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1 mb-3 leading-relaxed text-center">
            操作已成功完成，您可以继续使用。
          </DialogDescription>
          <UsageTipsCarousel style={{ marginBottom: 0 }} />
          <div className="pt-3 mt-3 border-t border-border flex shrink-0">
            <Button
              type="button"
              variant="default"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-full h-9 text-xs font-medium bg-primary text-primary-foreground shadow-xs cursor-pointer"
            >
              完成并关闭
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
