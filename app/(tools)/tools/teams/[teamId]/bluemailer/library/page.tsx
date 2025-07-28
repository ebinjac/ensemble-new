import { Suspense } from 'react';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { getTeamLibraryItems } from '@/app/actions/bluemailer/team-library';
import { LibraryView } from '@/components/bluemailer/library-view';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface LibraryPageProps {
  params: {
    teamId: string;
  };
}

export default async function LibraryPage({ params }: LibraryPageProps) {
  const { teamId } = params;

  // Verify team access
  await requireTeamAccess(teamId);

  // Fetch library items
  const libraryItems = await getTeamLibraryItems(teamId);

  return (
    <div className=" mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-bold">Template Library</h1>
          </div>
          <p className="text-muted-foreground">
            Create and manage reusable templates and components for your team
          </p>
        </div>
        
        <Link href={`/tools/teams/${teamId}/bluemailer/library/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Library Item
          </Button>
        </Link>
      </div>

      {/* Library View */}
      <Suspense fallback={<div>Loading library...</div>}>
        <LibraryView
          items={libraryItems}
          teamId={teamId}
        />
      </Suspense>
    </div>
  );
}

export async function generateMetadata({ params }: LibraryPageProps) {
  return {
    title: 'Template Library - Bluemailer',
    description: 'Create and manage reusable email templates and components',
  };
}
