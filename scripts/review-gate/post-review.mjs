#!/usr/bin/env node
// Review poster (owner: qa). It exists so the founder never has to paste review comments:
// a reviewer writes the review to a file, this script checks it and posts it as a PR comment.
//
// Usage:
//   node scripts/review-gate/post-review.mjs <pr-number> <review-file>           dry run (default)
//   node scripts/review-gate/post-review.mjs <pr-number> <review-file> --post    post the comment
//   add --repo owner/name to change the repo (default thesaurabhpareek/earlyletters)
//
// The first line of the file must be exactly one of
//   ## Review A at <40 lowercase hex>: PASS        (or: PASS WITH NOTES, or: CHANGES)
//   ## Review B at <40 lowercase hex>: PASS        (same words)
// Refusals (exit 1, nothing posted):
// - the first line is not exactly that shape, the sha is not 40 hex characters, or the lens is
//   not A or B: a verdict is never posted from a file whose lens this script did not read
// - the file has no text after the header (a bare verdict says nothing about what was read)
// - a PASS names something after `Must fix:`, or a PASS WITH NOTES has no `Must fix: none` line
//   (CR-63), so the header cannot contradict the body
// - the sha in the header is not the live PR head (re-read right before posting too)
// - the PR is not open
// - a comment with the same header line already exists on the PR (idempotent: posting twice is a no-op refusal)
// - the file has any non-ASCII character, which covers em dashes, en dashes, curly quotes and emoji (CLAUDE.md content rules)
//
// It never merges, never labels, never marks a draft ready and never edits or deletes a comment.
// The only write is one POST of one issue comment, and only with --post. Reads and the write go
// through `gh api` (REST; GraphQL is blocked). No token, header or gh stderr is read or printed.
// Independence note (CR-32): this tool checks form, not truth. It cannot tell whether the
// reviewer read the diff, and a review of your own work is still not independent.
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const DEFAULT_REPO = "thesaurabhpareek/earlyletters";
export const HEADER = /^## Review ([AB]) at ([0-9a-f]{40}): (PASS WITH NOTES|PASS|CHANGES)$/;
const MUST_FIX = /^[ \t>*_#-]*must[ -]fix(?:es)?[ \t*_]*:[ \t*_]*(.*)$/gim;

export class Refusal extends Error {}

/** Check the file text alone. Returns { lens, sha, verdict, header }. Throws Refusal. */
export function checkFile(text) {
  const bad = [...String(text)].find((ch) => ch.charCodeAt(0) > 127);
  if (bad !== undefined) throw new Refusal(`file has a non-ASCII character (U+${bad.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}); em and en dashes, curly quotes and emoji are not allowed`);
  const norm = String(text).replace(/\r/g, "");
  const [first, ...rest] = norm.split("\n");
  const m = HEADER.exec(first);
  if (!m) throw new Refusal("first line must be exactly `## Review A|B at <40 lowercase hex>: PASS|PASS WITH NOTES|CHANGES`");
  const [header, lens, sha, verdict] = m;
  if (!rest.join("\n").trim()) throw new Refusal("the review has no text after the header");
  const fixes = [...norm.matchAll(MUST_FIX)].map((x) => x[1].trim());
  if (verdict !== "CHANGES" && fixes.some((r) => !/^none\b/i.test(r))) throw new Refusal("header says pass but a `Must fix:` line names something");
  if (verdict === "PASS WITH NOTES" && !fixes.some((r) => /^none\b/i.test(r))) throw new Refusal("PASS WITH NOTES needs a `Must fix: none` line");
  return { lens, sha, verdict, header };
}

async function allComments(api, repo, pr) {
  const out = [];
  for (let page = 1; page <= 20; page++) {
    const rows = await api(`repos/${repo}/issues/${pr}/comments?per_page=100&page=${page}`);
    if (!Array.isArray(rows)) throw new Refusal("comment list did not come back as a list; not posting");
    out.push(...rows);
    if (rows.length < 100) break;
  }
  return out;
}

/**
 * Check everything and post only when `post` is true. `api(path)` is an injected GET;
 * `poster(path, body)` is an injected POST. Returns { action, header, message }.
 */
export async function postReview({ pr, text, api, poster, repo = DEFAULT_REPO, post = false }) {
  const { header, sha, lens, verdict } = checkFile(text);
  const pull = await api(`repos/${repo}/pulls/${pr}`);
  const live = pull?.head?.sha;
  if (pull?.state !== "open") throw new Refusal(`PR #${pr} is not open`);
  if (live !== sha) throw new Refusal(`header sha ${sha} is not the live head ${live}; the review is stale or for another commit`);
  const comments = await allComments(api, repo, pr);
  if (comments.some((c) => String(c.body ?? "").replace(/\r/g, "").split("\n", 1)[0].trimEnd() === header)) {
    throw new Refusal(`a comment with this exact header already exists on #${pr}; nothing to post`);
  }
  if (!post) return { action: "dry-run", header, message: `dry run: would post Review ${lens} ${verdict} at ${sha} to #${pr}. Add --post to post.` };
  // Re-read the head right before the write: a push in between voids the review.
  const again = await api(`repos/${repo}/pulls/${pr}`);
  if (again?.head?.sha !== sha) throw new Refusal(`head moved to ${again?.head?.sha} just before posting; nothing posted`);
  await poster(`repos/${repo}/issues/${pr}/comments`, text.replace(/\r/g, "").trimEnd() + "\n");
  return { action: "posted", header, message: `posted Review ${lens} ${verdict} at ${sha} to #${pr}` };
}

function ghApi(path) {
  const where = path.split("?")[0];
  return new Promise((resolve, reject) => {
    execFile("gh", ["api", "-X", "GET", path], { maxBuffer: 64 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(new Error(`gh api ${where} failed`));
      try { resolve(JSON.parse(stdout)); } catch { reject(new Error(`gh api ${where}: not JSON`)); }
    });
  });
}

/** The one write: POST one issue comment. The body goes in on stdin as JSON, never on the command line. */
function ghPost(path, body) {
  return new Promise((resolve, reject) => {
    const child = execFile("gh", ["api", "-X", "POST", path, "--input", "-"], { maxBuffer: 8 * 1024 * 1024 }, (err) => {
      if (err) return reject(new Error(`gh api POST ${path} failed`));
      resolve();
    });
    child.stdin.end(JSON.stringify({ body }));
  });
}

export function parseArgs(argv) {
  const o = { pr: null, file: null, post: false, repo: DEFAULT_REPO };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--post") o.post = true;
    else if (a === "--dry-run") o.post = false;
    else if (a === "--repo") o.repo = argv[++i];
    else if (o.pr === null && /^[1-9][0-9]{0,6}$/.test(a)) o.pr = Number(a);
    else if (o.file === null && !a.startsWith("--")) o.file = a;
    else throw new Error(`unknown argument ${a}`);
  }
  if (o.pr === null || o.file === null) throw new Error("usage: post-review.mjs <pr-number> <review-file> [--dry-run | --post] [--repo owner/name]");
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(String(o.repo)) || String(o.repo).split("/").some((x) => /^\.+$/.test(x))) throw new Error("--repo must look like owner/name");
  return o;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  (async () => {
    const o = parseArgs(process.argv.slice(2));
    const text = readFileSync(o.file, "utf8");
    const r = await postReview({ pr: o.pr, text, api: ghApi, poster: ghPost, repo: o.repo, post: o.post });
    console.log(r.message);
  })().catch((e) => { console.error(e instanceof Refusal ? `refused: ${e.message}` : e.message); process.exit(1); });
}
