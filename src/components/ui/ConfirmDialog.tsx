import { Modal } from "./Modal";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm leading-normal text-muted">{message}</p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onConfirm}
          className="inline-flex min-h-12 items-center rounded-full bg-coral px-7 text-base font-semibold text-ink transition-colors hover:bg-coral-deep"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-12 items-center rounded-full bg-sage px-7 text-base font-semibold text-ink transition-colors hover:bg-sage-deep"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
