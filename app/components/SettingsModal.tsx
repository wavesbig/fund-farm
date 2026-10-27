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
  LayoutGrid,
  Download,
  Upload,
  ShieldCheck,
  ChevronRight
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
  description: string;
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
    <Card className="w-full flex flex-row items-center justify-between p-3.5 gap-3 bg-muted/30 hover:bg-muted/50 border-border/60 transition-colors shadow-none rounded-xl">
      <div className="flex items-start gap-3 flex-1 min-w-0 pr-2">
        <div className="mt-0.5 p-2 rounded-lg bg-primary/10 text-primary shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 space-y-0.5">
          <Label htmlFor={id} className="text-xs font-medium text-foreground cursor-pointer">
            {title}
          </Label>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
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
  desc: string;
  badge?: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'general',
    title: '常规界面',
    desc: '刷新频率与布局偏好',
    icon: Sliders
  },
  {
    id: 'ai',
    title: 'AI 大模型',
    desc: '截图识别与模型服务',
    badge: '智能识别',
    icon: Sparkles
  },
  {
    id: 'data',
    title: '数据备份',
    desc: '本地配置导出与恢复',
    icon: HardDriveDownload
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

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose?.();
      }}
    >
      <DialogContent
        overlayClassName={cn(sliderDragging && 'opacity-20 backdrop-blur-none transition-opacity')}
        className="sm:max-w-[800px] md:max-w-[860px] w-[95vw] h-[86vh] max-h-[720px] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border-border bg-card/95 backdrop-blur-xl shadow-2xl"
        showCloseButton={true}
      >
        {/* 顶部标题栏 Header */}
        <DialogHeader className="px-6 py-4 border-b border-border/50 shrink-0 text-left bg-muted/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">偏好与系统设置</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                自定义数据刷新频率、界面功能、大模型智能提取及本地数据备份
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 主体侧边栏布局容器 */}
        <div className="flex-1 flex flex-col sm:flex-row min-h-0 overflow-hidden">
          {/* 移动端横向标签栏 (仅小屏展示) */}
          <div className="sm:hidden flex items-center gap-1.5 p-2 bg-muted/20 border-b border-border/50 overflow-x-auto shrink-0 scrollbar-none">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.title}</span>
                  {item.badge && (
                    <Badge
                      variant={isActive ? 'secondary' : 'outline'}
                      className="text-[9px] px-1 py-0 h-3.5 ml-0.5 font-normal"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* PC 端垂直侧边栏 */}
          <aside className="hidden sm:flex flex-col justify-between w-[200px] md:w-[220px] shrink-0 border-r border-border/50 bg-muted/20 p-3 select-none">
            <nav className="flex flex-col gap-1.5">
              <div className="text-[11px] font-medium text-muted-foreground/70 px-2.5 pb-1">分类导航</div>
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs transition-all cursor-pointer group',
                      isActive
                        ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{item.title}</span>
                        {item.badge && (
                          <Badge
                            variant={isActive ? 'secondary' : 'outline'}
                            className="text-[9px] px-1 py-0 h-3.5 font-normal"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-[10px] truncate leading-tight mt-0.5',
                          isActive ? 'text-primary-foreground/80' : 'text-muted-foreground/70'
                        )}
                      >
                        {item.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* 侧边栏底部说明 */}
            <div className="pt-3 border-t border-border/40 px-2 space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-xs text-foreground/80">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>本地优先架构</span>
              </div>
              <p className="text-[11px] text-muted-foreground/70 leading-tight">
                数据加密保存在本地设备，无第三方中转，安全私密。
              </p>
            </div>
          </aside>

          {/* 右侧主内容区域 */}
          <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-5 scrollbar-y-styled">
            {/* ===== 分类 1: 常规界面 ===== */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                {/* 刷新频率卡片 */}
                <Card className="p-4 gap-3 bg-muted/30 border-border/60 shadow-none rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <Label className="text-xs font-semibold text-foreground">数据自动刷新频率</Label>
                    </div>
                    <Badge variant="secondary" className="font-mono text-xs tabular-nums bg-background/60">
                      当前: {localSeconds} 秒
                    </Badge>
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
                  <div className="pt-0.5">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="30"
                      step="5"
                      value={localSeconds || ''}
                      onChange={(e) => setLocalSeconds(Number(e.target.value))}
                      placeholder="自定义秒数（例如 45）"
                      className="h-9 text-[16PX] md:text-sm bg-background/50 font-mono"
                    />
                    {localSeconds < 30 && (
                      <p className="text-destructive text-xs mt-1 font-medium">最低刷新频率为 30 秒</p>
                    )}
                  </div>
                </Card>

                {/* 页面宽度控制卡片 (PC端专属) */}
                {!isMobile && setContainerWidth && (
                  <Card className="p-4 gap-3 bg-muted/30 border-border/60 shadow-none rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                          <Maximize2 className="w-3.5 h-3.5" />
                        </div>
                        <Label className="text-xs font-semibold text-foreground">页面最大容器宽度</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs tabular-nums bg-background/50">
                          {clampedWidth}px
                        </Badge>
                        {onResetContainerWidth && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-foreground rounded-md"
                                onClick={() => setResetWidthConfirmOpen(true)}
                                aria-label="重置页面宽度"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>恢复默认宽度 1200px</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                    <div className="pt-1">
                      <div
                        ref={pageWidthTrackRef}
                        className="group relative h-4 cursor-pointer flex items-center"
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
                          className="h-2"
                          indicatorClassName="!bg-none bg-primary !transition-none"
                        />
                        <div
                          className="pointer-events-none absolute top-1/2 -translate-y-1/2"
                          style={{ left: `${pageWidthPercent}%`, transform: 'translate(-50%, -50%)' }}
                        >
                          <div className="size-4 rounded-full bg-primary shadow-md shadow-primary/40 border-2 border-background" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground pt-0.5">
                      <span>紧凑 (600px)</span>
                      <span>标准 (1200px)</span>
                      <span>自适应宽屏</span>
                    </div>
                  </Card>
                )}

                {/* 界面功能与视图偏好列表 */}
                <div className="space-y-2 pt-1">
                  <Label className="text-xs font-semibold text-foreground">界面功能与视图偏好</Label>
                  <div className="flex flex-col gap-2.5">
                    <SettingSwitchCard
                      id="setting-market-index"
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
                      id="setting-group-search"
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
                      id="setting-dynamic-style"
                      icon={Zap}
                      title="减少动态样式效果"
                      description="关闭卡片微动效与过渡模糊，优化低性能设备流畅度"
                      checked={isMobile ? !localDynamicStyleMobile : !localDynamicStylePc}
                      onCheckedChange={(checked) => {
                        const nextValue = !checked;
                        if (isMobile) setLocalDynamicStyleMobile(nextValue);
                        else setLocalDynamicStylePc(nextValue);
                      }}
                      ariaLabel="减少动态样式效果"
                    />

                    <SettingSwitchCard
                      id="setting-group-dropdown"
                      icon={LayoutGrid}
                      title="下拉形式展示分组"
                      description="采用简洁下拉菜单切换不同基金分组，节省纵向视图空间"
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
              <div className="space-y-4">
                <AiConfigSection
                  onAiConfigChange={(cfg) => {
                    aiConfigRef.current = cfg;
                  }}
                  showImmediateSaveButton={true}
                  className="border-0 bg-transparent p-0 mb-0 shadow-none"
                />
              </div>
            )}

            {/* ===== 分类 3: 数据备份 ===== */}
            {activeTab === 'data' && (
              <div className="space-y-4">
                <Alert className="bg-primary/5 border-primary/20 text-foreground">
                  <ShieldCheck className="size-4 text-primary" />
                  <AlertTitle className="text-primary font-medium text-xs">本地优先（Local-First）架构声明</AlertTitle>
                  <AlertDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    基估宝采用离线优先设计，持仓流水、交易明细与个性化配置均保存在本地环境（localStorage 与内置
                    SQLite）中，数据私密安全。
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col gap-2.5">
                  <Card className="flex flex-row items-center justify-between p-4 gap-3 bg-muted/30 border-border/60 shadow-none rounded-xl">
                    <div className="space-y-1 pr-3">
                      <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5 text-primary" />
                        <span>导出本地配置 (JSON)</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        将当前全部持仓数据、分组划分、自选列表及偏好配置导出为文件备份。
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={exportLocalData}
                      className="h-8 text-xs gap-1.5 shrink-0 rounded-lg"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>导出备份</span>
                    </Button>
                  </Card>

                  <Card className="flex flex-row items-center justify-between p-4 gap-3 bg-muted/30 border-border/60 shadow-none rounded-xl">
                    <div className="space-y-1 pr-3">
                      <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-primary" />
                        <span>恢复导入配置</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        选择此前备份导出的 JSON 配置文件，一键恢复全部持仓与系统偏好。
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => importFileRef.current?.click?.()}
                      className="h-8 text-xs gap-1.5 shrink-0 rounded-lg"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>选择文件</span>
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
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground text-center">
                    {importMsg}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        {/* 底部保存与关闭栏 Footer */}
        <DialogFooter className="px-6 py-3.5 border-t border-border/50 shrink-0 bg-muted/20 flex flex-row items-center justify-between sm:justify-between">
          <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-1.5">
            <span>当前分类：</span>
            <Badge variant="outline" className="text-[11px] font-normal">
              {NAV_ITEMS.find((item) => item.id === activeTab)?.title}
            </Badge>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground h-9 px-4"
            >
              取消
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-9 px-5 text-xs font-medium rounded-lg"
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
