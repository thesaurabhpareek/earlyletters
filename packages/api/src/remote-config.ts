/**
 * Remote config, contract version 1 (ADR 0016, founder decision 16; TDD 01
 * 3.9). Served as a signed document (kind `remote-config`).
 *
 * The vocabulary is closed on purpose. What remote config can never do is
 * enforced by there being no key for it:
 *  - nothing can turn off recording, typing, saving, reading, playback or
 *    export (LEGAL-REQ-040, -050): kill switches only ever stop
 *    server-dependent features;
 *  - nothing changes what data is collected (no analytics or consent keys)
 *    or the paywall's look, prices or copy (decision 16);
 *  - nothing reveals a feature App Review has not seen (guideline 2.3.1):
 *    flags select between reviewed variants only.
 *
 * Parsing never rejects a whole document for one bad value: each key falls
 * back to its bundled default (`DEFAULT_REMOTE_CONFIG`), and unknown keys are
 * ignored, so a newer server never breaks an older app.
 */
import * as v from 'valibot';
import { DocVersionSchema, IsoTimestampSchema, SemverSchema } from './common';

export const REMOTE_CONFIG_SCHEMA_VERSION = 1;

/** The allowance App Review sees; remote config may raise it, never lower it. */
export const BUNDLED_READ_TOGETHER_FREE_SESSIONS = 3;
export const MAX_READ_TOGETHER_FREE_SESSIONS = 50;

/**
 * Free letters per account (D-082): the allowance App Review sees. Remote config may raise
 * it, never lower it. Mirrors DEFAULT_FREE_LETTERS and MAX_FREE_LETTERS in packages/core
 * (packages/api does not import core; a test pins the two together in the mobile app).
 */
export const BUNDLED_FREE_LETTERS = 2;
export const MAX_FREE_LETTERS = 100;

export const INTRO_VARIANTS = ['four', 'three', 'none'] as const;
export type IntroVariant = (typeof INTRO_VARIANTS)[number];

/**
 * The Family tab while co-parent sharing is not in the build (v1.0): the full
 * "coming soon" teaser, or a quiet version without the teaser copy. Both are in
 * the reviewed build. This key can only quiet copy: whether sign-in, sync or
 * sharing exist is a build-time switch the server cannot reach
 * (apps/mobile/src/lib/capabilities.ts).
 */
export const FAMILY_TEASER_VARIANTS = ['coming_soon', 'quiet'] as const;
export type FamilyTeaserVariant = (typeof FAMILY_TEASER_VARIANTS)[number];

/** Kill switches: `true` means the feature is stopped. Each one only stops a server-dependent feature. */
export const KILL_SWITCH_KEYS = [
  /** Upload and download of letters. Local writing and reading continue. */
  'sync',
  /** Creating and redeeming co-parent invites. */
  'invites',
  /** Photo upload and signed photo URLs. */
  'photos',
  /** New pack downloads (installed packs keep working). */
  'packDownloads',
  /** Server content blocks (the packaged copy is used instead). */
  'serverContent',
] as const;
export type KillSwitchKey = (typeof KILL_SWITCH_KEYS)[number];

const bool = (d: boolean) => v.fallback(v.boolean(), d);

const KillSwitchesSchema = v.fallback(
  v.object({
    sync: bool(false),
    invites: bool(false),
    photos: bool(false),
    packDownloads: bool(false),
    serverContent: bool(false),
  }),
  { sync: false, invites: false, photos: false, packDownloads: false, serverContent: false },
);

const FlagsSchema = v.fallback(
  v.object({
    /** A-REQ-011: four intro stories, three (story 3 omitted), or none (story 4 panel directly). */
    introVariant: v.fallback(v.picklist(INTRO_VARIANTS), 'four'),
    /** C-REQ-009 vs DATA_CLASSIFICATION open issue 4: off until product and counsel decide (TDD 01 X-6). */
    lockScreenNamesDefault: bool(false),
    /** Family tab teaser while co-parent sharing is coming (founder, 3 Oct 2026). */
    familyTeaser: v.fallback(v.picklist(FAMILY_TEASER_VARIANTS), 'coming_soon'),
  }),
  { introVariant: 'four', lockScreenNamesDefault: false, familyTeaser: 'coming_soon' },
);

