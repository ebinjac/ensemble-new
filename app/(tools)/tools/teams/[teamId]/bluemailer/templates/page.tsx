import { Suspense } from 'react';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { getTeamTemplates } from '@/app/actions/bluemailer/templates';
import { TemplatesView } from '@/components/bluemailer/templates-view';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download, Filter } from 'lucide-react';
import Link from 'next/link';

interface TemplatesPageProps {
  params: {
    teamId: string;
  };
  searchParams: {
    category?: string;
    search?: string;
    sort?: string;
  };
}

export default async function TemplatesPage({ params, searchParams }: TemplatesPageProps) {
  const { teamId } = params;

  // Verify team access
  await requireTeamAccess(teamId);

  // Fetch templates
  const templates = await getTeamTemplates(teamId, {
    category: searchParams.category,
    search: searchParams.search,
    sort: searchParams.sort || 'recent',
  });

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground">
            Create, manage, and organize your email templates
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href={`/tools/teams/${teamId}/bluemailer/templates/new`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </Link>
        </div>
      </div>

      {/* Templates View */}
      <Suspense fallback={<TemplatesLoadingSkeleton />}>
        <TemplatesView 
          templates={templates}
          teamId={teamId}
          initialFilters={{
            category: searchParams.category,
            search: searchParams.search,
            sort: searchParams.sort || 'recent',
          }}
        />
      </Suspense>
    </div>
  );
}

// Loading skeleton component
function TemplatesLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: TemplatesPageProps) {
  return {
    title: 'Email Templates - Bluemailer',
    description: 'Create and manage your email templates',
  };
}
