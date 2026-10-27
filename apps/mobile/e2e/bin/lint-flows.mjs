#!/usr/bin/env node
// Static checks for the Maestro flows (runs anywhere with Node 20+; no simulator).
//
//   node apps/mobile/e2e/bin/lint-flows.mjs
//
// 1. Every flow and subflow is valid YAML: a config document (appId) and a
//    command list.
// 2. Every flow in flows/ has a name and tags with its E2E id.
// 3. Every runFlow / runScript file it points to exists.
// 4. Every `id:` selector it uses is requested in TESTID_REQUESTS.md (ids are
//    regexes in Maestro; a regex id must match at least one requested id).
// Uses the `yaml` package already in the root node_modules (a transitive
// dependency; if it disappears, add it as a devDependency of @scribe/mobile).
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

let YAML;
try {
  YAML = await import('yaml');
} catch {
  console.error('lint-flows: the `yaml` package is not installed (npm install at the repo root)');
  process.exit(2);
}

const E2E = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const ALWAYS_OK = new Set(['e2e.wait.never']); // waited on on purpose, never present
// The five P0 flows that run nightly (PRD V2 08 section 3.3 S19; R5 EQ-10). Each
// must keep at least one flow file tagged `p0-nightly` (bin/run-p0-nightly.sh).
const P0_TAG = 'p0-nightly';
const P0_FLOWS = ['E2E-01', 'E2E-03', 'E2E-12', 'E2E-13', 'E2E-17'];
const p0Seen = new Set();

// Requested ids: every backticked token in TESTID_REQUESTS.md that looks like an id.
const requests = readFileSync(join(E2E, 'TESTID_REQUESTS.md'), 'utf8');
const tokens = new Set();
for (const m of requests.matchAll(/`([a-z][A-Za-z0-9]*(?:\.[A-Za-z0-9_<>{}$-]+)+)`/g)) tokens.add(m[1]);
// `.status.<state>` lists its states in prose; add them as literal suffixes too.
const requested = [...tokens].map((t) => {
  const pattern = t
    .replace(/[.*+?^${}()|[\]\\]/g, (c) => (c === '<' || c === '>' ? c : `\\${c}`))
    .replace(/<[^>]+>/g, '[A-Za-z0-9_.-]+');
  return new RegExp(`^${pattern}$`);
});

function isRequested(id) {
  if (ALWAYS_OK.has(id)) return true;
  const isRegex = /[()|*+?[\]]/.test(id);
  if (!isRegex) return requested.some((r) => r.test(id));
  // A regex id: take its first alternative of each group and drop wildcards, then check.
  const sample = id.replace(/\(([^|)]*)[^)]*\)/g, '$1').replace(/\.\*/g, '').replace(/\\\./g, '.');
  return requested.some((r) => r.test(sample)) || [...tokens].some((t) => new RegExp(`^${id}$`).test(t));
}

function walk(node, visit) {
  if (Array.isArray(node)) node.forEach((n) => walk(n, visit));
  else if (node && typeof node === 'object') {
    visit(node);
    Object.values(node).forEach((v) => walk(v, visit));
  }
}

function lintFile(path, { isFlow }) {
  const rel = path.slice(E2E.length + 1);
  let docs;
  try {
    docs = YAML.parseAllDocuments(readFileSync(path, 'utf8'));
  } catch (e) {
    problems.push(`${rel}: unreadable YAML (${e.message})`);
    return;
  }
  const errs = docs.flatMap((d) => d.errors.map((e) => e.message));
  if (errs.length) {
    problems.push(`${rel}: YAML errors: ${errs.join('; ')}`);
    return;
  }
  if (docs.length !== 2) {
    problems.push(`${rel}: expected a config document and a command list separated by ---`);
    return;
  }
  const config = docs[0].toJS() ?? {};
  const commands = docs[1].toJS();
  if (!config.appId) problems.push(`${rel}: no appId`);
  if (!Array.isArray(commands) || commands.length === 0) problems.push(`${rel}: no commands`);
  if (isFlow) {
    if (!config.name) problems.push(`${rel}: no name`);
    const tags = config.tags ?? [];
    const e2eId = /E2E-(\d\d)/.exec(rel)?.[0];
    if (!e2eId || !tags.includes(e2eId)) problems.push(`${rel}: tags must include ${e2eId ?? 'its E2E id'}`);
    // PRD V2 requirement ids (F##-REQ-###) count as well as the legacy ones.
    if (!tags.some((t) => /^(PRD|A|B|C|LEGAL|DATA|F\d\d)-(REQ|NFR)-\d+$|^D-\d+$|^K-\d+$/.test(t)))
      problems.push(`${rel}: tags name no requirement or decision id`);
    if (tags.includes(P0_TAG) && !P0_FLOWS.includes(e2eId))
      problems.push(`${rel}: tagged ${P0_TAG} but ${e2eId} is not one of the P0 nightly flows (${P0_FLOWS.join(', ')})`);
    if (tags.includes(P0_TAG)) p0Seen.add(e2eId);
  }
  walk(commands, (o) => {
    if (typeof o.id === 'string' && !isRequested(o.id)) problems.push(`${rel}: id "${o.id}" is not in TESTID_REQUESTS.md`);
    const ref = typeof o.runFlow === 'string' ? o.runFlow : o.runFlow?.file;
    if (ref && !existsSync(resolve(dirname(path), ref))) problems.push(`${rel}: runFlow file not found: ${ref}`);
    const script = typeof o.runScript === 'string' ? o.runScript : o.runScript?.file;
    if (script && !existsSync(resolve(dirname(path), script))) problems.push(`${rel}: runScript file not found: ${script}`);
  });
}

