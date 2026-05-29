import { WORKSPACE_FORMAT_VERSION, type WorkspaceArtifact } from '@/types/workspace';

// ──────────────────────────────────────────────────────────
// Migration registry
// ──────────────────────────────────────────────────────────

/**
 * Each key is the version we are migrating *from*.
 * The function receives the old shape and must return the shape
 * for the next version.
 *
 * Example — when we release v2 format, add:
 *   1: (v1) => ({ ...v1, version: 2, someNewField: defaultValue }),
 */
type Migration = (old: WorkspaceArtifact) => WorkspaceArtifact;

const migrations: Record<number, Migration> = {
  // No migrations needed yet — v1 is the initial format.
};

// ──────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────

/**
 * Walks the migration chain, upgrading the artifact to the current
 * WORKSPACE_FORMAT_VERSION one step at a time.
 *
 * Throws if a required migration is missing (indicates a developer
 * error, not a user error).
 */
export function migrateWorkspace(artifact: WorkspaceArtifact): WorkspaceArtifact {
  let data = { ...artifact };

  while (data.version < WORKSPACE_FORMAT_VERSION) {
    const migrate = migrations[data.version];
    if (!migrate) {
      throw new Error(
        `No migration defined for workspace version ${data.version}. ` +
          `Cannot upgrade to version ${WORKSPACE_FORMAT_VERSION}.`,
      );
    }
    data = migrate(data);
  }

  return data;
}

/**
 * Returns true when the artifact version is newer than what this
 * build of the app understands.  Callers should warn the user rather
 * than silently loading potentially incompatible data.
 */
export function isNewerVersion(artifact: WorkspaceArtifact): boolean {
  return artifact.version > WORKSPACE_FORMAT_VERSION;
}
