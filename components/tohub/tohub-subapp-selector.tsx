// .../components/SubAppSelector.tsx
'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { createSubApp } from '@/app/actions/tohub/tohub';
import { useState } from 'react';

interface Props {
  applicationId: string;
  applicationName: string;
  subApps: any[];
  selected: string[];
  onChange(ids: string[]): void;
  onCreated(sub: any): void;
}

export default function SubAppSelector(props: Props) {
  const { applicationId, applicationName, subApps, selected, onChange, onCreated } = props;

  const toggle = (id: string) => {
    selected.includes(id)
      ? onChange(selected.filter(x => x !== id))
      : onChange([...selected, id]);
  };

  const handleAdd = async () => {
    const name = prompt('New sub-application name');
    if (!name) return;
    const sub = await createSubApp('', applicationId, { name });
    onCreated(sub);
  };

  if (subApps.length === 0) {
    // main app default
    return (
      <div className="flex items-center space-x-2">
        <Checkbox checked disabled />
        <Label>{applicationName} (Main)</Label>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {subApps.map(sa => (
        <div key={sa.id} className="flex items-center space-x-2">
          <Checkbox
            checked={selected.includes(sa.id)}
            onCheckedChange={() => toggle(sa.id)}
          />
          <Label>{sa.name}</Label>
        </div>
      ))}

      <Button variant="outline" size="sm" className="mt-2" onClick={handleAdd}>
        <Plus className="h-4 w-4 mr-1" />
        Add Sub-App
      </Button>
    </div>
  );
}
