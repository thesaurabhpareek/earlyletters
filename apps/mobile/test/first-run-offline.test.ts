/// <reference types="node" />
/**
 * NS-39 (FP-12): the first launch never waits on the network (R1), an offline first launch has a way forward (R5),
 * and a No at the age question discards a held invite with no request (R14). Throwing fetch and Supabase stubs from
 * test/helpers/first-run-stubs.ts. Fictional family "Asha" only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { decideGate } from '../src/lib/age-gate.logic';
import { firstRunGate, screenTwoInputs, type FirstRunGateInput } from '../src/lib/first-run/gate.logic';
import { ASHA_A, ASHA_B, fixedClock, memoryKeychain, memorySettings, recordedSupabase, throwingFetch } from './helpers/first-run-stubs';

const h = vi.hoisted(() => ({ keychain: null as null | { items: Map<string, string>; getItem: (k: string) => Promise<string | null>; setItem: (k: string, v: string) => Promise<void>; removeItem: (k: string) => Promise<void> }, settings: null as null | { getSetting: (k: string) => string | null; setSetting: (k: string, v: string) => void; deleteSetting: (k: string) => void } }));

vi.mock('react-native', () => ({ AppState: { addEventListener: () => ({ remove: () => {} }) } }));
vi.mock('react', () => ({ useCallback: (f: unknown) => f, useEffect: () => {}, useState: (v: unknown) => [v, () => {}] }));
vi.mock('../src/lib/capabilities', () => ({ serverFeaturesEnabled: () => false }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '1.0.0' } } }));
vi.mock('../src/lib/supabase/secure-storage', () => ({
  secureStorage: { getItem: (k: string) => h.keychain!.getItem(k), setItem: (k: string, v: string) => h.keychain!.setItem(k, v), removeItem: (k: string) => h.keychain!.removeItem(k) },
}));
vi.mock('../src/lib/store', () => ({
  hasAgreement: () => true,
  recordAgreement: () => {},
  uuidv7: () => 'id',
  getSetting: (k: string) => h.settings!.getSetting(k),
  setSetting: (k: string, v: string) => h.settings!.setSetting(k, v),
  deleteSetting: (k: string) => h.settings!.deleteSetting(k),
  subscribeTo: () => () => {},
}));

const net = throwingFetch();
let restore = () => {};
beforeEach(() => {
  net.calls.length = 0;
  restore = net.install();
  h.keychain = memoryKeychain();
  h.settings = memorySettings();
});
afterEach(() => restore());

const base = (over: Partial<FirstRunGateInput>): FirstRunGateInput => ({
  serverFeatures: true, ageAnswered: 'yes', hasSession: false, hasLocalBook: false, online: true, signInFailed: false, ...over,
});

describe('[NS-39-R1] first launch never waits on the network', () => {
  it('[NS-39-R1] with no answer on this install the age question comes first, offline or not, and nothing is requested', () => {
    const db = recordedSupabase();
    for (const online of [true, false]) {
      // A session in the Keychain does not move the question: the gate is asked before any session is read.
      for (const hasSession of [true, false]) {
        expect(firstRunGate(base({ ageAnswered: 'notAsked', online, hasSession })).step).toBe('ageGate');
      }
    }
    expect(decideGate({ passed: false, stoppedAt: null }, fixedClock()).decision).toBe('ask');
    expect(net.calls).toEqual([]);
    expect(db.calls).toEqual([]);
  });

  it('[NS-39-R1] the age gate and the gate rules import no network client', () => {
    const src = (f: string) => readFileSync(join(__dirname, '..', 'src', f), 'utf8');
    for (const f of ['lib/age-gate.ts', 'lib/age-gate.logic.ts', 'lib/first-run/gate.logic.ts']) {
      expect(src(f).replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/from '[^']*(supabase\/client|supabase-js|lib\/sync|sync\/engine)[^']*'|\bfetch\(/);
    }
  });
});

describe('[NS-39-R5] offline first launch has a way forward', () => {
  it('[NS-39-R5] after the age answer, offline shows the offline screen with Try again and Start on this phone', () => {
    const r = firstRunGate(base({ ...screenTwoInputs('offline') }));
    expect(r.step).toBe('outage');
    expect(r.outage).toBe('offline');
    expect(r.localStartOffered).toBe(true);
    expect(r.retryOnReconnect).toBe(true);
    expect(net.calls).toEqual([]);
  });

  it('[NS-39-R5] the local start opens the child step offline, and the Welcome returns by itself when the connection does', () => {
    expect(firstRunGate(base({ online: false, localStartChosen: true })).step).toBe('childStep');
    expect(firstRunGate(base({ online: false })).step).toBe('outage');
    expect(firstRunGate(base({ online: true })).step).toBe('signIn');
  });

  it('[NS-39-R5] a phone with a book (Asha A) reads offline as Tonight, never the outage screen', () => {
    expect(firstRunGate(base({ online: false, hasLocalBook: ASHA_A.hasLocalBook })).step).toBe('openTonight');
  });

  it('[NS-39-R5] a signed-in phone with no book (Asha B) is not sent to the offline Welcome', () => {
    expect(firstRunGate(base({ online: false, hasSession: ASHA_B.hasSession })).step).not.toBe('outage');
  });
});

describe('[NS-39-R14] a No discards a held link', () => {
  const TOKEN = 'a'.repeat(32);

  it('[NS-39-R14] a held invite token is deleted on No and no request of any kind is made', async () => {
    const { savePendingInvite, readPendingInvite } = await import('../src/lib/family/pending-invite');
    const { answerAgeGate } = await import('../src/lib/age-gate');
    const db = recordedSupabase();
    await savePendingInvite(TOKEN, fixedClock());
    expect(await readPendingInvite(fixedClock())).not.toBeNull(); // arranged: the token is held
    answerAgeGate('no');
    await new Promise((r) => setTimeout(r, 0));
    expect(await readPendingInvite(fixedClock())).toBeNull();
    expect([...h.keychain!.items.keys()].filter((k) => k.includes('pendingInvite'))).toEqual([]); // the Keychain item itself is gone
    expect(h.settings!.getSetting('ageGate.stoppedAt')).not.toBeNull();
    expect(net.calls).toEqual([]);
    expect(db.calls).toEqual([]);
  });

  it('[NS-39-R14] a held email sign-in link in memory is also dropped on No, and a Yes keeps it', async () => {
    const { setPendingAuthLink, takePendingAuthLink } = await import('../src/lib/auth/pending');
    const { answerAgeGate } = await import('../src/lib/age-gate');
    setPendingAuthLink({ tokenHash: 'h'.repeat(20), type: 'magiclink' });
    answerAgeGate('yes');
    const kept = takePendingAuthLink();
    expect(kept).not.toBeNull();
    setPendingAuthLink(kept!);
    answerAgeGate('no');
    expect(takePendingAuthLink()).toBeNull();
    expect(net.calls).toEqual([]);
  });

  it('[NS-39-R14] the address typed before the No is dropped too', async () => {
    const { setPendingEmail, getPendingEmail } = await import('../src/lib/auth/pending');
    const { answerAgeGate } = await import('../src/lib/age-gate');
    setPendingEmail('asha.parent@example.com');
    answerAgeGate('no');
    expect(getPendingEmail()).toBeNull();
  });
});
