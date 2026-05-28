import type { NodeEmitter } from '../../types.js';

/**
 * HTML node emitter — strips HTML comments, passes through raw HTML
 * as a LaTeX comment for transparency.
 */
export const htmlEmitter: NodeEmitter = (node: any) => {
  const value: string = node.value ?? '';
  // Strip HTML comments robustly
  const stripped = value.replace(/<!--[\s\S]*?-->/g, ' ');
  if (!stripped.trim()) return '';
  
  // Defang any unclosed HTML comments for CodeQL
  const safeStripped = stripped.replace(/<!--/g, '< !--');
  
  // Pass through as a LaTeX comment for transparency
  const lines = safeStripped.split('\n').map((l: string) => `% HTML: ${l}`);
  return `\n${lines.join('\n')}\n`;
};
