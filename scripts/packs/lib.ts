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

export const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable';

// ---------------------------------------------------------------------------
// Signing key
// ---------------------------------------------------------------------------

export interface SigningKey {
  secret: Uint8Array;
  keyId: string;
}

/**
 * Reads the signing key from the environment: `EL_SIGNING_KEY` (32-byte
 * Ed25519 seed, standard base64) and `EL_SIGNING_KEY_ID`. Refuses a key the
 * app does not trust, so nothing can be published that phones would reject.
 */
export function readSigningKey(env: Record<string, string | undefined>, trusted: readonly TrustedKey[]): SigningKey {
  const raw = env.EL_SIGNING_KEY?.trim();
  const keyId = env.EL_SIGNING_KEY_ID?.trim();
  if (!raw || !keyId) throw new Error('EL_SIGNING_KEY and EL_SIGNING_KEY_ID must be set (see docs/adr/0016, "Signing key").');
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

/** Paths in `given` that the parsed value does not keep exactly (unknown keys, or values replaced by a fallback). */
function ignoredPaths(given: unknown, kept: unknown, path = '$'): string[] {
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
