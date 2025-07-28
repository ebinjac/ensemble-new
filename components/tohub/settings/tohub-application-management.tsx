// app/tools/teams/[teamId]/tohub/components/ApplicationManagement.tsx
'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  GripVertical,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/tohub/settings/confirmation-dialog';
import {
  createSubApp,
  updateSubApplication,
  deleteSubApplication,
  reorderSubApplications,
} from '@/app/actions/tohub/tohub';

interface ApplicationManagementProps {
  teamId: string;
  initialApplications: any[];
}

export function ApplicationManagement({ teamId, initialApplications }: ApplicationManagementProps) {
  const [applications, setApplications] = useState(initialApplications);
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubApp, setEditingSubApp] = useState<any>(null);
  const [selectedAppId, setSelectedAppId] = useState<string>('');

  // ← Add state for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subAppToDelete, setSubAppToDelete] = useState<{id: string, applicationId: string, name: string} | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
  });

  // Handle adding new sub-application
  const handleAddSubApp = (applicationId: string) => {
    setSelectedAppId(applicationId);
    setEditingSubApp(null);
    setForm({ name: '', description: '' });
    setDialogOpen(true);
  };

  // Handle editing existing sub-application
  const handleEditSubApp = (subApp: any) => {
    setSelectedAppId(subApp.applicationId);
    setEditingSubApp(subApp);
    setForm({
      name: subApp.name,
      description: subApp.description || '',
    });
    setDialogOpen(true);
  };

  // Save sub-application (create or update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Sub-application name is required');
      return;
    }

    startTransition(async () => {
      try {
        let updatedSubApp;
        
        if (editingSubApp) {
          // Update existing
          updatedSubApp = await updateSubApplication(teamId, editingSubApp.id, form);
          toast.success('Sub-application updated successfully');
        } else {
          // Create new
          updatedSubApp = await createSubApp(teamId, selectedAppId, form);
          toast.success('Sub-application created successfully');
        }

        // Update local state
        setApplications(prev => prev.map(app => {
          if (app.id === selectedAppId) {
            if (editingSubApp) {
              // Update existing sub-app
              return {
                ...app,
                subApplications: app.subApplications.map((sa: any) =>
                  sa.id === editingSubApp.id ? updatedSubApp : sa
                )
              };
            } else {
              // Add new sub-app
              return {
                ...app,
                subApplications: [...app.subApplications, updatedSubApp]
              };
            }
          }
          return app;
        }));

        setDialogOpen(false);
        setForm({ name: '', description: '' });
      } catch (error) {
        console.error('Failed to save sub-application:', error);
        toast.error('Failed to save sub-application');
      }
    });
  };

  // ← Open delete confirmation dialog
  const handleDeleteClick = (subApp: any) => {
    setSubAppToDelete({
      id: subApp.id,
      applicationId: subApp.applicationId,
      name: subApp.name
    });
    setDeleteDialogOpen(true);
  };

  // ← Handle confirmed deletion
  const handleConfirmDelete = async () => {
    if (!subAppToDelete) return;

    startTransition(async () => {
      try {
        const result = await deleteSubApplication(teamId, subAppToDelete.id);
        
        if (result.deactivated) {
          toast.success('Sub-application deactivated (was in use)');
          // Update local state to show as inactive
          setApplications(prev => prev.map(app => 
            app.id === subAppToDelete.applicationId 
              ? {
                  ...app,
                  subApplications: app.subApplications.map((sa: any) =>
                    sa.id === subAppToDelete.id ? { ...sa, isActive: false } : sa
                  )
                }
              : app
          ));
        } else {
          toast.success('Sub-application deleted successfully');
          // Remove from local state
          setApplications(prev => prev.map(app => 
            app.id === subAppToDelete.applicationId 
              ? {
                  ...app,
                  subApplications: app.subApplications.filter((sa: any) => sa.id !== subAppToDelete.id)
                }
              : app
          ));
        }
      } catch (error) {
        console.error('Failed to delete sub-application:', error);
        toast.error('Failed to delete sub-application');
      } finally {
        setDeleteDialogOpen(false);
        setSubAppToDelete(null);
      }
    });
  };

  // Toggle sub-application active status
  const handleToggleActive = async (subApp: any) => {
    startTransition(async () => {
      try {
        await updateSubApplication(teamId, subApp.id, {
          name: subApp.name,
          description: subApp.description,
        });

        setApplications(prev => prev.map(app => 
          app.id === subApp.applicationId 
            ? {
                ...app,
                subApplications: app.subApplications.map((sa: any) =>
                  sa.id === subApp.id ? { ...sa, isActive: !sa.isActive } : sa
                )
              }
            : app
        ));

        toast.success(`Sub-application ${subApp.isActive ? 'deactivated' : 'activated'}`);
      } catch (error) {
        console.error('Failed to toggle sub-application:', error);
        toast.error('Failed to update sub-application');
      }
    });
  };

  return (
    <div className="space-y-6">
      {applications.map((app) => (
        <Card key={app.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>{app.applicationName}</span>
                  <Badge variant="outline">
                    {app.subApplications.filter((sa: any) => sa.isActive).length} active
                  </Badge>
                </CardTitle>
                {app.description && (
                  <CardDescription>{app.description}</CardDescription>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => handleAddSubApp(app.id)}
                disabled={isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Sub-App
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {app.subApplications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No sub-applications configured</p>
                <p className="text-sm">Add sub-applications to organize turnover entries</p>
              </div>
            ) : (
              <div className="space-y-2">
                {app.subApplications.map((subApp: any) => (
                  <div
                    key={subApp.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      subApp.isActive 
                        ? 'bg-card hover:bg-accent/50' 
                        : 'bg-muted/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{subApp.name}</span>
                          {!subApp.isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        {subApp.description && (
                          <p className="text-sm text-muted-foreground">
                            {subApp.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(subApp.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditSubApp(subApp)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(subApp)}>
                          {subApp.isActive ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(subApp)} // ← Updated to use dialog
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingSubApp ? 'Edit Sub-Application' : 'Add Sub-Application'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., EKMS, KMS V1, SDK"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description for this sub-application"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingSubApp ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ← Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Sub-Application"
        description={`Are you sure you want to delete "${subAppToDelete?.name}"? If this sub-application is being used in turnover entries, it will be deactivated instead of deleted. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
