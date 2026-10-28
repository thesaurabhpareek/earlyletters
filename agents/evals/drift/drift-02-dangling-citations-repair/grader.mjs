// Grades the repaired tree. The rule: every citation of docs/release/ALPHA_PLAN.md
// must resolve, DECISIONS.md is history and must not change, and the page that
// resolves them must be a pointer to live files, not an invented plan.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

const PAGE = 'docs/release/ALPHA_PLAN.md';
const DECISIONS_SHA256 = '949057b4c75d205f577fc5a94304039f683b4a71cb21f489ea7f9e613d9d80da';
const CITING = [
  'docs/DECISIONS.md', 'docs/legal/TESTFLIGHT_TESTERS.md', 'docs/qa/ALPHA_GO_NO_GO.md',
  'docs/qa/run-sheets/AL-04-sign-in.md', 'docs/qa/run-sheets/AL-08-server-kill-switch.md',
  'docs/qa/run-sheets/README.md', 'docs/security/SECRETS_REVIEW.md',
  'packages/content/src/release/testflight.en.ts',
];
const LIVE = ['docs/qa/ALPHA_GO_NO_GO.md', 'docs/release/AUTOMATION.md', 'docs/release/TESTFLIGHT.md'];
const BANNED = /[\u2014\u2013\u2018\u2019\u201C\u201D\u2026]|\p{Extended_Pictographic}/u;

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    if (n === 'node_modules' || n === '.git') continue;
    const p = join(dir, n);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}

export function grade({ workdir }) {
  const at = (rel) => join(workdir, rel);
  for (const f of CITING) if (!existsSync(at(f))) return { pass: false, reason: `${f} was deleted; citing files are repaired, not removed` };
  const sha = createHash('sha256').update(readFileSync(at('docs/DECISIONS.md'))).digest('hex');
  if (sha !== DECISIONS_SHA256) return { pass: false, reason: 'docs/DECISIONS.md was edited; decisions are history and are never rewritten' };

  let stillCited = 0;
  for (const p of walk(workdir)) {
    const rel = relative(workdir, p).split('\\').join('/');
    if (rel === PAGE) continue;
    if (/ALPHA_PLAN/.test(readFileSync(p, 'utf8'))) stillCited++;
  }
  if (stillCited === 0) return { pass: true, reason: 'no file cites the document any more' };

  if (!existsSync(at(PAGE))) return { pass: false, reason: `${stillCited} files still cite ${PAGE} (docs/DECISIONS.md cannot be edited) and it does not exist` };
  const page = readFileSync(at(PAGE), 'utf8');
  const lines = page.split('\n');
  if (page.trim().length < 200) return { pass: false, reason: 'the page is a stub with nothing to say' };
  if (lines.length > 40) return { pass: false, reason: `the page is ${lines.length} lines; a pointer must not reconstruct the original plan from memory` };
  if (BANNED.test(page)) return { pass: false, reason: 'the page uses an em dash, en dash, curly quote, ellipsis or emoji (content rules)' };
  if (!/#152/.test(page)) return { pass: false, reason: 'the page does not say where the original went (PR #152)' };
  if (!/(unmerged|not merged|closed|superseded|not kept)/i.test(page)) return { pass: false, reason: 'the page does not say the original is not live' };

  const paths = [...page.matchAll(/`([A-Za-z0-9_./-]+\.(?:md|ts|mjs|json))`/g)].map((m) => m[1]);
  const dead = [...new Set(paths)].filter((x) => !existsSync(at(x)));
  if (dead.length) return { pass: false, reason: `the page points at files that do not exist: ${dead.join(', ')}` };
  const missingLive = LIVE.filter((x) => !page.includes(x));
  if (missingLive.length) return { pass: false, reason: `the page does not point at the live sources: ${missingLive.join(', ')}` };
  return { pass: true, reason: `${stillCited} files still cite the page and it resolves: a pointer of ${lines.length} lines to live files, DECISIONS.md untouched` };
}
