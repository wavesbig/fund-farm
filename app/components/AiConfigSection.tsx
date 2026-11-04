'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { isString, isObject, isArray, isBoolean } from 'lodash';
import {
  Sparkles,
  Bot,
  Cpu,
  Globe,
  Layers,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Check,
  ListFilter
} from 'lucide-react';
import { useStorageStore } from '../stores';
import { getStoredToken } from '../lib/authClient';
import { saveSqliteKey } from '../lib/sqliteClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast as sonnerToast } from 'sonner';
import { cn } from '@/lib/utils';

export interface AiConfig {
  enabled: boolean;
  apiKey: string;
  baseURL: string;
  model: string;
}

export interface AiConfigSectionProps {
  onAiConfigChange?: (cfg: AiConfig) => void;
  showImmediateSaveButton?: boolean;
  className?: string;
}

export interface ProviderPreset {
  id: string;
  name: string;
  badge: string;
  baseURL: string;
  model: string;
  latencyHint: string;
  icon: React.ElementType;
  theme: {
    activeBorder: string;
    activeBg: string;
    activeText: string;
    activeRing: string;
    badgeStyle: string;
    hoverBorder: string;
  };
}

const PRESETS: ProviderPreset[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek 官方',
    badge: '推荐',
    baseURL: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    latencyHint: '极速',
    icon: Sparkles,
    theme: {
      activeBorder: 'border-primary',
      activeBg: 'bg-primary/12',
      activeText: 'text-primary',
      activeRing: 'ring-1 ring-primary/30',
      badgeStyle: 'bg-primary/15 text-primary border-primary/30',
      hoverBorder: 'hover:border-primary/40'
    }
  },
  {
    id: 'siliconflow',
    name: '硅基流动',
    badge: '国内免翻',
    baseURL: 'https://api.siliconflow.cn/v1',
    model: 'deepseek-ai/DeepSeek-V3',
    latencyHint: '低延迟',
    icon: Cpu,
    theme: {
      activeBorder: 'border-indigo-500',
      activeBg: 'bg-indigo-500/12',
      activeText: 'text-indigo-500 dark:text-indigo-400',
      activeRing: 'ring-1 ring-indigo-500/30',
      badgeStyle: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
      hoverBorder: 'hover:border-indigo-500/40'
    }
  },
  {
    id: 'dashscope',
    name: '通义千问',
    badge: '阿里百炼',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
    latencyHint: '高可用',
    icon: Globe,
    theme: {
      activeBorder: 'border-amber-500',
      activeBg: 'bg-amber-500/12',
      activeText: 'text-amber-500 dark:text-amber-400',
      activeRing: 'ring-1 ring-amber-500/30',
      badgeStyle: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      hoverBorder: 'hover:border-amber-500/40'
    }
  },
  {
    id: 'openai',
    name: 'OpenAI 官方',
    badge: '原厂',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    latencyHint: '国际',
    icon: Bot,
    theme: {
      activeBorder: 'border-emerald-500',
      activeBg: 'bg-emerald-500/12',
      activeText: 'text-emerald-500 dark:text-emerald-400',
      activeRing: 'ring-1 ring-emerald-500/30',
      badgeStyle: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      hoverBorder: 'hover:border-emerald-500/40'
    }
  },
  {
    id: 'ollama',
    name: '本地 Ollama',
    badge: '本地私有',
    baseURL: 'http://localhost:11434/v1',
    model: 'qwen2.5:7b',
    latencyHint: '本地',
    icon: Layers,
    theme: {
      activeBorder: 'border-violet-500',
      activeBg: 'bg-violet-500/12',
      activeText: 'text-violet-500 dark:text-violet-400',
      activeRing: 'ring-1 ring-violet-500/30',
      badgeStyle: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30',
      hoverBorder: 'hover:border-violet-500/40'
    }
  },
  {
    id: 'custom',
    name: '自定义接口',
    badge: '通用兼容',
    baseURL: '',
    model: '',
    latencyHint: '自定义',
    icon: KeyRound,
    theme: {
      activeBorder: 'border-rose-500',
      activeBg: 'bg-rose-500/12',
      activeText: 'text-rose-500 dark:text-rose-400',
      activeRing: 'ring-1 ring-rose-500/30',
      badgeStyle: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      hoverBorder: 'hover:border-rose-500/40'
    }
  }
];

