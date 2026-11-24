// BL-1992: two branches that each change one string merge by regeneration, with no hand edit of the generated files.
// The generator is replaced by a stub (the map is the sorted list of strings in src.txt), so this proves the helper's
// steps, not the real map; the stale-map test in export-content-map.test.mjs still guards the real one.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveContentMap, MAP_FILES } from './merge-content-map.mjs';

const sh = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8' });
const stub = (root) => {
  const lines = readFileSync(join(root, 'src.txt'), 'utf8').split('\n').filter(Boolean).sort();
  for (const f of MAP_FILES) writeFileSync(join(root, f), lines.join('\n') + '\n');
};
function repo() {
  const d = mkdtempSync(join(tmpdir(), 'bl1992-'));
  sh(d, 'init', '-q', '-b', 'main'); sh(d, 'config', 'user.email', 't@example.com'); sh(d, 'config', 'user.name', 't');
  mkdirSync(join(d, 'docs/content/map'), { recursive: true });
  writeFileSync(join(d, 'src.txt'), 'alpha\n1\n2\n3\n4\nbeta\n'); stub(d);
  sh(d, 'add', '-A'); sh(d, 'commit', '-qm', 'base');
  const branch = (name, from, to) => {
    sh(d, 'checkout', '-q', '-b', name, 'main');
    writeFileSync(join(d, 'src.txt'), readFileSync(join(d, 'src.txt'), 'utf8').replace(from, to)); stub(d);
    sh(d, 'commit', '-qam', name);
  };
  branch('a', 'alpha', 'alpha one'); branch('b', 'beta', 'beta one');
  sh(d, 'checkout', '-q', 'a');
  return d;
}
const quiet = { log: () => {} };

test('[BL-1992] a merge conflict in the map is resolved by regenerating it', () => {
  const d = repo();
  assert.notEqual(sh(d, 'merge', 'b').status, 0, 'the scratch branches must conflict in the map');
  const r = resolveContentMap({ cwd: d, regenerate: stub, ...quiet });
  assert.equal(r.status, 'resolved');
  assert.equal(sh(d, 'diff', '--name-only', '--diff-filter=U').stdout, '');
  assert.equal(sh(d, 'commit', '-qm', 'merge').status, 0);
  assert.equal(readFileSync(join(d, MAP_FILES[0]), 'utf8'), '1\n2\n3\n4\nalpha one\nbeta one\n');
});

test('[BL-1992] it refuses while another file is still conflicted, and touches nothing', () => {
  const d = repo();
  sh(d, 'checkout', '-q', 'main'); writeFileSync(join(d, 'x.txt'), '1\n'); sh(d, 'add', '-A'); sh(d, 'commit', '-qm', 'x');
  for (const n of ['a', 'b']) { sh(d, 'checkout', '-q', n); writeFileSync(join(d, 'x.txt'), n + '\n'); sh(d, 'add', '-A'); sh(d, 'commit', '-qm', 'x' + n); }
  sh(d, 'checkout', '-q', 'a'); sh(d, 'merge', 'b');
  const before = readFileSync(join(d, MAP_FILES[0]), 'utf8');
  const r = resolveContentMap({ cwd: d, regenerate: () => assert.fail('must not regenerate'), ...quiet });
  assert.equal(r.status, 'blocked');
  assert.deepEqual(r.others, ['x.txt']);
  assert.equal(readFileSync(join(d, MAP_FILES[0]), 'utf8'), before);
});

test('[BL-1992] with no conflict it does nothing', () => {
  const d = repo();
  assert.equal(resolveContentMap({ cwd: d, regenerate: () => assert.fail('no'), ...quiet }).status, 'clean');
});
