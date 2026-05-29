'use client';

import { useEffect, useState, useCallback } from 'react';
import { Toolbar } from '@/components/editor/Toolbar';
import { SplitLayout } from '@/components/layout/SplitLayout';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranspiler } from '@/hooks/useTranspiler';
import { useEditorStore } from '@/store/editorStore';
import { useWorkspace } from '@/hooks/useWorkspace';
import { WorkspaceDiffModal } from '@/components/workspace/WorkspaceDiffModal';
import { PasswordModal } from '@/components/workspace/PasswordModal';

/**
 * The top-level editor shell — mounts the transpiler hook and
 * composes the toolbar + layout.
 */
export default function EditorPage() {
  useTranspiler();

  const theme = useEditorStore((s) => s.theme);
  const documents = useEditorStore((s) => s.documents);
  const { handleImportFile, checkUrlHash } = useWorkspace();

  const [isDragging, setIsDragging] = useState(false);
  const [dropFile, setDropFile] = useState<File | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [showPasswordEnter, setShowPasswordEnter] = useState(false);
  const [dropStatus, setDropStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [dropError, setDropError] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // ── URL hash detection on mount ──────────────────────
  useEffect(() => {
    checkUrlHash().then((result) => {
      if (result && !result.ok && result.needsPassword) {
        setShowPasswordEnter(true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Drag and drop ────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    const hasFile = Array.from(e.dataTransfer.items).some((i) => i.kind === 'file');
    if (!hasFile) return;
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = Array.from(e.dataTransfer.files).find(
      (f) => f.name.endsWith('.mdlatex') || f.type === 'application/json'
    );
    if (!file) return;
    setDropFile(file);
    setShowDiff(true);
  }, []);

  async function runDropImport(passphrase?: string) {
    if (!dropFile) return;
    const result = await handleImportFile(dropFile, passphrase);
    if (result.ok) {
      setDropFile(null);
      setDropStatus('success');
      setTimeout(() => setDropStatus('idle'), 3000);
    } else if (!result.ok && result.needsPassword) {
      setShowPasswordEnter(true);
    } else {
      setDropFile(null);
      setDropError(result.error);
      setDropStatus('error');
      setTimeout(() => setDropStatus('idle'), 5000);
    }
  }

  return (
    <>
      {/* Mobile: unsupported message */}
      <div
        className="mobile-layout items-center justify-center flex-col h-screen w-full bg-[var(--color-surface-1)] text-center"
        style={{ padding: '32px' }}
        data-theme={theme}
      >
        <div className="max-w-md flex flex-col items-center">
          <img
            src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/logo.png`}
            alt="md-latex logo"
            className="w-20 h-20 rounded-xl object-cover shadow-lg"
            style={{ marginBottom: '24px' }}
          />
          <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>Mobile Not Supported</h2>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>md-latex requires a desktop browser for the best 3-pane editing experience. Please open this app on a larger screen.</p>
        </div>
      </div>

      {/* Desktop: resizable split layout */}
      <div
        className="editor-shell desktop-layout"
        data-theme={theme}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Toolbar />
        <main className="editor-main flex flex-row" id="main-content" aria-label="Editor">
          {/* Left Sidebar */}
          <Sidebar />
          <SplitLayout />
        </main>

        {/* Drag overlay */}
        {isDragging && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px',
            border: '3px dashed var(--color-accent)', pointerEvents: 'none',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: 0 }}>Drop to import workspace</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: 0 }}>.mdlatex files supported</p>
          </div>
        )}

        {/* Drop diff modal */}
        {showDiff && dropFile && (
          <WorkspaceDiffModal
            incoming={{ version: 2, exportedAt: '', label: dropFile.name, description: '', tags: [], wordCount: 0, encrypted: false, documents: [], currentDocId: null, content: '', transpilerOptions: undefined as never, layout: '3-pane', theme: 'dark', showSidebar: true }}
            currentDocs={documents}
            onCancel={() => { setShowDiff(false); setDropFile(null); }}
            onConfirm={() => { setShowDiff(false); runDropImport(); }}
          />
        )}

        {/* Password modal for encrypted drop */}
        {showPasswordEnter && (
          <PasswordModal
            mode="enter"
            onConfirm={(p) => { setShowPasswordEnter(false); runDropImport(p); }}
            onCancel={() => { setShowPasswordEnter(false); setDropFile(null); }}
          />
        )}

        {/* Drop status toast */}
        {dropStatus !== 'idle' && (
          <div style={{
            position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 1001, borderRadius: '10px', padding: '12px 20px',
            backgroundColor: dropStatus === 'success' ? 'var(--color-accent)' : '#dc2626',
            color: '#fff', fontSize: '14px', fontWeight: 500,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', gap: '10px',
          }} role="status" aria-live="polite">
            {dropStatus === 'success' ? (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Workspace imported successfully</>
            ) : (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{dropError}</>
            )}
          </div>
        )}
      </div>
    </>
  );
}
