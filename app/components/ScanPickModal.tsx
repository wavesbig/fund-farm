'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useStorageStore, useModalStore } from '../stores';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import UsageTipsCarousel from './UsageTipsCarousel';
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
  scanProgress?: { stage?: string; current?: number; total?: number };
  onCancelScan?: () => void;
}

export default function ScanPickModal({
  onClose,
  onPick,
  onFilesDrop,
  isScanning = false,
  scanProgress = {},
  onCancelScan
}: ScanPickModalProps) {
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
      aria-label={isScanning ? '正在识别持仓图片' : '选择持仓截图'}
      onClick={isScanning ? undefined : onClose}
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
        {isScanning ? (
          /* 识别进行中状态：内联呈现，无缝衔接 */
          <div className="flex flex-col items-center justify-center text-center py-2">
            <div className="flex justify-center mb-4">
              <Spinner className="size-10 text-primary" />
            </div>
            <div className="font-semibold text-base mb-2">
              {scanProgress.stage === 'verify' ? '正在匹配与验证基金…' : '正在识别持仓图片…'}
            </div>
            {Number(scanProgress.total) > 0 && (
              <div className="text-muted-foreground text-xs mb-4">
                {scanProgress.stage === 'verify'
                  ? `已验证 ${scanProgress.current || 0} / ${scanProgress.total} 只基金`
                  : `已处理 ${scanProgress.current || 0} / ${scanProgress.total} 张图片`}
              </div>
            )}
            <UsageTipsCarousel />
            <Button
              type="button"
              variant="destructive"
              onClick={onCancelScan}
              className="w-full mt-2 rounded-xl h-10 font-medium"
            >
              终止识别
            </Button>
          </div>
        ) : (
          /* 初始选择状态 */
          <>
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
                <Badge
                  variant="outline"
                  className="text-primary bg-primary/10 border-primary/20 gap-1 font-normal text-xs"
                >
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
                isDragging && 'dragging border-primary bg-primary/5'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={onPick}
              role="button"
              tabIndex={0}
              aria-label="拖拽图片到此处或点击选择"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onPick?.();
                }
              }}
            >
              <div
                className={cn(
                  'text-xs leading-relaxed',
                  isDragging ? 'text-primary font-medium' : 'text-muted-foreground'
                )}
              >
                {isDragging ? '松开即可导入' : '拖拽图片到此处，或点击选择'}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-4">
              <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl h-10 px-4">
                取消
              </Button>
              <Button type="button" variant="default" onClick={onPick} className="rounded-xl h-10 px-4">
                选择图片
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
