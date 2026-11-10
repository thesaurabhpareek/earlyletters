/**
 * NX-36-S17 Tier 0, the route (spec docs/design/specs/S17-NEW-PHONE-SPEC-10nov.md 2.1, 2.2, gap G1; D5 ruled by Karma:
 * the screen ends when the book is on the phone and the first pull cycle is done, or at 10 seconds). Pure, no phone, no
 * network, no PGlite.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { authCopy } from '@scribe/content';
import { firstRunGate, gateInputsFromAuth, type FirstRunGateInput } from '../src/lib/first-run/gate.logic';
import {
  ARRIVAL_SHOWN,
  OPENING_WAIT_MS,
  arrivalLineOwed,
  arrivalToWrite,
  firstCycleDone,
  openingView,
  type OpeningInput,
  type OpeningView,
} from '../src/lib/first-run/new-phone.logic';

const read = (...p: string[]) => readFileSync(join(__dirname, '..', 'src', ...p), 'utf8');

const signedIn: FirstRunGateInput = { serverFeatures: true, ageAnswered: 'yes', hasSession: true, hasLocalBook: false, online: true, signInFailed: false, localStartFallback: true };
const gate = (over: Partial<FirstRunGateInput> = {}) => firstRunGate({ ...signedIn, ...over });

const opening = (over: Partial<OpeningInput> = {}) =>
  openingView({ kind: 'hasBook', hasLocalBook: false, online: true, syncPhase: 'syncing', lastSyncedAt: null, lastSyncedAtAtStart: null, elapsedMs: 0, ...over });

describe('[NX-36-S17] the gate never shows the child step to a signed-in phone until the account has said it has no book', () => {
  it('[NX-36-S17] a session and no book, with no answer yet, is the opening screen and not the child step', () => {
    const r = gate();
    expect(r.step).toBe('openingBook');
    expect(r.step).not.toBe('childStep');
    expect(r.mayBeginBook).toBe(false);
  });
  it('[NX-36-S17] opening, slow, offline and no book here yet are never the child step; only "new" is', () => {
    const views: OpeningView[] = ['opening', 'slow', 'offline', 'noBook'];
    for (const v of views) for (const online of [true, false]) {
      const r = gate({ newPhone: v, online });
      expect(r.step).not.toBe('childStep');
      expect(r.mayBeginBook).toBe(false);
    }
    expect(gate({ newPhone: 'new' }).step).toBe('childStep');
  });
  it('[NX-36-S17] the screen holds after the first page lands, until the first cycle is done (no child step, no Tonight yet)', () => {
    const r = gate({ hasLocalBook: true, newPhone: 'opening' });
    expect(r.step).toBe('openingBook');
  });
  it('[NX-36-S17] arrived leaves for Tonight and says it came from the account; an ordinary book does not', () => {
    const r = gate({ hasLocalBook: true, newPhone: 'arrived' });
    expect(r.step).toBe('openTonight');
    expect(r.arrivedFromAccount).toBe(true);
    const plain = gate({ hasLocalBook: true });
    expect(plain.step).toBe('openTonight');
    expect(plain.arrivedFromAccount).toBe(false);
  });
  it('[NX-36-S17] No book here yet is only for a phone with no book; the offline screen retries by itself', () => {
    expect(gate({ newPhone: 'noBook' }).step).toBe('noBookHere');
    expect(gate({ newPhone: 'offline' }).retryOnReconnect).toBe(true);
  });
  it('[NX-36-S17] a build with the switch off, and the under-18 stop, are unchanged', () => {
    expect(gate({ serverFeatures: false }).step).toBe('unchanged');
    expect(gate({ ageAnswered: 'no' }).step).toBe('stop');
  });
  it('[NX-36-S17] gateInputsFromAuth carries the answer through', () => {
    const i = gateInputsFromAuth({ serverFeatures: true, authState: { status: 'ready', userId: 'u', sync: 'on' }, hasLocalBook: false, newPhone: 'new' });
    expect(firstRunGate(i).step).toBe('childStep');
    const j = gateInputsFromAuth({ serverFeatures: true, authState: { status: 'ready', userId: 'u', sync: 'on' }, hasLocalBook: false });
    expect(firstRunGate(j).step).toBe('openingBook');
  });
});

describe('[NX-36-S17] the opening screen ends when the book exists and the first cycle is done, or at 10 seconds with a book', () => {
  it('[NX-36-S17] the wait is 10 seconds', () => {
    expect(OPENING_WAIT_MS).toBe(10_000);
  });
  it('[NX-36-S17] asking, or the account has a book and none has landed: opening', () => {
    expect(opening({ kind: null })).toBe('opening');
    expect(opening()).toBe('opening');
  });
  it('[NX-36-S17] the book landed but the first cycle is running: still opening (never Who is this book for)', () => {
    expect(opening({ hasLocalBook: true, syncPhase: 'syncing', elapsedMs: 4000 })).toBe('opening');
  });
  it('[NX-36-S17] the book landed and the cycle is done: arrived', () => {
    expect(opening({ hasLocalBook: true, syncPhase: 'idle', lastSyncedAt: '2026-11-10T10:00:05.000Z', elapsedMs: 4000 })).toBe('arrived');
  });
  it('[NX-36-S17] an old lastSyncedAt from before this wait is not "the first cycle is done"', () => {
    const old = '2026-11-09T10:00:00.000Z';
    expect(firstCycleDone({ syncPhase: 'idle', lastSyncedAt: old, lastSyncedAtAtStart: old })).toBe(false);
    expect(opening({ hasLocalBook: true, syncPhase: 'idle', lastSyncedAt: old, lastSyncedAtAtStart: old, elapsedMs: 3000 })).toBe('opening');
  });
  it('[NX-36-S17] 10 seconds with a book and the cycle still running: arrived', () => {
    expect(opening({ hasLocalBook: true, syncPhase: 'syncing', elapsedMs: OPENING_WAIT_MS })).toBe('arrived');
  });
  it('[NX-36-S17] 10 seconds with no book: the slow state', () => {
    expect(opening({ elapsedMs: OPENING_WAIT_MS - 1 })).toBe('opening');
    expect(opening({ elapsedMs: OPENING_WAIT_MS })).toBe('slow');
  });
  it('[NX-36-S17] a stalled engine with a connection is the slow state at once (auth, paused by the server, no response)', () => {
    for (const p of ['auth', 'paused_server', 'offline'] as const) expect(opening({ syncPhase: p })).toBe('slow');
  });
  it('[NX-36-S17] no connection before the book exists: the connection state, whatever the engine says', () => {
    expect(opening({ online: false, kind: null })).toBe('offline');
    expect(opening({ online: false, syncPhase: 'offline', elapsedMs: 20_000 })).toBe('offline');
    expect(opening({ online: false, kind: 'unknown' })).toBe('offline');
  });
  it('[NX-36-S17] an unreadable or timed out account answer, with a connection, still shows No book here yet; so does a returning account with none', () => {
    expect(opening({ kind: 'unknown' })).toBe('noBook');
    expect(opening({ kind: 'returningNoBook' })).toBe('noBook');
  });
  it('[NX-36-S17] only a clear "new" is the child step', () => {
    expect(opening({ kind: 'new' })).toBe('new');
  });
});

describe('[NX-36-S17] two-phone style: phone B signs in to an account whose book is on phone A', () => {
  it('[NX-36-S17] at no moment of the arrival is the child step the answer, and no second book can be made', () => {
    const t0 = '2026-11-10T10:00:00.000Z';
    const steps: { name: string; i: OpeningInput }[] = [
      { name: 'consent just closed, account not yet answered', i: { kind: null, hasLocalBook: false, online: true, syncPhase: 'syncing', lastSyncedAt: null, lastSyncedAtAtStart: null, elapsedMs: 0 } },
      { name: 'account says it has a book', i: { kind: 'hasBook', hasLocalBook: false, online: true, syncPhase: 'syncing', lastSyncedAt: null, lastSyncedAtAtStart: null, elapsedMs: 800 } },
      { name: 'first page landed, cycle running', i: { kind: 'hasBook', hasLocalBook: true, online: true, syncPhase: 'syncing', lastSyncedAt: null, lastSyncedAtAtStart: null, elapsedMs: 1500 } },
      { name: 'cycle done', i: { kind: 'hasBook', hasLocalBook: true, online: true, syncPhase: 'idle', lastSyncedAt: t0, lastSyncedAtAtStart: null, elapsedMs: 2500 } },
    ];
    const seen: string[] = [];
    for (const s of steps) {
      const g = gate({ hasLocalBook: s.i.hasLocalBook, newPhone: openingView(s.i) });
      seen.push(g.step);
      expect(g.step, s.name).not.toBe('childStep');
    }
    expect(seen).toEqual(['openingBook', 'openingBook', 'openingBook', 'openTonight']);
  });
  it('[NX-36-S17] after a kill during the wait the account is asked again: the same first screen, never the child step', () => {
    const hook = read('lib', 'first-run', 'use-new-phone.ts');
    // The answer lives in component state only; nothing is written or read from storage.
    expect(hook).not.toMatch(/getSetting|setSetting|AsyncStorage|SecureStore|secureStorage/);
    expect(hook).toMatch(/readAccountBooks\(o\.client\)/);
    expect(hook).toMatch(/\}, \[active, attempt\]\);/);
    expect(gate().step).toBe('openingBook');
  });
  it('[NX-36-S17] the hook records and sends nothing: no analytics event', () => {
    for (const f of ['use-new-phone.ts', 'new-phone.logic.ts']) expect(read('lib', 'first-run', f)).not.toMatch(/track\(|@\/lib\/analytics/);
    expect(read('components', 'onboarding', 'new-phone-screens.tsx')).not.toMatch(/track\(|@\/lib\/analytics/);
  });
});

describe('[NX-36-S17] the screens', () => {
  const screens = read('components', 'onboarding', 'new-phone-screens.tsx');
  it('[NX-36-S17] they are the existing StateScreen: loading has no button, the slow and offline states are the warm error form with Try again and Try another way', () => {
    expect(screens).toMatch(/import \{ StateScreen \} from '@\/components\/ui\/state-screen'/);
    expect(screens).toMatch(/kind="loading" title=\{t\.loading\} body=\{t\.loadingBody\} \/>/);
    expect(screens.match(/kind="error"/g)).toHaveLength(2);
    expect(screens).toMatch(/label: authCopy\.outage\.retry/);
    expect(screens).toMatch(/label: authCopy\.consent\.noBook\.tryAnother/);
    expect(screens).toMatch(/body=\{authCopy\.offline\.body\}/);
    expect(screens.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/\bred\b|danger|destructive|ActivityIndicator/i);
  });
  it('[NX-36-S17] Try another way signs out', () => {
    expect(read('app', 'onboarding.tsx')).toMatch(/const tryAnother = \(\) => void signOut\(\);/);
  });
  it('[NX-36-S17] the route wires the four steps, and the hook feeds the gate', () => {
    const o = read('app', 'onboarding.tsx');
    for (const s of ['openingBook', 'slowBook', 'offlineBook', 'noBookHere']) expect(o).toContain(`'${s}'`);
    expect(read('lib', 'first-run', 'use-first-run-route.ts')).toMatch(/newPhone: np\.view \?\? 'new'/);
  });
});

describe('[NX-36-S17] the arrival line: once, on the first Book, nowhere else', () => {
  it('[NX-36-S17] the setting is owed on arrival only the first time, and shown only while owed', () => {
    expect(arrivalToWrite(null)).toBe('pending');
    expect(arrivalToWrite('shown')).toBeNull();
    expect(arrivalToWrite('pending')).toBeNull();
    expect(arrivalLineOwed('pending')).toBe(true);
    expect(arrivalLineOwed(null)).toBe(false);
    expect(arrivalLineOwed(ARRIVAL_SHOWN)).toBe(false);
  });
  it('[NX-36-S17] the Book shows it with the plain words and writes shown when it is left; Tonight does not carry it', () => {
    const book = read('app', '(tabs)', 'book.tsx');
    expect(book).toMatch(/authCopy\.newPhone\.arrivedPlain/);
    expect(book).toMatch(/setSetting\(ARRIVAL_SETTING, ARRIVAL_SHOWN\)/);
    expect(read('app', '(tabs)', 'index.tsx')).not.toMatch(/arrivedPlain|ARRIVAL_SETTING/);
  });
  it('[NX-36-S17] the line has no line limit, so it grows with the text size', () => {
    const book = read('app', '(tabs)', 'book.tsx');
    const at = book.indexOf('book.arrivalLine');
    expect(book.slice(at - 200, at + 60)).not.toMatch(/numberOfLines/);
  });
  it('[NX-36-S17] the new words are the spec\'s, six keys, none registered, no numeral and no child name', () => {
    const p = authCopy.newPhone;
    expect(p).toEqual({
      loading: 'Opening your book.',
      loadingBody: 'Your letters are coming across.',
      arrivedPlain: 'Your book is here.',
      slowTitle: 'Your book is taking a while.',
      slowBody: 'Check your connection, then try again.',
      offlineTitle: 'Opening your book needs a connection.',
    });
    for (const v of Object.values(p)) {
      expect(v).not.toMatch(/\d|\{child\}|\b(we|our)\b|safe|backed up|restore|lost|missing|waiting for/i);
    }
  });
});
