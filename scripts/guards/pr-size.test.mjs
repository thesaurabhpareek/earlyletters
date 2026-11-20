// Tests for pr-size.mjs (CODE-R02, gate G8). Red on develop before this file: the script does not exist.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  measure, evaluate, isExcluded, newPath, acceptedBy, hasReasonLine,
  EXCLUDED_FILES, EXCLUDED_DIR_NAMES, EXCLUDED_DIRS, EXCLUDED_SUFFIXES, DOC_IMAGE_EXTS,
} from './pr-size.mjs';

const OWNER = 'asha-owner';
const row = (add, del, p) => `${add}\t${del}\t${p}`;
const run = (rows, extra = {}) => evaluate({ measured: measure(rows.join('\n')), body: '', events: [], owner: OWNER, ...extra });
const ev = (event, login) => ({ event, actor: { login }, label: { name: 'size:accepted' } });
const REASON = 'Size exception: one migration and its test belong together';

test('[CODE-R02] 400 lines pass, 401 changed lines fail', () => {
  assert.equal(run([row(300, 100, 'a.ts')]).pass, true);
  assert.equal(run([row(300, 101, 'a.ts')]).pass, false);
});

test('[CODE-R02] 20 files pass, 21 files fail', () => {
  const rows = (n) => Array.from({ length: n }, (_, i) => row(1, 0, `f${i}.ts`));
  assert.equal(run(rows(20)).pass, true);
  assert.equal(run(rows(21)).pass, false);
});

test('[CODE-R02] a lockfile-only change of 3,000 lines passes', () => {
  const m = measure(row(2000, 1000, 'package-lock.json'));
  assert.deepEqual([m.lines, m.files], [0, 0]);
  assert.equal(run([row(2000, 1000, 'package-lock.json')]).pass, true);
  assert.equal(run([row(2000, 1000, 'package-lock.json'), row(401, 0, 'a.ts')]).pass, false);
});

test('[CODE-R02] generated files and doc images do not count, whatever their size', () => {
  assert.equal(run([row(5000, 0, 'packages/emails/generated/resend.ts'), row(5000, 0, 'apps/web/src/lib/qr/qr.generated.ts')]).pass, true);
});

test('[CODE-R02] fixture and golden lines above 2,000 fail even when every path is excluded', () => {
  assert.equal(run([row(2000, 0, 'apps/mobile/test/__golden__/export-asha/a.json')]).pass, true);
  assert.equal(run([row(2001, 0, 'apps/mobile/test/__golden__/export-asha/a.json')]).pass, false);
  assert.equal(run([row(2001, 0, 'x/__fixtures__/a.json')]).pass, false);
});

test('[CODE-R02] binary files count 0 lines and renames count the new path', () => {
  assert.equal(measure(row('-', '-', 'a.png')).lines, 0);
  assert.equal(newPath('src/{old => new}/a.ts'), 'src/new/a.ts');
  assert.equal(newPath('old.ts => new.ts'), 'new.ts');
  assert.equal(newPath('{ => lib}/a.ts'), 'lib/a.ts');
  assert.equal(measure(row(3, 4, '{a.ts => package-lock.json}')).lines, 0);
});

test('[CODE-R02] an exception line without the founder proof still fails', () => {
  const r = run([row(500, 0, 'a.ts')], { body: `${REASON}\n` });
  assert.equal(r.pass, false);
  assert.match(r.reasons.join('|'), /no size:accepted label/);
});

test('[CODE-R02] the label alone, without the reason line, fails', () => {
  const r = run([row(500, 0, 'a.ts')], { events: [ev('labeled', OWNER)], body: 'Size exception: <reason>' });
  assert.equal(r.pass, false);
});

test('[CODE-R02] the label by the owner plus the reason line passes', () => {
  const r = run([row(500, 0, 'a.ts')], { events: [ev('labeled', OWNER)], body: REASON });
  assert.equal(r.pass, true);
});

test('[CODE-R02] a size label applied by anyone but the owner does not pass', () => {
  const r = run([row(500, 0, 'a.ts')], { events: [ev('labeled', 'some-agent')], body: REASON });
  assert.equal(r.pass, false);
  assert.match(r.reasons.join('|'), /not the owner/);
});

test('[CODE-R02] only the newest label event counts', () => {
  assert.equal(acceptedBy([ev('labeled', OWNER), ev('unlabeled', OWNER)], OWNER).ok, false);
  assert.equal(acceptedBy([ev('labeled', OWNER), ev('unlabeled', OWNER), ev('labeled', 'bot')], OWNER).ok, false);
  assert.equal(acceptedBy([ev('labeled', 'bot'), ev('unlabeled', 'bot'), ev('labeled', OWNER)], OWNER).ok, true);
});

test('[CODE-R02] the reason line needs a real reason', () => {
  assert.equal(hasReasonLine('Size exception:'), false);
  assert.equal(hasReasonLine('Size exception: <reason>'), false);
  assert.equal(hasReasonLine('intro\nSize exception: migration and test together\n'), true);
});

test('[CODE-R02] 3,000 lines under a fixtures-named folder that is not on the list count', () => {
  assert.equal(isExcluded('apps/mobile/test/fixtures/big.json'), false);
  assert.equal(isExcluded('src/my-fixtures/big.json'), false);
  assert.equal(run([row(3000, 0, 'apps/mobile/test/fixtures/big.json')]).pass, false);
});

test('[CODE-R02] docs text counts, only docs images are excluded', () => {
  assert.equal(isExcluded('docs/plan.md'), false);
  assert.equal(run([row(401, 0, 'docs/plan.md')]).pass, false);
  assert.equal(isExcluded('apps/mobile/assets/icon.png'), false);
});

// One test per exclusion entry.
for (const f of EXCLUDED_FILES) test(`[CODE-R02] excluded file ${f}`, () => assert.equal(isExcluded(f), true));
for (const d of EXCLUDED_DIR_NAMES) test(`[CODE-R02] excluded folder name ${d}`, () => {
  assert.equal(isExcluded(`pkg/${d}/x.ts`), true);
  assert.equal(isExcluded(`pkg/${d}x/x.ts`), false);
});
for (const d of EXCLUDED_DIRS) test(`[CODE-R02] excluded folder ${d}`, () => {
  assert.equal(isExcluded(`${d}/a/b.json`), true);
  assert.equal(isExcluded(`${d}-other/b.json`), false);
});
for (const s of EXCLUDED_SUFFIXES) test(`[CODE-R02] excluded suffix ${s}`, () => assert.equal(isExcluded(`apps/web/src/qr${s}`), true));
for (const e of DOC_IMAGE_EXTS) test(`[CODE-R02] docs image ${e} excluded`, () => assert.equal(isExcluded(`docs/img/a${e.toUpperCase()}`), true));
