'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '@/store/editorStore';
import type { TranspilerOptions } from '@/store/editorStore';

// Lazy-load transpiler (it has ESM deps that shouldn't block initial render)
let transpilePromise: Promise<typeof import('@md-latex/transpiler')> | null = null;

function getTranspiler() {
  if (!transpilePromise) {
    transpilePromise = import('@md-latex/transpiler');
  }
  return transpilePromise;
}

// Preview renderer using remark → rehype → KaTeX
async function renderPreview(markdown: string): Promise<string> {
  const [
    { unified },
    { default: remarkParse },
    { default: remarkRehype },
    { default: remarkGfm },
    { default: remarkMath },
    { default: rehypeKatex },
    { default: rehypeStringify },
  ] = await Promise.all([
    import('unified'),
    import('remark-parse'),
    import('remark-rehype'),
    import('remark-gfm'),
    import('remark-math'),
    import('rehype-katex'),
    import('rehype-stringify'),
  ]);

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(markdown);

  return String(file);
}

export function useTranspiler() {
  const content = useEditorStore((s) => s.content);
  const transpilerOptions = useEditorStore((s) => s.transpilerOptions);
  const setLatex = useEditorStore((s) => s.setLatex);
  const setPreview = useEditorStore((s) => s.setPreview);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);

  const runTranspiler = useCallback(
    async (md: string, opts: TranspilerOptions) => {
      abortRef.current = false;
      try {
        const { transpile } = await getTranspiler();
        const result = await transpile(md, {
          documentClass: opts.documentClass,
          packages: opts.packages,
          template: opts.template,
          wrapDocument: opts.wrapDocument,
          codeRenderer: opts.codeRenderer,
        });

        if (abortRef.current) return;
        setLatex(result.latex);

        // Render preview in parallel
        const html = await renderPreview(md);
        if (abortRef.current) return;
        setPreview(html);
      } catch (err) {
        console.error('[useTranspiler] transpile error:', err);
      }
    },
    [setLatex, setPreview],
  );

  useEffect(() => {
    // Cancel any in-flight render
    abortRef.current = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      runTranspiler(content, transpilerOptions);
    }, 150);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current = true;
    };
  }, [content, transpilerOptions, runTranspiler]);
}
