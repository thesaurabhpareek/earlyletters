import { trustContext, isTrusted, startsWithMarker } from "./trust.mjs";

export const TRUST = trustContext({ founder: "saurabh-founder" });

// Why: anyone can review a public PR. Only a trusted author whose review STARTS with the marker
// for this exact head counts; otherwise an outsider silences the independent review for good.
export function isReviewed(reviews, sha, trust = TRUST) {
  return (reviews ?? []).some((r) => isTrusted(r, trust) && startsWithMarker(r.body, `<!-- red-team:${sha} -->`));
}
