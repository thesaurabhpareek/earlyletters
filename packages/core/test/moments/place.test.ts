/**
 * NS-53 PR 5: the place resolver on an injected synthetic table. Row ids are in the test names.
 * Asha is the fictional family; the library's most frequent place is Seattle, the trip is Lisbon.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MOMENTS_RULES, type MomentsRules } from '../../src/moments';
import {
  dayPlace,
  openPlaceTable,
  placeForCell,
  placeLine,
  placeName,
  placeStays,
  type PlaceStayGuard,
  placeTableText,
  windowPlaces,
  type PlaceIndex,
  type PlaceLineInput,
} from '../../src/moments/place';
import { FIXTURE_CITIES, buildSyntheticTable, fixtureCellFor, fnv1a32Hex } from './place-fixture';

const RULES: MomentsRules = MOMENTS_RULES;
const T = buildSyntheticTable();
const SEA = 'syn:seattle';
const POR = 'syn:portland';
const LIS = 'syn:lisbon';
const rep = (id: string | null, n: number): (string | null)[] => Array.from({ length: n }, () => id);

function line(over: Partial<PlaceLineInput> & { placeId: string | null; window: PlaceLineInput['window'] }) {
  return placeLine({ table: T, hidden: new Set(), rules: RULES, isBirthDay: false, machineLabels: true, ...over });
}

describe('[NS-53-R229] the table opens only when its checksum holds', () => {
  it('opens the synthetic table', () => expect(openPlaceTable(T, fnv1a32Hex)).toBe(T));
  it('fails closed to no table on a checksum mismatch', () => {
    expect(openPlaceTable({ ...T, checksum: '00000000' }, fnv1a32Hex)).toBeNull();
    expect(openPlaceTable({ ...T, version: 2 }, fnv1a32Hex)).toBeNull();
  });
  it('fails closed when a cell points to an unknown place or a key differs from its id', () => {
    const cells = { ...T.cells, '1:1': 'syn:nowhere' };
    const bad = { ...T, cells, checksum: fnv1a32Hex(placeTableText({ ...T, cells })) };
    expect(openPlaceTable(bad, fnv1a32Hex)).toBeNull();
    const places = { ...T.places, 'syn:x': { id: 'syn:y', name: 'X', kind: 'city' as const } };
    const bad2 = { ...T, places, checksum: fnv1a32Hex(placeTableText({ ...T, places })) };
    expect(openPlaceTable(bad2, fnv1a32Hex)).toBeNull();
  });
  it('has no table: null in, null out', () => {
    expect(openPlaceTable(null, fnv1a32Hex)).toBeNull();
    expect(placeForCell(null, '1:1')).toBeNull();
  });
  it('the checksum text does not depend on key order', () => {
    const rev: PlaceIndex = { ...T, cells: Object.fromEntries(Object.entries(T.cells).reverse()) };
    expect(placeTableText(rev)).toBe(placeTableText(T));
  });
  it('[NS-53-R248] a place key is the stable external id, not a readable name', () => {
    for (const c of FIXTURE_CITIES) expect(placeForCell(T, fixtureCellFor(c.lat, c.lon))).toBe(c.id);
    expect(Object.values(T.cells).every((v) => v.startsWith('syn:'))).toBe(true);
  });
});

describe('[NS-53-R61] [NS-53-R204] cell lookup abstains', () => {
  it('no cell and an unknown cell give no place and no message', () => {
    expect(placeForCell(T, null)).toBeNull();
    expect(placeForCell(T, undefined)).toBeNull();
    expect(placeForCell(T, '999:999')).toBeNull();
    expect(placeForCell(T, '__proto__')).toBeNull();
    expect(placeForCell(T, 'constructor')).toBeNull();
  });
  it('(0,0) is none; invalid points are none', () => {
    expect(fixtureCellFor(0, 0)).toBeNull();
    expect(fixtureCellFor(NaN, 10)).toBeNull();
    expect(fixtureCellFor(91, 10)).toBeNull();
    expect(fixtureCellFor(10, 181)).toBeNull();
  });
  it('the antimeridian: 180 and -180 are the same meridian and abstain on the edge; nearby cells resolve', () => {
    expect(fixtureCellFor(10.25, 180)).toBe(fixtureCellFor(10.25, -180));
    expect(placeForCell(T, fixtureCellFor(-16.85, -179.7))).toBe('syn:taveuni');
    expect(placeForCell(T, fixtureCellFor(-18.14, 178.44))).toBe('syn:suva');
  });
  it('a point near a table boundary (a cell edge) gives none', () => {
    expect(fixtureCellFor(38.5, -9.14)).toBeNull();
    expect(fixtureCellFor(38.51, -9.14)).toBeNull();
    expect(fixtureCellFor(38.72, -9.14)).not.toBeNull();
  });
});

describe('[NS-53-R63] a day has the majority place of its pictures', () => {
  it('six pictures in one place', () => expect(dayPlace(rep(LIS, 6), RULES)).toBe(LIS));
  it('3 in Seattle and 3 in Portland is a tie: none', () => {
    expect(dayPlace([...rep(SEA, 3), ...rep(POR, 3)], RULES)).toBeNull();
  });
  it('a clear majority wins; pictures with no place are not votes', () => {
    expect(dayPlace([...rep(LIS, 4), ...rep(SEA, 1), ...rep(null, 9)], RULES)).toBe(LIS);
  });
  it('[NS-53-R254] fewer than the floor of pictures at the place gives none', () => {
    expect(dayPlace(rep(LIS, 2), RULES)).toBeNull();
    expect(dayPlace(rep(LIS, 3), RULES)).toBe(LIS);
  });
  it('[NS-53-R204] a majority share at or below the threshold gives none', () => {
    expect(dayPlace([...rep(LIS, 3), ...rep(SEA, 2), ...rep(POR, 2)], { ...RULES, majorityShare: 3 / 7 })).toBeNull();
    expect(dayPlace([...rep(LIS, 4), ...rep(SEA, 2), ...rep(POR, 1)], { ...RULES, majorityShare: 0.5 })).toBe(LIS);
  });
  it('no pictures: none', () => expect(dayPlace([], RULES)).toBeNull());
});

describe('[CPO-25] place defaults are PROPOSED rules fields, read from MomentsRules', () => {
  it('(a) to (f): the values the council set, strict majority, and a version past 2', () => {
    expect(RULES.placeRareShare).toBe(0.15);
    expect(RULES.majorityShare).toBe(0.5);
    expect(RULES.minPicturesAtPlace).toBe(3);
    expect(RULES.maxRun).toBe(7);
    expect(RULES.version).toBeGreaterThanOrEqual(4);
  });
  it('placeRareShare is read from the rules, not a constant: a wider bar gives the line, a narrower one drops it', () => {
    const w = windowPlaces([...rep(SEA, 17), ...rep(LIS, 3)]); // share 0.15
    expect(line({ placeId: LIS, window: w })).toBeNull();
    expect(line({ placeId: LIS, window: w, rules: { ...RULES, placeRareShare: 0.2 } })).not.toBeNull();
  });
  it('minPicturesAtPlace and maxRun are read from the rules, not constants', () => {
    expect(dayPlace(rep(LIS, 3), { ...RULES, minPicturesAtPlace: 4 })).toBeNull();
    expect(dayPlace(rep(LIS, 2), { ...RULES, minPicturesAtPlace: 2 })).toBe(LIS);
    const W3 = windowPlaces([...rep(SEA, 60), ...rep(LIS, 5)]);
    const g = { table: T, window: W3, hidden: new Set<string>(), machineLabels: true };
    const run = (n: number) => Array.from({ length: n }, (_, i) => ({ dayKey: `2026-10-${String(10 + i).padStart(2, '0')}`, placeId: LIS, isBirthDay: false }));
    expect(placeStays(run(4), { ...g, rules: { ...RULES, maxRun: 3 } })).toEqual([]);
    expect(placeStays(run(10), { ...g, rules: { ...RULES, maxRun: 10 } })).toHaveLength(1);
  });
  it('(b) the share denominator counts placed candidates only: unplaced pictures never make a place rarer', () => {
    const plain = windowPlaces([...rep(SEA, 17), ...rep(LIS, 3)]);
    const withNone = windowPlaces([...rep(SEA, 17), ...rep(LIS, 3), ...rep(null, 500)]);
    expect(withNone.share.get(LIS)).toBe(plain.share.get(LIS));
    expect(dayPlace([...rep(LIS, 3), ...rep(SEA, 2), ...rep(null, 100)], RULES)).toBe(LIS);
  });
  it('(a) a tie for home gives no home and so no place line, however rare the place is', () => {
    const w = windowPlaces([...rep(SEA, 7), ...rep(POR, 7), ...rep(LIS, 1)]);
    expect(w.home).toBeNull();
    expect(line({ placeId: LIS, window: w })).toBeNull();
  });
  it('(c) a stay needs 2 days with a gap of 0 days: two consecutive days are a stay, two days one apart are not', () => {
    const W2 = windowPlaces([...rep(SEA, 60), ...rep(LIS, 5)]);
    const g = { table: T, window: W2, hidden: new Set<string>(), rules: RULES, machineLabels: true };
    const d = (dayKey: string) => ({ dayKey, placeId: LIS, isBirthDay: false });
    expect(placeStays([d('2026-10-24'), d('2026-10-25')], g)).toHaveLength(1);
    expect(placeStays([d('2026-10-24'), d('2026-10-26')], g)).toEqual([]);
    expect(placeStays([d('2026-10-24')], g)).toEqual([]);
  });
});

describe('[NS-53-R281] the home-place rarity rule (7.2a PLACE_RARE_SHARE 0.15)', () => {
  const win = (a: [string, number][], none = 0) => windowPlaces([...a.flatMap(([id, n]) => rep(id, n)), ...rep(null, none)]);

  it('a few days in Lisbon against 60 at home: a line', () => {
    const w = win([[SEA, 60], [LIS, 6]]);
    expect(w.home).toBe(SEA);
    expect(line({ placeId: LIS, window: w })).toEqual({ id: LIS, name: 'Lisbon' });
  });
  it('60 days in one place and 30 in another: the second shares 0.33, no away line', () => {
    const w = win([[SEA, 60], [POR, 30]]);
    expect(w.share.get(POR)).toBeCloseTo(1 / 3);
    expect(line({ placeId: POR, window: w })).toBeNull();
  });
  it('the reverse: 30 and 60 swaps which place is home, and still no line', () => {
    const w = win([[SEA, 30], [POR, 60]]);
    expect(w.home).toBe(POR);
    expect(line({ placeId: SEA, window: w })).toBeNull();
    expect(line({ placeId: POR, window: w })).toBeNull();
  });
  it('a move 40 days ago: the new place is judged on window shares, not on one day', () => {
    const w = win([[SEA, 50], [LIS, 40]]);
    expect(line({ placeId: LIS, window: w })).toBeNull();
    expect(line({ placeId: SEA, window: w })).toBeNull();
  });
  it('a long stay never turns the real home into an away place', () => {
    const w = win([[SEA, 60], [LIS, 20]]);
    expect(line({ placeId: SEA, window: w })).toBeNull();
  });
  it('the share is strictly below the threshold', () => {
    const w = windowPlaces([...rep(SEA, 17), ...rep(LIS, 3)]); // 3/20 = 0.15 exactly
    expect(w.share.get(LIS)).toBe(0.15);
    expect(line({ placeId: LIS, window: w })).toBeNull();
    const w2 = windowPlaces([...rep(SEA, 18), ...rep(LIS, 2)]); // 0.10
    expect(line({ placeId: LIS, window: w2 })).not.toBeNull();
  });
  it('[NS-53-R63] the home place is never a line; a tie for home or no places gives no home and no line', () => {
    expect(windowPlaces([...rep(SEA, 5), ...rep(POR, 5)]).home).toBeNull();
    expect(line({ placeId: LIS, window: windowPlaces([...rep(SEA, 5), ...rep(POR, 5), ...rep(LIS, 1)]) })).toBeNull();
    expect(windowPlaces(rep(null, 4)).home).toBeNull();
    expect(windowPlaces([]).share.size).toBe(0);
  });
  it('[NS-53-R249] the parent correction wins over the computed home', () => {
    const w = win([[SEA, 60], [LIS, 6]]);
    expect(line({ placeId: SEA, window: w, homeCorrection: LIS })).toBeNull();
    expect(line({ placeId: LIS, window: w, homeCorrection: LIS })).toBeNull();
    expect(line({ placeId: LIS, window: w, homeCorrection: SEA })).not.toBeNull();
  });
  it('no day place, a hidden place, or a name the table lacks gives no line', () => {
    const w = win([[SEA, 60], [LIS, 6]]);
    expect(line({ placeId: null, window: w })).toBeNull();
    expect(line({ placeId: LIS, window: w, hidden: new Set([LIS]) })).toBeNull();
    expect(line({ placeId: LIS, window: w, table: null })).toBeNull();
    expect(line({ placeId: 'syn:unlisted', window: windowPlaces([...rep(SEA, 60), ...rep('syn:unlisted', 1)]) })).toBeNull();
  });
  it('[NS-53-R254] no line on the date of birth or a birth occasion day', () => {
    const w = win([[SEA, 60], [LIS, 6]]);
    expect(line({ placeId: LIS, window: w, isBirthDay: true })).toBeNull();
  });
  it('[NS-53-R202] the machineLabels kill switch hides every place line', () => {
    const w = win([[SEA, 60], [LIS, 6]]);
    expect(line({ placeId: LIS, window: w, machineLabels: false })).toBeNull();
  });
  it('a table of one place is home everywhere: no line', () => {
    expect(line({ placeId: SEA, window: windowPlaces(rep(SEA, 9)) })).toBeNull();
  });
});

describe('[NS-53-R58] stays: consecutive away days of one place', () => {
  const d = (dayKey: string, placeId: string | null, isBirthDay = false) => ({ dayKey, placeId, isBirthDay });
  const PORTO = 'syn:porto';
  const W = windowPlaces([...rep(SEA, 60), ...rep(LIS, 5), ...rep(PORTO, 5)]);
  const guard = (over: Partial<PlaceStayGuard> = {}): PlaceStayGuard => ({
    table: T, window: W, hidden: new Set(), rules: RULES, machineLabels: true, ...over,
  });
  const stays = (days: ReturnType<typeof d>[], over: Partial<PlaceStayGuard> = {}) => placeStays(days, guard(over));
  const three = (id: string) => [d('2026-10-24', id), d('2026-10-25', id), d('2026-10-26', id)];

  it('Asha: Fri 24 to Sun 26 Oct 2026 in Lisbon is one stay of 3 days', () => {
    expect(stays(three(LIS))).toEqual([{ placeId: LIS, from: '2026-10-24', to: '2026-10-26', days: 3 }]);
  });
  it('a gap day, a changed place or a null place splits; a lone day is no stay', () => {
    expect(stays([d('2026-10-24', LIS), d('2026-10-26', LIS)])).toEqual([]);
    expect(stays([d('2026-10-24', LIS), d('2026-10-25', PORTO), d('2026-10-26', PORTO)])).toEqual([
      { placeId: PORTO, from: '2026-10-25', to: '2026-10-26', days: 2 },
    ]);
    expect(stays([d('2026-10-24', LIS), d('2026-10-25', null), d('2026-10-26', LIS)])).toEqual([]);
  });
  it('a run longer than rules.maxRun gives no theme; exactly maxRun does', () => {
    const run = (n: number) => Array.from({ length: n }, (_, i) => d(`2026-10-${String(10 + i).padStart(2, '0')}`, LIS));
    expect(stays(run(8))).toEqual([]);
    expect(stays(run(7))).toHaveLength(1);
  });
  it('input order and duplicate days do not matter; month and year edges are consecutive', () => {
    expect(stays([d('2027-01-01', LIS), d('2026-12-31', LIS), d('2026-12-31', LIS)])).toEqual([
      { placeId: LIS, from: '2026-12-31', to: '2027-01-01', days: 2 },
    ]);
  });
  it('a day that is not a real date is ignored (30 February, month 13, no zero padding)', () => {
    expect(stays([d('2026-02-30', LIS), d('2026-02-31', LIS), d('2026-13-01', LIS), d('2026-1-5', LIS)])).toEqual([]);
    expect(stays([d('2028-02-29', LIS), d('2028-03-01', LIS)])).toHaveLength(1); // leap day is consecutive
    expect(stays([d('2027-02-28', LIS), d('2027-03-01', LIS)])).toHaveLength(1);
  });
  it('a malformed day key is ignored, never thrown', () => {
    expect(stays([d('nope', LIS), d('2026-10-24', LIS)])).toEqual([]);
  });
  it('[NS-53-R63] days at home are never a stay', () => {
    expect(stays(three(SEA))).toEqual([]);
    expect(stays(three(LIS), { homeCorrection: LIS })).toEqual([]);
  });
  it('[NS-53-R254] a hidden place never gets a stay', () => {
    expect(stays(three(LIS), { hidden: new Set([LIS]) })).toEqual([]);
  });
  it('[NS-53-R202] the machineLabels kill switch gives no stay', () => {
    expect(stays(three(LIS), { machineLabels: false })).toEqual([]);
  });
  it('[NS-53-R254] a birth day is not part of a stay', () => {
    expect(stays([d('2026-10-24', LIS, true), d('2026-10-25', LIS), d('2026-10-26', LIS)])).toEqual([
      { placeId: LIS, from: '2026-10-25', to: '2026-10-26', days: 2 },
    ]);
    expect(stays([d('2026-10-24', LIS), d('2026-10-25', LIS, true)])).toEqual([]);
  });
  it('a place the table does not name gives no stay', () => {
    expect(stays(three(LIS), { table: null })).toEqual([]);
  });
});

describe('prototype keys are not places', () => {
  it('placeName and placeForCell ignore inherited keys', () => {
    for (const k of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
      expect(placeName(T, k)).toBeNull();
      expect(placeForCell(T, k)).toBeNull();
    }
  });
  it('a table whose cell points at "constructor" does not open', () => {
    const bad = { ...T, cells: { ...T.cells, 'syn:x': 'constructor' } };
    const withSum = { ...bad, checksum: fnv1a32Hex(placeTableText(bad)) };
    expect(openPlaceTable(withSum, fnv1a32Hex)).toBeNull();
  });
});

function srcFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? srcFiles(p) : p.endsWith('.ts') ? [p] : [];
  });
}

describe('[CPrivO-14] [NS-53-R61] the fixture that holds a coordinate stays under test/', () => {
  const SRC = join(__dirname, '../../src');
  it('import graph: no file in src imports place-fixture or anything under test', () => {
    const files = srcFiles(SRC);
    expect(files.length).toBeGreaterThan(5);
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      expect(text, f).not.toMatch(/place-fixture/);
      expect(text, f).not.toMatch(/from\s+['"][^'"]*\/test\//);
    }
  });
  it('the fixture file is not in src, and nothing in src/moments names a coordinate field', () => {
    expect(() => statSync(join(SRC, 'moments/place-fixture.ts'))).toThrow();
    for (const f of srcFiles(join(SRC, 'moments'))) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/\b(lat|lon|latitude|longitude)\b/i);
    }
  });
  it('one hash: the fixture checksum is the shared FNV-1a as 8 hex digits', () => {
    expect(fnv1a32Hex('')).toBe('811c9dc5');
    expect(fnv1a32Hex('a')).toBe('e40c292c');
  });
  it('PR 1 keeps no second table type: PlaceIndex is the one shape', async () => {
    const text = readFileSync(join(SRC, 'moments/types.ts'), 'utf8');
    expect(text).not.toMatch(/\bPlaceTable\b/);
  });
});

describe('[NS-53-R117] [NS-53-R61] no coordinate in the resolver', () => {
  it('place.ts exports no function that takes a coordinate; only the fixture does', async () => {
    const place = await import('../../src/moments/place');
    const names = Object.keys(place).sort();
    expect(names).toEqual(
      ['dayPlace', 'openPlaceTable', 'placeForCell', 'placeLine', 'placeName', 'placeStays', 'placeTableText', 'windowPlaces'].sort(),
    );
    expect(Object.keys(await import('./place-fixture'))).toContain('fixtureCellFor');
  });
  it('a PlaceLineInput, a PlaceIndex and a day output have no coordinate field (type test)', () => {
    // @ts-expect-error a coordinate is not part of a place line input
    const bad: PlaceLineInput = { ...({} as PlaceLineInput), lat: 1 };
    void bad;
    const out = line({ placeId: LIS, window: windowPlaces([...rep(SEA, 60), ...rep(LIS, 6)]) });
    expect(Object.keys(out ?? {}).sort()).toEqual(['id', 'name']);
  });
  it('the synthetic table has 10 rows and city, region or country kinds only', () => {
    expect(Object.keys(T.places)).toHaveLength(10);
    expect(Object.values(T.places).every((p) => ['city', 'region', 'country'].includes(p.kind))).toBe(true);
  });
});
