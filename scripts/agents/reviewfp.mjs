// Review fingerprints (owner: ops). A red-team review stays valid while the PR's
// own changes are the same, even if develop was merged into it. Contract:
//   ctx = { state, now, repo, ghAll }
/** True when this PR's current changes match ones the red team already reviewed. */
export function equivalentReviewed(ctx, pr) { return false; }
/** Called when a review of this PR is assigned. */
export function recordAssigned(ctx, pr) {}
