// app/teams/components/AddApplicationDialog.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { addApplicationToTeam, fetchFromCentralAPI } from '@/app/actions/teams/teams';

interface AddApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
}

interface CentralAPIData {
  name: string;
  assetId: number;
  lifeCycleStatus: string;
  risk: {
    bia: string;
  };
  ownershipInfo: {
    productionSupportOwner?: {
      email: string;
      fullName: string;
      band: string;
    };
    productionSupportOwnerLeader1?: {
      email: string;
      fullName: string;
      band: string;
    };
    applicationOwner?: {
      email: string;
      fullName: string;
      band: string;
    };
  };
}

export function AddApplicationDialog({ open, onOpenChange, teamId }: AddApplicationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingCentral, setFetchingCentral] = useState(false);
  const [centralData, setCentralData] = useState<CentralAPIData | null>(null);
  const [centralError, setCentralError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    assetId: '',
    applicationName: '',
    tla: '', // Using tla internally
    escalationEmail: '',
    contactEmail: '',
    teamEmail: '',
    snowGroup: '',
    slackChannel: '',
    description: '',
  });

  const handleFetchCentralData = async () => {
    if (!formData.assetId) {
      toast.error('Please enter an Asset ID');
      return;
    }

    setFetchingCentral(true);
    setCentralError(null);
    
    try {
      const result = await fetchFromCentralAPI(parseInt(formData.assetId));
      if (result.success && result.data) {
        setCentralData(result.data);
        // Pre-fill form with central API data
        setFormData(prev => ({
          ...prev,
          applicationName: result.data.name || prev.applicationName,
        }));
        toast.success('Data fetched from Central API');
      } else {
        setCentralError(result.error || 'Failed to fetch data');
        toast.error(result.error || 'Failed to fetch from Central API');
      }
    } catch (error) {
      setCentralError('Failed to fetch data');
      toast.error('Failed to fetch from Central API');
    } finally {
      setFetchingCentral(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!centralData) {
      toast.error('Please fetch data from Central API first');
      return;
    }

    setLoading(true);

    try {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('teamId', teamId);
      formDataToSubmit.append('assetId', formData.assetId);
      formDataToSubmit.append('applicationName', formData.applicationName);
      formDataToSubmit.append('tla', formData.tla); // Using tla internally
      formDataToSubmit.append('escalationEmail', formData.escalationEmail);
      formDataToSubmit.append('contactEmail', formData.contactEmail);
      formDataToSubmit.append('teamEmail', formData.teamEmail);
      formDataToSubmit.append('snowGroup', formData.snowGroup);
      formDataToSubmit.append('slackChannel', formData.slackChannel);
      formDataToSubmit.append('description', formData.description);

      const result = await addApplicationToTeam(formDataToSubmit);

      if (result.success) {
        toast.success('Application added successfully');
        onOpenChange(false);
        // Reset form
        setFormData({
          assetId: '',
          applicationName: '',
          tla: '', // Using tla internally
          escalationEmail: '',
          contactEmail: '',
          teamEmail: '',
          snowGroup: '',
          slackChannel: '',
          description: '',
        });
        setCentralData(null);
        setCentralError(null);
      } else {
        toast.error(result.error || 'Failed to add application');
      }
    } catch (error) {
      toast.error('Failed to add application');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Application</DialogTitle>
          <DialogDescription>
            Add a new application to your team. Enter the Asset ID to fetch data from Central API.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Central API Fetch Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Asset ID Lookup</CardTitle>
              <CardDescription>
                Enter the Asset ID to automatically fetch application data from Central API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="assetId">Asset ID *</Label>
                  <Input
                    id="assetId"
                    type="number"
                    placeholder="e.g., 200004789"
                    value={formData.assetId}
                    onChange={(e) => handleInputChange('assetId', e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    type="button" 
                    onClick={handleFetchCentralData}
                    disabled={fetchingCentral || !formData.assetId}
                    className="gap-2"
                  >
                    {fetchingCentral ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Fetch Data
                  </Button>
                </div>
              </div>

              {/* Central API Response */}
              {centralData && (
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">
                      Data Retrieved Successfully
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Application:</span> {centralData.name}
                    </div>
                    <div>
                      <span className="font-medium">Lifecycle:</span> {centralData.lifeCycleStatus}
                    </div>
                    <div>
                      <span className="font-medium">BIA Tier (Tier):</span> {centralData.risk.bia}
                    </div>
                    <div>
                      <span className="font-medium">Asset ID:</span> {centralData.assetId}
                    </div>
                  </div>
                  
                  {/* Show VP/Director mapping */}
                  <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                    <div className="text-sm font-medium mb-2 text-green-800 dark:text-green-200">
                      Leadership (Auto-populated):
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      {centralData.ownershipInfo.productionSupportOwnerLeader1 && (
                        <div>
                          <span className="font-medium">VP:</span> {centralData.ownershipInfo.productionSupportOwnerLeader1.fullName}
                        </div>
                      )}
                      {centralData.ownershipInfo.productionSupportOwner && (
                        <div>
                          <span className="font-medium">Director:</span> {centralData.ownershipInfo.productionSupportOwner.fullName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {centralError && (
                <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-800 dark:text-red-200">
                      {centralError}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Details</CardTitle>
              <CardDescription>
                Basic application information (editable fields)
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="applicationName">Application Name *</Label>
                <Input
                  id="applicationName"
                  placeholder="Application name"
                  value={formData.applicationName}
                  onChange={(e) => handleInputChange('applicationName', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="tla">Short Identifier *</Label> {/* UI shows "Short Identifier" */}
                <Input
                  id="tla" // But uses tla internally
                  placeholder="e.g., PST-BATCH, MAIN-TOOL"
                  maxLength={12}
                  value={formData.tla}
                  onChange={(e) => handleInputChange('tla', e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Up to 12 characters - used for UI display and identification
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
              <CardDescription>
                Additional contact emails for escalation, support, and team communications
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="escalationEmail">Escalation Email</Label>
                <Input
                  id="escalationEmail"
                  type="email"
                  placeholder="escalation@company.com"
                  value={formData.escalationEmail}
                  onChange={(e) => handleInputChange('escalationEmail', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="contact@company.com"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="teamEmail">Team Email</Label>
                <Input
                  id="teamEmail"
                  type="email"
                  placeholder="team@company.com"
                  value={formData.teamEmail}
                  onChange={(e) => handleInputChange('teamEmail', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="slackChannel">Slack Channel</Label>
                <Input
                  id="slackChannel"
                  placeholder="#team-channel"
                  value={formData.slackChannel}
                  onChange={(e) => handleInputChange('slackChannel', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="snowGroup">SNOW Group</Label>
                <Input
                  id="snowGroup"
                  placeholder="ServiceNow group"
                  value={formData.snowGroup}
                  onChange={(e) => handleInputChange('snowGroup', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Application description and notes"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !centralData}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Application'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
