'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { isFunction, isNumber } from 'lodash';

import { cn } from '@/lib/utils';

interface DrawerScrollLockContextValue {
  open: boolean;
  [key: string]: any;
}

const DrawerScrollLockContext = React.createContext<DrawerScrollLockContextValue | null>(null);

function useScrollLock(open?: boolean) {
  return React.useMemo(() => (open ? { open } : null), [open]);
}

let _cachedNormalViewportHeight: number | null = null;

function getViewportHeight(): number | null {
  if (typeof window === 'undefined') return null;
  const innerHeight = window.innerHeight;
  const visualHeight = window.visualViewport?.height;
  const current =
    Number.isFinite(visualHeight) && (visualHeight as number) > 0
      ? (visualHeight as number)
      : Number.isFinite(innerHeight) && innerHeight > 0
        ? innerHeight
        : null;
  if (current != null && (_cachedNormalViewportHeight == null || current > _cachedNormalViewportHeight)) {
    _cachedNormalViewportHeight = current;
  }
  return current;
}

function getReferenceHeight(): number | null {
  getViewportHeight();
  return _cachedNormalViewportHeight ?? getViewportHeight();
}

function parseVhToPx(vhStr: string | number): number | null {
  if (isNumber(vhStr)) return Number.isFinite(vhStr) && vhStr >= 0 ? vhStr : null;
  const match = String(vhStr).match(/^([\d.]+)\s*vh$/);
  if (!match) return null;
  const ratio = Number(match[1]);
  const viewportHeight = getReferenceHeight();
  if (!Number.isFinite(ratio) || viewportHeight == null) return null;
  return (viewportHeight * ratio) / 100;
}

function convertStyleVhToPx(style?: React.CSSProperties): React.CSSProperties | undefined {
  if (!style || typeof style !== 'object') return style;
  const result: any = { ...style };
  const vhProps = ['height', 'maxHeight', 'minHeight', 'top', 'bottom'];
  for (const prop of vhProps) {
    const val = result[prop];
    if (typeof val === 'string') {
      const px = parseVhToPx(val);
      if (px != null) result[prop] = `${px}px`;
    }
  }
  return result;
}

function extractClassNameVhOverrides(className?: string) {
  if (!className || typeof className !== 'string') return { cleanClassName: className, overrides: {} };
  const overrides: Record<string, string> = {};
  const propMap = { h: 'height', 'max-h': 'maxHeight', 'min-h': 'minHeight' };
  const cleanParts: string[] = [];
  for (const token of className.split(/\s+/)) {
    let matched = false;
    for (const [prefix, cssProp] of Object.entries(propMap)) {
      const re = new RegExp(`^(?:sm:|md:|lg:|xl:)?(?:data-\\[.*?\\]:)?${prefix}-\\[([\\d.]+)vh\\]$`);
      const m = token.match(re);
      if (m) {
        const px = parseVhToPx(`${m[1]}vh`);
        if (px != null) overrides[cssProp] = `${px}px`;
        matched = true;
        break;
      }
    }
    if (!matched) cleanParts.push(token);
  }
  return { cleanClassName: cleanParts.join(' '), overrides };
}

function safePreventDefault(e: any) {
  if (isFunction(e?.preventDefault) && e?.cancelable !== false) e.preventDefault();
}

function stopEvent(e: any) {
  safePreventDefault(e);
  if (isFunction(e?.stopPropagation)) e.stopPropagation();
}

function getEventClientY(e: any): number | null {
  const nativeEvent = e?.nativeEvent ?? e;
  const touches = e?.touches ?? nativeEvent?.touches ?? nativeEvent?.changedTouches;
  const clientY = e?.clientY ?? nativeEvent?.clientY ?? touches?.[0]?.clientY;
  return Number.isFinite(clientY) ? clientY : null;
}

export type DrawerProps = React.ComponentProps<typeof DrawerPrimitive.Root>;

function Drawer({ open, ...props }: DrawerProps) {
  const scrollLock = useScrollLock(open);
  const contextValue = React.useMemo(() => ({ ...scrollLock, open: !!open }), [scrollLock, open]);
  return (
    <DrawerScrollLockContext.Provider value={contextValue}>
      <DrawerPrimitive.Root modal={false} data-slot="drawer" open={open} {...(props as any)} />
    </DrawerScrollLockContext.Provider>
  );
}

export interface DrawerTriggerProps extends React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Trigger> {}

function DrawerTrigger({ ...props }: DrawerTriggerProps) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

export interface DrawerPortalProps extends React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Portal> {}

function DrawerPortal({ ...props }: DrawerPortalProps) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

export interface DrawerCloseProps extends React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Close> {}

function DrawerClose({ ...props }: DrawerCloseProps) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

export interface DrawerOverlayProps extends React.HTMLAttributes<HTMLDivElement> {}

function DrawerOverlay({ className, style, ...props }: DrawerOverlayProps) {
  const ctx = React.useContext(DrawerScrollLockContext);
  const { open = false, ...scrollLockProps } = ctx || {};

  const overlayRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = overlayRef.current;
    if (!el || !open) return;

    el.addEventListener('touchmove', stopEvent, { passive: false });
    el.addEventListener('wheel', stopEvent, { passive: false });

    return () => {
      el.removeEventListener('touchmove', stopEvent);
      el.removeEventListener('wheel', stopEvent);
    };
  }, [open]);

  return (
    <div
      ref={overlayRef}
      data-slot="drawer-overlay"
      data-state={open ? 'open' : 'closed'}
      role="button"
      tabIndex={-1}
      aria-label="关闭"
      className={cn(
        'fixed inset-0 z-50 cursor-default bg-[var(--drawer-overlay,rgba(0,0,0,0.45))] backdrop-blur-[6px]',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        className
      )}
      {...scrollLockProps}
      {...props}
      style={{ touchAction: 'none', ...style }}
    />
  );
}

