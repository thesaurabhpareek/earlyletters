/**
 * BL-1463: the store write behind the Keep the book re-offer (BL-519, F02 6.1). `next-ask.test.ts` covers the pure rule;
 * this covers `askAfterSave` in `lib/asks/index.ts`, which marks the second offer only when the first was already made.
 * Without the `=== 'on'` guard the first offer would also set `asks.keepBookReoffered` and the re-offer would never come.
 * The settings store is a Map; the family is the fictional Asha.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  settings: new Map<string, string>(),
  letters: 0,
  appState: null as null | ((state: string) => void),
}));

vi.mock('react-native', () => ({
  AppState: { addEventListener: (_: string, fn: (state: string) => void) => { h.appState = fn; return { remove: () => undefined }; } },
}));
vi.mock('@/lib/analytics/ask', () => ({ noteAskShown: () => undefined }));
vi.mock('@/lib/reminders/prefs', () => ({ readPrefs: () => ({ enabled: true }) }));
vi.mock('@/lib/store', () => ({
  getSetting: (k: string) => h.settings.get(k) ?? null,
  setSetting: (k: string, v: string) => void h.settings.set(k, v),
  listChildren: () => [{ id: 'asha' }],
  listHiddenChildren: () => [],
  listEntriesForChild: () => Array.from({ length: h.letters }, () => ({ kind: 'letter' })),
}));

let askAfterSave: typeof import('../src/lib/asks').askAfterSave;

const OFFERED = 'asks.keepBookOffered';
const REOFFERED = 'asks.keepBookReoffered';
const DAY = 24 * 60 * 60 * 1000;
const T0 = new Date(2026, 10, 1, 12).getTime();

/** A new session and a new day, as the next time the person opens the app. */
function nextVisit(now: number): number {
  const later = now + DAY;
  h.appState?.('background');
  vi.setSystemTime(later);
  h.appState?.('active');
  return later;
}

beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
  h.settings.clear();
  h.letters = 0;
  vi.resetModules(); // the ask session is module state: each test starts a fresh one
  askAfterSave = (await import('../src/lib/asks')).askAfterSave;
});

describe('[BL-1463] the Keep the book offer marks the re-offer only on the second offer', () => {
  it('the first offer sets asks.keepBookOffered and leaves asks.keepBookReoffered unset', () => {
    h.letters = 2;
    expect(askAfterSave({ firstLetter: false, signInOffered: true }, T0)).toBe('keep_book');
    expect(h.settings.get(OFFERED)).toBe('on');
    expect(h.settings.has(REOFFERED)).toBe(false);
  });

  it('the second offer, after the third letter, sets both', () => {
    h.letters = 2;
    let now = T0;
    expect(askAfterSave({ firstLetter: false, signInOffered: true }, now)).toBe('keep_book');
    now = nextVisit(now);
    h.letters = 3;
    expect(askAfterSave({ firstLetter: false, signInOffered: true }, now)).toBe('keep_book');
    expect(h.settings.get(OFFERED)).toBe('on');
    expect(h.settings.get(REOFFERED)).toBe('on');
  });

  it('a third offer is not made', () => {
    h.letters = 2;
    let now = T0;
    askAfterSave({ firstLetter: false, signInOffered: true }, now);
    now = nextVisit(now);
    h.letters = 3;
    askAfterSave({ firstLetter: false, signInOffered: true }, now);
    now = nextVisit(now);
    h.letters = 4;
    expect(askAfterSave({ firstLetter: false, signInOffered: true }, now)).toBeNull();
    expect(h.settings.get(REOFFERED)).toBe('on');
  });
});
