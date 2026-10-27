'use client';

import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
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
  badgeVariant: 'default' | 'secondary' | 'outline';
  baseURL: string;
  model: string;
  tip: string;
  latencyHint: string;
  icon: React.ElementType;
}

const PRESETS: ProviderPreset[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek 官方',
    badge: '推荐 · 性价比',
    badgeVariant: 'default',
    baseURL: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    tip: '原生 DeepSeek-V3 接口，识别基金代码准确度极高',
    latencyHint: '极速',
    icon: Sparkles
  },
  {
    id: 'siliconflow',
    name: '硅基流动',
    badge: '国内免翻',
    badgeVariant: 'secondary',
    baseURL: 'https://api.siliconflow.cn/v1',
    model: 'deepseek-ai/DeepSeek-V3',
    tip: '国内高速专线托管，支持满血版 DeepSeek-V3 / R1',
    latencyHint: '低延迟',
    icon: Cpu
  },
  {
    id: 'dashscope',
    name: '通义千问',
    badge: '阿里百炼',
    badgeVariant: 'secondary',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
    tip: '阿里云官方 OpenAPI 兼容端点，高并发稳定性优秀',
    latencyHint: '高可用',
    icon: Globe
  },
  {
    id: 'openai',
    name: 'OpenAI 官方',
    badge: '国际原厂',
    badgeVariant: 'outline',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    tip: '官方标准端点，需网络环境支持海外访问',
    latencyHint: '海外专线',
    icon: Bot
  },
  {
    id: 'ollama',
    name: '本地 Ollama',
    badge: '私有免联网',
    badgeVariant: 'outline',
    baseURL: 'http://localhost:11434/v1',
    model: 'qwen2.5:7b',
    tip: '局域网或本机部署，持仓信息不出内网，零费用消耗',
    latencyHint: '本地',
    icon: Layers
  },
  {
    id: 'custom',
    name: '自定义端点',
    badge: '通用兼容',
    badgeVariant: 'outline',
    baseURL: '',
    model: '',
    tip: '支持任何符合 OpenAI / OpenAPI 规范的中转或自建接口',
    latencyHint: '自定义',
    icon: KeyRound
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

    // 从服务端 SQLite 查询最新数据兜底
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
      // 切换为自定义，保留当前内容，便于用户自由编辑
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

          // 优先定位常用聊天模型
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

    // 1. 同步写入 Zustand 内存 store (由 storageStore 处理持久化)
    setCustomSettings(nextCustomSettings);

    // 2. 立即直接落盘至本地 SQLite 数据库，彻底杜绝防抖丢数据
    try {
      await saveSqliteKey('customSettings', nextCustomSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('[AiConfigSection] Immediate SQLite save failed:', err);
    }
  };

  return (
    <div className={cn('space-y-4 text-left', className)}>
      {/* 1. 总开关与状态卡片 */}
      <Card className="p-4 gap-3 bg-muted/30 border-border/60 shadow-none rounded-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                'p-2.5 rounded-xl shrink-0 transition-colors',
                enabled ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
              )}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Label htmlFor="ai-master-switch" className="text-sm font-semibold text-foreground cursor-pointer">
                  AI 截图智能提取与识别
                </Label>
                <Badge
                  variant={enabled ? (apiKey.trim() ? 'default' : 'secondary') : 'outline'}
                  className="text-[10px] px-1.5 py-0 h-4 font-normal"
                >
                  {enabled ? (apiKey.trim() ? '服务就绪 ✓' : '待配置 API Key') : '已停用'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                导入支付宝、微信、天天基金等持仓截图时，自动调用大语言模型识别基金代码、金额与收益。
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

      {/* 2. 服务商选择卡片网格 */}
      <div className={cn('space-y-2 transition-opacity', !enabled && 'opacity-50 pointer-events-none')}>
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-primary" />
            <span>精选推荐服务商</span>
          </Label>
          <span className="text-[11px] text-muted-foreground">一键套用标准接口与推荐模型</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            const IconComponent = preset.icon;
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
                  'relative flex flex-col justify-between p-3 rounded-xl border text-left transition-all cursor-pointer group select-none',
                  isSelected
                    ? 'bg-primary/10 border-primary ring-1 ring-primary/40 shadow-xs'
                    : 'bg-muted/20 border-border/60 hover:bg-muted/50 hover:border-border'
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground truncate">
                      <IconComponent
                        className={cn('w-3.5 h-3.5 shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')}
                      />
                      <span className="truncate">{preset.name}</span>
                    </div>
                    <Badge variant={preset.badgeVariant} className="text-[10px] px-1.5 py-0 h-4 font-normal shrink-0">
                      {preset.badge}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight mb-2">{preset.tip}</p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground font-mono">
                  <span className="truncate max-w-[120px]">{preset.model || '自定义端点'}</span>
                  <span className={cn('text-[9px] shrink-0', isSelected ? 'text-primary font-medium' : '')}>
                    {preset.latencyHint}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 接口凭据与模型配置卡片 */}
      <Card
        className={cn(
          'p-4 gap-3 bg-muted/30 border-border/60 shadow-none rounded-xl space-y-3.5 transition-opacity',
          !enabled && 'opacity-50 pointer-events-none'
        )}
      >
        <div className="flex items-center justify-between pb-1 border-b border-border/40">
          <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-primary" />
            <span>接口凭据与模型参数</span>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">OpenAI Compatible API</span>
        </div>

        {/* API Key */}
        <div className="space-y-1.5">
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
          <div className="relative flex items-center">
            <Input
              id="ai-api-key"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestResult(null);
              }}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full h-9 pr-9 text-[16PX] md:text-sm bg-background/60 font-mono"
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
            API Key 仅存放于您本地浏览器及内置 SQLite 数据库中，服务端仅做请求转发，绝不记录存储。
          </p>
        </div>

        {/* 接口地址 (Base URL) */}
        <div className="space-y-1.5">
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
                恢复默认端点
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
            className="w-full h-9 text-[16PX] md:text-sm bg-background/60 font-mono"
          />
        </div>

        {/* 模型名称 (Model) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
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
              className="h-6 px-2 text-[11px] gap-1 rounded-md"
              title="根据当前 API Key 自动拉取该服务商支持的模型列表"
            >
              <RefreshCw className={cn('w-3 h-3', fetchingModels && 'animate-spin')} />
              <span>{fetchingModels ? '拉取中…' : '从 API Key 自动获取模型'}</span>
            </Button>
          </div>

          {modelList.length > 0 && !isManualInput ? (
            <div className="flex gap-2 items-center">
              <Select
                value={model}
                onValueChange={(val) => {
                  setModel(val);
                  setTestResult(null);
                }}
              >
                <SelectTrigger className="flex-1 h-9 bg-background/60 text-xs font-mono">
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
                className="h-9 px-2.5 text-xs shrink-0 rounded-lg"
                title="切换为手动自由输入"
              >
                自由输入
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 items-center">
              <Input
                id="ai-model-input"
                type="text"
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setTestResult(null);
                }}
                placeholder="deepseek-chat"
                className="flex-1 h-9 text-[16PX] md:text-sm bg-background/60 font-mono"
              />
              {modelList.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsManualInput(false)}
                  className="h-9 px-2 text-xs gap-1 shrink-0 rounded-lg"
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
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={testing || !apiKey.trim()}
            className="h-8 px-3 text-xs gap-1.5 rounded-lg"
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
                'h-8 px-3 text-xs gap-1.5 rounded-lg transition-colors',
                saveSuccess && 'bg-emerald-600 text-white hover:bg-emerald-600/90'
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
              'mt-2 py-2 px-3 text-xs',
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-destructive/10 border-destructive/20 text-destructive'
            )}
          >
            {testResult.success ? (
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="size-4 shrink-0" />
            )}
            <AlertDescription className="text-xs break-all leading-relaxed">{testResult.message}</AlertDescription>
          </Alert>
        )}
      </Card>

      {/* 5. 提示与使用帮助 */}
      <Alert className="bg-muted/20 border-border/50 text-muted-foreground p-3">
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
