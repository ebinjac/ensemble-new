// app/components/link-manager/LinkManagerLayout.tsx (Updated)
'use client'

import { useState } from 'react';
import { ApplicationSidebar } from './link-manager-sidebar';
import { LinkManagerDashboard } from './link-manager-dashboard';

interface LinkManagerLayoutProps {
  teamId: string;
  userRole: 'admin' | 'user';
  teamApplications: Array<{
    id: string;
    applicationName: string;
    tla: string;
    status: string;
  }>;
  linkCounts: Record<string, number>; // ✅ Add linkCounts prop
  activeTab?: string;
}

export function LinkManagerLayout({
  teamId,
  userRole,
  teamApplications,
  linkCounts, // ✅ Receive linkCounts
  activeTab: initialActiveTab
}: LinkManagerLayoutProps) {
  const [activeTab, setActiveTab] = useState(initialActiveTab || 'all');

  return (
    <div className="flex h-full">
      <ApplicationSidebar
        applications={teamApplications}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        linkCounts={linkCounts} // ✅ Pass linkCounts to sidebar
        currentTeamId={teamId}
      />
      <div className="flex-1 p-6 overflow-auto">
        <LinkManagerDashboard
          teamId={teamId}
          userRole={userRole}
          teamApplications={teamApplications}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </div>
  );
}
