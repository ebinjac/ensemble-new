// app/(tools)/tools/teams/[teamId]/tohub/components/CommentsCell.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CommentsCellProps {
  content: string;
  maxLength?: number;
}

export function CommentsCell({ content, maxLength = 150 }: CommentsCellProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Strip HTML tags to get plain text
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };
  
  const plainText = stripHtml(content);
  const isLongContent = plainText.length > maxLength;
  const displayText = isExpanded || !isLongContent 
    ? plainText 
    : `${plainText.substring(0, maxLength)}...`;

  return (
    <div className="max-w-xs w-full">
      {/* Text content with proper wrapping */}
      <div className="text-sm text-foreground leading-relaxed break-words whitespace-pre-wrap">
        {displayText}
      </div>
      
      {/* Expand/Collapse button for long content */}
      {isLongContent && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 p-0 mt-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Show more
            </>
          )}
        </Button>
      )}
    </div>
  );
}
