// app/components/link-manager/ApplicationSidebar.tsx (Updated)
'use client'

import { useAuth } from '@/app/(auth)/providers/AuthProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    List,
    Hash,
    Pin,
    BarChart3,
    Building2,
    Shield
} from 'lucide-react';

interface ApplicationSidebarProps {
    applications: Array<{
        id: string;
        applicationName: string;
        tla: string;
        status: string;
    }>;
    activeTab: string;
    onTabChange: (tab: string) => void;
    linkCounts: Record<string, number>;
    currentTeamId: string; // ✅ Use team ID to get team info from auth
}

export function ApplicationSidebar({
    applications,
    activeTab,
    onTabChange,
    linkCounts,
    currentTeamId
}: ApplicationSidebarProps) {
    // ✅ Get team data from existing auth context
    const { teams, getTeamRole } = useAuth();

    const currentTeam = teams.find(team => team.id === currentTeamId);
    const userRole = getTeamRole(currentTeamId);

    const sidebarItems = [
        {
            id: 'all',
            label: 'All Links',
            icon: List,
            count: linkCounts.all || 0,
        },
        {
            id: 'pinned',
            label: 'Pinned',
            icon: Pin,
            count: linkCounts.pinned || 0,
        },
        {
            id: 'common',
            label: 'Common Links',
            icon: Hash,
            count: linkCounts.common || 0,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Team Context */}
            <div className="space-y-2">
                <div className="pl-6 space-y-1">
                    <p className="text-sm font-medium truncate">{currentTeam?.name || 'Unknown Team'}</p>
                    <div className="flex items-center space-x-2">
                        <Badge variant={userRole === 'admin' ? 'default' : 'secondary'} className="text-xs">
                            {userRole || 'user'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                            {applications.length} app{applications.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Quick Filters */}
            <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Quick Filters
                </h3>
                <div className="space-y-1">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <Button
                                key={item.id}
                                variant={isActive ? 'secondary' : 'ghost'}
                                className="w-full justify-start"
                                onClick={() => onTabChange(item.id)}
                            >
                                <Icon className="h-4 w-4 mr-3" />
                                <span className="flex-1 text-left">{item.label}</span>
                                {item.count > 0 && (
                                    <Badge variant="secondary" className="ml-auto">
                                        {item.count}
                                    </Badge>
                                )}
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* Applications */}
            <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Applications
                </h3>
                <ScrollArea className="h-96">
                    <div className="space-y-1">
                        {applications
                            .filter(app => app.status === 'active')
                            .sort((a, b) => a.applicationName.localeCompare(b.applicationName))
                            .map((app) => {
                                const isActive = activeTab === `app-${app.id}`;
                                const count = linkCounts[app.id] || 0;

                                return (
                                    <Button
                                        key={app.id}
                                        variant={isActive ? 'secondary' : 'ghost'}
                                        className="w-full justify-start text-left"
                                        onClick={() => onTabChange(`app-${app.id}`)}
                                    >
                                        <Building2 className="h-4 w-4 mr-3 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">
                                                {app.tla}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {app.applicationName}
                                            </div>
                                        </div>
                                        {count > 0 && (
                                            <Badge variant="secondary" className="ml-2 flex-shrink-0">
                                                {count}
                                            </Badge>
                                        )}
                                    </Button>
                                );
                            })}
                    </div>
                </ScrollArea>
            </div>



            <Separator />
            <div>
                <Button
                    variant={activeTab === 'analytics' ? 'secondary' : 'outline'} // ✅ Highlight when active
                    className="w-full justify-start"
                    onClick={() => onTabChange('analytics')}
                >
                    <BarChart3 className="h-4 w-4 mr-3" />
                    View Analytics
                </Button>
            </div>


        </div>
    );
}
