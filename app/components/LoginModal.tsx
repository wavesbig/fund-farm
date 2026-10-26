'use client';

import * as React from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Mail, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/app/hooks/useIsMobile';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import githubImg from '../assets/github.svg';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface LoginModalProps {
  onClose: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  isExplicitLoginRef?: React.MutableRefObject<boolean>;
  initialError?: string;
}

export default function LoginModal({ onClose, showToast, isExplicitLoginRef, initialError = '' }: LoginModalProps) {
  const isMobile = useIsMobile();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(initialError);
  const [loginSuccess, setLoginSuccess] = useState('');

  const otpTouchWrapRef = useRef<HTMLDivElement>(null);
  // iOS 代理 input：在用户手势中同步 focus，保持键盘弹起状态
  const proxyInputRef = useRef<HTMLInputElement>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');
    if (!isSupabaseConfigured || !supabase) {
      showToast('未配置 Supabase，无法登录', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!loginEmail.trim()) {
      setLoginError('请输入邮箱地址');
      return;
    }
    if (!emailRegex.test(loginEmail.trim())) {
      setLoginError('请输入有效的邮箱地址');
      return;
    }

    setLoginLoading(true);
    // 在用户手势同步上下文内 focus 代理 input，iOS 会弹起键盘
    if (isMobile && proxyInputRef.current) {
      proxyInputRef.current.focus();
    }
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: loginEmail.trim(),
        options: {
          shouldCreateUser: true
        }
      });
      if (error) throw error;
      setLoginSuccess('验证码已发送，请查收邮箱输入验证码完成注册/登录');
    } catch (err: any) {
      if (err.message?.includes('rate limit')) {
        setLoginError('请求过于频繁，请稍后再试');
      } else if (err.message?.includes('network')) {
        setLoginError('网络错误，请检查网络连接');
      } else {
        setLoginError(err.message || '发送验证码失败，请稍后再试');
      }
      // 发送失败，收起键盘
      if (isMobile && proxyInputRef.current) {
        proxyInputRef.current.blur();
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setLoginError('');
    if (!loginOtp || loginOtp.length < 4) {
      setLoginError('请输入邮箱中的验证码');
      return;
    }
    if (!isSupabaseConfigured || !supabase) {
      showToast('未配置 Supabase，无法登录', 'error');
      return;
    }
    try {
      if (isExplicitLoginRef) isExplicitLoginRef.current = true;
      setLoginLoading(true);
      const { data, error } = await supabase.auth.verifyOtp({
        email: loginEmail.trim(),
        token: loginOtp.trim(),
        type: 'email'
      });
      if (error) throw error;
      if (data?.user) {
        onClose();
      }
    } catch (err: any) {
      setLoginError(err.message || '验证失败，请检查验证码或稍后再试');
      if (isExplicitLoginRef) isExplicitLoginRef.current = false;
    }
    setLoginLoading(false);
  };

  const handleGithubLogin = async () => {
    setLoginError('');
    if (!isSupabaseConfigured || !supabase) {
      showToast('未配置 Supabase，无法登录', 'error');
      return;
    }
    try {
      if (isExplicitLoginRef) isExplicitLoginRef.current = true;
      setLoginLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setLoginError(err.message || 'GitHub 登录失败，请稍后再试');
      if (isExplicitLoginRef) isExplicitLoginRef.current = false;
      setLoginLoading(false);
    }
  };

  // iOS 等系统仅在「用户手势」触发的 focus 上弹出软键盘；触摸验证码区域时同步 focus 可稳定唤起键盘
  const focusOtpInput = useCallback(() => {
    const wrap = otpTouchWrapRef.current;
    if (!wrap) return;
    const root = wrap.querySelector('[data-input-otp-container]');
    const input = root?.querySelector('[data-input-otp]');
    if (!(input instanceof HTMLInputElement) || input.disabled) return;
    root.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    input.focus();
    try {
      input.click();
    } catch {
      /* ignore */
    }
  }, []);

  // 发送成功后将焦点从代理 input 转移到真正的 OTP input，键盘会保持弹出状态
  useLayoutEffect(() => {
    if (!loginSuccess || !isMobile) return;
    const run = () => focusOtpInput();
    run();
    const t = requestAnimationFrame(run);
    const t2 = window.setTimeout(run, 50);
    const t3 = window.setTimeout(run, 150);
    return () => {
      cancelAnimationFrame(t);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [loginSuccess, isMobile, focusOtpInput]);

  return (
    <>
      {/* iOS 代理 input：保持在用户手势链中，防止键盘收起 */}
      <input
        ref={proxyInputRef}
        aria-hidden="true"
        tabIndex={-1}
        inputMode="numeric"
        style={{
          position: 'fixed',
          opacity: 0,
          width: 0,
          height: 0,
          top: '-9999px',
          left: '-9999px',
          pointerEvents: 'none'
        }}
      />
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="glass card modal max-w-[420px] w-[90vw] z-[99] p-5" overlayClassName="modal-overlay">
          <DialogTitle asChild>
            <div className="title flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-primary" />
              <span className="font-semibold text-base text-foreground">邮箱登录</span>
              <span className="text-xs text-[var(--muted)] ml-auto">使用邮箱验证登录</span>
            </div>
          </DialogTitle>

          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <div className="space-y-1.5 text-left">
              <div className="text-xs text-[var(--muted)]">请输入邮箱，我们将发送验证码到您的邮箱</div>
              <Input
                type="email"
                placeholder="your@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                disabled={loginLoading || Boolean(loginSuccess)}
                className="w-full h-9 bg-black/20 text-[16PX] md:text-sm"
              />
            </div>

            {loginSuccess && (
              <div className="p-2.5 rounded-lg bg-[var(--success)]/10 text-[var(--success)] text-xs border border-[var(--success)]/20 leading-relaxed">
                <span>{loginSuccess}</span>
              </div>
            )}

            {loginSuccess && (
              <div
                ref={otpTouchWrapRef}
                className="space-y-2 text-left"
                style={{ touchAction: 'manipulation' }}
                onPointerDownCapture={isMobile ? () => focusOtpInput() : undefined}
              >
                <div className="text-xs text-[var(--muted)]">请输入邮箱验证码以完成注册/登录</div>
                <div className="flex justify-center py-1">
                  <InputOTP
                    maxLength={6}
                    value={loginOtp}
                    onChange={(value) => setLoginOtp(value)}
                    disabled={loginLoading}
                    autoFocus={Boolean(isMobile)}
                    autoComplete="one-time-code"
                    type={isMobile ? 'tel' : 'text'}
                    enterKeyHint="done"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
            )}

            {loginError && (
              <div className="p-2.5 rounded-lg bg-[var(--danger)]/10 text-[var(--danger)] text-xs border border-[var(--danger)]/20 leading-relaxed">
                <span>{loginError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-2">
              <Button type="button" variant="outline" className="h-9 px-4 text-xs bg-white/5" onClick={onClose}>
                取消
              </Button>
              <Button
                type={loginSuccess ? 'button' : 'submit'}
                onClick={loginSuccess ? handleVerifyEmailOtp : undefined}
                disabled={loginLoading || Boolean(loginSuccess && !loginOtp)}
                className="h-9 px-4 text-xs font-medium gap-1"
              >
                {loginLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{loginLoading ? '处理中...' : loginSuccess ? '确认验证码' : '发送邮箱验证码'}</span>
              </Button>
            </div>
          </form>

          {!loginSuccess && process.env.NEXT_PUBLIC_IS_GITHUB_LOGIN === 'true' && (
            <>
              <div className="flex items-center my-4 gap-3">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-xs text-[var(--muted)] whitespace-nowrap">或使用</span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGithubLogin}
                disabled={loginLoading}
                className="w-full h-10 flex items-center justify-center gap-2.5 bg-background text-sm font-medium border-[var(--border)]"
              >
                <span className="shrink-0 flex items-center">
                  <Image unoptimized alt="GitHub" src={githubImg} width={20} height={20} />
                </span>
                <span>使用 GitHub 登录</span>
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
