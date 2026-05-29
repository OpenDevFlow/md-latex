import JSZip from 'jszip';
import type { WorkspaceArtifact } from '@/types/workspace';
import type { FileSystemItem } from '@/store/editorStore';

function extensionFor(item: FileSystemItem): string {
  if (item.type === 'bib') return '.bib';
  if (item.title.includes('.')) return ''; // already has extension
  return '.md';
}

function buildPaths(
  items: FileSystemItem[],
  parentId: string | null = null,
  prefix = '',
): Map<string, FileSystemItem> {
  const map = new Map<string, FileSystemItem>();
  const children = items.filter((i) => (i.parentId ?? null) === parentId);
  for (const item of children) {
    if (item.type === 'folder') {
      const folderPath = `${prefix}${item.title}/`;
      const nested = buildPaths(items, item.id, folderPath);
      for (const [p, v] of nested) map.set(p, v);
    } else {
      const ext = extensionFor(item);
      const filename = item.title.endsWith(ext) ? item.title : `${item.title}${ext}`;
      map.set(`${prefix}${filename}`, item);
    }
  }
  return map;
}

export async function exportAsZip(artifact: WorkspaceArtifact): Promise<void> {
  const zip = new JSZip();
  const docs = artifact.documents ?? [];

  // Build file paths preserving folder hierarchy
  const pathMap = buildPaths(docs);
  for (const [path, item] of pathMap) {
    zip.file(path, item.content);
  }

  // Add a meta file so the zip can be identified
  zip.file('.mdlatex-meta.json', JSON.stringify({
    label: artifact.label,
    description: artifact.description,
    tags: artifact.tags,
    exportedAt: artifact.exportedAt,
    layout: artifact.layout,
    theme: artifact.theme,
  }, null, 2));

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `md-latex-workspace-${timestamp}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
