/**
 * Build-time capabilities: the one switch for everything that needs our server
 * (founder decision, 3 Oct 2026: v1.0 ships on this phone only, at $0).
 *
 *   SERVER_FEATURES   `EXPO_PUBLIC_SERVER_FEATURES=on` in the build's env (eas.json
 *                     profile or `.env.*`). Anything else, or nothing, is OFF.
 *
 * Off (every v1.0 profile in eas.json):
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
 *   ANALYTICS         `EXPO_PUBLIC_ANALYTICS=on` in the build's env. Anything else, or
 *                     nothing, is OFF. Off in every v1.0 profile (decision of 15 Oct 2026,
 *                     delegated by the founder; D-088 keeps the label "Data Not Collected"):
 *                     no consent sheet, no Settings switch, no PostHog client even when
 *                     `EXPO_PUBLIC_POSTHOG_KEY` is set, and startAnalytics() does nothing.
 *                     packages/analytics stays; analytics returns with consent in v1.1.
 *
 *   BACKUP            `EXPO_PUBLIC_BACKUP=on` in the build's env, and server features on. Anything
 *                     else is OFF, and off in every profile today (PRD V2 08-delivery T23: the backup
 *                     client merges with the flag off; T27 turns it on for C1 families who opt in).
 *                     Off: lib/backup/gate.ts loads nothing, the Settings row is not offered, the
 *                     native ScribeKeys module is never looked up (F08-REQ-041).
 *
 * Pure TypeScript (no React Native), so Node tests read it directly.
 */

/** `on` (any case, surrounding spaces ignored) turns server features on; every other value is off. */
export function parseServerFeatures(raw: string | undefined | null): boolean {
  return (raw ?? '').trim().toLowerCase() === 'on';
}

/** Inlined at bundle time: Expo only inlines `process.env.EXPO_PUBLIC_*` written out in full. */
const BUILD_VALUE: boolean = parseServerFeatures(process.env.EXPO_PUBLIC_SERVER_FEATURES);

let testOverride: boolean | null = null;

/** Inlined at bundle time, like the server switch. Same rule: only `on` is on. */
const ANALYTICS_BUILD_VALUE: boolean = parseServerFeatures(process.env.EXPO_PUBLIC_ANALYTICS);

let analyticsTestOverride: boolean | null = null;

/** Inlined at bundle time, like the server switch. Same rule: only `on` is on. */
const BACKUP_BUILD_VALUE: boolean = parseServerFeatures(process.env.EXPO_PUBLIC_BACKUP);

let backupTestOverride: boolean | null = null;

/** True only in a build made with server features on and `EXPO_PUBLIC_BACKUP=on`. */
export function backupEnabled(): boolean {
  return serverFeaturesEnabled() && (backupTestOverride ?? BACKUP_BUILD_VALUE);
}

/** True only in a build made with `EXPO_PUBLIC_ANALYTICS=on` (v1.1 onwards, with consent). */
export function analyticsEnabled(): boolean {
  return analyticsTestOverride ?? ANALYTICS_BUILD_VALUE;
}

/** The PostHog key the app may use: none at all unless the analytics switch is on. */
export function postHogKeyForBuild(enabled: boolean, key: string | undefined | null): string {
  return enabled ? (key ?? '').trim() : '';
}

/** True only in a build made with `EXPO_PUBLIC_SERVER_FEATURES=on` (v1.1 onwards). */
export function serverFeaturesEnabled(): boolean {
  return testOverride ?? BUILD_VALUE;
}

/**
 * What the build can do. All three follow the one switch: co-parent sharing is the
 * only reason v1.0 needed a server, so sign-in and sync go with it.
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
  /** Opt-in product analytics: consent sheet, Settings switch, PostHog. Its own switch, off in v1.0. */
  get analytics(): boolean {
    return analyticsEnabled();
  },
  /** Encrypted backup of the owner's recordings (D-073, D-102). Its own build flag, off by default. */
  get backup(): boolean {
    return backupEnabled();
  },
} as const;

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

/** Tests only, like setServerFeaturesForTests: run the backup tests with the flag on (server features still apply). */
export function setBackupForTests(value: boolean | null): void {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  if (!env?.VITEST) throw new Error('setBackupForTests is for tests only');
  backupTestOverride = value;
}

/** Tests only, like setServerFeaturesForTests: run the analytics tests with the switch on. */
export function setAnalyticsForTests(value: boolean | null): void {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  if (!env?.VITEST) throw new Error('setAnalyticsForTests is for tests only');
  analyticsTestOverride = value;
}
