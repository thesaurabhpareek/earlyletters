#!/usr/bin/env node
// Requirement traceability check (BL-002, ADR 0011; PRD V2 07 section 1.1 item 7).
//
// Reads requirement definitions from the PRD, collects every requirement ID cited in the
// docs, the backlog, the PR template and test titles, and writes docs/TRACE.md.
//
//   node scripts/trace.mjs [docsRoot] [--check] [--no-write] [--out <file>] [--repo <dir>] [--register <file>]
//
// docsRoot defaults to docs/prd/v2 when it exists, else docs/prd (the 1.3 PRD and its
// appendices A, B and C). Two layouts are understood:
//   - V2 (docsRoot has features/): a definition is the first cell of a row in a table whose
//     header starts `ID | P`, inside section 7 of a features/F*.md spec. Test-map tables
//     define nothing. Work packages are section 12 rows; a WP covers the bracketed IDs in its
//     "Done when" cell. Retired IDs are the tables of 10-changes-from-1.3.md section 3.
//   - Legacy (no features/): every *.md directly in docsRoot. A definition is the first cell of
//     a table whose header starts `ID`, or a line that starts with the ID (bullet, heading or
//     bold). PRD.md is the integrated index: its rows do not count as a second definition of an
//     ID an appendix defines.
// LEGAL-REQ and DATA-REQ text in docs/legal is read as an outside source: an ID defined only
// there is known, and listed as such.
//
// Evidence that a requirement is tested: a test title that cites the ID (any *.test.* file),
// or a Maestro flow in apps/mobile/e2e/flows whose `tags:` list names it (the e2e flows carry
// their requirement IDs as tags, apps/mobile/e2e/README.md section 2). Flows are listed apart
// from test titles because they run only on a Mac with a simulator build, not in `npm test`.
//
// Report mode (default) never exits non-zero. --check exits 1 when an ID is defined in two
// specs or a cited ID is defined nowhere. Whether --check blocks merges is 07 Q8 (founder).
// --json prints the headline counts, duplicates and undefined IDs as one JSON object (for CI).
//
// NS rows (BL-964, gate G0): the acceptance tables of the cards 00 to 12 beside the register
// (--register, default docs/product/prd/14-test-plan.md), each P0 row reported as tested,
// partial, journey, device or untested, with its backlog rows. Report only for now.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// A requirement ID is three digits, optionally followed by one lowercase sub-ID letter: F16-REQ-029a
// is a child of F16-REQ-029 (RR-2). The letter must not run into a word (`029and` is not a sub-ID).
export const ID_SOURCE = String.raw`[A-Z][A-Z0-9]*-(?:REQ|NFR)-\d{3}(?:[a-z](?![A-Za-z0-9]))?`;
const ID_ONLY = new RegExp(`^${ID_SOURCE}$`);

const pad3 = (n) => String(n).padStart(3, '0');
const prefixOf = (id) => id.slice(0, id.lastIndexOf('-') + 1);
const numOf = (id) => parseInt(id.slice(id.lastIndexOf('-') + 1), 10);
const hasSub = (id) => /[a-z]$/.test(id);

/**
 * Every requirement ID in `text`. Shorthand after a full ID is read too: `A-NFR-005 to -007`
 * and `DATA-REQ-010, -011` cite 007 and 011. With `ranges`, `X to Y` (full or shorthand, same
 * prefix, at most 200 apart) also yields every ID in between.
 */
export function extractIds(text, { ranges = false } = {}) {
  const out = new Set();
  const re = new RegExp(`(${ID_SOURCE})((?:\\s*(?:,\\s*(?:and\\s+)?|\\s+to\\s+|\\s+and\\s+)-\\d{3}\\b)*)`, 'g');
  for (const m of text.matchAll(re)) {
    const first = m[1];
    out.add(first);
    const prefix = prefixOf(first);
    let prev = numOf(first);
    for (const s of m[2].matchAll(/(,\s*(?:and\s+)?|\s+to\s+|\s+and\s+)-(\d{3})\b/g)) {
      const n = Number(s[2]);
      if (ranges && /to/.test(s[1])) addRange(out, prefix, prev, n);
      out.add(prefix + pad3(n));
      prev = n;
    }
  }
  if (ranges) {
    const full = new RegExp(`(${ID_SOURCE})\\s+to\\s+(${ID_SOURCE})`, 'g');
    for (const m of text.matchAll(full)) {
      if (prefixOf(m[1]) === prefixOf(m[2]) && !hasSub(m[1]) && !hasSub(m[2])) addRange(out, prefixOf(m[1]), numOf(m[1]), numOf(m[2]));
    }
  }
  return [...out];
}

function addRange(set, prefix, a, b) {
  if (!(b > a) || b - a > 200) return;
  for (let n = a; n <= b; n++) set.add(prefix + pad3(n));
}

/** IDs written in brackets, `[F08-REQ-001]`, plus `[A] to [B]` ranges of one prefix. */
export function bracketedIds(text) {
  const out = new Set();
  // `[DATA-REQ-040 Rev]` names the revised requirement; the suffix is not part of the ID.
  const tag = `\\[(${ID_SOURCE})(?:\\s+Rev\\b[^\\]]{0,40})?\\]`;
  for (const m of text.matchAll(new RegExp(tag, 'g'))) out.add(m[1]);
  const range = new RegExp(`${tag}\`?\\s+to\\s+\`?${tag}`, 'g');
  for (const m of text.matchAll(range)) {
    if (prefixOf(m[1]) === prefixOf(m[2]) && !hasSub(m[1]) && !hasSub(m[2])) addRange(out, prefixOf(m[1]), numOf(m[1]), numOf(m[2]));
  }
  return [...out];
}

