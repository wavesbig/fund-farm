'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { isString, isObject, isArray } from 'lodash';
import { Eye, EyeOff, CheckCircle2, AlertCircle, Sparkles, RefreshCw, ListFilter, Save } from 'lucide-react';
import { useStorageStore } from '../stores';
import { getStoredToken } from '../lib/authClient';
import { saveSqliteKey } from '../lib/sqliteClient';

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

export default function AiConfigSection({ onAiConfigChange, showImmediateSaveButton = true }) {
  const customSettings = useStorageStore((s) => s.customSettings) || {};
  const setCustomSettings = useStorageStore((s) => s.setCustomSettings);

  const [apiKey, setApiKey] = useState('');
  const [baseURL, setBaseURL] = useState('https://api.deepseek.com/v1');
  const [model, setModel] = useState('deepseek-chat');
  const [enabled, setEnabled] = useState(true);
  const [showKey, setShowKey] = useState(false);

  const [modelList, setModelList] = useState([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelFetchMsg, setModelFetchMsg] = useState('');
  const [isManualInput, setIsManualInput] = useState(false);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadedFromDb, setLoadedFromDb] = useState(false);

  // 1. 初始化读取配置：优先读内存，同时调接口确保从 SQLite 恢复最新配置
  useEffect(() => {
    const memoryAi = customSettings?.aiConfig;
    if (memoryAi && isObject(memoryAi)) {
      if (isString(memoryAi.apiKey)) setApiKey(memoryAi.apiKey);
      if (isString(memoryAi.baseURL) && memoryAi.baseURL.trim()) setBaseURL(memoryAi.baseURL);
      if (isString(memoryAi.model) && memoryAi.model.trim()) setModel(memoryAi.model);
      if (typeof memoryAi.enabled === 'boolean') setEnabled(memoryAi.enabled);
      setLoadedFromDb(true);
    }

    // 从服务端 SQLite 查询最新数据兜底
    const fetchLatestFromDb = async () => {
      try {
        const token = getStoredToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch('/api/sync?key=customSettings', { headers });
        if (!res.ok) return;
        const json = await res.json();
        const dbCustomSettings = json?.value;
        const dbAi = dbCustomSettings?.aiConfig;
        if (dbAi && isObject(dbAi)) {
          if (isString(dbAi.apiKey)) setApiKey(dbAi.apiKey);
          if (isString(dbAi.baseURL) && dbAi.baseURL.trim()) setBaseURL(dbAi.baseURL);
          if (isString(dbAi.model) && dbAi.model.trim()) setModel(dbAi.model);
          if (typeof dbAi.enabled === 'boolean') setEnabled(dbAi.enabled);
          setLoadedFromDb(true);
        }
      } catch (e) {
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

  const applyPreset = (preset) => {
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
                (m) =>
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
    } catch (err) {
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
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || '网络连接异常'
      });
    } finally {
      setTesting(false);
    }
  };

  /**
   * 立即持久化保存 AI 配置至 SQLite 和内存
   */
  const handleSaveImmediate = async () => {
    const nextAiConfig = {
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

    // 1. 同步写入 Zustand 内存 store
    setCustomSettings(nextCustomSettings);

    // 2. 写入 window.localStorage
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('customSettings', JSON.stringify(nextCustomSettings));
      } catch (e) {}
    }

    // 3. 立即直接落盘至本地 SQLite 数据库，彻底杜绝防抖丢数据
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
      className="ai-config-section"
      style={{
        padding: '14px',
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid var(--border)',
        marginBottom: '16px'
      }}
    >
      {/* 标题栏 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>大模型 AI 接口设置 (OpenAPI / DeepSeek)</span>
        </div>
        {showImmediateSaveButton && (
          <button
            type="button"
            className="button secondary text-xs"
            onClick={handleSaveImmediate}
            style={{
              padding: '3px 10px',
              height: 'auto',
              fontSize: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              backgroundColor: saveSuccess ? 'var(--success)' : undefined,
              color: saveSuccess ? '#fff' : undefined,
              borderColor: saveSuccess ? 'var(--success)' : undefined
            }}
          >
            <Save size={13} />
            <span>{saveSuccess ? '已保存至 SQLite ✓' : '保存 AI 配置'}</span>
          </button>
        )}
      </div>

      {/* 快速服务商预设 */}
      <div style={{ marginBottom: 12 }}>
        <div className="muted" style={{ fontSize: 11, marginBottom: 6 }}>
          快速预设服务商：
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {PRESETS.map((p) => {
            const isSelected = baseURL === p.baseURL && model === p.model;
            return (
              <button
                key={p.name}
                type="button"
                className={`button text-xs ${isSelected ? '' : 'secondary'}`}
                style={{
                  padding: '3px 8px',
                  fontSize: 11,
                  borderRadius: 6,
                  height: 'auto',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)'
                }}
                onClick={() => applyPreset(p)}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 表单输入区域 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* API Key */}
        <div>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4, fontWeight: 500 }}>
            API Key <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type={showKey ? 'text' : 'password'}
              className="input text-[16PX]"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestResult(null);
              }}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
              style={{ width: '100%', paddingRight: 36, height: 36 }}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="icon-button"
              style={{
                position: 'absolute',
                right: 6,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--muted)',
                padding: 4
              }}
              title={showKey ? '隐藏 API Key' : '显示 API Key'}
            >
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
            本地私密存储于 SQLite 数据库，服务端官方 openai SDK 发送请求。
          </div>
        </div>

        {/* 接口地址 Base URL */}
        <div>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4, fontWeight: 500 }}>
            接口地址 (Base URL)
          </label>
          <input
            type="text"
            className="input text-[16PX]"
            value={baseURL}
            onChange={(e) => {
              setBaseURL(e.target.value);
              setTestResult(null);
            }}
            placeholder="https://api.deepseek.com/v1"
            style={{ width: '100%', height: 36 }}
          />
        </div>

        {/* 模型名称 Model (支持通过 API Key 一键拉取) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500 }}>
              模型名称 (Model) <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <button
              type="button"
              className="button secondary text-xs"
              onClick={handleFetchModels}
              disabled={fetchingModels || !apiKey.trim()}
              style={{
                padding: '2px 8px',
                height: 'auto',
                fontSize: 11,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
              title="根据当前 API Key 自动拉取该服务商支持的模型列表"
            >
              <RefreshCw size={11} className={fetchingModels ? 'animate-spin' : ''} />
              <span>{fetchingModels ? '拉取中…' : '从 API Key 获取模型'}</span>
            </button>
          </div>

          {modelList.length > 0 && !isManualInput ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <select
                className="input text-[16PX]"
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setTestResult(null);
                }}
                style={{ flex: 1, height: 36 }}
              >
                {modelList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="button secondary text-xs"
                onClick={() => setIsManualInput(true)}
                style={{ whiteSpace: 'nowrap', height: 36, padding: '0 8px', fontSize: 11 }}
                title="切换为手动自由输入"
              >
                自由输入
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="text"
                className="input text-[16PX]"
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setTestResult(null);
                }}
                placeholder="deepseek-chat"
                style={{ flex: 1, height: 36 }}
              />
              {modelList.length > 0 && (
                <button
                  type="button"
                  className="button secondary text-xs"
                  onClick={() => setIsManualInput(false)}
                  style={{ whiteSpace: 'nowrap', height: 36, padding: '0 8px', fontSize: 11 }}
                >
                  <ListFilter size={12} style={{ marginRight: 2 }} />
                  选择已拉取
                </button>
              )}
            </div>
          )}

          {modelFetchMsg && (
            <div
              style={{
                fontSize: 11,
                marginTop: 3,
                color: modelList.length > 0 ? 'var(--success)' : 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              {modelList.length > 0 ? <CheckCircle2 size={12} /> : null}
              <span>{modelFetchMsg}</span>
            </div>
          )}
        </div>

        {/* 连通性测试按钮与结果 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <button
            type="button"
            className="button secondary text-xs"
            onClick={handleTestConnection}
            disabled={testing}
            style={{
              padding: '4px 10px',
              height: 'auto',
              fontSize: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <RefreshCw size={13} className={testing ? 'animate-spin' : ''} />
            {testing ? '测试中…' : '测试连接'}
          </button>
          {testResult && (
            <span
              style={{
                fontSize: 12,
                color: testResult.success ? 'var(--success)' : 'var(--danger)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                wordBreak: 'break-all'
              }}
            >
              {testResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {testResult.message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
