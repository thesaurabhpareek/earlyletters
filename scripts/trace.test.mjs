// Unit tests for scripts/trace.mjs (BL-002). Run: node --test scripts/trace.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  extractIds, bracketedIds, splitRow, parseTables, sectionLines, v2Definitions, v2WorkPackages,
  legacyDefinitions, retiredIds, testTitles, flowTags, collect, summarize, renderTrace, main, cmpId,
  parseCsv, b1ScopeFromCatalog, parseBaseline, ratchet,
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
  assert.equal(scope(repo, ['--check'], l3), 0);
  assert.ok(l3.some((l) => l.includes('baseline lists F01-REQ-001')));
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
