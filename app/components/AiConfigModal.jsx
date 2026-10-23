'use client';

import React from 'react';
import { motion } from 'framer-motion';
import AiConfigSection from './AiConfigSection';

export default function AiConfigModal({ onClose }) {
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
        style={{ width: 480, maxWidth: '92vw', padding: '20px', maxHeight: '88vh', overflowY: 'auto' }}
      >
        <AiConfigSection showImmediateSaveButton={true} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button type="button" className="button" onClick={onClose}>
            完成并关闭
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
