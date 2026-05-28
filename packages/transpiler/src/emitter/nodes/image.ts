import type { Image } from 'mdast';
import type { NodeEmitter } from '../../types.js';
import { escapeLatex } from '../index.js';

export const imageEmitter: NodeEmitter = (node: Image) => {
  const url = node.url;
  const alt = node.alt ?? '';
  const caption = node.title ?? alt;
  const label = alt
    ? `fig:${alt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
    : null;

  const lines = [
    `\n\\begin{figure}[H]`,
    `  \\centering`,
    `  \\includegraphics[width=0.80\\linewidth]{${escapeLatex(url)}}`,
  ];

  if (caption) lines.push(`  \\caption{${escapeLatex(caption)}}`);
  if (label)   lines.push(`  \\label{${escapeLatex(label)}}`);
  lines.push(`\\end{figure}\n`);

  return lines.join('\n');
};
