// Tests for scripts/release/checklist-check.mjs. Run: node --test scripts/release/checklist-check.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { checkChecklist, checkTemplate, run } from './checklist-check.mjs';

const REAL_CHECKLIST = fileURLToPath(new URL('../../docs/release/BUILD_CHECKLIST.md', import.meta.url));
const REAL_TEMPLATE = fileURLToPath(new URL('../../docs/release/build-log-TEMPLATE.md', import.meta.url));

const step = (n, title, extra = {}) => [
  `## Step ${n}. ${title}`,
  `Command: ${extra.command ?? '`echo hi`'}`,
  `Expect: ${extra.expect ?? 'hi'}`,
  `STOP: ${extra.stop ?? 'anything else'}`,
  '',
].join('\n');

const good = () => [
  'The one retry rule applies.',
  step(1, 'Checkout'),
  step(2, 'Doctor'),
  step(3, 'Preflight'),
  step(4, 'Prereqs'),
  step(5, 'Count the builds used', { stop: 'fewer than 3 remain' }),
  step(6, 'Build', { command: '`npx eas-cli@24.10.0 build --platform ios --profile testflight`' }),
  step(7, 'Submit'),
].join('\n');

test('a well formed checklist passes', () => {
  assert.deepEqual(checkChecklist(good()), []);
});

test('a step without a STOP line fails', () => {
  const bad = good().replace('STOP: anything else\n\n## Step 2.', '\n\n## Step 2.');
  assert.ok(checkChecklist(bad).some((p) => p.includes('step 1') && p.includes('STOP')));
});

test('a step without a command in backticks fails', () => {
  const bad = good().replace('Command: `echo hi`\nExpect: hi\nSTOP: anything else\n\n## Step 2.', 'Command: just do it\nExpect: hi\nSTOP: x\n\n## Step 2.');
  assert.ok(checkChecklist(bad).some((p) => p.includes('step 1') && p.includes('Command')));
});

test('steps out of order fail', () => {
  const bad = good().replace('## Step 3. Preflight', '## Step 4. Preflight');
  assert.ok(checkChecklist(bad).some((p) => p.includes('in order')));
});

test('missing builds-used step, retry rule or pinned build command fail', () => {
  assert.ok(checkChecklist(good().replace('Count the builds used', 'Count')).some((p) => p.includes('builds-used step')));
  assert.ok(checkChecklist(good().replace('The one retry rule applies.', '')).some((p) => p.includes('retry')));
  assert.ok(checkChecklist(good().replace('eas-cli@24.10.0', 'eas-cli')).some((p) => p.includes('pinned')));
});

test('the builds-used step must name the under-3 STOP', () => {
  assert.ok(checkChecklist(good().replace('fewer than 3 remain', 'none')).some((p) => p.includes('fewer than 3')));
});

test('template: builds-used line must precede the build step', () => {
  const ok = ['- Builds used this month: ', '## Step 6. Build'].join('\n');
  const late = ['## Step 6. Build', '- Builds used this month: '].join('\n');
  assert.ok(!checkTemplate(ok).some((p) => p.includes('before the build')));
  assert.ok(checkTemplate(late).some((p) => p.includes('before the build')));
  assert.ok(checkTemplate('nothing').some((p) => p.includes('no "- Builds used')));
});

test('the real checklist and template in the repo pass', () => {
  assert.deepEqual(run(REAL_CHECKLIST, REAL_TEMPLATE), []);
});

test('the real files have no dash, curly quote, ellipsis or emoji characters', () => {
  const banned = /[–—‘’“”…]|\p{Extended_Pictographic}/u;
  for (const p of [REAL_CHECKLIST, REAL_TEMPLATE]) assert.ok(!banned.test(readFileSync(p, 'utf8')), p);
});
