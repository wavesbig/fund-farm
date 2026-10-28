'use client';

import * as React from 'react';
import { useState } from 'react';
import { PartyPopper, MessageSquarePlus, Loader2, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { submitFeedback } from '../api/fund';

export interface FeedbackModalProps {
  onClose: () => void;
  user?: { email?: string; [key: string]: any } | null;
  onOpenWeChat?: () => void;
}

export default function FeedbackModal({ onClose, user }: FeedbackModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    const nickname = formData.get('nickname')?.toString().trim();
    if (!nickname) {
      formData.set('nickname', '匿名');
    }

    // Web3Forms Access Key
    formData.append('access_key', process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY || '');
    formData.append('subject', '基估宝 - 用户反馈');

    try {
      const data = await submitFeedback(formData);
      if (data?.success) {
        setSucceeded(true);
      } else {
        setError(data?.message || '提交失败，请稍后再试');
      }
    } catch {
      setError('网络错误，请检查您的连接');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass card modal max-w-[480px] w-[92vw] z-[99]" overlayClassName="modal-overlay">
        <DialogTitle asChild>
          <div className="flex items-center gap-2.5 font-semibold text-lg text-foreground mb-4">
            <MessageSquarePlus className="w-5 h-5 text-primary" />
            <span>意见反馈</span>
          </div>
        </DialogTitle>

        {succeeded ? (
          <div className="success-message text-center py-6">
            <PartyPopper className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">感谢您的反馈！</h3>
            <p className="text-sm text-[var(--muted)] mb-6">我们已收到您的建议，会尽快查看并持续优化。</p>
            <Button className="w-full h-10" onClick={onClose}>
              关闭
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="feedback-form flex flex-col gap-4">
            <div className="space-y-1.5 text-left">
              <label htmlFor="nickname" className="text-sm font-medium text-[var(--muted)]">
                您的昵称（可选）
              </label>
              <Input
                id="nickname"
                type="text"
                name="nickname"
                placeholder="匿名"
                className="w-full text-[16PX] md:text-sm bg-black/20"
              />
            </div>

            <input type="hidden" name="email" value={user?.email || ''} />

            <div className="space-y-1.5 text-left">
              <label htmlFor="message" className="text-sm font-medium text-[var(--muted)]">
                反馈内容
              </label>
              <Textarea
                id="message"
                name="message"
                required
                placeholder="请描述您遇到的问题或建议..."
                rows={4}
                className="w-full min-h-[120px] text-[16PX] md:text-sm bg-black/20 resize-y"
              />
            </div>

            {error && <div className="text-[var(--danger)] text-sm text-center">{error}</div>}

            <Button type="submit" disabled={submitting} className="w-full h-10 gap-2 mt-2 font-medium">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>发送中...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>提交反馈</span>
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
