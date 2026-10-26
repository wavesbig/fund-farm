'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Settings, RotateCcw } from 'lucide-react';
import { useIsMobile } from '@/app/hooks/useIsMobile';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import ConfirmModal from './ConfirmModal';
import AiConfigSection from './AiConfigSection';
import { cn } from '@/lib/utils';

export interface SettingsModalProps {
  onClose: () => void;
  tempSeconds: number;
  setTempSeconds?: (sec: number) => void;
  saveSettings: (
    e: React.MouseEvent | React.FormEvent,
    seconds: number,
    showMarketIndex: boolean,
    showGroupFundSearch: boolean,
    isMobile: boolean,
    dynamicStyle: boolean,
    containerWidth: number,
    showGroupDropdown: boolean,
    aiConfig?: any
  ) => void;
  exportLocalData: () => void;
  importFileRef: React.RefObject<HTMLInputElement | null>;
  handleImportFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  importMsg?: string;
  containerWidth?: number;
  setContainerWidth?: (width: number) => void;
  onResetContainerWidth?: () => void;
  showMarketIndexPc?: boolean;
  showMarketIndexMobile?: boolean;
  showGroupFundSearchPc?: boolean;
  showGroupFundSearchMobile?: boolean;
  dynamicStylePc?: boolean;
  dynamicStyleMobile?: boolean;
  showGroupDropdownPc?: boolean;
  showGroupDropdownMobile?: boolean;
}