/** Split one Markdown table row into trimmed cells; pipes inside backticks or escaped stay. */
export function splitRow(line) {
  const s = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells = [];
  let cur = '';
  let code = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\' && s[i + 1] === '|') { cur += '|'; i++; continue; }
    if (c === '`') code = !code;
    if (c === '|' && !code) { cells.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  cells.push(cur.trim());
  return cells;
}

const stripMd = (cell) => cell.replace(/[*`_]/g, '').trim();

/** Tables in `lines` (array of strings), each { header, rows: [{ cells, line }] }; line is 1-based. */
export function parseTables(lines, offset = 0) {
  const tables = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim().startsWith('|')) continue;
    if (!(lines[i + 1] && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1]))) continue;
    const header = splitRow(lines[i]).map(stripMd);
    const rows = [];
    let j = i + 2;
    for (; j < lines.length && lines[j].trim().startsWith('|'); j++) {
      rows.push({ cells: splitRow(lines[j]), line: offset + j + 1 });
    }
    tables.push({ header, rows });
    i = j - 1;
  }
  return tables;
}

/** The lines of numbered level-2 section `n` (`## 7. ...` up to the next `## `), with its offset. */
export function sectionLines(md, n) {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex((l) => new RegExp(`^##\\s+${n}\\.?\\s`).test(l));
  if (start < 0) return { lines: [], offset: 0 };
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) if (/^##\s/.test(lines[i])) { end = i; break; }
  return { lines: lines.slice(start, end), offset: start };
}

const priorityOf = (text) => (text.match(/\bP[0-3]\b/) || [''])[0];
// A V2 row can say `n/a` (removed) or `Later` instead of a priority; keep the word.
const priorityCell = (cell) => priorityOf(cell) || stripMd(cell).split(/[\s,(]/)[0];

/** V2 spec: definitions from section 7 requirement tables. */
export function v2Definitions(md, spec) {
  const { lines, offset } = sectionLines(md, 7);
  const defs = [];
  for (const t of parseTables(lines, offset)) {
    if (t.header[0] !== 'ID' || !/^P\b/.test(t.header[1] || '')) continue;
    for (const r of t.rows) {
      for (const id of extractIds(stripMd(r.cells[0]))) {
        defs.push({ id, priority: priorityCell(r.cells[1] || ''), title: stripMd(r.cells[2] || ''), spec, line: r.line });
      }
    }
  }
  return defs;
}

/** V2 spec: work packages from section 12, with the IDs their "Done when" cell names. */
export function v2WorkPackages(md, spec) {
  const { lines, offset } = sectionLines(md, 12);
  const wps = [];
  for (const t of parseTables(lines, offset)) {
    if (t.header[0] !== 'WP') continue;
    const done = t.header.findIndex((h) => /^Done when/i.test(h));
    for (const r of t.rows) {
      const wp = stripMd(r.cells[0]);
      if (!/^WP-[A-Z0-9]+-[A-Z0-9]+/.test(wp)) continue;
      wps.push({ wp, spec, line: r.line, ids: done >= 0 ? bracketedIds(r.cells[done] || '') : [] });
    }
  }
  return wps;
}

/** Legacy file (1.3 PRD, appendices, legal docs): tables headed `ID`, and lines that open with an ID. */
export function legacyDefinitions(md, spec) {
  const lines = md.split(/\r?\n/);
  const defs = [];
  const seen = new Set();
  const add = (id, priority, title, line) => {
    if (seen.has(id)) return;
    seen.add(id);
    defs.push({ id, priority, title, spec, line });
  };
  for (const t of parseTables(lines)) {
    if (t.header[0] !== 'ID') continue;
    const pCol = t.header.findIndex((h) => h === 'P');
    for (const r of t.rows) {
      const first = stripMd(r.cells[0]);
      const m = first.match(new RegExp(`^(${ID_SOURCE})`));
      if (!m) continue;
      const p = pCol >= 0 ? priorityOf(r.cells[pCol] || '') : priorityOf(first);
      add(m[1], p, stripMd(r.cells[pCol >= 0 ? pCol + 1 : 1] || first.slice(m[1].length)), r.line);
    }
  }
  const lead = new RegExp(`^\\s*(?:[-*]\\s+)?(?:#{1,6}\\s+)?\\*{0,2}(${ID_SOURCE})\\b(.*)$`);
  lines.forEach((l, i) => {
    const m = l.match(lead);
    if (m) add(m[1], priorityOf(m[2].slice(0, 12)), stripMd(m[2]).replace(/^\(P\d[^)]*\)\s*/, '').slice(0, 120), i + 1);
  });
  return defs;
}

/** V2: IDs 10-changes-from-1.3.md section 3 lists as not v1.0 (history or a later release). */
export function retiredIds(md) {
  const { lines, offset } = sectionLines(md, 3);
  const out = new Set();
  for (const t of parseTables(lines, offset)) {
    if (t.header[0] !== 'IDs') continue;
    for (const r of t.rows) for (const id of extractIds(stripMd(r.cells[0]), { ranges: true })) out.add(id);
  }
  return out;
}

const TITLE_CALL = /(?:^|[^\w.$])(?:it|test|describe|check|Deno\.test)(?:\.(?:only|skip|todo|fails|concurrent|sequential|each\s*\([^)]*\)))*\s*\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;

/**
 * Test titles in a test file's source, each { title, line, ids, skipped }. Only titles that cite
 * an ID; `pick` reads the IDs (the NS reader passes nsBracketed). `skipped` is .skip, .todo or .fails.
 */
export function testTitles(src, pick = extractIds) {
  const out = [];
  const lineStarts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') lineStarts.push(i + 1);
  const lineOf = (pos) => {
    let lo = 0, hi = lineStarts.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStarts[mid] <= pos) lo = mid; else hi = mid - 1; }
    return lo + 1;
  };
  for (const m of src.matchAll(TITLE_CALL)) {
    const ids = pick(m[2]);
    // The modifier before the title (`it.skip(`), or a node:test option after it (`{ skip: true }`).
    const skipped = /\.(?:skip|todo|fails)\b/.test(m[0].slice(0, -(m[2].length + 2)))
      || /^\s*,\s*\{[^}]*\b(?:skip|todo)\s*:\s*(?!false\b)/.test(src.slice(m.index + m[0].length, m.index + m[0].length + 120));
    if (ids.length) out.push({ title: m[2], line: lineOf(m.index + (/^[\w$]/.test(m[0]) ? 0 : 1)), ids, skipped });
  }
  return out;
}

