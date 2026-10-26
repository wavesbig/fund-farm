'use client';

import * as React from 'react';
import { FolderOpenIcon, PlusIcon } from 'lucide-react';
import { SUMMARY_TAB_ID } from '@/app/constants';
import { Button } from '@/components/ui/button';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';

interface EmptyStateCardProps {
  fundsLength?: number;
  currentTab?: string;
  onAddToGroup?: () => void;
}

export default function EmptyStateCard({ fundsLength = 0, currentTab = 'all', onAddToGroup }: EmptyStateCardProps) {
  const isEmpty = fundsLength === 0;
  const isGroupTab = currentTab !== 'all' && currentTab !== 'fav' && currentTab !== SUMMARY_TAB_ID;

  return (
    <div className="glass rounded-xl p-8 md:p-14 my-3 flex flex-col items-center justify-center">
      <Empty className="border-none p-0">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-16 rounded-2xl bg-primary/10 text-primary mb-3">
            <FolderOpenIcon className="size-8" />
          </EmptyMedia>
          <EmptyTitle className="text-base font-semibold text-foreground/90">
            {isEmpty ? '尚未添加基金' : '该分组下暂无基金'}
          </EmptyTitle>
          <EmptyDescription className="text-xs text-muted-foreground/80 max-w-xs leading-relaxed">
            {isEmpty
              ? '请点击顶部搜索栏，输入 6 位基金代码或名称关键词添加基金。'
              : '当前分组尚未关联任何基金，可点击下方按钮将已有基金加入此分组。'}
          </EmptyDescription>
        </EmptyHeader>

        {isGroupTab && fundsLength > 0 && onAddToGroup && (
          <EmptyContent className="mt-2">
            <Button variant="default" size="sm" onClick={onAddToGroup} className="gap-1.5 shadow-sm font-medium">
              <PlusIcon className="size-4" />
              添加基金到此分组
            </Button>
          </EmptyContent>
        )}
      </Empty>
    </div>
  );
}
