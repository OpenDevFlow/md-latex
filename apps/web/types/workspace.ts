import type { FileSystemItem, LayoutMode, Theme, TranspilerOptions } from '@/store/editorStore';

// ──────────────────────────────────────────────────────────
// Version
// ──────────────────────────────────────────────────────────

export const WORKSPACE_FORMAT_VERSION = 2;

// ──────────────────────────────────────────────────────────
// Sensitive payload (encrypted when password-protected)
// ──────────────────────────────────────────────────────────

export interface WorkspacePayload {
  documents: FileSystemItem[];
  currentDocId: string | null;
  content: string;
  transpilerOptions: TranspilerOptions;
}

// ──────────────────────────────────────────────────────────
// Artifact shape (v2)
// ──────────────────────────────────────────────────────────

export interface WorkspaceArtifact {
  /** Schema version — drives the migration chain. */
  version: number;

  /** ISO-8601 timestamp of creation. */
  exportedAt: string;

  /** Human-readable name shown in the import dialog. */
  label: string;

  /** Optional description / notes. */
  description: string;

  /** User-defined tags for organisation. */
  tags: string[];

  /** Total word count across all documents at export time. */
  wordCount: number;

  /** Whether the sensitive payload is AES-GCM encrypted. */
  encrypted: boolean;

  // ── Plaintext metadata (always present, even when encrypted) ──

  layout: LayoutMode;
  theme: Theme;
  showSidebar: boolean;

  // ── Unencrypted payload (present when encrypted = false) ──

  documents?: FileSystemItem[];
  currentDocId?: string | null;
  content?: string;
  transpilerOptions?: TranspilerOptions;

  // ── Encrypted payload (present when encrypted = true) ──

  /** Base64-encoded AES-GCM ciphertext of WorkspacePayload JSON. */
  ciphertext?: string;
  /** Base64-encoded 12-byte AES-GCM IV. */
  iv?: string;
  /** Base64-encoded 16-byte PBKDF2 salt. */
  salt?: string;
}

// ──────────────────────────────────────────────────────────
// Saved workspace entry (for the workspace switcher)
// ──────────────────────────────────────────────────────────

export interface SavedWorkspace {
  id: string;
  name: string;
  savedAt: string;
  artifact: WorkspaceArtifact;
}