/**
 * Requirement IDs a Maestro flow names in its `tags:` list (first YAML document only, the
 * flow's config). Line based, so it needs no YAML package: `tags:` then `  - ID` items.
 */
export function flowTags(src, pick = extractIds) {
  const lines = src.split(/\r?\n/);
  const ids = new Set();
  let inTags = false;
  for (const l of lines) {
    if (/^---\s*$/.test(l)) break;
    if (/^tags:\s*$/.test(l)) { inTags = true; continue; }
    if (!inTags) continue;
    const item = l.match(/^\s+-\s+["']?([^"'#]+?)["']?\s*(?:#.*)?$/);
    if (item) { for (const id of pick(item[1])) ids.add(id); continue; }
    if (/^\S/.test(l)) inTags = false;
  }
  return [...ids];
}

const SKIP_DIRS = new Set(['node_modules', '.git', '.expo', 'dist', 'build', 'coverage', 'ios', 'android', '.turbo']);

export function walk(dir, keep, acc = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    if (e.isSymbolicLink()) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p, keep, acc); } else if (keep(p)) acc.push(p);
  }
  return acc.sort();
}

const isTestFile = (p) => /\.test\.(?:[cm]?[jt]sx?)$/.test(p) || /[\\/]__tests__[\\/].+\.[cm]?[jt]sx?$/.test(p);
const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => { try { fs.accessSync(p); return true; } catch { return false; } };

/** Build the whole model. Pure apart from reading files. */
/** A path as the report shows it: repo-relative, or from `docs/` when it lies outside the repo. */
export function shownPath(repo, p) {
  const r = path.relative(repo, p).split(path.sep).join('/');
  if (!r.startsWith('..')) return r;
  const i = p.split(path.sep).join('/').lastIndexOf('/docs/');
  return i >= 0 ? p.split(path.sep).join('/').slice(i + 1) : p;
}

export function collect({ repo, docsRoot }) {
  const rel = (p) => path.relative(repo, p).split(path.sep).join('/');
  const shown = (p) => shownPath(repo, p);
  const layout = exists(path.join(docsRoot, 'features')) ? 'v2' : 'legacy';

  const defs = [];
  const wps = [];
  let retired = new Set();
  let specFiles;
  if (layout === 'v2') {
    specFiles = walk(path.join(docsRoot, 'features'), (p) => /[\\/]F\d+[^\\/]*\.md$/.test(p));
    for (const f of specFiles) {
      const md = read(f);
      defs.push(...v2Definitions(md, shown(f)));
      wps.push(...v2WorkPackages(md, shown(f)));
    }
    const changes = path.join(docsRoot, '10-changes-from-1.3.md');
    if (exists(changes)) retired = retiredIds(read(changes));
  } else {
    specFiles = fs.readdirSync(docsRoot).filter((n) => n.endsWith('.md')).sort().map((n) => path.join(docsRoot, n));
    const index = specFiles.filter((f) => /^(PRD|README)\.md$/.test(path.basename(f)));
    const appendices = specFiles.filter((f) => !index.includes(f));
    for (const f of appendices) defs.push(...legacyDefinitions(read(f), shown(f)));
    const inAppendix = new Set(defs.map((d) => d.id));
    for (const f of index) defs.push(...legacyDefinitions(read(f), shown(f)).filter((d) => !inAppendix.has(d.id)));
  }

  // Outside sources: the legal documents always; in V2 also PRD 1.3 and its appendices, which
  // still bind for anything V2 does not restate (V2 README, "Which source wins", item 6).
  const outside = new Map();
  const outsideFiles = ['ENGINEERING_REQUIREMENTS.md', 'DELETION_AND_EXPORT_SPEC.md'].map((n) => path.join(repo, 'docs', 'legal', n));
  if (layout === 'v2') {
    const legacyRoot = exists(path.join(path.dirname(docsRoot), 'PRD.md')) ? path.dirname(docsRoot) : path.join(repo, 'docs', 'prd');
    if (exists(legacyRoot)) outsideFiles.push(...fs.readdirSync(legacyRoot).filter((n) => n.endsWith('.md')).sort().map((n) => path.join(legacyRoot, n)));
  }
  for (const f of outsideFiles.filter(exists)) {
    for (const d of legacyDefinitions(read(f), shown(f))) if (!outside.has(d.id)) outside.set(d.id, d);
  }

  // Definitions by ID; two specs for one ID is a failure, two rows in one spec is reported.
  const byId = new Map();
  for (const d of defs) {
    if (!byId.has(d.id)) byId.set(d.id, []);
    byId.get(d.id).push(d);
  }
  const duplicates = [...byId].filter(([, ds]) => new Set(ds.map((d) => d.spec)).size > 1).map(([id, ds]) => ({ id, at: ds }));
  const repeatedInSpec = [...byId].filter(([, ds]) => ds.length > new Set(ds.map((d) => d.spec)).size).map(([id, ds]) => ({ id, at: ds }));

  // Citations: the PRD itself, the backlog, the PR template, and test titles.
  const citations = new Map();
  const cite = (id, where) => { if (!citations.has(id)) citations.set(id, []); citations.get(id).push(where); };
  const docFiles = layout === 'v2' ? walk(docsRoot, (p) => p.endsWith('.md')) : specFiles;
  const workDocs = [path.join(repo, 'docs', 'BACKLOG.md'), path.join(repo, '.github', 'pull_request_template.md')]
    .concat(walk(path.join(repo, 'docs', 'backlog'), (p) => p.endsWith('.md')))
    .filter(exists);
  for (const f of [...docFiles, ...workDocs]) {
    read(f).split(/\r?\n/).forEach((l, i) => { for (const id of extractIds(l)) cite(id, `${shown(f)}:${i + 1}`); });
  }
  const tests = new Map();
  let taggedTitles = 0;
  // This script's own tests hold fixture titles, not traces.
  const self = path.join(path.dirname(fileURLToPath(import.meta.url)), 'trace.test.mjs');
  for (const f of walk(repo, isTestFile).filter((f) => f !== self)) {
    for (const t of testTitles(read(f))) {
      taggedTitles++;
      for (const id of t.ids) {
        cite(id, `${rel(f)}:${t.line}`);
        if (!tests.has(id)) tests.set(id, new Set());
        tests.get(id).add(rel(f));
      }
    }
  }

  // Maestro flows: requirement IDs in each flow's tags.
  const flows = new Map();
  for (const f of walk(path.join(repo, 'apps', 'mobile', 'e2e', 'flows'), (p) => /\.ya?ml$/.test(p))) {
    for (const id of flowTags(read(f))) {
      cite(id, `${rel(f)}:tags`);
      if (!flows.has(id)) flows.set(id, new Set());
      flows.get(id).add(rel(f));
    }
  }

  const undefinedIds = [...citations.keys()].filter((id) => !byId.has(id) && !retired.has(id) && !outside.has(id)).sort(cmpId);
  const outsideOnly = [...citations.keys()].filter((id) => !byId.has(id) && !retired.has(id) && outside.has(id)).sort(cmpId);
  const retiredCited = [...citations.keys()].filter((id) => !byId.has(id) && retired.has(id)).sort(cmpId);

  const wpsById = new Map();
  for (const w of wps) for (const id of w.ids) {
    if (!wpsById.has(id)) wpsById.set(id, new Set());
    wpsById.get(id).add(w.wp);
  }

  const reqs = [...byId].map(([id, ds]) => ({
    id,
    priority: ds[0].priority,
    title: ds[0].title,
    spec: ds[0].spec,
    wps: [...(wpsById.get(id) || [])].sort(),
    tests: [...(tests.get(id) || [])].sort(),
    flows: [...(flows.get(id) || [])].sort(),
  })).sort((a, b) => a.spec.localeCompare(b.spec) || cmpId(a.id, b.id));

  return {
    layout, docsRoot: shown(docsRoot), specs: specFiles.map(shown), reqs, wps, duplicates, repeatedInSpec,
    citations, undefinedIds, outsideOnly, retiredCited, retired, outside, tests, taggedTitles, flows,
  };
}

