'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  Settings,
  RotateCcw,
  Sliders,
  Sparkles,
  Database,
  Clock,
  Maximize2,
  LineChart,
  Search,
  LayoutGrid,
  Download,
  Upload
} from 'lucide-react';
import { useIsMobile } from '@/app/hooks/useIsMobile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
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
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel: string;
}

function SettingSwitchCard({
  id,
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
  ariaLabel
}: SettingSwitchCardProps) {
  return (
    <Card className="w-full flex flex-row items-center justify-between p-3.5 gap-3 bg-card/60 hover:bg-card/90 border border-border/70 hover:border-primary/40 transition-all shadow-xs rounded-xl backdrop-blur-sm min-w-0">
      <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
        <div className="size-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shrink-0">
          <Icon className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <Label
            htmlFor={id}
            className="text-xs font-semibold text-foreground cursor-pointer truncate block tracking-tight"
          >
            {title}
          </Label>
          {description && <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{description}</p>}
        </div>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={ariaLabel}
        className="shrink-0 ml-2"
      />
    </Card>
  );
}

interface NavItem {
  id: 'general' | 'ai' | 'data';
  title: string;
  badge?: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'general',
    title: '常规界面',
    icon: Sliders
  },
  {
    id: 'ai',
    title: 'AI 大模型',
    badge: '智能识别',
    icon: Sparkles
  },
  {
    id: 'data',
    title: '数据备份',
    icon: Database
  }
];

