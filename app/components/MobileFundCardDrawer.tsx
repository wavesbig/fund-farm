'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import FundCard from './FundCard';

export interface MobileFundCardDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockDrawerClose?: boolean;
  ignoreNextDrawerCloseRef?: React.MutableRefObject<boolean>;
  cardSheetRow?: any;
  getFundCardProps?: (row: any) => any;
  children?: React.ReactNode;
}

/**
 * 移动端基金详情底部 Drawer 弹框
 */
export default function MobileFundCardDrawer({
  open,
  onOpenChange,
  blockDrawerClose = false,
  ignoreNextDrawerCloseRef,
  cardSheetRow,
  getFundCardProps,
  children
}: MobileFundCardDrawerProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          if (typeof document !== 'undefined' && document.body.hasAttribute('data-photo-viewer-open')) return;
          if (ignoreNextDrawerCloseRef?.current) {
            ignoreNextDrawerCloseRef.current = false;
            return;
          }
          if (!blockDrawerClose) onOpenChange(false);
        }
      }}
    >
      {children && <DrawerTrigger asChild>{children}</DrawerTrigger>}
      <DrawerContent
        className="h-[85vh] max-h-[90vh] mt-0 flex flex-col"
        onPointerDownOutside={(e) => {
          if (blockDrawerClose) return;
          if (typeof document !== 'undefined' && document.body.hasAttribute('data-photo-viewer-open')) {
            e.preventDefault();
            return;
          }
          if ((e?.target as HTMLElement)?.closest?.('[data-slot="dialog-content"], [role="dialog"]')) {
            if (ignoreNextDrawerCloseRef) ignoreNextDrawerCloseRef.current = true;
            return;
          }
          onOpenChange(false);
        }}
        onEscapeKeyDown={(e) => {
          if (typeof document !== 'undefined' && document.body.hasAttribute('data-photo-viewer-open')) {
            e.preventDefault();
          }
        }}
      >
        <DrawerHeader className="flex-shrink-0 flex flex-row items-center justify-between gap-2 space-y-0 px-5 pb-4 pt-2 text-left">
          <DrawerTitle className="text-base font-semibold text-[var(--text)]">基金详情</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-[var(--muted)] hover:text-[var(--text)]">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div
          className="flex-1 min-h-0 overflow-y-auto px-5 pb-8 pt-0 scrollbar-y-styled"
          style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
        >
          {cardSheetRow && getFundCardProps ? (
            <FundCard {...getFundCardProps(cardSheetRow)} layoutMode="drawer" />
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
