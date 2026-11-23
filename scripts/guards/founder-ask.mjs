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
 *  1. A line that quotes the rule: it names CR-176 or D-168 AND a negation (never, not, nobody, no one, do not,
 *     don't) governs each ask: earlier in the same sentence (a colon, semicolon, full stop, ! or ? ends it), with no
 *     comma, bracket, dash or turning word (so, but, then) between. This is the PR template's own "never write ..." line.
 *  2. A physical act: the line names FOUNDER_QUEUE (the file that lists the acts only his hands can do).
 *  3. Added lines in the files that must state the rule: ALLOWED_PATHS below. A new entry is a reviewed edit.
 *  4. The BL-1851 phrase itself (EXEMPT_PHRASES) in backticks on a line that names BL-1851, with no other ask on the line.
 * A line is read twice, with format characters (\p{Cf}, such as zero-width) removed and turned into spaces; both readings must pass.
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
  ['phrase-needs-approval', /needs?\s+(?:(?:the\s+)?founder(?:'s)?\s+(?:approval|review|merge|sign[\s-]?off|decision))/i],
  // "Needs a founder decision" only as the start of a sentence (a status line); mid-sentence it is description.
  ['needs-founder-decision', /(?:^|[.;:!?]\s+|\|\s*)(?:this\s+|it\s+)?needs\s+a\s+founder\s+(?:decision|ruling|call|answer)\b/i],
  ['phrase-waiting', new RegExp(String.raw`waiting\s+(?:for|on)\s+${FOUNDER}`, 'i')],
  // "ask him to approve" counts only when the same line names the founder (before or after).
  ['ask-him-to', new RegExp(String.raw`(?:\b${FOUNDER}\b[^\n]{0,80}\b(?:ask|asks|asking|asked)\s+(?:him|her)\s+to\s+${VERB}\b|\b(?:ask|asks|asking|asked)\s+(?:him|her)\s+to\s+${VERB}\b[^\n]{0,80}\b${FOUNDER}\b)`, 'i')],
  ['ask-founder-to', new RegExp(String.raw`\b(?:ask|asks|asking|asked|requests?|requesting|needs?|requires?|want|wants)\s+${FOUNDER}\s+to\s+${VERB}\b`, 'i')],
  // "ask Saurabh to take a look": the same ask shape with the softer verbs.
  ['ask-founder-to-look', new RegExp(String.raw`\b(?:ask|asks|asking|asked|requests?|requesting|needs?|requires?|want|wants)\s+${FOUNDER}\s+to\s+(?:take\s+a\s+look|have\s+a\s+look|look\s+(?:at|over)|weigh\s+in|check|ok|okay|green-?light|bless)\b`, 'i')],
  ['founder-must', new RegExp(String.raw`\b${FOUNDER}\s+(?:must|should|needs\s+to|has\s+to|please|to)\s+${VERB}\b`, 'i')],
  ['for-founder-verb', new RegExp(String.raw`\bfor\s+${FOUNDER}\s+(?:approval|review|merge|sign[\s-]?off)\b`, 'i')],
  ['please-founder', new RegExp(String.raw`\bplease\s+(?:${VERB})\b[^.\n]{0,40}\b${FOUNDER}\b`, 'i')],
  // Only the ask shape. A rule that says a change "ships only after a founder merge (D-125 item 5)" is not an ask.
  ['founder-merge-label', /\b(?:please|ask|asks|asking|waiting\s+(?:for|on)|wait\s+for)\b[^.;\n]{0,30}\bfounder[\s-]merge\b/i],
];

/** The one phrase BL-1851 names. A new entry is a reviewed edit (rule 4 below). */
export const EXEMPT_PHRASES = ['founder review needed'];

// A negation. "never mind", "do not hesitate", "don't forget" are not negations of the ask that follows.
const NEGATION = /\b(?:never|not|nobody|no\s+one|do\s+not|don't|doesn't|without)\b(?!\s+(?:mind|hesitate|forget|fail|neglect|bother))/gi;
const RULE_REF = /\b(?:CR-176|D-168)\b/;
const SENTENCE_END = /[.;:!?]\s/;
// Between a negation and the ask it governs there is no clause break: no comma, bracket, dash or turning word.
const CLAUSE_BREAK = /[,()[\]{}]|--|\b(?:so|but|then|instead|however|yet|except|though|although|while|and\s+then)\b/i;
/** How far back from an ask a negation may sit (also bounds the work per ask, so a long line cannot make it slow). */
const WINDOW = 200;

/** Two readings of a line: format characters (\p{Cf}: zero-width, soft hyphen, BOM) removed, and turned into spaces. Whitespace is collapsed. */
const readings = (line) => {
  const s = String(line ?? '');
  return [...new Set([s.replace(/\p{Cf}/gu, ''), s.replace(/\p{Cf}/gu, ' ')].map((t) => t.replace(/\s+/g, ' ')))];
};

/** Start index of every ask match in a collapsed line. */
function askStarts(t) {
  const out = [];
  for (const [, re] of PATTERNS) {
    const g = new RegExp(re.source, `${re.flags.replace('g', '')}g`);
    for (const m of t.matchAll(g)) out.push(m.index);
  }
  return out;
}

/** True when a negation sits earlier in the same sentence as the ask at `at`, with no clause break between them. */
function negated(t, at) {
  const sentence = t.slice(Math.max(0, at - WINDOW), at).split(SENTENCE_END).pop();
  let last = null;
  for (const m of sentence.matchAll(NEGATION)) last = m;
  return last !== null && !CLAUSE_BREAK.test(sentence.slice(last.index + last[0].length));
}

/** Rule 4: with the BL-1851 phrase in backticks, and nothing else asking. `named` is true when BL-1851 is on the line. */
function exemptPhrase(t, named) {
  if (!named) return false;
  let hit = false;
  const rest = t.replace(/`([^`]{1,60})`/g, (whole, inner) => {
    if (!EXEMPT_PHRASES.includes(inner.trim().replace(/\s+/g, ' ').toLowerCase())) return whole;
    hit = true;
    return ' ';
  });
  return hit && askStarts(rest).length === 0;
}

/** Why a line is allowed, or '' when it is not. Every reading of the line must pass; a name (FOUNDER_QUEUE, CR-176, BL-1851) counts if any reading shows it. */
export function allowedBecause(line) {
  const rs = readings(line);
  const any = (re) => rs.some((t) => re.test(t));
  if (any(/FOUNDER_QUEUE/)) return 'physical act (FOUNDER_QUEUE)';
  const ref = any(RULE_REF);
  const named = any(/\bBL-1851\b/);
  const whys = rs.map((t) => {
    if (ref && askStarts(t).every((at) => negated(t, at))) return 'quotes the rule (CR-176 or D-168 with a negation)';
    if (exemptPhrase(t, named)) return 'quotes the BL-1851 phrase in backticks (BL-1851)';
    return '';
  });
  return whys.every(Boolean) ? whys[0] : '';
}

/** Ids of the patterns that match one line (format characters removed or spaced, whitespace collapsed). */
export function asksIn(line) {
  const ids = new Set();
  for (const t of readings(line)) for (const [id, re] of PATTERNS) if (re.test(t)) ids.add(id);
  return PATTERNS.map(([id]) => id).filter((id) => ids.has(id));
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
