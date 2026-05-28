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

  return { copyLatex, downloadLatex, downloadMarkdown };
}