export const RemoteConfigSchema = v.object({
  schemaVersion: v.literal(REMOTE_CONFIG_SCHEMA_VERSION),
  /** Monotonic; the app ignores a config older than the last one it accepted. */
  version: DocVersionSchema,
  generatedAt: IsoTimestampSchema,
  /** Below this, the app shows a gentle update card. It never blocks local use. */
  minSupportedVersion: v.fallback(SemverSchema, '0.0.0'),
  readTogetherFreeSessions: v.fallback(
    v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(MAX_READ_TOGETHER_FREE_SESSIONS)),
    BUNDLED_READ_TOGETHER_FREE_SESSIONS,
  ),
  /** Free letters per account before Plus (D-082). Only ever raises the reviewed 2. */
  freeLettersAllowance: v.fallback(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(MAX_FREE_LETTERS)), BUNDLED_FREE_LETTERS),
  /** Bumping it signs every device out once (LEGAL-REQ-040, session revocation). */
  forceReauthEpoch: v.fallback(v.pipe(v.number(), v.integer(), v.minValue(0)), 0),
  flags: FlagsSchema,
  killSwitches: KillSwitchesSchema,
});
export type RemoteConfig = v.InferOutput<typeof RemoteConfigSchema>;

/** What the app uses when it has never fetched a config, or every fetch failed. Version 0 loses to any served config. */
export const DEFAULT_REMOTE_CONFIG: RemoteConfig = {
  schemaVersion: REMOTE_CONFIG_SCHEMA_VERSION,
  version: 0,
  generatedAt: '1970-01-01T00:00:00.000Z',
  minSupportedVersion: '0.0.0',
  readTogetherFreeSessions: BUNDLED_READ_TOGETHER_FREE_SESSIONS,
  freeLettersAllowance: BUNDLED_FREE_LETTERS,
  forceReauthEpoch: 0,
  flags: { introVariant: 'four', lockScreenNamesDefault: false, familyTeaser: 'coming_soon' },
  killSwitches: { sync: false, invites: false, photos: false, packDownloads: false, serverContent: false },
};

/** Validates a config payload (after its signature was checked). Never throws. */
export function parseRemoteConfig(payload: unknown): { ok: true; value: RemoteConfig } | { ok: false; reason: 'invalid' } {
  const r = v.safeParse(RemoteConfigSchema, payload);
  return r.success ? { ok: true, value: r.output } : { ok: false, reason: 'invalid' };
}

/** Free letters per account: the remote value can only be more generous than the reviewed 2 (D-082). */
export function effectiveFreeLetters(config: Pick<RemoteConfig, 'freeLettersAllowance'>): number {
  return Math.min(MAX_FREE_LETTERS, Math.max(BUNDLED_FREE_LETTERS, config.freeLettersAllowance));
}

/**
 * @deprecated Read together has no session limit since D-082/D-083. The key stays in the
 * document so older signed configs still parse; nothing reads it. Remove with the next schema version.
 * Free Read together sessions per Free book: the remote value can only be more generous than the reviewed default. */
export function effectiveFreeSessions(config: Pick<RemoteConfig, 'readTogetherFreeSessions'>): number {
  return Math.min(MAX_READ_TOGETHER_FREE_SESSIONS, Math.max(BUNDLED_READ_TOGETHER_FREE_SESSIONS, config.readTogetherFreeSessions));
}

export function isKilled(config: Pick<RemoteConfig, 'killSwitches'>, key: KillSwitchKey): boolean {
  return config.killSwitches[key] === true;
}
