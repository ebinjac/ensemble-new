// Email Editor Types

export interface EmailTemplate {
  id: string;
  name: string;
  settings: TemplateSettings;
  components: EmailComponent[];
}

export interface TemplateSettings {
  width: number;
  backgroundColor: string;
  contentBackgroundColor: string;
  fontFamily: string;
  padding: string;
}

export interface EmailComponent {
  id: string;
  type: ComponentType;
  content: any;
  styles: ComponentStyles;
  isNew?: boolean;
}

export type ComponentType = 
  | 'text'
  | 'heading'
  | 'image'
  | 'button'
  | 'divider'
  | 'spacer'
  | 'columns'
  | 'list';

export interface ComponentStyles {
  fontSize?: string;
  color?: string;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: string;
  backgroundColor?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  border?: string;
  width?: string;
  height?: string;
  maxWidth?: string;
  [key: string]: any;
} 