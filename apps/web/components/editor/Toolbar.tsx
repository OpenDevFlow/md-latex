'use client';

import { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useExport } from '@/hooks/useExport';
import { useWorkspace } from '@/hooks/useWorkspace';
import { SettingsModal } from '@/components/editor/SettingsModal';
import { PasswordModal } from '@/components/workspace/PasswordModal';
import { ShareUrlModal } from '@/components/workspace/ShareUrlModal';
import { WorkspaceDiffModal } from '@/components/workspace/WorkspaceDiffModal';
import { GithubSyncModal } from '@/components/workspace/GithubSyncModal';


export function Toolbar() {
  const theme = useEditorStore((s) => s.theme);
  const setTheme = useEditorStore((s) => s.setTheme);
  const layout = useEditorStore((s) => s.layout);
  const setLayout = useEditorStore((s) => s.setLayout);
  const documents = useEditorStore((s) => s.documents);
  const saveDocument = useEditorStore((s) => s.saveDocument);
  const newDocument = useEditorStore((s) => s.newDocument);
  const currentDocId = useEditorStore((s) => s.currentDocId);
  const toggleSidebar = useEditorStore((s) => s.toggleSidebar);
  const { copyLatex, downloadLatex, exportPDF } = useExport();
  const { importInputRef, exportWorkspace, exportWithPassword, exportAsZipFile, openImportPicker,
          parseArtifactFromFile, commitImport, shareViaUrl } = useWorkspace();

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [copied, setCopied] = useState(false);

  // Import flow
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState('');
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [showPasswordEnter, setShowPasswordEnter] = useState(false);
  const pendingImportFile = useRef<File | null>(null);
  const [pendingArtifact, setPendingArtifact] = useState<import('@/types/workspace').WorkspaceArtifact | null>(null);

  // Export with password
  const [showPasswordSet, setShowPasswordSet] = useState(false);
  const [passwordExportTarget, setPasswordExportTarget] = useState<'file' | 'url'>('file');

  // Share via URL
  const [shareResult, setShareResult] = useState<{ url: string; warning?: string; protected: boolean } | null>(null);

  const currentDoc = documents.find((d) => d.id === currentDocId);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDocTitle(currentDoc?.title ?? '');
    setCopied(false);
  }, [currentDocId, currentDoc?.title]);

  async function handleCopyLatex() {
    const ok = await copyLatex();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleImportChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    // Parse the file BEFORE showing the diff so we have real documents
    const result = await parseArtifactFromFile(file);
    if (!result.ok) {
      if (result.needsPassword) {
        pendingImportFile.current = file;
        setShowPasswordEnter(true);
      } else {
        setImportError(result.error);
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 5000);
      }
      return;
    }

    pendingImportFile.current = file;
    setPendingArtifact(result.artifact);
    setShowDiffModal(true);
  }

  async function runImport(passphrase?: string): Promise<boolean> {
    if (!pendingImportFile.current) return false;
    const result = await parseArtifactFromFile(pendingImportFile.current, passphrase);
    if (result.ok) {
      setPendingArtifact(result.artifact);
      pendingImportFile.current = null;
      setShowDiffModal(true);
      return true;
    } else {
      if (passphrase) {
        return false;
      }
      pendingImportFile.current = null;
      setImportError(result.error);
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 5000);
      return false;
    }
  }

  async function handlePasswordExport(passphrase: string) {
    if (passwordExportTarget === 'file') {
      setShowPasswordSet(false);
      await exportWithPassword(passphrase);
    } else {
      const result = await shareViaUrl(passphrase);
      if (result.ok && result.url) {
        setShowPasswordSet(false);
        setShareResult({ url: result.url, warning: result.warning, protected: true });
      } else {
        setImportError(result.error ?? 'Failed to share URL');
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 5000);
      }
    }
  }

  async function handleShareUrl() {
    setShowExportMenu(false);
    const result = await shareViaUrl();
    if (result.ok && result.url) {
      setShareResult({ url: result.url, warning: result.warning, protected: false });
    } else {
      setImportError(result.error ?? 'Failed to share URL');
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 5000);
    }
  }

  return (
    <header className="toolbar" role="banner">
      {/* Left: Sidebar Toggle + Logo + doc title */}
      <div className="toolbar-left">
        <button 
          className="toolbar-btn secondary !px-2" 
          onClick={toggleSidebar} 
          title="Toggle Sidebar"
          aria-label="Toggle Sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>

        <div className="logo ml-1 flex items-center gap-2" aria-label="md-latex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/logo.png`} alt="Logo" className="w-6 h-6 rounded-md object-cover shadow-sm" />
        </div>

        {/* Document title */}
        <div className="doc-title-area">
          <input
            id="doc-title-input"
            type="text"
            placeholder={currentDoc?.title ?? 'Untitled document'}
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            className="doc-title-input"
            aria-label="Document title"
          />
        </div>
      </div>

      {/* Center: Layout toggle */}
      <div className="toolbar-center" role="group" aria-label="Layout mode">
        <button
          id="layout-2pane-btn"
          onClick={() => setLayout('2-pane')}
          className={`layout-btn ${layout === '2-pane' ? 'active' : ''}`}
          title="2-pane layout (Editor + LaTeX)"
          aria-pressed={layout === '2-pane'}
        >
          <TwoPaneIcon />
        </button>
        <button
          id="layout-3pane-btn"
          onClick={() => setLayout('3-pane')}
          className={`layout-btn ${layout === '3-pane' ? 'active' : ''}`}
          title="3-pane layout (Editor + LaTeX + Preview)"
          aria-pressed={layout === '3-pane'}
        >
          <ThreePaneIcon />
        </button>
      </div>

      {/* Right: Actions */}
      <div className="toolbar-right">
        {/* Save button */}
        <button
          id="save-doc-btn"
          onClick={() => saveDocument(docTitle || undefined)}
          className="toolbar-btn secondary"
          title="Save document"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          <span>Save</span>
        </button>

        {/* Cloud Sync Button */}
        <button
          id="cloud-sync-btn"
          onClick={() => setShowGithubModal(true)}
          className="toolbar-btn secondary"
          title="Sync to GitHub"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span>Cloud Sync</span>
        </button>

        {/* Export menu */}
        <div className="relative">
          <button
            id="export-menu-btn"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="toolbar-btn primary"
            aria-haspopup="menu"
            aria-expanded={showExportMenu}
          >
            <span>Export</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          
          {showExportMenu && (
            <div 
              className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl border border-border z-50 overflow-hidden"
              style={{ backgroundColor: 'var(--toolbar-bg)', backdropFilter: 'blur(12px)' }}
            >
              <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }} role="menu">
                <button
                  className="w-full text-left rounded-lg text-sm text-text hover:bg-accent hover:text-white transition-all flex items-center group"
                  style={{ padding: '8px 12px', gap: '12px' }}
                  role="menuitem"
                  onClick={() => { handleCopyLatex(); setShowExportMenu(false); }}
                >
                  <div className="bg-surface-2 group-hover:bg-white/20 rounded-md transition-colors text-text group-hover:text-white" style={{ padding: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </div>
                  <span className="font-medium">{copied ? 'Copied!' : 'Copy LaTeX source'}</span>
                </button>
                
                <button
                  className="w-full text-left rounded-lg text-sm text-text hover:bg-accent hover:text-white transition-all flex items-center group"
                  style={{ padding: '8px 12px', gap: '12px' }}
                  role="menuitem"
                  onClick={() => { downloadLatex(); setShowExportMenu(false); }}
                >
                  <div className="bg-surface-2 group-hover:bg-white/20 rounded-md transition-colors text-text group-hover:text-white" style={{ padding: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </div>
                  <span className="font-medium">Download .tex file</span>
                </button>

                <div className="h-px bg-border my-1 mx-2" />

                <button
                  className="w-full text-left rounded-lg text-sm text-text hover:bg-accent hover:text-white transition-all flex items-center group"
                  style={{ padding: '8px 12px', gap: '12px' }}
                  role="menuitem"
                  onClick={() => { exportPDF(); setShowExportMenu(false); }}
                >
                  <div className="bg-surface-2 group-hover:bg-white/20 rounded-md transition-colors text-text group-hover:text-white" style={{ padding: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </div>
                  <span className="font-medium">Export to PDF</span>
                </button>

                <div className="h-px bg-border my-1 mx-2" />

                {/* Export Workspace (plain) */}
                <button className="w-full text-left rounded-lg text-sm text-text hover:bg-accent hover:text-white transition-all flex items-center group" style={{ padding: '8px 12px', gap: '12px' }} role="menuitem" onClick={() => { exportWorkspace(); setShowExportMenu(false); }}>
                  <div className="bg-surface-2 group-hover:bg-white/20 rounded-md transition-colors text-text group-hover:text-white" style={{ padding: '6px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div>
                  <div><span className="font-medium">Export Workspace</span><p style={{ fontSize: '11px', opacity: 0.6, marginTop: '1px' }}>Download .mdlatex bundle</p></div>
                </button>

                {/* Export with password */}
                <button className="w-full text-left rounded-lg text-sm text-text hover:bg-accent hover:text-white transition-all flex items-center group" style={{ padding: '8px 12px', gap: '12px' }} role="menuitem" onClick={() => { setPasswordExportTarget('file'); setShowPasswordSet(true); setShowExportMenu(false); }}>
                  <div className="bg-surface-2 group-hover:bg-white/20 rounded-md transition-colors text-text group-hover:text-white" style={{ padding: '6px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
                  <div><span className="font-medium">Export with Password</span><p style={{ fontSize: '11px', opacity: 0.6, marginTop: '1px' }}>AES-256 encrypted .mdlatex</p></div>
                </button>

                {/* Export as ZIP */}
                <button className="w-full text-left rounded-lg text-sm text-text hover:bg-accent hover:text-white transition-all flex items-center group" style={{ padding: '8px 12px', gap: '12px' }} role="menuitem" onClick={() => { exportAsZipFile(); setShowExportMenu(false); }}>
                  <div className="bg-surface-2 group-hover:bg-white/20 rounded-md transition-colors text-text group-hover:text-white" style={{ padding: '6px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/><path d="M9 6h2v2H9zm2 2h2v2h-2zm-2 2h2v2H9z"/></svg></div>
                  <div><span className="font-medium">Export as ZIP</span><p style={{ fontSize: '11px', opacity: 0.6, marginTop: '1px' }}>Individual .md and .bib files</p></div>
                </button>

                {/* Share via URL */}
                <button className="w-full text-left rounded-lg text-sm text-text hover:bg-accent hover:text-white transition-all flex items-center group" style={{ padding: '8px 12px', gap: '12px' }} role="menuitem" onClick={handleShareUrl}>
                  <div className="bg-surface-2 group-hover:bg-white/20 rounded-md transition-colors text-text group-hover:text-white" style={{ padding: '6px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></div>
                  <div><span className="font-medium">Share via URL</span><p style={{ fontSize: '11px', opacity: 0.6, marginTop: '1px' }}>Compressed link, no server</p></div>
                </button>

                {/* Share via URL + password */}
                <button className="w-full text-left rounded-lg text-sm text-text hover:bg-accent hover:text-white transition-all flex items-center group" style={{ padding: '8px 12px', gap: '12px' }} role="menuitem" onClick={() => { setPasswordExportTarget('url'); setShowPasswordSet(true); setShowExportMenu(false); }}>
                  <div className="bg-surface-2 group-hover:bg-white/20 rounded-md transition-colors text-text group-hover:text-white" style={{ padding: '6px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/><rect x="10" y="9" width="4" height="6" rx="1"/></svg></div>
                  <div><span className="font-medium">Share via URL + Password</span><p style={{ fontSize: '11px', opacity: 0.6, marginTop: '1px' }}>Encrypted shareable link</p></div>
                </button>

                {/* Workspace import */}
                <button
                  className="w-full text-left rounded-lg text-sm text-text hover:bg-accent hover:text-white transition-all flex items-center group"
                  style={{ padding: '8px 12px', gap: '12px' }}
                  role="menuitem"
                  onClick={() => { openImportPicker(); setShowExportMenu(false); }}
                >
                  <div className="bg-surface-2 group-hover:bg-white/20 rounded-md transition-colors text-text group-hover:text-white" style={{ padding: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </div>
                  <div>
                    <span className="font-medium">Import Workspace</span>
                    <p style={{ fontSize: '11px', opacity: 0.6, marginTop: '1px' }}>Load from .mdlatex file</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* New document */}
        <button
          id="new-doc-btn"
          onClick={() => { newDocument(); setDocTitle(''); }}
          className="icon-btn"
          title="New document"
          aria-label="New document"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
        </button>

        {/* Theme toggle */}
        <button
          id="theme-toggle-btn"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="icon-btn"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>
        {/* Settings toggle */}
        <button
          onClick={() => setShowSettings(true)}
          className="icon-btn"
          title="Settings"
          aria-label="Settings"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {/* Hidden file input for workspace import */}
      <input
        ref={importInputRef}
        type="file"
        accept=".mdlatex,application/json"
        style={{ display: 'none' }}
        onChange={handleImportChange}
        aria-hidden="true"
      />

      {/* Workspace diff / cherry-pick modal */}
      {showDiffModal && pendingArtifact && (
        <WorkspaceDiffModal
          incoming={pendingArtifact}
          currentDocs={documents}
          onCancel={() => {
            setShowDiffModal(false);
            pendingImportFile.current = null;
            setPendingArtifact(null);
          }}
          onConfirm={(selectedIds) => {
            setShowDiffModal(false);
            commitImport(pendingArtifact, selectedIds);
            pendingImportFile.current = null;
            setPendingArtifact(null);
            setImportStatus('success');
            setTimeout(() => setImportStatus('idle'), 3000);
          }}
        />
      )}

      {/* Password modal — enter (import encrypted) */}
      {showPasswordEnter && (
        <PasswordModal
          mode="enter"
          onConfirm={async (p) => { 
            const success = await runImport(p); 
            if (success) setShowPasswordEnter(false);
            return success;
          }}
          onCancel={() => { setShowPasswordEnter(false); pendingImportFile.current = null; }}
          onMaxRetries={() => {
            setShowPasswordEnter(false);
            pendingImportFile.current = null;
            setImportError('Maximum password attempts exceeded.');
            setImportStatus('error');
            setTimeout(() => setImportStatus('idle'), 5000);
          }}
        />
      )}

      {/* Password modal — set (export encrypted / share with password) */}
      {showPasswordSet && (
        <PasswordModal
          mode="set"
          onConfirm={handlePasswordExport}
          onCancel={() => setShowPasswordSet(false)}
        />
      )}

      {/* Share URL result modal */}
      {shareResult && (
        <ShareUrlModal
          url={shareResult.url}
          warning={shareResult.warning}
          isPasswordProtected={shareResult.protected}
          onClose={() => setShareResult(null)}
        />
      )}

      {/* Status toast */}
      {importStatus !== 'idle' && (
        <div
          style={{
            position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 1001, borderRadius: '10px', padding: '12px 20px',
            backgroundColor: importStatus === 'success' ? 'var(--color-accent)' : '#dc2626',
            color: '#fff', fontSize: '14px', fontWeight: 500,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}
          role="status"
          aria-live="polite"
        >
          {importStatus === 'success' ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Workspace imported successfully
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {importError}
            </>
          )}
        </div>
      )}
      {showGithubModal && (
        <GithubSyncModal onClose={() => setShowGithubModal(false)} />
      )}
    </header>
  );
}

function TwoPaneIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="7" height="12" rx="1"/>
      <rect x="10" y="1" width="7" height="12" rx="1"/>
    </svg>
  );
}

function ThreePaneIcon() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="5" height="12" rx="1"/>
      <rect x="7.5" y="1" width="5" height="12" rx="1"/>
      <rect x="14" y="1" width="5" height="12" rx="1"/>
    </svg>
  );
}
