import React from 'react';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';
import AnalyticsGate from './components/AnalyticsGate';
import KeepScreenAwake from './components/KeepScreenAwake';
import PwaRegister from './components/PwaRegister';
import ThemeColorSync from './components/ThemeColorSync';
import ClientErrorBoundary from './components/ClientErrorBoundary';
import GlobalClientErrorHandler from './components/GlobalClientErrorHandler';
import { QueryClientProviderWrapper } from './providers/query-client-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import packageJson from '../package.json';

export const metadata: Metadata = {
  title: `基估宝 V${packageJson.version}`,
  description: '输入基金编号添加基金，实时显示估值与前10重仓'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-title" content="基估宝" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/Icon-60@3x.png?v=1" />
        <link rel="apple-touch-icon" sizes="180x180" href="/Icon-60@3x.png?v=1" />
        <link rel="manifest" href="/manifest.webmanifest" />
        {/* 初始为暗色；ThemeColorSync 会按 data-theme 同步为亮/暗 */}
        <meta name="theme-color" content="#0b0f19" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* 尽早设置 data-theme 与 data-font-size，减少首屏主题与字号闪烁；与 suppressHydrationWarning 配合避免服务端/客户端 html 属性不一致报错 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);var cs=JSON.parse(localStorage.getItem("customSettings")||"{}");var fs=cs.fontSizeLevel||"comfortable";document.documentElement.setAttribute("data-font-size",fs);}catch(e){}})();`
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeColorSync />
        <KeepScreenAwake />
        <PwaRegister />
        <AnalyticsGate GA_ID={GA_ID} />
        <QueryClientProviderWrapper>
          <TooltipProvider>
            <ClientErrorBoundary toastTitle="页面渲染异常" toastId="app-render-error" closeModals>
              {children}
            </ClientErrorBoundary>
          </TooltipProvider>
        </QueryClientProviderWrapper>
        <Toaster />
        <GlobalClientErrorHandler />
      </body>
    </html>
  );
}
