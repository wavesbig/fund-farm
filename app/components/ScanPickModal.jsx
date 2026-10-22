'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Settings } from 'lucide-react';
import { useStorageStore, useModalStore } from '../stores';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function getDroppedImageFiles(dataTransfer) {
  if (!dataTransfer?.files?.length) return [];
  return Array.from(dataTransfer.files).filter((f) => IMAGE_TYPES.includes(f.type));
}

export default function ScanPickModal({ onClose, onPick, onFilesDrop, isScanning }) {
  const [isDragging, setIsDragging] = useState(false);
  const customSettings = useStorageStore((s) => s.customSettings) || {};
  const aiConfig = customSettings.aiConfig || {};
  const hasAiKey = Boolean(aiConfig.apiKey && aiConfig.apiKey.trim());

  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isScanning) setIsDragging(true);
    },
    [isScanning]
  );

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (isScanning || !onFilesDrop) return;
      const files = getDroppedImageFiles(e.dataTransfer);
      if (files.length) onFilesDrop(files);
    },
    [isScanning, onFilesDrop]
  );

  const dropZoneStyle = {
    marginBottom: 12,
    padding: '20px 16px',
    borderRadius: 12,
    transition: 'border-color 0.2s ease, background 0.2s ease',
    cursor: isScanning ? 'not-allowed' : 'pointer',
    pointerEvents: isScanning ? 'none' : 'auto'
  };

  return (
    <motion.div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="选择持仓截图"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass card modal scan-pick-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 440, maxWidth: '92vw' }}
      >
        <div
          className="title"
          style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <span>选择持仓截图</span>
          <button
            type="button"
            className="button secondary text-xs"
            onClick={() => useModalStore.setState({ aiConfigModalOpen: true })}
            style={{
              padding: '3px 8px',
              fontSize: 12,
              height: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
            title="配置通用大模型 (DeepSeek / Qwen / OpenAI 等兼容接口)"
          >
            <Sparkles size={13} style={{ color: hasAiKey ? 'var(--primary)' : 'var(--muted)' }} />
            <span>{hasAiKey ? '大模型已启用' : 'AI 接口配置'}</span>
          </button>
        </div>

        {/* 当前解析模式标签 */}
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <span className="muted">当前模式:</span>
          {hasAiKey ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(59, 130, 246, 0.1)',
                color: 'var(--primary)',
                fontSize: 12
              }}
            >
              <Sparkles size={12} />
              OpenAI 兼容模型 ({aiConfig.model || 'deepseek-chat'})
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(34, 197, 94, 0.1)',
                color: 'var(--success)',
                fontSize: 12
              }}
            >
              本地规则解析 · 无限制
            </span>
          )}
        </div>

        <div className="muted" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
          从相册选择一张或多张持仓截图，系统将自动识别提取其中的
          <span style={{ color: 'var(--primary)' }}>基金代码、持仓金额与收益</span>，并支持批量导入。
        </div>

        <div
          className={`scan-pick-dropzone muted ${isDragging ? 'dragging' : ''}`}
          style={dropZoneStyle}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!isScanning ? onPick : undefined}
          role="button"
          tabIndex={0}
          aria-label="拖拽图片到此处或点击选择"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!isScanning) onPick?.();
            }
          }}
        >
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: isDragging ? 'var(--primary)' : 'var(--muted)',
              textAlign: 'center'
            }}
          >
            {isDragging ? '松开即可导入' : '拖拽图片到此处，或点击选择'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
          <button className="button secondary" onClick={onClose}>
            取消
          </button>
          <button className="button" onClick={onPick} disabled={isScanning}>
            {isScanning ? '处理中…' : '选择图片'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
