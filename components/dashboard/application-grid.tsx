// app/teams/components/ApplicationGrid.tsx
'use client';

import { useState } from 'react';
import { ApplicationCard } from '@/components/dashboard/application-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, Grid, List, SlidersHorizontal } from 'lucide-react';

interface Application {
  id: string;
  assetId: number;
  applicationName: string;
  tla: string;
  tier: string;
  lifeCycleStatus: string | null;
  status: string;
  vpName: string | null;
  vpEmail: string | null;
  directorName: string | null;
  directorEmail: string | null;
  escalationEmail: string | null;
  contactEmail: string | null;
  teamEmail: string | null;
  snowGroup: string | null;
  slackChannel: string | null;
  description: string | null;
  lastCentralApiSync: string | null;
  centralApiSyncStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApplicationGridProps {
  applications: Application[];
  teamId: string;
  userRole: 'admin' | 'user';
}

export function ApplicationGrid({ applications, teamId, userRole }: ApplicationGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter applications based on search and filters
  const filteredApplications = applications.filter((app) => {
    const matchesSearch = 
      app.applicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.assetId.toString().includes(searchTerm) ||
      app.tla.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesTier = tierFilter === 'all' || app.tier === tierFilter;

    return matchesSearch && matchesStatus && matchesTier;
  });

  // Get unique tiers for filter
  const uniqueTiers = [...new Set(applications.map(app => app.tier))].filter(Boolean);
  const uniqueStatuses = [...new Set(applications.map(app => app.status))].filter(Boolean);

  if (applications.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto max-w-md">
          <div className="mx-auto h-16 w-16 text-muted-foreground mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
          <p className="text-muted-foreground mb-6">
            {userRole === 'admin' 
              ? "Get started by adding your first application to this team."
              : "No applications have been added to this team yet."
            }
          </p>
          {userRole === 'admin' && (
            <Button className="gap-2">
              Get Started
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {uniqueStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                {uniqueTiers.map((tier) => (
                  <SelectItem key={tier} value={tier}>
                    {tier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8 px-3"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8 px-3"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      {(searchTerm || statusFilter !== 'all' || tierFilter !== 'all') && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            Showing {filteredApplications.length} of {applications.length} applications
          </span>
          {searchTerm && (
            <Badge variant="secondary" className="text-xs">
              "{searchTerm}"
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Status: {statusFilter}
            </Badge>
          )}
          {tierFilter !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Tier: {tierFilter}
            </Badge>
          )}
        </div>
      )}

      {/* Applications Grid/List */}
      {filteredApplications.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            No applications match your current filters.
          </div>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" 
            : "space-y-4"
        }>
          {filteredApplications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              teamId={teamId}
              userRole={userRole}
            />
          ))}
        </div>
      )}
    </div>
  );
}
