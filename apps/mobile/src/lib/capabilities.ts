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
 *    (lib/family/entry.logic.ts; nothing is drawn, 11 Nov 2026).
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
 *   ACCOUNT_DELETION  `EXPO_PUBLIC_ACCOUNT_DELETION=on` (founder, 30 Oct 2026). The Delete account row in
 *                     Settings and its page (`/settings/delete-account`). A build flag like the two above: true
 *                     only when server features are on AND the variable is `on`; anything else, or nothing,
 *                     is OFF, in every build. Written `on` in the eas.json profiles `development`, `e2e` and
 *                     `production` (so a build of those shows the row wherever servers are on) and in the web e2e
 *                     server-on build. NOT written in any `.env*` file (the preflight FAILs on it there: a file
 *                     that filled it in would show the row in an alpha build), and NOT written in the two alpha
 *                     profiles (`testflight`, `preview`): there it comes from the EAS `preview` environment on
 *                     expo.dev (docs/release/TESTFLIGHT.md step 9), so it can be set after the freeze without
 *                     touching eas.json or app.config.ts, and a build made without it hides the row. A drill on a
 *                     development client passes it to Metro in the shell. It is meant to go `on` in the alpha only
 *                     when the purge worker runs on staging and the sole-parent drill has passed (S1-35, S2-13,
 *                     AL-07.6a). The hide-until-proven rule is for the alpha profiles; `production` writes `on`.
 *                     Off: the row is not drawn and the page redirects to Settings. It touches nothing else:
 *                     a phone that lists no book and has an open request still gets the deletion screen with
 *                     Cancel deletion (lib/account-deletion/use-first-run-gate.ts, components/settings/
 *                     open-deletion.tsx), because that gate does not read this flag
 *                     (test/account-deletion-switch.test.ts). A phone that still lists a book does not get that
 *                     screen, and its Cancel button is on the hidden Delete account page, so it has no Cancel path.
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
 *                     (components/language/language-picker.logic.ts), and a recording whose
 *                     noted language is another waits for its language: it is never handed to
 *                     the recogniser, and Review and the letter page say so
 *                     (lib/transcription-queue/language-hold.ts, N2 on #247).
 *                     Its own switch, not tied to server features: on in both alpha
 *                     profiles (`testflight` with servers off, `preview` with them on);
 *                     development and e2e leave it unset, so it is off there and the picker
 *                     is as before. A language already stored on the phone is never changed,
 *                     so in a build with the switch off such a recording proceeds in its own
 *                     language; the text rules, packs and speech catalog are untouched.
 *                     Remote config has no key for it.
 *
 *                     Inlined at build time, like every EXPO_PUBLIC_* value here (checked
 *                     against babel-preset-expo 57.0.13, plugins/inline-env-vars.js, for
 *                     production bundles). An over-the-air update would carry the value of
 *                     the environment where `eas update` runs (the shell, .env files, and EAS
 *                     environment variables when --environment is passed), not eas.json's
 *                     build profiles; that EAS Update behaviour was not checked against the
 *                     Expo docs. expo-updates is not installed today (docs/release/ENVIRONMENTS.md).
 *                     Production sets it on too: the first store build is English only
 *                     (D-121 item 1; D-124 item 1 lets this line land before the freeze).
 *
 *   SPOKEN_LANGUAGES  `EXPO_PUBLIC_SPOKEN_LANGUAGES=en,es` in the build's env: the spoken
 *                     languages this build hears, as a comma list of ISO 639-1 codes
 *                     (D-125 item 2: a language unlocks one at a time, each after its own
 *                     gate, in the release whose listing names it). Unset or blank: no
 *                     list, every language as before. English is always heard, and a code
 *                     the app does not know is ignored (lib/language/heard-languages.ts).
 *                     It can only narrow what ENGLISH_ONLY allows: with that switch on the
 *                     build hears English alone whatever the list says. Written as `en`
 *                     next to ENGLISH_ONLY in testflight, preview and production, so those
 *                     builds behave as before; development and e2e leave it unset.
 *                     Inlined at build time like the others; remote config has no key for
 *                     it, so a language can never appear in a reviewed binary by download.
 *
 *   MEDIA PHASES      The seven phase switches of NX-39 section 3 (BL-858; NX-39-R37, R39), one per phase:
 *                     P0 `EXPO_PUBLIC_PHOTOS`, P1 `EXPO_PUBLIC_MEDIA_METADATA`, P2a `EXPO_PUBLIC_LIBRARY_CHOOSER`,
 *                     P2b with P4b `EXPO_PUBLIC_PHOTO_MOMENTS`, P2c `EXPO_PUBLIC_MOMENTS_BACKGROUND`, P3 `EXPO_PUBLIC_VIDEO`,
 *                     P4a `EXPO_PUBLIC_OCCASIONS`. NX-39 proposed the bare name MOMENTS for P2b; the name on develop is
 *                     `EXPO_PUBLIC_PHOTO_MOMENTS` (CR-69 A5 "one set", card 27 by CR-66, and the canary gate in
 *                     test/support/media-log-canary.ts), so P2b uses it and no second Moments flag exists. Only `on` is
 *                     on. Each is written `off` in the `production` profile and is off in every store profile until its
 *                     NX-39 gate is signed (scripts/release/store-flags.mjs and test/g6-production-flags-off.test.ts).
 *                     A phase needs the phase it builds on: every picture phase needs P0, and P2c needs P2b, so turning
 *                     an earlier phase off removes every later one. The remote kill switches (`killSwitches.photos`,
 *                     `photoMoments`, `videos`) pause a phase in a build that has it and never start one
 *                     (`mediaPhaseMayRun`); `photos` pauses P0 and every later picture phase. P4a reads no library and
 *                     has no remote key. No phase switch is read by Export or Erase everything
 *                     (test/media-switches.test.ts): the switches remove screens and reads, never a data right.
 *                     P0's surfaces still read the same variable through lib/photos/flag.ts, with the same rule.
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

/**
 * A comma list of language codes, trimmed, lower-cased and each once, in the order written; null when unset or blank
 * (no list). Which codes count is decided in lib/language/heard-languages.ts, so this file still imports nothing.
 */
export function parseLanguageList(raw: string | undefined | null): readonly string[] | null {
  const codes = [...new Set((raw ?? '').split(',').map((c) => c.trim().toLowerCase()).filter((c) => c.length > 0))];
  return codes.length > 0 ? codes : null;
}

/** Inlined at bundle time, like the other switches (D-125 item 2). */
const SPOKEN_LANGUAGES_BUILD_VALUE: readonly string[] | null = parseLanguageList(process.env.EXPO_PUBLIC_SPOKEN_LANGUAGES);

/** undefined: the build value. null: no list. */
let spokenLanguagesTestOverride: readonly string[] | null | undefined;

/** Per-feature build flags (F19-REQ-025). Inlined at bundle time; only `on` is on. */
const BACKUP_BUILD_VALUE: boolean = parseServerFeatures(process.env.EXPO_PUBLIC_BACKUP);
const STATUS_REPORT_BUILD_VALUE: boolean = parseServerFeatures(process.env.EXPO_PUBLIC_STATUS_REPORT);
/** Delete account (founder, 30 Oct 2026). Same rule: only `on` is on, so a build with the variable unset hides the row. */
const ACCOUNT_DELETION_BUILD_VALUE: boolean = parseServerFeatures(process.env.EXPO_PUBLIC_ACCOUNT_DELETION);
/**
 * Erase now on a signed-in phone (BL-1854), held from every store profile until BL-1805's wording is cleared (BL-1987; CLO-22,
 * CR-177). Same rule: only `on` is on. It is listed in scripts/release/store-flags.mjs with `allowedOn` empty, so a store
 * profile in eas.json that writes it on fails `npm test` and the TestFlight preflight. Development and e2e builds may write it on.
 */
const SERVER_ERASE_BUILD_VALUE: boolean = parseServerFeatures(process.env.EXPO_PUBLIC_SERVER_ERASE);

/** The build flags that sit on top of the server switch. */
export type BuildFlag = 'backup' | 'statusReport' | 'accountDeletion' | 'serverErase';

let buildFlagTestOverride: Partial<Record<BuildFlag, boolean>> = {};

/** True only in a build made with `EXPO_PUBLIC_ANALYTICS=on` (later, with consent). */
export function analyticsEnabled(): boolean {
  return analyticsTestOverride ?? ANALYTICS_BUILD_VALUE;
}

/** True only in a build made with `EXPO_PUBLIC_ENGLISH_ONLY=on` (the two alpha profiles, D-111 item 4, and the staged 1.0 production profile, D-121). */
export function englishOnlyEnabled(): boolean {
  return englishOnlyTestOverride ?? ENGLISH_ONLY_BUILD_VALUE;
}

/** The build's `EXPO_PUBLIC_SPOKEN_LANGUAGES` list as written, or null for none. Read it through heardLanguagesForBuild(). */
export function spokenLanguagesListed(): readonly string[] | null {
  return spokenLanguagesTestOverride !== undefined ? spokenLanguagesTestOverride : SPOKEN_LANGUAGES_BUILD_VALUE;
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
  const built: Record<BuildFlag, boolean> = {
    backup: BACKUP_BUILD_VALUE,
    statusReport: STATUS_REPORT_BUILD_VALUE,
    accountDeletion: ACCOUNT_DELETION_BUILD_VALUE,
    serverErase: SERVER_ERASE_BUILD_VALUE,
  };
  return buildFlagTestOverride[flag] ?? built[flag];
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
  /**
   * Erase now reaches the server (BL-1854, WP-F16-13, F16-REQ-024): `store.eraseEntry` queues one id-only `entry.erase`
   * and the server purges its copy. It needs the server switch and its own build flag `EXPO_PUBLIC_SERVER_ERASE=on`, which
   * no store profile may carry until the founder clears BL-1805 (BL-1987). Off: a signed-in phone shows no Erase now.
   */
  get serverErase(): boolean {
    return buildFlagEnabled('serverErase');
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
  /**
   * The Delete account row in Settings and its page (founder, 30 Oct 2026). Needs the server switch and its own variable.
   * It is not the open-request gate: a phone that lists no book and has an open request still gets the deletion screen with
   * Cancel deletion with this off. A phone that still lists a book has its Cancel button on the page this hides.
   */
  get accountDeletion(): boolean {
    return buildFlagEnabled('accountDeletion');
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

/** The NX-39 phases that have a build switch (section 3). P4b rides on `moments` and has no switch of its own. */
export type MediaPhase = 'photos' | 'mediaMetadata' | 'libraryChooser' | 'moments' | 'momentsBackground' | 'video' | 'occasions';

export interface MediaPhaseSwitch {
  readonly phase: MediaPhase;
  /** The row in NX-39 section 3. */
  readonly nx39: string;
  /** The eas.json variable. */
  readonly env: string;
  /** The phase this one builds on, or null. Off there means off here. */
  readonly needs: MediaPhase | null;
  /** The remote kill switches that pause this phase itself (a phase it needs adds its own). */
  readonly pauseKeys: readonly string[];
}

/** The seven switches, in the order of NX-39 section 3. */
export const MEDIA_PHASE_SWITCHES: readonly MediaPhaseSwitch[] = Object.freeze([
  { phase: 'photos', nx39: 'P0', env: 'EXPO_PUBLIC_PHOTOS', needs: null, pauseKeys: ['photos'] },
  { phase: 'mediaMetadata', nx39: 'P1', env: 'EXPO_PUBLIC_MEDIA_METADATA', needs: 'photos', pauseKeys: [] },
  { phase: 'libraryChooser', nx39: 'P2a', env: 'EXPO_PUBLIC_LIBRARY_CHOOSER', needs: 'photos', pauseKeys: ['photoMoments'] },
  { phase: 'moments', nx39: 'P2b', env: 'EXPO_PUBLIC_PHOTO_MOMENTS', needs: 'photos', pauseKeys: ['photoMoments'] },
  { phase: 'momentsBackground', nx39: 'P2c', env: 'EXPO_PUBLIC_MOMENTS_BACKGROUND', needs: 'moments', pauseKeys: [] },
  { phase: 'video', nx39: 'P3', env: 'EXPO_PUBLIC_VIDEO', needs: 'photos', pauseKeys: ['videos'] },
  { phase: 'occasions', nx39: 'P4a', env: 'EXPO_PUBLIC_OCCASIONS', needs: null, pauseKeys: [] },
] satisfies MediaPhaseSwitch[]);

/** Inlined at bundle time: each read is written out in full so Expo inlines it. Only `on` is on. */
const MEDIA_PHASE_BUILD_VALUE: Readonly<Record<MediaPhase, boolean>> = {
  photos: parseServerFeatures(process.env.EXPO_PUBLIC_PHOTOS),
  mediaMetadata: parseServerFeatures(process.env.EXPO_PUBLIC_MEDIA_METADATA),
  libraryChooser: parseServerFeatures(process.env.EXPO_PUBLIC_LIBRARY_CHOOSER),
  moments: parseServerFeatures(process.env.EXPO_PUBLIC_PHOTO_MOMENTS),
  momentsBackground: parseServerFeatures(process.env.EXPO_PUBLIC_MOMENTS_BACKGROUND),
  video: parseServerFeatures(process.env.EXPO_PUBLIC_VIDEO),
  occasions: parseServerFeatures(process.env.EXPO_PUBLIC_OCCASIONS),
};

let mediaPhaseTestOverride: Partial<Record<MediaPhase, boolean>> = {};

const mediaPhaseSwitch = (phase: MediaPhase): MediaPhaseSwitch => {
  const s = MEDIA_PHASE_SWITCHES.find((m) => m.phase === phase);
  if (!s) throw new Error(`unknown media phase ${phase}`);
  return s;
};

/** Is this phase in the build: its own switch on and every phase it needs on. */
export function mediaPhaseBuilt(phase: MediaPhase): boolean {
  const s = mediaPhaseSwitch(phase);
  const own = mediaPhaseTestOverride[phase] ?? MEDIA_PHASE_BUILD_VALUE[phase];
  return own && (s.needs === null || mediaPhaseBuilt(s.needs));
}

/**
 * May this phase draw its screens and make its reads now? The build first, then the remote kill switches of the
 * phase and of every phase it needs. Remote config can only pause: with the build off this is false whatever the
 * config holds, and only the boolean `true` pauses (a missing or older config pauses nothing).
 */
export function mediaPhaseMayRun(phase: MediaPhase, config: KillSwitchView | null | undefined): boolean {
  if (!mediaPhaseBuilt(phase)) return false;
  for (let s: MediaPhaseSwitch | null = mediaPhaseSwitch(phase); s; s = s.needs === null ? null : mediaPhaseSwitch(s.needs)) {
    if (s.pauseKeys.some((k) => config?.killSwitches?.[k] === true)) return false;
  }
  return true;
}

/** Tests only, like setServerFeaturesForTests: set a phase's own switch as if the build had it (null: the build value). */
export function setMediaPhaseForTests(phase: MediaPhase, value: boolean | null): void {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  if (!env?.VITEST) throw new Error('setMediaPhaseForTests is for tests only');
  const next = { ...mediaPhaseTestOverride };
  if (value === null) delete next[phase];
  else next[phase] = value;
  mediaPhaseTestOverride = next;
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

/** Tests only, like setServerFeaturesForTests: a spoken-language list (null for none); undefined goes back to the build value. */
export function setSpokenLanguagesForTests(value: readonly string[] | null | undefined): void {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  if (!env?.VITEST) throw new Error('setSpokenLanguagesForTests is for tests only');
  spokenLanguagesTestOverride = value;
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
