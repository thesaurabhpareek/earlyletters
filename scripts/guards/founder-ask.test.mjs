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
  'please hold for the founder-merge',
  'Held. Needs a founder decision.',
  'Ask him to approve this when the founder is back',
  'Ask Saurabh to take a look',
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

// --- Review B fixes ---
// The real title and body of this PR (public text, copied from the PR page).
const PR_TITLE = 'ci(guards): add the founder-request check required by CR-176 (BL-1851)';
const PR_BODY = `## Summary and why

Adds \`scripts/guards/founder-ask.mjs\` and its test, wired into the root \`npm test\` list. It fails a PR whose title, body or added diff lines carry a request addressed to the founder (to review, approve, merge, comment or paste), which CR-176 and D-168 forbid. The workflow is a proposal under \`docs/ops/proposed/workflows/founder-ask.yml\` (the app cannot write \`.github/workflows/\`), following the \`pr-size\` pattern. Named but not built in #1640.

Satisfies: BL-1851, CR-176, D-168
Data classes touched: none
Agent: ops, Mode: agent

## Not verified

- The workflow has never run on GitHub; applying it is a physical act and needs a row in \`docs/release/FOUNDER_QUEUE.md\` (not added here).
- Full \`npm test\` and typecheck were not run, only the targeted tests; tests were not re-run after merging develop into the branch.
- The two allow rules (quoting CR-176/D-168 with a negation; naming \`FOUNDER_QUEUE\`) are text matches, so an author can word around them. The proposal says so.
- BL-1851's status line in \`docs/BACKLOG.md\` is not edited (shared file).

## Risk and rollback

Medium: a guard that fails PRs can wrongly block legitimate ones if its patterns are too wide, but the workflow is only a proposal until applied. Undo: revert the squash commit.

## Performance

perf: n/a

## Review notes

Security lens required (PR text is untrusted input). Check that title and body are read only from the environment, that git is called with an argument array and no shell, that output never echoes PR text, and that the proposed job runs the script from develop with \`contents: read\`. Karma merges under CR-70, CR-73 and CR-176.

## How it was checked

- [x] \`node --test scripts/guards/founder-ask.test.mjs\`: 21 pass (fails with ERR_MODULE_NOT_FOUND before); all \`scripts/guards/*.test.mjs\`: 41 pass
- [x] 12 asks fail in title, body and added line; clean text, removed lines, quoting the rule, queue rows and rule-file paths pass
- [x] Five mutants each turn the suite red
- [x] pr-size: 261 / 400 lines, 5 / 20 files

## The constitution and our rules

- [x] No machine edit bypasses \`verifyEdits\`; nothing shapes a person's words
- [x] ASCII only; no model names; no dates; no secrets


---
_Generated by [Claude Code](https://claude.ai/code)_`;
test('[BL-1851] this PR\'s own current title and body pass the guard', () => {
  assert.equal(evaluate({ title: PR_TITLE, body: PR_BODY }).ok, true);
  const calls = [];
  const write = process.stdout.write; process.stdout.write = () => true;
  let code;
  try { code = main([], { PR_TITLE, PR_BODY }, (c, a) => { calls.push([c, a]); return ''; }); } finally { process.stdout.write = write; }
  assert.equal(code, 0);
});

// Real added lines from #1630 (RULINGS.md) and #1631 (DESIGN-BACKLOG.md): the rule "ships only after a founder merge (D-125 item 5)".
const RULE_WORDING = [
  '- Founder-only: the amended wording ships only after a founder merge (D-125 item 5). On silence, the status quo text ships. FOUNDER: a pointer that names Plus or links to it. Default: the plain line, after his merge.',
  '- Founder-only: the wording. The amended line ships only after a founder merge (D-125 item 5); on silence, the status quo text ships.',
  '- Founder-only: the wording. The amended text and the BRAND.md fix ship only after a founder merge (D-125 item 5); on silence, the status quo text ships.',
  "| BL-1803 | wait for counsel | Ship the minimal factual line (your words, child profile and due date are kept on our servers); it is a disclosure at the point of collection. Founder merge. | founder; counsel Q43; founder merge (D-125 item 5) |",
  "| BL-1802 | words come with a sign-in | Ship only 'save a copy first'. Hold 'words come with a sign-in' until the restore drill (CCO-8) passes. | founder; counsel Q42 (loose mapping); founder merge (D-125 item 5) |",
  '- Defaults that edit legal-adjacent text need a founder merge (D-125 item 5), among them BL-1806, 1803, 1805, 1802, 1767 and 1837. No amended default in 13.1 executes itself. Silence on 27 Nov means status quo text.',
];
test('[BL-1851] negative: the D-125 rule wording from #1630 and #1631 passes in the diff, title and body', () => {
  for (const line of RULE_WORDING) {
    assert.deepEqual(asksIn(line), [], line.slice(0, 40));
    assert.equal(evaluate({ diff: diffOf('docs/design/review-2026-11-22/DESIGN-BACKLOG.md', `+${line}`) }).ok, true);
    assert.equal(evaluate({ title: line, body: line }).ok, true);
  }
});
test('[BL-1851] the founder-merge label still fails in the ask shape', () => {
  for (const t of ['Please wait for the founder merge', 'Ask for a founder merge', 'Waiting for founder merge', 'founder-merge: please']) {
    // the last one is not an ask; the first three are
    assert.equal(asksIn(t).includes('founder-merge-label'), t !== 'founder-merge: please', t);
  }
});

