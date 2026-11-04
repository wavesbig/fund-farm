'use client';

import * as React from 'react';
import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { isObject } from 'lodash';
import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string | number = string | number> {
  value: T;
  label: React.ReactNode;
  icon?: React.ElementType<{ className?: string }>;
  disabled?: boolean;
}

export interface SegmentedProps<T extends string | number = string | number> {
  value: T;
  onChange: (value: T) => void;
  options: (SegmentedOption<T> | T)[];
  className?: string;
  itemClassName?: string;
  size?: 'sm' | 'default' | 'lg';
  layoutId?: string;
  disabled?: boolean;
  indicatorClassName?: string;
}

const sizeVariants = {
  sm: 'h-8 text-xs px-2.5',
  default: 'h-9 text-xs sm:text-sm px-3',
  lg: 'h-10 text-sm px-4'
};

function Segmented<T extends string | number = string | number>({
  value,
  onChange,
  options,
  className,
  itemClassName,
  size = 'default',
  layoutId,
  disabled = false,
  indicatorClassName
}: SegmentedProps<T>) {
  const generatedId = useId();
  const activeLayoutId = layoutId || `segmented-pill-${generatedId}`;
  const shouldReduceMotion = useReducedMotion();

  const normalizedOptions: SegmentedOption<T>[] = React.useMemo(() => {
    return options.map((opt) => {
      if (isObject(opt) && 'value' in opt) {
        return opt as SegmentedOption<T>;
      }
      return {
        value: opt as T,
        label: String(opt)
      };
    });
  }, [options]);

  return (
    <div
      role="radiogroup"
      aria-disabled={disabled}
      className={cn(
        'relative flex items-center w-full p-1 rounded-xl select-none',
        'bg-secondary/60 border border-border/70 backdrop-blur-xs',
        disabled && 'opacity-60 pointer-events-none',
        className
      )}
    >
      {normalizedOptions.map((opt) => {
        const isSelected = opt.value === value;
        const Icon = opt.icon;

        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled || opt.disabled}
            onClick={() => {
              if (!opt.disabled && !disabled && opt.value !== value) {
                onChange(opt.value);
              }
            }}
            className={cn(
              'relative flex-1 flex items-center justify-center gap-1.5 font-medium rounded-lg select-none text-center cursor-pointer',
              'transition-colors duration-150 ease-out outline-none focus-visible:ring-1 focus-visible:ring-ring',
              sizeVariants[size],
              isSelected
                ? 'text-primary-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]',
              opt.disabled && 'opacity-40 cursor-not-allowed',
              itemClassName
            )}
          >
            {isSelected && (
              <motion.div
                layoutId={activeLayoutId}
                transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 38 }}
                className={cn(
                  'absolute inset-0 rounded-lg bg-primary shadow-xs border border-primary/50',
                  indicatorClassName
                )}
              />
            )}
            {Icon && (
              <Icon
                className={cn(
                  'size-4 shrink-0 relative z-10 transition-colors',
                  isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                )}
              />
            )}
            <span className="relative z-10 truncate">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export { Segmented };
