'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isArray, shuffle } from 'lodash';
import { SCAN_LOADING_TIPS_MOBILE, SCAN_LOADING_TIPS_PC } from '@/app/constants';
import { useIsMobile } from '@/app/hooks/useIsMobile';

export interface UsageTipsCarouselProps {
  interval?: number;
  style?: React.CSSProperties;
}

export default function UsageTipsCarousel({ interval = 10000, style = {} }: UsageTipsCarouselProps) {
  const isMobile = useIsMobile();
  const tips = isMobile ? (SCAN_LOADING_TIPS_MOBILE as string[]) : (SCAN_LOADING_TIPS_PC as string[]);
  const [shuffledTips, setShuffledTips] = useState<string[]>([]);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (isArray(tips) && tips.length > 0) {
      setShuffledTips(shuffle(tips));
      setTipIndex(0);
    }
  }, [tips]);

  useEffect(() => {
    if (!isArray(shuffledTips) || shuffledTips.length === 0) return;
    const timer = setInterval(() => {
      setTipIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex >= shuffledTips.length) {
          setShuffledTips(shuffle(tips));
          return 0;
        }
        return nextIndex;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [shuffledTips, tips, interval]);

  if (!isArray(shuffledTips) || shuffledTips.length === 0) return null;

  return (
    <div
      className="mb-5 p-3 rounded-xl bg-white/[0.04] border border-[var(--border)] min-h-[68px] flex items-center justify-center overflow-hidden relative"
      style={style}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={shuffledTips[tipIndex] || tipIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="text-xs leading-relaxed text-left w-full text-[var(--muted)] break-words"
        >
          {shuffledTips[tipIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
