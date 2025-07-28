// app/tools/teams/[teamId]/tohub/settings/page.tsx
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings, Database, Bell, Clock, Users } from 'lucide-react';
import { ApplicationManagement } from '@/components/tohub/settings/tohub-application-management';

import { getApplicationsWithSubAppsForAdmin } from '@/app/actions/tohub/tohub';

interface Props {
  params: { teamId: string };
}

export default async function SettingsPage({ params }: Props) {
  const { role } = await requireTeamAccess(params.teamId, {admin: false});
  
  // Only admins can access settings
  if (role !== 'admin') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              Only team administrators can access settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pre-fetch applications data for admin
  const applicationsWithSubApps = await getApplicationsWithSubAppsForAdmin(params.teamId);

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="border-b border-border bg-card">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">Configure turnover preferences and manage applications</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="applications" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Applications</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="timing" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Timing</span>
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>General</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>Application Management</span>
                  </div>
                  <Badge variant="secondary">
                    {applicationsWithSubApps.length} Applications
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Manage applications and their sub-applications that appear in turnover forms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ApplicationManagement 
                  teamId={params.teamId}
                  initialApplications={applicationsWithSubApps}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
