/**
 * Pack manifest, contract version 1 (ADR 0016, founder decision 15).
 *
 * A pack is data, never code: a speech model file, or versioned JSON
 * (text rules, filler and negation tables, punctuation profile, phonetic
 * tables, prompt text) that a generic engine already in the app interprets.
 * That keeps us inside App Store guideline 2.5.2.
 *
 * One manifest lists every pack the app may download. It is served as a
 * signed document (`SignedDocument<PackManifest>`, kind `pack-manifest`); the
 * app trusts a pack file only when its SHA-256 matches the entry here.
 *
 * Parsing is strict for the top level and lenient per entry: an entry the
 * app does not understand (a future `kind`, a bad field) is skipped and
 * counted, never fatal, so older apps keep working when the manifest grows.
 */
import * as v from 'valibot';
import {
  DocVersionSchema,
  HttpsUrlSchema,
  IsoTimestampSchema,
  LanguageTagSchema,
  SemverSchema,
  Sha256Schema,
} from './common';
import { satisfiesMin } from './semver';

export const PACK_MANIFEST_SCHEMA_VERSION = 1;

export const PACK_KINDS = ['speech-model', 'text-rules', 'prompts'] as const;
export type PackKind = (typeof PACK_KINDS)[number];

/** `text-rules.pt`, `speech-model.whisper-large-v3-turbo-q5_0`, `prompts.hi`. */
export const PACK_ID_RE = /^[a-z][a-z0-9-]{1,23}\.[a-z0-9][a-z0-9._-]{0,63}$/;
/** A plain file name: no path separators, no leading dot. */
export const PACK_FILE_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
/** 4 GB: the largest single file the app will accept. */
export const MAX_PACK_BYTES = 4_000_000_000;

export const PackEntrySchema = v.object({
  id: v.pipe(v.string(), v.regex(PACK_ID_RE)),
  kind: v.picklist(PACK_KINDS),
  /** BCP 47 tag of the language the pack serves, or `mul` for a multilingual model. */
  language: v.union([v.literal('mul'), LanguageTagSchema]),
  /** Integer, increases with every content change. Installed packs are replaced only by higher versions. */
  version: DocVersionSchema,
  /** Primary download URL (https). Versioned paths, served with `immutable` caching. */
  url: HttpsUrlSchema,
  /** Other hosts serving the identical bytes, tried in order when `url` fails. */
  mirrors: v.optional(v.pipe(v.array(HttpsUrlSchema), v.maxLength(3)), []),
  bytes: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(MAX_PACK_BYTES)),
  sha256: Sha256Schema,
  /** Installed file name, e.g. `ggml-large-v3-turbo-q5_0.bin` or `pt.rules.json`. */
  fileName: v.pipe(v.string(), v.regex(PACK_FILE_NAME_RE)),
  /** Oldest app version whose engine can read this pack. */
  minAppVersion: SemverSchema,
  /**
   * true: the app needs this pack to serve its language (text rules for a
   * language the author picked; the default speech model). It downloads when
   * the language is chosen and updates automatically.
   * false: optional (a larger model, extra tables); downloads only on request.
   */
  required: v.boolean(),
});
export type PackEntry = v.InferOutput<typeof PackEntrySchema>;

const PackManifestTopSchema = v.object({
  schemaVersion: v.literal(PACK_MANIFEST_SCHEMA_VERSION),
  /** Monotonic; the app refuses a manifest older than the last one it accepted (rollback protection). */
  version: DocVersionSchema,
  generatedAt: IsoTimestampSchema,
  packs: v.pipe(v.array(v.unknown()), v.maxLength(500)),
});

export interface PackManifest {
  schemaVersion: typeof PACK_MANIFEST_SCHEMA_VERSION;
  version: number;
  generatedAt: string;
  packs: PackEntry[];
}

export type ParseResult<T> = { ok: true; value: T; skipped: number } | { ok: false; reason: 'invalid' };

/** Validates a manifest payload (after its signature was checked). Never throws. */
export function parsePackManifest(payload: unknown): ParseResult<PackManifest> {
  const top = v.safeParse(PackManifestTopSchema, payload);
  if (!top.success) return { ok: false, reason: 'invalid' };
  const packs: PackEntry[] = [];
  let skipped = 0;
  const seen = new Set<string>();
  for (const raw of top.output.packs) {
    const entry = v.safeParse(PackEntrySchema, raw);
    if (!entry.success) {
      skipped++;
      continue;
    }
    // One entry per (id, version): a duplicate is a publishing bug; keep the first.
    const key = `${entry.output.id}@${entry.output.version}`;
    if (seen.has(key)) {
      skipped++;
      continue;
    }
    seen.add(key);
    packs.push(entry.output);
  }
  return {
    ok: true,
    value: { schemaVersion: PACK_MANIFEST_SCHEMA_VERSION, version: top.output.version, generatedAt: top.output.generatedAt, packs },
    skipped,
  };
}

/**
 * The entry this app version should install for `id`: the highest `version`
 * whose `minAppVersion` the app meets. A manifest may list several versions
 * of one pack so older apps keep a compatible one.
 */
export function resolvePack(manifest: PackManifest, id: string, appVersion: string): PackEntry | null {
  let best: PackEntry | null = null;
  for (const p of manifest.packs) {
    if (p.id !== id || !satisfiesMin(appVersion, p.minAppVersion)) continue;
    if (!best || p.version > best.version) best = p;
  }
  return best;
}

/** Every pack id this app version can install, resolved to its best entry. */
export function resolveAll(manifest: PackManifest, appVersion: string): PackEntry[] {
  const ids = [...new Set(manifest.packs.map((p) => p.id))].sort();
  return ids.map((id) => resolvePack(manifest, id, appVersion)).filter((p): p is PackEntry => p !== null);
}

/**
 * Required packs for a language the author just chose ("download when the
 * language is chosen", decision 15): the packs tagged with exactly that
 * language and `required: true` (its text rules and prompts). Choosing
 * Portuguese fetches Portuguese packs and nothing else.
 *
 * Multilingual (`mul`) and device-dependent packs, such as speech models,
 * are not included: their engine picks the right one for the language and
 * the phone's memory and asks for it by id (the app's `ensureLanguage` lets
 * an engine add those ids).
 */
export function requiredPacksForLanguage(manifest: PackManifest, language: string, appVersion: string): PackEntry[] {
  return resolveAll(manifest, appVersion).filter((p) => p.required && p.language === language);
}

/** Newest-first ordering helper for UI and tests. */
export function compareEntries(a: PackEntry, b: PackEntry): number {
  return a.id === b.id ? b.version - a.version : a.id < b.id ? -1 : 1;
}

