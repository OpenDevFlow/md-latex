'use client';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1200,
      backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '360px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
          {title}
        </h3>
        <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '8px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button className="toolbar-btn secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`toolbar-btn ${isDanger ? 'danger' : 'primary'}`}
            style={isDanger ? { backgroundColor: '#dc2626', color: '#fff', border: 'none' } : {}}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
