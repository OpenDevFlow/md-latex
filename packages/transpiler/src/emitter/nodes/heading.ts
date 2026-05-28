import type { Heading } from 'mdast';
import type { NodeEmitter } from '../../types.js';

const DEPTH_MAP: Record<number, string> = {
  1: '\\section',
  2: '\\subsection',
  3: '\\subsubsection',
  4: '\\paragraph',
  5: '\\subparagraph',
  6: '\\subparagraph',
};

export const headingEmitter: NodeEmitter = (node: Heading, ctx) => {
  const depth = Math.min(Math.max(node.depth, 1), 6);
  const command = DEPTH_MAP[depth] ?? '\\paragraph';
  const content = ctx.emit(node.children);
  return `\n${command}{${content}}\n`;
};
