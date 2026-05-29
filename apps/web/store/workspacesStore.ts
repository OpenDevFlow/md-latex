'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkspaceArtifact, SavedWorkspace } from '@/types/workspace';

const MAX_SNAPSHOTS = 5;
const MAX_SNAPSHOT_JSON_BYTES = 400_000; // 400 KB guard

// ──────────────────────────────────────────────────────────
// State interface
// ──────────────────────────────────────────────────────────

interface WorkspacesState {
  /** Named saved workspaces keyed by UUID. */
  savedWorkspaces: Record<string, SavedWorkspace>;

  /** Auto-snapshot ring buffer (newest first). */
  snapshots: WorkspaceArtifact[];

  // Actions — saved workspaces
  saveWorkspace: (name: string, artifact: WorkspaceArtifact) => string;
  deleteWorkspace: (id: string) => void;
  renameWorkspace: (id: string, name: string) => void;

  // Actions — snapshots
  pushSnapshot: (artifact: WorkspaceArtifact) => void;
}

// ──────────────────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────────────────

export const useWorkspacesStore = create<WorkspacesState>()(
  persist(
    (set, get) => ({
      savedWorkspaces: {},
      snapshots: [],

      saveWorkspace: (name, artifact) => {
        const id = crypto.randomUUID();
        const entry: SavedWorkspace = {
          id,
          name,
          savedAt: new Date().toISOString(),
          artifact,
        };
        set((s) => ({
          savedWorkspaces: { ...s.savedWorkspaces, [id]: entry },
        }));
        return id;
      },

      deleteWorkspace: (id) =>
        set((s) => {
          const next = { ...s.savedWorkspaces };
          delete next[id];
          return { savedWorkspaces: next };
        }),

      renameWorkspace: (id, name) =>
        set((s) => {
          const entry = s.savedWorkspaces[id];
          if (!entry) return s;
          return {
            savedWorkspaces: {
              ...s.savedWorkspaces,
              [id]: { ...entry, name },
            },
          };
        }),

      pushSnapshot: (artifact) => {
        const json = JSON.stringify(artifact);
        if (json.length > MAX_SNAPSHOT_JSON_BYTES) return; // size guard

        const snapshots = [artifact, ...get().snapshots].slice(0, MAX_SNAPSHOTS);
        set({ snapshots });
      },
    }),
    {
      name: 'md-latex-workspaces',
      partialize: (s) => ({
        savedWorkspaces: s.savedWorkspaces,
        snapshots: s.snapshots,
      }),
    },
  ),
);