export function cmpId(a, b) {
  return prefixOf(a).localeCompare(prefixOf(b)) || numOf(a) - numOf(b) || a.localeCompare(b);
}

export function summarize(m) {
  const p0 = m.reqs.filter((r) => r.priority === 'P0');
  return {
    defined: m.reqs.length,
    p0: p0.length,
    other: m.reqs.length - p0.length,
    specs: m.specs.length,
    wps: m.wps.length,
    duplicates: m.duplicates.length,
    repeatedInSpec: m.repeatedInSpec.length,
    undefined: m.undefinedIds.length,
    p0NoWp: m.layout === 'v2' ? p0.filter((r) => !r.wps.length).length : null,
    p0NoTest: p0.filter((r) => !r.tests.length).length,
    p0NoTestOrFlow: p0.filter((r) => !r.tests.length && !(r.flows || []).length).length,
    p0FlowOnly: p0.filter((r) => !r.tests.length && (r.flows || []).length).length,
    idsInTests: m.tests.size,
    specIdsInTests: m.reqs.filter((r) => r.tests.length).length,
    taggedTitles: m.taggedTitles,
    idsInFlows: m.flows ? m.flows.size : 0,
  };
}

const esc = (s) => String(s).replace(/\|/g, '\\|');

export function renderTrace(m) {
  const s = summarize(m);
  const L = [];
  L.push('# Requirement traceability');
  L.push('');
  L.push(`Generated by \`node scripts/trace.mjs ${m.docsRoot}\` (BL-002, ADR 0011). Do not edit by hand; re-run the script. Source layout: ${m.layout === 'v2' ? 'PRD V2 (definitions from section 7 of each `features/F*.md`, work packages from section 12)' : 'PRD 1.3 and appendices (definitions from requirement tables and lines that open with an ID)'}. Tests are test titles that cite the ID, in any \`*.test.*\` file in the repo.`);
  L.push('');
  L.push('## Headline');
  L.push('');
  L.push('| Measure | Count |');
  L.push('|---|---|');
  L.push(`| Specs read | ${s.specs} |`);
  L.push(`| Requirement IDs defined | ${s.defined} |`);
  L.push(`| P0 | ${s.p0} (${s.other} P1 or lower) |`);
  if (m.layout === 'v2') L.push(`| Work packages | ${s.wps} |`);
  L.push(`| IDs defined in two specs (fails \`--check\`) | ${s.duplicates} |`);
  L.push(`| IDs defined twice in one spec | ${s.repeatedInSpec} |`);
  L.push(`| IDs cited but defined nowhere (fails \`--check\`) | ${s.undefined} |`);
  if (m.layout === 'v2') L.push(`| P0 IDs with no work package | ${s.p0NoWp} |`);
  L.push(`| P0 IDs with no test title citing them | ${s.p0NoTest} |`);
  L.push(`| P0 IDs with neither a test title nor a Maestro flow tag | ${s.p0NoTestOrFlow} |`);
  L.push(`| P0 IDs covered only by a Maestro flow (runs on a Mac simulator, not in \`npm test\`) | ${s.p0FlowOnly} |`);
  L.push(`| Defined IDs cited by at least one test title | ${s.specIdsInTests} |`);
  L.push(`| Distinct IDs in test titles | ${s.idsInTests} (in ${s.taggedTitles} titles) |`);
  L.push(`| Distinct IDs in Maestro flow tags | ${s.idsInFlows} |`);
  L.push('');
  L.push('Coverage gaps are reported, not failed, until launch hardening (ADR 0011). Whether `--check` blocks merges is the founder\'s call (07 Q8).');
  L.push('');

  L.push('## Problems');
  L.push('');
  if (!m.duplicates.length && !m.undefinedIds.length && !m.repeatedInSpec.length) L.push('None.');
  for (const d of m.duplicates) L.push(`- Defined in two specs: ${d.id} at ${d.at.map((a) => `${a.spec}:${a.line}`).join(', ')}`);
  for (const d of m.repeatedInSpec) L.push(`- Defined twice in one spec: ${d.id} at ${d.at.map((a) => `${a.spec}:${a.line}`).join(', ')}`);
  for (const id of m.undefinedIds) {
    const at = m.citations.get(id);
    L.push(`- Cited, defined nowhere: ${id} at ${at.slice(0, 3).join(', ')}${at.length > 3 ? ` and ${at.length - 3} more` : ''}`);
  }
  L.push('');

  if (m.outsideOnly.length || m.retiredCited.length) {
    L.push('## Cited IDs defined outside the specs');
    L.push('');
    if (m.outsideOnly.length) {
      const bySource = new Map();
      for (const id of m.outsideOnly) {
        const src = m.outside.get(id).spec;
        if (!bySource.has(src)) bySource.set(src, []);
        bySource.get(src).push(id);
      }
      L.push(`Cited, with no row in a spec, and defined only in an outside source (${m.outsideOnly.length}):`);
      L.push('');
      for (const [src, ids] of [...bySource].sort((a, b) => a[0].localeCompare(b[0]))) L.push(`- \`${src}\`: ${ids.join(', ')}`);
    }
    if (m.outsideOnly.length && m.retiredCited.length) L.push('');
    if (m.retiredCited.length) L.push(`Listed as not v1.0 in \`10-changes-from-1.3.md\` section 3 (${m.retiredCited.length}): ${m.retiredCited.join(', ')}.`);
    L.push('');
  }

  L.push('## Requirements');
  L.push('');
  const bySpec = new Map();
  for (const r of m.reqs) { if (!bySpec.has(r.spec)) bySpec.set(r.spec, []); bySpec.get(r.spec).push(r); }
  for (const [spec, rs] of bySpec) {
    const tested = rs.filter((r) => r.tests.length).length;
    L.push(`### ${spec}`);
    L.push('');
    L.push(`${rs.length} IDs, ${rs.filter((r) => r.priority === 'P0').length} P0, ${tested} cited by a test title.`);
    L.push('');
    L.push(m.layout === 'v2' ? '| Requirement | P | Work packages | Tests | E2E flows |' : '| Requirement | P | Tests | E2E flows |');
    L.push(m.layout === 'v2' ? '|---|---|---|---|---|' : '|---|---|---|---|');
    for (const r of rs) {
      const tests = r.tests.length ? r.tests.map((t) => `\`${t}\``).join(', ') : (r.priority === 'P0' ? 'none' : '');
      const flows = (r.flows || []).map((f) => `\`${path.posix.basename(f)}\``).join(', ');
      L.push(m.layout === 'v2'
        ? `| ${r.id} | ${r.priority} | ${esc(r.wps.join(', ') || (r.priority === 'P0' ? 'none' : ''))} | ${esc(tests)} | ${esc(flows)} |`
        : `| ${r.id} | ${r.priority} | ${esc(tests)} | ${esc(flows)} |`);
    }
    L.push('');
  }

  const strays = [...m.tests.keys()].filter((id) => !m.reqs.some((r) => r.id === id)).sort(cmpId);
  if (strays.length) {
    L.push('## Test titles citing IDs the specs do not define');
    L.push('');
    L.push('| ID | Tests |');
    L.push('|---|---|');
    for (const id of strays) L.push(`| ${id} | ${[...m.tests.get(id)].sort().map((t) => `\`${t}\``).join(', ')} |`);
    L.push('');
  }
  if (m.ns) L.push(renderNs(m.ns));
  return L.join('\n');
}

// NS acceptance rows (BL-964, gate G0; grammar from eval C s3.2). Definitions are the acceptance
// tables (`Id | Given, When, Then | Priority | Test title`) of the cards 00 to 12 next to the
// register (`14-test-plan.md`); its section 7 lists the P0 rows and names the cross-cutting ids.
// A test counts only when its title cites the id in brackets and is not .skip, .todo or .fails;
// `[stand-in]` in the title makes it partial (14 section 2). Report only: nothing here fails.
export const NS_SOURCE = String.raw`(?<![A-Za-z0-9-])(?:NS-\d{2}-[A-Z]\d{1,2}(?:-\d{1,2})?[a-z]?|NX-\d{2}[a-z]?-[A-Z]\d{1,3}[a-z]?|X\d{1,2}-R\d{1,2}[a-z]?|FRAME-[A-Z]{2,12})(?![A-Za-z0-9-])`;
const NS_ONLY = new RegExp(`^${NS_SOURCE}$`);
const NS_TOK = String.raw`[A-Z]\d{1,2}(?:-\d{1,2})?[a-z]?(?![A-Za-z0-9-])`;
const CARD_FILE = /^(?:0\d|1[0-2])-[^/\\]*\.md$/;
const uniq = (a) => [...new Set(a)];
export const cmpNs = (a, b) => a.localeCompare(b, 'en', { numeric: true });

/** Every NS-family id in `text`, bracketed or not (Maestro tags, prose). */
export const nsIds = (text) => uniq(text.match(new RegExp(NS_SOURCE, 'g')) || []);
/** Ids written in brackets: `[NS-01-R4][NX-39-R14] title` gives both. Test titles count only these. */
export const nsBracketed = (text) => uniq([...text.matchAll(new RegExp(`\\[(${NS_SOURCE})\\]`, 'g'))].map((m) => m[1]));

const nsOrd = (id) => { const m = id.match(/^(NS-\d{2}-[A-Z])(\d+)(?:-(\d+))?([a-z]?)$/); return m && [m[1], +m[2], m[3] ? +m[3] : -1, m[4]]; };
function nsBetween(lo, id, hi) {
  const [a, x, b] = [lo, id, hi].map(nsOrd);
  if (!a || !x || !b || a[0] !== x[0] || b[0] !== x[0] || b[1] - a[1] > 200) return false;
  const cmp = (p, q) => p[1] - q[1] || p[2] - q[2] || p[3].localeCompare(q[3]);
  return cmp(a, x) <= 0 && cmp(x, b) <= 0;
}

/**
 * Ids a backlog or register line cites, with the shorthand of eval C s3.2: after a full NS id,
 * bare rows inherit its card (`NS-01-R37a, R37b`), and `X to Y` expands to the rows of `defined`
 * between them (`NS-09-R1 to R4b`, `NS-07-C28-1 to NS-07-C28-19`). A bare token that is not in
 * `defined` ends the list, so `NS-01-R4, P0` cites one row and a range never invents a row.
 */
export function nsCited(text, defined = new Set()) {
  const out = new Set(nsIds(text));
  const sep = String.raw`(?:\s*,\s*(?:and\s+)?|\s+to\s+|\s+and\s+)`;
  const re = new RegExp(String.raw`(?<![A-Za-z0-9-])NS-(\d{2})-(${NS_TOK})((?:${sep}(?:NS-\1-)?${NS_TOK})*)`, 'g');
  for (const m of text.matchAll(re)) {
    const card = `NS-${m[1]}-`;
    let prev = card + m[2];
    for (const s of m[3].matchAll(new RegExp(String.raw`(${sep})(NS-\d{2}-)?(${NS_TOK})`, 'g'))) {
      const id = card + s[3];
      if (!s[2] && !defined.has(id)) break;
      if (/to/.test(s[1])) for (const d of defined) if (nsBetween(prev, d, id)) out.add(d);
      out.add(id);
      prev = id;
    }
  }
  return [...out];
}

/** Acceptance rows of one card, each { id, priority, spec, line, device, journeys }. */
export function nsDefinitions(md, spec) {
  const defs = [];
  for (const t of parseTables(md.split(/\r?\n/))) {
    if (!/^Id$/i.test(t.header[0]) || !/^Given/i.test(t.header[1] || '')) continue;
    const pc = t.header.findIndex((h) => /^Priority$/i.test(h));
    const tc = t.header.findIndex((h) => /^Test\b/i.test(h));
    for (const r of t.rows) {
      const id = stripMd(r.cells[0]);
      if (!NS_ONLY.test(id)) continue;
      // A device row says so after the backticked title, `(device row S1-204)`, or at the end of
      // its Given/When/Then, `(PROPOSED; device)`; a device word mid-sentence is not a marker.
      const [gwt, tt] = [r.cells[1] || '', tc > 0 ? r.cells[tc] || '' : ''].map((c) => c.replace(/`[^`]*`/g, ''));
      const mark = String.raw`\(([^()]*\b(?:device|run sheet|two-phone)\b[^()]*)\)`;
      const dev = tt.match(new RegExp(mark, 'i')) || gwt.match(new RegExp(`${mark}\\W*$`, 'i')) || tt.match(/\bS1-\d+\b/);
      defs.push({ id, priority: pc > 0 ? priorityCell(r.cells[pc] || '') : '', spec, line: r.line,
        device: dev ? (dev[1] || dev[0]).trim() : '', journeys: uniq(r.cells.join(' ').match(/\bJ-N\d+\b/g) || []) });
    }
  }
  return defs;
}

