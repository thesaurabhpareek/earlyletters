#!/usr/bin/env node
// Pipeline ledger (harness v2 HV2-B03, HV2-011; design: docs/agents/harness-v2/EVIDENCE-AND-GREEN.md section 3).
//
// Question it answers by machine: "has each release workflow ever had a run that really did its job?" A run
// whose conclusion is `success` is not enough: a workflow whose build step is skipped still ends green. So a
// run counts only when its conclusion is `success` AND every step in the workflow's fixed list (for example
// "Build on EAS" in testflight.yml) ran and succeeded. Otherwise the run is "skipped" (or "failed").
//
// It reads the Actions API by REST only (`gh api`; GraphQL is blocked here):
//   GET /repos/{owner}/{repo}/actions/workflows/{file}/runs?per_page=100&page=N
//   GET /repos/{owner}/{repo}/actions/runs/{id}/jobs?per_page=100&filter=latest
// It never writes to GitHub, never reads a secret, and prints no token. Jobs are only fetched for runs whose
// conclusion is `success`; the newest qualifying run ends the search for that workflow.
//
//   node scripts/ci/pipeline-ledger.mjs                      # print the Markdown ledger
//   node scripts/ci/pipeline-ledger.mjs --write              # also write docs/release/PIPELINE_LEDGER.md (generated block)
//   node scripts/ci/pipeline-ledger.mjs --json               # machine output
//   node scripts/ci/pipeline-ledger.mjs --strict             # exit 1 when any workflow is "never"
//   options: --repo owner/name (default thesaurabhpareek/earlyletters), --max-pages N (default 3, 100 runs each),
//            --max-job-lookups N (default 30, per workflow)
//
// Exit codes: 0 ok (or "never" without --strict), 1 --strict and a workflow is "never", 2 usage or API error.
// Honest limits: a step that is absent from a run's jobs counts as not run (the step list must match the
// workflow file by hand); runs older than the pages read are not seen, and the output says so.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const DEFAULT_REPO = 'thesaurabhpareek/earlyletters';

/** Release workflows and the steps that must have succeeded for a run to count. Step names from .github/workflows/*.yml on develop. */
export const RELEASE_WORKFLOWS = [
  { file: 'testflight.yml', steps: ['Build on EAS'] },
  { file: 'release-ios.yml', steps: ['Build and auto-submit'] },
  { file: 'deploy-db.yml', steps: ['Push'] },
  { file: 'deploy-functions.yml', steps: ['Deploy'] },
];

/** How one finished run counts. `jobs` is the `jobs` array of the jobs endpoint, or null when not fetched. */
export function classifyRun(run, jobs, requiredSteps) {
  if (!run || run.conclusion == null) return 'in_progress';
  if (run.conclusion === 'skipped') return 'skipped';
  if (run.conclusion !== 'success') return 'failed';
  if (!jobs) return 'skipped';
  const steps = jobs.flatMap((j) => j.steps ?? []);
  for (const name of requiredSteps) {
    const hits = steps.filter((s) => s.name === name);
    if (hits.length === 0) return 'skipped';
    if (!hits.some((s) => s.conclusion === 'success')) return 'skipped';
  }
  return 'real_success';
}

/**
 * Ledger for one workflow. `getRuns(page)` returns the `workflow_runs` array for a page (newest first, empty at the end);
 * `getJobs(runId)` returns the jobs array. Both are injected so tests use fixtures and no network.
 */
export function ledgerFor(workflow, getRuns, getJobs, { maxPages = 3, maxJobLookups = 30, perPage = 100 } = {}) {
  const out = { file: workflow.file, steps: workflow.steps, last: null, counts: { real_success: 0, skipped: 0, failed: 0, in_progress: 0, unchecked: 0 }, seen: 0, truncated: false, lookupsCapped: false };
  let lookups = 0;
  let exhausted = false;
  for (let page = 1; page <= maxPages && !exhausted; page++) {
    const runs = getRuns(page) ?? [];
    if (runs.length < perPage) exhausted = true;
    for (const run of runs) {
      out.seen++;
      let jobs = null;
      if (run.conclusion === 'success') {
        if (lookups >= maxJobLookups) {
          out.lookupsCapped = true;
          out.counts.unchecked++;
          continue;
        }
        lookups++;
        jobs = getJobs(run.id);
      }
      const kind = classifyRun(run, jobs, workflow.steps);
      out.counts[kind]++;
      if (kind === 'real_success' && !out.last) {
        out.last = { url: run.html_url, sha: run.head_sha, date: run.updated_at ?? run.created_at, id: run.id };
      }
    }
  }
  out.truncated = !exhausted;
  return out;
}

