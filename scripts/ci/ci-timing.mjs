#!/usr/bin/env node
/**
 * Read-only reader of the macOS launch job's timings (BRIEF CI-Q1; NFR T-01, T-02). Not a gate: it measures.
 *
 *   node scripts/ci/ci-timing.mjs [--repo owner/name] [--runs 30] [--json]
 *
 * For the newest successful runs of ios-compile.yml it reads each run's jobs (GET only, through `gh api`) and prints,
 * for the `store-profile Release launch` job: queue wait (job created to started), run time, and the minutes in
 * each step that matters (expo prebuild, Restore DerivedData, xcodebuild), as min, median and max. It also counts the
 * runs queued and in progress now. Output is run ids, step names and minutes: no log text, no token, no content.
 */
import { execFile } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const DEFAULT_REPO = 'thesaurabhpareek/earlyletters';
export const LAUNCH_JOB = /Release launch/;
/** The steps worth a number each; matched against the step name. */
export const STEPS = [
  ['prebuild', /^expo prebuild/],
  ['restore DerivedData', /^Restore DerivedData/],
  ['pod install', /^pod install/],
  ['xcodebuild', /^xcodebuild/],
  ['simulator and launch', /^(?:Simulator|Launch and stay up)/],
];
const ms = (t) => Date.parse(t);
const min = (a, b) => (a && b ? Math.round(((ms(b) - ms(a)) / 60000) * 10) / 10 : null);

/** Minutes for one job: queue wait, run time and each step in STEPS (summed when two steps match). */
export function jobTimes(job) {
  const steps = {};
  for (const [label, re] of STEPS) {
    const hit = (job.steps ?? []).filter((s) => re.test(s.name) && s.conclusion !== 'skipped');
    steps[label] = hit.length ? Math.round(hit.reduce((t, s) => t + (min(s.started_at, s.completed_at) ?? 0), 0) * 10) / 10 : null;
  }
  return { queue: min(job.created_at, job.started_at), run: min(job.started_at, job.completed_at), steps };
}

export const median = (xs) => {
  const v = xs.filter((x) => typeof x === 'number').sort((a, b) => a - b);
  if (!v.length) return null;
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : Math.round(((v[m - 1] + v[m]) / 2) * 10) / 10;
};
const spread = (xs) => {
  const v = xs.filter((x) => typeof x === 'number');
  return { n: v.length, min: v.length ? Math.min(...v) : null, median: median(v), max: v.length ? Math.max(...v) : null };
};

/** `runs` is [{ id, jobs: [job] }]. Only successful launch jobs count. */
export function summarize(runs) {
  const rows = [];
  for (const r of runs) {
    const job = (r.jobs ?? []).find((j) => LAUNCH_JOB.test(j.name) && j.conclusion === 'success');
    if (job) rows.push({ id: r.id, ...jobTimes(job) });
  }
  /** @type {{ launches: number, queue: any, run: any, steps: Record<string, any>, rows: any[] }} */
  const out = { launches: rows.length, queue: spread(rows.map((r) => r.queue)), run: spread(rows.map((r) => r.run)), steps: {}, rows };
  for (const [label] of STEPS) out.steps[label] = spread(rows.map((r) => r.steps[label]));
  return out;
}

/**
 * @param {any} s
 * @param {{ queued: number | null, inProgress: number | null }} [now]
 */
export function render(s, now = { queued: null, inProgress: null }) {
  const f = (x) => (x.n ? `min ${x.min}, median ${x.median}, max ${x.max} (n=${x.n})` : 'no data');
  return [
    `launch jobs read: ${s.launches}`,
    `queue wait (min): ${f(s.queue)}`,
    `run time (min): ${f(s.run)}`,
    ...Object.entries(s.steps).map(([k, v]) => `  ${k} (min): ${f(v)}`),
    now.queued === null ? '' : `now: ${now.queued} runs queued, ${now.inProgress} in progress`,
  ].filter(Boolean).join('\n');
}

function ghApi(path) {
  return new Promise((resolve, reject) => {
    execFile('gh', ['api', '-X', 'GET', path], { maxBuffer: 64 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(new Error(`gh api ${path.split('?')[0]} failed`));
      try { resolve(JSON.parse(stdout)); } catch { reject(new Error('not JSON')); }
    });
  });
}

export async function main(argv = process.argv.slice(2), api = ghApi) {
  const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
  const repo = opt('--repo', DEFAULT_REPO);
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) throw new Error('--repo must look like owner/name');
  const limit = Math.min(100, Math.max(1, Number(opt('--runs', 30))));
  const base = `repos/${repo}/actions/workflows/ios-compile.yml/runs`;
  const ok = (await api(`${base}?status=success&per_page=${limit}`)).workflow_runs ?? [];
  const runs = [];
  for (const r of ok) runs.push({ id: r.id, jobs: (await api(`repos/${repo}/actions/runs/${r.id}/jobs?per_page=100`)).jobs ?? [] });
  const count = async (status) => (await api(`${base}?status=${status}&per_page=1`)).total_count ?? 0;
  const s = summarize(runs);
  const now = { queued: await count('queued'), inProgress: await count('in_progress') };
  process.stdout.write(`${argv.includes('--json') ? JSON.stringify({ ...s, now }, null, 2) : render(s, now)}\n`);
  return 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().then((c) => process.exit(c), (e) => { process.stderr.write(`ci-timing failed: ${e.message}\n`); process.exit(2); });
