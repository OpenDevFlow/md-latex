import { unified, type Processor } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import type { Root } from 'mdast';
import type { TranspilerPlugin } from '../types.js';
import { remarkCitation } from './extensions/citation';

/**
 * Builds and returns a configured unified processor for parsing
 * Markdown into an mdast (Markdown AST).
 *
 * Plugin order matters:
 *  1. remark-frontmatter  — fences YAML block so remark doesn't eat it
 *  2. remark-math         — fences $...$ and $$...$$ nodes
 *  3. remark-gfm          — tables, strikethrough, task lists, autolinks
 *  4. remarkCitation      — [@key] → citation nodes
 *  5. user plugins        — custom remark extensions from TranspilerPlugin[]
 */
export function buildParser(plugins: TranspilerPlugin[] = []): Processor<Root> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkMath)
    .use(remarkGfm)
    .use(remarkCitation);

  // Apply any user-provided remark plugins
  for (const plugin of plugins) {
    if (plugin.remarkPlugin) {
      processor.use(plugin.remarkPlugin());
    }
  }

  return processor as unknown as Processor<Root>;
}

/**
 * Parse a Markdown string into an mdast Root node.
 */
export async function parseMarkdown(
  markdown: string,
  plugins: TranspilerPlugin[] = [],
): Promise<Root> {
  const parser = buildParser(plugins);
  const tree = parser.parse(markdown);
  // Run through any async transformers (e.g. frontmatter extractor)
  return parser.run(tree) as Promise<Root>;
}
