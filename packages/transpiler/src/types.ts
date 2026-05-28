import type { Plugin } from 'unified';
import type { Root, Node } from 'mdast';

// ──────────────────────────────────────────────────────────
// Transpiler Options
// ──────────────────────────────────────────────────────────

export type DocumentClass =
  | 'article'
  | 'report'
  | 'book'
  | 'beamer'
  | string;

export interface TranspilerOptions {
  /** LaTeX document class (default: 'article') */
  documentClass?: DocumentClass;
  /** Additional LaTeX packages to include in preamble */
  packages?: string[];
  /** Document template to use for wrapping output */
  template?: 'article' | 'base';
  /** Registered plugins */
  plugins?: TranspilerPlugin[];
  /** Whether to wrap output in full document (default: true) */
  wrapDocument?: boolean;
  /** Code block renderer: 'lstlisting' | 'minted' (default: 'lstlisting') */
  codeRenderer?: 'lstlisting' | 'minted';
  /** Citation style (e.g. 'apa', 'ieee', 'mla') */
  citationStyle?: string;
  /** Content of a bibliography file to embed via filecontents */
  bibliographyContent?: string | null;
}

// ──────────────────────────────────────────────────────────
// Plugin API
// ──────────────────────────────────────────────────────────

export type NodeEmitter = (node: any, ctx: EmitterContext) => string;

export interface TranspilerPlugin {
  /** Unique plugin name */
  name: string;
  /** Hook into remark parse phase */
  remarkPlugin?: () => Plugin;
  /** Override or extend emitters for specific node types */
  emitters?: Partial<Record<string, NodeEmitter>>;
  /** LaTeX packages to inject into preamble */
  packages?: string[];
}

// ──────────────────────────────────────────────────────────
// Emitter Context
// ──────────────────────────────────────────────────────────

export interface EmitterContext {
  /** Recursively emit an array of nodes */
  emit(nodes: Node[]): string;
  /** Recursively emit a single node */
  emitNode(node: Node): string;
  /** Current transpiler options */
  options: Required<TranspilerOptions>;
  /** Current heading depth offset */
  headingDepth: number;
  /** Extracted frontmatter metadata */
  frontmatter: FrontmatterData;
  /** Source map generated during transpilation */
  sourceMap: Array<{ sourceLine: number; texLine: number }>;
  /** Current LaTeX output line counter */
  currentTexLine: number;
}

// ──────────────────────────────────────────────────────────
// Frontmatter
// ──────────────────────────────────────────────────────────

export interface FrontmatterData {
  title?: string;
  author?: string | string[];
  date?: string;
  documentclass?: string;
  packages?: string[];
  abstract?: string;
  [key: string]: unknown;
}

// ──────────────────────────────────────────────────────────
// Transpile Result
// ──────────────────────────────────────────────────────────

export interface TranspileResult {
  /** Full LaTeX output string */
  latex: string;
  /** Extracted frontmatter */
  frontmatter: FrontmatterData;
  /** Warnings generated during transpilation */
  warnings: TranspileWarning[];
  /** Source map linking Markdown line to LaTeX line */
  sourceMap: Array<{ sourceLine: number; texLine: number }>;
}

export interface TranspileWarning {
  message: string;
  nodeType?: string;
}

// ──────────────────────────────────────────────────────────
// Internal AST extensions
// ──────────────────────────────────────────────────────────

/** Extended root node carrying parsed frontmatter */
export interface RootWithFrontmatter extends Root {
  frontmatter?: FrontmatterData;
}

/** Custom citation node produced by citation extension */
export interface CitationNode extends Node {
  type: 'citation';
  keys: string[];
}

/** Math node (inline) */
export interface InlineMathNode extends Node {
  type: 'inlineMath';
  value: string;
}

/** Math node (block) */
export interface MathNode extends Node {
  type: 'math';
  value: string;
  meta?: string | null;
}
