'use client';

import * as React from 'react';
import { Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import AiConfigSection from './AiConfigSection';

export interface AiConfigModalProps {
  onClose: () => void;
}

export default function AiConfigModal({ onClose }: AiConfigModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[620px] w-[95vw] p-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl z-[99]"
        showCloseButton={true}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0 text-left bg-card">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-xs">
              <Sparkles className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                AI 大模型配置
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                配置兼容 OpenAI 格式的大模型，启用持仓智能截图识别
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto scrollbar-y-styled">
          <AiConfigSection showImmediateSaveButton={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