type NavItemId = NavItem['id'];

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
  const [activeTab, setActiveTab] = useState<NavItemId>('general');
  const [sliderDragging, setSliderDragging] = useState(false);
  const sliderDraggingRef = useRef(false);
  const [resetWidthConfirmOpen, setResetWidthConfirmOpen] = useState(false);

  // 本地受控状态副本
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

  // 渲染通用主内容面板
  const renderMainContent = () => (
    <div className="space-y-4 w-full min-w-0">
      {/* ===== 分类 1: 常规界面 ===== */}
      {activeTab === 'general' && (
        <div className="space-y-4 w-full min-w-0">
          {/* 刷新频率卡片 */}
          <Card className="p-4 gap-3.5 bg-card/60 border border-border/70 hover:border-primary/40 transition-all shadow-xs rounded-xl backdrop-blur-sm min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <Clock className="size-4" />
                </div>
                <Label className="text-xs font-semibold text-foreground tracking-tight">数据自动刷新频率</Label>
              </div>
              <Badge
                variant="outline"
                className="font-mono text-xs tabular-nums bg-card/80 border-border/70 px-2 py-0.5 h-6"
              >
                当前: {localSeconds} 秒
              </Badge>
            </div>
            <div className="flex items-center gap-2 w-full min-w-0">
              {[30, 60, 120, 300].map((s) => {
                const isActive = localSeconds === s;
                return (
                  <Button
                    key={s}
                    type="button"
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      'flex-1 h-8.5 text-xs font-medium tabular-nums rounded-lg border-border/70 truncate transition-all',
                      isActive && 'shadow-xs font-semibold'
                    )}
                    onClick={() => setLocalSeconds(s)}
                    aria-pressed={isActive}
                  >
                    {s} 秒
                  </Button>
                );
              })}
            </div>
            <div className="pt-0.5">
              <Input
                type="number"
                inputMode="numeric"
                min="30"
                step="5"
                value={localSeconds || ''}
                onChange={(e) => setLocalSeconds(Number(e.target.value))}
                placeholder="自定义秒数（例如 45）"
                className="h-9 text-[16PX] md:text-sm bg-background/80 font-mono border-border/70 focus-visible:ring-1 focus-visible:ring-primary/40 rounded-lg"
              />
              {localSeconds < 30 && <p className="text-destructive text-xs mt-1.5 font-medium">最低刷新频率为 30 秒</p>}
            </div>
          </Card>

          {/* 页面宽度控制卡片 (PC端专属) */}
          {!isMobile && setContainerWidth && (
            <Card className="p-4 gap-3.5 bg-card/60 border border-border/70 hover:border-primary/40 transition-all shadow-xs rounded-xl backdrop-blur-sm min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <Maximize2 className="size-4" />
                  </div>
                  <Label className="text-xs font-semibold text-foreground tracking-tight">页面最大容器宽度</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="font-mono text-xs tabular-nums bg-card/80 border-border/70 px-2 py-0.5 h-6"
                  >
                    {clampedWidth}px
                  </Badge>
                  {onResetContainerWidth && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground rounded-md transition-colors"
                          onClick={() => setResetWidthConfirmOpen(true)}
                          aria-label="重置页面宽度"
                        >
                          <RotateCcw className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>恢复默认宽度 1200px</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
              <div className="pt-1.5 w-full min-w-0">
                <div
                  ref={pageWidthTrackRef}
                  className="group relative h-5 cursor-grab active:cursor-grabbing flex items-center w-full select-none"
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
                    className="h-2 w-full rounded-full"
                    indicatorClassName="!bg-none bg-primary !transition-none"
                  />
                  <div
                    className="pointer-events-none absolute top-1/2 -translate-y-1/2 transition-transform group-hover:scale-110"
                    style={{ left: `${pageWidthPercent}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="size-4.5 rounded-full bg-primary shadow-sm shadow-primary/30 border-2 border-background" />
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground pt-0.5 font-medium tabular-nums">
                <span>紧凑 (600px)</span>
                <span>标准 (1200px)</span>
                <span>自适应宽屏</span>
              </div>
            </Card>
          )}

          {/* 界面功能与视图偏好列表 */}
          <div className="space-y-2 pt-1 min-w-0">
            <Label className="text-xs font-semibold text-foreground">界面功能与视图偏好</Label>
            <div className="flex flex-col gap-2.5 w-full min-w-0">
              <SettingSwitchCard
                id="setting-market-index"
                icon={LineChart}
                title="显示大盘指数行情"
                checked={isMobile ? localShowMarketIndexMobile : localShowMarketIndexPc}
                onCheckedChange={(checked) => {
                  const nextValue = Boolean(checked);
                  if (isMobile) setLocalShowMarketIndexMobile(nextValue);
                  else setLocalShowMarketIndexPc(nextValue);
                }}
                ariaLabel="显示大盘指数"
              />

              <SettingSwitchCard
                id="setting-group-search"
                icon={Search}
                title="分组内基金即时搜索"
                checked={isMobile ? localShowGroupFundSearchMobile : localShowGroupFundSearchPc}
                onCheckedChange={(checked) => {
                  const nextValue = Boolean(checked);
                  if (isMobile) setLocalShowGroupFundSearchMobile(nextValue);
                  else setLocalShowGroupFundSearchPc(nextValue);
                }}
                ariaLabel="显示分组内基金搜索"
              />

              <SettingSwitchCard
                id="setting-group-dropdown"
                icon={LayoutGrid}
                title="下拉形式展示分组"
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
        </div>
      )}

      {/* ===== 分类 2: AI 大模型 ===== */}
      {activeTab === 'ai' && (
        <div className="space-y-4 w-full min-w-0">
          <AiConfigSection
            onAiConfigChange={(cfg) => {
              aiConfigRef.current = cfg;
            }}
            showImmediateSaveButton={true}
            className="border-0 bg-transparent p-0 mb-0 shadow-none w-full min-w-0"
          />
        </div>
      )}

      {/* ===== 分类 3: 数据备份 ===== */}
      {activeTab === 'data' && (
        <div className="space-y-4 w-full min-w-0">
          <div className="flex flex-col gap-2.5 w-full min-w-0">
            <Card className="flex flex-row items-center justify-between p-3.5 sm:p-4 gap-3 bg-card/60 hover:bg-card/90 border border-border/70 hover:border-primary/40 transition-all shadow-xs rounded-xl backdrop-blur-sm min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="size-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <Download className="size-4" />
                </div>
                <span className="text-xs font-semibold tracking-tight text-foreground truncate">
                  导出配置备份 (JSON)
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={exportLocalData}
                className="h-8.5 px-3.5 text-xs font-medium shrink-0 rounded-lg border-border/70 hover:border-primary/40 transition-colors"
              >
                导出备份
              </Button>
            </Card>

            <Card className="flex flex-row items-center justify-between p-3.5 sm:p-4 gap-3 bg-card/60 hover:bg-card/90 border border-border/70 hover:border-primary/40 transition-all shadow-xs rounded-xl backdrop-blur-sm min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="size-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <Upload className="size-4" />
                </div>
                <span className="text-xs font-semibold tracking-tight text-foreground truncate">恢复导入配置</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => importFileRef.current?.click?.()}
                className="h-8.5 px-3.5 text-xs font-medium shrink-0 rounded-lg border-border/70 hover:border-primary/40 transition-colors"
              >
                选择文件
              </Button>
            </Card>
          </div>

          <input
            ref={importFileRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={handleImportFileChange}
          />
          {importMsg && (
            <div className="p-3 rounded-xl bg-card/60 border border-border/60 text-xs text-muted-foreground text-center">
              {importMsg}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose?.();
      }}
    >
      <DialogContent
        overlayClassName={cn(sliderDragging && 'opacity-20 backdrop-blur-none transition-opacity')}
        className="sm:max-w-[820px] md:max-w-[880px] w-[95vw] h-[85vh] max-h-[720px] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        showCloseButton={true}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* 顶部标题栏 Header */}
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0 text-left bg-card">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-xs">
              <Settings className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground">偏好与设置</DialogTitle>
              <DialogDescription className="sr-only">偏好与设置</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 主体侧边栏布局：手机端与PC端根据 isMobile 彻底隔离渲染 */}
        {isMobile ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden w-full max-w-full">
            {/* 移动端顶部标签栏 */}
            <div className="p-2.5 bg-card border-b border-border shrink-0 w-full select-none">
              <div className="grid grid-cols-3 gap-1 p-1 bg-muted/40 rounded-lg border border-border/50">
                {NAV_ITEMS.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        'flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-all cursor-pointer',
                        isActive
                          ? 'bg-card text-foreground shadow-xs font-semibold border border-border/50'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Icon className={cn('size-3.5 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
                      <span className="truncate">{item.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 移动端下方主内容区 */}
            <main className="flex-1 min-w-0 overflow-y-auto p-4 scrollbar-y-styled">{renderMainContent()}</main>
          </div>
        ) : (
          <div className="flex-1 flex flex-row min-h-0 overflow-hidden w-full max-w-full">
            {/* PC 端垂直侧边栏 - 背景色纯净统一为 bg-card，消除突兀杂色 */}
            <aside className="w-[210px] shrink-0 border-r border-border bg-card p-3.5 flex flex-col justify-between select-none">
              <nav className="flex flex-col gap-1">
                <div className="text-xs font-semibold text-muted-foreground px-2.5 pb-1 uppercase tracking-wider">
                  分类导航
                </div>
                {NAV_ITEMS.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors cursor-pointer group w-full',
                        isActive
                          ? 'bg-secondary text-foreground font-semibold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                      )}
                    >
                      <Icon
                        className={cn(
                          'size-4 shrink-0 transition-colors',
                          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                        )}
                      />
                      <span className="truncate flex-1">{item.title}</span>
                      {item.badge && (
                        <Badge
                          variant={isActive ? 'default' : 'secondary'}
                          className={cn(
                            'text-xs px-1.5 py-0 h-4 font-normal rounded-md',
                            isActive ? 'bg-primary/15 text-primary border-primary/25' : 'text-muted-foreground'
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-border/50 text-xs text-muted-foreground px-2 flex items-center justify-between">
                <span>基估宝</span>
                <span className="font-mono text-xs text-muted-foreground">v2.4.1</span>
              </div>
            </aside>

            {/* PC 端右侧主内容区域 */}
            <main className="flex-1 min-w-0 overflow-y-auto p-5 sm:p-6 scrollbar-y-styled bg-card">
              {renderMainContent()}
            </main>
          </div>
        )}

        {/* 底部保存与关闭栏 Footer */}
        <DialogFooter className="px-6 py-3.5 border-t border-border shrink-0 bg-card flex flex-row items-center justify-end">
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs font-medium text-muted-foreground hover:text-foreground h-9 px-4 rounded-lg"
            >
              取消
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-9 px-5 text-xs font-medium rounded-lg shadow-xs"
              onClick={handleSave}
              disabled={localSeconds < 30}
            >
              保存并关闭
            </Button>
          </div>
        </DialogFooter>

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
