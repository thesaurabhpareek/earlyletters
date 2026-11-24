// Unit tests for scripts/trace.mjs (BL-002). Run: node --test scripts/trace.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  extractIds, bracketedIds, splitRow, parseTables, sectionLines, v2Definitions, v2WorkPackages,
  walk, legacyDefinitions, retiredIds, testTitles, flowTags, collect, summarize, renderTrace, main, cmpId,
  parseCsv, b1ScopeFromCatalog, parseBaseline, ratchet,
  nsIds, nsBracketed, nsCited, nsDefinitions, collectNs, summarizeNs, nsRatchet, nsOpen,
} from './trace.mjs';

test('extractIds reads full IDs and shorthand after a full ID', () => {
  assert.deepEqual(extractIds('see A-REQ-012 and F08-REQ-001.').sort(), ['A-REQ-012', 'F08-REQ-001']);
  assert.deepEqual(extractIds('DATA-REQ-010, -011 and LEGAL-REQ-014').sort(), ['DATA-REQ-010', 'DATA-REQ-011', 'LEGAL-REQ-014']);
  assert.deepEqual(extractIds('A-NFR-005 to -007').sort(), ['A-NFR-005', 'A-NFR-007']);
  assert.deepEqual(extractIds('BL-002, D-085, F14-U08, WP-F08-B1, X-REQ-1'), []);
});

test('extractIds expands ranges only when asked', () => {
  assert.deepEqual(extractIds('A-REQ-006 to A-REQ-008', { ranges: true }).sort(), ['A-REQ-006', 'A-REQ-007', 'A-REQ-008']);
  assert.deepEqual(extractIds('A-NFR-005 to -007', { ranges: true }).sort(), ['A-NFR-005', 'A-NFR-006', 'A-NFR-007']);
  assert.deepEqual(extractIds('A-REQ-006 to B-REQ-008', { ranges: true }).sort(), ['A-REQ-006', 'B-REQ-008']);
});

test('extractIds reads sub-IDs as their own IDs and never as the parent', () => {
  assert.deepEqual(extractIds('see F16-REQ-029a and F16-REQ-029b.').sort(), ['F16-REQ-029a', 'F16-REQ-029b']);
  assert.deepEqual(extractIds('F16-REQ-029 and F16-REQ-029a').sort(), ['F16-REQ-029', 'F16-REQ-029a']);
  assert.deepEqual(extractIds('F16-REQ-029and more'), ['F16-REQ-029']);
  assert.deepEqual(extractIds('F16-REQ-029ab'), ['F16-REQ-029']);
  assert.deepEqual(extractIds('F16-REQ-029a to F16-REQ-029c', { ranges: true }).sort(), ['F16-REQ-029a', 'F16-REQ-029c']);
  assert.deepEqual(bracketedIds('`[F16-REQ-029a]` and [F16-REQ-029b Rev]').sort(), ['F16-REQ-029a', 'F16-REQ-029b']);
});

test('cmpId orders a parent before its sub-IDs and sub-IDs alphabetically', () => {
  assert.deepEqual(['F16-REQ-030', 'F16-REQ-029b', 'F16-REQ-029', 'F16-REQ-029a'].sort(cmpId), ['F16-REQ-029', 'F16-REQ-029a', 'F16-REQ-029b', 'F16-REQ-030']);
});

test('bracketedIds reads tags, Rev suffixes and bracketed ranges', () => {
  assert.deepEqual(bracketedIds('`[F08-REQ-013]`, `[F08-REQ-014]`; F08-REQ-099 unbracketed').sort(), ['F08-REQ-013', 'F08-REQ-014']);
  assert.deepEqual(bracketedIds('`[DATA-REQ-040 Rev]` pack_ref'), ['DATA-REQ-040']);
  assert.deepEqual(bracketedIds('`[F08-REQ-006]` to `[F08-REQ-008]`').sort(), ['F08-REQ-006', 'F08-REQ-007', 'F08-REQ-008']);
});

test('splitRow keeps pipes inside backticks and escaped pipes', () => {
  assert.deepEqual(splitRow('| a | `x|y` | b \\| c |'), ['a', '`x|y`', 'b | c']);
});

test('parseTables and sectionLines find tables in a numbered section only', () => {
  const md = ['## 6. Before', '| ID | P |', '|---|---|', '| F01-REQ-009 | P0 |', '## 7. Requirements', '', '| ID | P | Requirement |', '|---|---|---|', '| F01-REQ-001 | P0 | One |', '## 8. After'].join('\n');
  const { lines, offset } = sectionLines(md, 7);
  const tables = parseTables(lines, offset);
  assert.equal(tables.length, 1);
  assert.deepEqual(tables[0].header, ['ID', 'P', 'Requirement']);
  assert.equal(tables[0].rows[0].line, 9);
});

const SPEC_A = `# F01 Entry

## 7. Requirements and acceptance criteria

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| F01-REQ-001 | P0 | Gate | Given | D-1 |
| F01-REQ-002 | P1 | Later thing | Given | D-1 |
| A-REQ-001, A-REQ-002 | P0, Rev (D-9) | Splash, two in one cell | Given | A |
| F01-REQ-003 | n/a | Removed (M2) | n/a | D-82 |

### 7.1 Test map

| ID | Test |
|---|---|
| F01-REQ-001 | \`apps/mobile/test/age-gate.test.ts\` |
| F02-REQ-001 | test maps define nothing |

## 12. Work packages

| WP | Scope | Done when (tests that must pass) | Mode |
|---|---|---|---|
| WP-F01-01 | Gate | \`[F01-REQ-001]\`, \`[A-REQ-001 Rev]\` | agent |
| WP-F01-02 | Splash | \`[A-REQ-002]\` | agent |

## 13. Open questions
`;

const SPEC_B = `# F02 Account

## 7. Requirements and acceptance criteria

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| F02-REQ-001 | P0 | Sign in | Given | A |
| A-REQ-002 | P0 | Splash again, a second home | Given | A |

## 12. Work packages

| WP | Scope | Done when (tests that must pass) |
|---|---|---|
| WP-F02-01 | Sign in | \`[F02-REQ-001]\` |
`;

