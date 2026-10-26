'use client';

import * as React from 'react';
import { Progress as ProgressPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

export interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
  value?: number | null;
}

function Progress({ className, indicatorClassName, value, ...props }: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'relative w-full overflow-hidden rounded-full',
        'h-1.5 sm:h-1.5',
        'bg-[var(--input)]/70 dark:bg-[var(--input)]/40',
        'border border-[var(--border)]/80 dark:border-[var(--border)]/80',
        'shadow-[0_0_0_1px_rgba(15,23,42,0.02)] dark:shadow-[0_0_0_1px_rgba(15,23,42,0.6)]',
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          'h-full w-full flex-1',
          'bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80',
          'dark:from-[var(--primary)] dark:to-[var(--secondary)]/90',
          'shadow-[0_0_8px_rgba(245,158,11,0.35)] dark:shadow-[0_0_14px_rgba(245,158,11,0.45)]',
          'transition-[transform,box-shadow] duration-250 ease-out',
          indicatorClassName
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