/** The NS model for one register file and the cards beside it. Pure apart from reading files. */
export function collectNs({ repo, register }) {
  const rel = (p) => shownPath(repo, p);
  const add = (map, k, v) => { if (!map.has(k)) map.set(k, []); map.get(k).push(v); };
  const dir = path.dirname(register);
  const cards = fs.readdirSync(dir).filter((n) => CARD_FILE.test(n)).sort().map((n) => path.join(dir, n));
  const defs = cards.flatMap((f) => nsDefinitions(read(f), rel(f)));
  const byId = new Map();
  for (const d of defs) add(byId, d.id, d);
  const known = new Set(byId.keys());

  // Section 7 of the register: its tables list the P0 rows; its prose brackets the cross-cutting ids.
  const { lines, offset } = sectionLines(read(register), 7);
  const listed = new Set();
  for (const t of parseTables(lines, offset)) for (const r of t.rows) for (const c of r.cells) for (const id of nsCited(c, known)) listed.add(id);
  // A card with no Priority column (develop before the lock) takes P0 from the register.
  for (const d of defs) if (!d.priority && listed.has(d.id)) d.priority = 'P0';
  const cross = [];
  lines.forEach((l, i) => { for (const id of nsBracketed(l)) if (/^(?:X\d|FRAME-)/.test(id) && !cross.some((c) => c.id === id)) cross.push({ id, priority: 'P0', spec: rel(register), line: offset + i + 1, device: '', journeys: [] }); });

  // Evidence: unit, source and SQL test titles; e2e-web journeys and Maestro tags run outside npm test.
  const self = path.join(path.dirname(fileURLToPath(import.meta.url)), 'trace.test.mjs');
  const tests = new Map(), journeys = new Map(), cited = new Map(), jnAt = new Map();
  const pick = (t) => [...nsBracketed(t), ...(t.match(/\[J-N\d+\]/g) || []).map((x) => x.slice(1, -1))];
  let skipped = 0;
  const titled = walk(repo, isTestFile).filter((f) => f !== self).map((f) => [f, false])
    .concat(walk(path.join(repo, 'apps', 'mobile', 'e2e-web'), (p) => /\.flow\.ts$/.test(p)).map((f) => [f, true]));
  for (const [f, journey] of titled) {
    for (const t of testTitles(read(f), pick)) {
      if (t.skipped) { skipped++; continue; }
      const at = `${rel(f)}:${t.line}`;
      const jn = t.title.match(/\bJ-N\d+\b/g) || [];
      for (const j of jn) add(jnAt, j, at);
      for (const id of t.ids.filter((x) => !x.startsWith('J-N'))) {
        add(cited, id, at);
        if (journey) add(journeys, id, [...jn, at].join(' '));
        else add(tests, id, { at, partial: /\[stand-in\]/i.test(t.title) });
      }
    }
  }
  for (const f of walk(path.join(repo, 'apps', 'mobile', 'e2e', 'flows'), (p) => /\.ya?ml$/.test(p))) {
    for (const id of flowTags(read(f), nsIds)) { add(cited, id, `${rel(f)}:tags`); add(journeys, id, `${rel(f)}:tags`); }
    for (const j of flowTags(read(f), (t) => t.match(/\bJ-N\d+\b/g) || [])) add(jnAt, j, `${rel(f)}:tags`);
  }
  // Section 4 of the register: the journeys, with the flows or tests whose title or tags name them.
  const s4 = sectionLines(read(register), 4);
  const jnRows = parseTables(s4.lines, s4.offset).filter((t) => /^Id$/i.test(t.header[0]) && /^Journey/i.test(t.header[1] || ''))
    .flatMap((t) => t.rows.map((r) => ({ id: stripMd(r.cells[0]), cards: stripMd(r.cells[2] || ''), priority: priorityCell(r.cells[3] || ''), device: stripMd(r.cells[4] || '') })))
    .map((j) => ({ ...j, at: uniq(jnAt.get(j.id) || []) }));

  // Backlog rows (RR-3): a citation belongs to the BL id of the heading above it.
  const backlog = new Map();
  const blFiles = [path.join(repo, 'docs', 'BACKLOG.md')].concat(walk(path.join(repo, 'docs', 'backlog'), (p) => p.endsWith('.md'))).filter(exists);
  for (const f of blFiles) {
    let bl = '';
    read(f).split(/\r?\n/).forEach((l, i) => {
      if (/^#{1,6}\s/.test(l)) bl = (l.match(/^#{1,6}\s+(BL-\d+)/) || [])[1] || '';
      for (const id of nsCited(l, known)) add(backlog, id, bl || `${rel(f)}:${i + 1}`);
    });
  }

  const row = (d) => {
    const t = tests.get(d.id) || [];
    const status = t.some((x) => !x.partial) ? 'tested' : t.length ? 'partial' : journeys.has(d.id) ? 'journey'
      : d.device ? 'device' : 'untested';
    return { ...d, at: `${d.spec}:${d.line}`, status, tests: uniq(t.map((x) => x.at)), journeys: uniq([...d.journeys, ...(journeys.get(d.id) || [])]), backlog: uniq(backlog.get(d.id) || []) };
  };
  const p0 = defs.filter((d) => d.priority === 'P0').map(row);
  const p0Ids = new Set(p0.map((r) => r.id));
  const isNx = (id) => id.startsWith('NX-');
  return {
    register: rel(register), cards: cards.map(rel), rows: defs.length, p0, cross: cross.map(row), skipped, journeys: jnRows,
    repeated: [...byId].filter(([, ds]) => ds.length > 1).map(([id, ds]) => ({ id, at: ds.map((d) => `${d.spec}:${d.line}`) })),
    listedNotP0: [...listed].filter((id) => !p0Ids.has(id)).sort(cmpNs),
    p0NotListed: p0.filter((r) => !listed.has(r.id)).map((r) => r.id),
    strays: [...cited].filter(([id]) => !isNx(id) && !known.has(id) && !cross.some((c) => c.id === id)).map(([id, at]) => ({ id, at: uniq(at) })).sort((a, b) => cmpNs(a.id, b.id)),
    splitCited: [...cited].filter(([id]) => known.has(id) && /^(?!P\d$)./.test(byId.get(id)[0].priority)).map(([id, at]) => ({ id, at: uniq(at) })),
    nxCited: [...cited.keys()].filter(isNx).sort(cmpNs),
  };
}

const NS_STATUSES = ['tested', 'partial', 'journey', 'device', 'untested'];

export function summarizeNs(ns) {
  const by = (rs, s) => rs.filter((r) => r.status === s).length;
  return {
    cards: ns.cards.length, rows: ns.rows, p0: ns.p0.length, cross: ns.cross.length,
    ...Object.fromEntries(NS_STATUSES.map((s) => [s, by(ns.p0, s)])),
    crossTested: by(ns.cross, 'tested'), p0NoBacklog: ns.p0.filter((r) => !r.backlog.length).length,
    listedNotP0: ns.listedNotP0.length, p0NotListed: ns.p0NotListed.length, strays: ns.strays.length,
    splitCited: ns.splitCited.length, repeated: ns.repeated.length, skipped: ns.skipped, nxCited: ns.nxCited.length,
    journeys: ns.journeys.length, journeysNamed: ns.journeys.filter((j) => j.at.length).length,
  };
}

export function renderNs(ns) {
  const s = summarizeNs(ns);
  const list = (a, n = 3) => a.slice(0, n).map((x) => `\`${x}\``).join(', ') + (a.length > n ? ` and ${a.length - n} more` : '');
  const L = ['## NS acceptance rows (locked cards, gate G0)', ''];
  L.push(`Read from the cards beside \`${ns.register}\` (\`--register\`). A row is **tested** when an active test title cites it in brackets, **partial** when only \`[stand-in]\` titles do, **journey** when only an e2e-web flow or a Maestro tag does (they do not run in \`npm test\`), **device** when its card names a phone row and no test cites it, else **untested**. Report only: nothing here fails a build yet (BL-964).`);
  L.push('', '| Measure | Count |', '|---|---|');
  L.push(`| Cards read | ${s.cards} |`, `| Acceptance rows | ${s.rows} |`, `| P0 rows | ${s.p0} |`);
  for (const st of NS_STATUSES) L.push(`| P0 ${st} | ${s[st]} |`);
  L.push(`| P0 with no backlog row | ${s.p0NoBacklog} |`, `| Cross-cutting ids tested | ${s.crossTested} of ${s.cross} |`);
  L.push(`| Register lists, card does not say P0 | ${s.listedNotP0} |`, `| Card says P0, register does not list | ${s.p0NotListed} |`);
  L.push(`| Bracketed ids in test titles defined nowhere | ${s.strays} |`, `| Titles citing a split or withdrawn row | ${s.splitCited} |`);
  L.push(`| Skipped titles citing an NS id (not counted) | ${s.skipped} |`, `| NX ids in test titles (outside source, not checked) | ${s.nxCited} |`, '');
  if (ns.listedNotP0.length) L.push(`Register lists, card does not say P0: ${ns.listedNotP0.join(', ')}.`, '');
  if (ns.p0NotListed.length) L.push(`Card says P0, register does not list: ${ns.p0NotListed.join(', ')}.`, '');
  for (const x of ns.strays) L.push(`- Defined nowhere: ${x.id} at ${list(x.at)}`);
  for (const x of ns.splitCited) L.push(`- Split or withdrawn row cited: ${x.id} at ${list(x.at)}`);
  for (const x of ns.repeated) L.push(`- Defined twice: ${x.id} at ${x.at.join(', ')}`);
  if (ns.strays.length || ns.splitCited.length || ns.repeated.length) L.push('');
  L.push('| P0 row | Status | Where | Device row | Journeys | Backlog |', '|---|---|---|---|---|---|');
  for (const r of [...ns.p0, ...ns.cross]) {
    L.push(`| ${r.id} | ${r.status} | ${esc(r.tests.length ? list(r.tests) : '')} | ${esc(r.device)} | ${esc(r.journeys.join(', '))} | ${esc(r.backlog.join(', '))} |`);
  }
  L.push('', `Journeys (register section 4): ${ns.journeys.filter((j) => j.at.length).length} of ${ns.journeys.length} named by a test or flow title.`, '');
  L.push('| Journey | Cards | Priority | Device | Named by |', '|---|---|---|---|---|');
  for (const j of ns.journeys) L.push(`| ${j.id} | ${esc(j.cards)} | ${j.priority} | ${esc(j.device)} | ${esc(list(j.at))} |`);
  L.push('');
  return L.join('\n');
}

function parseArgs(argv) {
  const a = { check: false, write: true, out: null, repo: null, root: null, json: false, register: null };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === '--check') a.check = true;
    else if (v === '--no-write') a.write = false;
    else if (v === '--json') a.json = true;
    else if (v === '--out') a.out = argv[++i];
    else if (v === '--repo') a.repo = argv[++i];
    else if (v === '--register') a.register = argv[++i];
    else if (v === '--help' || v === '-h') a.help = true;
    else if (!v.startsWith('--')) a.root = v;
    else throw new Error(`unknown option ${v}`);
  }
  return a;
}

