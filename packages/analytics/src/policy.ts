/**
 * Resolve `analytics.basicsPolicy` (ER-A02, BL-1237). Pure: no network call,
 * no location read, no storage. Every input is a value the caller already
 * holds.
 *
 * Rules (ENGINEERING-REQUIREMENTS-21nov.md section 1 and ER-A02):
 * - Anything unrecognised, empty or missing resolves to `ask_first`.
 * - Only the `production` profile can resolve to `collect_by_default`; every
 *   other profile is `ask_first`.
 * - A region map is an empty default. When it names the caller's region, that
 *   entry replaces the build value (counsel's call, FH-3). The region is
 *   never read here and never sent anywhere.
 * - A remote value may only tighten (`collect_by_default` to `ask_first`). A
 *   remote attempt to loosen is ignored.
 * - The person's off switch is not decided here; it outranks this value in the
 *   gate (ER-A03).
 */
import type { BasicsPolicy } from './contracts';

export const SAFE_BASICS_POLICY: BasicsPolicy = 'ask_first';

export interface BasicsPolicyInput {
  /** EAS build profile name. */
  profile?: string | null;
  /** `EXPO_PUBLIC_ANALYTICS_BASICS_POLICY` for this build. */
  buildValue?: string | null;
  /** The caller's region code, from a source counsel approves. Optional. */
  region?: string | null;
  /** Region to policy overrides. Empty by default. */
  regionMap?: Readonly<Record<string, string>> | null;
  /** A remote value. It can only tighten. */
  remote?: string | null;
}

export function parseBasicsPolicy(value: unknown): BasicsPolicy | null {
  return value === 'collect_by_default' || value === 'ask_first' ? value : null;
}

export function resolveBasicsPolicy(input: BasicsPolicyInput = {}): BasicsPolicy {
  if (input.profile !== 'production') return SAFE_BASICS_POLICY;
  let policy = parseBasicsPolicy(input.buildValue) ?? SAFE_BASICS_POLICY;
  const region = typeof input.region === 'string' ? input.region : '';
  const map = input.regionMap;
  if (region && map && Object.prototype.hasOwnProperty.call(map, region)) {
    policy = parseBasicsPolicy(map[region]) ?? SAFE_BASICS_POLICY;
  }
  if (parseBasicsPolicy(input.remote) === 'ask_first') policy = 'ask_first';
  return policy;
}
