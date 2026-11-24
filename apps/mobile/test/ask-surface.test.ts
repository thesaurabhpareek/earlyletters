/**
 * BL-1985: no setup ask while a take is recording or an export runs. `next-ask.test.ts` holds the pure rule; this holds
 * the wiring that sets the flag, the delayed re-check, the consent sheet's read, and the "skipped is not counted" rule.
 * The settings store is a Map; the family is the fictional Asha.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  settings: new Map<string, string>(),
  letters: 2,
  consent: 'unknown' as string,
}));

vi.mock('react-native', () => ({ AppState: { addEventListener: () => ({ remove: () => undefined }) } }));
vi.mock('@/lib/reminders/prefs', () => ({ readPrefs: () => ({ enabled: false }) }));
vi.mock('@/lib/store', () => ({
  getSetting: (k: string) => h.settings.get(k) ?? null,
  setSetting: (k: string, v: string) => void h.settings.set(k, v),
  listChildren: () => [{ id: 'asha' }],
  listHiddenChildren: () => [],
  listEntriesForChild: () => Array.from({ length: h.letters }, () => ({ kind: 'letter', capturedAt: '2026-11-01T10:00:00.000Z' })),
}));
vi.mock('@/lib/analytics/index', () => ({
  analytics: { consent: () => h.consent },
  lifecycle: { session: () => ({ startedAt: 1 }) },
}));

type Asks = typeof import('../src/lib/asks');
type AnalyticsAsk = typeof import('../src/lib/analytics/ask');
let asks: Asks;
let analyticsAsk: AnalyticsAsk;

const NOW = new Date(2026, 10, 23, 12).getTime();
const save = (over: { firstLetter?: boolean } = {}) => asks.askAfterSave({ firstLetter: false, signInOffered: true, ...over }, NOW);
const counts = () => ({ asks: h.settings.get('asks.asksToday') ?? null, os: h.settings.get('asks.osAsksToday') ?? null });
const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');

beforeEach(async () => {
  h.settings.clear();
  h.letters = 2;
  h.consent = 'unknown';
  vi.resetModules();
  asks = await import('../src/lib/asks');
  analyticsAsk = await import('../src/lib/analytics/ask');
});

describe('[BL-1985] a save made while a take is recording or an export runs returns no ask', () => {
  it('asks on a calm phone (the control)', () => {
    expect(save()).toBe('keep_book');
  });
  it('a take in progress: no ask', () => {
    asks.setSurfaceBusy('recording', true);
    expect(save()).toBeNull();
    expect(save({ firstLetter: true })).toBeNull();
  });
  it('an export running: no ask', () => {
    asks.setSurfaceBusy('export', true);
    expect(save()).toBeNull();
  });
  it('both clear again once each surface ends, and one surface ending does not clear the other', () => {
    asks.setSurfaceBusy('recording', true);
    asks.setSurfaceBusy('export', true);
    asks.setSurfaceBusy('recording', false);
    expect(asks.surfaceBusy()).toBe(true);
    asks.setSurfaceBusy('export', false);
    expect(asks.surfaceBusy()).toBe(false);
    expect(save()).toBe('keep_book');
  });
});

describe('[BL-1985] a delayed ask re-checks when it fires', () => {
  it('the sign-in sheet does nothing when a take starts in the delay, and is not counted', () => {
    const ask = save();
    expect(ask).toBe('keep_book');
    asks.setSurfaceBusy('recording', true); // the take starts after the Book landed
    const show = vi.fn();
    expect(asks.fireDelayedAsk('keep_book', show, NOW)).toBe(false);
    expect(show).not.toHaveBeenCalled();
    expect(counts()).toEqual({ asks: null, os: null });
    expect(h.settings.get('asks.keepBookOffered')).toBeUndefined();
  });
  it('the reminder card does nothing when an export starts in the delay', () => {
    asks.setSurfaceBusy('export', true);
    const show = vi.fn();
    expect(asks.fireDelayedAsk('reminder_prime', show, NOW)).toBe(false);
    expect(show).not.toHaveBeenCalled();
  });
  it('a skipped sign-in sheet comes back at the next save, once the surface is free', () => {
    expect(save()).toBe('keep_book');
    asks.setSurfaceBusy('recording', true);
    asks.fireDelayedAsk('keep_book', () => undefined, NOW);
    asks.setSurfaceBusy('recording', false);
    expect(save()).toBe('keep_book');
  });
  it('on a calm phone the sheet opens and is counted once (the control)', () => {
    const show = vi.fn();
    expect(save()).toBe('keep_book');
    expect(asks.fireDelayedAsk('keep_book', show, NOW)).toBe(true);
    expect(show).toHaveBeenCalledTimes(1);
    expect(h.settings.get('asks.keepBookOffered')).toBe('on');
    expect(counts()).toEqual({ asks: '1', os: '1' });
    expect(save()).toBeNull(); // one ask per session
  });
});

describe('[BL-1985] the consent sheet does not appear during a take or an export', () => {
  it('is not due while recording, and a skipped sheet is not counted', () => {
    asks.setSurfaceBusy('recording', true);
    const v = analyticsAsk.analyticsAskDueNow(['(tabs)', 'book']);
    expect(v).toEqual({ due: false, reason: 'blocking_surface' });
    expect(counts()).toEqual({ asks: null, os: null });
  });
  it('is not due while an export runs', () => {
    asks.setSurfaceBusy('export', true);
    const v = analyticsAsk.analyticsAskDueNow(['(tabs)', 'book']);
    expect(v).toEqual({ due: false, reason: 'blocking_surface' }); // not merely "not due": the recorded reason is the busy surface
    expect(counts()).toEqual({ asks: null, os: null });
  });
});

describe('[BL-1985] the screens set and clear the flag, and Review passes it at the save', () => {
  it('Review passes surfaceBusy at the save and routes both delayed asks through fireDelayedAsk', () => {
    const review = src('app/review.tsx');
    expect(review).toMatch(/surfaceBusy: surfaceBusy\(\)/);
    expect(review).toMatch(/fireDelayedAsk\('keep_book'/);
    expect(review).toMatch(/fireDelayedAsk\('reminder_prime', requestReminderPrime\)/);
    expect(review).not.toMatch(/setTimeout\(requestReminderPrime/);
  });
  it('Listen sets recording for recording, paused and finishing, and clears it on unmount', () => {
    const listen = src('app/listen.tsx');
    expect(listen).toMatch(/phase === 'recording' \|\| phase === 'paused' \|\| phase === 'finishing'/);
    expect(listen).toMatch(/setSurfaceBusy\('recording', takeInProgress\)/);
    expect(listen).toMatch(/\(\) => setSurfaceBusy\('recording', false\)/);
  });
  it('Export sets export when it starts and clears it in finally', () => {
    const exp = src('app/settings/export.tsx');
    expect(exp).toMatch(/setSurfaceBusy\('export', true\)/);
    expect(exp).toMatch(/finally \{\s*setSurfaceBusy\('export', false\)/);
  });
});
