export default function ConfirmDialog({ open, title, message, confirmText, cancelText, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.3)',
        display: 'grid',
        placeItems: 'center'
      }}
    >
      <div style={{ background: '#fff', padding: 16, width: 'min(520px, 92vw)', borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel}>{cancelText ?? 'Cancel'}</button>
          <button onClick={onConfirm}>{confirmText ?? 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}
