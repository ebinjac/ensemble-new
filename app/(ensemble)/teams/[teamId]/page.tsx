// 


// app/teams/[teamId]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getTeamDetails } from '@/app/actions/teams/teams';
import { TeamDashboard } from '@/components/dashboard/teams-dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TeamPageProps {
  params: {
    teamId: string;
  };
}

function TeamLoadingSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-64">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function TeamPage({ params }: TeamPageProps) {
  const result = await getTeamDetails(params.teamId);

  if (!result.success) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<TeamLoadingSkeleton />}>
        <TeamDashboard 
          team={result.data.team}
          applications={result.data.applications}
          userRole={result.data.userRole}
        />
      </Suspense>
    </div>
  );
}

// Generate metadata for the page
export async function generateMetadata({ params }: TeamPageProps) {
  const result = await getTeamDetails(params.teamId);
  
  if (!result.success) {
    return {
      title: 'Team Not Found',
    };
  }

  return {
    title: `${result.data.team.teamName} | Team Dashboard`,
    description: `Manage applications and settings for ${result.data.team.teamName}`,
  };
}
