import type { Plugin } from 'unified';
import type { Root, Text, PhrasingContent } from 'mdast';
import { visit } from 'unist-util-visit';
import type { CitationNode } from '../../types.js';

/**
 * Remark plugin that transforms `[@key]` and `[@key1; @key2]` patterns
 * inside text nodes into custom `citation` AST nodes.
 *
 * Supports:
 *   [@smith2020]           → \cite{smith2020}
 *   [@smith2020; @doe2021] → \cite{smith2020,doe2021}
 *   [see @smith2020, p.5]  → \cite[p.5]{smith2020}  (future)
 */
export const remarkCitation: Plugin<[], Root> = function () {
  return (tree) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined) return;

      const CITATION_RE = /\[(@[\w.:/-]+(?:;\s*@[\w.:/-]+)*)\]/g;
      const parts: (PhrasingContent | CitationNode)[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = CITATION_RE.exec(node.value)) !== null) {
        // Text before the citation
        if (match.index > lastIndex) {
          parts.push({
            type: 'text',
            value: node.value.slice(lastIndex, match.index),
          } as Text);
        }

        // Extract citation keys, stripping leading '@'
        const keys = match[1]
          .split(';')
          .map((k) => k.trim().replace(/^@/, ''));

        const citationNode: CitationNode = {
          type: 'citation',
          keys,
        };
        parts.push(citationNode);
        lastIndex = match.index + match[0].length;
      }

      if (parts.length === 0) return; // No citations found — skip

      // Text after last citation
      if (lastIndex < node.value.length) {
        parts.push({
          type: 'text',
          value: node.value.slice(lastIndex),
        } as Text);
      }

      // Replace the current text node with the split parts
      parent.children.splice(index, 1, ...(parts as any[]));
      return index + parts.length; // Advance past inserted nodes
    });
  };
};
