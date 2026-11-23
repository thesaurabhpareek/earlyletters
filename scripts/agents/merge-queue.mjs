#!/usr/bin/env node
// Merge queue table (HV2-B32, owner: ops). One command, a live table of every open
// non-draft PR: head sha, age of the last push, counted reviews AT THAT HEAD, CI, verdict.
// Nobody should re-derive this by hand-scanning PRs, and no review should be posted at
// a head that has moved.
//
// Usage (docs/agents/harness-v2/BACKLOG.md is not on develop, so usage lives here):
//   node scripts/agents/merge-queue.mjs                    table of all open non-draft PRs
//   node scripts/agents/merge-queue.mjs --only READY       only rows with that verdict
//   node scripts/agents/merge-queue.mjs --quiet-minutes 20 head must be quiet 20 min (default 10)
//   node scripts/agents/merge-queue.mjs --json             machine-readable rows
//   node scripts/agents/merge-queue.mjs --base <branch>    list PRs into that base (default develop)
//   node scripts/agents/merge-queue.mjs --all-bases       list every base; other bases show OTHER-BASE, no ready line
//   node scripts/agents/merge-queue.mjs --repo owner/name  default thesaurabhpareek/earlyletters (validated)
//
// Read-only: every call is a GET through `gh api` (REST; GraphQL is blocked). There is no
// write path in this file. No token is read or printed here; `gh` holds its own login.
//
// Rules it applies:
// - A review counts only if the FIRST LINE of a PR comment is exactly
//   `## Review A at <40 hex>: PASS` or `...: PASS WITH NOTES` (or `Review B`); notes never
//   block (Karma's ruling CR-63, 20 Nov 2026). The sha must equal the PR head, all
//   40 characters. Later lines are read for one thing only, the "Must fix:" line, and only to
//   take a pass away, never to make one: a `PASS WITH NOTES` counts only with a line
//   `Must fix: none`, and any verdict with a `Must fix:` line naming something is not a pass.
//   Other words in the body (failure, until) cannot change the result.
// - Only comments by OWNER, MEMBER or COLLABORATOR (author_association) count; the repo is
//   public. An ignored PASS prints a note under the table.
// - Reviews at an older 40-char sha are shown as stale, never as passes.
// - "Age of last push" is minutes since the head commit's committer date (a proxy: the
//   REST API has no push time; a rebase or amend gives a new committer date).
// - Required CI: the contexts in branch protection of the PR's base, read at runtime
//   (GET repos/<repo>/branches/<base>/protection). If that read fails the fallback is
//   `applied migrations unchanged`, `required`, `compliance-fence`, with a notice. Newest
//   run of each name on the head counts. queued and in_progress counts over ALL runs are
//   shown separately.
// - macOS checks (`iOS simulator build ...`, `store-profile Release launch ...`): if the PR
//   changes apps/mobile/ios/, apps/mobile/modules/, apps/mobile/app.config.*,
//   apps/mobile/eas.json or the root package-lock.json, both must be success to be READY.
//   Red gives WATCH-RED <check name>; unfinished or missing gives WAIT-CI. For a PR that
//   touches none of those paths they never block and show in the `watch` column. Changed
//   files are fetched only for PRs that are otherwise ready (fewer calls).
// - Security: only GET reads through `gh api` (or an injected api function). No token,
//   header or gh stderr is ever read, printed or logged. A READY row is followed by one
//   line for Karma (CR-73): `#<n> ready for Karma to merge (CR-73) at <40-char head sha>`
//   (JSON key `mergeNote`, was `founderAsk`). Nobody is asked to approve, comment or paste.
// - Security lens (CR-73): if an otherwise ready PR touches the trigger list (SECURITY_LENS_PATHS,
//   the CR-70 founder-only path list) and no counted review at head has a `Lens:` line naming
//   `security` or `security-architect`, the verdict is NEEDS-REVIEW with `reason: "security lens
//   missing"` and a note under the table. If the PR's file list is incomplete (count differs from
//   changed_files, or paging hit its cap) the verdict is NEEDS-REVIEW, reason "file list incomplete".
//   It is a report; nothing here merges.
// - Stale base: for an otherwise ready PR, REST compare `<base>...<head>` gives behind_by. If behind_by > 0 and the
//   files changed on the base since the merge-base (compare `<head>...<base>`) share a top-level workspace with the
//   PR's own files (workspaceOf: apps/<x>, packages/<x>, docs/<x>, else the first directory; a root file is
//   "(root)"), the verdict is NEEDS-UPDATE: green checks and reviews were earned on an old base (strict status checks
//   are off, so GitHub does not stop it; 21 Nov, #1128 and #839). behind_by > 0 with no shared workspace stays READY and
//   prints a note with the count. If either compare call fails, is not a number, or the base file list may be cut
//   off (300 files), the verdict is NEEDS-REVIEW with reason "base compare failed", never READY.
// - Claims: lines of docs/agents/CLAIMS.md (if present, not required) that mention
//   `#<pr>`. Holder = the cell after the PR in a table row, else `by <x>`, `holder: <x>`
//   or `@<x>` on the line (U: the file's format is not fixed anywhere yet).
//
// Verdicts, first match wins:
//   DIRTY          mergeable_state is dirty (conflicts)
//   STALE-UNKNOWN  mergeable_state is unknown and the head is older than 7 days (GitHub never
//                  computed it, or the PR is abandoned); never READY, no ready line, printed
//                  in its own group under the table. A fresh PR with unknown mergeability
//                  is not stale: it keeps the normal verdicts (WAIT-CI at the latest).
//   OTHER-BASE     (--all-bases) PR is not into the listed base; never gets a ready line
//   BLOCKED-REVIEW the newest trusted verdict at head for a lens is not exactly PASS or
//                  PASS WITH NOTES (BLOCKED, CHANGES, FAIL, ...); a later pass clears it
//   NEEDS-REVIEW   a counted PASS is missing and no older-sha review exists, or the PR touches the
//                  security-lens trigger list and no counted review names that lens (reason)
//   NEEDS-UPDATE   otherwise ready, but the base is behind and the new base commits touch a workspace the PR touches
//   STALE-REVIEW   a counted PASS is missing at head, and one exists at an older sha
//   CI-FAIL        a required context concluded with something other than success
//   WATCH-RED      native/lockfile PR and a macOS check is red (names the check)
//   WAIT-CI        a required context missing or not finished, or mergeable_state
//                  blocked/behind/unknown/draft/has_hooks
//   WAIT-QUIET     all green but the head is younger than --quiet-minutes, or its commit
//                  date cannot be parsed (unknown age is never quiet)
//   READY          both PASS at head, every required context success, macOS rule met,
//                  mergeable_state clean or unstable, head quiet long enough
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** A head older than this with mergeability still "unknown" is parked as STALE-UNKNOWN (7 days, in minutes). */
export const STALE_UNKNOWN_MINUTES = 7 * 24 * 60;
export const DEFAULT_REPO = "thesaurabhpareek/earlyletters";
export const FALLBACK_REQUIRED = ["applied migrations unchanged", "required", "compliance-fence"];
export const MACOS_CHECKS = [/^iOS simulator build/, /^store-profile Release launch/];
/**
 * CR-74 native paths and build paths (BL-1480; the one-sentence definition is in docs/ops/RELEASE.md 3.4). A PR that touches
 * one is held until both macOS checks are green on its head. The first five are the native project and the lockfile; the
 * next five (metro, store config, version, privacy manifest, permission copy) and apps/mobile/patches/ change what a
 * release build contains or what Apple reads. The security-lens list below is wider (it adds build-env, fonts, babel,
 * .npmrc and more) and leaves out ios/, which is generated by prebuild and not committed.
 */
