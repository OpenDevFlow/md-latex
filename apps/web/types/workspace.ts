import type { FileSystemItem, LayoutMode, Theme, TranspilerOptions } from '@/store/editorStore';

// ──────────────────────────────────────────────────────────
// Version
// ──────────────────────────────────────────────────────────

/**
 * Increment this when the WorkspaceArtifact shape changes in a
 * breaking way.  A migration must be added to migrations.ts for
 * every version bump.
 */
export const WORKSPACE_FORMAT_VERSION = 1;

// ──────────────────────────────────────────────────────────
// Artifact shape
// ──────────────────────────────────────────────────────────

export interface WorkspaceArtifact {
  /** Schema version — used to drive the migration chain. */
  version: number;

  /** ISO-8601 timestamp of when the artifact was created. */
  exportedAt: string;

  /**
   * Human-readable label shown in the import confirmation dialog.
   * Defaults to the filename stem (e.g. "my-thesis").
   */
  label: string;

  // ── Persisted editor slices ──────────────────────────────

  /** The full virtual file tree, including folders and .bib files. */
  documents: FileSystemItem[];

  /** ID of the document that was open at export time. */
  currentDocId: string | null;

  /**
   * Raw content of the active document at export time.
   * May differ from the saved document if the user had unsaved edits.
   */
  content: string;

  /** LaTeX render settings. */
  transpilerOptions: TranspilerOptions;

  /** Editor layout at export time. */
  layout: LayoutMode;

  /** UI theme at export time. */
  theme: Theme;

  /** Whether the sidebar was visible at export time. */
  showSidebar: boolean;
}
