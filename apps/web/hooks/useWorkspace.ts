'use client';

import { useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { WORKSPACE_FORMAT_VERSION, type WorkspaceArtifact } from '@/types/workspace';
import { validateWorkspaceArtifact } from '@/lib/workspace/validate';
import { isNewerVersion, migrateWorkspace } from '@/lib/workspace/migrations';

// ──────────────────────────────────────────────────────────
// File extension / mime
// ──────────────────────────────────────────────────────────

const WORKSPACE_EXTENSION = '.mdlatex';
const WORKSPACE_MIME = 'application/json';

// ──────────────────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────────────────

export interface UseWorkspaceReturn {
  /** Hidden <input> ref — attach to a <input type="file"> element. */
  importInputRef: React.RefObject<HTMLInputElement | null>;
  /** Serialises the current workspace and triggers a browser download. */
  exportWorkspace: () => void;
  /** Programmatically opens the file picker. */
  openImportPicker: () => void;
  /** Handles the file once the user selects it from the picker. */
  handleImportFile: (file: File) => Promise<ImportResult>;
}

export type ImportResult =
  | { ok: true }
  | { ok: false; error: string };

export function useWorkspace(): UseWorkspaceReturn {
  const importInputRef = useRef<HTMLInputElement>(null);

  // Pull only what we need from the store
  const documents = useEditorStore((s) => s.documents);
  const currentDocId = useEditorStore((s) => s.currentDocId);
  const content = useEditorStore((s) => s.content);
  const transpilerOptions = useEditorStore((s) => s.transpilerOptions);
  const layout = useEditorStore((s) => s.layout);
  const theme = useEditorStore((s) => s.theme);
  const showSidebar = useEditorStore((s) => s.showSidebar);
  const importWorkspace = useEditorStore((s) => s.importWorkspace);

  // ── Export ──────────────────────────────────────────────

  function exportWorkspace() {
    const artifact: WorkspaceArtifact = {
      version: WORKSPACE_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      label: 'md-latex workspace',
      documents,
      currentDocId,
      // Capture the live content buffer (may be unsaved)
      content,
      transpilerOptions,
      layout,
      theme,
      showSidebar,
    };

    const json = JSON.stringify(artifact, null, 2);
    const blob = new Blob([json], { type: WORKSPACE_MIME });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const filename = `md-latex-workspace-${timestamp}${WORKSPACE_EXTENSION}`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  // ── Import ──────────────────────────────────────────────

  function openImportPicker() {
    importInputRef.current?.click();
  }

  async function handleImportFile(file: File): Promise<ImportResult> {
    // 1. Read the file
    let text: string;
    try {
      text = await file.text();
    } catch {
      return { ok: false, error: 'Could not read the selected file.' };
    }

    // 2. Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: false, error: 'The file is not valid JSON. Make sure you selected a .mdlatex file.' };
    }

    // 3. Validate shape
    if (!validateWorkspaceArtifact(parsed)) {
      return {
        ok: false,
        error: 'The file does not appear to be a valid md-latex workspace artifact.',
      };
    }

    // 4. Guard against future formats this version cannot handle
    if (isNewerVersion(parsed)) {
      return {
        ok: false,
        error: `This workspace was created with a newer version of md-latex (format v${parsed.version}). Please update the app and try again.`,
      };
    }

    // 5. Migrate to current version
    let migrated: WorkspaceArtifact;
    try {
      migrated = migrateWorkspace(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `Migration failed: ${message}` };
    }

    // 6. Atomically load into store
    importWorkspace(migrated);

    return { ok: true };
  }

  return {
    importInputRef,
    exportWorkspace,
    openImportPicker,
    handleImportFile,
  };
}
