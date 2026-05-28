'use client';

import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { EditorView as EditorViewCore } from '@codemirror/view';
import { useEditorStore } from '@/store/editorStore';
import { useExport } from '@/hooks/useExport';
import { useState } from 'react';

const latexDarkTheme = EditorViewCore.theme(
  {
    '&': {
      backgroundColor: '#161b22',
      color: '#e6edf3',
      height: '100%',
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: '13px',
    },
    '.cm-content': { padding: '16px 0' },
    '.cm-gutters': {
      backgroundColor: '#161b22',
      color: '#484f58',
      border: 'none',
      borderRight: '1px solid #21262d',
    },
    '.cm-lineNumbers .cm-gutterElement': { minWidth: '40px', padding: '0 8px' },
    '.cm-scroller': { fontFamily: 'inherit' },
  },
  { dark: true },
);

const latexLightTheme = EditorViewCore.theme(
  {
    '&': {
      backgroundColor: '#f1f5f9',
      color: '#1e293b',
      height: '100%',
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: '13px',
    },
    '.cm-content': { padding: '16px 0' },
    '.cm-gutters': {
      backgroundColor: '#f1f5f9',
      color: '#94a3b8',
      border: 'none',
      borderRight: '1px solid #e2e8f0',
    },
    '.cm-lineNumbers .cm-gutterElement': { minWidth: '40px', padding: '0 8px' },
  },
  { dark: false },
);

interface LaTeXPaneProps {
  className?: string;
}

export function LaTeXPane({ className = '' }: LaTeXPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);
  const latex = useEditorStore((s) => s.latex);
  const theme = useEditorStore((s) => s.theme);
  const { copyLatex, downloadLatex } = useExport();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const chosenTheme = theme === 'dark' ? latexDarkTheme : latexLightTheme;

    const startState = EditorState.create({
      doc: latex,
      extensions: [
        basicSetup,
        chosenTheme,
        EditorViewCore.lineWrapping,
        EditorState.readOnly.of(true),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    editorRef.current = view;
    return () => {
      view.destroy();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // Sync latex content
  useEffect(() => {
    const view = editorRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== latex) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: latex },
      });
    }
  }, [latex]);

  async function handleCopy() {
    const ok = await copyLatex();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className={`latex-pane flex flex-col h-full ${className}`}>
      {/* Pane header */}
      <div className="pane-header flex items-center justify-between px-4 py-2 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="pane-label">LaTeX Output</span>
          <span className="badge">read-only</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="copy-latex-btn"
            onClick={handleCopy}
            className="icon-btn"
            title="Copy LaTeX to clipboard"
            aria-label="Copy LaTeX"
          >
            {copied ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            )}
            <span className="sr-only">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            id="download-tex-btn"
            onClick={() => downloadLatex()}
            className="icon-btn"
            title="Download .tex file"
            aria-label="Download .tex"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span className="sr-only">Download .tex</span>
          </button>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden"
        id="latex-pane"
        aria-label="LaTeX output"
        aria-readonly="true"
      />
    </div>
  );
}
