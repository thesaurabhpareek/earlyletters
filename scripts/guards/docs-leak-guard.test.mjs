// Tests for docs-leak-guard.mjs: a clean output passes, and a planted planning sentence, a planted .md file, or a
// planning-doc source path each fail. Runs the guard as a child process against a throwaway repo and export.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const guard = path.join(path.dirname(fileURLToPath(import.meta.url)), 'docs-leak-guard.mjs');
const SENTENCE = 'The planning note says this exact sentence must never appear inside a shipped application bundle at all.';

function fixture({ bundle, extraFiles = {}, sources = ['/apps/mobile/src/app/index.tsx'] }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dlg-'));
  fs.mkdirSync(path.join(root, 'docs/prd'), { recursive: true });
  fs.mkdirSync(path.join(root, 'packages/brand'), { recursive: true });
  fs.writeFileSync(path.join(root, 'packages/brand/index.ts'), "export const brand = { name: 'Early Letters' };\n");
  fs.writeFileSync(path.join(root, 'docs/prd/plan.md'), `# Plan\n\n${SENTENCE}\n`);
  const ios = path.join(root, 'out');
  fs.mkdirSync(ios);
  fs.writeFileSync(path.join(ios, 'main.js'), bundle);
  fs.writeFileSync(path.join(ios, 'main.map'), JSON.stringify({ sources }));
  for (const [name, text] of Object.entries(extraFiles)) fs.writeFileSync(path.join(ios, name), text);
  return { root, ios };
}
const run = ({ root, ios }) =>
  spawnSync(process.execPath, [guard, '--repo', root, '--ios', ios, '--min-sentinels', '1'], { encoding: 'utf8' });

test('a clean export passes', () => {
  const r = run(fixture({ bundle: 'var n="Early Letters";' }));
  assert.equal(r.status, 0, r.stderr + r.stdout);
});
test('a planted planning sentence fails', () => {
  const r = run(fixture({ bundle: `var n="Early Letters"; var s="${SENTENCE}";` }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /docs-leak ios: text from docs\/prd\/plan\.md/);
});
test('a markdown file in the output fails', () => {
  const r = run(fixture({ bundle: 'var n="Early Letters";', extraFiles: { 'notes.md': 'x' } }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /markdown file in output/);
});
test('a docs source path in the source map fails', () => {
  const r = run(fixture({ bundle: 'var n="Early Letters";', sources: ['/docs/prd/plan.md'] }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /source path/);
});
test('the control fails when the search cannot see the product name', () => {
  const r = run(fixture({ bundle: 'var n="other";' }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /control failed/);
});
