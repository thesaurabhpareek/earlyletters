/// <reference types="node" />
/**
 * RA-20-19 (docs/release/AUTOMATION.md 2.8; B2-22 in docs/qa/ALPHA_GO_NO_GO.md): a red scheduled nightly opens one
 * `nightly` issue with the run link, or comments on the one already open, never a second; a green one closes it.
 *
 * The job's script lives inline in .github/workflows/nightly.yml (job `report`, step `nightly-issue`), so the job
 * needs no checkout and its token holds issues: write alone. This test cuts that exact `run:` block out of the
 * workflow and runs it with bash and Node against a stand-in for the GitHub REST API on 127.0.0.1, which keeps the
 * issues in memory and records every call. Nothing here calls GitHub. Fictional repository and people only.
 */
import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const WORKFLOW = readFileSync(join(__dirname, '..', '..', '..', '.github', 'workflows', 'nightly.yml'), 'utf8');
const BOT = 'github-actions[bot]';
const REPO = 'asha-family/book';
const RUN_URL = 'https://github.example/asha-family/book/actions/runs/42';

/** The lines of a top-level job: from `  <name>:` to the next job or the end. */
function jobBlock(name: string): string {
  const lines = WORKFLOW.split('\n');
  const start = lines.findIndex((l) => l === `  ${name}:`);
  expect(start, `job ${name} in nightly.yml`).toBeGreaterThan(0);
  let end = start + 1;
  while (end < lines.length && !/^ {2}[a-z][\w-]*:\s*$/.test(lines[end]) && !/^\S/.test(lines[end])) end++;
  return lines.slice(start, end).join('\n');
}

/** The `run: |` block of the step with `id: <id>`, dedented, exactly as the runner gets it. */
function runScript(id: string): string {
  const lines = WORKFLOW.split('\n');
  const at = lines.findIndex((l) => l.trim() === `id: ${id}`);
  expect(at, `step ${id}`).toBeGreaterThan(0);
  const run = lines.findIndex((l, i) => i > at && /^\s*run: \|\s*$/.test(l));
  const indent = lines[run].indexOf('run:') + 2;
  const body: string[] = [];
  for (let i = run + 1; i < lines.length; i++) {
    const l = lines[i];
    if (l.trim() !== '' && l.length - l.trimStart().length < indent) break;
    body.push(l.slice(indent));
  }
  return `${body.join('\n').trimEnd()}\n`;
}

type Issue = { number: number; state: 'open' | 'closed'; state_reason?: string; title: string; body: string; labels: { name: string }[]; user: { login: string }; pull_request?: object; comments: string[] };
type Call = { method: string; path: string; body: unknown };

/** An in-memory stand-in for the four REST endpoints the script uses. */
function fakeGitHub() {
  const state = { issues: [] as Issue[], labels: new Set<string>(), calls: [] as Call[], failOn: null as string | null, dropLabelsOnCreate: false };
  const send = (res: ServerResponse, status: number, json?: unknown) => {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(json === undefined ? '' : JSON.stringify(json));
  };
  const handle = async (req: IncomingMessage, res: ServerResponse) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const url = new URL(req.url ?? '/', 'http://x');
    const body = raw ? JSON.parse(raw) : undefined;
    const path = url.pathname.replace(`/repos/${REPO}`, '');
    state.calls.push({ method: req.method ?? '', path: path + url.search, body });
    if (req.headers.authorization !== 'Bearer test-token') return send(res, 401, {});
    if (state.failOn && `${req.method} ${path}`.startsWith(state.failOn)) return send(res, 500, {});
    if (req.method === 'GET' && path === '/issues') {
      const label = url.searchParams.get('labels');
      const want = url.searchParams.get('state');
      return send(res, 200, state.issues.filter((i) => i.state === want && i.labels.some((l) => l.name === label)).sort((a, b) => a.number - b.number));
    }
    if (req.method === 'POST' && path === '/labels') {
      if (state.labels.has(body.name)) return send(res, 422, {});
      state.labels.add(body.name);
      return send(res, 201, body);
    }
    if (req.method === 'POST' && path === '/issues') {
      const issue: Issue = { number: state.issues.length + 1, state: 'open', title: body.title, body: body.body, labels: state.dropLabelsOnCreate ? [] : body.labels.map((name: string) => ({ name })), user: { login: BOT }, comments: [] };
      state.issues.push(issue);
      return send(res, 201, issue);
    }
    const m = /^\/issues\/(\d+)(\/comments|\/labels)?$/.exec(path);
    const issue = m && state.issues.find((i) => i.number === Number(m[1]));
    if (!issue) return send(res, 404, {});
    if (req.method === 'POST' && m![2] === '/comments') {
      issue.comments.push(body.body);
      return send(res, 201, {});
    }
    if (req.method === 'POST' && m![2] === '/labels') {
      issue.labels.push(...body.labels.map((name: string) => ({ name })));
      return send(res, 200, issue.labels);
    }
    if (req.method === 'PATCH' && !m![2]) {
      Object.assign(issue, body);
      return send(res, 200, issue);
    }
    return send(res, 404, {});
  };
  const server: Server = createServer((req, res) => void handle(req, res));
  return { state, server };
}

