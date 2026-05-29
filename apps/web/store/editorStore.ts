import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkspaceArtifact } from '@/types/workspace';

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
title: "The Future of Artificial Intelligence"
author: 
  - "Alan Turing"
  - "Grace Hopper"
date: \\today
abstract: "This paper explores the theoretical foundations of artificial intelligence and its practical implications. We discuss the mathematical frameworks underlying neural networks and provide a comprehensive review of recent literature."
---

# Introduction

Artificial intelligence has seen rapid advancements in recent years, primarily driven by increases in computational power and the availability of large datasets. As noted in early theoretical work [@turing1950], the possibility of machine intelligence has long fascinated computer scientists.

## Mathematical Foundations

Neural networks are built upon linear algebra and calculus. The activation of a neuron can be modeled as:

$$
y = \\sigma\\left(\\sum_{i=1}^{n} w_i x_i + b\\right)
$$

where $w_i$ represents the weights, $x_i$ the inputs, $b$ the bias, and $\\sigma$ the non-linear activation function.

## Recent Advancements

Deep learning architectures, such as transformers [@vaswani2017], have revolutionized natural language processing. These models rely heavily on the self-attention mechanism, which allows them to capture long-range dependencies in text.

### Performance Metrics

| Model | Accuracy | Training Time |
|-------|----------|---------------|
| GPT-2 | 85% | 1 week |
| GPT-3 | 92% | 1 month |
| GPT-4 | 98% | 3 months |

# Conclusion

The rapid progress in AI requires careful consideration of ethical implications alongside technical development. We anticipate further breakthroughs in the coming decade, building upon the foundational work established in the late 20th century.
`;

export const DEFAULT_BIB_CONTENT = `@article{turing1950,
  title={Computing machinery and intelligence},
  author={Turing, Alan M},
  journal={Mind},
  volume={59},
  number={236},
  pages={433--460},
  year={1950},
  publisher={JSTOR}
}

@inproceedings{vaswani2017,
  title={Attention is all you need},
  author={Vaswani, Ashish and Shazeer, Noam and Parmar, Niki and Uszkoreit, Jakob and Jones, Llion and Gomez, Aidan N and Kaiser, Lukasz and Polosukhin, Illia},
  booktitle={Advances in neural information processing systems},
  pages={5998--6008},
  year={2017}
}`;

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

  /**
   * Atomically replaces all persisted state slices from a workspace
   * artifact.  Called by useWorkspace after validation and migration.
   */
  importWorkspace: (artifact: WorkspaceArtifact) => void;

  // Scroll Sync
  activeLine: number | null;
  latexSourceMap: Array<{ sourceLine: number; texLine: number }>;
  setActiveLine: (line: number | null) => void;
  setLatexSourceMap: (map: Array<{ sourceLine: number; texLine: number }>) => void;
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
      activeLine: null,
      latexSourceMap: [],
      transpilerOptions: { ...DEFAULT_TRANSPILER_OPTIONS, bibliographyId: 'default-bib-id' },
      layout: '3-pane',
      activePane: 'md',
      theme: 'dark',
      showSidebar: true,
      documents: [
        {
          id: 'default-doc-id',
          title: 'Future of AI.md',
          content: DEFAULT_CONTENT,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          type: 'file',
        },
        {
          id: 'default-bib-id',
          title: 'references.bib',
          content: DEFAULT_BIB_CONTENT,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          type: 'file',
        }
      ],
      currentDocId: 'default-doc-id',

      // Content actions
      setContent: (content) => set({ content }),
      setLatex: (latex) => set({ latex }),
      setPreview: (preview) => set({ preview }),
      setActiveLine: (activeLine) => set({ activeLine }),
      setLatexSourceMap: (latexSourceMap) => set({ latexSourceMap }),
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
        const { documents, currentDocId, transpilerOptions } = get();
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
        
        let newTranspilerOptions = transpilerOptions;
        if (transpilerOptions?.bibliographyId && toDelete.has(transpilerOptions.bibliographyId)) {
          newTranspilerOptions = { ...transpilerOptions, bibliographyId: null };
        }
        
        set({
          documents: documents.filter((d) => !toDelete.has(d.id)),
          currentDocId: toDelete.has(currentDocId!) ? null : currentDocId,
          transpilerOptions: newTranspilerOptions,
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

      importWorkspace: (artifact) =>
        set({
          documents: artifact.documents,
          currentDocId: artifact.currentDocId,
          content: artifact.content,
          transpilerOptions: artifact.transpilerOptions,
          layout: artifact.layout,
          theme: artifact.theme,
          showSidebar: artifact.showSidebar,
          // Reset volatile render state
          latex: '',
          preview: '',
          activeLine: null,
          latexSourceMap: [],
        }),
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
