// app/(tools)/tools/teams/[teamId]/tohub/components/PrintLinkButton.tsx
'use client';

interface PrintLinkButtonProps {
  searchParams: Record<string, string | undefined>;
}

export function PrintLinkButton({ searchParams }: PrintLinkButtonProps) {
  const createPrintUrl = () => {
    const params = new URLSearchParams();
    
    // Add existing search params
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    
    // Add print parameter
    params.set('print', 'true');
    
    return `?${params.toString()}`;
  };

  return (
    <a
      href={createPrintUrl()}
      target="_blank"
      className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 text-sm"
    >
      Full Screen
    </a>
  );
}
