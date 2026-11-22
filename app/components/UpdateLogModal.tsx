'use client';

import * as React from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Sparkles,
  Calendar,
  ExternalLink,
  RefreshCw,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Github,
  Tag,
  CheckCircle2,
  SearchX
} from 'lucide-react';
import { isString, isEmpty, isArray } from 'lodash';
import { toast } from 'sonner';

import { useIsMobile } from '@/app/hooks/useIsMobile';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerClose
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { withRetry } from '@/app/lib/asyncHelper';
import packageJson from '@/package.json';
import {
  BUILTIN_RELEASES,
  CHANGE_TYPE_CONFIG,
  mergeReleases,
  type ChangeType,
  type ReleaseLog,
  type ChangeItem
} from '@/app/lib/changelogData';

export interface UpdateLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CURRENT_APP_VERSION = `v${packageJson.version}`;
const GITHUB_REPO_URL = 'https://github.com/wavesbig/fund-farm';
const GITHUB_RELEASES_URL = `${GITHUB_REPO_URL}/releases`;
const GITHUB_ISSUES_URL = `${GITHUB_REPO_URL}/issues`;

type FilterCategory = 'all' | ChangeType;

const CATEGORY_TABS: { key: FilterCategory; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'feat', label: '特性' },
  { key: 'fix', label: '修复' },
  { key: 'style', label: '界面' },
  { key: 'perf', label: '性能' },
  { key: 'refactor', label: '重构' },
  { key: 'other', label: '其他' }
];

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-primary/20 text-primary font-semibold px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function UpdateLogModal({ open, onOpenChange }: UpdateLogModalProps) {
  const isMobile = useIsMobile();
  const [releases, setReleases] = useState<ReleaseLog[]>(BUILTIN_RELEASES);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [expandedReleases, setExpandedReleases] = useState<Record<string, boolean>>({
    [BUILTIN_RELEASES[0]?.tagName || 'v1.0.9']: true,
    [BUILTIN_RELEASES[1]?.tagName || 'v1.0.8']: true,
    [BUILTIN_RELEASES[2]?.tagName || 'v1.0.7']: true
  });

  const mountTimeRef = useRef(0);
  useEffect(() => {
    if (open) {
      mountTimeRef.current = Date.now();
    }
  }, [open]);

  // 从 GitHub Releases 获取最新动态
  const handleFetchRemoteReleases = async (showToast = true) => {
    const releasesApiUrl =
      process.env.NEXT_PUBLIC_GITHUB_RELEASES_URL || 'https://api.github.com/repos/wavesbig/fund-farm/releases';

    setLoading(true);
    try {
      const data = await withRetry(
        async () => {
          const res = await fetch(releasesApiUrl, {
            headers: {
              Accept: 'application/vnd.github+json'
            }
          });
          if (!res.ok) {
            throw new Error(`GitHub API HTTP ${res.status}`);
          }
          return res.json();
        },
        1,
        400
      );

      if (isArray(data) && data.length > 0) {
        const merged = mergeReleases(data);
        setReleases(merged);
        if (showToast) {
          toast.success('已同步最新版本记录');
        }
      } else {
        if (showToast) {
          toast.info('已是最新更新日志');
        }
      }
    } catch {
      // 降级使用内置日志，若用户手动刷新则提示当前为内置最新数据
      if (showToast) {
        toast.info('已加载本地完整更新日志');
      }
    } finally {
      setLoading(false);
    }
  };

  // 弹窗打开时尝试后台静默预检更新（不打扰用户）
  useEffect(() => {
    if (open) {
      handleFetchRemoteReleases(false);
    }
  }, [open]);

  const toggleExpand = (tagName: string) => {
    setExpandedReleases((prev) => ({
      ...prev,
      [tagName]: !prev[tagName]
    }));
  };

  // 过滤后的版本列表
  const filteredReleases = useMemo(() => {
    const cleanQuery = searchQuery.trim().toLowerCase();

    return releases
      .map((rel) => {
        const versionMatch = rel.tagName.toLowerCase().includes(cleanQuery);

        const matchingItems = rel.items.filter((item) => {
          // 类别过滤
          if (selectedCategory !== 'all') {
            if (selectedCategory === 'other') {
              if (['feat', 'fix', 'style', 'perf', 'refactor'].includes(item.type)) {
                return false;
              }
            } else if (item.type !== selectedCategory) {
              return false;
            }
          }

          // 关键词过滤
          if (!cleanQuery) return true;
          if (versionMatch) return true;

          const matchDesc = item.description.toLowerCase().includes(cleanQuery);
          const matchScope = item.scope ? item.scope.toLowerCase().includes(cleanQuery) : false;
          const matchRaw = item.raw.toLowerCase().includes(cleanQuery);

          return matchDesc || matchScope || matchRaw;
        });

        return {
          ...rel,
          filteredItems: matchingItems
        };
      })
      .filter((rel) => rel.filteredItems.length > 0);
  }, [releases, searchQuery, selectedCategory]);

  const totalMatchingChanges = useMemo(() => {
    return filteredReleases.reduce((sum, r) => sum + r.filteredItems.length, 0);
  }, [filteredReleases]);

  // 内容区域
  const content = (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* 搜索与分类筛选控制栏 */}
      <div className="px-4 sm:px-6 py-3 border-b border-border bg-card/60 backdrop-blur-xs flex flex-col gap-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索更新记录（如 AI、截图识别、表格、SQLite...）"
              className="pl-9 pr-8 h-9 text-[16PX] md:text-xs rounded-lg bg-background/80 border-border focus-visible:ring-primary/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                title="清空搜索"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleFetchRemoteReleases(true)}
            disabled={loading}
            className="h-9 px-3 gap-1.5 text-xs rounded-lg border-border hover:border-primary/40 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            title="刷新/检查远端更新"
          >
            <RefreshCw className={loading ? 'size-3.5 animate-spin text-primary' : 'size-3.5'} />
            <span className="hidden sm:inline">{loading ? '正在同步' : '检查更新'}</span>
          </Button>
        </div>

        {/* 类别筛选 Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 -mx-1 px-1">
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedCategory(tab.key)}
                className={`h-7 px-2.5 text-xs rounded-full font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}

          {(searchQuery || selectedCategory !== 'all') && (
            <span className="ml-auto text-[11px] text-muted-foreground whitespace-nowrap pl-2">
              匹配 {filteredReleases.length} 个版本 · {totalMatchingChanges} 项变更
            </span>
          )}
        </div>
      </div>

      {/* 滚动列表 */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 scrollbar-y-styled">
        {filteredReleases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-12 rounded-2xl bg-muted/50 border border-border flex items-center justify-center text-muted-foreground mb-3">
              <SearchX className="size-6" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">未找到匹配的更新日志</p>
            <p className="text-xs text-muted-foreground max-w-xs mb-4">
              尝试更换关键词或清除筛选分类以查看全部历史版本
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-xs rounded-lg"
            >
              清空搜索与筛选
            </Button>
          </div>
        ) : (
          <div className="relative pl-4 sm:pl-6 space-y-6 before:absolute before:left-[11px] sm:before:left-[19px] before:top-3 before:bottom-3 before:w-0.5 before:bg-border/80">
            {filteredReleases.map((release, relIdx) => {
              const isCurrent = release.tagName === CURRENT_APP_VERSION;
              const isLatest = relIdx === 0 && !searchQuery && selectedCategory === 'all';
              const isExpanded =
                !!expandedReleases[release.tagName] || !isEmpty(searchQuery) || selectedCategory !== 'all';
              const items = release.filteredItems;
              const displayLimit = 6;
              const hasOverflow = items.length > displayLimit && !isExpanded;
              const visibleItems = hasOverflow ? items.slice(0, displayLimit) : items;

              return (
                <div key={release.id} className="relative group">
                  {/* 时间轴节点标记 */}
                  <div
                    className={`absolute -left-[21px] sm:-left-[27px] top-3.5 size-4 rounded-full border-2 transition-transform ${
                      isCurrent
                        ? 'bg-primary border-primary ring-4 ring-primary/20 scale-110 shadow-xs'
                        : isLatest
                          ? 'bg-emerald-500 border-emerald-500 ring-3 ring-emerald-500/20'
                          : 'bg-card border-muted-foreground/40 group-hover:border-primary group-hover:scale-105'
                    }`}
                  />

                  {/* 单版本卡片 */}
                  <div
                    className={`rounded-xl border transition-all ${
                      isCurrent
                        ? 'border-primary/40 bg-card/90 shadow-md ring-1 ring-primary/20'
                        : 'border-border/80 bg-card/50 hover:bg-card/80 hover:border-border'
                    } overflow-hidden`}
                  >
                    {/* 卡片头部 */}
                    <div className="px-4 py-3 border-b border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-mono font-bold text-sm sm:text-base text-foreground tracking-tight flex items-center gap-1.5">
                          <Tag className="size-3.5 text-primary" />
                          <HighlightText text={release.tagName} query={searchQuery} />
                        </span>

                        {isCurrent && (
                          <Badge
                            variant="default"
                            className="h-5 px-2 text-[10px] rounded-full gap-1 font-medium bg-primary text-primary-foreground"
                          >
                            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            当前运行版本
                          </Badge>
                        )}

                        {isLatest && !isCurrent && (
                          <Badge
                            variant="secondary"
                            className="h-5 px-2 text-[10px] rounded-full font-medium border border-border"
                          >
                            最新发布
                          </Badge>
                        )}

                        <span className="text-xs text-muted-foreground flex items-center gap-1 tabular-nums">
                          <Calendar className="size-3" />
                          {release.publishedAt}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground tabular-nums bg-muted/60 px-2 py-0.5 rounded-md">
                          {items.length} 项变更
                        </span>

                        {release.htmlUrl && (
                          <a
                            href={release.htmlUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="在 GitHub 查看此 Release"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* 变更项目列表 */}
                    <div className="p-3 sm:p-4 space-y-2.5">
                      {visibleItems.map((item: ChangeItem) => {
                        const typeCfg = CHANGE_TYPE_CONFIG[item.type] || CHANGE_TYPE_CONFIG.other;
                        return (
                          <div
                            key={item.id}
                            className="flex items-start gap-2.5 text-xs leading-relaxed text-foreground group/item"
                          >
                            <div className="shrink-0 flex items-center gap-1 mt-0.5">
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${typeCfg.bgClass} ${typeCfg.textClass} ${typeCfg.borderClass}`}
                              >
                                {typeCfg.label}
                              </span>
                              {item.scope && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
                                  {item.scope}
                                </span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0 text-muted-foreground group-hover/item:text-foreground transition-colors break-words">
                              <HighlightText text={item.description} query={searchQuery} />
                            </div>
                          </div>
                        );
                      })}

                      {/* 展开/折叠长列表按钮 */}
                      {items.length > displayLimit && !searchQuery && selectedCategory === 'all' && (
                        <div className="pt-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(release.tagName)}
                            className="h-7 px-2.5 text-[11px] text-primary hover:text-primary hover:bg-primary/10 gap-1 rounded-md cursor-pointer"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="size-3" />
                                <span>收起多余项</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="size-3" />
                                <span>展开其余 {items.length - displayLimit} 项变更…</span>
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 底部固定状态栏 */}
      <div className="px-4 sm:px-6 py-3 border-t border-border bg-card/95 backdrop-blur-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
          <span>基于 AGPL-3.0 协议完全开源</span>
          <span className="hidden sm:inline">·</span>
          <a
            href={GITHUB_ISSUES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 transition-all duration-150 ease-out active:scale-95 cursor-pointer"
          >
            <span>问题反馈与建议</span>
            <ExternalLink className="size-3" />
          </a>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={GITHUB_RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-lg border border-border bg-background hover:bg-accent text-foreground transition-colors"
          >
            <Github className="size-3.5" />
            <span className="hidden sm:inline">GitHub</span>
            <span>Releases</span>
            <ExternalLink className="size-3 text-muted-foreground" />
          </a>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 px-4 text-xs font-medium rounded-lg cursor-pointer shadow-xs"
          >
            关闭
          </Button>
        </div>
      </div>
    </div>
  );

  // 移动端使用 Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="glass h-[88vh] max-h-[92vh] flex flex-col p-0">
          <DrawerHeader className="shrink-0 flex flex-row items-center justify-between gap-2 space-y-0 px-4 pb-3 pt-3 text-left border-b border-border bg-card">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shrink-0">
                <Sparkles className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <DrawerTitle className="text-base font-semibold text-foreground">更新日志</DrawerTitle>
                  <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 font-mono">
                    {CURRENT_APP_VERSION}
                  </Badge>
                </div>
                <DrawerDescription className="text-xs text-muted-foreground truncate">
                  养基场版本迭代与演进历史
                </DrawerDescription>
              </div>
            </div>
            <DrawerClose className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <X className="size-4" />
            </DrawerClose>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  // PC 端使用 Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl sm:max-w-3xl h-[84vh] max-h-[720px] p-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl z-[99] flex flex-col text-left"
        showCloseButton={true}
        onPointerDownOutside={(e) => {
          if (Date.now() - mountTimeRef.current < 400) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (Date.now() - mountTimeRef.current < 400) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0 text-left bg-card">
          <div className="flex items-center justify-between gap-3 pr-8">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-xs">
                <Sparkles className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-semibold tracking-tight text-foreground">更新日志</DialogTitle>
                  <Badge
                    variant="outline"
                    className="text-xs h-5 px-2 font-mono border-primary/30 text-primary bg-primary/5"
                  >
                    当前 {CURRENT_APP_VERSION}
                  </Badge>
                  <Badge variant="secondary" className="text-xs h-5 px-2 font-mono text-muted-foreground">
                    累计 {releases.length} 个版本
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  查看养基场版本迭代历史、新特性发布与缺陷修复记录
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {content}
      </DialogContent>
    </Dialog>
  );
}
