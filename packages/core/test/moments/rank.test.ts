/**
 * For you pictures slot: class order and seeded rotation (NS-53-R51; MT-P6-R30 to R33, R39).
 * No score, heart count, tap, dwell, clock or random source.
 */
import { describe, expect, it } from 'vitest';
import { fixedHash as sharedHash } from '../../src/moments/hash';
import { MOMENTS_RULES } from '../../src/moments';
import { fixedHash, selectPicturesDay, type RankDay } from '../../src/moments/rank';

const day = (dayKey: string, flags: Partial<RankDay> = {}): RankDay => ({
  dayKey,
  occasion: false,
  yearAgo: false,
  heart: false,
  busy: false,
  video: false,
  ...flags,
});
const ctx = { bookId: 'book-asha', localDate: '2026-11-21', rotateK: 5 };

describe('fixed hash', () => {
  it('[MT-P6-R31] is FNV-1a 32 with known vectors', () => {
    expect(fixedHash('')).toBe(0x811c9dc5);
    expect(fixedHash('a')).toBe(0xe40c292c);
    expect(fixedHash('foobar')).toBe(0xbf9cf968);
  });
  it('[MT-P6-R31] is an unsigned 32-bit integer', () => {
    for (const s of ['x', 'book-asha|2026-11-21', 'zzzzzzzzzzzzzzzz']) {
      const h = fixedHash(s);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(2 ** 32);
    }
  });
});

describe('class order', () => {
  it('[MT-P6-R30] an occasion day beats a year-ago day, a heart, a busy day and a video day', () => {
    const days = [
      day('2026-11-20', { video: true }),
      day('2026-11-19', { busy: true }),
      day('2026-11-18', { heart: true }),
      day('2025-11-21', { yearAgo: true }),
      day('2026-10-01', { occasion: true }),
    ];
    expect(selectPicturesDay(days, ctx)).toEqual({ dayKey: '2026-10-01', class: 'occasion' });
  });

  it('[MT-P6-R30] then year ago, heart, busy, video, in that order', () => {
    const order: [Partial<RankDay>, string][] = [
      [{ yearAgo: true }, 'yearAgo'],
      [{ heart: true }, 'heart'],
      [{ busy: true }, 'busy'],
      [{ video: true }, 'video'],
    ];
    for (let i = 0; i < order.length; i++) {
      const days = order.slice(i).map(([f], j) => day(`2026-11-1${j}`, f));
      expect(selectPicturesDay(days, ctx)?.class).toBe(order[i][1]);
    }
  });

  it('[MT-P6-R37] nothing eligible gives null, no placeholder', () => {
    expect(selectPicturesDay([], ctx)).toBeNull();
    expect(selectPicturesDay([day('2026-11-20')], ctx)).toBeNull();
  });

  it('[MT-P6-R30] inside a class a day with flags in two classes is judged by its best class', () => {
    const d = day('2026-11-05', { heart: true, busy: true });
    expect(selectPicturesDay([d], ctx)?.class).toBe('heart');
  });
});

describe('seeded rotation', () => {
  const heartDays = ['2026-11-20', '2026-11-19', '2026-11-18', '2026-11-17', '2026-11-16', '2026-11-15', '2026-11-14']
    .map((k) => day(k, { heart: true }));

  it('[NS-53-R51] the same inputs give the same day on every call (two phones, same library)', () => {
    const a = selectPicturesDay(heartDays, ctx);
    for (let i = 0; i < 20; i++) expect(selectPicturesDay([...heartDays].reverse(), ctx)).toEqual(a);
  });

  it('[MT-P6-R31] the index is hash(localDate, bookId) mod size over the newest rotateK days', () => {
    const eligible = heartDays.slice(0, 5).map((d) => d.dayKey); // newest first, rotateK = 5
    const idx = fixedHash(`${ctx.localDate}|${ctx.bookId}`) % 5;
    expect(selectPicturesDay(heartDays, ctx)?.dayKey).toBe(eligible[idx]);
  });

  it('[MT-P6-R31] days older than the rotateK newest are never chosen', () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 28; d++) {
      const r = selectPicturesDay(heartDays, { ...ctx, localDate: `2026-11-${String(d).padStart(2, '0')}` });
      seen.add(r!.dayKey);
    }
    expect(seen.has('2026-11-14')).toBe(false);
    expect(seen.has('2026-11-15')).toBe(false);
    expect(seen.size).toBeGreaterThan(1);
  });

  it('[NS-53-R51] the choice changes across days (variety) and across books, with no random source', () => {
    const byDay = new Set<string>();
    for (let d = 1; d <= 28; d++) {
      byDay.add(selectPicturesDay(heartDays, { ...ctx, localDate: `2026-11-${String(d).padStart(2, '0')}` })!.dayKey);
    }
    expect(byDay.size).toBeGreaterThanOrEqual(3);
  });

  it('[MT-P6-R31] a single eligible day is chosen without rotation', () => {
    expect(selectPicturesDay([day('2026-11-02', { video: true })], ctx)).toEqual({ dayKey: '2026-11-02', class: 'video' });
  });

  it('[NS-53-R51] no call to a random source or the clock', () => {
    const orig = { r: Math.random, n: Date.now };
    Math.random = () => { throw new Error('random used'); };
    Date.now = () => { throw new Error('clock used'); };
    try {
      expect(() => selectPicturesDay(heartDays, ctx)).not.toThrow();
    } finally {
      Math.random = orig.r;
      Date.now = orig.n;
    }
  });
});