// False negatives found in review, now caught.
for (const text of ['Ask him to approve this when the founder is back', 'The founder is back: please ask him to approve', 'Needs a founder decision', 'Waiting on Saurabh', 'waiting for Saurabh to reply']) {
  test(`[BL-1851] positive: ${text}`, () => {
    assert.ok(asksIn(text).length > 0);
    assert.equal(evaluate({ body: text }).ok, false);
  });
}
test('[BL-1851] negative: ask him to review is fine when no founder is named', () => {
  assert.equal(evaluate({ body: 'Ask him to review the layout once the stand-in is back' }).ok, true);
});
test('[BL-1851] the quote allow does not cover an unrelated negation in another sentence', () => {
  assert.equal(evaluate({ body: 'CR-176 is never skipped. Founder review needed' }).ok, false);
  assert.equal(evaluate({ body: 'CR-176 says never ask; founder approval required.' }).ok, false);
  assert.equal(evaluate({ body: 'CR-176: do not write "founder review needed" or ask him to approve; the founder merge is Karma\'s' }).ok, true);
});
test('[BL-1851] negative: a real mid-sentence description from #1636 passes, the sentence-start ask fails', () => {
  const real = 'each needs a founder ruling, counsel, a spec, a device run or an exec-review answer first, and the product agent files it here when that lands.';
  assert.equal(evaluate({ diff: diffOf('docs/BACKLOG.md', `+${real}`) }).ok, true);
  assert.equal(evaluate({ body: 'Held. This needs a founder decision.' }).ok, false);
});

