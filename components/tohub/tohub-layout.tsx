// app/tools/teams/[teamId]/tohub/components/TohubLayout.tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRightLeft, 
  SendHorizontal, 
  History, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { TurnoverContent } from '@/components/tohub/tohub-content';

const sidebarItems = [
  {
    id: 'pass-baton',
    label: 'Pass the Baton',
    icon: ArrowRightLeft,
    description: 'Current turnover management'
  },
  {
    id: 'dispatch',
    label: 'Dispatch Turnover',
    icon: SendHorizontal,
    description: 'Send turnover notifications'
  },
  {
    id: 'history',
    label: 'Transition History',
    icon: History,
    description: 'View past turnovers'
  },
  {
    id: 'metrics',
    label: 'Turnover Metrics',
    icon: BarChart3,
    description: 'Analytics and insights'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    description: 'Manage turnover settings'
  }
];

interface Props {
  teamId: string;
  applications: any[];
  currentView: string;
  currentApp?: string;
}

export function TohubLayout({ teamId, applications, currentView, currentApp }: Props) {
  const [activeView, setActiveView] = useState(currentView);
  const [selectedApp, setSelectedApp] = useState(currentApp);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-full w-full">
      {/* Sidebar */}
      <div className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-xl font-semibold text-gray-900">TO-Hub</h1>
                <p className="text-sm text-gray-500">Turnover Portal</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8 w-8 p-0"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-auto p-3",
                    sidebarCollapsed && "px-2",
                    isActive && "bg-blue-50 text-blue-700 border-blue-200"
                  )}
                  onClick={() => setActiveView(item.id)}
                >
                  <Icon className={cn("h-4 w-4", !sidebarCollapsed && "mr-3")} />
                  {!sidebarCollapsed && (
                    <div className="text-left">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500 font-normal">
                        {item.description}
                      </div>
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
        </nav>

        {/* Application Selector (for Pass the Baton view) */}
        {activeView === 'pass-baton' && !sidebarCollapsed && (
          <>
            <Separator />
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Applications</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {applications.map((app) => (
                  <Button
                    key={app.id}
                    variant={selectedApp === app.id ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-left h-auto p-2"
                    onClick={() => setSelectedApp(app.id)}
                  >
                    <div>
                      <div className="font-medium text-sm">{app.applicationName}</div>
                      {app.subApplications?.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {app.subApplications.slice(0, 3).map((sub: any) => (
                            <Badge key={sub.id} variant="outline" className="text-xs">
                              {sub.name}
                            </Badge>
                          ))}
                          {app.subApplications.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{app.subApplications.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TurnoverContent
          teamId={teamId}
          activeView={activeView}
          selectedApp={selectedApp}
          applications={applications}
        />
      </div>
    </div>
  );
}
