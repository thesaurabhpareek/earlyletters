/**
 * momentsFor and the four slots (NS-53-R10, R18, R24, R25, R27, R28, R30, R31, R33, R34). Pure: same inputs, same
 * list. Asha, born Sat 12 Apr 2025. The S4 and S7 candidates come from other modules; here they are plain references.
 */
import { describe, expect, it } from 'vitest';
import type { Prompt } from '../../src/prompts';
import { SLOTS } from '../../src/moments/domain';
import { momentsFor, type MomentsInput } from '../../src/moments/slots';

const LIB: Prompt[] = [
  { key: 'o.any.1', text: 'What did {child} do today?', band: 'any', kind: 'opening' },
  { key: 'o.any.2', text: 'One small thing about tonight.', band: 'any', kind: 'opening' },
  { key: 'o.any.3', text: 'A sound {child} made.', band: 'any', kind: 'opening' },
  { key: 'o.any.4', text: 'What made you smile?', band: 'any', kind: 'opening' },
  { key: 'g.any.1', text: 'Tell {child} about today.', band: 'any', kind: 'gap' },
  { key: 'h.any.1', text: 'What would help tonight?', band: 'any', kind: 'hard' },
  { key: 'b.1', text: 'Before you arrive.', band: 'before', kind: 'opening' },
  { key: 'b.2', text: 'What are you hoping for?', band: 'before', kind: 'opening' },
  { key: 'b.3', text: 'A letter to read later.', band: 'before', kind: 'opening' },
];
const base: MomentsInput = { today: '2026-11-21', birth: '2025-04-12', marked: [], holidayRegion: null, state: 'normal', prompts: LIB };
const slots = (over: Partial<MomentsInput> = {}) => momentsFor({ ...base, ...over }).map((c) => c.slot);
const letter = { ref: 'letter-1', date: '2025-11-21' };
const lib = { source: 'S7' as const, ref: 'day-2026-11-15' };
const picked = { source: 'S5' as const, ref: 'letter-2' };

describe('[NS-53-R10] four slots in one order, an empty slot absent', () => {
  it('has the order today, look back, pictures, question', () => {
    expect(SLOTS).toEqual(['today', 'lookBack', 'pictures', 'question']);
    const marked = [{ kind: 'typed' as const, date: '2026-11-21', ref: 'n1' }];
    expect(slots({ marked, lookBack: letter, pictures: lib, libraryReadable: true })).toEqual(['today', 'lookBack', 'pictures', 'question']);
  });
  it('on a plain day holds the question alone, with no placeholder', () => {
    const out = momentsFor(base);
    expect(out).toHaveLength(1);
    expect(out[0].slot).toBe('question');
  });
  it('drops a slot that has nothing and keeps the order of the rest', () => {
    expect(slots({ lookBack: letter })).toEqual(['lookBack', 'question']);
    expect(slots({ pictures: picked })).toEqual(['pictures', 'question']);
  });
  it('lists no kept letter and no picture except the one candidate each slot was given', () => {
    const out = momentsFor({ ...base, lookBack: letter, pictures: lib, libraryReadable: true });
    expect(out.find((c) => c.slot === 'lookBack')).toEqual({ slot: 'lookBack', source: 'S4', ref: 'letter-1', date: '2025-11-21' });
    expect(out.find((c) => c.slot === 'pictures')).toEqual({ slot: 'pictures', source: 'S7', ref: 'day-2026-11-15' });
  });
});

describe('[NS-53-R18] the Today slot names its sources, strongest first', () => {
  it('shows one Today card holding every hit in order', () => {
    const marked = [
      { kind: 'ticked' as const, date: '2026-04-12', ref: 'b' },
      { kind: 'typed' as const, date: '2026-04-12', ref: 'a' },
    ];
    const today = momentsFor({ ...base, today: '2026-04-12', marked }).find((c) => c.slot === 'today');
    expect(today).toMatchObject({ slot: 'today', hits: [{ source: 'S1' }, { source: 'S3', reason: 'RSN-BIRTHDAY' }, { source: 'S2' }] });
  });
  it('is absent with a month day on no date, and present on the 12th', () => {
    expect(slots({ today: '2026-11-13' })).not.toContain('today');
    expect(slots({ today: '2026-11-12' })).toContain('today');
  });
});

