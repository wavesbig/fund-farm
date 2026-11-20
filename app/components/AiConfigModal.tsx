'use client';

import * as React from 'react';
import { useRef, useState } from 'react';
import { Sparkles, Save, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import AiConfigSection, { type AiConfigSectionRef } from './AiConfigSection';

export interface AiConfigModalProps {
  onClose: () => void;
}

export default function AiConfigModal({ onClose }: AiConfigModalProps) {
  const sectionRef = useRef<AiConfigSectionRef>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await sectionRef.current?.save();
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (isTesting) return;
    setIsTesting(true);
    try {
      await sectionRef.current?.test();
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        overlayClassName="!z-[13000]"
        className="max-w-[580px] w-[94vw] h-[82vh] max-h-[660px] p-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl !z-[13010] flex flex-col text-left"
        showCloseButton={true}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* 固定 Header */}
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

        {/* 中间自适应滚动内容区 */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 scrollbar-y-styled">
          <AiConfigSection ref={sectionRef} showImmediateSaveButton={false} onSaved={onClose} />
        </div>

        {/* 底部固定常驻 Footer：无需滚动到底部即可直接保存与测试 */}
        <div className="px-5 py-3 border-t border-border bg-card/95 backdrop-blur-sm flex items-center justify-between shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={isTesting || isSaving}
            className="h-9 px-3.5 text-xs font-medium gap-1.5 rounded-lg border-border hover:border-primary/40 transition-colors cursor-pointer"
          >
            <RefreshCw className={isTesting ? 'size-3.5 animate-spin' : 'size-3.5'} />
            <span>{isTesting ? '正在测试…' : '测试连接'}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
              className="h-9 px-3.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              取消
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-9 px-4 text-xs font-medium gap-1.5 rounded-lg shadow-xs cursor-pointer"
            >
              <Save className="size-3.5" />
              <span>{isSaving ? '正在保存…' : '保存配置'}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
