#!/usr/bin/env node
// Founder page: a note of at most 15 lines from GitHub REST, read-only.
// Retro package R1-03 (IMP-38; reports IMP-31, IMP-14, IMP-36). See README.md.
//
//   node scripts/status/page.mjs [--repo owner/name] [--trust login,login] [--now ISO]
//   node scripts/status/page.mjs --founder-list   # every founder-class merge in 7 days (weekly skim)
//
// Only GET requests, through `gh api`. Nothing is written anywhere.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseVerdict } from "../agents/verdicts.mjs";

export const MAX_LINES = 15;
export const EXTRA_SLOTS = 2; // lines kept free for other reports (see renderPage)
const CAP = { waiting: 4, founder: 3 };
const H = 3600_000;
const D = 24 * H;

// D-107 founder-only classes, merged by the coordinator under D-117's operating rule
// (docs/DECISIONS.md D-117; docs/agents/COORDINATION.md section 6). "auth" and
// "payments" name no paths there; the globs below are this script's reading of them.
export const FOUNDER_CLASSES = [
  ["database", [/^supabase\//]],
  ["auth", [/^apps\/mobile\/src\/lib\/auth\//, /^apps\/mobile\/src\/app\/\(auth\)\//]],
  ["payments", [/^packages\/core\/src\/plan\.ts$/, /^apps\/mobile\/src\/lib\/billing\//, /^apps\/mobile\/storekit\//]],
  ["release config", [/^\.github\//, /^apps\/mobile\/eas\.json$/, /^apps\/mobile\/app\.config\.ts$/]],
  ["engine", [/^packages\/core\/src\/(types|verify|meaning|pipeline)\.ts$/]],
];

/** Founder classes a list of changed paths touches, in table order. */
export function founderClasses(paths) {
  return FOUNDER_CLASSES.filter(([, res]) => paths.some((p) => res.some((re) => re.test(p)))).map(([name]) => name);
}

/** True when two shas name the same commit (prefix match, 7 or more hex). */
export function sameSha(a, b) {
  const x = String(a ?? "").toLowerCase();
  const y = String(b ?? "").toLowerCase();
  if (x.length < 7 || y.length < 7) return false;
  return x.startsWith(y) || y.startsWith(x);
}

const VERDICT_WORDS = [
  // Negated phrases come first in the text, so the earliest-match rule below picks them over "merge" and "pass".
  ["do not merge", "DO NOT MERGE"], ["don't merge", "DO NOT MERGE"], ["not mergeable", "DO NOT MERGE"],
  ["not a pass", "FAIL"], ["not pass", "FAIL"], ["no pass", "FAIL"],
  ["pass with notes", "PASS WITH NOTES"], ["do-not-merge", "DO NOT MERGE"], ["merge-after-fix", "MERGE AFTER FIX"],
  ["changes needed", "CHANGES NEEDED"], ["blocking", "BLOCKING"], ["block", "BLOCKING"], ["fail", "FAIL"],
  ["pass", "PASS"], ["merge", "MERGE"],
];
const verdictIn = (s) => {
  const t = s.toLowerCase();
  let best; // the earliest verdict word wins ("FAIL, 1 blocking issue" is FAIL); ties go to the longer phrase
  for (const [w, v] of VERDICT_WORDS) {
    const i = t.search(new RegExp(`(^|[^a-z-])${w.replace(/ /g, "\\s+")}([^a-z-]|$)`));
    if (i >= 0 && (!best || i < best.i)) best = { i, v };
  }
  return best?.v;
};
const shaIn = (s) => s.match(/(?<![0-9a-z])(?=[0-9a-f]*\d)[0-9a-f]{7,40}(?![0-9a-z])/i)?.[0];

/**
 * A lens review verdict from a comment or review body, or undefined.
 * Lens reviews are free text; the repo's habit (PRs #165 to #205) is a first line such as
 * "## Review A (security) at 97b50e1: PASS WITH NOTES" or "PR #179 at df2991c: PASS".
 * The sha is the first one in the first line, else a "head <sha>" in the first five lines.
 */
export function parseLens(body, prNumber) {
  const lines = String(body ?? "").replace(/\r\n/g, "\n").trim().split("\n");
  const first = lines[0] ?? "";
  if (/^<!--/.test(first)) return undefined; // red-team, merge-train and other markers
  if (!/review|re-check|lens|verdict|^\W*PR #\d+ at /i.test(first)) return undefined;
  const other = first.match(/\b(?:PR|of) #(\d+)/i);
  if (other && Number(other[1]) !== Number(prNumber)) return undefined; // a copy of another PR's verdict
  let verdict = verdictIn(first.replace(/\([^)]*\)/g, " "));
  if (!verdict) {
    const v = lines.slice(1, 10).find((l) => /^\W*verdict\W/i.test(l));
    verdict = v && verdictIn(v);
  }
  if (!verdict) return undefined;
  const headLine = lines.slice(0, 5).join("\n").match(/head `?([0-9a-f]{7,40})/i)?.[1];
  return { verdict, sha: shaIn(first) ?? headLine };
}

/** Latest lens and red-team verdicts from a PR's comments and reviews, trusted authors only. */
export function verdictsOf(pr, comments, reviews, trusted) {
  const items = [
    ...(comments ?? []).map((c) => ({ body: c.body, at: c.created_at, who: c.user?.login })),
    ...(reviews ?? []).map((r) => ({ body: r.body, at: r.submitted_at, who: r.user?.login })),
  ].filter((i) => trusted.has(String(i.who ?? "").toLowerCase()));
  items.sort((a, b) => String(a.at).localeCompare(String(b.at)));
  const head = pr.head?.sha;
  const lens = [];
  let red;
  for (const i of items) {
    const r = parseVerdict(i.body);
    if (r) { red = { verdict: r.verdict, sha: r.sha, onHead: sameSha(r.sha, head) }; continue; }
    const l = parseLens(i.body, pr.number);
    if (l) lens.push({ ...l, onHead: sameSha(l.sha, head) });
  }
  return { lens, red };
}

const days = (from, now) => Math.floor((now - new Date(from)) / D);
const word = (v) => (v ? `${v.verdict}${v.onHead ? " on head" : " on an older head"}` : "none");
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const nums = (list, max) => list.slice(0, max).map((n) => `#${n}`).join(", ") + (list.length > max ? `, +${list.length - max} more` : "");

/** Pure: the page model from fetched data. */
export function buildModel(data, now) {
  const t = new Date(now).getTime();
  const merged = (data.closed ?? []).filter((p) => p.merged_at);
  const waiting = (data.open ?? []).filter((p) => !p.draft)
    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
    .map((p) => ({ number: p.number, age: days(p.created_at, t), ...(data.threads?.[p.number] ?? { lens: [] }) }));
  return {
    now: new Date(t).toISOString(),
    merged24: merged.filter((p) => t - new Date(p.merged_at) <= D).map((p) => p.number),
    waiting,
    handoffs: (data.handoffs ?? []).filter((i) => !i.pull_request && t - new Date(i.created_at) > 48 * H)
      .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
      .map((i) => ({ number: i.number, age: days(i.created_at, t), comments: i.comments ?? 0 })),
    founder: merged.filter((p) => t - new Date(p.merged_at) <= 7 * D)
      .sort((a, b) => String(b.merged_at).localeCompare(String(a.merged_at)))
      .map((p) => ({ number: p.number, classes: founderClasses(data.files?.[p.number] ?? []), ...(data.threads?.[p.number] ?? { lens: [] }) }))
      .filter((p) => p.classes.length),
    old14: (data.open ?? []).filter((p) => t - new Date(p.created_at) > 14 * D).length,
  };
}

/** One founder-class merge with its last two lens verdicts, checked against the merged head. */
export function founderLine(p) {
  const two = p.lens.slice(-2);
  const onHead = two.filter((v) => v.onHead).length;
  return `- #${p.number} ${p.classes.join(", ")}: ${two.length ? two.map(word).join("; ") : "no lens verdict found"}${onHead < 2 ? " (fewer than 2 on the merged head)" : ""}.`;
}

/** Pure: the weekly skim of D-117 merges, one line each, no line cap. */
export function renderFounderList(m) {
  return [`Founder-class merges in the 7 days to ${m.now.slice(0, 10)} (D-117 paths): ${m.founder.length}.`, ...m.founder.map(founderLine)];
}

/**
 * Pure: the note, at most MAX_LINES lines.
 * Hook for other reports (delivery metrics, the stale-PR classifier): pass their lines as
 * `extraLines`; up to EXTRA_SLOTS are printed before the last line, the rest are cut.
 */
export function renderPage(m, { extraLines = [] } = {}) {
  const out = [`Founder note, ${m.now.slice(0, 16).replace("T", " ")} UTC. Source: GitHub REST, read-only.`];
  out.push(`Merged in the last 24 h: ${m.merged24.length}${m.merged24.length ? `. ${nums(m.merged24, 8)}` : ""}.`);
  out.push(`Waiting for review: ${m.waiting.length} open PRs (not drafts), oldest first${m.waiting.length > CAP.waiting ? `, first ${CAP.waiting} shown` : ""}.`);
  for (const p of m.waiting.slice(0, CAP.waiting)) {
    out.push(`- #${p.number}, ${p.age} d: lens ${word(p.lens.at(-1))}; red team ${word(p.red)}.`);
  }
  out.push(m.handoffs.length
    ? `Handoffs open over 48 h: ${m.handoffs.length}. ${m.handoffs.slice(0, 6).map((h) => `#${h.number} (${h.age} d, ${plural(h.comments, "comment")})`).join(", ")}${m.handoffs.length > 6 ? ", more" : ""}.`
    : "Handoffs open over 48 h: 0.");
  out.push(`Founder-class merges in 7 days (D-117 paths): ${m.founder.length}${m.founder.length > CAP.founder ? `, newest ${CAP.founder} shown` : ""}.`);
  out.push(...m.founder.slice(0, CAP.founder).map(founderLine));
  out.push(...extraLines.slice(0, EXTRA_SLOTS).map(String));
  out.push(`Open PRs older than 14 days: ${m.old14}.`);
  return out.slice(0, MAX_LINES);
}

/**
 * Fetch what the page needs. `get(path)` returns parsed JSON and must only GET.
 * Comment threads are fetched only for the PRs the note shows, unless `all` is set.
 */
export function collect(get, { repo, now, trusted, all = false }) {
  const t = new Date(now).getTime();
  const pages = (path, stop) => {
    const all = [];
    for (let page = 1; page <= 10; page++) {
      const res = get(`${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`) ?? [];
      all.push(...res);
      if (res.length < 100 || (stop && stop(res.at(-1)))) break;
    }
    return all;
  };
  const open = pages(`/repos/${repo}/pulls?state=open`);
  const closed = pages(`/repos/${repo}/pulls?state=closed&sort=updated&direction=desc`, (p) => t - new Date(p.updated_at) > 7 * D)
    .filter((p) => p.merged_at && t - new Date(p.merged_at) <= 7 * D);
  const handoffs = pages(`/repos/${repo}/issues?state=open&labels=handoff`);
  const files = {};
  for (const p of closed) files[p.number] = pages(`/repos/${repo}/pulls/${p.number}/files`).map((f) => f.filename);
  const threads = {};
  const byAge = (a, b) => String(a.created_at).localeCompare(String(b.created_at));
  const byMerge = (a, b) => String(b.merged_at).localeCompare(String(a.merged_at));
  const waiting = open.filter((p) => !p.draft).sort(byAge);
  const founder = closed.filter((p) => founderClasses(files[p.number]).length).sort(byMerge);
  const need = all ? [...waiting, ...founder] : [...waiting.slice(0, CAP.waiting), ...founder.slice(0, CAP.founder)];
  for (const p of need) {
    threads[p.number] = verdictsOf(p, pages(`/repos/${repo}/issues/${p.number}/comments`), pages(`/repos/${repo}/pulls/${p.number}/reviews`), trusted);
  }
  return { open, closed, handoffs, files, threads };
}

/** Read-only GET through the gh CLI. */
export function ghGet(path) {
  const out = execFileSync("gh", ["api", "-X", "GET", "-H", "Accept: application/vnd.github+json", path], {
    encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"],
  });
  return out.trim() ? JSON.parse(out) : null;
}

function main(argv) {
  const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
  const repo = opt("repo", process.env.GITHUB_REPOSITORY || "thesaurabhpareek/earlyletters");
  const trusted = new Set(opt("trust", repo.split("/")[0]).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));
  const now = opt("now", new Date().toISOString());
  const list = argv.includes("--founder-list");
  const model = buildModel(collect(ghGet, { repo, now, trusted, all: list }), now);
  console.log((list ? renderFounderList(model) : renderPage(model)).join("\n"));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
