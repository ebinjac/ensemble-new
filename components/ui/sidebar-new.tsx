'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Sidebar({
  className,
  children,
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <aside
      className={cn(
        'relative flex h-full w-64 flex-col bg-muted/40',
        className
      )}
    >
      {children}
    </aside>
  );
}

/* ------- sub-sections to keep structure consistent ------- */
export function SidebarHeader({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('border-b px-4 py-3', className)}>{children}</div>
  );
}

export function SidebarGroup({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return <nav className={cn('flex-1 px-2 py-3 space-y-1', className)}>{children}</nav>;
}

export function SidebarFooter({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mt-auto border-t px-3 py-3 space-y-1', className)}>
      {children}
    </div>
  );
}

/* ─── Single clickable row ───────────────────────────────── */
interface SidebarItemProps extends React.HTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  active?: boolean;
}

export const SidebarItem = React.forwardRef<HTMLButtonElement, SidebarItemProps>(
  ({ className, icon, active, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        className
      )}
      {...props}
    >
      {icon && (
        <span className="mr-2 flex h-4 w-4 items-center justify-center">
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
    </button>
  )
);
SidebarItem.displayName = 'SidebarItem';
