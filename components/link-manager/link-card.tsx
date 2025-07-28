// app/components/link-manager/LinkCard.tsx
'use client'

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Edit, Trash2, Pin, PinOff, MoreHorizontal, Eye, Copy, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { recordLinkAccess, updateLink, deleteLink } from '@/app/actions/link-manager/link-manager';
import { useAuth } from '@/app/(auth)/providers/AuthProvider';
import type { LinkWithApplications } from '@/app/actions/link-manager/link-manager';

interface LinkCardProps {
  link: LinkWithApplications;
  teamId: string;
  onEdit: (link: LinkWithApplications) => void;
  onDelete: (linkId: string) => void;
  onUpdate: () => void;
  viewMode?: 'grid' | 'list'; // ✅ Added viewMode prop
}

export function LinkCard({ 
  link, 
  teamId, 
  onEdit, 
  onDelete, 
  onUpdate, 
  viewMode = 'grid' 
}: LinkCardProps) {
  const { isTeamAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const isAdmin = isTeamAdmin(teamId);

  const handleLinkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await recordLinkAccess(
        teamId,
        link.id,
        navigator.userAgent,
        undefined,
        window.location.href
      );

      if (result.success && result.redirectUrl) {
        window.open(result.redirectUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.error(result.error || "Failed to access link");
      }
    } catch (error) {
      toast.error("Failed to access link");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePin = async () => {
    try {
      const result = await updateLink(teamId, link.id, {
        isPinned: !link.isPinned
      });

      if (result.success) {
        toast.success(`Link ${link.isPinned ? 'unpinned' : 'pinned'} successfully`);
        onUpdate();
      } else {
        toast.error(result.error || "Failed to update link");
      }
    } catch (error) {
      toast.error("Failed to update link");
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(link.url);
      toast.success("Link URL copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy URL");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this link?')) {
      return;
    }

    try {
      const result = await deleteLink(teamId, link.id);
      
      if (result.success) {
        toast.success("Link deleted successfully");
        onDelete(link.id);
      } else {
        toast.error(result.error || "Failed to delete link");
      }
    } catch (error) {
      toast.error("Failed to delete link");
    }
  };

  const getCategoryColor = (category: string | null) => {
    const colors = {
      documentation: 'bg-blue-100 text-blue-800',
      tool: 'bg-green-100 text-green-800',
      resource: 'bg-purple-100 text-purple-800',
      dashboard: 'bg-orange-100 text-orange-800',
      repository: 'bg-gray-100 text-gray-800',
      service: 'bg-red-100 text-red-800',
      other: 'bg-slate-100 text-slate-800',
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  };

  const domain = getDomain(link.url);

  // ✅ Compact List View Design
  if (viewMode === 'list') {
    return (
      <div className={`group border rounded-lg p-3 hover:shadow-sm transition-all duration-200 ${
        link.isPinned ? 'ring-1 ring-blue-200 bg-blue-50/30' : 'bg-background/50'
      }`}>
        <div className="flex items-center gap-3">
          {/* Favicon */}
          <Avatar className="h-6 w-6 rounded-md flex-shrink-0">
            <img 
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
              alt=""
              className="rounded-md"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <AvatarFallback className="rounded-md text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {link.title.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Title and URL - Fixed width container */}
          <div className="flex-1 min-w-0 max-w-xs">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <h3 className="font-medium text-sm truncate hover:text-blue-600 transition-colors cursor-pointer">
                      {link.title}
                    </h3>
                    {link.isPinned && (
                      <Pin className="h-3 w-3 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{link.title}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <p className="text-xs text-muted-foreground truncate">
              {domain}
            </p>
          </div>

          {/* Applications - Compact */}
          <div className="flex items-center gap-1 max-w-32">
            {link.applications.slice(0, 2).map((app) => (
              <Badge key={app.id} variant="outline" className="text-xs px-1.5 py-0.5">
                {app.tla}
              </Badge>
            ))}
            {link.applications.length > 2 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-muted-foreground">
                +{link.applications.length - 2}
              </Badge>
            )}
            {link.isCommon && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                Common
              </Badge>
            )}
          </div>

          {/* Category */}
          {link.category && (
            <Badge className={`${getCategoryColor(link.category)} text-xs px-1.5 py-0.5 flex-shrink-0`}>
              {link.category}
            </Badge>
          )}

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {link.accessCount !== null && link.accessCount > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{link.accessCount}</span>
              </div>
            )}
            <span className="hidden sm:inline">
              {new Date(link.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleLinkClick}
              disabled={isLoading}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={handleLinkClick} disabled={isLoading}>
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyUrl}>
                  <Copy className="h-3 w-3 mr-2" />
                  Copy URL
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(link)}>
                  <Edit className="h-3 w-3 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleTogglePin}>
                  {link.isPinned ? (
                    <>
                      <PinOff className="h-3 w-3 mr-2" />
                      Unpin
                    </>
                  ) : (
                    <>
                      <Pin className="h-3 w-3 mr-2" />
                      Pin
                    </>
                  )}
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Grid View Design with Fixed Title Overflow
  return (
    <Card className={`group hover:shadow-md transition-all duration-200 ${
      link.isPinned ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {/* Favicon */}
            <Avatar className="h-8 w-8 rounded-md flex-shrink-0">
              <img 
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                alt=""
                className="rounded-md"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <AvatarFallback className="rounded-md text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {link.title.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Title and URL - Fixed container */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h3 className="font-semibold text-sm truncate hover:text-blue-600 transition-colors line-clamp-3 max-w-[200px] cursor-pointer">
                        {link.title}
                      </h3>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs break-words">{link.title}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {link.isPinned && (
                  <Pin className="h-3 w-3 text-blue-500 flex-shrink-0" />
                )}
                {link.isCommon && (
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    Common
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {domain}
              </p>
            </div>
          </div>

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleLinkClick} disabled={isLoading}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyUrl}>
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(link)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleTogglePin}>
                {link.isPinned ? (
                  <>
                    <PinOff className="h-4 w-4 mr-2" />
                    Unpin
                  </>
                ) : (
                  <>
                    <Pin className="h-4 w-4 mr-2" />
                    Pin
                  </>
                )}
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Description */}
        {link.description && (
          <div className="mb-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm text-muted-foreground line-clamp-2 cursor-help">
                    {link.description}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs break-words">{link.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Applications */}
        {link.applications.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {link.applications.slice(0, 3).map((app) => (
              <Badge key={app.id} variant="outline" className="text-xs">
                {app.tla}
              </Badge>
            ))}
            {link.applications.length > 3 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                +{link.applications.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Tags */}
        {link.tags && link.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {link.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {link.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs text-muted-foreground">
                +{link.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            {/* Category */}
            {link.category && (
              <Badge className={`${getCategoryColor(link.category)} text-xs`}>
                {link.category}
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Access count */}
            {link.accessCount !== null && link.accessCount > 0 && (
              <div className="flex items-center space-x-1">
                <Eye className="h-3 w-3" />
                <span>{link.accessCount}</span>
              </div>
            )}

            {/* Created date */}
            <span>
              {new Date(link.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Primary action button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleLinkClick}
          disabled={isLoading}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          {isLoading ? 'Opening...' : 'Open Link'}
        </Button>
      </CardContent>
    </Card>
  );
}
