import type { Node } from 'mdast';
import type {
  EmitterContext,
  FrontmatterData,
  NodeEmitter,
  TranspilerOptions,
  TranspilerPlugin,
  TranspileWarning,
} from '../types.js';
import type { RootWithFrontmatter } from '../types.js';

import { headingEmitter }      from './nodes/heading';
import { paragraphEmitter }    from './nodes/paragraph';
import { strongEmitter }       from './nodes/strong';
import { emphasisEmitter }     from './nodes/emphasis';
import { inlineCodeEmitter }   from './nodes/inlineCode';
import { codeEmitter }         from './nodes/code';
import { blockquoteEmitter }   from './nodes/blockquote';
import { listEmitter }         from './nodes/list';
import { tableEmitter }        from './nodes/table';
import { linkEmitter }         from './nodes/link';
import { imageEmitter }        from './nodes/image';
import { thematicBreakEmitter } from './nodes/thematicBreak';
import { inlineMathEmitter, mathEmitter } from './nodes/math';
import { citationEmitter }     from './nodes/citation';
import { htmlEmitter }         from './nodes/html';
import { articleTemplate }     from './templates/article';
import { baseTemplate }        from './templates/base';

// ──────────────────────────────────────────────────────────
// Default emitter registry
// ──────────────────────────────────────────────────────────

const DEFAULT_EMITTERS: Record<string, NodeEmitter> = {
  heading:        headingEmitter,
  paragraph:      paragraphEmitter,
  strong:         strongEmitter,
  emphasis:       emphasisEmitter,
  inlineCode:     inlineCodeEmitter,
  code:           codeEmitter,
  blockquote:     blockquoteEmitter,
  list:           listEmitter,
  table:          tableEmitter,
  link:           linkEmitter,
  image:          imageEmitter,
  thematicBreak:  thematicBreakEmitter,
  inlineMath:     inlineMathEmitter,
  math:           mathEmitter,
  citation:       citationEmitter,
  html:           htmlEmitter,
  // Leaf text node
  text:           (node: any) => escapeLatex(node.value ?? ''),
  // Break → newline
  break:          () => ' \\\\\n',
  // Delete (strikethrough) → \sout{} requires ulem package
  delete:         (node: any, ctx: EmitterContext) => `\\sout{${ctx.emit(node.children)}}`,
  // list item handled inside list emitter
  listItem:       (node: any, ctx: EmitterContext) => ctx.emit(node.children),
  // table cells handled inside table emitter
  tableRow:       (node: any, ctx: EmitterContext) => ctx.emit(node.children),
  tableCell:      (node: any, ctx: EmitterContext) => ctx.emit(node.children),
  // Root: emit children
  root:           (node: any, ctx: EmitterContext) => ctx.emit(node.children),
  // YAML front matter node is handled by extractor — skip in emitter
  yaml:           () => '',
  // Definition / footnote reference — skip for now
  definition:     () => '',
  linkReference:  (node: any, ctx: EmitterContext) => ctx.emit(node.children),
  imageReference: () => '',
};

// ──────────────────────────────────────────────────────────
// LaTeX special character escaping
// ──────────────────────────────────────────────────────────

const LATEX_ESCAPE_MAP: Array<[RegExp, string]> = [
  [/\\/g, '\\textbackslash{}'],
  [/\{/g, '\\{'],
  [/\}/g, '\\}'],
  [/%/g,  '\\%'],
  [/\$/g, '\\$'],
  [/#/g,  '\\#'],
  [/&/g,  '\\&'],
  [/_/g,  '\\_'],
  [/\^/g, '\\^{}'],
  [/~/g,  '\\textasciitilde{}'],
];

export function escapeLatex(text: string): string {
  // Don't double-escape — skip if already processed by an emitter
  return LATEX_ESCAPE_MAP.reduce(
    (acc, [re, replacement]) => acc.replace(re, replacement),
    text,
  );
}

// ──────────────────────────────────────────────────────────
// Default options
// ──────────────────────────────────────────────────────────

const DEFAULT_OPTIONS: Required<TranspilerOptions> = {
  documentClass: 'article',
  packages: [],
  template: 'article',
  plugins: [],
  wrapDocument: true,
  codeRenderer: 'lstlisting',
  citationStyle: 'apa',
  bibliographyContent: null,
};

// ──────────────────────────────────────────────────────────
// Emitter entry point
// ──────────────────────────────────────────────────────────

export interface EmitResult {
  latex: string;
  warnings: TranspileWarning[];
  sourceMap: Array<{ sourceLine: number; texLine: number }>;
}

export function emitLatex(
  root: RootWithFrontmatter,
  userOptions: TranspilerOptions = {},
  plugins: TranspilerPlugin[] = [],
): EmitResult {
  const options: Required<TranspilerOptions> = {
    ...DEFAULT_OPTIONS,
    ...userOptions,
    packages: [...DEFAULT_OPTIONS.packages, ...(userOptions.packages ?? [])],
  };

  const frontmatter: FrontmatterData = root.frontmatter ?? {};
  const warnings: TranspileWarning[] = [];
  const sourceMap: Array<{ sourceLine: number; texLine: number }> = [];

  // Merge plugin emitters on top of defaults
  const emitters = { ...DEFAULT_EMITTERS };
  for (const plugin of plugins) {
    if (plugin.emitters) {
      Object.assign(emitters, plugin.emitters);
    }
    // Merge plugin packages
    if (plugin.packages) {
      options.packages = [...options.packages, ...plugin.packages];
    }
  }

  // Build the emitter context
  const ctx: EmitterContext = {
    options,
    headingDepth: 0,
    frontmatter,
    sourceMap: [],
    currentTexLine: 0,

    emitNode(node: Node): string {
      const emitter = emitters[node.type];
      if (!emitter) {
        warnings.push({
          message: `No emitter for node type "${node.type}" — skipping`,
          nodeType: node.type,
        });
        return '';
      }
      
      let result = emitter(node, ctx);

      // Inject source line marker for block-level nodes
      if (
        node.position?.start?.line && 
        ['paragraph', 'heading', 'list', 'code', 'blockquote', 'math', 'table'].includes(node.type)
      ) {
        result = `\n% source-line: ${node.position.start.line}\n${result}`;
      }
      
      return result;
    },

    emit(nodes: Node[]): string {
      return nodes.map((n) => ctx.emitNode(n)).join('');
    },
  };

  // Walk the root
  const body = ctx.emit(root.children);

  // Choose template
  let rawLatex: string;
  if (!options.wrapDocument) {
    rawLatex = baseTemplate(body, frontmatter, options);
  } else if (options.template === 'base') {
    rawLatex = baseTemplate(body, frontmatter, options);
  } else {
    rawLatex = articleTemplate(body, frontmatter, options);
  }

  // Post-process to extract source map and remove markers
  const lines = rawLatex.split('\n');
  const finalLines: string[] = [];
  let currentOutputLine = 1;

  for (const line of lines) {
    const match = line.match(/^%\s*source-line:\s*(\d+)$/);
    if (match) {
      const sourceLine = parseInt(match[1], 10);
      sourceMap.push({ sourceLine, texLine: currentOutputLine });
    } else {
      finalLines.push(line);
      currentOutputLine++;
    }
  }

  return { latex: finalLines.join('\n'), warnings, sourceMap };
}
