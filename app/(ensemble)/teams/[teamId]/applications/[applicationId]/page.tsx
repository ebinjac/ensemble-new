// app/teams/[teamId]/applications/[applicationId]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { db } from '@/db';
import { teams, applications } from '@/db/schema/teams';
import { eq, and } from 'drizzle-orm';
import { ApplicationDetails } from '@/components/dashboard/application-details';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ApplicationDetailsPageProps {
  params: {
    teamId: string;
    applicationId: string;
  };
}

function ApplicationDetailsSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Helper function to get application details
async function getApplicationDetails(applicationId: string, teamId: string) {
  const application = await db
    .select()
    .from(applications)
    .where(
      and(
        eq(applications.id, applicationId),
        eq(applications.teamId, teamId)
      )
    )
    .limit(1);

  return application[0] || null;
}

export default async function ApplicationDetailsPage({ params }: ApplicationDetailsPageProps) {
  try {
    const { user, role } = await requireTeamAccess(params.teamId, { admin: false });

    const application = await getApplicationDetails(params.applicationId, params.teamId);
    
    if (!application) {
      notFound();
    }

    return (
      <div className="container mx-auto py-6 max-w-6xl">
        <Suspense fallback={<ApplicationDetailsSkeleton />}>
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href={`/teams/${params.teamId}`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Team
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight">
                {application.applicationName}
              </h1>
              <p className="text-muted-foreground">
                Application details and configuration
              </p>
            </div>
          </div>

          <ApplicationDetails 
            application={application}
            teamId={params.teamId}
            userRole={role}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    notFound();
  }
}

// Generate metadata for the page
export async function generateMetadata({ params }: ApplicationDetailsPageProps) {
  try {
    await requireTeamAccess(params.teamId, { admin: false });
    const application = await getApplicationDetails(params.applicationId, params.teamId);
    
    if (!application) {
      return {
        title: 'Application Details',
      };
    }

    return {
      title: `${application.applicationName} | Application Details`,
      description: `View details for ${application.applicationName}`,
    };
  } catch (error) {
    return {
      title: 'Application Details',
    };
  }
}
