'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useStorageStore, useModalStore } from '../stores';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function getDroppedImageFiles(dataTransfer: DataTransfer | null): File[] {
  if (!dataTransfer?.files?.length) return [];
  return Array.from(dataTransfer.files).filter((f) => IMAGE_TYPES.includes(f.type));
}

export interface ScanPickModalProps {
  onClose?: () => void;
  onPick?: () => void;
  onFilesDrop?: (files: File[]) => void;
  isScanning?: boolean;
}

export default function ScanPickModal({ onClose, onPick, onFilesDrop, isScanning }: ScanPickModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const customSettings = useStorageStore((s) => s.customSettings) || {};
  const aiConfig = customSettings.aiConfig || {};
  const hasAiKey = Boolean(aiConfig.apiKey && aiConfig.apiKey.trim());

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isScanning) setIsDragging(true);
    },
    [isScanning]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (isScanning || !onFilesDrop) return;
      const files = getDroppedImageFiles(e.dataTransfer);
      if (files.length) onFilesDrop(files);
    },
    [isScanning, onFilesDrop]
  );

  return (
    <motion.div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="选择持仓截图"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } }}
        exit={{ opacity: 0, y: -12, filter: 'blur(4px)', transition: { duration: 0.15, ease: 'easeOut' } }}
        className="glass card modal scan-pick-modal p-6 w-[440px] max-w-[92vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3 font-semibold text-base">
          <span>选择持仓截图</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => useModalStore.setState({ aiConfigModalOpen: true })}
            className="h-7 px-2.5 text-xs gap-1.5"
            title="配置通用大模型 (DeepSeek / Qwen / OpenAI 等兼容接口)"
          >
            <Sparkles className={cn('size-3.5', hasAiKey ? 'text-primary' : 'text-muted-foreground')} />
            <span>{hasAiKey ? '大模型已启用' : 'AI 接口配置'}</span>
          </Button>
        </div>

        {/* 当前解析模式标签 */}
        <div className="flex items-center gap-2 text-xs mb-3">
          <span className="text-muted-foreground">当前模式:</span>
          {hasAiKey ? (
            <Badge variant="outline" className="text-primary bg-primary/10 border-primary/20 gap-1 font-normal text-xs">
              <Sparkles className="size-3" />
              OpenAI 兼容模型 ({aiConfig.model || 'deepseek-chat'})
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-emerald-500 bg-emerald-500/10 border-emerald-500/20 font-normal text-xs"
            >
              本地规则解析 · 无限制
            </Badge>
          )}
        </div>

        <div className="text-muted-foreground text-xs leading-relaxed mb-3">
          从相册选择一张或多张持仓截图，系统将自动识别提取其中的
          <span className="text-primary font-medium mx-1">基金代码、持仓金额与收益</span>，并支持批量导入。
        </div>

        <div
          className={cn(
            'scan-pick-dropzone p-5 rounded-xl border border-dashed border-border/80 transition-[background-color,border-color,color] duration-150 ease-out text-center cursor-pointer mb-3',
            isDragging && 'dragging border-primary bg-primary/5',
            isScanning && 'cursor-not-allowed opacity-50 pointer-events-none'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!isScanning ? onPick : undefined}
          role="button"
          tabIndex={0}
          aria-label="拖拽图片到此处或点击选择"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!isScanning) onPick?.();
            }
          }}
        >
          <div
            className={cn('text-xs leading-relaxed', isDragging ? 'text-primary font-medium' : 'text-muted-foreground')}
          >
            {isDragging ? '松开即可导入' : '拖拽图片到此处，或点击选择'}
          </div>
        </div>

        <div className="flex justify-end gap-2.5 mt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl h-10 px-4">
            取消
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={onPick}
            disabled={isScanning}
            className="rounded-xl h-10 px-4"
          >
            {isScanning ? '处理中…' : '选择图片'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
