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
  'Please have the founder approve this',
  '@thesaurabhpareek please review',
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

// BL-1882 follow-up: the diff parser reads "+++ " only in a file header, never in a hunk.
const SPOOF = '+++ b/docs/release/FOUNDER_QUEUE.md';
const ASK = '+ask the founder to approve';
test('[BL-1882] spoof: an added line "++ b/docs/release/FOUNDER_QUEUE.md" does not switch the path, the later ask fails', () => {
  const d = diffOf('docs/x.md', SPOOF, ASK);
  assert.equal(evaluate({ diff: d }).ok, false);
  assert.deepEqual(addedLines(d).map((l) => l.path), ['docs/x.md', 'docs/x.md']);
  assert.equal(addedLines(d)[0].text, '++ b/docs/release/FOUNDER_QUEUE.md');
});
test('[BL-1882] spoof in the hunk of a second file does not unlock that file, and the first file is untouched', () => {
  const d = diffOf('docs/release/FOUNDER_QUEUE.md', '+waiting for the founder') + diffOf('docs/y.md', SPOOF, ASK);
  const r = evaluate({ diff: d });
  assert.equal(r.ok, false);
  assert.match(r.lines[0], /^FOUND added line in docs\/y\.md: /);
  assert.equal(r.lines.filter((l) => l.startsWith('FOUND')).length, 1);
});
test('[BL-1882] a legitimate added line that starts with ++ or +++ is an added line and is checked', () => {
  for (const t of ['+++ ask the founder to approve', '++ ask the founder to approve', '+++', '++ b/x']) {
    const d = diffOf('docs/x.md', `+${t}`);
    assert.equal(addedLines(d).length, 1, t);
    assert.equal(addedLines(d)[0].text, t);
    assert.equal(addedLines(d)[0].path, 'docs/x.md');
  }
  assert.equal(evaluate({ diff: diffOf('docs/x.md', '+++ ask the founder to approve') }).ok, false);
});
test('[BL-1882] a rename with edits takes the new path; the allowed path still unlocks only its own hunk', () => {
  const rename = 'diff --git a/docs/old.md b/docs/release/FOUNDER_QUEUE.md\nsimilarity index 80%\nrename from docs/old.md\nrename to docs/release/FOUNDER_QUEUE.md\n--- a/docs/old.md\n+++ b/docs/release/FOUNDER_QUEUE.md\n@@ -1,0 +1,1 @@\n+waiting for the founder\n';
  assert.deepEqual(addedLines(rename), [{ path: 'docs/release/FOUNDER_QUEUE.md', text: 'waiting for the founder' }]);
  assert.equal(evaluate({ diff: rename }).ok, true);
  const toOther = rename.replaceAll('docs/release/FOUNDER_QUEUE.md', 'docs/new.md');
  assert.equal(evaluate({ diff: toOther }).ok, false);
  const pure = 'diff --git a/a.md b/b.md\nsimilarity index 100%\nrename from a.md\nrename to b.md\n';
  assert.deepEqual(addedLines(pure), []);
});
test('[BL-1882] a path with spaces (git adds a tab) and a quoted path are read whole', () => {
  const sp = 'diff --git a/docs/my notes.md b/docs/my notes.md\n--- a/docs/my notes.md\t\n+++ b/docs/my notes.md\t\n@@ -0,0 +1,1 @@\n+hello\n';
  assert.deepEqual(addedLines(sp), [{ path: 'docs/my notes.md', text: 'hello' }]);
  const q = 'diff --git "a/docs/caf\\303\\251.md" "b/docs/caf\\303\\251.md"\n--- "a/docs/caf\\303\\251.md"\n+++ "b/docs/caf\\303\\251.md"\n@@ -0,0 +1,1 @@\n+hello\n';
  assert.equal(addedLines(q)[0].path, 'docs/caf\\303\\251.md');
  assert.equal(addedLines(q)[0].text, 'hello');
});
test('[BL-1882] a new file and a deleted file: the header lines are not added lines', () => {
  const n = 'diff --git a/n.md b/n.md\nnew file mode 100644\n--- /dev/null\n+++ b/n.md\n@@ -0,0 +1,1 @@\n+one\n';
  assert.deepEqual(addedLines(n), [{ path: 'n.md', text: 'one' }]);
  const del = 'diff --git a/d.md b/d.md\ndeleted file mode 100644\n--- a/d.md\n+++ /dev/null\n@@ -1,1 +0,0 @@\n-gone\n';
  assert.deepEqual(addedLines(del), []);
});

