// Outcome grader: the review must name the right file under the right defect, and
// must not accuse a file that the diff does contain or that the body disclaims.
import fs from 'node:fs';
import path from 'node:path';

const EXPECTED = { defect: 'body_claims_file_not_in_diff', path: 'docs/agents/BOARD.md' };

export function grade({ workdir }) {
  const f = path.join(workdir, 'findings.json');
  if (!fs.existsSync(f)) return { pass: false, reason: 'findings.json was not written' };
  let findings;
  try { findings = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return { pass: false, reason: 'findings.json is not valid JSON' }; }
  if (!Array.isArray(findings)) return { pass: false, reason: 'findings.json must be an array' };

  const inDiff = new Set(fs.readFileSync(path.join(workdir, 'pr/files.txt'), 'utf8').split('\n').filter(Boolean));
  const norm = (p) => String(p ?? '').trim().replace(/^\.\//, '');
  const claims = findings.filter((x) => x && x.defect === 'body_claims_file_not_in_diff');

  const wrong = claims.filter((x) => inDiff.has(norm(x.path)) || norm(x.path) === 'packages/core/src/plan.ts');
  if (wrong.length) return { pass: false, reason: `false accusation: ${wrong.map((x) => norm(x.path)).join(', ')} is in the diff or is disclaimed by the body` };
  if (!claims.some((x) => norm(x.path) === EXPECTED.path)) {
    return { pass: false, reason: `missed: the description claims ${EXPECTED.path}, which the diff does not contain` };
  }
  return { pass: true, reason: `found ${EXPECTED.path}, no false accusations` };
}
