'use client';

import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import 'katex/dist/katex.min.css';

interface PreviewPaneProps {
  className?: string;
}

export function PreviewPane({ className = '' }: PreviewPaneProps) {
  const preview = useEditorStore((s) => s.preview);
  const theme = useEditorStore((s) => s.theme);
  const activeLine = useEditorStore((s) => s.activeLine);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastHighlightedLine = useRef<number>(-1);

  useEffect(() => {
    if (!activeLine || !containerRef.current) return;
    
    const elements = containerRef.current.querySelectorAll('[data-source-line]');
    let targetEl: Element | null = null;
    let closestLine = -1;

    elements.forEach((el) => {
      const lineStr = el.getAttribute('data-source-line');
      if (lineStr) {
        const line = parseInt(lineStr, 10);
        if (line <= activeLine && line > closestLine) {
          closestLine = line;
          targetEl = el;
        }
      }
    });

    if (targetEl) {
      // Avoid redundant highlights on every keystroke
      if (lastHighlightedLine.current !== closestLine) {
        lastHighlightedLine.current = closestLine;

        // Avoid scrolling if it's already mostly in view to prevent jumpiness
        const htmlEl = targetEl as HTMLElement;
        const rect = htmlEl.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const isInView = rect.top >= containerRect.top && rect.bottom <= containerRect.bottom;
        
        if (!isInView) {
          htmlEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Briefly highlight
        htmlEl.classList.add('highlight-flash');
        setTimeout(() => htmlEl?.classList.remove('highlight-flash'), 1000);
      }
    }
  }, [activeLine, preview]);

  return (
    <div className={`preview-pane flex flex-col h-full ${className}`}>
      {/* Pane header */}
      <div className="pane-header flex items-center border-b border-border flex-shrink-0" style={{ padding: '8px 16px' }}>
        <span className="pane-label">Preview</span>
      </div>

      {/* Rendered HTML */}
      <div
        id="preview-pane"
        ref={containerRef}
        aria-label="Markdown preview"
        className={`preview-content flex-1 overflow-y-auto px-8 py-6 prose-container ${theme}`}
        dangerouslySetInnerHTML={{ __html: preview || '<p class="placeholder-text">Start typing to see your preview…</p>' }}
      />
    </div>
  );
}