export default function SettingsModal({
  onClose,
  tempSeconds,
  saveSettings,
  exportLocalData,
  importFileRef,
  handleImportFileChange,
  importMsg,
  containerWidth = 1200,
  setContainerWidth,
  onResetContainerWidth,
  showMarketIndexPc = true,
  showMarketIndexMobile = true,
  showGroupFundSearchPc = true,
  showGroupFundSearchMobile = true,
  dynamicStylePc = true,
  dynamicStyleMobile = true,
  showGroupDropdownPc = false,
  showGroupDropdownMobile = false
}: SettingsModalProps) {
  const isMobile = useIsMobile();
  const aiConfigRef = useRef<any>(null);
  const [sliderDragging, setSliderDragging] = useState(false);
  const sliderDraggingRef = useRef(false);
  const [resetWidthConfirmOpen, setResetWidthConfirmOpen] = useState(false);
  const [localSeconds, setLocalSeconds] = useState(tempSeconds);
  const [localShowMarketIndexPc, setLocalShowMarketIndexPc] = useState(showMarketIndexPc);
  const [localShowMarketIndexMobile, setLocalShowMarketIndexMobile] = useState(showMarketIndexMobile);
  const [localShowGroupFundSearchPc, setLocalShowGroupFundSearchPc] = useState(showGroupFundSearchPc);
  const [localShowGroupFundSearchMobile, setLocalShowGroupFundSearchMobile] = useState(showGroupFundSearchMobile);
  const [localDynamicStylePc, setLocalDynamicStylePc] = useState(dynamicStylePc);
  const [localDynamicStyleMobile, setLocalDynamicStyleMobile] = useState(dynamicStyleMobile);
  const [localShowGroupDropdownPc, setLocalShowGroupDropdownPc] = useState(showGroupDropdownPc);
  const [localShowGroupDropdownMobile, setLocalShowGroupDropdownMobile] = useState(showGroupDropdownMobile);
  const [localContainerWidth, setLocalContainerWidth] = useState(containerWidth);
  const pageWidthTrackRef = useRef<HTMLDivElement>(null);
  const [viewWidth, setViewWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const maxWidth = Math.max(viewWidth, 2000);

  useEffect(() => {
    const update = () => setViewWidth(window.innerWidth);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const clampedWidth = Math.min(maxWidth, Math.max(600, Number(localContainerWidth) || 1200));
  const widthRange = Math.max(1, maxWidth - 600);
  const pageWidthPercent = ((clampedWidth - 600) / widthRange) * 100;

  const updateWidthByClientX = (clientX: number) => {
    if (!pageWidthTrackRef.current || !setContainerWidth) return;
    const rect = pageWidthTrackRef.current.getBoundingClientRect();
    if (!rect.width) return;
    const ratio = (clientX - rect.left) / rect.width;
    const clampedRatio = Math.min(1, Math.max(0, ratio));
    const rawWidth = 600 + clampedRatio * Math.max(0, maxWidth - 600);
    const snapped = Math.round(rawWidth / 10) * 10;
    setLocalContainerWidth(snapped);
    setContainerWidth(snapped);
  };

  useEffect(() => {
    if (!sliderDragging) return;
    const onPointerUp = () => {
      sliderDraggingRef.current = false;
      setSliderDragging(false);
    };
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
    return () => {
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
    };
  }, [sliderDragging]);

  useEffect(() => {
    setLocalSeconds(tempSeconds);
  }, [tempSeconds]);

  useEffect(() => {
    setLocalShowMarketIndexPc(showMarketIndexPc);
  }, [showMarketIndexPc]);

  useEffect(() => {
    setLocalShowMarketIndexMobile(showMarketIndexMobile);
  }, [showMarketIndexMobile]);

  useEffect(() => {
    setLocalShowGroupFundSearchPc(showGroupFundSearchPc);
  }, [showGroupFundSearchPc]);

  useEffect(() => {
    setLocalShowGroupFundSearchMobile(showGroupFundSearchMobile);
  }, [showGroupFundSearchMobile]);

  useEffect(() => {
    setLocalDynamicStylePc(dynamicStylePc);
  }, [dynamicStylePc]);

  useEffect(() => {
    setLocalDynamicStyleMobile(dynamicStyleMobile);
  }, [dynamicStyleMobile]);

  useEffect(() => {
    setLocalShowGroupDropdownPc(showGroupDropdownPc);
  }, [showGroupDropdownPc]);

  useEffect(() => {
    setLocalShowGroupDropdownMobile(showGroupDropdownMobile);
  }, [showGroupDropdownMobile]);

  useEffect(() => {
    setLocalContainerWidth(containerWidth);
  }, [containerWidth]);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose?.();
      }}
    >
      <DialogContent
        overlayClassName={cn('modal-overlay z-[9999]', sliderDragging && 'modal-overlay-translucent')}
        className="!p-0 z-[10000] max-w-[540px] w-[94vw]"
        showCloseButton={false}
      >
        <div className="glass card modal max-h-[85vh] overflow-y-auto p-5 scrollbar-y-styled">
          <div className="title flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5 font-semibold text-lg text-foreground">
              <Settings className="w-5 h-5 text-primary" />
              <DialogTitle asChild>
                <span>设置</span>
              </DialogTitle>
            </div>
          </div>

          {/* 刷新频率 */}
          <div className="form-group mb-4">
            <div className="text-xs text-[var(--muted)] mb-2 font-medium">刷新频率</div>
            <div className="flex flex-wrap gap-2 mb-2.5">
              {[30, 60, 120, 300].map((s) => {
                const isActive = localSeconds === s;
                return (
                  <Button
                    key={s}
                    type="button"
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 px-3 text-xs tabular-nums"
                    onClick={() => setLocalSeconds(s)}
                    aria-pressed={isActive}
                  >
                    {s} 秒
                  </Button>
                );
              })}
            </div>
            <Input
              type="number"
              inputMode="numeric"
              min="30"
              step="5"
              value={localSeconds || ''}
              onChange={(e) => setLocalSeconds(Number(e.target.value))}
              placeholder="自定义秒数"
              className="h-9 text-[16PX] md:text-sm bg-black/20"
            />
            {localSeconds < 30 && <div className="text-[var(--danger)] text-xs mt-1.5">最小 30 秒</div>}
          </div>

          {/* 页面宽度 (PC端) */}
          {!isMobile && setContainerWidth && (
            <div className="form-group mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="text-xs text-[var(--muted)] font-medium">页面宽度</div>
                {onResetContainerWidth && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 p-0 text-[var(--muted)] hover:text-foreground"
                        onClick={() => setResetWidthConfirmOpen(true)}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>重置页面宽度</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div
                  ref={pageWidthTrackRef}
                  className="group relative flex-1 h-3.5 cursor-pointer flex items-center"
                  onPointerDown={(e) => {
                    sliderDraggingRef.current = true;
                    setSliderDragging(true);
                    updateWidthByClientX(e.clientX);
                    e.currentTarget.setPointerCapture?.(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    if (!sliderDraggingRef.current) return;
                    updateWidthByClientX(e.clientX);
                  }}
                >
                  <Progress
                    value={pageWidthPercent}
                    indicatorClassName="!bg-none bg-[var(--primary)] dark:bg-[var(--primary)] !transition-none"
                  />
                  <div
                    className="pointer-events-none absolute top-1/2 -translate-y-1/2"
                    style={{ left: `${pageWidthPercent}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="h-3 w-3 rounded-full bg-primary shadow-md shadow-primary/40" />
                  </div>
                </div>
                <span className="text-xs text-[var(--muted)] min-w-[48px] text-right tabular-nums">
                  {clampedWidth}px
                </span>
              </div>
            </div>
          )}

          {/* 切换选项 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="form-group mb-0">
              <div className="text-xs text-[var(--muted)] mb-2 font-medium">显示大盘指数</div>
              <div className="flex items-center">
                <Switch
                  checked={isMobile ? localShowMarketIndexMobile : localShowMarketIndexPc}
                  onCheckedChange={(checked) => {
                    const nextValue = Boolean(checked);
                    if (isMobile) setLocalShowMarketIndexMobile(nextValue);
                    else setLocalShowMarketIndexPc(nextValue);
                  }}
                  aria-label="显示大盘指数"
                />
              </div>
            </div>

            <div className="form-group mb-0">
              <div className="text-xs text-[var(--muted)] mb-2 font-medium">显示分组内基金搜索</div>
              <div className="flex items-center">
                <Switch
                  checked={isMobile ? localShowGroupFundSearchMobile : localShowGroupFundSearchPc}
                  onCheckedChange={(checked) => {
                    const nextValue = Boolean(checked);
                    if (isMobile) setLocalShowGroupFundSearchMobile(nextValue);
                    else setLocalShowGroupFundSearchPc(nextValue);
                  }}
                  aria-label="显示分组内基金搜索"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="form-group mb-0">
              <div className="text-xs text-[var(--muted)] mb-2 font-medium">减少动态样式效果</div>
              <div className="flex items-center">
                <Switch
                  checked={isMobile ? !localDynamicStyleMobile : !localDynamicStylePc}
                  onCheckedChange={(checked) => {
                    const nextValue = !checked;
                    if (isMobile) setLocalDynamicStyleMobile(nextValue);
                    else setLocalDynamicStylePc(nextValue);
                  }}
                  aria-label="减少动态样式效果"
                />
              </div>
            </div>

            <div className="form-group mb-0">
              <div className="text-xs text-[var(--muted)] mb-2 font-medium">下拉形式展示分组</div>
              <div className="flex items-center">
                <Switch
                  checked={isMobile ? localShowGroupDropdownMobile : localShowGroupDropdownPc}
                  onCheckedChange={(checked) => {
                    const nextValue = Boolean(checked);
                    if (isMobile) setLocalShowGroupDropdownMobile(nextValue);
                    else setLocalShowGroupDropdownPc(nextValue);
                  }}
                  aria-label="下拉形式展示分组"
                />
              </div>
            </div>
          </div>

          {/* AI 配置区域 */}
          <AiConfigSection
            onAiConfigChange={(cfg) => {
              aiConfigRef.current = cfg;
            }}
            showImmediateSaveButton={true}
          />

          {/* 数据导入导出 */}
          <div className="form-group mb-4">
            <div className="text-xs text-[var(--muted)] mb-2 font-medium">数据备份与迁移</div>
            <div className="flex gap-2.5">
              <Button type="button" variant="outline" className="flex-1 h-9 text-xs" onClick={exportLocalData}>
                导出本地配置
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-9 text-xs"
                onClick={() => importFileRef.current?.click?.()}
              >
                导入本地配置
              </Button>
            </div>
            <input
              ref={importFileRef}
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={handleImportFileChange}
            />
            {importMsg && <div className="text-xs text-[var(--muted)] mt-2">{importMsg}</div>}
          </div>

          {/* 底部保存按钮 */}
          <div className="flex justify-end mt-5 pt-3 border-t border-[var(--border)]">
            <Button
              className="w-full h-10 font-medium"
              onClick={(e) =>
                saveSettings(
                  e,
                  localSeconds,
                  isMobile ? localShowMarketIndexMobile : localShowMarketIndexPc,
                  isMobile ? localShowGroupFundSearchMobile : localShowGroupFundSearchPc,
                  isMobile,
                  isMobile ? localDynamicStyleMobile : localDynamicStylePc,
                  localContainerWidth,
                  isMobile ? localShowGroupDropdownMobile : localShowGroupDropdownPc,
                  aiConfigRef.current
                )
              }
              disabled={localSeconds < 30}
            >
              保存并关闭
            </Button>
          </div>
        </div>

        {resetWidthConfirmOpen && onResetContainerWidth && (
          <ConfirmModal
            title="重置页面宽度"
            message="是否重置页面宽度为默认值 1200px？"
            icon={<RotateCcw className="w-5 h-5 shrink-0 text-primary" />}
            confirmVariant="primary"
            onConfirm={() => {
              onResetContainerWidth();
              setLocalContainerWidth(1200);
              setResetWidthConfirmOpen(false);
            }}
            onCancel={() => setResetWidthConfirmOpen(false)}
            confirmText="重置"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
