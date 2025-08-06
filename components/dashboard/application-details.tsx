// app/teams/[teamId]/applications/[applicationId]/components/ApplicationDetails.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Edit, 
  RefreshCw, 
  Trash2,
  Calendar,
  Activity,
  Shield,
  Users,
  Mail,
  MessageSquare,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Info,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
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
  createdBy: string;
  updatedBy: string;
  
  // Additional ownership fields from Central API
  applicationOwnerName: string | null;
  applicationOwnerEmail: string | null;
  applicationOwnerBand: string | null;
  applicationManagerName: string | null;
  applicationManagerEmail: string | null;
  applicationManagerBand: string | null;
  applicationOwnerLeader1Name: string | null;
  applicationOwnerLeader1Email: string | null;
  applicationOwnerLeader1Band: string | null;
  applicationOwnerLeader2Name: string | null;
  applicationOwnerLeader2Email: string | null;
  applicationOwnerLeader2Band: string | null;
  ownerSvpName: string | null;
  ownerSvpEmail: string | null;
  ownerSvpBand: string | null;
  businessOwnerName: string | null;
  businessOwnerEmail: string | null;
  businessOwnerBand: string | null;
  businessOwnerLeader1Name: string | null;
  businessOwnerLeader1Email: string | null;
  businessOwnerLeader1Band: string | null;
  productionSupportOwnerName: string | null;
  productionSupportOwnerEmail: string | null;
  productionSupportOwnerBand: string | null;
  productionSupportOwnerLeader1Name: string | null;
  productionSupportOwnerLeader1Email: string | null;
  productionSupportOwnerLeader1Band: string | null;
  pmoName: string | null;
  pmoEmail: string | null;
  pmoBand: string | null;
  unitCioName: string | null;
  unitCioEmail: string | null;
  unitCioBand: string | null;
}

interface ApplicationDetailsProps {
  application: Application;
  teamId: string;
  userRole: 'admin' | 'user';
}

