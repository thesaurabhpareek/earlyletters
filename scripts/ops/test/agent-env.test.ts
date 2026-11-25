// BL-1330 (FR-BKO-21): agents hold no production power; the rule is written once in docs/ops/ACCESS.md.
// Run: npm run test:functions
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { AGENT_SECRET_ALLOWLIST, explain, jobsOf, scanWorkflow, split } from '../lib/agent-env.ts';

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
  for (const f of WORKFLOWS) assert.ok(split(read(f)).jobs.length > 0, `${f} splits into jobs`);
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
    assert.ok(found.some((f) => f.rule === 'all-secrets'), line);
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

Deno.test('[FR-BKO-21] a commented-out secret still counts as a read, and the findings name the secret but never a value', () => {
  const planted = plant(AGENTS, 'run', '# X: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}');
  assert.deepEqual(scanWorkflow('agents.yml', planted), [{ file: 'agents.yml', job: 'run', rule: 'agent-allowlist', secret: 'SUPABASE_SERVICE_ROLE_KEY' }]);
  const line = explain({ file: 'agents.yml', job: 'run', rule: 'agent-allowlist', secret: 'EL_SIGNING_KEY' });
  assert.equal(line, 'agents.yml run: agent job reads EL_SIGNING_KEY, which is not on the agent allowlist');
  for (const f of scanWorkflow('agents.yml', planted).map(explain)) assert.doesNotMatch(f, /\$\{\{/);
});

Deno.test('[FR-BKO-21] a key read inside a prompt block, even on a line that starts with #, fails', () => {
  const wf = [
    'on: issue_comment',
    'jobs:',
    '  run:',
    '    runs-on: ubuntu-24.04',
    '    steps:',
    '      - uses: anthropics/claude-code-action@6d5ae526d25ce88daa2200be073e1a373167f064',
    '        with:',
    '          prompt: |',
    '            # Key ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}',
    '',
  ].join('\n');
  assert.deepEqual(scanWorkflow('other.yml', wf), [{ file: 'other.yml', job: 'run', rule: 'agent-allowlist', secret: 'SUPABASE_SERVICE_ROLE_KEY' }]);
});

Deno.test('[FR-BKO-21] a workflow-level env counts for every job: an agent workflow fails, a production key fails even in a job with an environment', () => {
  const agents = AGENTS.replace(/^jobs:/m, 'env:\n  K: ${{ secrets.EL_SIGNING_KEY }}\njobs:');
  const found = scanWorkflow('agents.yml', agents);
  assert.ok(found.length >= 1);
  assert.ok(found.every((f) => f.rule === 'agent-allowlist' && f.secret === 'EL_SIGNING_KEY'));
  assert.ok(found.some((f) => f.job === 'run'));
  const db = read('deploy-db.yml').replace(/^jobs:/m, 'env:\n  K: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}\njobs:');
  assert.ok(scanWorkflow('deploy-db.yml', db).some((f) => f.rule === 'production-environment' && f.secret === 'SUPABASE_SERVICE_ROLE_KEY'));
  const one = ['on: workflow_dispatch', 'env:', '  K: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}', 'jobs:', '  push:', '    runs-on: ubuntu-24.04', '    environment: db-production', '    steps:', '      - run: echo', ''].join('\n');
  assert.deepEqual(scanWorkflow('deploy.yml', one), [{ file: 'deploy.yml', job: 'push', rule: 'production-environment', secret: 'SUPABASE_SERVICE_ROLE_KEY' }], 'a workflow-level read is outside the environment');
  const after = AGENTS + '\nenv:\n  K: ${{ secrets.EL_SIGNING_KEY }}\n';
  assert.ok(scanWorkflow('agents.yml', after).some((f) => f.secret === 'EL_SIGNING_KEY'), 'a top-level key after jobs: counts too');
});

Deno.test('[FR-BKO-21] a layout the reader cannot split is reported, not passed', () => {
  const reindented = AGENTS.split('\n').map((l) => (/^ /.test(l) ? `  ${l}` : l)).join('\n');
  assert.ok(scanWorkflow('agents.yml', reindented).some((f) => f.rule === 'unparsed'));
  assert.deepEqual(scanWorkflow('x.yml', 'on: push\n'), [{ file: 'x.yml', job: '*', rule: 'unparsed' }]);
  assert.deepEqual(scanWorkflow('x.yml', 'on: push\njobs:\n    run:\n      runs-on: ubuntu-24.04\n'), [{ file: 'x.yml', job: '*', rule: 'unparsed' }]);
  const early = ['on: push', 'jobs:', '    env:', '      K: ${{ secrets.EXPO_TOKEN }}', '  run:', '    runs-on: ubuntu-24.04', ''].join('\n');
  assert.deepEqual(scanWorkflow('x.yml', early), [{ file: 'x.yml', job: '*', rule: 'unparsed' }]);
  assert.match(explain({ file: 'x.yml', job: '*', rule: 'unparsed' }), /treat as a failure/);
});

Deno.test('[FR-BKO-21] names match without regard to case, the bracket form counts, and secret-key and PROD_ names have production power', () => {
  for (const [line, secret] of [
    ['X: ${{ secrets.supabase_service_role_key }}', 'SUPABASE_SERVICE_ROLE_KEY'],
    ["X: ${{ secrets['EL_SIGNING_KEY'] }}", 'EL_SIGNING_KEY'],
    ['X: ${{ SECRETS.Token_Kek }}', 'TOKEN_KEK'],
  ]) {
    assert.deepEqual(scanWorkflow('agents.yml', plant(AGENTS, 'run', line)), [{ file: 'agents.yml', job: 'run', rule: 'agent-allowlist', secret }], line);
  }
  const wf = (name: string) => ['on: workflow_dispatch', 'jobs:', '  push:', '    runs-on: ubuntu-24.04', '    steps:', '      - run: echo', '        env:', `          K: \${{ secrets.${name} }}`, ''].join('\n');
  for (const name of ['SUPABASE_SECRET_KEYS', 'PROD_DB_URL', 'supabase_db_url_prod', 'STRIPE_SECRET']) {
    assert.equal(scanWorkflow('deploy.yml', wf(name)).length, 1, name);
  }
  assert.deepEqual(scanWorkflow('deploy.yml', wf('EXPO_PUBLIC_URL')), []);
});

Deno.test('[FR-BKO-21] secrets: inherit fails in any workflow, and running the Claude CLI makes a job an agent job', () => {
  const inherit = ['on: push', 'jobs:', '  call:', '    uses: ./.github/workflows/deploy-db.yml', '    secrets: inherit', ''].join('\n');
  assert.deepEqual(scanWorkflow('x.yml', inherit), [{ file: 'x.yml', job: '*', rule: 'all-secrets' }]);
  const cli = ['on: push', 'jobs:', '  helper:', '    runs-on: ubuntu-24.04', '    steps:', '      - run: npx -y @anthropic-ai/claude-code -p hi', '        env:', '          K: ${{ secrets.EXPO_TOKEN }}', ''].join('\n');
  assert.deepEqual(scanWorkflow('x.yml', cli), [{ file: 'x.yml', job: 'helper', rule: 'agent-allowlist', secret: 'EXPO_TOKEN' }]);
});
