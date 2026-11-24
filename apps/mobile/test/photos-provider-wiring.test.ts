// BL-1488: the three BL-1444 (#1340) wiring points, run instead of read. Here the SessionProvider is mounted (mini-react,
// no renderer) and the session-provider effect and the forced sign-out are driven; the Erase everything call is in
// photos-erase-wiring.test.ts. The pending picture is a real PendingPhoto over an in-memory picker; the assertion is
// that the picture and the picker's original are gone. The fictional family is Asha; no real picture is used.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PickedFiles } from '../src/lib/photos/types';

const h = vi.hoisted(() => ({
  epoch: 0,
  onAuth: null as null | ((event: string, session: { user: { id: string; email: string } } | null) => void),
  uploads: null as null | Promise<unknown>,
}));

vi.mock('react', async () => {
  const { reactStandIn } = await import('./helpers/mini-react');
  return { ...reactStandIn, createContext: (v: unknown) => ({ Provider: 'Provider', v }), useContext: () => null };
});
vi.mock('react/jsx-runtime', () => ({ jsx: (type: unknown, props: unknown) => ({ type, props }), jsxs: (type: unknown, props: unknown) => ({ type, props }), Fragment: 'Fragment' }));
vi.mock('react/jsx-dev-runtime', () => ({ jsxDEV: (type: unknown, props: unknown) => ({ type, props }), Fragment: 'Fragment' }));
vi.mock('react-native', () => ({ AppState: { currentState: 'active', addEventListener: () => ({ remove: () => {} }) }, Platform: { OS: 'ios' } }));
vi.mock('../src/lib/backup/files', () => ({ deleteBackupFilesExcept: () => {}, endBackupFileFor: () => {} }));
vi.mock('../src/lib/auth/local-claim', () => ({ bindDeviceOnlyOwners: () => () => {}, adoptDeviceOnlyLocal: async () => true }));
vi.mock('../src/lib/backup/launch-migrate', () => ({ settleBackupTokens: async () => {} }));
vi.mock('../src/lib/backup/token-vault', () => ({ removeBackupTokensFor: async () => {} }));
vi.mock('../src/lib/reminders/session', () => ({ settleReminderSession: async () => {} }));
vi.mock('../src/lib/auth/new-device/report', () => ({ reportNewDeviceFor: async () => {} }));
vi.mock('../src/lib/remote', () => ({ useRemoteConfig: () => ({ forceReauthEpoch: h.epoch }) }));
vi.mock('../src/lib/store', () => ({ currentUserId: () => null, getSetting: () => null, setSetting: () => {}, localSqlDb: () => ({}) }));
vi.mock('../src/lib/supabase/secure-storage', () => ({ secureStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} } }));
vi.mock('../src/lib/supabase/client', () => ({
  SESSION_STORAGE_KEY: 'k',
  startAutoRefreshWhileActive: () => () => {},
  getSupabaseOrNull: () => ({
    auth: {
      onAuthStateChange: (cb: typeof h.onAuth) => ((h.onAuth = cb), { data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => {},
      getSession: async () => ({ data: { session: null } }),
    },
    rpc: async () => ({ data: [{ terms_current: true, age_attested: true, sensitive_data: true, content_allowed: true }], error: null }),
  }),
}));
vi.mock('../src/lib/auth/apple', () => ({
  appleCredentialRevoked: async () => false,
  clearPendingAppleName: async () => {},
  forgetAppleUser: async () => {},
  signInWithApple: async () => 'cancelled',
  watchAppleRevocation: () => () => {},
}));
vi.mock('../src/lib/auth/auth-store', () => ({
  accountClaimPending: () => false,
  confirmAccountClaim: () => {},
  publishAuth: () => {},
  onUploadsDrained: () => () => {},
  pendingUploads: () => h.uploads ?? Promise.resolve({ count: 0, unreadable: false }),
  setClaimReaders: () => {},
  subscribeAuth: () => () => {},
}));
vi.mock('../src/lib/auth/consent', () => ({
  // The gate answers "all current": the provider reaches ready with sync on. (The real loader needs expo-application.)
  loadSyncGate: async () => ({ gate: { termsCurrent: true, ageAttested: true, sensitiveData: true, contentAllowed: true }, sensitiveDeclined: false }),
  recordConsent: async () => {},
}));
vi.mock('../src/lib/auth/email', () => ({ RESEND_WAIT_MS: 0, sendEmailLink: async () => {}, verifyEmailCode: async () => {}, verifyEmailLinkPkce: async () => {} }));
vi.mock('../src/lib/auth/google', () => ({ signInWithGoogle: async () => 'cancelled' }));
vi.mock('../src/lib/auth/passkey', () => ({ signInWithPasskey: async () => 'cancelled' }));
vi.mock('../src/lib/auth/pending', () => ({
  clearPendingEmailRequest: async () => {},
  clearWrongCodes: async () => {},
  notePendingEmailRequest: async () => {},
  noteWrongCode: async () => {},
  readPendingEmailRequest: async () => null,
  sessionSavedOnPhone: async () => false,
  wrongCodeTimes: async () => [],
}));

import { renderHook } from './helpers/mini-react';
import { SessionProvider } from '../src/lib/auth/session-provider';
import { dropQueuedAdopts } from '../src/lib/photos/adopt';
import { PendingPhoto } from '../src/lib/photos/pending';
import { registerPending } from '../src/lib/photos/registry';

const URI = 'file:///c/ImagePicker/asha-boots.jpg';
const flush = async () => {
  for (let i = 0; i < 8; i++) await new Promise<void>((r) => setTimeout(r, 0));
};
const session = (id: string) => ({ user: { id, email: 'asha@example.com' } });

/** A pending picture with its picker original, both in memory. */
async function pendingPicture() {
  const files = new Map<string, Uint8Array>([[URI, new Uint8Array([1, 2, 3])]]);
  const picked: PickedFiles = {
    read: async (u) => files.get(u) as Uint8Array,
    remove: async (u) => void files.delete(u),
    sweep: async () => files.clear(),
  };
  const p = new PendingPhoto(picked);
  registerPending(p);
  await p.set({ uri: URI });
  expect(p.source).not.toBeNull();
  return { p, left: () => [...files.keys()] };
}

let run: ReturnType<typeof renderHook> | null = null;
const mount = async () => {
  run = renderHook(() => SessionProvider({ children: null }));
  await flush(); // the Keychain read ends: nobody stored, so the auth events below decide
};

beforeEach(() => {
  h.epoch = 0;
  h.onAuth = null;
  h.uploads = null;
});
afterEach(() => {
  run?.unmount();
  run = null;
  registerPending(null);
  dropQueuedAdopts();
});

describe('[BL-1488-1] the session-provider effect releases the pending picture when the session user changes', () => {
  it('[BL-1488-1] a sign-in keeps it; the account ending or another account replacing it discards it and the picker original', async () => {
    await mount();
    h.onAuth?.('SIGNED_IN', session('user-asha-1'));
    await flush();
    const first = await pendingPicture();
    await flush();
    expect(first.p.source).not.toBeNull(); // signing in is not leaving: the picture waits for Keep

    h.onAuth?.('SIGNED_IN', session('user-asha-2')); // another account replaces it
    await flush();
    expect(first.p.source).toBeNull();
    expect(first.left()).toEqual([]);

    const second = await pendingPicture();
    h.onAuth?.('SIGNED_OUT', null); // the session ends
    await flush();
    expect(second.p.source).toBeNull();
    expect(second.left()).toEqual([]);
  });
});

describe('[BL-1488-2] a forced sign-out discards the pending picture before the uploads finish', () => {
  it('[BL-1488-2] the founder raises the number: the picture goes while the queued letters are still going up', async () => {
    h.uploads = new Promise(() => {}); // the queue never reports: the sign-out is still waiting for it
    await mount();
    h.onAuth?.('SIGNED_IN', session('user-asha-1'));
    await flush();
    const pic = await pendingPicture();
    run?.rerender();
    expect(pic.p.source).not.toBeNull(); // nothing asked yet

    h.epoch = 1;
    run?.rerender();
    await flush();
    expect(pic.p.source).toBeNull();
    expect(pic.left()).toEqual([]);
  });
});
