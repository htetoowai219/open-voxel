import { AlertTriangle } from 'lucide-react';
import { ModalShell } from './ModalShell';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <ModalShell
      open={open}
      onClose={busy ? () => undefined : onCancel}
      title={title}
      subtitle="Destructive action"
      icon={<AlertTriangle size={14} />}
      widthClass="max-w-md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[6px] bg-destructive px-3 text-[12.5px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-[13px] leading-relaxed text-muted-foreground">{description}</p>
    </ModalShell>
  );
}
