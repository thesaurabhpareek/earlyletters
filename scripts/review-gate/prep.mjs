#!/usr/bin/env node
// Review-prep helper (HV2-B36, owner: qa; ASCII only, no em or en dashes). For one PR number it prints what a reviewer and the
// founder need in one place: the full 40-char head sha, CI on that sha (the three required
// contexts), the diff stat, the files to read, the review claims counted at that sha, and a
// ready-to-paste founder ask: `Merge #N at <full sha>` with CI and a recommendation field.
//
// Usage:
//   node scripts/review-gate/prep.mjs <pr-number>
//   node scripts/review-gate/prep.mjs <pr-number> --repo owner/name   (default thesaurabhpareek/earlyletters)
//
// Exit 0: facts printed (the ask is printed only when both reviews and all three required
//         contexts are green at the head).
// Exit 1: the head sha is not a full 40-char lowercase hex string, a review exists only at an
//         older sha (stale), the head moved while this ran, or a read failed.
//
// Read-only: every call is a GET through `gh api` (REST; GraphQL is blocked). No token, header
// or gh stderr is read or printed. It never merges, labels, comments or marks anything ready.
//
// Review parser: scripts/review-gate/decide.mjs (#559) is not on develop, so it is NOT imported.
// This file has a small local parser instead. It follows the strict rule of CR-44 and the same
// reading as scripts/agents/merge-queue.mjs: the FIRST LINE of a comment must be exactly
// `## Review A|B at <40 lowercase hex>: PASS` (or `PASS WITH NOTES`, CR-63), the comment must
// come from an OWNER, MEMBER or COLLABORATOR, the sha must equal the head in all 40 characters,
// a `Must fix:` line that names something takes a pass away, and a PASS WITH NOTES also needs a
// "Must fix: none" line or one of the CR-63 phrasings (copied from merge-queue.mjs, not imported). The newest verdict per lens
// at the head decides. When #559 merges, swap the local parser for its export in a new PR.
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

export const DEFAULT_REPO = "thesaurabhpareek/earlyletters";
export const REQUIRED = ["required", "compliance-fence", "applied migrations unchanged"];
export const FULL_SHA = /^[0-9a-f]{40}$/;
const TRUSTED = ["OWNER", "MEMBER", "COLLABORATOR"];
const FIRST_LINE = /^## Review ([AB]) at ([0-9a-f]{40}): (\S.*?)[ \t]*$/;
const MUST_FIX = /^[ \t>*_#-]*must[ -]fix(?:es)?[ \t*_]*:[ \t*_]*(.*)$/gim;
// Copied from merge-queue.mjs (see effectiveVerdict below): other ways reviews say "Must fix: none".
const NO_MUST_FIX = /\b(no\s+musts?\b|there\s+is\s+no\s+must[ -]?fix|no\s+must[ -]?fix(es)?\b|nothing\s+(must|has\s+to)\s+be\s+fixed)/i;
const NOISE_FILES = /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$|\.snap$|\/fixtures\//;

/** Strip ANSI escapes and control characters from anything printed (PR text is data). */
export const clean = (v) => String(v ?? "").replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, "").replace(/[\u0000-\u001f\u007f-\u009f]/g, "");

/**
 * CR-63 rule, copied from effectiveVerdict in scripts/agents/merge-queue.mjs (origin/develop on 20 Nov 2026).
 * It is a copy, not an import, because the two layouts may differ between branches. If you change one, change
 * the other: scripts/review-gate/fixtures/parser-cases.mjs holds the 21 cases both must agree on.
 * A pass stays a pass only if no "Must fix:" line names anything, and a PASS WITH NOTES also says it has no must-fix.
 */
function effectiveVerdict(word, body) {
  if (word !== "PASS" && word !== "PASS WITH NOTES") return word;
  const text = String(body ?? "").replace(/\r/g, "");
  const rests = [...text.matchAll(MUST_FIX)].map((x) => x[1].trim());
  if (rests.some((r) => !/^none\b/i.test(r))) return `${word} (open Must fix)`;
  if (word === "PASS WITH NOTES" && rests.length === 0 && !NO_MUST_FIX.test(text)) return `${word} (no "Must fix: none" line)`;
  return word;
}