describe('stable day key and teaching', () => {
  it('[MT-P6-R32] one key appears once: duplicate entries merge their flags', () => {
    const r = selectPicturesDay(
      [day('2026-11-10', { busy: true }), day('2026-11-10', { heart: true }), day('2026-11-09', { busy: true })],
      { ...ctx, rotateK: 1 },
    );
    expect(r).toEqual({ dayKey: '2026-11-10', class: 'heart' });
    const flipped = selectPicturesDay(
      [day('2026-11-10', { heart: true }), day('2026-11-10', { busy: true }), day('2026-11-09', { busy: true })],
      { ...ctx, rotateK: 1 },
    );
    expect(flipped).toEqual({ dayKey: '2026-11-10', class: 'heart' });
  });

  it('[MT-P6-R32] a day the parent said "Not this one" or hid is never chosen', () => {
    const days = [day('2026-11-10', { occasion: true }), day('2026-11-09', { busy: true })];
    const r = selectPicturesDay(days, { ...ctx, excludeDayKeys: ['2026-11-10'] });
    expect(r).toEqual({ dayKey: '2026-11-09', class: 'busy' });
  });

  it('[MT-P6-R39] a heart count, tap count or score on the input changes nothing', () => {
    const base = [day('2026-11-10', { heart: true }), day('2026-11-09', { heart: true })];
    const noisy = base.map((d, i) => ({ ...d, taps: 99 - i, score: i * 10, hearts: 50 })) as RankDay[];
    expect(selectPicturesDay(noisy, ctx)).toEqual(selectPicturesDay(base, ctx));
  });

  it('[NS-53-R51] output has only a day key and a class, no number', () => {
    const r = selectPicturesDay([day('2026-11-10', { busy: true })], ctx)!;
    expect(Object.keys(r).sort()).toEqual(['class', 'dayKey']);
  });

  it('[NS-53-R51] a non-positive rotateK is treated as 1 (newest only)', () => {
    const days = [day('2026-11-10', { busy: true }), day('2026-11-09', { busy: true })];
    expect(selectPicturesDay(days, { ...ctx, rotateK: 0 })?.dayKey).toBe('2026-11-10');
  });
});

describe('[CPO-25] rotation defaults and the shared contract', () => {
  const heartDays = ['2026-11-20', '2026-11-19', '2026-11-18', '2026-11-17', '2026-11-16', '2026-11-15', '2026-11-14']
    .map((k) => day(k, { heart: true }));

  it('rotateK is a PROPOSED rules field (5) and the rotation reads it when the context gives none', () => {
    expect(MOMENTS_RULES.rotateK).toBe(5);
    const noK = { bookId: ctx.bookId, localDate: ctx.localDate };
    expect(selectPicturesDay(heartDays, noK)).toEqual(selectPicturesDay(heartDays, ctx));
  });

  it('a NaN or infinite rotateK never throws and falls back to the rules value', () => {
    for (const k of [Number.NaN, Infinity, -Infinity]) {
      expect(() => selectPicturesDay(heartDays, { ...ctx, rotateK: k })).not.toThrow();
      expect(selectPicturesDay(heartDays, { ...ctx, rotateK: k })).toEqual(selectPicturesDay(heartDays, ctx));
    }
  });

  it('the rotation text is localDate|bookId: varying bookId varies the day, and the hash is the shared one', () => {
    expect(fixedHash).toBe(sharedHash);
    const picks = new Set<string>();
    for (const book of ['book-a', 'book-b', 'book-c', 'book-d', 'book-e', 'book-f']) {
      const r = selectPicturesDay(heartDays, { ...ctx, bookId: book })!;
      expect(r.dayKey).toBe(heartDays[fixedHash(`${ctx.localDate}|${book}`) % 5].dayKey);
      picks.add(r.dayKey);
    }
    expect(picks.size).toBeGreaterThan(1);
  });
});
