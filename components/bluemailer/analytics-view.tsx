'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Mail,
  Send,
  Eye,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { EmailVolumeChart } from '@/components/bluemailer/charts/email-volume-chart';
import { TemplateUsageChart } from '@/components/bluemailer/charts/template-usage-chart';

interface AnalyticsData {
  emailAnalytics: {
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalFailed: number;
    totalBounced: number;
    totalQueued: number;
    deliveryRate: number;
    openRate: number;
    failureRate: number;
    bounceRate: number;
    emailsOverTime: Array<{
      date: string;
      sent: number;
      delivered: number;
      failed: number;
      opened: number;
    }>;
    topPerformingEmails: Array<{
      id: string;
      subject: string;
      sentAt: Date;
      recipients: number;
      openCount: number;
      openRate: number;
    }>;
    recentEmails: Array<{
      id: string;
      subject: string;
      status: string;
      recipients: number;
      createdAt: Date;
      sentAt: Date | null;
    }>;
  };
  templateAnalytics: {
    totalTemplates: number;
    totalUsage: number;
    averageUsage: number;
    topTemplates: Array<{
      id: string;
      name: string;
      category: string;
      usageCount: number;
      emailsSent: number;
      totalRecipients: number;
      totalOpens: number;
      openRate: number;
    }>;
    categoryBreakdown: Array<{
      category: string;
      count: number;
      percentage: number;
    }>;
    templateGrowth: Array<{
      month: string;
      count: number;
    }>;
  };
}

interface AnalyticsViewProps {
  teamId: string;
  emailAnalytics: AnalyticsData['emailAnalytics'];
  templateAnalytics: AnalyticsData['templateAnalytics'];
  dateRange: {
    startDate: Date;
    endDate: Date;
    period: string;
  };
}

const periodOptions = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 3 months' },
  { value: '365d', label: 'Last year' },
];