function fixtureRepo({ withV2 = true, extraCitation = '' } = {}) {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-'));
  const w = (rel, text) => { fs.mkdirSync(path.dirname(path.join(repo, rel)), { recursive: true }); fs.writeFileSync(path.join(repo, rel), text); };
  w('docs/prd/A-entry.md', '## 5. Requirements\n- **A-REQ-001 (P0) Splash.** Given\n- **A-REQ-002 (P0) Fast.** Given\n- **A-NFR-001 Cold start.** p50\n');
  w('docs/prd/PRD.md', '| ID | P | Area | Requirement |\n|---|---|---|---|\n| A-REQ-001 | P0 | Launch | Splash |\n| PRD-REQ-001 | P0 | Consent | One ask |\n');
  w('docs/legal/ENGINEERING_REQUIREMENTS.md', '### LEGAL-REQ-014 (P0) No content in logs\n');
  w('docs/BACKLOG.md', `#### BL-002\n- Satisfies: F01-REQ-001, LEGAL-REQ-014. ${extraCitation}\n`);
  w('.github/pull_request_template.md', 'Satisfies: <IDs>\n');
  w('apps/mobile/test/age-gate.test.ts', "it('[F01-REQ-001] gate shows first', () => {});\ndescribe(\"[A-REQ-002] splash\", () => {});\nit('no id here', () => {});\n");
  w('supabase/tests/x.test.mjs', "check('[LEGAL-REQ-014] nothing logged', true);\n");
  w('node_modules/pkg/y.test.js', "it('[ZZ-REQ-999] ignored', () => {});\n");
  if (withV2) {
    w('docs/prd/v2/features/F01-entry.md', SPEC_A);
    w('docs/prd/v2/features/F02-account.md', SPEC_B);
    w('docs/prd/v2/06-nfr.md', '| Budget | Source |\n|---|---|\n| Cold start | A-NFR-001 |\n');
    w('docs/prd/v2/10-changes-from-1.3.md', '## 3. PRD 1.3 IDs no v1.0 spec cites\n\n| IDs | What |\n|---|---|\n| A-REQ-004 to A-REQ-006 | Story intro |\n\nCites A-REQ-005.\n## 4. Sources\n');
  }
  return repo;
}

test('v2Definitions reads section 7 requirement tables, every ID in the first cell, not test maps', () => {
  const defs = v2Definitions(SPEC_A, 'F01');
  assert.deepEqual(defs.map((d) => d.id), ['F01-REQ-001', 'F01-REQ-002', 'A-REQ-001', 'A-REQ-002', 'F01-REQ-003']);
  assert.deepEqual(defs.map((d) => d.priority), ['P0', 'P1', 'P0', 'P0', 'n/a']);
});

test('v2WorkPackages reads section 12 and the Done when cell', () => {
  const wps = v2WorkPackages(SPEC_A, 'F01');
  assert.deepEqual(wps.map((w) => [w.wp, w.ids.sort()]), [['WP-F01-01', ['A-REQ-001', 'F01-REQ-001']], ['WP-F01-02', ['A-REQ-002']]]);
});

test('legacyDefinitions reads ID tables and lines that open with an ID', () => {
  const defs = legacyDefinitions('- **C-REQ-001 (P0) Primed permission.** Given\n| ID | Requirement |\n|---|---|\n| **C-NFR-001 Delivery** | 99% |\nmentions C-REQ-002 mid-line\n', 'C');
  assert.deepEqual(defs.map((d) => [d.id, d.priority]).sort(), [['C-NFR-001', ''], ['C-REQ-001', 'P0']]);
});

test('retiredIds expands ranges in section 3 tables only', () => {
  const md = fs.readFileSync(path.join(fixtureRepo(), 'docs/prd/v2/10-changes-from-1.3.md'), 'utf8');
  assert.deepEqual([...retiredIds(md)].sort(), ['A-REQ-004', 'A-REQ-005', 'A-REQ-006']);
});

test('testTitles finds it, describe, check and Deno.test titles that cite an ID', () => {
  const src = "it('[A-REQ-001] a', f);\n  test.skip(`[B-REQ-002] [B-REQ-003] b`, f);\nDeno.test(\"[C-REQ-004] c\", f);\nit.each([1])('[D-REQ-005] d', f);\nsplit('[E-REQ-006] not a test');\nit('plain', f);\n";
  const t = testTitles(src);
  assert.deepEqual(t.map((x) => [x.line, x.ids]), [[1, ['A-REQ-001']], [2, ['B-REQ-002', 'B-REQ-003']], [3, ['C-REQ-004']], [4, ['D-REQ-005']]]);
});

test('collect on a V2 tree: definitions, duplicates across specs, WPs, tests, outside and retired IDs', () => {
  const repo = fixtureRepo();
  const m = collect({ repo, docsRoot: path.join(repo, 'docs/prd/v2') });
  const s = summarize(m);
  assert.equal(m.layout, 'v2');
  assert.equal(s.defined, 6);
  assert.equal(s.wps, 3);
  assert.deepEqual(m.duplicates.map((d) => d.id), ['A-REQ-002']);
  assert.deepEqual(m.undefinedIds, []);
  assert.deepEqual(m.outsideOnly, ['A-NFR-001', 'LEGAL-REQ-014']);
  assert.deepEqual(m.retiredCited, ['A-REQ-004', 'A-REQ-005', 'A-REQ-006']);
  const gate = m.reqs.find((r) => r.id === 'F01-REQ-001');
  assert.deepEqual(gate.wps, ['WP-F01-01']);
  assert.deepEqual(gate.tests, ['apps/mobile/test/age-gate.test.ts']);
  assert.ok(!m.citations.has('ZZ-REQ-999'), 'node_modules is skipped');
  assert.equal(s.p0NoWp, 0);
  assert.equal(s.p0NoTest, 2); // A-REQ-001 and F02-REQ-001
});

test('collect on a legacy tree: PRD.md is an index, not a second definition', () => {
  const repo = fixtureRepo({ withV2: false });
  const m = collect({ repo, docsRoot: path.join(repo, 'docs/prd') });
  assert.equal(m.layout, 'legacy');
  assert.deepEqual(m.reqs.map((r) => r.id).sort(), ['A-NFR-001', 'A-REQ-001', 'A-REQ-002', 'PRD-REQ-001']);
  assert.deepEqual(m.duplicates, []);
  assert.deepEqual(m.undefinedIds, ['F01-REQ-001']); // cited by the backlog and a test, defined nowhere in 1.3
});

