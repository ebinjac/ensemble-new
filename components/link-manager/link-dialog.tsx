// app/components/link-manager/LinkDialog.tsx (Add status field)
'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { createLink, updateLink } from '@/app/actions/link-manager/link-manager';
import type { LinkWithApplications } from '@/app/types/link-manager';

interface LinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  applications: Array<{
    id: string;
    applicationName: string;
    tla: string;
    status: string;
  }>;
  link?: LinkWithApplications | null;
  onSuccess: () => void;
}

export function LinkDialog({
  open,
  onOpenChange,
  teamId,
  applications,
  link,
  onSuccess
}: LinkDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    applicationIds: [] as string[],
    category: 'other' as const,
    tags: [] as string[],
    status: 'active' as const, // ✅ Added status field
    isPinned: false,
    isPublic: false,
  });
  const [tagInput, setTagInput] = useState('');

  // Initialize form data when link changes
  useEffect(() => {
    if (link) {
      setFormData({
        title: link.title,
        url: link.url,
        description: link.description || '',
        applicationIds: link.applicationIds || [],
        category: (link.category as any) || 'other',
        tags: link.tags || [],
        status: (link.status as any) || 'active', // ✅ Set status from link
        isPinned: link.isPinned || false,
        isPublic: link.isPublic || false,
      });
    } else {
      setFormData({
        title: '',
        url: '',
        description: '',
        applicationIds: [],
        category: 'other',
        tags: [],
        status: 'active', // ✅ Default to active
        isPinned: false,
        isPublic: false,
      });
    }
    setTagInput('');
  }, [link]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = link
        ? await updateLink(teamId, link.id, formData)
        : await createLink(teamId, formData);

      if (result.success) {
        toast.success(`Link ${link ? 'updated' : 'created'} successfully`);
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error || `Failed to ${link ? 'update' : 'create'} link`);
      }
    } catch (error) {
      toast.error(`Failed to ${link ? 'update' : 'create'} link`);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationToggle = (appId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      applicationIds: checked
        ? [...prev.applicationIds, appId]
        : prev.applicationIds.filter(id => id !== appId)
    }));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {link ? 'Edit Link' : 'Add New Link'}
          </DialogTitle>
          <DialogDescription>
            {link 
              ? 'Update the link details below.' 
              : 'Fill in the details to create a new link.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter link title"
              required
            />
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://example.com"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="tool">Tool</SelectItem>
                  <SelectItem value="resource">Resource</SelectItem>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                  <SelectItem value="repository">Repository</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ✅ Status Field */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label>Status</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        <strong>Active:</strong> Link is working and visible<br/>
                        <strong>Inactive:</strong> Link is hidden but preserved<br/>
                        <strong>Broken:</strong> Link is not working<br/>
                        <strong>Archived:</strong> Link is archived
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="broken">Broken</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Applications */}
          <div className="space-y-2">
            <Label>Applications</Label>
            <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {applications
                  .filter(app => app.status === 'active')
                  .map(app => (
                    <div key={app.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`app-${app.id}`}
                        checked={formData.applicationIds.includes(app.id)}
                        onCheckedChange={(checked) => handleApplicationToggle(app.id, checked as boolean)}
                      />
                      <Label htmlFor={`app-${app.id}`} className="text-sm cursor-pointer">
                        <span className="font-medium">{app.tla}</span>
                        <span className="text-muted-foreground ml-1 text-xs">
                          ({app.applicationName})
                        </span>
                      </Label>
                    </div>
                  ))}
              </div>
            </div>
            {formData.applicationIds.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {formData.applicationIds.length} application(s) selected
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex space-x-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add tags (press Enter or comma)"
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    #{tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPinned"
                  checked={formData.isPinned}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPinned: checked as boolean }))}
                />
                <Label htmlFor="isPinned" className="cursor-pointer">
                  Pin this link (appears at top of lists)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked as boolean }))}
                />
                <Label htmlFor="isPublic" className="cursor-pointer">
                  Make public (visible to all team members)
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (link ? 'Update Link' : 'Create Link')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