export function main(argv = process.argv.slice(2), log = console.log) {
  const args = parseArgs(argv);
  if (args.help) { log('node scripts/trace.mjs [docsRoot] [--check] [--no-write] [--json] [--out <file>] [--repo <dir>] [--register <14-test-plan.md>]'); return 0; }
  const repo = path.resolve(args.repo || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
  const docsRoot = path.resolve(repo, args.root || (exists(path.join(repo, 'docs/prd/v2')) ? 'docs/prd/v2' : 'docs/prd'));
  const m = collect({ repo, docsRoot });
  const s = summarize(m);
  // The NS register defaults to develop's copy; --register reads another (the lock branch, a fixture).
  const register = path.resolve(repo, args.register || 'docs/product/prd/14-test-plan.md');
  if (args.register && !exists(register)) throw new Error(`no register at ${register}`);
  // Report mode: a card the NS parser cannot read is logged, never a failed npm test.
  try { m.ns = exists(register) ? collectNs({ repo, register }) : null; } catch (e) { if (args.check) throw e; m.ns = null; log(`  trace NS skipped: ${e.message}`); }
  const ns = m.ns && summarizeNs(m.ns);
  if (args.write) {
    const out = path.resolve(repo, args.out || 'docs/TRACE.md');
    fs.writeFileSync(out, renderTrace(m) + '\n');
  }
  const failed = m.duplicates.length > 0 || m.undefinedIds.length > 0;
  if (args.json) {
    log(JSON.stringify({
      layout: m.layout,
      docsRoot: m.docsRoot,
      ...s,
      duplicateIds: m.duplicates.map((d) => ({ id: d.id, at: d.at.map((x) => `${x.spec}:${x.line}`) })),
      undefinedIds: m.undefinedIds,
      wouldFailCheck: failed,
      ns: ns && { register: m.ns.register, ...ns, untestedP0: m.ns.p0.filter((r) => r.status === 'untested').map((r) => r.id) },
    }));
    return args.check && failed ? 1 : 0;
  }
  log(`trace (${m.layout}, ${m.docsRoot}): ${s.defined} IDs defined (${s.p0} P0) in ${s.specs} specs` +
    (m.layout === 'v2' ? `, ${s.wps} work packages` : '') +
    `; ${s.duplicates} defined in two specs; ${s.undefined} cited but undefined; ` +
    (m.layout === 'v2' ? `${s.p0NoWp} P0 with no work package; ` : '') +
    `${s.p0NoTest} P0 with no test title (${s.p0NoTestOrFlow} with no test title and no e2e flow); ` +
    `${s.idsInTests} IDs in ${s.taggedTitles} test titles; ${s.idsInFlows} IDs in Maestro flow tags.`);
  for (const d of m.duplicates) log(`  defined in two specs: ${d.id} (${d.at.map((x) => `${x.spec}:${x.line}`).join(', ')})`);
  for (const id of m.undefinedIds) log(`  undefined: ${id} (${m.citations.get(id)[0]})`);
  if (ns) {
    log(`trace NS (${m.ns.register}): ${ns.rows} acceptance rows in ${ns.cards} cards, ${ns.p0} P0: ${NS_STATUSES.map((k) => `${ns[k]} ${k}`).join(', ')}; ` +
      `${ns.p0NoBacklog} P0 with no backlog row; cross-cutting ${ns.crossTested} of ${ns.cross} tested; register vs cards ${ns.listedNotP0} listed not P0, ${ns.p0NotListed} P0 not listed; ` +
      `${ns.strays} bracketed ids defined nowhere; ${ns.skipped} skipped titles not counted. Report only.`);
    for (const x of m.ns.strays) log(`  NS id defined nowhere: ${x.id} (${x.at[0]})`);
  }
  if (args.check && failed) return 1;
  if (failed) log('  report mode: not failing. Run with --check to fail on these.');
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  try {
    process.exitCode = main();
  } catch (e) {
    console.error(`trace: ${e.stack || e}`);
    // Report mode must never fail CI (BL-002); --check does.
    process.exitCode = check ? 2 : 0;
  }
}
