import type { NodeEmitter } from '../types';

/**
 * Thematic break (---) → a full-width horizontal rule.
 */
export const thematicBreakEmitter: NodeEmitter = () => {
  return `\n\\noindent\\rule{\\linewidth}{0.4pt}\n`;
};
