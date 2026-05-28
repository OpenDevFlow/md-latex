'use client';

import { useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useExport } from '@/hooks/useExport';
import type { LayoutMode } from '@/store/editorStore';

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
  const { copyLatex, downloadLatex, downloadMarkdown, exportPDF } = useExport();

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [copied, setCopied] = useState(false);

  const currentDoc = documents.find((d) => d.id === currentDocId);

  async function handleCopyLatex() {
    const ok = await copyLatex();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

        <div className="logo ml-1" aria-label="md-latex">
          <span className="logo-md">md</span>
          <span className="logo-arrow">→</span>
          <span className="logo-tex">LaTeX</span>
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
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-surface border border-border overflow-hidden z-50">
              <div className="py-1" role="menu">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-text hover:bg-surface-3 transition-colors flex items-center gap-2"
                  role="menuitem"
                  onClick={() => { handleCopyLatex(); setShowExportMenu(false); }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  {copied ? 'Copied!' : 'Copy LaTeX source'}
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-text hover:bg-surface-3 transition-colors flex items-center gap-2"
                  role="menuitem"
                  onClick={() => { downloadLatex(); setShowExportMenu(false); }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download .tex file
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-text hover:bg-surface-3 transition-colors flex items-center gap-2 border-t border-border mt-1 pt-1"
                  role="menuitem"
                  onClick={() => { exportPDF(); setShowExportMenu(false); }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  Export to PDF
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
      </div>
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
