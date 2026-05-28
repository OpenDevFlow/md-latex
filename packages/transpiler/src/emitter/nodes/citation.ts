import type { NodeEmitter, CitationNode } from '../../types.js';

/**
 * Citation node emitter: [@key] → \cite{key}
 * Multiple keys: [@a; @b] → \cite{a,b}
 */
export const citationEmitter: NodeEmitter = (node: CitationNode) => {
  return `\\autocite{${node.keys.join(',')}}`;
};