export interface DrawerContentProps extends React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> {
  defaultHeight?: string | number;
  minHeight?: string | number;
  maxHeight?: string | number;
}

function DrawerContent({
  className,
  children,
  defaultHeight = '77vh',
  minHeight = '20vh',
  maxHeight = '90vh',
  style: styleProp,
  ...props
}: DrawerContentProps) {
  const classNameResult = React.useMemo(() => extractClassNameVhOverrides(className), [className]);
  const { cleanClassName, overrides: classNameVhOverrides } = classNameResult;
  const convertedStyleProp = React.useMemo(() => convertStyleVhToPx(styleProp), [styleProp]);
  const [heightPx, setHeightPx] = React.useState<number | null>(() =>
    typeof window !== 'undefined' ? parseVhToPx(defaultHeight) : null
  );
  const [isDragging, setIsDragging] = React.useState(false);
  const dragRef = React.useRef({ startY: 0, startHeight: 0 });

  const minPx = React.useMemo(() => parseVhToPx(minHeight), [minHeight]);
  const maxPx = React.useMemo(() => parseVhToPx(maxHeight), [maxHeight]);

  React.useEffect(() => {
    const px = parseVhToPx(defaultHeight);
    if (Number.isFinite(px)) setHeightPx(px);
  }, [defaultHeight]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const sync = () => {
      getViewportHeight();
      setHeightPx(() => {
        const fallback = parseVhToPx(defaultHeight);
        return Number.isFinite(fallback) ? fallback : null;
      });
    };
    window.addEventListener('resize', sync);
    return () => {
      window.removeEventListener('resize', sync);
    };
  }, [defaultHeight, minHeight, maxHeight]);

  const handlePointerDown = React.useCallback(
    (e: any) => {
      const startY = getEventClientY(e);
      if (!Number.isFinite(startY)) return;
      safePreventDefault(e);
      setIsDragging(true);
      const fallbackHeight = parseVhToPx(defaultHeight);
      dragRef.current = {
        startY: startY as number,
        startHeight: Number.isFinite(heightPx)
          ? (heightPx as number)
          : Number.isFinite(fallbackHeight)
            ? (fallbackHeight as number)
            : 0
      };
    },
    [heightPx, defaultHeight]
  );

  React.useEffect(() => {
    if (!isDragging) return;
    const move = (e: any) => {
      const clientY = getEventClientY(e);
      const { startY, startHeight } = dragRef.current;
      if (!Number.isFinite(clientY) || !Number.isFinite(startY) || !Number.isFinite(startHeight)) return;
      const delta = startY - (clientY as number);
      const lower = Number.isFinite(minPx) ? (minPx as number) : 0;
      const upper = Number.isFinite(maxPx) ? (maxPx as number) : Infinity;
      const next = Math.min(upper, Math.max(lower, startHeight + delta));
      if (Number.isFinite(next)) setHeightPx(next);
    };
    const up = () => setIsDragging(false);
    document.addEventListener('mousemove', move, { passive: true });
    document.addEventListener('mouseup', up);
    document.addEventListener('touchmove', move, { passive: true });
    document.addEventListener('touchend', up);
    document.addEventListener('touchcancel', up);
    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', up);
      document.removeEventListener('touchcancel', up);
    };
  }, [isDragging, minPx, maxPx]);

  const contentStyle = React.useMemo(() => {
    const base: any = {};
    if (Number.isFinite(heightPx)) base.height = `${heightPx}px`;
    if (Number.isFinite(maxPx)) base.maxHeight = `${maxPx}px`;
    Object.assign(base, classNameVhOverrides);
    if (convertedStyleProp) Object.assign(base, convertedStyleProp);
    return Object.keys(base).length > 0 ? base : undefined;
  }, [heightPx, maxPx, classNameVhOverrides, convertedStyleProp]);

  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        style={contentStyle}
        className={cn(
          'group/drawer-content fixed z-50 flex h-auto flex-col bg-[var(--card)] text-[var(--text)] border-[var(--border)] overscroll-contain',
          'data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-[var(--radius)] data-[vaul-drawer-direction=top]:border-b drawer-shadow-top',
          'data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[88vh] data-[vaul-drawer-direction=bottom]:rounded-t-[14px] data-[vaul-drawer-direction=bottom]:border-t drawer-shadow-bottom',
          'data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm',
          'data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm',
          'drawer-content-theme',
          cleanClassName
        )}
        {...props}
      >
        <div
          role="separator"
          aria-label="拖动调整高度"
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          className={cn(
            'mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full bg-[var(--muted)] cursor-n-resize touch-none select-none',
            'group-data-[vaul-drawer-direction=bottom]/drawer-content:block',
            'hover:bg-[var(--muted-foreground)/0.4] active:bg-[var(--muted-foreground)/0.6]'
          )}
        />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        'flex flex-col gap-0.5 p-4 border-b border-[var(--border)] group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-left',
        'drawer-header-theme',
        className
      )}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="drawer-footer" className={cn('mt-auto flex flex-col gap-2 p-4', className)} {...props} />;
}

function DrawerTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn('font-semibold text-[var(--text)]', className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn('text-sm text-[var(--muted)]', className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription
};
