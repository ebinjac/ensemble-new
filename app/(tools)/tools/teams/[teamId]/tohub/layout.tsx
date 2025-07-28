// app/(tools)/tools/teams/[teamId]/tohub/layout.tsx
import { Suspense } from 'react';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { getApplicationsByTeam } from '@/app/actions/applications';
import { TeamAwareLayout } from '@/components/team-aware-layout';
import { TurnoverSidebar } from '@/components/tohub/tohub-sidebar';
import { ArrowLeftRight } from 'lucide-react';
import { notFound } from 'next/navigation';

interface TohubLayoutProps {
  children: React.ReactNode;
  params: {
    teamId: string;
  };
}

async function SidebarWrapper({ teamId, searchParams }: { teamId: string; searchParams: any }) {
  const applications = await getApplicationsByTeam(teamId);
  const currentAppId = searchParams?.app || applications[0]?.id;

  return (
    <TurnoverSidebar
      teamId={teamId}
      applications={applications}
      currentAppId={currentAppId}
    />
  );
}

function SidebarSkeleton() {
  return (
    <div className="w-80 border-r bg-muted/20 p-4">
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="h-10 bg-muted animate-pulse rounded" />
        ))}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: { teamId: string } }) {
  try {
    const { user } = await requireTeamAccess(params.teamId, { admin: false });
    const userTeam = user.teams.find(team => team.teamId === params.teamId);
    
    return {
      title: `Turnover Hub - ${userTeam?.teamName || 'Team'} | Ensemble`,
      description: 'Manage shift turnovers, track incidents, RFCs, and communicate important information across teams.',
    };
  } catch {
    return {
      title: 'Turnover Hub | Ensemble',
      description: 'Manage shift turnovers and team communications.',
    };
  }
}

export default async function TohubLayout({ children, params }: TohubLayoutProps) {
  try {
    // ✅ Require team access and get user info
    const { user, role } = await requireTeamAccess(params.teamId, { admin: false });
    
    // ✅ Find the current team from user's teams
    const userTeam = user.teams.find(team => team.teamId === params.teamId);
    if (!userTeam) {
      notFound();
    }

    return (
      <TeamAwareLayout
        currentTeamId={params.teamId}
        teamName={userTeam.teamName}
        userRole={role}
        toolName="Turnover Hub"
        toolIcon={<ArrowLeftRight className="h-5 w-5" />}
      >
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Sidebar */}
          <Suspense fallback={<SidebarSkeleton />}>
            <SidebarWrapper 
              teamId={params.teamId} 
              searchParams={typeof window !== 'undefined' ? Object.fromEntries(new URLSearchParams(window.location.search)) : {}}
            />
          </Suspense>

          {/* Main Content Area */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </TeamAwareLayout>
    );
  } catch (error) {
    console.error('Error loading Turnover Hub layout:', error);
    notFound();
  }
}

// ✅ Optional: Export for dynamic imports if needed
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Always get fresh data
