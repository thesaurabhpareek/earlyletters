// Tests for the `scope` step of the install job in ci.yml (BL-1479). Run: node --test .github/scripts/scope-step.test.mjs
// The step is inline YAML (it runs before checkout, so it cannot be a repo script). This test extracts the `run:`
// block of the step from ci.yml and runs it under `bash -e` (as the runner does: `shell: bash -e {0}`) with a stub `gh` (and, for the error case, a stub `grep`).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CI = join(dirname(fileURLToPath(import.meta.url)), '..', 'workflows', 'ci.yml');
const BASE = 'a'.repeat(40);
const HEAD = 'b'.repeat(40);
const MOVED = 'c'.repeat(40);

export function stepBlock(yaml) {
  const i = yaml.indexOf('      - id: scope');
  assert.ok(i >= 0, 'scope step not found');
  const r = yaml.indexOf('        run: |\n', i);
  const end = yaml.indexOf('\n      - ', r);
  return yaml
    .slice(r + '        run: |\n'.length, end)
    .split('\n')
    .map((l) => l.replace(/^ {10}/, ''))
    .join('\n');
}

// files: array of {filename, previous_filename?}. opts: prHead (what pulls/<n> says), ghFails, grepRc, event, shas.
function run(files, opts = {}, block = stepBlock(readFileSync(CI, 'utf8'))) {
  const dir = mkdtempSync(join(tmpdir(), 'scope-'));
  try {
    const log = join(dir, 'gh.log');
    const payload = JSON.stringify({ files });
    writeFileSync(
      join(dir, 'gh'),
      `#!/usr/bin/env bash
echo "$*" >> "${log}"
${opts.ghFails ? 'exit 1' : ''}
case "$*" in
  *"/compare/"*) cat <<'JSON' | jq -r '.files[] | .filename, (.previous_filename // empty)'
${payload}
JSON
  ;;
  *"/pulls/7/files"*) cat <<'JSON' | jq -r '.[] | .filename, (.previous_filename // empty)'
${JSON.stringify(files)}
JSON
  ;;
  *"/pulls/7"*) echo "${opts.prHead ?? HEAD}" ;;
esac
`,
    );
    chmodSync(join(dir, 'gh'), 0o755);
    if (opts.grepRc !== undefined) {
      writeFileSync(join(dir, 'grep'), `#!/usr/bin/env bash\nexit ${opts.grepRc}\n`);
      chmodSync(join(dir, 'grep'), 0o755);
    }
    const out = join(dir, 'out');
    writeFileSync(out, '');
    const r = spawnSync('bash', ['-e', '-c', block], {
      env: {
        PATH: `${dir}:${process.env.PATH}`,
        GITHUB_OUTPUT: out,
        REPO: 'o/r',
        PR: '7',
        EVENT: opts.event ?? 'pull_request',
        BASE_SHA: opts.base ?? BASE,
        HEAD_SHA: opts.head ?? HEAD,
      },
      encoding: 'utf8',
    });
    const written = readFileSync(out, 'utf8').trim();
    return { heavy: written, stdout: r.stdout, calls: readFileSync(log, { flag: 'a+', encoding: 'utf8' }) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const f = (...names) => names.map((filename) => ({ filename }));
const INERT = f('docs/agents/checkins/S99-asha.md', 'docs/product/instrumentation/events.csv', 'docs/design/DESIGN-X.md');

test('[BL-1479] inert-only list is not heavy', () => {
  assert.equal(run(INERT).heavy, 'heavy=false');
});
test('[BL-1479] one code file makes it heavy', () => {
  assert.equal(run([...INERT, ...f('apps/mobile/src/a.ts')]).heavy, 'heavy=true');
});
test('[BL-1479] an empty list is heavy', () => {
  assert.equal(run([]).heavy, 'heavy=true');
});
test('[BL-1479] grep exit 2 (error) fails safe to heavy', () => {
  assert.equal(run(INERT, { grepRc: 2 }).heavy, 'heavy=true');
});
test('[BL-1479] grep exit 0 stays heavy and exit 1 alone is inert', () => {
  assert.equal(run(INERT, { grepRc: 0 }).heavy, 'heavy=true');
  assert.equal(run(INERT, { grepRc: 1 }).heavy, 'heavy=false');
});
test('[BL-1479] a moved head (pulls/<n> head is not the event head) is heavy', () => {
  assert.equal(run(INERT, { prHead: MOVED }).heavy, 'heavy=true');
});
test('[BL-1479] the list comes from compare of the two event shas, never pulls/<n>/files', () => {
  const { calls } = run(INERT);
  assert.ok(calls.includes(`repos/o/r/compare/${BASE}...${HEAD}`), calls);
  assert.ok(!calls.includes('/files'), calls);
});
test('[BL-1479] a bad or missing sha, a push event or a gh failure is heavy', () => {
  assert.equal(run(INERT, { head: '' }).heavy, 'heavy=true');
  assert.equal(run(INERT, { base: 'main' }).heavy, 'heavy=true');
  assert.equal(run(INERT, { event: 'push' }).heavy, 'heavy=true');
  assert.equal(run(INERT, { ghFails: true }).heavy, 'heavy=true');
});
test('[BL-1479] compare caps at 300 files: 300 inert is heavy (maybe truncated), 299 inert is not', () => {
  const n = (k) => Array.from({ length: k }, (_, i) => ({ filename: `docs/agents/checkins/S1-${i}.md` }));
  assert.equal(run(n(300)).heavy, 'heavy=true');
  assert.equal(run(n(3000)).heavy, 'heavy=true');
  assert.equal(run(n(299)).heavy, 'heavy=false');
});
test('[BL-1479] a rename out of code (previous_filename) is heavy', () => {
  assert.equal(
    run([{ filename: 'docs/design/DESIGN-X.md', previous_filename: 'apps/mobile/src/a.ts' }]).heavy,
    'heavy=true',
  );
});
test('[BL-1479] closed extension list: only .md or .csv under a listed directory is inert', () => {
  for (const dir of [
    'docs/engineering/readiness-20nov',
    'docs/product/instrumentation',
    'docs/content/lifecycle-playbook',
    'docs/qa/test-plan-b13',
  ]) {
    assert.equal(run(f(`${dir}/x/y.md`)).heavy, 'heavy=false', dir);
    assert.equal(run(f(`${dir}/y.csv`)).heavy, 'heavy=false', dir);
    for (const bad of ['y.ts', 'y.json', 'y.mjs', 'y', 'y.md.ts', 'y.MD', 'y.md ', 'x/Makefile']) {
      assert.equal(run(f(`${dir}/${bad}`)).heavy, 'heavy=true', `${dir}/${bad}`);
    }
  }
});
test('[BL-1479] a checkin that is not S<digit>...md is heavy (board-check reads README)', () => {
  assert.equal(run(f('docs/agents/checkins/README.md')).heavy, 'heavy=true');
});

// Mutants: each weakens one behaviour; the suite must catch it.
const base = stepBlock(readFileSync(CI, 'utf8'));
const mutants = {
  'grep rc 2 treated as no-match': ['[ "$rc" -eq 1 ]', '[ "$rc" -ne 0 ]'],
  'head not bound to the pull request': ['= "$HEAD_SHA" ]', '!= "" ]'],
  'live pulls files endpoint': ['compare/${BASE_SHA}...${HEAD_SHA}', 'pulls/${PR}/files'],
  'directory entries match any type': ['readiness-20nov/.*\\.(md|csv)', 'readiness-20nov/.*'],
  'old 3000 limit (compare truncates at 300)': ['-lt 300 ]', '-lt 3000 ]'],
  'instrumentation any type': ['instrumentation/.*\\.(md|csv)', 'instrumentation/.*'],
};
for (const [name, [from, to]] of Object.entries(mutants)) {
  test(`[BL-1479] mutant is killed: ${name}`, () => {
    assert.ok(base.includes(from), `mutation anchor missing: ${from}`);
    const m = base.replace(from, to);
    const cases = [
      () => run(INERT, { grepRc: 2 }, m).heavy === 'heavy=true',
      () => run(INERT, { prHead: MOVED }, m).heavy === 'heavy=true',
      () => run(INERT, {}, m).calls.includes('/compare/'),
      () => run(f('docs/engineering/readiness-20nov/a.ts'), {}, m).heavy === 'heavy=true',
      () => run(f('docs/product/instrumentation/a.json'), {}, m).heavy === 'heavy=true',
      () => run(Array.from({ length: 300 }, (_, i) => ({ filename: `docs/agents/checkins/S1-${i}.md` })), {}, m).heavy === 'heavy=true',
    ];
    assert.ok(cases.some((c) => !c()), 'mutant survived');
  });
}
