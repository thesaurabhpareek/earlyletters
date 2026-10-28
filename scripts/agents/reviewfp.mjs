// Review fingerprints (owner: ops). A red-team review stays valid while the PR's
// own changes are the same, even if develop was merged into it. Contract:
//   ctx = { state, now, repo, gh, openPRs, prFacts, agentOfPR, roster, env }  (all passed by hctx)
// state.reviewfp[<pr number>] = { sha, fp, carried, differs }:
//   sha, fp: the head assigned for review and the fingerprint of the PR's changes
//            at that head (null when unknown);
//   carried: { sha, verdict, at }, the newest later head whose changes matched, so
//            the red team was not re-assigned; verdict and date are those of the
//            review of `sha` that the head inherits. boardLines shows it; pause.mjs
//            leaves such a head out of "Awaiting re-review";
//   differs: the newest later head whose changes did not match (not fetched again).
// One files call per PR per head (gh, one page of 100), and only for PRs that
// already have state.reviewfp set or that are being assigned.
// A match saves the red team's run. It is not a review of the new head: the merge
// rule (docs/agents/COORDINATION.md section 6) reads reviews on the current head.
// Design, and what the fingerprint cannot see: docs/agents/hardening/lanes-and-review-churn.md.
import { createHash } from "node:crypto";
import { trustContext, isTrusted, startsWithMarker } from "./lib.mjs";

/** Hunk headers carry line numbers that move when develop changes lines above the PR's edits. */
export function normalizePatch(patch) {
  return String(patch).replace(/^@@ -\d+(?:,\d+)? \+\d+(?:,\d+)? @@/gm, "@@");
}

/**
 * sha1 over the sorted `filename + "\n" + patch` of a pulls/{n}/files page, or
 * undefined when it cannot be trusted: the call failed, the page may be
 * incomplete (100 files or more), or a text patch is missing or truncated.
 * Files with no patch and no changed lines (binary, pure rename) use their
 * status and blob sha instead.
 */
export function fingerprint(files) {
  if (!Array.isArray(files) || files.length >= 100) return undefined;
  const parts = [];
  for (const f of files) {
    const changed = (f.additions ?? 0) + (f.deletions ?? 0);
    if (typeof f.patch !== "string") {
      if (changed > 0) return undefined;
      parts.push(`${f.filename}\n${f.status}:${f.previous_filename ?? ""}:${f.sha ?? ""}`);
      continue;
    }
    const lines = f.patch.split("\n").filter((l) => l.startsWith("+") || l.startsWith("-")).length;
    if (lines < changed) return undefined;
    parts.push(`${f.filename}\n${f.previous_filename ? `from:${f.previous_filename}\n` : ""}${normalizePatch(f.patch)}`);
  }
  parts.sort();
  return createHash("sha1").update(parts.join("\n\0\n")).digest("hex");
}

// Per-run cache, keyed by the state object, so hctx() can be rebuilt freely.
const runCache = new WeakMap();
function currentFp(ctx, pr) {
  if (!runCache.has(ctx.state)) runCache.set(ctx.state, new Map());
  const cache = runCache.get(ctx.state);
  const key = `${pr.number}@${pr.head.sha}`;
  if (!cache.has(key)) {
    const files = ctx.gh(`/repos/${ctx.repo}/pulls/${pr.number}/files?per_page=100`, { allowFail: true });
    cache.set(key, fingerprint(files));
  }
  return cache.get(key);
}

/** Drop entries for PRs that are no longer open. */
export function prune(ctx) {
  if (!ctx.state.reviewfp || !Array.isArray(ctx.openPRs)) return;
  const open = new Set(ctx.openPRs.map((p) => String(p.number)));
  for (const n of Object.keys(ctx.state.reviewfp)) if (!open.has(n)) delete ctx.state.reviewfp[n];
}

/** The trusted red-team review (or comment) of this exact head, or undefined. */
export function reviewedAt(ctx, pr, sha) {
  const trust = trustContext(ctx.roster, ctx.env ?? {});
  return (ctx.prFacts(pr).all ?? []).find((c) => isTrusted(c, trust) && startsWithMarker(c.body, `<!-- red-team:${sha} -->`));
}

/**
 * True when this PR's current changes match ones the red team already reviewed.
 * A match is recorded in state as `carried` (against the current head) and a
 * mismatch as `differs`, so later ticks answer without a files call.
 */
export function equivalentReviewed(ctx, pr) {
  prune(ctx);
  const rec = ctx.state.reviewfp?.[pr.number];
  const head = pr.head?.sha;
  if (!rec?.fp || !rec.sha || !head || rec.sha === head) return false;
  const review = reviewedAt(ctx, pr, rec.sha);
  if (!review) return false;
  if (rec.carried?.sha === head) return true;
  if (rec.differs === head) return false;
  const fp = currentFp(ctx, pr);
  if (fp === undefined) return false;
  if (fp !== rec.fp) { rec.differs = head; return false; }
  const verdict = (review.body.match(/Verdict:\s*([a-z ]+)/i)?.[1] ?? "").trim().toLowerCase();
  rec.carried = { sha: head, verdict, at: String(review.submitted_at ?? review.created_at ?? "").slice(0, 10) };
  delete rec.differs;
  return true;
}

/** Called when a review of this PR is assigned. */
export function recordAssigned(ctx, pr) {
  if (!pr?.number || !pr.head?.sha) return;
  ctx.state.reviewfp ??= {};
  prune(ctx);
  ctx.state.reviewfp[pr.number] = { sha: pr.head.sha, fp: currentFp(ctx, pr) ?? null };
}

/**
 * Board lines: open agent PRs whose current head has the same changes as a head
 * the red team reviewed, named with both heads and the review the head inherits
 * ([] when none). Runs every tick, so the record exists whether or not the red
 * team was free to be considered for the PR. Not a review of the new head.
 */
export function boardLines(ctx) {
  try {
    const recs = ctx?.state?.reviewfp;
    if (!recs || typeof ctx.prFacts !== "function") return [];
    const agentOf = ctx.agentOfPR ?? (() => undefined);
    const rows = [];
    for (const pr of [...(ctx.openPRs ?? [])].sort((a, b) => a.number - b.number)) {
      const rec = recs[pr.number];
      const head = pr.head?.sha;
      if (!rec || !head || !agentOf(pr)) continue;
      if (ctx.prFacts(pr).redTeam || !equivalentReviewed(ctx, pr)) continue;
      const c = rec.carried;
      const when = c.at ? ` on ${c.at}` : "";
      const verdict = c.verdict ? `, verdict "${c.verdict}"` : "";
      rows.push(`- #${pr.number} (\`${agentOf(pr)}\`): head ${head.slice(0, 7)} has the same changes as ${rec.sha.slice(0, 7)}, which the red team reviewed${when}${verdict}; the red team is not re-assigned. Nothing is posted on ${head.slice(0, 7)}: the merge rule reads reviews on the current head (COORDINATION.md section 6).`);
    }
    if (!rows.length) return [];
    return [
      "## Same changes as a reviewed head",
      "",
      ...rows,
      "- A match compares the PR's own diff only (docs/agents/hardening/lanes-and-review-churn.md lists what it cannot see). It saves the red team's run; it is not a review of the new head.",
    ];
  } catch {
    return [];
  }
}
