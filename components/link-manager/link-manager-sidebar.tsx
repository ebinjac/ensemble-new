// app/components/link-manager/ApplicationSidebar.tsx
'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Link2, Pin, Users, Lock, Building2, BarChart3, 
  Archive, AlertCircle
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
  currentTeamId: string;
}

export function ApplicationSidebar({ 
  applications, 
  activeTab, 
  onTabChange, 
  linkCounts,
  currentTeamId 
}: ApplicationSidebarProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(section)) {
      newCollapsed.delete(section);
    } else {
      newCollapsed.add(section);
    }
    setCollapsedSections(newCollapsed);
  };

  // Updated quick filters with proper shadcn theming
  const quickFilters = [
    {
      id: 'all',
      label: 'All Links',
      icon: Link2,
      count: linkCounts.all || 0,
      description: 'All accessible links'
    },
    {
      id: 'pinned',
      label: 'Pinned',
      icon: Pin,
      count: linkCounts.pinned || 0,
      description: 'Your pinned links'
    },
    {
      id: 'private',
      label: 'Private Links',
      icon: Lock,
      count: linkCounts.private || 0,
      description: 'Links only you can see'
    },
    {
      id: 'team',
      label: 'Team Links', 
      icon: Users,
      count: linkCounts.team || 0,
      description: 'Public links shared with team'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      count: undefined,
      description: 'Link usage analytics'
    }
  ];

  const statusFilters = [
    {
      id: 'archived',
      label: 'Archived',
      icon: Archive,
      count: linkCounts.archived || 0,
      description: 'Archived links'
    },
    {
      id: 'broken',
      label: 'Broken',
      icon: AlertCircle,
      count: linkCounts.broken || 0,
      description: 'Links that need attention'
    }
  ];

  return (
    <div className="w-64 border-r border-border bg-background h-full flex flex-col">
      <div className="p-4">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2 text-foreground">
          <Building2 className="h-5 w-5 text-primary" />
          Link Manager
        </h2>

        {/* ✅ Updated Quick Filters Section with Shadcn Colors */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Quick Filters
            </h3>
          </div>
          
          <div className="space-y-1">
            {quickFilters.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeTab === filter.id;
              
              return (
                <Button
                  key={filter.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start h-9 transition-colors ${
                    isActive 
                      ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                  onClick={() => onTabChange(filter.id)}
                >
                  <Icon className={`h-4 w-4 mr-2 ${
                    filter.id === 'private' ? 'text-orange-500 dark:text-orange-400' : 
                    filter.id === 'team' ? 'text-green-500 dark:text-green-400' : 
                    filter.id === 'analytics' ? 'text-purple-500 dark:text-purple-400' :
                    isActive ? 'text-secondary-foreground' : 'text-muted-foreground'
                  }`} />
                  <span className="flex-1 text-left">{filter.label}</span>
                  {filter.count !== undefined && (
                    <Badge 
                      variant={isActive ? "default" : "secondary"} 
                      className={`h-5 px-2 text-xs ${
                        isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {filter.count}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        <Separator className="my-4" />

        {/* ✅ Updated Status Filters with Shadcn Colors */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Status
          </h3>
          
          <div className="space-y-1">
            {statusFilters.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeTab === filter.id;
              
              return (
                <Button
                  key={filter.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start h-9 transition-colors ${
                    isActive 
                      ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                  onClick={() => onTabChange(filter.id)}
                >
                  <Icon className={`h-4 w-4 mr-2 ${
                    filter.id === 'broken' ? 'text-destructive' : 
                    filter.id === 'archived' ? 'text-yellow-500 dark:text-yellow-400' :
                    isActive ? 'text-secondary-foreground' : 'text-muted-foreground'
                  }`} />
                  <span className="flex-1 text-left">{filter.label}</span>
                  <Badge 
                    variant={isActive ? "default" : "secondary"} 
                    className={`h-5 px-2 text-xs ${
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {filter.count}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </div>

        <Separator className="my-4" />

        {/* ✅ Updated Applications Section with Shadcn Colors */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Applications
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => toggleSection('applications')}
            >
              <span className="text-xs">
                {collapsedSections.has('applications') ? '+' : '−'}
              </span>
            </Button>
          </div>
          
          {!collapsedSections.has('applications') && (
            <ScrollArea className="h-64">
              <div className="space-y-1 pr-2">
                {applications
                  .filter(app => app.status === 'active')
                  .sort((a, b) => a.applicationName.localeCompare(b.applicationName))
                  .map((app) => {
                    const isActive = activeTab === `app-${app.id}`;
                    const count = linkCounts[`app-${app.id}`] || 0;
                    
                    return (
                      <Button
                        key={app.id}
                        variant={isActive ? "secondary" : "ghost"}
                        className={`w-full justify-start h-9 text-left transition-colors ${
                          isActive 
                            ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                        onClick={() => onTabChange(`app-${app.id}`)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex flex-col items-start min-w-0 flex-1">
                            <span className="font-medium text-sm truncate w-full">
                              {app.tla}
                            </span>
                            <span className={`text-xs truncate w-full ${
                              isActive ? 'text-secondary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {app.applicationName}
                            </span>
                          </div>
                          <Badge 
                            variant={isActive ? "default" : "outline"} 
                            className={`h-5 px-2 text-xs ml-2 flex-shrink-0 ${
                              isActive 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-background text-muted-foreground border-border'
                            }`}
                          >
                            {count}
                          </Badge>
                        </div>
                      </Button>
                    );
                  })}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* ✅ Updated Legend/Help Section with Shadcn Colors */}
      <div className="mt-auto p-4 border-t border-border bg-muted/30">
        <div className="text-xs text-muted-foreground space-y-2">
          <div className="flex items-center gap-2">
            <Lock className="h-3 w-3 text-orange-500 dark:text-orange-400" />
            <span>Private - Only you can see</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3 text-green-500 dark:text-green-400" />
            <span>Team - Shared with team</span>
          </div>
          <div className="flex items-center gap-2">
            <Pin className="h-3 w-3 text-blue-500 dark:text-blue-400" />
            <span>Pinned - Priority links</span>
          </div>
        </div>
      </div>
    </div>
  );
}
