'use client';

import { useEffect, useRef, useCallback } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';

import { EditorView as EditorViewCore } from '@codemirror/view';
import { useEditorStore } from '@/store/editorStore';

const lightTheme = EditorViewCore.theme(
  {
    '&': {
      backgroundColor: '#f8fafc',
      color: '#1e293b',
      height: '100%',
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: '14px',
    },
    '.cm-content': { caretColor: '#7c3aed', padding: '16px 0' },
    '.cm-cursor': { borderLeftColor: '#7c3aed' },
    '.cm-activeLine': { backgroundColor: '#e2e8f015' },
    '.cm-gutters': {
      backgroundColor: '#f1f5f9',
      color: '#94a3b8',
      border: 'none',
      borderRight: '1px solid #e2e8f0',
    },
    '.cm-lineNumbers .cm-gutterElement': { minWidth: '40px', padding: '0 8px' },
    '.cm-scroller': { fontFamily: 'inherit' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: '#7c3aed30',
    },
  },
  { dark: false },
);

const darkTheme = EditorViewCore.theme(
  {
    '&': {
      backgroundColor: '#0d1117',
      color: '#e6edf3',
      height: '100%',
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: '14px',
    },
    '.cm-content': { caretColor: '#a78bfa', padding: '16px 0' },
    '.cm-cursor': { borderLeftColor: '#a78bfa' },
    '.cm-activeLine': { backgroundColor: '#ffffff08' },
    '.cm-gutters': {
      backgroundColor: '#0d1117',
      color: '#484f58',
      border: 'none',
      borderRight: '1px solid #21262d',
    },
    '.cm-lineNumbers .cm-gutterElement': { minWidth: '40px', padding: '0 8px' },
    '.cm-scroller': { fontFamily: 'inherit' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: '#7c3aed40',
    },
  },
  { dark: true },
);

interface MDEditorProps {
  className?: string;
}

export function MDEditor({ className = '' }: MDEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);

  const content = useEditorStore((s) => s.content);
  const setContent = useEditorStore((s) => s.setContent);
  const theme = useEditorStore((s) => s.theme);
  const setActiveLine = useEditorStore((s) => s.setActiveLine);

  const onUpdate = useCallback(
    (update: import('@codemirror/view').ViewUpdate) => {
      if (update.docChanged) {
        setContent(update.state.doc.toString());
      }
      if (update.selectionSet || update.docChanged) {
        const pos = update.state.selection.main.head;
        const line = update.state.doc.lineAt(pos).number;
        setActiveLine(line);
      }
    },
    [setContent, setActiveLine],
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const chosenTheme = theme === 'dark' ? darkTheme : lightTheme;

    const startState = EditorState.create({
      doc: content,
      extensions: [
        basicSetup,
        markdown(),
        chosenTheme,
        EditorViewCore.updateListener.of(onUpdate),
        EditorViewCore.lineWrapping,
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
  }, [theme]); // Recreate editor when theme changes

  // Sync external content changes (e.g. loading a document)
  useEffect(() => {
    const view = editorRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== content) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: content },
      });
    }
  }, [content]);

  return (
    <div
      ref={containerRef}
      className={`md-editor-container ${className}`}
      style={{ height: '100%', overflow: 'hidden' }}
      id="md-editor"
      aria-label="Markdown editor"
    />
  );
}
