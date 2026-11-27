// BL-1330 (FR-BKO-21): agents hold no production power; the rule is written once in docs/ops/ACCESS.md.
// Run: npm run test:functions
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { AGENT_SECRET_ALLOWLIST, explain, expressionsIn, jobsOf, scanWorkflow } from '../lib/agent-env.ts';

const DIR = new URL('../../../.github/workflows/', import.meta.url);
const WORKFLOWS = readdirSync(DIR).filter((f) => /\.ya?ml$/.test(f)).sort();
const read = (f: string) => readFileSync(new URL(f, DIR), 'utf8');
const AGENTS = read('agents.yml');
const SR = 'SUPABASE_SERVICE_ROLE_KEY';

/** Adds one env line to a named job of a real workflow, the way someone would plant a key. */
function plant(workflow: string, job: string, line: string): string {
  const lines = workflow.split('\n');
  const head = lines.findIndex((l) => l === `  ${job}:`);
  assert.ok(head >= 0, `job ${job} exists`);
  lines.splice(head + 1, 0, `    env:`, `      ${line}`);
  return lines.join('\n');
}

/** A small workflow: one job with the given extra job lines and one step. */
const one = (jobLines: string[], step = '      - run: echo', job = 'push') =>
  ['on: workflow_dispatch', 'jobs:', `  ${job}:`, '    runs-on: ubuntu-24.04', ...jobLines, '    steps:', step, ''].join('\n');
const reads = (name: string) => [`        env:`, `          K: \${{ secrets.${name} }}`];
const stepReading = (step: string, name: string) => [step, ...reads(name)].join('\n');

Deno.test('[FR-BKO-21] every workflow in the repo parses and passes: no agent job reads a production key, no production key outside an environment', () => {
  assert.ok(WORKFLOWS.length >= 10, `read ${WORKFLOWS.length} workflows`);
  assert.deepEqual(WORKFLOWS.flatMap((f) => scanWorkflow(f, read(f))).map(explain), []);
  for (const f of WORKFLOWS) assert.ok(jobsOf(read(f)).length > 0, `${f} has jobs`);
});

Deno.test('[FR-BKO-21] the reader finds the agent jobs it guards, and the secrets they read are all on the allowlist', () => {
  const run = jobsOf(AGENTS).find((j) => j.name === 'run');
  assert.ok(run, 'agents.yml has its run job');
  assert.equal(run.runsAgent, true);
  assert.ok(run.secrets.length > 0, 'the run job reads its model keys');
  for (const s of run.secrets) assert.ok(AGENT_SECRET_ALLOWLIST.includes(s), s);
  assert.equal(jobsOf(read('claude.yml')).find((j) => j.name === 'claude')?.runsAgent, true);
});

Deno.test('[FR-BKO-21] a planted service role key, signing key or backup key in an agent job fails, and so does any name off the allowlist', () => {
  for (const name of [SR, 'EL_SIGNING_KEY', 'TOKEN_KEK', 'OP_SERVICE_ACCOUNT_TOKEN', 'SUPABASE_DB_URL_PROD', 'EXPO_TOKEN']) {
    const planted = plant(AGENTS, 'run', `X: \${{ secrets.${name} }}`);
    assert.deepEqual(scanWorkflow('agents.yml', planted), [{ file: 'agents.yml', job: 'run', rule: 'agent-allowlist', secret: name }], name);
  }
});

Deno.test('[FR-BKO-21] a read inside a prompt block or on a line that starts with # counts; a YAML comment is not a read', () => {
  const prompt = stepReading('      - uses: anthropics/claude-code-action@6d5ae526d25ce88daa2200be073e1a373167f064', 'EXPO_TOKEN')
    .replace('        env:\n          K: ${{ secrets.EXPO_TOKEN }}', `        with:\n          prompt: |\n            # Key \${{ secrets.${SR} }}`);
  assert.deepEqual(scanWorkflow('x.yml', one([], prompt)), [{ file: 'x.yml', job: 'push', rule: 'agent-allowlist', secret: SR }]);
  assert.deepEqual(scanWorkflow('agents.yml', plant(AGENTS, 'run', `# X: \${{ secrets.${SR} }}`)), [], 'GitHub never evaluates a YAML comment');
});

