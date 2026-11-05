'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  RotateCcw,
  Sliders,
  Sparkles,
  Database,
  Clock,
  Maximize2,
  Type,
  LineChart,
  Search,
  LayoutGrid,
  Download,
  Upload,
  X
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose
} from '@/components/ui/drawer';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Segmented } from '@/components/ui/segmented';
import ConfirmModal from './ConfirmModal';
import AiConfigSection from './AiConfigSection';
import { cn } from '@/lib/utils';
import { useSettingsStore, type FontSizeLevel } from '@/app/stores/settingsStore';

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
    <Card
      onClick={() => onCheckedChange(!checked)}
      className="w-full flex flex-row items-center justify-between p-3.5 gap-3 bg-card/60 hover:bg-card/90 border border-border/70 hover:border-primary/40 transition-[background-color,border-color,box-shadow] duration-150 ease-out shadow-xs rounded-2xl backdrop-blur-sm min-w-0 cursor-pointer select-none"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
        <div className="size-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shrink-0">
          <Icon className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <Label
            htmlFor={id}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold text-foreground cursor-pointer truncate block tracking-tight"
          >
            {title}
          </Label>
          {description && <p className="text-[12px] text-muted-foreground leading-relaxed mt-0.5">{description}</p>}
        </div>
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          aria-label={ariaLabel}
          className="shrink-0 ml-2"
        />
      </div>
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
    title: '常规',
    icon: Sliders
  },
  {
    id: 'ai',
    title: 'AI 助手',
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
  const fontSizeLevel = useSettingsStore((s) => s.fontSizeLevel);
  const setFontSizeLevel = useSettingsStore((s) => s.setFontSizeLevel);
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

  // 渲染分类 1: 界面与显示
  const renderGeneralSection = () => (
    <div className="space-y-4 w-full min-w-0">
      {/* 刷新频率卡片 */}
      <Card className="p-4 gap-3.5 bg-card/60 border border-border/70 hover:border-primary/40 transition-[background-color,border-color,box-shadow] duration-150 ease-out shadow-xs rounded-2xl backdrop-blur-sm min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Clock className="size-4" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-foreground tracking-tight">自动刷新频率</Label>
              <p className="text-[12px] text-muted-foreground mt-0.5">控制基金估值行情的后台静默轮询间隔</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="font-mono text-xs tabular-nums bg-secondary/60 border-border/70 px-2.5 py-0.5 h-6"
          >
            {localSeconds} 秒
          </Badge>
        </div>
        <Segmented
          value={localSeconds}
          onChange={(val) => setLocalSeconds(Number(val))}
          layoutId="settings-refresh-seconds"
          options={[
            { value: 30, label: '30 秒' },
            { value: 60, label: '60 秒' },
            { value: 120, label: '120 秒' },
            { value: 300, label: '300 秒' }
          ]}
        />
        {/* 自定义输入行：结构整洁规整，避免孤立输入框突兀 */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">自定义刷新间隔</span>
          <div className="flex items-center gap-2">
            <div className="relative w-28">
              <Input
                type="number"
                inputMode="numeric"
                min="30"
                step="5"
                value={localSeconds || ''}
                onChange={(e) => setLocalSeconds(Number(e.target.value))}
                placeholder="30"
                className="h-8 pr-7 text-right font-mono text-[16PX] md:text-xs bg-background/80 border-border/70 focus-visible:ring-1 focus-visible:ring-primary/40 rounded-lg"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none select-none">
                秒
              </span>
            </div>
          </div>
        </div>
        {localSeconds < 30 && <p className="text-destructive text-xs font-medium">最低刷新频率为 30 秒</p>}
      </Card>

      {/* 字体大小 */}
      <Card className="p-4 gap-3.5 bg-card/60 border border-border/70 hover:border-primary/40 transition-[background-color,border-color,box-shadow] duration-150 ease-out shadow-xs rounded-2xl backdrop-blur-sm min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Type className="size-4" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-foreground tracking-tight">系统界面字号大小</Label>
              <p className="text-[12px] text-muted-foreground mt-0.5">调节全局文字与数字大小，提升易读性</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs bg-secondary/60 border-border/70 px-2.5 py-0.5 h-6 font-medium">
            {fontSizeLevel === 'standard' && '标准 (16px)'}
            {fontSizeLevel === 'comfortable' && '适中 (17.5px)'}
            {fontSizeLevel === 'large' && '偏大 (18.5px)'}
            {fontSizeLevel === 'extra-large' && '特大 (20px)'}
          </Badge>
        </div>
        <Segmented
          value={fontSizeLevel}
          onChange={(val) => setFontSizeLevel(val as FontSizeLevel)}
          layoutId="settings-font-size"
          options={[
            { value: 'standard', label: '标准' },
            { value: 'comfortable', label: '适中 (推荐)' },
            { value: 'large', label: '偏大' },
            { value: 'extra-large', label: '特大' }
          ]}
        />
      </Card>

      {/* 页面宽度控制卡片 (PC端专属) */}
      {!isMobile && setContainerWidth && (
        <Card className="p-4 gap-3.5 bg-card/60 border border-border/70 hover:border-primary/40 transition-[background-color,border-color,box-shadow] duration-150 ease-out shadow-xs rounded-2xl backdrop-blur-sm min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shrink-0">
                <Maximize2 className="size-4" />
              </div>
              <Label className="text-sm font-semibold text-foreground tracking-tight">页面最大宽度</Label>
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
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">视图偏好</Label>
        <div className="flex flex-col gap-2.5 w-full min-w-0">
          <SettingSwitchCard
            id="setting-market-index"
            icon={LineChart}
            title="显示大盘指数行情"
            description="在首页顶部展示上证、深证、创业板等大盘行情走势"
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
            description="在分组标签下方提供即时的自选基金代码与名称过滤搜索"
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
            description="以紧凑下拉菜单展示分组列表，节省横向空间"
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
  );

  // 渲染分类 2: AI 大模型
  const renderAiSection = () => (
    <div className="space-y-4 w-full min-w-0">
      <AiConfigSection
        onAiConfigChange={(cfg) => {
          aiConfigRef.current = cfg;
        }}
        showImmediateSaveButton={true}
        className="border-0 bg-transparent p-0 mb-0 shadow-none w-full min-w-0"
      />
    </div>
  );

  // 渲染分类 3: 数据备份与恢复
  const renderDataSection = () => (
    <div className="space-y-4 w-full min-w-0">
      <div className="flex flex-col gap-2.5 w-full min-w-0">
        <Card className="flex flex-row items-center justify-between p-3.5 sm:p-4 gap-3 bg-card/60 hover:bg-card/90 border border-border/70 hover:border-primary/40 transition-[background-color,border-color,box-shadow] duration-150 ease-out shadow-xs rounded-2xl backdrop-blur-sm min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="size-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Download className="size-4" />
            </div>
            <span className="text-xs font-semibold tracking-tight text-foreground truncate">导出配置备份 (JSON)</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={exportLocalData}
            className="h-8.5 px-3.5 text-xs font-medium shrink-0 rounded-lg border-border/70 hover:border-primary/40 transition-colors cursor-pointer"
          >
            导出备份
          </Button>
        </Card>

        <Card className="flex flex-row items-center justify-between p-3.5 sm:p-4 gap-3 bg-card/60 hover:bg-card/90 border border-border/70 hover:border-primary/40 transition-[background-color,border-color,box-shadow] duration-150 ease-out shadow-xs rounded-2xl backdrop-blur-sm min-w-0">
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
            className="h-8.5 px-3.5 text-xs font-medium shrink-0 rounded-lg border-border/70 hover:border-primary/40 transition-colors cursor-pointer"
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
  );

  // PC 与通用主内容面板
  const renderTabContent = () => (
    <div className="space-y-4 w-full min-w-0">
      {activeTab === 'general' && renderGeneralSection()}
      {activeTab === 'ai' && renderAiSection()}
      {activeTab === 'data' && renderDataSection()}
    </div>
  );

  // 移动端采用符合移动端设计规范的 Drawer（底部滑出半屏/高屏抽屉，分类分段切换）
  if (isMobile) {
    return (
      <Drawer
        open
        onOpenChange={(open) => {
          if (!open) onClose?.();
        }}
      >
        <DrawerContent
          defaultHeight="88vh"
          maxHeight="92vh"
          className="flex flex-col p-0 gap-0 overflow-hidden bg-card border-t border-border shadow-2xl rounded-t-2xl"
        >
          {/* 顶部标题栏 Header */}
          <DrawerHeader className="px-5 py-3.5 border-b border-border shrink-0 text-left bg-card flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-xs">
                <Settings className="size-4" />
              </div>
              <div>
                <DrawerTitle className="text-base font-semibold tracking-tight text-foreground">偏好与设置</DrawerTitle>
                <DrawerDescription className="sr-only">移动端偏好与设置配置面板</DrawerDescription>
              </div>
            </div>
            <DrawerClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>

          {/* 移动端分类分段切换器 - 解决全量单页滚动过长的问题 */}
          <div className="px-4 py-2.5 shrink-0 bg-card border-b border-border/60">
            <Segmented
              value={activeTab}
              onChange={(val) => setActiveTab(val as NavItemId)}
              layoutId="settings-mobile-nav-tabs"
              options={NAV_ITEMS.map((item) => ({
                value: item.id,
                label: item.title,
                icon: item.icon
              }))}
            />
          </div>

          {/* 移动端主内容：当前分类面板 */}
          <div className="flex-1 min-w-0 overflow-y-auto p-4 scrollbar-y-styled">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="w-full min-w-0"
            >
              {renderTabContent()}
            </motion.div>
          </div>

          {/* 移动端吸底操作栏 Footer */}
          <DrawerFooter className="px-5 py-3 border-t border-border bg-card/95 backdrop-blur-md shrink-0 flex flex-row items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs font-medium text-muted-foreground hover:text-foreground h-9 px-4 rounded-lg cursor-pointer"
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={localSeconds < 30}
              className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs h-9 px-5 rounded-lg cursor-pointer select-none"
            >
              保存偏好
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // PC 端采用宽屏多列 Dialog 弹窗
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

        {/* PC 端垂直侧边栏布局 */}
        <div className="flex-1 flex flex-row min-h-0 overflow-hidden w-full max-w-full">
          {/* PC 端垂直侧边栏 - 背景色纯净统一为 bg-card，消除突兀杂色 */}
          <aside className="w-[210px] shrink-0 border-r border-border bg-card p-3.5 flex flex-col justify-between select-none">
            <div className="flex flex-col gap-1">
              <div className="text-xs font-semibold text-muted-foreground px-2.5 pb-1 uppercase tracking-wider">
                分类导航
              </div>
              <nav className="flex flex-col gap-1">
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
                          ? 'bg-primary/15 text-primary border border-primary/25 font-semibold shadow-xs'
                          : 'border border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                      )}
                    >
                      <Icon
                        className={cn(
                          'size-4 shrink-0 transition-colors',
                          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                        )}
                      />
                      <span className="truncate flex-1 text-left">{item.title}</span>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="text-xs px-1.5 py-0 h-4 font-normal rounded-md text-muted-foreground"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-3 border-t border-border/50 text-xs text-muted-foreground px-2 flex items-center justify-between">
              <span>养基场</span>
              <span className="font-mono text-xs text-muted-foreground">v2.4.1</span>
            </div>
          </aside>

          {/* PC 端右侧主内容区域 */}
          <main className="flex-1 min-w-0 overflow-y-auto p-5 sm:p-6 scrollbar-y-styled bg-card">
            {renderTabContent()}
          </main>
        </div>

        {/* 底部保存与关闭栏 Footer */}
        <DialogFooter className="px-6 py-3.5 border-t border-border shrink-0 bg-card flex flex-row items-center justify-end">
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs font-medium text-muted-foreground hover:text-foreground h-9 px-4 rounded-lg cursor-pointer"
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
