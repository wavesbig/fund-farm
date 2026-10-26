import * as React from 'react';

import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return <div data-slot="skeleton" className={cn('skeleton-glass rounded-md', className)} {...props} />;
}

export { Skeleton };
