import type { WorkspaceArtifact } from '@/types/workspace';

/**
 * Lightweight runtime type guard for a parsed workspace artifact.
 *
 * Deliberately avoids heavy schema-validation libraries; the checks below
 * are sufficient to catch corrupt files and wrong file types before we
 * let the data anywhere near the Zustand store.
 */
export function validateWorkspaceArtifact(data: unknown): data is WorkspaceArtifact {
  if (typeof data !== 'object' || data === null) return false;

  const d = data as Record<string, unknown>;

  if (typeof d.version !== 'number') return false;
  if (typeof d.exportedAt !== 'string') return false;
  if (typeof d.label !== 'string') return false;
  if (!Array.isArray(d.documents)) return false;
  // currentDocId may be null
  if (d.currentDocId !== null && typeof d.currentDocId !== 'string') return false;
  if (typeof d.content !== 'string') return false;
  if (typeof d.transpilerOptions !== 'object' || d.transpilerOptions === null) return false;
  if (typeof d.layout !== 'string') return false;
  if (typeof d.theme !== 'string') return false;
  if (typeof d.showSidebar !== 'boolean') return false;

  // Validate each document has the minimum required fields
  for (const doc of d.documents as unknown[]) {
    if (typeof doc !== 'object' || doc === null) return false;
    const item = doc as Record<string, unknown>;
    if (typeof item.id !== 'string') return false;
    if (typeof item.title !== 'string') return false;
    if (typeof item.content !== 'string') return false;
    if (typeof item.createdAt !== 'number') return false;
    if (typeof item.updatedAt !== 'number') return false;
  }

  return true;
}