Deno.test('[FR-BKO-21] a workflow-level env counts for every job, before or after jobs:, and is outside any environment', () => {
  const agents = AGENTS.replace(/^jobs:/m, 'env:\n  K: ${{ secrets.EL_SIGNING_KEY }}\njobs:');
  const found = scanWorkflow('agents.yml', agents);
  assert.ok(found.some((f) => f.job === 'run'));
  assert.ok(found.every((f) => f.rule === 'agent-allowlist' && f.secret === 'EL_SIGNING_KEY'));
  assert.ok(scanWorkflow('agents.yml', AGENTS + '\nenv:\n  K: ${{ secrets.EL_SIGNING_KEY }}\n').some((f) => f.secret === 'EL_SIGNING_KEY'));
  const behind = one(['    environment: db-production']).replace('jobs:', `env:\n  K: \${{ secrets.${SR} }}\njobs:`);
  assert.deepEqual(scanWorkflow('deploy.yml', behind), [{ file: 'deploy.yml', job: 'push', rule: 'production-environment', secret: SR }]);
});

Deno.test('[FR-BKO-21] a production key read by a job with no literal environment fails; with one it passes', () => {
  const wf = (env: string[]) => one(env, stepReading('      - run: echo', SR));
  for (const env of [[], ["    environment: ''"], ['    environment: ~'], ['    environment: null'], ['    environment: {}'], ["    environment: ${{ '' }}"], ['    environment: db-production#${{ inputs.e }}'], ['    environment:', '      name: ""']]) {
    assert.deepEqual(scanWorkflow('deploy.yml', wf(env)), [{ file: 'deploy.yml', job: 'push', rule: 'production-environment', secret: SR }], env.join(' '));
  }
  for (const env of [['    environment: db-production'], ["    environment: 'db-production'"], ['    environment: db-production  # founder reviews'], ['    environment:', '      url: https://example.com', '      name: db-production']]) {
    assert.deepEqual(scanWorkflow('deploy.yml', wf(env)), [], env.join(' '));
  }
});

Deno.test('[FR-BKO-21] removing the environment from the real production deploy job fails', () => {
  const db = read('deploy-db.yml');
  assert.match(db, /^ {4}environment: db-production$/m);
  const found = scanWorkflow('deploy-db.yml', db.replace(/^ {4}environment: db-production\n/m, ''));
  assert.ok(found.some((f) => f.rule === 'production-environment' && f.secret === 'SUPABASE_DB_URL_PROD'));
});

Deno.test('[FR-BKO-21] names match in any case, the bracket and spaced-dot forms count, and production-power names are matched', () => {
  for (const [line, secret] of [
    [`X: \${{ secrets.supabase_service_role_key }}`, SR],
    ["X: ${{ secrets['EL_SIGNING_KEY'] }}", 'EL_SIGNING_KEY'],
    ['X: ${{ SECRETS.Token_Kek }}', 'TOKEN_KEK'],
    ['X: ${{ secrets . EL_SIGNING_KEY }}', 'EL_SIGNING_KEY'],
  ]) {
    assert.deepEqual(scanWorkflow('agents.yml', plant(AGENTS, 'run', line)), [{ file: 'agents.yml', job: 'run', rule: 'agent-allowlist', secret }], line);
  }
  const wf = (name: string) => one([], stepReading('      - run: echo', name));
  for (const name of ['SUPABASE_SECRET_KEYS', 'PROD_DB_URL', 'supabase_db_url_prod', 'EXPO_PROD_TOKEN', 'PROD', 'SUPABASE_ACCESS_TOKEN', 'SUPABASE_DB_URL', 'VERCEL_TOKEN', 'OP_CONNECT_TOKEN', 'LASTPASS_KEY']) {
    assert.equal(scanWorkflow('deploy.yml', wf(name)).length, 1, name);
  }
  for (const name of ['EXPO_TOKEN', 'PRODUCT_NAME_HINT', 'EXPO_PUBLIC_URL']) assert.deepEqual(scanWorkflow('deploy.yml', wf(name)), [], name);
});

