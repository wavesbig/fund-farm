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
  ShieldCheck,
  Check,
  ListFilter,
  Info
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
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
  tip: string;
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
    badge: '官方推荐',
    baseURL: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    tip: '原生 DeepSeek-V3 接口，识别基金代码准确度极高',
    latencyHint: '极速',
    icon: Sparkles,
    theme: {
      activeBorder: 'border-cyan-500',
      activeBg: 'bg-cyan-500/12',
      activeText: 'text-cyan-500 dark:text-cyan-400',
      activeRing: 'ring-1 ring-cyan-500/30',
      badgeStyle: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
      hoverBorder: 'hover:border-cyan-500/40'
    }
  },
  {
    id: 'siliconflow',
    name: '硅基流动',
    badge: '国内免翻',
    baseURL: 'https://api.siliconflow.cn/v1',
    model: 'deepseek-ai/DeepSeek-V3',
    tip: '国内极速专线托管，支持满血版 DeepSeek-V3 / R1',
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
    tip: '阿里云官方 OpenAPI 兼容端点，高并发稳定性优秀',
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
    badge: 'GPT-4o',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    tip: '官方标准端点，需网络环境支持海外访问',
    latencyHint: '国际原厂',
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
    badge: '私有免联网',
    baseURL: 'http://localhost:11434/v1',
    model: 'qwen2.5:7b',
    tip: '局域网或本机部署，持仓信息不出内网，零费用消耗',
    latencyHint: '本地私有',
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
    name: '自定义端点',
    badge: '通用兼容',
    baseURL: '',
    model: '',
    tip: '支持任何符合 OpenAI / OpenAPI 规范的中转或自建接口',
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

  // 1. 初始化读取配置：优先读内存，同时调接口确保从 SQLite 恢复最新配置
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

  // 计算当前选中的服务商 ID
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
   * 通过 API Key 和 Base URL 自动拉取该服务商支持的模型列表 (/v1/models)
   */
  const handleFetchModels = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: '请先填写 API Key 再获取模型列表' });
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
          setModelFetchMsg(`已成功拉取 ${data.models.length} 个可用模型`);

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
          setModelFetchMsg('该服务商返回的模型列表为空，可继续手动输入');
        }
      } else {
        setTestResult({
          success: false,
          message: data.message || '获取模型列表失败，请检查 Base URL 与 API Key 是否正确'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || '网络连接异常'
      });
    } finally {
      setFetchingModels(false);
    }
  };

  /**
   * 连通性测试
   */
  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: '请先输入 API Key 再进行测试' });
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
        setTestResult({
          success: true,
          message: data.message || '连接成功！模型响应正常。'
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || data.error || '测试连接失败，请检查 Base URL、API Key 与网络状态'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || '网络连接异常'
      });
    } finally {
      setTesting(false);
    }
  };

  /**
   * 立即持久化保存 AI 配置至 SQLite 和 store
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
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('[AiConfigSection] Immediate SQLite save failed:', err);
    }
  };

  return (
    <div className={cn('space-y-4 text-left w-full min-w-0 max-w-full', className)}>
      {/* 1. 总开关与状态卡片 (精美渐变光晕质感) */}
      <Card className="p-4 sm:p-4.5 gap-3 bg-gradient-to-r from-primary/10 via-accent/5 to-card/60 border border-primary/25 rounded-2xl shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={cn(
                'p-2.5 rounded-xl shrink-0 transition-all border',
                enabled
                  ? 'bg-primary/15 text-primary border-primary/30 shadow-xs'
                  : 'bg-muted/30 text-muted-foreground border-border/50'
              )}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Label htmlFor="ai-master-switch" className="text-sm font-semibold text-foreground cursor-pointer">
                  AI 截图智能提取与识别
                </Label>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] px-2 py-0.5 h-4.5 font-medium rounded-md border',
                    enabled
                      ? apiKey.trim()
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-muted/40 text-muted-foreground border-border/50'
                  )}
                >
                  {enabled ? (apiKey.trim() ? '服务就绪 ✓' : '待配置 API Key') : '已停用'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed truncate sm:whitespace-normal">
                导入支付宝、微信、天天基金持仓截图时，调用大模型识别基金代码、金额与收益。
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
      </Card>

      {/* 2. 服务商选择卡片网格 (品牌个性化着色，避免暗沉杂灰) */}
      <div
        className={cn('space-y-2.5 w-full min-w-0 transition-opacity', !enabled && 'opacity-50 pointer-events-none')}
      >
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-primary" />
            <span>精选推荐服务商</span>
          </Label>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">一键套用推荐端点与模型</span>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full min-w-0">
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
                  'w-full sm:w-[calc(50%-5px)] lg:w-[calc(33.333%-7px)] relative flex flex-col justify-between p-3 rounded-xl border text-left transition-all cursor-pointer group select-none min-w-0 overflow-hidden backdrop-blur-sm',
                  isSelected
                    ? cn(theme.activeBorder, theme.activeBg, theme.activeRing, 'shadow-xs')
                    : cn('bg-card/60 border-border/70 hover:bg-card/90', theme.hoverBorder)
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-1.5 mb-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground truncate min-w-0">
                      <IconComponent
                        className={cn(
                          'w-3.5 h-3.5 shrink-0 transition-colors',
                          isSelected ? theme.activeText : 'text-muted-foreground'
                        )}
                      />
                      <span className="truncate">{preset.name}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('text-[9px] px-1.5 py-0 h-4 font-normal shrink-0 border', theme.badgeStyle)}
                    >
                      {preset.badge}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 leading-snug mb-2">{preset.tip}</p>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-border/40 text-[10px] text-muted-foreground font-mono min-w-0">
                  <span className="truncate max-w-[130px]">{preset.model || '自定义端点'}</span>
                  <span
                    className={cn(
                      'text-[9px] shrink-0 font-sans',
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

      {/* 3. 接口凭据与模型配置卡片 (通透毛玻璃面板) */}
      <Card
        className={cn(
          'p-4 sm:p-5 gap-3.5 bg-card/50 border-border/70 shadow-xs rounded-2xl space-y-3.5 w-full min-w-0 backdrop-blur-sm transition-opacity',
          !enabled && 'opacity-50 pointer-events-none'
        )}
      >
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <div className="text-xs font-semibold text-foreground flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <KeyRound className="w-3.5 h-3.5" />
            </div>
            <span>接口凭据与模型参数</span>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">OpenAI Compatible</span>
        </div>

        {/* API Key */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center justify-between">
            <Label htmlFor="ai-api-key" className="text-xs font-medium text-foreground flex items-center gap-1">
              <span>API 密钥 (API Key)</span>
              <span className="text-destructive font-bold">*</span>
            </Label>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>本地 SQLite 私密存储</span>
            </div>
          </div>
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
              className="w-full h-9 pr-9 text-[16PX] md:text-sm bg-background/80 font-mono border-border/70 focus-visible:ring-1 focus-visible:ring-primary/40"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
              title={showKey ? '隐藏密钥' : '显示密钥'}
              tabIndex={-1}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            API Key 仅加密保存在本地设备，服务端仅转发请求，绝不上云存储。
          </p>
        </div>

        {/* 接口地址 (Base URL) */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center justify-between">
            <Label htmlFor="ai-base-url" className="text-xs font-medium text-foreground flex items-center gap-1">
              <span>接口端点 (Base URL)</span>
              <span className="text-destructive font-bold">*</span>
            </Label>
            {baseURL !== 'https://api.deepseek.com/v1' && (
              <button
                type="button"
                onClick={() => setBaseURL('https://api.deepseek.com/v1')}
                className="text-[11px] text-primary hover:underline cursor-pointer"
              >
                恢复 DeepSeek 端点
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
            className="w-full h-9 text-[16PX] md:text-sm bg-background/80 font-mono border-border/70 focus-visible:ring-1 focus-visible:ring-primary/40"
          />
        </div>

        {/* 模型名称 (Model) */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <Label htmlFor="ai-model-input" className="text-xs font-medium text-foreground flex items-center gap-1">
              <span>模型名称 (Model)</span>
              <span className="text-destructive font-bold">*</span>
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFetchModels}
              disabled={fetchingModels || !apiKey.trim()}
              className="h-6 px-2 text-[11px] gap-1 rounded-md border-border/70 hover:border-primary/40"
              title="根据当前 API Key 自动拉取该服务商支持的模型列表"
            >
              <RefreshCw className={cn('w-3 h-3', fetchingModels && 'animate-spin')} />
              <span>{fetchingModels ? '拉取中…' : '从 API Key 自动获取模型'}</span>
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
                <SelectTrigger className="flex-1 h-9 bg-background/80 text-xs font-mono border-border/70">
                  <SelectValue placeholder="请选择模型" />
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
                className="h-9 px-2.5 text-xs shrink-0 rounded-lg border-border/70"
                title="切换为手动自由输入"
              >
                自由输入
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
                className="flex-1 h-9 text-[16PX] md:text-sm bg-background/80 font-mono border-border/70 focus-visible:ring-1 focus-visible:ring-primary/40"
              />
              {modelList.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsManualInput(false)}
                  className="h-9 px-2.5 text-xs gap-1 shrink-0 rounded-lg border-border/70"
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>选择已拉取</span>
                </Button>
              )}
            </div>
          )}

          {modelFetchMsg && (
            <div
              className={cn(
                'text-[11px] mt-1 flex items-center gap-1.5',
                modelList.length > 0 ? 'text-emerald-500' : 'text-muted-foreground'
              )}
            >
              {modelList.length > 0 && <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{modelFetchMsg}</span>
            </div>
          )}
        </div>

        {/* 4. 测试与即时保存工具栏 */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={testing || !apiKey.trim()}
            className="h-8.5 px-3 text-xs gap-1.5 rounded-lg border-border/70 hover:border-primary/40"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', testing && 'animate-spin')} />
            <span>{testing ? '正在测试连接…' : '测试连接 (Ping)'}</span>
          </Button>

          {showImmediateSaveButton && (
            <Button
              type="button"
              variant={saveSuccess ? 'default' : 'secondary'}
              size="sm"
              onClick={handleSaveImmediate}
              className={cn(
                'h-8.5 px-3.5 text-xs gap-1.5 rounded-lg transition-all',
                saveSuccess && 'bg-emerald-600 hover:bg-emerald-600/90 text-white shadow-xs'
              )}
            >
              {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saveSuccess ? '已即时落盘保存 ✓' : '单独保存 AI 配置'}</span>
            </Button>
          )}
        </div>

        {/* 测试结果提示 */}
        {testResult && (
          <Alert
            variant={testResult.success ? 'default' : 'destructive'}
            className={cn(
              'mt-2 py-2.5 px-3.5 text-xs border rounded-xl overflow-hidden',
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                : 'bg-destructive/10 border-destructive/25 text-destructive'
            )}
          >
            {testResult.success ? (
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="size-4 shrink-0" />
            )}
            <AlertDescription className="text-xs break-all leading-relaxed overflow-hidden">
              {testResult.message}
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* 5. 提示与使用帮助卡片 */}
      <Alert className="bg-card/40 border-border/60 text-muted-foreground p-3.5 rounded-xl backdrop-blur-sm">
        <Info className="size-4 text-primary shrink-0" />
        <AlertTitle className="text-xs font-semibold text-foreground">如何使用截图导入？</AlertTitle>
        <AlertDescription className="text-xs mt-1 leading-relaxed">
          在应用主页面直接粘贴（Ctrl+V）或拖拽持仓截图，系统将通过内置 Tesseract 进行 OCR
          预处理，再由本设置中的大模型自动解析基金代码并完成导入。
        </AlertDescription>
      </Alert>
    </div>
  );
}
