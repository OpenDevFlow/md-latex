'use client';

import { useEditorStore } from '@/store/editorStore';
import 'katex/dist/katex.min.css';

interface PreviewPaneProps {
  className?: string;
}

export function PreviewPane({ className = '' }: PreviewPaneProps) {
  const preview = useEditorStore((s) => s.preview);
  const theme = useEditorStore((s) => s.theme);

  return (
    <div className={`preview-pane flex flex-col h-full ${className}`}>
      {/* Pane header */}
      <div className="pane-header flex items-center border-b border-border flex-shrink-0" style={{ padding: '8px 16px' }}>
        <span className="pane-label">Preview</span>
      </div>

      {/* Rendered HTML */}
      <div
        id="preview-pane"
        aria-label="Markdown preview"
        className={`preview-content flex-1 overflow-y-auto px-8 py-6 prose-container ${theme}`}
        dangerouslySetInnerHTML={{ __html: preview || '<p class="placeholder-text">Start typing to see your preview…</p>' }}
      />
    </div>
  );
}
