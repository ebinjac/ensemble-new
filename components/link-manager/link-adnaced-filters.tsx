// app/components/link-manager/AdvancedFilters.tsx
'use client'

import { useState, useEffect } from 'react';
import { Tag, User, Building2, Filter, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getExistingTags, getExistingCreators } from '@/app/actions/link-manager/link-manager';
import type { LinkFilters } from '@/app/types/link-manager';

interface AdvancedFiltersProps {
  filters: LinkFilters;
  onApplyFilters: (filters: LinkFilters) => void;
  onClearFilters: () => void;
  teamApplications: Array<{
    id: string;
    applicationName: string;
    tla: string;
    status: string;
  }>;
  teamId: string;
}

export function AdvancedFilters({
  filters,
  onApplyFilters,
  onClearFilters,
  teamApplications,
  teamId
}: AdvancedFiltersProps) {
  const [localFilters, setLocalFilters] = useState<LinkFilters>(filters);
  
  // ✅ Auto-populated options
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [existingCreators, setExistingCreators] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Popover states
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [creatorPopoverOpen, setCreatorPopoverOpen] = useState(false);

  // Update local filters when parent filters change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // ✅ Load existing tags and creators
  useEffect(() => {
    const loadFilterOptions = async () => {
      setLoadingOptions(true);
      try {
        const [tags, creators] = await Promise.all([
          getExistingTags(teamId),
          getExistingCreators(teamId)
        ]);
        setExistingTags(tags);
        setExistingCreators(creators);
      } catch (error) {
        console.error('Error loading filter options:', error);
      } finally {
        setLoadingOptions(false);
      }
    };

    if (teamId) {
      loadFilterOptions();
    }
  }, [teamId]);

  const handleStatusChange = (status: string) => {
    setLocalFilters(prev => ({
      ...prev,
      status: status === 'all' ? undefined : status as any
    }));
  };

  const handleCategoryChange = (category: string) => {
    setLocalFilters(prev => ({
      ...prev,
      category: category === 'all' ? undefined : category
    }));
  };

  const handleApplicationToggle = (appId: string, checked: boolean) => {
    setLocalFilters(prev => {
      const currentApps = prev.applicationIds || [];
      const newApps = checked 
        ? [...currentApps, appId]
        : currentApps.filter(id => id !== appId);
      
      return {
        ...prev,
        applicationIds: newApps.length > 0 ? newApps : undefined
      };
    });
  };

  // ✅ Handle tag selection from dropdown
  const handleTagSelect = (tag: string) => {
    setLocalFilters(prev => {
      const currentTags = prev.tags || [];
      const newTags = currentTags.includes(tag)
        ? currentTags.filter(t => t !== tag)
        : [...currentTags, tag];
      
      return {
        ...prev,
        tags: newTags.length > 0 ? newTags : undefined
      };
    });
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setLocalFilters(prev => {
      const newTags = (prev.tags || []).filter(tag => tag !== tagToRemove);
      return {
        ...prev,
        tags: newTags.length > 0 ? newTags : undefined
      };
    });
  };

  // ✅ Handle creator selection from dropdown
  const handleCreatorSelect = (creator: string) => {
    setLocalFilters(prev => ({
      ...prev,
      createdBy: prev.createdBy === creator ? undefined : creator
    }));
    setCreatorPopoverOpen(false);
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
  };

  const handleClear = () => {
    setLocalFilters({});
    onClearFilters();
  };

  const getActiveFiltersCount = () => {
    return Object.values(localFilters).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      if (value === null || value === undefined) return false;
      return true;
    }).length;
  };

  return (
    <div className="space-y-6 pt-6">
      {/* Status Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Status
        </Label>
        <Select 
          value={localFilters.status || 'all'} 
          onValueChange={handleStatusChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="broken">Broken</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Category Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Category</Label>
        <Select 
          value={localFilters.category || 'all'} 
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="documentation">Documentation</SelectItem>
            <SelectItem value="tool">Tool</SelectItem>
            <SelectItem value="resource">Resource</SelectItem>
            <SelectItem value="dashboard">Dashboard</SelectItem>
            <SelectItem value="repository">Repository</SelectItem>
            <SelectItem value="service">Service</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Application Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Applications
        </Label>
        <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2">
          {teamApplications.filter(app => app.status === 'active').map((app) => (
            <div key={app.id} className="flex items-center space-x-2">
              <Checkbox
                id={`app-filter-${app.id}`}
                checked={(localFilters.applicationIds || []).includes(app.id)}
                onCheckedChange={(checked) => handleApplicationToggle(app.id, checked as boolean)}
              />
              <Label htmlFor={`app-filter-${app.id}`} className="text-sm cursor-pointer flex-1">
                <span className="font-medium">{app.tla}</span>
                <span className="text-muted-foreground ml-1">({app.applicationName})</span>
              </Label>
            </div>
          ))}
        </div>
        {(localFilters.applicationIds || []).length > 0 && (
          <div className="text-xs text-muted-foreground">
            {localFilters.applicationIds!.length} application(s) selected
          </div>
        )}
      </div>

      <Separator />

      {/* ✅ Enhanced Tags Filter with Auto-populated Options */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Tags
        </Label>
        
        <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={tagPopoverOpen}
              className="w-full justify-between"
            >
              {(localFilters.tags || []).length > 0
                ? `${localFilters.tags!.length} tag(s) selected`
                : "Select tags..."}
              <Filter className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search tags..." />
              <CommandEmpty>No tags found.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  <ScrollArea className="h-60">
                    {loadingOptions ? (
                      <CommandItem disabled>Loading tags...</CommandItem>
                    ) : existingTags.length > 0 ? (
                      existingTags.map((tag) => (
                        <CommandItem
                          key={tag}
                          value={tag}
                          onSelect={() => handleTagSelect(tag)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              (localFilters.tags || []).includes(tag)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          #{tag}
                        </CommandItem>
                      ))
                    ) : (
                      <CommandItem disabled>No tags available</CommandItem>
                    )}
                  </ScrollArea>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {(localFilters.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(localFilters.tags || []).map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                #{tag}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleRemoveTag(tag)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* ✅ Enhanced Created By Filter with Auto-populated Options */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <User className="h-4 w-4" />
          Created By
        </Label>
        
        <Popover open={creatorPopoverOpen} onOpenChange={setCreatorPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={creatorPopoverOpen}
              className="w-full justify-between"
            >
              {localFilters.createdBy || "Select creator..."}
              <Filter className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search creators..." />
              <CommandEmpty>No creators found.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  <ScrollArea className="h-60">
                    {loadingOptions ? (
                      <CommandItem disabled>Loading creators...</CommandItem>
                    ) : existingCreators.length > 0 ? (
                      existingCreators.map((creator) => (
                        <CommandItem
                          key={creator}
                          value={creator}
                          onSelect={() => handleCreatorSelect(creator)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              localFilters.createdBy === creator
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {creator}
                        </CommandItem>
                      ))
                    ) : (
                      <CommandItem disabled>No creators available</CommandItem>
                    )}
                  </ScrollArea>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {localFilters.createdBy && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              {localFilters.createdBy}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setLocalFilters(prev => ({ ...prev, createdBy: undefined }))}
              />
            </Badge>
          </div>
        )}
      </div>

      <Separator />

      {/* Boolean Filters */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Link Properties</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pinned-filter"
              checked={localFilters.isPinned === true}
              onCheckedChange={(checked) => setLocalFilters(prev => ({
                ...prev,
                isPinned: checked ? true : undefined
              }))}
            />
            <Label htmlFor="pinned-filter" className="text-sm cursor-pointer">
              Only pinned links
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="common-filter"
              checked={localFilters.isCommon === true}
              onCheckedChange={(checked) => setLocalFilters(prev => ({
                ...prev,
                isCommon: checked ? true : undefined
              }))}
            />
            <Label htmlFor="common-filter" className="text-sm cursor-pointer">
              Only common links
            </Label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={handleApply} className="flex-1">
          Apply Filters
          {getActiveFiltersCount() > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>
        <Button variant="outline" onClick={handleClear}>
          Clear All
        </Button>
      </div>
    </div>
  );
}
