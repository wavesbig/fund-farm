'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { X, Loader2, GitCommit } from 'lucide-react';
import dayjs from 'dayjs';
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
import { withRetry } from '@/app/lib/asyncHelper';

export interface UpdateLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ReleaseItem {
  id: number;
  name?: string;
  tag_name?: string;
  published_at?: string;
  body?: string;
}

const DEFAULT_RELEASES: ReleaseItem[] = [
  {
    id: 1,
    tag_name: 'v2.4.1',
    name: 'v2.4.1 实时持久化与 TypeScript 全面重构',
    published_at: '2026-10-28T00:00:00Z',
    body: '• 全面迁移至 TypeScript，提升整体健壮性与类型安全性\n• 深度集成 Node 22 原生 SQLite (WAL模式)，实现 100ms 实时秒级落盘与离线防丢\n• 优化多端交互体验，重构内置帮助指南与数据管理能力'
  },
  {
    id: 2,
    tag_name: 'v2.4.0',
    name: 'v2.4.0 架构升级与本地存储优化',
    published_at: '2026-09-15T00:00:00Z',
    body: '• 重构底层持久化机制，增强并发与页面意外关闭时的数据一致性\n• 玻璃拟态设计与明暗主题自适应优化\n• 提升基金估值计算性能与重仓股盘中分时追踪精度'
  }
];

export default function UpdateLogModal({ open, onOpenChange }: UpdateLogModalProps) {
  const isMobile = useIsMobile();
  const [releases, setReleases] = useState<ReleaseItem[]>(DEFAULT_RELEASES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const releasesApiUrl = process.env.NEXT_PUBLIC_GITHUB_RELEASES_URL;
    if (open && releasesApiUrl) {
      const fetchReleases = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await withRetry(
            async () => {
              const res = await fetch(releasesApiUrl);
              if (!res.ok) throw new Error('Failed to fetch releases');
              return res.json();
            },
            2,
            500
          );
          setReleases(data && data.length > 0 ? data : DEFAULT_RELEASES);
        } catch {
          // 降级使用内置日志
          setReleases(DEFAULT_RELEASES);
        } finally {
          setLoading(false);
        }
      };
      fetchReleases();
    } else if (open) {
      setReleases(DEFAULT_RELEASES);
      setLoading(false);
    }
  }, [open]);

  const content = (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-y-styled">
      {loading ? (
        <div className="flex justify-center items-center py-12 text-primary">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-[var(--danger)] text-sm">加载失败: {error}</div>
      ) : releases.length === 0 ? (
        <div className="text-center py-8 text-[var(--muted)] text-sm">暂无更新日志</div>
      ) : (
        <div className="space-y-6">
          {releases.map((release) => (
            <div key={release.id} className="relative pl-6 border-l-2 border-[var(--border)]">
              <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5 ring-4 ring-background" />
              <div className="mb-2 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <GitCommit className="w-3.5 h-3.5 text-primary" />
                  <span>{release.name || release.tag_name}</span>
                </h3>
                <span className="text-xs text-[var(--muted)] tabular-nums">
                  {dayjs(release.published_at).format('YYYY-MM-DD')}
                </span>
              </div>
              <div
                className="text-xs leading-relaxed text-[var(--muted)] whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: release.body?.replace(/\\n/g, '<br />') || '' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const mountTimeRef = React.useRef(0);
  React.useEffect(() => {
    if (open) {
      mountTimeRef.current = Date.now();
    }
  }, [open]);

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="glass h-[85vh] max-h-[90vh]">
          <DrawerHeader className="shrink-0 flex flex-row items-center justify-between gap-2 space-y-0 px-4 pb-3 pt-3 text-left border-b border-[var(--border)]">
            <DrawerTitle className="text-base font-semibold text-foreground">更新日志</DrawerTitle>
            <DrawerClose className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </DrawerClose>
          </DrawerHeader>
          <DrawerDescription className="sr-only">更新日志列表</DrawerDescription>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden z-[99]"
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
        <DialogHeader className="shrink-0 px-6 pt-5 pb-3 border-b border-[var(--border)]">
          <DialogTitle className="text-base font-semibold text-foreground">更新日志</DialogTitle>
          <DialogDescription className="sr-only">更新日志记录</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
