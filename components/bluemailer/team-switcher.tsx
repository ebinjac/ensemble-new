'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/(auth)/providers/AuthProvider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, ChevronDown } from 'lucide-react';

export function TeamSwitcher() {
  const { teams, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const currentTeamId = params.teamId as string;

  const currentTeam = teams.find(team => team.id === currentTeamId);

  const handleTeamChange = (teamId: string) => {
    router.push(`/tools/teams/${teamId}/bluemailer`);
  };

  if (teams.length <= 1) {
    return (
      <div className="flex items-center space-x-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{currentTeam?.name || 'Team'}</span>
        <Badge variant="secondary" className="text-xs">
          {currentTeam?.role}
        </Badge>
      </div>
    );
  }

  return (
    <Select value={currentTeamId} onValueChange={handleTeamChange}>
      <SelectTrigger className="w-[200px]">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <span>{currentTeam?.name || 'Select Team'}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {teams.map((team) => (
          <SelectItem key={team.id} value={team.id}>
            <div className="flex items-center justify-between w-full">
              <span>{team.name}</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {team.role}
              </Badge>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
