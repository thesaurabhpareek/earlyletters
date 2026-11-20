/**
 * BL-599 (SEC-06, IAM-R10): the session lives in the Keychain with `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`
 * (src/lib/supabase/secure-storage.ts). Readable after the first unlock since boot, so background sync works
 * on a locked phone, and never restored from a backup onto another phone. A change to any other class (for
 * example `AFTER_FIRST_UNLOCK`, which iCloud backups carry to a new phone) or a call that drops the options
 * fails here. expo-secure-store is faked: each class is a distinct value, so only the right one matches.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => ({
  AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY',
  ALWAYS: 'ALWAYS',
  ALWAYS_THIS_DEVICE_ONLY: 'ALWAYS_THIS_DEVICE_ONLY',
  WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'WHEN_PASSCODE_SET_THIS_DEVICE_ONLY',
  WHEN_UNLOCKED: 'WHEN_UNLOCKED',
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  getItemAsync: vi.fn(async () => 'session-json'),
  setItemAsync: vi.fn(async () => undefined),
  deleteItemAsync: vi.fn(async () => undefined),
}));
vi.mock('expo-secure-store', () => store);
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

const PINNED = { keychainAccessible: 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY' };

describe('[BL-599] the session Keychain class is pinned', () => {
  beforeEach(() => {
    store.getItemAsync.mockClear();
    store.setItemAsync.mockClear();
    store.deleteItemAsync.mockClear();
  });

  it('[BL-599] setItem passes keychainAccessible AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY', async () => {
    const { secureStorage } = await import('../src/lib/supabase/secure-storage');
    await secureStorage.setItem('sb-asha-auth-token', '{"access_token":"t"}');
    expect(store.setItemAsync).toHaveBeenCalledTimes(1);
    expect(store.setItemAsync).toHaveBeenCalledWith('sb-asha-auth-token', '{"access_token":"t"}', PINNED);
  });

  it('[BL-599] getItem and removeItem pass the same options', async () => {
    const { secureStorage } = await import('../src/lib/supabase/secure-storage');
    expect(await secureStorage.getItem('sb-asha-auth-token')).toBe('session-json');
    await secureStorage.removeItem('sb-asha-auth-token');
    expect(store.getItemAsync).toHaveBeenCalledWith('sb-asha-auth-token', PINNED);
    expect(store.deleteItemAsync).toHaveBeenCalledWith('sb-asha-auth-token', PINNED);
  });

  it('[BL-599] every call carries exactly that one option, nothing looser alongside it', async () => {
    const { secureStorage } = await import('../src/lib/supabase/secure-storage');
    await secureStorage.setItem('k', 'v');
    await secureStorage.getItem('k');
    await secureStorage.removeItem('k');
    const options = [
      store.setItemAsync.mock.calls[0]?.at(-1),
      store.getItemAsync.mock.calls[0]?.at(-1),
      store.deleteItemAsync.mock.calls[0]?.at(-1),
    ];
    for (const o of options) expect(o).toStrictEqual(PINNED);
  });
});
