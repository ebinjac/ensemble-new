// app/teams/components/ApplicationCard.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  MoreHorizontal, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Eye,
  Mail, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Users,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { syncApplicationWithCentralAPI } from '@/app/actions/teams/teams';
import { DeleteApplicationDialog } from '@/components/dashboard/delete-application-dialog';

interface Application {
  id: string;
  assetId: number;
  applicationName: string;
  tla: string;
  tier: string | null;
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

interface ApplicationCardProps {
  application: Application;
  teamId: string;
  userRole: 'admin' | 'user';
}

export function ApplicationCard({ application, teamId, userRole }: ApplicationCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncApplicationWithCentralAPI(application.id, teamId);
      if (result.success) {
        toast.success('Application synced successfully');
      } else {
        toast.error(result.error || 'Failed to sync application');
      }
    } catch (error) {
      toast.error('Failed to sync application');
    } finally {
      setSyncing(false);
    }
  };

  const handleViewDetails = () => {
    router.push(`/teams/${teamId}/applications/${application.id}`);
  };

  const handleEdit = () => {
    router.push(`/teams/${teamId}/applications/${application.id}/edit`);
  };

  const getSyncStatusIcon = () => {
    switch (application.centralApiSyncStatus) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <TooltipProvider>
      <Card className="h-full">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              {/* Application Name with proper truncation - FIXED */}
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h3 className="font-semibold text-lg leading-tight line-clamp-2 cursor-help">
                        {application.applicationName}
                      </h3>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p>{application.applicationName}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Badge variant={getStatusColor(application.status)} className="shrink-0 mt-0.5">
                  {application.status}
                </Badge>
              </div>
              
              {/* Identifiers */}
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <Badge variant="outline" className="font-mono shrink-0">
                  {application.assetId}
                </Badge>
                <Badge variant="secondary" className="font-mono shrink-0">
                  {application.tla}
                </Badge>
                {application.tier && (
                  <Badge variant="outline" className="shrink-0">
                    {application.tier}
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleViewDetails}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {userRole === 'admin' && (
                  <>
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Application
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSync} disabled={syncing}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                      Sync with Central API
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Application
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* Lifecycle Status */}
          {application.lifeCycleStatus && (
            <div className="text-sm">
              <span className="text-muted-foreground">Status: </span>
              <span className="font-medium">{application.lifeCycleStatus}</span>
            </div>
          )}

          {/* Description - with line clamp */}
          {application.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {application.description}
            </p>
          )}

          {/* Key Contacts */}
          {(application.vpName || application.directorName) && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-md">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Leadership
              </div>
              
              {application.vpName && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground shrink-0">VP:</span>
                  <div className="flex items-center gap-1 min-w-0 ml-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="truncate font-medium cursor-help">
                          {application.vpName}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{application.vpName}</p>
                        {application.vpEmail && <p>{application.vpEmail}</p>}
                      </TooltipContent>
                    </Tooltip>
                    {application.vpEmail && (
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 shrink-0">
                        <Mail className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {application.directorName && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground shrink-0">Director:</span>
                  <div className="flex items-center gap-1 min-w-0 ml-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="truncate font-medium cursor-help">
                          {application.directorName}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{application.directorName}</p>
                        {application.directorEmail && <p>{application.directorEmail}</p>}
                      </TooltipContent>
                    </Tooltip>
                    {application.directorEmail && (
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 shrink-0">
                        <Mail className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact Methods */}
          {(application.escalationEmail || application.contactEmail || application.teamEmail || application.slackChannel) && (
            <div className="flex flex-wrap gap-1">
              {application.escalationEmail && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs cursor-help">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Escalation
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{application.escalationEmail}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {application.contactEmail && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs cursor-help">
                      <Mail className="h-3 w-3 mr-1" />
                      Contact
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{application.contactEmail}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {application.teamEmail && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs cursor-help">
                      <Users className="h-3 w-3 mr-1" />
                      Team
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{application.teamEmail}</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {application.slackChannel && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs cursor-help">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Slack
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{application.slackChannel}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              {getSyncStatusIcon()}
              <span>Central API</span>
            </div>
            <span>{formatDate(application.updatedAt)}</span>
          </div>
        </CardContent>

        {/* Delete Dialog */}
        <DeleteApplicationDialog 
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          application={{
            id: application.id,
            carId: application.assetId.toString(),
            applicationName: application.applicationName,
            tla: application.tla,
          }}
          teamId={teamId}
        />
      </Card>
    </TooltipProvider>
  );
}
