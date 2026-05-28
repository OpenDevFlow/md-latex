import type { Strong } from 'mdast';
import type { NodeEmitter } from '../types';

export const strongEmitter: NodeEmitter = (node: Strong, ctx) => {
  return `\\textbf{${ctx.emit(node.children)}}`;
};
