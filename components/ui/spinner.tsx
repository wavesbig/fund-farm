import * as React from 'react';
import { Loader2Icon, type LucideProps } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface SpinnerProps extends LucideProps {}

function Spinner({ className, ...props }: SpinnerProps) {
  return <Loader2Icon role="status" aria-label="Loading" className={cn('size-4 animate-spin', className)} {...props} />;
}

export { Spinner };
