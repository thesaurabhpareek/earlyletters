#!/usr/bin/env node
/**
 * Founder-ask check (BL-1851, CR-176, D-168): a pull request never asks the founder to approve, review, merge,
 * comment or paste. Karma and the exec team decide; a physical act goes in docs/release/FOUNDER_QUEUE.md.
 *
 *   node scripts/guards/founder-ask.mjs --base origin/develop [--head HEAD]
 *   env: PR_TITLE, PR_BODY (untrusted: read from the environment only, never put on a command line or in a shell)
 *
 * Checked: the title, the body, and every ADDED line of the diff (removed lines never count). Exit 0 pass,
 * 1 an ask was found, 2 could not run. Output names the place and the pattern id, never the text of the PR.
 *
 * Allowed, by exact rule (each is tested):
 *  1. A line that quotes the rule: it names CR-176 or D-168 AND carries a negation (never, not, nobody, no one,
 *     do not, don't). This is the PR template's own "never write ..." line.
 *  2. A physical act: the line names FOUNDER_QUEUE (the file that lists the acts only his hands can do).
 *  3. Added lines in the files that must state the rule: ALLOWED_PATHS below. A new entry is a reviewed edit.
 */
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

/** Files whose added lines may quote the phrases (the rule text, the queue, this guard and its test, the proposal). */
export const ALLOWED_PATHS = [
  'docs/agents/cto/RULINGS.md',
  'docs/release/FOUNDER_QUEUE.md',
  '.github/pull_request_template.md',
  'scripts/guards/founder-ask.mjs',
  'scripts/guards/founder-ask.test.mjs',
  'docs/ops/proposed/founder-ask.md',
  'docs/ops/proposed/workflows/founder-ask.yml',
];

const FOUNDER = String.raw`(?:the\s+)?(?:founder|saurabh)(?:'s)?`;
const VERB = String.raw`(?:approve|approval|approving|review|reviewing|merge|merging|comment|commenting|paste|pasting|sign[\s-]?off)`;
/** Each pattern is tested alone (founder-ask.test.mjs). */
export const PATTERNS = [
  ['phrase-review-needed', /founder\s+(?:review|approval|merge|sign[\s-]?off)\s+(?:needed|required)/i],
  ['phrase-needs-approval', /needs?\s+(?:the\s+)?founder(?:'s)?\s+(?:approval|review|merge|sign[\s-]?off|decision)/i],
  ['phrase-waiting', /waiting\s+(?:for|on)\s+(?:the\s+)?founder/i],
  ['ask-founder-to', new RegExp(String.raw`\b(?:ask|asks|asking|asked|requests?|requesting|needs?|requires?|want|wants)\s+${FOUNDER}\s+to\s+${VERB}\b`, 'i')],
  ['founder-must', new RegExp(String.raw`\b${FOUNDER}\s+(?:must|should|needs\s+to|has\s+to|please|to)\s+${VERB}\b`, 'i')],
  ['for-founder-verb', new RegExp(String.raw`\bfor\s+${FOUNDER}\s+(?:approval|review|merge|sign[\s-]?off)\b`, 'i')],
  ['please-founder', new RegExp(String.raw`\bplease\s+(?:${VERB})\b[^.\n]{0,40}\b${FOUNDER}\b`, 'i')],
  ['founder-merge-label', /\bfounder[\s-]merge\b/i],
];

const NEGATION = /\b(?:never|not|nobody|no\s+one|do\s+not|don't|doesn't|without)\b/i;
const RULE_REF = /\b(?:CR-176|D-168)\b/;

/** Why a line is allowed, or '' when it is not. */
export function allowedBecause(line) {
  if (/FOUNDER_QUEUE/.test(line)) return 'physical act (FOUNDER_QUEUE)';
  if (RULE_REF.test(line) && NEGATION.test(line)) return 'quotes the rule (CR-176 or D-168 with a negation)';
  return '';
}

/** Ids of the patterns that match one line (whitespace is collapsed first). */
export function asksIn(line) {
  const t = String(line ?? '').replace(/\s+/g, ' ');
  return PATTERNS.filter(([, re]) => re.test(t)).map(([id]) => id);
}

/** Added lines of `git diff -U0` text, as { path, text }. Removed and context lines are dropped. */
export function addedLines(diff) {
  const out = [];
  let path = '';
  for (const raw of String(diff ?? '').split('\n')) {
    if (raw.startsWith('+++ ')) { path = raw.slice(4).replace(/^b\//, '').trim(); continue; }
    if (raw.startsWith('--- ') || raw.startsWith('@@') || raw.startsWith('diff ')) continue;
    if (raw.startsWith('+')) out.push({ path, text: raw.slice(1) });
  }
  return out;
}

/** The verdict: { ok, lines } of printable lines. Nothing from the PR text is echoed. */
export function evaluate({ title = '', body = '', diff = '' }) {
  const hits = [];
  const scan = (where, text) => {
    String(text ?? '').split('\n').forEach((line, i) => {
      const ids = asksIn(line);
      if (ids.length && !allowedBecause(line)) hits.push(`${where}${where === 'title' ? '' : ` line ${i + 1}`}: ${ids.join(', ')}`);
    });
  };
  scan('title', title);
  scan('body', body);
  addedLines(diff).forEach(({ path, text }, i) => {
    if (ALLOWED_PATHS.includes(path)) return;
    const ids = asksIn(text);
    if (ids.length && !allowedBecause(text)) hits.push(`added line in ${path}: ${ids.join(', ')}`);
  });
  if (!hits.length) return { ok: true, lines: ['founder-ask: no ask of the founder in the title, body or added lines'] };
  return { ok: false, lines: [...hits.map((h) => `FOUND ${h}`), 'FAIL: nobody asks the founder to approve, review, merge, comment or paste (CR-176, D-168). Decide with Karma and the exec team; a physical act is one row in docs/release/FOUNDER_QUEUE.md.'] };
}

const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

export function main(argv = process.argv.slice(2), env = process.env, exec = run) {
  const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
  try {
    // execFileSync, no shell: the refs are arguments, the PR text is only ever read from env.
    const diff = exec('git', ['diff', '-U0', '--no-color', '-M', `${opt('--base', 'origin/develop')}...${opt('--head', 'HEAD')}`]);
    const r = evaluate({ title: env.PR_TITLE ?? '', body: env.PR_BODY ?? '', diff });
    process.stdout.write(`${r.lines.join('\n')}\n`);
    return r.ok ? 0 : 1;
  } catch (e) {
    process.stderr.write(`founder-ask could not run: ${String(e.message).split('\n')[0]}\n`);
    return 2;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main());
