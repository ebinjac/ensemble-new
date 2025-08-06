// app/teams/components/TeamDashboard.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Settings, Mail, Activity, TrendingUp, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ApplicationGrid } from '@/components/dashboard/application-grid';
import { TeamSettings } from '@/components/dashboard/team-settings';

interface Team {
  id: string;
  teamName: string;
  contactName: string;
  contactEmail: string;
  userGroup: string;
  adminGroup: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Application {
  id: string;
  assetId: number;
  applicationName: string;
  tla: string;
  tier: string;
  lifeCycleStatus: string | null;
  status: string;
  vpName: string | null;
  vpEmail: string | null;
  directorName: string | null;
  directorEmail: string | null;
  escalationEmail: string | null;
  contactEmail: string | null;
  teamEmail: string | null;
  snowGroup: string | null;
  slackChannel: string | null;
  description: string | null;
  lastCentralApiSync: string | null;
  centralApiSyncStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TeamDashboardProps {
  team: Team;
  applications: Application[];
  userRole: 'admin' | 'user';
}

export function TeamDashboard({ team, applications, userRole }: TeamDashboardProps) {
  const router = useRouter();

  const activeApplications = applications.filter(app => app.status === 'active');
  const inactiveApplications = applications.filter(app => app.status !== 'active');
  const syncedApplications = applications.filter(app => app.centralApiSyncStatus === 'success');

  const handleAddApplication = () => {
    router.push(`/teams/${team.id}/applications/add`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{team.teamName}</h1>
            <Badge 
              variant={team.isActive ? 'default' : 'secondary'}
              className="px-3 py-1"
            >
              {team.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground">
            {activeApplications.length} active applications • {applications.length} total
          </p>
        </div>
        
        {userRole === 'admin' && (
          <Button onClick={handleAddApplication} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Add Application
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeApplications.length} active, {inactiveApplications.length} inactive
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncedApplications.length}</div>
            <p className="text-xs text-muted-foreground">
              Successfully synced with Central API
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Contact</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium truncate">{team.contactName}</div>
            <p className="text-xs text-muted-foreground truncate">{team.contactEmail}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Access</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{userRole}</div>
            <p className="text-xs text-muted-foreground">
              {userRole === 'admin' ? 'Full management access' : 'Read-only access'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="applications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
          <TabsTrigger value="applications" className="gap-2">
            <Activity className="h-4 w-4" />
            Applications
          </TabsTrigger>
          {userRole === 'admin' && (
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="applications" className="space-y-6">
          <ApplicationGrid 
            applications={applications} 
            teamId={team.id}
            userRole={userRole}
          />
        </TabsContent>

        {userRole === 'admin' && (
          <TabsContent value="settings" className="space-y-6">
            <TeamSettings team={team} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
