/**
 * Build-time capabilities: what this build can do, read from the bundle only.
 * Server features are on in v1.0 (D-100, founder, 13 Oct 2026; alpha D-106), and this
 * file stays the kill path: a build made with the switch off has no server code path.
 *
 *   SERVER_FEATURES   `EXPO_PUBLIC_SERVER_FEATURES=on` in the build's env (eas.json
 *                     profile or `.env.*`). Anything else, or nothing, is OFF. In
 *                     eas.json only `preview` (the alpha against staging) is on; the
 *                     store profiles stay off until the R-17 security gate passes
 *                     (docs/release/TESTFLIGHT.md, "The flip").
 *
 * Off:
 *  - no Supabase client is ever constructed (lib/supabase/client.ts returns null),
 *    so there is no sign-in, no session restore, no consent check and no sync;
 *  - sync never starts at boot (lib/sync startSync returns at once);
 *  - remote documents never fall back to the Supabase URL (lib/remote);
 *  - sign-in screens, Account and Delete account rows are not offered, and every
 *    co-parent entry point shows the "coming soon" presentation instead
 *    (components/family/coparent-soon.tsx, lib/family/entry.logic.ts).
 *
 * Remote config can never turn this on (BRIEF decision 16: nothing server-driven
 * may change what is collected). The value is read from the bundle only; this
 * file imports nothing, and packages/api's remote config has no key for it. The
 * only remote lever is `flags.familyTeaser`, which can quiet the teaser copy.
 *
 *   BACKUP            `EXPO_PUBLIC_BACKUP=on` (PRD V2 F19 6.5, F19-REQ-025, R2 AR-12).
 *   STATUS_REPORT     `EXPO_PUBLIC_STATUS_REPORT=on` (same; D-080, F14).
 *                     Per-feature build flags, so a release can ship with sign-in, sync
 *                     and co-parent on and either of these off. Each is true only when
 *                     server features are on AND its own variable is `on`; anything else
 *                     is OFF. Off in every eas.json profile today: recording backup turns
 *                     on for C1 families at T27, the status report when WP-F14-15 ships.
 *                     A build flag removes the feature from that build.
 *
 *                     Remote kill switches pause a feature in a build that has it; they
 *                     never start one. `mayRun(feature, config)` is the one check the
 *                     consumers call (S05 backup queue and restore, S06 status sender;
 *                     WP-F19-12b, WP-F19-12r): build flag first, then the switch named in
 *                     F19 6.5 (`backupUploads`, `escrow`, `statusReport`). With the build
 *                     flag off it is false whatever the config says. The three keys are in
 *                     packages/api's remote config schema (WP-F19-16, S07), off by default,
 *                     and an older signed config without them parses as off. The build flags
 *                     are off in every profile today, so they stay the lever for build 1.
 *
 *   ANALYTICS         `EXPO_PUBLIC_ANALYTICS=on` in the build's env. Anything else, or
 *                     nothing, is OFF. Off in every profile (decision of 15 Oct 2026,
 *                     delegated by the founder; D-088): no consent sheet, no Settings
 *                     switch, no PostHog client even when `EXPO_PUBLIC_POSTHOG_KEY` is set,
 *                     and startAnalytics() does nothing. Analytics returns with consent later.
 *
 *   ENGLISH_ONLY      `EXPO_PUBLIC_ENGLISH_ONLY=on` in the build's env. Anything else, or
 *                     nothing, is OFF. D-111 item 4 (founder, 17 Oct 2026): the alpha
 *                     transcribes English only, and another language needs a native
 *                     reviewer first. On, the language picker offers English alone, with
 *                     one line that other languages come in a later update
 *                     (components/language/language-picker.logic.ts).
 *                     Its own switch, not tied to server features: on in both alpha
 *                     profiles (`testflight` with servers off, `preview` with them on);
 *                     development and e2e leave it unset, so it is off there and the picker
 *                     is as before. It changes what the picker offers and nothing else: a
 *                     language already stored on the phone is left as it is, and the text
 *                     rules, packs and speech catalog are untouched. Remote config has no key
 *                     for it.
 *
 * Pure TypeScript (no React Native), so Node tests read it directly.
 */

/** `on` (any case, surrounding spaces ignored) turns a switch on; every other value is off. */
export function parseServerFeatures(raw: string | undefined | null): boolean {
  return (raw ?? '').trim().toLowerCase() === 'on';
}

/** Inlined at bundle time: Expo only inlines `process.env.EXPO_PUBLIC_*` written out in full. */
const BUILD_VALUE: boolean = parseServerFeatures(process.env.EXPO_PUBLIC_SERVER_FEATURES);

let testOverride: boolean | null = null;

/** Inlined at bundle time, like the server switch. Same rule: only `on` is on. */
const ANALYTICS_BUILD_VALUE: boolean = parseServerFeatures(process.env.EXPO_PUBLIC_ANALYTICS);

let analyticsTestOverride: boolean | null = null;

/** Inlined at bundle time, like the server switch. Same rule: only `on` is on (D-111 item 4). */
const ENGLISH_ONLY_BUILD_VALUE: boolean = parseServerFeatures(process.env.EXPO_PUBLIC_ENGLISH_ONLY);

let englishOnlyTestOverride: boolean | null = null;

/** Per-feature build flags (F19-REQ-025). Inlined at bundle time; only `on` is on. */
const BACKUP_BUILD_VALUE: boolean = parseServerFeatures(process.env.EXPO_PUBLIC_BACKUP);
const STATUS_REPORT_BUILD_VALUE: boolean = parseServerFeatures(process.env.EXPO_PUBLIC_STATUS_REPORT);

