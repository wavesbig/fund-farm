'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export interface TutorialDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TutorialDrawer({ open, onOpenChange }: TutorialDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="glass h-[95vh] max-h-[95vh]">
        <DrawerHeader className="shrink-0 flex flex-row items-center justify-between gap-2 space-y-0 px-4 pb-3 pt-3 text-left border-b border-[var(--border)]">
          <DrawerTitle className="text-base font-semibold text-foreground">使用帮助</DrawerTitle>
          <DrawerClose className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </DrawerClose>
        </DrawerHeader>
        <div className="flex-1 w-full h-full overflow-hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <iframe
                src="https://www.yuque.com/u267605/ookgim/im06q8tembbld6im?singleDoc"
                className="w-full h-full border-0"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin"
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>使用帮助</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
