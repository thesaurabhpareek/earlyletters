/// <reference types="node" />
/**
 * useAgeGate's settings subscription (PR #520, Review A at 7456d3b4; LEGAL-REQ-002, D-026). Erase everything removes
 * the stored answer, so the question must come back at once. A Yes must not pass the gate from the subscription:
 * the gate screen plays its leave and then calls refresh (age-gate-screen.tsx, EXPERIENCE_PASS 2.3). The hook runs
 * on the small React stand-in (test/helpers/mini-react.ts) with the store replaced by a settings map that emits on
 * every write, as store.setSetting does. Fictional family "Asha" only (CLAUDE.md).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from './helpers/mini-react';

const h = vi.hoisted(() => ({ settings: new Map<string, string>(), listeners: new Set<() => void>() }));

vi.mock('react', async () => {
  const { reactStandIn } = await import('./helpers/mini-react');
  // useCallback is useMemo of the function (React's own definition); the stand-in has no copy of its own.
  return { ...reactStandIn, useCallback: <T,>(fn: T, deps: readonly unknown[]) => reactStandIn.useMemo(() => fn, deps) };
});
vi.mock('react-native', () => ({ AppState: { addEventListener: () => ({ remove: () => {} }) } }));
vi.mock('../src/lib/family/pending-invite', () => ({ clearPendingInvite: () => Promise.resolve() }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '1.0.0' } } }));
vi.mock('../src/lib/store', () => {
  const notify = () => [...h.listeners].forEach((l) => l());
  return {
    // Terms already agreed: this file tests the age answer and the erase subscription, not Before you begin.
    hasAgreement: () => true,
    recordAgreement: () => {},
    uuidv7: () => 'id',
    getSetting: (k: string) => h.settings.get(k) ?? null,
    setSetting: (k: string, v: string) => {
      h.settings.set(k, v);
      notify();
    },
    deleteSetting: (k: string) => {
      h.settings.delete(k);
      notify();
    },
    subscribeTo: (_t: unknown, l: () => void) => {
      h.listeners.add(l);
      return () => void h.listeners.delete(l);
    },
  };
});

const { answerAgeGate, useAgeGate } = await import('../src/lib/age-gate');

beforeEach(() => {
  h.settings.clear();
  h.listeners.clear();
});

describe('[LEGAL-REQ-002][D-026] useAgeGate and settings changes', () => {
  it('Yes does not pass the gate until the screen calls refresh after its leave', () => {
    const run = renderHook(() => useAgeGate());
    expect(run.result.current.decision).toBe('ask');
    answerAgeGate('yes');
    expect(h.settings.get('ageGate.passed')).toBe('1');
    // The gate stays mounted while the words go up and out.
    expect(run.result.current.decision).toBe('ask');
    run.result.current.refresh(); // the leave finished (age-gate-screen.tsx runOnJS(refresh))
    expect(run.result.current.decision).toBe('pass');
  });

  it('an erase brings the question back at once, with no refresh and no relaunch', () => {
    h.settings.set('ageGate.passed', '1');
    const run = renderHook(() => useAgeGate());
    expect(run.result.current.decision).toBe('pass');
    // Erase everything deletes every setting; the store emits 'settings'.
    h.settings.set('appearance', 'dark');
    for (const k of [...h.settings.keys()]) {
      h.settings.delete(k);
      [...h.listeners].forEach((l) => l());
    }
    expect(run.result.current.decision).toBe('ask');
  });

  it('No goes to the stop at once, and an unrelated setting never passes the gate', () => {
    const run = renderHook(() => useAgeGate());
    answerAgeGate('no');
    expect(run.result.current.decision).toBe('stop');
    const other = renderHook(() => useAgeGate());
    h.settings.clear();
    other.result.current.refresh();
    expect(other.result.current.decision).toBe('ask');
    h.settings.set('ageGate.passed', '1'); // written behind the hook's back, with no screen leave
    [...h.listeners].forEach((l) => l());
    expect(other.result.current.decision).toBe('ask');
  });
});
