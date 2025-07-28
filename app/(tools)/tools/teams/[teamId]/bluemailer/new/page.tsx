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
import { ArrowLeft, Save } from 'lucide-react';
import { createTemplate } from '@/app/actions/bluemailer/templates';
import { getTeamApplications } from '@/app/actions/applications';
import { ApplicationSelector } from '@/components/bluemailer/application-selector';
import { toast } from 'sonner';
import type { TemplateCategory, TemplateVisibility } from '@/db/schema/bluemailer';
import type { TeamApplication } from '@/app/types/bluemailer';
import Link from 'next/link';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import React from 'react';

interface NewTemplatePageProps {
  params: {
    teamId: string;
  };
}

const DEFAULT_CANVAS_SETTINGS = {
  backgroundColor: '#f4f4f4',
  contentBackgroundColor: '#ffffff',
  contentWidth: '600px',
  maxWidth: '600px',
  padding: '20px',
  fontFamily: 'Arial, sans-serif',
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#333333'
};

export default function NewTemplatePage({ params }: NewTemplatePageProps) {
  const { teamId } = params;
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom' as TemplateCategory,
    visibility: 'private' as TemplateVisibility,
    applicationIds: [] as string[],
  });
  
  const [applications, setApplications] = useState<TeamApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load applications on mount
  React.useEffect(() => {   
    getTeamApplications(teamId).then(setApplications);
  }, [teamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    setIsLoading(true);
    try {
      const result = await createTemplate(teamId, {
        ...formData,
        canvasSettings: DEFAULT_CANVAS_SETTINGS,
        components: [],
      });

      if (result.success) {
        toast.success('Template created successfully');
        router.push(`/tools/teams/${teamId}/bluemailer/${result.templateId}`);
      } else {
        toast.error(result.error || 'Failed to create template');
      }
    } catch (error) {
      toast.error('Failed to create template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Link href={`/tools/teams/${teamId}/bluemailer`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create New Template</h1>
          <p className="text-muted-foreground">
            Set up your email template details
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter template name..."
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
                placeholder="Optional description..."
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
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="shared">Shared</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Application Tags */}
            <ApplicationSelector
              applications={applications}
              selectedApplicationIds={formData.applicationIds}
              onApplicationsChange={(ids) => handleInputChange('applicationIds', ids)}
            />

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Link href={`/tools/teams/${teamId}/bluemailer`}>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
