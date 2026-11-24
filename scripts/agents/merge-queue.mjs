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

// ---------------------------------------------------------------------------------------------------------------------
// CR-149 checks as pure functions (BL-1570). No network, no verdict change: nothing in buildQueue or verdictFor calls
// these yet. BL-1571 wires them in behind a flag that ships off. Every function fails closed: an input it cannot read,
// or a path it does not recognise, counts as overlap, as protected or as source, and never as a safe docs PR, because a
// wrong "safe" lets a PR skip the NEEDS-UPDATE rule while a wrong "unsafe" only keeps the strict rule.
// ---------------------------------------------------------------------------------------------------------------------

/** Returned as an overlap entry when an input cannot prove "no overlap" (not an array, a cut-off page, a bad entry). */
export const UNREADABLE = "(unreadable input)";
/** Both names of a changed file: `filename`, and `previous_filename` for a rename. Null when the entry is not readable. */
const namesOf = (f) => {
  const names = typeof f === "string" ? [f] : [f?.filename, f?.previous_filename].filter((n) => n !== undefined && n !== null);
  return names.length && names.every((n) => typeof n === "string" && n.length) ? names : null;
};

/**
 * CR-149 rule 1: the files a PR changed since its merge base (`baseToHeadFiles`) that develop also changed since that
 * merge base (`developFiles`), sorted, once each. A rename counts on both sides: its old name and its new name are both
 * compared, so a PR that edits `a.ts` while develop renames `a.ts` to `b.ts` (or the other way round) overlaps.
 * Failure mode guarded: a missed rename lets a PR merge onto a file that no longer exists under that name.
 * Fail closed: a non-array, a list marked `capped` (paged() cut it off, so it may be incomplete) or an entry with no
 * readable name returns [UNREADABLE], which is non-empty and so counts as overlap.
 */
export function filesSince(baseToHeadFiles, developFiles) {
  const sides = [baseToHeadFiles, developFiles];
  if (sides.some((s) => !Array.isArray(s) || s.capped)) return [UNREADABLE];
  const [mine, theirs] = sides.map((s) => s.map(namesOf));
  if ([...mine, ...theirs].some((n) => n === null)) return [UNREADABLE];
  const dev = new Set(theirs.flat());
  return [...new Set(mine.flat().filter((n) => dev.has(n)))].sort();
}

/**
 * CR-70 founder-only paths (as CR-73 restated them) that SECURITY_LENS_CLASSES does not already hold, plus the CR-149
 * rule 4 names (auth, billing, the analytics allowlist, apps/mobile/src/lib/db, CODEOWNERS wherever it sits). Auth and
 * billing have no path list anywhere, so they match by name segment, broad on purpose (a false hit only keeps the strict
 * rule). Legal text and docs/DECISIONS.md are CR-73's "does not move" list.
 */
export const CR70_EXTRA_PATHS = [
  /(?:^|\/)claude\.md$/i, /^packages\/content\//, /^packages\/brand\//, /^packages\/analytics\//, /^docs\/analytics\//,
  /^agents\//, /^\.claude\//, /^apps\/mobile\/src\/lib\/db\//, /(?:^|\/)codeowners$/i, /^docs\/legal\//, /^apps\/web\/content\/legal\//,
  /^apps\/mobile\/src\/app\/settings\/(?:legal|privacy)\.tsx$/, /^docs\/decisions\.md$/i,
  /(?:^|[/._()-])(?:o?auth|reauth|billing|payments?|purchases?|subscriptions?|paywall|entitlements?|iap|plus|security|supabase|privacy|terms|legal|consent|sign-?in|sign-?out|passkey|keychain)(?=$|[/._()-])/i,
];
/** Lockfiles of any package manager, anywhere in the tree (CR-149 rule 4 says "no lockfile", not only the root one). */
export const LOCKFILE_RE = /(?:^|\/)(?:package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.ya?ml|bun\.lockb?|deno\.lock|podfile\.lock|gemfile\.lock|cargo\.lock|poetry\.lock|composer\.lock|gradle\.lockfile)$/i;
/** Every `.env*` file or directory, matched by name anywhere (CR-70: "every `.env*` file, matched by file name, anywhere"). */
export const ENV_RE = /(?:^|\/)\.env[^/]*(?:\/|$)/i;
/** Any directory named migrations, anywhere: supabase/migrations is the one today, a second one must not slip through. */
export const MIGRATION_RE = /(?:^|\/)migrations\//i;
/** Patterns that cover the whole repo; CR-149 correction 1 says the `*` catch-all line is not a path of its own. */
const CATCH_ALL = new Set(["*", "**", "/*", "/**"]);

