// BL-1330 (FR-BKO-21): agents hold no production power; the rule is written once in docs/ops/ACCESS.md.
// Run: npm run test:functions
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { AGENT_SECRET_ALLOWLIST, explain, expressionsIn, jobsOf, scanWorkflow } from '../lib/agent-env.ts';

const DIR = new URL('../../../.github/workflows/', import.meta.url);
const WORKFLOWS = readdirSync(DIR).filter((f) => /\.ya?ml$/i.test(f)).sort();
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
    [[...deploy, '    env: &k', `      K: \${{ secrets.${SR} }}`, '    steps: [{run: echo}]', '  leak:', '    runs-on: ubuntu-24.04', '    env: {K2: *k}', '    steps: [{uses: anthropics/claude-code-action@v1}]'].join('\n'), 'leak', 'agent-allowlist'],
    [[...deploy, '    steps: [{run: echo}]', "  'leak':", '    runs-on: ubuntu-24.04', `    steps: [{run: "echo \${{ secrets.${SR} }}"}]`].join('\n'), 'leak', 'production-environment'],
    [[...deploy, '    steps: [{run: echo}]', `  leak: { runs-on: u, steps: [ { run: "echo \${{ secrets.${SR} }}" } ] }`].join('\n'), 'leak', 'production-environment'],
  ];
  for (const [wf, job, rule] of cases) assert.deepEqual(scanWorkflow('x.yml', wf + '\n'), [{ file: 'x.yml', job, rule, secret: SR }], wf);
});

Deno.test('[FR-BKO-21] a multi-line quoted scalar stays one value: no fake job, no fake environment', () => {
  const fakeEnv = one(['    runs-on: "ubuntu-24.04', '      environment: db-production"'], stepReading('      - run: echo', SR)).replace('    runs-on: ubuntu-24.04\n', '');
  assert.deepEqual(scanWorkflow('x.yml', fakeEnv), [{ file: 'x.yml', job: 'push', rule: 'production-environment', secret: SR }]);
  const fakeJob = one([], ['      - uses: anthropics/claude-code-action@v1', '        with:', '          prompt: "hello', '            fake:', '              environment: db-production', '            x: 1"', ...reads(SR)].join('\n'));
  assert.equal(jobsOf(fakeJob).length, 1, 'the quoted text parses and is not a job');
  assert.deepEqual(scanWorkflow('x.yml', fakeJob), [{ file: 'x.yml', job: 'push', rule: 'agent-allowlist', secret: SR }]);
  assert.deepEqual(scanWorkflow('x.yml', fakeJob.replace('db-production', `\${{ secrets.${SR} }}`)).length, 1, 'a read inside the quoted text counts');
});

