'use client';

import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { Sparkles, UploadCloud, FolderOpen, ShieldCheck, ScanText, Layers, Calculator } from 'lucide-react';
import { useStorageStore, useModalStore } from '../stores';
import { Button } from '@/components/ui/button';
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

  // 支持 Ctrl+V / Command+V 剪贴板快速粘贴截图
  useEffect(() => {
    if (isScanning || !onFilesDrop) return;
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData?.files?.length) return;
      const files = Array.from(e.clipboardData.files).filter((f) => IMAGE_TYPES.includes(f.type));
      if (files.length > 0) {
        e.preventDefault();
        onFilesDrop(files);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isScanning, onFilesDrop]);

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
        className="!z-[12010] p-6 sm:p-7 max-w-[580px] w-[94vw] rounded-2xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
        onPointerDownOutside={(e) => {
          // 子弹窗（如 AI 配置）处于打开状态时，禁止因外部点击关闭截图选择弹窗
          if (useModalStore.getState().aiConfigModalOpen) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (useModalStore.getState().aiConfigModalOpen) {
            e.preventDefault();
          }
        }}
      >
        {isScanning ? (
          /* 识别进行中状态：内联呈现，无缝衔接 */
          <div className="flex flex-col items-center justify-center text-center py-3">
            <div className="relative flex justify-center mb-4">
              <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                <Spinner className="size-7 text-primary" />
              </div>
            </div>
            <DialogTitle className="font-semibold text-base mb-1.5 text-center tracking-tight">
              {isVerify ? '正在匹配与验证基金…' : '正在智能解析持仓图片…'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mb-3 text-center">
              {totalCount > 0
                ? isVerify
                  ? `已校验 ${currentCount} / ${totalCount} 只基金，正在核实净值…`
                  : `已解析 ${currentCount} / ${totalCount} 张图片，正在提取数据…`
                : '正在全力分析图片中的基金代码、金额与份额…'}
            </DialogDescription>
            {totalCount > 0 && (
              <div className="w-full mb-4 px-2">
                <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
                  <span>识别进度</span>
                  <span className="font-medium text-foreground">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-1.5" />
              </div>
            )}
            <UsageTipsCarousel />
            <Button
              type="button"
              variant="outline"
              onClick={onCancelScan}
              className="w-full mt-1 rounded-xl h-9.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-colors cursor-pointer"
            >
              终止本次识别
            </Button>
          </div>
        ) : (
          /* 初始选择状态：轻灵克制、专注上传 */
          <div className="space-y-4">
            {/* 头部标题与极简状态指示器 */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between pr-8">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
                    <ScanText className="size-4.5" />
                  </div>
                  <DialogTitle className="font-semibold text-base tracking-tight text-foreground">
                    导入持仓截图
                  </DialogTitle>
                </div>

                {/* 右侧轻量状态 Pill */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    useModalStore.setState({ aiConfigModalOpen: true });
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer shrink-0',
                    hasAiKey
                      ? 'bg-primary/10 hover:bg-primary/15 text-primary border border-primary/25 font-medium'
                      : 'bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/60'
                  )}
                  title={hasAiKey ? 'AI 大模型已就绪，点击修改配置' : '当前使用本地离线识别，点击可配置大模型 API'}
                >
                  {hasAiKey ? (
                    <>
                      <Sparkles className="size-3 text-primary shrink-0" />
                      <span className="truncate max-w-[130px]">
                        AI 增强{aiConfig.model ? ` (${aiConfig.model})` : ''}
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-3 text-emerald-500 shrink-0" />
                      <span>本地离线</span>
                      <span className="text-[10px] text-muted-foreground/80">· 配置AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* 第二行副标题：独占一整行，舒展展开，绝不截断 */}
              <DialogDescription className="text-muted-foreground text-xs leading-relaxed block text-left">
                自动提取基金代码、持仓金额、收益率与成本份额，支持批量解析。
              </DialogDescription>
            </div>

            {/* 上传拖拽核心交互区（宽敞通透、主次分明） */}
            <div
              className={cn(
                'group relative rounded-2xl border-2 border-dashed border-border/80 hover:border-primary/60 transition-all duration-200 text-center cursor-pointer p-7 sm:py-9 flex flex-col items-center justify-center overflow-hidden',
                isDragging
                  ? 'border-primary bg-primary/10 shadow-[0_0_24px_rgba(var(--primary-rgb),0.15)] scale-[1.01]'
                  : 'bg-secondary/15 hover:bg-secondary/30'
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
              {/* 背景装饰微光 */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div
                className={cn(
                  'size-13 rounded-2xl flex items-center justify-center mb-3 transition-all duration-200 shadow-sm',
                  isDragging
                    ? 'bg-primary text-primary-foreground scale-110'
                    : 'bg-primary/10 text-primary group-hover:scale-105 group-hover:bg-primary/15'
                )}
              >
                <UploadCloud className="size-6.5" />
              </div>

              <div className="text-sm font-semibold text-foreground tracking-tight mb-1">
                {isDragging ? '释放鼠标立即导入' : '点击选择 或 拖拽截图至此'}
              </div>

              <p className="text-xs text-muted-foreground mb-3.5">支持 JPG、PNG、WebP · 支持剪贴板快捷粘贴 (Ctrl+V)</p>

              {/* 核心特性微胶囊标签 */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary/60 border border-border/50">
                  <Layers className="size-3 text-primary/70" /> 多图批量合并
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary/60 border border-border/50">
                  <Calculator className="size-3 text-primary/70" /> 成本与份额还原
                </span>
              </div>
            </div>

            {/* 底部按钮栏 */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="rounded-xl h-9 px-3.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                取消
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={onPick}
                className="rounded-xl h-9 px-4 text-xs font-medium gap-1.5 shadow-sm cursor-pointer"
              >
                <FolderOpen className="size-3.5" />
                <span>选择图片</span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
