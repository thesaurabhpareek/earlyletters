/** The pure rules behind surfaces.ts: the build's answers are passed in, so Node tests can drive every combination. */
import { inviteScreensBlocked, visibleCoParentDoors } from './entry.logic';

/** The join-door rule (B12-5): servers on and an alpha build, or a store build after CO_PARENT_IN_STORE_BUILD flips. */
export function familySurfacesFrom(input: { coParent: boolean; alpha: boolean }): boolean {
  return visibleCoParentDoors(input.coParent, input.alpha).joinButton;
}

/** True only when servers are on and the co-parent surfaces are not shown (a servers-on store build). */
export function inviteScreensHiddenFrom(input: { serverFeatures: boolean; coParent: boolean; alpha: boolean }): boolean {
  return inviteScreensBlocked({ serverFeatures: input.serverFeatures, surfacesShown: familySurfacesFrom(input) });
}
