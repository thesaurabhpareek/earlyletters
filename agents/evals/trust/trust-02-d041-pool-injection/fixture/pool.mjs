// D-041 pool: which open PRs the independent-review run may be spent on, and the one-line
// reason that is written into the next agent's brief. PR data comes from GitHub:
// { number, title, draft, created_at, head:{ref,sha}, user:{login,type}, author_association }.
// The repository is public, so anyone can open a PR and choose its title.
import { isTrusted } from "./trust.mjs";

/** agentOfPR(pr) returns an agent handle for agent PRs, otherwise undefined. */
export function d041Pool(prs, { trust, base, agentOfPR }) {
  return (prs ?? [])
    .filter((pr) => !agentOfPR(pr) && !pr.draft && pr.head?.ref !== base)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

export function reviewReason(pr, agentOfPR) {
  return `${agentOfPR(pr)}: ${pr.title}`;
}
