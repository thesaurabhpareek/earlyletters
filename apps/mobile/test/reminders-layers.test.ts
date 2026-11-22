/// <reference types="node" />
import { layeredSelector, type KeySelector, type LayerCatalogue } from '@scribe/core';
import { describe, expect, it } from 'vitest';
import { entries } from '../src/lib/db/repos';
import { DEFAULT_PREFS, planReminders, type LastLetter, type PlanInput, type PlannedNotification } from '../src/lib/reminders/planner';
import { parseIsoDate, zonedToEpoch } from '../src/lib/reminders/tz';
import { fixture, insertBook, letter, rawRow } from './helpers/store-fixture';

const LA = 'America/Los_Angeles';
const asha = { id: 'child-asha', name: 'Asha', birthday: '2026-03-08', included: true };
const at = (iso: string, hh: number, mm: number) => zonedToEpoch({ ...parseIsoDate(iso)!, hh, mm }, LA);
const NOW = at('2026-10-05', 12, 0);
const shape = (l: PlannedNotification[]) => l.map((n) => `${n.id}|${n.kind}|${n.date}|${n.hour}:${n.minute}|${n.fireAt}`);
const CAT: LayerCatalogue = {
  recency: { r1: [{ key: 'ntc.r1', evening: false }], r2: [{ key: 'ntc.r2', evening: false }], r3: [{ key: 'ntc.r3', evening: false }], r4: [{ key: 'ntc.r4', evening: false }] },
  kind: { spoke: [{ key: 'ntc.spoke', evening: false }], typed: [{ key: 'ntc.typed', evening: false }] },
};
function plan(p: Partial<PlanInput> = {}): PlannedNotification[] {
  return planReminders({
    now: NOW,
    timeZone: LA,
    children: [asha],
    horizonDays: 60,
    prefs: { ...DEFAULT_PREFS, enabled: true, cadence: 'everyEvening', monthNotes: true },
    ...p,
  });
}

describe('NS-48 layers in the planner', () => {
  it('[NS-48-R3] the selector is asked for recency computed at plan time from the fire date and the last letter date', () => {
    const asked: Array<[string, string | null | undefined, string | null | undefined]> = [];
    const spy: KeySelector = (i) => {
      asked.push([i.recency ?? 'none', i.lastKind, undefined]);
      return 'floor.0';
    };
    const lastLetter: LastLetter = { at: at('2026-10-04', 21, 0), kind: 'spoke' };
    const out = plan({ lastLetter, select: spy, anchorAt: null });
    const evenings = out.filter((n) => n.kind === 'evening');
    expect(asked.length).toBeGreaterThanOrEqual(evenings.length); // the planner asks for every candidate, then budgets
    // The first evening is the 5th (gap 1 = r1), then 6th and on.
    expect(asked[0][0]).toBe('r1');
    expect(asked[1][0]).toBe('r2');
    // The 8th is a month note's day, so the sixth nudge is the 11th (gap 7).
    expect(asked.slice(0, 6).map((a) => a[0])).toEqual(['r1', 'r2', 'r2', 'r2', 'r2', 'r3']);
    expect(asked.map((a) => a[0])).toContain('r3');
    expect(asked.map((a) => a[0])).toContain('r4');
    expect(asked.map((a) => a[0])).toContain('none'); // past day 35
    expect(asked.every((a) => a[1] === 'spoke')).toBe(true);
  });

  it('[NS-48-R3] a letter made today moves the anchor: the next plan recomputes every band', () => {
    const bands = (lastLetter: LastLetter) => {
      const seen: string[] = [];
      plan({ lastLetter, select: (i) => (seen.push(i.recency ?? 'none'), 'floor.0') });
      return seen;
    };
    const old = bands({ at: at('2026-09-20', 20, 0), kind: 'typed' });
    const fresh = bands({ at: at('2026-10-05', 11, 0), kind: 'typed' });
    expect(old[0]).toBe('r4');
    expect(fresh[0]).toBe('r1');
  });

  it('[NS-48-R2] the set of (id, date, time, class) is the same with the layers on or off, whatever the last letter', () => {
    const on = layeredSelector(CAT);
    for (const kind of ['spoke', 'typed', null] as const) {
      for (const lastLetter of [null, { at: at('2026-10-04', 21, 0), kind }, { at: at('2026-08-01', 9, 0), kind }]) {
        for (const monthNotes of [false, true]) {
          const base = { lastLetter, prefs: { ...DEFAULT_PREFS, enabled: true, cadence: 'everyEvening' as const, monthNotes } };
          const off = plan({ ...base, lastLetter: null });
          const withLayers = plan({ ...base, select: on });
          const floorOnly = plan(base);
          expect(off.length).toBeGreaterThan(0);
          expect(shape(withLayers)).toEqual(shape(off));
          expect(shape(floorOnly)).toEqual(shape(off));
        }
      }
    }
  });

  it('no catalogue yet: the shipped planner words every note exactly as before, with or without a last letter', () => {
    const without = plan();
    const withLast = plan({ lastLetter: { at: at('2026-10-04', 21, 0), kind: 'spoke' } });
    expect(withLast).toEqual(without);
  });

  it('a layer key the planner does not hold words for falls back to the floor (never a note without words)', () => {
    const out = plan({ lastLetter: { at: at('2026-10-04', 21, 0), kind: 'spoke' }, select: layeredSelector(CAT) });
    expect(out.filter((n) => n.kind === 'evening').every((n) => /^floor\.\d$/.test(n.key ?? ''))).toBe(true);
  });

  it('a throwing layer falls back to the floor and plans the same notes', () => {
    const boom: KeySelector = () => {
      throw new Error('x');
    };
    expect(shape(plan({ lastLetter: { at: NOW, kind: 'typed' }, select: boom }))).toEqual(shape(plan()));
  });
});

