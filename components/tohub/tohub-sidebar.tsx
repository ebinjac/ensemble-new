// app/(tools)/tools/teams/[teamId]/tohub/components/TurnoverSidebar.tsx
'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/(auth)/providers/AuthProvider';
import { useRouter, useSearchParams, usePathname } from 'next/navigation'; // ✅ Add usePathname
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Users,
    Send,
    History,
    BarChart3,
    Settings,
    Building2,
    ArrowLeftRight,
    GitPullRequest,
    AlertTriangle,
    Bug,
    Link,
    Mail,
    Info
} from 'lucide-react';
import { fetchEntryCounts } from '@/app/actions/tohub/tohub';

interface TurnoverSidebarProps {
    teamId: string;
    applications: Array<{
        id: string;
        applicationName: string;
        tla: string;
        status: string;
    }>;
    currentAppId?: string;
}

export function TurnoverSidebar({
    teamId,
    applications,
    currentAppId
}: TurnoverSidebarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname(); // ✅ Use usePathname hook instead
    const { teams, getTeamRole } = useAuth();
    const [entryCounts, setEntryCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);

    const currentTeam = teams.find(team => team.id === teamId);
    const userRole = getTeamRole(teamId);
    const currentApp = applications.find(app => app.id === currentAppId);

    // ✅ Fixed: Get current page from pathname correctly
    const getCurrentPage = () => {
        const basePath = `/tools/teams/${teamId}/tohub`;
        
        // If pathname is exactly the basePath, we're on the main page
        if (pathname === basePath) {
            return '';
        }
        
        // If pathname starts with basePath, extract the page
        if (pathname.startsWith(basePath + '/')) {
            const page = pathname.replace(basePath + '/', '');
            return page.split('/')[0]; // Get first segment after tohub
        }
        
        return '';
    };

    const currentPage = getCurrentPage();

    // Load entry counts when app changes
    useEffect(() => {
        const loadCounts = async () => {
            if (!currentAppId) return;
            
            setLoading(true);
            try {
                const counts = await fetchEntryCounts(teamId, currentAppId);
                setEntryCounts(counts);
            } catch (error) {
                console.error('Failed to load entry counts:', error);
            } finally {
                setLoading(false);
            }
        };

        loadCounts();
    }, [teamId, currentAppId]);

    // Main navigation items
    const mainNavItems = [
        {
            id: 'pass-the-baton',
            page: '', // ✅ This represents the main page
            label: 'Pass the Baton',
            icon: Users,
            description: 'Main turnover dashboard',
            count: Object.values(entryCounts).reduce((sum, count) => sum + count, 0),
        },
        {
            id: 'dispatch-turnover',
            page: 'dispatch',
            label: 'Dispatch Turnover',
            icon: Send,
            description: 'Send turnover to next shift',
            count: 0,
        },
        {
            id: 'transition-history',
            page: 'history',
            label: 'Transition History',
            icon: History,
            description: 'View past turnovers',
            count: 0,
        },
        {
            id: 'turnover-metrics',
            page: 'metrics',
            label: 'Turnover Metrics',
            icon: BarChart3,
            description: 'Analytics and insights',
            count: 0,
        },
        {
            id: 'settings',
            page: 'settings',
            label: 'Settings',
            icon: Settings,
            description: 'Configure preferences',
            count: 0,
        },
    ];

    // Quick section access (only shown on main page)
    const sectionItems = [
        {
            id: 'handover',
            label: 'Handover',
            icon: ArrowLeftRight,
            count: entryCounts.handover || 0,
        },
        {
            id: 'rfc',
            label: 'RFCs',
            icon: GitPullRequest,
            count: entryCounts.rfc || 0,
        },
        {
            id: 'incidents',
            label: 'Incidents',
            icon: Bug,
            count: entryCounts.inc || 0,
        },
        {
            id: 'alerts',
            label: 'Alerts',
            icon: AlertTriangle,
            count: entryCounts.alerts || 0,
        },
        {
            id: 'mim',
            label: 'MIM',
            icon: Link,
            count: entryCounts.mim || 0,
        },
        {
            id: 'communications',
            label: 'Email/Slack',
            icon: Mail,
            count: entryCounts.email_slack || 0,
        },
        {
            id: 'fyi',
            label: 'FYI',
            icon: Info,
            count: entryCounts.fyi || 0,
        },
    ];

    const handleNavigation = (page: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (currentAppId) {
            params.set('app', currentAppId);
        }
        
        const basePath = `/tools/teams/${teamId}/tohub`;
        const targetPath = page ? `${basePath}/${page}` : basePath;
        const fullPath = params.toString() ? `${targetPath}?${params.toString()}` : targetPath;
        
        router.push(fullPath);
    };

    const handleAppSwitch = (applicationId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('app', applicationId);
        
        const basePath = `/tools/teams/${teamId}/tohub`;
        const currentPagePath = currentPage && currentPage !== '' ? `/${currentPage}` : '';
        const fullPath = `${basePath}${currentPagePath}?${params.toString()}`;
        
        router.push(fullPath);
    };

    const handleSectionClick = (sectionId: string) => {
        // Navigate to main page with section hash
        const params = new URLSearchParams(searchParams.toString());
        if (currentAppId) {
            params.set('app', currentAppId);
        }
        params.set('section', sectionId);
        
        const fullPath = `/tools/teams/${teamId}/tohub?${params.toString()}`;
        router.push(fullPath);
    };

    // ✅ Add debug logging (remove after testing)
    useEffect(() => {
        console.log('Current pathname:', pathname);
        console.log('Current page:', currentPage);
        console.log('Team ID:', teamId);
    }, [pathname, currentPage, teamId]);

    return (
        <div className="w-64 border-r bg-muted/20 p-4">
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

                {/* Main Navigation */}
                <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        Turnover Hub
                    </h3>
                    <div className="space-y-1">
                        {mainNavItems.map((item) => {
                            const Icon = item.icon;
                            // ✅ Fixed: Proper active state comparison
                            const isActive = currentPage === item.page;

                            return (
                                <Button
                                    key={item.id}
                                    variant={isActive ? 'secondary' : 'ghost'}
                                    className={`w-full justify-start ${
                                        isActive ? 'bg-secondary text-secondary-foreground' : ''
                                    }`} // ✅ Add explicit active styling
                                    onClick={() => handleNavigation(item.page)}
                                    title={item.description}
                                >
                                    <Icon className={`h-4 w-4 mr-3 ${
                                        item.id === 'pass-the-baton' ? 'text-primary' :
                                        item.id === 'dispatch-turnover' ? 'text-green-600' :
                                        item.id === 'transition-history' ? 'text-blue-600' :
                                        item.id === 'turnover-metrics' ? 'text-purple-600' :
                                        'text-muted-foreground'
                                    }`} />
                                    <span className="flex-1 text-left">{item.label}</span>
                                </Button>
                            );
                        })}
                    </div>
                </div>

                {/* Quick Section Access (only on main page) */}
                {/* {currentPage === '' && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                Quick Access
                            </h3>
                            <div className="space-y-1">
                                {sectionItems.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <Button
                                            key={item.id}
                                            variant="ghost"
                                            className="w-full justify-start text-sm"
                                            onClick={() => handleSectionClick(item.id)}
                                        >
                                            <Icon className="h-4 w-4 mr-3" />
                                            <span className="flex-1 text-left">{item.label}</span>
                                            {item.count > 0 && (
                                                <Badge 
                                                    variant={item.id === 'alerts' || item.id === 'incidents' ? 'destructive' : 'secondary'} 
                                                    className="ml-auto text-xs"
                                                >
                                                    {item.count}
                                                </Badge>
                                            )}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )} */}

                {/* Applications */}
                {applications.length > 1 && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                Switch Application
                            </h3>
                            <ScrollArea className="h-64">
                                <div className="space-y-1">
                                    {applications
                                        .filter(app => app.status === 'active')
                                        .sort((a, b) => a.applicationName.localeCompare(b.applicationName))
                                        .map((app) => {
                                            const isActive = app.id === currentAppId;

                                            return (
                                                <Button
                                                    key={app.id}
                                                    variant={isActive ? 'secondary' : 'ghost'}
                                                    className="w-full justify-start text-left"
                                                    onClick={() => handleAppSwitch(app.id)}
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
                                                    {isActive && (
                                                        <Badge variant="default" className="ml-2 flex-shrink-0 text-xs">
                                                            Active
                                                        </Badge>
                                                    )}
                                                </Button>
                                            );
                                        })}
                                </div>
                            </ScrollArea>
                        </div>
                    </>
                )}

                {/* Status Indicator */}
                <Separator />
                <div className="px-2 py-2 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                            Session Status
                        </span>
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-700 font-medium">Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
