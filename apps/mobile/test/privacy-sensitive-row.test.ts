/// <reference types="node" />
/**
 * Settings > Privacy's "Sync and family sharing" row tells the truth in a sign-in build (BL-485 option (b), the
 * founder's call of 30 Oct 2026). Until this, nothing registered a source (lib/analytics/privacy-sources.ts), so the
 * row read "Not signed in" for a signed-in person. Now the session provider registers one (lib/auth/sensitive-row.ts)
 * that reads and subscribes to the auth state and offers NO `open`: there is still no way to withdraw the consent
 * (option (a), the follow-up before any friend signs in), so the row must not look or act tappable.
 *
 * Three layers, so removing any one of them turns something red:
 *   1. the mapping, driven through the real state machine (lib/auth/machine.logic.ts);
 *   2. the row's hook (`useSensitiveDataStatus`) on the real auth store, on a small stand-in for React's hooks;
 *   3. source pins: the provider registers it, nothing else does, and it registers no `open`.
 * The words come from packages/content and are not changed here. Fictional family "Asha" only (CLAUDE.md): the one
 * account below is Asha's parent, an id with no meaning.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { en } from '@scribe/content';
import { showsChevron } from '../src/components/ui/list-row.logic';
import { sensitiveStatusWords, setSensitiveDataSource, useSensitiveDataStatus, type SensitiveDataStatus } from '../src/lib/analytics/privacy-sources';
import { authCopy } from '../src/lib/auth/copy';
import { publishAuth, resetAuthStoreForTests } from '../src/lib/auth/auth-store';
import { authReducer, initialAuthState, type AuthEvent, type AuthState, type SyncGate } from '../src/lib/auth/machine.logic';
import { registerSensitiveDataRow, sensitiveRowStatus } from '../src/lib/auth/sensitive-row';
import { renderHook } from './helpers/mini-react';

vi.mock('react', async () => (await import('./helpers/mini-react')).reactStandIn);

const ASHA_PARENT = '11111111-1111-4111-8111-111111111111';
const FULL: SyncGate = { termsCurrent: true, ageAttested: true, sensitiveData: true, contentAllowed: true };
const NO_CONTENT: SyncGate = { ...FULL, sensitiveData: false, contentAllowed: false };

const run = (events: AuthEvent[], from: AuthState = initialAuthState): AuthState => events.reduce(authReducer, from);
const restored = (): AuthState => run([{ type: 'RESTORED', userId: ASHA_PARENT }]);

const STATES = {
  restoring: initialAuthState,
  signedOut: run([{ type: 'RESTORED', userId: null }]),
  signingIn: run([{ type: 'RESTORED', userId: null }, { type: 'START', method: 'apple' }]),
  awaitingCode: run([{ type: 'RESTORED', userId: null }, { type: 'START', method: 'email' }, { type: 'EMAIL_SENT', at: 1 }]),
  // Signed in, the server's answer not read yet (every launch with a stored session, until the read answers).
  checkingConsent: restored(),
  // Signed in, the read failed (offline at launch, a server error, the 10 second timeout).
  unknown: run([{ type: 'GATE_UNAVAILABLE' }], restored()),
  // Signed in, consent accepted, the gate allows sync.
  on: run([{ type: 'GATE_LOADED', gate: FULL, sensitiveDeclined: false }], restored()),
  // Signed in, "Keep on this phone" answered on the sensitive-data step.
  declined: run(
    [{ type: 'GATE_LOADED', gate: NO_CONTENT, sensitiveDeclined: false }, { type: 'CONSENT_RECORDED', step: 'sensitive', accepted: false }],
    restored(),
  ),
  // Signed in, a decline or a withdraw recorded earlier (consent.ts loadSyncGate reads both as `sensitiveDeclined`).
  withdrawn: run([{ type: 'GATE_LOADED', gate: NO_CONTENT, sensitiveDeclined: true }], restored()),
  // Signed in, a consent step still to answer (Terms are not current).
  needsConsent: run([{ type: 'GATE_LOADED', gate: { ...FULL, termsCurrent: false, contentAllowed: false }, sensitiveDeclined: false }], restored()),
} satisfies Record<string, AuthState>;

const signingOut = (from: AuthState): AuthState => authReducer(from, { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 2 });

describe('[BL-485] the row maps each auth state to what is true', () => {
  it('the fixtures are the states the app reaches (so the table below tests the real machine)', () => {
    expect(STATES.restoring.status).toBe('restoring');
    expect(STATES.signedOut.status).toBe('signedOut');
    expect(STATES.signingIn.status).toBe('signingIn');
    expect(STATES.awaitingCode.status).toBe('awaitingCode');
    expect(STATES.checkingConsent.status).toBe('checkingConsent');
    expect(STATES.unknown).toMatchObject({ status: 'ready', sync: 'unknown' });
    expect(STATES.on).toMatchObject({ status: 'ready', sync: 'on' });
    expect(STATES.declined).toMatchObject({ status: 'ready', sync: 'off' });
    expect(STATES.withdrawn).toMatchObject({ status: 'ready', sync: 'off' });
    expect(STATES.needsConsent.status).toBe('needsConsent');
  });

  it('signed out (and not yet signed in): "Not signed in"', () => {
    for (const s of [STATES.restoring, STATES.signedOut, STATES.signingIn, STATES.awaitingCode]) {
      expect(sensitiveRowStatus(s), s.status).toBe('signed_out');
    }
  });

  it('signed in with consent accepted and the gate allowing sync: On', () => {
    expect(sensitiveRowStatus(STATES.on)).toBe('on');
  });

  it('signed in with sensitive-data declined, withdrawn, or a consent step still to answer: Off', () => {
    expect(sensitiveRowStatus(STATES.declined)).toBe('off');
    expect(sensitiveRowStatus(STATES.withdrawn)).toBe('off');
    expect(sensitiveRowStatus(STATES.needsConsent)).toBe('off');
  });

  it('signed in but the gate could not be read (SyncMode unknown, or still being read): never On, never Off, never Not signed in', () => {
    expect(sensitiveRowStatus(STATES.unknown)).toBe('unknown');
    expect(sensitiveRowStatus(STATES.checkingConsent)).toBe('unknown');
  });

  it('a sign-out in progress keeps the sync state the person had, and signed out follows', () => {
    expect(sensitiveRowStatus(signingOut(STATES.on))).toBe('on');
    expect(sensitiveRowStatus(signingOut(STATES.declined))).toBe('off');
    expect(sensitiveRowStatus(signingOut(STATES.unknown))).toBe('unknown');
    expect(sensitiveRowStatus(authReducer(signingOut(STATES.on), { type: 'SIGNED_OUT' }))).toBe('signed_out');
  });

  it('a gate answer moves the row: unknown -> on, on -> off after a withdraw elsewhere', () => {
    const answered = authReducer(STATES.unknown, { type: 'GATE_LOADED', gate: FULL, sensitiveDeclined: false });
    expect(sensitiveRowStatus(answered)).toBe('on');
    const withdrawnElsewhere = authReducer(answered, { type: 'GATE_LOADED', gate: NO_CONTENT, sensitiveDeclined: true });
    expect(sensitiveRowStatus(withdrawnElsewhere)).toBe('off');
  });

  it('On is claimed only when the machine itself says sync is on (the invariant behind every row above)', () => {
    const all: AuthState[] = [...Object.values(STATES), signingOut(STATES.on), signingOut(STATES.declined), signingOut(STATES.unknown)];
    for (const s of all) {
      if (sensitiveRowStatus(s) === 'on') expect(s.status === 'ready' || s.status === 'signingOut' ? s.sync : null, s.status).toBe('on');
      // A session whose answer is unread says so, and a phone with no session never claims a consent.
      if (s.status === 'checkingConsent') expect(sensitiveRowStatus(s)).toBe('unknown');
      if (!('userId' in s)) expect(sensitiveRowStatus(s)).toBe('signed_out');
    }
  });
});

describe('[BL-485] the words for each status are the existing words', () => {
  it('On, Off and Not signed in are the Privacy row\'s own strings, and unknown is the Account row\'s "Waiting for a connection"', () => {
    expect(sensitiveStatusWords('on')).toBe(en.settings.privacy.sensitiveOn);
    expect(sensitiveStatusWords('off')).toBe(en.settings.privacy.sensitiveOff);
    expect(sensitiveStatusWords('signed_out')).toBe(en.settings.privacy.sensitiveSignedOut);
    expect(sensitiveStatusWords('unknown')).toBe(authCopy.account.sync.unknown);
    expect(authCopy.account.sync.unknown).toBe('Waiting for a connection');
  });

  it('the four statuses never share words, so a person can tell which one they are looking at', () => {
    const statuses: SensitiveDataStatus[] = ['on', 'off', 'unknown', 'signed_out'];
    expect(new Set(statuses.map(sensitiveStatusWords)).size).toBe(4);
  });
});

describe('[BL-485] the row, on the real auth store (the hook Settings > Privacy renders)', () => {
  beforeEach(() => {
    resetAuthStoreForTests();
    // Back to what Settings > Privacy has when nothing registers: "Not signed in".
    setSensitiveDataSource({ read: () => 'signed_out' });
  });

  it('with nothing registered a signed-in phone reads "Not signed in": the bug this PR closes', () => {
    const row = renderHook(() => useSensitiveDataStatus());
    publishAuth(STATES.on);
    expect(row.result.current.status).toBe('signed_out');
  });

  it('registered, the row follows the auth state as it moves, with no reload', () => {
    registerSensitiveDataRow();
    const row = renderHook(() => useSensitiveDataStatus());
    expect(row.result.current.status).toBe('signed_out');

    publishAuth(STATES.checkingConsent);
    expect(row.result.current.status).toBe('unknown');
    publishAuth(STATES.on);
    expect(row.result.current.status).toBe('on');
    publishAuth(STATES.declined);
    expect(row.result.current.status).toBe('off');
    publishAuth(STATES.unknown);
    expect(row.result.current.status).toBe('unknown');
    publishAuth(STATES.signedOut);
    expect(row.result.current.status).toBe('signed_out');
    row.unmount();
  });

  it('a screen opened after sign-in reads the current state at once', () => {
    registerSensitiveDataRow();
    publishAuth(STATES.on);
    const row = renderHook(() => useSensitiveDataStatus());
    expect(row.result.current.status).toBe('on');
    row.unmount();
  });

  it('there is still no way to change it from here: no `open` for On, Off or unknown', () => {
    registerSensitiveDataRow();
    const row = renderHook(() => useSensitiveDataStatus());
    for (const s of [STATES.on, STATES.declined, STATES.unknown, STATES.signedOut]) {
      publishAuth(s);
      expect(row.result.current.open, s.status).toBeUndefined();
    }
    row.unmount();
  });
});

describe('[BL-485] source pins: who registers the row, and that it stays read-only', () => {
  const SRC = join(__dirname, '..', 'src');
  const strip = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const code = (rel: string) => strip(readFileSync(join(SRC, rel), 'utf8'));
  const sources = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = join(dir, e.name);
      if (e.isDirectory()) return sources(p);
      return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
    });

  it('the session provider registers the source once, from an effect that runs on mount', () => {
    const provider = code('lib/auth/session-provider.tsx');
    expect(provider).toMatch(/import \{ registerSensitiveDataRow \} from '\.\/sensitive-row';/);
    expect(provider).toMatch(/useEffect\(\(\) => \{\s*registerSensitiveDataRow\(\);\s*\}, \[\]\);/);
  });

  it('it is the only caller of setSensitiveDataSource in the app', () => {
    const callers = sources(SRC)
      .map((f) => relative(SRC, f))
      .filter((f) => f !== 'lib/analytics/privacy-sources.ts')
      .filter((f) => /\bsetSensitiveDataSource\s*\(/.test(code(f)));
    expect(callers).toEqual(['lib/auth/sensitive-row.ts']);
  });

  it('the source reads and subscribes only: no `open`, no withdraw, no consent write, no sheet', () => {
    const source = code('lib/auth/sensitive-row.ts');
    expect(source).toMatch(/read: \(\) => sensitiveRowStatus\(getAuthSnapshot\(\)\)/);
    expect(source).toMatch(/subscribe: subscribeAuth/);
    expect(source).not.toMatch(/\bopen\b/);
    expect(source).not.toMatch(/withdraw|recordConsent|record_policy_act|router|Sheet|Alert/i);
  });

  it('Settings > Privacy gives the row no press handler of its own and draws words for every status', () => {
    const screen = code('app/settings/privacy.tsx');
    expect(screen).toMatch(/onPress=\{sensitive\.open\}/);
    expect(screen).toMatch(/trailing=\{sensitive\.open \? 'chevron' : 'none'\}/);
    expect(screen).toMatch(/sensitiveStatusWords\(sensitive\.status\)/);
    // The row has these props and no others: nothing here can withdraw (the analytics switch's withdrawAnalytics is another row).
    const row = screen.match(/<ListRow\s+title=\{p\.sensitiveLabel\}[\s\S]*?\/>/)?.[0] ?? '';
    expect([...row.matchAll(/\b(\w+)=\{/g)].map((m) => m[1])).toEqual(['title', 'value', 'trailing', 'onPress', 'disabled']);
  });

  it('a row with no press handler is a plain View with no chevron, so On and Off do not look or act tappable', () => {
    expect(showsChevron({ pressable: false, disabled: false, destructive: false, hasTrailingNode: false, android: false })).toBe(false);
    // components/ui/list-row.tsx (design-systems): no `onPress` returns a View, with no Pressable and no pressed colour.
    expect(code('components/ui/list-row.tsx')).toMatch(/if \(!onPress\) \{\s*return \(\s*<View/);
  });
});
