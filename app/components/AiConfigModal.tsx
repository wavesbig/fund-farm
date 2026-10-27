'use client';

import * as React from 'react';
import { Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import AiConfigSection from './AiConfigSection';

export interface AiConfigModalProps {
  onClose: () => void;
}

export default function AiConfigModal({ onClose }: AiConfigModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[560px] w-[94vw] p-0 gap-0 overflow-hidden rounded-2xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl z-[99]"
        showCloseButton={true}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 py-4 border-b border-border/60 shrink-0 text-left bg-muted/10">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-xs">
              <Sparkles className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                AI 大模型配置
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                配置兼容 OpenAI 的接口与模型，启用智能截图识别
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 sm:p-6 max-h-[72vh] overflow-y-auto scrollbar-y-styled">
          <AiConfigSection showImmediateSaveButton={false} />
        </div>

        <DialogFooter className="px-6 py-3.5 border-t border-border/60 shrink-0 bg-muted/20 flex flex-row items-center justify-end">
          <Button
            type="button"
            size="sm"
            onClick={onClose}
            className="h-9 px-5 text-xs font-medium rounded-lg shadow-xs cursor-pointer"
          >
            完成并关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
