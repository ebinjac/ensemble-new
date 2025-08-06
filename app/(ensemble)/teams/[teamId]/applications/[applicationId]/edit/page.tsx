// app/teams/[teamId]/applications/[applicationId]/edit/page.tsx
import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { db } from '@/db';
import { teams, applications } from '@/db/schema/teams';
import { eq, and } from 'drizzle-orm';
import { EditApplicationForm } from '@/components/dashboard/edit-application-form';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getApplicationDetails } from '@/app/actions/teams/teams';

interface EditApplicationPageProps {
  params: {
    teamId: string;
    applicationId: string;
  };
}

function EditApplicationSkeleton() {
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

export default async function EditApplicationPage({ params }: EditApplicationPageProps) {
  try {
    const { user, role } = await requireTeamAccess(params.teamId, { admin: true });

    if (role !== 'admin') {
      redirect(`/teams/${params.teamId}`);
    }

    const application = await getApplicationDetails(params.applicationId, params.teamId);
    
    if (!application) {
      notFound();
    }

    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Suspense fallback={<EditApplicationSkeleton />}>
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href={`/teams/${params.teamId}`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Team
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight">Edit Application</h1>
              <p className="text-muted-foreground">
                Update {application.data?.applicationName} settings
              </p>
            </div>
          </div>

          <EditApplicationForm 
            teamId={params.teamId} 
            application={application.data || {}}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    notFound();
  }
}

// Generate metadata for the page
export async function generateMetadata({ params }: EditApplicationPageProps) {
  try {
    await requireTeamAccess(params.teamId, { admin: false });
    const application = await getApplicationDetails(params.applicationId, params.teamId);
    
    if (!application) {
      return {
        title: 'Edit Application',
      };
    }

    return {
      title: `Edit ${application.data?.applicationName}`,
      description: `Edit application settings for ${application.data?.applicationName}`,
    };
  } catch (error) {
    return {
      title: 'Edit Application',
    };
  }
}
