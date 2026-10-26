'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isArray, isObject } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Tag, X, Pencil, Sparkles, RefreshCw } from 'lucide-react';
import { useIsMobile } from '@/app/hooks/useIsMobile';
import { supabase, isSupabaseConfigured } from '@/app/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import ConfirmModal from './ConfirmModal';
import { cn } from '@/lib/utils';
import AddTagDialog, { type AddTagDialogPayload } from './AddTagDialog';
import EditTagDialog, { type EditTagDialogPayload } from './EditTagDialog';
import SyncFundTagsModal, { type FundTagOption } from './SyncFundTagsModal';
import { TAG_THEME_OPTIONS } from '@/app/constants';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const DEFAULT_TAG_THEME = 'default';
const ALLOWED_THEMES = new Set((TAG_THEME_OPTIONS as any[]).map((x) => x.key));

export interface FundTagDraft {
  id: string;
  name: string;
  theme: string;
}

function normalizeTagDraft(raw: any): FundTagDraft[] {
  if (!isArray(raw)) return [];
  const out: FundTagDraft[] = [];
  const usedIds = new Set<string>();
  for (const item of raw) {
    if (!item || !isObject(item)) continue;
    const name = String((item as any).name ?? '').trim();
    if (!name || name.length > 24) continue;
    let id = String((item as any).id ?? '').trim();
    if (!id || usedIds.has(id)) id = uuidv4();
    usedIds.add(id);
    const theme = String((item as any).theme ?? DEFAULT_TAG_THEME).trim();
    const normalizedTheme = ALLOWED_THEMES.has(theme) ? theme : DEFAULT_TAG_THEME;
    out.push({ id, name, theme: normalizedTheme });
    if (out.length >= 30) break;
  }
  return out;
}

export interface FundTagsEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fundCode?: string;
  fundName?: string;
  tags?: any[];
  onSave?: (code: string, tags: FundTagDraft[]) => void;
  recommendedTagItems?: Array<{ id?: string; name: string; theme: string }>;
  onAddPoolTag?: (payload: { theme: string; name?: string; names?: string[] }) => void;
  onDeleteGlobalTag?: (tagId: string) => void;
  onUpdateGlobalTag?: (tagId: string, payload: { name: string; theme: string }) => void;
  getTagUsageLabels?: (tagId: string) => string[];
  allFunds?: any[];
  fundTagListsByCode?: Record<string, any[]>;
}

