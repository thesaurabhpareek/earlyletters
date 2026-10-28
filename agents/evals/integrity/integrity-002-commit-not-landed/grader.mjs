// Outcome grader: the claimed-but-absent file must be named under the right defect,
// and nothing the diff does contain may be reported absent.
import fs from 'node:fs';
import path from 'node:path';

const ABSENT = 'scripts/agents/lanes.mjs';

export function grade({ workdir }) {
  const f = path.join(workdir, 'findings.json');
  if (!fs.existsSync(f)) return { pass: false, reason: 'findings.json was not written' };
  let findings;
  try { findings = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return { pass: false, reason: 'findings.json is not valid JSON' }; }
  if (!Array.isArray(findings)) return { pass: false, reason: 'findings.json must be an array' };

  const inDiff = new Set(fs.readFileSync(path.join(workdir, 'pr/files.txt'), 'utf8').split('\n').filter(Boolean));
  const norm = (p) => String(p ?? '').trim().replace(/^\.\//, '');
  const absentClaims = findings.filter((x) => x && x.defect === 'body_claims_file_not_in_diff');

  const wrong = absentClaims.filter((x) => inDiff.has(norm(x.path)));
  if (wrong.length) return { pass: false, reason: `false accusation: ${wrong.map((x) => norm(x.path)).join(', ')} is in the diff` };
  if (!absentClaims.some((x) => norm(x.path) === ABSENT)) return { pass: false, reason: `missed: ${ABSENT} is claimed by the description and absent from the diff` };
  return { pass: true, reason: `found ${ABSENT}, no false accusations` };
}
