import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-xl border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-[14px] [&>svg]:size-4 [&>svg]:text-current [&>svg~*]:pl-7 transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'text-foreground [&>svg]:text-primary glass',
        destructive: 'alert-variant-destructive',
        warning: 'alert-variant-warning',
        success: 'alert-variant-success',
        info: 'alert-variant-info'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

function Alert({ className, variant, ...props }: AlertProps) {
  return <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

export interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

function AlertTitle({ className, ...props }: AlertTitleProps) {
  return (
    <h5 data-slot="alert-title" className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props} />
  );
}

export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {}

function AlertDescription({ className, ...props }: AlertDescriptionProps) {
  return (
    <div
      data-slot="alert-description"
      className={cn('text-sm text-muted-foreground [&_p]:leading-relaxed', className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