// BL-1882 follow-up: rule 1 holes found in review. Each line names CR-176 and still asks.
test('[BL-1882] rule 1 holes: and, or, please, without, "not ask", "no one ask", "never -" do not unlock an ask', () => {
  const holes = [
    'CR-176: do not worry and ask the founder to approve',
    'CR-176 do not worry or ask the founder to approve',
    'CR-176 never worry, please ask the founder to approve',
    'CR-176 without delay ask the founder to approve',
    'CR-176 not ask the founder to approve',
    'CR-176 no one ask the founder to approve',
    'D-168 never - ask the founder to approve',
    'D-168 never please ask the founder to approve',
  ];
  for (const h of holes) {
    const ok = !asksIn(h).length || allowedBecause(h) !== '';
    assert.equal(ok && asksIn(h).length > 0, false, h);
    assert.equal(evaluate({ body: h }).ok, false, h);
  }
});
test('[BL-1882] rule 1 still passes the template line and plain negations', () => {
  for (const t of [
    'Karma merges under CR-70 and CR-176, so never write "founder review needed" or ask him to approve, comment, merge or paste',
    'CR-176: nobody asks the founder to approve',
    'D-168 says we do not ask the founder to approve',
    'CR-176 means we never ask the founder to review',
  ]) assert.equal(evaluate({ body: t }).ok, true, t);
});
test('[BL-1882] quantifier negations: "None asks" and "No row asks" (#1678, #1677) pass; a bare instruction after one fails', () => {
  assert.equal(evaluate({ diff: diffOf('docs/BACKLOG.md', '+None asks the founder to approve, review, merge or paste. (CR-176)') }).ok, true);
  assert.equal(evaluate({ diff: diffOf('docs/BACKLOG.md', '+No row asks the founder to approve, review, merge or paste. (D-168)') }).ok, true);
  assert.equal(evaluate({ body: 'CR-176: nothing asks the founder to review it; neither does a row' }).ok, true);
  assert.equal(evaluate({ body: 'CR-176 no one ask the founder to approve' }).ok, false);
  assert.equal(evaluate({ body: 'CR-176 none ask the founder to approve' }).ok, false);
  // The two real lines have no rule id: a quantifier negation with a third-person verb is a statement of fact.
  assert.equal(evaluate({ body: 'None asks the founder to approve' }).ok, true);
  assert.equal(evaluate({ body: 'No row asks the founder to approve, review, merge or paste.' }).ok, true);
  for (const t of ['No, ask the founder to approve', 'No one ask the founder to approve', 'None: ask the founder to approve', 'None asks, so ask the founder to approve', 'Nothing blocks it and asks the founder to approve this, ask the founder to review', 'Not asks the founder to approve']) {
    assert.equal(evaluate({ body: t }).ok, false, t);
  }
});
test('[BL-1882] an auxiliary plus not (must not, should not) negates; a bare "not" does not', () => {
  assert.equal(evaluate({ body: 'CR-176: we must not ask the founder to approve' }).ok, true);
  assert.equal(evaluate({ body: 'D-168 says a row should not ask the founder to review' }).ok, true);
  assert.equal(evaluate({ body: 'CR-176 not ask the founder to approve' }).ok, false);
});

