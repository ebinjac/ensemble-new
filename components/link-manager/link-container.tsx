// app/components/link-manager/LinkManagerContainer.tsx
'use client'

import { useState } from 'react';
import { LinkManagerDashboard } from './link-manager-dashboard';
import { LinkAnalytics } from './link-analytics';
import { ApplicationSidebar } from './link-manager-sidebar';

interface LinkManagerContainerProps {
  teamId: string;
  userRole: 'admin' | 'user';
  teamApplications: Array<{
    id: string;
    applicationName: string;
    tla: string;
    status: string;
  }>;
}

export function LinkManagerContainer({ 
  teamId, 
  userRole, 
  teamApplications 
}: LinkManagerContainerProps) {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="flex gap-6">
      {/* ✅ Application Sidebar - Always rendered */}
      <div className="w-64 flex-shrink-0">
        <ApplicationSidebar
          applications={teamApplications}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          linkCounts={{}} // TODO: Add link counts per application
          currentTeamId={teamId}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {activeTab === 'analytics' ? (
          <LinkAnalytics teamId={teamId} />
        ) : (
          <LinkManagerDashboard 
            teamId={teamId}
            userRole={userRole}
            teamApplications={teamApplications}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}
      </div>
    </div>
  );
}