/**
 * Pure: the path patterns of a CODEOWNERS file, read from the text passed in (never from disk here), as
 * { patterns: [{ pattern, re }], error }. GitHub's syntax: `#` starts a comment, the first token is a gitignore-style
 * pattern, a leading `/` or an inner `/` anchors it to the root, a trailing `/` means a directory, `*` and `?` stay inside
 * one segment and `**` crosses segments. A pattern matches the path itself or anything under it. GitHub does not support
 * `!`, `[ ]` or `\` escapes; a line that uses one, or text that is not a string, sets `error`, and touchesProtectedPath
 * then treats every path as protected (fail closed: a rule we cannot read must not shrink the protected list).
 */
export function parseCodeowners(text) {
  if (typeof text !== "string") return { patterns: [], error: "CODEOWNERS text missing" };
  const patterns = [];
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const pattern = line.split(/\s+/)[0];
    if (CATCH_ALL.has(pattern)) continue;
    if (/[![\]\\]/.test(pattern)) return { patterns: [], error: `CODEOWNERS pattern not supported: ${clean(pattern)}` };
    const dirOnly = pattern.endsWith("/");
    const body = pattern.replace(/^\/+/, "").replace(/\/+$/, "");
    if (!body) return { patterns: [], error: "CODEOWNERS pattern empty" };
    const anchored = pattern.startsWith("/") || body.includes("/");
    const glob = body.split("/").map((seg) => (seg === "**" ? "\u0000" : seg.replace(/[.+^${}()|]/g, "\\$&").replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]"))).join("/")
      .replace(/^\u0000\//, "(?:.*/)?").replace(/\/\u0000$/, "/.*").replace(/\/\u0000\//g, "/(?:.*/)?").replace(/\u0000/g, ".*");
    patterns.push({ pattern, re: new RegExp(`^${anchored ? "" : "(?:.*/)?"}${glob}${dirOnly ? "/.+" : "(?:/.*)?"}$`, "i") });
  }
  return { patterns, error: null };
}

/** A path we can match safely: relative, forward slashes, no `.` or `..` segment, no control character. Else unknown. */
const readablePath = (p) => typeof p === "string" && p.length > 0 && !p.startsWith("/") && !p.includes("\\") && !/[\u0000-\u001f\u007f]/.test(p)
  && p.split("/").every((s) => s && s !== "." && s !== "..");
const anyRe = (res, p) => res.some((re) => re.test(p) || re.test(p.toLowerCase()));

/**
 * Pure: CR-149 rule 4 (as CR-149 correction 1, BL-1569, reads it) for each changed path, both names of a rename, as
 * [{ path, rules: [names] }] in input order, every rule that matched named so the verdict can say which one. The rules:
 * the CR-70 path list (SECURITY_LENS_CLASSES plus CR70_EXTRA_PATHS), every CODEOWNERS entry in `codeowners` (the file's
 * text, so a path added there later is covered with no change here; CR-70: where the two differ, CODEOWNERS wins), a
 * `.env` file anywhere, a lockfile, a package.json change, a CR-74 native path (NATIVE_PATHS) and a migration.
 * package.json: any change to one counts as a dependency change. We are not given the patch, so we cannot prove only a
 * non-dependency key moved (scripts, name, version), and "scripts" itself runs in `npm ci` and EAS (CR-70).
 * Matching ignores case as well (a case-insensitive checkout maps `IOS/` onto `ios/`), which can only add hits.
 * Fail closed: a non-array or capped file list, an empty list, an entry with no readable name, a path that is absolute
 * or holds `.`, `..`, a backslash or a control character, and unreadable CODEOWNERS text each give a hit.
 */
export function protectedPathHits(files, codeowners) {
  if (!Array.isArray(files) || files.capped) return [{ path: UNREADABLE, rules: ["unreadable file list"] }];
  if (!files.length) return [{ path: UNREADABLE, rules: ["empty file list"] }];
  const owners = parseCodeowners(codeowners);
  const hits = [];
  const add = (path, rules) => {
    const old = hits.find((h) => h.path === path);
    if (old) old.rules = [...new Set([...old.rules, ...rules])];
    else hits.push({ path, rules });
  };
  for (const f of files) {
    const names = namesOf(f);
    if (!names) { add(UNREADABLE, ["unreadable entry"]); continue; }
    for (const p of names) {
      if (!readablePath(p)) { add(clean(p) || UNREADABLE, ["unknown path"]); continue; }
      const rules = [];
      if (anyRe(SECURITY_LENS_PATHS, p) || anyRe(CR70_EXTRA_PATHS, p)) rules.push("CR-70 path");
      if (owners.error) rules.push(owners.error);
      for (const o of owners.patterns) if (o.re.test(p)) rules.push(`CODEOWNERS ${o.pattern}`);
      if (ENV_RE.test(p)) rules.push(".env file");
      if (LOCKFILE_RE.test(p)) rules.push("lockfile");
      if (/(?:^|\/)package\.json$/i.test(p)) rules.push("package.json dependency change");
      if (anyRe(NATIVE_PATHS, p)) rules.push("native path (CR-74)");
      if (MIGRATION_RE.test(p)) rules.push("migration");
      if (rules.length) add(p, rules);
    }
  }
  return hits;
}
/** Pure: true when CR-149 rule 4 keeps the strict rule for this PR (any hit, including a fail-closed one). */
export const touchesProtectedPath = (files, codeowners) => protectedPathHits(files, codeowners).length > 0;

/** Docs: Markdown or plain text, outside the folders where a Markdown file is an instruction an agent or CI acts on. */
const DOC_RE = /\.(?:md|mdx|txt)$/i;
const NOT_DOCS_RE = /^(?:\.claude|agents|\.github)\/|(?:^|\/)(?:claude|agents)\.md$/i;
/** Tests: a file inside a test folder, or a file named *.test.* or *.spec.* (CR-149's first uses: apps/mobile/test, e2e-web). */
const TEST_RE = /(?:^|\/)(?:test|tests|__tests__|e2e|e2e-web|__fixtures__|fixtures)\/|\.(?:test|spec)\.[a-z0-9]+$/i;
const NOT_TEST_RE = /^\.github\//i;

/**
 * Pure: CR-149's PR class from the changed paths only, never from a label or a title (labels and titles are written by
 * the PR's author, so they cannot vouch for it). `docs` when every name is docs, `test` when every name is a test, else
 * `source`. A PR that mixes tests and docs is neither test-only nor docs-only, so it is `source` and needs its own tests
 * and tsc on the scratch merge (QA's condition in CR-149). Both names of a rename count, so moving a source file into a
 * test folder is still `source`. Fail closed: a non-array, capped or empty list, an unreadable entry or an unknown path
 * gives `source`, never `docs`.
 */
export function classifyPr(files) {
  if (!Array.isArray(files) || files.capped || !files.length) return "source";
  const names = files.map(namesOf);
  if (names.some((n) => n === null)) return "source";
  const all = names.flat();
  if (!all.every(readablePath)) return "source";
  if (all.every((p) => DOC_RE.test(p) && !NOT_DOCS_RE.test(p))) return "docs";
  if (all.every((p) => TEST_RE.test(p) && !NOT_TEST_RE.test(p))) return "test";
  return "source";
}

/** AIE-G20 (AIE-R46): the check whose result a reviewer's focused run can hide. */
export const SUITE_CHECK = "tests and content rules";
/** Pure: conclusion of the newest run of SUITE_CHECK at the head ("pending" if unfinished), or "-" if there is none. */
export function suiteState(runs) {
  let newest;
  for (const r of runs) if (clean(r.name) === SUITE_CHECK && (!newest || (r.id ?? 0) > (newest.id ?? 0))) newest = r;
  return !newest ? "-" : newest.status !== "completed" ? "pending" : clean(newest.conclusion ?? "pending");
}
/** Pure: true when a counted PASS stands at head but the suite is red ("PASS over a red suite"). */
export const passOverRedSuite = (row) => Boolean((row.reviews?.A || row.reviews?.B) && row.suite === "failure");

/** AIE-G21 (AIE-R47): hot files that PRs append to; each merge of one voids the reviews of the next. */
export const HOT_FILES = [/^docs\/agents\/CLAIMS\.md$/, /^docs\/agents\/exec\/RULINGS\.md$/, /^docs\/agents\/cto\/RULINGS\.md$/, /^docs\/BACKLOG\.md$/, /^docs\/content\/map\//];
/** Pure: the changed paths (new name or old name of a rename) that are hot files, once each. */
export const hotFileHits = (files) => [...new Set(files.flatMap((f) => [f?.filename ?? f, f?.previous_filename]).filter((n) => typeof n === "string" && HOT_FILES.some((re) => re.test(n))))];
/**
 * Pure: for rows that are READY or have both counted reviews (AB), group by shared hot file. Returns
 * [{ file, prs: [numbers, ascending] }] for files that two or more such PRs change. Lowest number merges first.
 * `docs/content/map/*` is one group, because the files in it are generated together.
 */
export function hotFileGroups(rows) {
  const by = new Map();
  for (const r of rows) {
    if (r.otherBase || !(r.verdict === "READY" || (r.reviews?.A && r.reviews?.B))) continue;
    for (const f of r.hotFiles ?? []) {
      const key = f.startsWith("docs/content/map/") ? "docs/content/map/*" : f;
      if (!by.has(key)) by.set(key, new Set());
      by.get(key).add(r.number);
    }
  }
  return [...by].map(([file, set]) => ({ file, prs: [...set].sort((a, b) => a - b) })).filter((g) => g.prs.length > 1).sort((a, b) => a.file.localeCompare(b.file));
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

// BL-1537 (ruling: Karma, T2 under CR-176): reviewState is deliberately NOT on the `<!-- founder -->`
// marker rule that isFounderComment uses (lib.mjs). That rule decides whose words are INSTRUCTIONS. A
// counted review is a VERDICT: Karma's interactive session posts it from the founder's login with the
// `## Review A|B at <sha>: PASS` header on line 1 and `<!-- agent:<handle> -->` on line 2 (OPERATING_MODEL
// "agent marker" bullet, form b), so a line-1 marker would make every counted review unreadable. Sessions and agents share
// that login, so a marker would add no proof of who typed it; the real fix is a separate agent identity,
// which is not built. What does bind a verdict: the exact line-1 header, the full head sha, an exact PASS
// word, a clean Must fix line, and author_association in TRUSTED_ASSOCIATIONS. Pinned in merge-queue.test.mjs.
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
      suite: suiteState(runs),
      native: null,
      claim: claims[String(p.number)] ?? "",
    };
    const reviewed = row.reviews.A && row.reviews.B;
    const green = required.every((n) => row.checks[n] === "success");
    let files = [];
    if (reviewed) {
      files = await paged(get, `repos/${repo}/pulls/${p.number}/files`, notices);
      row.hotFiles = hotFileHits(files).map(clean);
    }
    if (reviewed && green) {
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
  const head = ["PR", "head (40)", "base", "push-min", "rev", "suite", "mergeable", "required", "q/ip", "watch", "claim", "verdict"];
  const body = rows.map((r) => [
    `#${r.number}`, r.head, r.base, r.pushAgeMinutes === null ? "?" : String(r.pushAgeMinutes), rev(r), r.suite ?? "-",
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
  const redNotes = rows.filter(passOverRedSuite).map((r) => `note: #${r.number} PASS over a red suite (AIE-G20): a counted PASS stands at head, but \`${SUITE_CHECK}\` is failure; read its log before merging`);
  const hotNotes = hotFileGroups(rows).map((g) => `note: ${g.prs.map((n) => `#${n}`).join(", ")} all change ${clean(g.file)} (AIE-G21): merge #${g.prs[0]} first, then update the next and get fresh reviews (each merge voids the next one's reviews)`);
  const asks = rows.filter((r) => r.mergeNote).map((r) => r.mergeNote);
  const days = (r) => Math.floor(r.pushAgeMinutes / 1440);
  const parked = stale.length
    ? ["", `stale-unknown (${stale.length}): mergeability unknown and head older than 7 days; not in the table above, no ready line`, ...stale.map((r) => `  #${r.number} base ${r.base}, last push ${days(r)} days ago, head ${r.head}`)]
    : [];
  return [line(head), ...body.map(line), "", "rev: AB = counted PASS at this head; lowercase = PASS only at an older sha; - = none. suite: conclusion of `tests and content rules` at head, - = no run", ...blockedNotes, ...held, ...lensNotes, ...baseNotes, ...redNotes, ...hotNotes, ...asks, ...parked].join("\n");
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
