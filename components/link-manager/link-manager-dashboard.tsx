// app/components/link-manager/LinkManagerDashboard.tsx
'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, Filter, Grid, List, X, Upload, Trash2, AlertTriangle, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { LinkCard } from './link-card';
import { LinkDialog } from './link-dialog';
import { AdvancedFilters } from './link-advanced-filters';
import { AnalyticsView } from './link-analytics-view';
import { getLinks, bulkDeleteLinks, getLinkCounts } from '@/app/actions/link-manager/link-manager';
import { toast } from 'sonner';
import type { LinkWithApplications, LinkFilters, LinkSortOptions } from '@/app/types/link-manager';
import { LinkAnalytics } from './link-analytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface LinkManagerDashboardProps {
  teamId: string;
  userRole: 'admin' | 'user';
  teamApplications: Array<{
    id: string;
    applicationName: string;
    tla: string;
    status: string;
  }>;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function LinkManagerDashboard({ 
  teamId, 
  userRole, 
  teamApplications,
  activeTab = 'all',
  onTabChange
}: LinkManagerDashboardProps) {
  const router = useRouter();
  
  // Safety check at the top of component
  const safeActiveTab = activeTab || 'all';

  // State management
  const [links, setLinks] = useState<LinkWithApplications[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [sortBy, setSortBy] = useState<LinkSortOptions>('created-desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkWithApplications | null>(null);

  // Enhanced filters state
  const [filters, setFilters] = useState<LinkFilters>({});
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Bulk selection state
  const [selectedLinkIds, setSelectedLinkIds] = useState<Set<string>>(new Set());
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);

  // Link counts state
  const [linkCounts, setLinkCounts] = useState<Record<string, number>>({
    all: 0,
    pinned: 0,
    private: 0,
    team: 0,
    archived: 0,
    broken: 0
  });
  const [countsLoading, setCountsLoading] = useState(true);

  // Load link counts
  const loadLinkCounts = async () => {
    setCountsLoading(true);
    try {
      const counts = await getLinkCounts(teamId);
      setLinkCounts(counts);
    } catch (error) {
      console.error('Error loading link counts:', error);
      toast.error('Failed to load link counts');
    } finally {
      setCountsLoading(false);
    }
  };

  // Enhanced search with proper application filtering
  const loadLinks = async () => {
    setLoading(true);
    try {
      let result;
      
      const enhancedFilters: LinkFilters & {
        isPrivate?: boolean;
        isTeamPublic?: boolean;
      } = {
        ...filters,
        search: searchTerm.trim() || undefined,
      };

      if (safeActiveTab.startsWith('app-')) {
        const appId = safeActiveTab.replace('app-', '');
        enhancedFilters.applicationIds = [appId];
        result = await getLinks(teamId, enhancedFilters, sortBy, currentPage, 20);
      } else {
        switch (safeActiveTab) {
          case 'pinned':
            enhancedFilters.isPinned = true;
            result = await getLinks(teamId, enhancedFilters, sortBy, currentPage, 20);
            break;
          
          case 'private':
            enhancedFilters.isPrivate = true;
            result = await getLinks(teamId, enhancedFilters, sortBy, currentPage, 20);
            break;
          
          case 'team':
            enhancedFilters.isTeamPublic = true;
            result = await getLinks(teamId, enhancedFilters, sortBy, currentPage, 20);
            break;
          
          case 'archived':
            enhancedFilters.status = 'archived';
            result = await getLinks(teamId, enhancedFilters, sortBy, currentPage, 20);
            break;
          
          case 'broken':
            enhancedFilters.status = 'broken';
            result = await getLinks(teamId, enhancedFilters, sortBy, currentPage, 20);
            break;
          
          // Analytics case - don't load links for analytics view
          case 'analytics':
            setLinks([]);
            setTotalCount(0);
            setTotalPages(0);
            setLoading(false);
            return;
          
          default:
            result = await getLinks(teamId, enhancedFilters, sortBy, currentPage, 20);
        }
      }

      if (result && result.links && Array.isArray(result.links)) {
        setLinks(result.links as LinkWithApplications[]);
        setTotalCount(result.totalCount || 0);
        setTotalPages(result.totalPages || 0);
      } else {
        setLinks([]);
        setTotalCount(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error('Error loading links:', error);
      setLinks([]);
      setTotalCount(0);
      setTotalPages(0);
      toast.error('Failed to load links. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update active filters count
  useEffect(() => {
    const count = Object.values(filters).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      if (value === null || value === undefined) return false;
      return true;
    }).length;
    setActiveFiltersCount(count);
  }, [filters]);

  // Load counts on component mount
  useEffect(() => {
    loadLinkCounts();
  }, [teamId]);

  // Load links when dependencies change
  useEffect(() => {
    loadLinks();
  }, [teamId, safeActiveTab, currentPage, sortBy, filters]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadLinks();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [safeActiveTab]);

  // Clear selection when changing tabs or filters
  useEffect(() => {
    clearSelection();
  }, [safeActiveTab, filters, searchTerm]);

  // Handle link actions
  const handleEditLink = (link: LinkWithApplications) => {
    setEditingLink(link);
    setDialogOpen(true);
  };

  const handleDeleteLink = (linkId: string) => {
    setLinks(prevLinks => prevLinks.filter(link => link.id !== linkId));
    setTotalCount(prev => prev - 1);
    loadLinkCounts();
    toast.success('Link deleted successfully');
  };

  const handleCreateLink = () => {
    setEditingLink(null);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    loadLinks();
    loadLinkCounts();
    toast.success(editingLink ? 'Link updated successfully' : 'Link created successfully');
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Apply advanced filters
  const handleApplyFilters = (newFilters: LinkFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setShowAdvancedFilters(false);
  };

  // Bulk selection functions
  const toggleLinkSelection = (linkId: string) => {
    const newSelected = new Set(selectedLinkIds);
    if (newSelected.has(linkId)) {
      newSelected.delete(linkId);
    } else {
      newSelected.add(linkId);
    }
    setSelectedLinkIds(newSelected);
    
    if (newSelected.size === 0) {
      setSelectionMode(false);
    }
  };

  const toggleSelectAllVisible = () => {
    const visibleLinkIds = links.map(link => link.id);
    const allVisibleSelected = visibleLinkIds.every(id => selectedLinkIds.has(id));
    
    if (allVisibleSelected) {
      const newSelected = new Set(selectedLinkIds);
      visibleLinkIds.forEach(id => newSelected.delete(id));
      setSelectedLinkIds(newSelected);
      
      if (newSelected.size === 0) {
        setSelectionMode(false);
      }
    } else {
      const newSelected = new Set([...selectedLinkIds, ...visibleLinkIds]);
      setSelectedLinkIds(newSelected);
      setSelectionMode(true);
    }
  };

  const clearSelection = () => {
    setSelectedLinkIds(new Set());
    setSelectionMode(false);
  };

  const enterSelectionMode = () => {
    setSelectionMode(true);
  };

  // Bulk delete function
  const handleBulkDelete = async () => {
    setBulkDeleteLoading(true);
    try {
      const linkIdsArray = Array.from(selectedLinkIds);
      const result = await bulkDeleteLinks(teamId, linkIdsArray);
      
      if (result.success) {
        setLinks(prevLinks => prevLinks.filter(link => !selectedLinkIds.has(link.id)));
        setSelectedLinkIds(new Set());
        setSelectionMode(false);
        setShowBulkDeleteConfirm(false);
        
        loadLinkCounts();
        
        toast.success(`Successfully deleted ${result.deletedCount} link${result.deletedCount === 1 ? '' : 's'}`);
      } else {
        toast.error(result.error || 'Failed to delete links');
      }
    } catch (error) {
      toast.error('Failed to delete links');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const getPinnedLinks = () => {
    return links.filter(link => link.isPinned);
  };

  const getRegularLinks = () => {
    return links.filter(link => !link.isPinned);
  };

  const visibleLinkIds = links.map(link => link.id);
  const allVisibleSelected = visibleLinkIds.length > 0 && visibleLinkIds.every(id => selectedLinkIds.has(id));
  const someVisibleSelected = visibleLinkIds.some(id => selectedLinkIds.has(id));

  return (
    <div className="space-y-6">
      {/* Show Analytics View when analytics tab is active */}
      {safeActiveTab === 'analytics' ? (
        <>
        <Tabs defaultValue="analytics">
          <TabsList>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="link-performance">Link Performance</TabsTrigger>
          </TabsList>
          <TabsContent value="analytics" className='mt-4'>
            <AnalyticsView teamId={teamId} linkCounts={linkCounts} />
          </TabsContent>
          <TabsContent value="link-performance" className='mt-4'>
            <LinkAnalytics teamId={teamId} />
          </TabsContent>
        </Tabs>
        </>
      ) : (
        <>
          {/* Enhanced Header Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-4 flex-1">
              {/* Bulk Selection Controls */}
              {selectionMode && (
                <div className="flex items-center space-x-2 bg-primary/10 border border-primary/20 px-3 py-2 rounded-lg">
                  <Checkbox
                    checked={allVisibleSelected}
                    ref={(checkbox) => {
                      if (checkbox) {
                        (checkbox as HTMLInputElement).indeterminate = someVisibleSelected && !allVisibleSelected;
                      }
                    }}
                    onCheckedChange={toggleSelectAllVisible}
                  />
                  <span className="text-sm font-medium text-primary">
                    {selectedLinkIds.size > 0 
                      ? `${selectedLinkIds.size} selected`
                      : 'Select all'
                    }
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="h-6 w-6 p-0 text-primary hover:text-primary/80"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Enhanced Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search links${safeActiveTab.startsWith('app-') ? ' in this application' : ''}...`}
                  className="pl-10 pr-10 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as LinkSortOptions)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created-desc">Newest First</SelectItem>
                  <SelectItem value="created-asc">Oldest First</SelectItem>
                  <SelectItem value="title-asc">Title A-Z</SelectItem>
                  <SelectItem value="title-desc">Title Z-A</SelectItem>
                  <SelectItem value="popularity">Most Popular</SelectItem>
                  <SelectItem value="accessed-desc">Recently Accessed</SelectItem>
                </SelectContent>
              </Select>

              {/* Advanced Filters Button */}
              <Sheet open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="relative">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle>Advanced Filters</SheetTitle>
                    <SheetDescription>
                      Refine your link search with advanced filtering options
                    </SheetDescription>
                  </SheetHeader>
                  <AdvancedFilters
                    filters={filters}
                    onApplyFilters={handleApplyFilters}
                    onClearFilters={() => setFilters({})}
                    teamApplications={teamApplications}
                    teamId={teamId}
                  />
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex items-center space-x-2">
              {/* Bulk Actions */}
              {selectedLinkIds.size > 0 ? (
                <div className="flex items-center space-x-2">
                  <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete {selectedLinkIds.size}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          Confirm Bulk Delete
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedLinkIds.size} selected link{selectedLinkIds.size === 1 ? '' : 's'}? 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleBulkDelete}
                          disabled={bulkDeleteLoading}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {bulkDeleteLoading ? 'Deleting...' : `Delete ${selectedLinkIds.size} Links`}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <>
                  {/* Selection Mode Toggle */}
                  {!selectionMode && links.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={enterSelectionMode}
                      className="flex items-center gap-2"
                    >
                      <Checkbox className="h-3 w-3" />
                      Select
                    </Button>
                  )}

                  {/* Enhanced View Mode Toggle with Compact option */}
                  <div className="flex border rounded-lg bg-background">
                    <Button
                      variant={viewMode === 'compact' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('compact')}
                      className="rounded-r-none"
                      title="Compact View"
                    >
                      <Grid className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-none"
                      title="Grid View"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-l-none"
                      title="List View"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Import Button */}
                  <Button 
                    variant="outline" 
                    onClick={() => router.push(`/tools/teams/${teamId}/link-manager/import`)}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Import
                  </Button>

                  {/* Create Link */}
                  <Button onClick={handleCreateLink}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Link
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {(activeFiltersCount > 0 || searchTerm) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Search: "{searchTerm}"
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setSearchTerm('')}
                  />
                </Badge>
              )}

              {filters.status && (
                <Badge variant="secondary" className="gap-1">
                  Status: {filters.status}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, status: undefined }))}
                  />
                </Badge>
              )}

              {filters.category && (
                <Badge variant="secondary" className="gap-1">
                  Category: {filters.category}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, category: undefined }))}
                  />
                </Badge>
              )}

              {filters.tags && filters.tags.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  Tags: {filters.tags.join(', ')}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, tags: undefined }))}
                  />
                </Badge>
              )}

              {filters.createdBy && (
                <Badge variant="secondary" className="gap-1">
                  Created by: {filters.createdBy}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, createdBy: undefined }))}
                  />
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-6 px-2 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {links.length} of {totalCount} links
                {safeActiveTab === 'private' && <span className="ml-1">- Private links</span>}
                {safeActiveTab === 'team' && <span className="ml-1">- Team shared links</span>}
                {safeActiveTab.startsWith('app-') && (
                  <span className="ml-1">
                    in {teamApplications.find(app => app.id === safeActiveTab.replace('app-', ''))?.applicationName}
                  </span>
                )}
              </p>
              
              {selectedLinkIds.size > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  {selectedLinkIds.size} selected
                </Badge>
              )}
            </div>
            
            {safeActiveTab === 'all' && !countsLoading && (
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>📌 {linkCounts.pinned || 0} pinned</span>
                <span>🔒 {linkCounts.private || 0} private</span>
                <span>👥 {linkCounts.team || 0} team</span>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className={
              viewMode === 'compact' ? "grid gap-2 md:grid-cols-4 lg:grid-cols-6" :
              viewMode === 'grid' ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : 
              "space-y-2"
            }>
              {[...Array(viewMode === 'compact' ? 12 : 6)].map((_, i) => (
                <div key={i} className={`bg-muted animate-pulse rounded-lg ${
                  viewMode === 'compact' ? "h-24" :
                  viewMode === 'grid' ? "h-48" : 
                  "h-16"
                }`} />
              ))}
            </div>
          ) : (
            <>
              {/* Pinned Links Section */}
              {safeActiveTab === 'all' && getPinnedLinks().length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-semibold text-foreground">Pinned Links</h2>
                    <Badge variant="secondary">{getPinnedLinks().length}</Badge>
                  </div>
                  
                  <div className={
                    viewMode === 'compact' ? "grid gap-2 md:grid-cols-4 lg:grid-cols-6" :
                    viewMode === 'grid' ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : 
                    "space-y-2"
                  }>
                    {getPinnedLinks().map((link) => (
                      <LinkCard
                        key={link.id}
                        link={link}
                        teamId={teamId}
                        onEdit={handleEditLink}
                        onDelete={handleDeleteLink}
                        onUpdate={loadLinks}
                        viewMode={viewMode}
                        selectionMode={selectionMode}
                        isSelected={selectedLinkIds.has(link.id)}
                        onSelectionToggle={() => toggleLinkSelection(link.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Links Section */}
              {links.length > 0 ? (
                <div className="space-y-4">
                  {safeActiveTab === 'all' && getPinnedLinks().length > 0 && (
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-semibold text-foreground">All Links</h2>
                      <Badge variant="secondary">{getRegularLinks().length}</Badge>
                    </div>
                  )}
                  
                  <div className={
                    viewMode === 'compact' ? "grid gap-2 md:grid-cols-4 lg:grid-cols-6" :
                    viewMode === 'grid' ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : 
                    "space-y-2"
                  }>
                    {(safeActiveTab === 'all' ? getRegularLinks() : links).map((link) => (
                      <LinkCard
                        key={link.id}
                        link={link}
                        teamId={teamId}
                        onEdit={handleEditLink}
                        onDelete={handleDeleteLink}
                        onUpdate={loadLinks}
                        viewMode={viewMode}
                        selectionMode={selectionMode}
                        isSelected={selectedLinkIds.has(link.id)}
                        onSelectionToggle={() => toggleLinkSelection(link.id)}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center space-x-2 mt-6">
                      <Button
                        variant="outline"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        Previous
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          const page = i + 1;
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                /* Empty State */
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">No links found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || activeFiltersCount > 0
                      ? 'No links match your current filters'
                      : 'Get started by adding your first link'
                    }
                  </p>
                  {searchTerm || activeFiltersCount > 0 ? (
                    <Button variant="outline" onClick={handleClearFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  ) : (
                    <Button onClick={handleCreateLink}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Link
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <LinkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        teamId={teamId}
        applications={teamApplications}
        link={editingLink}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
