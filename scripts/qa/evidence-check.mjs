#!/usr/bin/env node
// Checks one B1 device evidence file (HV2-014, EG-8): the rows are all filled, the
// result words are the allowed ones, no forbidden data is in the file, and the
// verdict (pass, fail or stop) matches the rows.
//
//   node scripts/qa/evidence-check.mjs docs/qa/evidence/<date>-<build>-se3.md
//
// Exit 0: the file is valid; prints the verdict. Exit 1: problems, one per line.
// Exit 2: usage error. Plain node, no dependencies.
//
// It checks shape and honesty, not whether a number is right (the S19 reviewer does
// that). Kit: docs/qa/evidence/KIT-B1.md. Template: docs/qa/evidence/TEMPLATE.md.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const range = (prefix, from, to) =>
  Array.from({ length: to - from + 1 }, (_, i) => `${prefix}.${from + i}`);

// The rows a B1 sitting must have, in the kit's order (docs/qa/evidence/KIT-B1.md).
export const REQUIRED_ROWS = [
  'TF-04',
  ...range('AL-01', 0, 12),
  ...range('AL-02', 0, 12),
  ...range('AL-03', 0, 4),
  ...range('AL-08', 0, 3),
  ...range('AL-07', 1, 3),
  'S1-23',
  'S1-24',
];

export const RESULT_WORDS = ['pass', 'fail', 'stop', 'blocked', 'n/a', 'not run'];
export const FICTIONAL_NAMES = ['Asha', 'Avi', 'Mama', 'Papa'];

const ROW_ID = /^(TF-\d\d|S\d-\d\d|V-\d\d|AL-\d\d\.\d+[a-z]?)$/;

// Things that never go in evidence (README.md rules, LEGAL-REQ-014).
const FORBIDDEN = [
  ['an email address', /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+/],
  ['a link', /\b[a-z][a-z0-9+.-]*:\/\/\S+/i],
  ['a user or session id (uuid)', /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i],
  ['a token (jwt)', /\beyJ[A-Za-z0-9_-]{8,}/],
  ['a key or token prefix', /\b(sb_(publishable|secret)_|sbp_|sk_(live|test)_|ExponentPushToken|AIza)/i],
  ['a long hex string', /\b[0-9a-f]{24,}\b/i],
  ['a six digit sign-in code', /\b(code|otp|pin)\b[^|\n]{0,20}\b\d{6}\b/i],
];
const LONG_MIXED = /[A-Za-z0-9+/_=-]{32,}/g; // base64-ish: must mix letters and digits

// A name after one of these cue words must be one of the fictional family.
const NAME_CUE =
  /\b(?:named|called|child|baby|daughter|son|mother|father|mum|mom|dad|grandma|grandpa|dear)\b[ :]+(?:is |was |"|')?([A-Z][a-z]{2,})\b/g;
// Words that follow a cue word without being a name.
const NOT_NAMES = new Set([
  'Book', 'Settings', 'Review', 'Tonight', 'Speak', 'Type', 'Family', 'Account', 'Plus',
  'Free', 'Drill', 'Phone', 'Download', 'Start', 'Keep', 'Welcome', 'Continue', 'Let',
  'The', 'This', 'That', 'Switcher', 'Switch', 'Not', 'None', 'No', 'Yes', 'See',
]);

function cells(line) {
  const t = line.trim();
  if (!t.startsWith('|')) return null;
  let inner = t.slice(1);
  if (inner.endsWith('|')) inner = inner.slice(0, -1);
  return inner.split('|').map((c) => c.trim());
}

function stripFence(text) {
  // Drop HTML comments (the template's instructions) before looking at content.
  return text.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
}

function sectionOf(text, heading) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.trim().toLowerCase() === `## ${heading}`.toLowerCase());
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start + 1, end);
}

export function parseRows(text) {
  const sec = sectionOf(stripFence(text), 'Results');
  if (!sec) return null;
  const rows = [];
  for (const line of sec) {
    const c = cells(line);
    if (!c || c.length < 2) continue;
    const id = c[0].replace(/`/g, '');
    if (!ROW_ID.test(id)) continue;
    rows.push({
      id,
      result: c[1] ?? '',
      numbers: c[2] ?? '',
      captured: c[3] ?? '',
      issue: c[4] ?? '',
    });
  }
  return rows;
}

// "n/a (reason)" or "n/a: reason" or "n/a" with the reason in the Numbers cell.
function splitResult(cell) {
  const m = cell.match(/^(not run|n\/a|[A-Za-z]+)\s*(?:[:(-]\s*)?(.*?)\)?$/i);
  if (!m) return { word: cell.toLowerCase(), reason: '' };
  return { word: m[1].toLowerCase(), reason: m[2].trim() };
}

function scanForbidden(text, errors) {
  const body = stripFence(text);
  body.split('\n').forEach((line, i) => {
    const n = i + 1;
    for (const [what, re] of FORBIDDEN) {
      if (re.test(line)) errors.push(`line ${n}: contains ${what}; use a label (Phone A, Account A)`);
    }
    for (const m of line.matchAll(LONG_MIXED)) {
      if (/[A-Za-z]/.test(m[0]) && /\d/.test(m[0]) && !m[0].includes('(')) {
        errors.push(`line ${n}: contains a long token-like string; evidence never holds keys or tokens`);
        break;
      }
    }
    for (const m of line.matchAll(NAME_CUE)) {
      const word = m[1];
      if (!FICTIONAL_NAMES.includes(word) && !NOT_NAMES.has(word)) {
        errors.push(`line ${n}: "${word}" looks like a real name; only ${FICTIONAL_NAMES.join(', ')} may appear`);
      }
    }
  });
  // Tester and second person: initials only.
  for (const line of sectionOf(body, 'Session') ?? []) {
    const c = cells(line);
    if (!c || c.length < 2) continue;
    if (/^tester$/i.test(c[0]) && c[1] && !/^[A-Z]{2,3}$/.test(c[1])) {
      errors.push(`Tester must be initials only (2 or 3 capitals), found "${c[1]}"`);
    }
  }
}

function killTally(text) {
  const m = stripFence(text).match(/^\s*Kill tally:\s*runs\s+(\d+)\s*,\s*lost\s+(\d+)\s*,\s*doubled\s+(\d+)\s*$/im);
  return m ? { runs: +m[1], lost: +m[2], doubled: +m[3] } : null;
}

function issueSeverities(text) {
  const sec = sectionOf(stripFence(text), 'Issues filed') ?? [];
  const out = [];
  for (const line of sec) {
    const c = cells(line);
    if (!c || c.length < 2) continue;
    if (!/^#?\d+$/.test(c[0].replace(/`/g, ''))) continue; // header and separator rows
    const sev = c[1].match(/\bS([0-3])\b/);
    if (sev) out.push({ issue: c[0], severity: `S${sev[1]}` });
  }
  return out;
}

