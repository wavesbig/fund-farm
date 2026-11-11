'use client';

import * as React from 'react';
import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldContent } from '@/components/ui/field';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        overlayClassName="modal-overlay z-[9999]"
        className={cn('!p-0 z-[10000] max-w-[280px] sm:max-w-[280px]')}
      >
        <div className="glass card modal !max-w-[280px] !w-full">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Plus className="w-5 h-5 shrink-0 text-[var(--foreground)]" aria-hidden />
              <DialogTitle asChild>
                <span className="text-base font-semibold text-[var(--foreground)]">新增分组</span>
              </DialogTitle>
            </div>
          </div>

          <Field className="mb-5">
            <FieldLabel htmlFor="group-modal-name" className="text-sm text-[var(--muted-foreground)] mb-2 block">
              分组名称（最多 {MAX_GROUP_NAME_LENGTH} 个字）
            </FieldLabel>
            <FieldContent>
              <Input
                id="group-modal-name"
                className="h-11 rounded-xl text-base"
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
            </FieldContent>
          </Field>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 h-11 rounded-xl cursor-pointer" onClick={onClose}>
              取消
            </Button>
            <Button className="flex-1 h-11 rounded-xl cursor-pointer" onClick={confirmName} disabled={!name.trim()}>
              确定
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
