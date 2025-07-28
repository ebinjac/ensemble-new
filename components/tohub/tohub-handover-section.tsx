// .../components/HandoverSection.tsx
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { updateSessionHandover } from '@/app/actions/tohub/tohub';

export default function HandoverSection({ session }: { session: any }) {
  const [from, setFrom] = useState(session.handoverFrom ?? '');
  const [to, setTo] = useState(session.handoverTo ?? '');

  useEffect(() => {
    const timer = setTimeout(() => {
      updateSessionHandover(session.id, { handoverFrom: from, handoverTo: to });
    }, 800);
    return () => clearTimeout(timer);
  }, [from, to, session.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Handover</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input placeholder="Handover from" value={from} onChange={e => setFrom(e.target.value)} />
        <Input placeholder="Handover to" value={to} onChange={e => setTo(e.target.value)} />
      </CardContent>
    </Card>
  );
}
