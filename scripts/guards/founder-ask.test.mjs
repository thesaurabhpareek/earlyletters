// node --test scripts/guards/founder-ask.test.mjs (wired into the root `npm test` list). Fixtures are inline text.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addedLines, allowedBecause, asksIn, evaluate, main, PATTERNS } from './founder-ask.mjs';

const diffOf = (path, ...lines) => `diff --git a/${path} b/${path}\n--- a/${path}\n+++ b/${path}\n@@ -1,0 +1,${lines.length} @@\n${lines.join('\n')}\n`;

// Positive: each of these must fail the check.
const ASKS = [
  'founder review needed',
  'Founder approval required before this lands',
  'This needs founder approval.',
  'Waiting for the founder.',
  'Please ask the founder to approve this PR',
  'The founder must merge it',
  'The founder should review the migration',
  'Needs the founder to paste the key',
  'Ready for founder sign-off',
  'please merge, then tell the founder',
  'founder   review\tneeded',
  'a founder-merge is pending',
];
for (const text of ASKS) {
  test(`[BL-1851] positive: "${text}" fails in the body, the title and an added line`, () => {
    assert.equal(evaluate({ body: `Summary\n\n${text}\n` }).ok, false);
    assert.equal(evaluate({ title: `feat(ci): ${text}` }).ok, false);
    assert.equal(evaluate({ diff: diffOf('docs/x.md', `+${text}`) }).ok, false);
  });
}
test('[BL-1851] every pattern fires on its own', () => {
  const seen = new Set(ASKS.flatMap((t) => asksIn(t)));
  for (const [id] of PATTERNS) assert.ok(seen.has(id), `pattern ${id} has no positive case`);
});

// Negative: each of these must pass.
test('[BL-1851] negative: ordinary text passes', () => {
  const ok = evaluate({ title: 'ci(guards): fail a PR that asks a person to sign in (BL-1851)', body: 'Karma merges under CR-70.\nNot verified: nothing ran on a device.' });
  assert.equal(ok.ok, true);
  assert.equal(evaluate({ body: 'The founder approved the colour earlier.' }).ok, true);
});
test('[BL-1851] negative: a removed line with the phrase passes, an added line fails', () => {
  const removed = `diff --git a/a.md b/a.md\n--- a/a.md\n+++ b/a.md\n@@ -1,1 +0,0 @@\n-founder review needed\n`;
  assert.equal(evaluate({ diff: removed }).ok, true);
  assert.deepEqual(addedLines(removed), []);
  assert.equal(evaluate({ diff: diffOf('a.md', '+founder review needed') }).ok, false);
});
test('[BL-1851] allow: quoting the rule (CR-176 or D-168 plus a negation) passes', () => {
  const tpl = 'Karma merges under CR-70 and CR-176, so never write "founder review needed" or ask him to approve, comment, merge or paste';
  assert.equal(evaluate({ body: tpl }).ok, true);
  assert.match(allowedBecause(tpl), /quotes the rule/);
});
test('[BL-1851] the quote allow needs the rule id and a negation: either alone fails', () => {
  assert.equal(evaluate({ body: 'Per CR-176: founder review needed' }).ok, false);
  assert.equal(evaluate({ body: 'Never mind, founder review needed' }).ok, false);
});
test('[BL-1851] allow: a physical act that names the queue file passes', () => {
  assert.equal(evaluate({ body: 'Needs the founder to paste the signing key in the vendor console: row added to docs/release/FOUNDER_QUEUE.md' }).ok, true);
  assert.equal(evaluate({ body: 'Needs the founder to paste the signing key in the vendor console' }).ok, false);
});
test('[BL-1851] allow: added lines in the rule files pass, the same line elsewhere fails', () => {
  for (const p of ['docs/agents/cto/RULINGS.md', 'docs/release/FOUNDER_QUEUE.md', '.github/pull_request_template.md']) {
    assert.equal(evaluate({ diff: diffOf(p, '+The words "founder review needed" are not written.', '+waiting for the founder') }).ok, true, p);
  }
  assert.equal(evaluate({ diff: diffOf('docs/other.md', '+waiting for the founder') }).ok, false);
});
test('[BL-1851] the output names the place and pattern, never the PR text', () => {
  const r = evaluate({ body: 'a\nSECRET-TOKEN-123 founder review needed' });
  assert.equal(r.ok, false);
  assert.doesNotMatch(r.lines.join('\n'), /SECRET-TOKEN-123/);
  assert.match(r.lines[0], /^FOUND body line 2: phrase-review-needed$/);
});
test('[BL-1851] main reads the title and body from the environment and passes no shell string', () => {
  const calls = [];
  const exec = (cmd, args) => { calls.push([cmd, args]); return diffOf('a.md', '+fine'); };
  const write = process.stdout.write; process.stdout.write = () => true;
  let bad, good;
  try {
    bad = main(['--base', 'origin/develop'], { PR_TITLE: '$(touch /tmp/x); founder review needed', PR_BODY: '' }, exec);
    good = main(['--base', 'origin/develop'], { PR_TITLE: 't', PR_BODY: '`id`' }, exec);
  } finally { process.stdout.write = write; }
  assert.equal(bad, 1);
  assert.equal(good, 0);
  assert.ok(calls.every(([c, a]) => c === 'git' && Array.isArray(a) && !a.some((x) => /founder|\$\(/.test(x))));
  assert.equal(main([], {}, () => { throw new Error('no git'); }), 2);
});