export default function FundTagsEditDialog({
  open,
  onOpenChange,
  fundCode,
  fundName = '',
  tags = [],
  onSave,
  recommendedTagItems = [],
  onAddPoolTag,
  onDeleteGlobalTag,
  onUpdateGlobalTag,
  getTagUsageLabels,
  allFunds = [],
  fundTagListsByCode = {}
}: FundTagsEditDialogProps) {
  const isMobile = useIsMobile();
  const [draft, setDraft] = useState<FundTagDraft[]>(() => normalizeTagDraft(tags));
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTagData, setEditTagData] = useState<{ id?: string; name: string; theme: string } | null>(null);
  /** 'fund'：加到当前基金已选；'pool'：仅写入全局可选池 */
  const [addDialogPurpose, setAddDialogPurpose] = useState<'fund' | 'pool'>('fund');
  const [optionalEditMode, setOptionalEditMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ tagId: string; name: string; labels: string[] } | null>(null);
  /** 防止快速连点可选标签，连续两次 setDraft 都基于旧 draft 导致重复添加 */
  const optionalPickLockRef = useRef(false);

  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<FundTagDraft[]>([]);

  const syncOptions: FundTagOption[] = useMemo(() => {
    if (!allFunds || allFunds.length === 0) return [];
    return allFunds
      .filter((f) => f.code && f.code !== fundCode)
      .map((f) => {
        const fc = String(f.code).trim();
        const fTags = isArray(fundTagListsByCode[fc])
          ? fundTagListsByCode[fc].map(({ name, theme }: any) => ({
              id: uuidv4(),
              name: String(name ?? '').trim(),
              theme: String(theme ?? '').trim()
            }))
          : [];
        return {
          id: fc,
          name: f.name,
          tags: fTags
        };
      });
  }, [allFunds, fundCode, fundTagListsByCode]);

  const handleSyncConfirm = useCallback(
    (targetCodes: string[]) => {
      if (!targetCodes || targetCodes.length === 0) return;
      targetCodes.forEach((fc) => {
        onSave?.(fc, draft);
      });
      setSyncModalOpen(false);
    },
    [draft, onSave]
  );

  const themeClassByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const opt of TAG_THEME_OPTIONS as any[]) {
      map.set(opt.key, opt.badgeClassName || '');
    }
    return map;
  }, []);

  /** 禁止在 setState updater 内同步调用 onSave（会触发父组件 setState，违反 React 规则） */
  const persistDraft = useCallback(
    (next: FundTagDraft[]) => {
      if (!fundCode) return;
      const code = fundCode;
      const save = onSave;
      queueMicrotask(() => {
        save?.(code, next);
      });
    },
    [fundCode, onSave]
  );

  const addTagsToFund = useCallback(
    (rawNames: string[], theme = DEFAULT_TAG_THEME, preferredId?: string) => {
      const normalizedTheme = ALLOWED_THEMES.has(theme) ? theme : DEFAULT_TAG_THEME;
      const single = isArray(rawNames) && rawNames.length === 1;
      const poolId = single && String(preferredId ?? '').trim() ? String(preferredId).trim() : '';
      const rowsToAdd: FundTagDraft[] = [];
      for (const raw of rawNames) {
        const name = String(raw ?? '').trim();
        if (!name || name.length > 24) continue;
        let id = uuidv4();
        if (single && poolId) {
          id = poolId;
        }
        rowsToAdd.push({ id, name, theme: normalizedTheme });
      }
      if (!rowsToAdd.length) return;

      setDraft((prev) => {
        const next = [...prev];
        for (const row of rowsToAdd) {
          if (next.length >= 30) break;
          if (next.some((x) => x.id === row.id)) continue;
          next.push(row);
        }
        if (next.length === prev.length) return prev;
        persistDraft(next);
        return next;
      });
    },
    [persistDraft]
  );

  const addTagToFund = useCallback(
    (rawName: string, theme = DEFAULT_TAG_THEME, poolTagId?: string) => {
      addTagsToFund([rawName], theme, poolTagId);
    },
    [addTagsToFund]
  );

  useEffect(() => {
    if (!open) return;
    setDraft(normalizeTagDraft(tags));
    setOptionalEditMode(false);
    setDeleteConfirm(null);
    setEditTagData(null);
    setAddDialogPurpose('fund');
    optionalPickLockRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fundCode]);

  /** 弹框打开时查询推荐标签（基于基金 topic → sector_id） */
  useEffect(() => {
    if (!open || !fundCode || !isSupabaseConfigured) {
      setSuggestedTags([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.rpc('get_fund_recommended_tags', { p_fund_code: fundCode });
        if (cancelled) return;
        if (error || !isArray(data) || data.length === 0) {
          setSuggestedTags([]);
          return;
        }
        const foundTags = data.flatMap((row: any) => {
          const topicStr = String(row?.topic ?? '').trim();
          const sectorIdStr = String(row?.sector_id ?? '').trim();
          if (!topicStr || !sectorIdStr) return [];

          const topics = topicStr
            .split(';')
            .map((t: string) => t.trim())
            .filter(Boolean);
          const sectorIds = sectorIdStr
            .split(';')
            .map((t: string) => t.trim())
            .filter(Boolean);

          const result: FundTagDraft[] = [];
          for (let i = 0; i < topics.length; i++) {
            const t = topics[i];
            const s = sectorIds[i];
            if (t && s) {
              result.push({ id: `default_${s}`, name: t, theme: DEFAULT_TAG_THEME });
            }
          }
          return result;
        });
        setSuggestedTags(foundTags);
      } catch {
        if (!cancelled) setSuggestedTags([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, fundCode]);

  const removeTagFromFund = useCallback(
    (instanceId: string) => {
      const id = String(instanceId ?? '').trim();
      if (!id) return;
      setDraft((prev) => {
        const next = prev.filter((x) => x.id !== id);
        persistDraft(next);
        return next;
      });
    },
    [persistDraft]
  );

  const addBadgeClassName = useMemo(() => {
    return cn('cursor-pointer font-normal text-xs', 'border-dashed text-muted-foreground hover:text-foreground');
  }, []);

  const openAddFundDialog = () => {
    setAddDialogPurpose('fund');
    setAddDialogOpen(true);
  };

  const openAddPoolDialog = () => {
    setAddDialogPurpose('pool');
    setAddDialogOpen(true);
  };

  const handleAddDialogAdd = useCallback(
    (payload: AddTagDialogPayload) => {
      const theme = payload?.theme ?? DEFAULT_TAG_THEME;
      const names = isArray(payload?.names) && payload.names.length ? payload.names : [];
      if (!names.length) return;
      if (addDialogPurpose === 'pool') {
        onAddPoolTag?.({ names, theme });
        return;
      }
      addTagsToFund(names, theme);
    },
    [addDialogPurpose, onAddPoolTag, addTagsToFund]
  );

  const removeDraftTagByPoolId = useCallback(
    (poolTagId: string) => {
      const pid = String(poolTagId ?? '').trim();
      if (!pid) return;
      setDraft((prev) => {
        if (!prev.some((x) => x.id === pid)) return prev;
        const next = prev.filter((x) => x.id !== pid);
        persistDraft(next);
        return next;
      });
    },
    [persistDraft]
  );

  const requestDeleteOptionalTag = useCallback(
    (tagId?: string, displayName?: string) => {
      const id = String(tagId ?? '').trim();
      if (!id) return;
      const name = String(displayName ?? '').trim();
      const labels = getTagUsageLabels?.(id) ?? [];
      if (labels.length === 0) {
        onDeleteGlobalTag?.(id);
        removeDraftTagByPoolId(id);
        return;
      }
      setDeleteConfirm({ tagId: id, name: name || '标签', labels });
    },
    [getTagUsageLabels, onDeleteGlobalTag, removeDraftTagByPoolId]
  );

  const confirmDeleteOptionalTag = useCallback(() => {
    if (!deleteConfirm?.tagId) return;
    onDeleteGlobalTag?.(deleteConfirm.tagId);
    removeDraftTagByPoolId(deleteConfirm.tagId);
    setDeleteConfirm(null);
  }, [deleteConfirm, onDeleteGlobalTag, removeDraftTagByPoolId]);

  const deleteConfirmModal = deleteConfirm ? (
    <ConfirmModal
      title="删除标签"
      confirmText="确定删除"
      confirmVariant="danger"
      onCancel={() => setDeleteConfirm(null)}
      onConfirm={confirmDeleteOptionalTag}
      messageContent={
        <div className="flex flex-col gap-3">
          <p>
            标签「<span className="font-medium text-foreground">{deleteConfirm.name}</span>
            」已用于以下基金，删除后这些基金将不再显示该标签。确定删除？
          </p>
          <ul className="list-inside list-disc space-y-1 text-sm">
            {deleteConfirm.labels.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      }
    />
  ) : null;

  const body = (
    <div className="flex min-w-0 flex-col gap-4">
      {fundName ? (
        <div>
          <div className="font-semibold text-base text-foreground mb-1">{fundName}</div>
          {fundCode ? <div className="text-xs text-[var(--muted)] tabular-nums">#{fundCode}</div> : null}
        </div>
      ) : null}

      <div>
        <div className="flex flex-wrap gap-2">
          {draft.length === 0 ? (
            <span className="text-muted-foreground text-sm">暂无标签，可在下方添加</span>
          ) : (
            draft.map(({ id, name, theme }) => {
              const themeClass = themeClassByKey.get(theme) || '';
              const isDefault = theme === DEFAULT_TAG_THEME;
              return (
                <button
                  key={id}
                  type="button"
                  className="inline-flex"
                  disabled={optionalEditMode}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeTagFromFund(id);
                  }}
                >
                  <Badge
                    className={cn('cursor-pointer font-normal text-xs gap-1', themeClass)}
                    variant={isDefault ? 'outline' : 'default'}
                  >
                    <span>{name}</span>
                    {!optionalEditMode && <X className="h-3 w-3 shrink-0 opacity-70 hover:opacity-100" />}
                  </Badge>
                </button>
              );
            })
          )}

          {!optionalEditMode && (
            <button type="button" className="inline-flex" disabled={draft.length >= 30} onClick={openAddFundDialog}>
              <Badge
                variant="outline"
                className={cn(addBadgeClassName, draft.length >= 30 && 'pointer-events-none opacity-45')}
              >
                <Plus className="h-3 w-3 mr-0.5" />
                添加标签
              </Badge>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground m-0">可选标签</h3>
          <button
            type="button"
            className="text-primary hover:text-primary/90 shrink-0 cursor-pointer text-sm font-medium underline-offset-4 hover:underline"
            onClick={() => setOptionalEditMode((v) => !v)}
          >
            {optionalEditMode ? '完成' : '编辑'}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(recommendedTagItems || []).map((item, itemIndex) => {
            const label = String(item?.name ?? '').trim();
            if (!label) return null;
            const poolTagId = String(item?.id ?? '').trim();
            const itemTheme = ALLOWED_THEMES.has(String(item.theme ?? '').trim())
              ? String(item.theme).trim()
              : DEFAULT_TAG_THEME;
            const themeClass = themeClassByKey.get(itemTheme) || '';
            const isDefault = itemTheme === DEFAULT_TAG_THEME;
            const alreadyInDraft = Boolean(poolTagId && draft.some((t) => t.id === poolTagId));
            const disabledPick = draft.length >= 30 || alreadyInDraft;

            if (optionalEditMode) {
              return (
                <div key={poolTagId || `opt-${itemIndex}`} className="inline-flex">
                  <Badge
                    className={cn('font-normal text-xs gap-1 px-2.5', themeClass)}
                    variant={isDefault ? 'outline' : 'default'}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={`编辑标签 ${label}`}
                          className="hover:opacity-75 cursor-pointer flex items-center justify-center -ml-0.5"
                          onClick={() => setEditTagData({ id: poolTagId, name: label, theme: itemTheme })}
                        >
                          <Pencil className="h-3 w-3 shrink-0" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="z-[9999]">
                        <p>编辑标签</p>
                      </TooltipContent>
                    </Tooltip>

                    <span>{label}</span>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={`删除标签 ${label}`}
                          className="hover:opacity-75 cursor-pointer flex items-center justify-center -mr-0.5"
                          onClick={() => requestDeleteOptionalTag(poolTagId, label)}
                        >
                          <X className="h-3 w-3 shrink-0" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="z-[9999]">
                        <p>删除标签</p>
                      </TooltipContent>
                    </Tooltip>
                  </Badge>
                </div>
              );
            }

            return (
              <button
                key={poolTagId || `opt-${itemIndex}`}
                type="button"
                className="inline-flex"
                disabled={disabledPick}
                onClick={() => {
                  if (disabledPick || optionalPickLockRef.current) return;
                  optionalPickLockRef.current = true;
                  addTagToFund(label, itemTheme, poolTagId);
                  window.setTimeout(() => {
                    optionalPickLockRef.current = false;
                  }, 450);
                }}
              >
                <Badge
                  className={cn(
                    'cursor-pointer font-normal text-xs',
                    themeClass,
                    disabledPick && 'pointer-events-none opacity-45'
                  )}
                  variant={isDefault ? 'outline' : 'default'}
                >
                  {label}
                </Badge>
              </button>
            );
          })}

          {optionalEditMode && (
            <button type="button" className="inline-flex" onClick={openAddPoolDialog}>
              <Badge variant="outline" className={cn('font-normal text-xs', addBadgeClassName)}>
                <Plus className="h-3 w-3 mr-0.5" />
                添加标签
              </Badge>
            </button>
          )}
        </div>
      </div>

      {/* ===== 推荐标签区域 ===== */}
      {suggestedTags.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground m-0">推荐标签</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {suggestedTags.map((item) => {
              const existingInPool = (recommendedTagItems || []).find((t) => String(t.id).trim() === item.id);
              const displayName = existingInPool ? existingInPool.name : item.name;
              const displayTheme = existingInPool ? existingInPool.theme : item.theme;
              const themeClass = themeClassByKey.get(displayTheme) || '';
              const isDefault = displayTheme === DEFAULT_TAG_THEME;

              const alreadyInDraft = Boolean(item.id && draft.some((t) => t.id === item.id));
              const disabledPick = draft.length >= 30 || alreadyInDraft;
              return (
                <button
                  key={item.id}
                  type="button"
                  className="inline-flex"
                  disabled={disabledPick}
                  onClick={() => {
                    if (disabledPick || optionalPickLockRef.current) return;
                    optionalPickLockRef.current = true;
                    addTagToFund(displayName, displayTheme, item.id);
                    window.setTimeout(() => {
                      optionalPickLockRef.current = false;
                    }, 450);
                  }}
                >
                  <Badge
                    className={cn(
                      'cursor-pointer font-normal text-xs',
                      themeClass,
                      disabledPick && 'pointer-events-none opacity-45'
                    )}
                    variant={isDefault ? 'outline' : 'default'}
                  >
                    {displayName}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <AddTagDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onAdd={handleAddDialogAdd} />
      <EditTagDialog
        open={Boolean(editTagData)}
        onOpenChange={(v) => {
          if (!v) setEditTagData(null);
        }}
        initialName={editTagData?.name || ''}
        initialTheme={editTagData?.theme || 'default'}
        onEdit={(payload: EditTagDialogPayload) => {
          if (editTagData?.id) {
            onUpdateGlobalTag?.(editTagData.id, payload);
            setDraft((prev) =>
              prev.map((t) => (t.id === editTagData.id ? { ...t, name: payload.name, theme: payload.theme } : t))
            );
          }
        }}
      />
      <SyncFundTagsModal
        open={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        options={syncOptions}
        sourceName={fundName || fundCode || '当前基金'}
        sourceTags={draft}
        onConfirm={handleSyncConfirm}
      />
      {deleteConfirmModal}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
        <DrawerContent className="glass max-h-[90vh]" defaultHeight="77vh" minHeight="36vh" maxHeight="90vh">
          <DrawerHeader className="flex flex-row items-center justify-between gap-2 border-b border-[var(--border)] py-4 px-4 text-left">
            <div className="flex items-center gap-2.5">
              <DrawerTitle className="text-base font-semibold text-foreground">编辑标签</DrawerTitle>
              {allFunds.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSyncModalOpen(true)}
                  className="h-7 px-2.5 rounded-full text-xs gap-1 text-primary bg-white/5 border-primary/30 shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>同步</span>
                </Button>
              )}
            </div>
            <DrawerClose
              className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-foreground transition-colors"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </DrawerClose>
          </DrawerHeader>
          <div className="scrollbar-y-styled flex-1 overflow-y-auto px-4 pb-6 pt-3">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="glass card modal trade-modal flex max-h-[min(85vh,640px)] flex-col gap-0 overflow-hidden p-0 max-w-[420px] w-[90vw] z-[99]"
        overlayClassName="modal-overlay"
      >
        <DialogTitle className="sr-only">编辑标签</DialogTitle>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="title shrink-0 border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Tag className="w-5 h-5 text-primary shrink-0" />
              <span className="font-semibold text-base text-foreground">编辑标签</span>
              {allFunds.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSyncModalOpen(true)}
                  className="h-7 px-2.5 rounded-full text-xs gap-1 text-primary bg-white/5 border-primary/30 shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>同步</span>
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full text-[var(--muted)] hover:text-foreground"
              aria-label="关闭"
              title="关闭"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="scrollbar-y-styled min-h-0 flex-1 overflow-y-auto px-4 py-4">{body}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