const flows = readdirSync(join(E2E, 'flows')).filter((f) => f.endsWith('.yaml'));
const subflows = readdirSync(join(E2E, 'subflows')).filter((f) => f.endsWith('.yaml'));
for (const f of flows) lintFile(join(E2E, 'flows', f), { isFlow: true });
for (const f of subflows) lintFile(join(E2E, 'subflows', f), { isFlow: false });

const ids = new Set(flows.map((f) => /E2E-(\d\d)/.exec(f)?.[0]));
for (let n = 1; n <= 15; n++) {
  const id = `E2E-${String(n).padStart(2, '0')}`;
  if (!ids.has(id)) problems.push(`no flow for ${id}`);
}
for (const id of P0_FLOWS) {
  if (!ids.has(id)) problems.push(`no flow for P0 nightly flow ${id}`);
  else if (!p0Seen.has(id)) problems.push(`${id} has no flow tagged ${P0_TAG}`);
}

// Report only: which ids the flows use that the app does not set yet (template
// ids such as `language.row.${code}` match any value). Never fails the lint:
// the request list leads the app. Run with --app to print the list.
if (process.argv.includes('--app')) {
  const SRC = resolve(E2E, '../src');
  const files = [];
  const walkDir = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) walkDir(join(d, e.name));
      else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) files.push(join(d, e.name));
    }
  };
  walkDir(SRC);
  const appIds = [];
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    for (const m of text.matchAll(/(?:testID|closeTestID|optionTestID|tabBarButtonTestID)\s*[=:]\s*\{?\s*(?:[^'"`{}]*\?\s*)?['"`]([a-z][A-Za-z0-9.${}<>_-]+)['"`]/g)) appIds.push(m[1]);
    for (const m of text.matchAll(/['"`]((?:[a-z][A-Za-z0-9]*)(?:\.[A-Za-z0-9${}_-]+)+)['"`]/g)) if (/^(gate|tab|onboarding|tonight|listen|review|write|signIn|signInEmail|signInCode|signInVerify|consent|consentSheet|accountConfirm|book|switcher|whoseBook|letter|readTogether|plusGate|plusConfirmed|addChild|family|invite|inviteNew|settings|account|plan|language|languagePicker|storage|privacy|export|deleteAccount|reminders|player)\./.test(m[1])) appIds.push(m[1]);
  }
  const appRes = [...new Set(appIds)].map((t) => new RegExp('^' + t.replace(/[.*+?^()|[\]\\]/g, (c) => '\\' + c).replace(/\$\{[^}]+\}/g, '[A-Za-z0-9_.-]+') + '$'));
  const used = new Set();
  const collect = (path) => {
    const docs = YAML.parseAllDocuments(readFileSync(path, 'utf8'));
    walk(docs[1]?.toJS(), (o) => { if (typeof o.id === 'string' && !ALWAYS_OK.has(o.id)) used.add(o.id); });
  };
  for (const f of flows) collect(join(E2E, 'flows', f));
  for (const f of subflows) collect(join(E2E, 'subflows', f));
  const missing = [...used].filter((id) => {
    if (/[()|*+?[\]]/.test(id)) return false; // regex ids are checked through their parts
    return !appRes.some((r) => r.test(id));
  }).sort();
  console.log(`app check: ${used.size} ids used by flows; ${missing.length} not found in apps/mobile/src:`);
  for (const id of missing) console.log(`  ${id}`);
}

if (problems.length) {
  console.error(problems.map((p) => `- ${p}`).join('\n'));
  console.error(`lint-flows: ${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`lint-flows: ${flows.length} flows and ${subflows.length} subflows OK; ${tokens.size} requested ids`);
