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
            'icon-button w-8 h-8 flex items-center justify-center transition-opacity',
            disabled ? 'opacity-50 cursor-wait' : 'cursor-pointer'
          )}
          onClick={onClick}
          disabled={disabled}
        >
          {disabled ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Camera className="w-4 h-4" />}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>拍照/上传图片识别基金代码</p>
      </TooltipContent>
    </Tooltip>
  );
}
