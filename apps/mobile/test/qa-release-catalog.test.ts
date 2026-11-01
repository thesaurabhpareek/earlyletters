/**
 * S19 (QA): the release test catalog (docs/qa/RELEASE_TEST_PLAN.md, rows in
 * scripts/qa/release-catalog.rows.mjs) stays honest on every `npm test`.
 * - ids are unique and every field is one of its allowed values;
 * - the CSV matches the rows;
 * - every `covered_by` token is either a case id checked against the file that owns it
 *   (E2E, J and J steps, S1, S2, TF, DL, V, B1, B2, AL, P, the ASC D-n checks, D-nnn
 *   decisions), a repo path that exists, or an id from an allow-listed family that lives
 *   outside the repo or in specs (SR-, IMP-, MOB-, CR-, C-NFR-, F##-REQ-, LEGAL-REQ-,
 *   PRD-REQ-, #n). Anything else fails, so a row cannot claim coverage from a case that
 *   was renamed, never written, or named only in prose;
 * - a covered row cites a test file or workflow, an automated row cites one or a journey.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROWS } from '../../../scripts/qa/release-catalog.rows.mjs';
import { COLUMNS, CSV_PATH, toCsv } from '../../../scripts/qa/release-catalog.mjs';

const ROOT = join(__dirname, '..', '..', '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
const rows = ROWS as string[][];
const col = (r: string[], c: string) => r[COLUMNS.indexOf(c)];

const ENUMS: Record<string, string[]> = {
  kind: ['happy', 'unhappy', 'error', 'edge', 'a11y', 'display', 'perf', 'privacy', 'compliance', 'upgrade', 'ops'],
  priority: ['P0', 'P1', 'P2'],
  release: ['B1', 'B2', 'both'],
  lane: ['unit', 'web', 'maestro', 'kill', 'device', 'testflight', 'production'],
  env: ['local', 'sim', 'tf-build1', 'tf-build2-staging', 'sandbox', 'staging', 'production'],
  status: ['covered', 'automated', 'planned', 'partial', 'gap', 'stale', 'decision'],
};

const BANNED = new RegExp('[' + [0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026].map((c) => String.fromCharCode(c)).join('') + ']');
const ALLOWED_FAMILY = /^(SR-[A-Z]-\d{2}|IMP-\d+|MOB-\d+|CR-\d+|C-NFR-\d{3}|F\d{2}-REQ-\d{3}|LEGAL-REQ-\d{3}|PRD-REQ-\d{3}|#\d+|none)$/;
const PATH = /^[\w.@-]+(\/[\w.@()[\]-]+)+\/?$/;

/** Splits a covered_by cell into tokens; "S1-23 V-06" is two ids. */
function tokens(cell: string): string[] {
  return cell
    .split(';')
    .map((t) => t.trim())
    .flatMap((t) => (PATH.test(t) ? [t] : t.split(/\s+/)))
    .filter(Boolean);
}

type Kind = 'id' | 'path' | 'family' | null;

