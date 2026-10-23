/**
 * Pack and document publishing, pure parts (ADR 0016). Tested by lib.test.ts;
 * the CLI is publish.ts. Nothing here touches the network.
 *
 * Outputs:
 *  - text-rules packs from the language agent's sources (packs/text-rules/<lang>.json),
 *    validated by @scribe/core `validatePackJson`, minified, hashed;
 *  - the pack manifest (text packs plus the hosted speech models from the
 *    speech catalog), signed;
 *  - the remote config from scripts/packs/remote-config.json, signed;
 *  - the English content bundle from packages/content (prompts, story cards)
 *    plus optional extra blocks (scripts/packs/content-extra.en.json), signed;
 *  - the `published.ts` modules the config and content Edge Functions serve.
 */
import {
  base64ToBytes,
  canonicalJson,
  ENDPOINTS,
  parseContentBundle,
  parsePackManifest,
  parseRemoteConfig,
  publicKeyFor,
  sha256Hex,
  signDocument,
  utf8ToBytes,
  verifySignedDocument,
  type ContentBundle,
  type DocumentKind,
  type PackEntry,
  type PackManifest,
  type RemoteConfig,
  type SignedDocument,
  type TrustedKey,
} from '../../packages/api/src/index';
import { validatePackJson, LANGUAGE_CODES, type LanguageCode } from '../../packages/core/src/lang/index';
import type { Prompt } from '../../packages/core/src/prompts';
import { SPEECH_MODELS, type SpeechModel } from '../../apps/mobile/src/lib/models/catalog';

export const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable';
/** Signed documents change in place, so phones and the CDN must revalidate every time (the signature, not the cache, is the trust). */
export const DOCUMENT_CACHE = 'no-cache';

// ---------------------------------------------------------------------------
// Signing key
// ---------------------------------------------------------------------------

export interface SigningKey {
  secret: Uint8Array;
  keyId: string;
}

/**
 * The two lines `scripts/packs/keygen.mjs` prints for the password manager
 * (`EL_SIGNING_KEY_ID=...`, `EL_SIGNING_KEY=...`), read back from a file the
 * founder keeps outside the repo (`--key-file`). Blank lines, `#` comments,
 * an `export ` prefix and quotes around the value are allowed.
 */
