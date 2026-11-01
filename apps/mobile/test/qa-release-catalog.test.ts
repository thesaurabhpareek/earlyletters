/**
 * S19 (QA): the release test catalog (docs/qa/RELEASE_TEST_PLAN.md, rows in
 * scripts/qa/release-catalog.rows.mjs) stays honest on every `npm test`:
 * ids are unique, every field is one of its allowed values, the CSV matches the rows,
 * and every existing case a row cites (E2E, J, S1, S2, TF, DL, B1, B2, AL, the ASC
 * D-n checks, D-nnn decisions) exists in the file that owns it. A row cannot claim
 * coverage from a case that was renamed or never written.
 * SR-, IMP-, MOB- and CR- ids live in Project docs or reviews outside the repo and are
 * not checked here.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROWS } from '../../../scripts/qa/release-catalog.rows.mjs';
import { COLUMNS, CSV_PATH, toCsv } from '../../../scripts/qa/release-catalog.mjs';

const ROOT = join(__dirname, '..', '..', '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
const rows = ROWS as string[][];

const ENUMS: Record<string, string[]> = {
  kind: ['happy', 'unhappy', 'error', 'edge', 'a11y', 'display', 'perf', 'privacy', 'compliance', 'upgrade', 'ops'],
  priority: ['P0', 'P1', 'P2'],
  release: ['B1', 'B2', 'both'],
  lane: ['unit', 'web', 'maestro', 'kill', 'device', 'testflight', 'production'],
  env: ['local', 'sim', 'tf-build1', 'tf-build2-staging', 'sandbox', 'staging', 'production'],
  status: ['covered', 'automated', 'planned', 'partial', 'gap', 'stale'],
};

describe('[S19] release test catalog', () => {
  it('has unique, well formed ids and 13 fields per row', () => {
    const ids = rows.map((r) => r[0]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of rows) {
      expect(r, r[0]).toHaveLength(COLUMNS.length);
      expect(r[0]).toMatch(/^RT-[A-Z0-9]+-\d{2}$/);
      for (const v of r) expect(v.trim(), `${r[0]} has an empty field`).not.toBe('');
    }
  });

  it('uses only the allowed values', () => {
    for (const r of rows) {
      for (const [col, allowed] of Object.entries(ENUMS)) {
        expect(allowed, `${r[0]} ${col}=${r[COLUMNS.indexOf(col)]}`).toContain(r[COLUMNS.indexOf(col)]);
      }
    }
  });

  it('marks a row covered only when it cites what covers it', () => {
    for (const r of rows.filter((x) => x[10] === 'covered')) expect(r[9], r[0]).not.toBe('none');
  });

  it('writes the CSV from the rows (run node scripts/qa/release-catalog.mjs)', () => {
    expect(readFileSync(CSV_PATH, 'utf8')).toBe(toCsv());
  });

  it('keeps the house text rules', () => {
    expect(read('docs/qa/release-test-catalog.csv')).not.toMatch(new RegExp('[' + [0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026].map((c) => String.fromCharCode(c)).join('') + ']'));
  });

  it('cites only existing cases', () => {
    const flows = readdirSync(join(ROOT, 'apps/mobile/e2e/flows')).join(' ');
    const journeys = read('docs/release/journey/INDEX.md');
    const device = read('docs/qa/DEVICE_TEST_PLAN.md');
    const alpha = read('docs/qa/ALPHA_GO_NO_GO.md');
    const asc = read('docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md');
    const decisions = read('docs/DECISIONS.md');
    const sheets = readdirSync(join(ROOT, 'docs/qa/run-sheets')).join(' ');
    const missing: string[] = [];
    const need = (ok: boolean, row: string, ref: string) => ok || missing.push(`${row}: ${ref}`);

    for (const r of rows) {
      const cited = r[9];
      for (const m of cited.matchAll(/\bE2E-(\d{2})\b/g)) need(flows.includes(`E2E-${m[1]}`), r[0], m[0]);
      for (const m of cited.matchAll(/\bJ(\d{2})\b/g)) need(journeys.includes(`## J${m[1]} `), r[0], m[0]);
      for (const m of cited.matchAll(/\b(S1|S2|TF|DL)-(\d{2})\b/g)) {
        const [a, b] = [Number(m[2]), m[1]];
        // S2-01 to S2-12 and S2-18 to S2-21 are defined together in one heading.
        const grouped = b === 'S2' && ((a >= 1 && a <= 12) || (a >= 18 && a <= 21));
        need(grouped ? device.includes(m[0]) || device.includes('S2-01 to S2-12') : device.includes(`### ${m[0]} `), r[0], m[0]);
      }
      for (const m of cited.matchAll(/\bB1-01\b/g)) need(device.includes(`### ${m[0]} `), r[0], m[0]);
      for (const m of cited.matchAll(/\b(B[12])-(\d{1,2})\b/g)) {
        if (m[0] === 'B1-01') continue;
        need(alpha.includes(`| ${m[0]} |`), r[0], m[0]);
      }
      for (const m of cited.matchAll(/\bAL-(\d{2})\b/g)) need(sheets.includes(`${m[0]}-`), r[0], m[0]);
      for (const m of cited.matchAll(/\bD-(\d{1,2}b?)\b/g)) need(asc.includes(`| ${m[0]} |`), r[0], m[0]);
      for (const m of cited.matchAll(/\bD-(\d{3})\b/g)) need(decisions.includes(`### ${m[0]} `), r[0], m[0]);
      for (const m of cited.matchAll(/\bP-(\d{2})\b/g)) need(device.includes(`| ${m[0]} |`), r[0], m[0]);
    }
    expect(missing).toEqual([]);
  });
});