test('an undefined cited ID fails --check and only reports in report mode', () => {
  const repo = fixtureRepo({ extraCitation: 'Also F77-REQ-123.' });
  const logs = [];
  const root = path.join(repo, 'docs/prd/v2');
  assert.equal(main([root, '--repo', repo, '--no-write'], (l) => logs.push(l)), 0);
  assert.ok(logs.some((l) => l.includes('undefined: F77-REQ-123 (docs/BACKLOG.md:2)')));
  assert.equal(main([root, '--repo', repo, '--no-write', '--check'], () => {}), 1);
});

test('a duplicate definition alone fails --check', () => {
  const repo = fixtureRepo();
  assert.equal(main([path.join(repo, 'docs/prd/v2'), '--repo', repo, '--no-write', '--check'], () => {}), 1);
  fs.writeFileSync(path.join(repo, 'docs/prd/v2/features/F02-account.md'), SPEC_B.replace('| A-REQ-002 | P0 | Splash again, a second home | Given | A |\n', ''));
  assert.equal(main([path.join(repo, 'docs/prd/v2'), '--repo', repo, '--no-write', '--check'], () => {}), 0);
});

test('report mode writes TRACE.md with the headline and is deterministic; the default root prefers docs/prd/v2', () => {
  const repo = fixtureRepo();
  assert.equal(main(['--repo', repo], () => {}), 0);
  const out = path.join(repo, 'docs/TRACE.md');
  const first = fs.readFileSync(out, 'utf8');
  assert.match(first, /node scripts\/trace\.mjs docs\/prd\/v2/);
  assert.match(first, /\| Requirement IDs defined \| 6 \|/);
  assert.match(first, /\| IDs defined in two specs \(fails `--check`\) \| 1 \|/);
  assert.match(first, /\| F01-REQ-001 \| P0 \| WP-F01-01 \| `apps\/mobile\/test\/age-gate\.test\.ts` \|/);
  assert.equal(main(['--repo', repo], () => {}), 0);
  assert.equal(fs.readFileSync(out, 'utf8'), first);
  const m = collect({ repo, docsRoot: path.join(repo, 'docs/prd/v2') });
  assert.equal(renderTrace(m) + '\n', first);
});

const FLOW = `# E2E-17a  comment that names F02-REQ-001 but is not a tag
appId: \${APP_ID}
name: E2E-17a Export
tags:
  - e2e
  - E2E-17
  - p0-nightly
  - F01-REQ-001
  - "A-REQ-001"   # quoted, with a comment
---
- tapOn:
    id: "export.start"
- assertVisible: "B-REQ-099"
`;

test('flowTags reads requirement IDs from the config tags only, not comments or commands', () => {
  assert.deepEqual(flowTags(FLOW).sort(), ['A-REQ-001', 'F01-REQ-001']);
  assert.deepEqual(flowTags('appId: x\n---\n- launchApp\n'), []);
});

test('collect lists Maestro flow tags apart from test titles', () => {
  const repo = fixtureRepo();
  fs.mkdirSync(path.join(repo, 'apps/mobile/e2e/flows'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'apps/mobile/e2e/flows/E2E-17a-export.yaml'), FLOW);
  const m = collect({ repo, docsRoot: path.join(repo, 'docs/prd/v2') });
  const s = summarize(m);
  const splash = m.reqs.find((r) => r.id === 'A-REQ-001');
  assert.deepEqual(splash.tests, []);
  assert.deepEqual(splash.flows, ['apps/mobile/e2e/flows/E2E-17a-export.yaml']);
  assert.equal(s.p0NoTest, 2); // a flow is not a test title: A-REQ-001 and F02-REQ-001 still count
  assert.equal(s.p0NoTestOrFlow, 1); // F02-REQ-001 only
  assert.equal(s.p0FlowOnly, 1);
  assert.equal(s.idsInFlows, 2);
  assert.ok(m.citations.get('A-REQ-001').includes('apps/mobile/e2e/flows/E2E-17a-export.yaml:tags'));
  assert.match(renderTrace(m), /\| A-REQ-001 \| P0 \| WP-F01-01 \| none \| `E2E-17a-export\.yaml` \|/);
});

test('--json prints the headline and the failing IDs, and still fails --check', () => {
  const repo = fixtureRepo();
  const logs = [];
  assert.equal(main([path.join(repo, 'docs/prd/v2'), '--repo', repo, '--no-write', '--json'], (l) => logs.push(l)), 0);
  const j = JSON.parse(logs[0]);
  assert.equal(j.defined, 6);
  assert.deepEqual(j.duplicateIds.map((d) => d.id), ['A-REQ-002']);
  assert.equal(j.wouldFailCheck, true);
  assert.equal(main([path.join(repo, 'docs/prd/v2'), '--repo', repo, '--no-write', '--json', '--check'], () => {}), 1);
});

test('--no-write leaves the tree untouched', () => {
  const repo = fixtureRepo();
  main(['--repo', repo, '--no-write'], () => {});
  assert.ok(!fs.existsSync(path.join(repo, 'docs/TRACE.md')));
});

// --scope b1 (HV2-012): the B1 P0 scope from the release catalog and a ratchet that only shrinks.
const CATALOG = [
  'id,area,title,kind,priority,release,lane,covered_by,steps',
  'RT-1,Launch,Gate,happy,P0,both,device,AL-01,"Gate per F01-REQ-001, then A-REQ-002"',
  'RT-2,Launch,Later build,happy,P0,B2,device,AL-04,Cites F01-REQ-002 only in B2',
  'RT-3,Launch,Minor,happy,P1,B1,device,AL-05,Cites LEGAL-REQ-014 but is P1',
  'RT-4,Launch,No ids,happy,P0,B1,kill,x,"multi\nline, with a comma"',
  '',
].join('\n');

