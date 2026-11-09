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
//   node scripts/agents/merge-queue.mjs --repo owner/name  default thesaurabhpareek/earlyletters
//
// Read-only: every call is a GET through `gh api` (REST; GraphQL is blocked). There is no
// write path in this file. No token is read or printed here; `gh` holds its own login.
//
// Rules it applies:
// - A review counts only if the FIRST LINE of a PR comment is exactly
//   `## Review A at <40 hex>: PASS` (or `Review B`). The sha must equal the PR head, all
//   40 characters. Later lines are never read, so words like failure or until in the body
//   cannot change the result. Comment authors are not filtered (U: trust rules in lib.mjs
//   are not applied here).
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
//   header or gh stderr is ever read, printed or logged. A READY row is followed by the
//   exact ask: `Merge #<n> at <40-char head sha>`.
// - Claims: lines of docs/agents/CLAIMS.md (if present, not required) that mention
//   `#<pr>`. Holder = the cell after the PR in a table row, else `by <x>`, `holder: <x>`
//   or `@<x>` on the line (U: the file's format is not fixed anywhere yet).
//
// Verdicts, first match wins:
//   DIRTY          mergeable_state is dirty (conflicts)
//   NEEDS-REVIEW   a counted PASS is missing and no older-sha review exists
//   STALE-REVIEW   a counted PASS is missing at head, and one exists at an older sha
//   CI-FAIL        a required context concluded with something other than success
//   WATCH-RED      native/lockfile PR and a macOS check is red (names the check)
//   WAIT-CI        a required context missing or not finished, or mergeable_state
//                  blocked/behind/unknown/draft/has_hooks
//   WAIT-QUIET     all green but the head is younger than --quiet-minutes
//   READY          both PASS at head, every required context success, macOS rule met,
//                  mergeable_state clean or unstable, head quiet long enough
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_REPO = "thesaurabhpareek/earlyletters";
export const FALLBACK_REQUIRED = ["applied migrations unchanged", "required", "compliance-fence"];
export const MACOS_CHECKS = [/^iOS simulator build/, /^store-profile Release launch/];
export const NATIVE_PATHS = [/^apps\/mobile\/ios\//, /^apps\/mobile\/modules\//, /^apps\/mobile\/app\.config\./, /^apps\/mobile\/eas\.json$/, /^package-lock\.json$/];
export const touchesNative = (files) => files.some((f) => NATIVE_PATHS.some((re) => re.test(f.filename ?? f)));
const REVIEW_RE = /^## Review ([AB]) at ([0-9a-f]{40}): PASS[ \t]*$/;

/** First line only, strict. Returns { lens, sha } or null. */
export function parseReview(body) {
  const first = String(body ?? "").split("\n", 1)[0].replace(/\r$/, "");
  const m = REVIEW_RE.exec(first);
  return m ? { lens: m[1], sha: m[2] } : null;
}

/** Which lenses passed at head, and which at some other (older) sha. */
export function reviewState(comments, head) {
  const atHead = new Set();
  const stale = new Set();
  for (const c of comments) {
    const r = parseReview(c.body);
    if (!r) continue;
    (r.sha === head ? atHead : stale).add(r.lens);
  }
  return { A: atHead.has("A"), B: atHead.has("B"), staleLenses: [...stale].filter((l) => !atHead.has(l)) };
}

/** Newest run per name -> state string: missing, pending, or the conclusion. */
export function checkState(runs, required = FALLBACK_REQUIRED) {
  const newest = new Map();
  let queued = 0;
  let inProgress = 0;
  for (const r of runs) {
    if (r.status === "queued") queued++;
    if (r.status === "in_progress") inProgress++;
    const prev = newest.get(r.name);
    if (!prev || (r.id ?? 0) > (prev.id ?? 0)) newest.set(r.name, r);
  }
  const stateOf = (r) => (!r ? "missing" : r.status !== "completed" ? "pending" : (r.conclusion ?? "pending"));
  const out = { queued, inProgress, macos: {} };
  for (const name of required) out[name] = stateOf(newest.get(name));
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
    if (holder) for (const n of nums) claims[n] ??= holder;
  }
  return claims;
}

export function verdictFor(row, quietMinutes) {
  const { reviews, checks } = row;
  if (row.mergeable_state === "dirty") return "DIRTY";
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
  if (row.pushAgeMinutes < quietMinutes) return "WAIT-QUIET";
  return "READY";
}

async function paged(api, path) {
  const out = [];
  const sep = path.includes("?") ? "&" : "?";
  for (let page = 1; page <= 30; page++) {
    const data = await api(`${path}${sep}per_page=100&page=${page}`);
    const items = Array.isArray(data) ? data : (data?.check_runs ?? []);
    out.push(...items);
    if (items.length < 100) break;
  }
  return out;
}

