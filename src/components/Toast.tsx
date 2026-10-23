import { CheckCircle2, X, XCircle } from 'lucide-react';
import { cn } from '../utils/cn';

export interface ToastMessage {
  message: string;
  tone: 'success' | 'error';
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  if (!toast) return null;
  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-[120] flex max-w-sm items-start gap-2 rounded-[7px] border bg-card px-3 py-2.5 text-[12.5px] shadow-overlay animate-fade-up',
        toast.tone === 'error' ? 'border-destructive/40' : 'border-border',
      )}
      role="status"
    >
      {toast.tone === 'error' ? (
        <XCircle size={15} className="mt-0.5 shrink-0 text-destructive" />
      ) : (
        <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
      )}
      <span className="flex-1 leading-snug text-foreground">{toast.message}</span>
      <button
        type="button"
        onClick={onClose}
        className="rounded-[4px] p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Dismiss"
      >
        <X size={12} />
      </button>
    </div>
  );
}
