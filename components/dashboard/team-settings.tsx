// app/teams/components/TeamSettings.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Users, 
  Mail, 
  Shield, 
  Edit, 
  Save, 
  X, 
  Check,
  AlertCircle,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { updateTeamSettings } from '@/app/actions/teams/teams';

interface Team {
  id: string;
  teamName: string;
  contactName: string;
  contactEmail: string;
  userGroup: string;
  adminGroup: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface TeamSettingsProps {
  team: Team;
}

export function TeamSettings({ team }: TeamSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    teamName: team.teamName,
    contactName: team.contactName,
    contactEmail: team.contactEmail,
    userGroup: team.userGroup,
    adminGroup: team.adminGroup,
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('teamId', team.id);
      formDataToSubmit.append('teamName', formData.teamName);
      formDataToSubmit.append('contactName', formData.contactName);
      formDataToSubmit.append('contactEmail', formData.contactEmail);
      formDataToSubmit.append('userGroup', formData.userGroup);
      formDataToSubmit.append('adminGroup', formData.adminGroup);

      const result = await updateTeamSettings(formDataToSubmit);

      if (result.success) {
        toast.success('Team settings updated successfully');
        setIsEditing(false);
      } else {
        toast.error(result.error || 'Failed to update team settings');
      }
    } catch (error) {
      toast.error('Failed to update team settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      teamName: team.teamName,
      contactName: team.contactName,
      contactEmail: team.contactEmail,
      userGroup: team.userGroup,
      adminGroup: team.adminGroup,
    });
    setIsEditing(false);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Team Settings</h2>
          <p className="text-muted-foreground">
            Manage your team configuration and access controls
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Settings
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading} className="gap-2">
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-lg border ${
        team.isActive 
          ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' 
          : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
      }`}>
        <div className="flex items-center gap-3">
          {team.isActive ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <div>
            <div className="font-medium">
              Team Status: {team.isActive ? 'Active' : 'Inactive'}
            </div>
            <div className="text-sm text-muted-foreground">
              {team.isActive 
                ? 'Your team is active and applications are accessible'
                : 'Your team is inactive and access is restricted'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Information
          </CardTitle>
          <CardDescription>
            Basic team details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              {isEditing ? (
                <Input
                  id="teamName"
                  value={formData.teamName}
                  onChange={(e) => setFormData(prev => ({ ...prev, teamName: e.target.value }))}
                  placeholder="Enter team name"
                  className="font-medium"
                />
              ) : (
                <div className="px-3 py-2 bg-muted rounded-md font-medium" title={team.teamName}>
                  {team.teamName}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Person</Label>
              {isEditing ? (
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                  placeholder="Enter contact name"
                />
              ) : (
                <div className="px-3 py-2 bg-muted rounded-md" title={team.contactName}>
                  {team.contactName}
                </div>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              {isEditing ? (
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="Enter contact email"
                />
              ) : (
                <div className="px-3 py-2 bg-muted rounded-md flex items-center gap-2" title={team.contactEmail}>
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{team.contactEmail}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Access Control */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Access Control</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="userGroup">User Group</Label>
                  <Badge variant="secondary" className="text-xs">Read Access</Badge>
                </div>
                {isEditing ? (
                  <Input
                    id="userGroup"
                    value={formData.userGroup}
                    onChange={(e) => setFormData(prev => ({ ...prev, userGroup: e.target.value }))}
                    placeholder="Enter AD user group"
                    className="font-mono"
                  />
                ) : (
                  <div className="px-3 py-2 bg-muted rounded-md font-mono text-sm" title={team.userGroup}>
                    <span className="truncate block">{team.userGroup}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Members have read-only access to team applications
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="adminGroup">Admin Group</Label>
                  <Badge variant="destructive" className="text-xs">Full Access</Badge>
                </div>
                {isEditing ? (
                  <Input
                    id="adminGroup"
                    value={formData.adminGroup}
                    onChange={(e) => setFormData(prev => ({ ...prev, adminGroup: e.target.value }))}
                    placeholder="Enter AD admin group"
                    className="font-mono"
                  />
                ) : (
                  <div className="px-3 py-2 bg-muted rounded-md font-mono text-sm" title={team.adminGroup}>
                    <span className="truncate block">{team.adminGroup}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Members have full administrative access
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Audit Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Audit Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Created</div>
                <div className="font-medium">{formatDate(team.createdAt)}</div>
                <div className="text-xs text-muted-foreground">by {team.createdBy}</div>
              </div>
              
              {team.updatedAt && (
                <div>
                  <div className="text-muted-foreground">Last Updated</div>
                  <div className="font-medium">{formatDate(team.updatedAt)}</div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Technical Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Technical Details</h3>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground mb-1">Team ID</div>
              <div className="px-3 py-2 bg-muted rounded-md font-mono text-sm break-all">
                {team.id}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Use this identifier for API integrations and support requests
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
