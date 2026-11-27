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
 *  5. The guard's own examples (EXEMPT_EXAMPLES, exact strings in backticks or double quotes) on an added line of docs/BACKLOG.md only (BL-1924).
 * A line is read up to four times: format characters (\p{Cf}, such as zero-width) removed and turned into spaces, each with and without
 * markdown and HTML markup (bold, links, tags); every reading must pass.
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

const FOUNDER = String.raw`(?:the\s+)?(?:founder|saurabh|@thesaurabhpareek)(?:'s)?`;
const VERB = String.raw`(?:approve|approval|approving|review|reviewing|merge|merging|comment|commenting|paste|pasting|sign[\s-]?off)`;
/** The verbs of the two ask shapes only (CR-226, BL-2224): an ask of the founder to confirm or verify is an ask. `founder-must` and the
 *  other patterns keep VERB, so a standing "founder to confirm" flag in a PRD or runbook does not trip. */
const ASK_VERB = String.raw`(?:${VERB}|confirm|confirming|verify|verifying)`;
/** Each pattern is tested alone (founder-ask.test.mjs). */
export const PATTERNS = [
  ['phrase-review-needed', /founder\s+(?:review|approval|merge|sign[\s-]?off)\s+(?:needed|required)/i],
  // Also "Requires", "Awaiting", "Pending" and "Blocked on" (BL-1924) with approval, review, merge or sign-off, not "decision" ("pending the founder's decision" describes).
  ['phrase-needs-approval', /(?:needs?\s+(?:the\s+)?founder(?:'s)?\s+(?:approval|review|merge|sign[\s-]?off|decision)|(?:requires?|requiring|awaiting|awaits?|pending|blocked\s+(?:on|by))\s+(?:the\s+)?founder(?:'s)?\s+(?:approval|review|merge|sign[\s-]?off))/i],
  // "Needs a founder decision" only as the start of a sentence or a short label ("Status: ...", "Held: ..."), a status line;
  // after a long clause and a colon it is description (BL-1924 item 4, the #1677 body line). A colon ends the sentence only after a label of at most two words.
  ['needs-founder-decision', /(?:^|[.;!?]\s+|\|\s*|(?:^|[|.;!?]\s*)[\w-]{1,20}(?:\s[\w-]{1,20})?:\s+)(?:this\s+|it\s+)?needs\s+a\s+founder\s+(?:decision|ruling|call|answer)\b/i],
  ['phrase-waiting', new RegExp(String.raw`waiting\s+(?:for|on)\s+${FOUNDER}`, 'i')],
  // "ask him to approve" counts only when the same line names the founder (before or after).
  ['ask-him-to', new RegExp(String.raw`(?:(?<!\w)${FOUNDER}(?!\w)[^\n]{0,80}\b(?:ask|asks|asking|asked)\s+(?:him|her)\s+to\s+${ASK_VERB}\b|\b(?:ask|asks|asking|asked)\s+(?:him|her)\s+to\s+${ASK_VERB}\b[^\n]{0,80}(?<!\w)${FOUNDER}(?!\w))`, 'i')],
  ['ask-founder-to', new RegExp(String.raw`\b(?:ask|asks|asking|asked|requests?|requesting|needs?|requires?|want|wants)\s+${FOUNDER}\s+to\s+${ASK_VERB}\b`, 'i')],
  // "ask Saurabh to take a look": the same ask shape with the softer verbs.
  ['ask-founder-to-look', new RegExp(String.raw`\b(?:ask|asks|asking|asked|requests?|requesting|needs?|requires?|want|wants)\s+${FOUNDER}\s+to\s+(?:take\s+a\s+look|have\s+a\s+look|look\s+(?:at|over)|weigh\s+in|check|ok|okay|green-?light|bless)\b`, 'i')],
  ['founder-must', new RegExp(String.raw`(?<!\w)${FOUNDER}\s+(?:must|should|needs\s+to|has\s+to|please|to)\s+${VERB}\b`, 'i')],
  ['for-founder-verb', new RegExp(String.raw`\bfor\s+${FOUNDER}\s+(?:approval|review|merge|sign[\s-]?off)\b`, 'i')],
  ['please-founder', new RegExp(String.raw`\bplease\s+(?:${VERB})\b[^.\n]{0,40}(?<!\w)${FOUNDER}(?!\w)`, 'i')],
  // "please have the founder approve", "can the founder review this?" (BL-1924).
  ['have-founder-verb', new RegExp(String.raw`\b(?:please\s+(?:have|let|get|can|could)|(?:can|could|would|will)\s+(?:you\s+)?(?:please\s+)?(?:have|let|get)|(?:can|could|would)(?:\s+please)?)\s+${FOUNDER}\s+${VERB}\b`, 'i')],
  // Only the ask shape. A rule that says a change "ships only after a founder merge (D-125 item 5)" is not an ask.
  ['founder-merge-label', /\b(?:please|ask|asks|asking|waiting\s+(?:for|on)|wait\s+for)\b[^.;\n]{0,30}\bfounder[\s-]merge\b/i],
];

