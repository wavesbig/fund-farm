'use client';

import * as React from 'react';
import { toast as sonnerToast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';

export interface FooterProps {
  isMobile: boolean;
  user: User | null;
  onOpenFeedback: () => void;
}

export default function Footer({ isMobile, user, onOpenFeedback }: FooterProps) {
  if (isMobile) {
    return <div className="footer" />;
  }

  const handleFeedbackClick = () => {
    if (!user?.id) {
      sonnerToast.error('请先登录后再提交反馈');
      return;
    }
    onOpenFeedback();
  };

  return (
    <footer className="footer text-xs text-muted-foreground/75 py-6 flex flex-col items-center gap-1.5 text-center">
      <p className="mb-1 leading-relaxed">
        数据源：实时估值与重仓直连东方财富，仅供个人学习及参考使用。数据可能存在延迟，不作为任何投资建议
      </p>
      <p className="mb-2 text-[11px] opacity-80">注：估算数据与真实结算数据会有1%左右误差，非股票型基金误差较大</p>
      <div className="flex items-center gap-1 opacity-90 mt-1">
        <span>遇到任何问题或需求建议可</span>
        <Button
          variant="link"
          size="sm"
          onClick={handleFeedbackClick}
          className="h-auto p-0 text-primary font-semibold text-xs hover:underline"
        >
          点此提交反馈
        </Button>
      </div>
    </footer>
  );
}