describe('[NS-48-R27] newestMadeLetter is one query over the newest own letter', () => {
  const ME = 'user-asha-mama';
  const id = (i: number) => `0199a5b0-0000-7000-8000-${i.toString(16).padStart(12, '0')}`;
  const put = (f: ReturnType<typeof fixture>, i: number, over: Parameters<typeof letter>[0], childId = 'child-asha', authorId?: string) =>
    entries.upsert(f.ctx, letter({ id: id(i), ...over, childId, ...(authorId ? { authorId } : {}) }), { childId, authorSignsAs: 'Mama' });

  it('returns the newest by captured_at; a quiet-day mark, a deleted row and a hidden book are not it', () => {
    const f = fixture();
    insertBook(f.db, { id: 'child-asha', name: 'Asha', birthday: '2025-10-01' });
    insertBook(f.db, { id: 'child-nia', name: 'Nia', birthday: '2025-10-01' });
    put(f, 1, { capturedAt: '2026-10-01T08:00:00.000Z', captureMode: 'typed' });
    put(f, 2, { capturedAt: '2026-10-03T08:00:00.000Z', captureMode: 'spoken' });
    put(f, 3, { capturedAt: '2026-10-04T08:00:00.000Z', kind: 'not_much', captureMode: 'typed' });
    put(f, 4, { capturedAt: '2026-10-05T08:00:00.000Z' }, 'child-nia');
    const r = entries.newestMadeLetter(f.ctx, ['child-asha'], null);
    expect(r).toEqual({ capturedAt: '2026-10-03T08:00:00.000Z', captureMode: 'spoken', kind: 'letter' });
    expect(entries.newestMadeLetter(f.ctx, ['child-asha', 'child-nia'], null)?.capturedAt).toBe('2026-10-05T08:00:00.000Z');
    expect(entries.newestMadeLetter(f.ctx, [], null)).toBeNull();
  });

  it('a deleted letter newer than the live one is not the last letter', () => {
    const f = fixture();
    insertBook(f.db, { id: 'child-asha', name: 'Asha', birthday: '2025-10-01' });
    put(f, 1, { capturedAt: '2026-10-01T08:00:00.000Z', captureMode: 'typed' });
    put(f, 2, { capturedAt: '2026-10-06T08:00:00.000Z', captureMode: 'spoken' });
    f.db.run('UPDATE entries SET deleted_at = ? WHERE id = ?', '2026-10-07T08:00:00.000Z', id(2));
    expect(rawRow(f.db, id(2))?.deleted_at).toBe('2026-10-07T08:00:00.000Z');
    expect(entries.newestMadeLetter(f.ctx, ['child-asha'], null)).toEqual({ capturedAt: '2026-10-01T08:00:00.000Z', captureMode: 'typed', kind: 'letter' });
  });

  it('with no account yet only letters with no author count, even when an authored one is newer', () => {
    const f = fixture();
    insertBook(f.db, { id: 'child-asha', name: 'Asha', birthday: '2025-10-01' });
    put(f, 1, { capturedAt: '2026-10-01T08:00:00.000Z' });
    put(f, 2, { capturedAt: '2026-10-06T08:00:00.000Z' }, 'child-asha', ME);
    expect(entries.newestMadeLetter(f.ctx, ['child-asha'], null)?.capturedAt).toBe('2026-10-01T08:00:00.000Z');
    const g = fixture();
    insertBook(g.db, { id: 'child-asha', name: 'Asha', birthday: '2025-10-01' });
    put(g, 3, { capturedAt: '2026-10-06T08:00:00.000Z' }, 'child-asha', ME);
    expect(entries.newestMadeLetter(g.ctx, ['child-asha'], null)).toBeNull();
  });

  it('only the phone user own letters count: another author is not the last letter', () => {
    const f = fixture();
    insertBook(f.db, { id: 'child-asha', name: 'Asha', birthday: '2025-10-01' });
    put(f, 1, { capturedAt: '2026-10-01T08:00:00.000Z' }, 'child-asha', ME);
    put(f, 2, { capturedAt: '2026-10-06T08:00:00.000Z' }, 'child-asha', 'user-dad');
    expect(entries.newestMadeLetter(f.ctx, ['child-asha'], ME)?.capturedAt).toBe('2026-10-01T08:00:00.000Z');
  });

  it('a 1,200-letter book answers with one statement', () => {
    const f = fixture();
    insertBook(f.db, { id: 'child-asha', name: 'Asha', birthday: '2025-10-01' });
    for (let i = 0; i < 1200; i++) put(f, i, { capturedAt: new Date(Date.UTC(2026, 0, 1) + i * 3_600_000).toISOString() });
    const sql: string[] = [];
    const db = { ...f.db, get: (q: string, ...p: never[]) => (sql.push(q), f.db.get(q, ...p)), all: (q: string) => (sql.push(q), []) } as never;
    const r = entries.newestMadeLetter({ ...f.ctx, db }, ['child-asha'], null);
    expect(sql.length).toBe(1);
    expect(sql[0]).toMatch(/ORDER BY captured_at DESC[^]*LIMIT 1\s*$/);
    expect(r).toEqual({ capturedAt: new Date(Date.UTC(2026, 0, 1) + 1199 * 3_600_000).toISOString(), captureMode: 'spoken', kind: 'letter' });
    expect(r?.capturedAt).toBe(new Date(Date.UTC(2026, 0, 1) + 1199 * 3_600_000).toISOString());
  });
});
