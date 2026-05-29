'use client';

import { useState } from 'react';

interface Props {
  url: string;
  warning?: string;
  isPasswordProtected: boolean;
  onClose: () => void;
}

export function ShareUrlModal({ url, warning, isPasswordProtected, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* ignore */ }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{
        backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '520px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
            Share Workspace
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Password badge */}
        {isPasswordProtected && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            backgroundColor: 'var(--color-accent-soft)', borderRadius: '8px',
            padding: '6px 12px', marginBottom: '16px', fontSize: '12px',
            color: 'var(--color-accent)', fontWeight: 500,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Password protected
          </div>
        )}

        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          Anyone with this link can load your workspace instantly in their browser.
          {isPasswordProtected && ' They will be prompted for the password you set.'}
        </p>

        {/* URL box */}
        <div style={{
          display: 'flex', gap: '8px', alignItems: 'stretch',
          backgroundColor: 'var(--color-surface-2)', borderRadius: '10px',
          border: '1px solid var(--color-border)', overflow: 'hidden',
        }}>
          <div style={{
            flex: 1, padding: '10px 14px', fontSize: '12px',
            color: 'var(--color-text-muted)', fontFamily: 'monospace',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {url}
          </div>
          <button
            onClick={copyUrl}
            style={{
              padding: '10px 16px', background: copied ? 'var(--color-success, #22c55e)' : 'var(--color-accent)',
              border: 'none', cursor: 'pointer', color: '#fff',
              fontSize: '13px', fontWeight: 600, flexShrink: 0, transition: 'background 0.2s',
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Warning */}
        {warning && (
          <div style={{
            marginTop: '12px', padding: '10px 14px', borderRadius: '8px',
            backgroundColor: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)',
            fontSize: '12px', color: 'var(--color-text)', lineHeight: 1.6,
          }}>
            <strong>Note: </strong>{warning}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button className="toolbar-btn secondary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
