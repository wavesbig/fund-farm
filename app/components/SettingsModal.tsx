'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  Settings,
  RotateCcw,
  Sliders,
  Sparkles,
  HardDriveDownload,
  Clock,
  Maximize2,
  LineChart,
  Search,
  Zap,
  Menu,
  Download,
  Upload,
  ShieldCheck,
  X
} from 'lucide-react';
import { useIsMobile } from '@/app/hooks/useIsMobile';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

interface SettingSwitchCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel: string;
}

function SettingSwitchCard({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
  ariaLabel
}: SettingSwitchCardProps) {
  return (
    <div className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.03] dark:bg-black/20 border border-border/40 hover:border-border/70 transition-colors">
      <div className="flex items-start gap-3 flex-1 min-w-0 pr-3">
        <div className="mt-0.5 p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-foreground">{title}</div>
          <div className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{description}</div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={ariaLabel} className="shrink-0 ml-2" />
    </div>
  );
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

  const handleSave = (e: React.MouseEvent | React.FormEvent) => {
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
    );
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose?.();
      }}
    >
      <DialogContent
        overlayClassName={cn('modal-overlay z-[9999]', sliderDragging && 'modal-overlay-translucent')}
        className="!p-0 z-[10000] max-w-[620px] w-[94vw]"
        showCloseButton={false}
      >
        <div className="glass card modal p-5 max-h-[88vh] flex flex-col">
          {/* 标题栏 */}
          <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-border/40 shrink-0">
            <div className="flex items-center gap-2 font-semibold text-base text-foreground">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Settings className="w-4 h-4" />
              </div>
              <DialogTitle asChild>
                <span>偏好与系统设置</span>
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground rounded-lg"
              onClick={onClose}
              aria-label="关闭设置弹框"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* 分类标签导航 */}
          <Tabs defaultValue="general" className="w-full flex-1 flex flex-col min-h-0">
            <TabsList className="grid grid-cols-3 w-full h-10 p-1 bg-white/[0.04] dark:bg-black/30 border border-border/40 rounded-xl mb-3 shrink-0">
              <TabsTrigger
                value="general"
                className="flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-lg"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>常规界面</span>
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-lg"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>AI 大模型</span>
              </TabsTrigger>
              <TabsTrigger
                value="data"
                className="flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-lg"
              >
                <HardDriveDownload className="w-3.5 h-3.5" />
                <span>数据备份</span>
              </TabsTrigger>
            </TabsList>

            {/* 可滚动内容区域 */}
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-y-styled">
              {/* ===== TAB 1: 常规界面 ===== */}
              <TabsContent value="general" className="space-y-4 focus-visible:outline-none mt-0">
                {/* 刷新频率 */}
                <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.03] dark:bg-black/20 border border-border/40">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>数据自动刷新频率</span>
                    </label>
                    <span className="text-xs text-muted-foreground font-mono tabular-nums">
                      当前: {localSeconds} 秒
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[30, 60, 120, 300].map((s) => {
                      const isActive = localSeconds === s;
                      return (
                        <Button
                          key={s}
                          type="button"
                          variant={isActive ? 'default' : 'outline'}
                          size="sm"
                          className="h-8 text-xs font-medium tabular-nums rounded-lg"
                          onClick={() => setLocalSeconds(s)}
                          aria-pressed={isActive}
                        >
                          {s} 秒
                        </Button>
                      );
                    })}
                  </div>
                  <div className="pt-1">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="30"
                      step="5"
                      value={localSeconds || ''}
                      onChange={(e) => setLocalSeconds(Number(e.target.value))}
                      placeholder="自定义秒数（例如 45）"
                      className="h-9 text-[16PX] md:text-sm bg-black/20"
                    />
                    {localSeconds < 30 && <p className="text-destructive text-xs mt-1">最低刷新频率为 30 秒</p>}
                  </div>
                </div>

                {/* 页面宽度控制 (PC端专属) */}
                {!isMobile && setContainerWidth && (
                  <div className="space-y-2.5 p-3.5 rounded-xl bg-white/[0.03] dark:bg-black/20 border border-border/40">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-primary" />
                        <span>页面最大容器宽度</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono tabular-nums">{clampedWidth}px</span>
                        {onResetContainerWidth && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="w-6 h-6 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => setResetWidthConfirmOpen(true)}
                              >
                                <RotateCcw className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>恢复默认宽度 1200px</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
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
                          <div className="h-3.5 w-3.5 rounded-full bg-primary shadow-sm shadow-primary/50 border border-white/20" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>紧凑 (600px)</span>
                      <span>默认 (1200px)</span>
                      <span>自适应宽屏</span>
                    </div>
                  </div>
                )}

                {/* 界面功能与视图偏好 */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground mb-1">界面功能与视图偏好</div>
                  <div className="flex flex-col gap-2.5">
                    <SettingSwitchCard
                      icon={LineChart}
                      title="显示大盘指数行情"
                      description="在首页表格或概览顶部显示上证指数等关键大盘指数行情条"
                      checked={isMobile ? localShowMarketIndexMobile : localShowMarketIndexPc}
                      onCheckedChange={(checked) => {
                        const nextValue = Boolean(checked);
                        if (isMobile) setLocalShowMarketIndexMobile(nextValue);
                        else setLocalShowMarketIndexPc(nextValue);
                      }}
                      ariaLabel="显示大盘指数"
                    />

                    <SettingSwitchCard
                      icon={Search}
                      title="分组内基金即时搜索"
                      description="在各个持仓分组列表上方提供快速搜索过滤输入栏"
                      checked={isMobile ? localShowGroupFundSearchMobile : localShowGroupFundSearchPc}
                      onCheckedChange={(checked) => {
                        const nextValue = Boolean(checked);
                        if (isMobile) setLocalShowGroupFundSearchMobile(nextValue);
                        else setLocalShowGroupFundSearchPc(nextValue);
                      }}
                      ariaLabel="显示分组内基金搜索"
                    />

                    <SettingSwitchCard
                      icon={Zap}
                      title="减少动态样式与动画效果"
                      description="降低背景毛玻璃与转场过渡动画渲染强度，提升设备运行流畅度"
                      checked={isMobile ? !localDynamicStyleMobile : !localDynamicStylePc}
                      onCheckedChange={(checked) => {
                        const nextValue = !checked;
                        if (isMobile) setLocalDynamicStyleMobile(nextValue);
                        else setLocalDynamicStylePc(nextValue);
                      }}
                      ariaLabel="减少动态样式效果"
                    />

                    <SettingSwitchCard
                      icon={Menu}
                      title="下拉菜单形式展示分组"
                      description="将平铺的分组标签栏折叠为下拉选择菜单，有效节省纵向屏幕空间"
                      checked={isMobile ? localShowGroupDropdownMobile : localShowGroupDropdownPc}
                      onCheckedChange={(checked) => {
                        const nextValue = Boolean(checked);
                        if (isMobile) setLocalShowGroupDropdownMobile(nextValue);
                        else setLocalShowGroupDropdownPc(nextValue);
                      }}
                      ariaLabel="下拉形式展示分组"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* ===== TAB 2: AI 大模型 ===== */}
              <TabsContent value="ai" className="space-y-3.5 focus-visible:outline-none mt-0">
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-semibold text-primary">智能识图与大模型：</span>
                    支持 OpenAI 兼容格式接口（如
                    DeepSeek、硅基流动、通义千问等）。配置后在顶栏添加基金时点击相机图标，即可通过大模型自动解析持仓截图并提取基金代码。
                  </div>
                </div>

                <AiConfigSection
                  onAiConfigChange={(cfg) => {
                    aiConfigRef.current = cfg;
                  }}
                  showImmediateSaveButton={true}
                  className="border-0 bg-transparent p-0 mb-0"
                />
              </TabsContent>

              {/* ===== TAB 3: 数据备份 ===== */}
              <TabsContent value="data" className="space-y-3.5 focus-visible:outline-none mt-0">
                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-semibold text-primary">本地优先存储架构：</span>
                    基估宝采用离线优先设计，您的持仓流水、交易明细与个性化配置均保存在本地浏览器环境（localStorage
                    与内置 SQLite）中，数据私密安全。
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] dark:bg-black/20 border border-border/40">
                    <div className="space-y-0.5 pr-3">
                      <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5 text-primary" />
                        <span>导出本地配置 (JSON)</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        将当前全部持仓数据、分组划分、自选列表及偏好配置导出为文件备份。
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={exportLocalData}
                      className="h-8 text-xs gap-1.5 shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>导出备份</span>
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] dark:bg-black/20 border border-border/40">
                    <div className="space-y-0.5 pr-3">
                      <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-primary" />
                        <span>恢复导入配置</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        选择此前备份导出的 JSON 配置文件，一键恢复全部持仓与系统偏好。
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => importFileRef.current?.click?.()}
                      className="h-8 text-xs gap-1.5 shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>选择文件</span>
                    </Button>
                  </div>
                </div>

                <input
                  ref={importFileRef}
                  type="file"
                  accept="application/json"
                  style={{ display: 'none' }}
                  onChange={handleImportFileChange}
                />
                {importMsg && (
                  <div className="p-2.5 rounded-lg bg-black/20 border border-border/40 text-xs text-muted-foreground text-center">
                    {importMsg}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>

          {/* 底部按钮栏 */}
          <div className="flex items-center justify-between pt-3.5 mt-3 border-t border-border/40 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              取消
            </Button>
            <Button
              type="button"
              className="h-9 px-5 text-xs font-medium"
              onClick={handleSave}
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
