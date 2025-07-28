import { Suspense } from 'react';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { getTeamEmailConfigurations } from '@/app/actions/bluemailer/email-settings';
import { getTeamSettings } from '@/app/actions/bluemailer/team-settings';
import { SettingsView } from '@/components/bluemailer/settings-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Mail, Users, Shield, Bell } from 'lucide-react';

interface SettingsPageProps {
  params: {
    teamId: string;
  };
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { teamId } = params;

  // Verify team access
  const { user, team } = await requireTeamAccess(teamId);

  // Fetch settings data
  const [emailConfigurations, teamSettings] = await Promise.all([
    getTeamEmailConfigurations(teamId),
    getTeamSettings(teamId),
  ]);

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2">
            <Settings className="h-8 w-8 text-gray-700" />
            <span>Settings</span>
          </h1>
          <p className="text-muted-foreground">
            Manage your team settings, email configuration, and preferences
          </p>
        </div>
      </div>

      {/* Settings View */}
      <Suspense fallback={<SettingsLoadingSkeleton />}>
        <SettingsView
          teamId={teamId}
          user={user}
          team={team}
          emailConfigurations={emailConfigurations}
          teamSettings={teamSettings}
        />
      </Suspense>
    </div>
  );
}

// Loading skeleton component
function SettingsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="lg:col-span-3 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-16 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: SettingsPageProps) {
  return {
    title: 'Settings - Bluemailer',
    description: 'Manage your team settings and email configuration',
  };
}
