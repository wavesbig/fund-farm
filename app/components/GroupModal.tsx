'use client';

import * as React from 'react';
import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';

const MAX_GROUP_NAME_LENGTH = 8;
const truncateGroupName = (value: string) => [...(value || '')].slice(0, MAX_GROUP_NAME_LENGTH).join('');

export interface GroupModalProps {
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export default function GroupModal({ onClose, onConfirm }: GroupModalProps) {
  const [name, setName] = useState('');
  const isComposingRef = useRef(false);

  const confirmName = () => {
    const nextName = truncateGroupName(name).trim();
    if (!nextName) return;
    onConfirm(nextName);
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose?.();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="glass card modal max-w-[340px] w-[90vw] z-[100] p-5"
        overlayClassName="modal-overlay"
      >
        <DialogTitle className="sr-only">新增分组</DialogTitle>

        <div className="flex items-center justify-between mb-4 font-semibold text-base text-foreground shrink-0">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            <span>新增分组</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="group-modal-name" className="text-xs text-muted-foreground block">
              分组名称（最多 {MAX_GROUP_NAME_LENGTH} 个字）
            </Label>
            <Input
              id="group-modal-name"
              className="h-9.5 text-sm bg-white/5 border-border"
              autoFocus
              placeholder="请输入分组名称..."
              value={name}
              onChange={(e) => {
                const v = e.target.value || '';
                setName(isComposingRef.current || (e.nativeEvent as any).isComposing ? v : truncateGroupName(v));
              }}
              onCompositionStart={() => {
                isComposingRef.current = true;
              }}
              onCompositionEnd={(e) => {
                isComposingRef.current = false;
                setName(truncateGroupName(e.currentTarget.value));
              }}
              onBlur={(e) => {
                if (!isComposingRef.current) setName(truncateGroupName(e.currentTarget.value));
              }}
              onKeyDown={(e) => {
                if ((e.nativeEvent as any).isComposing) return;
                if (e.key === 'Enter') confirmName();
              }}
            />
          </div>

          <div className="pt-3 mt-1 border-t border-border flex items-center justify-end gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              className="h-9 px-4 text-xs font-medium bg-muted/30 border-border hover:bg-muted/60 text-foreground cursor-pointer"
              onClick={onClose}
            >
              取消
            </Button>
            <Button
              type="button"
              className="h-9 px-4.5 text-xs font-medium bg-primary text-primary-foreground shadow-xs cursor-pointer disabled:opacity-40"
              onClick={confirmName}
              disabled={!name.trim()}
            >
              确定
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
