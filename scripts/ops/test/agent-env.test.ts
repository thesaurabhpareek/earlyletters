// BL-1330 (FR-BKO-21): agents hold no production power; the rule is written once in docs/ops/ACCESS.md.
// Run: npm run test:functions
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { AGENT_SECRET_ALLOWLIST, explain, jobsOf, scanWorkflow } from '../lib/agent-env.ts';

const DIR = new URL('../../../.github/workflows/', import.meta.url);
const WORKFLOWS = readdirSync(DIR).filter((f) => /\.ya?ml$/.test(f)).sort();
const read = (f: string) => readFileSync(new URL(f, DIR), 'utf8');
const AGENTS = read('agents.yml');

/** Adds one env line to the first step of a named job, the way someone would plant a key. */
function plant(workflow: string, job: string, line: string): string {
  const lines = workflow.split('\n');
  const head = lines.findIndex((l) => l === `  ${job}:`);
  assert.ok(head >= 0, `job ${job} exists`);
  lines.splice(head + 1, 0, `    env:`, `      ${line}`);
  return lines.join('\n');
}

Deno.test('[FR-BKO-21] every workflow in the repo passes: no agent job reads a production key, no production key outside an environment', () => {
  assert.ok(WORKFLOWS.length >= 10, `read ${WORKFLOWS.length} workflows`);
  const findings = WORKFLOWS.flatMap((f) => scanWorkflow(f, read(f)));
  assert.deepEqual(findings.map(explain), []);
});

Deno.test('[FR-BKO-21] the reader finds the agent jobs it guards, and the secrets they read are all on the allowlist', () => {
  const run = jobsOf(AGENTS).find((j) => j.name === 'run');
  assert.ok(run, 'agents.yml has its run job');
  assert.equal(run.runsAgent, true);
  assert.ok(run.secrets.length > 0, 'the run job reads its model keys');
  for (const s of run.secrets) assert.ok(AGENT_SECRET_ALLOWLIST.includes(s), s);
  const claude = jobsOf(read('claude.yml')).find((j) => j.name === 'claude');
  assert.equal(claude?.runsAgent, true);
});

Deno.test('[FR-BKO-21] a planted service role key, signing key or backup key in an agent job fails', () => {
  for (const name of ['SUPABASE_SERVICE_ROLE_KEY', 'EL_SIGNING_KEY', 'TOKEN_KEK', 'OP_SERVICE_ACCOUNT_TOKEN', 'SUPABASE_DB_URL_PROD']) {
    const planted = plant(AGENTS, 'run', `X: \${{ secrets.${name} }}`);
    assert.deepEqual(scanWorkflow('agents.yml', planted), [{ file: 'agents.yml', job: 'run', rule: 'agent-allowlist', secret: name }], name);
  }
});

Deno.test('[FR-BKO-21] any secret off the allowlist fails in an agent job, even one with a harmless name', () => {
  const planted = plant(AGENTS, 'run', 'X: ${{ secrets.EXPO_TOKEN }}');
  assert.equal(scanWorkflow('agents.yml', planted).length, 1);
});

Deno.test('[FR-BKO-21] an agent step in any workflow makes that job an agent job', () => {
  const wf = [
    'on: pull_request',
    'jobs:',
    '  helper:',
    '    runs-on: ubuntu-24.04',
    '    steps:',
    '      - uses: anthropics/claude-code-action@6d5ae526d25ce88daa2200be073e1a373167f064',
    '        env:',
    '          K: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}',
    '',
  ].join('\n');
  assert.deepEqual(scanWorkflow('other.yml', wf), [{ file: 'other.yml', job: 'helper', rule: 'agent-allowlist', secret: 'SUPABASE_SERVICE_ROLE_KEY' }]);
});

Deno.test('[FR-BKO-21] an agent workflow that hands out every secret fails', () => {
  for (const line of ['ALL: ${{ toJSON(secrets) }}', "ONE: ${{ secrets[format('{0}', 'X')] }}"]) {
    const found = scanWorkflow('agents.yml', plant(AGENTS, 'run', line));
    assert.ok(found.some((f) => f.rule === 'agent-all-secrets'), line);
  }
});

Deno.test('[FR-BKO-21] a production key read by a job with no environment fails; with an environment it passes', () => {
  const wf = (env: string) =>
    ['on: workflow_dispatch', 'jobs:', '  push:', '    runs-on: ubuntu-24.04', env, '    steps:', '      - run: echo', '        env:', '          K: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}', ''].filter((l) => l !== '').join('\n');
  assert.deepEqual(scanWorkflow('deploy.yml', wf('')), [{ file: 'deploy.yml', job: 'push', rule: 'production-environment', secret: 'SUPABASE_SERVICE_ROLE_KEY' }]);
  assert.deepEqual(scanWorkflow('deploy.yml', wf('    environment: db-production')), []);
  assert.deepEqual(scanWorkflow('deploy.yml', wf('    environment:\n      name: db-production')), []);
});

Deno.test('[FR-BKO-21] removing the environment from the real production deploy job fails', () => {
  const db = read('deploy-db.yml');
  assert.match(db, /^ {4}environment: db-production$/m);
  const found = scanWorkflow('deploy-db.yml', db.replace(/^ {4}environment: db-production\n/m, ''));
  assert.ok(found.some((f) => f.rule === 'production-environment' && f.secret === 'SUPABASE_DB_URL_PROD'));
});

Deno.test('[FR-BKO-21] a commented-out secret is not a read, and the findings name the secret but never a value', () => {
  const planted = plant(AGENTS, 'run', '# X: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}');
  assert.deepEqual(scanWorkflow('agents.yml', planted), []);
  const line = explain({ file: 'agents.yml', job: 'run', rule: 'agent-allowlist', secret: 'EL_SIGNING_KEY' });
  assert.equal(line, 'agents.yml run: agent job reads EL_SIGNING_KEY, which is not on the agent allowlist');
});
