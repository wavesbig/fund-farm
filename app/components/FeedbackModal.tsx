'use client';

import * as React from 'react';
import { useState } from 'react';
import { PartyPopper, MessageSquarePlus, Loader2, Send, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    formData.append('subject', '养基场 - 用户反馈');

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
      <DialogContent
        showCloseButton={false}
        className="glass card modal max-w-[420px] w-[90vw] p-5 gap-0 flex flex-col max-h-[85vh] z-[100]"
        overlayClassName="modal-overlay"
      >
        <DialogTitle className="sr-only">意见反馈</DialogTitle>
        <div className="flex items-center justify-between font-semibold text-base text-foreground mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-primary" />
            <span>意见反馈</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="关闭"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>

        {succeeded ? (
          <div className="success-message text-center py-6">
            <PartyPopper className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-base font-semibold mb-2 text-foreground">感谢您的反馈！</h3>
            <p className="text-xs text-muted-foreground mb-6">我们已收到您的建议，会尽快查看并持续优化。</p>
            <div className="pt-3 border-t border-border flex shrink-0">
              <Button
                variant="default"
                className="w-full h-9 bg-primary text-primary-foreground font-medium"
                onClick={onClose}
              >
                完成并关闭
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="feedback-form flex flex-col gap-4">
            <div className="space-y-1.5 text-left">
              <Label htmlFor="nickname" className="text-xs text-muted-foreground font-normal">
                您的昵称（可选）
              </Label>
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
              <Label htmlFor="message" className="text-xs text-muted-foreground font-normal">
                反馈内容 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="message"
                name="message"
                required
                placeholder="请描述您遇到的问题或建议..."
                rows={4}
                className="w-full min-h-[120px] text-[16PX] md:text-sm bg-black/20 resize-y"
              />
            </div>

            {error && <div className="text-destructive text-xs text-center">{error}</div>}

            <div className="pt-3 mt-1 border-t border-border flex items-center justify-end gap-2.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-9 px-4 text-xs font-medium bg-muted/30 border-border hover:bg-muted/60 text-foreground cursor-pointer"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="h-9 px-4.5 text-xs font-medium bg-primary text-primary-foreground shadow-xs cursor-pointer gap-2 disabled:opacity-40"
              >
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
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
