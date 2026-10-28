import { isTrusted } from "./trust.mjs";

/** Text from GitHub as one short line that cannot open a code span or start a new instruction. */
export function oneLine(text, max = 100) {
  return String(text ?? "").replace(/[`\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

// Why trusted-only: a drive-by PR on a public repo must not spend a red-team run per pushed head.
export function d041Pool(prs, { trust, base, agentOfPR }) {
  return (prs ?? [])
    .filter((pr) => !agentOfPR(pr) && !pr.draft && pr.head?.ref !== base)
    .filter((pr) => isTrusted({ user: pr.user, author_association: pr.author_association }, trust))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

export function reviewReason(pr, agentOfPR) {
  return `${agentOfPR(pr) ?? pr.user?.login ?? "pr"}: ${oneLine(pr.title)}`;
}
