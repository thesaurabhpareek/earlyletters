/**
 * Upload of a release directory to any S3-compatible bucket (Cloudflare R2,
 * AWS S3, MinIO, ...) and a check of what the public host then serves
 * (docs/ops/PACKS_HOSTING.md). No SDK: AWS Signature Version 4 is a few
 * HMACs, and this keeps the scripts free of a dependency the app would never
 * use. Bodies are streamed from disk with an explicit Content-Length (what S3
 * and R2 require of a single PUT); the payload hash is the SHA-256 already in
 * release.json, so a file that changed since the build is refused before any
 * byte is sent.
 *
 * Rules that keep a bad upload from reaching a phone:
 *  - pack files go first and the manifest last (lib.ts `uploadOrder`);
 *  - an object that already exists at a versioned path is never overwritten:
 *    the same size means "already there" (skipped), a different size is an
 *    error, because immutable paths never change;
 *  - nothing is ever deleted: a rollback is a new manifest pointing at the
 *    previous versions.
 */
import { createHash, createHmac } from 'node:crypto';
import { createReadStream, readFileSync, statSync } from 'node:fs';
import * as http from 'node:http';
import * as https from 'node:https';
import { join } from 'node:path';
import { decideDocumentVersion, documentPayloadSha256, parsePackManifest, verifySignedDocument, type TrustedKey, type VersionDecision } from '../../packages/api/src/index';
import { RELEASE_DOCUMENTS, uploadOrder, type ReleaseFile, type ReleaseIndex } from './lib';
import { sha256File } from './release';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface S3Config {
  /** `https://<account-id>.r2.cloudflarestorage.com` (R2) or `https://s3.<region>.amazonaws.com` (S3). No bucket, no path. */
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** `auto` for R2; the bucket's region for S3. */
  region: string;
}

export const S3_ENV = {
  endpoint: 'PACKS_S3_ENDPOINT',
  bucket: 'PACKS_S3_BUCKET',
  accessKeyId: 'PACKS_S3_ACCESS_KEY_ID',
  secretAccessKey: 'PACKS_S3_SECRET_ACCESS_KEY',
  region: 'PACKS_S3_REGION',
} as const;

export function s3ConfigFromEnv(env: Record<string, string | undefined>): S3Config {
  const get = (k: keyof typeof S3_ENV) => (env[S3_ENV[k]] ?? '').trim();
  const missing = (['endpoint', 'bucket', 'accessKeyId', 'secretAccessKey'] as const).filter((k) => !get(k)).map((k) => S3_ENV[k]);
  if (missing.length) throw new Error(`missing ${missing.join(', ')} (docs/ops/PACKS_HOSTING.md, "Upload")`);
  const endpoint = get('endpoint').replace(/\/+$/, '');
  if (!/^https?:\/\/[^/\s]+$/.test(endpoint)) throw new Error(`${S3_ENV.endpoint} must be an origin such as https://<account-id>.r2.cloudflarestorage.com (no bucket, no path)`);
  if (!/^[a-z0-9][a-z0-9.-]{1,62}$/.test(get('bucket'))) throw new Error(`${S3_ENV.bucket} is not a valid bucket name`);
  return { endpoint, bucket: get('bucket'), accessKeyId: get('accessKeyId'), secretAccessKey: get('secretAccessKey'), region: get('region') || 'auto' };
}

// ---------------------------------------------------------------------------
// AWS Signature Version 4 (pure; s3.test.ts checks it against the AWS example)
// ---------------------------------------------------------------------------

const hex = (b: Buffer | Uint8Array) => Buffer.from(b).toString('hex');
const sha256 = (s: string | Uint8Array) => createHash('sha256').update(s).digest();
const hmac = (key: Buffer | string, s: string) => createHmac('sha256', key).update(s).digest();

export const EMPTY_SHA256 = hex(sha256(''));

