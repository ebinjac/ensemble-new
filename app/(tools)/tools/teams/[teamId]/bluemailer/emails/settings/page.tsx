import { Suspense } from 'react';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { getTeamEmailConfigurations } from '@/app/actions/bluemailer/email-settings';
import { EmailSettingsView } from '@/components/bluemailer/email-settings-view';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Plus } from 'lucide-react';
import Link from 'next/link';

interface EmailSettingsPageProps {
  params: {
    teamId: string;
  };
}

export default async function EmailSettingsPage({ params }: EmailSettingsPageProps) {
  const { teamId } = params;

  // Verify team access
  await requireTeamAccess(teamId);

  // Fetch email configurations
  const emailConfigurations = await getTeamEmailConfigurations(teamId);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/tools/teams/${teamId}/bluemailer/emails`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Emails
            </Button>
          </Link>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Settings className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold">Email Settings</h1>
            </div>
            <p className="text-muted-foreground">
              Configure SMTP settings and manage email configurations for your team
            </p>
          </div>
        </div>
        
        <Link href={`/tools/teams/${teamId}/bluemailer/emails/settings/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Configuration
          </Button>
        </Link>
      </div>

      {/* Email Settings */}
      <Suspense fallback={<div>Loading email settings...</div>}>
        <EmailSettingsView 
          configurations={emailConfigurations}
          teamId={teamId}
        />
      </Suspense>
    </div>
  );
}

export async function generateMetadata({ params }: EmailSettingsPageProps) {
  return {
    title: 'Email Settings - Bluemailer',
    description: 'Configure SMTP settings and manage email configurations',
  };
}
