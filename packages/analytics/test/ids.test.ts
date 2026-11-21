/**
 * ER-B01 (BL-1254): the id registry. Self-tests for V4 (a basics id must be
 * registered with an IA-FINAL id and an area) and V16 (at most 300 ids per
 * kind), plus the seed: the 29 routes of routes.ts and the IA-FINAL extras.
 * Fixtures: the fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AREAS,
  ID_KIND_CAP,
  ID_KINDS,
  ID_MAX_LENGTH,
  ID_ROWS,
  IA_ID,
  idProblems,
  idsOfKind,
  isRegisteredId,
  type IdKind,
  type IdRow,
} from '../src/ids';
import { IDS_DOC_PATH, renderIdsDoc } from '../src/plan-doc';
import { ROUTE_MAP } from '../src/routes';
import { ROUTE } from '../src/values';

const ROOT = resolve(__dirname, '../../..');
const ok = (over: Partial<IdRow> = {}): IdRow => ({ id: 'home_speak', kind: 'control', area: 'capture', ia: 'A-S01', ...over });
const many = (kind: IdKind, n: number): IdRow[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${kind}_${String(i).padStart(4, '0').replace(/\d/g, (d) => 'abcdefghij'[Number(d)])}`, kind, area: 'system' as const, ia: 'E-S01' }));

describe('seed: screens', () => {
  const screens = ID_ROWS.filter((row) => row.kind === 'screen');

  it('holds the 29 routes of routes.ts and the seven IA-FINAL extras, nothing else yet', () => {
    expect(Object.keys(ROUTE_MAP)).toHaveLength(29);
    expect(screens.filter((s) => s.routeValue !== undefined)).toHaveLength(29);
    expect(screens.filter((s) => s.routeValue === undefined).map((s) => s.id).sort()).toEqual(
      ['age_gate', 'boot_error', 'day_sheet', 'invite_leave', 'not_found', 'plus_confirmed', 'whose_book'],
    );
    expect(ID_ROWS).toHaveLength(36);
    for (const kind of ['control', 'element', 'metric'] as const) expect(idsOfKind(kind)).toEqual([]);
  });

  it('agrees with routes.ts both ways: every template once, with the value screen_view sends today', () => {
    for (const [template, value] of Object.entries(ROUTE_MAP)) {
      const rows = screens.filter((s) => s.route === template);
      expect(rows, `template ${JSON.stringify(template)}`).toHaveLength(1);
      expect(rows[0].routeValue).toBe(value);
      expect(rows[0].shape).toBe('route');
    }
    for (const s of screens.filter((x) => x.routeValue !== undefined)) {
      expect(Object.prototype.hasOwnProperty.call(ROUTE_MAP, s.route as string), s.id).toBe(true);
      expect((ROUTE.values as readonly string[]).includes(s.routeValue as string), s.id).toBe(true);
    }
  });

  it('gives every screen one of the nine areas and an IA-FINAL id', () => {
    for (const s of screens) {
      expect(AREAS, s.id).toContain(s.area);
      expect(s.ia, s.id).toMatch(IA_ID);
    }
  });

  it('keeps a dynamic list as one id: one letter page, one child page', () => {
    expect(screens.filter((s) => s.route === 'letter/[id]')).toHaveLength(1);
    expect(screens.filter((s) => s.route === 'settings/children/[id]')).toHaveLength(1);
    for (const s of screens) expect(s.id).not.toMatch(/\d/);
  });

  it('never carries a name: no id or note holds the fictional child', () => {
    for (const s of ID_ROWS) expect(`${s.id} ${s.note ?? ''}`.toLowerCase()).not.toContain('asha');
  });

  it('has no problems (V4 and V16 on the shipped rows)', () => {
    expect(idProblems(ID_ROWS)).toEqual([]);
  });
});

describe('V4: an id is registered, with an area and an IA-FINAL id', () => {
  it('passes a well-formed control row', () => {
    expect(idProblems([ok()])).toEqual([]);
  });

  it.each([
    ['capital letters', { id: 'Home_Speak' }],
    ['a space (text from a screen)', { id: 'speak to asha' }],
    ['a hyphen', { id: 'home-speak' }],
    ['a leading digit', { id: '1_home' }],
    ['a double underscore', { id: 'home__speak' }],
    ['an empty id', { id: '' }],
  ])('rejects %s', (_why, over) => {
    expect(idProblems([ok(over)]).join('|')).toContain('snake slug');
  });

  it('rejects an id of 32 characters, which the allowlist would drop as a token-like blob', () => {
    expect(ID_MAX_LENGTH).toBe(31);
    expect(idProblems([ok({ id: 'a'.repeat(31) })])).toEqual([]);
    expect(idProblems([ok({ id: 'a'.repeat(32) })]).join('|')).toContain('longer than 31');
    expect(idProblems([ok({ id: 'a'.repeat(32) })]).join('|')).toContain('personal data');
  });

  it('rejects an unknown area, a missing or malformed IA-FINAL id, an unknown kind', () => {
    expect(idProblems([ok({ area: 'app' as never })]).join('|')).toContain('nine');
    expect(idProblems([ok({ ia: '' })]).join('|')).toContain('IA-FINAL');
    expect(idProblems([ok({ ia: 'a-s01' })]).join('|')).toContain('IA-FINAL');
    expect(idProblems([ok({ ia: 'F-S01' })]).join('|')).toContain('IA-FINAL');
    expect(idProblems([ok({ kind: 'surface' as never })]).join('|')).toContain('unknown kind');
  });

  it('rejects one id in two kinds (a control that is also an element is registered once)', () => {
    expect(idProblems([ok(), ok({ kind: 'element' })]).join('|')).toContain('one id, one kind');
    expect(idProblems([ok(), ok()]).join('|')).toContain('already registered');
  });

  it('rejects route fields on anything but a screen', () => {
    expect(idProblems([ok({ route: 'book' })]).join('|')).toContain('belong to screens');
  });

  it('isRegisteredId finds a registered id by kind and nothing else', () => {
    expect(isRegisteredId('screen', 'home')).toBe(true);
    expect(isRegisteredId('screen', 'letter_detail')).toBe(true);
    expect(isRegisteredId('control', 'home')).toBe(false);
    expect(isRegisteredId('screen', 'home_for_asha')).toBe(false);
    expect(isRegisteredId('screen', 'tonight')).toBe(false);
    expect(isRegisteredId('control', 'home_speak', [ok()])).toBe(true);
  });
});

describe('V16: at most 300 ids per kind', () => {
  it('states the cap as 300', () => {
    expect(ID_KIND_CAP).toBe(300);
  });

  it.each(ID_KINDS)('accepts exactly 300 %s ids and rejects 301', (kind) => {
    expect(idProblems(many(kind, 300))).toEqual([]);
    expect(idProblems(many(kind, 301)).join('|')).toContain(`${kind}: 301 ids, the cap is 300`);
  });

  it('counts each kind on its own: 300 of every kind together is fine', () => {
    const all = ID_KINDS.flatMap((kind) => many(kind, 300));
    expect(all).toHaveLength(1200);
    expect(idProblems(all)).toEqual([]);
  });
});

describe('ids.md', () => {
  it(`${IDS_DOC_PATH} is the generated registry (run \`npm run plan -w @scribe/analytics\`)`, () => {
    const doc = readFileSync(resolve(ROOT, IDS_DOC_PATH), 'utf8');
    expect(renderIdsDoc() === doc, 'ids.md is out of date: run `npm run plan -w @scribe/analytics`').toBe(true);
    for (const row of ID_ROWS) expect(doc, row.id).toContain(`\`${row.id}\``);
  });

  it('is plain ASCII with no dash, curly quote or ellipsis characters', () => {
    expect(renderIdsDoc()).toMatch(/^[\x09\x0a\x20-\x7e]*$/);
  });
});

describe('module boundary', () => {
  it('ids.ts imports only pii.ts (no catalogue, registry, SDK or barrel)', () => {
    const src = readFileSync(resolve(__dirname, '../src/ids.ts'), 'utf8');
    const imports = [...src.matchAll(/^import .* from '([^']+)'/gm)].map((m) => m[1]);
    expect(imports).toEqual(['./pii']);
  });
});