export function ApplicationDetails({ application, teamId, userRole }: ApplicationDetailsProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleEdit = () => {
    router.push(`/teams/${teamId}/applications/${application.id}/edit`);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncApplicationWithCentralAPI(application.id, teamId);
      if (result.success) {
        toast.success('Application synced successfully');
        // Refresh the page to show updated data
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to sync application');
      }
    } catch (error) {
      toast.error('Failed to sync application');
    } finally {
      setSyncing(false);
    }
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderOwnershipSection = (title: string, owners: Array<{
    name: string | null;
    email: string | null;
    band: string | null;
  }>) => {
    const validOwners = owners.filter(owner => owner.name);
    
    if (validOwners.length === 0) return null;

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </h4>
        {validOwners.map((owner, index) => (
          <div key={index} className="space-y-1">
            <div className="text-sm font-medium">{owner.name}</div>
            {owner.email && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {owner.email}
              </div>
            )}
            {owner.band && (
              <div className="text-xs text-muted-foreground">
                Band: {owner.band}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Actions */}
      {userRole === 'admin' && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={handleEdit} className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Application
          </Button>
          <Button onClick={handleSync} disabled={syncing} variant="outline" className="gap-2">
            {syncing ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sync with Central API
          </Button>
          <Button 
            onClick={() => setDeleteDialogOpen(true)} 
            variant="destructive" 
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Application
          </Button>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant={getStatusColor(application.status)} className="text-sm">
                {application.status}
              </Badge>
              {application.lifeCycleStatus && (
                <div className="text-sm text-muted-foreground">
                  Lifecycle: {application.lifeCycleStatus}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Identifiers</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Asset ID:</span> 
                <span className="font-mono ml-1">{application.assetId}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Short ID:</span> 
                <span className="font-mono ml-1">{application.tla}</span>
              </div>
              {application.tier && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Tier:</span> 
                  <span className="ml-1">{application.tier}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Central API Sync</CardTitle>
            {getSyncStatusIcon()}
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-sm font-medium capitalize">
                {application.centralApiSyncStatus || 'Unknown'}
              </div>
              <div className="text-xs text-muted-foreground">
                Last sync: {application.lastCentralApiSync ? formatDate(application.lastCentralApiSync) : 'Never'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Application Name</div>
              <div className="text-base font-medium break-words">{application.applicationName}</div>
            </div>

            {application.description && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Description</div>
                <div className="text-sm whitespace-pre-wrap">{application.description}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Asset ID</div>
                <div className="font-mono text-sm">{application.assetId}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Short Identifier</div>
                <div className="font-mono text-sm">{application.tla}</div>
              </div>
            </div>

            {application.tier && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Tier (BIA Tier)</div>
                <Badge variant="outline">{application.tier}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leadership */}
        {(application.vpName || application.directorName) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Leadership (from Central API)
              </CardTitle>
              <CardDescription>
                Automatically populated from Central API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.vpName && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">VP (Production Support Owner Leader 1)</div>
                  <div className="text-sm font-medium break-words">{application.vpName}</div>
                  {application.vpEmail && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" />
                      <span className="break-all">{application.vpEmail}</span>
                    </div>
                  )}
                </div>
              )}
              
              {application.directorName && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Director (Production Support Owner)</div>
                  <div className="text-sm font-medium break-words">{application.directorName}</div>
                  {application.directorEmail && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" />
                      <span className="break-all">{application.directorEmail}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        {(application.escalationEmail || application.contactEmail || application.teamEmail) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>
                Additional contact emails for support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {application.escalationEmail && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Escalation Email</div>
                  <div className="text-sm break-all">{application.escalationEmail}</div>
                </div>
              )}
              
              {application.contactEmail && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Contact Email</div>
                  <div className="text-sm break-all">{application.contactEmail}</div>
                </div>
              )}
              
              {application.teamEmail && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Team Email</div>
                  <div className="text-sm break-all">{application.teamEmail}</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Additional Information */}
        {(application.snowGroup || application.slackChannel) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {application.snowGroup && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">SNOW Group</div>
                  <div className="text-sm break-words">{application.snowGroup}</div>
                </div>
              )}
              
              {application.slackChannel && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Slack Channel</div>
                  <div className="text-sm flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span className="break-words">{application.slackChannel}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Ownership Information from Central API */}
      {(application.applicationOwnerName || application.businessOwnerName || application.productionSupportOwnerName) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Detailed Ownership (Central API)
            </CardTitle>
            <CardDescription>
              Complete ownership information from Central API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {renderOwnershipSection("Application Owners", [
                {
                  name: application.applicationOwnerName,
                  email: application.applicationOwnerEmail,
                  band: application.applicationOwnerBand,
                },
                {
                  name: application.applicationManagerName,
                  email: application.applicationManagerEmail,
                  band: application.applicationManagerBand,
                },
              ])}

              {renderOwnershipSection("Application Owner Leaders", [
                {
                  name: application.applicationOwnerLeader1Name,
                  email: application.applicationOwnerLeader1Email,
                  band: application.applicationOwnerLeader1Band,
                },
                {
                  name: application.applicationOwnerLeader2Name,
                  email: application.applicationOwnerLeader2Email,
                  band: application.applicationOwnerLeader2Band,
                },
                {
                  name: application.ownerSvpName,
                  email: application.ownerSvpEmail,
                  band: application.ownerSvpBand,
                },
              ])}

              {renderOwnershipSection("Business Owners", [
                {
                  name: application.businessOwnerName,
                  email: application.businessOwnerEmail,
                  band: application.businessOwnerBand,
                },
                {
                  name: application.businessOwnerLeader1Name,
                  email: application.businessOwnerLeader1Email,
                  band: application.businessOwnerLeader1Band,
                },
              ])}

              {renderOwnershipSection("Production Support", [
                {
                  name: application.productionSupportOwnerName,
                  email: application.productionSupportOwnerEmail,
                  band: application.productionSupportOwnerBand,
                },
                {
                  name: application.productionSupportOwnerLeader1Name,
                  email: application.productionSupportOwnerLeader1Email,
                  band: application.productionSupportOwnerLeader1Band,
                },
              ])}

              {renderOwnershipSection("PMO & CIO", [
                {
                  name: application.pmoName,
                  email: application.pmoEmail,
                  band: application.pmoBand,
                },
                {
                  name: application.unitCioName,
                  email: application.unitCioEmail,
                  band: application.unitCioBand,
                },
              ])}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Audit Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Created</div>
              <div className="text-sm">{formatDate(application.createdAt)}</div>
              <div className="text-xs text-muted-foreground break-words">by {application.createdBy}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
              <div className="text-sm">{formatDate(application.updatedAt)}</div>
              <div className="text-xs text-muted-foreground break-words">by {application.updatedBy}</div>
            </div>
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}
