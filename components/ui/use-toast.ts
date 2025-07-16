import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const toast = ({ title, description, variant }: ToastOptions) => {
    if (variant === 'destructive') {
      sonnerToast.error(description || title);
    } else {
      sonnerToast.success(description || title);
    }
  };

  return { toast };
} 