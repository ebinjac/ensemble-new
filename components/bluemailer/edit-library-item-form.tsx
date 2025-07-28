'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Code,
  Settings,
  Trash2,
  Globe,
  Users,
  Lock,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { updateTeamLibraryItem, deleteTeamLibraryItem } from '@/app/actions/bluemailer/team-library';
import { toast } from 'sonner';
import type { LibraryCategory, LibraryVisibility } from '@/app/actions/bluemailer/team-library';
import Link from 'next/link';
import EmailEditor from '@/components/emailEditor';

interface LibraryItemWithComponents {
  id: string;
  name: string;
  description: string | null;
  category: LibraryCategory;
  visibility: LibraryVisibility;
  canvasSettings: any;
  thumbnailUrl: string | null;
  isComponent: boolean;
  usageCount: number;
  isFeatured: boolean;
  createdAt: Date;
  createdBy: string;
  teamId: string | null;
  components: any[];
}

interface EditLibraryItemFormProps {
  libraryItem: LibraryItemWithComponents;
  teamId: string;
}

export function EditLibraryItemForm({ libraryItem, teamId }: EditLibraryItemFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'details' | 'design' | 'settings'>('details');
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: libraryItem.name,
    description: libraryItem.description || '',
    category: libraryItem.category,
    visibility: libraryItem.visibility,
    isComponent: libraryItem.isComponent,
    thumbnailUrl: libraryItem.thumbnailUrl || '',
  });
  
  const [designData, setDesignData] = useState({
    canvasSettings: libraryItem.canvasSettings,
    components: libraryItem.components,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleDesignChange = (key: string, value: any) => {
    setDesignData(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateTeamLibraryItem(teamId, libraryItem.id, {
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        visibility: formData.visibility,
        isComponent: formData.isComponent,
        thumbnailUrl: formData.thumbnailUrl || undefined,
        canvasSettings: designData.canvasSettings,
        components: designData.components,
      });

      if (result.success) {
        toast.success('Library item updated successfully');
        setHasUnsavedChanges(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update library item');
      }
    } catch (error) {
      toast.error('Failed to update library item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this library item? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await deleteTeamLibraryItem(teamId, libraryItem.id);
      if (result.success) {
        toast.success('Library item deleted successfully');
        router.push(`/tools/teams/${teamId}/bluemailer/library`);
      } else {
        toast.error(result.error || 'Failed to delete library item');
      }
    } catch (error) {
      toast.error('Failed to delete library item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailEditorSave = async (templateData: any) => {
    handleDesignChange('canvasSettings', templateData.canvasSettings);
    handleDesignChange('components', templateData.components);
    
    // Auto-save when design changes
    await handleSave();
  };

  const getVisibilityIcon = (visibility: LibraryVisibility) => {
    switch (visibility) {
      case 'public': return <Globe className="h-4 w-4" />;
      case 'team': return <Users className="h-4 w-4" />;
      case 'private': return <Lock className="h-4 w-4" />;
    }
  };

  const getVisibilityDescription = (visibility: LibraryVisibility) => {
    switch (visibility) {
      case 'public': return 'Visible to all teams';
      case 'team': return 'Visible to your team members';
      case 'private': return 'Only visible to you';
    }
  };

  // If in design tab and full screen mode, render only the email editor
  if (activeTab === 'design' && isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        {/* Minimal header for full screen mode */}
        <div className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsFullScreen(false)}
            >
              <Minimize2 className="h-4 w-4 mr-2" />
              Exit Full Screen
            </Button>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{libraryItem.name}</span>
              <Badge variant={libraryItem.isComponent ? 'secondary' : 'default'}>
                {libraryItem.isComponent ? 'Component' : 'Template'}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handleSave} 
              disabled={isLoading || !hasUnsavedChanges}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Full screen email editor */}
        <div className="h-[calc(100vh-3.5rem)]">
          <EmailEditor
            initialTemplate={{
              id: libraryItem.id,
              name: libraryItem.name,
              components: designData.components,
              canvasSettings: designData.canvasSettings,
            }}
            onSave={handleEmailEditorSave}
            onExport={async (html: string) => {
              console.log('Exported HTML:', html);
            }}
          />
        </div>
      </div>
    );
  }

  // Regular layout for non-design tabs or non-fullscreen design
  return (
    <div className={activeTab === 'design' ? 'h-screen flex flex-col' : 'space-y-6'}>
      {/* Header - only show if not in design mode or not full screen */}
      {activeTab !== 'design' && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/tools/teams/${teamId}/bluemailer/library`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Library
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center space-x-2">
                  <span>Edit {libraryItem.isComponent ? 'Component' : 'Template'}</span>
                  <Badge variant={libraryItem.isComponent ? 'secondary' : 'default'}>
                    {libraryItem.isComponent ? 'Component' : 'Template'}
                  </Badge>
                </h1>
                <p className="text-muted-foreground">
                  {libraryItem.description || 'No description'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => {}}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isLoading || !hasUnsavedChanges}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              {getVisibilityIcon(libraryItem.visibility)}
              <span>{getVisibilityDescription(libraryItem.visibility)}</span>
            </div>
            <span>•</span>
            <span>Used {libraryItem.usageCount} times</span>
            <span>•</span>
            <span>Created {new Date(libraryItem.createdAt).toLocaleDateString()}</span>
          </div>
        </>
      )}

      {/* Compact header for design mode */}
      {activeTab === 'design' && !isFullScreen && (
        <div className="flex items-center justify-between py-4 border-b">
          <div className="flex items-center space-x-4">
            <Link href={`/tools/teams/${teamId}/bluemailer/library`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{libraryItem.name}</span>
              <Badge variant={libraryItem.isComponent ? 'secondary' : 'default'}>
                {libraryItem.isComponent ? 'Component' : 'Template'}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsFullScreen(true)}
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Full Screen
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading || !hasUnsavedChanges}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as any)}
        className={activeTab === 'design' ? 'flex flex-col flex-1' : ''}
      >
        {/* Only show tabs list if not in design mode */}
        {activeTab !== 'design' && (
          <TabsList>
            <TabsTrigger value="details">
              <Settings className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="design">
              <Code className="h-4 w-4 mr-2" />
              Design
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
        )}

        {/* Hidden tabs navigation for design mode */}
        {activeTab === 'design' && (
          <div className="flex items-center space-x-1 mb-4">
            <Button 
              variant={activeTab === 'details' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveTab('details')}
            >
              Details
            </Button>
            <Button 
              variant={activeTab === 'design' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveTab('design')}
            >
              Design
            </Button>
            <Button 
              variant={activeTab === 'settings' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </Button>
          </div>
        )}

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter item name..."
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe this template or component..."
                  rows={3}
                />
              </div>

              {/* Category */}
              <div>
                <Label>Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="component">Component</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Thumbnail URL */}
              <div>
                <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                <Input
                  id="thumbnailUrl"
                  value={formData.thumbnailUrl}
                  onChange={(e) => handleInputChange('thumbnailUrl', e.target.value)}
                  placeholder="https://example.com/thumbnail.jpg"
                />
                {formData.thumbnailUrl && (
                  <div className="mt-2">
                    <img 
                      src={formData.thumbnailUrl} 
                      alt="Thumbnail preview"
                      className="w-32 h-24 object-cover rounded border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Type Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="isComponent"
                  checked={formData.isComponent}
                  onCheckedChange={(checked) => handleInputChange('isComponent', checked)}
                />
                <Label htmlFor="isComponent" className="text-sm">
                  This is a reusable component
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Design Tab - Full Width */}
        <TabsContent 
          value="design" 
          className={`mt-0 ${activeTab === 'design' ? 'flex-1' : ''}`}
        >
          <div className={activeTab === 'design' ? 'h-full' : 'h-[80vh] border rounded-lg overflow-hidden'}>
            <EmailEditor
              initialTemplate={{
                id: libraryItem.id,
                name: libraryItem.name,
                components: designData.components,
                canvasSettings: designData.canvasSettings,
              }}
              onSave={handleEmailEditorSave}
              onExport={async (html: string) => {
                console.log('Exported HTML:', html);
              }}
            />
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visibility & Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Visibility */}
              <div>
                <Label>Visibility</Label>
                <Select 
                  value={formData.visibility} 
                  onValueChange={(value) => handleInputChange('visibility', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">
                      <div className="flex items-center space-x-2">
                        <Lock className="h-4 w-4" />
                        <div>
                          <div>Private</div>
                          <div className="text-xs text-muted-foreground">Only you can see this</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="team">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <div>
                          <div>Team</div>
                          <div className="text-xs text-muted-foreground">Your team can see this</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="public">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4" />
                        <div>
                          <div>Public</div>
                          <div className="text-xs text-muted-foreground">All teams can see this</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {getVisibilityDescription(formData.visibility)}
                </p>
              </div>

              {/* Usage Stats */}
              <div>
                <Label>Usage Statistics</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <div className="text-sm space-y-1">
                    <div>Total uses: {libraryItem.usageCount}</div>
                    <div>Created: {new Date(libraryItem.createdAt).toLocaleString()}</div>
                    <div>Created by: {libraryItem.createdBy}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                <div>
                  <h4 className="font-medium text-red-700">Delete Library Item</h4>
                  <p className="text-sm text-red-600">
                    This action cannot be undone. This will permanently delete the library item.
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
