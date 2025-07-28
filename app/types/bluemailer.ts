import type { 
    EmailTemplate, 
    TemplateStatus, 
    TemplateVisibility, 
    TemplateCategory 
  } from '@/db/schema/bluemailer';
  
  export interface TemplateWithMetadata extends EmailTemplate {
    components: any[];
    applicationTags: {
      applicationId: string;
      isPrimary: boolean;
      applicationName: string;
    }[];
  }
  
  export interface SharedTemplate {
    id: string;
    name: string;
    description: string | null;
    category: TemplateCategory;
    status: TemplateStatus;
    thumbnailUrl: string | null;
    usageCount: number;
    createdAt: Date;
    ownerTeamName: string;
    canEdit: boolean;
    canDuplicate: boolean;
    sharedBy: string;
    sharedAt: Date;
  }
  
  export interface TeamApplication {
    id: string;
    applicationName: string;
    carId: string;
    tla: string;
    tier: number;
    status: string;
  }
  
  export interface TemplateFilters {
    search: string;
    category: TemplateCategory | 'all';
    status: TemplateStatus | 'all';
    visibility: TemplateVisibility | 'all';
    applicationId: string | 'all';
    sortBy: 'name' | 'created' | 'updated' | 'usage';
    sortOrder: 'asc' | 'desc';
  }
  