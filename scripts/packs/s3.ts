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
import { createReadStream, readFileSync, realpathSync, statSync } from 'node:fs';
import * as http from 'node:http';
import * as https from 'node:https';
import { join, resolve, sep } from 'node:path';
import {
  decideDocumentVersion,
  documentPayloadSha256,
  parseContentBundle,
  parsePackManifest,
  parseRemoteConfig,
  verifySignedDocument,
  type DocumentKind,
  type PackEntry,
  type TrustedKey,
  type VersionDecision,
} from '../../packages/api/src/index';
import { DOCUMENT_CACHE, IMMUTABLE_CACHE, ignoredPaths, parseReleaseIndex, RELEASE_DOCUMENTS, uploadOrder, type ReleaseFile, type ReleaseIndex } from './lib';
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
  // Signed requests and bodies never travel in clear; plain http only to this computer (the tests' fake bucket).
  if (endpoint.startsWith('http://') && !/^http:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(endpoint)) throw new Error(`${S3_ENV.endpoint} must use https (plain http is accepted only for 127.0.0.1 and localhost)`);
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
  /** The keys the app ships (packages/api keys.ts): the three documents must verify against them before anything is sent. */
  trusted: readonly TrustedKey[];
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
 * What an upload may send, bound to the signed manifest instead of the
 * unsigned release.json (review A of #162 at 122d4d8, N1). The three documents
 * must verify against `trusted`, and the only packs sent are the manifest's
 * entries on the release's base URL, at the path of their signed URL, with the
 * signed size and SHA-256. release.json only supplies headers: an entry the
 * manifest does not list, a manifest entry the release does not hold, a path
 * with `.` or `..` segments and a file that resolves outside the release
 * folder are all refused. Reads local files only: no network, no credentials.
 */
export function planUpload(dir: string, index: ReleaseIndex, trusted: readonly TrustedKey[]): ReleaseFile[] {
  const root = realpathSync(resolve(dir));
  const local = (path: string): string => {
    if (!path || path.startsWith('/') || path.includes('\\') || path.split('/').some((s) => s === '' || s === '.' || s === '..')) throw new Error(`release.json: refused path ${JSON.stringify(path)}`);
    const full = resolve(root, path);
    let real: string;
    try {
      real = realpathSync(full);
    } catch {
      throw new Error(`${path}: missing from ${dir}`);
    }
    if (!real.startsWith(root + sep)) throw new Error(`${path}: resolves outside the release folder; nothing was sent`);
    return real;
  };
  const payloads: Partial<Record<DocumentKind, unknown>> = {};
  for (const kind of ['pack-manifest', 'remote-config', 'content-bundle'] as const) {
    const path = RELEASE_DOCUMENTS[kind].path;
    const f = index.files.find((x) => x.path === path);
    if (!f || f.kind !== 'document' || f.document !== kind) throw new Error(`release.json does not list the ${kind} at ${path}; rebuild the release`);
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(local(path), 'utf8'));
    } catch (e) {
      throw new Error(`${path}: ${(e as Error).message.startsWith(path) ? (e as Error).message : 'not JSON'}`);
    }
    const v = verifySignedDocument(raw, kind, trusted);
    if (!v.ok) throw new Error(`${path}: this release's ${kind} does not verify against packages/api/src/keys.ts (${v.reason}); nothing was sent`);
    payloads[kind] = v.doc.payload;
  }
  const manifest = parsePackManifest(payloads['pack-manifest']);
  if (!manifest.ok) throw new Error('the signed pack manifest does not parse as the app parses it; nothing was sent');
  const base = index.baseUrl.replace(/\/+$/, '');
  const onOurHost = new Map<string, PackEntry>();
  for (const p of manifest.value.packs) if (p.url.startsWith(`${base}/`)) onOurHost.set(p.url.slice(base.length + 1), p);
  const plan: ReleaseFile[] = [];
  const seen = new Set<string>();
  for (const f of index.files) {
    if (seen.has(f.path)) throw new Error(`release.json lists ${f.path} twice`);
    seen.add(f.path);
    local(f.path);
    if (f.kind === 'document') {
      if (!f.document || RELEASE_DOCUMENTS[f.document]?.path !== f.path) throw new Error(`release.json: ${f.path} is not where a signed document lives`);
      plan.push(f);
      continue;
    }
    const entry = onOurHost.get(f.path);
    if (!entry) throw new Error(`release.json lists ${f.path}, which the signed manifest does not place on ${base}; nothing was sent`);
    if (entry.bytes !== f.bytes || entry.sha256 !== f.sha256) throw new Error(`${f.path}: release.json and the signed manifest disagree on its size or SHA-256; nothing was sent`);
    plan.push(f);
  }
  const missing = [...onOurHost.keys()].filter((k) => !seen.has(k));
  if (missing.length) throw new Error(`the signed manifest places ${missing.join(', ')} on ${base}, but this release does not hold them; nothing was sent`);
  return plan;
}

