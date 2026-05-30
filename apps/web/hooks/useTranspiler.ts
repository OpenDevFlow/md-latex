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

// Custom rehype plugin to inject data-source-line attributes
function rehypeSourceLinePlugin() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tree: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const visit = (node: any) => {
      if (node.type === 'element' && node.position?.start?.line) {
        node.properties = node.properties || {};
        node.properties['data-source-line'] = node.position.start.line;
      }
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(visit);
      }
    };
    visit(tree);
  };
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface Frontmatter {
  title?: string;
  author?: string | string[];
  date?: string | Date;
  abstract?: string;
}

// Preview renderer using remark → rehype → KaTeX
async function renderPreview(markdown: string, frontmatter: Frontmatter): Promise<string> {
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
    .use(rehypeSourceLinePlugin)
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(markdown);

  let html = String(file);

  // Prepend a title block that looks like the LaTeX \maketitle
  if (frontmatter.title || frontmatter.author || frontmatter.date || frontmatter.abstract) {
    const escapedTitle = frontmatter.title ? escapeHtml(frontmatter.title) : '';
    const titleHtml = escapedTitle ? `<h1>${escapedTitle}</h1>` : '';
    
    let escapedAuthor = '';
    if (frontmatter.author) {
      if (Array.isArray(frontmatter.author)) {
        escapedAuthor = frontmatter.author.map((a: unknown) => escapeHtml(String(a))).join(', ');
      } else {
        escapedAuthor = escapeHtml(String(frontmatter.author));
      }
    }
    const authorHtml = escapedAuthor ? `<p class="author">${escapedAuthor}</p>` : '';
    
    let dateStr = '';
    if (frontmatter.date) {
      if (frontmatter.date instanceof Date) {
        dateStr = frontmatter.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      } else {
        // js-yaml may parse dates like 20/10/2022 as Date objects.
        // Always coerce to string before calling string methods.
        const rawDate = String(frontmatter.date);
        dateStr = rawDate.replace('\\today', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
      }
    }
    const escapedDate = dateStr ? escapeHtml(dateStr) : '';
    const dateHtml = escapedDate ? `<p class="date">${escapedDate}</p>` : '';
    
    const escapedAbstract = frontmatter.abstract ? escapeHtml(frontmatter.abstract) : '';
    const abstractHtml = escapedAbstract ? `<div class="abstract"><strong>Abstract</strong><br>${escapedAbstract}</div>` : '';

    html = `<div class="maketitle">${titleHtml}${authorHtml}${dateHtml}</div>${abstractHtml}\n${html}`;
  }

  return html;
}

export function useTranspiler() {
  const content = useEditorStore((s) => s.content);
  const transpilerOptions = useEditorStore((s) => s.transpilerOptions);
  const setLatex = useEditorStore((s) => s.setLatex);
  const setPreview = useEditorStore((s) => s.setPreview);
  const setLatexSourceMap = useEditorStore((s) => s.setLatexSourceMap);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const runTranspiler = useCallback(
    async (md: string, opts: TranspilerOptions) => {
      requestIdRef.current += 1;
      const currentId = requestIdRef.current;
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

        if (requestIdRef.current !== currentId) return;
        setLatex(result.latex);
        if (result.sourceMap) {
          setLatexSourceMap(result.sourceMap);
        } else {
          setLatexSourceMap([]);
        }

        // Render preview in parallel
        const html = await renderPreview(md, result.frontmatter);
        if (requestIdRef.current !== currentId) return;
        setPreview(html);
      } catch (err) {
        console.error('[useTranspiler] transpile error:', err);
      }
    },
    [setLatex, setPreview, setLatexSourceMap],
  );

  useEffect(() => {
    // Cancel any in-flight render by incrementing requestIdRef
    requestIdRef.current += 1;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      runTranspiler(content, transpilerOptions);
    }, 150);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      requestIdRef.current += 1;
    };
  }, [content, transpilerOptions, runTranspiler]);
}
