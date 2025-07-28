import { Suspense } from 'react';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { HelpView } from '@/components/bluemailer/help-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, BookOpen, MessageSquare, Video } from 'lucide-react';

interface HelpPageProps {
  params: {
    teamId: string;
  };
}

export default async function HelpPage({ params }: HelpPageProps) {
  const { teamId } = params;

  // Verify team access
  await requireTeamAccess(teamId);

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2">
            <HelpCircle className="h-8 w-8 text-blue-600" />
            <span>Help & Support</span>
          </h1>
          <p className="text-muted-foreground">
            Get help with Bluemailer, find documentation, and contact support
          </p>
        </div>
      </div>

      {/* Help Content */}
      <Suspense fallback={<HelpLoadingSkeleton />}>
        <HelpView teamId={teamId} />
      </Suspense>
    </div>
  );
}

// Loading skeleton component
function HelpLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: HelpPageProps) {
  return {
    title: 'Help & Support - Bluemailer',
    description: 'Get help and support for Bluemailer',
  };
}
