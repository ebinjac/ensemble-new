import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { getEmailSendHistory } from '@/app/actions/bluemailer/email-sending';
import { EmailHistoryList } from '@/components/bluemailer/email-history-list';
import { Button } from '@/components/ui/button';
import { Mail, Settings } from 'lucide-react';
import Link from 'next/link';

interface EmailsPageProps {
  params: {
    teamId: string;
  };
}

export default async function EmailsPage({ params }: EmailsPageProps) {
  const { teamId } = params;

  // Verify team access
  await requireTeamAccess(teamId);

  // Fetch email history
  const emailHistory = await getEmailSendHistory(teamId);

  return (
    <div className="mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Mail className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Email History</h1>
          </div>
          <p className="text-muted-foreground">
            View and manage sent emails from your templates
          </p>
        </div>
        
        <Link href={`/tools/teams/${teamId}/bluemailer/emails/settings`}>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Email Settings
          </Button>
        </Link>
      </div>

      {/* Email History */}
      <EmailHistoryList 
        emails={emailHistory}
        teamId={teamId}
      />
    </div>
  );
}
