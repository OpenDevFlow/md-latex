'use client';

import { useEffect } from 'react';
import { Toolbar } from '@/components/editor/Toolbar';
import { SplitLayout } from '@/components/layout/SplitLayout';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranspiler } from '@/hooks/useTranspiler';
import { useEditorStore } from '@/store/editorStore';

/**
 * The top-level editor shell — mounts the transpiler hook and
 * composes the toolbar + layout.
 */
export default function EditorPage() {
  // Boot the transpiler pipeline (debounced, runs on content change)
  useTranspiler();

  const theme = useEditorStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
      <div className="editor-shell desktop-layout" data-theme={theme}>
        <Toolbar />
        <main className="editor-main flex flex-row" id="main-content" aria-label="Editor">
          {/* Left Sidebar */}
          <Sidebar />
          
          {/* Main working area */}
          <div className="flex-1 flex flex-col min-w-0">
            <SplitLayout />
          </div>
        </main>
      </div>
    </>
  );
}
