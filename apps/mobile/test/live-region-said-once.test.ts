/// <reference types="node" />
/**
 * [PER4-018, BL-1953] The three lines that left the live-region baseline here are said to VoiceOver by the file that
 * draws them, once when they appear, and nowhere else. Before this change two of them were spoken by a caller (Tonight,
 * and the revocation-wait hook), so moving the call must not leave a second one behind: each test counts the words
 * spoken, not only that announce() ran. The components are called as plain functions on the small stand-in for React's
 * hooks, with native modules mocked. Whether VoiceOver says it, and when, is a device check.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ spoken: [] as { message: string; queue?: boolean }[] }));
vi.mock('react', async () => (await import('./helpers/mini-react')).reactStandIn);
vi.mock('react-native', () => ({ View: 'View', Platform: { OS: 'ios' } }));
vi.mock('react-native-reanimated', () => ({ default: { View: 'Animated.View' } }));
vi.mock('phosphor-react-native/src/icons/Moon', () => ({ MoonIcon: 'MoonIcon' }));
vi.mock('@/components/ui/button', () => ({ Button: 'Button' }));
vi.mock('@/components/ui/text', () => ({ Text: 'Text' }));
vi.mock('@/lib/a11y', () => ({
  announce: (message: string, opts?: { queue?: boolean }) => void h.spoken.push({ message, queue: opts?.queue }),
  useTheme: () => ({ c: { textMuted: '#666' } }),
}));

import { authCopy } from '@scribe/content';
import { NoPasscodeLine } from '../src/components/app-lock/no-passcode-line';
import { QuietDayInline } from '../src/components/tonight/quiet-day-inline';
import { appLockCopy } from '../src/lib/app-lock/copy';
import { copy } from '../src/lib/copy';
import { authReducer, initialAuthState, type AuthEvent, type AuthState } from '../src/lib/auth/machine.logic';
import { RevocationWaitLine } from '../src/lib/auth/revocation-wait-line';
import { REVOCATION_WAIT_LINE_DELAY_MS } from '../src/lib/auth/revocation-wait.logic';
import { useRevocationWaitLine } from '../src/lib/auth/use-revocation-wait-line';
import { renderHook } from './helpers/mini-react';

const said = () => h.spoken.map((s) => s.message);
/** Source without comments, so a pin never passes on a comment that names the thing. */
const code = (rel: string) =>
  readFileSync(join(__dirname, '..', 'src', rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

beforeEach(() => {
  h.spoken.length = 0;
});

describe('[PER4-018] the quiet-day line says itself once, and Tonight no longer says it', () => {
  it('[PER4-018] QuietDayInline speaks "Marked as a quiet day." once when it appears, not on a later render', () => {
    const r = renderHook(() => QuietDayInline({ onUndo: () => {} }));
    expect(said()).toEqual([copy.notMuch.savedToast]);
    r.rerender();
    r.rerender();
    expect(said()).toEqual([copy.notMuch.savedToast]);
  });

  it('[PER4-018] Tonight keeps its own line for a mark that was not saved, and has no second call for the kept one', () => {
    const tonight = code('app/(tabs)/index.tsx');
    expect(tonight).toContain('announce(copy.errors.generic.body)');
    expect(tonight).not.toContain('announce(copy.notMuch.savedToast)');
  });
});

describe('[PER4-018] the no-passcode line on the App lock page says itself once', () => {
  it('[PER4-018] NoPasscodeLine speaks the line once on arrival, queued behind the screen, and not on a later render', () => {
    const r = renderHook(() => NoPasscodeLine({ text: appLockCopy.noPasscode }));
    expect(h.spoken).toEqual([{ message: appLockCopy.noPasscode, queue: true }]);
    r.rerender();
    expect(said()).toEqual([appLockCopy.noPasscode]);
  });

  it('[PER4-018] the page draws it only while the lock cannot be used, and keeps no announce() of its own (its toasts speak)', () => {
    const page = code('app/settings/app-lock.tsx');
    expect(page).toMatch(/\{unavailable \? <NoPasscodeLine text=\{appLockCopy\.noPasscode\} \/> : null\}/);
    expect(page).not.toMatch(/\bannounce\(/);
    expect(page).not.toMatch(/accessibilityLiveRegion/);
  });
});

describe('[PER4-018] the revocation wait line is said by the line, once, and the hook only decides when it shows', () => {
  const gate = { termsCurrent: true, ageAttested: true, sensitiveData: true, contentAllowed: true };
  const waiting = (): AuthState =>
    ([
      { type: 'SIGNED_IN', userId: 'asha-1', method: 'apple' },
      { type: 'GATE_LOADED', gate, sensitiveDeclined: false },
      { type: 'SIGN_OUT_REQUESTED', reason: 'apple_revoked', pendingUploads: 2 },
    ] as AuthEvent[]).reduce(authReducer, initialAuthState);
  const LINE = authCopy.account.signOutRevokedWaiting;

  it('[PER4-018] RevocationWaitLine says nothing before the delay, then the line once, and nothing on later renders', () => {
    vi.useFakeTimers();
    try {
      const state = waiting();
      const r = renderHook(() => RevocationWaitLine({ state }));
      vi.advanceTimersByTime(REVOCATION_WAIT_LINE_DELAY_MS - 1);
      expect(said()).toEqual([]);
      vi.advanceTimersByTime(1);
      expect(said()).toEqual([LINE]);
      r.rerender();
      vi.advanceTimersByTime(REVOCATION_WAIT_LINE_DELAY_MS * 3);
      expect(said()).toEqual([LINE]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('[PER4-018] the hook alone speaks nothing, so the line is never said twice', () => {
    vi.useFakeTimers();
    try {
      const state = waiting();
      const r = renderHook(() => useRevocationWaitLine(state, LINE));
      vi.advanceTimersByTime(REVOCATION_WAIT_LINE_DELAY_MS);
      expect(r.result.current).toBe(LINE);
      expect(said()).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });
});
