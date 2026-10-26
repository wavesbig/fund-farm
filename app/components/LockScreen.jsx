'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function LockScreen() {
  const { isInitialized, login, setup, error } = useAuthStore();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const displayError = localError || error;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    const trimmed = password.trim();
    if (!trimmed) {
      setLocalError('请输入密码');
      return;
    }

    if (!isInitialized) {
      if (trimmed.length < 4) {
        setLocalError('密码长度不能少于 4 位');
        return;
      }
      if (trimmed !== confirmPassword.trim()) {
        setLocalError('两次输入的密码不一致');
        return;
      }
      setLoading(true);
      try {
        await setup(trimmed);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        await login(trimmed, rememberMe);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-gradient, #0f172a)',
        padding: '20px',
        overflow: 'hidden'
      }}
    >
      {/* 背景动态流光质感装饰 */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
          filter: 'blur(50px)',
          top: '20%',
          left: '25%',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, rgba(0, 0, 0, 0) 70%)',
          filter: 'blur(50px)',
          bottom: '20%',
          right: '25%',
          pointerEvents: 'none'
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="glass card"
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '32px 28px',
          position: 'relative',
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* 顶部锁头图标 */}
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            color: 'var(--accent, #38bdf8)'
          }}
        >
          {isInitialized ? <Lock size={28} /> : <ShieldCheck size={28} />}
        </div>

        {/* 标题与描述 */}
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text, #f8fafc)' }}>
          {isInitialized ? '私有访问锁' : '设置访问密码'}
        </h2>
        <p
          className="muted"
          style={{
            fontSize: '13px',
            textAlign: 'center',
            lineHeight: 1.5,
            margin: '0 0 24px 0',
            color: 'var(--muted, #94a3b8)'
          }}
        >
          {isInitialized ? '持仓与资产隐私已加密保护，请输入密码解锁' : '首次使用部署，请为你的基估宝创建私有访问密码'}
        </p>

        {/* 错误提示 */}
        <AnimatePresence>
          {displayError && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              style={{
                width: '100%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                textAlign: 'center',
                overflow: 'hidden'
              }}
            >
              {displayError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 表单 */}
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* 密码输入框 */}
          <div style={{ position: 'relative', width: '100%' }}>
            <div
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted, #94a3b8)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <KeyRound size={16} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLocalError('');
              }}
              placeholder={isInitialized ? '请输入访问密码...' : '设置管理员密码 (>=4位)'}
              autoFocus
              className="input text-[16PX] md:text-sm"
              style={{
                width: '100%',
                paddingLeft: '38px',
                paddingRight: '40px',
                height: '42px',
                borderRadius: '10px'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--muted, #94a3b8)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px'
              }}
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* 首次设置时二次确认密码 */}
          {!isInitialized && (
            <div style={{ position: 'relative', width: '100%' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted, #94a3b8)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <KeyRound size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setLocalError('');
                }}
                placeholder="请再次确认新密码"
                className="input text-[16PX] md:text-sm"
                style={{
                  width: '100%',
                  paddingLeft: '38px',
                  paddingRight: '40px',
                  height: '42px',
                  borderRadius: '10px'
                }}
              />
            </div>
          )}

          {/* 记住我选项 */}
          {isInitialized && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  color: 'var(--muted, #94a3b8)'
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: 'var(--primary, #38bdf8)' }}
                />
                <span>保持登录 30 天</span>
              </label>
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            className="button"
            disabled={loading}
            style={{
              width: '100%',
              height: '42px',
              borderRadius: '10px',
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>验证中...</span>
              </>
            ) : (
              <>
                <span>{isInitialized ? '解锁进入' : '完成设置并进入'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