export function AnalyticsView({
  teamId,
  emailAnalytics,
  templateAnalytics,
  dateRange
}: AnalyticsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPeriod, setSelectedPeriod] = useState(dateRange.period);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const params = new URLSearchParams(searchParams);
    params.set('period', period);
    router.push(`?${params.toString()}`);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'bounced':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Mail className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'bounced':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'queued':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {format(dateRange.startDate, 'MMM d, yyyy')} - {format(dateRange.endDate, 'MMM d, yyyy')}
          </span>
        </div>
        
        <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Sent"
          value={formatNumber(emailAnalytics.totalSent)}
          icon={<Send className="h-5 w-5" />}
          subtitle={`${emailAnalytics.totalQueued} queued`}
        />
        <MetricCard
          title="Delivery Rate"
          value={formatPercentage(emailAnalytics.deliveryRate)}
          icon={<CheckCircle className="h-5 w-5" />}
          subtitle={`${emailAnalytics.totalDelivered} delivered`}
        />
        <MetricCard
          title="Open Rate"
          value={formatPercentage(emailAnalytics.openRate)}
          icon={<Eye className="h-5 w-5" />}
          subtitle={`${formatNumber(emailAnalytics.totalOpened)} opens`}
        />
        <MetricCard
          title="Failure Rate"
          value={formatPercentage(emailAnalytics.failureRate)}
          icon={<AlertCircle className="h-5 w-5" />}
          subtitle={`${emailAnalytics.totalFailed} failed`}
        />
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Email Overview</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email Volume Over Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Email Volume</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EmailVolumeChart data={emailAnalytics.emailsOverTime} />
              </CardContent>
            </Card>

            {/* Email Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Email Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Delivered</span>
                    </span>
                    <span className="font-medium">{formatNumber(emailAnalytics.totalDelivered)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span>Failed</span>
                    </span>
                    <span className="font-medium">{formatNumber(emailAnalytics.totalFailed)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <span>Bounced</span>
                    </span>
                    <span className="font-medium">{formatNumber(emailAnalytics.totalBounced)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span>Queued</span>
                    </span>
                    <span className="font-medium">{formatNumber(emailAnalytics.totalQueued)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Emails */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Top Performing Emails</span>
                </div>
                <Button variant="outline" size="sm">View All</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emailAnalytics.topPerformingEmails.map((email, index) => (
                  <div key={email.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{email.subject}</h4>
                        <p className="text-sm text-gray-500">
                          {email.sentAt ? formatDistanceToNow(new Date(email.sentAt), { addSuffix: true }) : 'Not sent'} • {email.recipients} recipients
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-green-600">
                          {email.openCount}
                        </div>
                        <div className="text-gray-500">Opens</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-blue-600">
                          {formatPercentage(email.openRate)}
                        </div>
                        <div className="text-gray-500">Open Rate</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Email Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Recent Email Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {emailAnalytics.recentEmails.map((email) => (
                  <div key={email.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(email.status)}
                      <div>
                        <p className="font-medium text-sm">{email.subject}</p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(email.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(email.status)} variant="outline">
                        {email.status}
                      </Badge>
                      <span className="text-sm text-gray-500">{email.recipients} recipients</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          {/* Template Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Templates"
              value={templateAnalytics.totalTemplates.toString()}
              icon={<Mail className="h-5 w-5" />}
              subtitle="active templates"
            />
            <MetricCard
              title="Total Usage"
              value={formatNumber(templateAnalytics.totalUsage)}
              icon={<Send className="h-5 w-5" />}
              subtitle="emails sent"
            />
            <MetricCard
              title="Avg. Usage"
              value={templateAnalytics.averageUsage.toFixed(1)}
              icon={<TrendingUp className="h-5 w-5" />}
              subtitle="per template"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Template Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Template Usage</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TemplateUsageChart data={templateAnalytics.topTemplates} />
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Template Categories</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templateAnalytics.categoryBreakdown.map((category) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="capitalize">{category.category}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{category.count} templates</span>
                        <Badge variant="outline">{formatPercentage(category.percentage)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Templates Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Template Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templateAnalytics.topTemplates.map((template, index) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-green-600">#{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-500 capitalize">{template.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{template.usageCount}</div>
                        <div className="text-gray-500">Usage</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{template.emailsSent}</div>
                        <div className="text-gray-500">Emails</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{template.totalOpens}</div>
                        <div className="text-gray-500">Opens</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-blue-600">{formatPercentage(template.openRate)}</div>
                        <div className="text-gray-500">Open Rate</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* Performance Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Success Rate"
              value={formatPercentage(emailAnalytics.deliveryRate)}
              icon={<CheckCircle className="h-5 w-5" />}
              subtitle="delivery success"
            />
            <MetricCard
              title="Bounce Rate"
              value={formatPercentage(emailAnalytics.bounceRate)}
              icon={<AlertCircle className="h-5 w-5" />}
              subtitle="bounced emails"
            />
            <MetricCard
              title="Failure Rate"
              value={formatPercentage(emailAnalytics.failureRate)}
              icon={<XCircle className="h-5 w-5" />}
              subtitle="failed deliveries"
            />
            <MetricCard
              title="Open Rate"
              value={formatPercentage(emailAnalytics.openRate)}
              icon={<Eye className="h-5 w-5" />}
              subtitle="email opens"
            />
          </div>

          {/* Detailed Performance Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Email Delivery</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Delivered</span>
                      </span>
                      <span className="font-medium">{formatNumber(emailAnalytics.totalDelivered)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center space-x-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span>Failed</span>
                      </span>
                      <span className="font-medium">{formatNumber(emailAnalytics.totalFailed)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <span>Bounced</span>
                      </span>
                      <span className="font-medium">{formatNumber(emailAnalytics.totalBounced)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Engagement Performance</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center space-x-2">
                        <Send className="h-4 w-4 text-blue-600" />
                        <span>Total Sent</span>
                      </span>
                      <span className="font-medium">{formatNumber(emailAnalytics.totalSent)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center space-x-2">
                        <Eye className="h-4 w-4 text-green-600" />
                        <span>Total Opens</span>
                      </span>
                      <span className="font-medium">{formatNumber(emailAnalytics.totalOpened)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <span>Open Rate</span>
                      </span>
                      <span className="font-medium">{formatPercentage(emailAnalytics.openRate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
}

function MetricCard({ title, value, icon, subtitle }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
