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
      // Create a hidden form to submit directly to texlive.net
      // This bypasses CORS and works natively in static Next.js exports
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://texlive.net/cgi-bin/latexcgi';
      form.target = '_blank'; // Open download in new tab
      form.style.display = 'none';

      const fields = {
        'filecontents[]': latex,
        'filename[]': filename.replace('.pdf', '.tex'),
        'engine': 'xelatex',
        'return': 'pdf',
      };

      for (const [key, value] of Object.entries(fields)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
      
      // Cleanup
      setTimeout(() => document.body.removeChild(form), 100);
      
      return true;
    } catch (e: any) {
      console.error(e);
      throw new Error('Failed to export PDF');
    }
  }

  return { copyLatex, downloadLatex, downloadMarkdown, exportPDF };
}
