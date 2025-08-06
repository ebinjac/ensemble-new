// app/teams/components/EditApplicationDialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  tla: string; // Using tla internally
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

interface EditApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application;
  teamId: string;
}

export function EditApplicationDialog({ open, onOpenChange, application, teamId }: EditApplicationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    applicationName: '',
    tla: '', // Using tla internally
    escalationEmail: '',
    contactEmail: '',
    teamEmail: '',
    snowGroup: '',
    slackChannel: '',
    description: '',
  });

  // Initialize form data when dialog opens
  useEffect(() => {
    if (open && application) {
      setFormData({
        applicationName: application.applicationName || '',
        tla: application.tla || '', // Using tla internally
        escalationEmail: application.escalationEmail || '',
        contactEmail: application.contactEmail || '',
        teamEmail: application.teamEmail || '',
        snowGroup: application.snowGroup || '',
        slackChannel: application.slackChannel || '',
        description: application.description || '',
      });
    }
  }, [open, application]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('id', application.id);
      formDataToSubmit.append('teamId', teamId);
      formDataToSubmit.append('assetId', application.assetId.toString());
      formDataToSubmit.append('applicationName', formData.applicationName);
      formDataToSubmit.append('tla', formData.tla); // Using tla internally
      formDataToSubmit.append('escalationEmail', formData.escalationEmail);
      formDataToSubmit.append('contactEmail', formData.contactEmail);
      formDataToSubmit.append('teamEmail', formData.teamEmail);
      formDataToSubmit.append('snowGroup', formData.snowGroup);
      formDataToSubmit.append('slackChannel', formData.slackChannel);
      formDataToSubmit.append('description', formData.description);

      const result = await updateApplication(formDataToSubmit);

      if (result.success) {
        toast.success('Application updated successfully');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to update application');
      }
    } catch (error) {
      toast.error('Failed to update application');
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
          <DialogTitle>Edit Application</DialogTitle>
          <DialogDescription>
            Update the application details for {application.applicationName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Read-only Central API Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                Central API Information (Read-only)
              </CardTitle>
              <CardDescription>
                This information is automatically populated from Central API and cannot be edited manually
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Asset ID</Label>
                <p className="text-sm font-mono bg-muted p-2 rounded border">
                  {application.assetId}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Tier (BIA Tier)</Label>
                <p className="text-sm bg-muted p-2 rounded border">
                  {application.tier || 'Not available'}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Lifecycle Status</Label>
                <p className="text-sm bg-muted p-2 rounded border">
                  {application.lifeCycleStatus || 'Not available'}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">VP (Production Support Owner Leader 1)</Label>
                <p className="text-sm bg-muted p-2 rounded border">
                  {application.vpName || 'Not available'}
                </p>
              </div>
              <div className="col-span-2">
                <Label className="text-muted-foreground">Director (Production Support Owner)</Label>
                <p className="text-sm bg-muted p-2 rounded border">
                  {application.directorName || 'Not available'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Editable Application Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Editable Application Details</CardTitle>
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
            <Button type="submit" disabled={loading}>
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
