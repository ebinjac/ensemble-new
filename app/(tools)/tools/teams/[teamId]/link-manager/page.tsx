// app/tools/teams/[teamId]/link-manager/page.tsx (Updated)
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { getTeamApplications, getLinkCounts } from '@/app/actions/link-manager/link-manager';
import { TeamAwareLayout } from '@/components/team-aware-layout';
import { LinkManagerLayout } from '@/components/link-manager/link-manager-layout';
import { notFound } from 'next/navigation';

interface LinkManagerPageProps {
  params: Promise<{
    teamId: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function LinkManagerPage({ 
  params, 
  searchParams 
}: LinkManagerPageProps) {
  try {
    const { teamId } = await params;
    const { user, role } = await requireTeamAccess(teamId, { admin: false });
    
    const userTeam = user.teams.find(team => team.teamId === teamId);
    if (!userTeam) {
      notFound();
    }

    // ✅ Fetch both applications and link counts
    const [teamApplications, linkCounts] = await Promise.all([
      getTeamApplications(teamId),
      getLinkCounts(teamId)
    ]);

    return (
      <TeamAwareLayout 
        currentTeamId={teamId}
        teamName={userTeam.teamName}
        userRole={role}
        toolName="Link Manager"
      >
        <LinkManagerLayout
          teamId={teamId}
          userRole={role}
          teamApplications={teamApplications}
          linkCounts={linkCounts} // ✅ Pass the counts
          activeTab={(await searchParams).tab || ''}
        />
      </TeamAwareLayout>
    );
  } catch (error) {
    notFound();
  }
}
