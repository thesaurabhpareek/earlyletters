// PR size check (CODE-R02, gate G8): at most 400 changed lines and 20 files, not counting the lockfile, generated
// files, listed fixture and golden folders, and doc images. Over that, it fails unless the repository owner has
// applied the `size:accepted` label AND the PR body has a `Size exception: <reason>` line.
// Pure functions are exported for the test. The CLI prints `lines 312 / 400, files 11 / 20` on every run.
// The PR body is read from the PR_BODY environment variable only; no text from the PR reaches a shell.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

export const MAX_LINES = 400;
export const MAX_FILES = 20;
export const MAX_EXCLUDED_LINES = 2000;
export const LABEL = 'size:accepted';

// The exclusion list is a constant with a test per entry. Exact paths and folders only.
export const EXCLUDED_FILES = ['package-lock.json'];
export const EXCLUDED_DIR_NAMES = ['generated', '__fixtures__']; // any folder with this exact name (generated: machine, __fixtures__: capped)
export const EXCLUDED_DIRS = [
  'apps/mobile/test/__golden__',
  'packages/core/test/golden',
  'packages/emails/test/fixtures',
  'scripts/agents/fixtures',
  'scripts/ci/fixtures',
  'scripts/review-gate/fixtures',
];
export const EXCLUDED_SUFFIXES = ['.generated.ts']; // light.generated.ts, lockup.generated.ts, qr.generated.ts
export const DOC_IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.heic'];

// 'machine' (lockfile, generated, doc images) is not capped; 'data' (fixtures, golden) is hand-written, so it is capped.
export function classify(p) {
  if (EXCLUDED_FILES.includes(p)) return 'machine';
  const parts = p.split('/');
  if (parts.slice(0, -1).includes('generated')) return 'machine';
  if (EXCLUDED_SUFFIXES.some((s) => p.endsWith(s))) return 'machine';
  const lower = p.toLowerCase();
  if (p.startsWith('docs/') && DOC_IMAGE_EXTS.some((e) => lower.endsWith(e))) return 'machine';
  if (parts.slice(0, -1).includes('__fixtures__')) return 'data';
  if (EXCLUDED_DIRS.some((d) => p.startsWith(d + '/'))) return 'data';
  return null;
}
export const isExcluded = (p) => classify(p) !== null;

// `git diff -M --numstat` renames look like `a/{old => new}/b` or `old => new`; keep the new path.
export function newPath(raw) {
  if (raw.includes('{')) {
    return raw.replace(/\{([^{}]*) => ([^{}]*)\}/, (_m, _o, n) => n).replace(/\/\//g, '/');
  }
  return raw.includes(' => ') ? raw.split(' => ')[1] : raw;
}

export function measure(numstat) {
  let lines = 0, files = 0, excludedLines = 0, excludedFiles = 0, dataLines = 0;
  for (const row of numstat.split('\n')) {
    if (!row.trim()) continue;
    const [add, del, ...rest] = row.split('\t');
    const n = (add === '-' ? 0 : Number(add)) + (del === '-' ? 0 : Number(del)); // binary counts 0
    const kind = classify(newPath(rest.join('\t')));
    if (kind) { excludedLines += n; excludedFiles += 1; if (kind === 'data') dataLines += n; }
    else { lines += n; files += 1; }
  }
  return { lines, files, excludedLines, excludedFiles, dataLines };
}

// Who applied the label last? Only the newest labeled event counts, and a later unlabeled event removes it.
export function acceptedBy(events, owner) {
  const mine = events.filter((e) => e.label && e.label.name === LABEL && (e.event === 'labeled' || e.event === 'unlabeled'));
  if (!mine.length) return { ok: false, why: `no ${LABEL} label` };
  const last = mine[mine.length - 1]; // the events API returns oldest first
  if (last.event === 'unlabeled') return { ok: false, why: `${LABEL} was removed` };
  const who = last.actor && last.actor.login;
  if (!who || !owner || who.toLowerCase() !== owner.toLowerCase()) {
    return { ok: false, why: `${LABEL} was applied by ${who || 'unknown'}, not the owner; ignored` };
  }
  return { ok: true, why: `${LABEL} applied by the owner` };
}

export function hasReasonLine(body) {
  const m = /^Size exception:[ \t]*(.+)$/m.exec(body || '');
  return !!m && m[1].trim() !== '' && !/^<.*>$/.test(m[1].trim());
}

export function evaluate({ measured, body, events, owner }) {
  const { lines, files, dataLines } = measured;
  const reasons = [];
  if (lines > MAX_LINES) reasons.push(`${lines} lines is over ${MAX_LINES}`);
  if (files > MAX_FILES) reasons.push(`${files} files is over ${MAX_FILES}`);
  if (dataLines > MAX_EXCLUDED_LINES) reasons.push(`${dataLines} fixture and golden lines is over ${MAX_EXCLUDED_LINES}`);
  if (!reasons.length) return { pass: true, reasons, note: '' };
  const proof = acceptedBy(events || [], owner);
  const line = hasReasonLine(body);
  if (proof.ok && line) return { pass: true, reasons, note: 'size exception accepted by the owner' };
  const missing = [];
  if (!proof.ok) missing.push(proof.why);
  if (!line) missing.push('no `Size exception: <reason>` line in the PR body');
  return { pass: false, reasons: reasons.concat(missing), note: '' };
}

function git(args) {
  const r = spawnSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`git ${args[0]} failed: ${(r.stderr || '').trim()}`);
  return r.stdout;
}

function fetchEvents(repo, pr) {
  const r = spawnSync('gh', ['api', '--paginate', `repos/${repo}/issues/${pr}/events`, '--jq', '.[]'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error('could not read the issue events (needs issues: read)');
  return r.stdout.split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

function main(argv) {
  const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const base = arg('--base'), head = arg('--head') || 'HEAD';
  if (!base) { console.error('usage: pr-size.mjs --base <ref> [--head <ref>] [--events-file f] [--owner login]'); return 2; }
  const measured = measure(git(['diff', '-M', '--numstat', `${base}...${head}`]));
  const out = `lines ${measured.lines} / ${MAX_LINES}, files ${measured.files} / ${MAX_FILES}`;
  console.log(out);
  console.log(`excluded: ${measured.excludedLines} lines in ${measured.excludedFiles} files (fixture and golden cap ${MAX_EXCLUDED_LINES}, now ${measured.dataLines})`);
  const over = measured.lines > MAX_LINES || measured.files > MAX_FILES || measured.dataLines > MAX_EXCLUDED_LINES;
  let events = [];
  const evFile = arg('--events-file');
  if (over) {
    if (evFile) events = JSON.parse(fs.readFileSync(evFile, 'utf8'));
    else if (process.env.GITHUB_REPOSITORY && process.env.PR_NUMBER) events = fetchEvents(process.env.GITHUB_REPOSITORY, process.env.PR_NUMBER);
  }
  const owner = arg('--owner') || process.env.OWNER;
  const res = evaluate({ measured, body: process.env.PR_BODY || '', events, owner });
  if (res.pass) { console.log(res.note ? `PASS: ${res.note}` : 'PASS'); return 0; }
  for (const r of res.reasons) console.log(`FAIL: ${r}`);
  console.log('Split the PR, or ask the owner to apply the size:accepted label and add a `Size exception: <reason>` line (CODE-R02).');
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.exitCode = main(process.argv.slice(2)); } catch (e) { console.error(`pr-size: ${e.message}`); process.exitCode = 2; }
}
