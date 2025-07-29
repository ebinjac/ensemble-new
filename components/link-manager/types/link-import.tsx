// app/types/link-import.ts
export interface ImportLinkData {
    type: 'file' | 'text' | 'urls';
    file?: File;
    content?: string;
    teamId: string;
  }
  
  export interface ParsedLink {
    title: string;
    url: string;
    description?: string;
    category?: string;
    applicationIds?: string[]; // ✅ Already exists, making sure it's included
    tags?: string[];
    isValid: boolean;
    source?: string;
    lineNumber?: number;
    
    // Intelligence features
    suggestedCategory?: string;
    suggestedTags?: string[];
    confidence?: number;
    matchedRules?: string[];
    isEdited?: boolean;
  }
  
  export interface ImportSettings {
    enableIntelligentCategorization: boolean;
    enableIntelligentTagging: boolean;
    autoApplyHighConfidence: boolean; // Auto-apply if confidence > 80%
    defaultCategory: string;
    defaultApplicationIds: string[];
  }
  
  export interface ImportResult {
    success: boolean;
    successCount: number;
    errorCount: number;
    duplicateCount?: number;
    errors?: string[];
    duplicates?: string[];
  }
  
  export interface ImportValidationResult {
    valid: ParsedLink[];
    invalid: ParsedLink[];
    duplicates: ParsedLink[];
  }
  