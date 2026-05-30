'use client';

import { useState } from 'react';
import { useWorkspacesStore } from '@/store/workspacesStore';
import { useEditorStore } from '@/store/editorStore';
import { useWorkspace } from '@/hooks/useWorkspace';

export function WorkspaceSwitcherPanel() {
  const savedWorkspaces = useWorkspacesStore((s) => s.savedWorkspaces);
  const saveWorkspace   = useWorkspacesStore((s) => s.saveWorkspace);
  const deleteWorkspace = useWorkspacesStore((s) => s.deleteWorkspace);
  const renameWorkspace = useWorkspacesStore((s) => s.renameWorkspace);
  const importWorkspace = useEditorStore((s) => s.importWorkspace);
  const { buildArtifact, exportWorkspace } = useWorkspace();

  const [saveName, setSaveName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName]   = useState('');

  const list = Object.values(savedWorkspaces).sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );

  function handleSave() {
    const name = saveName.trim() || `Workspace ${list.length + 1}`;
    saveWorkspace(name, buildArtifact());
    setSaveName('');
  }

  function handleLoad(id: string) {
    const entry = savedWorkspaces[id];
    if (!entry) return;
    if (confirm(`Load workspace "${entry.name}"? Your current workspace will be replaced.`)) {
      importWorkspace(entry.artifact);
    }
  }

  function handleDelete(id: string) {
    const entry = savedWorkspaces[id];
    if (!entry) return;
    if (confirm(`Delete "${entry.name}"?`)) deleteWorkspace(id);
  }

  function startRename(id: string, currentName: string) {
    setEditingId(id);
    setEditName(currentName);
  }

  function commitRename(id: string) {
    if (editName.trim()) renameWorkspace(id, editName.trim());
    setEditingId(null);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px' }}>
      {/* Save current */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          type="text"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="Workspace name…"
          style={{
            flex: 1, minWidth: 0, boxSizing: 'border-box',
            padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
            border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-2)',
            color: 'var(--color-text)', outline: 'none',
          }}
        />
        <button className="toolbar-btn primary" style={{ fontSize: '12px', padding: '6px 12px', flexShrink: 0 }} onClick={handleSave}>
          Save
        </button>
      </div>

      {list.length === 0 && (
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '12px 0' }}>
          No saved workspaces yet.
        </p>
      )}

      {list.map((entry) => (
        <div key={entry.id} style={{
          borderRadius: '10px', border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface-2)', overflow: 'hidden',
        }}>
          <div style={{ padding: '10px 12px' }}>
            {editingId === entry.id ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => commitRename(entry.id)}
                onKeyDown={(e) => { if (e.key === 'Enter') commitRename(entry.id); if (e.key === 'Escape') setEditingId(null); }}
                style={{
                  width: '100%', padding: '4px 8px', borderRadius: '6px', fontSize: '13px',
                  border: '1px solid var(--color-accent)', backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)', outline: 'none', fontWeight: 600, boxSizing: 'border-box',
                }}
              />
            ) : (
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '2px' }}>
                {entry.name}
              </div>
            )}
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Saved {formatDate(entry.savedAt)} · {(entry.artifact.documents ?? []).filter((d) => d.type !== 'folder').length} files
            </div>
          </div>
          <div style={{
            display: 'flex', gap: '1px', borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-border)',
          }}>
            {([
              ['Load', () => handleLoad(entry.id), 'var(--color-surface-2)'],
              ['Rename', () => startRename(entry.id, entry.name), 'var(--color-surface-2)'],
              ['Export', () => { importWorkspace(entry.artifact); exportWorkspace(); }, 'var(--color-surface-2)'],
              ['Delete', () => handleDelete(entry.id), '#fee2e2'],
            ] as [string, () => void, string][]).map(([label, action, bg]) => (
              <button key={label} onClick={action} style={{
                flex: 1, padding: '7px 0', fontSize: '12px', border: 'none', cursor: 'pointer',
                backgroundColor: bg, color: label === 'Delete' ? 'var(--color-danger, #dc2626)' : 'var(--color-text)',
                fontWeight: 500, transition: 'opacity 0.15s',
              }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
