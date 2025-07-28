// app/(tools)/tools/teams/[teamId]/tohub/dispatch/page.tsx
import { Suspense } from 'react';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { getApplicationsByTeam } from '@/app/actions/applications';
import { DispatchContainer } from '@/components/tohub/dispatch/dispatch-container';
import { TurnoverSkeleton } from '@/components/tohub/tohub-skeleton';
import { Send } from 'lucide-react';
import { notFound } from 'next/navigation';
import { PrintLinkButton } from '@/components/tohub/dispatch/print-link';

interface DispatchPageProps {
  params: {
    teamId: string;
  };
  searchParams: Promise<{
    app?: string;
    print?: string;
  }>;
}

export default async function DispatchTurnoverPage({ params, searchParams }: DispatchPageProps) {
  try {
    const { user, role } = await requireTeamAccess(params.teamId, { admin: false });

    // ✅ Await searchParams before using
    const resolvedSearchParams = await searchParams;
    const applications = await getApplicationsByTeam(params.teamId);
    const currentAppId = resolvedSearchParams.app || applications[0]?.id;

    if (!currentAppId && applications.length === 0) {
      return (
        <div className="p-8">
          <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Send className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No Applications Found</h3>
                <p className="text-sm text-muted-foreground">
                  No applications available for dispatch turnover.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={resolvedSearchParams.print ? 'print-layout' : 'p-6'}>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <Send className="h-6 w-6 text-white" />
                  </div>
                  Dispatch Turnover
                </h1>
                <p className="text-muted-foreground mt-2">
                  Comprehensive turnover presentation for shift transition calls and discussions.
                </p>
              </div>
              
              {/* Print and Export Actions */}
              {!resolvedSearchParams.print && (
                <div className="hidden md:flex items-center space-x-2">
                  {/* <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
                  >
                    Print View
                  </button> */}
                  <PrintLinkButton searchParams={resolvedSearchParams} />
                </div>
              )}
            </div>
          </div>

          {/* Main Dispatch Content */}
          <Suspense fallback={<TurnoverSkeleton />}>
            <DispatchContainer
              teamId={params.teamId}
              applications={applications}
              currentAppId={currentAppId}
              userRole={role === 'admin' ? 'admin' : 'member'}
              isPrintMode={!!resolvedSearchParams.print}
            />
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading Dispatch Turnover page:', error);
    notFound();
  }
}
