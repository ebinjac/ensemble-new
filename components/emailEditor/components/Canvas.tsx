'use client';

import { EmailComponent } from '../types';

interface CanvasProps {
  components: EmailComponent[];
  selectedComponent: EmailComponent | null;
  setSelectedComponent: (comp: EmailComponent | null) => void;
  addComponent: (type: string, index?: number) => void;
  moveComponent: (fromIndex: number, toIndex: number) => void;
  previewMode: 'desktop' | 'mobile';
}

export default function Canvas(props: CanvasProps) {
  return null;
} 