function scopeRepo(baseline) {
  const repo = fixtureRepo({ withV2: false });
  fs.mkdirSync(path.join(repo, 'docs/qa'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'docs/qa/release-test-catalog.csv'), CATALOG);
  if (baseline !== null) fs.writeFileSync(path.join(repo, 'docs/qa/b1-p0-uncited.baseline'), baseline);
  return repo;
}
const scope = (repo, extra = [], logs = []) => main(['--repo', repo, '--no-write', '--scope', 'b1', ...extra], (l) => logs.push(l));

test('parseCsv handles quotes, commas, newlines in fields and CRLF', () => {
  assert.deepEqual(parseCsv('a,"b,c","d ""e"""\r\nx,"y\nz",\n'), [['a', 'b,c', 'd "e"'], ['x', 'y\nz', '']]);
});

test('[HV2-012] b1 scope takes IDs only from P0 rows with release B1 or both', () => {
  const sc = b1ScopeFromCatalog(CATALOG);
  assert.deepEqual(sc.ids, ['A-REQ-002', 'F01-REQ-001']);
  assert.equal(sc.rowsInScope, 2);
  assert.equal(sc.rowsWithoutId, 1);
});

test('[HV2-012] scope lists cited and uncited IDs and never fails without --check', () => {
  const repo = scopeRepo(null);
  const logs = [];
  assert.equal(scope(repo, [], logs), 0);
  assert.ok(logs[0].includes('2 requirement IDs') && logs[0].includes('2 cited by a test title') && logs[0].includes('0 uncited'));
  fs.writeFileSync(path.join(repo, 'apps/mobile/test/age-gate.test.ts'), "it('no id', () => {});\n");
  const l2 = [];
  assert.equal(scope(repo, [], l2), 0);
  assert.ok(l2.includes('  uncited: A-REQ-002') && l2.includes('  uncited: F01-REQ-001'));
});

test('[HV2-012] EG-6: a raised uncited set fails --check, the same set passes, a lowered set passes', () => {
  const repo = scopeRepo('# header\nF01-REQ-001\n');
  fs.writeFileSync(path.join(repo, 'apps/mobile/test/age-gate.test.ts'), "it('no id', () => {});\n");
  const logs = [];
  assert.equal(scope(repo, ['--check'], logs), 1);
  assert.ok(logs.some((l) => l.includes('FAIL: A-REQ-002 is uncited and not in the baseline')));
  fs.writeFileSync(path.join(repo, 'docs/qa/b1-p0-uncited.baseline'), 'A-REQ-002\nF01-REQ-001\n');
  assert.equal(scope(repo, ['--check']), 0);
  fs.writeFileSync(path.join(repo, 'apps/mobile/test/age-gate.test.ts'), "it('[F01-REQ-001] gate', () => {});\n");
  const l3 = [];
  assert.equal(scope(repo, ['--check'], l3), 1, 'a stale baseline line (now cited) fails');
  assert.ok(l3.some((l) => l.includes('FAIL: baseline lists F01-REQ-001')));
  fs.writeFileSync(path.join(repo, 'docs/qa/b1-p0-uncited.baseline'), 'A-REQ-002\n');
  assert.equal(scope(repo, ['--check']), 0, 'deleting the stale line passes');
});

test('[HV2-012] a baseline line for an ID that is cited exits 1 with the exact line to delete', () => {
  const repo = scopeRepo('F01-REQ-001\n');
  const logs = [];
  assert.equal(scope(repo, ['--check'], logs), 1);
  assert.ok(logs.some((l) => l.includes('delete the line "F01-REQ-001"')));
});

test('[HV2-012] a swap (one cited, a different one uncited) still fails --check', () => {
  const repo = scopeRepo('F01-REQ-001\n');
  fs.writeFileSync(path.join(repo, 'apps/mobile/test/age-gate.test.ts'), "it('[F01-REQ-001] gate', () => {});\n");
  fs.writeFileSync(path.join(repo, 'supabase/tests/x.test.mjs'), "check('nothing', true);\n");
  assert.equal(scope(repo, ['--check']), 1);
});

test('[HV2-012] a missing baseline fails --check; --update-baseline writes only when the set shrinks', () => {
  const repo = scopeRepo(null);
  assert.equal(scope(repo, ['--check']), 1);
  fs.writeFileSync(path.join(repo, 'apps/mobile/test/age-gate.test.ts'), "it('no id', () => {});\n");
  assert.equal(scope(repo, ['--update-baseline']), 0);
  assert.deepEqual(parseBaseline(fs.readFileSync(path.join(repo, 'docs/qa/b1-p0-uncited.baseline'), 'utf8')), ['A-REQ-002', 'F01-REQ-001']);
  assert.equal(scope(repo, ['--check']), 0);
  fs.writeFileSync(path.join(repo, 'docs/qa/b1-p0-uncited.baseline'), 'F01-REQ-001\n');
  assert.equal(scope(repo, ['--update-baseline']), 1);
  assert.equal(fs.readFileSync(path.join(repo, 'docs/qa/b1-p0-uncited.baseline'), 'utf8'), 'F01-REQ-001\n');
});

test('ratchet reports added and stale IDs; unknown scope is an error', () => {
  assert.deepEqual(ratchet(['B-REQ-001'], ['A-REQ-001']), { added: ['B-REQ-001'], stale: ['A-REQ-001'] });
  assert.throws(() => main(['--scope', 'b2', '--no-write'], () => {}), /unknown scope/);
});

test('[HV2-012] --scope b1 --check is the ratchet only; duplicate or undefined IDs are the plain --check', () => {
  const repo = scopeRepo('');
  fs.writeFileSync(path.join(repo, 'docs/BACKLOG.md'), 'Also F77-REQ-123.\n');
  assert.equal(scope(repo, ['--check']), 0);
  assert.equal(main(['--repo', repo, '--no-write', '--check'], () => {}), 1);
});

// BL-964 (gate G0): NS ids from the locked cards. The fixture card NS-90 is planted, not real.
test('NS grammar: split, lettered and cross-cutting ids, never a prefix of a longer id', () => {
  assert.deepEqual(nsBracketed('[NS-01-R9a][NX-39-R2] and [NS-07-C28-13], [X4-R1] [FRAME-SLIP]'), ['NS-01-R9a', 'NX-39-R2', 'NS-07-C28-13', 'X4-R1', 'FRAME-SLIP']);
  assert.deepEqual(nsBracketed('[NS-07-G11-1a] [NX-30a-R1] [NS-06-A2b]'), ['NS-07-G11-1a', 'NX-30a-R1', 'NS-06-A2b']);
  assert.deepEqual(nsBracketed('NS-01-R4 unbracketed, [NS-01-R9ab], [NS-1-R2], [XNS-01-R1], [BL-964]'), []);
  assert.deepEqual(nsIds('NS-07-C28-13 is one id; NS-01-R4-x and NS-07-C28-13b2 are none'), ['NS-07-C28-13']);
});

