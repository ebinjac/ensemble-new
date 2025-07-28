// app/tools/teams/[teamId]/tohub/components/TurnoverContent.tsx
'use client';

import { Suspense, useMemo } from 'react';
import { TurnoverForm } from '@/components/tohub/tohub-form';
import { DispatchView } from '@/components/tohub/tohub-dispatcher';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  teamId: string;
  activeView: string;
  selectedApp?: string;
  applications: any[];
}

// Loading component to improve perceived performance
function ContentLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function TurnoverContent({ teamId, activeView, selectedApp, applications }: Props) {
  // Memoize the current application to prevent re-renders
  const currentApplication = useMemo(() => {
    return applications.find(app => app.id === selectedApp);
  }, [applications, selectedApp]);

  // Render different views based on active selection
  const renderContent = () => {
    switch (activeView) {
      case 'pass-baton':
        if (!currentApplication) {
          return (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">No Application Selected</h3>
                <p className="text-gray-500">Please select an application from the sidebar</p>
              </div>
            </div>
          );
        }
        return (
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Pass the Baton</h2>
                <p className="text-gray-600">Manage turnover for {currentApplication.applicationName}</p>
              </div>
              <Suspense fallback={<ContentLoading />}>
                <TurnoverForm
                  teamId={teamId}
                  application={currentApplication}
                />
              </Suspense>
            </div>
          </div>
        );

      case 'dispatch':
        return <DispatchView teamId={teamId} applications={applications} />;
      
      default:
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">View Not Found</h3>
              <p className="text-gray-500">The selected view is not available</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {renderContent()}
    </div>
  );
}
