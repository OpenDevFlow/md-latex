import type { Image } from 'mdast';
import type { NodeEmitter } from '../types';

export const imageEmitter: NodeEmitter = (node: Image) => {
  const url = node.url;
  const alt = node.alt ?? '';
  const caption = node.title ?? alt;

  const lines = [
    `\n\\begin{figure}[h!]`,
    `  \\centering`,
    `  \\includegraphics[width=0.8\\linewidth]{${url}}`,
  ];

  if (caption) {
    lines.push(`  \\caption{${caption}}`);
  }
  if (alt) {
    lines.push(`  \\label{fig:${alt.toLowerCase().replace(/\s+/g, '-')}}`);
  }
  lines.push(`\\end{figure}\n`);

  return lines.join('\n');
};
