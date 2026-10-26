'use client';

import * as React from 'react';
import { useCallback, useLayoutEffect, useRef } from 'react';

export interface FitTextProps {
  children: React.ReactNode;
  maxFontSize?: number;
  minFontSize?: number;
  className?: string;
  style?: React.CSSProperties;
  as?: 'span' | 'div';
}

export default function FitText({
  children,
  maxFontSize = 14,
  minFontSize = 10,
  className,
  style = {},
  as: Tag = 'span'
}: FitTextProps) {
  const containerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);

  const adjust = useCallback(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const containerRect = container.getBoundingClientRect();
    const containerWidth = container.clientWidth > 0 ? container.clientWidth : containerRect.width;
    if (!Number.isFinite(containerWidth) || containerWidth <= 0) return;

    // 先恢复到最大字号再测量，确保在「未缩放」状态下取到真实内容宽度
    content.style.fontSize = `${maxFontSize}px`;

    const contentWidth = content.scrollWidth;
    if (contentWidth <= 0) return;
    let size = maxFontSize;
    if (contentWidth > containerWidth) {
      size = (containerWidth / contentWidth) * maxFontSize;
      size = Math.max(minFontSize, Math.min(maxFontSize, size));
    }
    content.style.fontSize = `${size}px`;
  }, [maxFontSize, minFontSize]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let rafId: number | null = null;

    const adjustLater = () => {
      if (rafId != null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!cancelled) adjust();
      });
    };

    adjust();
    adjustLater();
    if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
      (document as any).fonts.ready.then(() => {
        if (!cancelled) adjust();
      });
    }

    const ro = new ResizeObserver(() => {
      adjust();
      adjustLater();
    });
    ro.observe(container);
    return () => {
      cancelled = true;
      if (rafId != null) cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [adjust, children]);

  return (
    <Tag
      ref={containerRef as any}
      className={className}
      style={{
        display: 'block',
        width: '100%',
        alignSelf: 'stretch',
        boxSizing: 'border-box',
        minWidth: 0,
        maxWidth: '100%',
        overflow: 'hidden',
        ...style
      }}
    >
      <span
        ref={contentRef}
        className="tabular-nums"
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          fontWeight: 'inherit',
          fontSize: `${maxFontSize}px`,
          fontVariantNumeric: 'tabular-nums'
        }}
      >
        {children}
      </span>
    </Tag>
  );
}
