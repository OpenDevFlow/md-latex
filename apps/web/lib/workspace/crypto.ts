import type { WorkspaceArtifact, WorkspacePayload } from '@/types/workspace';

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

function bufToBase64(buf: ArrayBuffer): string {
  const u8 = new Uint8Array(buf);
  let binaryStr = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < u8.length; i += chunkSize) {
    binaryStr += String.fromCharCode.apply(null, u8.subarray(i, i + chunkSize) as unknown as number[]);
  }
  return btoa(binaryStr);
}

function base64ToBuf(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

// ──────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────

/**
 * Encrypts the sensitive payload of a workspace artifact using AES-GCM.
 * Returns a new artifact where `documents`, `content`, and `transpilerOptions`
 * are replaced by an opaque `ciphertext` string.
 */
export async function encryptArtifact(
  artifact: WorkspaceArtifact,
  passphrase: string,
): Promise<WorkspaceArtifact> {
  const salt = crypto.getRandomValues(new Uint8Array(16)) as Uint8Array<ArrayBuffer>;
  const iv   = crypto.getRandomValues(new Uint8Array(12)) as Uint8Array<ArrayBuffer>;
  const key = await deriveKey(passphrase, salt);

  const payload: WorkspacePayload = {
    documents: artifact.documents ?? [],
    currentDocId: artifact.currentDocId ?? null,
    content: artifact.content ?? '',
    transpilerOptions: artifact.transpilerOptions!,
  };

  const enc = new TextEncoder();
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(JSON.stringify(payload)),
  );

  // Return artifact with sensitive fields replaced
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  const rest = (({ documents, currentDocId, content, transpilerOptions, ...r }: any) => r)(artifact);
  return {
    ...rest,
    encrypted: true,
    ciphertext: bufToBase64(cipherBuf),
    iv: bufToBase64(iv.buffer),
    salt: bufToBase64(salt.buffer),
  };
}

/**
 * Decrypts the ciphertext payload of an encrypted workspace artifact.
 * Throws a descriptive error if the passphrase is wrong or the data is corrupt.
 */
export async function decryptArtifact(
  artifact: WorkspaceArtifact,
  passphrase: string,
): Promise<WorkspaceArtifact> {
  if (!artifact.encrypted || !artifact.ciphertext || !artifact.iv || !artifact.salt) {
    throw new Error('Artifact is not encrypted or is missing encryption fields.');
  }

  const salt = base64ToBuf(artifact.salt) as Uint8Array<ArrayBuffer>;
  const iv   = base64ToBuf(artifact.iv);
  const cipherBuf = base64ToBuf(artifact.ciphertext);
  const key = await deriveKey(passphrase, salt);

  let plainBuf: ArrayBuffer;
  try {
    plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as Uint8Array<ArrayBuffer> }, key, cipherBuf as Uint8Array<ArrayBuffer>);
  } catch {
    throw new Error('Incorrect password. Please try again.');
  }

  const dec = new TextDecoder();
  const payload: WorkspacePayload = JSON.parse(dec.decode(plainBuf));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  const rest = (({ ciphertext, iv, salt, ...r }: any) => r)(artifact);
  return {
    ...rest,
    encrypted: false,
    ...payload,
  };
}