test('nsCited reads backlog shorthand and expands ranges only over defined rows', () => {
  const known = new Set(['NS-01-R37a', 'NS-01-R37b', 'NS-01-R37c', 'NS-02-R1', 'NS-02-R2', 'NS-02-R4', 'NS-07-C28-1', 'NS-07-C28-2', 'NS-07-C28-3', 'NS-07-C5-1']);
  assert.deepEqual(nsCited('NS-01-R37a, R37b and R37c', known).sort(), ['NS-01-R37a', 'NS-01-R37b', 'NS-01-R37c']);
  assert.deepEqual(nsCited('NS-01-R37a to R37c', known).sort(), ['NS-01-R37a', 'NS-01-R37b', 'NS-01-R37c']);
  assert.deepEqual(nsCited('NS-02-R1 to NS-02-R4', known).sort(), ['NS-02-R1', 'NS-02-R2', 'NS-02-R4']);
  assert.deepEqual(nsCited('NS-07-C28-1 to NS-07-C28-3', known).sort(), ['NS-07-C28-1', 'NS-07-C28-2', 'NS-07-C28-3']);
  assert.deepEqual(nsCited('NS-02-R1, P0 (a), R2', known), ['NS-02-R1']);
});

test('nsDefinitions reads acceptance tables only, with priority, device row and journeys', () => {
  const md = ['| Id | Question | Owner |', '|---|---|---|', '| NS-90-Q1 | not a row | qa |', '',
    '| Id | Given, When, Then | Priority | Test title |', '|---|---|---|---|',
    '| NS-90-R1 | Given the device zone (in the device zone), Then J-N9 holds | P0 (a) | `[NS-90-R1] one (device)` |',
    '| NS-90-R2 | Given two phones, Then it syncs (PROPOSED; device) | P1 | `[NS-90-R2] two` (device row S1-204) |',
    '| NS-90-A2 | Split into A2a and A2b | n/a | none |'].join('\n');
  assert.deepEqual(nsDefinitions(md, 'c.md').map((d) => [d.id, d.priority, d.line, d.device, d.journeys.join()]),
    [['NS-90-R1', 'P0', 7, '', 'J-N9'], ['NS-90-R2', 'P1', 8, 'device row S1-204', ''], ['NS-90-A2', 'n/a', 9, '', '']]);
});

function nsRepo() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-ns-'));
  const w = (p, t) => { fs.mkdirSync(path.dirname(path.join(repo, p)), { recursive: true }); fs.writeFileSync(path.join(repo, p), t); };
  const head = '| Id | Given, When, Then | Priority | Test title |\n|---|---|---|---|\n';
  const r = (id, p, extra = '') => `| ${id} | Given Asha, Then it holds | ${p} | \`[${id}] title\`${extra} |\n`;
  w('docs/prd/PRD.md', '# PRD\n');
  w('docs/product/prd/01-demo.md', `# NS-90 Demo\n\n${head}${r('NS-90-R1', 'P0 (a)')}${r('NS-90-R2', 'P0 (a)')}${r('NS-90-R3', 'P0 (a)')}${r('NS-90-R4a', 'P0 (c)')}` +
    `${r('NS-90-R5', 'P0 (a)', ' (device row S1-204)')}${r('NS-90-R6', 'P0 (a)')}${r('NS-90-R7', 'P1')}| NS-90-A2 | Split | n/a | none |\n${r('NS-90-C28-1', 'P0 (b)')}${r('NS-90-C28-13', 'P0 (b)')}`);
  w('docs/product/prd/15-review.md', `${head}${r('NS-90-R50', 'P0 (a)')}`);
  w('docs/product/prd/14-test-plan.md', '# Plan\n\n## 4. Journeys\n\n| Id | Journey | Cards | Priority | Device |\n|---|---|---|---|---|\n| J-N9 | One | NS-90 | P0 (loss) | yes |\n| J-N10 | Two | NS-90 | P1 | no |\n\n' +
    '## 7. The P0 register\n\n| Card | P0 rows | Reasons |\n|---|---|---|\n| NS-90 | NS-90-R1 to R4a, R5, R7, NS-90-C28-13 | (a) |\n\nCross-cutting: `[X4-R1]` and `[FRAME-SLIP]`.\n\n## 8. After\n');
  w('docs/BACKLOG.md', '#### BL-100 Demo\n- Satisfies: NS-90-R1 to R3, NS-90-C28-13.\n\n#### BL-101 Other\n- Satisfies: none.\n');
  w('apps/mobile/test/a.test.ts', ["it('[NS-90-R1][NX-39-R2] found', () => {});", "it.skip('[NS-90-R2] skipped', () => {});",
    "it('names a row in its body only', () => { /* [NS-90-R3] */ });", "it('[NS-90-R4a][stand-in] stand-in', () => {});",
    "test('[NS-90-C28-13] found, C28-1 is not', () => {});", "it('[NS-90-R99] typo', () => {});", "it('[X4-R1] second account', () => {});",
    "it('[NS-90-A2] split parent', () => {});", "it('NS-90-R5 unbracketed', () => {});",
    "test('[NS-90-C28-1] option form', { skip: true }, () => {});", "it('[NS-90-R7] keeps the .todo list', () => {});"].join('\n'));
  w('apps/mobile/e2e-web/j09.flow.ts', "test('[J-N9][NS-90-R6] journey', async () => {});\n");
  return repo;
}