describe('[NS-53-R25] the question is an opening, chosen by the day', () => {
  const key = (over: Partial<MomentsInput> = {}) => (momentsFor({ ...base, ...over }).find((c) => c.slot === 'question') as { promptKey: string }).promptKey;
  it('never picks a gap or hard prompt on a normal day, over many days', () => {
    for (let d = 1; d <= 28; d++) {
      const k = key({ today: `2026-02-${String(d).padStart(2, '0')}` });
      expect(['o.any.1', 'o.any.2', 'o.any.3', 'o.any.4']).toContain(k);
    }
  });
  it('is the same on every call that day and can differ on another day', () => {
    expect(key()).toBe(key());
    const seen = new Set(Array.from({ length: 28 }, (_, i) => key({ today: `2026-02-${String(i + 1).padStart(2, '0')}` })));
    expect(seen.size).toBeGreaterThan(1);
  });
  it('never shows the key Home shows today while another prompt exists', () => {
    for (let d = 1; d <= 28; d++) {
      const today = `2026-02-${String(d).padStart(2, '0')}`;
      const first = key({ today });
      expect(key({ today, homeKey: first })).not.toBe(first);
    }
  });
  it('asks the kind Home asks on a hard stretch, and only then', () => {
    expect(key({ state: 'hard' })).toBe('h.any.1');
    expect(key({ state: 'normal' })).not.toBe('h.any.1');
  });
  it('is absent when the library has no prompt, never a thrown error', () => {
    expect(slots({ prompts: [] })).toEqual([]);
  });
  it('passes a nameless child on so name prompts are skipped', () => {
    const lib2: Prompt[] = [
      { key: 'o.name', text: 'How was the name chosen?', band: 'any', kind: 'opening' },
      { key: 'o.x', text: 'Something small.', band: 'any', kind: 'opening' },
    ];
    for (let d = 1; d <= 20; d++) expect(key({ prompts: lib2, childNameBlank: true, today: `2026-03-${String(d).padStart(2, '0')}` })).toBe('o.x');
  });
});

describe('[NS-53-R21] [NS-53-R34] before the birth or with no birth date', () => {
  it('draws the question from the before set only and has no age day', () => {
    const out = momentsFor({ ...base, birth: '2027-01-01', today: '2026-11-21' });
    expect(['b.1', 'b.2', 'b.3']).toContain((out[0] as { promptKey: string }).promptKey);
    expect(out.map((c) => c.slot)).toEqual(['question']);
  });
  it('gives no age day for a book with no birth date', () => {
    expect(slots({ birth: null, today: '2026-11-12' })).not.toContain('today');
  });
});

describe('[NS-53-R24] a hard stretch or a quiet book', () => {
  const marked = [
    { kind: 'ticked' as const, date: '2026-11-12', ref: 'mine' },
  ];
  it.each(['hard', 'quiet'] as const)('shows no look back and no bright Today hit in a %s state', (state) => {
    const out = momentsFor({ ...base, state, today: '2026-11-12', marked, lookBack: letter });
    expect(out.map((c) => c.slot)).not.toContain('lookBack');
    const today = out.find((c) => c.slot === 'today') as { hits: { reason: string }[] };
    expect(today.hits.map((h) => h.reason)).toEqual(['RSN-MARKED']);
  });
  it.each(['hard', 'quiet'] as const)('drops the Today card whole when only a bright hit exists (%s)', (state) => {
    expect(slots({ state, today: '2026-11-12', lookBack: letter })).not.toContain('today');
    expect(slots({ state, today: '2026-07-04', holidayRegion: 'US' })).not.toContain('today');
  });
  it('keeps the same hits on a normal day', () => {
    expect(slots({ today: '2026-11-12', lookBack: letter })).toEqual(['today', 'lookBack', 'question']);
  });
});

