#!/usr/bin/env node
// Recomputes the honest traceability measures of section 26 and 26b of docs/product/prd/28-moments-tab.md.
// Not scripts/trace.mjs: that script reads card 28 only after PR #1313 merges (see section 26). Docs tool, no network.
//   node docs/product/moments-tab/row-homes.mjs [spec.md] [--repo <root>] [--json]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const flag = (k) => args.includes(k);
const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const repo = path.resolve(opt('--repo') ?? '.');
const specPath = args.find((a) => a.endsWith('.md')) ?? path.join(repo, 'docs/product/prd/28-moments-tab.md');
const lines = fs.readFileSync(specPath, 'utf8').split('\n');

// The 301 requirement rows: "| NS-53-R<n> | Given ... | Layer | Pri | Phase | Satisfies |"
const rows = new Map();
for (const l of lines) {
  const m = /^\| NS-53-R(\d+) \|/.exec(l);
  if (!m) continue;
  const c = l.split('|').map((s) => s.trim());
  rows.set(Number(m[1]), { layer: c[c.length - 5], pri: c[c.length - 4], phase: c[c.length - 3] });
}

// The PR ids of 19.4 (first column of the table that follows the 19.4 heading).
const start = lines.findIndex((l) => l.startsWith('### 19.4'));
const prIds = new Set();
for (let i = start + 1; i < lines.length && !lines[i].startsWith('### 19.5'); i++) {
  const m = /^\| (\d+[a-d]?(?:-\d[a-c]?)?) \|/.exec(lines[i]);
  if (m) prIds.add(m[1]);
}

// The 26b table: "| R<n> | PRs | Gates | Script | Not built, because |"
const homes = new Map();
const s26b = lines.findIndex((l) => l.startsWith('### 26b'));
for (let i = s26b + 1; i < lines.length && !lines[i].startsWith('## 27'); i++) {
  const m = /^\| R(\d+) \|(.*)\|\s*$/.exec(lines[i]);
  if (!m) continue;
  const c = ('| R' + m[1] + ' |' + m[2] + '|').split('|').slice(1, -1).map((s) => s.trim());
  homes.set(Number(m[1]), { prs: c[1] ? c[1].split(/,\s*/) : [], gates: c[2] ? c[2].split(/,\s*/) : [], script: c[3], notBuilt: c[4] });
}

const problems = [];
for (const n of rows.keys()) if (!homes.has(n)) problems.push(`R${n} has no line in 26b`);
for (const [n, h] of homes) {
  if (!rows.has(n)) problems.push(`26b names R${n}, which is not a row`);
  for (const p of h.prs) if (!prIds.has(p)) problems.push(`R${n}: PR ${p} is not in 19.4`);
}

const has = (n) => homes.get(n);
const all = [...rows.keys()];
const withPr = all.filter((n) => has(n)?.prs.length);
const withGate = all.filter((n) => has(n)?.gates.length);
const withPrOrGate = all.filter((n) => has(n)?.prs.length || has(n)?.gates.length);
const notBuilt = all.filter((n) => has(n)?.notBuilt);
const orphans = all.filter((n) => !has(n) || (!has(n).prs.length && !has(n).gates.length && !has(n).notBuilt));
const withScript = all.filter((n) => has(n)?.script);
const autoLayer = (n) => /L[0-4]/.test(rows.get(n).layer);
const withAutoLayer = all.filter(autoLayer);
const manualOnly = all.filter((n) => !autoLayer(n)); // layer is L5, R or P only
const l5NoScript = manualOnly.filter((n) => !has(n)?.script && !has(n)?.notBuilt);

// Rows cited by a test: any NS-53-R<n> in code or tests (docs excluded).
let cited = new Set();
try {
  const out = execFileSync('git', ['-C', repo, 'grep', '-h', '-o', '-E', 'NS-53-R[0-9]+', '--', 'apps', 'packages', 'supabase', 'scripts', ':!scripts/**/*.md'], { encoding: 'utf8' });
  cited = new Set(out.split('\n').filter(Boolean));
} catch (e) {
  if (e.status !== 1) throw e; // 1 = no match
}

const result = {
  rows: all.length,
  prIdsIn19_4: prIds.size,
  rowsWithPrHome: withPr.length,
  rowsWithGateHome: withGate.length,
  rowsWithPrOrGate: withPrOrGate.length,
  rowsNotBuiltWithReason: notBuilt.length,
  orphansRemaining: orphans.length,
  rowsWithAutomatedTest: cited.size,
  rowsWithNamedDeviceOrManualScript: withScript.length,
  rowsDeclaringAnAutomatedLayerL0toL4: withAutoLayer.length,
  manualOrPaperOnlyRowsByOwnLayer: manualOnly.length,
  ofThoseWithANamedScript: manualOnly.filter((n) => has(n)?.script).length,
  ofThoseNotBuilt: manualOnly.filter((n) => has(n)?.notBuilt).length,
  rowsWithPrHomeAndDeclaredAutomatedLayer: withPr.filter(autoLayer).length,
  manualOrPaperOnlyRowsWithNoScript: l5NoScript,
  problems,
};
if (flag('--json')) console.log(JSON.stringify(result, null, 2));
else for (const [k, v] of Object.entries(result)) console.log(`${k}: ${Array.isArray(v) ? (v.length ? v.join(', ') : 'none') : v}`);
process.exit(problems.length || orphans.length ? 1 : 0);
