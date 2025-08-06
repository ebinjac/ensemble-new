// app/teams/[teamId]/applications/[applicationId]/edit/components/EditApplicationForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { updateApplication } from '@/app/actions/teams/teams';

interface Application {
  id: string;
  assetId: number;
  applicationName: string;
  tla: string;
  tier: string | null;
  lifeCycleStatus: string | null;
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
}

interface EditApplicationFormProps {
  teamId: string;
  application: Application;
}

export function EditApplicationForm({ teamId, application }: EditApplicationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    applicationName: '',
    tla: '',
    escalationEmail: '',
    contactEmail: '',
    teamEmail: '',
    snowGroup: '',
    slackChannel: '',
    description: '',
  });

  // Initialize form data when component mounts
  useEffect(() => {
    setFormData({
      applicationName: application.applicationName || '',
      tla: application.tla || '',
      escalationEmail: application.escalationEmail || '',
      contactEmail: application.contactEmail || '',
      teamEmail: application.teamEmail || '',
      snowGroup: application.snowGroup || '',
      slackChannel: application.slackChannel || '',
      description: application.description || '',
    });
  }, [application]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('id', application.id);
      formDataToSubmit.append('teamId', teamId);
      formDataToSubmit.append('assetId', application.assetId.toString());
      formDataToSubmit.append('applicationName', formData.applicationName);
      formDataToSubmit.append('tla', formData.tla);
      formDataToSubmit.append('escalationEmail', formData.escalationEmail);
      formDataToSubmit.append('contactEmail', formData.contactEmail);
      formDataToSubmit.append('teamEmail', formData.teamEmail);
      formDataToSubmit.append('snowGroup', formData.snowGroup);
      formDataToSubmit.append('slackChannel', formData.slackChannel);
      formDataToSubmit.append('description', formData.description);

      const result = await updateApplication(formDataToSubmit);

      if (result.success) {
        toast.success('Application updated successfully');
        router.push(`/teams/${teamId}/applications/${application.id}`);
      } else {
        toast.error(result.error || 'Failed to update application');
      }
    } catch (error) {
      toast.error('Failed to update application');
      console.error('Update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    router.push(`/teams/${teamId}/applications/${application.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Read-only Central API Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5" />
            Central API Information (Read-only)
          </CardTitle>
          <CardDescription>
            This information is automatically populated from Central API and cannot be edited manually. 
            Use the "Sync with Central API" button to update this data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Asset ID</Label>
              <div className="px-3 py-2 bg-muted rounded-md font-mono text-sm">
                {application.assetId}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Tier (BIA Tier)</Label>
              <div className="px-3 py-2 bg-muted rounded-md text-sm">
                {application.tier || 'Not available'}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Lifecycle Status</Label>
              <div className="px-3 py-2 bg-muted rounded-md text-sm">
                {application.lifeCycleStatus || 'Not available'}
              </div>
            </div>
          </div>

          {/* Leadership Information */}
          {(application.vpName || application.directorName) && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">Leadership Information</div>
              
              {application.vpName && (
                <div>
                  <Label className="text-muted-foreground text-xs">VP (Production Support Owner Leader 1)</Label>
                  <div className="px-3 py-2 bg-muted rounded-md text-sm break-words">
                    {application.vpName}
                    {application.vpEmail && (
                      <div className="text-xs text-muted-foreground mt-1 break-all">
                        {application.vpEmail}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {application.directorName && (
                <div>
                  <Label className="text-muted-foreground text-xs">Director (Production Support Owner)</Label>
                  <div className="px-3 py-2 bg-muted rounded-md text-sm break-words">
                    {application.directorName}
                    {application.directorEmail && (
                      <div className="text-xs text-muted-foreground mt-1 break-all">
                        {application.directorEmail}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editable Application Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Editable Application Details</CardTitle>
          <CardDescription>
            These fields can be modified and will be saved to the database
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
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="tla">Short Identifier *</Label>
            <Input
              id="tla"
              placeholder="e.g., PST-BATCH, MAIN-TOOL"
              maxLength={12}
              value={formData.tla}
              onChange={(e) => handleInputChange('tla', e.target.value)}
              required
              className="mt-1"
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
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email for escalating critical issues
            </p>
          </div>

          <div>
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="contact@company.com"
              value={formData.contactEmail}
              onChange={(e) => handleInputChange('contactEmail', e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              General contact email for inquiries
            </p>
          </div>

          <div>
            <Label htmlFor="teamEmail">Team Email</Label>
            <Input
              id="teamEmail"
              type="email"
              placeholder="team@company.com"
              value={formData.teamEmail}
              onChange={(e) => handleInputChange('teamEmail', e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Team distribution list email
            </p>
          </div>

          <div>
            <Label htmlFor="slackChannel">Slack Channel</Label>
            <Input
              id="slackChannel"
              placeholder="#team-channel"
              value={formData.slackChannel}
              onChange={(e) => handleInputChange('slackChannel', e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Team Slack channel for communication
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Information</CardTitle>
          <CardDescription>
            Additional metadata and configuration details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="snowGroup">SNOW Group</Label>
            <Input
              id="snowGroup"
              placeholder="ServiceNow group"
              value={formData.snowGroup}
              onChange={(e) => handleInputChange('snowGroup', e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              ServiceNow support group for this application
            </p>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Application description and notes"
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="mt-1 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Detailed description of the application, its purpose, and any important notes
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleCancel}
          disabled={loading}
          className="min-w-24"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={loading}
          className="min-w-32"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            'Update Application'
          )}
        </Button>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <div className="text-sm">
          <div className="font-medium mb-2">Note about Central API data:</div>
          <ul className="text-muted-foreground space-y-1 list-disc list-inside">
            <li>Asset ID, Tier, Lifecycle Status, and Leadership information cannot be edited manually</li>
            <li>This data is automatically synced from the Central API</li>
            <li>To update Central API data, use the "Sync with Central API" button on the application details page</li>
            <li>Only the fields in the "Editable Application Details" and below sections can be modified</li>
          </ul>
        </div>
      </div>
    </form>
  );
}
