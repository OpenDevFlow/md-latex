import type { InlineCode } from 'mdast';
import type { NodeEmitter } from '../../types.js';

/** Escapes characters that are special inside \texttt{} */
function escapeTexttt(value: string): string {
  return value
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/&/g, '\\&')
    .replace(/_/g, '\\_')
    .replace(/\^/g, '\\^{}')
    .replace(/~/g, '\\textasciitilde{}');
}

export const inlineCodeEmitter: NodeEmitter = (node: InlineCode) => {
  return `\\texttt{${escapeTexttt(node.value)}}`;
};