// BL-1882 follow-up 2: a trailing-space file name, pinned prefixes, more breaks, conditional quantifiers.
import { ALLOWED_PATHS } from './founder-ask.mjs';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
test('[BL-1882] a file named like an allowed path plus a trailing space is not the allowed path', () => {
  for (const p of ALLOWED_PATHS) {
    // git writes "+++ b/<path with space>\t" for a name with a space: exactly one trailing tab is removed, nothing else.
    const d = `diff --git a/${p} b/${p} \nnew file mode 100644\n--- /dev/null\n+++ b/${p} \t\n@@ -0,0 +1,1 @@\n+ask the founder to approve\n`;
    assert.deepEqual(addedLines(d).map((l) => l.path), [`${p} `], p);
    assert.equal(evaluate({ diff: d }).ok, false, p);
    assert.equal(evaluate({ diff: d.replaceAll(`${p} `, p).replace(`${p}\t`, `${p}`) }).ok, true, `${p} itself`);
  }
});
test('[BL-1882] real git: a trailing-space copy of an allowed path fails, the allowed path passes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fa-'));
  const git = (...a) => execFileSync('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { encoding: 'utf8' });
  git('init', '-q', '-b', 'main'); writeFileSync(join(dir, 'a'), 'x\n'); git('add', '.'); git('commit', '-qm', 'a');
  mkdirSync(join(dir, 'docs/release'), { recursive: true });
  writeFileSync(join(dir, 'docs/release/FOUNDER_QUEUE.md '), 'ask the founder to approve\n');
  git('add', '.'); git('commit', '-qm', 'b');
  const run = (extra) => main(['--base', 'HEAD~1', '--head', 'HEAD'], { PR_TITLE: 't', PR_BODY: '' }, (c, args) => execFileSync(c, ['-C', dir, ...args.slice(0, 1), ...extra, ...args.slice(1)], { encoding: 'utf8' }));
  assert.equal(run([]), 1);
});
test('[BL-1882] main pins the diff prefixes so diff.noprefix cannot make a b/ directory pass', () => {
  const calls = [];
  main([], {}, (c, a) => { calls.push(a); return ''; });
  assert.ok(calls[0].includes('--src-prefix=a/') && calls[0].includes('--dst-prefix=b/'));
  const dir = mkdtempSync(join(tmpdir(), 'fb-'));
  const g = (...a) => execFileSync('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { encoding: 'utf8' });
  g('init', '-q', '-b', 'main'); writeFileSync(join(dir, 'a'), 'x\n'); g('add', '.'); g('commit', '-qm', 'a');
  mkdirSync(join(dir, 'b/docs/release'), { recursive: true });
  writeFileSync(join(dir, 'b/docs/release/FOUNDER_QUEUE.md'), 'ask the founder to approve\n');
  g('add', '.'); g('commit', '-qm', 'b');
  const code = main(['--base', 'HEAD~1', '--head', 'HEAD'], {}, (c, a) => execFileSync(c, ['-C', dir, '-c', 'diff.noprefix=true', ...a], { encoding: 'utf8' }));
  assert.equal(code, 1);
});
test('[BL-1882] / | & plus whereas break a negation; "do not not ask", "never ever ask" are not governed', () => {
  for (const h of [
    'CR-176 never worry / ask the founder to approve', 'CR-176 do not worry | ask the founder to approve', 'CR-176 do not worry & ask the founder to approve',
    'CR-176 do not worry plus ask the founder to approve', 'CR-176 never mind whereas ask the founder to approve',
    'CR-176 do not not ask the founder to approve', 'CR-176 never ever ask the founder to approve', 'D-168 never always ask the founder to approve',
  ]) assert.equal(evaluate({ body: h }).ok, false, h);
  for (const h of ['CR-176: we never ask the founder to approve', 'CR-176: do not ask the founder to approve, review, merge or paste']) assert.equal(evaluate({ body: h }).ok, true, h);
});
test('[BL-1882] a conditional after a quantifier is an ask: "No work starts until Karma asks the founder to approve"', () => {
  for (const h of ['No work starts until Karma asks the founder to approve.', 'Nothing ships until the agent asks the founder to review it.', 'None merges when Karma asks the founder to approve', 'No row ships if it asks the founder to approve', 'Nothing happens unless someone asks the founder to review']) assert.equal(evaluate({ body: h }).ok, false, h);
  for (const h of ['None asks the founder to approve, review, merge or paste.', 'No row asks the founder to approve, review, merge or paste.']) assert.equal(evaluate({ body: h }).ok, true, h);
});

// BL-1924: phrases that passed, more break tokens, filler, status lines, markup, two false positives.
const RULE = 'CR-176: ';
const rejects = (list, prefix = '') => { for (const h of list) assert.equal(evaluate({ body: prefix + h }).ok, false, h); };
const accepts = (list, prefix = '') => { for (const h of list) assert.equal(evaluate({ body: prefix + h }).ok, true, h); };
test('[BL-1924 1, 10] a conditional, a "because", a doubled never and a second ask in the span are asks', () => {
  rejects(['nobody asks the founder to approve until Karma asks the founder to approve', 'never because we ask the founder to approve', 'never never ask the founder to approve',
    'we never ask the founder to approve unless we ask the founder to approve', 'never ask the founder to approve, ask the founder to review', 'never ask the founder to approve or ask him to review the founder note',
    'never ask the founder to approve and, also, ask him to review'], RULE);
  accepts(['we never ask the founder to approve', 'Neither Karma nor the exec team asks the founder to approve', 'we do not and will not ask the founder to approve'], RULE);
});
test('[BL-1924 2, 9] break tokens: + backslash ~ = -> a bullet, versus, as well as, aside from, unlike, ever, also', () => {
  const second = 'ask the founder to approve';
  for (const brk of ['+', '\\', '~', '=', '->', '\u2022', ' * ', 'versus', 'vs', 'as well as', 'aside from', 'unlike', 'ever', 'also']) {
    rejects([`never ask the founder to approve ${brk} ${second}`, `never ${brk} ask the founder to approve`], RULE);
  }
  accepts(['never ask the founder to approve', 'never ask the founder to approve (a **bold** word is not a bullet)'], RULE);
});
test('[BL-1924 8] filler between the negation and the ask is not a refusal', () => {
  rejects(['never know when to ask the founder to approve', 'we do not know why we ask the founder to approve', 'it is not true that we do not ask the founder to approve', 'we never say whether to ask the founder to approve'], RULE);
});
test('[BL-1924 6] Awaiting, Blocked on, Pending and Requires status lines fail; markup around "founder" does not hide an ask', () => {
  rejects(['Awaiting founder approval', 'Blocked on founder approval', 'Pending the founder\'s approval', 'Requires founder approval',
    'ask **the** founder to approve', 'ask the **founder** to approve', 'ask [the founder](https://example.com/a) to approve', 'ask <b>the</b> founder to approve', 'ask the _founder_ to approve', 'ask ~~the~~ founder to approve',
    'please have the founder approve', 'can the founder approve this?', 'could you please let the founder review it', '@thesaurabhpareek please review', 'ask @thesaurabhpareek to approve']);
  accepts(['The founder approved the colour earlier.', 'cc @thesaurabhpareek', 'Karma is awaiting two reviews.', '**Never** ask the founder to approve (CR-176)']);
});
test('[BL-1924 3] the FOUND line keeps its prefix and prints the author path as plain text', () => {
  const r = evaluate({ diff: diffOf('docs/\u001b[31mx\u202e\u2028y\r.md', '+ask the founder to approve') });
  assert.equal(r.ok, false);
  assert.match(r.lines[0], /^FOUND added line in docs\/\[31mxy\.md: ask-founder-to, founder-must$/);
  assert.equal(/[\u0000-\u001f\u007f\u202e\u2028]/.test(r.lines[0]), false);
  assert.ok(evaluate({ diff: diffOf(`docs/${'a'.repeat(500)}.md`, '+ask the founder to approve') }).lines[0].length < 260);
});
test('[BL-1924 4] a colon ends the sentence only after a short label: the #1677 line passes, a status line fails', () => {
  accepts(['(a phone number for everyone reverses the promise and data minimisation: it needs a founder decision and counsel)']);
  rejects(['Status: needs a founder decision', 'Held: it needs a founder decision', 'Row 4 | Needs a founder decision', 'Done. Needs a founder decision.']);
});
const BL = 'docs/BACKLOG.md';
const row = (text, path = BL) => evaluate({ diff: diffOf(path, `+${text}`) }).ok;
test('[BL-1924 5] the guard\'s own examples, exact and quoted, pass only on an added line of docs/BACKLOG.md', () => {
  const ex = 'rows quote "Never mind CR-176 -- ask the founder to approve", `ask Saurabh to take a look`, "CR-176 (not optional) ask the founder to approve", "Awaiting founder approval" and `blocked on founder approval`';
  assert.equal(row(ex), true);
  assert.equal(row(ex, 'docs/other.md'), false);
  assert.equal(evaluate({ body: ex }).ok, false);
  assert.equal(evaluate({ title: ex }).ok, false);
});
test('[BL-1924 5] an exempt example cannot hide a real ask on the same line, or a changed example', () => {
  assert.equal(row('rows quote "ask Saurabh to take a look" and please ask the founder to approve'), false);
  assert.equal(row('rows quote "ask Saurabh to take a look" and the founder must merge it'), false);
  assert.equal(row('the example "ask Saurabh to look over this" is new'), false);
  assert.equal(row('the example "ask Saurabh to take a look at" `ask Saurabh to take a look please` is new'), false);
  assert.equal(row('"ask Saurabh to take a look, ask the founder to approve"'), false);
  assert.equal(row('"ask the founder to approve"'), false);
  assert.equal(row('BL-1851 quotes "ask Saurabh to take a look"', 'docs/other.md'), false);
  assert.equal(row('BL-1851 quotes "ask Saurabh to take a look"'), true);
  assert.equal(row('#### BL-1851 CI check: fail a pull request that contains "founder review needed"'), false);
});
test('[BL-1924 5] the second ask is found when its text starts on the first (ask him to, after the founder)', () => {
  rejects(['never ask the founder to approve + ask him to review', 'never ask the founder to approve, also ask him to review'], RULE);
});
test('[BL-1924] 200,000-character adversarial lines stay fast', () => {
  const big = [`${RULE}never ${'ask the founder to '.repeat(10000)}`, `${'[x]('.repeat(40000)}`, `${'*_~<b>'.repeat(35000)}ask the founder`, `${'not '.repeat(50000)}ask the founder to approve`,
    `${'. a: '.repeat(40000)}needs a founder decision`, `${'"x '.repeat(70000)}`, `${'Status: '.repeat(25000)}`, `${'CR-176 never ask the founder to approve ask the founder to approve; '.repeat(5000)}`];
  for (const b of big) { const t0 = Date.now(); evaluate({ body: b }); assert.ok(Date.now() - t0 < 2000, `${b.slice(0, 20)} took ${Date.now() - t0} ms`); }
});
