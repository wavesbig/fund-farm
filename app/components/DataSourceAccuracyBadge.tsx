'use client';

import * as React from 'react';
import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface DataSourceAccuracyBadgeProps {
  label?: string | null;
}

export default function DataSourceAccuracyBadge({ label }: DataSourceAccuracyBadgeProps) {
  if (!label) return null;

  return (
    <Badge
      variant="outline"
      className="text-[10px] px-1.5 py-0 h-[18px] min-h-0 leading-none font-medium flex items-center gap-1 border-[#D4AF37]/50 text-[#D4AF37] bg-[#D4AF37]/10"
    >
      <Crown className="w-2.5 h-2.5" />
      <span>{label}</span>
    </Badge>
  );
}
