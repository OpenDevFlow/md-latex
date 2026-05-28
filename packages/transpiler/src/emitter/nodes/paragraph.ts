import type { Paragraph } from 'mdast';
import type { NodeEmitter } from '../../types.js';

export const paragraphEmitter: NodeEmitter = (node: Paragraph, ctx) => {
  const content = ctx.emit(node.children);
  return `\n${content}\n`;
};
