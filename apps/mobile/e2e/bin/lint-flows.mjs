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
    if (!tags.some((t) => /^(PRD|A|B|C|LEGAL|DATA)-(REQ|NFR)-\d+$|^D-\d+$|^K-\d+$/.test(t)))
      problems.push(`${rel}: tags name no requirement or decision id`);
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

if (problems.length) {
  console.error(problems.map((p) => `- ${p}`).join('\n'));
  console.error(`lint-flows: ${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`lint-flows: ${flows.length} flows and ${subflows.length} subflows OK; ${tokens.size} requested ids`);