/** RFC 3986 encoding, what S3 expects for each path segment (and query keys and values). */
export function encodeRfc3986(s: string): string {
  return encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

export function canonicalUri(key: string): string {
  return `/${key.split('/').map(encodeRfc3986).join('/')}`;
}

export interface SignInput {
  method: string;
  /** Canonical URI: absolute path, each segment RFC 3986 encoded once. */
  path: string;
  /** Canonical query string (already sorted and encoded), or ''. */
  query: string;
  /** Every header to sign, including `host` and `x-amz-date`. Names in any case. */
  headers: Record<string, string>;
  payloadSha256: string;
  /** `YYYYMMDDTHHMMSSZ`; must equal the x-amz-date header. */
  amzDate: string;
  region: string;
  service: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface Signature {
  authorization: string;
  signedHeaders: string;
  canonicalRequest: string;
  stringToSign: string;
  signature: string;
}

export function signV4(i: SignInput): Signature {
  const names = Object.keys(i.headers)
    .map((n) => n.toLowerCase())
    .sort();
  const values: Record<string, string> = {};
  for (const [n, v] of Object.entries(i.headers)) values[n.toLowerCase()] = v.trim().replace(/\s+/g, ' ');
  const canonicalHeaders = names.map((n) => `${n}:${values[n]}\n`).join('');
  const signedHeaders = names.join(';');
  const canonicalRequest = [i.method.toUpperCase(), i.path, i.query, canonicalHeaders, signedHeaders, i.payloadSha256].join('\n');
  const date = i.amzDate.slice(0, 8);
  const scope = `${date}/${i.region}/${i.service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', i.amzDate, scope, hex(sha256(canonicalRequest))].join('\n');
  const kSigning = hmac(hmac(hmac(hmac(`AWS4${i.secretAccessKey}`, date), i.region), i.service), 'aws4_request');
  const signature = hex(hmac(kSigning, stringToSign));
  return {
    authorization: `AWS4-HMAC-SHA256 Credential=${i.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    signedHeaders,
    canonicalRequest,
    stringToSign,
    signature,
  };
}

export function amzDate(now: Date): string {
  return now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export interface S3Response {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: Buffer;
}

export type Body = { file: string; size: number } | Buffer;

export interface TransportRequest {
  url: URL;
  method: string;
  headers: Record<string, string>;
  body?: Body;
}

export type Transport = (req: TransportRequest) => Promise<S3Response>;

/** Plain node:http(s) with an explicit Content-Length and a streamed file body. */
export const nodeTransport: Transport = (req) =>
  new Promise((resolve, reject) => {
    const mod = req.url.protocol === 'http:' ? http : https;
    const headers: Record<string, string> = { ...req.headers };
    if (req.body) headers['content-length'] = String(Buffer.isBuffer(req.body) ? req.body.length : req.body.size);
    else if (req.method === 'PUT') headers['content-length'] = '0';
    const r = mod.request(req.url, { method: req.method, headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) }));
      res.on('error', reject);
    });
    r.on('error', reject);
    if (!req.body) r.end();
    else if (Buffer.isBuffer(req.body)) r.end(req.body);
    else createReadStream(req.body.file).on('error', reject).pipe(r);
  });

export interface S3RequestOptions {
  headers?: Record<string, string>;
  body?: Body;
  payloadSha256: string;
  now?: () => Date;
  transport?: Transport;
}

/** One signed request for `key` in the configured bucket (path-style URL, works on R2 and S3). */
export async function s3Request(cfg: S3Config, method: 'PUT' | 'HEAD' | 'GET', key: string, o: S3RequestOptions): Promise<S3Response> {
  const url = new URL(`${cfg.endpoint}/${encodeRfc3986(cfg.bucket)}${canonicalUri(key)}`);
  const date = amzDate((o.now ?? (() => new Date()))());
  const headers: Record<string, string> = {
    ...Object.fromEntries(Object.entries(o.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v])),
    host: url.host,
    'x-amz-content-sha256': o.payloadSha256,
    'x-amz-date': date,
  };
  const sig = signV4({ method, path: url.pathname, query: '', headers, payloadSha256: o.payloadSha256, amzDate: date, region: cfg.region, service: 's3', accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey });
  return (o.transport ?? nodeTransport)({ url, method, headers: { ...headers, authorization: sig.authorization }, body: o.body });
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export interface UploadOptions {
  dryRun?: boolean;
  log?: (line: string) => void;
  transport?: Transport;
  now?: () => Date;
}

export interface UploadSummary {
  uploaded: string[];
  skipped: string[];
  bytesSent: number;
}

