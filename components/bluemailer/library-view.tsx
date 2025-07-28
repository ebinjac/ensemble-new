'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Trash2, 
  Eye,
  Globe,
  Lock,
  Users,
  Search,
  FileText,
  Layers
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { deleteTeamLibraryItem } from '@/app/actions/bluemailer/team-library';
import { toast } from 'sonner';
import type { LibraryVisibility, LibraryCategory } from '@/app/actions/bluemailer/team-library';

interface LibraryItem {
  id: string;
  name: string;
  description: string | null;
  category: LibraryCategory;
  visibility: LibraryVisibility;
  thumbnailUrl: string | null;
  isComponent: boolean;
  usageCount: number;
  rating: number;
  isFeatured: boolean;
  createdAt: Date;
  createdBy: string;
  teamId: string | null;
}

interface LibraryViewProps {
  items: LibraryItem[];
  teamId: string;
}

export function LibraryView({ items, teamId }: LibraryViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVisibility, setSelectedVisibility] = useState<string>('all');

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesVisibility = selectedVisibility === 'all' || item.visibility === selectedVisibility;
    
    return matchesSearch && matchesCategory && matchesVisibility;
  });

  // Separate templates and components
  const templates = filteredItems.filter(item => !item.isComponent);
  const components = filteredItems.filter(item => item.isComponent);

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this library item?')) return;
    
    try {
      const result = await deleteTeamLibraryItem(teamId, itemId);
      if (result.success) {
        toast.success('Library item deleted successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete library item');
      }
    } catch (error) {
      toast.error('Failed to delete library item');
    }
  };

  const getVisibilityIcon = (visibility: LibraryVisibility) => {
    switch (visibility) {
      case 'public': return <Globe className="h-3 w-3" />;
      case 'team': return <Users className="h-3 w-3" />;
      case 'private': return <Lock className="h-3 w-3" />;
    }
  };

  const getVisibilityColor = (visibility: LibraryVisibility) => {
    switch (visibility) {
      case 'public': return 'bg-green-100 text-green-800 border-green-200';
      case 'team': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'private': return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: LibraryCategory) => {
    switch (category) {
      case 'newsletter': return 'bg-blue-100 text-blue-800';
      case 'promotional': return 'bg-purple-100 text-purple-800';
      case 'transactional': return 'bg-green-100 text-green-800';
      case 'onboarding': return 'bg-yellow-100 text-yellow-800';
      case 'notification': return 'bg-orange-100 text-orange-800';
      case 'announcement': return 'bg-pink-100 text-pink-800';
      case 'component': return 'bg-indigo-100 text-indigo-800';
      case 'custom': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderLibraryCard = (item: LibraryItem) => (
    <Card key={item.id} className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <h3 className="font-semibold text-sm line-clamp-1">{item.name}</h3>
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {}}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </DropdownMenuItem>
              
              {item.teamId === teamId && (
                <DropdownMenuItem 
                  onClick={() => router.push(`/tools/teams/${teamId}/bluemailer/library/${item.id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={() => {}}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              
              {item.teamId === teamId && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="py-2">
        {/* Thumbnail */}
        <div className="aspect-[4/3] bg-gray-50 rounded-md mb-3 overflow-hidden">
        {item.thumbnailUrl ? (
          <img 
            src={item.thumbnailUrl} 
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        
        {/* Always show fallback, hide it if image loads */}
        <div className={`w-full h-full flex items-center justify-center text-gray-400 ${item.thumbnailUrl ? 'hidden' : ''}`}>
          <div className="text-center">
            <div className="text-2xl mb-1">
              {item.isComponent ? (
                <Layers className="h-8 w-8 mx-auto" />
              ) : (
                <FileText className="h-8 w-8 mx-auto" />
              )}
            </div>
            <div className="text-xs">No Preview</div>
          </div>
        </div>
      </div>

        {/* Metadata */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1 flex-wrap gap-1">
            <Badge className={getCategoryColor(item.category)} variant="secondary">
              {item.category}
            </Badge>
            <Badge className={getVisibilityColor(item.visibility)} variant="outline">
              {getVisibilityIcon(item.visibility)}
              <span className="ml-1 capitalize">{item.visibility}</span>
            </Badge>
            {item.isFeatured && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200" variant="outline">
                Featured
              </Badge>
            )}
          </div>
          
          {item.usageCount > 0 && (
            <div className="text-xs text-muted-foreground">
              Used {item.usageCount} time{item.usageCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <div className="w-full text-xs text-muted-foreground flex justify-between items-center">
          <div>
            {item.teamId === teamId ? 'Created by you' : `From ${item.teamId ? 'team' : 'global'} library`}
          </div>
          <div>
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </div>
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search library items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
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

        <Select value={selectedVisibility} onValueChange={setSelectedVisibility}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="team">Team</SelectItem>
            <SelectItem value="public">Public</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <Tabs defaultValue="templates" className="w-full">
        <TabsList>
          <TabsTrigger value="templates">
            Templates ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="components">
            Components ({components.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="space-y-4">
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 mb-2">No templates found</p>
              <p className="text-sm text-gray-400">Create your first template library item</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {templates.map(renderLibraryCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="components" className="space-y-4">
          {components.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 mb-2">No components found</p>
              <p className="text-sm text-gray-400">Create reusable components for your templates</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {components.map(renderLibraryCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
