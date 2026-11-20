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