Deno.test('[FR-BKO-21] what does not parse, or has no jobs, is reported as unparsed, not passed', () => {
  const reindented = AGENTS.split('\n').map((l) => (/^ /.test(l) ? `  ${l}` : l)).join('\n');
  assert.deepEqual(scanWorkflow('agents.yml', reindented), [], 'a deeper but valid indent still parses to the same jobs');
  for (const wf of [
    'on: push\n',
    'on: push\njobs: []\n',
    'on: push\njobs: {}\n',
    'on: push\njobs:\n  run: echo\n',
    ['on: workflow_dispatch', 'jobs:', '  deploy:', '    environment: db-production', ' leak:', '    runs-on: u', ''].join('\n'),
    ['on: push', 'jobs:', '  a:', '    runs-on: u', '  a:', '    runs-on: v', ''].join('\n'),
    one([], ['      - run: "echo', 'x"'].join('\n')),
    one(['    env: !!set', `      ? \${{ secrets.${SR} }}`]),
    one(['    env: !!omap', `      - K: \${{ secrets.${SR} }}`]),
    one([], `      - run: !!omap\n        - a: \${{ secrets.${SR} }}`),
    one(['    timeout-minutes: !foo 5']),
    '%YAML 1.1\n---\n' + one(['    when: 2026-11-27']),
    '%YAML 1.1\n---\njobs: { deploy: &d {runs-on: u, environment: db-production, steps: [run: echo]}, leak: {<<: *d, steps: [run: "echo ${{ secrets.' + SR + ' }}"]} }\n',
    '%YAML 1.2\n---\n' + one([]),
    'on: push\njobs:\n  a: &a\n    runs-on: u\n    x: [*a]\n',
    one(['    env: &k', '      A: b', '    defaults:', '      <<: *k']),
    'on: push\njobs:\n  a:\n    runs-on: u\n---\nb: 1\n',
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
    'run: timeout 30m claude -p hi',
    'run: CI=1 claude -p hi',
    'run: sudo claude',
    'run: if true; then claude -p hi; fi',
    'run: echo `claude -p hi`',
    `run: '"claude" -p hi'`,
    'run: ~/.local/bin/claude -p hi',
    'run: ./node_modules/.bin/claude -p hi',
    'run: npm exec claude',
    'run: "{ claude -p hi; }"',
    'run: claude>out.txt',
    'run: claude</dev/null',
    'run: claude.exe -p hi',
    'run: "[claude,-p,hi]"',
    'uses: anthropics/claude-code@v1',
  ]) {
    assert.deepEqual(scanWorkflow('x.yml', one([], stepReading(`      - ${step}`, 'EXPO_TOKEN'), 'helper')), [
      { file: 'x.yml', job: 'helper', rule: 'agent-allowlist', secret: 'EXPO_TOKEN' },
    ], step);
  }
  assert.deepEqual(scanWorkflow('x.yml', one([], stepReading('      - run: echo claudette', 'EXPO_TOKEN'), 'helper')), [], 'a longer word is not the command');
});

Deno.test('[FR-BKO-21] an agent job that names an environment fails, even reading only allowlisted keys', () => {
  const wf = one(['    environment: db-production'], stepReading('      - uses: anthropics/claude-code-action@v1', 'ANTHROPIC_API_KEY'), 'run');
  assert.deepEqual(scanWorkflow('x.yml', wf), [{ file: 'x.yml', job: 'run', rule: 'agent-environment' }]);
});

Deno.test('[FR-BKO-21] a job that calls an agent workflow is an agent job', () => {
  const call = ['on: push', 'jobs:', '  call:', '    uses: ./.github/workflows/agents.yml', '    secrets:', '      ANTHROPIC_API_KEY: ${{ secrets.EXPO_TOKEN }}', ''].join('\n');
  assert.deepEqual(scanWorkflow('x.yml', call), [{ file: 'x.yml', job: 'call', rule: 'agent-allowlist', secret: 'EXPO_TOKEN' }]);
  assert.deepEqual(scanWorkflow('x.yml', call.replace('agents.yml', 'deploy-db.yml')), [], 'a call to another workflow passing a harmless name is clean');
  assert.deepEqual(scanWorkflow('x.yml', call.replace('agents.yml', 'agentsXyml')), [], 'the dot in the file name is literal');
});

Deno.test('[FR-BKO-21] an agent named outside any job, in workflow-level shell defaults, makes every job an agent job', () => {
  for (const shell of ['npx -y @anthropic-ai/claude-code -p {0}', 'opencode run {0}']) {
    const wf = [
      'on: push',
      'defaults:',
      '  run:',
      `    shell: "${shell}"`,
      'jobs:',
      '  deploy:',
      '    runs-on: u',
      '    environment: db-production',
      '    steps:',
      '      - run: echo hi',
      '        env:',
      `          K: \${{ secrets.${SR} }}`,
      '',
    ].join('\n');
    assert.deepEqual(scanWorkflow('deploy.yml', wf), [
      { file: 'deploy.yml', job: 'deploy', rule: 'agent-environment' },
      { file: 'deploy.yml', job: 'deploy', rule: 'agent-allowlist', secret: SR },
    ], shell);
    assert.deepEqual(scanWorkflow('deploy.yml', wf.replace(shell, 'bash -e {0}')), [], 'a plain shell default changes nothing');
  }
});

