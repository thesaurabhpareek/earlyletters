// Grades whether CLAUDE.md's countable claims match the tree, and whether the
// tree was left alone. Counts are recomputed from the files, not hard-coded, so
// a repair that moves a test file or edits the roster to match the prose fails.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

// Listing hash of the three things the claims are about, as shipped in fixture/.
const TREE_SHA256 = '02302a821a637a8d814ee25a13582c9644ab06c46af22b335ca3008ae3b197b8';

function facts(w) {
  const tests = readdirSync(join(w, 'supabase/tests')).filter((f) => f.endsWith('.test.mjs')).sort();
  const roster = JSON.parse(readFileSync(join(w, 'agents/roster.json'), 'utf8'));
  const prompts = (readFileSync(join(w, 'packages/content/src/prompts.ts'), 'utf8').match(/\bkey: "/g) ?? []).length;
  return { tests, agents: roster.agents.length, prompts };
}
function treeSha(w) {
  const f = facts(w);
  const h = createHash('sha256');
  h.update(f.tests.join('\n')); h.update(String(f.agents)); h.update(String(f.prompts));
  h.update(readFileSync(join(w, 'agents/roster.json')));
  return h.digest('hex');
}

export function grade({ workdir }) {
  const doc = join(workdir, 'CLAUDE.md');
  if (!existsSync(doc)) return { pass: false, reason: 'CLAUDE.md was deleted' };
  if (treeSha(workdir) !== TREE_SHA256) {
    return { pass: false, reason: 'supabase/tests, agents/roster.json or prompts.ts changed; the docs follow the repo, never the other way round' };
  }
  const t = readFileSync(doc, 'utf8');
  const f = facts(workdir);
  const claims = [
    ['database test files', /npm run test:db[^\n]*\((\d+) files\)/, f.tests.length],
    ['agents on the roster', /\((\d+) agents\)/, f.agents],
    ['prompts', /\+ (\d+) prompts/, f.prompts],
  ];
  const wrong = [];
  for (const [what, re, truth] of claims) {
    const m = t.match(re);
    if (!m) return { pass: false, reason: `CLAUDE.md no longer states the count of ${what}; fix the number, do not delete the claim` };
    if (Number(m[1]) !== truth) wrong.push(`${what}: says ${m[1]}, tree has ${truth}`);
  }
  if (wrong.length) return { pass: false, reason: `stale counts in CLAUDE.md: ${wrong.join('; ')}` };
  return { pass: true, reason: `CLAUDE.md counts match the tree (${f.tests.length} test files, ${f.agents} agents, ${f.prompts} prompts)` };
}