function makeResolver(): (t: string) => Kind {
  const flows = readdirSync(join(ROOT, 'apps/mobile/e2e/flows'));
  const journeys = read('docs/release/journey/INDEX.md');
  const device = read('docs/qa/DEVICE_TEST_PLAN.md');
  const alpha = read('docs/qa/ALPHA_GO_NO_GO.md');
  const asc = read('docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md');
  const decisions = read('docs/DECISIONS.md');
  const sheets = readdirSync(join(ROOT, 'docs/qa/run-sheets'));
  const s2Map = device.slice(device.indexOf('### S2-01 to S2-12'), device.indexOf('### S2-13'));

  return (t: string): Kind => {
    let m: RegExpMatchArray | null;
    if ((m = t.match(/^E2E-(\d{2})([a-z]?)$/))) {
      const [, n, s] = m;
      return flows.some((f) => (s ? f.startsWith(`E2E-${n}${s}-`) : f.startsWith(`E2E-${n}-`) || /^[a-z]-/.test(f.slice(`E2E-${n}`.length)) && f.startsWith(`E2E-${n}`))) ? 'id' : null;
    }
    if ((m = t.match(/^J(\d{2})$/))) return journeys.includes(`## J${m[1]} `) ? 'id' : null;
    if (/^J\d{2}-\d{2}$/.test(t)) return journeys.includes(`| ${t} |`) ? 'id' : null;
    if ((m = t.match(/^S2-(\d{2})$/))) {
      const n = Number(m[1]);
      if ((n >= 1 && n <= 12) || (n >= 18 && n <= 21)) return new RegExp(`\\b${t} = `).test(s2Map) ? 'id' : null;
      return device.includes(`### ${t} `) ? 'id' : null;
    }
    if (/^(S1|TF|DL)-\d{2}$/.test(t) || t === 'B1-01') return device.includes(`### ${t} `) ? 'id' : null;
    if (/^V-\d{2}$/.test(t)) return device.includes(`**${t} `) ? 'id' : null;
    if (/^P-\d{2}$/.test(t)) return device.includes(`| ${t} |`) ? 'id' : null;
    if (/^B[12]-\d{1,2}$/.test(t)) return alpha.includes(`| ${t} |`) ? 'id' : null;
    if (/^AL-\d{2}$/.test(t)) return sheets.some((f) => f.startsWith(`${t}-`)) ? 'id' : null;
    if (/^D-\d{1,2}b?$/.test(t)) return asc.includes(`| ${t} |`) ? 'id' : null;
    if (/^D-\d{3}$/.test(t)) return decisions.includes(`### ${t} `) ? 'id' : null;
    if (ALLOWED_FAMILY.test(t)) return 'family';
    if (PATH.test(t)) return existsSync(join(ROOT, t)) ? 'path' : null;
    return null;
  };
}

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
      for (const [c, allowed] of Object.entries(ENUMS)) expect(allowed, `${r[0]} ${c}=${col(r, c)}`).toContain(col(r, c));
    }
  });

  it('writes the CSV from the rows (run node scripts/qa/release-catalog.mjs)', () => {
    expect(readFileSync(CSV_PATH, 'utf8')).toBe(toCsv());
  });

  it('keeps the house text rules in the CSV and the plan', () => {
    expect(read('docs/qa/release-test-catalog.csv')).not.toMatch(BANNED);
    expect(read('docs/qa/RELEASE_TEST_PLAN.md')).not.toMatch(BANNED);
  });

  it('cites only cases, paths and ids that resolve', () => {
    const resolve = makeResolver();
    const bad: string[] = [];
    for (const r of rows) for (const t of tokens(col(r, 'covered_by'))) if (!resolve(t)) bad.push(`${r[0]}: ${t}`);
    expect(bad).toEqual([]);
  });

  it('backs covered rows with a test or workflow, and automated rows with a test or a journey', () => {
    const resolve = makeResolver();
    const bad: string[] = [];
    for (const r of rows) {
      const ts = tokens(col(r, 'covered_by'));
      const status = col(r, 'status');
      if (status === 'covered' && !ts.some((t) => resolve(t) === 'path')) bad.push(`${r[0]} covered without a test or workflow path`);
      if (status === 'automated' && !ts.some((t) => resolve(t) === 'path' || /^J\d{2}(-\d{2})?$/.test(t))) bad.push(`${r[0]} automated without a test or journey`);
      if (status !== 'gap' && status !== 'decision' && ts.every((t) => t === 'none')) bad.push(`${r[0]} is ${status} but cites nothing`);
    }
    expect(bad).toEqual([]);
  });

  it('refuses a planted bad citation (self-check of the resolver)', () => {
    const resolve = makeResolver();
    for (const t of ['E2E-99b', 'E2E-16', 'E2E-01c', 'S1-99', 'D-999', 'V-99', 'apps/mobile/test/nope.test.ts', 'plan.ts']) {
      expect(resolve(t), t).toBeNull();
    }
    for (const t of ['E2E-01', 'E2E-01a', 'E2E-13c', 'J11-05', 'S2-07', 'V-06', '.github/workflows/ci.yml', 'SR-C-04', '#480']) {
      expect(resolve(t), t).not.toBeNull();
    }
  });
});