/** First line strict. Returns { lens, sha, stated, word } or null. `word` is the verdict after the Must fix check. */
export function parseReview(body) {
  const text = String(body ?? "").replace(/\r/g, "");
  const m = FIRST_LINE.exec(text.split("\n", 1)[0]);
  if (!m) return null;
  return { lens: m[1], sha: m[2], stated: m[3], word: effectiveVerdict(m[3], text) };
}
const isPass = (w) => w === "PASS" || w === "PASS WITH NOTES";

/** Per lens at `head`, the newest trusted verdict decides. Older-sha passes with nothing at head are stale. */
export function reviewState(comments, head) {
  const ordered = comments
    .map((c, i) => ({ c, i }))
    .sort((x, y) => String(x.c.created_at ?? "").localeCompare(String(y.c.created_at ?? "")) || (x.c.id ?? 0) - (y.c.id ?? 0) || x.i - y.i);
  const latest = {};
  const olderPass = new Set();
  const untrusted = new Set();
  for (const { c } of ordered) {
    const r = parseReview(c.body);
    if (!r) continue;
    if (!TRUSTED.includes(c.author_association)) {
      if (r.sha === head) untrusted.add(r.lens);
      continue;
    }
    if (r.sha === head) latest[r.lens] = r.word;
    else if (isPass(r.word)) olderPass.add(r.lens);
  }
  return {
    A: isPass(latest.A),
    B: isPass(latest.B),
    latest,
    stale: [...olderPass].filter((l) => !(l in latest)),
    untrusted: [...untrusted].filter((l) => !(l in latest)),
  };
}

/** Newest check run per required name -> success, failure, pending or missing. */
export function ciState(runs, required = REQUIRED) {
  const newest = new Map();
  for (const r of runs) {
    const name = clean(r.name);
    const prev = newest.get(name);
    if (!prev || (r.id ?? 0) > (prev.id ?? 0)) newest.set(name, r);
  }
  const out = {};
  for (const name of required) {
    const r = newest.get(name);
    out[name] = !r ? "missing" : r.status !== "completed" ? "pending" : (r.conclusion ?? "pending");
  }
  return out;
}

async function getAll(api, path) {
  const out = [];
  for (let page = 1; page <= 10; page++) {
    const rows = await api(`${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`);
    if (!Array.isArray(rows)) throw new Error(`${path.split("?")[0]} did not return a list`);
    out.push(...rows);
    if (rows.length < 100) break;
  }
  return out;
}

