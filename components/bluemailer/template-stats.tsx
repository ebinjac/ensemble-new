'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  FileText, 
  Users, 
  TrendingUp, 
  Clock,
  Target,
  Activity,
  Zap
} from 'lucide-react';
import type { EmailTemplate } from '@/db/schema/bluemailer';
import type { TeamApplication } from '@/app/types/bluemailer';

interface TemplateStatsProps {
  templates: EmailTemplate[];
  applications: TeamApplication[];
}

export function TemplateStats({ templates, applications }: TemplateStatsProps) {
  // Calculate statistics
  const totalTemplates = templates.length;
  const activeTemplates = templates.filter(t => t.status === 'active').length;
  const draftTemplates = templates.filter(t => t.status === 'draft').length;
  const totalUsage = templates.reduce((sum, t) => sum + (t.usageCount || 0), 0);
  
  // Recent activity (templates updated in the last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentlyUpdated = templates.filter(t => 
    new Date(t.updatedAt) > sevenDaysAgo
  ).length;

  // Category breakdown
  const categoryStats = templates.reduce((acc, template) => {
    acc[template.category] = (acc[template.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Most used template
  const mostUsedTemplate = templates.reduce((prev, current) => 
    (current.usageCount || 0) > (prev.usageCount || 0) ? current : prev,
    templates[0]
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'newsletter': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'promotional': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'transactional': return 'bg-green-100 text-green-800 border-green-200';
      case 'onboarding': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'notification': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'announcement': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'custom': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (totalTemplates === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No templates yet. Create your first template to see statistics.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Templates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTemplates}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
            <span>{activeTemplates} active</span>
            <span>•</span>
            <span>{draftTemplates} draft</span>
          </div>
        </CardContent>
      </Card>

      {/* Total Usage */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsage}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {totalUsage > 0 ? `${(totalUsage / totalTemplates).toFixed(1)} avg per template` : 'No usage yet'}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{recentlyUpdated}</div>
          <div className="text-xs text-muted-foreground mt-1">
            updated in last 7 days
          </div>
        </CardContent>
      </Card>

      {/* Applications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Applications</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{applications.length}</div>
          <div className="text-xs text-muted-foreground mt-1">
            available for tagging
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {Object.keys(categoryStats).length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Templates by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryStats)
                .sort(([,a], [,b]) => b - a)
                .map(([category, count]) => (
                  <Badge 
                    key={category} 
                    variant="outline" 
                    className={getCategoryColor(category)}
                  >
                    {category} ({count})
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Most Used Template */}
      {mostUsedTemplate && (mostUsedTemplate.usageCount || 0) > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Most Popular Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium truncate">{mostUsedTemplate.name}</div>
                <Badge variant="secondary">
                  {mostUsedTemplate.usageCount} uses
                </Badge>
              </div>
              {mostUsedTemplate.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {mostUsedTemplate.description}
                </p>
              )}
              <div className="flex items-center space-x-2">
                <Badge className={getCategoryColor(mostUsedTemplate.category)} variant="outline">
                  {mostUsedTemplate.category}
                </Badge>
                <Badge variant={mostUsedTemplate.status === 'active' ? 'default' : 'secondary'}>
                  {mostUsedTemplate.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
