import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────

export interface FileSystemItem {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  type?: 'file' | 'folder' | 'bib';
  parentId?: string | null;
  isOpen?: boolean;
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
  citationStyle?: string;
  bibliographyId?: string | null;
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
  showSidebar: boolean;

  // Document management
  documents: FileSystemItem[];
  currentDocId: string | null;

  // Actions
  setContent: (content: string) => void;
  setLatex: (latex: string) => void;
  setPreview: (preview: string) => void;
  setLayout: (layout: LayoutMode) => void;
  setActivePane: (pane: ActivePane) => void;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setTranspilerOptions: (opts: Partial<TranspilerOptions>) => void;

  // Document actions
  saveDocument: (title?: string) => void;
  loadDocument: (doc: FileSystemItem) => void;
  deleteDocument: (id: string) => void;
  newDocument: (parentId?: string | null) => void;
  newFolder: (parentId?: string | null) => void;
  toggleFolder: (id: string) => void;
  renameItem: (id: string, newTitle: string) => void;
  moveItem: (itemId: string, newParentId: string | null) => void;
  setDocuments: (docs: FileSystemItem[]) => void;
}

const DEFAULT_TRANSPILER_OPTIONS: TranspilerOptions = {
  documentClass: 'article',
  packages: [],
  template: 'article',
  wrapDocument: true,
  codeRenderer: 'lstlisting',
  citationStyle: 'apa',
  bibliographyId: null,
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
      showSidebar: true,
      documents: [],
      currentDocId: null,

      // Content actions
      setContent: (content) => set({ content }),
      setLatex: (latex) => set({ latex }),
      setPreview: (preview) => set({ preview }),
      setLayout: (layout) => set({ layout }),
      setActivePane: (activePane) => set({ activePane }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ showSidebar: !s.showSidebar })),
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
          const newDoc: FileSystemItem = {
            id: crypto.randomUUID(),
            title: docTitle,
            content,
            createdAt: now,
            updatedAt: now,
            type: 'file',
          };
          set({
            documents: [newDoc, ...documents],
            currentDocId: newDoc.id,
          });
        }
      },

      loadDocument: (doc) => {
        if (doc.type === 'folder') return;
        set({ content: doc.content, currentDocId: doc.id });
      },

      deleteDocument: (id) => {
        const { documents, currentDocId } = get();
        // Also delete children if it's a folder
        const toDelete = new Set([id]);
        let changed = true;
        while (changed) {
          changed = false;
          for (const d of documents) {
            if (d.parentId && toDelete.has(d.parentId) && !toDelete.has(d.id)) {
              toDelete.add(d.id);
              changed = true;
            }
          }
        }
        
        set({
          documents: documents.filter((d) => !toDelete.has(d.id)),
          currentDocId: toDelete.has(currentDocId!) ? null : currentDocId,
        });
      },

      newDocument: (parentId = null) => {
        const BLANK_CONTENT = `---
title: New Document
author: 
date: \\today
---

# Introduction

Start writing your markdown here...`;
        
        // Wait, normally we just set content and currentDocId to null. 
        // But if we want it to be in a folder, we need to create it immediately.
        // For simplicity, let's just clear currentDocId so saveDocument will create a new file in root later.
        // Or if parentId is provided, we create it now.
        if (parentId) {
           const newDoc: FileSystemItem = {
             id: crypto.randomUUID(),
             title: 'Untitled Document',
             content: BLANK_CONTENT,
             createdAt: Date.now(),
             updatedAt: Date.now(),
             type: 'file',
             parentId,
           };
           const store = get();
           set({ documents: [newDoc, ...store.documents], content: BLANK_CONTENT, currentDocId: newDoc.id });
        } else {
           set({ content: BLANK_CONTENT, currentDocId: null });
        }
      },
      
      newFolder: (parentId = null) => {
        const newFolder: FileSystemItem = {
          id: crypto.randomUUID(),
          title: 'New Folder',
          content: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          type: 'folder',
          parentId,
          isOpen: true,
        };
        const store = get();
        set({ documents: [newFolder, ...store.documents] });
      },
      
      toggleFolder: (id) => {
        set({
          documents: get().documents.map((d) => 
            d.id === id ? { ...d, isOpen: !d.isOpen } : d
          )
        });
      },

      renameItem: (id, newTitle) => {
        set({
          documents: get().documents.map((d) => 
            d.id === id ? { ...d, title: newTitle, updatedAt: Date.now() } : d
          )
        });
      },

      moveItem: (itemId, newParentId) => {
        const store = get();
        if (itemId === newParentId) return;
        
        // Prevent cyclic moves (e.g., moving a folder into its own child)
        let currentParent = newParentId;
        while (currentParent) {
          if (currentParent === itemId) return;
          const parentDoc = store.documents.find(d => d.id === currentParent);
          currentParent = parentDoc?.parentId || null;
        }

        set({
          documents: store.documents.map((d) => 
            d.id === itemId ? { ...d, parentId: newParentId } : d
          )
        });
      },

      setDocuments: (docs) => set({ documents: docs }),
    }),
    {
      name: 'md-latex-editor',
      partialize: (state) => ({
        transpilerOptions: state.transpilerOptions,
        layout: state.layout,
        theme: state.theme,
        showSidebar: state.showSidebar,
        documents: state.documents,
        content: state.content,
        currentDocId: state.currentDocId,
      }),
    },
  ),
);