// --- BL-1882: zero-width characters, allow-rule evasions, a missed ask, the exact exemption, ReDoS ---
test('[BL-1882] zero-width and other format characters (\\p{Cf}) do not hide an ask', () => {
  for (const t of ['found\u200Ber review needed', 'founder\u200B review needed', 'founder\u200Breview needed', '\uFEFFAsk the founder to approve', 'wait\u2060ing for the founder', 'founder re\u00ADview needed', 'founder\u200D \u200Dapproval required']) {
    assert.ok(asksIn(t).length > 0, JSON.stringify(t));
    assert.equal(evaluate({ body: t }).ok, false, JSON.stringify(t));
    assert.equal(evaluate({ diff: diffOf('docs/x.md', `+${t}`) }).ok, false, JSON.stringify(t));
  }
  assert.deepEqual(asksIn('founder\u200B review done'), []);
});
test('[BL-1882] zero-width characters do not unlock the quote allow or hide a negation break', () => {
  assert.equal(allowedBecause('CR-176: never write "founder review needed"'), allowedBecause('CR\u200B-176: never write "founder review needed"'));
  assert.equal(evaluate({ body: 'CR-176: not ours to decide,\u200B so ask the founder to approve' }).ok, false);
});
test('[BL-1882] allow-rule evasion 1: a colon ends the sentence, so "not ours to decide" does not govern the ask', () => {
  const t = 'CR-176: not ours to decide, so ask the founder to approve';
  assert.ok(asksIn(t).length > 0);
  assert.equal(allowedBecause(t), '');
  assert.equal(evaluate({ body: t }).ok, false);
  assert.equal(evaluate({ body: 'CR-176: not ours to decide so ask the founder to approve' }).ok, false);
  assert.equal(evaluate({ body: 'CR-176 rules this out. Not ours to decide: ask the founder to approve' }).ok, false);
});
test('[BL-1882] allow-rule evasion 2: "Never mind CR-176 -- ask the founder to approve" fails', () => {
  assert.equal(evaluate({ body: 'Never mind CR-176 -- ask the founder to approve' }).ok, false);
  assert.equal(evaluate({ body: 'Never mind CR-176, ask the founder to approve' }).ok, false);
  assert.equal(evaluate({ body: 'CR-176 is not negotiable -- ask the founder to approve' }).ok, false);
  assert.equal(evaluate({ body: 'CR-176: do not hesitate to ask the founder to approve' }).ok, false);
  assert.equal(evaluate({ body: "CR-176: don't forget to ask the founder to approve" }).ok, false);
});
test('[BL-1882] allow-rule evasion 3: "CR-176 (not optional) ask the founder to approve" fails', () => {
  assert.equal(evaluate({ body: 'CR-176 (not optional) ask the founder to approve' }).ok, false);
  assert.equal(evaluate({ body: 'CR-176 [never skipped] ask the founder to approve' }).ok, false);
  assert.equal(evaluate({ body: 'CR-176 is not optional but ask the founder to approve' }).ok, false);
});
test('[BL-1882] the quote allow still passes the real forms (the template line and the same line after a colon)', () => {
  assert.equal(evaluate({ body: 'CR-176: do not write "founder review needed" or ask him to approve; the founder merge is Karma\'s' }).ok, true);
  assert.equal(evaluate({ body: 'Per CR-176 never ask the founder to approve, review or merge' }).ok, true);
  assert.equal(evaluate({ body: "D-168 says we don't ask Saurabh to take a look, and never write \"founder review needed\"" }).ok, true);
});
test('[BL-1882] "ask Saurabh to take a look" and its forms fail; talking about a look does not', () => {
  for (const t of ['ask Saurabh to take a look', 'Please ask the founder to have a look', 'asking the founder to weigh in', 'needs the founder to check this', 'want Saurabh to look over the diff', 'ask Saurabh to greenlight it']) {
    assert.ok(asksIn(t).includes('ask-founder-to-look'), t);
    assert.equal(evaluate({ body: t }).ok, false, t);
  }
  for (const t of ['Saurabh took a look at the layout earlier', 'Ask Saurabh about lunch', 'The founder looks at the weekly report', 'ask Karma to take a look', 'Needs the founder to confirm that reading']) assert.equal(evaluate({ body: t }).ok, true, t);
});
test('[BL-1882] exact exemption: the BL-1851 phrase in backticks on a line that names BL-1851 passes', () => {
  assert.equal(evaluate({ body: 'BL-1851 fails a PR that contains `founder review needed`' }).ok, true);
  assert.match(allowedBecause('BL-1851 fails a PR that contains `Founder  Review needed`'), /BL-1851/);
  assert.equal(evaluate({ diff: diffOf('docs/y.md', '+The BL-1851 check looks for `founder review needed` in a title.') }).ok, true);
});
test('[BL-1882] the exemption does not pass: no BL-1851, no backticks, another ask on the line, extra words in the span', () => {
  assert.equal(evaluate({ body: 'This fails a PR that contains `founder review needed`' }).ok, false);
  assert.equal(evaluate({ body: 'BL-1851 fails a PR that contains "founder review needed"' }).ok, false);
  assert.equal(evaluate({ body: 'BL-1851 `founder review needed` and please ask the founder to approve' }).ok, false);
  assert.equal(evaluate({ body: 'BL-1851 `founder review needed` founder review needed' }).ok, false);
  assert.equal(evaluate({ body: 'BL-1851: `ask the founder to approve`' }).ok, false);
  assert.equal(evaluate({ body: 'BL-1851 `please ask the founder to approve`' }).ok, false);
  assert.equal(evaluate({ body: 'BL-1851 `founder review needed before merge`' }).ok, false);
  assert.equal(evaluate({ body: 'BL-1851 `founder review needed` `waiting for the founder`' }).ok, false);
  assert.equal(evaluate({ body: 'BL-1851 `a` waiting for Saurabh `founder review needed`' }).ok, false);
});
test('[BL-1882] ReDoS: 200k-character adversarial strings finish fast in every path', () => {
  const N = 200_000;
  const rep = (s) => s.repeat(Math.ceil(N / s.length)).slice(0, N);
  const inputs = [
    rep('founder '), rep('ask '), rep('ask him to '), rep('ask the founder to '), rep('please approve '), rep('waiting for '), rep('needs a founder '),
    rep('founder   '), ' '.repeat(N) + 'founder review needed', rep('a'), rep('\u200B'), rep('f\u200Bounder '), rep('`'), rep('`x '), rep('(not '), rep('CR-176 never '),
    `CR-176 never ${rep('ask the founder to approve ')}`, `BL-1851 ${rep('`founder review needed` ')}`, `CR-176 ${rep('not, ')}ask the founder to approve`, rep('founder please '), rep('. founder '), rep('Saurabh '),
  ];
  for (const input of inputs) {
    const t0 = process.hrtime.bigint();
    asksIn(input); allowedBecause(input); evaluate({ title: input, body: input, diff: diffOf('docs/z.md', `+${input}`) });
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    assert.ok(ms < 2000, `${ms.toFixed(0)} ms for ${JSON.stringify(input.slice(0, 20))}`);
  }
});
