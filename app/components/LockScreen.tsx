'use client';

import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

export default function LockScreen() {
  const { isInitialized, login, setup, error } = useAuthStore();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const displayError = localError || error;

  const handleSubmit = async (e: React.FormEvent) => {
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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-5 overflow-hidden bg-[#0a2540]">
      {/* 背景动态流光质感装饰 */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-radial from-[#635bff]/20 to-transparent blur-3xl top-1/5 left-1/4 pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-radial from-[#00d4ff]/15 to-transparent blur-3xl bottom-1/5 right-1/4 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="glass card w-full max-w-[400px] p-8 relative rounded-xl shadow-[0_13px_27px_-5px_rgba(50,50,93,0.25),0_8px_16px_-8px_rgba(0,0,0,0.3)] border border-white/10 flex flex-col items-center bg-[#122b46]"
      >
        {/* 顶部锁头图标 */}
        <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center mb-5 text-primary">
          {isInitialized ? <Lock className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
        </div>

        {/* 标题与描述 */}
        <h2 className="text-xl font-bold mb-2 text-foreground text-center">
          {isInitialized ? '安全访问锁' : '设置访问密码'}
        </h2>
        <p className="text-xs text-center text-[var(--muted)] leading-relaxed mb-6">
          {isInitialized ? '持仓与资产隐私已加密保护，请输入密码解锁' : '首次使用，请为养基场创建访问密码'}
        </p>

        {/* 错误提示 */}
        <AnimatePresence>
          {displayError && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="w-full bg-[var(--danger)]/15 border border-[var(--danger)]/30 text-[var(--danger)] px-3 py-2 rounded-xl text-xs text-center overflow-hidden"
            >
              {displayError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3.5">
          {/* 密码输入框 */}
          <div className="relative w-full flex items-center">
            <div className="absolute left-3 text-[var(--muted)] flex items-center pointer-events-none">
              <KeyRound className="w-4 h-4" />
            </div>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLocalError('');
              }}
              placeholder={isInitialized ? '请输入访问密码...' : '设置管理员密码 (>=4位)'}
              autoFocus
              className="w-full pl-9 pr-10 h-10 rounded-lg text-[16PX] md:text-sm bg-black/20 border-white/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-[var(--muted)] hover:text-foreground transition-colors p-1"
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* 首次设置时二次确认密码 */}
          {!isInitialized && (
            <div className="relative w-full flex items-center">
              <div className="absolute left-3 text-[var(--muted)] flex items-center pointer-events-none">
                <KeyRound className="w-4 h-4" />
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setLocalError('');
                }}
                placeholder="请再次确认新密码"
                className="w-full pl-9 pr-10 h-10 rounded-lg text-[16PX] md:text-sm bg-black/20 border-white/10"
              />
            </div>
          )}

          {/* 记住我选项 */}
          {isInitialized && (
            <div className="flex items-center justify-between text-xs py-1">
              <label className="inline-flex items-center gap-2 cursor-pointer text-[var(--muted)] select-none">
                <Checkbox checked={rememberMe} onCheckedChange={(checked) => setRememberMe(Boolean(checked))} />
                <span>保持登录 30 天</span>
              </label>
            </div>
          )}

          {/* 提交按钮 */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl mt-1.5 font-semibold text-sm gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>验证中...</span>
              </>
            ) : (
              <>
                <span>{isInitialized ? '解锁进入' : '完成设置并进入'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
