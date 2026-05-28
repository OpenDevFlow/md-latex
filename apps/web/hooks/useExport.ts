'use client';

import { useEditorStore } from '@/store/editorStore';

export function useExport() {
  const latex = useEditorStore((s) => s.latex);
  const content = useEditorStore((s) => s.content);

  function downloadBlob(data: string, filename: string, mime: string) {
    const blob = new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyLatex(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(latex);
      return true;
    } catch {
      return false;
    }
  }

  function downloadLatex(filename = 'document.tex') {
    downloadBlob(latex, filename, 'text/plain');
  }

  function downloadMarkdown(filename = 'document.md') {
    downloadBlob(content, filename, 'text/markdown');
  }

  async function exportPDF(filename = 'document.pdf'): Promise<boolean> {
    try {
      const res = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex }),
      });
      if (!res.ok) throw new Error('PDF compilation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (e) {
      console.error(e);
      alert('Failed to export PDF. Ensure your LaTeX code has no errors.');
      return false;
    }
  }

  return { copyLatex, downloadLatex, downloadMarkdown, exportPDF };
}
