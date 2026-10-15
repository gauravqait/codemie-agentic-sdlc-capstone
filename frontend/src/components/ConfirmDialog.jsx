import { useEffect, useRef } from 'react';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    if (open) {
      // Prefer focusing cancel to reduce accidental destructive actions.
      cancelRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
      }

      // Minimal focus trap: keep Tab within the two buttons.
      if (e.key === 'Tab') {
        const focusables = [cancelRef.current, confirmRef.current].filter(Boolean);
        if (focusables.length === 0) return;
        const currentIndex = focusables.indexOf(document.activeElement);
        let nextIndex = currentIndex;
        if (e.shiftKey) nextIndex = currentIndex <= 0 ? focusables.length - 1 : currentIndex - 1;
        else nextIndex = currentIndex === focusables.length - 1 ? 0 : currentIndex + 1;
        e.preventDefault();
        focusables[nextIndex]?.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="modalOverlay" role="presentation" onMouseDown={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={description ? 'confirm-desc' : undefined}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title">{title}</h2>
        {description && <p id="confirm-desc">{description}</p>}
        <div className="modalActions">
          <button ref={cancelRef} type="button" onClick={onCancel}>
            {cancelText}
          </button>
          <button ref={confirmRef} type="button" className="danger" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
