import { useEffect } from 'react';

export default function Toast({ open, message, actionLabel, onAction, onClose, durationMs = 5000 }) {
  useEffect(() => {
    if (!open) return;
    if (!durationMs) return;
    const t = setTimeout(() => onClose?.(), durationMs);
    return () => clearTimeout(t);
  }, [open, durationMs, onClose]);

  if (!open) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      <span>{message}</span>
      <div className="toastActions">
        {actionLabel && (
          <button type="button" onClick={onAction}>
            {actionLabel}
          </button>
        )}
        <button type="button" className="link" onClick={onClose} aria-label="Dismiss notification">
          Dismiss
        </button>
      </div>
    </div>
  );
}
