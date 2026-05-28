import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────

export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export type LayoutMode = '2-pane' | '3-pane';
export type ActivePane = 'md' | 'latex' | 'preview';
export type Theme = 'dark' | 'light';

export interface TranspilerOptions {
  documentClass: string;
  packages: string[];
  template: 'article' | 'base';
  wrapDocument: boolean;
  codeRenderer: 'lstlisting' | 'minted';
}

// ──────────────────────────────────────────────────────────
// Default content
// ──────────────────────────────────────────────────────────

export const DEFAULT_CONTENT = `---
title: My Research Paper
author: Jane Smith
date: \\today
---

# Introduction

Welcome to **md-latex** — write *Markdown*, get LaTeX.

## Mathematical Framework

The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.

Display math works too:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}
$$

## Features

- Real-time transpilation
- GFM tables → \`tabular\`
- Math via KaTeX in preview
- Export to \`.tex\`

## Code Example

\`\`\`python
def transpile(markdown: str) -> str:
    """Convert Markdown to LaTeX."""
    ast = parse(markdown)
    return emit(ast)
\`\`\`

## Results Table

| Feature       | Supported | Notes              |
|---------------|-----------|--------------------|
| Headings      | ✓         | H1–H6 mapping      |
| Math          | ✓         | KaTeX preview      |
| Tables        | ✓         | GFM tabular        |
| Citations     | ✓         | [@key] syntax      |

> "Mathematics is the language in which God has written the universe." — Galileo

See [@galilei1623] for the original quote.

---

1. Write Markdown
2. Get LaTeX
3. Publish your paper
`;

// ──────────────────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────────────────

interface EditorState {
  // Content
  content: string;
  latex: string;
  preview: string;

  // Settings
  transpilerOptions: TranspilerOptions;
  layout: LayoutMode;
  activePane: ActivePane;
  theme: Theme;

  // Document management
  documents: Document[];
  currentDocId: string | null;

  // Actions
  setContent: (content: string) => void;
  setLatex: (latex: string) => void;
  setPreview: (preview: string) => void;
  setLayout: (layout: LayoutMode) => void;
  setActivePane: (pane: ActivePane) => void;
  setTheme: (theme: Theme) => void;
  setTranspilerOptions: (opts: Partial<TranspilerOptions>) => void;

  // Document actions
  saveDocument: (title?: string) => void;
  loadDocument: (doc: Document) => void;
  deleteDocument: (id: string) => void;
  newDocument: () => void;
  setDocuments: (docs: Document[]) => void;
}

const DEFAULT_TRANSPILER_OPTIONS: TranspilerOptions = {
  documentClass: 'article',
  packages: [],
  template: 'article',
  wrapDocument: true,
  codeRenderer: 'lstlisting',
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      // Initial state
      content: DEFAULT_CONTENT,
      latex: '',
      preview: '',
      transpilerOptions: DEFAULT_TRANSPILER_OPTIONS,
      layout: '3-pane',
      activePane: 'md',
      theme: 'dark',
      documents: [],
      currentDocId: null,

      // Content actions
      setContent: (content) => set({ content }),
      setLatex: (latex) => set({ latex }),
      setPreview: (preview) => set({ preview }),
      setLayout: (layout) => set({ layout }),
      setActivePane: (activePane) => set({ activePane }),
      setTheme: (theme) => set({ theme }),
      setTranspilerOptions: (opts) =>
        set((s) => ({
          transpilerOptions: { ...s.transpilerOptions, ...opts },
        })),

      // Document actions
      saveDocument: (title) => {
        const { content, currentDocId, documents } = get();
        const now = Date.now();
        const docTitle = title ?? `Document ${documents.length + 1}`;

        if (currentDocId) {
          // Update existing
          set({
            documents: documents.map((d) =>
              d.id === currentDocId
                ? { ...d, content, updatedAt: now, ...(title ? { title } : {}) }
                : d,
            ),
          });
        } else {
          // Create new
          const newDoc: Document = {
            id: crypto.randomUUID(),
            title: docTitle,
            content,
            createdAt: now,
            updatedAt: now,
          };
          set({
            documents: [newDoc, ...documents],
            currentDocId: newDoc.id,
          });
        }
      },

      loadDocument: (doc) => {
        set({ content: doc.content, currentDocId: doc.id });
      },

      deleteDocument: (id) => {
        const { documents, currentDocId } = get();
        set({
          documents: documents.filter((d) => d.id !== id),
          currentDocId: currentDocId === id ? null : currentDocId,
        });
      },

      newDocument: () => {
        set({ content: DEFAULT_CONTENT, currentDocId: null });
      },

      setDocuments: (docs) => set({ documents: docs }),
    }),
    {
      name: 'md-latex-editor',
      partialize: (state) => ({
        transpilerOptions: state.transpilerOptions,
        layout: state.layout,
        theme: state.theme,
        documents: state.documents,
        content: state.content,
        currentDocId: state.currentDocId,
      }),
    },
  ),
);