/** api(path, { method: "GET" }) -> parsed JSON. Injected so tests never touch the network. */
export async function buildQueue({ api, repo = DEFAULT_REPO, now = new Date(), quietMinutes = 10, claims = {}, notices = [] }) {
  const get = (path) => api(path, { method: "GET" });
  const prs = (await paged(get, `repos/${repo}/pulls?state=open`)).filter((p) => !p.draft);
  const protection = new Map();
  const requiredFor = async (base) => {
    if (!protection.has(base)) {
      let ctx;
      try {
        const rsc = (await get(`repos/${repo}/branches/${encodeURIComponent(base)}/protection`))?.required_status_checks;
        ctx = [...new Set([...(rsc?.contexts ?? []), ...(rsc?.checks ?? []).map((c) => c.context)])];
        if (!ctx.length) throw new Error("no contexts");
      } catch {
        ctx = FALLBACK_REQUIRED;
        notices.push(`notice: branch protection for ${base} not readable, using fallback ${FALLBACK_REQUIRED.join(", ")}`);
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
      paged(get, `repos/${repo}/issues/${p.number}/comments`),
      paged(get, `repos/${repo}/commits/${head}/check-runs`),
      get(`repos/${repo}/commits/${head}`),
    ]);
    const pushed = commit?.commit?.committer?.date ?? commit?.commit?.author?.date;
    const row = {
      number: p.number,
      head,
      base: p.base.ref,
      pushAgeMinutes: pushed ? Math.max(0, Math.floor((now - new Date(pushed)) / 60000)) : Infinity,
      reviews: reviewState(comments, head),
      mergeable_state: full?.mergeable_state ?? "unknown",
      required,
      checks: checkState(runs, required),
      native: null,
      claim: claims[String(p.number)] ?? "",
    };
    const reviewed = row.reviews.A && row.reviews.B;
    const green = required.every((n) => row.checks[n] === "success");
    if (reviewed && green) row.native = touchesNative(await paged(get, `repos/${repo}/pulls/${p.number}/files`));
    row.verdict = verdictFor(row, quietMinutes);
    row.watch = Object.entries(row.checks.macos).filter(([, v]) => v !== "success").map(([n, v]) => `${n.split(" ")[0]}:${v}`);
    if (row.verdict === "READY") row.founderAsk = `Merge #${row.number} at ${row.head}`;
    return row;
  };
  const rows = [];
  for (let i = 0; i < prs.length; i += 6) rows.push(...(await Promise.all(prs.slice(i, i + 6).map(one))));
  return rows.sort((a, b) => a.number - b.number);
}

export function formatTable(rows) {
  const rev = (r) => `${r.reviews.A ? "A" : r.reviews.staleLenses.includes("A") ? "a" : "-"}${r.reviews.B ? "B" : r.reviews.staleLenses.includes("B") ? "b" : "-"}`;
  const ck = (r) => `${r.required.filter((n) => r.checks[n] === "success").length}/${r.required.length}` + (r.required.some((n) => r.checks[n] !== "success") ? " " + r.required.filter((n) => r.checks[n] !== "success").map((n) => `${n}:${r.checks[n]}`).join(",") : "");
  const head = ["PR", "head (40)", "base", "push-min", "rev", "mergeable", "required", "q/ip", "watch", "claim", "verdict"];
  const body = rows.map((r) => [
    `#${r.number}`, r.head, r.base, Number.isFinite(r.pushAgeMinutes) ? String(r.pushAgeMinutes) : "?", rev(r),
    r.mergeable_state, ck(r), `${r.checks.queued}/${r.checks.inProgress}`, r.watch.length ? "WATCH " + r.watch.join(",") : "-", r.claim || "-", r.verdict,
  ]);
  const w = head.map((h, i) => Math.max(h.length, ...body.map((b) => b[i].length)));
  const line = (cells) => cells.map((c, i) => c.padEnd(w[i])).join("  ").trimEnd();
  const asks = rows.filter((r) => r.founderAsk).map((r) => r.founderAsk);
  return [line(head), ...body.map(line), "", "rev: AB = counted PASS at this head; lowercase = PASS only at an older sha; - = none", ...asks].join("\n");
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
  const o = { json: false, quietMinutes: 10, only: "", repo: DEFAULT_REPO };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") o.json = true;
    else if (a === "--quiet-minutes") o.quietMinutes = Number(argv[++i]);
    else if (a === "--only") o.only = String(argv[++i] ?? "").toUpperCase();
    else if (a === "--repo") o.repo = argv[++i];
    else throw new Error(`unknown argument ${a}`);
  }
  if (!Number.isFinite(o.quietMinutes) || o.quietMinutes < 0) throw new Error("--quiet-minutes needs a number of minutes");
  return o;
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  const claimsFile = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "docs", "agents", "CLAIMS.md");
  const claims = existsSync(claimsFile) ? parseClaims(readFileSync(claimsFile, "utf8")) : {};
  const notices = [];
  let rows = await buildQueue({ api: ghApi, repo: o.repo, quietMinutes: o.quietMinutes, claims, notices });
  if (o.only) rows = rows.filter((r) => r.verdict === o.only || r.verdict.startsWith(`${o.only} `));
  for (const n of new Set(notices)) console.error(n);
  console.log(o.json ? JSON.stringify(rows, (k, v) => (v === Infinity ? null : v), 2) : formatTable(rows));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
