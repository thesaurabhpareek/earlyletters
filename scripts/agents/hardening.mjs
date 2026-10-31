// Helpers added after the first two weeks (3 to 15 Oct 2026). Kept apart from
// lib.mjs so parallel harness PRs do not collide at the end of that file.

import { isTrusted } from "./lib.mjs";

/** Text from GitHub (a PR title, say) as one short line that cannot open a code span or a new instruction. */
export function oneLine(text, max = 100) {
  return String(text ?? "").replace(/[`\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/**
 * The red-team verdict of a review body, only when it is exactly one the harness
 * defines (OPERATING_MODEL section 6): "ship", "fix first" or "founder decision",
 * on a line that starts with `Verdict:` (bold markers allowed), ending at a word
 * boundary. Anything else, and every word after the verdict, returns "". Use it for
 * text that reaches the board, so a reviewer's sentence never does.
 */
export function verdictPhrase(body) {
  const m = String(body ?? "").match(/^[ \t]*\**Verdict:?\**:?[ \t]*(ship|fix[ \t]+first|founder[ \t]+decision)\b/im);
  return m ? m[1].toLowerCase().replace(/\s+/g, " ") : "";
}

/** Journal entries a brief may use: the marker comes first AND the author is trusted. Anyone can comment on a journal issue. */
export function trustedJournalEntries(comments, trust) {
  return (comments ?? []).filter((c) => isTrusted(c, trust) && /^\s*<!-- journal run:/.test(c?.body ?? ""));
}

/**
 * Open PRs the independent-review pool may pick: not drafts, not the release PR
 * (head == base), not agent PRs (they go through the normal review path), and
 * only from a trusted author. A drive-by PR on a public repo must not spend a run.
 */
export function d041Pool(prs, { trust, base, agentOfPR }) {
  return (prs ?? [])
    .filter((pr) => !agentOfPR(pr) && !pr.draft && pr.head?.ref !== base)
    .filter((pr) => isTrusted({ user: pr.user, author_association: pr.author_association }, trust))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

// ---------- D-041: paths that need an independent review run ----------

/** True when a PR touches the database, workflows or auth code (D-041), whoever wrote it. */
export function needsIndependentReview(files) {
  return (files ?? []).some((f) =>
    /^supabase\//.test(f) || /^\.github\/workflows\//.test(f) ||
    /(^|\/)(auth|sign-?in|session|passkeys?)([./_-]|\/)/i.test(f));
}

// ---------- ids: never pick one another open PR already uses ----------

/**
 * Next free BL, D and ADR numbers, given text from develop and from every open
 * PR's added lines, plus ADR file names. Uses the highest number seen anywhere,
 * so a parallel PR's ids are never reused (ADR 0014 to 0017 collided this way).
 */
export function nextIds(texts, adrFiles = []) {
  const max = (re) => Math.max(0, ...texts.flatMap((t) => [...String(t).matchAll(re)].map((m) => Number(m[1]))));
  const adr = Math.max(0, ...adrFiles.map((f) => Number((/(?:^|\/)(\d{4})-/.exec(f) ?? [])[1] ?? 0)).filter((n) => n < 100));
  const pad = (n, w) => String(n).padStart(w, "0");
  return { BL: `BL-${pad(max(/\bBL-(\d{3,4})\b/g) + 1, 3)}`, D: `D-${pad(max(/\bD-(\d{3})\b/g) + 1, 3)}`, ADR: pad(adr + 1, 4) };
}
