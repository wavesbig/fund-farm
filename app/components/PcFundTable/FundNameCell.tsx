'use client';

import React, { memo, useContext } from 'react';
import { isArray, isObject } from 'lodash';
import { Plus, GripVertical, Star, Link as LinkIcon } from 'lucide-react';
import { ConsecutiveTrendBadge } from '../Common';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { getTagThemeBadgeProps } from '@/app/components/AddTagDialog';
import { cn } from '@/lib/utils';
import { EditModeContext, SortableRowContext, type FundNameCellProps } from './types';

export const FundNameCell = memo(
  ({
    info,
    showFullFundName,
    onOpenCardDialog,
    favorites,
    isGroupTab,
    currentTab,
    batchRemoveEnabled,
    sortBy,
    onToggleFavoriteRef,
    onFundTagsClickRef,
    canEditFundTags,
    fundExtraDataByCode
  }: FundNameCellProps) => {
    const { isEditMode, selectedCodes, toggleSelected } = useContext(EditModeContext);
    const original = info.row.original || {};
    const code = original.code;
    const isUpdated = original.isUpdated;
    const hasDca = original.hasDca;
    const hasPending = original.hasPending;
    const fundTags = isArray(original.fundTags) ? original.fundTags : [];
    const isFavorites = favorites?.has?.(code);
    const rowContext = useContext(SortableRowContext);
    const showFavoriteButton = !isGroupTab && (currentTab === 'all' || currentTab === 'fav' || !currentTab);
    const holdingLocked = (currentTab === 'all' || currentTab === 'fav') && !!original.isHoldingLinked;

    return (
      <div className="name-cell-content flex items-center justify-start gap-2.5 w-full min-w-0 py-1">
        {batchRemoveEnabled && isEditMode && (
          <div
            onClick={(e) => e.stopPropagation?.()}
            title={holdingLocked ? '关联持仓不可批量选择' : '选择用于移动分组/批量删除'}
            className="flex items-center justify-center size-5 shrink-0"
          >
            <Checkbox
              disabled={holdingLocked}
              checked={!holdingLocked && (selectedCodes?.has?.(code) || false)}
              onCheckedChange={(checked) => toggleSelected?.(code, !!checked)}
              onClick={(e) => e.stopPropagation?.()}
              aria-label="选择基金"
              className="size-4"
            />
          </div>
        )}
        {isEditMode &&
          (sortBy === 'default' ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="drag-handle inline-flex items-center justify-center size-5 shrink-0 text-muted-foreground/60 hover:text-foreground cursor-grab active:cursor-grabbing transition-colors"
                  ref={rowContext?.setActivatorNodeRef}
                  {...rowContext?.activatorProps}
                  {...rowContext?.listeners}
                  onClick={(e) => e.stopPropagation?.()}
                >
                  <GripVertical className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>拖拽排序</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="drag-handle inline-flex items-center justify-center size-5 shrink-0 text-muted-foreground/30 cursor-not-allowed"
                  onClick={(e) => e.stopPropagation?.()}
                >
                  <GripVertical className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>拖拽基金顺序需要在默认排序下操作</TooltipContent>
            </Tooltip>
          ))}
        {showFavoriteButton ? (
          <button
            type="button"
            className="fav-button inline-flex items-center justify-center size-6 shrink-0 rounded-md text-muted-foreground/40 hover:text-amber-400 hover:bg-amber-400/10 transition-colors cursor-pointer"
            title={isFavorites ? '取消自选' : '添加自选'}
            onClick={(e) => {
              e.stopPropagation?.();
              onToggleFavoriteRef?.current?.(original);
            }}
          >
            <Star
              className={cn(
                'size-4 transition-all duration-200',
                isFavorites ? 'fill-amber-400 text-amber-400 scale-110' : ''
              )}
            />
          </button>
        ) : null}

        <div
          className="title-text flex flex-col justify-center min-w-0 flex-1 gap-1"
          role={onOpenCardDialog ? 'button' : undefined}
          tabIndex={onOpenCardDialog ? 0 : undefined}
          title={onOpenCardDialog ? '查看基金详情' : original.isUpdated ? '今日净值已更新' : undefined}
          onClick={
            onOpenCardDialog
              ? (e) => {
                  e.stopPropagation?.();
                  onOpenCardDialog(original);
                }
              : undefined
          }
          onKeyDown={
            onOpenCardDialog
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenCardDialog(original);
                  }
                }
              : undefined
          }
          style={onOpenCardDialog ? { cursor: 'pointer' } : undefined}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {holdingLocked ? (
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <span aria-label="已关联持仓" className="inline-flex items-center shrink-0 text-primary">
                    <LinkIcon className="size-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>持仓来自自定义分组汇总</TooltipContent>
              </Tooltip>
            ) : null}
            <ConsecutiveTrendBadge trend={fundExtraDataByCode?.[code]?.consecutiveTrend} />
            <span
              className={cn(
                'font-semibold text-foreground text-sm tracking-tight hover:text-primary transition-colors',
                showFullFundName ? 'break-words' : 'truncate'
              )}
            >
              {info.getValue() ?? '—'}
            </span>
          </div>

          {code ? (
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="font-mono text-xs text-muted-foreground/90 font-medium">#{code}</span>

              {hasPending && (
                <Tooltip delayDuration={150}>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center justify-center size-3.5 text-[10px] font-semibold rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      待
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>有进行中的交易</TooltipContent>
                </Tooltip>
              )}
              {hasDca && (
                <Tooltip delayDuration={150}>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center justify-center size-3.5 text-[10px] font-semibold rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                      定
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>定投中</TooltipContent>
                </Tooltip>
              )}
              {isUpdated && (
                <Tooltip delayDuration={150}>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center justify-center size-3.5 text-[10px] font-semibold rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      ✓
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>今日净值已更新</TooltipContent>
                </Tooltip>
              )}

              {fundTags.length > 0 ? (
                <div className="inline-flex items-center gap-1 flex-wrap">
                  {fundTags.map((raw: any, idx: number) => {
                    const item =
                      raw && isObject(raw) && (raw as any).name != null
                        ? {
                            name: String((raw as any).name).trim(),
                            theme: String((raw as any).theme ?? 'default').trim() || 'default'
                          }
                        : { name: String(raw).trim(), theme: 'default' };
                    if (!item.name) return null;
                    const { variant, className: themeCls } = getTagThemeBadgeProps(item.theme);
                    return (
                      <Badge
                        key={`${item.name}-${idx}`}
                        variant={variant}
                        className={cn(
                          'h-4 px-1 text-[10px] font-normal rounded-sm transition-opacity hover:opacity-80',
                          themeCls
                        )}
                        title={canEditFundTags ? '编辑标签' : undefined}
                        style={{ cursor: canEditFundTags ? 'pointer' : 'default' }}
                        onClick={(e) => {
                          if (onFundTagsClickRef?.current) {
                            e.stopPropagation?.();
                            onFundTagsClickRef.current(original);
                          }
                        }}
                      >
                        {item.name}
                      </Badge>
                    );
                  })}
                </div>
              ) : canEditFundTags ? (
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                  title="添加标签"
                  onClick={(e) => {
                    e.stopPropagation?.();
                    onFundTagsClickRef?.current?.(original);
                  }}
                >
                  <Badge
                    variant="outline"
                    className="h-4 px-1 text-[10px] font-normal border-dashed text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="size-2.5 mr-0.5" />
                    标签
                  </Badge>
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    );
  }
);

FundNameCell.displayName = 'FundNameCell';
export default FundNameCell;