export function parseKeyFile(text: string): { EL_SIGNING_KEY?: string; EL_SIGNING_KEY_ID?: string } {
  const out: { EL_SIGNING_KEY?: string; EL_SIGNING_KEY_ID?: string } = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim().replace(/^export\s+/, '');
    if (!line || line.startsWith('#')) continue;
    const m = /^(EL_SIGNING_KEY_ID|EL_SIGNING_KEY)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    out[m[1] as 'EL_SIGNING_KEY' | 'EL_SIGNING_KEY_ID'] = m[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
}

/**
 * Reads the signing key from the environment: `EL_SIGNING_KEY` (32-byte
 * Ed25519 seed, standard base64) and `EL_SIGNING_KEY_ID`. Refuses a key the
 * app does not trust, so nothing can be published that phones would reject.
 */
export function readSigningKey(env: Record<string, string | undefined>, trusted: readonly TrustedKey[]): SigningKey {
  const raw = env.EL_SIGNING_KEY?.trim();
  const keyId = env.EL_SIGNING_KEY_ID?.trim();
  if (!raw || !keyId) throw new Error('EL_SIGNING_KEY and EL_SIGNING_KEY_ID must be set, or pass --key-file (docs/ops/PACKS_HOSTING.md, "Signing key").');
  const secret = base64ToBytes(raw);
  if (!secret || secret.length !== 32) throw new Error('EL_SIGNING_KEY is not a 32-byte base64 Ed25519 seed.');
  const pub = publicKeyFor(secret);
  const match = trusted.find((k) => k.keyId === keyId);
  if (!match) throw new Error(`Key id ${keyId} is not in packages/api/src/keys.ts; phones would reject the documents.`);
  if (match.publicKey !== pub) throw new Error(`EL_SIGNING_KEY does not match the public key for ${keyId} in packages/api/src/keys.ts.`);
  return { secret, keyId };
}

export function sign<T>(kind: DocumentKind, payload: T, key: SigningKey, trusted: readonly TrustedKey[]): { doc: SignedDocument<T>; text: string } {
  const doc = signDocument(kind, payload, key.secret, key.keyId);
  // Exactly the bytes the function will serve; checked the way a phone checks them.
  const text = JSON.stringify(doc);
  const check = verifySignedDocument(JSON.parse(text), kind, trusted);
  if (!check.ok) throw new Error(`self-check failed: ${check.reason}`);
  return { doc, text };
}

// ---------------------------------------------------------------------------
// Text-rules packs
// ---------------------------------------------------------------------------

/** "1.2.3" -> 1002003: the manifest's integer version, ordered like the pack's semver. */
export function packVersionNumber(semver: string): number {
  const m = /^(\d{1,4})\.(\d{1,3})\.(\d{1,3})$/.exec(semver);
  if (!m) throw new Error(`pack version ${semver} must be major.minor.patch with minor and patch under 1000`);
  const n = Number(m[1]) * 1_000_000 + Number(m[2]) * 1_000 + Number(m[3]);
  if (n < 1) throw new Error('pack version must be at least 0.0.1');
  return n;
}

export interface BuiltFile {
  entry: PackEntry;
  bytes: Uint8Array;
  /** Object key on the pack host: `<id>/<version>/<fileName>`. */
  objectKey: string;
  contentType: string;
}

export function objectKey(id: string, version: number, fileName: string): string {
  return `${id}/${version}/${fileName}`;
}

export interface BuildOptions {
  baseUrl: string;
  minAppVersion: string;
}

/** One text-rules pack from its source JSON. English is bundled in the app and is never built here. */
export function buildTextRulesPack(language: string, sourceText: string, opts: BuildOptions): BuiltFile {
  if (!(LANGUAGE_CODES as readonly string[]).includes(language)) throw new Error(`${language} is not a v1.0 language`);
  if (language === 'en') throw new Error('English ships in the app (decision 15); it is not a downloadable pack');
  const v = validatePackJson(sourceText, { expectLanguage: language as LanguageCode });
  if (!v.ok) throw new Error(`packs/text-rules/${language}.json is not valid: ${v.errors.slice(0, 5).join('; ')}`);
  const json = JSON.parse(sourceText) as { version: string };
  // Minified with sorted keys: the same source always gives the same bytes and hash.
  const bytes = utf8ToBytes(canonicalJson(json));
  const id = `text-rules.${language}`;
  const version = packVersionNumber(json.version);
  const fileName = `${language}.rules.json`;
  const key = objectKey(id, version, fileName);
  return {
    entry: {
      id,
      kind: 'text-rules',
      language,
      version,
      url: `${opts.baseUrl.replace(/\/+$/, '')}/${key}`,
      mirrors: [],
      bytes: bytes.length,
      sha256: sha256Hex(bytes),
      fileName,
      minAppVersion: opts.minAppVersion,
      required: true,
    },
    bytes,
    objectKey: key,
    contentType: 'application/json',
  };
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export function buildManifest(entries: readonly PackEntry[], version: number, generatedAt: string): PackManifest {
  const payload = { schemaVersion: 1, version, generatedAt, packs: entries };
  const r = parsePackManifest(JSON.parse(JSON.stringify(payload)));
  if (!r.ok) throw new Error('manifest does not match the PackManifest schema');
  if (r.skipped > 0) throw new Error(`${r.skipped} manifest entries do not match the schema; fix them before publishing`);
  return r.value;
}

export function buildRemoteConfig(source: unknown, version: number, generatedAt: string): RemoteConfig {
  const body = { ...(source as Record<string, unknown>), schemaVersion: 1, version, generatedAt };
  const r = parseRemoteConfig(body);
  if (!r.ok) throw new Error('remote-config.json does not match the RemoteConfig schema');
  // Strict on publish: the app tolerates a bad value by falling back, the publisher does not.
  const bad = ignoredPaths(body, r.value);
  if (bad.length) throw new Error(`remote-config.json has unknown keys or values the app would ignore (${bad.join(', ')}); fix them`);
  return r.value;
}

/** Paths in `given` that the parsed value does not keep exactly (unknown keys, or values replaced by a fallback). Also used by `verify` (s3.ts). */
export function ignoredPaths(given: unknown, kept: unknown, path = '$'): string[] {
  if (given && typeof given === 'object' && !Array.isArray(given)) {
    if (!kept || typeof kept !== 'object') return [path];
    return Object.entries(given as Record<string, unknown>).flatMap(([k, v]) =>
      k in (kept as Record<string, unknown>) ? ignoredPaths(v, (kept as Record<string, unknown>)[k], `${path}.${k}`) : [`${path}.${k}`],
    );
  }
  return canonicalJson(given) === canonicalJson(kept) ? [] : [path];
}

export interface StorySource {
  id: string;
  order: number;
  headline: string;
  line: string;
  visual: string;
}

/**
 * Kill switches that the server also enforces, and how:
 *  - `invites`, `statusReport`: the main project's `KILL_SWITCHES` function
 *    secret (same names as remote config), read by invite-redeem and
 *    subscription-status;
 *  - `backupUploads`: the database setting `app.backup_enabled` (S05 PR #151;
 *    uploads and key storage raise SCBKO while it is off);
 *  - `escrow`: the database setting `app.escrow_enabled` and the escrow
 *    project's own secret `ESCROW_SWITCH` (the function runs only while it is
 *    `on`), so restores stop without any phone (F08 6.5 C9).
 */
export const SERVER_ENFORCED_KILL_SWITCHES = ['invites', 'statusReport', 'backupUploads', 'escrow'] as const;

/**
 * The manual steps that make a signed kill-switch state hold on the server
 * as well, and the reminder that a copy more than 7 days old cannot clear a
 * switch on a phone that sees it late (F19-REQ-008): after clearing one,
 * publish config again weekly until active phones have refreshed.
 */
export function killSwitchSteps(killSwitches: Record<string, boolean>): string[] {
  const on = Object.entries(killSwitches).filter(([, v]) => v).map(([k]) => k).sort();
  const fnSwitches = on.filter((k) => k === 'invites' || k === 'statusReport');
  const onOff = (k: string) => (on.includes(k) ? 'off' : 'on');
  const steps = [
    'Server-side switches, main project (function secrets apply to the next invocation):',
    fnSwitches.length ? `  npx supabase secrets set KILL_SWITCHES=${fnSwitches.join(',')}` : '  npx supabase secrets unset KILL_SWITCHES',
    `  alter database postgres set app.backup_enabled = '${onOff('backupUploads')}';`,
    `  alter database postgres set app.escrow_enabled = '${onOff('escrow')}';`,
    'Escrow project (scribe-escrow):',
    `  npx supabase secrets set ESCROW_SWITCH=${onOff('escrow')} --project-ref <scribe-escrow ref>`,
  ];
  steps.push(on.length ? `Switches on: ${on.join(', ')}.` : 'No switch is on.');
  steps.push('If this publish clears a switch: a config more than 7 days old cannot clear a switch on a phone that first sees it late (F19-REQ-008), so run "publish.ts config" again each week for 4 weeks.');
  return steps;
}

export function buildContentBundle(
  input: { prompts: readonly Prompt[]; stories: readonly StorySource[]; extraBlocks?: readonly unknown[] },
  version: number,
  generatedAt: string,
): ContentBundle {
  const blocks: unknown[] = [
    ...input.prompts.filter((p) => !p.retired).map((p) => ({ type: 'prompt', id: p.key, text: p.text, band: p.band, kind: p.kind })),
    ...input.stories.map((s) => ({ type: 'story', id: s.id, order: s.order, headline: s.headline, line: s.line, visual: s.visual })),
    ...(input.extraBlocks ?? []),
  ];
  const r = parseContentBundle({ schemaVersion: 1, version, generatedAt, locale: 'en', blocks });
  if (!r.ok) throw new Error('content bundle does not match the ContentBundle schema');
  if (r.skipped > 0) throw new Error(`${r.skipped} content blocks do not match the schema or the content rules`);
  return r.value;
}

// ---------------------------------------------------------------------------
// published.ts modules
// ---------------------------------------------------------------------------

const HEADER = (what: string) => `/**
 * ${what}
 *
 * GENERATED by \`npx tsx scripts/packs/publish.ts\` (ADR 0016). Do not edit by
 * hand: each value is the exact JSON text of a SignedDocument, signed offline
 * with the founder's key.
 */
`;

export function configModule(remoteConfig: string | null, packManifest: string | null): string {
  return `${HEADER('Published signed documents served by the `config` function.')}export const REMOTE_CONFIG: string | null = ${JSON.stringify(remoteConfig)};
export const PACK_MANIFEST: string | null = ${JSON.stringify(packManifest)};
`;
}

export function contentModule(bundles: Record<string, string>): string {
  const sorted = Object.fromEntries(Object.entries(bundles).sort(([a], [b]) => (a < b ? -1 : 1)));
  return `${HEADER('Published signed content bundles served by the `content` function, by locale.')}export const CONTENT_BUNDLES: Readonly<Record<string, string>> = ${JSON.stringify(sorted, null, 2)};
`;
}

/** Reads one `export const NAME ... = <json literal>;` back out of a generated module. */
export function readPublished(moduleText: string, name: string): unknown {
  const m = new RegExp(`export const ${name}[^=]*= ([\\s\\S]*?);\\n`).exec(moduleText);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

/** The payload version of a previously published document text, or 0. */
export function publishedVersion(docText: unknown): number {
  if (typeof docText !== 'string') return 0;
  try {
    const v = (JSON.parse(docText) as { payload?: { version?: unknown } }).payload?.version;
    return typeof v === 'number' && Number.isInteger(v) ? v : 0;
  } catch {
    return 0;
  }
}

/** Upload commands for the pack host (printed, never run: uploads are a manual step). */
export function uploadCommands(files: readonly BuiltFile[], bucket: string): string[] {
  return files.map((f) =>
    f.bytes.length <= 300_000_000
      ? `npx wrangler r2 object put ${bucket}/${f.objectKey} --file dist/packs/${f.objectKey} --content-type ${f.contentType} --cache-control "${IMMUTABLE_CACHE}" --remote`
      : `rclone copyto dist/packs/${f.objectKey} r2:${bucket}/${f.objectKey} --header-upload "Cache-Control: ${IMMUTABLE_CACHE}"`,
  );
}

// ---------------------------------------------------------------------------
// Signed documents on the static pack host (D-097)

export interface DocumentObject {
  objectKey: string;
  text: string;
}

/**
 * The signed documents at the object keys the app requests from
 * EXPO_PUBLIC_DOCS_BASE_URL (packages/api ENDPOINTS paths without the leading
 * slash). The query string (`?locale=en`) is not part of an R2 object key.
 */
export function documentObjects(docs: { remoteConfig: string | null; packManifest: string | null; contentEn: string | null }): DocumentObject[] {
  const key = (path: string) => path.replace(/^\/+/, '');
  const out: DocumentObject[] = [];
  if (docs.remoteConfig) out.push({ objectKey: key(ENDPOINTS.remoteConfig.path), text: docs.remoteConfig });
  if (docs.packManifest) out.push({ objectKey: key(ENDPOINTS.packManifest.path), text: docs.packManifest });
  if (docs.contentEn) out.push({ objectKey: key(ENDPOINTS.contentBundle.path), text: docs.contentEn });
  return out;
}

export function documentUploadCommands(docs: readonly DocumentObject[], bucket: string): string[] {
  return docs.map(
    (d) => `npx wrangler r2 object put ${bucket}/${d.objectKey} --file dist/packs/${d.objectKey} --content-type application/json --cache-control "${DOCUMENT_CACHE}" --remote`,
  );
}

// ---------------------------------------------------------------------------
// Static release directory (docs/ops/PACKS_HOSTING.md)
// ---------------------------------------------------------------------------

/**
 * Where each signed document lives on a static host, so that
 * `EXPO_PUBLIC_DOCS_BASE_URL` + the path the app already requests
 * (`ENDPOINTS` in packages/api) is a plain file. Same keys as
 * `documentObjects` above (one rule for `all` and `release`), served with
 * `DOCUMENT_CACHE`: a document changes in place, so every cache revalidates.
 */
export const RELEASE_DOCUMENTS = Object.fromEntries(
  // documentObjects returns the text it is given; given each kind as its text, it maps kind -> object key.
  documentObjects({ remoteConfig: 'remote-config', packManifest: 'pack-manifest', contentEn: 'content-bundle' }).map((o) => [o.text, { path: o.objectKey, cacheControl: DOCUMENT_CACHE }]),
) as Readonly<Record<DocumentKind, { path: string; cacheControl: string }>>;

export const DOCUMENT_CONTENT_TYPE = 'application/json; charset=utf-8';
export const MODEL_CONTENT_TYPE = 'application/octet-stream';

/** 'download': fetch upstream models into the release and serve them from our host, upstream as mirror. 'upstream': leave them on their pinned upstream URLs (today's manifest). */
export type ModelMode = 'download' | 'upstream';

export interface SpeechFilePlan {
  model: SpeechModel;
  /** Object key on our host: `<id>/<version>/<fileName>` for upstream builds, the catalog's own path for files we built. */
  objectKey: string;
  /** Pinned upstream URL the bytes can be fetched from, or null for a file we built (supplied with --models-dir). */
  upstreamUrl: string | null;
}

/**
 * The speech models a release may carry: every `default` model that is hosted
 * today, plus any self-built one named in `include` (the founder's explicit
 * choice: ADR 0015 asks counsel about those weights before they are uploaded).
 */
export function speechFilePlan(baseUrl: string, catalog: Record<string, SpeechModel> = SPEECH_MODELS, include: readonly string[] = []): SpeechFilePlan[] {
  const base = baseUrl.replace(/\/+$/, '');
  const out: SpeechFilePlan[] = [];
  for (const model of Object.values(catalog)) {
    if (model.status !== 'default') continue;
    const upstream = model.build === 'upstream';
    if (!model.hosted && !include.includes(model.id)) continue;
    if (!upstream && !include.includes(model.id)) continue;
    const objectKey = upstream ? objectKey3(model.id, model.version, model.fileName) : pathOf(model.url, base);
    out.push({ model, objectKey, upstreamUrl: upstream ? model.url : null });
  }
  const unknown = include.filter((id) => !catalog[id]);
  if (unknown.length) throw new Error(`--include-model names models that are not in the catalog: ${unknown.join(', ')}`);
  return out;
}

function objectKey3(id: string, version: number, fileName: string): string {
  return objectKey(id, version, fileName);
}

/** The path of a URL on our host, as an object key (no leading slash). A URL on another host keeps its full path. */
function pathOf(url: string, base: string): string {
  const path = url.startsWith(`${base}/`) ? url.slice(base.length + 1) : url.replace(/^https?:\/\/[^/]+\//, '');
  if (!path || path.includes('..')) throw new Error(`cannot derive an object key from ${url}`);
  return path;
}

/** The manifest entry for a speech model served from our host (upstream kept as a mirror) or from its upstream URL. */
export function speechEntry(plan: SpeechFilePlan, baseUrl: string, minAppVersion: string, hostedByUs: boolean): PackEntry {
  const m = plan.model;
  const base = baseUrl.replace(/\/+$/, '');
  if (!hostedByUs && !plan.upstreamUrl) throw new Error(`${m.id} is a file we built; it must be in the release (--models-dir) to be listed`);
  return {
    id: m.id,
    kind: m.kind,
    language: m.language,
    version: m.version,
    url: hostedByUs ? `${base}/${plan.objectKey}` : (plan.upstreamUrl as string),
    mirrors: hostedByUs && plan.upstreamUrl ? [plan.upstreamUrl] : [],
    bytes: m.bytes,
    sha256: m.sha256,
    fileName: m.fileName,
    minAppVersion,
    required: false,
  };
}

export interface ReleaseFile {
  /** Relative to the release directory and to the base URL. */
  path: string;
  kind: 'document' | 'pack';
  contentType: string;
  cacheControl: string;
  bytes: number;
  sha256: string;
  /** Packs: the manifest id and version. */
  id?: string;
  version?: number;
  /** Documents: which signed document. */
  document?: DocumentKind;
  /** built: made in this run. downloaded or copied: bytes fetched and checked against the catalog hash. */
  origin: 'built' | 'downloaded' | 'copied';
  source?: string;
}

export interface NotIncluded {
  id: string;
  version: number;
  url: string;
  bytes: number;
  sha256: string;
  reason: string;
}

/** `release.json`: what a release directory holds, so the upload step and a reviewer need nothing else. */
export interface ReleaseIndex {
  schemaVersion: 1;
  generatedAt: string;
  baseUrl: string;
  manifestVersion: number;
  files: ReleaseFile[];
  /** Manifest entries whose bytes are not in this directory: the app fetches them from the URL listed (upstream). Nothing to upload. */
  notIncluded: NotIncluded[];
}

export function parseReleaseIndex(text: string): ReleaseIndex {
  const v = JSON.parse(text) as ReleaseIndex;
  if (v?.schemaVersion !== 1 || !Array.isArray(v.files) || typeof v.baseUrl !== 'string') throw new Error('release.json is not a release index');
  for (const f of v.files) {
    if (typeof f.path !== 'string' || f.path.startsWith('/') || f.path.split('/').includes('..')) throw new Error(`release.json: bad path ${String(f.path)}`);
  }
  return v;
}

/**
 * Upload order: every pack file first (immutable paths), then the content
 * bundle and the remote config, and the manifest last, so a phone can never
 * read a manifest that points at a file not yet uploaded.
 */
export function uploadOrder(index: ReleaseIndex): ReleaseFile[] {
  const rank = (f: ReleaseFile) => (f.kind === 'pack' ? 0 : f.document === 'pack-manifest' ? 3 : f.document === 'remote-config' ? 2 : 1);
  return [...index.files].sort((a, b) => rank(a) - rank(b) || (a.path < b.path ? -1 : 1));
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB'];
/** Vercel's per-deployment static upload limit on the Hobby plan (vercel.com/docs/limits, read 15 Oct 2026). */
export const VERCEL_HOBBY_UPLOAD_BYTES = 100_000_000;

/**
 * `vercel.json` for serving a release directory as a static Vercel project
 * (docs/ops/PACKS_HOSTING.md, fallback): the same Content-Type and
 * Cache-Control per file that the bucket upload sets. Not listed in
 * release.json, so it is never uploaded to the bucket.
 */
export function vercelConfig(index: ReleaseIndex): { $schema: string; cleanUrls: false; trailingSlash: false; headers: { source: string; headers: { key: string; value: string }[] }[] } {
  return {
    $schema: 'https://openapi.vercel.sh/vercel.json',
    cleanUrls: false,
    trailingSlash: false,
    headers: [...index.files]
      .sort((a, b) => (a.path < b.path ? -1 : 1))
      .map((f) => ({
        source: `/${f.path}`,
        headers: [
          { key: 'Content-Type', value: f.contentType },
          { key: 'Cache-Control', value: f.cacheControl },
        ],
      })),
  };
}

export function humanBytes(n: number): string {
  let i = 0;
  let v = n;
  while (v >= 1000 && i < BYTE_UNITS.length - 1) {
    v /= 1000;
    i++;
  }
  return `${i === 0 ? v : v.toFixed(v >= 100 ? 0 : 1)} ${BYTE_UNITS[i]}`;
}
