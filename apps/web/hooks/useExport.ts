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
    let timeoutId: NodeJS.Timeout | undefined;
    let cancelPromise: () => void = () => {};

    try {
      // Create a modal overlay
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
      overlay.style.backdropFilter = 'blur(4px)';
      overlay.style.zIndex = '9999';
      overlay.style.display = 'flex';
      overlay.style.flexDirection = 'column';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';

      const header = document.createElement('div');
      header.style.width = '90%';
      header.style.maxWidth = '1200px';
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.padding = '12px 0';
      header.style.color = '#fff';

      const title = document.createElement('h3');
      title.innerText = 'PDF Export ';
      title.style.margin = '0';
      title.style.fontSize = '16px';
      title.style.fontWeight = '500';

      const closeBtn = document.createElement('button');
      closeBtn.innerText = 'Close';
      closeBtn.style.padding = '6px 16px';
      closeBtn.style.background = 'var(--color-accent)';
      closeBtn.style.color = '#fff';
      closeBtn.style.border = 'none';
      closeBtn.style.borderRadius = '4px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.fontWeight = '600';
      closeBtn.onclick = () => {
        if (timeoutId) clearTimeout(timeoutId);
        document.body.removeChild(overlay);
        cancelPromise();
      };

      header.appendChild(title);
      header.appendChild(closeBtn);

      const iframeName = 'pdf-export-iframe-' + Date.now();
      const iframe = document.createElement('iframe');
      iframe.name = iframeName;
      
      // Wrapper for iframe and loader
      const iframeWrapper = document.createElement('div');
      iframeWrapper.style.position = 'relative';
      iframeWrapper.style.width = '90%';
      iframeWrapper.style.maxWidth = '1200px';
      iframeWrapper.style.height = '85vh';
      iframeWrapper.style.backgroundColor = 'var(--color-surface)';
      iframeWrapper.style.borderRadius = '8px';
      iframeWrapper.style.border = '1px solid var(--color-border)';
      iframeWrapper.style.overflow = 'hidden';

      // Loader UI
      const loaderContainer = document.createElement('div');
      loaderContainer.style.position = 'absolute';
      loaderContainer.style.top = '50%';
      loaderContainer.style.left = '50%';
      loaderContainer.style.transform = 'translate(-50%, -50%)';
      loaderContainer.style.display = 'flex';
      loaderContainer.style.flexDirection = 'column';
      loaderContainer.style.alignItems = 'center';
      loaderContainer.style.gap = '16px';
      loaderContainer.style.color = 'var(--color-text)';
      loaderContainer.style.zIndex = '1';

      const spinner = document.createElement('div');
      spinner.style.width = '40px';
      spinner.style.height = '40px';
      spinner.style.border = '3px solid var(--color-surface-3)';
      spinner.style.borderTopColor = 'var(--color-accent)';
      spinner.style.borderRadius = '50%';
      spinner.style.animation = 'spin 1s linear infinite';
      
      const loaderText = document.createElement('span');
      loaderText.innerText = 'Compiling LaTeX...';
      
      loaderContainer.appendChild(spinner);
      loaderContainer.appendChild(loaderText);

      if (!document.getElementById('pdf-loader-style')) {
        const style = document.createElement('style');
        style.id = 'pdf-loader-style';
        style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
      }

      // Iframe styling
      iframe.style.position = 'relative';
      iframe.style.zIndex = '2';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.backgroundColor = 'transparent';
      iframe.style.opacity = '0';
      iframe.style.transition = 'opacity 0.3s ease';
      
      const resultPromise = new Promise<boolean>((resolve, reject) => {
        cancelPromise = () => reject(new Error('USER_CANCELLED'));

        iframe.onload = () => {
          try {
            const href = iframe.contentWindow?.location?.href;
            if (!href || href === 'about:blank' || href === '') {
              return; // Ignore initial blank load
            }
          } catch (_e) {
            // SecurityError means it successfully navigated to the cross-origin texlive.net!
          }
          if (timeoutId) clearTimeout(timeoutId);
          loaderContainer.style.display = 'none';
          iframe.style.opacity = '1';
          resolve(true);
        };

        iframe.onerror = () => {
          if (timeoutId) clearTimeout(timeoutId);
          loaderContainer.style.display = 'none';
          iframe.style.opacity = '1';
          reject(new Error('Failed to load PDF'));
        };

        timeoutId = setTimeout(() => {
          loaderContainer.style.display = 'none';
          iframe.style.opacity = '1';
          reject(new Error('PDF generation timed out'));
        }, 30000);
      });

      iframeWrapper.appendChild(loaderContainer);
      iframeWrapper.appendChild(iframe);

      overlay.appendChild(header);
      overlay.appendChild(iframeWrapper);
      document.body.appendChild(overlay);

      // Create a hidden form to submit directly to texlive.net targeting the iframe
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://texlive.net/cgi-bin/latexcgi';
      form.enctype = 'multipart/form-data';
      form.target = iframeName;
      form.style.display = 'none';

      const fields = {
        'filecontents[]': latex,
        'filename[]': filename.replace('.pdf', '.tex'),
        'engine': 'xelatex',
        'return': 'pdf',
      };

      for (const [key, value] of Object.entries(fields)) {
        const input = document.createElement('textarea');
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
      
      // Cleanup the form element after submit (leave the overlay/iframe open)
      setTimeout(() => document.body.removeChild(form), 1000);
      
      return await resultPromise;
    } catch (e) {
      if (e instanceof Error && e.message === 'USER_CANCELLED') {
        return false;
      }
      console.error(e);
      throw new Error('Failed to export PDF');
    }
  }

  return { copyLatex, downloadLatex, downloadMarkdown, exportPDF };
}
