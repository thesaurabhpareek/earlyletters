// Reviewer calibration signal (owner: qa). Contract: ctx = { state, now, repo, ghAll, openPRs }
// and, from the same hook context, optional { gh, roster, env } (gh for one bounded
// closed-PR list call, roster and env for the trust check).
//
// The board shows the red team's verdict mix over its last 20 reviews, and warns
// when 15 or more reviews in a row carry no "ship" verdict: a reviewer that never
// passes anything is as uninformative as one that passes everything. The fix is
// the calibration set in agents/red-team/calibration/ (docs/agents/hardening/reviewer-calibration.md).
//
// A red-team review is a PR review whose body starts with `<!-- red-team:<sha> -->`;
// its verdict is the second line (`Verdict: ship | fix first | founder decision`).
// Only trusted identities count (lib.mjs isTrusted), as everywhere else.
//
// API budget: cached in ctx.state.verdicts per PR head. Each tick fetches reviews for
// at most FETCH_BUDGET PRs (one call each), plus one closed-PR list call every
// CLOSED_EVERY_MS. A PR is refetched only when its head moved, or when its head has
// no red-team review yet and the PR was updated since the last look.
import { trustContext, isTrusted } from "./lib.mjs";

export const WINDOW = 20;
export const WARN_AFTER = 15;
export const FETCH_BUDGET = 5;
export const CLOSED_EVERY_MS = 6 * 3600_000;
const CLOSED_LIST = 10;
const KEEP_CLOSED = 60;
const VERDICTS = ["ship", "fix first", "founder decision"];
const short = (sha) => String(sha ?? "").slice(0, 12);

/** The verdict of one review body, or undefined when it is not a red-team review. */
export function parseVerdict(body) {
  const lines = String(body ?? "").replace(/\r\n/g, "\n").replace(/^\s+/, "").split("\n");
  const m = lines[0]?.match(/^<!-- red-team:([0-9a-f]{7,40}) -->\s*$/);
  if (!m) return undefined;
  const v = (lines[1] ?? "").match(/^\s*\**Verdict:?\**:?\s*([a-z ]+?)\s*\.?\s*$/i)?.[1]?.toLowerCase();
  return { sha: m[1], verdict: VERDICTS.includes(v) ? v : "unclear" };
}

/** Red-team reviews from one PR's review list, as compact [sha12, verdict, at] rows. */
export function redTeamRows(reviews, trust) {
  const rows = [];
  for (const r of reviews ?? []) {
    if (trust && !isTrusted(r, trust)) continue;
    const p = parseVerdict(r.body);
    if (p) rows.push([short(p.sha), p.verdict, r.submitted_at ?? ""]);
  }
  return rows;
}

function stale(entry, pr) {
  if (!entry) return true;
  if (entry.h !== short(pr.head?.sha)) return true;
  if (entry.x) return false;
  return !entry.r.some((row) => row[0] === entry.h) && entry.u !== pr.updated_at;
}

/** Refresh the cache within the call budget. Mutates ctx.state.verdicts; returns calls made. */
export function refresh(ctx) {
  const st = (ctx.state.verdicts ??= {});
  st.prs ??= {};
  st.pending ??= [];
  const now = new Date(ctx.now ?? Date.now());
  const trust = ctx.roster ? trustContext(ctx.roster, ctx.env ?? {}) : undefined;
  let calls = 0;

  const open = new Set();
  for (const pr of ctx.openPRs ?? []) open.add(String(pr.number));
  for (const [n, e] of Object.entries(st.prs)) if (!open.has(n)) e.x = 1;

  if (ctx.gh && (!st.closedAt || now - new Date(st.closedAt) >= CLOSED_EVERY_MS)) {
    const closed = ctx.gh(`/repos/${ctx.repo}/pulls?state=closed&sort=updated&direction=desc&per_page=${CLOSED_LIST}`, { allowFail: true });
    calls++;
    st.closedAt = now.toISOString();
    for (const pr of Array.isArray(closed) ? closed : []) {
      const e = st.prs[pr.number];
      if (e && e.h === short(pr.head?.sha)) continue;
      if (!st.pending.some((p) => p.n === pr.number)) st.pending.push({ n: pr.number, h: pr.head?.sha, u: pr.updated_at });
    }
  }

  const candidates = [
    ...(ctx.openPRs ?? []).filter((pr) => stale(st.prs[pr.number], pr)).map((pr) => ({ n: pr.number, h: pr.head?.sha, u: pr.updated_at, closed: false })),
    ...st.pending.filter((p) => !open.has(String(p.n))).map((p) => ({ ...p, closed: true })),
  ].sort((a, b) => String(b.u).localeCompare(String(a.u)));

  for (const c of candidates.slice(0, FETCH_BUDGET)) {
    const reviews = ctx.ghAll(`/repos/${ctx.repo}/pulls/${c.n}/reviews`, { allowFail: true });
    calls++;
    if (!Array.isArray(reviews)) continue;
    st.prs[c.n] = { h: short(c.h), u: c.u, r: redTeamRows(reviews, trust), ...(c.closed ? { x: 1 } : {}) };
    st.pending = st.pending.filter((p) => p.n !== c.n);
  }
  st.pending = st.pending.filter((p) => !open.has(String(p.n)));

  const closedKeys = Object.keys(st.prs).filter((n) => st.prs[n].x).sort((a, b) => Number(b) - Number(a));
  for (const n of closedKeys.slice(KEEP_CLOSED)) delete st.prs[n];
  st.unscanned = (ctx.openPRs ?? []).filter((pr) => !st.prs[pr.number]).length;
  return calls;
}

/** Verdict mix over the newest `window` reviews in the cache. */
export function summarize(st, window = WINDOW) {
  const rows = Object.values(st?.prs ?? {}).flatMap((e) => e.r ?? []);
  rows.sort((a, b) => String(b[2]).localeCompare(String(a[2])));
  const recent = rows.slice(0, window);
  const counts = { ship: 0, "fix first": 0, "founder decision": 0, unclear: 0 };
  for (const row of recent) counts[row[1]] = (counts[row[1]] ?? 0) + 1;
  let sinceShip = 0;
  for (const row of rows) { if (row[1] === "ship") break; sinceShip++; }
  return { total: rows.length, recent: recent.length, counts, sinceShip };
}

/** Lines for the board from a summary ([] when no red-team review is known). */
export function formatLines(sum, unscanned = 0) {
  if (!sum.total) return [];
  const c = sum.counts;
  const mix = [`ship ${c.ship}`, `fix first ${c["fix first"]}`, `founder decision ${c["founder decision"]}`];
  if (c.unclear) mix.push(`no verdict line ${c.unclear}`);
  const lines = [`- **Red-team verdicts, last ${sum.recent} of ${sum.total} seen:** ${mix.join(", ")}.`];
  if (sum.sinceShip >= WARN_AFTER) {
    lines.push(`- **Warning:** no ship verdict in ${sum.sinceShip} reviews; run the calibration set (\`agents/red-team/calibration/README.md\`).`);
  }
  if (unscanned) lines.push(`- Verdict cache still filling: ${unscanned} open PRs not scanned yet (${FETCH_BUDGET} per tick).`);
  return lines;
}

/** Board lines with the red team's recent verdict mix ([] when unknown). */
export function boardLines(ctx) {
  try {
    if (!ctx?.state || typeof ctx.ghAll !== "function") return [];
    refresh(ctx);
    return formatLines(summarize(ctx.state.verdicts), ctx.state.verdicts.unscanned);
  } catch {
    return [];
  }
}