const SCRIPT = runScript('nightly-issue');
const gh = fakeGitHub();
let apiUrl = '';

beforeAll(async () => {
  await new Promise<void>((resolve) => gh.server.listen(0, '127.0.0.1', resolve));
  apiUrl = `http://127.0.0.1:${(gh.server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((resolve) => gh.server.close(() => resolve())));

const GREEN = { fuzz: 'success', db: 'success', perf: 'success', 'legacy-grants': 'success' };
const RED = { ...GREEN, perf: 'failure' };

/** Runs the workflow's script once, as the runner would, with these job results. */
function report(results: Record<string, string>): Promise<{ code: number; out: string }> {
  const needs = Object.fromEntries(Object.entries(results).map(([k, result]) => [k, { result, outputs: {} }]));
  const env: NodeJS.ProcessEnv = { NODE_ENV: 'test', PATH: process.env.PATH ?? '', GITHUB_API_URL: apiUrl, GITHUB_REPOSITORY: REPO, GH_TOKEN: 'test-token', NEEDS: JSON.stringify(needs), RUN_URL, NODE_NO_WARNINGS: '1' };
  return new Promise((resolve) => {
    execFile('bash', ['-e', '-c', SCRIPT], { env, timeout: 20_000, encoding: 'utf8' }, (err, stdout, stderr) => {
      const code = err ? (typeof err.code === 'number' ? err.code : 1) : 0;
      resolve({ code, out: `${stdout}${stderr}` });
    });
  });
}

function reset(issues: Partial<Issue>[] = []) {
  gh.state.issues = issues.map((i, n) => ({ number: n + 1, state: 'open', title: 'x', body: '', labels: [{ name: 'nightly' }], user: { login: BOT }, comments: [], ...i }) as Issue);
  gh.state.labels = new Set(issues.length ? ['nightly'] : []);
  gh.state.calls = [];
  gh.state.failOn = null;
  gh.state.dropLabelsOnCreate = false;
}
const writes = () => gh.state.calls.filter((c) => c.method !== 'GET').map((c) => `${c.method} ${c.path}`);
const openNightly = () => gh.state.issues.filter((i) => i.state === 'open' && i.labels.some((l) => l.name === 'nightly'));

describe('RA-20-19: the nightly issue, run against a stand-in API', () => {
  it('a red run with no issue open creates the label and opens one issue with the run link and the red job', async () => {
    reset();
    const r = await report(RED);
    expect(r.code, r.out).toBe(0);
    expect(writes()).toEqual(['POST /labels', 'POST /issues']);
    expect(openNightly()).toHaveLength(1);
    const [issue] = openNightly();
    expect(issue.title).toBe('Nightly checks are red');
    expect(issue.body).toContain(RUN_URL);
    expect(issue.body).toContain('- perf: failure');
    expect(issue.body).not.toContain('fuzz');
    expect(r.out).toContain('red: opened #1');
  });

  it('red again, and again: one comment each on the open issue, never a second issue', async () => {
    reset([{ title: 'Nightly checks are red' }]);
    for (let n = 0; n < 2; n++) expect((await report(RED)).code).toBe(0);
    expect(writes()).toEqual(['POST /issues/1/comments', 'POST /issues/1/comments']);
    expect(openNightly()).toHaveLength(1);
    expect(gh.state.issues[0].comments).toHaveLength(2);
    expect(gh.state.issues[0].comments[0]).toContain(RUN_URL);
  });

  it('red with two of its own open (made by hand): comments on the oldest only', async () => {
    reset([{}, {}]);
    expect((await report(RED)).code).toBe(0);
    expect(writes()).toEqual(['POST /issues/1/comments']);
  });

  it('a green run closes every open issue it opened, with the run link, and leaves a person\'s and a pull request alone', async () => {
    reset([{}, { user: { login: 'asha-parent' } }, { pull_request: {} }]);
    const r = await report(GREEN);
    expect(r.code, r.out).toBe(0);
    expect(writes()).toEqual(['POST /issues/1/comments', 'PATCH /issues/1']);
    expect(gh.state.issues[0]).toMatchObject({ state: 'closed', state_reason: 'completed' });
    expect(gh.state.issues[0].comments[0]).toContain(RUN_URL);
    expect(gh.state.issues[1].state).toBe('open');
    expect(gh.state.issues[2].state).toBe('open');
  });

  it('a green run with nothing open writes nothing', async () => {
    reset();
    const r = await report(GREEN);
    expect(r.code).toBe(0);
    expect(writes()).toEqual([]);
    expect(r.out).toContain('green: no nightly issue open');
  });

  it('a red run with only a person\'s nightly issue open opens its own and does not touch theirs', async () => {
    reset([{ user: { login: 'asha-parent' } }]);
    expect((await report(RED)).code).toBe(0);
    expect(writes()).toEqual(['POST /labels', 'POST /issues']);
    expect(gh.state.issues[0].comments).toEqual([]);
  });

  it('a label dropped on create is added back, so the next red run finds the issue', async () => {
    reset();
    gh.state.dropLabelsOnCreate = true;
    expect((await report(RED)).code).toBe(0);
    expect(writes()).toEqual(['POST /labels', 'POST /issues', 'POST /issues/1/labels']);
    gh.state.dropLabelsOnCreate = false;
    expect((await report(RED)).code).toBe(0);
    expect(openNightly()).toHaveLength(1);
  });

  it('an API failure fails the step (the job goes red), and a cancelled or skipped job counts as red', async () => {
    reset();
    gh.state.failOn = 'POST /issues';
    const r = await report(RED);
    expect(r.code).not.toBe(0);
    expect(r.out).toContain('POST /issues: HTTP 500');
    reset();
    expect((await report({ ...GREEN, db: 'skipped' })).code).toBe(0);
    expect(openNightly()[0].body).toContain('- db: skipped');
  });
});

describe('RA-20-19: the report job in nightly.yml', () => {
  const job = jobBlock('report');

  it('needs every other job, runs on schedule (or a dispatch that asks), and not after a cancel', () => {
    const jobsSection = WORKFLOW.slice(WORKFLOW.indexOf('\njobs:\n'));
    const jobs = [...jobsSection.matchAll(/^ {2}([a-z][\w-]*):\s*$/gm)].map((m) => m[1]).filter((n) => n !== 'report');
    expect(jobs).toEqual(expect.arrayContaining(['fuzz', 'db', 'perf', 'legacy-grants']));
    const needs = /needs: \[([^\]]*)\]/.exec(job)?.[1].split(',').map((s) => s.trim());
    expect(needs?.sort()).toEqual(jobs.sort());
    expect(job).toMatch(/if: \$\{\{ !cancelled\(\) && \(github\.event_name == 'schedule' \|\| inputs\.report_issue\) \}\}/);
  });

  it('holds issues: write and no other permission, checks nothing out and reads no secret', () => {
    expect(job).toMatch(/\n {4}permissions:\n {6}issues: write\n {4}steps:/);
    expect(job).not.toMatch(/uses:/);
    expect(job).not.toMatch(/secrets\./);
    expect(job).toMatch(/GH_TOKEN: \$\{\{ github\.token \}\}/);
  });
});
