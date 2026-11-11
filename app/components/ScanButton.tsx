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
            'size-7 rounded-md flex items-center justify-center text-muted-foreground/70 hover:text-foreground hover:bg-white/[0.08] [data-theme=light]:hover:bg-black/[0.06] active:scale-95 transition-all',
            disabled ? 'opacity-50 cursor-wait' : 'cursor-pointer'
          )}
          onClick={onClick}
          disabled={disabled}
          aria-label="拍照/上传图片识别基金代码"
        >
          {disabled ? (
            <Loader2 className="size-3.5 animate-spin text-primary" strokeWidth={2} />
          ) : (
            <Camera className="size-4" strokeWidth={1.8} />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>拍照/上传图片识别基金代码</p>
      </TooltipContent>
    </Tooltip>
  );
}
