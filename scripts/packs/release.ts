/**
 * The static release directory (docs/ops/PACKS_HOSTING.md): every file a pack
 * host must serve, built by `npx tsx scripts/packs/publish.ts release`.
 *
 *   <out>/functions/v1/config/v1/packs            signed pack manifest   (the path the app requests under EXPO_PUBLIC_DOCS_BASE_URL)
 *   <out>/functions/v1/config/v1/remote-config    signed remote config
 *   <out>/functions/v1/content/v1/bundle          signed English content bundle
 *   <out>/text-rules.<lang>/<version>/<lang>.rules.json
 *   <out>/speech-model.<name>/<version>/<file>    model bytes, fetched from the pinned upstream URL and checked against the catalog hash
 *   <out>/release.json                            the index (lib.ts `ReleaseIndex`): what is here, sizes, hashes, headers to serve
 *
 * Pure parts (manifest, signing, paths) are in lib.ts. This file holds the IO
 * with an injectable `fetch` and clock, so release.test.ts can build a release
 * with a throwaway key, serve it with `serveRelease` and drive the app's own
 * clients at it. Nothing here reads or prints a secret.
 */
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import * as http from 'node:http';
import * as https from 'node:https';
import type { AddressInfo } from 'node:net';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { utf8ToBytes, sha256Hex, type PackEntry, type PackManifest, type TrustedKey } from '../../packages/api/src/index';
import type { Prompt } from '../../packages/core/src/prompts';
import type { SpeechModel } from '../../apps/mobile/src/lib/models/catalog';
import {
  buildContentBundle,
  buildManifest,
  buildRemoteConfig,
  buildTextRulesPack,
  checkLanguages,
  DEFAULT_RELEASE_LANGUAGES,
  DOCUMENT_CONTENT_TYPE,
  IMMUTABLE_CACHE,
  MODEL_CONTENT_TYPE,
  RELEASE_DOCUMENTS,
  sign,
  speechEntry,
  speechFilePlan,
  type ModelMode,
  type NotIncluded,
  type ReleaseFile,
  type ReleaseIndex,
  type SigningKey,
  type StorySource,
  vercelConfig,
} from './lib';

export const RELEASE_INDEX_FILE = 'release.json';
export const VERCEL_CONFIG_FILE = 'vercel.json';

export interface BuildReleaseOptions {
  /** Repo root (packs/text-rules is read from here). */
  root: string;
  out: string;
  baseUrl: string;
  minAppVersion: string;
  key: SigningKey;
  trusted: readonly TrustedKey[];
  models: ModelMode;
  /** A folder of model files by catalog file name, copied in (checked against the catalog hash) before anything is downloaded. */
  modelsDir?: string | null;
  /** Spoken languages to serve (`--languages`); English only when omitted (DEFAULT_RELEASE_LANGUAGES). Another language's text pack and model are carried only when named here. */
  languages?: readonly string[];
  /** Self-built models (catalog `hosted: false`) to list once their file is in `modelsDir`. Never implied. */
  includeModels?: readonly string[];
  /** The speech catalog; tests pass a small fake. */
  catalog?: Record<string, SpeechModel>;
  /** Versions of the documents published before, so every new one is higher (rollback protection on the phone). */
  previous: { manifest: number; config: number; content: number };
  content: { prompts: readonly Prompt[]; stories: readonly StorySource[]; extraBlocks?: readonly unknown[] };
  remoteConfigSource: unknown;
  /** Fail the build when a model cannot be downloaded instead of listing its upstream URL. */
  strictModels?: boolean;
  fetch?: typeof fetch;
  now?: () => Date;
  log?: (line: string) => void;
}

export interface BuiltRelease {
  index: ReleaseIndex;
  manifest: PackManifest;
  /** Exact JSON text of each signed document, as written to the release and to supabase/functions/*\/published.ts. */
  documents: Record<'pack-manifest' | 'remote-config' | 'content-bundle', string>;
}

