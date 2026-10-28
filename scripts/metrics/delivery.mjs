#!/usr/bin/env node
// Delivery-stability metrics (RB-12): lead time, deployment frequency,
// change-failure rate (proxy), restore time (proxy).
//
// Layout: computeDelivery() is pure and takes already-fetched arrays so tests use
// fixtures. The CLI at the bottom is the only part that touches the network, and
// only through `gh api` REST (GraphQL is blocked here).
//
// Invariant: a metric with no data is reported as null / "n/a", never 0. A zero
// would read as "measured and perfect" when the truth is "nothing to measure".
// Reads PR metadata and commit messages only; no entry text, no child names.

import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
export const FAILURE_WINDOW_DAYS = 7;
// ADR 0022: ios-v<x.y.z>-rc.<n> is a candidate, ios-v<x.y.z> a release.
export const RELEASE_TAG = /^ios-v\d+\.\d+\.\d+$/;
export const CANDIDATE_TAG = /^ios-v\d+\.\d+\.\d+-rc\.\d+$/;
// Title starts with a conventional fix/revert marker: "fix:", "fix(x):", "Revert ...", "hotfix".
const FIX_TITLE = /^\s*(revert|fix|hotfix)\b/i;

const ms = (iso) => Date.parse(iso);

export function quantile(sorted, q) {
  if (sorted.length === 0) return null;
  // Nearest-rank: no interpolation, so a value is always one that was observed.
  const rank = Math.ceil(q * sorted.length);
  return sorted[Math.max(0, rank - 1)];
}

function summarise(values) {
  const s = [...values].sort((a, b) => a - b);
  return {
    n: s.length,
    median: quantile(s, 0.5),
    p90: quantile(s, 0.9),
    max: s.length ? s[s.length - 1] : null,
  };
}

const round1 = (x) => (x === null ? null : Math.round(x * 10) / 10);

/** Does `text` mention PR number `n` as #n (not #n0, not part of a longer number)? */
function mentions(text, n) {
  return new RegExp(`(^|[^\\w/])#${n}(?!\\d)`).test(text || '');
}

/**
 * @param {object} input
 * @param {Array<{number,title,body,created_at,merged_at,merge_commit_sha,base?}>} input.prs  PRs (merged_at null = not merged)
 * @param {Array<{sha,message,date}>} input.commits  commits on the integration branch
 * @param {Array<{name,date}>} input.tags  tags with the commit date they point at
 * @param {string} input.now  ISO time
 * @param {number} [input.windowDays=30]
 */
export function computeDelivery({ prs, commits = [], tags = [], now, windowDays = 30 }) {
  const end = ms(now);
  const start = end - windowDays * DAY;
  const merged = prs.filter((p) => p.merged_at).map((p) => ({ ...p, t: ms(p.merged_at) }));
  const inWindow = merged.filter((p) => p.t >= start && p.t <= end);

  // Lead time: PR opened to merged. Not commit-to-deploy; there is no deploy step yet.
  const leadHours = inWindow.map((p) => (p.t - ms(p.created_at)) / HOUR);
  const lt = summarise(leadHours);

  // Deployment frequency: tag counts only.
  const dep = tags
    .filter((t) => ms(t.date) >= start && ms(t.date) <= end)
    .map((t) => ({ name: t.name, kind: RELEASE_TAG.test(t.name) ? 'release' : CANDIDATE_TAG.test(t.name) ? 'candidate' : null }))
    .filter((t) => t.kind);
  const releases = dep.filter((t) => t.kind === 'release').length;
  const candidates = dep.filter((t) => t.kind === 'candidate').length;
  const everTagged = tags.some((t) => RELEASE_TAG.test(t.name) || CANDIDATE_TAG.test(t.name));

  // Change failure (proxy). Only PRs whose full 7-day window has elapsed are
  // scored; scoring younger ones would undercount failures that have not happened yet.
  const eligible = inWindow.filter((p) => p.t + FAILURE_WINDOW_DAYS * DAY <= end);
  const failures = [];
  for (const p of eligible) {
    const horizon = p.t + FAILURE_WINDOW_DAYS * DAY;
    const repairs = [];
    for (const f of merged) {
      if (f.number === p.number || f.t <= p.t || f.t > horizon) continue;
      if (!FIX_TITLE.test(f.title || '')) continue;
      if (mentions(f.title, p.number) || mentions(f.body, p.number)) {
        repairs.push({ kind: 'pr', ref: `#${f.number}`, t: f.t });
      }
    }
    if (p.merge_commit_sha) {
      for (const c of commits) {
        const t = ms(c.date);
        if (t <= p.t || t > horizon) continue;
        if (/^revert\b/i.test(c.message || '') && (c.message || '').includes(`This reverts commit ${p.merge_commit_sha}`)) {
          repairs.push({ kind: 'commit', ref: c.sha.slice(0, 7), t });
        }
      }
    }
    if (repairs.length) {
      repairs.sort((a, b) => a.t - b.t);
      failures.push({ pr: p.number, repair: repairs[0].ref, restoreHours: (repairs[0].t - p.t) / HOUR });
    }
  }
  const cfr = {
    scored: eligible.length,
    failed: failures.length,
    rate: eligible.length ? failures.length / eligible.length : null,
    failures: failures.map((f) => ({ pr: f.pr, repair: f.repair })),
  };
  // Restore (proxy): merge of the failing PR to first repair. Not user-visible downtime.
  const rt = summarise(failures.map((f) => f.restoreHours));

  return {
    window: { days: windowDays, start: new Date(start).toISOString(), end: new Date(end).toISOString() },
    sample: { mergedPrs: inWindow.length, prsScoredForFailure: eligible.length, tagsSeen: tags.length },
    leadTimeHours: { ...lt, median: round1(lt.median), p90: round1(lt.p90), max: round1(lt.max) },
    deploymentFrequency: {
      releases,
      candidates,
      perWeek: dep.length ? round1((dep.length / windowDays) * 7) : null,
      note: everTagged
        ? 'Counts ios-v* tags in the window.'
        : 'No deployment yet: no ios-v* tag or release candidate exists in this repository.',
    },
    changeFailureRate: { ...cfr, rate: cfr.rate === null ? null : Math.round(cfr.rate * 1000) / 1000, proxy: true },
    restoreTimeHours: { ...rt, median: round1(rt.median), p90: round1(rt.p90), max: round1(rt.max), proxy: true },
  };
}

