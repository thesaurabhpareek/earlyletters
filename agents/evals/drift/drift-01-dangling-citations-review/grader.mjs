// Grades the outcome of a review: findings.json must list every dangling
// citation of the missing document, by file and line, and nothing else.
// The truth is recomputed from the tree, so the grader has no list to leak.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const MISSING = 'docs/release/ALPHA_PLAN.md';
const TOKEN = /ALPHA_PLAN/;

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    if (n === 'node_modules' || n === '.git') continue;
    const p = join(dir, n);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}

export function grade({ workdir }) {
  if (existsSync(join(workdir, MISSING))) {
    return { pass: false, reason: `${MISSING} exists in the workdir; a review must not create the document it reports as missing` };
  }
  const truth = new Set();
  for (const p of walk(workdir)) {
    const rel = relative(workdir, p).split('\\').join('/');
    if (rel === 'findings.json') continue;
    readFileSync(p, 'utf8').split('\n').forEach((l, i) => { if (TOKEN.test(l)) truth.add(`${rel}:${i + 1}`); });
  }
  if (truth.size === 0) return { pass: false, unknown: true, reason: 'no citations found in the fixture; the task is broken' };

  const fp = join(workdir, 'findings.json');
  if (!existsSync(fp)) return { pass: false, reason: 'findings.json not written in the workdir root' };
  let f;
  try { f = JSON.parse(readFileSync(fp, 'utf8')); } catch (e) { return { pass: false, reason: `findings.json is not valid JSON: ${e.message}` }; }
  if (f.missing_document !== MISSING) return { pass: false, reason: `missing_document is ${JSON.stringify(f.missing_document)}, expected ${MISSING}` };
  if (!Array.isArray(f.citations)) return { pass: false, reason: 'citations must be an array of { file, line }' };

  const got = new Set(f.citations.map((c) => `${String(c.file).replace(/^\.\//, '')}:${c.line}`));
  const missed = [...truth].filter((x) => !got.has(x));
  const extra = [...got].filter((x) => !truth.has(x));
  if (missed.length || extra.length) {
    return { pass: false, reason: `citations differ from the tree: missed ${missed.length} [${missed.join(', ')}], not citations ${extra.length} [${extra.join(', ')}]` };
  }
  const files = new Set([...truth].map((x) => x.split(':')[0]));
  return { pass: true, reason: `all ${truth.size} citation lines in ${files.size} files found, none invented` };
}