/** The build flags that sit on top of the server switch. */
export type BuildFlag = 'backup' | 'statusReport';

let buildFlagTestOverride: Partial<Record<BuildFlag, boolean>> = {};

/** True only in a build made with `EXPO_PUBLIC_ANALYTICS=on` (later, with consent). */
export function analyticsEnabled(): boolean {
  return analyticsTestOverride ?? ANALYTICS_BUILD_VALUE;
}

/** True only in a build made with `EXPO_PUBLIC_ENGLISH_ONLY=on` (the two alpha profiles, D-111 item 4). */
export function englishOnlyEnabled(): boolean {
  return englishOnlyTestOverride ?? ENGLISH_ONLY_BUILD_VALUE;
}

/** The PostHog key the app may use: none at all unless the analytics switch is on. */
export function postHogKeyForBuild(enabled: boolean, key: string | undefined | null): string {
  return enabled ? (key ?? '').trim() : '';
}

/** True only in a build made with `EXPO_PUBLIC_SERVER_FEATURES=on`. */
export function serverFeaturesEnabled(): boolean {
  return testOverride ?? BUILD_VALUE;
}

/** A build flag: needs the server switch too, so a flag can never bring the server back into an off build. */
export function buildFlagEnabled(flag: BuildFlag): boolean {
  if (!serverFeaturesEnabled()) return false;
  const built = flag === 'backup' ? BACKUP_BUILD_VALUE : STATUS_REPORT_BUILD_VALUE;
  return buildFlagTestOverride[flag] ?? built;
}

/**
 * What the build can do. Sign-in, sync and co-parent follow the one server switch;
 * backup and the status report also need their own build flag.
 */
export const capabilities = {
  /** Sign in with Apple, Google or email; Account and Delete account screens. */
  get signIn(): boolean {
    return serverFeaturesEnabled();
  },
  /** Letters upload and download (D-023). */
  get sync(): boolean {
    return serverFeaturesEnabled();
  },
  /** Invite and join a co-parent. Off: the coming-soon presentation. */
  get coParent(): boolean {
    return serverFeaturesEnabled();
  },
  /** Encrypted recording backup (F08 6.5, D-073, D-102): Settings row, upload queue, restore, escrow calls. */
  get backup(): boolean {
    return buildFlagEnabled('backup');
  },
  /** The subscription status report and its reminder emails (D-080, F14). */
  get statusReport(): boolean {
    return buildFlagEnabled('statusReport');
  },
  /** Opt-in product analytics: consent sheet, Settings switch, PostHog. Its own switch, off in every profile. */
  get analytics(): boolean {
    return analyticsEnabled();
  },
  /** The language picker offers English only (D-111 item 4). Its own switch, on in the two alpha profiles. */
  get englishOnly(): boolean {
    return englishOnlyEnabled();
  },
} as const;

/**
 * The remote kill switches that pause a build flag (F19 6.5; F19-REQ-011, F08-REQ-041).
 * `backupUploads` stops new uploads, `escrow` stops restores through the recovery key,
 * `statusReport` stops reports. Each pauses only the feature its build flag guards.
 */
export const KILL_SWITCH_FLAG = {
  backupUploads: 'backup',
  escrow: 'backup',
  statusReport: 'statusReport',
} as const satisfies Record<string, BuildFlag>;

export type PausableFeature = keyof typeof KILL_SWITCH_FLAG;

/**
 * The part of a remote config this file reads, by shape only, so the file still imports
 * nothing (`getRemoteConfig()` from lib/remote fits it). A missing config means bundled
 * defaults: nothing is paused.
 */
export interface KillSwitchView {
  readonly killSwitches?: Readonly<Record<string, unknown>> | null;
}

/**
 * May this feature run now? The build flag first, then its remote kill switch. Remote
 * config can only switch a feature off, never on: with the build flag off this is false
 * whatever the config holds, and only the boolean `true` in the switch pauses it.
 */
export function mayRun(feature: PausableFeature, config: KillSwitchView | null | undefined): boolean {
  if (!buildFlagEnabled(KILL_SWITCH_FLAG[feature])) return false;
  return config?.killSwitches?.[feature] !== true;
}

/**
 * Tests only (vitest sets `VITEST`): run sign-in and sync tests with the switch on.
 * Pass null to go back to the build value. Throws anywhere else, so app code can
 * never flip it.
 */
export function setServerFeaturesForTests(value: boolean | null): void {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  if (!env?.VITEST) throw new Error('setServerFeaturesForTests is for tests only');
  testOverride = value;
}

/** Tests only, like setServerFeaturesForTests: run the analytics tests with the switch on. */
export function setAnalyticsForTests(value: boolean | null): void {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  if (!env?.VITEST) throw new Error('setAnalyticsForTests is for tests only');
  analyticsTestOverride = value;
}

/** Tests only, like setServerFeaturesForTests: run the picker tests with the English-only switch on or off. */
export function setEnglishOnlyForTests(value: boolean | null): void {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  if (!env?.VITEST) throw new Error('setEnglishOnlyForTests is for tests only');
  englishOnlyTestOverride = value;
}

/**
 * Tests only, like setServerFeaturesForTests: set a build flag as if the build had it
 * (null goes back to the build value). The server switch still applies on top.
 */
export function setBuildFlagForTests(flag: BuildFlag, value: boolean | null): void {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  if (!env?.VITEST) throw new Error('setBuildFlagForTests is for tests only');
  const next = { ...buildFlagTestOverride };
  if (value === null) delete next[flag];
  else next[flag] = value;
  buildFlagTestOverride = next;
}
