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
async function renderPreview(markdown: string, frontmatter: any): Promise<string> {
  const [
    { unified },
    { default: remarkParse },
    { default: remarkFrontmatter },
    { default: remarkRehype },
    { default: remarkGfm },
    { default: remarkMath },
    { default: rehypeKatex },
    { default: rehypeStringify },
  ] = await Promise.all([
    import('unified'),
    import('remark-parse'),
    import('remark-frontmatter'),
    import('remark-rehype'),
    import('remark-gfm'),
    import('remark-math'),
    import('rehype-katex'),
    import('rehype-stringify'),
  ]);

  const file = await unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(markdown);

  let html = String(file);

  // Prepend a title block that looks like the LaTeX \maketitle
  if (frontmatter.title || frontmatter.author || frontmatter.date) {
    const titleHtml = frontmatter.title ? `<h1>${frontmatter.title}</h1>` : '';
    const authorHtml = frontmatter.author ? `<p class="author">${Array.isArray(frontmatter.author) ? frontmatter.author.join(', ') : frontmatter.author}</p>` : '';
    
    let dateStr = '';
    if (frontmatter.date) {
      if (frontmatter.date instanceof Date) {
        dateStr = frontmatter.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      } else {
        dateStr = frontmatter.date.replace('\\today', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
      }
    }
    const dateHtml = dateStr ? `<p class="date">${dateStr}</p>` : '';
    const abstractHtml = frontmatter.abstract ? `<div class="abstract"><strong>Abstract</strong><br>${frontmatter.abstract}</div>` : '';

    html = `<div class="maketitle">${titleHtml}${authorHtml}${dateHtml}</div>${abstractHtml}\n${html}`;
  }

  return html;
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
        const store = useEditorStore.getState();
        const bibDoc = opts.bibliographyId 
          ? store.documents.find(d => d.id === opts.bibliographyId)
          : null;

        const result = await transpile(md, {
          documentClass: opts.documentClass,
          packages: opts.packages,
          template: opts.template,
          wrapDocument: opts.wrapDocument,
          codeRenderer: opts.codeRenderer,
          citationStyle: opts.citationStyle,
          bibliographyContent: bibDoc ? bibDoc.content : null,
        });

        if (abortRef.current) return;
        setLatex(result.latex);

        // Render preview in parallel
        const html = await renderPreview(md, result.frontmatter);
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
