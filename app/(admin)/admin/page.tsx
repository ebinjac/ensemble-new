'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/admin/overview/stats-card';
import { ActivityChart } from '@/components/admin/overview/activity-chart';
import { Users, Timer, Star, Activity, Loader } from 'lucide-react';
import { getDashboardStats, getActivityData, type DashboardStats, type ActivityData } from '@/app/actions/admin';

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardStats, activity] = await Promise.all([
          getDashboardStats(),
          getActivityData()
        ]);
        setStats(dashboardStats);
        setActivityData(activity);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <Loader className="w-8 h-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Teams"
          value={String(stats?.totalTeams || 0)}
          icon={<Users className="h-4 w-4" />}
          trend={{
            value: "0",
            label: "from last month",
            direction: "up"
          }}
        />
        <StatsCard
          title="Pending Requests"
          value={String(stats?.pendingRequests || 0)}
          icon={<Timer className="h-4 w-4" />}
          trend={{
            value: "0",
            label: "from last month",
            direction: "neutral"
          }}
        />
        <StatsCard
          title="Approval Rate"
          value={String(stats?.approvalRate || 0)}
          icon={<Star className="h-4 w-4" />}
          valueFormat="%"
          trend={{
            value: "0",
            label: "from last month",
            direction: "up"
          }}
        />
        <StatsCard
          title="Active Teams"
          value={String(stats?.activeTeams || 0)}
          icon={<Activity className="h-4 w-4" />}
          trend={{
            value: "0",
            label: "from last month",
            direction: "up"
          }}
        />
      </div>

      <div className="grid gap-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-medium">Team Registration Activity</h3>
            <p className="text-sm text-muted-foreground">
              Registration requests over the last 3 months
            </p>
          </div>
          <div className="p-6 pt-0 h-[350px]">
            <ActivityChart data={activityData} />
          </div>
        </div>
      </div>
    </div>
  );
} 