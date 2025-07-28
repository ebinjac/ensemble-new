'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Bell,
  Menu,
  Moon,
  Sun,
  User,
  Search as SearchIcon,
  ChevronRight,
  LogOut,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { ThemeToggle } from '../ui/theme-toggle';

interface HeaderProps {
  /** Optional: override the default title shown next to breadcrumbs */
  title?: string;
}

export function Header({ title = 'Bluemailer' }: HeaderProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { theme, setTheme } = useTheme();
  const [search, setSearch] = React.useState('');

  /* ------------------------------------------------------------
     Breadcrumbs from current pathname
  ------------------------------------------------------------ */
  const crumbs = React.useMemo(() => {
    const withoutQuery = pathname.split('?')[0];
    const parts = withoutQuery.split('/').filter(Boolean);

    /* Skip the first two static segments: "tools" and "teams"  */
    const slugParts = parts.slice(parts.indexOf('teams') + 2);

    const mapped = slugParts.map((p, i) => {
      const href = '/' + parts.slice(0, parts.indexOf('teams') + 2 + i + 1).join('/');
      const label = p.replace(/[-_]/g, ' ');
      return { label, href };
    });

    return mapped;
  }, [pathname]);

  /* ------------------------------------------------------------
     Handlers
  ------------------------------------------------------------ */
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    // Replace with your search route if needed
    router.push(`?q=${encodeURIComponent(search.trim())}`);
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 lg:px-6">
        {/* ─── Mobile menu trigger ─────────────────────────────── */}
        <Sheet>
          <SheetTrigger asChild className="mr-2 lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          {/* Put <AppSidebar /> in here if you want a slide-over menu on mobile */}
          <SheetContent side="left" className="p-0">
            {/* e.g. <AppSidebar mobile /> */}
          </SheetContent>
        </Sheet>

        {/* ─── Title / Breadcrumbs ─────────────────────────────── */}
        <div className="flex items-center space-x-2">
          <Link
            href="/"
            className="hidden font-semibold lg:inline-block hover:opacity-80 transition"
          >
            {title}
          </Link>
          {crumbs.length > 0 && (
            <>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <nav className="hidden text-sm font-medium lg:flex">
                {crumbs.map((c, i) => (
                  <React.Fragment key={c.href}>
                    <Link
                      href={c.href}
                      className={cn(
                        'capitalize transition-colors hover:text-foreground',
                        i === crumbs.length - 1 && 'text-foreground'
                      )}
                    >
                      {c.label}
                    </Link>
                    {i !== crumbs.length - 1 && (
                      <ChevronRight className="mx-1 h-4 w-4 text-muted-foreground" />
                    )}
                  </React.Fragment>
                ))}
              </nav>
            </>
          )}
        </div>

        {/* ─── Spacer ──────────────────────────────────────────── */}
        <div className="flex-1" />

        {/* ─── Search ─────────────────────────────────────────── */}
        <form onSubmit={onSubmit} className="relative mr-2 hidden md:block">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="pl-8 w-60 md:w-72"
          />
        </form>

        {/* ─── Theme toggle ───────────────────────────────────── */}
        <ThemeToggle />

        {/* ─── Notifications ──────────────────────────────────── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuItem disabled className="justify-center text-xs">
              No new notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ─── User menu ──────────────────────────────────────── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-1">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="font-semibold">My profile</DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => router.push('/settings')}
              className="flex items-center"
            >
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 flex items-center"
              onSelect={() => router.push('/logout')}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
