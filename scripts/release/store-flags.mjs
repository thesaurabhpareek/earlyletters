/**
 * Build flags of the new-scope cards that stay off in every store profile until their gates pass (BL-958; the flag
 * rows of NS-01 and NS-02, cards 01 and 02 "Flags and remote pause" and "Rollout"; gate G6).
 *
 * A store profile is one EAS builds for upload: distribution "store" (or not written) and not a simulator build, the
 * same reading as the B-9 seam check in apps/mobile/scripts/preflight-testflight.mjs. Today that is preview,
 * testflight and production.
 *
 * Read by apps/mobile/scripts/preflight-testflight.mjs (every alpha build checks every store profile, production
 * included) and by apps/mobile/test/store-flags.test.ts, which runs in `npm test`: in CI on every pull request, and in
 * the `checks` job of release-ios.yml that every ios-v*-rc tag passes before its production build starts.
 *
 * eas.json alone is not proof of what a store build ships (BL-2273). A value in the EAS environment on expo.dev that a
 * profile's `environment` names, or a variable in the shell of a `--local` build, also reaches the build, and neither
 * this table nor gate G6 (apps/mobile/test/g6-production-flags-off.test.ts) can see it. So both store preflights
 * (preflight-testflight.mjs and preflight-production.mjs) print an UNVERIFIED line that names every flag in
 * G6_CARD_FLAGS below, and the production preflight FAILs on one set in its own shell. Reading the hosted environment
 * (`eas env:list`) needs an Expo sign-in, so it stays a check by hand and is not done here. Which value wins when
 * eas.json `env` and the EAS environment both set a name was not checked.
 */

/**
 * One row per flag. `allowedOn` names the store profiles where the flag may be on. It is empty until the eas.json PR
 * the card's Rollout names turns the flag on in preview and testflight; that PR adds those names here in the same
 * diff. `production` joins only once gate G6 (no flag on in production with an open P0 row) has its record, and the
 * test refuses it until then.
 */
export const STORE_FLAGS = Object.freeze([
  Object.freeze({ env: 'EXPO_PUBLIC_PHOTOS', card: 'NS-01', allowedOn: Object.freeze([]) }),
  Object.freeze({ env: 'EXPO_PUBLIC_BOOK_SEARCH', card: 'NS-02', allowedOn: Object.freeze([]) }),
  Object.freeze({ env: 'EXPO_PUBLIC_NEW_DEVICE_EMAIL', card: 'NS-08', allowedOn: Object.freeze([]) }),
  Object.freeze({ env: 'EXPO_PUBLIC_BACKUP_LINE', card: 'NS-10', allowedOn: Object.freeze([]) }),
  // Erase now on a signed-in phone (BL-1854): held until the founder clears BL-1805's wording (CLO-22, CR-177; gate row
  // BL-1805, owner founder, CR-178 item 1). The same diff that clears it deletes this row (BL-1805's apply step).
  Object.freeze({ env: 'EXPO_PUBLIC_SERVER_ERASE', card: 'BL-1854', allowedOn: Object.freeze([]) }),
  // Usage analytics (CR-178 item 4a, D-170 item 4a): off in every store profile today. Production stays off behind
  // D-163's production gate (counsel's answer, LEGAL-REQ-043, deletion drill), which BL-1886 closes; preview and
  // testflight join allowedOn only in BL-1867's eas.json PR, after the tester notice (BL-1887) and the SDK and adapter
  // (BL-1235 P5 to P8). That PR edits this row in the same diff; BL-1886 adds production last.
  Object.freeze({ env: 'EXPO_PUBLIC_ANALYTICS', card: 'BL-1886', allowedOn: Object.freeze([]) }),
  // NX-39 phase switches with no code behind them yet (BL-858; read in apps/mobile/src/lib/capabilities.ts). Each stays
  // off in every store profile until its row in NX-39 section 3 is signed; the PR that turns one on in preview and
  // testflight edits its row here. P0 (PHOTOS) is above; P2b (PHOTO_MOMENTS) and P3 (VIDEO) are named in G6_CARD_FLAGS
  // below, which spreads this list, so they are not repeated here. These names are the only ones media-switches.test.ts
  // (R37) lets this file hold, as names in the two lists only, never a read.
  Object.freeze({ env: 'EXPO_PUBLIC_MEDIA_METADATA', card: 'NX-39 P1', allowedOn: Object.freeze([]) }),
  Object.freeze({ env: 'EXPO_PUBLIC_LIBRARY_CHOOSER', card: 'NX-39 P2a', allowedOn: Object.freeze([]) }),
  Object.freeze({ env: 'EXPO_PUBLIC_MOMENTS_BACKGROUND', card: 'NX-39 P2c', allowedOn: Object.freeze([]) }),
  Object.freeze({ env: 'EXPO_PUBLIC_OCCASIONS', card: 'NX-39 P4a', allowedOn: Object.freeze([]) }),
]);

