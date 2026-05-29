import { WORKSPACE_FORMAT_VERSION, type WorkspaceArtifact } from '@/types/workspace';

type Migration = (old: WorkspaceArtifact) => WorkspaceArtifact;

const migrations: Record<number, Migration> = {
  // v1 → v2: add metadata + encryption fields
  1: (v1) => ({
    ...v1,
    version: 2,
    description: '',
    tags: [],
    wordCount: 0,
    encrypted: false,
  }),
};

export function migrateWorkspace(artifact: WorkspaceArtifact): WorkspaceArtifact {
  let data = { ...artifact };
  while (data.version < WORKSPACE_FORMAT_VERSION) {
    const migrate = migrations[data.version];
    if (!migrate) {
      throw new Error(
        `No migration defined for workspace version ${data.version}. Cannot upgrade to version ${WORKSPACE_FORMAT_VERSION}.`,
      );
    }
    data = migrate(data);
  }
  return data;
}

export function isNewerVersion(artifact: WorkspaceArtifact): boolean {
  return artifact.version > WORKSPACE_FORMAT_VERSION;
}
