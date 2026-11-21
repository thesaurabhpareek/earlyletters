// node --test scripts/lint/lint.test.mjs (wired into the root `npm test` list). Fixtures are inline text.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RULES, compare, lintText, main, scan } from './lint.mjs';

const APP = 'apps/mobile/src/lib/x.ts';
test('[CI-LINT] each rule fires on its own pattern', () => {
  assert.deepEqual(lintText('a.ts', 'debugger;'), { 'no-debugger': 1 });
  assert.deepEqual(lintText('a.test.ts', 'it.only("x", () => {})'), { 'no-focused-test': 1 });
  assert.deepEqual(lintText('a.ts', '// @ts-ignore\nconst x = 1; // @ts-nocheck'), { 'no-ts-suppress': 1 });
  assert.deepEqual(lintText(APP, 'eval("1")'), { 'no-eval': 1 });
  assert.deepEqual(lintText(APP, 'new Function("a", "return a")'), { 'no-eval': 1 });
  assert.deepEqual(lintText(APP, 'console.log(x); console.warn(y)'), { 'no-console-in-app': 1 });
});
test('[CI-LINT] app-only rules skip tests, scripts and other folders', () => {
  assert.deepEqual(lintText('apps/mobile/test/a.test.ts', 'new Function("a")'), {});
  assert.deepEqual(lintText('apps/mobile/src/a.test.ts', 'console.log(1)'), {});
  assert.deepEqual(lintText('scripts/x.mjs', 'console.log(1)'), {});
  assert.deepEqual(lintText('packages/core/src/a.ts', 'console.error(1)'), { 'no-console-in-app': 1 });
});
test('[CI-LINT] comment-only lines are skipped', () => {
  assert.deepEqual(lintText(APP, '// console.log(1)\n * eval(2)\n/* debugger */'), {});
});
test('[CI-LINT] there is one id per rule', () => assert.equal(new Set(RULES.map((r) => r.id)).size, RULES.length));
test('[CI-LINT] compare is shrink-only: more or a new file is over, fewer is under, equal is silent', () => {
  const base = { 'a.ts': { 'no-debugger': 2 }, 'b.ts': { 'no-debugger': 1 } };
  const cur = { 'a.ts': { 'no-debugger': 3 }, 'b.ts': {}, 'c.ts': { 'no-eval': 1 } };
  const { over, under } = compare(cur, base);
  assert.deepEqual(over.map((r) => r.path), ['a.ts', 'c.ts']);
  assert.deepEqual(under.map((r) => r.path), ['b.ts']);
  assert.deepEqual(compare(base, base), { over: [], under: [] });
});
test('[CI-LINT] scan skips non-code, the lint folder and fixtures', () => {
  const read = () => 'debugger;';
  const cur = scan(['a.md', 'scripts/lint/x.mjs', 'p/__fixtures__/a.ts', 'ok.ts'], read);
  assert.deepEqual(Object.keys(cur), ['ok.ts']);
});
function run(args, text, baseline) {
  const out = [];
  const code = main(args, { log: (l) => out.push(l), files: () => ['a.ts'], read: () => text, readBaseline: () => { if (baseline === undefined) throw new Error('none'); return baseline; } });
  return { code, out };
}
test('[CI-LINT] report-only exits 0 even over the baseline; --enforce exits 1', () => {
  assert.equal(run([], 'debugger;', '{}').code, 0);
  const r = run(['--enforce'], 'debugger;', '{}');
  assert.equal(r.code, 1);
  assert.match(r.out[0], /^FAIL no-debugger a\.ts 1 > baseline 0$/);
});
test('[CI-LINT] at the baseline passes under --enforce; a missing baseline counts everything as new', () => {
  assert.equal(run(['--enforce'], 'debugger;', '{"a.ts":{"no-debugger":1}}').code, 0);
  assert.equal(run(['--enforce'], 'debugger;').code, 1);
});
test('[CI-LINT] output never contains the matching line', () => {
  const r = run(['--enforce'], 'console.log("SECRET-WORDS")', '{}');
  assert.ok(!r.out.join('\n').includes('SECRET'));
});
