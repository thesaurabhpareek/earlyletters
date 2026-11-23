// Shape check for docs/release/BUILD_CHECKLIST.md and docs/release/build-log-TEMPLATE.md (HV2-B01, HV2-015, HV2-016).
// It reads two files and checks their structure. It runs no command from them and never touches the network.
//   node scripts/release/checklist-check.mjs [checklistPath] [templatePath]
// Exit code 0 when no problem is found, 1 otherwise.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const STEP_RE = /^## Step (\d+)\. (.+)$/;
const BUILD_STEP = 6;

/** Split the checklist into its steps: { n, title, body }. */
export function parseSteps(text) {
  const steps = [];
  let cur = null;
  for (const line of text.split('\n')) {
    const m = STEP_RE.exec(line);
    if (m) {
      cur = { n: Number(m[1]), title: m[2], body: [] };
      steps.push(cur);
    } else if (/^## /.test(line)) {
      cur = null;
    } else if (cur) {
      cur.body.push(line);
    }
  }
  return steps;
}

const hasLine = (body, label) => body.some((l) => l.startsWith(`${label}: `) && l.length > label.length + 2);

/** Problems in the checklist text; an empty list means it passes. */
export function checkChecklist(text) {
  const problems = [];
  const steps = parseSteps(text);
  if (steps.length === 0) problems.push('no "## Step N. title" headings found');
  steps.forEach((s, i) => {
    if (s.n !== i + 1) problems.push(`step headings must run 1, 2, 3 in order: found ${s.n} at position ${i + 1}`);
    for (const label of ['Command', 'Expect', 'STOP']) {
      if (!hasLine(s.body, label)) problems.push(`step ${s.n} (${s.title}) has no "${label}:" line`);
    }
    const command = s.body.find((l) => l.startsWith('Command: ')) ?? '';
    if (!command.includes('`') && !/^Command: (none|wait|open)\b/i.test(command)) problems.push(`step ${s.n} Command line shows no command in backticks and does not start with none, wait or open`);
  });
  if (!/one[- ]retry/i.test(text)) problems.push('the one-retry rule is not stated');
  const build = steps.find((s) => s.n === BUILD_STEP);
  if (!build || !/eas-cli@[\d.]+ build /.test(build.body.join('\n'))) problems.push(`step ${BUILD_STEP} must carry the pinned eas build command`);
  const count = steps.find((s) => /builds/i.test(s.title) && s.n < BUILD_STEP);
  if (!count) problems.push(`no builds-used step before step ${BUILD_STEP}`);
  else if (!/fewer than 3/i.test(count.body.join('\n'))) problems.push(`step ${count.n} must say fewer than 3 builds remaining is a STOP`);
  return problems;
}

/** Problems in the build log template; the builds-used line must come before the build step. */
export function checkTemplate(text) {
  const problems = [];
  const lines = text.split('\n');
  const used = lines.findIndex((l) => /^- Builds used this month:/.test(l));
  const build = lines.findIndex((l) => /^## Step 6\. Build/.test(l));
  if (used === -1) problems.push('template has no "- Builds used this month:" line');
  if (build === -1) problems.push('template has no "## Step 6. Build" section');
  if (used !== -1 && build !== -1 && used > build) problems.push('the builds-used line must come before the build step');
  const ids = [...text.matchAll(/^## Step (\d+)\./gm)].map((m) => Number(m[1]));
  if (ids.join(',') !== '1,2,3,4,5,6,7,8,9,10') problems.push(`template steps must be 1 to 10 in order, found: ${ids.join(',')}`);
  return problems;
}

export function run(checklistPath, templatePath) {
  const problems = [
    ...checkChecklist(readFileSync(checklistPath, 'utf8')).map((p) => `BUILD_CHECKLIST: ${p}`),
    ...checkTemplate(readFileSync(templatePath, 'utf8')).map((p) => `build-log-TEMPLATE: ${p}`),
  ];
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = new URL('../../', import.meta.url);
  const checklist = process.argv[2] ?? fileURLToPath(new URL('docs/release/BUILD_CHECKLIST.md', root));
  const template = process.argv[3] ?? fileURLToPath(new URL('docs/release/build-log-TEMPLATE.md', root));
  const problems = run(checklist, template);
  for (const p of problems) console.log(`FAIL ${p}`);
  console.log(problems.length === 0 ? 'checklist-check: ok' : `checklist-check: ${problems.length} problem(s)`);
  process.exit(problems.length === 0 ? 0 : 1);
}
