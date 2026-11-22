/// <reference types="node" />
/**
 * CR-175 (docs/agents/cto/RULINGS.md; docs/ops/proposed/ci-speed.md change 3): once the store launch check runs on develop
 * after the merge, a red run opens one `launch-red` issue with the run link and the commit, or comments on the one already
 * open, never a second; a green run closes it; a cancelled or skipped launch changes nothing.
 *
 * The job's script lives inline in .github/workflows/ios-compile.yml (job `launch-alert`, step `launch-issue`), so the job
 * needs no checkout and its token holds issues: write alone. This test cuts that exact `run:` block out of the workflow and
 * runs it with bash and Node against a stand-in for the GitHub REST API on 127.0.0.1, which keeps the issues in memory and
 * records every call. Nothing here calls GitHub. Fictional repository and people only.
 */
import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const WORKFLOW = readFileSync(join(__dirname, '..', '..', '..', '.github', 'workflows', 'ios-compile.yml'), 'utf8');
const BOT = 'github-actions[bot]';
const REPO = 'asha-family/book';
const RUN_URL = 'https://github.example/asha-family/book/actions/runs/42';

/** The lines of a top-level job: from `  <name>:` to the next job or the end. */
function jobBlock(name: string): string {
  const lines = WORKFLOW.split('\n');
  const start = lines.findIndex((l) => l === `  ${name}:`);
  expect(start, `job ${name} in ios-compile.yml`).toBeGreaterThan(0);
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

const SCRIPT = runScript('launch-issue');
const gh = fakeGitHub();
let apiUrl = '';

beforeAll(async () => {
  await new Promise<void>((resolve) => gh.server.listen(0, '127.0.0.1', resolve));
  apiUrl = `http://127.0.0.1:${(gh.server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((resolve) => gh.server.close(() => resolve())));

const SHA = '0123456789abcdef0123456789abcdef01234567';

/** Runs the workflow's script once, as the runner would, with this launch result. */
function report(result: string): Promise<{ code: number; out: string }> {
  const env: NodeJS.ProcessEnv = { NODE_ENV: 'test', PATH: process.env.PATH ?? '', GITHUB_API_URL: apiUrl, GITHUB_REPOSITORY: REPO, GH_TOKEN: 'test-token', LAUNCH_RESULT: result, SHA, RUN_URL };
  return new Promise((resolve) => {
    execFile('bash', ['-e', '-c', SCRIPT], { env, timeout: 20_000, encoding: 'utf8' }, (err, stdout, stderr) => {
      const code = err ? (typeof err.code === 'number' ? err.code : 1) : 0;
      resolve({ code, out: `${stdout}${stderr}` });
    });
  });
}

function reset(issues: Partial<Issue>[] = []) {
  gh.state.issues = issues.map((i, n) => ({ number: n + 1, state: 'open', title: 'x', body: '', labels: [{ name: 'launch-red' }], user: { login: BOT }, comments: [], ...i }) as Issue);
  gh.state.labels = new Set(issues.length ? ['launch-red'] : []);
  gh.state.calls = [];
  gh.state.failOn = null;
  gh.state.dropLabelsOnCreate = false;
}
const writes = () => gh.state.calls.filter((c) => c.method !== 'GET').map((c) => `${c.method} ${c.path}`);
const openIssues = () => gh.state.issues.filter((i) => i.state === 'open' && i.labels.some((l) => l.name === 'launch-red'));

describe('CR-175: the launch-red issue, run against a stand-in API', () => {
  it('a red launch with no issue open creates the label and opens one issue with the run link and the short commit', async () => {
    reset();
    const r = await report('failure');
    expect(r.code, r.out).toBe(0);
    expect(writes()).toEqual(['POST /labels', 'POST /issues']);
    expect(openIssues()).toHaveLength(1);
    const [issue] = openIssues();
    expect(issue.title).toBe('The store launch check is red on develop');
    expect(issue.body).toContain(RUN_URL);
    expect(issue.body).toContain(SHA.slice(0, 9));
    expect(issue.body).not.toContain(SHA);
    expect(r.out).toContain('red: opened #1');
  });

  it('red again, and again: one comment each on the open issue, never a second issue', async () => {
    reset([{ title: 'The store launch check is red on develop' }]);
    for (let n = 0; n < 2; n++) expect((await report('failure')).code).toBe(0);
    expect(writes()).toEqual(['POST /issues/1/comments', 'POST /issues/1/comments']);
    expect(openIssues()).toHaveLength(1);
    expect(gh.state.issues[0].comments[0]).toContain(RUN_URL);
  });

  it('a green launch closes every open issue it opened, with the run link, and leaves a person\'s and a pull request alone', async () => {
    reset([{}, { user: { login: 'asha-parent' } }, { pull_request: {} }]);
    const r = await report('success');
    expect(r.code, r.out).toBe(0);
    expect(writes()).toEqual(['POST /issues/1/comments', 'PATCH /issues/1']);
    expect(gh.state.issues[0]).toMatchObject({ state: 'closed', state_reason: 'completed' });
    expect(gh.state.issues[0].comments[0]).toContain(RUN_URL);
    expect(gh.state.issues[1].state).toBe('open');
    expect(gh.state.issues[2].state).toBe('open');
  });

  it('a green launch with nothing open writes nothing', async () => {
    reset();
    const r = await report('success');
    expect(r.code).toBe(0);
    expect(writes()).toEqual([]);
    expect(r.out).toContain('green: no launch-red issue open');
  });

  it('a cancelled or skipped launch (replaced by a newer run) changes nothing, even with an issue open', async () => {
    reset([{}]);
    for (const result of ['cancelled', 'skipped']) {
      const r = await report(result);
      expect(r.code, r.out).toBe(0);
      expect(r.out).toContain(`launch result is ${result}: nothing to report`);
    }
    expect(gh.state.calls).toEqual([]);
    expect(openIssues()).toHaveLength(1);
  });

  it('a red launch with only a person\'s launch-red issue open opens its own and does not touch theirs', async () => {
    reset([{ user: { login: 'asha-parent' } }]);
    expect((await report('failure')).code).toBe(0);
    expect(writes()).toEqual(['POST /labels', 'POST /issues']);
    expect(gh.state.issues[0].comments).toEqual([]);
  });

  it('a label dropped on create is added back, so the next red run finds the issue', async () => {
    reset();
    gh.state.dropLabelsOnCreate = true;
    expect((await report('failure')).code).toBe(0);
    expect(writes()).toEqual(['POST /labels', 'POST /issues', 'POST /issues/1/labels']);
    gh.state.dropLabelsOnCreate = false;
    expect((await report('failure')).code).toBe(0);
    expect(openIssues()).toHaveLength(1);
  });

  it('an API failure fails the step, so the job goes red instead of hiding the alert', async () => {
    reset();
    gh.state.failOn = 'POST /issues';
    const r = await report('failure');
    expect(r.code).not.toBe(0);
    expect(r.out).toContain('POST /issues: HTTP 500');
  });
});

describe('CR-175: the launch-alert job and the triggers in ios-compile.yml', () => {
  const job = jobBlock('launch-alert');

  it('needs the launch job, runs on push only and not after a cancel', () => {
    expect(/needs: \[([^\]]*)\]/.exec(job)?.[1].trim()).toBe('launch');
    expect(job).toMatch(/if: \$\{\{ !cancelled\(\) && github\.event_name == 'push' \}\}/);
  });

  it('holds issues: write and no other permission, checks nothing out and reads no secret', () => {
    expect(job).toMatch(/\n {4}permissions:\n {6}issues: write\n {4}steps:/);
    expect(job).not.toMatch(/uses:/);
    expect(job).not.toMatch(/secrets\./);
    expect(job).toMatch(/GH_TOKEN: \$\{\{ github\.token \}\}/);
  });

  it('the pull request path list covers the eleven build paths of RELEASE.md 3.4 and merge-queue.mjs, so a gating PR still gets its macOS check', () => {
    const prBlock = /\n {2}pull_request:\n {4}paths:\n((?: {6}- .*\n)+)/.exec(WORKFLOW)?.[1] ?? '';
    const globs = prBlock.split('\n').map((l) => l.replace(/^ {6}- /, '').trim()).filter(Boolean);
    const toRe = (g: string) => new RegExp(`^${g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*')}$`);
    const samples = ['apps/mobile/ios/App/x.swift', 'apps/mobile/modules/m/y.swift', 'apps/mobile/app.config.ts', 'apps/mobile/eas.json', 'package-lock.json', 'apps/mobile/metro.config.js', 'apps/mobile/store.config.json', 'apps/mobile/version.json', 'apps/mobile/src/lib/privacy-manifest.ts', 'apps/mobile/src/lib/permission-copy.ts', 'apps/mobile/patches/p.patch'];
    for (const f of samples) expect(globs.some((g) => toRe(g).test(f)), f).toBe(true);
  });

  it('push runs on develop never cancel a running run (cancel only for pull requests)', () => {
    expect(WORKFLOW).toMatch(/cancel-in-progress: \$\{\{ github\.event_name == 'pull_request' \}\}/);
    expect(WORKFLOW).toMatch(/\n {2}push:\n {4}branches: \[develop\]\n/);
  });
});
