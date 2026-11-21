/// <reference types="node" />
/**
 * NS-40 first-run age rows, cited under their own ids (test plan B13 risk 14, T7-126; until now only PRD-REQ-019 and
 * LEGAL-REQ-002 named these rules). R1: the age question comes first, nothing selected, nothing stored. R8: No at the
 * age step ends the session: only the time of the No is kept, nothing is sent. R9, R10 and R12 (the D-131 country
 * check) are NOT here: no country hook exists on develop, so they are blocked, not skipped. Fictional family "Asha".
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  settings: new Map<string, string>(),
  writes: [] as string[],
  clearedInvite: 0,
}));

vi.mock('react', async () => {
  const { reactStandIn } = await import('./helpers/mini-react');
  return { ...reactStandIn, useCallback: <T,>(fn: T, deps: readonly unknown[]) => reactStandIn.useMemo(() => fn, deps) };
});
vi.mock('react-native', () => ({ AppState: { addEventListener: () => ({ remove: () => {} }) } }));
vi.mock('../src/lib/family/pending-invite', () => ({ clearPendingInvite: () => { h.clearedInvite++; return Promise.resolve(); } }));
// The sign-in link and email request stores sit on secure-storage (expo-secure-store); this file observes neither.
vi.mock('../src/lib/auth/pending', () => ({
  clearPendingEmailRequest: () => Promise.resolve(),
  takePendingAuthLink: () => null,
}));
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '1.0.0' } } }));
vi.mock('../src/lib/store', () => ({
  hasAgreement: () => false,
  recordAgreement: () => {},
  uuidv7: () => 'id',
  getSetting: (k: string) => h.settings.get(k) ?? null,
  setSetting: (k: string, v: string) => { h.writes.push(k); h.settings.set(k, v); },
  deleteSetting: (k: string) => { h.settings.delete(k); },
  subscribeTo: () => () => {},
}));

const { answerAgeGate } = await import('../src/lib/age-gate');
const { decideGate } = await import('../src/lib/age-gate.logic');
const { renderHook } = await import('./helpers/mini-react');
const { useAgeGate } = await import('../src/lib/age-gate');

beforeEach(() => {
  h.settings.clear();
  h.writes.length = 0;
  h.clearedInvite = 0;
});

describe('NS-40 the age question', () => {
  it('[NS-40-R1] the age question comes first: a fresh install is asked, nothing is selected and nothing is written', () => {
    const run = renderHook(() => useAgeGate());
    expect(run.result.current.decision).toBe('ask');
    expect(h.writes).toEqual([]);
    expect(h.settings.size).toBe(0);
    expect(decideGate({ passed: false, stoppedAt: null }, Date.now()).decision).toBe('ask');
  });

  it('[NS-40-R8] No at the age step ends the session: only ageGate.stoppedAt is stored, as a time, and nothing is sent', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    try {
      const run = renderHook(() => useAgeGate());
      answerAgeGate('no');
      expect([...h.settings.keys()]).toEqual(['ageGate.stoppedAt']);
      expect(new Date(h.settings.get('ageGate.stoppedAt')!).toISOString()).toBe(h.settings.get('ageGate.stoppedAt'));
      expect(h.settings.has('ageGate.passed')).toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();
      run.result.current.refresh();
      expect(run.result.current.decision).toBe('stop');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('[NS-40-R8] a No also drops an invite link that opened the app', () => {
    answerAgeGate('no');
    expect(h.clearedInvite).toBe(1);
  });
});