export function sha256File(path: string): Promise<string> {
  return new Promise((res, rej) => {
    const h = createHash('sha256');
    createReadStream(path)
      .on('data', (c) => h.update(c))
      .on('error', rej)
      .on('end', () => res(h.digest('hex')));
  });
}

function sizeOf(path: string): number | null {
  try {
    const s = statSync(path);
    return s.isFile() ? s.size : null;
  } catch {
    return null;
  }
}

/** Every file under `dir`, as paths relative to it with `/` separators. */
function filesUnder(dir: string, prefix = ''): string[] {
  return readdirSync(join(dir, prefix), { withFileTypes: true }).flatMap((e) => {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    return e.isDirectory() ? filesUnder(dir, rel) : [rel];
  });
}

function writeFile(path: string, bytes: Uint8Array | string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes);
}

export interface Expected {
  bytes: number;
  sha256: string;
}

/** Removes `dir` and its parents up to (not including) `stop` while they are empty, so a failed download leaves no empty folders for a static host to serve. A kept `.part` file stops it. */
function removeEmptyDirs(dir: string, stop: string): void {
  for (let d = dir; d.startsWith(stop + sep) && d !== stop; d = dirname(d)) {
    try {
      if (readdirSync(d).length) return;
      rmdirSync(d);
    } catch {
      return;
    }
  }
}

/** True when `path` holds exactly the expected bytes. */
export async function fileMatches(path: string, expect: Expected): Promise<boolean> {
  return sizeOf(path) === expect.bytes && (await sha256File(path)) === expect.sha256;
}

/**
 * Fetches `url` into `dest`, resuming a `.part` file with a Range request,
 * then checks size and SHA-256 against the catalog. A mismatch deletes the
 * file and throws: nothing unverified is ever left in a release.
 */
export async function fetchVerified(url: string, dest: string, expect: Expected, fetchFn: typeof fetch = fetch, log: (s: string) => void = () => undefined): Promise<'present' | 'downloaded'> {
  if (await fileMatches(dest, expect)) return 'present';
  mkdirSync(dirname(dest), { recursive: true });
  const part = `${dest}.part`;
  let have = sizeOf(part) ?? 0;
  if (have >= expect.bytes) {
    rmSync(part, { force: true });
    have = 0;
  }
  const headers: Record<string, string> = { 'accept-encoding': 'identity' };
  if (have > 0) headers.range = `bytes=${have}-`;
  let res: Response;
  try {
    res = await fetchFn(url, { headers, redirect: 'follow' });
  } catch (e) {
    // undici says only "fetch failed"; the cause names the real problem (DNS, TLS, a proxy refusing the host).
    const cause = (e as { cause?: { code?: string; message?: string } }).cause;
    throw new Error(`${url}: ${(e as Error).message}${cause ? ` (${[cause.code, cause.message].filter(Boolean).join(': ')})` : ''}`);
  }
  if (!(res.status === 200 || (res.status === 206 && have > 0)) || !res.body) {
    await res.arrayBuffer().catch(() => undefined);
    throw new Error(`${url}: HTTP ${res.status}`);
  }
  const resume = res.status === 206;
  log(`${resume ? 'resuming' : 'downloading'} ${url} (${resume ? `${have} of ${expect.bytes}` : `${expect.bytes}`} bytes)`);
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(part, { flags: resume ? 'a' : 'w' }));
  if (sizeOf(part) !== expect.bytes) {
    throw new Error(`${url}: got ${sizeOf(part) ?? 0} bytes, expected ${expect.bytes} (the partial file is kept; run again to resume)`);
  }
  const digest = await sha256File(part);
  if (digest !== expect.sha256) {
    rmSync(part, { force: true });
    throw new Error(`${url}: SHA-256 ${digest} does not match the catalog (${expect.sha256}); the file was deleted`);
  }
  rmSync(dest, { force: true });
  renameSync(part, dest);
  return 'downloaded';
}

