import type { Emphasis } from 'mdast';
import type { NodeEmitter } from '../../types.js';

export const emphasisEmitter: NodeEmitter = (node: Emphasis, ctx) => {
  return `\\textit{${ctx.emit(node.children)}}`;
};