/**
 * Uploads every file of a release that is not already at its path: packs
 * first, documents after, the manifest last. Before any request, the files
 * are bound to the signed manifest (`planUpload`) and checked against the
 * hashes in release.json; before the first PUT, every document is checked
 * against the live one (G-18), so a refused release writes nothing. Never
 * overwrites a pack, never deletes anything.
 */
export async function uploadRelease(dir: string, index: ReleaseIndex, cfg: S3Config, o: UploadOptions): Promise<UploadSummary> {
  const log = o.log ?? (() => undefined);
  const summary: UploadSummary = { uploaded: [], skipped: [], bytesSent: 0 };
  const req = (method: 'PUT' | 'HEAD' | 'GET', key: string, opts: S3RequestOptions) => s3Request(cfg, method, key, { ...opts, transport: o.transport, now: o.now });
  const files = uploadOrder({ ...index, files: planUpload(dir, index, o.trusted) });
  const sizes = new Map<string, number>();
  for (const f of files) {
    const local = join(dir, f.path);
    const size = statSync(local).size;
    if (size !== f.bytes || (await sha256File(local)) !== f.sha256) throw new Error(`${f.path}: changed since release.json was written; rebuild the release`);
    sizes.set(f.path, size);
  }
  // G-18 for all three documents before the first write (review A N2): phones refuse a different
  // document under a version they already hold, and an older one always.
  const decisions = new Map<string, VersionDecision>();
  if (!o.dryRun) {
    for (const f of files.filter((x) => x.kind === 'document')) {
      const live = await req('GET', f.path, { payloadSha256: EMPTY_SHA256 });
      if (live.status !== 200 && live.status !== 404) throw new Error(`${f.path}: GET ${explain(live)}`);
      const liveText = live.status === 200 ? live.body.toString('utf8') : null;
      const decision = decideUpload(liveText, readFileSync(join(dir, f.path), 'utf8'));
      if (decision === 'rollback' || decision === 'same_version_conflict') {
        const liveVersion = liveText === null ? null : (documentIdentity(liveText)?.version ?? '?');
        throw new Error(
          `${f.path}: the host already serves v${liveVersion}${decision === 'rollback' ? ', newer than' : ' with different content than'} this release's copy, so phones that have it would refuse this one (${decision}). ` +
            'Commit supabase/functions/*/published.ts after every release, then build the release again so its versions are higher. Nothing was uploaded.',
        );
      }
      decisions.set(f.path, decision);
    }
  }
  for (const f of files) {
    const local = join(dir, f.path);
    const size = sizes.get(f.path) as number;
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
    } else if (decisions.get(f.path) === 'unchanged') {
      summary.skipped.push(f.path);
      log(`skip   ${f.path} (the host already serves this exact v${documentIdentity(readFileSync(local, 'utf8'))?.version ?? '?'})`);
      continue;
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
 * Fetches each signed document from `baseUrl` exactly as a phone would and
 * accepts it only as the app does (apps/mobile/src/lib/remote): signature
 * against the keys the app ships, then the kind's own parser
 * (`parsePackManifest`, `parseRemoteConfig`, `parseContentBundle`); a payload
 * the app would drop fails here too, and values the app would ignore or
 * replace, and entries or blocks it would skip, are warned about. With
 * `committed` (the versions in supabase/functions/*\/published.ts), a live
 * version below or above the committed one is warned about (rollback
 * protection). Then every pack URL must answer HEAD with the listed size and
 * a Range request with 206; packs of 5 MB or less on our host are downloaded
 * and hashed; each mirror is checked for its size.
 */
export async function checkHosted(
  baseUrl: string,
  trusted: readonly TrustedKey[],
  fetchFn: typeof fetch = fetch,
  committed: Partial<Record<DocumentKind, number>> = {},
): Promise<HostedCheck> {
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
    const cacheControl = res.headers.get('cache-control') ?? '';
    // A cached signed document delays kill switches (LEGAL-REQ-040), so anything but a revalidate-every-time header fails (review B of #162, B7).
    if (!/\b(no-cache|no-store)\b|\bmax-age=0\b/i.test(cacheControl)) bad(`${kind}: Cache-Control is "${cacheControl}", expected "${DOCUMENT_CACHE}"; a cached copy delays kill switches. Set it when uploading (upload does).`);
    else good(`${kind}: signed by ${verified.doc.keyId}, ${text.length} bytes, Cache-Control "${cacheControl}"`);
    return verified.doc.payload;
  }

  /** The live version against the one committed in published.ts (what phones may already hold). */
  const compareVersion = (kind: DocumentKind, live: number) => {
    const c = committed[kind];
    if (!c) return;
    // Any difference fails (review B of #162, B7): "every check passed" must mean the host serves what git says was published.
    if (live < c) bad(`${kind}: the host serves v${live}, but published.ts says v${c} was published. A phone that has v${c} refuses v${live} as a rollback; upload the latest release.`);
    else if (live > c) bad(`${kind}: the host serves v${live}, newer than published.ts (v${c}). Commit supabase/functions/*/published.ts, or the next release reuses a version and upload refuses it.`);
  };

  const payload = await document('pack-manifest', true);

  // Remote config and content bundle: parsed exactly as the app parses them (apps/mobile/src/lib/remote/index.ts).
  const configPayload = await document('remote-config', false);
  if (configPayload !== null) {
    const r = parseRemoteConfig(configPayload);
    if (!r.ok) bad('remote-config: the payload does not match the RemoteConfig schema; the app drops it and keeps its bundled defaults (kill switches included)');
    else {
      const ignored = ignoredPaths(configPayload, r.value);
      if (ignored.length) warn(`remote-config: the app ignores or replaces with its defaults: ${ignored.join(', ')}`);
      good(`remote-config v${r.value.version}: kill switches on: ${Object.entries(r.value.killSwitches).filter(([, v]) => v).map(([k]) => k).join(', ') || 'none'}`);
      compareVersion('remote-config', r.value.version);
    }
  }
  const contentPayload = await document('content-bundle', false);
  if (contentPayload !== null) {
    const r = parseContentBundle(contentPayload);
    if (!r.ok) bad('content-bundle: the payload does not match the ContentBundle schema; the app drops it and shows its packaged copy');
    else {
      if (r.skipped) warn(`content-bundle: ${r.skipped} blocks the app would skip (unknown type, bad fields or a content rule); those slots fall back to the packaged copy`);
      good(`content-bundle v${r.value.version}: ${r.value.blocks.length} blocks, locale ${r.value.locale}`);
      compareVersion('content-bundle', r.value.version);
    }
  }

  if (payload === null) return result;
  const parsed = parsePackManifest(payload);
  if (!parsed.ok) {
    bad('pack-manifest: payload does not match the PackManifest schema');
    return result;
  }
  if (parsed.skipped) warn(`pack-manifest: ${parsed.skipped} entries the app would skip`);
  result.manifestVersion = parsed.value.version;
  good(`pack-manifest v${parsed.value.version}: ${parsed.value.packs.length} packs`);
  compareVersion('pack-manifest', parsed.value.version);
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
        const packCache = head.headers.get('cache-control') ?? '';
        if (p.url.startsWith(`${base}/`) && !/\bimmutable\b/i.test(packCache)) warn(`${p.id} v${p.version}: Cache-Control is "${packCache}", expected "${IMMUTABLE_CACHE}"; phones and the CDN will revalidate a file that never changes`);
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
    // Mirrors are the fallback a phone tries when the primary fails: each must serve the same size.
    for (const m of p.mirrors) {
      try {
        const head = await fetchFn(m, { method: 'HEAD' });
        const len = Number(head.headers.get('content-length') ?? -1);
        if (head.status !== 200) warn(`${p.id} v${p.version}: mirror ${m} answered HTTP ${head.status}`);
        else if (len !== p.bytes) warn(`${p.id} v${p.version}: mirror ${m} has ${len} bytes, manifest says ${p.bytes}`);
        else good(`${p.id} v${p.version}: mirror ${new URL(m).host} has ${p.bytes} bytes`);
      } catch (e) {
        warn(`${p.id} v${p.version}: mirror ${m} unreachable (${(e as Error).message})`);
      }
    }
    result.packs.push({ id: p.id, version: p.version, url: p.url, bytes: p.bytes, ok });
  }
  return result;
}

/** The `release.json` next to the files, for the upload step. */
export function readReleaseIndex(dir: string): ReleaseIndex {
  return parseReleaseIndex(readFileSync(join(dir, 'release.json'), 'utf8'));
}

export type { ReleaseFile };
