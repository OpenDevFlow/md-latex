import type { Image } from 'mdast';
import type { NodeEmitter } from '../../types.js';

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
    `  \\includegraphics[width=0.80\\linewidth]{${url}}`,
  ];

  if (caption) lines.push(`  \\caption{${caption}}`);
  if (label)   lines.push(`  \\label{${label}}`);
  lines.push(`\\end{figure}\n`);

  return lines.join('\n');
};
