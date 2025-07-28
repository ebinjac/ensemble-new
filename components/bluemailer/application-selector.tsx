'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TeamApplication } from '@/app/types/bluemailer';

interface ApplicationSelectorProps {
  applications: TeamApplication[];
  selectedApplicationIds: string[];
  onApplicationsChange: (applicationIds: string[]) => void;
  className?: string;
}

export function ApplicationSelector({
  applications,
  selectedApplicationIds,
  onApplicationsChange,
  className
}: ApplicationSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedApplications = applications.filter(app => 
    selectedApplicationIds.includes(app.id)
  );

  const handleSelect = (applicationId: string) => {
    if (selectedApplicationIds.includes(applicationId)) {
      onApplicationsChange(selectedApplicationIds.filter(id => id !== applicationId));
    } else {
      onApplicationsChange([...selectedApplicationIds, applicationId]);
    }
  };

  const removeApplication = (applicationId: string) => {
    onApplicationsChange(selectedApplicationIds.filter(id => id !== applicationId));
  };

  return (
    <div className={className}>
      <Label>Tagged Applications</Label>
      
      {/* Selected Applications */}
      {selectedApplications.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 mb-2">
          {selectedApplications.map((app) => (
            <Badge key={app.id} variant="secondary" className="pr-1">
              {app.applicationName}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                onClick={() => removeApplication(app.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedApplications.length === 0 
              ? "Select applications..." 
              : `${selectedApplications.length} application${selectedApplications.length !== 1 ? 's' : ''} selected`
            }
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search applications..." />
            <CommandEmpty>No applications found.</CommandEmpty>
            <CommandGroup>
              {applications.map((app) => (
                <CommandItem
                  key={app.id}
                  value={app.applicationName}
                  onSelect={() => handleSelect(app.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedApplicationIds.includes(app.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{app.applicationName}</div>
                    <div className="text-sm text-muted-foreground">
                      {app.tla} • Tier {app.tier} • {app.status}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      <div className="text-xs text-muted-foreground mt-1">
        Tag this template to applications for better organization
      </div>
    </div>
  );
}