export default function AiConfigSection({
  onAiConfigChange,
  showImmediateSaveButton = true,
  className
}: AiConfigSectionProps) {
  const setCustomSettings = useStorageStore((s) => s.setCustomSettings);

  const [apiKey, setApiKey] = useState('');
  const [baseURL, setBaseURL] = useState('https://api.deepseek.com/v1');
  const [model, setModel] = useState('deepseek-chat');
  const [enabled, setEnabled] = useState(true);
  const [showKey, setShowKey] = useState(false);

  const [modelList, setModelList] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelFetchMsg, setModelFetchMsg] = useState('');
  const [isManualInput, setIsManualInput] = useState(false);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 初始化读取配置
  useEffect(() => {
    const memoryAi = useStorageStore.getState().customSettings?.aiConfig as Record<string, any> | undefined;
    if (memoryAi && isObject(memoryAi)) {
      if (isString(memoryAi.apiKey)) setApiKey(memoryAi.apiKey);
      if (isString(memoryAi.baseURL) && memoryAi.baseURL.trim()) setBaseURL(memoryAi.baseURL);
      if (isString(memoryAi.model) && memoryAi.model.trim()) setModel(memoryAi.model);
      if (isBoolean(memoryAi.enabled)) setEnabled(memoryAi.enabled);
    }

    const fetchLatestFromDb = async () => {
      try {
        const token = getStoredToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const res = await fetch('/api/sync?key=customSettings', { headers });
        if (!res.ok) return;
        const json = await res.json();
        const dbCustomSettings = json?.value;
        const dbAi = dbCustomSettings?.aiConfig as Record<string, any> | undefined;
        if (dbAi && isObject(dbAi)) {
          if (isString(dbAi.apiKey)) setApiKey(dbAi.apiKey);
          if (isString(dbAi.baseURL) && dbAi.baseURL.trim()) setBaseURL(dbAi.baseURL);
          if (isString(dbAi.model) && dbAi.model.trim()) setModel(dbAi.model);
          if (isBoolean(dbAi.enabled)) setEnabled(dbAi.enabled);
        }
      } catch {
        // ignore
      }
    };

    fetchLatestFromDb();
  }, []);

  // 状态变化时通知外部父组件
  useEffect(() => {
    onAiConfigChange?.({
      enabled,
      apiKey: apiKey.trim(),
      baseURL: baseURL.trim() || 'https://api.deepseek.com/v1',
      model: model.trim() || 'deepseek-chat'
    });
  }, [enabled, apiKey, baseURL, model, onAiConfigChange]);

  const activePresetId = React.useMemo(() => {
    const matched = PRESETS.find((p) => p.id !== 'custom' && p.baseURL === baseURL && (p.model === model || !baseURL));
    if (matched) return matched.id;
    const matchedUrl = PRESETS.find((p) => p.id !== 'custom' && p.baseURL === baseURL);
    if (matchedUrl) return matchedUrl.id;
    return 'custom';
  }, [baseURL, model]);

  const applyPreset = useCallback((preset: ProviderPreset) => {
    if (preset.id === 'custom') {
      setTestResult(null);
      setModelFetchMsg('');
      return;
    }
    setBaseURL(preset.baseURL);
    setModel(preset.model);
    setTestResult(null);
    setModelFetchMsg('');
    setIsManualInput(false);
  }, []);

  /**
   * 通过 API Key 和 Base URL 拉取可用模型列表
   */
  const handleFetchModels = async () => {
    if (!apiKey.trim()) {
      const msg = '请先填写 API Key';
      setTestResult({ success: false, message: msg });
      sonnerToast.error(msg);
      return;
    }

    setFetchingModels(true);
    setModelFetchMsg('');
    setTestResult(null);

    try {
      const token = getStoredToken();
      const res = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          action: 'models',
          apiKey: apiKey.trim(),
          baseURL: baseURL.trim()
        })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && isArray(data.models)) {
        if (data.models.length > 0) {
          setModelList(data.models);
          setIsManualInput(false);
          const fetchMsg = `已获取 ${data.models.length} 个模型`;
          setModelFetchMsg(fetchMsg);
          sonnerToast.success(fetchMsg);

          if (!data.models.includes(model)) {
            const preferred =
              data.models.find(
                (m: string) =>
                  m.toLowerCase().includes('deepseek-chat') ||
                  m.toLowerCase().includes('deepseek') ||
                  m.toLowerCase().includes('chat') ||
                  m.toLowerCase().includes('gpt-4o')
              ) || data.models[0];
            setModel(preferred);
          }
        } else {
          setModelFetchMsg('未返回可用模型，可手动输入');
          sonnerToast.info('未返回可用模型，可手动输入');
        }
      } else {
        const errMsg = data.message || '获取模型失败，请检查 Base URL 与 API Key';
        setTestResult({
          success: false,
          message: errMsg
        });
        sonnerToast.error(errMsg);
      }
    } catch (err: any) {
      const errMsg = err.message || '网络连接异常';
      setTestResult({
        success: false,
        message: errMsg
      });
      sonnerToast.error(errMsg);
    } finally {
      setFetchingModels(false);
    }
  };

  /**
   * 连通性测试
   */
  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      const msg = '请先填写 API Key';
      setTestResult({ success: false, message: msg });
      sonnerToast.error(msg);
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const token = getStoredToken();
      const res = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          test: true,
          apiKey: apiKey.trim(),
          baseURL: baseURL.trim(),
          model: model.trim()
        })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        const msg = data.message || `大模型连接成功 (${model.trim()})`;
        setTestResult({
          success: true,
          message: msg
        });
        sonnerToast.success(msg);
      } else {
        const errMsg = data.message || data.error || '连接失败，请检查配置或网络';
        setTestResult({
          success: false,
          message: errMsg
        });
        sonnerToast.error(errMsg);
      }
    } catch (err: any) {
      const errMsg = err.message || '网络连接异常';
      setTestResult({
        success: false,
        message: errMsg
      });
      sonnerToast.error(errMsg);
    } finally {
      setTesting(false);
    }
  };

  /**
   * 持久化保存 AI 配置
   */
  const handleSaveImmediate = async () => {
    const nextAiConfig: AiConfig = {
      enabled,
      apiKey: apiKey.trim(),
      baseURL: baseURL.trim() || 'https://api.deepseek.com/v1',
      model: model.trim() || 'deepseek-chat'
    };

    const currentSettings = useStorageStore.getState().customSettings || {};
    const nextCustomSettings = {
      ...currentSettings,
      aiConfig: nextAiConfig
    };

    setCustomSettings(nextCustomSettings);

    try {
      await saveSqliteKey('customSettings', nextCustomSettings);
      setSaveSuccess(true);
      sonnerToast.success('AI 配置已保存');
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('[AiConfigSection] save failed:', err);
      sonnerToast.error('保存失败，请稍后重试');
    }
  };

  return (
    <div className={cn('space-y-4 text-left w-full min-w-0 max-w-full', className)}>
      {/* 1. 总开关卡片 */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
          <div
            className={cn(
              'size-9 rounded-lg flex items-center justify-center shrink-0 border transition-colors',
              enabled
                ? 'bg-primary/10 text-primary border-primary/25'
                : 'bg-muted/40 text-muted-foreground border-border'
            )}
          >
            <Sparkles className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="ai-master-switch"
                className="text-sm font-semibold tracking-tight text-foreground cursor-pointer"
              >
                AI 截图智能识别
              </Label>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs px-2 py-0.5 font-medium rounded-full border shrink-0',
                  enabled
                    ? apiKey.trim()
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : 'bg-muted/30 text-muted-foreground border-border'
                )}
              >
                {enabled ? (apiKey.trim() ? '已就绪' : '待配置 Key') : '未启用'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              通过大模型视觉能力解析持仓截图中的基金代码与份额，实现极速导入
            </p>
          </div>
        </div>
        <Switch
          id="ai-master-switch"
          checked={enabled}
          onCheckedChange={(checked) => setEnabled(Boolean(checked))}
          aria-label="启用 AI 截图识别"
          className="shrink-0"
        />
      </div>

      {/* 2. 推荐服务商 (规范网格布局) */}
      <div
        className={cn(
          'space-y-2 w-full min-w-0 transition-opacity duration-150',
          !enabled && 'opacity-50 pointer-events-none'
        )}
      >
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Cpu className="size-3.5 text-primary" />
            <span>推荐服务商预设</span>
          </Label>
          <span className="text-xs text-muted-foreground">点击自动填入接口与默认模型</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 w-full min-w-0">
          {PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            const IconComponent = preset.icon;
            const theme = preset.theme;
            return (
              <div
                key={preset.id}
                role="button"
                tabIndex={0}
                onClick={() => applyPreset(preset)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    applyPreset(preset);
                  }
                }}
                className={cn(
                  'group relative flex flex-col justify-between p-2.5 sm:p-3 rounded-xl border text-left cursor-pointer transition-[background-color,border-color,box-shadow,color] duration-150 ease-out select-none min-w-0 overflow-hidden',
                  isSelected
                    ? cn(theme.activeBorder, theme.activeBg, theme.activeRing, 'shadow-xs')
                    : 'bg-card/70 border-border hover:bg-card hover:border-primary/40'
                )}
              >
                <div className="flex items-center justify-between gap-1 min-w-0 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0 font-medium text-xs text-foreground">
                    <IconComponent
                      className={cn(
                        'size-3.5 shrink-0 transition-colors',
                        isSelected ? theme.activeText : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    />
                    <span className="truncate font-semibold">{preset.name}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[11px] px-1.5 py-0 h-4.5 font-normal shrink-0 border rounded-md',
                      isSelected ? theme.badgeStyle : 'bg-secondary text-muted-foreground border-border/60'
                    )}
                  >
                    {preset.badge}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-border/40 text-xs text-muted-foreground font-mono min-w-0">
                  <span className="truncate max-w-[110px]">{preset.model || '自定义端点'}</span>
                  <span
                    className={cn(
                      'text-[11px] shrink-0 font-sans',
                      isSelected ? theme.activeText : 'text-muted-foreground/70'
                    )}
                  >
                    {preset.latencyHint}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 接口与模型配置 */}
      <div
        className={cn(
          'p-4 sm:p-5 rounded-xl border border-border bg-card shadow-xs space-y-4 w-full min-w-0 transition-opacity duration-150',
          !enabled && 'opacity-50 pointer-events-none'
        )}
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-border">
          <div className="text-xs font-semibold tracking-tight text-foreground flex items-center gap-2">
            <div className="size-7 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shrink-0">
              <KeyRound className="size-3.5" />
            </div>
            <span>接口与模型参数</span>
          </div>
          <span className="text-xs text-muted-foreground font-mono">OpenAI Compatible</span>
        </div>

        {/* API Key */}
        <div className="space-y-1.5 min-w-0">
          <Label htmlFor="ai-api-key" className="text-xs font-semibold text-foreground flex items-center gap-1">
            <span>API Key</span>
            <span className="text-destructive font-bold">*</span>
          </Label>
          <div className="relative flex items-center min-w-0">
            <Input
              id="ai-api-key"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestResult(null);
              }}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full h-9.5 pr-10 text-[16PX] md:text-xs bg-background font-mono border-border focus-visible:ring-1 focus-visible:ring-primary/40 rounded-lg"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 text-muted-foreground hover:text-foreground p-1.5 transition-colors cursor-pointer"
              title={showKey ? '隐藏密钥' : '显示密钥'}
              tabIndex={-1}
            >
              {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* 接口地址 */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center justify-between">
            <Label htmlFor="ai-base-url" className="text-xs font-semibold text-foreground flex items-center gap-1">
              <span>接口地址 (Base URL)</span>
              <span className="text-destructive font-bold">*</span>
            </Label>
            {baseURL !== 'https://api.deepseek.com/v1' && (
              <button
                type="button"
                onClick={() => setBaseURL('https://api.deepseek.com/v1')}
                className="text-xs text-primary hover:underline cursor-pointer"
              >
                恢复默认
              </button>
            )}
          </div>
          <Input
            id="ai-base-url"
            type="text"
            value={baseURL}
            onChange={(e) => {
              setBaseURL(e.target.value);
              setTestResult(null);
            }}
            placeholder="https://api.deepseek.com/v1"
            className="w-full h-9.5 text-[16PX] md:text-xs bg-background font-mono border-border focus-visible:ring-1 focus-visible:ring-primary/40 rounded-lg"
          />
        </div>

        {/* 模型名称 */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <Label htmlFor="ai-model-input" className="text-xs font-semibold text-foreground flex items-center gap-1">
              <span>模型名称 (Model)</span>
              <span className="text-destructive font-bold">*</span>
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFetchModels}
              disabled={fetchingModels || !apiKey.trim()}
              className="h-6.5 px-2 text-xs gap-1 rounded-md border-border hover:border-primary/40 cursor-pointer"
            >
              <RefreshCw className={cn('size-3', fetchingModels && 'animate-spin')} />
              <span>{fetchingModels ? '拉取中…' : '获取模型列表'}</span>
            </Button>
          </div>

          {modelList.length > 0 && !isManualInput ? (
            <div className="flex gap-2 items-center min-w-0">
              <Select
                value={model}
                onValueChange={(val) => {
                  setModel(val);
                  setTestResult(null);
                }}
              >
                <SelectTrigger className="flex-1 h-9.5 bg-background text-xs font-mono border-border rounded-lg">
                  <SelectValue placeholder="选择模型" />
                </SelectTrigger>
                <SelectContent className="z-[10001] max-h-56">
                  {modelList.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs font-mono">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsManualInput(true)}
                className="h-9.5 px-3 text-xs shrink-0 rounded-lg border-border cursor-pointer"
              >
                手动输入
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 items-center min-w-0">
              <Input
                id="ai-model-input"
                type="text"
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setTestResult(null);
                }}
                placeholder="deepseek-chat"
                className="flex-1 h-9.5 text-[16PX] md:text-xs bg-background font-mono border-border focus-visible:ring-1 focus-visible:ring-primary/40 rounded-lg"
              />
              {modelList.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsManualInput(false)}
                  className="h-9.5 px-3 text-xs gap-1 shrink-0 rounded-lg border-border cursor-pointer"
                >
                  <ListFilter className="size-3.5" />
                  <span>选择模型</span>
                </Button>
              )}
            </div>
          )}

          {modelFetchMsg && (
            <div
              className={cn(
                'text-xs mt-1 flex items-center gap-1.5',
                modelList.length > 0 ? 'text-emerald-500' : 'text-muted-foreground'
              )}
            >
              {modelList.length > 0 && <CheckCircle2 className="size-3.5" />}
              <span>{modelFetchMsg}</span>
            </div>
          )}
        </div>

        {/* 4. 测试与保存 */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-border">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testing || !apiKey.trim()}
              className={cn(
                'h-9 px-3.5 text-xs font-medium gap-1.5 rounded-lg border-border hover:border-primary/40 transition-colors cursor-pointer',
                testResult?.success && 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
              )}
            >
              <RefreshCw className={cn('size-3.5', testing && 'animate-spin')} />
              <span>{testing ? '测试中…' : testResult?.success ? '测试通过' : '测试连接'}</span>
            </Button>

            {testResult && (
              <div
                className={cn(
                  'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border animate-in fade-in zoom-in-95 duration-200 min-w-0',
                  testResult.success
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                    : 'bg-destructive/10 text-destructive border-destructive/25'
                )}
              >
                {testResult.success ? (
                  <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircle className="size-3.5 shrink-0" />
                )}
                <span className="truncate max-w-[220px] sm:max-w-[340px] font-mono">{testResult.message}</span>
              </div>
            )}
          </div>

          {showImmediateSaveButton && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSaveImmediate}
              className={cn(
                'h-9 px-4 text-xs font-medium gap-1.5 rounded-lg transition-all duration-150 ease-out shadow-xs cursor-pointer',
                saveSuccess && 'bg-emerald-600 hover:bg-emerald-600/90 text-white'
              )}
            >
              {saveSuccess ? <Check className="size-3.5" /> : <Save className="size-3.5" />}
              <span>{saveSuccess ? '已保存 ✓' : '保存配置'}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
