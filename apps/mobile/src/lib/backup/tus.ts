/**
 * Resumable upload: the subset of the tus 1.0.0 protocol Supabase Storage
 * serves at `/storage/v1/upload/resumable` (F08 6.5 A step 5; WP-F08-B1
 * assumption A3). Pure TypeScript over an injected HTTP function, so the
 * kill-and-resume rules run in Node against a fake bucket.
 *
 * - Create (POST) once; the upload URL is persisted by the caller with every
 *   offset, so after a kill the next run asks the server for its offset (HEAD)
 *   and sends only what is missing.
 * - Parts are 6 MiB, the size Supabase requires for every part but the last.
 * - An expired or unknown upload URL (404, 410) starts a fresh upload of the
 *   same bytes. A wrong offset (409) asks the server again.
 * - The upload URL must be https on the endpoint's own origin: every HEAD and
 *   PATCH carries the user's access token, so a `Location` anywhere else is
 *   refused, not followed (review A note 2 on #150).
 * - `x-upsert: true`: a pending object may be replaced (a job reset after its
 *   ciphertext changed). The Storage policy allows that only while the
 *   caller's `audio_blobs` row is `pending` (request to the S05 server).
 */
import { BackupServerError, type UploadTarget } from './contract';
import { bytesToBase64, utf8ToBytes } from './bytes';

export const TUS_VERSION = '1.0.0';
export const TUS_PART_BYTES = 6 * 1024 * 1024;

export interface HttpResponse {
  status: number;
  header(name: string): string | null;
}

export type HttpLike = (url: string, init: { method: 'POST' | 'HEAD' | 'PATCH'; headers: Record<string, string>; body?: Uint8Array }) => Promise<HttpResponse>;

export interface TusProgress {
  url: string | null;
  offset: number;
}

export interface TusUploadInput {
  http: HttpLike;
  target: UploadTarget;
  bucket: string;
  objectPath: string;
  length: number;
  readPart: (offset: number, length: number) => Uint8Array;
  progress: TusProgress;
  /** Called after the upload URL is made and after every part: persist it (the kill path). */
  onProgress: (p: TusProgress) => void;
  /** Checked before every part. False: stop after the part in flight, resume later. */
  keepGoing: () => boolean;
  partBytes?: number;
}

const meta = (pairs: Record<string, string>) =>
  Object.entries(pairs)
    .map(([k, v]) => `${k} ${bytesToBase64(utf8ToBytes(v))}`)
    .join(',');

/** The origin of an https URL with its host in lower case, or null (anything not https, or no host). No URL global needed (Hermes). */
export function httpsOrigin(u: string): string | null {
  const m = /^https:\/\/([^/?#\\]+)/i.exec(u);
  return m ? `https://${m[1].toLowerCase()}` : null;
}

/**
 * The upload URL a `Location` names: absolute, protocol-relative, or relative to the endpoint. Only
 * https on the endpoint's own origin is accepted; anything else throws a BackupServerError that is not
 * retried (`location`), so the user's token never goes to another host or in clear text.
 */
export function resolveLocation(location: string, endpoint: string): string {
  const origin = httpsOrigin(endpoint);
  if (!origin) throw new BackupServerError('location', false);
  const url = location.startsWith('//') ? `https:${location}`
    : /^[a-z][a-z0-9+.-]*:/i.test(location) ? location
    : location.startsWith('/') ? `${origin}${location}`
    : `${endpoint.replace(/\/+$/, '')}/${location}`;
  if (httpsOrigin(url) !== origin || /[\s\\]/.test(url)) throw new BackupServerError('location', false);
  return url;
}

function fail(status: number): never {
  // 0 is "no response"; 408, 429 and 5xx are worth another try (ADR 0017 section 3).
  const retryable = status === 0 || status === 408 || status === 429 || status >= 500;
  throw new BackupServerError(`HTTP${status}`, retryable);
}

async function call(http: HttpLike, url: string, init: Parameters<HttpLike>[1]): Promise<HttpResponse> {
  try {
    return await http(url, init);
  } catch {
    return fail(0);
  }
}

export async function tusUpload(x: TusUploadInput): Promise<'done' | 'stopped'> {
  const part = x.partBytes ?? TUS_PART_BYTES;
  const base = { ...x.target.headers, 'Tus-Resumable': TUS_VERSION };
  let { url, offset } = x.progress;
  // A saved URL off the endpoint's https origin is never asked: start a fresh upload instead.
  if (url && httpsOrigin(url) !== httpsOrigin(x.target.endpoint)) url = null;

  const create = async () => {
    const r = await call(x.http, x.target.endpoint, {
      method: 'POST',
      headers: {
        ...base,
        'Upload-Length': String(x.length),
        'Upload-Metadata': meta({ bucketName: x.bucket, objectName: x.objectPath, contentType: 'application/octet-stream', cacheControl: '3600' }),
        'x-upsert': 'true',
      },
    });
    const location = r.header('Location');
    if (r.status !== 201 || !location) fail(r.status);
    url = resolveLocation(location, x.target.endpoint);
    offset = 0;
    x.onProgress({ url, offset });
  };

  const askOffset = async (): Promise<boolean> => {
    const r = await call(x.http, url!, { method: 'HEAD', headers: base });
    if (r.status === 404 || r.status === 410) return false;
    const o = Number(r.header('Upload-Offset'));
    if (r.status < 200 || r.status >= 300 || !Number.isSafeInteger(o) || o < 0 || o > x.length) fail(r.status);
    offset = o;
    x.onProgress({ url, offset });
    return true;
  };

  if (!url) await create();
  else if (!(await askOffset())) await create();

  while (offset < x.length) {
    if (!x.keepGoing()) return 'stopped';
    const n = Math.min(part, x.length - offset);
    const body = x.readPart(offset, n);
    const r = await call(x.http, url!, {
      method: 'PATCH',
      headers: { ...base, 'Upload-Offset': String(offset), 'Content-Type': 'application/offset+octet-stream' },
      body,
    });
    if (r.status === 409) {
      if (!(await askOffset())) await create();
      continue;
    }
    if (r.status === 404 || r.status === 410) {
      await create();
      continue;
    }
    const o = Number(r.header('Upload-Offset'));
    if (r.status !== 204 || !Number.isSafeInteger(o) || o <= offset || o > x.length) fail(r.status);
    offset = o;
    x.onProgress({ url, offset });
  }
  return 'done';
}
