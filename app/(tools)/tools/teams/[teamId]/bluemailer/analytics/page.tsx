import { Suspense } from 'react';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { getEmailAnalytics, getTemplateAnalytics, getEngagementMetrics } from '@/app/actions/bluemailer/analytics';
import { AnalyticsView } from '@/components/bluemailer/analytics-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Calendar, TrendingUp } from 'lucide-react';

interface AnalyticsPageProps {
  params: {
    teamId: string;
  };
  searchParams: {
    period?: string;
    startDate?: string;
    endDate?: string;
  };
}

export default async function AnalyticsPage({ params, searchParams }: AnalyticsPageProps) {
  const { teamId } = params;

  // Verify team access
  await requireTeamAccess(teamId);

  // Set default date range (last 30 days)
  const endDate = searchParams.endDate ? new Date(searchParams.endDate) : new Date();
  const startDate = searchParams.startDate 
    ? new Date(searchParams.startDate) 
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const period = searchParams.period || '30d';

  // Fetch analytics data
  const [emailAnalytics, templateAnalytics, engagementMetrics] = await Promise.all([
    getEmailAnalytics(teamId, { startDate, endDate, period }),
    getTemplateAnalytics(teamId, { startDate, endDate, period }),
    getEngagementMetrics(teamId, { startDate, endDate, period }),
  ]);

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <span>Email Analytics</span>
          </h1>
          <p className="text-muted-foreground">
            Track your email performance and engagement metrics
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Custom Range
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <Suspense fallback={<AnalyticsLoadingSkeleton />}>
        <AnalyticsView
          teamId={teamId}
          emailAnalytics={emailAnalytics}
          templateAnalytics={templateAnalytics}
          engagementMetrics={engagementMetrics}
          dateRange={{ startDate, endDate, period }}
        />
      </Suspense>
    </div>
  );
}

// Loading skeleton component
function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: AnalyticsPageProps) {
  return {
    title: 'Analytics - Bluemailer',
    description: 'Email performance analytics and insights',
  };
}