// Returns { errors, verdict } where verdict is the one the rows support, or null
// when the file is too broken to say.
export function checkEvidence(text) {
  const errors = [];
  scanForbidden(text, errors);

  const rows = parseRows(text);
  if (!rows) {
    errors.push('no "## Results" section found');
    return { errors, verdict: null };
  }

  const byId = new Map();
  for (const r of rows) {
    if (byId.has(r.id)) errors.push(`${r.id}: appears twice`);
    byId.set(r.id, r);
  }
  for (const id of REQUIRED_ROWS) {
    if (!byId.has(id)) errors.push(`${id}: required row is missing`);
  }

  const tally = killTally(text);
  const sevs = issueSeverities(text);
  const s0 = sevs.filter((s) => s.severity === 'S0');
  let anyFail = false;
  let anyStop = s0.length > 0;
  let notRun = 0;

  for (const r of rows) {
    if (!r.result) {
      errors.push(`${r.id}: empty Result`);
      continue;
    }
    const { word, reason } = splitResult(r.result);
    if (!RESULT_WORDS.includes(word)) {
      errors.push(`${r.id}: Result "${r.result}" is not one of ${RESULT_WORDS.join(', ')}`);
      continue;
    }
    if (['pass', 'fail', 'stop', 'not run'].includes(word) && reason) {
      errors.push(`${r.id}: Result "${r.result}" must be just "${word}"; put detail in Numbers`);
      continue;
    }
    if (word === 'pass' && !r.numbers) errors.push(`${r.id}: pass with no Numbers; a row without its numbers is not evidence`);
    if (word === 'fail') {
      anyFail = true;
      if (!r.numbers) errors.push(`${r.id}: fail with no Numbers`);
      if (!r.issue) errors.push(`${r.id}: fail with no Issue number`);
    }
    if (word === 'stop') {
      anyStop = true;
      if (!r.issue) errors.push(`${r.id}: stop with no Issue number (file the issue first)`);
    }
    if ((word === 'n/a' || word === 'blocked') && !reason && !r.numbers) {
      errors.push(`${r.id}: ${word} needs a reason`);
    }
    if (word === 'not run') notRun += 1;
  }

  let verdict = anyStop ? 'stop' : anyFail ? 'fail' : 'pass';
  if (notRun > 0 && verdict !== 'stop') {
    errors.push(`${notRun} row(s) are "not run"; only a stop verdict may leave rows unrun`);
  }
  if (verdict === 'pass') {
    if (!tally) {
      errors.push('no "Kill tally: runs N, lost N, doubled N" line (kit: The kill tally)');
    } else if (tally.lost > 0 || tally.doubled > 0) {
      errors.push(`kill tally shows lost ${tally.lost}, doubled ${tally.doubled}; that is an S0, so the verdict is stop`);
      verdict = 'stop';
    }
  } else if (tally && (tally.lost > 0 || tally.doubled > 0)) {
    verdict = 'stop';
  }

  const verdicts = [...stripFence(text).matchAll(/^\s*Verdict:\s*(\S+)\s*$/gim)].map((m) => m[1].toLowerCase());
  if (verdicts.length === 0) {
    errors.push('no "Verdict: pass|fail|stop" line');
  } else if (verdicts.length > 1) {
    errors.push('more than one Verdict line');
  } else if (!['pass', 'fail', 'stop'].includes(verdicts[0])) {
    errors.push(`Verdict "${verdicts[0]}" must be pass, fail or stop`);
  } else if (verdicts[0] !== verdict) {
    errors.push(`Verdict says ${verdicts[0]} but the rows say ${verdict}`);
  }

  return { errors, verdict };
}

function main(argv) {
  const file = argv[2];
  if (!file || file.startsWith('-')) {
    console.error('usage: node scripts/qa/evidence-check.mjs <evidence-file.md>');
    return 2;
  }
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (e) {
    console.error(`cannot read ${file}: ${e.message}`);
    return 2;
  }
  const { errors, verdict } = checkEvidence(text);
  if (errors.length) {
    console.error(`${file}: ${errors.length} problem(s)`);
    for (const e of errors) console.error(`  ${e}`);
    return 1;
  }
  console.log(`${file}: valid, verdict ${verdict}`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exit(main(process.argv));
}
