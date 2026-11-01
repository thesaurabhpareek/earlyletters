/**
 * App versions are plain `major.minor.patch` (CFBundleShortVersionString,
 * app.config.ts `version`). No pre-release tags: TestFlight builds use the
 * same version as the release they lead to.
 */

export const SEMVER_RE = /^(0|[1-9][0-9]{0,5})\.(0|[1-9][0-9]{0,5})\.(0|[1-9][0-9]{0,5})$/;

export type Semver = readonly [number, number, number];

export function parseSemver(v: string): Semver | null {
  const m = SEMVER_RE.exec(v);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** -1, 0 or 1. Unparseable versions sort below every real version. */
export function compareSemver(a: string, b: string): -1 | 0 | 1 {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return pa ? 1 : pb ? -1 : 0;
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  }
  return 0;
}

/** True when `appVersion` is at least `min`. An unparseable app version satisfies nothing. */
export function satisfiesMin(appVersion: string, min: string): boolean {
  return parseSemver(appVersion) !== null && compareSemver(appVersion, min) >= 0;
}
