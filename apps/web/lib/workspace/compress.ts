// Uses native CompressionStream / DecompressionStream (Baseline 2023).
// No dependencies required.

const URL_SAFE_REPLACEMENTS: [RegExp, string][] = [
  [/\+/g, '-'],
  [/\//g, '_'],
  [/=/g, ''],
];

const URL_SAFE_RESTORE: [RegExp, string][] = [
  [/-/g, '+'],
  [/_/g, '/'],
];

function toBase64url(b64: string): string {
  return URL_SAFE_REPLACEMENTS.reduce((s, [re, r]) => s.replace(re, r), b64);
}

function fromBase64url(b64url: string): string {
  let s = URL_SAFE_RESTORE.reduce((acc, [re, r]) => acc.replace(re, r), b64url);
  while (s.length % 4 !== 0) s += '=';
  return s;
}

/**
 * Compress a JSON string and return a URL-safe base64 string.
 */
export async function compressToBase64url(json: string): Promise<string> {
  const enc = new TextEncoder();
  const input = enc.encode(json);

  const cs = new CompressionStream('deflate-raw');
  const writer = cs.writable.getWriter();
  writer.write(input);
  writer.close();

  const chunks: Uint8Array[] = [];
  const reader = cs.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const total = chunks.reduce((n, c) => n + c.length, 0);
  const buf = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buf.set(chunk, offset);
    offset += chunk.length;
  }

  let binaryStr = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < buf.length; i += chunkSize) {
    binaryStr += String.fromCharCode.apply(null, buf.subarray(i, i + chunkSize) as unknown as number[]);
  }
  const b64 = btoa(binaryStr);
  return toBase64url(b64);
}

/**
 * Decompress a URL-safe base64 string back to the original JSON string.
 */
export async function decompressFromBase64url(b64url: string): Promise<string> {
  const b64 = fromBase64url(b64url);
  const binary = atob(b64);
  const buf = Uint8Array.from(binary, (c) => c.charCodeAt(0));

  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(buf);
  writer.close();

  const chunks: Uint8Array[] = [];
  const reader = ds.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const dec = new TextDecoder();
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return dec.decode(out);
}

/** Size guard — returns compressed byte length without building the full URL. */
export async function compressedByteLength(json: string): Promise<number> {
  const b64url = await compressToBase64url(json);
  return b64url.length;
}
