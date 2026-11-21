/**
 * FP-9 (NS-41, NS-45; O-8 default, O-18): Apple asks for the email only, the
 * name is never kept, and a revoked Apple sign-in is seen on foreground and on
 * Apple's notification. Fictional family "Asha" only.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRevocationGate, isAppleSession, onAppBecameActive, startAppleRevocationWatch } from '../src/lib/auth/apple-revocation.logic';

const { signInAsync, store, listeners } = vi.hoisted(() => ({
  signInAsync: vi.fn(),
  store: new Map<string, string>(),
  listeners: [] as Array<() => void>,
}));
vi.mock('expo-constants', () => ({ default: { expoConfig: { ios: { bundleIdentifier: 'com.earlyletters.scribe' } } } }));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-crypto', () => ({
  getRandomBytes: (n: number) => new Uint8Array(n).fill(7),
  digestStringAsync: async () => 'hashed-nonce-fixture',
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));
vi.mock('expo-apple-authentication', () => ({
  signInAsync,
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
  isAvailableAsync: async () => true,
  getCredentialStateAsync: async () => 1,
  AppleAuthenticationCredentialState: { REVOKED: 0 },
  addRevokeListener: (l: () => void) => {
    listeners.push(l);
    return { remove: () => void listeners.splice(listeners.indexOf(l), 1) };
  },
}));
vi.mock('../src/lib/supabase/secure-storage', () => ({
  secureStorage: {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => void store.set(k, v),
    removeItem: async (k: string) => void store.delete(k),
  },
}));

import { setServerFeaturesForTests } from '../src/lib/capabilities';
import { PENDING_NAME_KEY, signInWithApple, watchAppleRevocation } from '../src/lib/auth/apple';

const sb = {
  auth: { signInWithIdToken: async () => ({ data: { user: { id: 'u-asha' } }, error: null }) },
  functions: { invoke: async () => ({ error: null }) },
} as never;

beforeEach(() => {
  store.clear();
  listeners.length = 0;
  signInAsync.mockReset();
  setServerFeaturesForTests(false);
});

describe('[NS-41-O8] Apple email only, no name kept', () => {
  it('asks Apple for the email scope and nothing else', async () => {
    signInAsync.mockResolvedValue({ identityToken: 'tok', user: 'apple-user-asha', fullName: { givenName: 'Asha' }, authorizationCode: null });
    await signInWithApple(sb);
    expect(signInAsync.mock.calls[0][0].requestedScopes).toEqual([1]); // mutant: add FULL_NAME (0) back
  });

  it('keeps no name even if Apple sends one, and drops a name an older build left', async () => {
    store.set(PENDING_NAME_KEY, 'Asha Old');
    signInAsync.mockResolvedValue({ identityToken: 'tok', user: 'apple-user-asha', fullName: { givenName: 'Asha', familyName: 'P' }, authorizationCode: null });
    await signInWithApple(sb);
    expect(store.has(PENDING_NAME_KEY)).toBe(false); // mutant: write PENDING_NAME_KEY again
  });
});

describe('[NS-45-R4] Apple revocation seen on foreground', () => {
  const mk = (revoked: boolean, t: { v: number }) => {
    const onRevoked = vi.fn();
    const check = vi.fn(async () => revoked);
    return { onRevoked, check, gate: createRevocationGate({ check, onRevoked, now: () => t.v }) };
  };

  it('a revoked credential on foreground signs out; a kept one does not', async () => {
    const t = { v: 1_000_000 };
    const a = mk(true, t);
    await a.gate.onForeground();
    expect(a.onRevoked).toHaveBeenCalledTimes(1); // mutant: never call onRevoked
    const b = mk(false, t);
    await b.gate.onForeground();
    expect(b.onRevoked).not.toHaveBeenCalled();
  });

  it('asks Apple at most once a minute on foreground', async () => {
    const t = { v: 1_000_000 };
    const g = mk(false, t);
    await g.gate.onForeground();
    t.v += 59_000;
    await g.gate.onForeground();
    expect(g.check).toHaveBeenCalledTimes(1); // mutant: drop the gap
    t.v += 2_000;
    await g.gate.onForeground();
    expect(g.check).toHaveBeenCalledTimes(2);
  });

  it('a failed read is not a revocation', async () => {
    const onRevoked = vi.fn();
    const gate = createRevocationGate({ check: async () => Promise.reject(new Error('x')), onRevoked, now: () => 0 });
    await gate.onForeground();
    expect(onRevoked).not.toHaveBeenCalled();
  });

  it('the notification listener calls back, and is gone after unsubscribe', async () => {
    const onRevoked = vi.fn();
    const stop = watchAppleRevocation(onRevoked);
    expect(listeners).toHaveLength(1);
    listeners[0]();
    expect(onRevoked).toHaveBeenCalledTimes(1); // mutant: do not call onRevoked from the listener
    stop();
    expect(listeners).toHaveLength(0); // mutant: leave the listener registered
  });
});

describe('[NS-45-R4] the signed-in effect sets up and removes its listeners', () => {
  const setup = (uploads = 3, apple = true) => {
    const active: Array<() => void> = [];
    const revoked: Array<() => void> = [];
    const dispatchSignOut = vi.fn();
    const check = vi.fn(async () => false);
    const stop = startAppleRevocationWatch({
      check,
      isAppleSession: async () => apple,
      pendingUploads: async () => uploads,
      dispatchSignOut,
      onAppActive: (l) => (active.push(l), () => void active.splice(active.indexOf(l), 1)),
      onAppleRevoked: (l) => (revoked.push(l), () => void revoked.splice(revoked.indexOf(l), 1)),
      now: () => 5_000_000,
    });
    return { active, revoked, dispatchSignOut, check, stop };
  };

  it('reads once at start, listens to foreground and to Apple, and removes both at sign-out', () => {
    const h = setup();
    expect(h.check).toHaveBeenCalledTimes(1);
    expect(h.active).toHaveLength(1);
    expect(h.revoked).toHaveLength(1);
    h.stop();
    expect(h.active).toHaveLength(0); // mutant: skip removing the AppState listener
    expect(h.revoked).toHaveLength(0);
  });

  it('Apple notification asks sign-out with the uploads still waiting, not before they are counted', async () => {
    const h = setup(3);
    h.revoked[0]();
    await vi.waitFor(() => expect(h.dispatchSignOut).toHaveBeenCalledWith(3)); // mutant: dispatch with 0
  });

  it('nothing is dispatched after sign-out', async () => {
    const h = setup();
    const l = h.revoked[0];
    h.stop();
    l();
    await new Promise((r) => setTimeout(r, 5));
    expect(h.dispatchSignOut).not.toHaveBeenCalled();
  });

  it('an Apple revocation does not end an email session', async () => {
    const h = setup(0, false);
    h.revoked[0]();
    await new Promise((r) => setTimeout(r, 5));
    expect(h.dispatchSignOut).not.toHaveBeenCalled(); // mutant: remove the isAppleSession check
  });

  it('a session read that fails is not a revocation, signs nobody out and throws nothing', async () => {
    const revoked: Array<() => void> = [];
    const dispatchSignOut = vi.fn();
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    startAppleRevocationWatch({
      check: async () => false,
      isAppleSession: () => Promise.reject(new Error('storage down')),
      pendingUploads: async () => 1,
      dispatchSignOut,
      onAppActive: () => () => {},
      onAppleRevoked: (l) => (revoked.push(l), () => {}),
      now: () => 5_000_000,
    });
    expect(() => revoked[0]()).not.toThrow();
    await new Promise((r) => setTimeout(r, 10));
    process.off('unhandledRejection', unhandled);
    expect(dispatchSignOut).not.toHaveBeenCalled();
    expect(unhandled).not.toHaveBeenCalled(); // mutant: drop the .catch(() => false) on isAppleSession
  });

  it('reads the provider from the session', () => {
    expect(isAppleSession({ user: { app_metadata: { provider: 'apple' } } })).toBe(true);
    expect(isAppleSession({ user: { app_metadata: { provider: 'email' } } })).toBe(false);
    expect(isAppleSession(null)).toBe(false);
  });
});

describe('[NS-45-R4] coming back to the foreground ends a revoked Apple session', () => {
  const setup = (checks: boolean[], uploads = 2) => {
    const active: Array<() => void> = [];
    const t = { v: 5_000_000 };
    const dispatchSignOut = vi.fn();
    const check = vi.fn(async () => checks.shift() ?? false);
    startAppleRevocationWatch({
      check,
      isAppleSession: async () => true,
      pendingUploads: async () => uploads,
      dispatchSignOut,
      onAppActive: (l) => (active.push(l), () => {}),
      onAppleRevoked: () => () => {},
      now: () => t.v,
    });
    return { active, t, dispatchSignOut, check };
  };

  it('firing the foreground listener after the gap reads again and signs out with the waiting uploads', async () => {
    const h = setup([false, true], 2);
    await vi.waitFor(() => expect(h.check).toHaveBeenCalledTimes(1));
    await new Promise((r) => setTimeout(r, 5)); // let the start read finish
    h.t.v += 61_000;
    h.active[0]();
    await vi.waitFor(() => expect(h.dispatchSignOut).toHaveBeenCalledWith(2)); // mutant: foreground never reaches the gate
  });

  it('a revoked read at start signs out without waiting for a foreground', async () => {
    const h = setup([true], 0);
    await vi.waitFor(() => expect(h.dispatchSignOut).toHaveBeenCalledWith(0));
  });

  it('the AppState adapter calls the listener only when the app becomes active, and removes itself', () => {
    let handler: (s: string) => void = () => {};
    const remove = vi.fn();
    const listener = vi.fn();
    const off = onAppBecameActive((_e, h) => ((handler = h), { remove }), listener);
    handler('background');
    handler('inactive');
    expect(listener).not.toHaveBeenCalled();
    handler('active');
    expect(listener).toHaveBeenCalledTimes(1); // mutant: handler never calls the listener
    off();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