test('[BL-964] planted card: the NS report finds what is tested and misses nothing untested', () => {
  const repo = nsRepo();
  const ns = collectNs({ repo, register: path.join(repo, 'docs/product/prd/14-test-plan.md') });
  const by = Object.fromEntries([...ns.p0, ...ns.cross].map((r) => [r.id, r]));
  assert.deepEqual(Object.fromEntries(Object.entries(by).map(([id, r]) => [id, r.status])), {
    'NS-90-R1': 'tested', 'NS-90-R2': 'untested', 'NS-90-R3': 'untested', 'NS-90-R4a': 'partial', 'NS-90-R5': 'device',
    'NS-90-R6': 'journey', 'NS-90-C28-1': 'untested', 'NS-90-C28-13': 'tested', 'X4-R1': 'tested', 'FRAME-SLIP': 'untested',
  });
  assert.deepEqual(by['NS-90-R1'].tests, ['apps/mobile/test/a.test.ts:1']);
  assert.deepEqual(by['NS-90-C28-13'].tests, ['apps/mobile/test/a.test.ts:5']);
  assert.equal(by['NS-90-R5'].device, 'device row S1-204');
  assert.deepEqual(by['NS-90-R6'].journeys, ['J-N9 apps/mobile/e2e-web/j09.flow.ts:1']);
  assert.deepEqual(['R1', 'R2', 'R3', 'R4a', 'C28-13'].map((x) => by[`NS-90-${x}`].backlog.join()), ['BL-100', 'BL-100', 'BL-100', '', 'BL-100']);
  assert.deepEqual([ns.listedNotP0, ns.p0NotListed], [['NS-90-R7'], ['NS-90-R6', 'NS-90-C28-1']]);
  assert.deepEqual([ns.strays.map((x) => x.id), ns.splitCited.map((x) => x.id), ns.skipped, ns.nxCited], [['NS-90-R99'], ['NS-90-A2'], 2, ['NX-39-R2']]);
  assert.deepEqual(ns.journeys.map((j) => [j.id, j.priority, j.at.join()]), [['J-N9', 'P0', 'apps/mobile/e2e-web/j09.flow.ts:1'], ['J-N10', 'P1', '']]);
  const s = summarizeNs(ns);
  assert.deepEqual([s.cards, s.rows, s.p0, s.tested, s.partial, s.journey, s.device, s.untested, s.p0NoBacklog], [1, 10, 8, 2, 1, 1, 1, 3, 4]);
});

test('[BL-964] the NS report is report mode: it renders, logs, and never fails --check', () => {
  const repo = nsRepo();
  const out = [];
  assert.equal(main(['--check', '--repo', repo, '--register', 'docs/product/prd/14-test-plan.md', 'docs/prd'], (l) => out.push(l)), 0);
  assert.match(out.join('\n'), /trace NS \(docs\/product\/prd\/14-test-plan\.md\): 10 acceptance rows in 1 cards, 8 P0: 2 tested, 1 partial, 1 journey, 1 device, 3 untested/);
  assert.match(out.join('\n'), /NS id defined nowhere: NS-90-R99 \(apps\/mobile\/test\/a\.test\.ts:6\)/);
  const md = fs.readFileSync(path.join(repo, 'docs/TRACE.md'), 'utf8');
  assert.match(md, /\| NS-90-R1 \| tested \| `apps\/mobile\/test\/a\.test\.ts:1` \|/);
  assert.match(md, /\| NS-90-R3 \| untested \|/);
  assert.throws(() => main(['--no-write', '--repo', repo, '--register', 'docs/product/prd/none.md', 'docs/prd'], () => {}), /no register/);
  const logged = [];
  assert.equal(main(['--no-write', '--repo', repo, '--register', 'docs/product/prd', 'docs/prd'], (l) => logged.push(l)), 0);
  assert.match(logged.join('\n'), /trace NS skipped: EISDIR/);
  fs.rmSync(path.join(repo, 'docs/product'), { recursive: true });
  assert.equal(main(['--no-write', '--repo', repo, 'docs/prd'], (l) => out.push(l)), 0);
});

test('[BL-964] cards 19, 21 and 27 are read; other cards above 12 are not', () => {
  const repo = nsRepo();
  const head = '| Id | Given, When, Then | Priority | Test title |\n|---|---|---|---|\n';
  const row = (id, p) => `| ${id} | Given Asha, Then it holds | ${p} | \`[${id}] title\` |\n`;
  const w = (p, t) => fs.writeFileSync(path.join(repo, 'docs/product/prd', p), t);
  w('19-first-letter.md', `# NS-91\n\n${head}${row('NS-91-R1', 'P0 (a)')}${row('NS-91-R2', 'P1')}`);
  w('21-days.md', `# NS-92\n\n${head}${row('NS-92-R1', 'P0 (a)')}`);
  w('27-media.md', `# NS-93\n\n${head}${row('NS-93-R1', 'P0 (a)')}`);
  w('22-final.md', `${head}${row('NS-94-R1', 'P0 (a)')}`);
  fs.mkdirSync(path.join(repo, 'apps/mobile/test'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'apps/mobile/test/b.test.ts'), "it('[NS-91-R1] found', () => {});\nit('[NS-92-R1] found', () => {});\n");
  const ns = collectNs({ repo, register: path.join(repo, 'docs/product/prd/14-test-plan.md') });
  const by = Object.fromEntries(ns.p0.map((r) => [r.id, r.status]));
  assert.equal(by['NS-91-R1'], 'tested');
  assert.equal(by['NS-92-R1'], 'tested');
  assert.equal(by['NS-93-R1'], 'untested');
  assert.equal('NS-91-R2' in by, false, 'P1 row is not in the P0 list');
  assert.equal('NS-94-R1' in by, false, 'card 22 is not an acceptance card');
  assert.equal('NS-90-R50' in by, false, 'card 15 is still not read');
  assert.equal(summarizeNs(ns).cards, 4);
});

// BL-964 ratchet: the NS rows that may be open are listed in a baseline that only shrinks.
const NS_ARGS = (repo, more = []) => ['--check', '--no-write', '--repo', repo, '--register', 'docs/product/prd/14-test-plan.md', ...more, 'docs/prd'];
const nsBase = (repo, ids) => { fs.mkdirSync(path.join(repo, 'docs/ops'), { recursive: true }); fs.writeFileSync(path.join(repo, 'docs/ops/trace-ns-baseline.txt'), `# header\n${ids.join('\n')}\n`); };
const OPEN = ['NS-90-C28-1', 'NS-90-R2', 'NS-90-R3', 'NS-90-R99'];