/** Build the report. `api(path)` is an injected GET returning parsed JSON. Returns { lines, exitCode }. */
export async function prep({ api, pr, repo = DEFAULT_REPO }) {
  const lines = [];
  const warn = [];
  const base = `repos/${repo}`;
  const pull = await api(`${base}/pulls/${pr}`);
  const head = pull?.head?.sha;
  if (typeof head !== "string" || !FULL_SHA.test(head)) {
    return { exitCode: 1, lines: [`#${pr}: head sha is not a full 40-char lowercase hex string (got "${clean(head).slice(0, 60)}"). No ask printed.`] };
  }
  const baseRef = clean(pull.base?.ref || "develop");
  let required = REQUIRED;
  try {
    const prot = await api(`${base}/branches/${baseRef}/protection`);
    const ctx = prot?.required_status_checks?.contexts;
    if (Array.isArray(ctx) && ctx.length) required = ctx.map(clean);
    else warn.push("protection read gave no contexts; using the default three");
  } catch {
    warn.push("protection read failed; using the default three");
  }
  const checks = await api(`${base}/commits/${head}/check-runs?per_page=100`);
  const ci = ciState(checks?.check_runs ?? [], required);
  const files = await getAll(api, `${base}/pulls/${pr}/files`);
  const comments = await getAll(api, `${base}/issues/${pr}/comments`);
  const reviews = reviewState(comments, head);

  const ciOk = Object.values(ci).every((v) => v === "success");
  const ciText = Object.entries(ci).map(([k, v]) => `${k}=${v}`).join(", ");
  lines.push(`PR #${pr}: ${clean(pull.title).slice(0, 120)}`);
  lines.push(`base: ${baseRef}   draft: ${pull.draft ? "yes" : "no"}   mergeable_state: ${clean(pull.mergeable_state ?? "unknown")}`);
  lines.push(`head sha: ${head}`);
  lines.push(`CI on that sha: ${ciText}`);
  const add = files.reduce((n, f) => n + (f.additions ?? 0), 0);
  const del = files.reduce((n, f) => n + (f.deletions ?? 0), 0);
  lines.push(`diff stat: ${files.length} files, +${add} -${del}`);
  if ((pull.changed_files ?? files.length) > files.length) warn.push(`PR has ${pull.changed_files} changed files; only ${files.length} were read`);
  const toRead = files
    .filter((f) => !NOISE_FILES.test(f.filename))
    .sort((a, b) => (b.additions ?? 0) + (b.deletions ?? 0) - ((a.additions ?? 0) + (a.deletions ?? 0)));
  lines.push("files to read (largest first, lockfiles and fixtures skipped):");
  for (const f of toRead.slice(0, 20)) lines.push(`  ${clean(f.filename)}  +${f.additions ?? 0} -${f.deletions ?? 0}`);
  if (toRead.length > 20) lines.push(`  ... and ${toRead.length - 20} more`);
  const lens = (l) => (reviews[l] ? `counted (${reviews.latest[l]})` : l in reviews.latest ? `NOT a pass (${clean(reviews.latest[l])})` : reviews.stale.includes(l) ? "STALE (pass at an older sha only)" : "none at head");
  lines.push(`reviews at head (local strict parser, CR-44): A ${lens("A")}; B ${lens("B")}`);
  if (reviews.untrusted.length) warn.push(`Review ${reviews.untrusted.join("/")} at head came from a commenter who is not OWNER, MEMBER or COLLABORATOR (ignored)`);

  let exitCode = 0;
  if (reviews.stale.length) {
    exitCode = 1;
    lines.push(`STALE REVIEW: Review ${reviews.stale.join("/")} is at an older sha. Re-review at ${head}.`);
  }
  // Re-read the head right before printing the ask: a moved head voids everything above.
  const again = await api(`${base}/pulls/${pr}`);
  if (again?.head?.sha !== head) {
    return { exitCode: 1, lines: [...lines, `HEAD MOVED while this ran (now ${clean(again?.head?.sha)}). Run it again. No ask printed.`] };
  }
  if (pull.draft) {
    lines.push("");
    lines.push(`No founder ask: draft: mark ready first. The merge queue skips drafts.`);
  } else if (reviews.A && reviews.B && ciOk) {
    lines.push("");
    lines.push("Founder ask (paste this):");
    lines.push(`Merge #${pr} at ${head}`);
    lines.push(`CI: ${ciText}`);
    lines.push("Recommendation: <one line: merge, or hold and why>");
  } else {
    const why = [];
    if (!reviews.A) why.push("Review A not counted");
    if (!reviews.B) why.push("Review B not counted");
    if (!ciOk) why.push("a required context is not success");
    lines.push("");
    lines.push(`No founder ask yet: ${why.join("; ")}.`);
  }
  for (const w of warn) lines.push(`note: ${w}`);
  return { exitCode, lines };
}

function ghApi(path) {
  const where = path.split("?")[0];
  return new Promise((resolve, reject) => {
    // stderr and headers are never read or printed.
    execFile("gh", ["api", "-X", "GET", path], { maxBuffer: 64 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(new Error(`gh api ${where} failed`));
      try { resolve(JSON.parse(stdout)); } catch { reject(new Error(`gh api ${where}: not JSON`)); }
    });
  });
}

export function parseArgs(argv) {
  const o = { pr: null, repo: DEFAULT_REPO };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--repo") o.repo = argv[++i];
    else if (/^[1-9][0-9]{0,6}$/.test(a) && o.pr === null) o.pr = Number(a);
    else throw new Error(`unknown argument ${a}`);
  }
  if (o.pr === null) throw new Error("usage: prep.mjs <pr-number> [--repo owner/name]");
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(String(o.repo)) || String(o.repo).split("/").some((x) => /^\.+$/.test(x))) throw new Error("--repo must look like owner/name");
  return o;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  (async () => {
    const o = parseArgs(process.argv.slice(2));
    const { lines, exitCode } = await prep({ api: ghApi, pr: o.pr, repo: o.repo });
    console.log(lines.join("\n"));
    process.exit(exitCode);
  })().catch((e) => { console.error(e.message); process.exit(1); });
}