Deno.test('[FR-BKO-21] every way of handing out all secrets fails, including a }} inside a string literal', () => {
  for (const line of [
    'ALL: ${{ toJSON(secrets) }}',
    'ALL: ${{ toJSON( secrets ) }}',
    'ALL: ${{ toJSON(secrets.*) }}',
    "ALL: ${{ join(secrets.*, ' ') }}",
    "ONE: ${{ secrets[format('{0}', 'X')] }}",
    "ALL: ${{ format('}}{0}', toJSON(secrets)) }}",
  ]) {
    assert.ok(scanWorkflow('agents.yml', plant(AGENTS, 'run', line)).some((f) => f.rule === 'all-secrets'), line);
  }
  assert.deepEqual(scanWorkflow('agents.yml', plant(AGENTS, 'run', `X: \${{ format('}}{0}', secrets. ${SR}) }}`)), [
    { file: 'agents.yml', job: 'run', rule: 'agent-allowlist', secret: SR },
  ]);
  assert.deepEqual(scanWorkflow('agents.yml', plant(AGENTS, 'run', "X: ${{ format('show secrets {0}', 1) }}")), [], 'the word in a string is not a read');
  for (const value of ['inherit', "'inherit'", '"inherit"', '>-\n      inherit', '|-\n      inherit', '!!str inherit', '\n      inherit']) {
    const wf = ['on: push', 'jobs:', '  call:', '    uses: ./.github/workflows/deploy-db.yml', `    secrets: ${value}`, ''].join('\n');
    assert.deepEqual(scanWorkflow('x.yml', wf), [{ file: 'x.yml', job: 'call', rule: 'all-secrets' }], value);
  }
  const named = ['on: push', 'jobs:', '  call:', '    uses: ./.github/workflows/deploy-db.yml', '    secrets:', '      K: ${{ secrets.EXPO_TOKEN }}', ''].join('\n');
  assert.deepEqual(scanWorkflow('x.yml', named), [], 'a mapping of named secrets hands out only those');
});

Deno.test('[FR-BKO-21] expressions end at }} outside a single-quoted string, and an unclosed one runs to the end', () => {
  assert.deepEqual(expressionsIn("a ${{ x }} b ${{ format('}}', 'it''s') }} c ${{ y"), [' x ', " format('}}', 'it''s') ", ' y']);
});

Deno.test('[FR-BKO-21] anchors, aliases, merge keys, quoted keys and flow-style jobs are read as GitHub reads them', () => {
  const deploy = ['on: workflow_dispatch', 'jobs:', '  deploy:', '    runs-on: ubuntu-24.04', '    environment: db-production'];
  const cases: [string, string, string][] = [
    [[...deploy, '    env: &k', `      K: \${{ secrets.${SR} }}`, '    steps: [{run: echo}]', '  leak:', '    runs-on: ubuntu-24.04', '    env: *k', '    steps: [{run: echo}]'].join('\n'), 'leak', 'production-environment'],
    [[...deploy, '    env: &k', `      K: \${{ secrets.${SR} }}`, '    steps: [{run: echo}]', '  leak:', '    runs-on: ubuntu-24.04', '    env:', '      <<: *k', '    steps: [{uses: anthropics/claude-code-action@v1}]'].join('\n'), 'leak', 'agent-allowlist'],
    [[...deploy, '    steps: [{run: echo}]', "  'leak':", '    runs-on: ubuntu-24.04', `    steps: [{run: "echo \${{ secrets.${SR} }}"}]`].join('\n'), 'leak', 'production-environment'],
    [[...deploy, '    steps: [{run: echo}]', `  leak: { runs-on: u, steps: [ { run: "echo \${{ secrets.${SR} }}" } ] }`].join('\n'), 'leak', 'production-environment'],
  ];
  for (const [wf, job, rule] of cases) assert.deepEqual(scanWorkflow('x.yml', wf + '\n'), [{ file: 'x.yml', job, rule, secret: SR }], wf);
});

