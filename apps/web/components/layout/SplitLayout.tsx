'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { MDEditor } from '@/components/editor/MDEditor';
import { LaTeXPane } from '@/components/editor/LaTeXPane';
import { PreviewPane } from '@/components/editor/PreviewPane';

const MIN_PANE_WIDTH = 200; // px

interface PaneWidths {
  md: number;
  latex: number;
  preview: number;
}

export function SplitLayout() {
  const layout = useEditorStore((s) => s.layout);
  const containerRef = useRef<HTMLDivElement>(null);

  const [paneWidths, setPaneWidths] = useState<PaneWidths>({
    md: 33.33,
    latex: 33.33,
    preview: 33.33,
  });

  const dragging = useRef<{ divider: 'md-latex' | 'latex-preview'; startX: number; startWidths: PaneWidths } | null>(null);

  const onMouseDown = useCallback(
    (divider: 'md-latex' | 'latex-preview') =>
      (e: React.MouseEvent) => {
        e.preventDefault();
        dragging.current = {
          divider,
          startX: e.clientX,
          startWidths: { ...paneWidths },
        };
      },
    [paneWidths],
  );

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging.current || !containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const dx = e.clientX - dragging.current.startX;
      const dxPct = (dx / containerWidth) * 100;

      const { divider, startWidths } = dragging.current;

      if (divider === 'md-latex') {
        const minPct = (MIN_PANE_WIDTH / containerWidth) * 100;
        let newMd = startWidths.md + dxPct;
        let newLatex = startWidths.latex - dxPct;

        if (newMd < minPct) {
          const deficit = minPct - newMd;
          newMd = minPct;
          newLatex -= deficit;
        } else if (newLatex < minPct) {
          const deficit = minPct - newLatex;
          newLatex = minPct;
          newMd -= deficit;
        }

        setPaneWidths((w) => ({
          ...w,
          md: newMd,
          latex: newLatex,
        }));
      } else {
        const minPct = (MIN_PANE_WIDTH / containerWidth) * 100;
        let newLatex = startWidths.latex + dxPct;
        let newPreview = startWidths.preview - dxPct;

        if (newLatex < minPct) {
          const deficit = minPct - newLatex;
          newLatex = minPct;
          newPreview -= deficit;
        } else if (newPreview < minPct) {
          const deficit = minPct - newPreview;
          newPreview = minPct;
          newLatex -= deficit;
        }

        setPaneWidths((w) => ({
          ...w,
          latex: newLatex,
          preview: newPreview,
        }));
      }
    }

    function onMouseUp() {
      dragging.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  if (layout === '2-pane') {
    return (
      <div ref={containerRef} className="split-layout-2" id="split-layout">
        <div className="pane pane-md" style={{ flex: 1 }}>
          <div className="pane-header flex items-center border-b border-border" style={{ padding: '8px 16px' }}>
            <span className="pane-label">Markdown</span>
          </div>
          <div className="pane-body">
            <MDEditor />
          </div>
        </div>
        <div className="resize-handle" onMouseDown={onMouseDown('md-latex')} aria-hidden="true" />
        <div className="pane pane-latex" style={{ flex: 1 }}>
          <LaTeXPane />
        </div>
      </div>
    );
  }

  // 3-pane layout
  const totalPct = paneWidths.md + paneWidths.latex + paneWidths.preview;
  const mdPct = (paneWidths.md / totalPct) * 100;
  const latexPct = (paneWidths.latex / totalPct) * 100;
  const previewPct = (paneWidths.preview / totalPct) * 100;

  return (
    <div ref={containerRef} className="split-layout-3" id="split-layout">
      <div className="pane pane-md" style={{ width: `${mdPct}%` }}>
        <div className="pane-header flex items-center border-b border-border" style={{ padding: '8px 16px' }}>
          <span className="pane-label">Markdown</span>
        </div>
        <div className="pane-body">
          <MDEditor />
        </div>
      </div>
      <div
        className="resize-handle"
        onMouseDown={onMouseDown('md-latex')}
        aria-hidden="true"
        title="Drag to resize"
      />
      <div className="pane pane-latex" style={{ width: `${latexPct}%` }}>
        <LaTeXPane />
      </div>
      <div
        className="resize-handle"
        onMouseDown={onMouseDown('latex-preview')}
        aria-hidden="true"
        title="Drag to resize"
      />
      <div className="pane pane-preview" style={{ width: `${previewPct}%` }}>
        <PreviewPane />
      </div>
    </div>
  );
}
