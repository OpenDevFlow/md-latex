import type { Blockquote } from 'mdast';
import type { NodeEmitter } from '../types';

export const blockquoteEmitter: NodeEmitter = (node: Blockquote, ctx) => {
  const content = ctx.emit(node.children).trim();
  return `\n\\begin{quote}\n${content}\n\\end{quote}\n`;
};