/** Copies a local file into the release after checking it against the catalog. */
export async function copyVerified(from: string, dest: string, expect: Expected): Promise<void> {
  if (!(await fileMatches(from, expect))) throw new Error(`${from}: size or SHA-256 does not match the catalog; not copied`);
  mkdirSync(dirname(dest), { recursive: true });
  const tmp = `${dest}.part`;
  await pipeline(createReadStream(from), createWriteStream(tmp));
  rmSync(dest, { force: true });
  renameSync(tmp, dest);
}

export async function buildRelease(o: BuildReleaseOptions): Promise<BuiltRelease> {
  const log = o.log ?? (() => undefined);
  const fetchFn = o.fetch ?? fetch;
  const nowIso = (o.now ?? (() => new Date()))().toISOString();
  const baseUrl = o.baseUrl.replace(/\/+$/, '');
  const out = resolve(o.out);
  const languages = checkLanguages(o.languages ?? DEFAULT_RELEASE_LANGUAGES);
  mkdirSync(out, { recursive: true });
  const files: ReleaseFile[] = [];
  const notIncluded: NotIncluded[] = [];
  const entries: PackEntry[] = [];

  // 1. Text-rules packs: every language source the allowlist names, except English (bundled, decision 15).
  const rulesDir = join(o.root, 'packs/text-rules');
  const sources = existsSync(rulesDir) ? readdirSync(rulesDir).filter((f) => /^[a-z]{2}\.json$/.test(f) && f !== 'en.json' && (languages as readonly string[]).includes(f.slice(0, 2))) : [];
  for (const file of sources.sort()) {
    const b = buildTextRulesPack(file.slice(0, 2), readFileSync(join(rulesDir, file), 'utf8'), { baseUrl, minAppVersion: o.minAppVersion });
    writeFile(join(out, b.objectKey), b.bytes);
    files.push({ path: b.objectKey, kind: 'pack', id: b.entry.id, version: b.entry.version, contentType: b.contentType, cacheControl: IMMUTABLE_CACHE, bytes: b.entry.bytes, sha256: b.entry.sha256, origin: 'built' });
    entries.push(b.entry);
    log(`text pack ${b.entry.id} v${b.entry.version}: ${b.entry.bytes} bytes`);
  }

  // 2. Speech models: copied from --models-dir, else downloaded from the pinned upstream, else left on upstream.
  const plans = speechFilePlan(baseUrl, o.catalog, o.includeModels ?? [], languages);
  for (const plan of plans) {
    const m = plan.model;
    const dest = join(out, plan.objectKey);
    const expect = { bytes: m.bytes, sha256: m.sha256 };
    const local = o.modelsDir ? join(o.modelsDir, m.fileName) : null;
    let origin: ReleaseFile['origin'] | null = null;
    let source = plan.upstreamUrl ?? local ?? '';
    // The mode decides (review B of #162, B6): an upstream release never takes an upstream model from the out folder,
    // so a file left by an earlier download run cannot move the model onto our host. A model we built has no upstream.
    const reuse = o.models === 'download' || !plan.upstreamUrl;
    try {
      if (reuse && (await fileMatches(dest, expect))) {
        origin = 'copied';
        source = dest;
        log(`model ${m.id}: already in the release, verified`);
      } else if (local && existsSync(local)) {
        await copyVerified(local, dest, expect);
        origin = 'copied';
        source = local;
        log(`model ${m.id}: copied from ${local}, verified`);
      } else if (o.models === 'download' && plan.upstreamUrl) {
        await fetchVerified(plan.upstreamUrl, dest, expect, fetchFn, log);
        origin = 'downloaded';
        log(`model ${m.id}: downloaded, verified (${m.bytes} bytes)`);
      } else if (!plan.upstreamUrl) {
        throw new Error(`${m.id} is a file we built: put ${m.fileName} in --models-dir (ADR 0015 recipe) to include it`);
      }
    } catch (e) {
      removeEmptyDirs(dirname(dest), out);
      if (o.strictModels || !plan.upstreamUrl) throw e;
      log(`WARN ${m.id}: ${(e as Error).message}; the manifest lists its upstream URL instead`);
    }
    if (origin) {
      files.push({ path: plan.objectKey, kind: 'pack', id: m.id, version: m.version, contentType: MODEL_CONTENT_TYPE, cacheControl: IMMUTABLE_CACHE, bytes: m.bytes, sha256: m.sha256, origin, source });
      entries.push(speechEntry(plan, baseUrl, o.minAppVersion, true));
    } else {
      const entry = speechEntry(plan, baseUrl, o.minAppVersion, false);
      entries.push(entry);
      notIncluded.push({ id: m.id, version: m.version, url: entry.url, bytes: m.bytes, sha256: m.sha256, reason: o.models === 'upstream' ? 'served from its pinned upstream URL (--models upstream)' : 'not downloaded here; served from its pinned upstream URL' });
    }
  }

  // An out folder holding files this release does not include (an earlier run with other --models or --languages) is
  // refused before any document is written: a static host such as the Vercel fallback serves the folder as it is.
  const expected = new Set<string>([
    ...files.map((f) => f.path),
    ...plans.map((p) => `${p.objectKey}.part`),
    ...Object.values(RELEASE_DOCUMENTS).map((d) => d.path),
    RELEASE_INDEX_FILE,
    VERCEL_CONFIG_FILE,
  ]);
  const stale = filesUnder(out).filter((p) => !expected.has(p));
  if (stale.length) {
    throw new Error(
      `${out} holds ${stale.length} file(s) this release does not include, left by an earlier run with other --models or --languages: ${stale.slice(0, 3).join(', ')}${stale.length > 3 ? ` and ${stale.length - 3} more` : ''}. Use an empty --out, or delete them.`,
    );
  }

  // 3. Signed documents, each one version higher than the last published.
  const manifest = buildManifest(entries, o.previous.manifest + 1, nowIso);
  const config = buildRemoteConfig(o.remoteConfigSource, o.previous.config + 1, nowIso);
  const bundle = buildContentBundle(o.content, o.previous.content + 1, nowIso);
  const documents = {
    'pack-manifest': sign('pack-manifest', manifest, o.key, o.trusted).text,
    'remote-config': sign('remote-config', config, o.key, o.trusted).text,
    'content-bundle': sign('content-bundle', bundle, o.key, o.trusted).text,
  } as const;
  for (const kind of ['pack-manifest', 'remote-config', 'content-bundle'] as const) {
    const text = documents[kind];
    const bytes = utf8ToBytes(text);
    writeFile(join(out, RELEASE_DOCUMENTS[kind].path), bytes);
    files.push({ path: RELEASE_DOCUMENTS[kind].path, kind: 'document', document: kind, contentType: DOCUMENT_CONTENT_TYPE, cacheControl: RELEASE_DOCUMENTS[kind].cacheControl, bytes: bytes.length, sha256: sha256Hex(bytes), origin: 'built' });
  }
  log(`manifest v${manifest.version}: ${entries.length} packs (${notIncluded.length} on upstream); remote config v${config.version}; content bundle v${bundle.version}`);
  log(`languages: ${languages.join(', ')} (English is bundled in the app, so it has no text pack; mul speech models serve every language)`);

  const index: ReleaseIndex = { schemaVersion: 1, generatedAt: nowIso, baseUrl, manifestVersion: manifest.version, languages, files, notIncluded };
  writeFile(join(out, RELEASE_INDEX_FILE), `${JSON.stringify(index, null, 2)}\n`);
  // For the static-host fallback (a Vercel project serving this directory as is); never uploaded to the bucket.
  writeFile(join(out, VERCEL_CONFIG_FILE), `${JSON.stringify(vercelConfig(index), null, 2)}\n`);
  return { index, manifest, documents };
}

