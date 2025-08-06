// app/teams/[teamId]/applications/add/page.tsx
import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { db } from '@/db';
import { teams } from '@/db/schema/teams';
import { eq } from 'drizzle-orm';
import { AddApplicationForm } from '@/components/dashboard/add-application-form';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface AddApplicationPageProps {
  params: {
    teamId: string;
  };
}

function AddApplicationSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Skeleton className="h-8 w-64" />
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to get team details
async function getTeamInfo(teamId: string) {
  const team = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);
  
  return team[0] || null;
}

export default async function AddApplicationPage({ params }: AddApplicationPageProps) {
  try {
    const { user, role } = await requireTeamAccess(params.teamId, { admin: true });

    if (role !== 'admin') {
      redirect(`/teams/${params.teamId}`);
    }

    // Get team details separately
    const team = await getTeamInfo(params.teamId);
    
    if (!team) {
      notFound();
    }

    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Suspense fallback={<AddApplicationSkeleton />}>
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href={`/teams/${params.teamId}`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Team
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight">Add Application</h1>
              <p className="text-muted-foreground">
                Add a new application to {team.teamName}
              </p>
            </div>
          </div>

          <AddApplicationForm teamId={params.teamId} />
        </Suspense>
      </div>
    );
  } catch (error) {
    notFound();
  }
}

// Generate metadata for the page
export async function generateMetadata({ params }: AddApplicationPageProps) {
  try {
    await requireTeamAccess(params.teamId, { admin: false });
    const team = await getTeamInfo(params.teamId);
    
    return {
      title: `Add Application | ${team?.teamName || 'Team'}`,
      description: `Add a new application to ${team?.teamName || 'team'}`,
    };
  } catch (error) {
    return {
      title: 'Add Application',
    };
  }
}
