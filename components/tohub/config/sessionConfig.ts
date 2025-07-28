// app/tools/teams/[teamId]/tohub/config/sectionConfigs.ts
export interface SectionConfig {
    id: string;
    title: string;
    section: 'rfc' | 'inc' | 'alerts' | 'mim' | 'email_slack' | 'fyi';
    columns: { key: string; label: string; required?: boolean }[];
    customFields?: CustomField[];
    hasSubAppSelection?: boolean;
    hasRichTextComments?: boolean;
    hasImportantFlag?: boolean;
    hasStatusDropdown?: boolean;
    statusOptions?: StatusOption[];
    customValidation?: (formData: any) => string | null;
    customFormRenderer?: (props: any) => React.ReactNode;
    customTableRenderer?: (props: any) => React.ReactNode;
    titleGenerator?: (formData: any) => string;
  }
  
  interface CustomField {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'email' | 'url' | 'rich-text';
    required?: boolean;
    placeholder?: string;
    options?: { value: string; label: string }[];
    conditional?: (formData: any) => boolean;
  }
  
  interface StatusOption {
    value: string;
    label: string;
    color: string;
  }
  
  // RFC Configuration
  export const RFC_CONFIG: SectionConfig = {
    id: 'rfc',
    title: 'RFCs',
    section: 'rfc',
    columns: [
      { key: 'rfcNumber', label: 'RFC#', required: true },
      { key: 'validatedBy', label: 'Validated By' },
    ],
    hasSubAppSelection: true,
    hasRichTextComments: true,
    hasImportantFlag: true,
    hasStatusDropdown: true,
    statusOptions: [
      { value: 'draft', label: 'Draft', color: 'bg-gray-500' },
      { value: 'submitted', label: 'Submitted', color: 'bg-blue-500' },
      { value: 'under_review', label: 'Under Review', color: 'bg-yellow-500' },
      { value: 'approved', label: 'Approved', color: 'bg-green-500' },
      { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
      { value: 'implemented', label: 'Implemented', color: 'bg-purple-500' },
      { value: 'closed', label: 'Closed', color: 'bg-gray-700' },
      { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-500' },
      { value: 'completed', label: 'Completed', color: 'bg-gray-500' },
      { value: 'pending_approval', label: 'Pending Approval', color: 'bg-gray-500' },
    ],
  };
  
  // INC Configuration
  export const INC_CONFIG: SectionConfig = {
    id: 'inc',
    title: 'INC / Incidents',
    section: 'inc',
    columns: [
      { key: 'incNumber', label: 'INC#', required: true },
      { key: 'incidentDescription', label: 'Description' },
    ],
    hasSubAppSelection: true,
    hasRichTextComments: true,
    hasImportantFlag: true,
    hasStatusDropdown: true,
    statusOptions: [
      { value: 'new', label: 'New', color: 'bg-blue-500' },
      { value: 'assigned', label: 'Assigned', color: 'bg-yellow-500' },
      { value: 'in_progress', label: 'In Progress', color: 'bg-orange-500' },
      { value: 'pending', label: 'Pending', color: 'bg-purple-500' },
      { value: 'resolved', label: 'Resolved', color: 'bg-green-500' },
      { value: 'closed', label: 'Closed', color: 'bg-gray-700' },
    ],
  };
  
  // Alerts Configuration
  export const ALERTS_CONFIG: SectionConfig = {
    id: 'alerts',
    title: 'Alerts / Issues',
    section: 'alerts',
    columns: [
      { key: 'title', label: 'Issue', required: true },
      { key: 'alertDescription', label: 'Description' },
    ],
    hasSubAppSelection: true,
    hasRichTextComments: true,
    hasImportantFlag: true,
    hasStatusDropdown: true,
    statusOptions: [
      { value: 'active', label: 'Active', color: 'bg-red-500' },
      { value: 'acknowledged', label: 'Acknowledged', color: 'bg-yellow-500' },
      { value: 'investigating', label: 'Investigating', color: 'bg-orange-500' },
      { value: 'resolved', label: 'Resolved', color: 'bg-green-500' },
      { value: 'false_positive', label: 'False Positive', color: 'bg-gray-500' },
    ],
  };
  
  // MIM Configuration
  export const MIM_CONFIG: SectionConfig = {
    id: 'mim',
    title: 'MIM',
    section: 'mim',
    columns: [
      { key: 'mimLink', label: 'MIM Link' },
      { key: 'mimSlackLink', label: 'MIM Slack Link' },
    ],
    customFields: [
      { key: 'mimLink', label: 'MIM Link', type: 'url', required: true, placeholder: 'https://mim.example.com/...' },
      { key: 'mimSlackLink', label: 'MIM Slack Link', type: 'url', placeholder: 'https://slack.com/channels/...' },
    ],
    hasSubAppSelection: true,
    hasRichTextComments: true,
    hasImportantFlag: true,
    titleGenerator: (formData) => `MIM: ${formData.mimLink?.slice(0, 50)}...`,
    customValidation: (formData) => {
      if (!formData.mimLink?.trim()) {
        return 'MIM Link is required';
      }
      return null;
    },
  };
  
  // Email/Slack Configuration
  export const EMAIL_SLACK_CONFIG: SectionConfig = {
    id: 'email_slack',
    title: 'Email / Slack',
    section: 'email_slack',
    columns: [
      { key: 'type', label: 'Type' },
      { key: 'emailSubject', label: 'Email Subject' },
      { key: 'slackLink', label: 'Slack Link' },
    ],
    customFields: [
      { 
        key: 'type', 
        label: 'Type', 
        type: 'select', 
        required: true,
        options: [
          { value: 'email', label: 'Email' },
          { value: 'slack', label: 'Slack' },
        ]
      },
      { 
        key: 'emailSubject', 
        label: 'Email Subject', 
        type: 'text', 
        required: true,
        placeholder: 'Enter email subject...',
        conditional: (formData) => formData.type === 'email'
      },
      { 
        key: 'slackLink', 
        label: 'Slack Link', 
        type: 'url', 
        required: true,
        placeholder: 'https://slack.com/channels/...',
        conditional: (formData) => formData.type === 'slack'
      },
    ],
    hasSubAppSelection: true,
    hasRichTextComments: true,
    hasImportantFlag: true,
    titleGenerator: (formData) => 
      formData.type === 'email' 
        ? `Email: ${formData.emailSubject}` 
        : `Slack: ${formData.slackLink?.slice(0, 50)}...`,
    customValidation: (formData) => {
      if (formData.type === 'email' && !formData.emailSubject?.trim()) {
        return 'Email subject is required';
      }
      if (formData.type === 'slack' && !formData.slackLink?.trim()) {
        return 'Slack link is required';
      }
      return null;
    },
  };
  
  // FYI Configuration
  export const FYI_CONFIG: SectionConfig = {
    id: 'fyi',
    title: 'FYI - Additional Information',
    section: 'fyi',
    columns: [
      { key: 'title', label: 'Title', required: true },
      // ✅ REMOVED: priority column
    ],
    hasSubAppSelection: true,
    hasRichTextComments: true,
    hasImportantFlag: true,
    customValidation: (formData) => {
      if (!formData.title?.trim()) {
        return 'Title is required';
      }
      return null;
    },
  };
  
  // Export all configurations
  export const SECTION_CONFIGS = {
    rfc: RFC_CONFIG,
    inc: INC_CONFIG,
    alerts: ALERTS_CONFIG,
    mim: MIM_CONFIG,
    email_slack: EMAIL_SLACK_CONFIG,
    fyi: FYI_CONFIG,
  };
  