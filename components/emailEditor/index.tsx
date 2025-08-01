'use client';

import React, { useState, useCallback, ReactElement, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Type,
  Heading,
  Image,
  MousePointer,
  Minus,
  Move,
  List,
  Undo2,
  Redo2,
  Eye,
  Download,
  Monitor,
  Smartphone,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Columns,
  Grid3X3,
  Settings,
  Layout,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Columns2,
  Columns3,
  Tablet,
  Save,
  Check,
  FileText,
  Layers,
  Loader2,
  Search,
  X
} from 'lucide-react';
import EnsembleLogo from '../home/logo';
import { getTemplateLibrary, getTemplateLibraryWithComponents, getComponentLibrary, incrementTemplateUsage } from '@/app/actions/bluemailer/library';
import { useParams } from 'next/navigation';
import { getLibraryItemWithComponents, getTeamLibraryItems } from '@/app/actions/bluemailer/team-library';
import { Badge } from '../ui/badge';


// Enhanced Number Input Component
interface NumberInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  units?: string[];
  defaultUnit?: string;
}

function NumberInput({
  value,
  onChange,
  placeholder = "0",
  min = 0,
  max = 1000,
  step = 1,
  units = ['px', 'em', 'rem', '%'],
  defaultUnit = 'px'
}: NumberInputProps) {
  const parseValue = (val: string) => {
    if (!val || val === 'transparent' || val === 'none') {
      return { number: 0, unit: defaultUnit };
    }
    const match = val.match(/^(-?\d*\.?\d*)(.*)/);
    const parsedUnit = match?.[2]?.trim() || defaultUnit;
    return {
      number: parseFloat(match?.[1] || '0') || 0,
      unit: parsedUnit === '' ? defaultUnit : parsedUnit
    };
  };

  const { number, unit } = parseValue(value);

  const handleNumberChange = (newNumber: number) => {
    onChange(`${newNumber}${unit}`);
  };

  const handleUnitChange = (newUnit: string) => {
    onChange(`${number}${newUnit}`);
  };

  const validUnits = units.filter(u => u !== null && u !== undefined && u.toString().trim() !== '');
  const safeUnits = validUnits.length > 0 ? validUnits : [defaultUnit];
  const currentUnit = safeUnits.includes(unit) ? unit : safeUnits[0];

  return (
    <div className="flex space-x-1">
      <Input
        type="number"
        value={number}
        onChange={(e) => handleNumberChange(parseFloat(e.target.value) || 0)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className="flex-1"
      />
      <Select value={currentUnit} onValueChange={handleUnitChange}>
        <SelectTrigger className="w-16">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {safeUnits.map((u) => (
            <SelectItem key={u} value={u}>{u}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Unified Spacing Control Component
interface SpacingControlProps {
  label: string;
  values: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  onChange: (property: string, value: string, batchUpdates?: Record<string, string>) => void;
  propertyPrefix: 'margin' | 'padding';
}

function SpacingControl({ label, values, onChange, propertyPrefix }: SpacingControlProps) {
  const [isUnified, setIsUnified] = useState(true);

  // Check if all sides have the same value
  const allSidesEqual = useCallback(() => {
    const sides = [values.top, values.right, values.bottom, values.left];
    const nonEmptyValues = sides.filter(v => v && v !== '0px');
    if (nonEmptyValues.length === 0) return true;
    return nonEmptyValues.every(v => v === nonEmptyValues[0]);
  }, [values]);

  const getUnifiedValue = useCallback(() => {
    if (allSidesEqual()) {
      return values.top || values.right || values.bottom || values.left || '0px';
    }
    // If sides are different, show the top value or most common
    return values.top || '0px';
  }, [values, allSidesEqual]);

  const [unifiedValue, setUnifiedValue] = useState(() => getUnifiedValue());

  useEffect(() => {
    if (isUnified) {
      setUnifiedValue(getUnifiedValue());
    }
  }, [values, isUnified, getUnifiedValue]);

  // FIXED: Create a special batch update function
  const handleUnifiedChange = (value: string) => {
    setUnifiedValue(value);

    // Call a special batch function that updates all at once
    onChange('batch', value, {
      [`${propertyPrefix}Top`]: value,
      [`${propertyPrefix}Right`]: value,
      [`${propertyPrefix}Bottom`]: value,
      [`${propertyPrefix}Left`]: value
    });
  };

  const toggleUnified = () => {
    if (isUnified) {
      setIsUnified(false);
    } else {
      const newUnifiedValue = getUnifiedValue();
      setUnifiedValue(newUnifiedValue);
      handleUnifiedChange(newUnifiedValue);
      setIsUnified(true);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="flex items-center gap-2">
          {label}
          {!isUnified && !allSidesEqual() && (
            <span className="text-xs text-orange-500 bg-orange-100 px-1 rounded">Mixed</span>
          )}
        </Label>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleUnified}
          className="h-6 px-2 text-xs"
        >
          {isUnified ? 'More Options' : 'Unified'}
        </Button>
      </div>

      {isUnified ? (
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">All Sides</Label>
          <NumberInput
            value={unifiedValue}
            onChange={handleUnifiedChange}
            placeholder="0"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-xs text-gray-500 mb-1 block">Individual Control</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Top</Label>
              <NumberInput
                value={values.top || '0px'}
                onChange={(value) => onChange(`${propertyPrefix}Top`, value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-xs">Right</Label>
              <NumberInput
                value={values.right || '0px'}
                onChange={(value) => onChange(`${propertyPrefix}Right`, value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-xs">Bottom</Label>
              <NumberInput
                value={values.bottom || '0px'}
                onChange={(value) => onChange(`${propertyPrefix}Bottom`, value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-xs">Left</Label>
              <NumberInput
                value={values.left || '0px'}
                onChange={(value) => onChange(`${propertyPrefix}Left`, value)}
                placeholder="0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



// Component Management Toolbar
interface ComponentToolbarProps {
  component: EmailComponent;
  index: number;
  totalComponents: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function ComponentToolbar({
  component,
  index,
  totalComponents,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete
}: ComponentToolbarProps) {
  return (
    <div className=" component-toolbar absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-card rounded shadow-lg border p-1 flex space-x-1 z-10">
      <Button
        size="sm"
        variant="ghost"
        onClick={onMoveUp}
        disabled={index === 0}
        className="h-6 w-6 p-0"
      >
        <ChevronUp className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onMoveDown}
        disabled={index === totalComponents - 1}
        className="h-6 w-6 p-0"
      >
        <ChevronDown className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onDuplicate}
        className="h-6 w-6 p-0"
      >
        <Copy className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onDelete}
        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

interface EnhancedPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
}

function EnhancedPreviewModal({ isOpen, onClose, htmlContent }: EnhancedPreviewModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedDevice, setSelectedDevice] = useState(DEFAULT_DEVICES.desktop);
  const [customWidth, setCustomWidth] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Update selected device when category changes
  useEffect(() => {
    if (!isCustomMode) {
      setSelectedDevice(DEFAULT_DEVICES[selectedCategory]);
    }
  }, [selectedCategory, isCustomMode]);

  const handleDeviceSelect = (device: { name: string; width: number }) => {
    setSelectedDevice(device);
    setIsCustomMode(false);
  };

  const handleCustomWidth = (width: string) => {
    const widthNum = parseInt(width);
    if (widthNum >= 200 && widthNum <= 2560) {
      setCustomWidth(width);
      setSelectedDevice({ name: 'Custom', width: widthNum });
      setIsCustomMode(true);
    }
  };

  const currentWidth = isCustomMode ? parseInt(customWidth) || 375 : selectedDevice.width;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] min-w-[95vw] h-[90vh] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-card">
          <div className="flex items-center justify-between px-20">
            <DialogTitle className="flex items-center space-x-2">
            </DialogTitle>

            {/* Device Controls */}
            <div className="flex items-center space-x-4">
              {/* Category Tabs */}
              <div className="flex bg-muted rounded-lg p-1">
                {(['desktop', 'tablet', 'mobile'] as const).map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="px-3 py-1 text-xs"
                  >
                    {category === 'desktop' && <Monitor className="h-3 w-3 mr-1" />}
                    {category === 'tablet' && <Tablet className="h-3 w-3 mr-1" />}
                    {category === 'mobile' && <Smartphone className="h-3 w-3 mr-1" />}
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Device Selector */}
              <Select
                value={selectedDevice.name}
                onValueChange={(value) => {
                  const allDevices = [
                    ...DEVICE_PRESETS.desktop,
                    ...DEVICE_PRESETS.tablet,
                    ...DEVICE_PRESETS.mobile
                  ];
                  const device = allDevices.find(d => d.name === value);
                  if (device) handleDeviceSelect(device);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEVICE_PRESETS[selectedCategory].map((device) => (
                    <SelectItem key={device.name} value={device.name}>
                      <div className="flex items-center justify-between w-full">
                        <span>{device.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {device.width}px
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Width Display/Custom Input */}
              <div className="flex items-center space-x-2">
                <Label className="text-sm text-muted-foreground">Width:</Label>
                <Input
                  type="number"
                  value={isCustomMode ? customWidth : selectedDevice.width}
                  onChange={(e) => handleCustomWidth(e.target.value)}
                  className="w-20 h-8 text-xs"
                  min="200"
                  max="2560"
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center space-x-1 border rounded">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newWidth = Math.max(200, currentWidth - 50);
                    handleCustomWidth(newWidth.toString());
                  }}
                  className="h-8 px-2"
                >
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <div className="px-2 text-xs border-x min-w-[60px] text-center">
                  {Math.round((currentWidth / 1440) * 100)}%
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newWidth = Math.min(2560, currentWidth + 50);
                    handleCustomWidth(newWidth.toString());
                  }}
                  className="h-8 px-2"
                >
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Preview Area */}
        <div className="flex-1  p-6 overflow-auto">
          <div className="flex justify-center items-start min-h-full">
            <div
              className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                width: `${currentWidth}px`,
                minHeight: '600px',
                maxWidth: '95%'
              }}
            >
              {/* Device Frame Header */}
              <div className="bg-gray-100 dark:bg-slate-800 px-4 py-2 border-b flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-muted-foreground">
                    {selectedDevice.name} - {currentWidth}px
                  </span>
                </div>
              </div>

              {/* Email Content */}
              <div className="relative">
                <iframe
                  srcDoc={htmlContent}
                  className="w-full border-0"
                  style={{
                    width: '100%',
                    height: '800px',
                    minHeight: '600px'
                  }}
                  title="Email Preview"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-card flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Live Preview</span>
            </div>
            <span>•</span>
            <span>Viewport: {currentWidth}px</span>
            <span>•</span>
            <span>Category: {selectedCategory}</span>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(htmlContent);
                // You can add a toast notification here
              }}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy HTML
            </Button>
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


// Enhanced Type Definitions with comprehensive styling
interface ComponentStyles {
  // Typography
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  lineHeight?: string;
  letterSpacing?: string;
  wordSpacing?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textDecoration?: string;
  textIndent?: string;

  // Colors and Effects
  color?: string;
  backgroundColor?: string;
  textShadow?: string;
  boxShadow?: string;
  opacity?: string;

  // Alignment and Layout
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';

  // Spacing
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;

  // Borders
  border?: string;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderRadius?: string;
  borderWidth?: string;
  borderStyle?: string;
  borderColor?: string;

  // Layout
  display?: string;
  width?: string;
  maxWidth?: string;
  minWidth?: string;
  height?: string;
  maxHeight?: string;
  minHeight?: string;

  // Advanced
  whiteSpace?: 'normal' | 'nowrap' | 'pre' | 'pre-line' | 'pre-wrap';
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  cursor?: string;
  transform?: string;
  transition?: string;

  listStyleType?: string;
  listStylePosition?: 'inside' | 'outside';
  listStyleImage?: string;

  gap?: string;
}

interface CanvasSettings {
  backgroundColor: string;
  contentBackgroundColor: string;
  contentWidth: string;
  maxWidth: string;
  padding: string;
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  color: string;
}

interface BaseComponent {
  id: string;
  type: string;
  styles?: ComponentStyles;
}

interface TextComponent extends BaseComponent {
  type: 'text';
  content: string;
}

interface HeadingComponent extends BaseComponent {
  type: 'heading';
  content: string;
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

interface ImageComponent extends BaseComponent {
  type: 'image';
  src: string;
  alt: string;
}

interface ButtonComponent extends BaseComponent {
  type: 'button';
  text: string;
  href: string;
}

interface DividerComponent extends BaseComponent {
  type: 'divider';
}

interface SpacerComponent extends BaseComponent {
  type: 'spacer';
  height: string;
}

interface ListComponent extends BaseComponent {
  type: 'list';
  listType: 'ul' | 'ol';
  items: string[];
}

interface ColumnComponent extends BaseComponent {
  type: 'column';
  columnWidths: string[];
  children: EmailComponent[][];
}

interface ContainerComponent extends BaseComponent {
  type: 'container';
  children: EmailComponent[];
}

type EmailComponent = TextComponent | HeadingComponent | ImageComponent | ButtonComponent |
  DividerComponent | SpacerComponent | ListComponent | ColumnComponent | ContainerComponent;

interface EmailTemplate {
  id?: string;
  name?: string;
  components: EmailComponent[];
  canvasSettings: CanvasSettings;
}

interface EmailEditorProps {
  initialTemplate?: EmailTemplate;
  onSave?: (template: EmailTemplate) => void;
  onExport?: (html: string) => void;
  readOnly?: boolean;
}

interface ComponentType {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultData: Partial<EmailComponent>;
  category: 'basic' | 'layout';
}



// Constants
const FONT_FAMILIES = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
  { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Courier New", Courier, monospace', label: 'Courier New' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' },
  { value: '"Trebuchet MS", Helvetica, sans-serif', label: 'Trebuchet MS' },
  { value: '"Lucida Sans Unicode", "Lucida Grande", sans-serif', label: 'Lucida Sans' },
  { value: 'Impact, Charcoal, sans-serif', label: 'Impact' },
  { value: '"Comic Sans MS", cursive', label: 'Comic Sans MS' },
  { value: '"Palatino Linotype", "Book Antiqua", Palatino, serif', label: 'Palatino' }
];

const FONT_WEIGHTS = [
  { value: '100', label: 'Thin (100)' },
  { value: '200', label: 'Extra Light (200)' },
  { value: '300', label: 'Light (300)' },
  { value: '400', label: 'Normal (400)' },
  { value: '500', label: 'Medium (500)' },
  { value: '600', label: 'Semi Bold (600)' },
  { value: '700', label: 'Bold (700)' },
  { value: '800', label: 'Extra Bold (800)' },
  { value: '900', label: 'Black (900)' }
];

const FONT_SIZES = [
  '8px', '9px', '10px', '11px', '12px', '13px', '14px', '15px', '16px',
  '18px', '20px', '22px', '24px', '26px', '28px', '32px', '36px', '40px',
  '44px', '48px', '52px', '56px', '60px', '64px', '72px'
];

const BORDER_STYLES = [
  { value: 'none', label: 'None' },
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'double', label: 'Double' },
  { value: 'groove', label: 'Groove' },
  { value: 'ridge', label: 'Ridge' },
  { value: 'inset', label: 'Inset' },
  { value: 'outset', label: 'Outset' }
];

const LINE_HEIGHT_OPTIONS = [
  { value: '1', label: '1.0' },
  { value: '1.1', label: '1.1' },
  { value: '1.2', label: '1.2' },
  { value: '1.3', label: '1.3' },
  { value: '1.4', label: '1.4' },
  { value: '1.5', label: '1.5' },
  { value: '1.6', label: '1.6' },
  { value: '1.8', label: '1.8' },
  { value: '2', label: '2.0' },
  { value: '2.5', label: '2.5' },
  { value: '3', label: '3.0' }
];

const TEXT_TRANSFORM_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'capitalize', label: 'Capitalize' }
];

const CURSOR_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'pointer', label: 'Pointer' },
  { value: 'help', label: 'Help' },
  { value: 'not-allowed', label: 'Not Allowed' },
  { value: 'grab', label: 'Grab' }
];

const VERTICAL_ALIGN_OPTIONS = [
  { value: 'top', label: 'Top' },
  { value: 'middle', label: 'Middle' },
  { value: 'bottom', label: 'Bottom' }
];

const LIST_STYLE_TYPES = {
  ul: [
    { value: 'disc', label: 'Disc (•)' },
    { value: 'circle', label: 'Circle (○)' },
    { value: 'square', label: 'Square (■)' },
    { value: 'none', label: 'None' },
    { value: '"→"', label: 'Arrow (→)' },
    { value: '"★"', label: 'Star (★)' },
    { value: '"▶"', label: 'Triangle (▶)' },
    { value: '"✓"', label: 'Checkmark (✓)' }
  ],
  ol: [
    { value: 'decimal', label: 'Numbers (1, 2, 3)' },
    { value: 'decimal-leading-zero', label: 'Zero-padded (01, 02, 03)' },
    { value: 'lower-alpha', label: 'Lowercase (a, b, c)' },
    { value: 'upper-alpha', label: 'Uppercase (A, B, C)' },
    { value: 'lower-roman', label: 'Lowercase Roman (i, ii, iii)' },
    { value: 'upper-roman', label: 'Uppercase Roman (I, II, III)' },
    { value: 'lower-greek', label: 'Greek Letters (α, β, γ)' },
    { value: 'none', label: 'None' }
  ]
};

const DEVICE_PRESETS = {
  desktop: [
    { name: 'MacBook', width: 1152 },
    { name: 'MacBook Pro', width: 1440 },
    { name: 'Surface Book', width: 1500 },
    { name: 'iMac', width: 1280 },
    { name: 'Desktop HD', width: 1920 },
    { name: 'Desktop FHD', width: 1080 }
  ],
  tablet: [
    { name: 'iPad Mini', width: 768 },
    { name: 'iPad Pro 11"', width: 834 },
    { name: 'iPad Pro 12.9"', width: 1024 },
    { name: 'Surface Pro 4', width: 1368 },
    { name: 'Galaxy Tab', width: 800 }
  ],
  mobile: [
    { name: 'iPhone 11 Pro Max', width: 414 },
    { name: 'iPhone 11 Pro/X', width: 375 },
    { name: 'Google Pixel 2', width: 411 },
    { name: 'Android', width: 360 },
    { name: 'iPhone SE', width: 320 },
    { name: 'Galaxy S21', width: 384 }
  ]
};

const DEFAULT_DEVICES = {
  desktop: { name: 'MacBook Pro', width: 1440 },
  tablet: { name: 'iPad Pro 11"', width: 834 },
  mobile: { name: 'iPhone 11 Pro/X', width: 375 }
};


// Enhanced unique ID generator
let componentCounter = 0;
const generateUniqueId = (): string => {
  componentCounter++;
  return `comp-${Date.now()}-${componentCounter}-${Math.random().toString(36).substr(2, 12)}`;
};

// Pre-built Templates Library
const TEMPLATE_LIBRARY = {
  newsletter: {
    id: 'newsletter-modern',
    name: 'Modern Newsletter',
    category: 'Newsletter',
    thumbnail: 'https://via.placeholder.com/300x400/4F46E5/white?text=Newsletter',
    description: 'Clean and modern newsletter template with header, content sections, and footer',
    components: [
      {
        id: generateUniqueId(),
        type: 'container',
        children: [
          {
            id: generateUniqueId(),
            type: 'heading',
            content: 'Weekly Newsletter',
            level: 'h1',
            styles: {
              fontSize: '32px',
              fontWeight: '700',
              color: '#1a1a1a',
              textAlign: 'center',
              paddingTop: '20px',
              paddingBottom: '10px',
              backgroundColor: '#f8fafc'
            }
          },
          {
            id: generateUniqueId(),
            type: 'text',
            content: 'Stay updated with our latest news and insights.',
            styles: {
              fontSize: '16px',
              color: '#64748b',
              textAlign: 'center',
              paddingBottom: '30px',
              backgroundColor: '#f8fafc'
            }
          }
        ],
        styles: { backgroundColor: '#f8fafc', marginBottom: '20px' }
      },
      {
        id: generateUniqueId(),
        type: 'image',
        src: 'https://via.placeholder.com/600x300/3B82F6/white?text=Feature+Image',
        alt: 'Featured content',
        styles: {
          width: '100%',
          maxWidth: '600px',
          textAlign: 'center',
          marginBottom: '20px'
        }
      },
      {
        id: generateUniqueId(),
        type: 'heading',
        content: 'This Week\'s Highlights',
        level: 'h2',
        styles: {
          fontSize: '24px',
          fontWeight: '600',
          color: '#1e293b',
          paddingTop: '10px',
          paddingBottom: '15px'
        }
      },
      {
        id: generateUniqueId(),
        type: 'text',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
        styles: {
          fontSize: '16px',
          lineHeight: '1.6',
          color: '#475569',
          paddingBottom: '20px'
        }
      },
      {
        id: generateUniqueId(),
        type: 'button',
        text: 'Read More',
        href: '#',
        styles: {
          backgroundColor: '#3b82f6',
          color: '#ffffff',
          textAlign: 'center',
          padding: '12px 30px',
          borderRadius: '6px',
          textDecoration: 'none',
          marginBottom: '30px'
        }
      }
    ],
    canvasSettings: {
      backgroundColor: '#ffffff',
      contentBackgroundColor: '#ffffff',
      contentWidth: '600px',
      maxWidth: '600px',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      lineHeight: '1.5',
      color: '#333333'
    }
  },
  promotional: {
    id: 'promo-sale',
    name: 'Sales Promotion',
    category: 'Promotional',
    thumbnail: 'https://via.placeholder.com/300x400/EF4444/white?text=Sale',
    description: 'Eye-catching promotional email template for sales and offers',
    components: [
      {
        id: generateUniqueId(),
        type: 'container',
        children: [
          {
            id: generateUniqueId(),
            type: 'heading',
            content: '🔥 MEGA SALE',
            level: 'h1',
            styles: {
              fontSize: '36px',
              fontWeight: '800',
              color: '#ffffff',
              textAlign: 'center',
              paddingTop: '30px',
              paddingBottom: '10px'
            }
          },
          {
            id: generateUniqueId(),
            type: 'heading',
            content: 'Up to 50% OFF',
            level: 'h2',
            styles: {
              fontSize: '24px',
              fontWeight: '600',
              color: '#fef3c7',
              textAlign: 'center',
              paddingBottom: '30px'
            }
          }
        ],
        styles: {
          backgroundColor: '#ef4444',
          marginBottom: '0px',
          borderRadius: '8px 8px 0 0'
        }
      },
      {
        id: generateUniqueId(),
        type: 'text',
        content: 'Don\'t miss out on our biggest sale of the year! Limited time offer on all products.',
        styles: {
          fontSize: '18px',
          textAlign: 'center',
          paddingTop: '30px',
          paddingBottom: '20px',
          color: '#374151',
          lineHeight: '1.6'
        }
      },
      {
        id: generateUniqueId(),
        type: 'button',
        text: 'SHOP NOW',
        href: '#',
        styles: {
          backgroundColor: '#ef4444',
          color: '#ffffff',
          fontSize: '18px',
          fontWeight: '700',
          textAlign: 'center',
          padding: '15px 40px',
          borderRadius: '8px',
          marginBottom: '20px'
        }
      }
    ],
    canvasSettings: {
      backgroundColor: '#f3f4f6',
      contentBackgroundColor: '#ffffff',
      contentWidth: '600px',
      maxWidth: '600px',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      lineHeight: '1.5',
      color: '#333333'
    }
  },
  welcome: {
    id: 'welcome-onboarding',
    name: 'Welcome Email',
    category: 'Onboarding',
    thumbnail: 'https://via.placeholder.com/300x400/10B981/white?text=Welcome',
    description: 'Friendly welcome email template for new users',
    components: [
      {
        id: generateUniqueId(),
        type: 'heading',
        content: 'Welcome aboard! 👋',
        level: 'h1',
        styles: {
          fontSize: '28px',
          fontWeight: '700',
          color: '#059669',
          textAlign: 'center',
          paddingTop: '20px',
          paddingBottom: '20px'
        }
      },
      {
        id: generateUniqueId(),
        type: 'text',
        content: 'We\'re thrilled to have you join our community. Here\'s everything you need to get started on your journey with us.',
        styles: {
          fontSize: '16px',
          lineHeight: '1.6',
          color: '#374151',
          textAlign: 'center',
          paddingBottom: '30px'
        }
      },
      {
        id: generateUniqueId(),
        type: 'column',
        columnWidths: ['50%', '50%'],
        children: [
          [
            {
              id: generateUniqueId(),
              type: 'heading',
              content: '📚 Resources',
              level: 'h3',
              styles: { fontSize: '18px', fontWeight: '600', color: '#1f2937', textAlign: 'center', paddingBottom: '10px' }
            },
            {
              id: generateUniqueId(),
              type: 'text',
              content: 'Access our comprehensive guide and tutorials.',
              styles: { fontSize: '14px', color: '#6b7280', textAlign: 'center' }
            }
          ],
          [
            {
              id: generateUniqueId(),
              type: 'heading',
              content: '💬 Support',
              level: 'h3',
              styles: { fontSize: '18px', fontWeight: '600', color: '#1f2937', textAlign: 'center', paddingBottom: '10px' }
            },
            {
              id: generateUniqueId(),
              type: 'text',
              content: 'Our team is here to help you 24/7.',
              styles: { fontSize: '14px', color: '#6b7280', textAlign: 'center' }
            }
          ]
        ],
        styles: { marginBottom: '30px', gap: '20px' }
      },
      {
        id: generateUniqueId(),
        type: 'button',
        text: 'Get Started',
        href: '#',
        styles: {
          backgroundColor: '#059669',
          color: '#ffffff',
          textAlign: 'center',
          padding: '12px 30px',
          borderRadius: '6px',
          marginBottom: '20px'
        }
      }
    ],
    canvasSettings: {
      backgroundColor: '#f0fdf4',
      contentBackgroundColor: '#ffffff',
      contentWidth: '600px',
      maxWidth: '600px',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      lineHeight: '1.5',
      color: '#333333'
    }
  }
};

// Pre-built Component Library
const COMPONENT_LIBRARY = {
  headers: [
    {
      id: 'header-1',
      name: 'Simple Header',
      thumbnail: 'https://via.placeholder.com/200x80/3B82F6/white?text=Header',
      component: {
        id: generateUniqueId(),
        type: 'container',
        children: [
          {
            id: generateUniqueId(),
            type: 'heading',
            content: 'Your Company Name',
            level: 'h1',
            styles: {
              fontSize: '24px',
              fontWeight: '700',
              color: '#1f2937',
              textAlign: 'center',
              paddingTop: '20px',
              paddingBottom: '20px'
            }
          }
        ],
        styles: {
          backgroundColor: '#f8fafc',
          borderBottom: '2px solid #e5e7eb',
          marginBottom: '20px'
        }
      }
    },
    {
      id: 'header-2',
      name: 'Logo Header',
      thumbnail: 'https://via.placeholder.com/200x80/1F2937/white?text=Logo',
      component: {
        id: generateUniqueId(),
        type: 'container',
        children: [
          {
            id: generateUniqueId(),
            type: 'image',
            src: 'https://via.placeholder.com/200x60/3B82F6/white?text=LOGO',
            alt: 'Company Logo',
            styles: {
              width: '200px',
              height: 'auto',
              textAlign: 'center',
              paddingTop: '20px',
              paddingBottom: '20px'
            }
          }
        ],
        styles: {
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '20px'
        }
      }
    }
  ],
  cta: [
    {
      id: 'cta-1',
      name: 'Primary CTA',
      thumbnail: 'https://via.placeholder.com/200x100/3B82F6/white?text=CTA',
      component: {
        id: generateUniqueId(),
        type: 'container',
        children: [
          {
            id: generateUniqueId(),
            type: 'heading',
            content: 'Ready to get started?',
            level: 'h2',
            styles: {
              fontSize: '24px',
              fontWeight: '600',
              color: '#1f2937',
              textAlign: 'center',
              paddingBottom: '15px'
            }
          },
          {
            id: generateUniqueId(),
            type: 'text',
            content: 'Join thousands of satisfied customers today.',
            styles: {
              fontSize: '16px',
              color: '#6b7280',
              textAlign: 'center',
              paddingBottom: '20px'
            }
          },
          {
            id: generateUniqueId(),
            type: 'button',
            text: 'Get Started Now',
            href: '#',
            styles: {
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '600',
              textAlign: 'center',
              padding: '12px 30px',
              borderRadius: '6px'
            }
          }
        ],
        styles: {
          backgroundColor: '#f8fafc',
          paddingTop: '30px',
          paddingBottom: '30px',
          paddingLeft: '20px',
          paddingRight: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }
      }
    },
    {
      id: 'cta-2',
      name: 'Urgent CTA',
      thumbnail: 'https://via.placeholder.com/200x100/EF4444/white?text=Urgent',
      component: {
        id: generateUniqueId(),
        type: 'container',
        children: [
          {
            id: generateUniqueId(),
            type: 'heading',
            content: '⏰ Limited Time Offer!',
            level: 'h2',
            styles: {
              fontSize: '22px',
              fontWeight: '700',
              color: '#dc2626',
              textAlign: 'center',
              paddingBottom: '10px'
            }
          },
          {
            id: generateUniqueId(),
            type: 'text',
            content: 'Don\'t miss out - offer expires soon!',
            styles: {
              fontSize: '16px',
              color: '#374151',
              textAlign: 'center',
              paddingBottom: '20px'
            }
          },
          {
            id: generateUniqueId(),
            type: 'button',
            text: 'Claim Offer',
            href: '#',
            styles: {
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '700',
              textAlign: 'center',
              padding: '14px 35px',
              borderRadius: '6px'
            }
          }
        ],
        styles: {
          backgroundColor: '#fef2f2',
          paddingTop: '25px',
          paddingBottom: '25px',
          paddingLeft: '20px',
          paddingRight: '20px',
          borderRadius: '8px',
          border: '2px solid #fecaca',
          marginBottom: '20px'
        }
      }
    }
  ],
  footers: [
    {
      id: 'footer-1',
      name: 'Simple Footer',
      thumbnail: 'https://via.placeholder.com/200x80/6B7280/white?text=Footer',
      component: {
        id: generateUniqueId(),
        type: 'container',
        children: [
          {
            id: generateUniqueId(),
            type: 'divider',
            styles: {
              backgroundColor: '#e5e7eb',
              height: '1px',
              marginBottom: '20px'
            }
          },
          {
            id: generateUniqueId(),
            type: 'text',
            content: '© 2024 Your Company Name. All rights reserved.',
            styles: {
              fontSize: '14px',
              color: '#6b7280',
              textAlign: 'center',
              paddingBottom: '10px'
            }
          },
          {
            id: generateUniqueId(),
            type: 'text',
            content: 'Unsubscribe | Update Preferences | Privacy Policy',
            styles: {
              fontSize: '12px',
              color: '#9ca3af',
              textAlign: 'center'
            }
          }
        ],
        styles: {
          backgroundColor: '#f9fafb',
          paddingTop: '20px',
          paddingBottom: '20px',
          paddingLeft: '20px',
          paddingRight: '20px'
        }
      }
    }
  ]
};

interface TemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: any) => void;
  onSelectComponent: (component: any) => void;
  teamId: string; // Add teamId prop
}

// Define types for the library items
interface GlobalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnailUrl: string | null;
  usageCount: number;
  rating: number;
  isFeatured: boolean;
  createdAt: Date;
}

interface TeamLibraryItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  visibility: 'private' | 'team' | 'public';
  thumbnailUrl: string | null;
  isComponent: boolean;
  usageCount: number;
  rating: number;
  isFeatured: boolean;
  createdAt: Date;
  createdBy: string;
  teamId: string | null;
}


function TemplateLibraryModal({
  isOpen,
  onClose,
  onSelectTemplate,
  onSelectComponent
}: TemplateLibraryModalProps) {
  const { teamId } = useParams();

  // Tab state
  const [activeTab, setActiveTab] = useState<'global' | 'team'>('global');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data state - HERE ARE THE MISSING useState DECLARATIONS
  const [globalTemplates, setGlobalTemplates] = useState<GlobalTemplate[]>([]);
  const [teamLibraryItems, setTeamLibraryItems] = useState<TeamLibraryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadLibraryData();
    }
  }, [isOpen, teamId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('global');
      setSelectedCategory('all');
      setSearchQuery('');
    }
  }, [isOpen]);

  const loadLibraryData = async () => {
    setLoading(true);
    try {
      const [globalTemplates, teamLibraryItems] = await Promise.all([
        getTemplateLibrary(), // Global templates
        getTeamLibraryItems(teamId as string) // Team + public templates
      ]);

      setGlobalTemplates(globalTemplates);
      setTeamLibraryItems(teamLibraryItems);
    } catch (error) {
      console.error('Error loading library data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter functions
  const filterGlobalTemplates = () => {
    return globalTemplates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const filterTeamLibraryItems = () => {
    return teamLibraryItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  // Selection handlers
  const handleGlobalTemplateSelect = async (template: GlobalTemplate) => {
    try {
      const fullTemplate = await getTemplateLibraryWithComponents(template.id);
      if (fullTemplate) {
        await incrementTemplateUsage(template.id, teamId as string);
        onSelectTemplate(fullTemplate);
        onClose();
      }
    } catch (error) {
      console.error('Error selecting global template:', error);
    }
  };

  const handleTeamItemSelect = async (item: TeamLibraryItem) => {
    try {
      const fullItem = await getLibraryItemWithComponents(item.id, teamId as string);
      if (fullItem) {
        await incrementTemplateUsage(item.id, teamId as string);

        if (item.isComponent) {
          // If it's a component, pass to component handler
          onSelectComponent(fullItem.components[0] || fullItem);
        } else {
          // If it's a template, pass to template handler
          onSelectTemplate(fullItem);
        }
        onClose();
      }
    } catch (error) {
      console.error('Error selecting team library item:', error);
    }
  };

  // Get categories for filtering
  const globalCategories = ['all', ...Array.from(new Set(globalTemplates.map(t => t.category)))];
  const teamCategories = ['all', ...Array.from(new Set(teamLibraryItems.map(t => t.category)))];
  const availableCategories = activeTab === 'global' ? globalCategories : teamCategories;

  // Render template card
  const renderGlobalTemplateCard = (template: GlobalTemplate) => (
    <div
      key={template.id}
      className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group bg-white"
      onClick={() => handleGlobalTemplateSelect(template)}
    >
      <div className="aspect-[3/4] relative overflow-hidden bg-gray-50">
        {template.thumbnailUrl ? (
          <img
            src={template.thumbnailUrl}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <FileText className="h-12 w-12" />
          </div>
        )}
        {template.isFeatured && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
            Featured
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{template.description}</p>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {template.category}
          </Badge>
          {template.usageCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {template.usageCount} uses
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // Render team library item card
  const renderTeamLibraryCard = (item: TeamLibraryItem) => (
    <div
      key={item.id}
      className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group bg-white"
      onClick={() => handleTeamItemSelect(item)}
    >
      <div className="aspect-[3/4] relative overflow-hidden bg-gray-50">
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            {item.isComponent ? (
              <Layers className="h-12 w-12" />
            ) : (
              <FileText className="h-12 w-12" />
            )}
          </div>
        )}

        {/* Visibility indicator */}
        <div className="absolute top-2 left-2">
          <Badge
            variant="secondary"
            className={`text-xs ${item.visibility === 'public' ? 'bg-green-100 text-green-800' :
                item.visibility === 'team' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
              }`}
          >
            {item.visibility}
          </Badge>
        </div>

        {item.isFeatured && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
            Featured
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {item.description || 'No description'}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Badge variant="outline" className="text-xs">
              {item.category}
            </Badge>
            {item.isComponent && (
              <Badge variant="secondary" className="text-xs">
                Component
              </Badge>
            )}
          </div>
          {item.usageCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {item.usageCount} uses
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const filteredGlobalTemplates = filterGlobalTemplates();
  const filteredTeamItems = filterTeamLibraryItems();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl min-w-[90vw] h-[85vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">Template Library</DialogTitle>
              <DialogDescription>
                Choose from global templates or your team's custom library
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
              <p>Loading library...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 border-r bg-card p-4 overflow-y-auto">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Categories */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Categories</h4>
                <div className="space-y-1">
                  {availableCategories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="w-full justify-start text-left capitalize"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-hidden">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'global' | 'team')}>
                <div className="border-b px-6 py-3">
                  <TabsList>
                    <TabsTrigger value="global">
                      Global Templates ({filteredGlobalTemplates.length})
                    </TabsTrigger>
                    <TabsTrigger value="team">
                      Team Library ({filteredTeamItems.length})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6 overflow-y-auto h-full">
                  <TabsContent value="global" className="mt-0">
                    {filteredGlobalTemplates.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">No global templates found</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {filteredGlobalTemplates.map(renderGlobalTemplateCard)}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="team" className="mt-0">
                    {filteredTeamItems.length === 0 ? (
                      <div className="text-center py-12">
                        <Layers className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">No team library items found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Create templates and components in your team library
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {filteredTeamItems.map(renderTeamLibraryCard)}
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface TemplatePreviewProps {
  template: any;
  width?: number;
  height?: number;
  className?: string;
}

function TemplatePreviewRenderer({ template, className = "" }: TemplatePreviewProps) {
  const [previewHtml, setPreviewHtml] = useState<string>('');


  // Improved stylesToString function
  const stylesToString = (styles?: any): string => {
    if (!styles) return '';

    return Object.entries(styles)
      .filter(([_, value]) => {
        return value !== undefined &&
          value !== '' &&
          value !== 'transparent' &&
          value !== 'none' &&
          value !== null &&
          value !== '0px'
      })
      .map(([key, value]) => {
        const cssProperty = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssProperty}: ${value}`;
      })
      .join('; ');
  };

  // Generate HTML for template preview
  useEffect(() => {
    const generatePreviewHTML = (components: EmailComponent[], canvasSettings: CanvasSettings) => {
      const renderComponent = (component: EmailComponent): string => {
        try {
          switch (component.type) {
            case 'text':
              const textComp = component as TextComponent;
              const textContainerStyles = {
                backgroundColor: textComp.styles?.backgroundColor || 'transparent',
                padding: `${textComp.styles?.paddingTop || '8px'} ${textComp.styles?.paddingRight || '8px'} ${textComp.styles?.paddingBottom || '8px'} ${textComp.styles?.paddingLeft || '8px'}`,
                margin: `${textComp.styles?.marginTop || '0px'} ${textComp.styles?.marginRight || '0px'} ${textComp.styles?.marginBottom || '8px'} ${textComp.styles?.marginLeft || '0px'}`,
                borderRadius: textComp.styles?.borderRadius || '0px',
                textAlign: textComp.styles?.textAlign || 'left',
                border: textComp.styles?.borderWidth && textComp.styles?.borderWidth !== '0px'
                  ? `${textComp.styles.borderWidth} ${textComp.styles?.borderStyle || 'solid'} ${textComp.styles?.borderColor || '#cccccc'}`
                  : 'none',
                boxShadow: textComp.styles?.boxShadow || 'none'
              };

              const textStyles = {
                fontSize: textComp.styles?.fontSize || '14px', // Slightly smaller for preview
                fontFamily: textComp.styles?.fontFamily || 'Arial, sans-serif',
                fontWeight: textComp.styles?.fontWeight || '400',
                color: textComp.styles?.color || '#333333',
                lineHeight: textComp.styles?.lineHeight || '1.4',
                textAlign: 'inherit',
                margin: '0',
                padding: '0'
              };

              return `<div style="${stylesToString(textContainerStyles)}">
                <p style="${stylesToString(textStyles)}">${textComp.content || 'Sample text'}</p>
              </div>`;

            case 'heading':
              const headingComp = component as HeadingComponent;
              const headingContainerStyles = {
                backgroundColor: headingComp.styles?.backgroundColor || 'transparent',
                padding: `${headingComp.styles?.paddingTop || '8px'} ${headingComp.styles?.paddingRight || '8px'} ${headingComp.styles?.paddingBottom || '8px'} ${headingComp.styles?.paddingLeft || '8px'}`,
                margin: `${headingComp.styles?.marginTop || '0px'} ${headingComp.styles?.marginRight || '0px'} ${headingComp.styles?.marginBottom || '8px'} ${headingComp.styles?.marginLeft || '0px'}`,
                borderRadius: headingComp.styles?.borderRadius || '0px',
                textAlign: headingComp.styles?.textAlign || 'left',
                border: headingComp.styles?.borderWidth && headingComp.styles?.borderWidth !== '0px'
                  ? `${headingComp.styles.borderWidth} ${headingComp.styles?.borderStyle || 'solid'} ${headingComp.styles?.borderColor || '#cccccc'}`
                  : 'none'
              };

              const headingTextStyles = {
                fontSize: headingComp.styles?.fontSize ? `${Math.max(16, parseInt(headingComp.styles.fontSize) * 0.8)}px` : '20px', // Scale down but keep readable
                fontFamily: headingComp.styles?.fontFamily || 'Arial, sans-serif',
                fontWeight: headingComp.styles?.fontWeight || '700',
                color: headingComp.styles?.color || '#1a1a1a',
                lineHeight: headingComp.styles?.lineHeight || '1.2',
                textAlign: 'inherit',
                margin: '0',
                padding: '0'
              };

              return `<div style="${stylesToString(headingContainerStyles)}">
                <${headingComp.level} style="${stylesToString(headingTextStyles)}">${headingComp.content || 'Sample Heading'}</${headingComp.level}>
              </div>`;

            case 'image':
              const imageComp = component as ImageComponent;
              const imageContainerStyles = {
                textAlign: imageComp.styles?.textAlign || 'left',
                marginBottom: '8px',
                backgroundColor: imageComp.styles?.backgroundColor || 'transparent',
                padding: imageComp.styles?.padding || '0px'
              };

              const imageStyles = {
                width: imageComp.styles?.width || '100%',
                maxWidth: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: imageComp.styles?.borderRadius || '0px'
              };

              return `<div style="${stylesToString(imageContainerStyles)}">
                <img src="${imageComp.src || 'https://via.placeholder.com/300x150/e2e8f0/64748b?text=Image'}" alt="${imageComp.alt || 'Sample Image'}" style="${stylesToString(imageStyles)}" />
              </div>`;

            case 'button':
              const buttonComp = component as ButtonComponent;
              const buttonContainerStyles = {
                textAlign: buttonComp.styles?.textAlign || 'left',
                marginBottom: '8px'
              };

              const buttonStyles = {
                backgroundColor: buttonComp.styles?.backgroundColor || '#3b82f6',
                color: buttonComp.styles?.color || '#ffffff',
                fontSize: '12px',
                fontFamily: buttonComp.styles?.fontFamily || 'Arial, sans-serif',
                fontWeight: buttonComp.styles?.fontWeight || '500',
                textDecoration: 'none',
                display: 'inline-block',
                padding: '8px 16px',
                // ADD BORDER STYLES HERE TOO
                border: buttonComp.styles?.borderWidth && buttonComp.styles?.borderWidth !== '0px'
                  ? `${buttonComp.styles.borderWidth} ${buttonComp.styles?.borderStyle || 'solid'} ${buttonComp.styles?.borderColor || '#3b82f6'}`
                  : 'none',
                borderRadius: buttonComp.styles?.borderRadius || '4px',
                boxShadow: buttonComp.styles?.boxShadow || 'none',
                cursor: 'pointer'
              };

              return `<div style="${stylesToString(buttonContainerStyles)}">
                  <a href="#" style="${stylesToString(buttonStyles)}">${buttonComp.text || 'Click Here'}</a>
                </div>`;


            case 'divider':
              const dividerStyles = {
                height: component.styles?.height || '1px',
                backgroundColor: component.styles?.backgroundColor || '#e2e8f0',
                border: 'none',
                margin: '8px 0',
                width: '100%'
              };
              return `<hr style="${stylesToString(dividerStyles)}" />`;

            case 'spacer':
              const spacerComp = component as SpacerComponent;
              const spacerHeight = Math.max(4, parseInt(spacerComp.height || '16') / 2); // Reduce spacer height for preview
              return `<div style="height: ${spacerHeight}px; line-height: ${spacerHeight}px;"></div>`;

            case 'list':
              const listComp = component as ListComponent;
              const listStyles = {
                fontSize: '12px', // Smaller for preview
                fontFamily: listComp.styles?.fontFamily || 'Arial, sans-serif',
                color: listComp.styles?.color || '#333333',
                lineHeight: '1.4',
                listStyleType: listComp.styles?.listStyleType || (listComp.listType === 'ol' ? 'decimal' : 'disc'),
                paddingLeft: '16px',
                margin: '0 0 8px 0'
              };

              const listItems = (listComp.items || ['Sample item 1', 'Sample item 2']).map(item => `<li>${item}</li>`).join('');
              return `<${listComp.listType || 'ul'} style="${stylesToString(listStyles)}">${listItems}</${listComp.listType || 'ul'}>`;

            case 'container':
              const containerComp = component as ContainerComponent;
              const containerStyles = {
                backgroundColor: containerComp.styles?.backgroundColor || 'transparent',
                padding: '8px', // Reduced padding for preview
                borderRadius: containerComp.styles?.borderRadius || '0px',
                border: containerComp.styles?.borderWidth && containerComp.styles?.borderWidth !== '0px'
                  ? `1px ${containerComp.styles?.borderStyle || 'solid'} ${containerComp.styles?.borderColor || '#e2e8f0'}`
                  : 'none',
                marginBottom: '8px'
              };

              const childrenHtml = (containerComp.children || []).map(renderComponent).join('');
              return `<div style="${stylesToString(containerStyles)}">${childrenHtml}</div>`;

            case 'column':
              const columnComp = component as ColumnComponent;
              const columnWidths = columnComp.columnWidths || ['50%', '50%'];

              return `<table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;" cellspacing="0" cellpadding="0">
                <tr>
                  ${columnWidths.map((width, index) => {
                const columnContent = Array.isArray(columnComp.children?.[index])
                  ? columnComp.children[index].map(renderComponent).join('')
                  : '<div style="color: #9ca3af; text-align: center; padding: 8px; border: 1px dashed #e2e8f0; font-size: 10px;">Column</div>';
                return `<td style="width: ${width}; vertical-align: top; padding: 2px;">${columnContent}</td>`;
              }).join('')}
                </tr>
              </table>`;

            default:
              return `<div style="color: #9ca3af; padding: 4px; border: 1px dashed #e2e8f0; font-size: 10px;">Unknown: ${component.type}</div>`;
          }
        } catch (error) {
          console.error('Error rendering component:', component.type, error);
          return `<div style="color: red; padding: 4px; font-size: 10px;">Error: ${component.type}</div>`;
        }
      };

      const componentHTML = components.map(renderComponent).join('');

      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      margin: 0; 
      padding: 12px; 
      font-family: ${canvasSettings.fontFamily || 'Arial, sans-serif'}; 
      background-color: ${canvasSettings.backgroundColor || '#ffffff'};
      font-size: 12px;
      line-height: 1.4;
      color: ${canvasSettings.color || '#333333'};
    }
    * { 
      box-sizing: border-box; 
    }
    img {
      max-width: 100%;
      height: auto;
    }
    table {
      border-collapse: collapse;
    }
  </style>
</head>
<body>
  <div style="background-color: ${canvasSettings.contentBackgroundColor || '#ffffff'}; max-width: 100%; margin: 0 auto; padding: 8px;">
    ${componentHTML}
  </div>
</body>
</html>`.trim();
    };

    if (template && template.components) {
      const html = generatePreviewHTML(template.components, template.canvasSettings);
      setPreviewHtml(html);
    }
  }, [template]);

  if (!previewHtml) {
    return (
      <div
        className={`bg-gray-100 rounded-lg overflow-hidden shadow-sm ${className} flex items-center justify-center`}
      >
        <div className="text-gray-500 text-sm">Loading preview...</div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg overflow-hidden shadow-sm ${className}`}
    >
      <iframe
        srcDoc={previewHtml}
        className="w-full h-full border-0 pointer-events-none"
        style={{
          width: '100%',
          height: '800px',
          minHeight: '600px'
        }}
        title="Component Preview"
      />

    </div>
  );
}



interface ComponentPreviewProps {
  component: any;
  width?: number;
  height?: number;
}

function ComponentPreviewRenderer({ component, width = 200, height = 80 }: ComponentPreviewProps) {
  const [previewHtml, setPreviewHtml] = useState<string>('');

  useEffect(() => {
    const generateComponentHTML = (comp: any): string => {
      let content = '';

      switch (comp.type) {
        case 'container':
          if (comp.children && comp.children.length > 0) {
            const childContent = comp.children.map((child: any) => {
              if (child.type === 'heading') {
                return `<h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px;">${child.content || 'Sample Heading'}</h3>`;
              } else if (child.type === 'text') {
                return `<p style="margin: 0; color: #4b5563; font-size: 14px;">${child.content || 'Sample text content'}</p>`;
              } else if (child.type === 'button') {
                return `<a href="#" style="background: #3b82f6; color: white; padding: 6px 12px; text-decoration: none; border-radius: 4px; display: inline-block; font-size: 12px;">${child.text || 'Button'}</a>`;
              }
              return '';
            }).join('');
            content = childContent;
          } else {
            content = '<div style="border: 2px dashed #d1d5db; padding: 10px; text-align: center; color: #6b7280; font-size: 12px;">Container Section</div>';
          }
          break;

        case 'heading':
          content = `<h2 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">${comp.content || comp.children?.[0]?.content || 'Sample Heading'}</h2>`;
          break;

        case 'text':
          content = `<p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.4;">${comp.content || 'Sample text content goes here'}</p>`;
          break;

        case 'button':
          content = `<a href="#" style="background: #3b82f6; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block; font-size: 14px;">${comp.text || 'Button'}</a>`;
          break;

        case 'image':
          content = `<img src="https://via.placeholder.com/120x60/e5e7eb/9ca3af?text=Image" alt="Preview" style="max-width: 100%; height: auto; border-radius: 4px;" />`;
          break;

        case 'divider':
          content = `<hr style="border: none; height: 1px; background: #d1d5db; margin: 10px 0;" />`;
          break;

        default:
          content = `<div style="padding: 8px; background: #f3f4f6; border-radius: 4px; color: #6b7280; font-size: 12px; text-align: center;">${comp.name || comp.type || 'Component'}</div>`;
      }

      const basicHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { 
      margin: 0; 
      padding: 8px; 
      font-family: Arial, sans-serif; 
      background: #f8fafc;
      overflow: hidden;
    }
    * { 
      box-sizing: border-box; 
    }
  </style>
</head>
<body>
  <div style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); height: 100%; overflow: hidden;">
    ${content}
  </div>
</body>
</html>`;
      return basicHtml;
    };

    if (component) {
      setPreviewHtml(generateComponentHTML(component));
    }
  }, [component]);

  if (!previewHtml) {
    return (
      <div
        style={{ width, height }}
        className="bg-gray-100 rounded flex items-center justify-center"
      >
        <span className="text-gray-500 text-xs">Loading...</span>
      </div>
    );
  }

  return (
    <div style={{ width, height }} className="overflow-hidden rounded">
      <iframe
        srcDoc={previewHtml}
        className="w-full h-full border-0 pointer-events-none"
        style={{
          width: '100%',
        }}
        title="Template Preview"
      />
    </div>
  );
}


// Enhanced Component Types with comprehensive default styles
const COMPONENT_TYPES: Record<string, ComponentType> = {
  // Basic Components with enhanced styling
  text: {
    name: 'Text Block',
    icon: Type,
    category: 'basic',
    defaultData: {
      type: 'text',
      content: 'Add your text here...',
      styles: {
        fontSize: '16px',
        color: '#333333',
        fontFamily: 'Arial, sans-serif',
        fontWeight: '400',
        fontStyle: 'normal',
        lineHeight: '1.5',
        textAlign: 'left',
        textTransform: 'none',
        textDecoration: 'none',
        letterSpacing: '0px',
        marginBottom: '0px',
        marginTop: '0px',
        marginLeft: '0px',
        marginRight: '0px',
        paddingTop: '10px',
        paddingRight: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px',
        backgroundColor: 'transparent',
        borderRadius: '0px',
        borderWidth: '0px',
        borderStyle: 'none',
        borderColor: '#cccccc',
        opacity: '1',
        boxShadow: 'none',
      }
    }
  },
  heading: {
    name: 'Heading',
    icon: Heading,
    category: 'basic',
    defaultData: {
      type: 'heading',
      content: 'Your Heading Here',
      level: 'h2',
      styles: {
        fontSize: '28px',
        color: '#1a1a1a',
        fontFamily: 'Arial, sans-serif',
        fontWeight: '700',
        fontStyle: 'normal',
        lineHeight: '1.2',
        textAlign: 'left',
        textTransform: 'none',
        textDecoration: 'none',
        letterSpacing: '0px',
        marginBottom: '0px',
        marginTop: '0px',
        marginLeft: '0px',
        marginRight: '0px',
        paddingTop: '10px',
        paddingRight: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px',
        backgroundColor: 'transparent',
        borderRadius: '0px',
        borderWidth: '0px',
        borderStyle: 'none',
        borderColor: '#cccccc',
        opacity: '1',
        boxShadow: 'none',
      }
    }
  },
  image: {
    name: 'Image',
    icon: Image,
    category: 'basic',
    defaultData: {
      type: 'image',
      src: 'https://placehold.co/600x400/EEE/31343C',
      alt: 'Image description',
      styles: {
        width: '100%',
        maxWidth: '400px',
        height: 'auto',
        display: 'block',
        marginBottom: '16px',
        borderRadius: '0px',
        borderWidth: '0px',
        borderStyle: 'none',
        borderColor: '#cccccc',
        opacity: '1',
        textAlign: 'left',
        marginLeft: '0',
        marginRight: 'auto',
        boxShadow: 'none',
      }
    }
  },
  button: {
    name: 'Button',
    icon: MousePointer,
    category: 'basic',
    defaultData: {
      type: 'button',
      text: 'Click Here',
      href: '#',
      styles: {
        backgroundColor: '#007bff',
        color: '#ffffff',
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        fontWeight: '500',
        textAlign: 'center',
        textDecoration: 'none',
        padding: '12px 24px',
        borderRadius: '4px',
        borderWidth: '0px',
        borderStyle: 'none',
        borderColor: '#0056b3',
        display: 'inline-block',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        opacity: '1',
        marginTop: '10px',
        marginRight: '10px',
        marginBottom: '10px',
        marginLeft: '10px',
        textTransform: 'none',
        boxShadow: 'none',
      }
    }
  },
  divider: {
    name: 'Divider',
    icon: Minus,
    category: 'basic',
    defaultData: {
      type: 'divider',
      styles: {
        height: '1px',
        backgroundColor: '#cccccc',
        borderStyle: 'none',
        marginTop: '20px',
        marginRight: '0px',
        marginBottom: '20px',
        marginLeft: '0px',
        paddingTop: '0px',
        paddingRight: '0px',
        paddingBottom: '0px',
        paddingLeft: '0px',
        width: '100%',
        opacity: '1',
        borderRadius: '0px',
        boxShadow: 'none',
      }
    }
  },
  spacer: {
    name: 'Spacer',
    icon: Move,
    category: 'basic',
    defaultData: {
      type: 'spacer',
      height: '16px',
      styles: {
        height: '16px',
        backgroundColor: 'transparent',
        marginTop: '0px',
        marginRight: '0px',
        marginBottom: '0px',
        marginLeft: '0px',
        paddingTop: '0px',
        paddingRight: '0px',
        paddingBottom: '0px',
        paddingLeft: '0px',
        borderRadius: '0px',
        borderWidth: '0px',
        borderStyle: 'none',
        borderColor: '#cccccc',
        opacity: '1',
        boxShadow: 'none'
      }
    }
  },
  list: {
    name: 'List',
    icon: List,
    category: 'basic',
    defaultData: {
      type: 'list',
      listType: 'ul',
      items: ['First item', 'Second item', 'Third item'],
      styles: {
        fontSize: '16px',
        color: '#333333',
        lineHeight: '1.5',
        marginTop: '0px',
        marginRight: '0px',
        marginBottom: '0px',
        marginLeft: '0px',
        paddingLeft: '20px',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: 'transparent',
        borderRadius: '0px',
        borderWidth: '0px',
        borderStyle: 'none',
        borderColor: '#cccccc',
        opacity: '1',
        listStyleType: 'disc',
        listStylePosition: 'outside',
        boxShadow: 'none',
      }
    }
  },

  // Layout Components with proper children initialization
  container: {
    name: 'Container',
    icon: Layout,
    category: 'layout',
    defaultData: {
      type: 'container',
      children: [],
      styles: {
        backgroundColor: 'transparent',
        padding: '20px',
        marginBottom: '0px',
        marginTop: '0px',
        marginRight: '0px',
        marginLeft: '0px',
        borderRadius: '0px',
        borderWidth: '0px',
        borderStyle: 'none',
        borderColor: '#cccccc',
        opacity: '1',
        boxShadow: 'none',
      }
    }
  },
  column2: {
    name: '2 Equal Columns',
    icon: Columns,
    category: 'layout',
    defaultData: {
      type: 'column',
      columnWidths: ['50%', '50%'],
      children: [[], []],
      styles: {
        marginTop: '0px',
        marginRight: '0px',
        marginBottom: '0px',
        marginLeft: '0px',
        gap: '8px',
        boxShadow: 'none',
      }
    }
  },
  column3: {
    name: '3 Equal Columns',
    icon: Grid3X3,
    category: 'layout',
    defaultData: {
      type: 'column',
      columnWidths: ['33.33%', '33.33%', '33.33%'],
      children: [[], [], []],
      styles: {
        marginTop: '0px',
        marginRight: '0px',
        marginBottom: '0px',
        marginLeft: '0px',
        gap: '8px',
        boxShadow: 'none',
      }
    }
  },
  column4: {
    name: '4 Equal Columns',
    icon: Grid3X3,
    category: 'layout',
    defaultData: {
      type: 'column',
      columnWidths: ['25%', '25%', '25%', '25%'],
      children: [[], [], [], []],
      styles: {
        marginTop: '0px',
        marginRight: '0px',
        marginBottom: '0px',
        marginLeft: '0px',
        gap: '8px',
        boxShadow: 'none',
      }
    }
  },
  column2_33_67: {
    name: '1/3 + 2/3 Columns',
    icon: Columns2,
    category: 'layout',
    defaultData: {
      type: 'column',
      columnWidths: ['33.33%', '66.67%'],
      children: [[], []],
      styles: {
        marginTop: '0px',
        marginRight: '0px',
        marginBottom: '0px',
        marginLeft: '0px',
        gap: '8px',
        boxShadow: 'none',
      }
    }
  },
  column2_67_33: {
    name: '2/3 + 1/3 Columns',
    icon: Columns2,
    category: 'layout',
    defaultData: {
      type: 'column',
      columnWidths: ['66.67%', '33.33%'],
      children: [[], []],
      styles: {
        marginTop: '0px',
        marginRight: '0px',
        marginBottom: '0px',
        marginLeft: '0px',
        gap: '8px',
        boxShadow: 'none',
      }
    }
  },
  column2_25_75: {
    name: '1/4 + 3/4 Columns',
    icon: Columns2,
    category: 'layout',
    defaultData: {
      type: 'column',
      columnWidths: ['25%', '75%'],
      children: [[], []],
      styles: {
        marginTop: '0px',
        marginRight: '0px',
        marginBottom: '0px',
        marginLeft: '0px',
        gap: '8px',
        boxShadow: 'none',
      }
    }
  },
  column2_75_25: {
    name: '3/4 + 1/4 Columns',
    icon: Columns2,
    category: 'layout',
    defaultData: {
      type: 'column',
      columnWidths: ['75%', '25%'],
      children: [[], []],
      styles: {
        marginTop: '0px',
        marginRight: '0px',
        marginBottom: '0px',
        marginLeft: '0px',
        gap: '8px',
        boxShadow: 'none',
      }
    }
  },
  column3_50_25_25: {
    name: '1/2 + 1/4 + 1/4',
    icon: Columns3,
    category: 'layout',
    defaultData: {
      type: 'column',
      columnWidths: ['50%', '25%', '25%'],
      children: [[], [], []],
      styles: {
        marginTop: '0px',
        marginRight: '0px',
        marginBottom: '0px',
        marginLeft: '0px',
        gap: '8px',
        boxShadow: 'none',
      }
    }
  },
  column3_25_25_50: {
    name: '1/4 + 1/4 + 1/2',
    icon: Columns3,
    category: 'layout',
    defaultData: {
      type: 'column',
      columnWidths: ['25%', '25%', '50%'],
      children: [[], [], []],
      styles: {
        marginTop: '0px',
        marginRight: '0px',
        marginBottom: '0px',
        gap: '8px',
        boxShadow: 'none',
      }
    }
  },
  column3_25_50_25: {
    name: '1/4 + 1/2 + 1/4',
    icon: Columns3,
    category: 'layout',
    defaultData: {
      type: 'column',
      columnWidths: ['25%', '50%', '25%'],
      children: [[], [], []],
      styles: {
        marginTop: '0px',
        marginRight: '0px',
        marginBottom: '0px',
        marginLeft: '0px',
        gap: '8px',
        boxShadow: 'none',
      }
    }
  }
};

// Enhanced Default Canvas Settings
const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
  backgroundColor: '#f4f4f4',
  contentBackgroundColor: '#ffffff',
  contentWidth: '800px',
  maxWidth: '800px',
  padding: '10px',
  fontFamily: 'Arial, sans-serif',
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#333333'
};


// Helper function to get default styles for a component type
const getDefaultStyles = (componentType: string): ComponentStyles => {
  const typeConfig = COMPONENT_TYPES[componentType] || COMPONENT_TYPES['text'];
  return typeConfig.defaultData?.styles || {};
};

// Helper function to get style value with proper defaults
const getStyleValue = (component: EmailComponent, property: keyof ComponentStyles): string => {
  const currentValue = component.styles?.[property];
  if (currentValue !== undefined && currentValue !== '') {
    return currentValue as string;
  }

  // Get default from component type
  const defaults = getDefaultStyles(component.type);
  return (defaults[property] as string) || '';
};

// Main EmailEditor Component with Zoom Functionality
export default function EmailEditor({
  initialTemplate,
  onSave,
  onExport,
  readOnly = false
}: EmailEditorProps) {


  const [components, setComponents] = useState<EmailComponent[]>(initialTemplate?.components || []);
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>(
    initialTemplate?.canvasSettings || DEFAULT_CANVAS_SETTINGS
  );
  const [selectedComponent, setSelectedComponent] = useState<EmailComponent | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<'canvas' | 'component'>('component');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [undoStack, setUndoStack] = useState<EmailComponent[][]>([]);
  const [redoStack, setRedoStack] = useState<EmailComponent[][]>([]);
  const [zoomLevel, setZoomLevel] = useState(100); // Zoom functionality
  const componentRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [isDragging, setIsDragging] = useState(false);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [draggedComponentType, setDraggedComponentType] = useState<string | null>(null);

  const { teamId } = useParams(); // Get teamId from URL params
  // Add to state declarations
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);

  // Save template functionality
  const handleSave = useCallback(() => {
    if (!onSave) return;

    const template: EmailTemplate = {
      id: initialTemplate?.id || generateUniqueId(),
      name: initialTemplate?.name || `Email Template ${new Date().toLocaleDateString()}`,
      components: components,
      canvasSettings: canvasSettings
    };

    console.log('Saving template:', template); // Debug log
    onSave(template);
  }, [components, canvasSettings, onSave, initialTemplate]);



  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Auto-save functionality (optional)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track changes for unsaved indicator
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [components, canvasSettings]);

  // Auto-save every 30 seconds if there are unsaved changes
  useEffect(() => {
    if (components.length > 0 && hasUnsavedChanges) {
      setSaveStatus('unsaved');

      const saveTimeout = setTimeout(() => {
        setSaveStatus('saving');
        handleSave();
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        setSaveStatus('saved');
      }, 2000); // Save 2 seconds after last change

      return () => clearTimeout(saveTimeout);
    }
  }, [components, hasUnsavedChanges, handleSave]);

  // Manual save handler with feedback
  const handleManualSave = useCallback(() => {
    handleSave();
    setHasUnsavedChanges(false);
    setLastSaved(new Date());

    // You can add toast notification here
    console.log('Template saved successfully!');
  }, [handleSave]);


  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };



  // Save state for undo/redo
  const saveState = useCallback(() => {
    setUndoStack(prev => [...prev, JSON.parse(JSON.stringify(components))]);
    setRedoStack([]);
  }, [components]);

  const undo = useCallback(() => {
    if (undoStack.length > 0) {
      const prevState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, JSON.parse(JSON.stringify(components))]);
      setComponents(prevState);
      setUndoStack(prev => prev.slice(0, -1));
    }
  }, [undoStack, components]);

  const redo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, JSON.parse(JSON.stringify(components))]);
      setComponents(nextState);
      setRedoStack(prev => prev.slice(0, -1));
    }
  }, [redoStack, components]);

  // Enhanced add component function with proper column handling
  const addComponent = useCallback((type: string, index: number = components.length, parentId?: string, columnIndex?: number) => {
    saveState();
    const componentType = COMPONENT_TYPES[type];
    if (!componentType) return;

    const newComponent: EmailComponent = {
      id: generateUniqueId(),
      ...JSON.parse(JSON.stringify(componentType.defaultData))
    } as EmailComponent;

    if (parentId) {
      setComponents(prev => prev.map(comp => {
        if (comp.id === parentId) {
          if (comp.type === 'column' && typeof columnIndex === 'number') {
            const columnComp = comp as ColumnComponent;
            const newChildren = [...(columnComp.children || [])];

            // Ensure the column array exists and is properly initialized
            while (newChildren.length <= columnIndex) {
              newChildren.push([]);
            }

            // Add component to the specific column
            newChildren[columnIndex] = [...(newChildren[columnIndex] || []), newComponent];

            return {
              ...comp,
              children: newChildren
            };
          } else if ('children' in comp) {
            return {
              ...comp,
              children: [...(comp.children || []), newComponent]
            };
          }
        }
        return comp;
      }));
    } else {
      setComponents(prev => {
        const newComponents = [...prev];
        newComponents.splice(index, 0, newComponent);
        return newComponents;
      });
    }
  }, [components, saveState]);

  // Enhanced update component function
  const updateComponent = useCallback((id: string, updates: Partial<EmailComponent>) => {
    const updateComponentRecursive = (components: EmailComponent[]): EmailComponent[] => {
      return components.map(comp => {
        if (comp.id === id) {
          return { ...comp, ...updates };
        }
        if ('children' in comp && comp.children) {
          if (comp.type === 'column') {
            const columnComp = comp as ColumnComponent;
            const newChildren = columnComp.children.map(columnArray =>
              Array.isArray(columnArray) ? updateComponentRecursive(columnArray) : []
            );
            return { ...comp, children: newChildren };
          } else {
            return {
              ...comp,
              children: updateComponentRecursive(comp.children)
            };
          }
        }
        return comp;
      });
    };

    setComponents(prev => updateComponentRecursive(prev));

    setSelectedComponent(prevSelected => {
      if (prevSelected?.id === id) {
        return { ...prevSelected, ...updates } as EmailComponent;
      }
      return prevSelected;
    });
  }, []);

  // Enhanced delete component function
  const deleteComponent = useCallback((id: string) => {
    saveState();

    const deleteComponentRecursive = (components: EmailComponent[]): EmailComponent[] => {
      return components.filter(comp => comp.id !== id).map(comp => {
        if ('children' in comp && comp.children) {
          if (comp.type === 'column') {
            const columnComp = comp as ColumnComponent;
            const newChildren = columnComp.children.map(columnArray =>
              Array.isArray(columnArray) ? deleteComponentRecursive(columnArray) : []
            );
            return { ...comp, children: newChildren };
          } else {
            return {
              ...comp,
              children: deleteComponentRecursive(comp.children)
            };
          }
        }
        return comp;
      });
    };

    setComponents(prev => deleteComponentRecursive(prev));

    if (selectedComponent?.id === id) {
      setSelectedComponent(null);
    }
  }, [saveState, selectedComponent]);

  // Move component up
  const moveComponentUp = useCallback((index: number) => {
    if (index > 0) {
      saveState();
      setComponents(prev => {
        const newComponents = [...prev];
        [newComponents[index - 1], newComponents[index]] = [newComponents[index], newComponents[index - 1]];
        return newComponents;
      });
    }
  }, [saveState]);

  // Move component down
  const moveComponentDown = useCallback((index: number) => {
    saveState();
    setComponents(prev => {
      if (index < prev.length - 1) {
        const newComponents = [...prev];
        [newComponents[index], newComponents[index + 1]] = [newComponents[index + 1], newComponents[index]];
        return newComponents;
      }
      return prev;
    });
  }, [saveState]);

  // Duplicate component
  const duplicateComponent = useCallback((index: number) => {
    saveState();
    setComponents(prev => {
      const componentToDuplicate = prev[index];
      const duplicatedComponent = {
        ...JSON.parse(JSON.stringify(componentToDuplicate)),
        id: generateUniqueId()
      };
      const newComponents = [...prev];
      newComponents.splice(index + 1, 0, duplicatedComponent);
      return newComponents;
    });
  }, [saveState]);

  // Delete component from column
  const deleteComponentFromColumn = useCallback((parentId: string, columnIndex: number, componentIndex: number) => {
    saveState();

    setComponents(prev => prev.map(comp => {
      if (comp.id === parentId && comp.type === 'column') {
        const columnComp = comp as ColumnComponent;
        const newChildren = [...(columnComp.children || [])];

        if (newChildren[columnIndex]) {
          newChildren[columnIndex] = newChildren[columnIndex].filter((_, index) => index !== componentIndex);
        }

        return {
          ...comp,
          children: newChildren
        };
      }
      return comp;
    }));

    // Clear selection if the deleted component was selected
    if (selectedComponent) {
      const componentToDelete = components
        .find(c => c.id === parentId && c.type === 'column')
        ?.children?.[columnIndex]?.[componentIndex];

      if (componentToDelete?.id === selectedComponent.id) {
        setSelectedComponent(null);
      }
    }
  }, [saveState, selectedComponent, components]);

  // Move component up within column
  const moveComponentUpInColumn = useCallback((parentId: string, columnIndex: number, componentIndex: number) => {
    if (componentIndex > 0) {
      saveState();

      setComponents(prev => prev.map(comp => {
        if (comp.id === parentId && comp.type === 'column') {
          const columnComp = comp as ColumnComponent;
          const newChildren = [...(columnComp.children || [])];

          if (newChildren[columnIndex] && newChildren[columnIndex].length > componentIndex) {
            const columnArray = [...newChildren[columnIndex]];
            [columnArray[componentIndex - 1], columnArray[componentIndex]] =
              [columnArray[componentIndex], columnArray[componentIndex - 1]];
            newChildren[columnIndex] = columnArray;
          }

          return {
            ...comp,
            children: newChildren
          };
        }
        return comp;
      }));
    }
  }, [saveState]);

  // Move component down within column
  const moveComponentDownInColumn = useCallback((parentId: string, columnIndex: number, componentIndex: number) => {
    saveState();

    setComponents(prev => prev.map(comp => {
      if (comp.id === parentId && comp.type === 'column') {
        const columnComp = comp as ColumnComponent;
        const newChildren = [...(columnComp.children || [])];

        if (newChildren[columnIndex] && componentIndex < newChildren[columnIndex].length - 1) {
          const columnArray = [...newChildren[columnIndex]];
          [columnArray[componentIndex], columnArray[componentIndex + 1]] =
            [columnArray[componentIndex + 1], columnArray[componentIndex]];
          newChildren[columnIndex] = columnArray;
        }

        return {
          ...comp,
          children: newChildren
        };
      }
      return comp;
    }));
  }, [saveState]);

  // Duplicate component within column
  const duplicateComponentInColumn = useCallback((parentId: string, columnIndex: number, componentIndex: number) => {
    saveState();

    setComponents(prev => prev.map(comp => {
      if (comp.id === parentId && comp.type === 'column') {
        const columnComp = comp as ColumnComponent;
        const newChildren = [...(columnComp.children || [])];

        if (newChildren[columnIndex] && newChildren[columnIndex][componentIndex]) {
          const componentToDuplicate = newChildren[columnIndex][componentIndex];
          const duplicatedComponent = {
            ...JSON.parse(JSON.stringify(componentToDuplicate)),
            id: generateUniqueId()
          };

          const columnArray = [...newChildren[columnIndex]];
          columnArray.splice(componentIndex + 1, 0, duplicatedComponent);
          newChildren[columnIndex] = columnArray;
        }

        return {
          ...comp,
          children: newChildren
        };
      }
      return comp;
    }));
  }, [saveState]);


  // Container component management functions
  const deleteComponentFromContainer = useCallback((parentId: string, componentIndex: number) => {
    saveState();

    setComponents(prev => prev.map(comp => {
      if (comp.id === parentId && comp.type === 'container') {
        const containerComp = comp as ContainerComponent;
        const newChildren = (containerComp.children || []).filter((_, index) => index !== componentIndex);

        return {
          ...comp,
          children: newChildren
        };
      }
      return comp;
    }));
  }, [saveState]);

  const moveComponentUpInContainer = useCallback((parentId: string, componentIndex: number) => {
    if (componentIndex > 0) {
      saveState();

      setComponents(prev => prev.map(comp => {
        if (comp.id === parentId && comp.type === 'container') {
          const containerComp = comp as ContainerComponent;
          const newChildren = [...(containerComp.children || [])];
          [newChildren[componentIndex - 1], newChildren[componentIndex]] =
            [newChildren[componentIndex], newChildren[componentIndex - 1]];

          return {
            ...comp,
            children: newChildren
          };
        }
        return comp;
      }));
    }
  }, [saveState]);

  const moveComponentDownInContainer = useCallback((parentId: string, componentIndex: number) => {
    saveState();

    setComponents(prev => prev.map(comp => {
      if (comp.id === parentId && comp.type === 'container') {
        const containerComp = comp as ContainerComponent;
        const newChildren = [...(containerComp.children || [])];

        if (componentIndex < newChildren.length - 1) {
          [newChildren[componentIndex], newChildren[componentIndex + 1]] =
            [newChildren[componentIndex + 1], newChildren[componentIndex]];
        }

        return {
          ...comp,
          children: newChildren
        };
      }
      return comp;
    }));
  }, [saveState]);

  const duplicateComponentInContainer = useCallback((parentId: string, componentIndex: number) => {
    saveState();

    setComponents(prev => prev.map(comp => {
      if (comp.id === parentId && comp.type === 'container') {
        const containerComp = comp as ContainerComponent;
        const componentToDuplicate = containerComp.children?.[componentIndex];

        if (componentToDuplicate) {
          const duplicatedComponent = {
            ...JSON.parse(JSON.stringify(componentToDuplicate)),
            id: generateUniqueId()
          };

          const newChildren = [...(containerComp.children || [])];
          newChildren.splice(componentIndex + 1, 0, duplicatedComponent);

          return {
            ...comp,
            children: newChildren
          };
        }
      }
      return comp;
    }));
  }, [saveState]);

  // Add template selection function
  const handleSelectTemplate = useCallback((template: any) => {
    // Save current state for undo
    saveState();

    // Replace current template
    setComponents(template.components.map((comp: any) => ({
      ...comp,
      id: generateUniqueId() // Generate new IDs to avoid conflicts
    })));
    setCanvasSettings(template.canvasSettings);
    setSelectedComponent(null);

    console.log('Template loaded:', template.name);
  }, [saveState]);

  // Add component selection function
  const handleSelectComponent = useCallback((component: any) => {
    // Add the component with a new ID
    const newComponent = {
      ...component,
      id: generateUniqueId()
    };

    saveState();
    addComponentToCanvas(newComponent);
  }, [saveState]);

  // Helper function to add component to canvas
  const addComponentToCanvas = (component: EmailComponent) => {
    setComponents(prev => [...prev, component]);
  };




  // Enhanced HTML generation with proper column handling
  const generateHTML = useCallback(() => {
    const renderComponent = (component: EmailComponent): string => {
      switch (component.type) {
        case 'text':
          const textComp = component as TextComponent;

          // Container styles (background, padding, margins, borders)
          const TextContainerStyles = {
            backgroundColor: textComp.styles?.backgroundColor,
            paddingTop: textComp.styles?.paddingTop,
            paddingRight: textComp.styles?.paddingRight,
            paddingBottom: textComp.styles?.paddingBottom,
            paddingLeft: textComp.styles?.paddingLeft,
            marginTop: textComp.styles?.marginTop,
            marginRight: textComp.styles?.marginRight,
            marginBottom: textComp.styles?.marginBottom,
            marginLeft: textComp.styles?.marginLeft,
            border: textComp.styles?.border,
            borderWidth: textComp.styles?.borderWidth,
            borderStyle: textComp.styles?.borderStyle,
            borderColor: textComp.styles?.borderColor,
            borderRadius: textComp.styles?.borderRadius,
            boxShadow: textComp.styles?.boxShadow,
            opacity: textComp.styles?.opacity,
            textAlign: textComp.styles?.textAlign || 'left'
          };

          // Text-specific styles for the paragraph element
          const textStyles = {
            fontSize: textComp.styles?.fontSize,
            fontFamily: textComp.styles?.fontFamily,
            fontWeight: textComp.styles?.fontWeight,
            fontStyle: textComp.styles?.fontStyle,
            lineHeight: textComp.styles?.lineHeight,
            color: textComp.styles?.color,
            textDecoration: textComp.styles?.textDecoration,
            textTransform: textComp.styles?.textTransform,
            letterSpacing: textComp.styles?.letterSpacing,
            textAlign: 'inherit',
            margin: '0',
            padding: '0'
          };

          return `<div style="${stylesToString(TextContainerStyles)}">
    <p style="${stylesToString(textStyles)}">${textComp.content}</p>
  </div>`;

        case 'heading':
          const headingComp = component as HeadingComponent;

          // Separate container styles (background, padding, margins, borders) from text styles
          const HeadingContainerStyles = {
            backgroundColor: headingComp.styles?.backgroundColor,
            paddingTop: headingComp.styles?.paddingTop,
            paddingRight: headingComp.styles?.paddingRight,
            paddingBottom: headingComp.styles?.paddingBottom,
            paddingLeft: headingComp.styles?.paddingLeft,
            marginTop: headingComp.styles?.marginTop,
            marginRight: headingComp.styles?.marginRight,
            marginBottom: headingComp.styles?.marginBottom,
            marginLeft: headingComp.styles?.marginLeft,
            border: headingComp.styles?.border,
            borderWidth: headingComp.styles?.borderWidth,
            borderStyle: headingComp.styles?.borderStyle,
            borderColor: headingComp.styles?.borderColor,
            borderRadius: headingComp.styles?.borderRadius,
            boxShadow: headingComp.styles?.boxShadow,
            opacity: headingComp.styles?.opacity,
            textAlign: headingComp.styles?.textAlign || 'left'
          };

          // Text-specific styles for the heading element itself
          const headingStyles = {
            fontSize: headingComp.styles?.fontSize,
            fontFamily: headingComp.styles?.fontFamily,
            fontWeight: headingComp.styles?.fontWeight,
            fontStyle: headingComp.styles?.fontStyle,
            lineHeight: headingComp.styles?.lineHeight,
            color: headingComp.styles?.color,
            textDecoration: headingComp.styles?.textDecoration,
            textTransform: headingComp.styles?.textTransform,
            letterSpacing: headingComp.styles?.letterSpacing,
            textAlign: 'inherit',
            margin: '0',
            padding: '0'
          };

          return `<div style="${stylesToString(HeadingContainerStyles)}">
              <${headingComp.level} style="${stylesToString(headingStyles)}">${headingComp.content}</${headingComp.level}>
            </div>`;
        case 'image':
          const imageComp = component as ImageComponent;
          const imageStyles = { ...imageComp.styles };
          const containerAlign = imageStyles.textAlign || 'left';
          delete imageStyles.textAlign;

          // Handle block image alignment for email clients
          if (imageStyles.display === 'block') {
            if (containerAlign === 'center') {
              imageStyles.marginLeft = 'auto';
              imageStyles.marginRight = 'auto';
            } else if (containerAlign === 'right') {
              imageStyles.marginLeft = 'auto';
              imageStyles.marginRight = '0';
            } else {
              imageStyles.marginLeft = '0';
              imageStyles.marginRight = 'auto';
            }
          }

          return `<div style="text-align: ${containerAlign}; margin-bottom: ${imageComp.styles?.marginBottom || '16px'};">
                <img src="${imageComp.src}" alt="${imageComp.alt}" style="${stylesToString({
            ...imageStyles,
            marginBottom: '0'
          })}" />
              </div>`;
        case 'button':
          const buttonComp = component as ButtonComponent;

          // Container styles for alignment only
          const buttonContainerStyles = {
            textAlign: buttonComp.styles?.textAlign || 'left',
            marginTop: buttonComp.styles?.marginTop,
            marginRight: buttonComp.styles?.marginRight,
            marginBottom: buttonComp.styles?.marginBottom,
            marginLeft: buttonComp.styles?.marginLeft,
            paddingTop: buttonComp.styles?.paddingTop,
            paddingRight: buttonComp.styles?.paddingRight,
            paddingBottom: buttonComp.styles?.paddingBottom,
            paddingLeft: buttonComp.styles?.paddingLeft
          };

          // Button-specific styles - INCLUDING BORDERS
          const buttonStyles = {
            backgroundColor: buttonComp.styles?.backgroundColor || '#007bff',
            color: buttonComp.styles?.color || '#ffffff',
            fontSize: buttonComp.styles?.fontSize || '16px',
            fontFamily: buttonComp.styles?.fontFamily || 'Arial, sans-serif',
            fontWeight: buttonComp.styles?.fontWeight || '500',
            fontStyle: buttonComp.styles?.fontStyle,
            textDecoration: 'none',
            display: 'inline-block',
            padding: buttonComp.styles?.padding || '12px 24px',
            // ADD ALL BORDER STYLES TO BUTTON ELEMENT
            border: buttonComp.styles?.border,
            borderWidth: buttonComp.styles?.borderWidth,
            borderStyle: buttonComp.styles?.borderStyle,
            borderColor: buttonComp.styles?.borderColor,
            borderRadius: buttonComp.styles?.borderRadius || '4px',
            boxShadow: buttonComp.styles?.boxShadow,
            opacity: buttonComp.styles?.opacity,
            cursor: 'pointer',
            textTransform: buttonComp.styles?.textTransform,
            letterSpacing: buttonComp.styles?.letterSpacing,
            lineHeight: buttonComp.styles?.lineHeight,
            transition: 'all 0.3s ease'
          };

          return `<div style="${stylesToString(buttonContainerStyles)}">
                  <a href="${buttonComp.href}" style="${stylesToString(buttonStyles)}">${buttonComp.text}</a>
                </div>`;


        case 'divider':
          return `<hr style="${stylesToString(component.styles)}" />`;
        case 'spacer':
          const spacerComp = component as SpacerComponent;
          const spacerStyles = {
            height: spacerComp.height || spacerComp.styles?.height || '16px',
            lineHeight: spacerComp.height || spacerComp.styles?.height || '16px',
            backgroundColor: spacerComp.styles?.backgroundColor,
            marginTop: spacerComp.styles?.marginTop,
            marginRight: spacerComp.styles?.marginRight,
            marginBottom: spacerComp.styles?.marginBottom,
            marginLeft: spacerComp.styles?.marginLeft,
            paddingTop: spacerComp.styles?.paddingTop,
            paddingRight: spacerComp.styles?.paddingRight,
            paddingBottom: spacerComp.styles?.paddingBottom,
            paddingLeft: spacerComp.styles?.paddingLeft,
            border: spacerComp.styles?.border,
            borderWidth: spacerComp.styles?.borderWidth,
            borderStyle: spacerComp.styles?.borderStyle,
            borderColor: spacerComp.styles?.borderColor,
            borderRadius: spacerComp.styles?.borderRadius,
            boxShadow: spacerComp.styles?.boxShadow,
            opacity: spacerComp.styles?.opacity,
            width: '100%'
          };

          return `<div style="${stylesToString(spacerStyles)}"></div>`;

          const listComp = component as ListComponent;

          // Container styles
          const ListContainerStyles = {
            backgroundColor: listComp.styles?.backgroundColor,
            paddingTop: listComp.styles?.paddingTop,
            paddingRight: listComp.styles?.paddingRight,
            paddingBottom: listComp.styles?.paddingBottom,
            paddingLeft: listComp.styles?.paddingLeft,
            marginTop: listComp.styles?.marginTop,
            marginRight: listComp.styles?.marginRight,
            marginBottom: listComp.styles?.marginBottom,
            marginLeft: listComp.styles?.marginLeft,
            border: listComp.styles?.border,
            borderWidth: listComp.styles?.borderWidth,
            borderStyle: listComp.styles?.borderStyle,
            borderColor: listComp.styles?.borderColor,
            borderRadius: listComp.styles?.borderRadius,
            boxShadow: listComp.styles?.boxShadow,
            opacity: listComp.styles?.opacity
          };

          // List-specific styles
          const listStyles = {
            fontSize: listComp.styles?.fontSize,
            fontFamily: listComp.styles?.fontFamily,
            fontWeight: listComp.styles?.fontWeight,
            color: listComp.styles?.color,
            lineHeight: listComp.styles?.lineHeight,
            listStyleType: listComp.styles?.listStyleType || (listComp.listType === 'ol' ? 'decimal' : 'disc'),
            listStylePosition: listComp.styles?.listStylePosition || 'outside',
            paddingLeft: '20px',
            margin: '0'
          };

          const listItems = listComp.items.map(item => `<li>${item}</li>`).join('');

          return `<div style="${stylesToString(ListContainerStyles)}">
              <${listComp.listType} style="${stylesToString(listStyles)}">${listItems}</${listComp.listType}>
            </div>`;

        case 'container':
          const containerComp = component as ContainerComponent;
          const containerContent = containerComp.children?.map(renderComponent).join('') || '';
          return `<div style="${stylesToString(containerComp.styles)}">${containerContent}</div>`;
        case 'column':
          const columnComp = component as ColumnComponent;
          const columnWidths = columnComp.columnWidths || ['50%', '50%'];
          const columnGap = columnComp.styles?.gap || '8px';

          // Parse gap for table cellspacing
          const parseGapForTable = (gap: string) => {
            const match = gap.match(/^(\d*\.?\d+)(.*)/);
            const value = parseFloat(match?.[1] || '0');
            const unit = match?.[2] || 'px';

            // Convert to pixels for table cellspacing
            if (unit === 'rem') {
              return Math.min(value * 16, 32); // Cap at 32px
            } else if (unit === 'em') {
              return Math.min(value * 16, 32); // Cap at 32px
            }
            return Math.min(value, 32); // Cap px values at 32
          };

          const gapValue = parseGapForTable(columnGap);

          return `<table style="width: 100%; max-width: 100%; ${stylesToString(columnComp.styles)}" cellspacing="${gapValue}" cellpadding="0" border="0">
              <tr>
                ${columnWidths.map((width, index) => {
            const columnContent = Array.isArray(columnComp.children?.[index])
              ? columnComp.children[index].map(renderComponent).join('')
              : '';
            return `<td style="width: ${width}; vertical-align: top; padding: 10px; max-width: 0; overflow-wrap: break-word;">${columnContent}</td>`;
          }).join('')}
              </tr>
            </table>`;

        default:
          return '';
      }
    };

    const componentHTML = components.map(renderComponent).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${canvasSettings.backgroundColor}; font-family: ${canvasSettings.fontFamily}; font-size: ${canvasSettings.fontSize}; line-height: ${canvasSettings.lineHeight}; color: ${canvasSettings.color};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: ${canvasSettings.padding};">
        <table role="presentation" width="${canvasSettings.contentWidth}" cellspacing="0" cellpadding="0" border="0" style="background-color: ${canvasSettings.contentBackgroundColor}; max-width: ${canvasSettings.maxWidth};">
          <tr>
            <td style="padding: 0px;">
              ${componentHTML}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
  }, [components, canvasSettings]);

  // Utility functions
  const stylesToString = (styles?: ComponentStyles): string => {
    if (!styles) return '';

    return Object.entries(styles)
      .filter(([_, value]) => {
        return value !== undefined &&
          value !== '' &&
          value !== 'transparent' &&
          value !== 'none' &&
          value !== null;
      })
      .map(([key, value]) => `${camelToKebab(key)}: ${value}`)
      .join('; ');
  };

  const camelToKebab = (str: string): string => {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase();
  };

  // Enhanced drag and drop handlers with visual feedback
  const handleDragStart = (e: React.DragEvent, componentType: string) => {
    e.dataTransfer.setData('componentType', componentType);
    setIsDragging(true);
    setDraggedComponentType(componentType);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOverTarget(null);
    setDraggedComponentType(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverTarget(targetId);
  };

  const handleDragLeave = (e: React.DragEvent, targetId: string) => {
    // Use a more reliable method to detect if we're actually leaving the target
    const rect = e.currentTarget.getBoundingClientRect();
    const isActuallyLeaving = (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    );

    if (isActuallyLeaving) {
      console.log('Actually leaving:', targetId); // Debug log
      setDragOverTarget(null);
    }
  };

  // Update handleDrop to support prebuilt components
  const handleDrop = (e: React.DragEvent, index: number = components.length, parentId?: string, columnIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();

    const componentType = e.dataTransfer.getData('componentType');
    const prebuiltComponent = e.dataTransfer.getData('prebuiltComponent');

    if (prebuiltComponent) {
      // Handle prebuilt component drop
      try {
        const parsedComponent = JSON.parse(prebuiltComponent);
        const newComponent = {
          ...parsedComponent,
          id: generateUniqueId()
        };

        saveState();
        if (parentId) {
          // Add to container or column
          addComponent('', index, parentId, columnIndex, newComponent);
        } else {
          // Add to main canvas
          setComponents(prev => {
            const newComponents = [...prev];
            newComponents.splice(index, 0, newComponent);
            return newComponents;
          });
        }
      } catch (error) {
        console.error('Error parsing prebuilt component:', error);
      }
    } else if (componentType) {
      // Handle regular component drop
      addComponent(componentType, index, parentId, columnIndex);
    }

    // Clean up drag state
    setIsDragging(false);
    setDragOverTarget(null);
    setDraggedComponentType(null);
  };

  const handleComponentSelect = useCallback((component: EmailComponent) => {
    setSelectedComponent(JSON.parse(JSON.stringify(component)));
    setSelectedTarget('component');
  }, []);

  // Handle canvas selection
  const handleCanvasSelect = useCallback(() => {
    setSelectedComponent(null);
    setSelectedTarget('canvas');
  }, []);



  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Enhanced Toolbar with Zoom Controls */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold"><EnsembleLogo className="h-8 w-8" /></h2>
            {/* Add Template Library Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTemplateLibraryOpen(true)}
              className="ml-4"
            >
              <Layout className="h-4 w-4 mr-1" />
              Templates
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={undoStack.length === 0}
            >
              <Undo2 className="h-4 w-4" />
              Undo
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={redoStack.length === 0}
            >
              <Redo2 className="h-4 w-4" />
              Redo
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 50}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="px-2 text-sm font-medium min-w-[50px] text-center">
                {zoomLevel}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomReset}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <Button
              variant={selectedTarget === 'canvas' ? 'default' : 'outline'}
              size="sm"
              onClick={handleCanvasSelect}
            >
              <Settings className="h-4 w-4" />
              Canvas
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex rounded-md border">
              <Button
                variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('desktop')}
              >
                <Monitor className="h-4 w-4" />
                Desktop
              </Button>
              <Button
                variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('mobile')}
              >
                <Smartphone className="h-4 w-4" />
                Mobile
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewOpen(true)}
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>


            {/* Enhanced Save Button with Status */}
            <div className="flex items-center space-x-2">
              {/* Save Status Indicator */}
              {hasUnsavedChanges && (
                <div className="flex items-center space-x-1 text-xs text-amber-600  px-2 py-1 rounded">
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  <span>Unsaved changes</span>
                </div>
              )}


              {lastSaved && !hasUnsavedChanges && (
                <div className="flex items-center space-x-1 text-xs text-green-600  px-2 py-1 rounded">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span>Saved {formatTimeAgo(lastSaved)}</span>
                </div>
              )}



              {/* Export HTML - Now Secondary */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport?.(generateHTML())}
                disabled={!onExport}
              >
                <Download className="h-4 w-4" />
              </Button>

              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleManualSave}
                  variant={saveStatus === 'unsaved' ? 'default' : 'outline'}
                  className={saveStatus === 'unsaved' ? 'bg-blue-600 text-white' : ''}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveStatus === 'saving' ? 'Saving...' :
                    saveStatus === 'unsaved' ? 'Save Changes' : 'Saved'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Sidebar - Components */}
        {!readOnly && (
          <div className="w-64 border-r bg-card p-4 overflow-y-auto">
            {/* Quick Templates Access */}
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTemplateLibraryOpen(true)}
                className="w-full"
              >
                <Layout className="h-4 w-4 mr-2" />
                Browse Templates
              </Button>
            </div>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-2">
                {Object.entries(COMPONENT_TYPES)
                  .filter(([_, type]) => type.category === 'basic')
                  .map(([key, type]) => (
                    <div
                      key={key}
                      draggable
                      onDragStart={(e) => handleDragStart(e, key)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center space-x-2 p-3 border rounded cursor-move hover:bg-accent transition-all duration-200 ${isDragging ? 'opacity-50' : 'hover:shadow-md'
                        }`}
                    >
                      <type.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{type.name}</span>
                      {isDragging && draggedComponentType === key && (
                        <span className="ml-auto text-xs text-blue-500">Dragging...</span>
                      )}
                    </div>
                  ))}
              </TabsContent>

              <TabsContent value="layout" className="space-y-2">
                {Object.entries(COMPONENT_TYPES)
                  .filter(([_, type]) => type.category === 'layout')
                  .map(([key, type]) => (
                    <div
                      key={key}
                      draggable
                      onDragStart={(e) => handleDragStart(e, key)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center space-x-2 p-3 border rounded cursor-move hover:bg-accent transition-all duration-200 ${isDragging ? 'opacity-50' : 'hover:shadow-md'
                        }`}
                    >
                      <type.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{type.name}</span>
                      {isDragging && draggedComponentType === key && (
                        <span className="ml-auto text-xs text-blue-500">Dragging...</span>
                      )}
                    </div>
                  ))}
              </TabsContent>
            </Tabs>
          </div>
        )}


        {/* Enhanced Canvas with Zoom */}
        <div
          className="flex-1 p-4 overflow-y-auto"
          style={{ backgroundColor: canvasSettings.backgroundColor }}
          onClick={handleCanvasSelect}
        >
          {/* Main Canvas */}
          <div
            className={`mx-auto transition-all duration-200 email-editor ${previewMode === 'mobile' ? 'max-w-sm' : ''
              } ${isDragging ? 'ring-2 ring-blue-200 ring-dashed' : ''
              } ${dragOverTarget === 'main-canvas' ? 'ring-4 ring-blue-400 ring-dashed bg-blue-50' : ''
              }`}
            style={{
              width: previewMode === 'mobile' ? '375px' : canvasSettings.contentWidth,
              maxWidth: canvasSettings.maxWidth,
              backgroundColor: canvasSettings.contentBackgroundColor,
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              minHeight: '500px'
            }}
            onClick={handleCanvasSelect}
            onDrop={(e) => handleDrop(e)}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, 'main-canvas')}
            onDragLeave={(e) => handleDragLeave(e, 'main-canvas')}
          >
            {components.length === 0 && (
              <div className={`flex items-center justify-center h-64 border-2 border-dashed rounded-lg transition-all duration-200 ${isDragging
                ? 'border-blue-400 bg-blue-50 text-blue-600'
                : 'border-gray-300 text-gray-500'
                }`}>
                <div className="text-center">
                  <div className="text-lg mb-2">
                    {isDragging ? '📥' : '📄'}
                  </div>
                  <p className="text-sm">
                    {isDragging
                      ? `Drop ${draggedComponentType} here to add it to your email`
                      : 'Drag components here to start building your email'
                    }
                  </p>
                </div>
              </div>
            )}

            {components.map((component, index) => (
              <div
                key={component.id}
                className={`relative transition-all duration-200 ${isDragging ? 'border-t-2 border-dashed border-transparent hover:border-blue-400' : ''
                  }`}
                onDrop={(e) => handleDrop(e, index)}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, `component-${index}`)}
                onDragLeave={(e) => handleDragLeave(e, `component-${index}`)}
              >
                {/* Drop indicator above component */}
                {isDragging && dragOverTarget === `component-${index}` && (
                  <div className="h-2 bg-blue-400 rounded mb-2 animate-pulse"></div>
                )}

                <ComponentRenderer
                  component={component}
                  isSelected={selectedComponent?.id === component.id}
                  onSelect={handleComponentSelect}
                  onDrop={handleDrop}
                  index={index}
                  totalComponents={components.length}
                  onMoveUp={() => moveComponentUp(index)}
                  onMoveDown={() => moveComponentDown(index)}
                  onDuplicate={() => duplicateComponent(index)}
                  onDelete={() => deleteComponent(component.id)}
                  onDeleteFromColumn={deleteComponentFromColumn}
                  onMoveUpInColumn={moveComponentUpInColumn}
                  onMoveDownInColumn={moveComponentDownInColumn}
                  onDuplicateInColumn={duplicateComponentInColumn}
                  onDeleteFromContainer={deleteComponentFromContainer}
                  onMoveUpInContainer={moveComponentUpInContainer}
                  onMoveDownInContainer={moveComponentDownInContainer}
                  onDuplicateInContainer={duplicateComponentInContainer}
                  // Pass drag states as props
                  isDragging={isDragging}
                  dragOverTarget={dragOverTarget}
                  draggedComponentType={draggedComponentType}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                />
              </div>
            ))}

            {/* Drop zone at the end */}
            {isDragging && (
              <div
                className="h-12 border-2 border-dashed border-blue-400 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 text-sm"
                onDrop={(e) => handleDrop(e, components.length)}
                onDragOver={handleDragOver}
              >
                Drop here to add at the end
              </div>
            )}
          </div>


        </div>

        {/* Right Sidebar - Properties */}
        {!readOnly && (selectedComponent || selectedTarget === 'canvas') && (
          <div className="w-96 border-l bg-card">
            {selectedTarget === 'canvas' ? (
              <CanvasPropertiesPanel
                settings={canvasSettings}
                onUpdate={setCanvasSettings}
              />
            ) : selectedComponent ? (
              <EnhancedPropertiesPanel
                key={selectedComponent.id}
                component={selectedComponent}
                onUpdate={(updates) => updateComponent(selectedComponent.id, updates)}
                onDelete={() => deleteComponent(selectedComponent.id)}
              />
            ) : null}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <EnhancedPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        htmlContent={generateHTML()}
      />

      <TemplateLibraryModal
        isOpen={isTemplateLibraryOpen}
        onClose={() => setIsTemplateLibraryOpen(false)}
        onSelectTemplate={handleSelectTemplate}
        onSelectComponent={handleSelectComponent}
        teamId={teamId as string} // Add this prop - you'll need to pass teamId to EmailEditor
      />
    </div>
  );
}

// Enhanced Component Renderer with Fixed Column Support
// Enhanced Component Renderer with proper image alignment
interface ComponentRendererProps {
  component: EmailComponent;
  isSelected: boolean;
  onSelect: (component: EmailComponent) => void;
  onDrop: (e: React.DragEvent, index: number, parentId?: string, columnIndex?: number) => void;
  index: number;
  totalComponents: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  parentId?: string;
  // Add these new props for column management
  onDeleteFromColumn: (parentId: string, columnIndex: number, componentIndex: number) => void;
  onMoveUpInColumn: (parentId: string, columnIndex: number, componentIndex: number) => void;
  onMoveDownInColumn: (parentId: string, columnIndex: number, componentIndex: number) => void;
  onDuplicateInColumn: (parentId: string, columnIndex: number, componentIndex: number) => void;
  onDeleteFromContainer: (parentId: string, componentIndex: number) => void;
  onMoveUpInContainer: (parentId: string, componentIndex: number) => void;
  onMoveDownInContainer: (parentId: string, componentIndex: number) => void;
  onDuplicateInContainer: (parentId: string, componentIndex: number) => void;
  // Add these drag-related props
  isDragging?: boolean;
  dragOverTarget?: string | null;
  draggedComponentType?: string | null;
  onDragEnter?: (e: React.DragEvent, targetId: string) => void;
  onDragLeave?: (e: React.DragEvent, targetId: string) => void;
}

function ComponentRenderer({
  component,
  isSelected,
  onSelect,
  onDrop,
  index,
  totalComponents,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  parentId,
  onDeleteFromColumn,
  onMoveUpInColumn,
  onMoveDownInColumn,
  onDuplicateInColumn,
  onDeleteFromContainer,
  onMoveUpInContainer,
  onMoveDownInContainer,
  onDuplicateInContainer,
  isDragging = false,
  dragOverTarget = null,
  draggedComponentType = null,
  onDragEnter,
  onDragLeave,
}: ComponentRendererProps): ReactElement | null {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    onDrop(e, index, parentId);
  };

  // Recursive rendering function - this was missing!
  const renderChildComponent = (childComponent: EmailComponent, childProps: Partial<ComponentRendererProps> = {}) => {
    return (
      <ComponentRenderer
        component={childComponent}
        isSelected={isSelected && childComponent.id === component.id}
        onSelect={onSelect}
        onDrop={onDrop}
        onDeleteFromColumn={onDeleteFromColumn}
        onMoveUpInColumn={onMoveUpInColumn}
        onMoveDownInColumn={onMoveDownInColumn}
        onDuplicateInColumn={onDuplicateInColumn}
        onDeleteFromContainer={onDeleteFromContainer}
        onMoveUpInContainer={onMoveUpInContainer}
        onMoveDownInContainer={onMoveDownInContainer}
        onDuplicateInContainer={onDuplicateInContainer}
        {...childProps}
      />
    );
  };

  const renderContent = () => {
    switch (component.type) {
      case 'text':
        const textComp = component as TextComponent;

        // Separate border styles from text styles
        const containerStyles = {
          textAlign: textComp.styles?.textAlign || 'left',
          // Apply border styles to container only
          border: textComp.styles?.border,
          borderWidth: textComp.styles?.borderWidth,
          borderStyle: textComp.styles?.borderStyle,
          borderColor: textComp.styles?.borderColor,
          borderRadius: textComp.styles?.borderRadius,
          backgroundColor: textComp.styles?.backgroundColor,
          marginTop: textComp.styles?.marginTop,
          marginRight: textComp.styles?.marginRight,
          marginBottom: textComp.styles?.marginBottom,
          marginLeft: textComp.styles?.marginLeft,
          paddingTop: textComp.styles?.paddingTop,
          paddingRight: textComp.styles?.paddingRight,
          paddingBottom: textComp.styles?.paddingBottom,
          paddingLeft: textComp.styles?.paddingLeft,
          opacity: textComp.styles?.opacity,
          boxShadow: textComp.styles?.boxShadow,
        };

        // Text-specific styles without borders
        const textStyles = {
          fontSize: textComp.styles?.fontSize,
          fontFamily: textComp.styles?.fontFamily,
          fontWeight: textComp.styles?.fontWeight,
          fontStyle: textComp.styles?.fontStyle,
          lineHeight: textComp.styles?.lineHeight,
          color: textComp.styles?.color,
          textDecoration: textComp.styles?.textDecoration,
          textTransform: textComp.styles?.textTransform,
          letterSpacing: textComp.styles?.letterSpacing,
          textAlign: 'inherit',
          margin: 0,
          padding: 0,
          boxShadow: textComp.styles?.boxShadow,
        };

        return (
          <div style={containerStyles}>
            <p style={textStyles}>
              {textComp.content}
            </p>
          </div>
        );



      case 'heading':
        const headingComp = component as HeadingComponent;
        const HeadingTag = headingComp.level;

        const headingContainerStyles = {
          textAlign: headingComp.styles?.textAlign || 'left',
          // Apply border styles to container only
          border: headingComp.styles?.border,
          borderWidth: headingComp.styles?.borderWidth,
          borderStyle: headingComp.styles?.borderStyle,
          borderColor: headingComp.styles?.borderColor,
          borderRadius: headingComp.styles?.borderRadius,
          backgroundColor: headingComp.styles?.backgroundColor,
          marginTop: headingComp.styles?.marginTop,
          marginRight: headingComp.styles?.marginRight,
          marginBottom: headingComp.styles?.marginBottom,
          marginLeft: headingComp.styles?.marginLeft,
          paddingTop: headingComp.styles?.paddingTop,
          paddingRight: headingComp.styles?.paddingRight,
          paddingBottom: headingComp.styles?.paddingBottom,
          paddingLeft: headingComp.styles?.paddingLeft,
          opacity: headingComp.styles?.opacity,
          boxShadow: headingComp.styles?.boxShadow,
        };

        const headingStyles = {
          fontSize: headingComp.styles?.fontSize,
          fontFamily: headingComp.styles?.fontFamily,
          fontWeight: headingComp.styles?.fontWeight,
          fontStyle: headingComp.styles?.fontStyle,
          lineHeight: headingComp.styles?.lineHeight,
          color: headingComp.styles?.color,
          textDecoration: headingComp.styles?.textDecoration,
          textTransform: headingComp.styles?.textTransform,
          letterSpacing: headingComp.styles?.letterSpacing,
          textAlign: 'inherit',
          margin: 0,
          padding: 0
        };

        return (
          <div style={headingContainerStyles}>
            {React.createElement(HeadingTag,
              { style: headingStyles },
              headingComp.content
            )}
          </div>
        );


      case 'image':
        const imageComp = component as ImageComponent;
        const textAlign = (imageComp.styles?.textAlign as 'left' | 'center' | 'right') || 'left';

        const ImageContainerStyles: React.CSSProperties = {
          textAlign: textAlign,
          marginTop: imageComp.styles?.marginTop || '0px',
          marginRight: imageComp.styles?.marginRight || '0px',
          marginBottom: imageComp.styles?.marginBottom || '16px',
          marginLeft: imageComp.styles?.marginLeft || '0px',
          paddingTop: imageComp.styles?.paddingTop || '0px',
          paddingRight: imageComp.styles?.paddingRight || '0px',
          paddingBottom: imageComp.styles?.paddingBottom || '0px',
          paddingLeft: imageComp.styles?.paddingLeft || '0px',
          backgroundColor: imageComp.styles?.backgroundColor,
          border: imageComp.styles?.border,
          borderWidth: imageComp.styles?.borderWidth,
          borderStyle: imageComp.styles?.borderStyle,
          borderColor: imageComp.styles?.borderColor,
          borderRadius: imageComp.styles?.borderRadius,
          opacity: imageComp.styles?.opacity,
          // Ensure proper alignment container
          display: 'block'
        };

        const imageStyles: React.CSSProperties = {
          width: imageComp.styles?.width || '100%',
          maxWidth: imageComp.styles?.maxWidth || '400px',
          height: imageComp.styles?.height || 'auto',
          display: 'block'
        };

        // Handle alignment for block images in canvas (same as HTML generation)
        if (imageStyles.display === 'block') {
          if (textAlign === 'center') {
            imageStyles.marginLeft = 'auto';
            imageStyles.marginRight = 'auto';
          } else if (textAlign === 'right') {
            imageStyles.marginLeft = 'auto';
            imageStyles.marginRight = '0';
          } else {
            imageStyles.marginLeft = '0';
            imageStyles.marginRight = 'auto';
          }
        }

        return (
          <div style={ImageContainerStyles}>
            <img
              src={imageComp.src}
              alt={imageComp.alt}
              style={imageStyles}
              className="max-w-full h-auto"
            />
          </div>
        );


      case 'button':
        const buttonComp = component as ButtonComponent;

        // Container styles for layout only
        const buttonContainerStyles: React.CSSProperties = {
          textAlign: (buttonComp.styles?.textAlign as 'left' | 'center' | 'right') || 'left',
          marginTop: buttonComp.styles?.marginTop,
          marginRight: buttonComp.styles?.marginRight,
          marginBottom: buttonComp.styles?.marginBottom || '0px',
          marginLeft: buttonComp.styles?.marginLeft,
          paddingTop: buttonComp.styles?.paddingTop,
          paddingRight: buttonComp.styles?.paddingRight,
          paddingBottom: buttonComp.styles?.paddingBottom,
          paddingLeft: buttonComp.styles?.paddingLeft
        };

        // Button styles - INCLUDING BORDERS
        const buttonStyles: React.CSSProperties = {
          backgroundColor: buttonComp.styles?.backgroundColor || '#007bff',
          color: buttonComp.styles?.color || '#ffffff',
          fontSize: buttonComp.styles?.fontSize || '16px',
          fontFamily: buttonComp.styles?.fontFamily || 'Arial, sans-serif',
          fontWeight: buttonComp.styles?.fontWeight || '500',
          fontStyle: buttonComp.styles?.fontStyle as 'normal' | 'italic' | 'oblique',
          textDecoration: 'none',
          display: 'inline-block',
          padding: buttonComp.styles?.padding || '12px 24px',
          // APPLY BORDER STYLES TO BUTTON ELEMENT
          border: buttonComp.styles?.border,
          borderWidth: buttonComp.styles?.borderWidth,
          borderStyle: buttonComp.styles?.borderStyle as 'none' | 'solid' | 'dashed' | 'dotted',
          borderColor: buttonComp.styles?.borderColor,
          borderRadius: buttonComp.styles?.borderRadius || '4px',
          boxShadow: buttonComp.styles?.boxShadow,
          opacity: buttonComp.styles?.opacity,
          cursor: 'pointer',
          textTransform: buttonComp.styles?.textTransform as 'none' | 'uppercase' | 'lowercase' | 'capitalize',
          letterSpacing: buttonComp.styles?.letterSpacing,
          lineHeight: buttonComp.styles?.lineHeight,
          transition: 'all 0.3s ease'
        };

        return (
          <div style={buttonContainerStyles}>
            <a
              href={buttonComp.href}
              style={buttonStyles}
            >
              {buttonComp.text}
            </a>
          </div>
        );



      case 'divider':
        return <hr style={component.styles} />;

      case 'spacer':
        const spacerComp = component as SpacerComponent;
        const spacerStyles: React.CSSProperties = {
          height: spacerComp.height || spacerComp.styles?.height || '16px',
          lineHeight: spacerComp.height || spacerComp.styles?.height || '16px',
          backgroundColor: spacerComp.styles?.backgroundColor,
          marginTop: spacerComp.styles?.marginTop,
          marginRight: spacerComp.styles?.marginRight,
          marginBottom: spacerComp.styles?.marginBottom,
          marginLeft: spacerComp.styles?.marginLeft,
          paddingTop: spacerComp.styles?.paddingTop,
          paddingRight: spacerComp.styles?.paddingRight,
          paddingBottom: spacerComp.styles?.paddingBottom,
          paddingLeft: spacerComp.styles?.paddingLeft,
          border: spacerComp.styles?.border,
          borderWidth: spacerComp.styles?.borderWidth,
          borderStyle: spacerComp.styles?.borderStyle as 'none' | 'solid' | 'dashed' | 'dotted',
          borderColor: spacerComp.styles?.borderColor,
          borderRadius: spacerComp.styles?.borderRadius,
          boxShadow: spacerComp.styles?.boxShadow,
          opacity: spacerComp.styles?.opacity,
          width: '100%',
          minHeight: '8px' // Minimum height for visibility
        };

        return <div style={spacerStyles}></div>;


      case 'list':
        const listComp = component as ListComponent;
        const ListTag = listComp.listType === 'ol' ? 'ol' : 'ul';

        const listContainerStyles: React.CSSProperties = {
          // Container gets layout styles
          marginTop: listComp.styles?.marginTop || '0px',
          marginRight: listComp.styles?.marginRight || '0px',
          marginBottom: listComp.styles?.marginBottom || '0px',
          marginLeft: listComp.styles?.marginLeft || '0px',
          paddingTop: listComp.styles?.paddingTop || '0px',
          paddingRight: listComp.styles?.paddingRight || '0px',
          paddingBottom: listComp.styles?.paddingBottom || '0px',
          paddingLeft: listComp.styles?.paddingLeft || '0px',
          backgroundColor: listComp.styles?.backgroundColor,
          border: listComp.styles?.border,
          borderWidth: listComp.styles?.borderWidth,
          borderStyle: listComp.styles?.borderStyle,
          borderColor: listComp.styles?.borderColor,
          borderRadius: listComp.styles?.borderRadius,
          opacity: listComp.styles?.opacity,
          boxShadow: listComp.styles?.boxShadow,
        };

        const listStyles: React.CSSProperties = {
          // List gets typography and list-specific styles
          fontSize: listComp.styles?.fontSize,
          fontFamily: listComp.styles?.fontFamily,
          fontWeight: listComp.styles?.fontWeight,
          color: listComp.styles?.color,
          lineHeight: listComp.styles?.lineHeight,
          listStyleType: listComp.styles?.listStyleType || (listComp.listType === 'ol' ? 'decimal' : 'disc'),
          listStylePosition: listComp.styles?.listStylePosition || 'outside',
          paddingLeft: '20px',
          margin: 0,
          display: 'block'
        };

        return (
          <div style={listContainerStyles}>
            <ListTag style={listStyles}>
              {listComp.items.map((item, index) => (
                <li
                  key={index}
                  style={{
                    display: 'list-item',
                    listStyleType: 'inherit',
                    marginBottom: '4px'
                  }}
                >
                  {item}
                </li>
              ))}
            </ListTag>
          </div>
        );


      case 'container':
        const containerComp = component as ContainerComponent;
        const containerId = `container-${component.id}`;
        const isContainerDropTarget = dragOverTarget === containerId;

        return (
          <div className={`border border-dashed border-gray-300 transition-all duration-200 ${isDragging ? 'hover:border-blue-400 hover:bg-blue-50' : ''
            } ${isContainerDropTarget ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200' : ''
            }`}>
            <div
              style={{
                ...containerComp.styles,
                boxShadow: containerComp.styles?.boxShadow
              }}
              className="min-h-[50px] relative"
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Container drop:', containerId); // Debug log
                onDrop(e, 0, component.id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Container drag enter:', containerId); // Debug log
                onDragEnter?.(e, containerId);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const isLeavingContainer = (
                  e.clientX < rect.left ||
                  e.clientX > rect.right ||
                  e.clientY < rect.top ||
                  e.clientY > rect.bottom
                );

                if (isLeavingContainer) {
                  console.log('Container drag leave:', containerId); // Debug log
                  onDragLeave?.(e, containerId);
                }
              }}
            >
              {/* Drop indicator overlay */}
              {isDragging && isContainerDropTarget && (containerComp.children || []).length > 0 && (
                <div className="absolute inset-0 border-2 border-dashed border-blue-500 bg-blue-100 bg-opacity-30 rounded flex items-center justify-center z-10 pointer-events-none">
                  <div className="text-blue-600 text-sm font-medium">
                    Drop {draggedComponentType} in container
                  </div>
                </div>
              )}

              {(containerComp.children || []).map((childComponent, childIndex) => (
                <div key={childComponent.id} className="relative group mb-2">
                  {renderChildComponent(childComponent, {
                    index: childIndex,
                    totalComponents: (containerComp.children || []).length,
                    onMoveUp: () => onMoveUpInContainer(component.id, childIndex),
                    onMoveDown: () => onMoveDownInContainer(component.id, childIndex),
                    onDuplicate: () => onDuplicateInContainer(component.id, childIndex),
                    onDelete: () => onDeleteFromContainer(component.id, childIndex),
                    parentId: component.id,
                    isDragging,
                    dragOverTarget,
                    draggedComponentType,
                    onDragEnter,
                    onDragLeave
                  })}
                </div>
              ))}

              {(containerComp.children || []).length === 0 && (
                <div className={`text-xs text-center rounded border-2 border-dashed transition-all duration-200 ${isDragging && isContainerDropTarget
                  ? 'border-blue-400 bg-blue-100 text-blue-600'
                  : 'border-gray-200 text-gray-400'
                  }`}>
                  {isDragging && isContainerDropTarget
                    ? `Drop ${draggedComponentType} here`
                    : 'Drop components here'
                  }
                </div>
              )}
            </div>
          </div>
        );



      case 'column':
        const colComp = component as ColumnComponent;
        const columnWidths = colComp.columnWidths || ['50%', '50%'];
        const columnGap = colComp.styles?.gap || '8px';

        // Parse gap value to calculate available space
        const parseGapValue = (gap: string) => {
          const match = gap.match(/^(\d*\.?\d+)(.*)/);
          const value = parseFloat(match?.[1] || '0');
          const unit = match?.[2] || 'px';

          // Convert rem to px for calculation (assuming 16px = 1rem)
          if (unit === 'rem') {
            return value * 16;
          } else if (unit === 'em') {
            return value * 16; // Approximate
          }
          return value; // px
        };

        const gapInPx = parseGapValue(columnGap);
        const numberOfGaps = columnWidths.length - 1;
        const totalGapWidth = gapInPx * numberOfGaps;

        return (
          <div
            className={`border border-dashed border-gray-300 p-2 mb-4 transition-all duration-200 column-container ${isDragging ? 'hover:border-blue-400' : ''
              }`}
            style={{
              ...colComp.styles,
              boxShadow: colComp.styles?.boxShadow,
              overflow: 'hidden' // Prevent overflow
            }}
          >
            <div
              className="flex"
              style={{
                gap: columnGap,
                width: '100%',
                maxWidth: '100%',
                overflow: 'hidden' // Ensure no overflow
              }}
            >
              {columnWidths.map((width, colIndex) => {
                const columnId = `column-${component.id}-${colIndex}`;
                const isDropTarget = dragOverTarget === columnId;

                // Calculate adjusted width accounting for gaps
                const widthPercent = parseFloat(width.replace('%', ''));
                const adjustedWidth = `calc(${width} - ${totalGapWidth / columnWidths.length}px)`;

                return (
                  <div
                    key={colIndex}
                    className={`  flex-shrink-0 transition-all duration-200 relative ${isDragging ? 'hover:border-blue-400 hover:bg-blue-50' : ''
                      } ${isDropTarget ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200' : ''
                      }`}
                    style={{
                      width: totalGapWidth > 100 ? width : adjustedWidth, // Use original width if gap is too large
                      minWidth: '50px', // Minimum column width
                      maxWidth: '100%'
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Column drop:', columnId);
                      onDrop(e, 0, component.id, colIndex);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Column drag enter:', columnId);
                      onDragEnter?.(e, columnId);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const isLeavingColumn = (
                        e.clientX < rect.left ||
                        e.clientX > rect.right ||
                        e.clientY < rect.top ||
                        e.clientY > rect.bottom
                      );

                      if (isLeavingColumn) {
                        console.log('Column drag leave:', columnId);
                        onDragLeave?.(e, columnId);
                      }
                    }}
                  >
                    {/* Drop indicator overlay when dragging over */}
                    {isDragging && isDropTarget && (
                      <div className="absolute inset-0 border-2 border-dashed border-blue-500 bg-blue-100 bg-opacity-50 rounded flex items-center justify-center z-10 pointer-events-none">
                        <div className="text-blue-600 text-sm font-medium">
                          Drop {draggedComponentType} here
                        </div>
                      </div>
                    )}

                    {(colComp.children?.[colIndex] || []).map((childComponent, childIndex) => (
                      <div key={childComponent.id} className="relative component-wrapper mb-2">
                        {renderChildComponent(childComponent, {
                          index: childIndex,
                          totalComponents: (colComp.children?.[colIndex] || []).length,
                          onMoveUp: () => onMoveUpInColumn(component.id, colIndex, childIndex),
                          onMoveDown: () => onMoveDownInColumn(component.id, colIndex, childIndex),
                          onDuplicate: () => onDuplicateInColumn(component.id, colIndex, childIndex),
                          onDelete: () => onDeleteFromColumn(component.id, colIndex, childIndex),
                          parentId: component.id,
                          isDragging,
                          dragOverTarget,
                          draggedComponentType,
                          onDragEnter,
                          onDragLeave
                        })}
                      </div>
                    ))}

                    {(colComp.children?.[colIndex] || []).length === 0 && (
                      <div className={`text-xs text-center py-8 rounded border border-dashed transition-all duration-200 ${isDragging && isDropTarget
                        ? 'border-blue-400 bg-blue-100 text-blue-600'
                        : 'border-gray-300 text-gray-400'
                        }`}>
                        {isDragging && isDropTarget
                          ? `Drop ${draggedComponentType} in column ${colIndex + 1}`
                          : 'Drop components here'
                        }
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );






      default:
        return null;
    }
  };

  return (
    <div
      className={`group cursor-pointer transition-all relative ${isSelected ? 'ring-1 ring-blue-500 bg-blue-500/10' : 'hover:bg-blue-500/10'
        }`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(component);
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {renderContent()}

      <ComponentToolbar
        component={component}
        index={index}
        totalComponents={totalComponents}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />
    </div>
  );
}


// Canvas Properties Panel
interface CanvasPropertiesPanelProps {
  settings: CanvasSettings;
  onUpdate: (settings: CanvasSettings) => void;
}

function CanvasPropertiesPanel({ settings, onUpdate }: CanvasPropertiesPanelProps) {
  const handleChange = (key: keyof CanvasSettings, value: string) => {
    onUpdate({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className="p-4 overflow-y-auto max-h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Canvas Settings</h3>
      </div>

      <div className="space-y-4">
        {/* Outer Background Color */}
        <div>
          <Label>Outer Background Color</Label>
          <div className="flex space-x-2 items-center mt-1">
            <Input
              type="color"
              value={settings.backgroundColor}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
              className="w-12 h-8 p-0 border-0"
            />
            <Input
              value={settings.backgroundColor}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
              placeholder="#f4f4f4"
              className="flex-1"
            />
          </div>
        </div>

        {/* Inner Content Background Color */}
        <div>
          <Label>Content Background Color</Label>
          <div className="flex space-x-2 items-center mt-1">
            <Input
              type="color"
              value={settings.contentBackgroundColor}
              onChange={(e) => handleChange('contentBackgroundColor', e.target.value)}
              className="w-12 h-8 p-0 border-0"
            />
            <Input
              value={settings.contentBackgroundColor}
              onChange={(e) => handleChange('contentBackgroundColor', e.target.value)}
              placeholder="#ffffff"
              className="flex-1"
            />
          </div>
        </div>

        {/* Content Width */}
        <div>
          <Label>Content Width</Label>
          <NumberInput
            value={settings.contentWidth}
            onChange={(value) => handleChange('contentWidth', value)}
            placeholder="600"
            units={['px', '%', 'em']}
          />
        </div>

        {/* Max Width */}
        <div>
          <Label>Max Width</Label>
          <NumberInput
            value={settings.maxWidth}
            onChange={(value) => handleChange('maxWidth', value)}
            placeholder="600"
            units={['px', '%', 'em']}
          />
        </div>

        {/* Padding */}
        <div>
          <Label>Canvas Padding</Label>
          <NumberInput
            value={settings.padding}
            onChange={(value) => handleChange('padding', value)}
            placeholder="20"
          />
        </div>

        <Separator />

        {/* Default Typography */}
        <div>
          <Label>Default Font Family</Label>
          <Select
            value={settings.fontFamily}
            onValueChange={(value) => handleChange('fontFamily', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Default Font Size</Label>
          <Select
            value={settings.fontSize}
            onValueChange={(value) => handleChange('fontSize', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Default Line Height</Label>
          <Select
            value={settings.lineHeight}
            onValueChange={(value) => handleChange('lineHeight', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LINE_HEIGHT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Default Text Color</Label>
          <div className="flex space-x-2 items-center mt-1">
            <Input
              type="color"
              value={settings.color}
              onChange={(e) => handleChange('color', e.target.value)}
              className="w-12 h-8 p-0 border-0"
            />
            <Input
              value={settings.color}
              onChange={(e) => handleChange('color', e.target.value)}
              placeholder="#333333"
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Properties Panel with Comprehensive Styling for All Components
interface PropertiesPanelProps {
  component: EmailComponent;
  onUpdate: (updates: Partial<EmailComponent>) => void;
  onDelete: () => void;
}

function EnhancedPropertiesPanel({ component, onUpdate, onDelete }: PropertiesPanelProps) {
  // Local state for content
  const [localContent, setLocalContent] = useState(() => {
    if (component.type === 'text' || component.type === 'heading') {
      return (component as TextComponent | HeadingComponent).content;
    }
    return '';
  });

  // Text shadow state
  const [textShadow, setTextShadow] = useState(() => {
    const shadow = component.styles?.textShadow || 'none';
    if (shadow === 'none' || !shadow) {
      return { x: 0, y: 0, blur: 0, color: '#000000', enabled: false };
    }
    const parts = shadow.split(' ');
    return {
      x: parseInt(parts[0]) || 0,
      y: parseInt(parts[1]) || 0,
      blur: parseInt(parts[2]) || 0,
      color: parts[3] || '#000000',
      enabled: true
    };
  });

  // Box shadow state
  const [boxShadow, setBoxShadow] = useState(() => {
    const shadow = component.styles?.boxShadow || 'none';
    if (shadow === 'none' || !shadow) {
      return { x: 0, y: 0, blur: 0, spread: 0, color: '#000000', enabled: false };
    }
    const parts = shadow.split(' ');
    return {
      x: parseInt(parts[0]) || 0,
      y: parseInt(parts[1]) || 0,
      blur: parseInt(parts[2]) || 0,
      spread: parseInt(parts[3]) || 0,
      color: parts[4] || '#000000',
      enabled: true
    };
  });

  React.useEffect(() => {
    if (component.type === 'text' || component.type === 'heading') {
      setLocalContent((component as TextComponent | HeadingComponent).content);
    }
  }, [component.id, component.type]);

  const handleStyleChange = useCallback((property: string, value: string, batchUpdates?: Record<string, string>) => {
    if (property === 'batch' && batchUpdates) {
      // Handle batch spacing updates for "All Sides" functionality
      onUpdate({
        styles: {
          ...component.styles,
          ...batchUpdates
        }
      } as Partial<EmailComponent>);
    } else {
      // Handle single property update
      onUpdate({
        styles: {
          ...component.styles,
          [property]: value
        }
      } as Partial<EmailComponent>);
    }
  }, [component.styles, onUpdate]);


  const handleContentChange = (content: string) => {
    setLocalContent(content);
    onUpdate({ content } as Partial<EmailComponent>);
  };

  const handleTextShadowChange = (key: string, value: any) => {
    const newShadow = { ...textShadow, [key]: value };
    setTextShadow(newShadow);

    if (newShadow.enabled) {
      const shadowValue = `${newShadow.x}px ${newShadow.y}px ${newShadow.blur}px ${newShadow.color}`;
      handleStyleChange('textShadow', shadowValue);
    } else {
      handleStyleChange('textShadow', 'none');
    }
  };

  const handleBoxShadowChange = (key: string, value: any) => {
    const newShadow = { ...boxShadow, [key]: value };
    setBoxShadow(newShadow);

    if (newShadow.enabled) {
      const shadowValue = `${newShadow.x}px ${newShadow.y}px ${newShadow.blur}px ${newShadow.spread}px ${newShadow.color}`;
      handleStyleChange('boxShadow', shadowValue);
    } else {
      handleStyleChange('boxShadow', 'none');
    }
  };

  const handleHeadingLevelChange = (level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') => {
    onUpdate({ level } as Partial<EmailComponent>);
  };

  // Quick style toggles
  const toggleBold = () => {
    const currentWeight = component.styles?.fontWeight || '400';
    const newWeight = currentWeight === '700' || currentWeight === 'bold' ? '400' : '700';
    handleStyleChange('fontWeight', newWeight);
  };

  const toggleItalic = () => {
    const currentStyle = component.styles?.fontStyle || 'normal';
    const newStyle = currentStyle === 'italic' ? 'normal' : 'italic';
    handleStyleChange('fontStyle', newStyle);
  };

  const toggleUnderline = () => {
    const currentDecoration = component.styles?.textDecoration || 'none';
    const newDecoration = currentDecoration === 'underline' ? 'none' : 'underline';
    handleStyleChange('textDecoration', newDecoration);
  };

  const setTextAlign = (align: 'left' | 'center' | 'right' | 'justify') => {
    handleStyleChange('textAlign', align);
  };

  // Component type checks for advanced styling
  const supportsTextStyling = component.type === 'text' || component.type === 'heading' || component.type === 'button' || component.type === 'list';
  const supportsBoxStyling = true; // All components support box styling
  const supportsLayoutStyling = component.type !== 'spacer';

  return (
    <div className="p-4 overflow-y-auto max-h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Properties</h3>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          Delete
        </Button>
      </div>

      <div className="space-y-4">
        <div className="text-xs text-muted-foreground">
          Component ID: {component.id.split('-').slice(-1)[0]}
        </div>

        {/* Content editing with Textarea */}
        {(component.type === 'text' || component.type === 'heading') && (
          <div>
            <Label>Content</Label>
            <Textarea
              value={localContent}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Enter your content..."
              className="min-h-[80px] resize-none"
            />
          </div>
        )}

        {/* Heading level selection */}
        {component.type === 'heading' && (
          <div>
            <Label>Heading Level</Label>
            <Select
              value={(component as HeadingComponent).level}
              onValueChange={handleHeadingLevelChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="h1">H1</SelectItem>
                <SelectItem value="h2">H2</SelectItem>
                <SelectItem value="h3">H3</SelectItem>
                <SelectItem value="h4">H4</SelectItem>
                <SelectItem value="h5">H5</SelectItem>
                <SelectItem value="h6">H6</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Button specific properties */}
        {component.type === 'button' && (
          <>
            <div>
              <Label>Button Text</Label>
              <Input
                value={(component as ButtonComponent).text}
                onChange={(e) => onUpdate({ text: e.target.value } as Partial<EmailComponent>)}
              />
            </div>
            <div>
              <Label>Link URL</Label>
              <Input
                value={(component as ButtonComponent).href}
                onChange={(e) => onUpdate({ href: e.target.value } as Partial<EmailComponent>)}
              />
            </div>
          </>
        )}

        {component.type === 'image' && (
          <div className='flex flex-col gap-3'>
            <div className="flex items-center space-x-2 mb-2">
              <Image className="h-4 w-4 " />
              <Label className=" font-medium">Image Properties</Label>
            </div>

            {/* Image URL */}
            <div>
              <Label>Image URL</Label>
              <Input
                value={(component as ImageComponent).src || ''}
                onChange={(e) => {
                  onUpdate({
                    src: e.target.value
                  } as Partial<EmailComponent>);
                }}
                placeholder="https://example.com/image.jpg"
                className="mt-1"
              />
              <div className="text-xs  mt-1">
                Enter the URL of the image you want to display
              </div>
            </div>

            {/* Alt Text */}
            <div>
              <Label>Alt Text</Label>
              <Input
                value={(component as ImageComponent).alt || ''}
                onChange={(e) => {
                  onUpdate({
                    alt: e.target.value
                  } as Partial<EmailComponent>);
                }}
                placeholder="Describe this image"
                className="mt-1"
              />
            </div>
          </div>
        )}

        {/* Image specific properties */}
        {component.type === 'image' && (
          <div>
            <Label>Image Alignment</Label>
            <div className="flex space-x-1 mt-2">
              <Button
                size="sm"
                variant={component.styles?.textAlign === 'left' ? 'default' : 'outline'}
                onClick={() => handleStyleChange('textAlign', 'left')}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={component.styles?.textAlign === 'center' ? 'default' : 'outline'}
                onClick={() => handleStyleChange('textAlign', 'center')}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={component.styles?.textAlign === 'right' ? 'default' : 'outline'}
                onClick={() => handleStyleChange('textAlign', 'right')}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}



        {/* Spacer specific properties */}
        {component.type === 'spacer' && (
          <div>
            <Label>Height</Label>
            <NumberInput
              value={(component as SpacerComponent).height}
              onChange={(value) => onUpdate({ height: value } as Partial<EmailComponent>)}
              placeholder="20"
            />
          </div>
        )}

        {/* List specific properties */}
        {component.type === 'list' && (
          <div className="space-y-3">
            {/* List Type Toggle */}
            <div>
              <Label>List Type</Label>
              <Select
                value={(component as ListComponent).listType}
                onValueChange={(value: 'ul' | 'ol') => {
                  onUpdate({
                    listType: value,
                    styles: {
                      ...component.styles,
                      listStyleType: value === 'ol' ? 'decimal' : 'disc'
                    }
                  } as Partial<EmailComponent>);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ul">Unordered List (Bullets)</SelectItem>
                  <SelectItem value="ol">Ordered List (Numbers)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* List Style Type */}
            <div>
              <Label>List Style</Label>
              <Select
                value={component.styles?.listStyleType || ((component as ListComponent).listType === 'ol' ? 'decimal' : 'disc')}
                onValueChange={(value) => {
                  onUpdate({
                    styles: {
                      ...component.styles,
                      listStyleType: value
                    }
                  } as Partial<EmailComponent>);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIST_STYLE_TYPES[(component as ListComponent).listType === 'ol' ? 'ol' : 'ul'].map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* List Style Position */}
            <div>
              <Label>List Position</Label>
              <Select
                value={component.styles?.listStylePosition || 'outside'}
                onValueChange={(value) => {
                  onUpdate({
                    styles: {
                      ...component.styles,
                      listStylePosition: value
                    }
                  } as Partial<EmailComponent>);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outside">Outside</SelectItem>
                  <SelectItem value="inside">Inside</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* List Items Editor */}
            <div>
              <Label>List Items</Label>
              <div className="space-y-2 mt-2">
                {(component as ListComponent).items.map((item, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      value={item}
                      onChange={(e) => {
                        const newItems = [...(component as ListComponent).items];
                        newItems[index] = e.target.value;
                        onUpdate({ items: newItems } as Partial<EmailComponent>);
                      }}
                      placeholder={`Item ${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newItems = (component as ListComponent).items.filter((_, i) => i !== index);
                        onUpdate({ items: newItems } as Partial<EmailComponent>);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newItems = [...(component as ListComponent).items, `New item ${(component as ListComponent).items.length + 1}`];
                    onUpdate({ items: newItems } as Partial<EmailComponent>);
                  }}
                  className="w-full"
                >
                  Add Item
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Styling Options for All Components */}
        <Separator />
        <Tabs defaultValue={supportsTextStyling ? "typography" : "spacing"} className="w-full">
          <TabsList className={`grid w-full ${supportsTextStyling ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {supportsTextStyling && <TabsTrigger value="typography">Typography</TabsTrigger>}
            <TabsTrigger value="spacing">Spacing</TabsTrigger>
            <TabsTrigger value="borders">Borders</TabsTrigger>
            <TabsTrigger value="effects">Effects</TabsTrigger>
          </TabsList>


          {/* Typography Tab - Enhanced for all text-supporting components */}
          {supportsTextStyling && (
            <TabsContent value="typography" className="space-y-4">
              {/* Quick Format Buttons */}
              {(component.type === 'text' || component.type === 'heading' || component.type === 'button') && (
                <div>
                  <Label>Quick Format</Label>
                  <div className="flex space-x-2 mt-2">
                    <Button
                      size="sm"
                      variant={component.styles?.fontWeight === '700' || component.styles?.fontWeight === 'bold' ? 'default' : 'outline'}
                      onClick={toggleBold}
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={component.styles?.fontStyle === 'italic' ? 'default' : 'outline'}
                      onClick={toggleItalic}
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={component.styles?.textDecoration === 'underline' ? 'default' : 'outline'}
                      onClick={toggleUnderline}
                    >
                      <Underline className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Text Alignment */}
              <div>
                <Label>Text Alignment</Label>
                <div className="flex space-x-1 mt-2">
                  <Button
                    size="sm"
                    variant={component.styles?.textAlign === 'left' ? 'default' : 'outline'}
                    onClick={() => setTextAlign('left')}
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={component.styles?.textAlign === 'center' ? 'default' : 'outline'}
                    onClick={() => setTextAlign('center')}
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={component.styles?.textAlign === 'right' ? 'default' : 'outline'}
                    onClick={() => setTextAlign('right')}
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={component.styles?.textAlign === 'justify' ? 'default' : 'outline'}
                    onClick={() => setTextAlign('justify')}
                  >
                    <AlignJustify className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Font Family */}
              <div>
                <Label>Font Family</Label>
                <Select
                  value={component.styles?.fontFamily || 'Arial, sans-serif'}
                  onValueChange={(value) => handleStyleChange('fontFamily', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Font Size */}
              <div>
                <Label>Font Size</Label>
                <Select
                  value={getStyleValue(component, 'fontSize') || '16px'}
                  onValueChange={(value) => handleStyleChange('fontSize', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_SIZES.map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Font Family */}
              <div>
                <Label>Font Family</Label>
                <Select
                  value={getStyleValue(component, 'fontFamily') || 'Arial, sans-serif'}
                  onValueChange={(value) => handleStyleChange('fontFamily', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map((font) => (
                      <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Font Weight */}
              <div>
                <Label>Font Weight</Label>
                <Select
                  value={getStyleValue(component, 'fontWeight') || '400'}
                  onValueChange={(value) => handleStyleChange('fontWeight', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_WEIGHTS.map((weight) => (
                      <SelectItem key={weight.value} value={weight.value}>{weight.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Color */}
              <div>
                <Label>Text Color</Label>
                <div className="flex space-x-2 items-center mt-1">
                  <Input
                    type="color"
                    value={getStyleValue(component, 'color') || '#333333'}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    className="w-12 h-8 p-0 border-0"
                  />
                  <Input
                    value={getStyleValue(component, 'color') || '#333333'}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    placeholder="#333333"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Line Height */}
              <div>
                <Label>Line Height</Label>
                <Select
                  value={component.styles?.lineHeight || '1.5'}
                  onValueChange={(value) => handleStyleChange('lineHeight', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LINE_HEIGHT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Text Transform */}
              <div>
                <Label>Text Transform</Label>
                <Select
                  value={component.styles?.textTransform || 'none'}
                  onValueChange={(value) => handleStyleChange('textTransform', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEXT_TRANSFORM_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Letter Spacing */}
              <div>
                <Label>Letter Spacing</Label>
                <NumberInput
                  value={component.styles?.letterSpacing || '0px'}
                  onChange={(value) => handleStyleChange('letterSpacing', value)}
                  placeholder="0"
                  min={-5}
                  max={20}
                  step={0.1}
                />
              </div>

              {/* Text Colors */}
              <div className="space-y-3">
                <div>
                  <Label>Text Color</Label>
                  <div className="flex space-x-2 items-center mt-1">
                    <Input
                      type="color"
                      value={component.styles?.color || '#333333'}
                      onChange={(e) => handleStyleChange('color', e.target.value)}
                      className="w-12 h-8 p-0 border-0"
                    />
                    <Input
                      value={component.styles?.color || '#333333'}
                      onChange={(e) => handleStyleChange('color', e.target.value)}
                      placeholder="#333333"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced Text Shadow Controls */}
              {(component.type === 'text' || component.type === 'heading') && (
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Text Shadow</Label>
                    <Switch
                      checked={textShadow.enabled}
                      onCheckedChange={(checked) => handleTextShadowChange('enabled', checked)}
                    />
                  </div>

                  {textShadow.enabled && (
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <Label className="text-xs">Horizontal</Label>
                        <NumberInput
                          value={`${textShadow.x}px`}
                          onChange={(value) => handleTextShadowChange('x', parseInt(value) || 0)}
                          placeholder="0"
                          min={-50}
                          max={50}
                          units={['px']}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Vertical</Label>
                        <NumberInput
                          value={`${textShadow.y}px`}
                          onChange={(value) => handleTextShadowChange('y', parseInt(value) || 0)}
                          placeholder="0"
                          min={-50}
                          max={50}
                          units={['px']}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Blur</Label>
                        <NumberInput
                          value={`${textShadow.blur}px`}
                          onChange={(value) => handleTextShadowChange('blur', parseInt(value) || 0)}
                          placeholder="0"
                          min={0}
                          max={50}
                          units={['px']}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Color</Label>
                        <Input
                          type="color"
                          value={textShadow.color}
                          onChange={(e) => handleTextShadowChange('color', e.target.value)}
                          className="h-8 p-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          )}

          {/* Spacing Tab - Enhanced for all components */}
          <TabsContent value="spacing" className="space-y-4">
            {/* Background Color */}
            <div>
              <Label>Background Color</Label>
              <div className="flex space-x-2 items-center mt-1">
                <Input
                  type="color"
                  value={getStyleValue(component, 'backgroundColor') === 'transparent' ? '#ffffff' : getStyleValue(component, 'backgroundColor') || '#ffffff'}
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                  className="w-12 h-8 p-0 border-0"
                />
                <Input
                  value={getStyleValue(component, 'backgroundColor') || 'transparent'}
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                  placeholder="transparent"
                  className="flex-1"
                />
              </div>
            </div>



            {component.type === 'column' && (
              <div>
                <Label>Column Gap</Label>
                <NumberInput
                  value={getStyleValue(component, 'gap') || '8px'}
                  onChange={(value) => {
                    // Parse and validate the gap value
                    const match = value.match(/^(\d*\.?\d+)(.*)/);
                    const numValue = parseFloat(match?.[1] || '0');
                    const unit = match?.[2] || 'px';

                    // Set maximum values to prevent overflow
                    let maxValue = numValue;
                    if (unit === 'rem' && numValue > 2) {
                      maxValue = 2; // Max 2rem
                    } else if (unit === 'px' && numValue > 32) {
                      maxValue = 32; // Max 32px
                    } else if (unit === 'em' && numValue > 2) {
                      maxValue = 2; // Max 2em
                    }

                    const finalValue = `${maxValue}${unit}`;

                    onUpdate({
                      styles: {
                        ...component.styles,
                        gap: finalValue
                      }
                    } as Partial<EmailComponent>);
                  }}
                  placeholder="8"
                  units={['px', 'em', 'rem']}
                  defaultUnit="px"
                  max={50} // Set reasonable maximum
                />
                <div className="text-xs text-gray-500 mt-1">
                  Large gaps may cause columns to overflow. Recommended: 8-32px, 0.5-2rem
                </div>
              </div>
            )}

            {/* Padding Control */}
            <SpacingControl
              label="Padding"
              values={{
                top: getStyleValue(component, 'paddingTop'),
                right: getStyleValue(component, 'paddingRight'),
                bottom: getStyleValue(component, 'paddingBottom'),
                left: getStyleValue(component, 'paddingLeft')
              }}
              onChange={handleStyleChange}
              propertyPrefix="padding"
            />

            {/* Margin Control */}
            <SpacingControl
              label="Margin"
              values={{
                top: getStyleValue(component, 'marginTop'),
                right: getStyleValue(component, 'marginRight'),
                bottom: getStyleValue(component, 'marginBottom'),
                left: getStyleValue(component, 'marginLeft')
              }}
              onChange={handleStyleChange}
              propertyPrefix="margin"
            />

            {/* Dimensions for Image and other components */}
            {(component.type === 'image' || component.type === 'divider') && (
              <>
                <div>
                  <Label>Width</Label>
                  <NumberInput
                    value={component.styles?.width || '100%'}
                    onChange={(value) => handleStyleChange('width', value)}
                    placeholder="100"
                    units={['px', '%', 'em']}
                  />
                </div>

                {component.type === 'image' && (
                  <div>
                    <Label>Max Width</Label>
                    <NumberInput
                      value={component.styles?.maxWidth || '400px'}
                      onChange={(value) => handleStyleChange('maxWidth', value)}
                      placeholder="400"
                      units={['px', '%', 'em']}
                    />
                  </div>
                )}

                {component.type === 'divider' && (
                  <div>
                    <Label>Height</Label>
                    <NumberInput
                      value={component.styles?.height || '1px'}
                      onChange={(value) => handleStyleChange('height', value)}
                      placeholder="1"
                      units={['px', 'em']}
                    />
                  </div>
                )}
              </>
            )}

            {/* Text Indent for text components */}
            {(component.type === 'text' || component.type === 'list') && (
              <div>
                <Label>Text Indent</Label>
                <NumberInput
                  value={component.styles?.textIndent || '0px'}
                  onChange={(value) => handleStyleChange('textIndent', value)}
                  placeholder="0"
                  max={100}
                />
              </div>
            )}
          </TabsContent>

          {/* Borders Tab - Enhanced for all components */}
          <TabsContent value="borders" className="space-y-4">
            {/* Border Width */}
            <div>
              <Label>Border Width</Label>
              <NumberInput
                value={getStyleValue(component, 'borderWidth')}
                onChange={(value) => handleStyleChange('borderWidth', value)}
                placeholder="0"
                units={['px', 'em', 'rem']}
                defaultUnit="px"
              />
            </div>

            {/* Border Radius */}
            <div>
              <Label>Border Radius</Label>
              <NumberInput
                value={getStyleValue(component, 'borderRadius')}
                onChange={(value) => handleStyleChange('borderRadius', value)}
                placeholder="0"
                units={['px', 'em', 'rem', '%']}
                defaultUnit="px"
              />
            </div>

            {/* Border Style */}
            <div>
              <Label>Border Style</Label>
              <Select
                value={getStyleValue(component, 'borderStyle') || 'none'}
                onValueChange={(value) => handleStyleChange('borderStyle', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BORDER_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Border Color */}
            <div>
              <Label>Border Color</Label>
              <div className="flex space-x-2 items-center mt-1">
                <Input
                  type="color"
                  value={getStyleValue(component, 'borderColor') || '#cccccc'}
                  onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                  className="w-12 h-8 p-0 border-0"
                />
                <Input
                  value={getStyleValue(component, 'borderColor') || '#cccccc'}
                  onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                  placeholder="#cccccc"
                  className="flex-1"
                />
              </div>
            </div>
          </TabsContent>

          {/* Effects Tab - Box Shadow, Opacity, etc. */}
          <TabsContent value="effects" className="space-y-4">
            {/* Opacity */}
            <div>
              <Label>Opacity</Label>
              <div className="space-y-2">
                <Slider
                  value={[parseFloat(component.styles?.opacity || '1') * 100]}
                  onValueChange={([value]) => handleStyleChange('opacity', (value / 100).toString())}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground text-center">
                  {Math.round(parseFloat(component.styles?.opacity || '1') * 100)}%
                </div>
              </div>
            </div>

            {/* Box Shadow */}
            <div>
              <Label className="flex items-center justify-between">
                Box Shadow
                <Switch
                  checked={!!(component.styles?.boxShadow && component.styles.boxShadow !== 'none')}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      // Apply a good-looking default shadow
                      handleStyleChange('boxShadow', '0 2px 8px rgba(0, 0, 0, 0.15)');
                    } else {
                      handleStyleChange('boxShadow', 'none');
                    }
                  }}
                />
              </Label>
              {component.styles?.boxShadow && component.styles.boxShadow !== 'none' && (
                <div className="mt-2 space-y-2">
                  <Input
                    value={component.styles.boxShadow || '0 2px 8px rgba(0, 0, 0, 0.15)'}
                    onChange={(e) => handleStyleChange('boxShadow', e.target.value)}
                    placeholder="0 2px 8px rgba(0, 0, 0, 0.15)"
                    className="text-sm"
                  />
                  <div className="text-xs text-gray-500">
                    Format: x-offset y-offset blur spread color
                  </div>

                  {/* Quick Shadow Presets */}
                  <div className="grid grid-cols-2 gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStyleChange('boxShadow', '0 1px 3px rgba(0, 0, 0, 0.12)')}
                      className="text-xs h-7"
                    >
                      Subtle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStyleChange('boxShadow', '0 2px 8px rgba(0, 0, 0, 0.15)')}
                      className="text-xs h-7"
                    >
                      Normal
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStyleChange('boxShadow', '0 4px 16px rgba(0, 0, 0, 0.2)')}
                      className="text-xs h-7"
                    >
                      Strong
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStyleChange('boxShadow', '0 8px 32px rgba(0, 0, 0, 0.25)')}
                      className="text-xs h-7"
                    >
                      Heavy
                    </Button>
                  </div>
                </div>
              )}
            </div>


            {/* Cursor for interactive elements */}
            {(component.type === 'button' || component.type === 'image') && (
              <div>
                <Label>Cursor</Label>
                <Select
                  value={component.styles?.cursor || 'default'}
                  onValueChange={(value) => handleStyleChange('cursor', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURSOR_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Transition for interactive elements */}
            {(component.type === 'button') && (
              <div>
                <Label>Transition</Label>
                <Input
                  value={component.styles?.transition || 'all 0.3s ease'}
                  onChange={(e) => handleStyleChange('transition', e.target.value)}
                  placeholder="all 0.3s ease"
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
