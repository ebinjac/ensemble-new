// app/components/link-manager/LinkAnalytics.tsx
'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/(auth)/providers/AuthProvider';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Link, 
  Eye, 
  Clock, 
  Download,
  Calendar,
  ExternalLink,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { getLinkAnalytics } from '@/app/actions/link-manager/link-manager';

interface LinkAnalyticsProps {
  teamId: string;
}

type AnalyticsData = {
  totalLinks: number;
  totalAccesses: number;
  uniqueUsers: number;
  popularLinks: Array<{
    id: string;
    title: string;
    url: string;
    accessCount: number;
    uniqueUsers: number;
  }>;
  recentActivity: Array<{
    linkId: string;
    title: string;
    accessedBy: string;
    accessedAt: Date;
  }>;
};

export function LinkAnalytics({ teamId }: LinkAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const { isTeamAdmin } = useAuth();

  const isAdmin = isTeamAdmin(teamId);

  // Load analytics data
  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await getLinkAnalytics(teamId, parseInt(dateRange));
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts or date range changes
  useEffect(() => {
    loadAnalytics();
  }, [teamId, dateRange]);

  // Handle export functionality
  const handleExport = async () => {
    if (!analytics) return;

    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        dateRange: `${dateRange} days`,
        summary: {
          totalLinks: analytics.totalLinks,
          totalAccesses: analytics.totalAccesses,
          uniqueUsers: analytics.uniqueUsers,
        },
        popularLinks: analytics.popularLinks,
        recentActivity: analytics.recentActivity,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `link-analytics-${teamId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Analytics data exported successfully");
    } catch (error) {
      toast.error("Failed to export analytics data");
    }
  };

  // Get domain from URL for display
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  // Format time ago
  const timeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
          <p className="text-muted-foreground">
            Analytics data will appear here once team members start using links.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Link Analytics</h2>
          <p className="text-muted-foreground">
            Usage insights and statistics for your team's links
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Date Range Selector */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Button */}
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalLinks}</div>
            <p className="text-xs text-muted-foreground">
              Active links in your collection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accesses</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalAccesses}</div>
            <p className="text-xs text-muted-foreground">
              Link clicks in the last {dateRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">
              Unique users who accessed links
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Popular Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Most Popular Links</span>
            </CardTitle>
            <CardDescription>
              Links with the highest access count
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.popularLinks.length > 0 ? (
              <div className="space-y-4">
                {analytics.popularLinks.slice(0, 10).map((link, index) => (
                  <div key={link.id} className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{link.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {getDomain(link.url)}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center space-x-2 text-sm">
                        <Eye className="h-3 w-3" />
                        <span className="font-medium">{link.accessCount}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{link.uniqueUsers} users</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No link access data available yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>
              Latest link access activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {analytics.recentActivity.slice(0, 10).map((activity, index) => (
                  <div key={`${activity.linkId}-${index}`} className="flex items-center space-x-4">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {activity.accessedBy.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.title}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>accessed by {activity.accessedBy}</span>
                        <span>•</span>
                        <span>{timeAgo(activity.accessedAt)}</span>
                      </div>
                    </div>

                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No recent activity to display
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Table */}
      {analytics.popularLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Link Statistics</CardTitle>
            <CardDescription>
              Complete breakdown of link performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Link</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead className="text-right">Total Clicks</TableHead>
                  <TableHead className="text-right">Unique Users</TableHead>
                  <TableHead className="text-right">Avg. per User</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.popularLinks.map((link) => {
                  const avgPerUser = link.uniqueUsers > 0 
                    ? (link.accessCount / link.uniqueUsers).toFixed(1)
                    : '0';

                  return (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">
                        <div className="max-w-xs truncate">{link.title}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-muted-foreground">
                          {getDomain(link.url)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{link.accessCount}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {link.uniqueUsers}
                      </TableCell>
                      <TableCell className="text-right">
                        {avgPerUser}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(link.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Loading skeleton component
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Metrics skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="flex items-center space-x-4">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
