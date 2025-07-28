// app/components/link-manager/LinkManagerDashboard.tsx
'use client'

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Grid, List, X, Calendar, Tag, User } from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { LinkCard } from './link-card';
import { LinkDialog } from './link-dialog';
import { ApplicationSidebar } from './link-manager-sidebar';
import { AdvancedFilters } from './link-adnaced-filters';
import { getLinks, getLinksByApplication, getCommonLinks } from '@/app/actions/link-manager/link-manager';
import type { LinkWithApplications, LinkFilters, LinkSortOptions } from '@/app/types/link-manager';

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
  activeTab = 'all', // ✅ Default value as fallback
  onTabChange
}: LinkManagerDashboardProps) {
  // ✅ Additional safety check at the top of component
  const safeActiveTab = activeTab || 'all';

  // State management
  const [links, setLinks] = useState<LinkWithApplications[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<LinkSortOptions>('created-desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkWithApplications | null>(null);

  // Enhanced filters state
  const [filters, setFilters] = useState<LinkFilters>({});
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // ✅ Enhanced search with proper application filtering
  const loadLinks = async () => {
    setLoading(true);
    try {
      let result;
      
      // ✅ Always include search term in filters, even for application-specific views
      const enhancedFilters: LinkFilters = {
        ...filters,
        search: searchTerm.trim() || undefined, // ✅ Only add search if not empty
      };

      // ✅ Handle application-specific filtering properly using safeActiveTab
      if (safeActiveTab.startsWith('app-')) {
        const appId = safeActiveTab.replace('app-', '');
        // ✅ Merge application filter with existing filters
        enhancedFilters.applicationIds = [appId];
        result = await getLinks(teamId, enhancedFilters, sortBy, currentPage, 20);
      } else {
        switch (safeActiveTab) {
          case 'common':
            enhancedFilters.isCommon = true;
            result = await getLinks(teamId, enhancedFilters, sortBy, currentPage, 20);
            break;
          case 'pinned':
            enhancedFilters.isPinned = true;
            result = await getLinks(teamId, enhancedFilters, sortBy, currentPage, 20);
            break;
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
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update active filters count
  useEffect(() => {
    const count = Object.values(filters).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      if (value === null || value === undefined) return false;
      return true;
    }).length;
    setActiveFiltersCount(count);
  }, [filters]);

  // Load links when dependencies change (using safeActiveTab)
  useEffect(() => {
    loadLinks();
  }, [teamId, safeActiveTab, currentPage, sortBy, filters]);

  // ✅ Debounced search that works with all tabs
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadLinks();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when tab changes (using safeActiveTab)
  useEffect(() => {
    setCurrentPage(1);
  }, [safeActiveTab]);

  // Handle link actions
  const handleEditLink = (link: LinkWithApplications) => {
    setEditingLink(link);
    setDialogOpen(true);
  };

  const handleDeleteLink = (linkId: string) => {
    setLinks(prevLinks => prevLinks.filter(link => link.id !== linkId));
    setTotalCount(prev => prev - 1);
  };

  const handleCreateLink = () => {
    setEditingLink(null);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    loadLinks();
  };

  // ✅ Clear all filters
  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  // ✅ Apply advanced filters
  const handleApplyFilters = (newFilters: LinkFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setShowAdvancedFilters(false);
  };

  const getPinnedLinks = () => {
    return links.filter(link => link.isPinned);
  };

  const getRegularLinks = () => {
    return links.filter(link => !link.isPinned);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4 flex-1">
          {/* ✅ Fixed Search with null check */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search links${safeActiveTab.startsWith('app-') ? ' in this application' : ''}...`}
              className="pl-10 pr-10"
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
            <SheetContent className="w-[400px] sm:w-[540px] p-4">
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
          {/* View Mode Toggle */}
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
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

          {/* Create Link */}
          <Button onClick={handleCreateLink}>
            <Plus className="h-4 w-4 mr-2" />
            Add Link
          </Button>
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

          {(filters.dateFrom || filters.dateTo) && (
            <Badge variant="secondary" className="gap-1">
              Date range
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setFilters(prev => ({ ...prev, dateFrom: undefined, dateTo: undefined }))}
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
        <p className="text-sm text-muted-foreground">
          Showing {links.length} of {totalCount} links
          {safeActiveTab.startsWith('app-') && (
            <span className="ml-1">
              in {teamApplications.find(app => app.id === safeActiveTab.replace('app-', ''))?.applicationName}
            </span>
          )}
        </p>
        
        {safeActiveTab === 'all' && (
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>📌 {getPinnedLinks().length} pinned</span>
            <span>🔗 {getRegularLinks().length} regular</span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className={viewMode === 'grid' ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "space-y-2"}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={viewMode === 'grid' ? "h-48 bg-muted animate-pulse rounded-lg" : "h-16 bg-muted animate-pulse rounded-lg"} />
          ))}
        </div>
      ) : (
        <>
          {/* Pinned Links Section */}
          {safeActiveTab === 'all' && getPinnedLinks().length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold">Pinned Links</h2>
                <Badge variant="secondary">{getPinnedLinks().length}</Badge>
              </div>
              
              <div className={viewMode === 'grid' 
                ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" 
                : "space-y-2"
              }>
                {getPinnedLinks().map((link) => (
                  <LinkCard
                    key={link.id}
                    link={{
                      ...link,
                      // Ensure status is never null for LinkCard
                      status: link.status ?? "inactive"
                    }}
                    teamId={teamId}
                    onEdit={handleEditLink as any}
                    onDelete={handleDeleteLink}
                    onUpdate={loadLinks}
                    viewMode={viewMode}
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
                  <h2 className="text-lg font-semibold">All Links</h2>
                  <Badge variant="secondary">{getRegularLinks().length}</Badge>
                </div>
              )}
              
              <div className={viewMode === 'grid' 
                ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" 
                : "space-y-2"
              }>
                {(safeActiveTab === 'all' ? getRegularLinks() : links).map((link) => (
                  <LinkCard
                    key={link.id}
                    link={{
                      ...link,
                      // Ensure status is never null for LinkCard
                      status: link.status ?? "inactive"
                    }}
                    teamId={teamId}
                    onEdit={handleEditLink as any}
                    onDelete={handleDeleteLink}
                    onUpdate={loadLinks}
                    viewMode={viewMode}
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
              <h3 className="text-lg font-semibold mb-2">No links found</h3>
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