test('[BL-964] nsOpen lists the untested P0 rows and the cited ids no card defines, and nothing else', () => {
  const repo = nsRepo();
  const ns = collectNs({ repo, register: path.join(repo, 'docs/product/prd/14-test-plan.md') });
  assert.deepEqual(nsOpen(ns), ['NS-90-C28-1', 'NS-90-R2', 'NS-90-R3', 'NS-90-R99', 'FRAME-SLIP'].sort((a, b) => a.localeCompare(b, 'en', { numeric: true })));
});

test('[BL-964] nsRatchet: a new open id fails, a listed one passes, a cited one is only stale', () => {
  const T = new Set(['NS-01-R2']);
  assert.deepEqual(nsRatchet(['NS-01-R1', 'NS-01-R2'], ['NS-01-R1', 'NS-01-R2'], null), { added: [], stale: [], gone: [], grown: [] });
  assert.deepEqual(nsRatchet(['NS-01-R1', 'NS-01-R9'], ['NS-01-R1', 'NS-01-R2'], null, T), { added: ['NS-01-R9'], stale: ['NS-01-R2'], gone: [], grown: [] });
  assert.deepEqual(nsRatchet(['NS-01-R1'], ['NS-01-R1', 'NS-01-R2'], null), { added: [], stale: [], gone: ['NS-01-R2'], grown: [] });
  assert.deepEqual(nsRatchet([], ['NS-01-R1', 'NS-01-R2'], ['NS-01-R1'], T), { added: [], stale: ['NS-01-R2'], gone: ['NS-01-R1'], grown: ['NS-01-R2'] });
});

test('[BL-964] --check passes when every open NS id is in the baseline, and lists them in report mode', () => {
  const repo = nsRepo();
  nsBase(repo, [...OPEN, 'FRAME-SLIP']);
  const out = [];
  assert.equal(main(NS_ARGS(repo), (l) => out.push(l)), 0);
  assert.doesNotMatch(out.join('\n'), /FAIL/);
});

test('[BL-964] --check fails and names a P0 row that is untested and not in the baseline', () => {
  const repo = nsRepo();
  nsBase(repo, OPEN);
  const out = [];
  assert.equal(main(NS_ARGS(repo), (l) => out.push(l)), 1);
  assert.match(out.join('\n'), /FAIL: FRAME-SLIP is open and not in docs\/ops\/trace-ns-baseline\.txt/);
});

test('[BL-964] --check fails on a malformed or undefined bracketed id that is not in the baseline', () => {
  const repo = nsRepo();
  nsBase(repo, ['NS-90-C28-1', 'NS-90-R2', 'NS-90-R3', 'FRAME-SLIP']);
  const out = [];
  assert.equal(main(NS_ARGS(repo), (l) => out.push(l)), 1);
  assert.match(out.join('\n'), /FAIL: NS-90-R99 is open/);
});

test('[BL-964] a new test title cites a row: the row leaves the open set, and a stale line only reports', () => {
  const repo = nsRepo();
  fs.appendFileSync(path.join(repo, 'apps/mobile/test/a.test.ts'), "\nit('[NS-90-R2] now tested', () => {});\n");
  nsBase(repo, [...OPEN, 'FRAME-SLIP']);
  const out = [];
  assert.equal(main(NS_ARGS(repo), (l) => out.push(l)), 0);
  assert.match(out.join('\n'), /stale baseline line: NS-90-R2/);
});

test('[BL-964] a baseline that gained an id against the base copy fails; an equal or smaller one passes', () => {
  const repo = nsRepo();
  nsBase(repo, [...OPEN, 'FRAME-SLIP']);
  const base = path.join(repo, 'base.txt');
  fs.writeFileSync(base, OPEN.join('\n') + '\n');
  const out = [];
  assert.equal(main(NS_ARGS(repo, ['--ns-base', base]), (l) => out.push(l)), 1);
  assert.match(out.join('\n'), /FAIL: FRAME-SLIP was added to the baseline/);
  fs.writeFileSync(base, [...OPEN, 'FRAME-SLIP', 'NS-90-R1'].join('\n') + '\n');
  assert.equal(main(NS_ARGS(repo, ['--ns-base', base]), () => {}), 0);
});

test('[BL-964] a named baseline that is missing fails --check; with none anywhere --check stays as before', () => {
  const repo = nsRepo();
  assert.equal(main(NS_ARGS(repo, ['--ns-baseline', 'docs/ops/none.txt']), () => {}), 1);
  assert.equal(main(NS_ARGS(repo), () => {}), 0);
  assert.equal(main(['--no-write', '--repo', repo, '--register', 'docs/product/prd/14-test-plan.md', '--ns-baseline', 'docs/ops/none.txt', 'docs/prd'], () => {}), 0, 'report mode never fails');
});

test('[BL-964] --update-ns-baseline writes the open set once and then only when it shrinks', () => {
  const repo = nsRepo();
  const file = path.join(repo, 'docs/ops/trace-ns-baseline.txt');
  assert.equal(main(['--no-write', '--repo', repo, '--register', 'docs/product/prd/14-test-plan.md', '--update-ns-baseline', 'docs/prd'], () => {}), 0);
  assert.equal(parseBaseline(fs.readFileSync(file, 'utf8')).length, 5);
  assert.equal(main(NS_ARGS(repo), () => {}), 0);
  fs.writeFileSync(file, '# h\nNS-90-R2\n');
  assert.equal(main(['--no-write', '--repo', repo, '--register', 'docs/product/prd/14-test-plan.md', '--update-ns-baseline', 'docs/prd'], () => {}), 1);
  assert.equal(fs.readFileSync(file, 'utf8'), '# h\nNS-90-R2\n');
});

test('[BL-964] deleting the baseline while the base branch has it fails --check', () => {
  const repo = nsRepo();
  const base = path.join(repo, 'base.txt');
  fs.writeFileSync(base, OPEN.join('\n') + '\n');
  const out = [];
  assert.equal(main(NS_ARGS(repo, ['--ns-base', base]), (l) => out.push(l)), 1);
  assert.match(out.join('\n'), /is missing but the base branch has it/);
  fs.rmSync(base);
  assert.equal(main(NS_ARGS(repo, ['--ns-base', base]), () => {}), 0, 'absent on both sides is the first PR that adds it');
});

