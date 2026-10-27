import { useEffect, useRef, useState } from 'react';

export const UNDO_WINDOW_MS = 8000;

const isTextField = (el) => el?.matches?.('input, textarea, select, [contenteditable="true"]');

/**
 * Non-modal snackbar offering to undo a delete. Dismisses itself after the undo window,
 * but the timer pauses while the pointer or keyboard focus is on it. Ctrl/Cmd+Z undoes
 * from anywhere (outside text fields) so keyboard users don't have to Tab to the button.
 */
export default function UndoSnackbar({ message, onUndo, onDismiss, timeoutMs = UNDO_WINDOW_MS }) {
  const [paused, setPaused] = useState(false);
  const undoRef = useRef(onUndo);
  undoRef.current = onUndo;

  useEffect(() => {
    if (paused) return undefined;
    const timer = setTimeout(onDismiss, timeoutMs);
    return () => clearTimeout(timer);
  }, [message, paused, onDismiss, timeoutMs]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !isTextField(e.target)) {
        e.preventDefault();
        undoRef.current();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="snackbar"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => e.key === 'Escape' && onDismiss()}
    >
      <span>{message}</span>
      <button type="button" data-action="undo" onClick={onUndo}>
        Undo
      </button>
    </div>
  );
}
