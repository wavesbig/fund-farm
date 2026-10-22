'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { isString, isObject, isFunction, isArray } from 'lodash';
import { Eye, EyeOff, CheckCircle2, AlertCircle, Sparkles, RefreshCw, ListFilter } from 'lucide-react';
import { useStorageStore } from '../stores';
import { getStoredToken } from '../lib/authClient';

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

export default function AiConfigModal({ onClose }) {
  const customSettings = useStorageStore((s) => s.customSettings) || {};
  const setCustomSettings = useStorageStore((s) => s.setCustomSettings);

  const initialAi = customSettings.aiConfig || {};
  const [apiKey, setApiKey] = useState(initialAi.apiKey || '');
  const [baseURL, setBaseURL] = useState(initialAi.baseURL || 'https://api.deepseek.com/v1');
  const [model, setModel] = useState(initialAi.model || 'deepseek-chat');
  const [enabled, setEnabled] = useState(initialAi.enabled !== false);
  const [showKey, setShowKey] = useState(false);

  // 模型列表动态拉取状态
  const [modelList, setModelList] = useState([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelFetchMsg, setModelFetchMsg] = useState('');
  const [isManualInput, setIsManualInput] = useState(false);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: boolean, message: string }
  const [saveSuccess, setSaveSuccess] = useState(false);

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

          // 如果当前模型不在返回列表中，智能挑选默认推荐或首项
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

  const handleSave = () => {
    const nextAiConfig = {
      enabled,
      apiKey: apiKey.trim(),
      baseURL: baseURL.trim() || 'https://api.deepseek.com/v1',
      model: model.trim() || 'deepseek-chat'
    };

    const nextCustomSettings = {
      ...customSettings,
      aiConfig: nextAiConfig
    };

    if (isFunction(setCustomSettings)) {
      setCustomSettings(nextCustomSettings);
    }

    setSaveSuccess(true);
    setTimeout(() => {
      onClose?.();
    }, 600);
  };

  return (
    <motion.div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="通用大模型 OpenAPI 配置"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass card modal"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 480, maxWidth: '92vw', padding: '24px' }}
      >
        {/* 标题 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)'
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>大模型 OpenAPI 接入配置</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                支持通用 OpenAI 兼容协议（DeepSeek / 硅基流动 / 阿里百炼 / 本地 Ollama）
              </div>
            </div>
          </div>
        </div>

        {/* 快速预设选项 */}
        <div style={{ marginBottom: 16 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 8, fontWeight: 500 }}>
            快速选择服务商预设：
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
                    padding: '4px 8px',
                    fontSize: 12,
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* API Key */}
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>
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
                style={{ width: '100%', paddingRight: 36 }}
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
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
              私密存储于本地 SQLite 数据库，仅在服务端通过官方 openai SDK 发送请求。
            </div>
          </div>

          {/* 接口地址 Base URL */}
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>
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
              style={{ width: '100%' }}
            />
          </div>

          {/* 模型名称 Model (支持通过 API Key 一键拉取) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500 }}>
                模型名称 (Model) <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <button
                type="button"
                className="button secondary text-xs"
                onClick={handleFetchModels}
                disabled={fetchingModels || !apiKey.trim()}
                style={{
                  padding: '3px 8px',
                  height: 'auto',
                  fontSize: 11,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
                title="根据当前 API Key 和 Base URL 自动获取模型列表"
              >
                <RefreshCw size={12} className={fetchingModels ? 'animate-spin' : ''} />
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
                  style={{ flex: 1, height: 38 }}
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
                  style={{ whiteSpace: 'nowrap', height: 38, padding: '0 8px', fontSize: 12 }}
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
                  style={{ flex: 1 }}
                />
                {modelList.length > 0 && (
                  <button
                    type="button"
                    className="button secondary text-xs"
                    onClick={() => setIsManualInput(false)}
                    style={{ whiteSpace: 'nowrap', height: 38, padding: '0 8px', fontSize: 12 }}
                    title="选择拉取到的模型列表"
                  >
                    <ListFilter size={13} style={{ marginRight: 2 }} />
                    模型列表
                  </button>
                )}
              </div>
            )}

            {modelFetchMsg && (
              <div
                style={{
                  fontSize: 11,
                  marginTop: 4,
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
        </div>

        {/* 连通性测试结果提示 */}
        {testResult && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 12,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              background: testResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: testResult.success ? 'var(--success)' : 'var(--danger)',
              border: `1px solid ${testResult.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}
          >
            {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span style={{ flex: 1, wordBreak: 'break-all', lineHeight: 1.4 }}>{testResult.message}</span>
          </div>
        )}

        {/* 底部按钮栏 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
          <button
            type="button"
            className="button secondary text-xs"
            onClick={handleTestConnection}
            disabled={testing}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={testing ? 'animate-spin' : ''} />
            {testing ? '测试中…' : '测试连接'}
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="button secondary" onClick={onClose}>
              取消
            </button>
            <button
              type="button"
              className="button"
              onClick={handleSave}
              style={{
                backgroundColor: saveSuccess ? 'var(--success)' : undefined,
                color: saveSuccess ? '#fff' : undefined
              }}
            >
              {saveSuccess ? '已保存 ✓' : '保存配置'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
