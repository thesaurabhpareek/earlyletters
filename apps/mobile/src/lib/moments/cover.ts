/**
 * The Moments switcher cover rule (NS-53-G01, R102, R232; closure DC-5; component spec
 * docs/design/moments-tab/components/04-privacy-cover-moments.md, PC-T1).
 *
 * DC-5: with App lock off, the Moments tab and every Moments sheet are still covered when the app leaves the front, so
 * a day name, a thumbnail or Apple's picker view is never in the app switcher snapshot of a borrowed unlocked phone.
 * With App lock on, the lock layer governs and the Moments rule asks for nothing of its own (one cover, never two).
 *
 * Why there is no second layer (BL-2136; the CTO ruling is recorded in PR #2113 and has no CR number yet): the
 * spec planned a scoped gate beside `AppLockLayer` because, when it
 * was written (21 Nov 2026), the root cover drew only while the lock was on. BL-1407 (#1442, merged 22 Nov) made the
 * root cover lock-independent: `coverShown` is true whenever the app is not active, on every route, lock on or off. So
 * every row where this rule asks for a cover is already covered by the one `PrivacyCover` the root layout mounts, and a
 * Moments gate would only ever add a second cover. This file keeps the rule as data, and
 * `test/moments-cover.test.ts` fails the build if the root cover ever stops covering a row this rule needs; that is
 * the moment to build the scoped gate (and its focused-route signal) the spec describes.
 *
 * Pure: no React, no AppState, no analytics, no log. App lock never reads it; `machine.ts` is untouched.
 */
import type { AppPhase } from '../app-lock/machine';

/** What has focus: the Moments tab or one of its sheets, another tab or route, or nothing yet (launch). */
export type MomentsRouteClass = 'moments' | 'other' | 'none';

export const MOMENTS_ROUTE_CLASSES: readonly MomentsRouteClass[] = ['moments', 'other', 'none'];
export const APP_PHASES: readonly AppPhase[] = ['active', 'inactive', 'background'];

/**
 * True when the Moments rule itself needs a cover: Moments has focus, the app is not in front, and App lock is off.
 * With the lock on it is false (the lock layer governs), and in front it is always false.
 */
export function shouldCoverMoments(route: MomentsRouteClass, appState: AppPhase, lockEnabled: boolean): boolean {
  return route === 'moments' && appState !== 'active' && !lockEnabled;
}
