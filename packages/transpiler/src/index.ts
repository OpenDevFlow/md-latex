import { parseMarkdown } from './parser/index';
import { emitLatex } from './emitter/index';
import type {
  TranspilerOptions,
  TranspileResult,
  FrontmatterData,
  RootWithFrontmatter,
} from './types';
import jsYaml from 'js-yaml';
import { visit } from 'unist-util-visit';

// ──────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────

/**
 * Transpile a Markdown string to LaTeX.
 *
 * @param markdown  - Raw Markdown source string
 * @param options   - Optional transpiler configuration
 * @returns         TranspileResult with `latex`, `frontmatter`, `warnings`
 *
 * @example
 * ```ts
 * import { transpile } from '@md-latex/transpiler';
 *
 * const { latex } = await transpile('# Hello\n\n**World**');
 * ```
 */
export async function transpile(
  markdown: string,
  options: TranspilerOptions = {},
): Promise<TranspileResult> {
  const plugins = options.plugins ?? [];

  // 1. Parse Markdown → mdast
  const root = (await parseMarkdown(markdown, plugins)) as RootWithFrontmatter;

  // 2. Extract frontmatter synchronously (js-yaml is sync)
  const frontmatter: FrontmatterData = {};
  visit(root, 'yaml', (node: any) => {
    try {
      const parsed = jsYaml.load(node.value) as Record<string, unknown>;
      if (parsed && typeof parsed === 'object') {
        Object.assign(frontmatter, parsed);
      }
    } catch {
      // Malformed YAML — ignore
    }
  });
  root.frontmatter = frontmatter;

  // 3. Emit LaTeX
  const { latex, warnings, sourceMap } = emitLatex(root, options, plugins);

  return { latex, frontmatter, warnings, sourceMap };
}

// Re-export types for convenience
export type {
  TranspilerOptions,
  TranspilerPlugin,
  TranspileResult,
  TranspileWarning,
  EmitterContext,
  NodeEmitter,
  FrontmatterData,
} from './types';

export { PluginRegistry, globalRegistry } from './plugins/index';
