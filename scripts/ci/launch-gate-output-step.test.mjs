// BL-1574 review follow-up (#2100, Review B note 2): the proposed launch-gate step in
// docs/ops/proposed/workflows/release-ios-launch-gate-output.patch passes only when the script prints its own open line.
// The step's run block is taken from the patch's added lines and run under bash with a stub `node` on PATH, so the
// test checks the shell that would run in release-ios.yml, not a copy of it. The open line it waits for is checked
// against the message decideLaunchGate really returns.
// Run: node --test scripts/ci/launch-gate-output-step.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { REPO_ROOT, parsePatch } from './proposed-patch-applies.mjs';
import { decideLaunchGate, decideTagCheckedRun } from '../release/launch-gate.mjs';

const PATCH = 'docs/ops/proposed/workflows/release-ios-launch-gate-output.patch';
const MB = 'a'.repeat(40);
const SHA = 'b'.repeat(40);

/** The step's `run: |` block from the patch's added lines, dedented. */
function runBlock() {
  const [file] = parsePatch(fs.readFileSync(path.join(REPO_ROOT, PATCH), 'utf8'));
  assert.equal(file.newPath, '.github/workflows/release-ios.yml');
  const added = file.hunks.flatMap((h) => h.lines.filter((l) => l.op === '+').map((l) => l.text));
  const start = added.findIndex((t) => /^\s+run: \|$/.test(t));
  assert.ok(start >= 0, 'the patch adds a `run: |` block');
  const body = added.slice(start + 1);
  const indent = body[0].match(/^\s*/)[0];
  assert.ok(indent.length > 0);
  return body.filter((t) => t.startsWith(indent)).map((t) => t.slice(indent.length)).join('\n') + '\n';
}

/** Runs the block as the runner would (`bash -e`), with `node` stubbed to print `out` and exit `code`. */
function runStep(out, code) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lg-step-'));
  try {
    const bin = path.join(dir, 'bin');
    fs.mkdirSync(bin);
    fs.writeFileSync(path.join(dir, 'out.txt'), out);
    fs.writeFileSync(path.join(bin, 'node'), `#!/bin/bash\ncat "${dir}/out.txt"\nexit ${code}\n`, { mode: 0o755 });
    fs.writeFileSync(path.join(dir, 'step.sh'), runBlock());
    const r = spawnSync('bash', ['-e', path.join(dir, 'step.sh')], {
      encoding: 'utf8',
      env: { PATH: `${bin}:${process.env.PATH}`, RUNNER_TEMP: dir, REPO: 'o/r', GITHUB_SHA: SHA, GH_TOKEN: 'x' },
    });
    return { status: r.status, stdout: r.stdout };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const open = decideLaunchGate({ runs: [{ id: 4242, head_sha: SHA, status: 'completed', conclusion: 'success', created_at: '2026-11-27T00:00:00Z', event: 'workflow_dispatch', head_branch: 'develop' }], mergeBase: MB, isAncestor: () => true });
const refused = decideLaunchGate({ runs: [], mergeBase: MB, isAncestor: () => true });
const tagOnly = decideTagCheckedRun({ tagSha: SHA, runs: [{ id: 7, head_sha: SHA, status: 'completed', conclusion: 'success', created_at: '2026-11-27T00:00:00Z', event: 'workflow_dispatch', path: '.github/workflows/ios-compile.yml' }] });

test('[BL-1574] the fixtures are what the gate really returns', () => {
  assert.equal(open.ok, true);
  assert.match(open.message, /^launch gate open: /);
  assert.equal(refused.ok, false);
  assert.equal(tagOnly.ok, true);
});

test('[BL-1574] the step passes on the open line with exit 0', () => {
  const r = runStep(`${open.message}\n`, 0);
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /^launch gate open: /m, 'the line is still shown in the log (tee)');
});

const refusals = [
  ['no output and exit 0 (main() never ran)', '', 0],
  ['a blank line and exit 0', '\n', 0],
  ['the refusal and exit 1', `${refused.message}\n::error::${refused.message}\n`, 1],
  ['the usage line and exit 2', 'usage: launch-gate.mjs --repo <owner/name> --sha <40 hex>\n', 2],
  ['the open line but exit 1 (pipefail keeps the exit)', `${open.message}\n`, 1],
  ['the tag-check line, which is not the launch gate', `${tagOnly.message}\n`, 0],
  ['the open line indented', `  ${open.message}\n`, 0],
  ['the open line with text after it', `${open.message} (stale)\n`, 0],
  ['the open line with a short run sha', `${open.message.replace(/ on [0-9a-f]{9} /, ' on bbbb ')}\n`, 0],
  ['the open line saying failure', `${open.message.replace('concluded success', 'concluded failure')}\n`, 0],
];
for (const [name, out, code] of refusals) {
  test(`[BL-1574] the step refuses: ${name}`, () => {
    const r = runStep(out, code);
    assert.notEqual(r.status, 0, `expected the step to fail; stdout:\n${r.stdout}`);
  });
}

test('[BL-1574] a refusal without the open line says why in an ::error:: line', () => {
  const r = runStep('', 0);
  assert.match(r.stdout, /^::error::Release candidate tag refused: the launch gate printed no open line/m);
});
