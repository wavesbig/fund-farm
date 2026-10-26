'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import AiConfigSection from './AiConfigSection';

export interface AiConfigModalProps {
  onClose: () => void;
}

export default function AiConfigModal({ onClose }: AiConfigModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="glass card modal max-w-[480px] w-[92vw] p-5 max-h-[88vh] overflow-y-auto z-[99]"
        overlayClassName="modal-overlay"
      >
        <DialogTitle className="sr-only">通用大模型 OpenAPI 配置</DialogTitle>
        <AiConfigSection showImmediateSaveButton={true} />
        <div className="flex justify-end mt-3">
          <Button type="button" onClick={onClose} className="h-9 px-4 text-sm font-medium">
            完成并关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
