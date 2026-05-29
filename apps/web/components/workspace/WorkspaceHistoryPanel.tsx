'use client';

import { useWorkspacesStore } from '@/store/workspacesStore';
import { useEditorStore } from '@/store/editorStore';
import type { WorkspaceArtifact } from '@/types/workspace';

export function WorkspaceHistoryPanel() {
  const snapshots = useWorkspacesStore((s) => s.snapshots);
  const importWorkspace = useEditorStore((s) => s.importWorkspace);

  function restore(artifact: WorkspaceArtifact) {
    if (confirm('Restore this snapshot? Your current workspace will be replaced.')) {
      importWorkspace(artifact);
    }
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  if (snapshots.length === 0) {
    return (
      <div style={{ padding: '16px', fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
        No snapshots yet. Snapshots are saved automatically each time you save a document.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px' }}>
      {snapshots.map((snap, i) => {
        const docCount = (snap.documents ?? []).filter((d) => d.type !== 'folder').length;
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 12px', borderRadius: '8px', gap: '8px',
            backgroundColor: 'var(--color-surface-2)',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '2px' }}>
                {formatTime(snap.exportedAt)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {docCount} file{docCount !== 1 ? 's' : ''} · {snap.wordCount?.toLocaleString() ?? 0} words
              </div>
            </div>
            <button
              onClick={() => restore(snap)}
              className="toolbar-btn secondary"
              style={{ fontSize: '12px', padding: '4px 10px', flexShrink: 0 }}
            >
              Restore
            </button>
          </div>
        );
      })}
    </div>
  );
}
