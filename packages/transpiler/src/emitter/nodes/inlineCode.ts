import type { InlineCode } from 'mdast';
import type { NodeEmitter } from '../../types.js';
import { escapeLatex } from '../index.js';

export const inlineCodeEmitter: NodeEmitter = (node: InlineCode) => {
  return `\\texttt{${escapeLatex(node.value)}}`;
};
