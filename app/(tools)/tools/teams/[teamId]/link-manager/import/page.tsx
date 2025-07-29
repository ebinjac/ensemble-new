// app/tools/teams/[teamId]/link-manager/import/page.tsx
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { getTeamApplications } from '@/app/actions/link-manager/link-manager';
import { TeamAwareLayout } from '@/components/team-aware-layout';
import { ImportWorkflow } from '@/components/link-manager/link-import-workflow';
import { Upload } from 'lucide-react';
import { notFound } from 'next/navigation';

interface ImportPageProps {
  params: {
    teamId: string;
  };
}

export async function generateMetadata({ params }: ImportPageProps) {
  try {
    const { user } = await requireTeamAccess(params.teamId, { admin: false });
    const userTeam = user.teams.find(team => team.teamId === params.teamId);
    
    return {
      title: `Import Links - ${userTeam?.teamName || 'Team'} | Ensemble`,
      description: 'Import links from various sources with AI-powered categorization and tagging.',
    };
  } catch {
    return {
      title: 'Import Links | Ensemble',
      description: 'Import links from various sources.',
    };
  }
}

export default async function ImportPage({ params }: ImportPageProps) {
  try {
    const { user, role } = await requireTeamAccess(params.teamId, { admin: false });
    
    const userTeam = user.teams.find(team => team.teamId === params.teamId);
    if (!userTeam) {
      notFound();
    }

    const teamApplications = await getTeamApplications(params.teamId);

    return (
      <TeamAwareLayout 
        currentTeamId={params.teamId}
        teamName={userTeam.teamName}
        userRole={role}
        toolName="Link Manager"
        toolIcon={<Upload className="h-5 w-5" />}
      >
        <div className="container mx-auto py-8 px-4 max-w-screen-2xl">
          <ImportWorkflow 
            teamId={params.teamId}
            userRole={role}
            teamApplications={teamApplications}
          />
        </div>
      </TeamAwareLayout>
    );
  } catch (error) {
    notFound();
  }
}

export const dynamic = 'force-dynamic';
