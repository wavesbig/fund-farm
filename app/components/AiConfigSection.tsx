'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { isString, isObject, isArray, isBoolean } from 'lodash';
import { Eye, EyeOff, CheckCircle2, AlertCircle, Sparkles, RefreshCw, ListFilter, Save } from 'lucide-react';
import { useStorageStore } from '../stores';
import { getStoredToken } from '../lib/authClient';
import { saveSqliteKey } from '../lib/sqliteClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const PRESETS = [
  {
    name: 'DeepSeek 官方',
    baseURL: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    tip: '性价比极高，推荐使用'
  },
  {
    name: '硅基流动 (SiliconFlow)',
    baseURL: 'https://api.siliconflow.cn/v1',
    model: 'deepseek-ai/DeepSeek-V3',
    tip: '国内高速大模型托管平台'
  },
  {
    name: '通义千问 (DashScope)',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
    tip: '阿里百炼 OpenAPI 兼容端点'
  },
  {
    name: 'OpenAI 官方',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    tip: '官方标准端点（需科学上网）'
  },
  {
    name: '本地 Ollama',
    baseURL: 'http://localhost:11434/v1',
    model: 'qwen2.5:7b',
    tip: '本地私有化部署，无需联网'
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

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    setBaseURL(preset.baseURL);
    setModel(preset.model);
    setTestResult(null);
    setModelFetchMsg('');
  };

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
    <div
      className={cn('ai-config-section p-3.5 rounded-xl bg-white/[0.04] border border-[var(--border)] mb-4', className)}
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>大模型 AI 接口设置 (OpenAPI / DeepSeek)</span>
        </div>
        {showImmediateSaveButton && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSaveImmediate}
            className={cn(
              'h-7 px-2.5 text-xs gap-1 transition-colors',
              saveSuccess && 'bg-[var(--success)] text-white hover:bg-[var(--success)]/90 border-[var(--success)]'
            )}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saveSuccess ? '已保存至 SQLite ✓' : '保存 AI 配置'}</span>
          </Button>
        )}
      </div>

      {/* 快速服务商预设 */}
      <div className="mb-3">
        <div className="text-[11px] text-[var(--muted)] mb-1.5">快速预设服务商：</div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => {
            const isSelected = baseURL === p.baseURL && model === p.model;
            return (
              <Button
                key={p.name}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                className="h-6 px-2 text-[11px] rounded-md"
                onClick={() => applyPreset(p)}
              >
                {p.name}
              </Button>
            );
          })}
        </div>
      </div>

      {/* 表单输入区域 */}
      <div className="flex flex-col gap-2.5">
        {/* API Key */}
        <div>
          <label className="block text-xs font-medium mb-1 text-foreground">
            API Key <span className="text-[var(--danger)]">*</span>
          </label>
          <div className="relative flex items-center">
            <Input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestResult(null);
              }}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full h-9 pr-9 text-[16PX] md:text-sm bg-black/20"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 text-[var(--muted)] hover:text-foreground p-1 transition-colors"
              title={showKey ? '隐藏 API Key' : '显示 API Key'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1">
            本地私密存储于 SQLite 数据库，服务端官方 openai SDK 发送请求。
          </div>
        </div>

        {/* 接口地址 Base URL */}
        <div>
          <label className="block text-xs font-medium mb-1 text-foreground">接口地址 (Base URL)</label>
          <Input
            type="text"
            value={baseURL}
            onChange={(e) => {
              setBaseURL(e.target.value);
              setTestResult(null);
            }}
            placeholder="https://api.deepseek.com/v1"
            className="w-full h-9 text-[16PX] md:text-sm bg-black/20"
          />
        </div>

        {/* 模型名称 Model (支持通过 API Key 一键拉取) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-foreground">
              模型名称 (Model) <span className="text-[var(--danger)]">*</span>
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFetchModels}
              disabled={fetchingModels || !apiKey.trim()}
              className="h-6 px-2 text-[11px] gap-1"
              title="根据当前 API Key 自动拉取该服务商支持的模型列表"
            >
              <RefreshCw className={cn('w-3 h-3', fetchingModels && 'animate-spin')} />
              <span>{fetchingModels ? '拉取中…' : '从 API Key 获取模型'}</span>
            </Button>
          </div>

          {modelList.length > 0 && !isManualInput ? (
            <div className="flex gap-1.5 items-center">
              <select
                className="input flex-1 h-9 rounded-xl border border-input bg-black/20 px-3 text-[16PX] md:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setTestResult(null);
                }}
              >
                {modelList.map((m) => (
                  <option key={m} value={m} className="bg-popover text-popover-foreground">
                    {m}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsManualInput(true)}
                className="h-9 px-2 text-xs shrink-0"
                title="切换为手动自由输入"
              >
                自由输入
              </Button>
            </div>
          ) : (
            <div className="flex gap-1.5 items-center">
              <Input
                type="text"
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setTestResult(null);
                }}
                placeholder="deepseek-chat"
                className="flex-1 h-9 text-[16PX] md:text-sm bg-black/20"
              />
              {modelList.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsManualInput(false)}
                  className="h-9 px-2 text-xs gap-1 shrink-0"
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
                'text-[11px] mt-1 flex items-center gap-1',
                modelList.length > 0 ? 'text-[var(--success)]' : 'text-[var(--muted)]'
              )}
            >
              {modelList.length > 0 && <CheckCircle2 className="w-3 h-3" />}
              <span>{modelFetchMsg}</span>
            </div>
          )}
        </div>

        {/* 连通性测试按钮与结果 */}
        <div className="flex items-center gap-2 mt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={testing}
            className="h-8 px-2.5 text-xs gap-1"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', testing && 'animate-spin')} />
            <span>{testing ? '测试中…' : '测试连接'}</span>
          </Button>
          {testResult && (
            <span
              className={cn(
                'text-xs flex items-center gap-1 break-all',
                testResult.success ? 'text-[var(--success)]' : 'text-[var(--danger)]'
              )}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
