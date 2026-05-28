import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';
import jsYaml from 'js-yaml';
import type { FrontmatterData, RootWithFrontmatter } from '../types';

/**
 * Remark plugin that parses YAML front matter nodes (produced by
 * remark-frontmatter) into a structured `FrontmatterData` object and
 * attaches it to the root node as `root.frontmatter`.
 *
 * remark-frontmatter must run BEFORE this plugin in the pipeline.
 */
export const remarkFrontmatterExtract: Plugin<[], Root> = function () {
  return (tree) => {
    const root = tree as RootWithFrontmatter;
    root.frontmatter = {};

    visit(tree, 'yaml', (node: any) => {
      try {
        const parsed = jsYaml.load(node.value) as Record<string, unknown>;
        if (parsed && typeof parsed === 'object') {
          root.frontmatter = parsed as FrontmatterData;
        }
      } catch {
        // Malformed YAML — ignore and continue
      }
    });
  };
};