export function renderMarkdown(rows, { repo, generatedAt }) {
  const lines = [
    `Generated ${generatedAt} for ${repo} by scripts/ci/pipeline-ledger.mjs (REST, read-only).`,
    '',
    '| Workflow | Last real success | Real | Skipped | Failed | Success runs not checked | Runs read |',
    '|---|---|---|---|---|---|---|',
  ];
  for (const r of rows) {
    const last = r.last ? `${r.last.date} ${r.last.sha.slice(0, 7)} ${r.last.url}` : (r.truncated || r.lookupsCapped ? 'never in the runs checked' : 'never');
    const notes = [r.truncated ? 'older runs not read' : '', r.lookupsCapped ? 'job lookups capped' : ''].filter(Boolean).join('; ');
    lines.push(`| ${r.file} | ${last} | ${r.counts.real_success} | ${r.counts.skipped} | ${r.counts.failed} | ${r.counts.unchecked} | ${r.seen}${notes ? ` (${notes})` : ''} |`);
  }
  lines.push('', 'A run is real only if its conclusion is success and every listed step succeeded (not skipped, not absent). Steps required: ' +
    rows.map((r) => `${r.file}: ${r.steps.join(', ')}`).join('; ') + '.');
  return lines.join('\n');
}

const BEGIN = '<!-- ledger:begin -->';
const END = '<!-- ledger:end -->';

/** Put the generated block between the markers of a document, or return null when the markers are missing. */
export function spliceBlock(doc, block) {
  const a = doc.indexOf(BEGIN);
  const b = doc.indexOf(END);
  if (a === -1 || b === -1 || b < a) return null;
  return `${doc.slice(0, a + BEGIN.length)}\n${block}\n${doc.slice(b)}`;
}

export function parseArgs(argv) {
  const opts = { repo: DEFAULT_REPO, write: false, json: false, strict: false, maxPages: 3, maxJobLookups: 30 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--write') opts.write = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--strict') opts.strict = true;
    else if (a === '--repo') opts.repo = argv[++i];
    else if (a === '--max-pages') opts.maxPages = Number(argv[++i]);
    else if (a === '--max-job-lookups') opts.maxJobLookups = Number(argv[++i]);
    else return { error: `unknown argument ${a}` };
  }
  if (!/^[\w.-]+\/[\w.-]+$/.test(opts.repo ?? '')) return { error: 'repo must look like owner/name' };
  if (!Number.isInteger(opts.maxPages) || opts.maxPages < 1) return { error: 'max-pages must be a positive integer' };
  if (!Number.isInteger(opts.maxJobLookups) || opts.maxJobLookups < 1) return { error: 'max-job-lookups must be a positive integer' };
  return { opts };
}

/** REST through the gh CLI: arguments as an array, no shell. */
function ghApi(path) {
  const text = execFileSync('gh', ['api', path], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return JSON.parse(text);
}

export function main(argv, { api = ghApi, now = () => new Date().toISOString(), docPath, log = console.log } = {}) {
  const parsed = parseArgs(argv);
  if (parsed.error) {
    log(`pipeline-ledger: ${parsed.error}`);
    return 2;
  }
  const { opts } = parsed;
  let rows;
  try {
    rows = RELEASE_WORKFLOWS.map((w) =>
      ledgerFor(
        w,
        (page) => api(`repos/${opts.repo}/actions/workflows/${w.file}/runs?per_page=100&page=${page}`).workflow_runs,
        (id) => api(`repos/${opts.repo}/actions/runs/${id}/jobs?per_page=100&filter=latest`).jobs,
        { maxPages: opts.maxPages, maxJobLookups: opts.maxJobLookups },
      ),
    );
  } catch (e) {
    log(`pipeline-ledger: API read failed: ${String(e.message).split('\n')[0]}`);
    return 2;
  }
  const generatedAt = now();
  if (opts.json) log(JSON.stringify({ repo: opts.repo, generatedAt, rows }, null, 2));
  else log(renderMarkdown(rows, { repo: opts.repo, generatedAt }));
  if (opts.write) {
    const doc = readFileSync(docPath, 'utf8');
    const next = spliceBlock(doc, renderMarkdown(rows, { repo: opts.repo, generatedAt }));
    if (next === null) {
      log('pipeline-ledger: the document has no ledger markers');
      return 2;
    }
    writeFileSync(docPath, next);
  }
  return opts.strict && rows.some((r) => !r.last) ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2), { docPath: fileURLToPath(new URL('../../docs/release/PIPELINE_LEDGER.md', import.meta.url)) }));
}