const REG = 'docs/product/prd/14-test-plan.md';
const NS_FILE = 'docs/product/prd/01-demo.md';

test('[BL-964] a baseline line whose card row was removed fails --check and names the update command', () => {
  const repo = nsRepo();
  nsBase(repo, [...OPEN, 'FRAME-SLIP']);
  const card = path.join(repo, NS_FILE);
  fs.writeFileSync(card, fs.readFileSync(card, 'utf8').split('\n').filter((l) => !l.startsWith('| NS-90-R2 ')).join('\n'));
  const out = [];
  assert.equal(main(NS_ARGS(repo), (l) => out.push(l)), 1);
  assert.match(out.join('\n'), /FAIL: NS-90-R2 is in docs\/ops\/trace-ns-baseline\.txt but is no longer an open P0 row.*--update-ns-baseline/);
});

test('[BL-964] a baseline line whose row was lowered from P0 to P1 fails --check', () => {
  const repo = nsRepo();
  nsBase(repo, [...OPEN, 'FRAME-SLIP']);
  const card = path.join(repo, NS_FILE);
  fs.writeFileSync(card, fs.readFileSync(card, 'utf8').replace('| NS-90-R3 | Given Asha, Then it holds | P0 (a)', '| NS-90-R3 | Given Asha, Then it holds | P1'));
  const out = [];
  assert.equal(main(NS_ARGS(repo), (l) => out.push(l)), 1);
  assert.match(out.join('\n'), /FAIL: NS-90-R3 is in .* no longer an open P0 row/);
});

test('[BL-964] a row closed by a test stays a stale note, and --update-ns-baseline then clears the failures', () => {
  const repo = nsRepo();
  nsBase(repo, [...OPEN, 'FRAME-SLIP']);
  fs.appendFileSync(path.join(repo, 'apps/mobile/test/a.test.ts'), "\nit('[NS-90-R2] now tested', () => {});\n");
  const out = [];
  assert.equal(main(NS_ARGS(repo), (l) => out.push(l)), 0);
  assert.doesNotMatch(out.join('\n'), /FAIL/);
  const card = path.join(repo, NS_FILE);
  fs.writeFileSync(card, fs.readFileSync(card, 'utf8').split('\n').filter((l) => !l.startsWith('| NS-90-R3 ')).join('\n'));
  assert.equal(main(NS_ARGS(repo), () => {}), 1);
  assert.equal(main(['--no-write', '--repo', repo, '--register', REG, '--update-ns-baseline', 'docs/prd'], () => {}), 0);
  assert.equal(main(NS_ARGS(repo), () => {}), 0);
});

test('[BL-964] a baseline with a base copy named but the base file missing fails --check', () => {
  const repo = nsRepo();
  nsBase(repo, [...OPEN, 'FRAME-SLIP']);
  const out = [];
  assert.equal(main(NS_ARGS(repo, ['--ns-base', path.join(repo, 'no-base.txt')]), (l) => out.push(l)), 1);
  assert.match(out.join('\n'), /--ns-base file missing/);
});

test('[BL-964] baseline lines are read with CRLF, indentation and comments', () => {
  const repo = nsRepo();
  fs.mkdirSync(path.join(repo, 'docs/ops'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'docs/ops/trace-ns-baseline.txt'), `# c\r\n  ${OPEN.join('  \r\n\t')}  \r\n  FRAME-SLIP\r\n\r\n`);
  const out = [];
  assert.equal(main(NS_ARGS(repo), (l) => out.push(l)), 0, out.join('\n'));
});

test('[CODE-R02] card 28 is read: three-digit row ids, a Pri header, and a repo without card 28', () => {
  const mk = (withCard) => {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-ns28-'));
    const w = (p, t) => { fs.mkdirSync(path.dirname(path.join(repo, p)), { recursive: true }); fs.writeFileSync(path.join(repo, p), t); };
    w('docs/prd/PRD.md', '# PRD\n');
    w('docs/product/prd/14-test-plan.md', '# Plan\n');
    if (withCard) {
      w('docs/product/prd/28-demo.md', '# NS-91 Demo\n\n| Id | Given / When / Then | Layer | Pri | Phase |\n|---|---|---|---|---|\n' +
        '| NS-91-R9 | Given Asha, Then it holds | L0 | P0 (a) | 1 |\n| NS-91-R100 | Given Asha, Then it holds | L0 | P0 (b) | 1 |\n| NS-91-R301 | Given Asha, Then it holds | L1 | P1 | 1 |\n');
      w('apps/mobile/test/m.test.ts', "it('[NS-91-R100] three digits', () => {});\n");
    }
    return repo;
  };
  const register = (repo) => path.join(repo, 'docs/product/prd/14-test-plan.md');
  const ns = collectNs({ repo: mk(true), register: register(mk(true)) });
  assert.deepEqual(ns.p0.map((r) => [r.id, r.status]).sort(), [['NS-91-R100', 'tested'], ['NS-91-R9', 'untested']]);
  assert.equal(summarizeNs(ns).rows, 3);
  assert.deepEqual(nsIds('NS-91-R301 and NS-91-R1000'), ['NS-91-R301']);
  const none = mk(false);
  assert.equal(summarizeNs(collectNs({ repo: none, register: register(none) })).cards, 0);
});

test('walk skips .claude/worktrees and a top-level wt-* directory, and reads wt-* anywhere deeper (a PR cannot hide a test)', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-walk-'));
  try {
    for (const rel of ['apps/a.test.ts', '.claude/worktrees/x/apps/a.test.ts', 'wt-asha/apps/a.test.ts', 'sub/wt-1/b.test.ts', 'apps/wt-x/e.test.ts', '.claude/other/c.test.ts', 'worktrees/d.test.ts']) {
      fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
      fs.writeFileSync(path.join(root, rel), '');
    }
    const found = walk(root, (p) => p.endsWith('.test.ts'), [], root).map((p) => path.relative(root, p).split(path.sep).join('/'));
    assert.deepEqual(found, ['.claude/other/c.test.ts', 'apps/a.test.ts', 'apps/wt-x/e.test.ts', 'sub/wt-1/b.test.ts', 'worktrees/d.test.ts']);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
