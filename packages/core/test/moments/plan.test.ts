/**
 * buildMoments and signalForDay (NS-53 row 3c; CPO-28, CDO-22, CPO-26, CPO-27). Asha, born Sat 12 Apr 2025;
 * the phone's local day is Sat 21 Nov 2026. Library rows come from `asha-lib-v1` (F01 14 Nov busy day, F02 8 Nov heart,
 * F04 11 Nov video). Fictional family only.
 */
import { describe, expect, it } from 'vitest';
import type { Prompt } from '../../src/prompts';
import { SLOTS } from '../../src/moments/domain';
import { buildMoments, eventNameToSlot, signalForDay, slotToEventName, type BuildInput } from '../../src/moments/plan';
import { ashaLibV1, columns, laOffsetAt, la, type Row } from './asha-lib-v1';
import { FIXTURE_CITIES, buildSyntheticTable, fixtureCellFor } from './place-fixture';

const PROMPTS: Prompt[] = [
  { key: 'o.any.1', text: 'What did {child} do today?', band: 'any', kind: 'opening' },
  { key: 'o.any.2', text: 'One small thing about tonight.', band: 'any', kind: 'opening' },
  { key: 'h.any.1', text: 'What would help tonight?', band: 'any', kind: 'hard' },
  { key: 'g.any.1', text: 'Tell {child} about today.', band: 'any', kind: 'gap' },
];
const base: BuildInput = { today: '2026-11-21', birth: '2025-04-12', marked: [], holidayRegion: null, state: 'normal', prompts: PROMPTS, libraryReadable: true };
const asha = ashaLibV1();
const rowsOf = (...names: string[]) => asha.filter((c) => names.some((n) => c.name.startsWith(n))).flatMap((c) => c.rows);
const lib = (rows: Row[] = rowsOf('F01', 'F02', 'F04')) => ({ window: columns(rows), offsetAt: laOffsetAt, bookId: 'book-asha' });
const withLib = (over: Partial<BuildInput> = {}) => ({ ...base, library: lib(), ...over });
const slots = (i: BuildInput) => buildMoments(i).map((c) => c.slot);
const typedToday = { kind: 'typed' as const, date: '2026-11-21', ref: 'n1' };

describe('[NS-53-3c] the plan: slots in order, one reason each', () => {
  it('orders today, look back, pictures, question with one closed reason per card', () => {
    const plan = buildMoments({ ...base, marked: [typedToday], lookBack: { ref: 'l1', date: '2025-11-21' }, pictures: { source: 'S5', ref: 'p1', day: '2025-11-02' } });
    expect(plan.map((c) => c.slot)).toEqual([...SLOTS]);
    expect(plan.map((c) => c.reason)).toEqual(['RSN-MARKED', 'RSN-LETTER', 'RSN-PICKED', 'RSN-QUESTION']);
    expect(plan.map((c) => c.dayKey)).toEqual(['2026-11-21', '2025-11-21', '2025-11-02', null]);
  });
  it('picks a library day with its class reason and is the same in any row order', () => {
    expect(buildMoments(withLib()).find((c) => c.slot === 'pictures')).toMatchObject({ dayKey: '2026-11-08', reason: 'RSN-HEART' });
    // F13 holds three busy days, so the seeded rotation really chooses between them.
    const f13 = (rows: Row[]) => withLib({ library: lib(rows) });
    const a = buildMoments(f13(rowsOf('F13')));
    expect(['2026-11-03', '2026-11-04', '2026-11-05']).toContain(a.find((c) => c.slot === 'pictures')!.dayKey);
    expect(buildMoments(f13([...rowsOf('F13')].reverse()))).toEqual(a);
    for (let i = 0; i < 25; i++) expect(buildMoments(f13(rowsOf('F13')))).toEqual(a);
  });
  it('shows a place line only for an away day and drops a cell that is not in the table', () => {
    const [home, away] = [FIXTURE_CITIES[0], FIXTURE_CITIES[2]];
    const cellA = fixtureCellFor(home.lat, home.lon)!;
    const cellB = fixtureCellFor(away.lat, away.lon)!;
    const rows: Row[] = [
      ...Array.from({ length: 30 }, (_, i) => ({ id: `h${i}`, ms: la(2026, 10, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28][i % 27], 8 + Math.floor(i / 27)) })),
      ...asha[0].rows.map((r) => ({ ...r })),
    ];
    const win = columns(rows);
    const cells = (b: string) => rows.map((r) => (r.id.startsWith('h') ? cellA : b));
    const plan = (b: string) => buildMoments({ ...base, library: { ...lib(), window: { ...win, placeCell: cells(b) }, places: buildSyntheticTable() } });
    const away1 = plan(cellB).find((c) => c.slot === 'pictures')!;
    expect(away1.dayKey).toBe('2026-11-14');
    expect(away1.placeId).toBe('syn:lisbon');
    expect(away1.reason).toBe('RSN-PLACE');
    const unknown = plan('zz-not-a-cell').find((c) => c.slot === 'pictures')!;
    expect(unknown.placeId).toBeNull();
    expect(unknown.reason).not.toBe('RSN-PLACE');
  });
});