Deno.test('[FR-BKO-21] an agent named outside the jobs counts for every job, but an on: filter or activity type does not', () => {
  const deploy = (on: string[], top: string[] = []) => [
    'on:',
    ...on,
    ...top,
    'jobs:',
    '  deploy:',
    '    runs-on: u',
    '    environment: db-production',
    '    steps:',
    '      - run: echo hi',
    '        env:',
    `          K: \${{ secrets.${SR} }}`,
    '',
  ].join('\n');
  for (const filter of ['paths', 'paths-ignore', 'branches', 'branches-ignore', 'tags', 'tags-ignore', 'types']) {
    const on = ['  push:', `    ${filter}: ['claude', 'CLAUDE.md']`, '  schedule:', "    - cron: '0 3 * * *'"];
    assert.deepEqual(scanWorkflow('deploy.yml', deploy(on, ['name: Deploy'])), [], `${filter} is never run`);
  }
  const agent = ['agent-environment', 'agent-allowlist'];
  const cases: [string, string[], string[]][] = [
    ['workflow env', ['  push:'], ['env:', '  CMD: npx -y @anthropic-ai/claude-code']],
    ['workflow name, read through github.workflow', ['  push:'], ['name: claude -p go']],
    ['dispatch input default', ['  workflow_dispatch:', '    inputs:', '      cmd:', '        default: npx -y @anthropic-ai/claude-code -p go'], []],
    ['call input default', ['  workflow_call:', '    inputs:', '      cmd:', '        type: string', "        default: 'claude -p go'"], []],
    ['choice option', ['  workflow_dispatch:', '    inputs:', '      cmd:', '        type: choice', "        options: ['claude -p go', 'echo hi']"], []],
  ];
  for (const [label, on, top] of cases) {
    assert.deepEqual(scanWorkflow('deploy.yml', deploy(on, top)).map((f) => f.rule), agent, label);
  }
});

Deno.test('[FR-BKO-21] a backslash before claude, or a line continuation right after it, still names the agent', () => {
  for (const line of ['      - run: \\claude -p x', '      - run: |\n          claude\\\n            -p x']) {
    const wf = one([], [line, '        env:', `          K: \${{ secrets.${SR} }}`].join('\n'), 'run');
    assert.deepEqual(scanWorkflow('x.yml', wf), [{ file: 'x.yml', job: 'run', rule: 'agent-allowlist', secret: SR }], line);
  }
});

Deno.test('[FR-BKO-21] an agent job with any environment key fails, a workflow-level whole read fails, and GitHub token reads are not stored secrets', () => {
  for (const env of ['~', "''", 'db-production']) {
    const wf = one([`    environment: ${env}`], '      - uses: anthropics/claude-code-action@v1', 'run');
    assert.deepEqual(scanWorkflow('x.yml', wf), [{ file: 'x.yml', job: 'run', rule: 'agent-environment' }], env);
  }
  assert.deepEqual(scanWorkflow('x.yml', one([]).replace('jobs:', 'env:\n  A: ${{ toJSON(secrets) }}\njobs:')), [{ file: 'x.yml', job: '*', rule: 'all-secrets' }]);
  assert.deepEqual(scanWorkflow('agents.yml', plant(AGENTS, 'run', 'T: ${{ secrets.github_token }}')), []);
});

Deno.test('[FR-BKO-21] a read in a mapping key counts', () => {
  assert.deepEqual(scanWorkflow('agents.yml', plant(AGENTS, 'run', `\${{ secrets.${SR} }}: x`)), [{ file: 'agents.yml', job: 'run', rule: 'agent-allowlist', secret: SR }]);
});

Deno.test('[FR-BKO-21] the findings name the secret but never a value', () => {
  const line = explain({ file: 'agents.yml', job: 'run', rule: 'agent-allowlist', secret: 'EL_SIGNING_KEY' });
  assert.equal(line, 'agents.yml run: agent job reads EL_SIGNING_KEY, which is not on the agent allowlist');
  const all = scanWorkflow('agents.yml', plant(AGENTS, 'run', `X: \${{ secrets.${SR} }}`)).map(explain);
  for (const f of all) assert.doesNotMatch(f, /\$\{\{/);
  assert.match(explain({ file: 'x.yml', job: '*', rule: 'all-secrets' }), /secrets\.\*/);
});