/** The one phrase BL-1851 names, in backticks only. A new entry is a reviewed edit (rule 4 below). */
export const EXEMPT_PHRASES = ['founder review needed'];
/** The guard's own examples that a backlog row quotes (BL-1924 item 5): exact strings, in backticks or straight double quotes, on an
 *  added line of BACKLOG_PATH only (never a title or a body). Not a pattern: an author cannot widen it, and an ask beside it on the line still fails. */
export const BACKLOG_PATH = 'docs/BACKLOG.md';
export const EXEMPT_EXAMPLES = [
  'never mind cr-176 -- ask the founder to approve',
  'cr-176 (not optional) ask the founder to approve',
  'ask saurabh to take a look',
  'awaiting founder approval',
  'blocked on founder approval',
];

// A negation. "never mind", "do not hesitate", "don't forget" are not negations of the ask that follows.
// Verbal: never, do/does/did not, don't, doesn't, and a "not" after an auxiliary (must not, should not). A bare "not ask" is not one.
// Quantifier: none, no, no one, nobody, nothing, neither, nor. These govern only a third-person verb ("None asks", "No row asks"):
// "no one ask the founder to approve" has a bare verb, reads as an instruction, and is not negated.
const NOT_FOLLOWERS = String.raw`(?!\s+(?:mind|hesitate|forget|fail|neglect|bother))`;
const NEGATION = new RegExp(String.raw`\b(?:(?<q>none|nobody|no\s+one|nothing|neither|nor|no)|(?:never|do\s+not|does\s+not|did\s+not|don't|doesn't|(?:must|should|shall|will|would|can|could|may|might|is|are|was|were|has|have|had)\s+not))\b${NOT_FOLLOWERS}`, 'gi');
const RULE_REF = /\b(?:CR-176|D-168)\b/;
const SENTENCE_END = /[.;:!?]\s/;
// Between a negation and the ask it governs there is no clause break: no comma, bracket, dash or turning word.
// BL-1924: also + \ ~ = -> a bullet (a lone *, or a dot or arrow character), versus, as well as, aside from, unlike, ever, also.
const CLAUSE_BREAK = /[,()[\]{}]|--|[/|&+\\~=]|->|[\u2022\u00b7\u2023\u25e6\u25aa]|(?:^|\s)\*(?:\s|$)|\s[-\u2013\u2014]\s|(?<![\"'])\b(?:and|or)\b|\b(?:so|but|then|instead|however|yet|except|though|although|while|please|plus|whereas|versus|vs|unlike|besides|also|ever)\b|\bas\s+well\s+as\b|\b(?:aside|apart)\s+from\b/i;
// Words that turn the verb into talk about asking ("never know when to ask", "do not know why we ask") rather than a refusal to ask.
const FILLER = /\b(?:know|knows|knew|known|sure|true|clear|certain|why|how|whether|that|wonder|wonders|remember|matter|matters|idea|say|says|said|claim|claims)\b/i;
const REPEAT = /\b(?:not|never|ever|no|none|nobody|nothing|neither|nor|always|also)\b/i;
const CONDITION = /\b(?:until|when|whenever|if|after|once|because|unless|before|where|than|till|since)\b/i;
/** How far back from an ask a negation may sit (also bounds the work per ask, so a long line cannot make it slow). */
const WINDOW = 200;

/** Two readings of a line: format characters (\p{Cf}: zero-width, soft hyphen, BOM) removed, and turned into spaces. Whitespace is collapsed. */
const readings = (line) => {
  const s = String(line ?? '');
  const bare = [s.replace(/\p{Cf}/gu, ''), s.replace(/\p{Cf}/gu, ' ')];
  return [...new Set([...bare, ...bare.map(unmark)].map((t) => t.replace(/\s+/g, ' ')))];
};
/** Markdown and HTML around a word hide it ("**the** founder", "[the founder](url)", "<b>the</b> founder"): a third and fourth reading without them (BL-1924 item 6). */
const unmark = (s) => s.replace(/\[([^\]]{0,100})\]\([^)]{0,300}\)/g, '$1').replace(/<\/?[a-z][^>]{0,40}>/gi, '').replace(/[*~]+/g, '').replace(/(?<![A-Za-z0-9])_+|_+(?![A-Za-z0-9])/g, '');

