/**
 * Where supabase-js keeps the session: the iOS Keychain (Android Keystore)
 * through expo-secure-store, never plain storage (A-NFR-008, TDD 04 3.2.1).
 *
 * `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`: readable after the first unlock since
 * boot (so background sync works on a locked phone) and never restored from
 * an iCloud or device backup onto another phone. A restored phone signs in
 * again, which is when Terms and the age line are shown (LEGAL-REQ-001).
 *
 * Size: TDD 04 assumed a 2 KB Keychain value limit and planned an encrypted
 * side file. expo-secure-store removed that iOS warning (CHANGELOG, PR #40187)
 * and the Keychain stores larger items, so the session JSON is stored as is:
 * one standard library, no custom crypto. Verified against the installed
 * expo-secure-store 57.0.4 on 3 Oct 2026; re-check on device (session JSON is
 * about 2 to 4 KB with an Apple identity).
 *
 * Web preview only: an in-memory map, so the design harness never persists a
 * session in browser storage.
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

/** expo-secure-store keys allow letters, digits, '.', '-' and '_'. */
function safeKey(key: string): string {
  return key.replace(/[^A-Za-z0-9._-]/g, '_');
}

const memory = new Map<string, string>();

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const secureStorage: KeyValueStorage =
  Platform.OS === 'web'
    ? {
        getItem: async (key) => memory.get(key) ?? null,
        setItem: async (key, value) => {
          memory.set(key, value);
        },
        removeItem: async (key) => {
          memory.delete(key);
        },
      }
    : {
        getItem: (key) => SecureStore.getItemAsync(safeKey(key), OPTIONS),
        setItem: (key, value) => SecureStore.setItemAsync(safeKey(key), value, OPTIONS),
        removeItem: (key) => SecureStore.deleteItemAsync(safeKey(key), OPTIONS),
      };
