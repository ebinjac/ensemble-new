'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Send,
  Trash2,
  Calendar,
  Users,
  Mail,
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  Star,
  StarOff
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { deleteTemplate, duplicateTemplate, toggleTemplateFavorite } from '@/app/actions/bluemailer/templates-new';
import { EmailSendDialog } from './email-send-dialog';
import { toast } from 'sonner';
import Image from 'next/image';

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  thumbnailUrl: string | null;
  usageCount: number;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  componentCount: number;
}

interface TemplatesViewProps {
  templates: Template[];
  teamId: string;
  initialFilters: {
    category?: string;
    search?: string;
    sort?: string;
  };
}

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'transactional', label: 'Transactional' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'notification', label: 'Notification' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'custom', label: 'Custom' },
];

const sortOptions = [
  { value: 'recent', label: 'Recently Updated' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'usage', label: 'Most Used' },
  { value: 'created', label: 'Date Created' },
];

export function TemplatesView({ templates, teamId, initialFilters }: TemplatesViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category || 'all');
  const [sortBy, setSortBy] = useState(initialFilters.sort || 'recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Update URL when filters change
  const updateFilters = (newFilters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`?${params.toString()}`);
  };

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'recent':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return filtered;
  }, [templates, searchQuery, selectedCategory, sortBy]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    updateFilters({ search: query, category: selectedCategory, sort: sortBy });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    updateFilters({ search: searchQuery, category, sort: sortBy });
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    updateFilters({ search: searchQuery, category: selectedCategory, sort });
  };

  const handleEdit = (template: Template) => {
    router.push(`/tools/teams/${teamId}/bluemailer/templates/${template.id}/edit`);
  };

  const handlePreview = (template: Template) => {
    router.push(`/tools/teams/${teamId}/bluemailer/templates/${template.id}/preview`);
  };

  const handleSend = (template: Template) => {
    setSelectedTemplate(template);
    setShowSendDialog(true);
  };

  const handleDuplicate = async (template: Template) => {
    setIsLoading(true);
    try {
      const result = await duplicateTemplate(teamId, template.id);
      if (result.success) {
        toast.success('Template duplicated successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to duplicate template');
      }
    } catch (error) {
      toast.error('Failed to duplicate template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async (template: Template) => {
    try {
      const result = await toggleTemplateFavorite(teamId, template.id);
      if (result.success) {
        toast.success(template.isFavorite ? 'Removed from favorites' : 'Added to favorites');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update favorite status');
      }
    } catch (error) {
      toast.error('Failed to update favorite status');
    }
  };

  const handleDelete = (templateId: string) => {
    setTemplateToDelete(templateId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;

    setIsLoading(true);
    try {
      const result = await deleteTemplate(teamId, templateToDelete);
      if (result.success) {
        toast.success('Template deleted successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete template');
      }
    } catch (error) {
      toast.error('Failed to delete template');
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
      setTemplateToDelete(null);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      newsletter: 'bg-blue-100 text-blue-800 border-blue-200',
      promotional: 'bg-green-100 text-green-800 border-green-200',
      transactional: 'bg-purple-100 text-purple-800 border-purple-200',
      onboarding: 'bg-orange-100 text-orange-800 border-orange-200',
      notification: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      announcement: 'bg-red-100 text-red-800 border-red-200',
      custom: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[category as keyof typeof colors] || colors.custom;
  };

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View Mode */}
        <div className="flex items-center border rounded-lg">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-r-none"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
        </span>
        {selectedCategory !== 'all' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCategoryChange('all')}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Templates Grid/List */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || selectedCategory !== 'all' 
              ? "Try adjusting your search or filters"
              : "Get started by creating your first email template"
            }
          </p>
          <Button onClick={() => router.push(`/tools/teams/${teamId}/bluemailer/templates/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              teamId={teamId}
              viewMode={viewMode}
              onEdit={handleEdit}
              onPreview={handlePreview}
              onSend={handleSend}
              onDuplicate={handleDuplicate}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDelete}
              getCategoryColor={getCategoryColor}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}

      {/* Send Email Dialog */}
      {selectedTemplate && (
        <EmailSendDialog
          isOpen={showSendDialog}
          onClose={() => {
            setShowSendDialog(false);
            setSelectedTemplate(null);
          }}
          templateId={selectedTemplate.id}
          templateName={selectedTemplate.name}
          teamId={teamId}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Template Card Component
interface TemplateCardProps {
  template: Template;
  teamId: string;
  viewMode: 'grid' | 'list';
  onEdit: (template: Template) => void;
  onPreview: (template: Template) => void;
  onSend: (template: Template) => void;
  onDuplicate: (template: Template) => void;
  onToggleFavorite: (template: Template) => void;
  onDelete: (templateId: string) => void;
  getCategoryColor: (category: string) => string;
  isLoading: boolean;
}

function TemplateCard({
  template,
  teamId,
  viewMode,
  onEdit,
  onPreview,
  onSend,
  onDuplicate,
  onToggleFavorite,
  onDelete,
  getCategoryColor,
  isLoading
}: TemplateCardProps) {
  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            {/* Thumbnail */}
            <div className="w-16 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
              {template.thumbnailUrl ? (
                <Image
                  src={template.thumbnailUrl}
                  alt={template.name}
                  width={64}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Mail className="h-6 w-6" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
                    {template.isFavorite && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {template.description || 'No description'}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <Badge className={getCategoryColor(template.category)} variant="outline">
                      {template.category}
                    </Badge>
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {template.usageCount} uses
                    </span>
                    <span>{formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onPreview(template)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(template)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onSend(template)}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Email
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(template)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleFavorite(template)}>
                      {template.isFavorite ? (
                        <StarOff className="h-4 w-4 mr-2" />
                      ) : (
                        <Star className="h-4 w-4 mr-2" />
                      )}
                      {template.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(template.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <CardHeader className="p-0">
        {/* Thumbnail */}
        <div className="relative w-full h-48 bg-gray-100 rounded-t-lg overflow-hidden">
          {template.thumbnailUrl ? (
            <Image
              src={template.thumbnailUrl}
              alt={template.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Mail className="h-12 w-12" />
            </div>
          )}
          
          {/* Overlay actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2">
            <Button size="sm" variant="secondary" onClick={() => onPreview(template)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onEdit(template)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onSend(template)}>
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Favorite indicator */}
          {template.isFavorite && (
            <div className="absolute top-2 right-2">
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Title and description */}
          <div>
            <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
              {template.description || 'No description'}
            </p>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between">
            <Badge className={getCategoryColor(template.category)} variant="outline">
              {template.category}
            </Badge>
            <div className="flex items-center text-xs text-gray-500">
              <Users className="h-3 w-3 mr-1" />
              {template.usageCount}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
            </span>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onDuplicate(template)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleFavorite(template)}>
                  {template.isFavorite ? (
                    <StarOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Star className="h-4 w-4 mr-2" />
                  )}
                  {template.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(template.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
