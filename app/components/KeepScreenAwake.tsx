'use client';

import { useEffect, useMemo, useRef } from 'react';

function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
}

function supportsWakeLock(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.wakeLock && typeof navigator.wakeLock.request === 'function';
}

/**
 * iOS Safari 没有 Screen Wake Lock API。
 * 兜底方案：在用户手势后播放一个静音、循环、内联的小视频，常见情况下可阻止系统熄屏。
 */
function createNoSleepVideo(): HTMLVideoElement {
  const video = document.createElement('video');
  video.setAttribute('playsinline', 'true');
  video.setAttribute('webkit-playsinline', 'true');
  video.muted = true;
  video.loop = true;
  video.autoplay = true;

  video.src =
    'data:video/mp4;base64,AAAAHGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAGkbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAA+gAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAABR0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAEAAAAAAAEAAAAAAABAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAABAAAAAAABAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAG1kaWEAAAAgbWRoZAAAAAAAAAAAAAAAAAAAA+gAAAAAAAQAAAAAAC21pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAABRzdGJsAAAAJHN0c2QAAAAAAAAAAQAAABRhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYc3R0cwAAAAAAAAABAAAAAQAAAAEAAAAYc3RzYwAAAAAAAAABAAAAAQAAAAEAAAAUc3RzegAAAAAAAAAAAAAAAQAAAAFzdGNvAAAAAAAAAAEAAAAoAAAAAG1vb3YAAABsbXZoZAAAAAAAAAAAAAAAAAAAA+gAAAPoAAEAAAEAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAFHRyYWsAAABcdGtoZAAAAAMAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAAAAAAAAAAAAQAAAAABbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAAA+gAAAAAAAQAAAAAAC21pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAABRzdGJsAAAAJHN0c2QAAAAAAAAAAQAAABRhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYc3R0cwAAAAAAAAABAAAAAQAAAAEAAAAYc3RzYwAAAAAAAAABAAAAAQAAAAEAAAAUc3RzegAAAAAAAAAAAAAAAQAAAAFzdGNvAAAAAAAAAAEAAAAoAAAAAA==';

  video.style.position = 'fixed';
  video.style.left = '-9999px';
  video.style.top = '-9999px';
  video.style.width = '1px';
  video.style.height = '1px';
  video.style.opacity = '0';
  video.style.pointerEvents = 'none';

  return video;
}

export default function KeepScreenAwake() {
  const enabledRef = useRef(false);
  const wakeLockRef = useRef<any>(null);
  const noSleepVideoRef = useRef<HTMLVideoElement | null>(null);

  const shouldRun = useMemo(() => isTouchDevice(), []);

  useEffect(() => {
    if (!shouldRun) return;
    if (typeof document === 'undefined') return;

    const attachNoSleepVideo = () => {
      if (noSleepVideoRef.current) return;
      const v = createNoSleepVideo();
      document.body.appendChild(v);
      noSleepVideoRef.current = v;
    };

    const tryEnable = async () => {
      if (!enabledRef.current) return;
      if (document.visibilityState !== 'visible') return;

      // 1) 标准 Wake Lock（Android Chrome / Chromium WebView / 部分桌面浏览器）
      if (supportsWakeLock()) {
        try {
          if (wakeLockRef.current) return;
          const sentinel = await navigator.wakeLock.request('screen');
          wakeLockRef.current = sentinel;
          sentinel.addEventListener('release', () => {
            wakeLockRef.current = null;
          });
          return;
        } catch {
          // 失败就走 iOS 兜底
        }
      }

      // 2) iOS/兼容性兜底：播放静音循环视频（需要用户手势触发）
      try {
        attachNoSleepVideo();
        const v = noSleepVideoRef.current;
        if (!v) return;
        if (v.paused) await v.play();
      } catch {
        // ignore
      }
    };

    const enableOnFirstGesture = async () => {
      if (enabledRef.current) return;
      enabledRef.current = true;
      await tryEnable();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void tryEnable();
      } else {
        try {
          wakeLockRef.current?.release?.();
        } catch {}
        wakeLockRef.current = null;
        try {
          noSleepVideoRef.current?.pause?.();
        } catch {}
      }
    };

    document.addEventListener('touchend', enableOnFirstGesture, { passive: true, once: true });
    document.addEventListener('click', enableOnFirstGesture, { passive: true, once: true });

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pageshow', onVisibilityChange);
    window.addEventListener('focus', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pageshow', onVisibilityChange);
      window.removeEventListener('focus', onVisibilityChange);

      try {
        wakeLockRef.current?.release?.();
      } catch {}
      wakeLockRef.current = null;

      const v = noSleepVideoRef.current;
      if (v) {
        try {
          v.pause();
        } catch {}
        try {
          v.removeAttribute('src');
          v.load?.();
        } catch {}
        try {
          v.remove();
        } catch {}
      }
      noSleepVideoRef.current = null;
    };
  }, [shouldRun]);

  return null;
}
