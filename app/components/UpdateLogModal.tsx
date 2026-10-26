'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { X, Loader2, GitCommit } from 'lucide-react';
import dayjs from 'dayjs';
import { useIsMobile } from '@/app/hooks/useIsMobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
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

export default function UpdateLogModal({ open, onOpenChange }: UpdateLogModalProps) {
  const isMobile = useIsMobile();
  const [releases, setReleases] = useState<ReleaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const fetchReleases = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await withRetry(
            async () => {
              const res = await fetch('https://api.github.com/repos/hzm0321/real-time-fund/releases');
              if (!res.ok) throw new Error('Failed to fetch releases');
              return res.json();
            },
            2,
            500
          );
          setReleases(data || []);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchReleases();
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
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="shrink-0 px-6 pt-5 pb-3 border-b border-[var(--border)]">
          <DialogTitle className="text-base font-semibold text-foreground">更新日志</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
