'use client';

import { useState } from 'react';
import { TemplateCard } from './template-card';
import { TemplateFilters } from './template-filters';
import { SharingDialog } from './sharing-dialog';
import type { EmailTemplate } from '@/db/schema/bluemailer';
import type { TeamApplication, TemplateFilters as FilterType } from '@/app/types/bluemailer';

interface TemplateListProps {
  templates: EmailTemplate[];
  sharedTemplates?: any[];
  applications: TeamApplication[];
  teamId: string;
}

export function TemplateList({ 
  templates, 
  sharedTemplates = [], 
  applications, 
  teamId 
}: TemplateListProps) {
  const [filters, setFilters] = useState<FilterType>({
    search: '',
    category: 'all',
    status: 'all',
    visibility: 'all',
    applicationId: 'all',
    sortBy: 'updated',
    sortOrder: 'desc',
  });
  
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Filter and sort templates
  const filteredTemplates = templates.filter(template => {
    if (filters.search && !template.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.category !== 'all' && template.category !== filters.category) {
      return false;
    }
    if (filters.status !== 'all' && template.status !== filters.status) {
      return false;
    }
    if (filters.visibility !== 'all' && template.visibility !== filters.visibility) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    let comparison = 0;
    
    switch (filters.sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'created':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'updated':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      case 'usage':
        comparison = a.usageCount - b.usageCount;
        break;
    }
    
    return filters.sortOrder === 'desc' ? -comparison : comparison;
  });

  const handleShare = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setShareDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <TemplateFilters 
        filters={filters}
        onFiltersChange={setFilters}
        applications={applications}
      />

      {/* My Templates */}
      <div>
        <h2 className="text-lg font-semibold mb-4">My Templates ({filteredTemplates.length})</h2>
        
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <div className="text-4xl mb-2">📧</div>
              <p>No templates found</p>
              <p className="text-sm">Create your first email template to get started</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                teamId={teamId}
                onShare={handleShare}
              />
            ))}
          </div>
        )}
      </div>

      {/* Shared Templates */}
      {sharedTemplates.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Shared with Me ({sharedTemplates.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sharedTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                teamId={teamId}
                isShared={true}
                canEdit={template.canEdit}
                canDuplicate={template.canDuplicate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sharing Dialog */}
      <SharingDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        templateId={selectedTemplateId}
        teamId={teamId}
      />
    </div>
  );
}
