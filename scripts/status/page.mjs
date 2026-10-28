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

// Verdicts are read with an allowlist, over the whole line, not just one clause.
// A review counts as passing only when all of these hold:
// - the verdict clause (after "Verdict:", else the first colon that is followed by a verdict
//   word) is exactly PASS, PASS WITH NOTES or MERGE (bold, a harmless bracketed aside and an
//   "at head <sha>" aside allowed);
// - the line names one verdict only ("FAIL. Old head 3539f6c: PASS" is UNCLEAR);
// - nothing on the line, title brackets included, asks not to merge or requests changes;
// - nothing from the verdict onwards negates or conditions it ("PASS. Blocked on #306.",
//   "PASS pending #306"), after a short list of harmless endings ("No Must.") is removed.
// Anything else is not a pass. A blocking review must never look like an approval; a real pass
// that reads as CONDITIONAL or UNCLEAR only adds a warning a person clears by reading it.
const APOSTROPHES = /[\u2018\u2019\u02bc\u00b4\u0060\uff07]/g; // curly, modifier, acute, grave, fullwidth
const STOP_ANYWHERE = /\b(do[\s-]*not|don't|dont|should\s*not|shouldn't|must\s*not|mustn't|cannot|can't|won't|not\s+(yet\s+)?(ready\s+to\s+)?)\s*merge\b|\bnot\s+mergeable\b|\bmerge\s+blocked\b|\brequest(ed|s)?\s+changes\b|\bchanges\s+requested\b/;
const NEGATIVE = /\b(not|never|no|cannot|can't|won't|don't|dont|shouldn't|mustn't|unable|block(ed|ing|s)?|reject(ed|s)?|fail(ed|ing|s|ure)?|changes|needs?\s+work|hold)\b/;
const CONDITION = /\b(pending|once|if|until|unless|after|before|when|conditional(ly)?|provided|subject\s+to|assuming|but|except|tbd|wip|then|must\s+fix|one\s+must|musts?\s+(open|remain(ing)?|left))\b/;
// Endings real passing reviews use (#290 to #360); removed before the negation and condition checks.
const HARMLESS = /\bno\s+must(,|\s+and)?\s+no\s+(open\s+)?should(\s+left)?\b|\bno\s+(blocking\s+)?(findings?|issues?|musts?)(\s+(left|findings?))?\b|\bno\s+open\s+should\b|\bnothing\s+new\s+blocks\s+build\s+\d+\b|\bmy\s+must\s*(\([^)]*\))?\s+is\s+cleared\b|\b(checked|verified)\s+against\s+the\s+code,?\s+not\s+the\s+report\b/g;
// Inside brackets after the verdict only strong blockers count; "(unchanged, no file overlap)" is an aside.
const STRONG = /\b(block(ed|ing|s)?|reject(ed|s)?|fail(ed|ing|s|ure)?|hold|changes|needs?\s+work|cannot|can't|won't|unable)\b/;
const VERDICT_WORD = /\b(pass(ed)?|fail(ed)?|merge|changes\s+(needed|required)|blocking)\b/g;
export const PASSING = new Set(["PASS", "PASS WITH NOTES", "MERGE"]);
const EXACT = new Map([["pass", "PASS"], ["passed", "PASS"], ["pass with notes", "PASS WITH NOTES"], ["merge", "MERGE"], ["merge after fix", "MERGE AFTER FIX"], ["merge-after-fix", "MERGE AFTER FIX"]]);
const kind = (w) => (/^pass/.test(w) || w === "merge" ? "pass" : "not pass"); // "FAIL, 1 blocking issue" is one verdict
export const verdictIn = (s) => {
  const line = String(s).toLowerCase().replace(APOSTROPHES, "'");
  if (STOP_ANYWHERE.test(line)) return /request|changes/.test(line.match(STOP_ANYWHERE)[0]) ? "CHANGES NEEDED" : "DO NOT MERGE";
  // Where the verdict starts: after "Verdict:", else after the first colon followed by a verdict word.
  let at = line.search(/verdict\s*[:-]/);
  if (at >= 0) at = line.indexOf(line.match(/verdict\s*[:-]/)[0], at) + line.match(/verdict\s*[:-]/)[0].length;
  else {
    const m = [...line.matchAll(/:/g)].find((c) => /^[\s*_]*(pass|fail|merge|changes|block|blocked|blocking|request|do\s*not|don't|dont|conditional|not|no|never|cannot|can't|won't|unable|should|must|needs?|reject|rejected|hold|lgtm)\b/.test(line.slice(c.index + 1)));
    if (!m) return undefined; // this line states no verdict
    at = m.index + 1;
  }
  const rest = line.slice(at).replace(HARMLESS, " ");
  const words = [...rest.replace(/\bpass\s+with\s+notes\b/g, "pass").replace(/\bmerge[\s-]+after[\s-]+fix\b/g, "mergeafterfix").matchAll(VERDICT_WORD)].map((m) => kind(m[0]));
  if (new Set(words).size > 1) return "UNCLEAR"; // two verdicts on one line
  const brackets = (rest.match(/\([^)]*\)/g) ?? []).join(" ");
  const outside = rest.replace(/\([^)]*\)/g, " ");
  if (NEGATIVE.test(outside) || STRONG.test(brackets)) {
    if (/\bfail|\b(not|cannot|can't|won't|unable\s+to)\s+(a\s+)?pass/.test(rest)) return "FAIL";
    if (/changes|needs?\s+work/.test(rest)) return "CHANGES NEEDED";
    return "BLOCKING";
  }
  const clause = rest
    .replace(/^[\s*_]+/, "").split(/\*\*|__/)[0] // a bold verdict ends at its closing "**"
    .split(/[.;]/)[0]
    .replace(/\b(at|on)\s+(head\s+)?[0-9a-f]{7,40}\b/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[*_`]/g, " ").replace(/\s+/g, " ").trim().replace(/[,!]+$/, "");
  if (EXACT.has(clause) && !(CONDITION.test(rest) && !/^merge after fix$/.test(clause))) return EXACT.get(clause);
  if (/\b(pass|merge)/.test(rest)) return CONDITION.test(rest) ? "CONDITIONAL" : "UNCLEAR";
  return undefined;
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
  // verdictIn checks stop phrases on the whole line (title brackets included) and everything else
  // from the verdict onwards, so a title's harmless brackets ("Review A (security)") do not matter.
  let verdict = verdictIn(first);
  if (!verdict) {
    const v = lines.slice(1, 10).find((l) => /^\W*(delta\s+)?verdict\W/i.test(l));
    verdict = v && verdictIn(v);
  }
  if (!verdict) return undefined;
  const headLine = lines.slice(0, 5).join("\n").match(/head `?([0-9a-f]{7,40})/i)?.[1];
  return { verdict, sha: shaIn(first) ?? headLine };
}

/**
 * A machine-countable pass, or undefined. Free text cannot be proved safe (four review rounds kept
 * finding blocking wording that read as a pass), so only a strict first line counts toward the
 * D-117 two:
 *   ## Review A at <sha>: PASS            (or PASS WITH NOTES; "Review B", "Review A delta" too)
 *   <!-- lens:a:<sha> -->  then  Verdict: PASS   (the marker format of open PR #353)
 * with nothing else on that line, and no stop phrase ("do not merge", "request changes") or open
 * Must anywhere in the first 15 lines. Every other review is shown, read best-effort, and marked
 * "free text"; it never counts.
 */
const STRICT = /^#{0,3}\s*review\s+([ab])(\s+delta)?\s+at\s+([0-9a-f]{7,40})\s*:\s*(pass|pass with notes)\s*$/i;
const MARKER = /^<!--\s*lens:([ab]):([0-9a-f]{7,40})(\s+base:[0-9a-f]{7,40})?\s*-->\s*$/i;
// Near the verdict (its line and the next two) a strict pass may not mention a blocker or a Must
// other than "No Must"; further down (to line 15) only stop phrases are checked, because review
// notes routinely say things like "the test fails on the previous code".
const NEAR = /\b(block(ed|ing|s)?|fail(ed|ing|s|ure)?|hold|reject(ed|s)?|revert(ed|s)?|pending|until|unless|conditional)\b/;
const MUST = /\bmusts?\b/;
export function countedPass(body) {
  const lines = String(body ?? "").replace(/\r\n?|\u2028|\u2029/g, "\n").trim().split("\n");
  const norm = (t) => t.toLowerCase().replace(APOSTROPHES, "'");
  if (STOP_ANYWHERE.test(norm(lines.slice(0, 15).join("\n")))) return undefined;
  const first = lines[0].trim();
  const s = first.match(STRICT);
  const m = !s && first.match(MARKER);
  const v = m && lines[1]?.trim().match(/^verdict:\s*(pass|pass with notes)\s*$/i);
  if (!s && !v) return undefined;
  const near = norm(lines.slice(s ? 1 : 2).filter((l) => l.trim()).slice(0, 2).join("\n"));
  // "No Must." counts as harmless only when nothing follows it on that clause ("No Must except M1" does not).
  const bare = near.replace(/\bno\s+musts?(?=\s*([.;]|$))/gm, " ");
  if (NEAR.test(near) || MUST.test(bare) || /\bmust[\s-]*fix\b|\bm\d+\b/.test(bare)) return undefined;
  return s ? { lens: s[1].toUpperCase(), sha: s[3], verdict: s[4].toUpperCase() } : { lens: m[1].toUpperCase(), sha: m[2], verdict: v[1].toUpperCase() };
}

/** Known machine notes that never carry a review: merge-train, journal and receipt posts. */
const MACHINE_NOTE = /^<!--\s*(merge-train|journal|receipt)\b/i;

/** The lens letter a free-text review names ("Review A", "lens B"), or undefined. */
export const lensOf = (body) => String(body ?? "").split("\n")[0].match(/\b(?:review(?:er)?|lens)[\s,:-]*(?:lens\s+)?\(?([ab])\b|\blens\s*\(([ab])\)/i)?.slice(1).find(Boolean)?.toUpperCase();

/** Latest lens and red-team verdicts from a PR's comments and reviews, trusted authors only. */
export function verdictsOf(pr, comments, reviews, trusted) {
  const items = [
    ...(comments ?? []).map((c) => ({ body: c.body, at: c.created_at, who: c.user?.login })),
    ...(reviews ?? []).map((r) => ({ body: r.body, at: r.submitted_at, who: r.user?.login, state: r.state })),
  ].filter((i) => trusted.has(String(i.who ?? "").toLowerCase()));
  items.sort((a, b) => String(a.at).localeCompare(String(b.at)));
  const head = pr.head?.sha;
  const lens = [];
  let red;
  // A "Request changes" review stays in force until the same account approves (or it is dismissed,
  // which GitHub reports as state DISMISSED), wherever it falls in time.
  const lastFormal = new Map();
  for (const i of items) if (i.state === "APPROVED" || i.state === "CHANGES_REQUESTED") lastFormal.set(String(i.who).toLowerCase(), i.state);
  const changesRequested = [...lastFormal.values()].includes("CHANGES_REQUESTED");
  for (const i of items) {
    const body = String(i.body ?? "");
    if (i.state === "CHANGES_REQUESTED") { lens.push({ verdict: "CHANGES REQUESTED", sha: undefined, lens: lensOf(body), onHead: false, counted: false }); continue; }
    const r = parseVerdict(body);
    if (r) { red = { verdict: r.verdict, sha: r.sha, onHead: sameSha(r.sha, head) }; continue; }
    const c = countedPass(body);
    if (c) { lens.push({ ...c, onHead: sameSha(c.sha, head), counted: true }); continue; }
    const l = parseLens(body, pr.number);
    if (l) { lens.push({ ...l, lens: lensOf(body), onHead: sameSha(l.sha, head), counted: false }); continue; }
    // Fail closed: every other trusted comment or review is kept as UNREAD so that, if it comes after
    // the counted passes, it raises a warning. Skipped only: an approval with an empty body, and the
    // known machine notes unless they hold a stop phrase. A review with an empty body (its content
    // may be all inline comments, which this page does not fetch) is kept.
    if (i.state === "APPROVED" && !body.trim()) continue;
    if (MACHINE_NOTE.test(body.trimStart()) && !STOP_ANYWHERE.test(body.toLowerCase().replace(APOSTROPHES, "'"))) continue;
    if (!body.trim() && !i.state) continue; // an empty issue comment says nothing
    lens.push({ verdict: "UNREAD", sha: undefined, lens: lensOf(body), onHead: false, counted: false });
  }
  return { lens, red, changesRequested };
}

const days = (from, now) => Math.floor((now - new Date(from)) / D);
const word = (v) => (v ? `${v.verdict}${v.onHead ? " on head" : " on an older head"}${v.counted === false ? " (free text)" : ""}` : "none");
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
  const two = p.lens.filter((v) => v.verdict !== "UNREAD").slice(-2); // shown; UNREAD only drives the warning
  // The two must be different lenses: the latest Review A and the latest Review B each count once,
  // only as a strict-format pass on the merged head (see countedPass). A later review the page can
  // attribute to the same lens replaces its earlier one, so a later FAIL cancels an earlier pass.
  const latest = new Map();
  p.lens.forEach((v, i) => { if (v.lens) latest.set(v.lens, { ...v, i }); });
  const passes = [...latest.values()].filter((v) => v.onHead && v.counted && PASSING.has(v.verdict));
  // Fail closed: any later trusted comment or review that is not itself a counted pass (an unlabelled
  // "Re-check: FAIL", "Hold this PR", a "Request changes" review) means a person must read it.
  const first = passes.length ? Math.min(...passes.map((v) => v.i)) : Infinity;
  const unread = p.lens.some((v, i) => i > first && !v.counted);
  // The red-team verdict on the merged head must be "ship" if there is one; anything else is read by a person.
  const redBlocks = p.red && p.red.onHead && String(p.red.verdict).toLowerCase() !== "ship";
  const warn = passes.length < 2 ? " (fewer than 2 counted passes on the merged head)"
    : p.changesRequested ? " (a Request changes review is still in force: read it)"
    : redBlocks ? ` (red team says ${p.red.verdict} on the merged head: read it)`
    : unread ? " (a later review is not a counted pass: read it)" : "";
  return `- #${p.number} ${p.classes.join(", ")}: ${two.length ? two.map(word).join("; ") : "no lens verdict found"}${warn}.`;
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
    out.push(`- #${p.number}, ${p.age} d: lens ${word(p.lens.filter((v) => v.verdict !== "UNREAD").at(-1))}; red team ${word(p.red)}.`);
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