Deno.test('[FR-BKO-21] a multi-line quoted scalar stays one value: no fake job, no fake environment', () => {
  const fakeEnv = one(['    runs-on: "ubuntu-24.04', '      environment: db-production"'].slice(0), stepReading('      - run: echo', SR)).replace('    runs-on: ubuntu-24.04\n', '');
  assert.deepEqual(scanWorkflow('x.yml', fakeEnv), [{ file: 'x.yml', job: 'push', rule: 'production-environment', secret: SR }]);
  const fakeJob = one([], ['      - uses: anthropics/claude-code-action@v1', '        with:', '          prompt: "hello', '  fake:', '    environment: db-production', '    x: 1"', ...reads(SR)].join('\n'));
  const found = scanWorkflow('x.yml', fakeJob);
  assert.ok(found.length > 0, 'the read is not credited to a fake job with an environment');
  assert.ok(found.every((f) => f.rule === 'unparsed' || f.job === 'push'));
});

Deno.test('[FR-BKO-21] what does not parse, or has no jobs, is reported as unparsed, not passed', () => {
  const reindented = AGENTS.split('\n').map((l) => (/^ /.test(l) ? `  ${l}` : l)).join('\n');
  assert.deepEqual(scanWorkflow('agents.yml', reindented), [], 'a deeper but valid indent still parses to the same jobs');
  for (const wf of [
    'on: push\n',
    'on: push\njobs: []\n',
    'on: push\njobs:\n  run: echo\n',
    ['on: workflow_dispatch', 'jobs:', '  deploy:', '    environment: db-production', ' leak:', '    runs-on: u', ''].join('\n'),
    ['on: push', 'jobs:', '  a:', '    runs-on: u', '  a:', '    runs-on: v', ''].join('\n'),
    one([], ['      - run: "echo', 'x"'].join('\n')),
  ]) {
    assert.deepEqual(scanWorkflow('x.yml', wf), [{ file: 'x.yml', job: '*', rule: 'unparsed' }], wf);
  }
  assert.match(explain({ file: 'x.yml', job: '*', rule: 'unparsed' }), /treat as a failure/);
});

Deno.test('[FR-BKO-21] the agent engines make a job an agent job, wherever they appear in it', () => {
  for (const step of [
    'uses: anthropics/claude-code-action@6d5ae526d25ce88daa2200be073e1a373167f064',
    'uses: anthropics/claude-code-base-action@6d5ae526d25ce88daa2200be073e1a373167f064',
    'run: claude --model opus -p "fix it"',
    'run: claude -pc "x"',
    'run: npx -y @anthropic-ai/claude-code -p hi',
    'run: npm i @anthropic-ai/claude-agent-sdk && node agent.mjs',
    'run: pip install claude-agent-sdk',
    'run: opencode run "x"',
    'run: |\n          curl -fsSL https://claude.ai/install.sh | bash\n          claude \\\n            --model opus \\\n            -p "fix it"',
    'run: cd app && claude --print hi',
    'run: curl -fsSL https://claude.ai/install.sh | bash',
  ]) {
    assert.deepEqual(scanWorkflow('x.yml', one([], stepReading(`      - ${step}`, 'EXPO_TOKEN'), 'helper')), [
      { file: 'x.yml', job: 'helper', rule: 'agent-allowlist', secret: 'EXPO_TOKEN' },
    ], step);
  }
  assert.deepEqual(scanWorkflow('x.yml', one([], stepReading('      - run: echo "see the claude notes"', 'EXPO_TOKEN'), 'helper')), []);
});

Deno.test('[FR-BKO-21] an agent job that names an environment fails, even reading only allowlisted keys', () => {
  const wf = one(['    environment: db-production'], stepReading('      - uses: anthropics/claude-code-action@v1', 'ANTHROPIC_API_KEY'), 'run');
  assert.deepEqual(scanWorkflow('x.yml', wf), [{ file: 'x.yml', job: 'run', rule: 'agent-environment' }]);
});

Deno.test('[FR-BKO-21] the findings name the secret but never a value', () => {
  const line = explain({ file: 'agents.yml', job: 'run', rule: 'agent-allowlist', secret: 'EL_SIGNING_KEY' });
  assert.equal(line, 'agents.yml run: agent job reads EL_SIGNING_KEY, which is not on the agent allowlist');
  const all = scanWorkflow('agents.yml', plant(AGENTS, 'run', `X: \${{ secrets.${SR} }}`)).map(explain);
  for (const f of all) assert.doesNotMatch(f, /\$\{\{/);
  assert.match(explain({ file: 'x.yml', job: '*', rule: 'all-secrets' }), /secrets\.\*/);
});
