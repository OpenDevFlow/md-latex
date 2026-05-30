import type { WorkspaceArtifact } from '@/types/workspace';

export function validateWorkspaceArtifact(data: unknown): data is WorkspaceArtifact {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;

  if (typeof d.version !== 'number') return false;
  if (typeof d.exportedAt !== 'string') return false;
  if (typeof d.label !== 'string') return false;
  if (typeof d.layout !== 'string') return false;
  if (typeof d.theme !== 'string') return false;
  if (typeof d.showSidebar !== 'boolean') return false;

  const encrypted = d.encrypted;
  if (typeof encrypted !== 'boolean') return false;

  if (encrypted) {
    // Encrypted artifact must have ciphertext, iv, salt
    if (typeof d.ciphertext !== 'string') return false;
    if (typeof d.iv !== 'string') return false;
    if (typeof d.salt !== 'string') return false;
  } else {
    // Plain artifact must have documents array
    if (!Array.isArray(d.documents)) return false;
    if (typeof d.description !== 'string') return false;
    if (!Array.isArray(d.tags) || !d.tags.every(t => typeof t === 'string')) return false;
    if (typeof d.wordCount !== 'number') return false;
    if (typeof d.transpilerOptions !== 'object' || d.transpilerOptions === null) return false;
    if (d.currentDocId !== null && typeof d.currentDocId !== 'string') return false;
    if (typeof d.content !== 'string') return false;
    for (const doc of d.documents as unknown[]) {
      if (typeof doc !== 'object' || doc === null) return false;
      const item = doc as Record<string, unknown>;
      if (typeof item.id !== 'string') return false;
      if (typeof item.title !== 'string') return false;
      if (typeof item.content !== 'string') return false;
      if (typeof item.createdAt !== 'number') return false;
      if (typeof item.updatedAt !== 'number') return false;
    }
  }

  return true;
}