/** Start and end of every ask match in a collapsed line. */
function askSpans(t) {
  const out = [];
  for (const [id, re] of PATTERNS) {
    const g = new RegExp(re.source, `${re.flags.replace('g', '')}g`);
    // "the founder ... ask him to approve" is matched from the founder; `verb` is where the ask itself begins ("ask him to").
    for (const m of t.matchAll(g)) out.push({ start: m.index, verb: m.index + (id === 'ask-him-to' ? Math.max(0, m[0].search(/\b(?:ask|asks|asking|asked)\s+(?:him|her)\s+to\b/i)) : 0), end: m.index + m[0].length });
  }
  return out;
}
const askStarts = (t) => askSpans(t).map((x) => x.start);

/** How the ask at `at` is negated: 'verbal' (never, do not, must not), 'quantifier' (None asks, No row asks), or '' when it is not.
 *  A negation sits earlier in the same sentence, with no clause break between. A quantifier needs a third-person verb: a bare
 *  "ask" anywhere between it and the ask ("no one ask the founder to approve") reads as an instruction and is not negated. */
function negatedBy(t, at, spans = [], verbAt = at) {
  const sentence = t.slice(Math.max(0, at - WINDOW), at).split(SENTENCE_END).pop();
  const ms = [...sentence.matchAll(NEGATION)];
  const last = ms.at(-1) ?? null;
  if (last === null || CLAUSE_BREAK.test(sentence.slice(last.index + last[0].length))) return '';
  const after = sentence.slice(last.index + last[0].length);
  // A second ask inside the span ("never ask X until we ask X") resets the negation: the earlier ask ended before this one began.
  const negEnd = at - sentence.length + last.index + last[0].length;
  // The one shape that stays: the template's own `never write "founder review needed" or ask him to approve` (a quote, then "or").
  if (spans.some((x) => x.end <= verbAt && x.end > negEnd && !/^["'`]\s+or\s+$/i.test(t.slice(x.end, verbAt)))) return '';
  // A filler or a condition between the negation and the ask ("never know when to ask", "never because we ask") is not a refusal.
  if (FILLER.test(after) || CONDITION.test(after)) return '';
  // Two negations within three words ("never never ask", "it is not true that we do not ask") cancel; "neither ... nor" is one pair.
  const prev = ms.at(-2);
  if (prev && last[0].toLowerCase() !== 'nor') {
    const gap = sentence.slice(prev.index + prev[0].length, last.index);
    if (gap.trim().split(/\s+/).filter(Boolean).length <= 3 && !CLAUSE_BREAK.test(gap)) return '';
  }
  // Another negation or a filler right after the negation ("do not not ask", "never ever ask") does not govern the ask.
  if (REPEAT.test(after.split(/\s/).slice(0, 3).join(' '))) return '';
  if (!last.groups.q) return 'verbal';
  // A quantifier governs a third-person verb within three words ("None asks", "No row asks"), with no condition between
  // ("No work starts until Karma asks ...") and no bare "ask".
  const span = `${after} ${t.slice(at, at + 5)}`;
  const verb = /\bask(s?)\b/i.exec(span);
  if (!verb || verb[1] !== 's') return '';
  const before = span.slice(0, verb.index).trim();
  return before === '' || (before.split(/\s+/).length <= 3 && !CONDITION.test(before)) ? 'quantifier' : '';
}

/** Rules 4 and 5: an exempt span in backticks (the BL-1851 phrase, when BL-1851 is named) or in backticks or double quotes (an example, on `backlog`), and nothing else asking. */
function exemptPhrase(t, named, backlog) {
  if (!named && !backlog) return false;
  let hit = false;
  const rest = t.replace(/`([^`]{1,80})`|"([^"]{1,80})"/g, (whole, tick, dq) => {
    const inner = (tick ?? dq).trim().replace(/\s+/g, ' ').toLowerCase();
    // The BL-1851 phrase only in backticks (the double-quoted title of its row is not exempt); the examples in either.
    const phrase = named && tick !== undefined && EXEMPT_PHRASES.includes(inner);
    if (!phrase && !(backlog && EXEMPT_EXAMPLES.includes(inner))) return whole;
    hit = true;
    return ' ';
  });
  return hit && askStarts(rest).length === 0;
}

/** Why a line is allowed, or '' when it is not. Every reading of the line must pass; a name (FOUNDER_QUEUE, CR-176, BL-1851) counts if any reading shows it. */
export function allowedBecause(line, path = '') {
  const rs = readings(line);
  const any = (re) => rs.some((t) => re.test(t));
  if (any(/FOUNDER_QUEUE/)) return 'physical act (FOUNDER_QUEUE)';
  const ref = any(RULE_REF);
  const named = any(/\bBL-1851\b/);
  const whys = rs.map((t) => {
    const spans = askSpans(t);
    // A line with this many asks is not a quoted rule; it also bounds the pairwise work of the second-ask check.
    if (spans.length > 100) return '';
    const how = spans.map((x) => negatedBy(t, x.start, spans, x.verb));
    if (ref && how.every(Boolean)) return 'quotes the rule (CR-176 or D-168 with a negation)';
    // A plain statement of fact ("None asks the founder to approve"): a quantifier negation needs no rule id.
    if (how.length && how.every((h) => h === 'quantifier')) return 'states that none asks (a quantifier negation)';
    if (exemptPhrase(t, named, path === BACKLOG_PATH)) return 'quotes the BL-1851 phrase in backticks (BL-1851)';
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

/** Added lines of `git diff -U0` text, as { path, text }. Removed and context lines are dropped.
 *  A file header ("+++ b/path") is read only between a "diff " line and its first "@@" hunk header; inside a hunk every line
 *  that starts with "+" is an added line, including one whose text starts with "++" or "+++" (an author cannot switch the path). */
export function addedLines(diff) {
  const out = [];
  let path = '';
  let inHunk = false;
  for (const raw of String(diff ?? '').split('\n')) {
    if (raw.startsWith('diff ')) { inHunk = false; path = ''; continue; }
    if (!inHunk) {
      if (raw.startsWith('+++ ')) path = headerPath(raw.slice(4));
      else if (raw.startsWith('@@')) inHunk = true;
      continue;
    }
    if (raw.startsWith('+')) out.push({ path, text: raw.slice(1) });
  }
  return out;
}

/** "b/docs/my notes.md" (git adds a tab after a path with spaces) or a quoted "b/..." path, to the path. */
function headerPath(h) {
  let p = h.replace(/\t$/, '');
  if (p.startsWith('"') && p.endsWith('"') && p.length > 1) p = p.slice(1, -1);
  return p === '/dev/null' ? '' : p.replace(/^b\//, '');
}

/** An author-chosen file path as plain text: control and format characters and line or paragraph separators removed, 200 characters at most. */
const plain = (p) => String(p).replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, '').slice(0, 200);

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
    if (ids.length && !allowedBecause(text, path)) hits.push(`added line in ${plain(path)}: ${ids.join(', ')}`);
  });
  if (!hits.length) return { ok: true, lines: ['founder-ask: no ask of the founder in the title, body or added lines'] };
  return { ok: false, lines: [...hits.map((h) => `FOUND ${h}`), 'FAIL: nobody asks the founder to approve, review, merge, comment or paste (CR-176, D-168). Decide with Karma and the exec team; a physical act is one row in docs/release/FOUNDER_QUEUE.md.'] };
}

const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

export function main(argv = process.argv.slice(2), env = process.env, exec = run) {
  const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
  try {
    // execFileSync, no shell: the refs are arguments, the PR text is only ever read from env.
    const diff = exec('git', ['diff', '-U0', '--no-color', '-M', '--src-prefix=a/', '--dst-prefix=b/', `${opt('--base', 'origin/develop')}...${opt('--head', 'HEAD')}`]);
    const r = evaluate({ title: env.PR_TITLE ?? '', body: env.PR_BODY ?? '', diff });
    process.stdout.write(`${r.lines.join('\n')}\n`);
    return r.ok ? 0 : 1;
  } catch (e) {
    process.stderr.write(`founder-ask could not run: ${String(e.message).split('\n')[0]}\n`);
    return 2;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main());
