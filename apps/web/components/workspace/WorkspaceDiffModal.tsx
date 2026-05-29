'use client';

import { useState, useMemo } from 'react';
import type { FileSystemItem } from '@/store/editorStore';
import type { WorkspaceArtifact } from '@/types/workspace';

interface Props {
  incoming: WorkspaceArtifact;
  currentDocs: FileSystemItem[];
  onConfirm: (selectedIds: string[]) => void;
  onCancel: () => void;
}

type FileStatus = 'new' | 'modified' | 'unchanged' | 'removed';

interface DiffEntry {
  id: string;
  title: string;
  status: FileStatus;
  incoming?: FileSystemItem;
}

const STATUS_COLORS: Record<FileStatus, string> = {
  new: '#22c55e',
  modified: '#f97316',
  unchanged: 'var(--color-text-muted)',
  removed: '#ef4444',
};

const STATUS_LABELS: Record<FileStatus, string> = {
  new: 'New',
  modified: 'Modified',
  unchanged: 'Unchanged',
  removed: 'Removed',
};

export function WorkspaceDiffModal({ incoming, currentDocs, onConfirm, onCancel }: Props) {
  const incomingDocs = (incoming.documents ?? []).filter((d) => d.type !== 'folder');
  const currentFiles = currentDocs.filter((d) => d.type !== 'folder');

  const diff = useMemo((): DiffEntry[] => {
    const entries: DiffEntry[] = [];
    const currentMap = new Map(currentFiles.map((d) => [d.title, d]));
    const incomingMap = new Map(incomingDocs.map((d) => [d.title, d]));

    // Incoming files
    for (const inc of incomingDocs) {
      const cur = currentMap.get(inc.title);
      if (!cur) {
        entries.push({ id: inc.id, title: inc.title, status: 'new', incoming: inc });
      } else if (cur.content !== inc.content) {
        entries.push({ id: inc.id, title: inc.title, status: 'modified', incoming: inc });
      } else {
        entries.push({ id: inc.id, title: inc.title, status: 'unchanged', incoming: inc });
      }
    }

    // Files that will be removed
    for (const cur of currentFiles) {
      if (!incomingMap.has(cur.title)) {
        entries.push({ id: cur.id, title: cur.title, status: 'removed' });
      }
    }

    return entries;
  }, [incomingDocs, currentFiles]);

  const importableIds = diff
    .filter((e) => e.status !== 'removed' && e.incoming)
    .map((e) => e.id);

  const [selected, setSelected] = useState<Set<string>>(new Set(importableIds));

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() { setSelected(new Set(importableIds)); }
  function selectNone() { setSelected(new Set()); }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1050,
      backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{
        backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '80vh',
        display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
            Import Workspace — Preview Changes
          </h3>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Select which files to import from <strong style={{ color: 'var(--color-text)' }}>{incoming.label}</strong>.
            Importing will overwrite files with the same name.
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', padding: '12px 24px', flexWrap: 'wrap' }}>
          {(Object.entries(STATUS_LABELS) as [FileStatus, string][]).map(([status, label]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: STATUS_COLORS[status], flexShrink: 0 }} />
              {label}
            </div>
          ))}
        </div>

        {/* Select all / none */}
        <div style={{ display: 'flex', gap: '12px', padding: '0 24px 12px', fontSize: '13px' }}>
          <button onClick={selectAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)', padding: 0 }}>
            Select all
          </button>
          <button onClick={selectNone} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0 }}>
            Select none
          </button>
        </div>

        {/* File list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 8px' }}>
          {diff.map((entry) => {
            const selectable = entry.status !== 'removed' && !!entry.incoming;
            return (
              <label key={entry.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px', borderRadius: '8px', marginBottom: '4px',
                cursor: selectable ? 'pointer' : 'default',
                backgroundColor: selectable && selected.has(entry.id) ? 'var(--color-accent-soft)' : 'transparent',
                transition: 'background 0.15s',
              }}>
                {selectable && (
                  <input
                    type="checkbox"
                    checked={selected.has(entry.id)}
                    onChange={() => toggle(entry.id)}
                    style={{ accentColor: 'var(--color-accent)', width: '15px', height: '15px', flexShrink: 0 }}
                  />
                )}
                {!selectable && <span style={{ width: '15px', flexShrink: 0 }} />}
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  backgroundColor: STATUS_COLORS[entry.status], flexShrink: 0,
                }} />
                <span style={{
                  fontSize: '13px', flex: 1,
                  color: entry.status === 'removed' ? STATUS_COLORS.removed : 'var(--color-text)',
                  textDecoration: entry.status === 'removed' ? 'line-through' : 'none',
                  opacity: entry.status === 'unchanged' ? 0.7 : 1,
                }}>
                  {entry.title}
                </span>
                <span style={{ fontSize: '11px', color: STATUS_COLORS[entry.status], fontWeight: 500 }}>
                  {STATUS_LABELS[entry.status]}
                </span>
              </label>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--color-border)',
          display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            {selected.size} of {importableIds.length} files selected
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="toolbar-btn secondary" onClick={onCancel}>Cancel</button>
            <button
              className="toolbar-btn primary"
              disabled={selected.size === 0}
              onClick={() => onConfirm([...selected])}
            >
              Import Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
