'use client';

import { useState } from 'react';

interface Props {
  mode: 'set' | 'enter';
  onConfirm: (passphrase: string) => Promise<boolean | void> | boolean | void;
  onCancel: () => void;
  onMaxRetries?: () => void;
}

export function PasswordModal({ mode, onConfirm, onCancel, onMaxRetries }: Props) {
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);

  const [retries, setRetries] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (isSubmitting) return;
    if (!pass) { setError('Please enter a password.'); return; }
    if (mode === 'set' && pass !== confirm) { setError('Passwords do not match.'); return; }
    if (mode === 'set' && pass.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setIsSubmitting(true);
    setError('');
    try {
      const success = await onConfirm(pass);
      if (success === false && mode === 'enter') {
        const nextRetries = retries + 1;
        if (nextRetries >= 3) {
          if (onMaxRetries) {
            onMaxRetries();
          } else {
            onCancel();
          }
        } else {
          setRetries(nextRetries);
          setError(`Incorrect password. ${3 - nextRetries} attempt${3 - nextRetries === 1 ? '' : 's'} left.`);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
          {mode === 'set' ? 'Protect Workspace with Password' : 'Enter Workspace Password'}
        </h3>
        <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          {mode === 'set'
            ? 'The workspace contents will be encrypted with AES-256. This password cannot be recovered.'
            : 'This workspace is password-protected. Enter the password to continue.'}
        </p>

        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type={show ? 'text' : 'password'}
              value={pass}
              onChange={(e) => { setPass(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={mode === 'set' ? 'Choose a password' : 'Enter password'}
              autoFocus
              style={{
                width: '100%', padding: '10px 40px 10px 14px', borderRadius: '10px',
                border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
                backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text)',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0,
              }}
              aria-label="Toggle password visibility"
            >
              {show
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>

          {mode === 'set' && (
            <input
              type={show ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Confirm password"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px',
                border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
                backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text)',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box',
              }}
            />
          )}

          {error && <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-danger)' }}>{error}</p>}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button className="toolbar-btn secondary" onClick={onCancel}>Cancel</button>
          <button className="toolbar-btn primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Checking...' : mode === 'set' ? 'Encrypt & Export' : 'Unlock'}
          </button>
        </div>
      </div>
    </div>
  );
}