export const NATIVE_PATHS = [
  /^apps\/mobile\/ios\//, /^apps\/mobile\/modules\//, /^apps\/mobile\/app\.config\./, /^apps\/mobile\/eas\.json$/, /^package-lock\.json$/,
  /^apps\/mobile\/metro\.config\.js$/, /^apps\/mobile\/store\.config\.json$/, /^apps\/mobile\/version\.json$/,
  /^apps\/mobile\/src\/lib\/privacy-manifest\.ts$/, /^apps\/mobile\/src\/lib\/permission-copy\.ts$/, /^apps\/mobile\/patches\//,
];
export const touchesNative = (files) => files.some((f) => [f.filename ?? f, f.previous_filename].some((n) => typeof n === "string" && NATIVE_PATHS.some((re) => re.test(n))));
/**
 * CR-73 security-lens trigger list: the CR-70 founder-only path list, unchanged in content. The list no
 * longer routes a PR to the founder; it sets one condition instead (a counted review that names the
 * `security` or `security-architect` lens). A report only: nothing here merges or blocks a merge call.
 */
export const SECURITY_LENS_CLASSES = [
  { name: ".github", re: /^\.github\// },
  { name: "scripts/agents", re: /^scripts\/agents\// }, { name: "docs/agents", re: /^docs\/agents\// }, { name: "compliance", re: /^compliance\// },
  { name: "scripts/release", re: /^scripts\/release\// }, { name: "scripts/ops", re: /^scripts\/ops\// }, { name: "scripts/packs", re: /^scripts\/packs\// },
  { name: "scripts/insights", re: /^scripts\/insights\// }, { name: "scripts/founder", re: /^scripts\/founder\// },
  { name: "api keys", re: /^packages\/api\/src\/keys\.ts$/ }, { name: "api server", re: /^packages\/api\/src\/server\// }, { name: "emails generated", re: /^packages\/emails\/generated\// },
  { name: "app.config build inputs", re: /^(?:apps\/mobile\/src\/lib\/(?:build-env|permission-copy|privacy-manifest)\.ts|packages\/design-tokens\/fonts\/index\.ts)$/ },
  { name: "metro", re: /^apps\/mobile\/metro\.config\.js$/ }, { name: "store config", re: /^apps\/mobile\/store\.config\.json$/ }, { name: "mobile scripts", re: /^apps\/mobile\/scripts\// },
  { name: "eas.json", re: /(?:^|\/)eas\.json$/ }, { name: "app.config", re: /(?:^|\/)app\.config\.(?:ts|js|mjs|cjs)$/ }, { name: "native modules", re: /^apps\/mobile\/modules\// },
  { name: "version.json", re: /(?:^|\/)version\.json$/ }, { name: ".npmrc", re: /(?:^|\/)\.npmrc$/ }, { name: ".yarnrc", re: /(?:^|\/)\.yarnrc[\w.-]*$/ },
  { name: ".easignore", re: /(?:^|\/)\.easignore$/ }, { name: ".eas", re: /(?:^|\/)\.eas\// }, { name: "patches", re: /^patches\// },
  { name: "babel", re: /(?:^|\/)(?:babel\.config\.(?:js|cjs|mjs|json|ts)|\.babelrc(?:\.(?:js|json))?)$/ }, { name: ".env", re: /(?:^|\/)\.env(?:[.\w-]*)$/ },
  { name: "lockfile", re: /^package-lock\.json$/ }, { name: "package.json", re: /(?:^|\/)package\.json$/ },
  { name: "next.config", re: /^apps\/web\/next\.config\./ }, { name: "vercel.json", re: /(?:^|\/)vercel\.json$/ },
  { name: "web scripts", re: /^apps\/web\/scripts\// }, { name: "web api", re: /^apps\/web\/src\/app\/api\// }, { name: "supabase", re: /^supabase\// },
  { name: "engine files", re: /^packages\/core\/src\/(?:verify|meaning|types|pipeline|plan)\.ts$/ },
];
export const SECURITY_LENS_PATHS = SECURITY_LENS_CLASSES.map((c) => c.re);
/** Pure: the changed paths (new name or old name of a rename) that are on the security-lens trigger list, in order, once each. */
export const securityLensHits = (files) => {
  const hits = [];
  for (const f of files) {
    const names = [f?.filename ?? f, f?.previous_filename].filter((n) => typeof n === "string");
    if (names.some((n) => SECURITY_LENS_PATHS.some((re) => re.test(n))) && !hits.includes(names[0])) hits.push(names[0]);
  }
  return hits;
};
export const touchesSecurityLens = (files) => securityLensHits(files).length > 0;
export const SECURITY_LENS_NAMES = ["security", "security-architect"];
/**
 * Lens names a review body gives on `Lens: a, b` lines (bold or bullet marks allowed). Never counted: HTML comments
 * (an unclosed one hides the rest), fenced code (CommonMark: closed only by the same character, at least as long,
 * indented at most 3 spaces, nothing but blanks after it; an unclosed fence hides the rest), `>` quoted lines and
 * lines indented 4 or more spaces or a tab. Exact names only.
 */
export function namedLenses(body) {
  const out = [];
  let fence = null;
  const text = String(body ?? "").replace(/\r/g, "").replace(/<!--[\s\S]*?-->/g, "").replace(/<!--[\s\S]*$/, "");
  for (const line of text.split("\n")) {
    const f = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (fence) {
      if (f && f[1][0] === fence.ch && f[1].length >= fence.len && /^[ \t]*$/.test(f[2])) fence = null;
      continue;
    }
    if (f && !(f[1][0] === "`" && f[2].includes("`"))) { fence = { ch: f[1][0], len: f[1].length }; continue; }
    if (/^\s*>/.test(line) || /^(?: {4}|\t)/.test(line)) continue;
    const m = /^[ \t*_#-]*lens(?:es)?[ \t*_]*:[ \t*_]*(.*)$/i.exec(line);
    if (m) for (const item of m[1].split(/[,;/&]|\band\b/i)) out.push(item.trim().replace(/^[`*_ \t]+|[`*_ \t.]+$/g, "").toLowerCase());
  }
  return out;
}
const REVIEW_RE = /^## Review ([AB]) at ([0-9a-f]{40}): PASS( WITH NOTES)?[ \t]*$/;
/** The two verdict words that meet a lens (CR-63). Exact match: "PASS.", "pass" and the rest do not. */
export const PASSING = Object.freeze(["PASS", "PASS WITH NOTES"]);
const passes = (word) => PASSING.includes(word);
/** A "Must fix:" line anywhere in the body (bold, a bullet or a heading mark allowed before it). */
const MUST_FIX_LINE = /^[ \t>*_#-]*must[ -]fix(?:es)?[ \t*_]*:[ \t*_]*(.*)$/gim;
/** Other ways reviews here have said "Must fix: none" (survey of 20 Nov: "No Must.", "There is no must-fix.", "Nothing must be fixed before merge."). */
const NO_MUST_FIX = /\b(no\s+musts?\b|there\s+is\s+no\s+must[ -]?fix|no\s+must[ -]?fix(es)?\b|nothing\s+(must|has\s+to)\s+be\s+fixed)/i;
/** CR-63: a pass stays a pass only if no "Must fix:" line names anything, and a PASS WITH NOTES also says it has no must-fix. */
export function effectiveVerdict(word, body) {
  if (!passes(word)) return word;
  const rests = [...String(body ?? "").replace(/\r/g, "").matchAll(MUST_FIX_LINE)].map((m) => m[1].trim());
  if (rests.some((r) => !/^none\b/i.test(r))) return `${word} (open Must fix)`;
  if (word === "PASS WITH NOTES" && rests.length === 0 && !NO_MUST_FIX.test(String(body ?? ""))) return `${word} (no "Must fix: none" line)`;
  return word;
}

/** Compare lists at most this many files; a list this long may be cut off and cannot prove "no overlap". */
export const COMPARE_FILE_CAP = 300;
/** Pure: the top-level workspace a path belongs to: apps/<x>, packages/<x>, docs/<x> (docs for a file directly in docs/), else the first directory (scripts, supabase, ...); a root file is "(root)". */
export const workspaceOf = (path) => {
  const parts = String(path ?? "").split("/");
  if (parts.length < 2) return "(root)";
  if (["apps", "packages"].includes(parts[0])) return parts.length > 2 ? `${parts[0]}/${parts[1]}` : parts[0];
  if (parts[0] === "docs") return parts.length > 2 ? `docs/${parts[1]}` : "docs";
  return parts[0];
};
const workspacesOf = (files) => [...new Set(files.flatMap((f) => [f?.filename ?? f, f?.previous_filename]).filter((n) => typeof n === "string").map(workspaceOf))];
/** Pure: { behindBy, shared } where shared = workspaces touched both by the PR files and by the base files since the merge-base. */
export function staleBase({ behindBy, prFiles, baseFiles }) {
  const mine = new Set(workspacesOf(prFiles));
  return { behindBy, shared: behindBy > 0 ? workspacesOf(baseFiles).filter((w) => mine.has(w)).sort() : [] };
}

/** Strip ANSI escape sequences and control characters from anything printed. */
export const clean = (v) => String(v ?? "").replace(/\u001b\[[0-9;?]*[ -\/]*[@-~]/g, "").replace(/[\u0000-\u001f\u007f-\u009f]/g, "");

/**
 * Strict first line: `## Review A|B at <40 lowercase hex>: <verdict words>`.
 * Returns { lens, sha, word, stated } or null. `stated` is the trimmed verdict on the first line
 * (PASS, BLOCKED, CHANGES, "PASS WITH NOTES", ...); `word` is the verdict after the CR-63 Must fix
 * check (effectiveVerdict). Only `word` equal to PASS or PASS WITH NOTES satisfies a lens.
 */
export function parseReview(body) {
  const first = String(body ?? "").split("\n", 1)[0].replace(/\r$/, "");
  const m = /^## Review ([AB]) at ([0-9a-f]{40}): (\S.*?)[ \t]*$/.exec(first);
  return m ? { lens: m[1], sha: m[2], word: effectiveVerdict(m[3], body), stated: m[3] } : null;
}

export const TRUSTED_ASSOCIATIONS = ["OWNER", "MEMBER", "COLLABORATOR"];

/**
 * Per lens at the current head, the NEWEST trusted verdict decides (PASS, then BLOCKED =
 * not met; BLOCKED, then PASS = met). Only the exact words PASS and PASS WITH NOTES meet a
 * lens; "PASS.", "pass" and every other word do not (CR-63: notes never block a merge).
 * Comments are ordered by created_at then id; with neither, by array order.
 * The repo is public: only OWNER, MEMBER or COLLABORATOR comments count. A matching
 * verdict at head from anyone else is listed in `untrusted` (lenses not otherwise decided).
 * `staleLenses`: PASS at an older sha with no trusted verdict at head.
 * `blocked`: lens -> newest non-passing word at head.
 */
export function reviewState(comments, head) {
  const order = comments
    .map((c, i) => ({ c, i }))
    .sort((x, y) => String(x.c.created_at ?? "").localeCompare(String(y.c.created_at ?? "")) || (x.c.id ?? 0) - (y.c.id ?? 0) || x.i - y.i);
  const latest = {};
  const latestBody = {};
  const stale = new Set();
  const ignored = new Set();
  for (const { c } of order) {
    const r = parseReview(c.body);
    if (!r) continue;
    if (!TRUSTED_ASSOCIATIONS.includes(c.author_association)) {
      if (r.sha === head) ignored.add(r.lens);
      continue;
    }
    if (r.sha === head) { latest[r.lens] = r.word; latestBody[r.lens] = c.body; }
    else if (passes(r.word)) stale.add(r.lens);
  }
  const blocked = {};
  for (const [lens, word] of Object.entries(latest)) if (!passes(word)) blocked[lens] = word;
  const named = [...new Set(Object.entries(latestBody).filter(([lens]) => passes(latest[lens])).flatMap(([, body]) => namedLenses(body)))];
  return {
    named,
    A: passes(latest.A),
    B: passes(latest.B),
    blocked,
    staleLenses: [...stale].filter((l) => !(l in latest)),
    untrusted: [...ignored].filter((l) => !(l in latest)),
  };
}

/** Newest run per name -> state string: missing, pending, or the conclusion. */
export function checkState(runs, required = FALLBACK_REQUIRED) {
  const newest = new Map();
  let queued = 0;
  let inProgress = 0;
  for (const r0 of runs) {
    const r = { ...r0, name: clean(r0.name) };
    if (r.status === "queued") queued++;
    if (r.status === "in_progress") inProgress++;
    const prev = newest.get(r.name);
    if (!prev || (r.id ?? 0) > (prev.id ?? 0)) newest.set(r.name, r);
  }
  const stateOf = (r) => (!r ? "missing" : r.status !== "completed" ? "pending" : (r.conclusion ?? "pending"));
  const out = { queued, inProgress, macos: {} };
  for (const name of required) out[name] = stateOf(newest.get(clean(name)));
  for (const [name, r] of newest) if (MACOS_CHECKS.some((re) => re.test(name))) out.macos[name] = stateOf(r);
  return out;
}

export function parseClaims(text) {
  const claims = {};
  for (const line of String(text ?? "").split("\n")) {
    const nums = [...line.matchAll(/#(\d{1,6})\b/g)].map((m) => m[1]);
    if (!nums.length) continue;
    let holder;
    if (line.trim().startsWith("|")) {
      const cells = line.split("|").map((s) => s.trim()).filter(Boolean);
      const i = cells.findIndex((c) => /#\d/.test(c));
      holder = cells[i + 1];
    }
    holder ||= /\bby[ :]+@?([\w.-]+)/i.exec(line)?.[1] || /\bholder:\s*@?([\w.-]+)/i.exec(line)?.[1] || /@([\w-]+)/.exec(line)?.[1];
    holder = clean(holder);
    if (holder) for (const n of nums) claims[n] ??= holder;
  }
  return claims;
}

export function verdictFor(row, quietMinutes) {
  const { reviews, checks } = row;
  if (row.mergeable_state === "dirty") return "DIRTY";
  if (row.mergeable_state === "unknown" && row.pushAgeMinutes >= STALE_UNKNOWN_MINUTES) return "STALE-UNKNOWN"; // unknown age (null) is not stale
  if (row.otherBase) return "OTHER-BASE";
  if (Object.keys(reviews.blocked).length) return "BLOCKED-REVIEW";
  if (!(reviews.A && reviews.B)) return reviews.staleLenses.length ? "STALE-REVIEW" : "NEEDS-REVIEW";
  const cs = row.required.map((n) => checks[n]);
  if (cs.some((c) => !["success", "missing", "pending"].includes(c))) return "CI-FAIL";
  if (cs.some((c) => c !== "success")) return "WAIT-CI";
  if (row.native) {
    const mac = Object.entries(checks.macos);
    const red = mac.find(([, v]) => !["success", "missing", "pending"].includes(v));
    if (red) return `WATCH-RED ${red[0]}`;
    if (mac.length < MACOS_CHECKS.length || mac.some(([, v]) => v !== "success")) return "WAIT-CI";
  }
  if (!["clean", "unstable"].includes(row.mergeable_state)) return "WAIT-CI";
  if (row.reason) return "NEEDS-REVIEW"; // CR-73: reported, not a gate
  if (row.staleBase?.shared.length) return "NEEDS-UPDATE";
  if (!(row.pushAgeMinutes >= quietMinutes)) return "WAIT-QUIET"; // unknown age (null) is not quiet
  return "READY";
}

const PAGE_CAP = 30;
async function paged(api, path, notices = []) {
  const out = [];
  const sep = path.includes("?") ? "&" : "?";
  for (let page = 1; page <= PAGE_CAP; page++) {
    const data = await api(`${path}${sep}per_page=100&page=${page}`);
    const items = Array.isArray(data) ? data : (data?.check_runs ?? []);
    out.push(...items);
    if (items.length < 100) return out;
  }
  out.capped = true;
  notices.push(`notice: pagination cap of ${PAGE_CAP} pages hit for ${clean(path.split("?")[0])}; results may be incomplete`);
  return out;
}

/** api(path, { method: "GET" }) -> parsed JSON. Injected so tests never touch the network. */
export async function buildQueue({ api, repo = DEFAULT_REPO, now = new Date(), quietMinutes = 10, claims = {}, notices = [], base = "develop", allBases = false }) {
  const get = (path) => api(path, { method: "GET" });
  const prs = (await paged(get, `repos/${repo}/pulls?state=open`, notices)).filter((p) => !p.draft && (allBases || p.base.ref === base));
  const protection = new Map();
  const requiredFor = async (base) => {
    if (!protection.has(base)) {
      let ctx;
      try {
        const rsc = (await get(`repos/${repo}/branches/${encodeURIComponent(base)}/protection`))?.required_status_checks;
        ctx = [...new Set([...(rsc?.contexts ?? []), ...(rsc?.checks ?? []).map((c) => c.context)].map(clean))];
        if (!ctx.length) throw new Error("no contexts");
      } catch {
        ctx = FALLBACK_REQUIRED;
        notices.push(`notice: branch protection for ${clean(base)} not readable, using fallback ${FALLBACK_REQUIRED.join(", ")}`);
      }
      protection.set(base, ctx);
    }
    return protection.get(base);
  };
  const one = async (p) => {
    const head = p.head.sha;
    const required = await requiredFor(p.base.ref);
    const [full, comments, runs, commit] = await Promise.all([
      get(`repos/${repo}/pulls/${p.number}`),
      paged(get, `repos/${repo}/issues/${p.number}/comments`, notices),
      paged(get, `repos/${repo}/commits/${head}/check-runs`, notices),
      get(`repos/${repo}/commits/${head}`),
    ]);
    const pushed = commit?.commit?.committer?.date ?? commit?.commit?.author?.date;
    const age = (now - new Date(pushed ?? NaN)) / 60000;
    const row = {
      number: p.number,
      head,
      base: clean(p.base.ref),
      otherBase: p.base.ref !== base,
      pushAgeMinutes: Number.isFinite(age) ? Math.max(0, Math.floor(age)) : null,
      reviews: reviewState(comments, head),
      mergeable_state: full?.head?.sha && full.head.sha !== head ? "unknown" : (full?.mergeable_state ?? "unknown"), // head moved between calls: not trusted
      required,
      checks: checkState(runs, required),
      native: null,
      claim: claims[String(p.number)] ?? "",
    };
    const reviewed = row.reviews.A && row.reviews.B;
    const green = required.every((n) => row.checks[n] === "success");
    let files = [];
    if (reviewed && green) {
      files = await paged(get, `repos/${repo}/pulls/${p.number}/files`, notices);
      row.native = touchesNative(files);
      const hits = securityLensHits(files);
      if (files.capped || !Number.isInteger(full?.changed_files) || files.length !== full.changed_files) row.reason = "file list incomplete";
      else if (hits.length && !row.reviews.named.some((n) => SECURITY_LENS_NAMES.includes(n))) {
        row.reason = "security lens missing";
        row.securityHits = hits.slice(0, 5).map(clean);
      }
    }
    if (row.native !== null && !row.reason) {
      try {
        const behind = (await get(`repos/${repo}/compare/${encodeURIComponent(p.base.ref)}...${head}`))?.behind_by;
        if (!Number.isInteger(behind) || behind < 0) throw new Error("no behind_by");
        let baseFiles = [];
        if (behind > 0) {
          baseFiles = (await get(`repos/${repo}/compare/${head}...${encodeURIComponent(p.base.ref)}`))?.files;
          if (!Array.isArray(baseFiles) || baseFiles.length >= COMPARE_FILE_CAP) throw new Error("base files unreadable or possibly cut off");
        }
        row.staleBase = staleBase({ behindBy: behind, prFiles: files, baseFiles });
      } catch {
        row.reason = "base compare failed";
      }
    }
    row.verdict = verdictFor(row, quietMinutes);
    row.watch = Object.entries(row.checks.macos).filter(([, v]) => v !== "success").map(([n, v]) => `${n.split(" ")[0]}:${v}`);
    if (row.verdict === "READY" && !row.otherBase) row.mergeNote = `#${row.number} ready for Karma to merge (CR-73) at ${row.head}`;
    return row;
  };
  const rows = [];
  for (let i = 0; i < prs.length; i += 6) rows.push(...(await Promise.all(prs.slice(i, i + 6).map(one))));
  return rows.sort((a, b) => a.number - b.number);
}

export function formatTable(allRows) {
  const stale = allRows.filter((r) => r.verdict === "STALE-UNKNOWN");
  const rows = allRows.filter((r) => r.verdict !== "STALE-UNKNOWN");
  const rev = (r) => `${r.reviews.A ? "A" : r.reviews.staleLenses.includes("A") ? "a" : "-"}${r.reviews.B ? "B" : r.reviews.staleLenses.includes("B") ? "b" : "-"}`;
  const ck = (r) => `${r.required.filter((n) => r.checks[n] === "success").length}/${r.required.length}` + (r.required.some((n) => r.checks[n] !== "success") ? " " + r.required.filter((n) => r.checks[n] !== "success").map((n) => `${n}:${r.checks[n]}`).join(",") : "");
  const head = ["PR", "head (40)", "base", "push-min", "rev", "mergeable", "required", "q/ip", "watch", "claim", "verdict"];
  const body = rows.map((r) => [
    `#${r.number}`, r.head, r.base, r.pushAgeMinutes === null ? "?" : String(r.pushAgeMinutes), rev(r),
    r.mergeable_state, ck(r), `${r.checks.queued}/${r.checks.inProgress}`, r.watch.length ? "WATCH " + r.watch.join(",") : "-", r.claim || "-", r.verdict,
  ]);
  const w = head.map((h, i) => Math.max(h.length, ...body.map((b) => b[i].length)));
  const line = (cells) => cells.map((c, i) => c.padEnd(w[i])).join("  ").trimEnd();
  const blockedNotes = rows.filter((r) => Object.keys(r.reviews.blocked).length).map((r) => `note: #${r.number} review not met, newest at head: ${Object.entries(r.reviews.blocked).map(([l, w]) => `${l}=${clean(w)}`).join(", ")}`);
  const held = rows.filter((r) => r.reviews.untrusted.length).map((r) => `note: #${r.number} held back, Review ${r.reviews.untrusted.join("/")} PASS at head came from a commenter who is not OWNER, MEMBER or COLLABORATOR (ignored)`);
  const lensNotes = rows.filter((r) => r.reason).map((r) => (r.reason === "base compare failed" ? `note: #${r.number} base compare failed: could not read how far the base moved, so a stale base cannot be ruled out` : r.reason === "file list incomplete" ? `note: #${r.number} file list incomplete (CR-73): the files read do not match the PR's changed_files, so the security lens cannot be checked` : `note: #${r.number} security lens missing (CR-73): touches ${r.securityHits.join(", ")}; no counted review names the security or security-architect lens`));
  const baseNotes = rows.filter((r) => r.staleBase?.behindBy > 0).map((r) => (r.staleBase.shared.length
    ? `note: #${r.number} base is behind ${r.base} by ${r.staleBase.behindBy} commits that touch ${r.staleBase.shared.map(clean).join(", ")}: update the branch, wait for required, and get fresh reviews (a new commit voids both)`
    : `note: #${r.number} base is behind ${r.base} by ${r.staleBase.behindBy} commits, none in a workspace this PR touches; still ready`));
  const asks = rows.filter((r) => r.mergeNote).map((r) => r.mergeNote);
  const days = (r) => Math.floor(r.pushAgeMinutes / 1440);
  const parked = stale.length
    ? ["", `stale-unknown (${stale.length}): mergeability unknown and head older than 7 days; not in the table above, no ready line`, ...stale.map((r) => `  #${r.number} base ${r.base}, last push ${days(r)} days ago, head ${r.head}`)]
    : [];
  return [line(head), ...body.map(line), "", "rev: AB = counted PASS at this head; lowercase = PASS only at an older sha; - = none", ...blockedNotes, ...held, ...lensNotes, ...baseNotes, ...asks, ...parked].join("\n");
}

function ghApi(path, { method = "GET" } = {}) {
  if (method !== "GET") return Promise.reject(new Error("merge-queue is read-only: GET only"));
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
  const o = { json: false, quietMinutes: 10, only: "", repo: DEFAULT_REPO, base: "develop", allBases: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") o.json = true;
    else if (a === "--quiet-minutes") o.quietMinutes = Number(argv[++i]);
    else if (a === "--only") o.only = String(argv[++i] ?? "").toUpperCase();
    else if (a === "--repo") o.repo = argv[++i];
    else if (a === "--base") o.base = argv[++i];
    else if (a === "--all-bases") o.allBases = true;
    else throw new Error(`unknown argument ${a}`);
  }
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(String(o.repo)) || String(o.repo).split("/").some((x) => /^\.+$/.test(x))) throw new Error("--repo must look like owner/name");
  if (!/^[A-Za-z0-9_.\/-]+$/.test(String(o.base))) throw new Error("--base has characters a branch name does not use");
  if (!Number.isFinite(o.quietMinutes) || o.quietMinutes < 0) throw new Error("--quiet-minutes needs a number of minutes");
  return o;
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  const claimsFile = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "docs", "agents", "CLAIMS.md");
  const claims = existsSync(claimsFile) ? parseClaims(readFileSync(claimsFile, "utf8")) : {};
  const notices = [];
  let rows = await buildQueue({ api: ghApi, repo: o.repo, quietMinutes: o.quietMinutes, claims, notices, base: o.base, allBases: o.allBases });
  if (o.only) rows = rows.filter((r) => r.verdict === o.only || r.verdict.startsWith(`${o.only} `));
  for (const n of new Set(notices)) console.error(n);
  console.log(o.json ? JSON.stringify(rows, (k, v) => (v === Infinity ? null : v), 2) : formatTable(rows));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
