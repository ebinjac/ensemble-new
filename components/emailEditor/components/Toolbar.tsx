'use client';

interface ToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  previewMode: 'desktop' | 'mobile';
  onPreviewModeChange: (mode: 'desktop' | 'mobile') => void;
  onExport: () => void;
  readOnly: boolean;
}

export default function Toolbar(props: ToolbarProps) {
  return null;
} 