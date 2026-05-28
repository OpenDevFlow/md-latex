'use client';

import { useEffect } from 'react';
import { Toolbar } from '@/components/editor/Toolbar';
import { SplitLayout } from '@/components/layout/SplitLayout';
import { PaneSwitcher } from '@/components/layout/PaneSwitcher';
import { Sidebar } from '@/components/layout/Sidebar';
import { MDEditor } from '@/components/editor/MDEditor';
import { LaTeXPane } from '@/components/editor/LaTeXPane';
import { PreviewPane } from '@/components/editor/PreviewPane';
import { useTranspiler } from '@/hooks/useTranspiler';
import { useEditorStore } from '@/store/editorStore';
import type { ActivePane } from '@/store/editorStore';

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
    <div className="editor-shell" data-theme={theme}>
      <Toolbar />
      <main className="editor-main flex flex-row" id="main-content" aria-label="Editor">
        {/* Left Sidebar */}
        <Sidebar />
        
        {/* Main working area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Desktop: resizable split layout */}
          <div className="desktop-layout">
            <SplitLayout />
          </div>
          {/* Mobile: single active pane */}
          <div className="mobile-layout">
            <MobilePaneView />
          </div>
        </div>
      </main>
      {/* Mobile bottom tab bar */}
      <div className="mobile-only">
        <PaneSwitcher />
      </div>
    </div>
  );
}

function MobilePaneView() {
  const activePane = useEditorStore((s) => s.activePane) as ActivePane;

  return (
    <div className="mobile-pane-view">
      {activePane === 'md' && (
        <div className="pane pane-md mobile-pane">
          <div className="pane-header flex items-center border-b border-border" style={{ padding: '8px 16px' }}>
            <span className="pane-label">Markdown</span>
          </div>
          <div className="pane-body">
            <MDEditor />
          </div>
        </div>
      )}
      {activePane === 'latex' && <LaTeXPane className="mobile-pane" />}
      {activePane === 'preview' && <PreviewPane className="mobile-pane" />}
    </div>
  );
}
