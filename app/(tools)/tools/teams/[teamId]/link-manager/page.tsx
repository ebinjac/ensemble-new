// app/tools/teams/[teamId]/link-manager/page.tsx

import { Suspense } from 'react';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { LinkManagerContainer } from '@/components/link-manager/link-container';
import { LinkManagerSkeleton } from '@/components/link-manager/link-manager-skeleton';

import { getTeamApplications } from '@/app/actions/link-manager/link-manager';
import { Link2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { TeamAwareLayout } from '@/components/team-aware-layout';

interface LinkManagerPageProps {
  params: {
    teamId: string;
  };
}

export async function generateMetadata({ params }: LinkManagerPageProps) {
  try {
    const { user } = await requireTeamAccess(params.teamId, { admin: false });
    const userTeam = user.teams.find(team => team.teamId === params.teamId);
    
    return {
      title: `Link Manager - ${userTeam?.teamName || 'Team'} | Ensemble`,
      description: 'Manage and organize your team\'s links across applications with advanced filtering and analytics.',
    };
  } catch {
    return {
      title: 'Link Manager | Ensemble',
      description: 'Manage and organize your team\'s links across applications.',
    };
  }
}

export default async function LinkManagerPage({ params }: LinkManagerPageProps) {
  try {
    // ✅ Require team access and get user info
    const { user, role } = await requireTeamAccess(params.teamId, { admin: false });
    
    // ✅ Find the current team from user's teams
    const userTeam = user.teams.find(team => team.teamId === params.teamId);
    if (!userTeam) {
      notFound();
    }

    // ✅ Get team applications for the sidebar and filters
    const teamApplications = await getTeamApplications(params.teamId);

    return (
      <TeamAwareLayout 
        currentTeamId={params.teamId}
        teamName={userTeam.teamName}
        userRole={role}
        toolName="Link Manager"
        toolIcon={<Link2 className="h-5 w-5" />}
      >
        <div className="container mx-auto py-8 px-4 max-w-screen-2xl">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Link Manager
                </h1>
                <p className="text-muted-foreground mt-2">
                  Manage and organize your team's links across applications with advanced filtering and search capabilities.
                </p>
              </div>
              
              {/* Team Stats */}
              <div className="hidden md:flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="text-center">
                  <div className="text-lg font-semibold text-foreground">
                    {teamApplications.filter(app => app.status === 'active').length}
                  </div>
                  <div className="text-xs">Active Apps</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-foreground">
                    {teamApplications.length}
                  </div>
                  <div className="text-xs">Total Apps</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary">
                    {role === 'admin' ? 'Admin' : 'Member'}
                  </div>
                  <div className="text-xs">Your Role</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Link Manager Content */}
          <Suspense fallback={<LinkManagerSkeleton />}>
            <LinkManagerContainer 
              teamId={params.teamId} 
              userRole={role}
              teamApplications={teamApplications}
            />
          </Suspense>

          {/* Footer Info */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <div className="text-sm text-muted-foreground">
                <p>
                  <strong>Team:</strong> {userTeam.teamName} • 
                  <strong className="ml-1">Role:</strong> {role} • 
                  <strong className="ml-1">Applications:</strong> {teamApplications.length}
                </p>
              </div>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>Last updated: {new Date().toLocaleDateString()}</span>
                {role === 'admin' && (
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Admin privileges active</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </TeamAwareLayout>
    );
  } catch (error) {
    console.error('Error loading Link Manager page:', error);
    notFound();
  }
}

// ✅ Optional: Export for dynamic imports if needed
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Always get fresh data
