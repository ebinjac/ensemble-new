// app/components/team-switcher/TeamSwitcher.tsx
'use client'

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/(auth)/providers/AuthProvider';
import { Check, ChevronsUpDown, Crown, Users, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TeamSwitcherProps {
  currentTeamId: string;
  className?: string;
}

export function TeamSwitcher({ currentTeamId, className }: TeamSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  const { teams, loading, isAuthenticated } = useAuth();

  const currentTeam = teams?.find(team => team.id === currentTeamId);

  const handleTeamSelect = (teamId: string) => {
    if (teamId === currentTeamId) {
      setOpen(false);
      return;
    }

    const newPath = pathname.replace(`/teams/${currentTeamId}`, `/teams/${teamId}`);
    router.push(newPath);
    setOpen(false);
  };

  if (!isAuthenticated || loading || !teams || teams.length <= 1) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select team"
          className={cn(
            "justify-between bg-background/50 backdrop-blur-sm hover:bg-accent/50 h-[100%] border-border/50",
            className
          )}
        >
          <div className="flex items-center space-x-2 min-w-0">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-primary/10 text-primary border border-border/50">
                {currentTeam?.name?.charAt(0)?.toUpperCase() || 'T'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col items-start min-w-0">
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium truncate">
                  {currentTeam?.name || 'Select team...'}
                </span>
                {currentTeam?.role === 'admin' && (
                  <Crown className="h-3 w-3 text-primary flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center space-x-1">
                <Badge 
                  variant={currentTeam?.role === 'admin' ? 'default' : 'secondary'} 
                  className="text-xs h-4 px-1.5"
                >
                  {currentTeam?.role}
                </Badge>
              </div>
            </div>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className={cn("p-0 bg-background/95 backdrop-blur-sm border-border/50", className)} align="end">
        <Command>
          <CommandInput placeholder="Search teams..." className="border-none" />
          <CommandEmpty>No teams found.</CommandEmpty>
          <CommandList>
            <CommandGroup heading="Your Teams">
              {teams.map((team) => (
                <CommandItem
                  key={team.id}
                  value={team.name}
                  onSelect={() => handleTeamSelect(team.id)}
                  className="cursor-pointer hover:bg-accent/50"
                >
                  <div className="flex items-center space-x-3 w-full">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary border border-border/50">
                        {team.name?.charAt(0)?.toUpperCase() || 'T'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium truncate">
                          {team.name}
                        </span>
                        {team.role === 'admin' && (
                          <Crown className="h-3 w-3 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant={team.role === 'admin' ? 'default' : 'secondary'} 
                          className="text-xs h-4 px-1.5"
                        >
                          {team.role}
                        </Badge>
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>

                    <Check
                      className={cn(
                        "ml-2 h-4 w-4 flex-shrink-0",
                        currentTeamId === team.id ? "opacity-100 text-primary" : "opacity-0"
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
