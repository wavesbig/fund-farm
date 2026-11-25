'use client';

import { useEffect } from 'react';
import { isString } from 'lodash';
import { notifyClientError } from './ClientErrorBoundary';

export default function GlobalClientErrorHandler() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorMsg = event.error?.message || event.message || '';
      if (
        isString(errorMsg) &&
        (errorMsg.includes('ResizeObserver loop completed with undelivered notifications') ||
          errorMsg.includes('ResizeObserver loop limit exceeded') ||
          errorMsg.includes('Error attempting to read image') ||
          errorMsg === 'Script error.' ||
          errorMsg === 'Script error')
      ) {
        // 忽略良性的 ResizeObserver 警告、第三方图片解析警告及因跨域限制隐藏的 Script error
        event.preventDefault?.();
        return;
      }

      notifyClientError(event.error || event.message || event, {
        title: '页面运行异常',
        toastId: 'window-runtime-error',
        closeModals: true
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reasonMsg = event.reason?.message || String(event.reason || '');
      if (isString(reasonMsg) && reasonMsg.includes('Error attempting to read image')) {
        event.preventDefault?.();
        return;
      }

      notifyClientError(event.reason || event, {
        title: '异步任务异常',
        toastId: 'window-promise-error',
        closeModals: true
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}