// ---------------------------------------------------------------------------
// A local static server for a release directory (preview and tests)
// ---------------------------------------------------------------------------

const EXT_TYPES: Record<string, string> = { '.json': 'application/json', '.bin': MODEL_CONTENT_TYPE };

/**
 * CORS for the web build only (a browser preflights the app's x-request-id
 * and x-app-version headers; the iOS app does not use CORS). The same
 * answer the `config` function gives (`access-control-allow-origin: *`).
 */
export const RELEASE_CORS: Readonly<Record<string, string>> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, HEAD',
  'access-control-allow-headers': 'accept, if-none-match, range, x-request-id, x-app-version',
  'access-control-expose-headers': 'etag, content-length, content-range',
  'access-control-max-age': '86400',
};

/**
 * Serves a release directory the way a bucket behind a CDN does: files at
 * their paths, the query string ignored, Content-Type and Cache-Control from
 * release.json, a strong ETag with 304 on If-None-Match, HEAD, single Range
 * requests (206) and CORS for the web build. Binds to 127.0.0.1; with `tls`
 * it serves https (the app accepts an https base URL only).
 */
export async function serveRelease(dir: string, opts: { port?: number; tls?: { key: string | Buffer; cert: string | Buffer } } = {}): Promise<{ url: string; port: number; close: () => Promise<void> }> {
  const root = resolve(dir);
  const indexPath = join(root, RELEASE_INDEX_FILE);
  const byPath = new Map<string, ReleaseFile>();
  if (existsSync(indexPath)) {
    for (const f of (JSON.parse(readFileSync(indexPath, 'utf8')) as ReleaseIndex).files) byPath.set(f.path, f);
  }
  const handler: http.RequestListener = (req, res) => {
    const method = req.method ?? 'GET';
    for (const [k, v] of Object.entries(RELEASE_CORS)) res.setHeader(k, v);
    if (method === 'OPTIONS') {
      res.writeHead(204).end();
      return;
    }
    if (method !== 'GET' && method !== 'HEAD') {
      res.writeHead(405).end();
      return;
    }
    const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname).replace(/^\/+/, '');
    const file = normalize(join(root, pathname));
    if (!file.startsWith(root + sep) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain', 'cache-control': 'no-store' }).end(method === 'HEAD' ? undefined : 'not found');
      return;
    }
    const meta = byPath.get(pathname);
    const size = statSync(file).size;
    const etag = meta ? `"sha256-${meta.sha256.slice(0, 32)}"` : `"size-${size}"`;
    const headers: Record<string, string> = {
      'content-type': meta?.contentType ?? EXT_TYPES[extname(file)] ?? 'application/octet-stream',
      'cache-control': meta?.cacheControl ?? 'no-store',
      'accept-ranges': 'bytes',
      etag,
    };
    const inm = req.headers['if-none-match'];
    if (inm && inm.split(',').some((t) => t.trim().replace(/^W\//, '') === etag)) {
      res.writeHead(304, headers).end();
      return;
    }
    let start = 0;
    let end = size - 1;
    let status = 200;
    const m = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range ?? '');
    if (m) {
      start = Number(m[1]);
      end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
      if (start >= size || start > end) {
        res.writeHead(416, { 'content-range': `bytes */${size}` }).end();
        return;
      }
      status = 206;
      headers['content-range'] = `bytes ${start}-${end}/${size}`;
    }
    headers['content-length'] = String(end - start + 1);
    res.writeHead(status, headers);
    if (method === 'HEAD' || size === 0) {
      res.end();
      return;
    }
    createReadStream(file, { start, end }).pipe(res);
  };
  const server = opts.tls ? https.createServer({ key: opts.tls.key, cert: opts.tls.cert }, handler) : http.createServer(handler);
  await new Promise<void>((ok, fail) => server.once('error', fail).listen(opts.port ?? 0, '127.0.0.1', () => ok()));
  const port = (server.address() as AddressInfo).port;
  return { url: `${opts.tls ? 'https' : 'http'}://127.0.0.1:${port}`, port, close: () => new Promise((ok) => server.close(() => ok())) };
}
