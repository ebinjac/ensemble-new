'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Share2, 
  Users, 
  Edit3, 
  Copy, 
  Check, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { shareTemplate, getAvailableTeams } from '@/app/actions/bluemailer/sharing';
import { toast } from 'sonner';

interface SharingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string | null;
  teamId: string;
}

interface TeamOption {
  id: string;
  name: string;
}

export function SharingDialog({ 
  open, 
  onOpenChange, 
  templateId, 
  teamId 
}: SharingDialogProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [canEdit, setCanEdit] = useState(false);
  const [canDuplicate, setCanDuplicate] = useState(true);
  const [availableTeams, setAvailableTeams] = useState<TeamOption[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load available teams when dialog opens
  useEffect(() => {
    if (open && templateId) {
      setIsLoading(true);
      getAvailableTeams(teamId)
        .then(teams => {
          setAvailableTeams(teams);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Failed to load teams:', error);
          toast.error('Failed to load available teams');
          setIsLoading(false);
        });
    }
  }, [open, templateId, teamId]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedTeamId('');
      setCanEdit(false);
      setCanDuplicate(true);
      setIsSharing(false);
    }
  }, [open]);

  const handleShare = async () => {
    if (!templateId || !selectedTeamId) {
      toast.error('Please select a team to share with');
      return;
    }

    setIsSharing(true);
    try {
      const result = await shareTemplate(
        teamId,
        templateId,
        selectedTeamId,
        canEdit,
        canDuplicate
      );

      if (result.success) {
        toast.success('Template shared successfully');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to share template');
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share template');
    } finally {
      setIsSharing(false);
    }
  };

  const selectedTeam = availableTeams.find(team => team.id === selectedTeamId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="h-5 w-5" />
            <span>Share Template</span>
          </DialogTitle>
          <DialogDescription>
            Share this template with another team. You can control what permissions they have.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading teams...</span>
            </div>
          ) : availableTeams.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                No other teams available for sharing
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                You need to be a member of other teams to share templates
              </p>
            </div>
          ) : (
            <>
              {/* Team Selection */}
              <div className="space-y-2">
                <Label>Select Team</Label>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a team to share with..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>{team.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Permissions */}
              {selectedTeamId && (
                <div className="space-y-4">
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium mb-3">Permissions</h4>
                    
                    <div className="space-y-4">
                      {/* Can Duplicate */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <Copy className="h-4 w-4 text-muted-foreground" />
                            <Label className="text-sm font-medium">Allow duplicating</Label>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Team members can create copies of this template
                          </p>
                        </div>
                        <Switch
                          checked={canDuplicate}
                          onCheckedChange={setCanDuplicate}
                        />
                      </div>

                      {/* Can Edit */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <Edit3 className="h-4 w-4 text-muted-foreground" />
                            <Label className="text-sm font-medium">Allow editing</Label>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Team members can modify the original template
                          </p>
                        </div>
                        <Switch
                          checked={canEdit}
                          onCheckedChange={setCanEdit}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Warning for edit permissions */}
                  {canEdit && (
                    <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="text-amber-800 font-medium">Edit permissions warning</p>
                        <p className="text-amber-700 mt-1">
                          Team members will be able to modify your original template. 
                          Consider sharing a duplicate instead if you want to preserve the original.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Share Summary */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-start space-x-2">
                      <Check className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="text-blue-800 font-medium">Ready to share</p>
                        <p className="text-blue-700 mt-1">
                          This template will be shared with <strong>{selectedTeam?.name}</strong> with{' '}
                          {canEdit ? 'edit and ' : ''}
                          {canDuplicate ? 'duplicate' : 'view-only'} permissions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleShare}
            disabled={!selectedTeamId || isSharing || isLoading}
          >
            {isSharing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 mr-2" />
                Share Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