function explain(res: S3Response): string {
  const text = res.body.toString('utf8').replace(/\s+/g, ' ').slice(0, 300);
  return `HTTP ${res.status}${text ? `: ${text}` : ''}`;
}

/** User metadata every pack object is uploaded with (S3 and R2 return `x-amz-meta-*` on HEAD). */
export const META_SHA256 = 'x-amz-meta-sha256';

function md5File(path: string): Promise<string> {
  return new Promise((res, rej) => {
    const h = createHash('md5');
    createReadStream(path)
      .on('data', (c) => h.update(c))
      .on('error', rej)
      .on('end', () => res(h.digest('hex')));
  });
}

/**
 * Whether the object a HEAD describes is exactly this release file. Size
 * first; then the SHA-256 metadata this script writes; else, for an object
 * uploaded by another tool (wrangler, rclone, the dashboard) in one part, its
 * ETag, which S3 and R2 set to the MD5 of the bytes. An object that proves
 * neither is treated as different: an upload never guesses.
 */
export async function sameObject(head: S3Response, f: ReleaseFile, local: string): Promise<{ ok: boolean; why: string }> {
  const remote = Number(head.headers['content-length'] ?? -1);
  if (remote !== f.bytes) return { ok: false, why: `${remote} bytes on the host, ${f.bytes} in this release` };
  const meta = head.headers[META_SHA256];
  if (typeof meta === 'string' && meta) return meta === f.sha256 ? { ok: true, why: 'same SHA-256' } : { ok: false, why: `SHA-256 ${meta.slice(0, 12)}... on the host` };
  const etag = String(head.headers.etag ?? '').replace(/"/g, '');
  if (/^[0-9a-f]{32}$/.test(etag)) return etag === (await md5File(local)) ? { ok: true, why: 'same MD5 (ETag)' } : { ok: false, why: `MD5 ${etag.slice(0, 12)}... on the host` };
  return { ok: false, why: 'same size, but the host gives no hash to compare' };
}

/** Version and payload hash of a signed document's JSON text, or null when it is not one. */
export function documentIdentity(text: string): { version: number; payloadSha256: string } | null {
  try {
    const payload = (JSON.parse(text) as { payload?: { version?: unknown } }).payload;
    const version = payload?.version;
    if (typeof version !== 'number' || !Number.isInteger(version)) return null;
    return { version, payloadSha256: documentPayloadSha256(payload) };
  } catch {
    return null;
  }
}

/**
 * What a phone that already has the live document would do with this
 * release's copy (packages/api `decideDocumentVersion`, G-18): only `accept`
 * may be uploaded, `unchanged` needs no upload, and the other two would be
 * refused by every phone that has the live copy, so the upload stops.
 */
export function decideUpload(liveText: string | null, localText: string): VersionDecision {
  const local = documentIdentity(localText);
  if (!local) throw new Error('the release holds a document that is not a signed document');
  return decideDocumentVersion(liveText === null ? null : documentIdentity(liveText), local);
}

/**
 * Uploads every file of a release index that is not already at its path:
 * packs first, documents after, the manifest last. Checks each file against
 * the hash in release.json before sending it. Never overwrites a pack, never
 * deletes anything.
 */
export async function uploadRelease(dir: string, index: ReleaseIndex, cfg: S3Config, o: UploadOptions = {}): Promise<UploadSummary> {
  const log = o.log ?? (() => undefined);
  const summary: UploadSummary = { uploaded: [], skipped: [], bytesSent: 0 };
  const req = (method: 'PUT' | 'HEAD' | 'GET', key: string, opts: S3RequestOptions) => s3Request(cfg, method, key, { ...opts, transport: o.transport, now: o.now });
  for (const f of uploadOrder(index)) {
    const local = join(dir, f.path);
    let size: number;
    try {
      size = statSync(local).size;
    } catch {
      throw new Error(`${f.path}: missing from ${dir}`);
    }
    if (size !== f.bytes || (await sha256File(local)) !== f.sha256) throw new Error(`${f.path}: changed since release.json was written; rebuild the release`);
    if (f.kind === 'pack') {
      const head = o.dryRun ? null : await req('HEAD', f.path, { payloadSha256: EMPTY_SHA256 });
      if (head && head.status === 200) {
        const same = await sameObject(head, f, local);
        if (!same.ok) throw new Error(`${f.path}: already on the host with different bytes (${same.why}). Versioned paths never change: bump the pack version instead`);
        summary.skipped.push(f.path);
        log(`skip   ${f.path} (already on the host, ${same.why})`);
        continue;
      }
      if (head && head.status !== 404) throw new Error(`${f.path}: HEAD ${explain(head)}`);
    } else if (!o.dryRun) {
      // G-18: phones refuse a different document under a version they already hold, and an older one always.
      const live = await req('GET', f.path, { payloadSha256: EMPTY_SHA256 });
      if (live.status !== 200 && live.status !== 404) throw new Error(`${f.path}: GET ${explain(live)}`);
      const liveText = live.status === 200 ? live.body.toString('utf8') : null;
      const decision = decideUpload(liveText, readFileSync(local, 'utf8'));
      const liveVersion = liveText === null ? null : (documentIdentity(liveText)?.version ?? '?');
      if (decision === 'unchanged') {
        summary.skipped.push(f.path);
        log(`skip   ${f.path} (the host already serves this exact v${liveVersion})`);
        continue;
      }
      if (decision === 'rollback' || decision === 'same_version_conflict') {
        throw new Error(
          `${f.path}: the host already serves v${liveVersion}${decision === 'rollback' ? ', newer than' : ' with different content than'} this release's copy, so phones that have it would refuse this one (${decision}). ` +
            'Commit supabase/functions/*/published.ts after every release, then build the release again so its versions are higher. Nothing from this file on was uploaded.',
        );
      }
    }
    log(`${o.dryRun ? 'would put' : 'put   '} ${f.path} (${f.bytes} bytes, ${f.contentType}; ${f.cacheControl})`);
    if (!o.dryRun) {
      // The SHA-256 rides along as object metadata, so a later upload can prove an object is the same file (sameObject).
      const res = await req('PUT', f.path, { headers: { 'content-type': f.contentType, 'cache-control': f.cacheControl, [META_SHA256]: f.sha256 }, body: { file: local, size }, payloadSha256: f.sha256 });
      if (res.status !== 200) throw new Error(`${f.path}: PUT ${explain(res)}`);
    }
    summary.uploaded.push(f.path);
    summary.bytesSent += f.bytes;
  }
  return summary;
}

// ---------------------------------------------------------------------------
// What the public host serves (run after an upload, or any time)
// ---------------------------------------------------------------------------

/** Packs on our host at or below this size are downloaded whole by `checkHosted` and hashed (text packs, the voice detector). Upstream mirrors are pinned revisions and are not re-hashed. */
export const HASH_CHECK_MAX_BYTES = 5_000_000;

export interface HostedCheck {
  ok: boolean;
  lines: string[];
  manifestVersion: number | null;
  packs: { id: string; version: number; url: string; bytes: number; ok: boolean }[];
}

/**
 * Fetches the manifest from `baseUrl` exactly as a phone would, verifies its
 * signature against the keys the app ships, parses it, and checks that every
 * pack URL answers HEAD with the listed size and a Range request with 206;
 * packs of 5 MB or less are downloaded and hashed. Also verifies the remote
 * config and content bundle when present.
 */
export async function checkHosted(baseUrl: string, trusted: readonly TrustedKey[], fetchFn: typeof fetch = fetch): Promise<HostedCheck> {
  const base = baseUrl.replace(/\/+$/, '');
  const lines: string[] = [];
  const result: HostedCheck = { ok: true, lines, manifestVersion: null, packs: [] };
  const bad = (s: string) => {
    lines.push(`FAIL ${s}`);
    result.ok = false;
  };
  const good = (s: string) => lines.push(`ok   ${s}`);
  const warn = (s: string) => lines.push(`WARN ${s}`);

  async function document(kind: keyof typeof RELEASE_DOCUMENTS, required: boolean): Promise<unknown | null> {
    const url = `${base}/${RELEASE_DOCUMENTS[kind].path}${kind === 'content-bundle' ? '?locale=en' : ''}`;
    let res: Response;
    try {
      res = await fetchFn(url, { headers: { accept: 'application/json' } });
    } catch (e) {
      (required ? bad : warn)(`${kind}: ${url} unreachable (${(e as Error).message})`);
      return null;
    }
    if (res.status !== 200) {
      (required ? bad : warn)(`${kind}: ${url} answered HTTP ${res.status}`);
      return null;
    }
    const type = res.headers.get('content-type') ?? '';
    if (!/json/.test(type)) warn(`${kind}: Content-Type is "${type}", expected application/json (set it when uploading)`);
    if (!res.headers.get('etag')) warn(`${kind}: no ETag header; phones will re-download it each time instead of getting 304`);
    const text = await res.text();
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      bad(`${kind}: not JSON`);
      return null;
    }
    const verified = verifySignedDocument(raw, kind, trusted);
    if (!verified.ok) {
      bad(`${kind}: signature check failed (${verified.reason}); the app would ignore it. Trusted key ids: ${trusted.map((k) => k.keyId).join(', ') || 'none'}`);
      return null;
    }
    good(`${kind}: signed by ${verified.doc.keyId}, ${text.length} bytes, Cache-Control "${res.headers.get('cache-control') ?? ''}"`);
    return verified.doc.payload;
  }

  const payload = await document('pack-manifest', true);
  await document('remote-config', false);
  await document('content-bundle', false);
  if (payload === null) return result;
  const parsed = parsePackManifest(payload);
  if (!parsed.ok) {
    bad('pack-manifest: payload does not match the PackManifest schema');
    return result;
  }
  if (parsed.skipped) warn(`pack-manifest: ${parsed.skipped} entries the app would skip`);
  result.manifestVersion = parsed.value.version;
  good(`pack-manifest v${parsed.value.version}: ${parsed.value.packs.length} packs`);
  for (const p of parsed.value.packs) {
    let ok = true;
    try {
      const head = await fetchFn(p.url, { method: 'HEAD' });
      const len = Number(head.headers.get('content-length') ?? -1);
      if (head.status !== 200) {
        bad(`${p.id} v${p.version}: HEAD ${p.url} answered HTTP ${head.status}`);
        ok = false;
      } else if (len !== p.bytes) {
        bad(`${p.id} v${p.version}: ${p.url} has ${len} bytes, manifest says ${p.bytes}`);
        ok = false;
      } else {
        const range = await fetchFn(p.url, { headers: { range: 'bytes=0-15' } });
        await range.arrayBuffer().catch(() => undefined);
        // Small packs are fetched whole and hashed, as a phone does: a wrong file of the right size is caught here, not on a phone.
        let hashed = '';
        if (p.bytes <= HASH_CHECK_MAX_BYTES && p.url.startsWith(`${base}/`)) {
          const whole = await fetchFn(p.url);
          const digest = createHash('sha256').update(Buffer.from(await whole.arrayBuffer())).digest('hex');
          if (digest !== p.sha256) {
            bad(`${p.id} v${p.version}: ${p.url} serves bytes whose SHA-256 is not the manifest's; phones would refuse it (hash_mismatch)`);
            ok = false;
          } else hashed = ', SHA-256 matches';
        }
        if (!ok) {
          // reported above
        } else if (range.status === 206) good(`${p.id} v${p.version}: ${p.bytes} bytes${hashed}, Range supported (${new URL(p.url).host})`);
        else warn(`${p.id} v${p.version}: ${p.bytes} bytes${hashed}, but the host ignores Range (HTTP ${range.status}); downloads work but cannot resume`);
      }
    } catch (e) {
      bad(`${p.id} v${p.version}: ${p.url} unreachable (${(e as Error).message})`);
      ok = false;
    }
    result.packs.push({ id: p.id, version: p.version, url: p.url, bytes: p.bytes, ok });
  }
  return result;
}

/** The `release.json` next to the files, for the upload step. */
export function readReleaseIndex(dir: string): ReleaseIndex {
  const text = readFileSync(join(dir, 'release.json'), 'utf8');
  const v = JSON.parse(text) as ReleaseIndex;
  if (v?.schemaVersion !== 1) throw new Error(`${dir}/release.json is not a release index`);
  return v;
}

export type { ReleaseFile };