describe('[NS-53-3c][CDO-22] the exclude list comes first and fails closed', () => {
  it('drops a library day on the list and rotates to another day', () => {
    const f13 = (excludedDays: string[]) => withLib({ library: lib(rowsOf('F13')), excludedDays });
    const first = buildMoments(f13([])).find((c) => c.slot === 'pictures')!.dayKey!;
    const second = buildMoments(f13([first])).find((c) => c.slot === 'pictures')?.dayKey;
    expect(second).toBeDefined();
    expect(second).not.toBe(first);
    expect(buildMoments(withLib({ excludedDays: ['2026-11-14', '2026-11-08', '2026-11-11'] })).map((c) => c.slot)).toEqual(['question']);
  });
  it('drops a planted look back and a planted picture day', () => {
    const lookBack = { ref: 'l1', date: '2025-11-21' };
    const pictures = { source: 'S5', ref: 'p1', day: '2025-11-02' };
    expect(slots({ ...base, lookBack, pictures })).toEqual(['lookBack', 'pictures', 'question']);
    expect(slots({ ...base, lookBack, pictures, excludedDays: ['2025-11-21', '2025-11-02'] })).toEqual(['question']);
  });
  it('shows no Today card on an excluded today, whatever the hits (Review A of #1447)', () => {
    const marked = [typedToday, { kind: 'ticked' as const, date: '2025-11-21', ref: 'd1', everyYear: true }];
    expect(slots({ ...base, marked })).toContain('today');
    expect(slots({ ...base, marked, excludedDays: ['2026-11-21'] })).toEqual(['question']);
  });
  it('drops a candidate whose day cannot be worked out, and never throws', () => {
    const bad = { ...base, birth: '2025-02-30', marked: [{ kind: 'typed' as const, date: 'not-a-day', ref: 'x' }, typedToday], lookBack: { ref: 'l1', date: '2025-13-01' }, pictures: { source: 'S5', ref: 'p', day: '' } };
    expect(slots(bad)).toEqual(['today', 'question']);
    expect(buildMoments({ ...base, today: '2026-02-31' })).toEqual([]);
  });
  it('rejects a pictures source that is not S5 or S7 at run time', () => {
    expect(slots({ ...base, pictures: { source: 'S4', ref: 'p', day: '2025-11-02' } })).toEqual(['question']);
    expect(slots({ ...base, pictures: { source: 'S9', ref: 'p', day: '2025-11-02' } })).toEqual(['question']);
  });
});

describe('[NS-53-3c][CPO-26][CPO-27] a hard stretch or quiet book', () => {
  it('suppresses S7 library pictures in a hard stretch, a quiet book and a calm book elsewhere on the phone; S5 stays', () => {
    expect(slots(withLib())).toContain('pictures');
    for (const over of [{ state: 'hard' as const }, { state: 'quiet' as const }, { phoneCalm: true }]) {
      expect(slots(withLib(over))).toEqual(['question']);
      expect(slots(withLib({ ...over, pictures: { source: 'S7', ref: 'x', day: '2026-11-14' } }))).toEqual(['question']);
      expect(slots(withLib({ ...over, pictures: { source: 'S5', ref: 'p1', day: '2025-11-02' } }))).toEqual(['pictures', 'question']);
    }
  });
  it('gives the question Home\'s kind: hard in a hard stretch, never gap', () => {
    const q = (i: BuildInput) => buildMoments(i).find((c) => c.slot === 'question')!.card;
    expect(q({ ...base, state: 'hard' })).toEqual({ slot: 'question', promptKey: 'h.any.1' });
    expect((q(base) as { promptKey: string }).promptKey).toMatch(/^o\./);
    expect((q({ ...base, state: 'quiet' }) as { promptKey: string }).promptKey).toMatch(/^o\./);
  });
});

describe('[NS-53-3c] signalForDay and the slot name mapping', () => {
  it('says yes only for a day a card sits on, with no count', () => {
    const plan = buildMoments({ ...base, lookBack: { ref: 'l1', date: '2025-11-21' } });
    expect(signalForDay(plan, '2025-11-21')).toEqual({ has: true });
    expect(signalForDay(plan, '2025-11-22')).toEqual({ has: false });
    expect(signalForDay([], '2025-11-21')).toEqual({ has: false });
  });
  it('maps every engine slot to one event name and back, lookBack to look_back', () => {
    const names = SLOTS.map(slotToEventName);
    expect(new Set(names).size).toBe(SLOTS.length);
    expect(slotToEventName('lookBack')).toBe('look_back');
    for (const s of SLOTS) expect(eventNameToSlot(slotToEventName(s))).toBe(s);
    expect(eventNameToSlot('lookBack')).toBeNull();
  });
});