describe('[NS-53-R30] [NS-53-R173] sources the parent turned off or cannot read', () => {
  it('shows a library day only when the library is readable, else the picked pictures', () => {
    expect(momentsFor({ ...base, pictures: lib, libraryReadable: false }).some((c) => c.slot === 'pictures')).toBe(false);
    expect(momentsFor({ ...base, pictures: lib, libraryReadable: true }).find((c) => c.slot === 'pictures')).toMatchObject({ source: 'S7' });
    expect(momentsFor({ ...base, pictures: picked, libraryReadable: false }).find((c) => c.slot === 'pictures')).toMatchObject({ source: 'S5' });
  });
  it('defaults to a library that is not readable', () => {
    expect(slots({ pictures: lib })).not.toContain('pictures');
  });
  it('removes a turned-off source and nothing else', () => {
    const marked = [{ kind: 'typed' as const, date: '2026-11-21', ref: 'n1' }];
    const all = { marked, lookBack: letter, pictures: lib, libraryReadable: true };
    expect(slots({ ...all, off: ['S1'] })).toEqual(['lookBack', 'pictures', 'question']);
    expect(slots({ ...all, off: ['S4'] })).toEqual(['today', 'pictures', 'question']);
    expect(slots({ ...all, off: ['S7'] })).toEqual(['today', 'lookBack', 'question']);
    expect(slots({ ...all, off: ['S6'] })).toEqual(['today', 'lookBack', 'pictures']);
  });
  it('removes a single hit inside the Today card, not the card', () => {
    const marked = [{ kind: 'typed' as const, date: '2026-04-12', ref: 'n1' }];
    const t = momentsFor({ ...base, today: '2026-04-12', marked, off: ['S3'] }).find((c) => c.slot === 'today') as { hits: { source: string }[] };
    expect(t.hits.map((h) => h.source)).toEqual(['S1']);
  });
  it('shows nothing at all when every source is off', () => {
    expect(slots({ marked: [{ kind: 'typed', date: '2026-11-21', ref: 'x' }], lookBack: letter, pictures: lib, libraryReadable: true, off: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'H'] })).toEqual([]);
  });
});

describe('[NS-53-R28] Not today', () => {
  it('leaves the named slot for the rest of the day and fills no gap', () => {
    expect(slots({ lookBack: letter, pictures: picked, notToday: ['lookBack'] })).toEqual(['pictures', 'question']);
    expect(slots({ lookBack: letter, notToday: ['question', 'lookBack'] })).toEqual([]);
    expect(slots({ today: '2026-11-12', notToday: ['today'] })).toEqual(['question']);
    expect(slots({ pictures: picked, notToday: ['pictures'] })).toEqual(['question']);
  });
});

describe('[NS-53-R27] [NS-53-R33] the same inputs give the same list', () => {
  const full: MomentsInput = { ...base, today: '2026-11-12', marked: [{ kind: 'ticked', date: '2026-11-12', ref: 'a' }], lookBack: letter, pictures: lib, libraryReadable: true };
  it('is deep-equal across calls and does not change its input', () => {
    const frozen = JSON.stringify(full);
    expect(momentsFor(full)).toEqual(momentsFor(JSON.parse(frozen)));
    expect(JSON.stringify(full)).toBe(frozen);
  });
  it('does not depend on the order marks arrive in', () => {
    const marked = [
      { kind: 'ticked' as const, date: '2026-11-12', ref: 'a' },
      { kind: 'ticked' as const, date: '2026-11-12', ref: 'b' },
    ];
    expect(momentsFor({ ...full, marked })).toEqual(momentsFor({ ...full, marked: [...marked].reverse() }));
  });
});
