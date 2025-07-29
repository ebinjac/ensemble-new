// app/components/link-manager/AnalyticsView.tsx
'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, TrendingUp, Users, Lock, Pin, Eye, 
  Calendar, Globe, Building2
} from 'lucide-react';

interface AnalyticsViewProps {
  teamId: string;
  linkCounts: Record<string, number>;
}

export function AnalyticsView({ teamId, linkCounts }: AnalyticsViewProps) {
  const [loading, setLoading] = useState(false);

  const totalLinks = linkCounts.all || 0;
  const privateLinks = linkCounts.private || 0;
  const teamLinks = linkCounts.team || 0;
  const pinnedLinks = linkCounts.pinned || 0;
  const archivedLinks = linkCounts.archived || 0;
  const brokenLinks = linkCounts.broken || 0;

  const stats = [
    {
      title: 'Total Links',
      value: totalLinks,
      icon: BarChart3,
      description: 'All links in your team',
      color: 'text-primary'
    },
    {
      title: 'Public Links',
      value: teamLinks,
      icon: Users,
      description: 'Shared with team',
      color: 'text-green-500 dark:text-green-400'
    },
    {
      title: 'Private Links',
      value: privateLinks,
      icon: Lock,
      description: 'Only visible to you',
      color: 'text-orange-500 dark:text-orange-400'
    },
    {
      title: 'Pinned Links',
      value: pinnedLinks,
      icon: Pin,
      description: 'Priority links',
      color: 'text-blue-500 dark:text-blue-400'
    },
    {
      title: 'Archived Links',
      value: archivedLinks,
      icon: Calendar,
      description: 'Archived items',
      color: 'text-yellow-500 dark:text-yellow-400'
    },
    {
      title: 'Broken Links',
      value: brokenLinks,
      icon: Globe,
      description: 'Need attention',
      color: 'text-destructive'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Link Analytics</h2>
        <p className="text-muted-foreground">Overview of your team's link usage and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Link Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Link Distribution
          </CardTitle>
          <CardDescription>
            Breakdown of link types in your team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {totalLinks > 0 ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm font-medium">Public Links</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{teamLinks}</span>
                    <Badge variant="secondary">
                      {Math.round((teamLinks / totalLinks) * 100)}%
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={(teamLinks / totalLinks) * 100} 
                  className="h-2 bg-muted"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                    <span className="text-sm font-medium">Private Links</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{privateLinks}</span>
                    <Badge variant="secondary">
                      {Math.round((privateLinks / totalLinks) * 100)}%
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={(privateLinks / totalLinks) * 100} 
                  className="h-2 bg-muted"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pin className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    <span className="text-sm font-medium">Pinned Links</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{pinnedLinks}</span>
                    <Badge variant="secondary">
                      {Math.round((pinnedLinks / totalLinks) * 100)}%
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={(pinnedLinks / totalLinks) * 100} 
                  className="h-2 bg-muted"
                />
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No links available for analysis</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Status */}
      {(archivedLinks > 0 || brokenLinks > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Link Health
            </CardTitle>
            <CardDescription>
              Links that may need attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {brokenLinks > 0 && (
              <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">Broken Links</span>
                </div>
                <Badge variant="destructive">{brokenLinks}</Badge>
              </div>
            )}
            
            {archivedLinks > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-100 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-medium">Archived Links</span>
                </div>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-800">
                  {archivedLinks}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
