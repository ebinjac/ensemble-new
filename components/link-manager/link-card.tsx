// app/components/link-manager/LinkCard.tsx
'use client'

import { useState, useEffect } from 'react';
import { 
  ExternalLink, Edit, Trash2, Pin, PinOff, MoreHorizontal, Eye, Copy, Share2, 
  Building2, AlertTriangle, Lock, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useAuth } from '@/app/(auth)/providers/AuthProvider';
import { recordLinkAccess, deleteLink, toggleLinkPin } from '@/app/actions/link-manager/link-manager';
import { toast } from 'sonner';
import type { LinkWithApplications } from '@/app/types/link-manager';

interface LinkCardProps {
  link: LinkWithApplications;
  teamId: string;
  onEdit: (link: LinkWithApplications) => void;
  onDelete: (linkId: string) => void;
  onUpdate: () => void;
  viewMode?: 'grid' | 'list' | 'compact';
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelectionToggle?: () => void;
}

export function LinkCard({ 
  link, 
  teamId, 
  onEdit, 
  onDelete, 
  onUpdate, 
  viewMode = 'grid',
  selectionMode = false,
  isSelected = false,
  onSelectionToggle
}: LinkCardProps) {
  const { isTeamAdmin, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [iconError, setIconError] = useState(false);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [faviconLoading, setFaviconLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const isAdmin = isTeamAdmin(teamId);
  const userEmail = user?.email;
  
  const canEdit = isAdmin || link.createdBy === userEmail;
  const canDelete = isAdmin || link.createdBy === userEmail;

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  };

  const isInternalDomain = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.endsWith('.aexp.com') || hostname.includes('aexp');
    } catch {
      return false;
    }
  };

  const getInternalAppIcon = (url: string) => {
    const hostname = getDomain(url).toLowerCase();
    const internalAppIcons: Record<string, string> = {
      'confluence.aexp.com': '📖',
      'jira.aexp.com': '🎯',
      'gitlab.aexp.com': '🦊',
      'jenkins.aexp.com': '🔧',
      'artifactory.aexp.com': '📦',
      'splunk.aexp.com': '📊',
      'grafana.aexp.com': '📈',
      'kibana.aexp.com': '🔍',
      'vault.aexp.com': '🔐',
      'consul.aexp.com': '🏢',
      'nomad.aexp.com': '🚀',
      'datadog.aexp.com': '🐕',
      'salesforce.aexp.com': '☁️',
      'servicenow.aexp.com': '🎫',
      'okta.aexp.com': '🔑',
    };

    if (internalAppIcons[hostname]) {
      return internalAppIcons[hostname];
    }

    for (const [domain, icon] of Object.entries(internalAppIcons)) {
      if (hostname.includes(domain.split('.')[0])) {
        return icon;
      }
    }

    return '🏢';
  };

  const getCategoryIcon = (category: string | null) => {
    const categoryIcons: Record<string, string> = {
      documentation: '📚',
      tool: '🛠️',
      resource: '📋',
      dashboard: '📊',
      repository: '📦',
      service: '⚙️',
      other: '🔗'
    };
    return categoryIcons[category as keyof typeof categoryIcons] || '🔗';
  };

  const domain = getDomain(link.url);
  const isInternal = isInternalDomain(link.url);

  useEffect(() => {
    const loadFavicon = async () => {
      if (!isInternal) {
        setFaviconUrl(`https://www.google.com/s2/favicons?domain=${domain}&sz=16`);
        return;
      }

      setFaviconLoading(true);
      setIconError(false);

      try {
        const faviconPaths = ['/favicon.ico', '/favicon.png'];
        const domainOrigin = new URL(link.url).origin;
        
        for (const path of faviconPaths) {
          try {
            const faviconUrl = `${domainOrigin}${path}`;
            const img = new Image();
            img.onload = () => {
              setFaviconUrl(faviconUrl);
              setFaviconLoading(false);
            };
            img.onerror = () => {
              // continue;
            };
            img.src = faviconUrl;
            return;
          } catch (error) {
            continue;
          }
        }
        
        setIconError(true);
      } catch (error) {
        setIconError(true);
      } finally {
        setFaviconLoading(false);
      }
    };

    loadFavicon();
  }, [link.url, domain, isInternal]);

  const FaviconComponent = () => {
    const size = viewMode === 'compact' ? 'w-4 h-4' : viewMode === 'list' ? 'w-5 h-5' : 'w-6 w-6';
    
    if (faviconLoading) {
      return (
        <div className={`flex items-center justify-center ${size} bg-muted animate-pulse rounded-md`}>
          <div className="w-2 h-2 bg-muted-foreground/30 rounded"></div>
        </div>
      );
    }

    if (faviconUrl && !iconError) {
      return (
        <img 
          src={faviconUrl}
          alt=""
          className={`rounded-md ${size} object-cover`}
          onError={() => setIconError(true)}
          onLoad={() => setIconError(false)}
        />
      );
    }

    if (isInternal) {
      return (
        <div className={`flex items-center justify-center ${size} text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white dark:from-blue-600 dark:to-purple-700 rounded-md`}>
          {getInternalAppIcon(link.url)}
        </div>
      );
    } else {
      return (
        <div className={`flex items-center justify-center ${size} text-xs bg-gradient-to-br from-muted to-muted-foreground/20 text-muted-foreground rounded-md`}>
          {getCategoryIcon(link.category)}
        </div>
      );
    }
  };

  const handleLinkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await recordLinkAccess(teamId, link.id, navigator.userAgent, undefined, window.location.href);
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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link.url);
      toast.success("Link copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleTogglePin = async () => {
    try {
      const result = await toggleLinkPin(teamId, link.id, !link.isPinned);
      if (result.success) {
        onUpdate();
        toast.success(link.isPinned ? 'Link unpinned' : 'Link pinned');
      } else {
        toast.error(result.error || 'Failed to update pin status');
      }
    } catch (error) {
      toast.error('Failed to update pin status');
    }
  };

  const handleDelete = async () => {
    try {
      const result = await deleteLink(teamId, link.id);
      if (result.success) {
        onDelete(link.id);
        toast.success('Link deleted successfully');
        setShowDeleteConfirm(false);
      } else {
        toast.error(result.error || 'Failed to delete link');
      }
    } catch (error) {
      toast.error('Failed to delete link');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: link.title, url: link.url });
      } catch (error) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  // Compact List View
  if (viewMode === 'list') {
    return (
      <div className={`group border rounded-md p-2 hover:shadow-sm transition-all duration-200 bg-card ${
        link.isPinned ? 'ring-1 ring-blue-200 bg-blue-50/30 dark:ring-blue-800 dark:bg-blue-950/30' : ''
      } ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
        <div className="flex items-center gap-2">
          {selectionMode && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelectionToggle}
              className="flex-shrink-0"
            />
          )}

          <div className="relative flex-shrink-0">
            <FaviconComponent />
            {isInternal && (
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full flex items-center justify-center">
                <Building2 className="h-1 w-1 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <h3 
                className="font-medium text-sm truncate hover:text-primary transition-colors cursor-pointer text-foreground"
                onClick={handleLinkClick}
              >
                {link.title}
              </h3>
              
              {link.isPinned && <Pin className="h-2.5 w-2.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />}
              
              {!link.isPublic ? (
                <Lock className="h-2.5 w-2.5 text-orange-500 dark:text-orange-400 flex-shrink-0" />
              ) : (
                <Users className="h-2.5 w-2.5 text-green-500 dark:text-green-400 flex-shrink-0" />
              )}
            </div>
            
            <p className="text-xs text-muted-foreground truncate">
              {domain}
            </p>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Badge variant="outline" className="text-xs px-1 py-0 h-4">
              {link.category || 'other'}
            </Badge>
            
            {(link.tags || []).length > 0 && (
              <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                #{(link.tags || [])[0]}
                {(link.tags || []).length > 1 && <span className="ml-0.5">+{(link.tags || []).length - 1}</span>}
              </Badge>
            )}
            
            {(link.applications?.length || 0) > 0 && (
              <Badge variant="outline" className="text-xs px-1 py-0 h-4 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800">
                {link.applications![0].tla}
                {(link.applications?.length || 0) > 1 && <span className="ml-0.5">+{(link.applications?.length || 0) - 1}</span>}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" />
            <span>{link.accessCount || 0}</span>
          </div>

          {!selectionMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLinkClick}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </DropdownMenuItem>
                {canEdit && (
                  <DropdownMenuItem onClick={() => onEdit(link)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canEdit && (
                  <DropdownMenuItem onClick={handleTogglePin}>
                    {link.isPinned ? <PinOff className="h-4 w-4 mr-2" /> : <Pin className="h-4 w-4 mr-2" />}
                    {link.isPinned ? 'Unpin' : 'Pin'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </DropdownMenuItem>
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  }

  // Grid and Compact View
  return (
    <Card className={`group hover:shadow-md transition-all duration-200 cursor-pointer ${
      link.isPinned ? 'ring-1 ring-blue-200 bg-blue-50/30 dark:ring-blue-800 dark:bg-blue-950/30' : ''
    } ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
      <CardHeader className={viewMode === 'compact' ? 'pb-1 p-3' : 'pb-2 px-4'}>
        <div className="flex items-start justify-between gap-2">
          {selectionMode && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelectionToggle}
              className="mt-0.5 flex-shrink-0"
            />
          )}

          <div className="flex items-start space-x-2 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <FaviconComponent />
              {isInternal && (
                <div className={`absolute -top-0.5 -right-0.5 ${
                  viewMode === 'compact' ? 'w-2 h-2' : 'w-2.5 h-2.5'
                } bg-blue-500 dark:bg-blue-400 rounded-full flex items-center justify-center`}>
                  <Building2 className={`${viewMode === 'compact' ? 'h-1 w-1' : 'h-1.5 w-1.5'} text-white`} />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1 mb-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h3 
                        className={`font-semibold ${viewMode === 'compact' ? 'text-xs' : 'text-sm'} truncate hover:text-primary transition-colors text-foreground`}
                        onClick={handleLinkClick}
                      >
                        {link.title}
                        {isLoading && <span className="ml-1 animate-spin">⏳</span>}
                      </h3>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs break-words">{link.title}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <div className="flex items-center gap-0.5">
                  {link.isPinned && <Pin className="h-2.5 w-2.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />}
                  
                  {!link.isPublic ? (
                    <Lock className="h-2.5 w-2.5 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                  ) : (
                    <Users className="h-2.5 w-2.5 text-green-500 dark:text-green-400 flex-shrink-0" />
                  )}
                  
                  {isInternal && (
                    <Building2 className="h-2.5 w-2.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                  )}
                </div>
              </div>
              
              <p className={`${viewMode === 'compact' ? 'text-xs' : 'text-xs'} text-muted-foreground truncate`}>
                {domain}
              </p>
            </div>
          </div>

          {!selectionMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`${
                  viewMode === 'compact' ? 'h-6 w-6' : 'h-8 w-8'
                } p-0 opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <MoreHorizontal className={`${viewMode === 'compact' ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLinkClick}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </DropdownMenuItem>
                {canEdit && (
                  <DropdownMenuItem onClick={() => onEdit(link)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canEdit && (
                  <DropdownMenuItem onClick={handleTogglePin}>
                    {link.isPinned ? <PinOff className="h-4 w-4 mr-2" /> : <Pin className="h-4 w-4 mr-2" />}
                    {link.isPinned ? 'Unpin' : 'Pin'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </DropdownMenuItem>
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className={`${viewMode === 'compact' ? 'pt-0 p-3 space-y-1' : 'pt-0 space-y-2'}`}>
        {link.description && viewMode !== 'compact' && (
          <p className="text-xs text-muted-foreground line-clamp-1 break-words">
            {link.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className={`${viewMode === 'compact' ? 'text-xs px-1 py-0 h-4' : 'text-xs'}`}>
            {link.category || 'other'}
          </Badge>
          
          {(link.tags || []).slice(0, viewMode === 'compact' ? 1 : 2).map((tag, index) => (
            <Badge key={index} variant="secondary" className={`${viewMode === 'compact' ? 'text-xs px-1 py-0 h-4' : 'text-xs'}`}>
              #{tag}
            </Badge>
          ))}
          
          {(link.tags || []).length > (viewMode === 'compact' ? 1 : 2) && (
            <Badge variant="outline" className={`${viewMode === 'compact' ? 'text-xs px-1 py-0 h-4' : 'text-xs'}`}>
              +{(link.tags || []).length - (viewMode === 'compact' ? 1 : 2)}
            </Badge>
          )}
        </div>

        {link.applications && link.applications.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {link.applications.slice(0, viewMode === 'compact' ? 1 : 2).map((app) => (
              <Badge key={app.id} variant="outline" className={`${
                viewMode === 'compact' ? 'text-xs px-1 py-0 h-4' : 'text-xs'
              } bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800`}>
                {app.tla}
              </Badge>
            ))}
            {link.applications.length > (viewMode === 'compact' ? 1 : 2) && (
              <Badge variant="outline" className={`${viewMode === 'compact' ? 'text-xs px-1 py-0 h-4' : 'text-xs'}`}>
                +{link.applications.length - (viewMode === 'compact' ? 1 : 2)}
              </Badge>
            )}
          </div>
        )}

        <div className={`flex items-center justify-between ${
          viewMode === 'compact' ? 'text-xs' : 'text-xs'
        } text-muted-foreground pt-1 border-t border-border`}>
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1">
              <Eye className="h-3 w-3" />
              <span>{link.accessCount || 0}</span>
            </span>
          </div>
          <span>{new Date(link.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>

        {viewMode !== 'compact' && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2" 
            onClick={handleLinkClick}
            disabled={isLoading}
          >
            <ExternalLink className="h-3 w-3 mr-2" />
            {isLoading ? 'Opening...' : 'Open'}
          </Button>
        )}
      </CardContent>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Delete
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{link.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
