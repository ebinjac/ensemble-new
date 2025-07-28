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
import { ArrowLeft, Save } from 'lucide-react';
import { createTeamLibraryItem } from '@/app/actions/bluemailer/team-library';
import { toast } from 'sonner';
import type { LibraryCategory, LibraryVisibility } from '@/app/actions/bluemailer/team-library';
import Link from 'next/link';

interface NewLibraryItemPageProps {
  params: {
    teamId: string;
  };
}

export default function NewLibraryItemPage({ params }: NewLibraryItemPageProps) {
  const { teamId } = params;
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom' as LibraryCategory,
    visibility: 'private' as LibraryVisibility,
    isComponent: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsLoading(true);
    try {
      const result = await createTeamLibraryItem(teamId, {
        ...formData,
        components: [], // Empty for now, will be filled in editor
        canvasSettings: {
          backgroundColor: '#f4f4f4',
          contentBackgroundColor: '#ffffff',
          contentWidth: '600px',
          maxWidth: '600px',
          padding: '20px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          lineHeight: '1.5',
          color: '#333333'
        },
      });

      if (result.success) {
        toast.success('Library item created successfully');
        router.push(`/tools/teams/${teamId}/bluemailer/library/${result.itemId}/edit`);
      } else {
        toast.error(result.error || 'Failed to create library item');
      }
    } catch (error) {
      toast.error('Failed to create library item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className=" mx-auto py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Link href={`/tools/teams/${teamId}/bluemailer/library`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Library Item</h1>
          <p className="text-muted-foreground">
            Create a reusable template or component for your library
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Library Item Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter item name..."
                required
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
                      <span>Private</span>
                      <span className="text-xs text-muted-foreground">- Only you can see this</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="team">
                    <div className="flex items-center space-x-2">
                      <span>Team</span>
                      <span className="text-xs text-muted-foreground">- Your team can see this</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="public">
                    <div className="flex items-center space-x-2">
                      <span>Public</span>
                      <span className="text-xs text-muted-foreground">- All teams can see this</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.visibility === 'private' && 'Only you can access this item'}
                {formData.visibility === 'team' && 'All team members can access this item'}
                {formData.visibility === 'public' && 'All users can access and use this item'}
              </p>
            </div>

            {/* Is Component */}
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
            <p className="text-xs text-muted-foreground -mt-4">
              Components are small, reusable elements. Templates are complete email designs.
            </p>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Link href={`/tools/teams/${teamId}/bluemailer/library`}>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Creating...' : 'Create & Edit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
