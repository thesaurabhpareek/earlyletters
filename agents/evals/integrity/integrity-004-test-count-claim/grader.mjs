// Outcome grader: the wrong count (lanes.test.mjs) is named under the right defect,
// and the correct count (pause.test.mjs) is not accused. Counts are recomputed from
// the workdir by running node --test, so the grader does not trust a hard-coded 5.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const CLAIMED = { 'scripts/agents/lanes.test.mjs': 9, 'scripts/agents/pause.test.mjs': 4 };

function actual(workdir, file) {
  const r = spawnSync('node', ['--test', file], { cwd: workdir, encoding: 'utf8' });
  const m = /^# tests (\d+)/m.exec(r.stdout);
  return m ? Number(m[1]) : null;
}

export function grade({ workdir }) {
  const f = path.join(workdir, 'findings.json');
  if (!fs.existsSync(f)) return { pass: false, reason: 'findings.json was not written' };
  let findings;
  try { findings = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return { pass: false, reason: 'findings.json is not valid JSON' }; }
  if (!Array.isArray(findings)) return { pass: false, reason: 'findings.json must be an array' };

  const norm = (p) => String(p ?? '').trim().replace(/^\.\//, '');
  const mismatches = new Set(findings.filter((x) => x && x.defect === 'test_count_mismatch').map((x) => norm(x.path)));
  const truth = {};
  for (const file of Object.keys(CLAIMED)) {
    truth[file] = actual(workdir, file);
    if (truth[file] === null) return { pass: false, reason: `could not count tests in ${file} (was it modified?)` };
  }
  for (const [file, claimed] of Object.entries(CLAIMED)) {
    const wrong = claimed !== truth[file];
    if (wrong && !mismatches.has(file)) return { pass: false, reason: `missed: ${file} claims ${claimed}, has ${truth[file]}` };
    if (!wrong && mismatches.has(file)) return { pass: false, reason: `false accusation: ${file} claims ${claimed} and has ${truth[file]}` };
  }
  return { pass: true, reason: 'wrong count found, correct count left alone' };
}