/**
 * A build profile with the profiles it extends folded in: the child's keys win, and `env` and `ios` merge key by key
 * (my reading of EAS `extends`; not checked against the EAS docs in this session). No profile extends another today.
 */
export function resolveProfile(build, name, seen = new Set()) {
  const p = build?.[name];
  if (!p || typeof p !== 'object' || seen.has(name)) return null;
  seen.add(name);
  const base = typeof p.extends === 'string' ? (resolveProfile(build, p.extends, seen) ?? {}) : {};
  return { ...base, ...p, ios: { ...base.ios, ...p.ios }, env: { ...base.env, ...p.env } };
}

/** True for a profile EAS builds for upload (distribution "store" is the EAS default). */
export const isStoreProfile = (p) => (p?.distribution ?? 'store') === 'store' && p?.ios?.simulator !== true;

/** The store profiles of a parsed eas.json, sorted. */
export function storeProfiles(eas) {
  const build = eas?.build && typeof eas.build === 'object' ? eas.build : {};
  return Object.keys(build)
    .filter((n) => isStoreProfile(resolveProfile(build, n)))
    .sort();
}

/**
 * Every store profile and flag where the flag is not off and the table does not allow it on. Off means not written,
 * or written "off". Any other value is a problem: only "on" turns the feature on (lib/photos/flag.ts and
 * lib/find/flag.ts trim and lower-case it), and a store profile should say plainly what it ships.
 *
 * @param {unknown} eas apps/mobile/eas.json, parsed
 * @param {ReadonlyArray<{ env: string, card: string, allowedOn: ReadonlyArray<string> }>} [flags]
 */
export function storeFlagProblems(eas, flags = STORE_FLAGS) {
  const build = eas?.build && typeof eas.build === 'object' ? eas.build : {};
  const problems = [];
  for (const profile of storeProfiles(eas)) {
    const env = resolveProfile(build, profile)?.env ?? {};
    for (const f of flags) {
      const value = env[f.env];
      const off = value === undefined || String(value).trim().toLowerCase() === 'off';
      if (!off && !f.allowedOn.includes(profile)) problems.push({ profile, env: f.env, value, card: f.card });
    }
  }
  return problems;
}

/** The FAIL text for one problem. */
export function storeFlagMessage({ profile, env, value, card }) {
  return `eas.json store profile "${profile}" sets ${env}=${JSON.stringify(value)}. The ${card} flag stays off in every store profile until the card's Rollout turns it on in preview and testflight (an eas.json PR that also adds those profiles to STORE_FLAGS in scripts/release/store-flags.mjs), and in production only after gate G6 (BL-958).`;
}

/**
 * Every EXPO_PUBLIC_* card and phase flag of the new scope that may never be on in a store profile before gate G6.
 * Gate G6 (apps/mobile/test/g6-production-flags-off.test.ts) and both store preflights read this one list, so they name
 * the same flags (BL-2273). The STORE_FLAGS rows come first, so a row added there joins every reader. The rest have no
 * code behind them yet and are named by the cards and errata: E38 (PHOTO_MOMENTS, VIDEO, and MEDIA_SYNC for variant B
 * only), card 21 (DAYS, DAYS_ASK, SUGGESTIONS). EXPO_PUBLIC_MEDIA_ATTACH is retired (plan 17b, E38) and is not pinned.
 * Not here, on purpose: EXPO_PUBLIC_SERVER_FEATURES, BACKUP, STATUS_REPORT, ACCOUNT_DELETION (alpha and server
 * switches with their own pins in capabilities.test.ts and preflight-production.test.ts).
 */
export const G6_CARD_FLAGS = Object.freeze([
  ...STORE_FLAGS.map((f) => f.env),
  'EXPO_PUBLIC_DAYS', // NS-46, card 21
  'EXPO_PUBLIC_TYPED_DAYS', // NS-18, card 09 section 10 (BL-982)
  'EXPO_PUBLIC_DAYS_ASK', // card 21 flags line (E57 says no new flag; absent or off either way)
  'EXPO_PUBLIC_SUGGESTIONS', // NS-49, card 21
  'EXPO_PUBLIC_PHOTO_MOMENTS', // NS-51, card 27 (E38)
  'EXPO_PUBLIC_VIDEO', // NS-52, card 27 (E38)
  'EXPO_PUBLIC_MEDIA_SYNC', // variant B only (E38, handoff 24)
  'EXPO_PUBLIC_READ_THE_YEAR', // NS-24, BL-947 (the year rows in Go to a month)
  'EXPO_PUBLIC_MOMENTS_TAB', // NS-53, card 28, F1 (the shell is dark until the founder turns it on in a profile)
  'EXPO_PUBLIC_SIGN_AS_OTHER', // NS-16, BL-980: a child-input flag (PRIV-R20); counsel Q45, Q46, Q48, Q54 gate it (CPrivO-24)
]);
