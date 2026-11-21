/**
 * NS-53 PR 5: the place resolver on an injected synthetic table. Row ids are in the test names.
 * Asha is the fictional family; the library's most frequent place is Seattle, the trip is Lisbon.
 */
import { describe, expect, it } from 'vitest';
import {
  dayPlace,
  openPlaceTable,
  placeForCell,
  placeLine,
  placeStays,
  placeTableText,
  windowPlaces,
  type PlaceIndex,
  type PlaceLineInput,
  type PlaceRules,
} from '../../src/moments/place';
import { FIXTURE_CITIES, buildSyntheticTable, fixtureCellFor, fnv1a32Hex } from '../../src/moments/place-fixture';

const RULES: PlaceRules = { rareShare: 0.15, majorityShare: 0.5, minPicturesAtPlace: 3, maxRun: 7 };
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
  const d = (dayKey: string, placeId: string | null) => ({ dayKey, placeId });
  it('Asha: Fri 24 to Sun 26 Oct 2026 in Lisbon is one stay of 3 days', () => {
    expect(placeStays([d('2026-10-24', LIS), d('2026-10-25', LIS), d('2026-10-26', LIS)], 7)).toEqual([
      { placeId: LIS, from: '2026-10-24', to: '2026-10-26', days: 3 },
    ]);
  });
  it('a gap day, a changed place or a null place splits; a lone day is no stay', () => {
    expect(placeStays([d('2026-10-24', LIS), d('2026-10-26', LIS)], 7)).toEqual([]);
    expect(placeStays([d('2026-10-24', LIS), d('2026-10-25', 'syn:porto'), d('2026-10-26', 'syn:porto')], 7)).toEqual([
      { placeId: 'syn:porto', from: '2026-10-25', to: '2026-10-26', days: 2 },
    ]);
    expect(placeStays([d('2026-10-24', LIS), d('2026-10-25', null), d('2026-10-26', LIS)], 7)).toEqual([]);
  });
  it('a run longer than maxRun gives no theme; exactly maxRun does', () => {
    const run = (n: number) => Array.from({ length: n }, (_, i) => d(`2026-10-${String(10 + i).padStart(2, '0')}`, LIS));
    expect(placeStays(run(8), 7)).toEqual([]);
    expect(placeStays(run(7), 7)).toHaveLength(1);
  });
  it('input order and duplicate days do not matter; month and year edges are consecutive', () => {
    expect(placeStays([d('2027-01-01', LIS), d('2026-12-31', LIS), d('2026-12-31', LIS)], 7)).toEqual([
      { placeId: LIS, from: '2026-12-31', to: '2027-01-01', days: 2 },
    ]);
  });
  it('a malformed day key is ignored, never thrown', () => {
    expect(placeStays([d('nope', LIS), d('2026-10-24', LIS)], 7)).toEqual([]);
  });
});

describe('[NS-53-R117] [NS-53-R61] no coordinate in the resolver', () => {
  it('place.ts exports no function that takes a coordinate; only the fixture does', async () => {
    const place = await import('../../src/moments/place');
    const names = Object.keys(place).sort();
    expect(names).toEqual(
      ['dayPlace', 'openPlaceTable', 'placeForCell', 'placeLine', 'placeName', 'placeStays', 'placeTableText', 'windowPlaces'].sort(),
    );
    expect(Object.keys(await import('../../src/moments/place-fixture'))).toContain('fixtureCellFor');
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
