'use client';

import { useRouter, useParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import {
    Sidebar,
    SidebarItem,
    SidebarHeader,
    SidebarFooter,
    SidebarGroup
} from '@/components/ui/sidebar-new';
import {
    Home,
    Mail,
    BarChart3,
    Settings,
    HelpCircle,
    PlusCircle,
    Upload,
    Download,
    BookOpen
} from 'lucide-react';
import { TeamSwitcher } from './team-switcher';

export function AppSidebar() {
    const router = useRouter();
    const { teamId } = useParams();
    const pathname = usePathname();

    // Fixed: Each item now has a unique identifier and proper routing
    const navItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: Home,
            href: `/tools/teams/${teamId}/bluemailer`,
            exact: true // For exact path matching
        },
        {
            id: 'templates',
            label: 'Templates',
            icon: Mail,
            href: `/tools/teams/${teamId}/bluemailer/templates` // Different path
        },
        {
            id: 'library',
            label: 'Library',
            icon: BookOpen,
            href: `/tools/teams/${teamId}/bluemailer/library`
        },
        {
            id: 'emails',
            label: 'Emails',
            icon: Mail,
            href: `/tools/teams/${teamId}/bluemailer/emails`
        },
        {
            id: 'analytics',
            label: 'Analytics',
            icon: BarChart3,
            href: `/tools/teams/${teamId}/bluemailer/analytics`
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: Settings,
            href: `/tools/teams/${teamId}/bluemailer/settings`
        },
        {
            id: 'help',
            label: 'Help',
            icon: HelpCircle,
            href: `/tools/teams/${teamId}/bluemailer/help`
        },
    ];

    // Improved active route detection
    const isActiveRoute = (href: string, exact: boolean = false) => {
        if (!pathname) return false;

        if (exact) {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    return (
        <Sidebar className="h-screen fixed w-64 border-r">
            <SidebarHeader>
                <div className="px-4 py-6">
                    <TeamSwitcher />
                </div>
            </SidebarHeader>

            <SidebarGroup>
                {navItems.map(item => (
                    <SidebarItem
                        key={item.id} // Using unique ID instead of href
                        icon={<item.icon size={18} />}
                        active={isActiveRoute(item.href, item.exact)}
                        onClick={() => router.push(item.href)}
                    >
                        {item.label}
                    </SidebarItem>
                ))}
            </SidebarGroup>

            <SidebarFooter>
                <SidebarItem
                    key="new-template" // Add explicit keys for footer items too
                    icon={<PlusCircle size={18} />}
                    onClick={() => router.push(`/tools/teams/${teamId}/bluemailer/new`)}
                >
                    New Template
                </SidebarItem>
                <SidebarItem
                    key="import"
                    icon={<Upload size={18} />}
                    onClick={() => {/* import logic */ }}
                >
                    Import
                </SidebarItem>
                <SidebarItem
                    key="export"
                    icon={<Download size={18} />}
                    onClick={() => {/* export logic */ }}
                >
                    Export
                </SidebarItem>
            </SidebarFooter>
        </Sidebar>
    );
}
