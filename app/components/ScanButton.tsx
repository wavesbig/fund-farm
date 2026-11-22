'use client';

import * as React from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface ScanButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

export default function ScanButton({ onClick, disabled }: ScanButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            'group relative size-7 rounded-md flex items-center justify-center text-muted-foreground/75 hover:text-foreground hover:bg-white/[0.08] [data-theme=light]:hover:bg-black/[0.06] active:scale-95 transition-all',
            disabled ? 'opacity-50 cursor-wait' : 'cursor-pointer'
          )}
          onClick={onClick}
          disabled={disabled}
          aria-label="拍照/截图智能识别持仓"
        >
          {disabled ? (
            <Loader2 className="size-3.5 animate-spin text-primary" strokeWidth={2} />
          ) : (
            <Camera className="size-4 transition-transform group-hover:scale-105" strokeWidth={1.8} />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <p className="font-medium">拍照 / 截图智能识别持仓</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">支持快捷键直接 Ctrl+V 粘贴截图</p>
      </TooltipContent>
    </Tooltip>
  );
}