export function toMarkdown(r) {
  const f = (v, unit = '') => (v === null || v === undefined ? 'n/a' : `${v}${unit}`);
  const cfr = r.changeFailureRate;
  const rows = [
    ['Lead time (PR opened to merged)', `median ${f(r.leadTimeHours.median, ' h')}, p90 ${f(r.leadTimeHours.p90, ' h')}`, `${r.leadTimeHours.n} merged PRs`],
    [
      'Deployment frequency',
      r.deploymentFrequency.perWeek === null ? 'n/a (no deployment yet)' : `${r.deploymentFrequency.releases} releases, ${r.deploymentFrequency.candidates} candidates`,
      `${r.sample.tagsSeen} tags seen`,
    ],
    ['Change-failure rate (proxy)', cfr.rate === null ? 'n/a' : `${(cfr.rate * 100).toFixed(1)}% (${cfr.failed} of ${cfr.scored})`, `${cfr.scored} PRs scored`],
    ['Restore time (proxy)', r.restoreTimeHours.n ? `median ${f(r.restoreTimeHours.median, ' h')}` : 'n/a (no failures)', `${r.restoreTimeHours.n} repairs`],
  ];
  return ['| Metric | Value | Sample |', '| --- | --- | --- |', ...rows.map((x) => `| ${x.join(' | ')} |`)].join('\n');
}

// ---- thin CLI: network lives only below this line ----

function gh(path) {
  return JSON.parse(execFileSync('gh', ['api', path], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
}

/** Newest-updated first; stop once a page is entirely older than `since`. */
export function fetchPrs(repo, since) {
  const out = [];
  for (let page = 1; page <= 30; page++) {
    const rows = gh(`repos/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=100&page=${page}`);
    out.push(...rows);
    if (rows.length < 100 || rows.every((p) => ms(p.updated_at) < since)) break;
  }
  return out.map((p) => ({ number: p.number, title: p.title, body: p.body, created_at: p.created_at, merged_at: p.merged_at, merge_commit_sha: p.merge_commit_sha }));
}

export function fetchCommits(repo, branch, sinceIso) {
  const out = [];
  for (let page = 1; page <= 30; page++) {
    const rows = gh(`repos/${repo}/commits?sha=${branch}&since=${sinceIso}&per_page=100&page=${page}`);
    out.push(...rows.map((c) => ({ sha: c.sha, message: c.commit.message, date: c.commit.committer.date })));
    if (rows.length < 100) break;
  }
  return out;
}

export function fetchTags(repo) {
  const tags = gh(`repos/${repo}/tags?per_page=100`);
  return tags.map((t) => ({ name: t.name, date: gh(`repos/${repo}/commits/${t.commit.sha}`).commit.committer.date }));
}

function main(argv) {
  const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
  const repo = arg('--repo', 'thesaurabhpareek/earlyletters');
  const branch = arg('--branch', 'develop');
  const days = Number(arg('--days', '30'));
  const now = arg('--now', new Date().toISOString());
  const startMs = ms(now) - days * DAY;
  const result = computeDelivery({
    prs: fetchPrs(repo, startMs),
    commits: fetchCommits(repo, branch, new Date(startMs).toISOString()),
    tags: fetchTags(repo),
    now,
    windowDays: days,
  });
  result.repo = repo;
  result.branch = branch;
  if (argv.includes('--markdown')) console.log(toMarkdown(result));
  else if (argv.includes('--both')) { console.log(JSON.stringify(result, null, 2)); console.log('\n' + toMarkdown(result)); }
  else console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
