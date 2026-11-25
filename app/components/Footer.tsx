'use client';

import * as React from 'react';

export interface FooterProps {
  isMobile: boolean;
  onOpenFeedback?: () => void;
}

const GITHUB_REPO_URL = process.env.NEXT_PUBLIC_GITHUB_REPO_URL || 'https://github.com/wavesbig/fund-farm';
const GITHUB_ISSUES_URL = `${GITHUB_REPO_URL}/issues`;

export default function Footer({ isMobile, onOpenFeedback }: FooterProps) {
  if (isMobile) {
    return <div className="footer" />;
  }

  const handleFeedback = (e: React.MouseEvent) => {
    if (onOpenFeedback) {
      e.preventDefault();
      onOpenFeedback();
    }
  };

  return (
    <footer className="footer text-xs text-muted-foreground/75 py-6 flex flex-col items-center gap-1.5 text-center select-none">
      <p className="mb-0.5 leading-relaxed">
        数据源：实时估值与重仓直连东方财富等公开财经接口，仅供个人学习与资产记录使用，不构成任何投资建议
      </p>
      <p className="mb-1.5 text-[11px] opacity-75">
        注：估算数据与基金公司真实结算数据会有 1% 左右误差，非股票型基金误差较大
      </p>
      <div className="flex items-center gap-2.5 text-xs text-muted-foreground/80 mt-1 select-none">
        <span>© {new Date().getFullYear()} 养基场 (FundFarm)</span>
        <span className="opacity-40">·</span>
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          GitHub 源码
        </a>
        <span className="opacity-40">·</span>
        <a
          href={GITHUB_ISSUES_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onOpenFeedback ? handleFeedback : undefined}
          className="hover:text-foreground transition-colors cursor-pointer"
        >
          问题反馈
        </a>
      </div>
    </footer>
  );
}
