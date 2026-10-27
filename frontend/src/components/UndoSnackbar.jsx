import { useEffect } from 'react';

export const UNDO_WINDOW_MS = 5000;

/** Non-modal snackbar offering to undo a delete; dismisses itself after the undo window. */
export default function UndoSnackbar({ message, onUndo, onDismiss, timeoutMs = UNDO_WINDOW_MS }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, timeoutMs);
    return () => clearTimeout(timer);
  }, [message, onDismiss, timeoutMs]);

  return (
    <div className="snackbar" onKeyDown={(e) => e.key === 'Escape' && onDismiss()}>
      <span>{message}</span>
      <button type="button" data-action="undo" onClick={onUndo}>
        Undo
      </button>
    </div>
  );
}
