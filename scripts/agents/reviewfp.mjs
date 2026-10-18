// Review fingerprints (owner: ops). A red-team review stays valid while the PR's
// own changes are the same, even if develop was merged into it. Contract:
//   ctx = { state, now, repo, gh, openPRs, prFacts, roster, env }  (all passed by hctx)
// state.reviewfp[<pr number>] = { sha, fp }: the head assigned for review and the
// fingerprint of the PR's changes at that head (null when unknown).
// One files call per PR per run (gh, one page of 100), and only for PRs that
// already have state.reviewfp set or that are being assigned.
// Design: docs/agents/hardening/lanes-and-review-churn.md.
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

/** True when a trusted red-team review exists for this exact head. */
export function reviewedAt(ctx, pr, sha) {
  const trust = trustContext(ctx.roster, ctx.env ?? {});
  return (ctx.prFacts(pr).all ?? []).some((c) => isTrusted(c, trust) && startsWithMarker(c.body, `<!-- red-team:${sha} -->`));
}

/** True when this PR's current changes match ones the red team already reviewed. */
export function equivalentReviewed(ctx, pr) {
  prune(ctx);
  const rec = ctx.state.reviewfp?.[pr.number];
  if (!rec?.fp || !rec.sha || rec.sha === pr.head.sha) return false;
  if (!reviewedAt(ctx, pr, rec.sha)) return false;
  const fp = currentFp(ctx, pr);
  return fp !== undefined && fp === rec.fp;
}

/** Called when a review of this PR is assigned. */
export function recordAssigned(ctx, pr) {
  if (!pr?.number || !pr.head?.sha) return;
  ctx.state.reviewfp ??= {};
  prune(ctx);
  ctx.state.reviewfp[pr.number] = { sha: pr.head.sha, fp: currentFp(ctx, pr) ?? null };
}
