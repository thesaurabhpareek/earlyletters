// Unit tests for scripts/trace.mjs (BL-002). Run: node --test scripts/trace.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  extractIds, bracketedIds, splitRow, parseTables, sectionLines, v2Definitions, v2WorkPackages,
  legacyDefinitions, retiredIds, testTitles, collect, summarize, renderTrace, main,
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

test('--no-write leaves the tree untouched', () => {
  const repo = fixtureRepo();
  main(['--repo', repo, '--no-write'], () => {});
  assert.ok(!fs.existsSync(path.join(repo, 'docs/TRACE.md')));
});
