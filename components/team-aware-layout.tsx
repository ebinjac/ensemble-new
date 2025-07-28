// app/components/layout/TeamAwareLayout.tsx
'use client'

import { ReactNode } from 'react';
import { Link2, Settings, User, LogOut, Bell, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TeamSwitcher } from '@/components/team-switcher';

import { useAuth } from '@/app/(auth)/providers/AuthProvider';
import EnsembleLogo from './home/logo';
import { ThemeToggle } from './ui/theme-toggle';
import Link from 'next/link';

interface TeamAwareLayoutProps {
    children: ReactNode;
    currentTeamId: string;
    teamName: string;
    userRole: 'admin' | 'user';
    toolName?: string;
    toolIcon?: ReactNode;
}

export function TeamAwareLayout({
    children,
    currentTeamId,
    teamName,
    userRole,
    toolName = "Link Manager",
    toolIcon = <Link2 className="h-5 w-5" />
}: TeamAwareLayoutProps) {
    const { user, logout } = useAuth();

    const handleSignOut = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Fixed Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="mx-auto flex h-20 items-center justify-between px-4">

                    {/* Left Side - Logo and Tool */}
                    <div className="flex items-center space-x-3">
                        {/* Ensemble Logo */}
                        <div className="flex items-center space-x-2">
                            <Link href='/'>
                                <EnsembleLogo className="h-8 w-8" />
                            </Link>

                            <span className="hidden font-bold sm:inline-block text-foreground/50 ml-4">
                                /
                            </span>
                        </div>

                        {/* Separator */}
                        <div className="hidden sm:block">
                            <Separator orientation="vertical" className="h-6" />
                        </div>

                        {/* Tool Name with Icon */}
                        <div className="flex items-center space-x-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary">
                                {toolIcon}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-foreground">
                                    {toolName}
                                </span>
                                <span className="text-xs text-muted-foreground hidden sm:block">
                                    {teamName}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Actions */}
                    <div className="flex items-center space-x-2">

                        {/* Notifications */}
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                            <Bell className="h-4 w-4" />
                            <span className="sr-only">Notifications</span>
                        </Button>

                        {/* Help */}
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                            <HelpCircle className="h-4 w-4" />
                            <span className="sr-only">Help</span>
                        </Button>

                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* User Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user?.image} alt={user?.name || user?.email} />
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {user?.name || 'User'}
                                        </p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user?.email}
                                        </p>
                                        <div className="flex items-center space-x-1 pt-1">
                                            <Badge variant={userRole === 'admin' ? 'default' : 'secondary'} className="text-xs">
                                                {userRole}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">•</span>
                                            <span className="text-xs text-muted-foreground truncate max-w-24">
                                                {teamName}
                                            </span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="cursor-pointer text-destructive focus:text-destructive"
                                    onClick={handleSignOut}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Sign out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Team Switcher */}
                        <div className="hidden sm:block">
                            <Separator orientation="vertical" className="h-6" />
                        </div>
                        <TeamSwitcher currentTeamId={currentTeamId} className="w-[200px] sm:w-[280px]" />
                    </div>
                </div>
            </header>

            {/* Main Content with proper spacing for fixed header */}
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
