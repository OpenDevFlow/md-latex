import type { Code } from 'mdast';
import type { NodeEmitter } from '../../types.js';
import { escapeLatex } from '../index.js';

/**
 * Maps common language identifiers to lstlisting language names.
 */
const LANGUAGE_MAP: Record<string, string> = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  py: 'Python',
  python: 'Python',
  rb: 'Ruby',
  ruby: 'Ruby',
  java: 'Java',
  c: 'C',
  cpp: 'C++',
  'c++': 'C++',
  cs: 'C',
  csharp: 'C',
  go: 'Go',
  rust: 'Rust',
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
  sql: 'SQL',
  html: 'HTML',
  css: 'CSS',
  json: 'JavaScript',
  xml: 'XML',
  yaml: 'bash',
  tex: 'TeX',
  latex: 'TeX',
};

export const codeEmitter: NodeEmitter = (node: Code, ctx) => {
  const renderer = ctx.options.codeRenderer;

  if (renderer === 'minted') {
    const lang = node.lang ?? 'text';
    return `\n\\begin{minted}{${lang}}\n${node.value}\n\\end{minted}\n`;
  }

  // Default: lstlisting
  const rawLang = node.lang ?? '';
  const lang = LANGUAGE_MAP[rawLang.toLowerCase()] ?? rawLang;
  const langOpt = lang ? `, language=${lang}` : '';
  const caption = node.meta ? `, caption={${escapeLatex(node.meta)}}` : '';

  return `\n\\begin{lstlisting}[frame=single${langOpt}${caption}]\n${node.value}\n\\end{lstlisting}\n`;
};
