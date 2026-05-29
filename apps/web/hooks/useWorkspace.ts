'use client';

import { useRef, useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useWorkspacesStore } from '@/store/workspacesStore';
import { WORKSPACE_FORMAT_VERSION, type WorkspaceArtifact } from '@/types/workspace';
import { validateWorkspaceArtifact } from '@/lib/workspace/validate';
import { isNewerVersion, migrateWorkspace } from '@/lib/workspace/migrations';
import { encryptArtifact, decryptArtifact } from '@/lib/workspace/crypto';
import { compressToBase64url, decompressFromBase64url, compressedByteLength } from '@/lib/workspace/compress';
import { exportAsZip } from '@/lib/workspace/zip';

const WORKSPACE_EXTENSION = '.mdlatex';
const WORKSPACE_MIME = 'application/json';
const URL_HASH_PREFIX = 'w=';
const URL_SIZE_WARN_BYTES = 6_000;

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────

export type ImportResult =
  | { ok: true }
  | { ok: false; error: string; needsPassword?: boolean };

export interface ShareResult {
  ok: boolean;
  url?: string;
  warning?: string;
  error?: string;
}

export interface UseWorkspaceReturn {
  importInputRef: React.RefObject<HTMLInputElement | null>;
  wordCount: number;
  buildArtifact: () => WorkspaceArtifact;
  exportWorkspace: () => void;
  exportWithPassword: (passphrase: string) => Promise<void>;
  exportAsZipFile: () => void;
  openImportPicker: () => void;
  handleImportFile: (file: File, passphrase?: string) => Promise<ImportResult>;
  shareViaUrl: (passphrase?: string) => Promise<ShareResult>;
  checkUrlHash: () => Promise<ImportResult | null>;
}

// ──────────────────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────────────────

export function useWorkspace(): UseWorkspaceReturn {
  const importInputRef = useRef<HTMLInputElement>(null);

  const documents      = useEditorStore((s) => s.documents);
  const currentDocId   = useEditorStore((s) => s.currentDocId);
  const content        = useEditorStore((s) => s.content);
  const transpilerOpts = useEditorStore((s) => s.transpilerOptions);
  const layout         = useEditorStore((s) => s.layout);
  const theme          = useEditorStore((s) => s.theme);
  const showSidebar    = useEditorStore((s) => s.showSidebar);
  const importWorkspace = useEditorStore((s) => s.importWorkspace);

  const pushSnapshot   = useWorkspacesStore((s) => s.pushSnapshot);

  // ── Word count (computed) ──────────────────────────────
  const wordCount = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;

  // ── Build artifact ────────────────────────────────────

  function buildArtifact(): WorkspaceArtifact {
    const allWords = documents
      .filter((d) => d.type !== 'folder' && d.type !== 'bib')
      .map((d) => d.content)
      .join(' ');
    const wc = allWords.trim() === '' ? 0 : allWords.trim().split(/\s+/).length;

    return {
      version: WORKSPACE_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      label: 'md-latex workspace',
      description: '',
      tags: [],
      wordCount: wc,
      encrypted: false,
      documents,
      currentDocId,
      content,
      transpilerOptions: transpilerOpts,
      layout,
      theme,
      showSidebar,
    };
  }

  // ── Download helper ───────────────────────────────────

  function downloadJson(artifact: WorkspaceArtifact, filename: string) {
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: WORKSPACE_MIME });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Export (plain) ────────────────────────────────────

  function exportWorkspace() {
    const artifact  = buildArtifact();
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadJson(artifact, `md-latex-workspace-${timestamp}${WORKSPACE_EXTENSION}`);
  }

  // ── Export (password-protected) ───────────────────────

  async function exportWithPassword(passphrase: string) {
    const artifact    = buildArtifact();
    const encrypted   = await encryptArtifact(artifact, passphrase);
    const timestamp   = new Date().toISOString().slice(0, 10);
    downloadJson(encrypted, `md-latex-workspace-${timestamp}${WORKSPACE_EXTENSION}`);
  }

  // ── Export as ZIP ────────────────────────────────────

  function exportAsZipFile() {
    exportAsZip(buildArtifact());
  }

  // ── Import file ───────────────────────────────────────

  function openImportPicker() {
    importInputRef.current?.click();
  }

  async function _parseAndLoad(text: string, passphrase?: string): Promise<ImportResult> {
    let parsed: unknown;
    try { parsed = JSON.parse(text); }
    catch { return { ok: false, error: 'The file is not valid JSON. Make sure you selected a .mdlatex file.' }; }

    if (!validateWorkspaceArtifact(parsed)) {
      return { ok: false, error: 'The file does not appear to be a valid md-latex workspace artifact.' };
    }

    if (isNewerVersion(parsed)) {
      return { ok: false, error: `This workspace was created with a newer version of md-latex (format v${parsed.version}). Please update the app.` };
    }

    let migrated: WorkspaceArtifact;
    try { migrated = migrateWorkspace(parsed); }
    catch (err) { return { ok: false, error: `Migration failed: ${err instanceof Error ? err.message : String(err)}` }; }

    if (migrated.encrypted) {
      if (!passphrase) return { ok: false, error: 'This workspace is password-protected.', needsPassword: true };
      try { migrated = await decryptArtifact(migrated, passphrase); }
      catch (err) { return { ok: false, error: err instanceof Error ? err.message : 'Decryption failed.' }; }
    }

    // Auto-snapshot before overwriting
    pushSnapshot(buildArtifact());
    importWorkspace(migrated);
    return { ok: true };
  }

  async function handleImportFile(file: File, passphrase?: string): Promise<ImportResult> {
    let text: string;
    try { text = await file.text(); }
    catch { return { ok: false, error: 'Could not read the selected file.' }; }
    return _parseAndLoad(text, passphrase);
  }

  // ── Share via URL ────────────────────────────────────

  async function shareViaUrl(passphrase?: string): Promise<ShareResult> {
    try {
      let artifact = buildArtifact();
      if (passphrase) {
        artifact = await encryptArtifact(artifact, passphrase);
      }

      const json   = JSON.stringify(artifact);
      const b64url = await compressToBase64url(json);
      const byteLen = await compressedByteLength(json);
      const hash   = `${URL_HASH_PREFIX}${b64url}`;
      const url    = `${window.location.origin}${window.location.pathname}#${hash}`;

      await navigator.clipboard.writeText(url);

      const warning = byteLen > URL_SIZE_WARN_BYTES
        ? `The URL is large (${Math.round(byteLen / 1024)} KB). Some browsers or link-sharing platforms may truncate it. Consider using file export for large workspaces.`
        : undefined;

      return { ok: true, url, warning };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to generate share URL.' };
    }
  }

  // ── URL hash detection on mount ───────────────────────

  async function checkUrlHash(): Promise<ImportResult | null> {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash;
    if (!hash.startsWith(`#${URL_HASH_PREFIX}`)) return null;

    const b64url = hash.slice(URL_HASH_PREFIX.length + 1);
    let json: string;
    try { json = await decompressFromBase64url(b64url); }
    catch { return { ok: false, error: 'The shared workspace URL appears to be corrupt.' }; }

    // Clear hash from URL without triggering a reload
    window.history.replaceState(null, '', window.location.pathname + window.location.search);

    return _parseAndLoad(json);
  }

  return {
    importInputRef,
    wordCount,
    buildArtifact,
    exportWorkspace,
    exportWithPassword,
    exportAsZipFile,
    openImportPicker,
    handleImportFile,
    shareViaUrl,
    checkUrlHash,
  };
}
