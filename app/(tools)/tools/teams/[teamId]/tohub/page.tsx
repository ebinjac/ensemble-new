// app/(tools)/tools/teams/[teamId]/tohub/page.tsx
import { Suspense } from 'react';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { getApplicationsByTeam } from '@/app/actions/applications';
import { TurnoverForm } from '@/components/tohub/tohub-form';
import { TurnoverSkeleton } from '@/components/tohub/tohub-skeleton';
import { ArrowLeftRight } from 'lucide-react';
import { notFound } from 'next/navigation';

interface TohubPageProps {
  params: {
    teamId: string;
  };
  searchParams: {
    app?: string;
    section?: string;
  };
}

export default async function TohubPage({ params, searchParams }: TohubPageProps) {
  try {
    // ✅ Only need to verify access, layout handles the rest
    const { user, role } = await requireTeamAccess(params.teamId, { admin: false });

    // ✅ Get applications for this team
    const applications = await getApplicationsByTeam(params.teamId);
    const currentAppId = searchParams.app || applications[0]?.id;

    if (!currentAppId && applications.length === 0) {
      return (
        <div className="p-8">
          <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <ArrowLeftRight className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No Applications Found</h3>
                <p className="text-sm text-muted-foreground">
                  This team doesn't have any applications set up yet. Contact your team admin to configure applications for turnover management.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Turnover Hub
                </h1>
                <p className="text-muted-foreground mt-2">
                  Manage shift turnovers, track incidents, RFCs, and communicate important information across teams.
                </p>
              </div>
              
              {/* Team Stats */}
              <div className="hidden md:flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="text-center">
                  <div className="text-lg font-semibold text-foreground">
                    {applications.filter(app => app.status === 'active').length}
                  </div>
                  <div className="text-xs">Active Apps</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-foreground">
                    {applications.length}
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

          {/* Main Turnover Content */}
          <Suspense fallback={<TurnoverSkeleton />}>
            <TurnoverForm
              teamId={params.teamId}
              applications={applications}
              currentAppId={currentAppId}
              userRole={role === 'admin' ? 'admin' : 'member'}
            />
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading Turnover Hub page:', error);
    notFound();
  }
}

// ✅ Optional: Export for dynamic imports if needed
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Always get fresh data
