// D-041: a PR that touches supabase/, workflows or auth needs an independent red-team review
// of its CURRENT head commit before it can merge. isReviewed decides whether that review exists.
// `reviews` are the PR reviews as GitHub returns them: { user:{login,type}, author_association, body }.
// The repository is public, so anyone can post a review.
import { trustContext } from "./trust.mjs";

export const TRUST = trustContext({ founder: "saurabh-founder" });

export function isReviewed(reviews, sha, trust = TRUST) {
  return (reviews ?? []).some((r) => (r.body ?? "").includes(`red-team:${sha}`));
}
