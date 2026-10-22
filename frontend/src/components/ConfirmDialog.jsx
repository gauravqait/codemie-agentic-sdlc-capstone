import { useEffect, useId, useRef } from 'react';

const FOCUSABLE = 'button, [href], input, select, textarea';

/** Modal alert dialog: focus moves in, Tab is trapped, Esc cancels, focus returns to the opener. */
export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  const uid = useId();
  const ref = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    cancelRef.current?.focus();
    return () => {
      if (opener && opener.isConnected) opener.focus();
    };
  }, []);

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = ref.current.querySelectorAll(FOCUSABLE);
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="backdrop">
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${uid}-t`}
        aria-describedby={`${uid}-m`}
        className="dialog"
        onKeyDown={onKeyDown}
      >
        <h2 id={`${uid}-t`}>{title}</h2>
        <p id={`${uid}-m`}>{message}</p>
        <div className="actions">
          <button type="button" ref={cancelRef} className="secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
