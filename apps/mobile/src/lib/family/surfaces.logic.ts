/**
 * The co-parent surfaces that a servers-on STORE build hides (NX-38-R5, option A, founder-approved 9 Nov 2026; D-126, D-152
 * draft; Apple 2.5.19). Pure, tested in Node (test/family-surfaces.test.ts).
 *
 * `familySurfacesShown` is its own named flag. It is NOT the sign-in switch: sign-in, sync and the account stay on in a
 * store build while the invite screens, the `/j` join link and the join prompt stay off. `CO_PARENT_IN_STORE_BUILD` is the
 * same constant #720 (BL-776) adds for the Family tab and the Settings row. #720 is not merged and is not an ancestor of
 * this branch, so this is the minimal equivalent; when #720 merges, one of the two constants goes and this file imports the
 * other (a trivial conflict on a one-line constant).
 *
 * Alpha builds (TestFlight, preview) keep every surface. A servers-off build never had them (`coParent` is false).
 */
export const CO_PARENT_IN_STORE_BUILD = false;

export function familySurfacesShown(input: { alpha: boolean; coParent: boolean }): boolean {
  return input.coParent && (input.alpha || CO_PARENT_IN_STORE_BUILD);
}

/**
 * The invite screens and the `/j` join route are blocked only where a flow would otherwise open: servers on, surfaces off.
 * With servers off they already answer "coming soon" and an invite link already keeps no token, so that build is unchanged.
 */
export function inviteScreensBlocked(input: { serverFeatures: boolean; surfacesShown: boolean }): boolean {
  return input.serverFeatures && !input.surfacesShown;
}
