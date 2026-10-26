import * as React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { buttonVariants, type ButtonProps } from '@/components/ui/button';

export interface PaginationProps extends React.ComponentPropsWithoutRef<'nav'> {}

function Pagination({ className, ...props }: PaginationProps) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: React.ComponentPropsWithoutRef<'ul'>) {
  return <ul data-slot="pagination-content" className={cn('flex flex-row items-center gap-1', className)} {...props} />;
}

function PaginationItem({ ...props }: React.ComponentPropsWithoutRef<'li'>) {
  return <li data-slot="pagination-item" {...props} />;
}

export interface PaginationLinkProps extends React.ComponentPropsWithoutRef<'a'> {
  isActive?: boolean;
  size?: ButtonProps['size'];
}

function PaginationLink({ className, isActive, size = 'icon', ...props }: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({ variant: 'ghost', size }),
        'cursor-pointer rounded-full border border-transparent transition-all duration-300',
        isActive
          ? 'bg-primary/15 text-primary font-medium hover:bg-primary/25 hover:text-primary'
          : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
        className
      )}
      {...props}
    />
  );
}

function PaginationPrevious({ className, ...props }: React.ComponentPropsWithoutRef<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn('gap-1 px-3 sm:pl-3', className)}
      {...props}
    >
      <ChevronLeftIcon className="size-4" />
      <span className="hidden sm:block">上一页</span>
    </PaginationLink>
  );
}

function PaginationNext({ className, ...props }: React.ComponentPropsWithoutRef<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn('gap-1 px-3 sm:pr-3', className)}
      {...props}
    >
      <span className="hidden sm:block">下一页</span>
      <ChevronRightIcon className="size-4" />
    </PaginationLink>
  );
}

function PaginationEllipsis({ className, ...props }: React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn('flex size-9 items-center justify-center text-muted-foreground', className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis
};
