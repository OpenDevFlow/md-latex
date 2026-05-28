import type { FrontmatterData, TranspilerOptions } from '../../types.js';

/**
 * Minimal wrapper — just the body content with no \documentclass.
 * Useful for embedding snippets or testing individual node emitters.
 */
export function baseTemplate(
  body: string,
  _frontmatter: FrontmatterData,
  _options: Required<TranspilerOptions>,
): string {
  return body.trim();
}
