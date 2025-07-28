// app/(tools)/tools/teams/[teamId]/tohub/components/ApplicationTabs.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  teamId: string;
  applications: any[];
  currentAppId: string;
  onAppSwitch: (applicationId: string) => void;
}

export function ApplicationTabs({ teamId, applications, currentAppId, onAppSwitch }: Props) {
  // Always render, even for single application
  if (applications.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No applications configured for this team.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // For single application, show it but don't make it clickable
  if (applications.length === 1) {
    const app = applications[0];
    return (
      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="border-b border-border/40">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {/* ✅ FIXED: Use applicationName instead of name */}
                      {app.applicationName?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                  <div>
                    {/* ✅ FIXED: Use applicationName instead of name */}
                    <h3 className="font-medium text-foreground">{app.applicationName}</h3>
                    {app.description && (
                      <p className="text-sm text-muted-foreground">{app.description}</p>
                    )}
                  </div>
                </div>
                <Badge variant="default" className="text-xs">
                  Current Application
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Multiple applications - show tabs
  return (
    <Card className="border-border/50">
      <CardContent className="p-0">
        <div className="border-b border-border/40">
          <nav className="flex space-x-2 px-6" aria-label="Applications">
            {applications.map((app) => (
              <Button
                key={app.id}
                variant="ghost"
                onClick={() => onAppSwitch(app.id)}
                className={cn(
                  "py-4 px-2 border-b-2 rounded-none font-medium text-sm transition-colors hover:text-foreground",
                  app.id === currentAppId
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:border-border"
                )}
              >
                <div className="flex items-center space-x-2">
                  {/* ✅ FIXED: Use applicationName instead of name */}
                  <span>{app.applicationName}</span>
                </div>
              </Button>
            ))}
          </nav>
        </div>
        
        {/* Active Application Summary */}
        <div className="px-6 py-3 bg-muted/20">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Managing turnover for: <span className="font-medium text-foreground">
                {/* ✅ FIXED: Use applicationName instead of name */}
                {applications.find(app => app.id === currentAppId)?.applicationName}
              </span>
            </span>
            <span className="text-xs text-muted-foreground">
              {applications.length > 1 ? 'Switch applications using the tabs above' : 'Single application mode'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
