import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  widthClass?: string;
}

export function ModalShell({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  widthClass = 'max-w-xl',
}: ModalShellProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          'flex max-h-[92vh] w-full animate-fade-up flex-col overflow-hidden rounded-[9px] border border-border bg-card text-foreground shadow-overlay',
          widthClass,
        )}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon && (
              <span className="flex size-7 shrink-0 items-center justify-center rounded-[5px] border border-border bg-muted/60 text-muted-foreground">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              <h2 className="truncate font-heading text-[14px] font-semibold tracking-tight">{title}</h2>
              {subtitle && <p className="mt-0.5 truncate eyebrow text-[9.5px]">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-[5px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
        {footer && <footer className="shrink-0 border-t border-border p-3">{footer}</footer>}
      </div>
    </div>
  );
}
