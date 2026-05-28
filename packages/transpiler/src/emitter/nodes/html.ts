import type { NodeEmitter } from '../../types.js';

/**
 * HTML node emitter — strips HTML comments, passes through raw HTML
 * as a LaTeX comment for transparency.
 */
export const htmlEmitter: NodeEmitter = (node: any) => {
  const value: string = node.value ?? '';
  // Strip HTML comments
  if (value.trim().startsWith('<!--')) return '';
  // Pass through as a LaTeX comment for transparency
  const lines = value.split('\n').map((l: string) => `% HTML: ${l}`);
  return `\n${lines.join('\n')}\n`;
};
