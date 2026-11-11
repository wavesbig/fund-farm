'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { useStorageStore, useModalStore } from '../stores';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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

  const totalCount = Number(scanProgress.total) || 0;
  const currentCount = Number(scanProgress.current) || 0;
  const progressPercent = totalCount > 0 ? Math.min(100, Math.round((currentCount / totalCount) * 100)) : 0;
  const isVerify = scanProgress.stage === 'verify';

  return (
    <Dialog open onOpenChange={(open) => !open && !isScanning && onClose?.()}>
      <DialogContent
        overlayClassName="!z-[12000]"
        showCloseButton={!isScanning}
        className="!z-[12010] p-6 w-[450px] max-w-[92vw] rounded-2xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl"
      >
        {isScanning ? (
          /* 识别进行中状态：内联呈现，无缝衔接 */
          <div className="flex flex-col items-center justify-center text-center py-2">
            <div className="flex justify-center mb-4">
              <Spinner className="size-10 text-primary" />
            </div>
            <DialogTitle className="font-semibold text-base mb-1 text-center">
              {isVerify ? '正在匹配与验证基金…' : '正在识别持仓图片…'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mb-3 text-center">
              {totalCount > 0
                ? isVerify
                  ? `已验证 ${currentCount} / ${totalCount} 只基金`
                  : `已处理 ${currentCount} / ${totalCount} 张图片`
                : '正在全力分析图片中的基金持仓数据…'}
            </DialogDescription>
            {totalCount > 0 && (
              <div className="w-full mb-4">
                <Progress value={progressPercent} className="h-1.5" />
              </div>
            )}
            <UsageTipsCarousel />
            <Button
              type="button"
              variant="destructive"
              onClick={onCancelScan}
              className="w-full mt-2 rounded-xl h-9.5 text-xs font-medium cursor-pointer"
            >
              终止识别
            </Button>
          </div>
        ) : (
          /* 初始选择状态 */
          <>
            <div className="flex items-center justify-between mb-2">
              <DialogTitle className="font-semibold text-base">选择持仓截图</DialogTitle>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => useModalStore.setState({ aiConfigModalOpen: true })}
                className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer"
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

            <DialogDescription className="text-muted-foreground text-xs leading-relaxed mb-3">
              从相册选择一张或多张持仓截图，系统将自动识别提取其中的
              <span className="text-primary font-medium mx-1">基金代码、持仓金额与收益</span>，并支持批量导入。
            </DialogDescription>

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
              <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl h-9.5 px-4 text-xs">
                取消
              </Button>
              <Button type="button" variant="default" onClick={onPick} className="rounded-xl h-9.5 px-4 text-xs">
                选择图片
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
