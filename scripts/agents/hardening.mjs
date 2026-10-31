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

// ---------- injection-dispatch fixes (H1 to H5, H11) ----------

/**
 * H1: PRs whose title or branch may reserve a backlog id. Only an agent PR (the
 * `agent:*` label, via agentOfPR) or a PR from a trusted author. A drive-by PR
 * titled "BL-900" reserves nothing.
 */
export function idReservingPRs(prs, trust, agentOfPR) {
  const t = trust ?? { founder: "", appClientId: "", bots: new Set() };
  return (prs ?? []).filter((pr) => agentOfPR(pr) || isTrusted(
    { user: pr.user, author_association: pr.author_association, performed_via_github_app: pr.performed_via_github_app }, t));
}

/**
 * H3: spend from run receipts, counted only when `ledgerRow` (the ledger's trust
 * rule: a trusted author, or github-actions[bot] for receipts only) accepts the
 * comment and its body starts with the receipt marker. `ledgerRow` is passed in
 * so this module does not import ledger.mjs.
 */
export function spendFromReceipts(comments, trust, ledgerRow) {
  let cost = 0, n = 0, unknown = 0;
  for (const c of comments ?? []) {
    const row = ledgerRow(c, trust, "comment");
    if (row?.kind !== "receipt") continue;
    // Receipts with no cost (and older ones that wrote 0.0000 with "cost not
    // reported") are counted apart, never as $0.
    if (row.cost_usd === undefined || /cost not reported/.test(c.body ?? "")) unknown++;
    else { cost += row.cost_usd; n++; }
  }
  return { cost, n, unknown };
}

const VERDICT_RANK = ["fix first", "founder decision", "ship"]; // most restrictive first

/**
 * H5: the verdict of a review body, from the closed set ship / fix first /
 * founder decision, or "". Reads only lines that START with `Verdict:` (so text
 * a reviewer quoted mid-line never counts) and keeps nothing after the phrase.
 * If several such lines disagree, the most restrictive wins, so an echoed
 * "Verdict: ship" line can never override "fix first".
 */
export function verdictOf(body) {
  const found = [...String(body ?? "").matchAll(/^[ \t]*\**Verdict:?\**:?[ \t]*(ship|fix[ \t]+first|founder[ \t]+decision)\b/gim)]
    .map((m) => m[1].toLowerCase().replace(/\s+/g, " "));
  return VERDICT_RANK.find((v) => found.includes(v)) ?? "";
}

/**
 * H2: `hits` is the list of paths ghAll reports as stopped by its page cap. A
 * capped open-PR list means the dispatcher cannot see every PR, so it must say
 * so and assign nothing.
 */
export function capNotice(hits) {
  if (!(hits ?? []).some((p) => /\/pulls\?state=open/.test(p))) return { stop: false, message: "" };
  return {
    stop: true,
    message: "STOPPED: the open PR list hit the 1,000 item paging cap, so some open PRs (agent PRs among them) are not visible. No new work is assigned until fewer than 1,000 PRs are open. Close the drive-by PRs, then rerun.",
  };
}

const STATE_KEYS = { day: "string", lastDigest: "string", runs: "object", claims: "object", standing: "object", verdicts: "object", reviewfp: "object", drift: "object", d041: "object", lanes: "object" };

/** H11: board state with only the known keys, each of the right type. Anything else is dropped. */
export function cleanState(raw) {
  const out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [k, type] of Object.entries(STATE_KEYS)) {
    const v = raw[k];
    if (typeof v !== type || v === null || (type === "object" && Array.isArray(v))) continue;
    out[k] = v;
  }
  return out;
}

/** H11: the base64 payload of the LAST state marker in a board body (the dispatcher appends its own at the end). */
export function lastStateMarker(body) {
  const all = [...String(body ?? "").matchAll(/<!-- agents-state:([A-Za-z0-9+/=]+) -->/g)];
  return all.length ? all[all.length - 1][1] : undefined;
}

/** H11: a title printed on the board, with no comment opener or closer that could pass as a marker. */
export function boardText(text) {
  return oneLine(text, 200).replace(/<!--|-->/g, "");
}

/** H4: the error for a verdict cache with no trust context. */
export const NO_TRUST_MSG = "verdicts: no roster, so no trust context; refusing to count any review (fail closed)";
