/**
 * Local Expo module `ScribeKeys` (iOS 17 and later for HPKE; ADR 0024).
 * Optional: absent in Expo Go, on web and on Android, so callers handle null.
 * Loaded only by `src/lib/backup/runtime.ts`, which only `src/lib/backup/gate.ts`
 * loads, and only in a build with `capabilities.backup` on.
 *
 * Book keys and the device private key never cross into JavaScript: every
 * operation that needs them takes the Keychain item's service and account.
 */
import { requireOptionalNativeModule } from 'expo';

export interface ScribeKeysNative {
  isSupported(): boolean;
  /** file:// URI of Application Support/backup-tmp/, made if missing, excluded from backup. */
  backupTmpDirectory(): string;
  deviceKey(): Promise<{ deviceId: string; publicKey: Uint8Array } | null>;
  createDeviceKey(): Promise<{ deviceId: string; publicKey: Uint8Array }>;
  deleteDeviceKey(): Promise<void>;
  bookKeyVersions(service: string, account: string): Promise<number[]>;
  createBookKey(service: string, account: string, version: number): Promise<void>;
  deleteBookKeys(service: string, account: string): Promise<void>;
  bookKeyCheck(service: string, account: string, version: number, label: Uint8Array): Promise<Uint8Array>;
  wrapFileKey(service: string, account: string, version: number, fileKey: Uint8Array, aad: Uint8Array): Promise<Uint8Array>;
  unwrapFileKey(service: string, account: string, version: number, wrapped: Uint8Array, aad: Uint8Array): Promise<Uint8Array>;
  sealBookKey(
    service: string,
    account: string,
    version: number,
    recipient: Uint8Array,
    info: Uint8Array,
    aad: Uint8Array,
  ): Promise<{ enc: Uint8Array; ct: Uint8Array }>;
  /** `expectedCheck` and `checkLabel` empty and `replaceUntrusted` false: never replace a different key of that version. */
  openBookKey(
    service: string,
    account: string,
    version: number,
    enc: Uint8Array,
    ct: Uint8Array,
    info: Uint8Array,
    aad: Uint8Array,
    expectedCheck: Uint8Array,
    checkLabel: Uint8Array,
    replaceUntrusted: boolean,
  ): Promise<void>;
  aesGcmSeal(key: Uint8Array, nonce: Uint8Array, plaintext: Uint8Array, aad: Uint8Array): Promise<Uint8Array>;
  aesGcmOpen(key: Uint8Array, nonce: Uint8Array, sealed: Uint8Array, aad: Uint8Array): Promise<Uint8Array>;
}

export const ScribeKeys = requireOptionalNativeModule<ScribeKeysNative>('ScribeKeys');

/** Error codes the native side throws. Never carries a key, an id or a path. */
export type ScribeKeysErrorCode =
  | 'ERR_SCRIBE_KEYS_EXISTS'
  | 'ERR_SCRIBE_KEYS_NO_KEY'
  | 'ERR_SCRIBE_KEYS_NO_DEVICE'
  | 'ERR_SCRIBE_KEYS_OPEN'
  | 'ERR_SCRIBE_KEYS_CHECK'
  | 'ERR_SCRIBE_KEYS_SEAL'
  | 'ERR_SCRIBE_KEYS_INPUT'
  | 'ERR_SCRIBE_KEYS_ITEM'
  | 'ERR_SCRIBE_KEYS_KEYCHAIN'
  | 'ERR_SCRIBE_KEYS_UNSUPPORTED';

export function scribeKeysErrorCode(e: unknown): ScribeKeysErrorCode | null {
  const code = (e as { code?: unknown } | null)?.code;
  return typeof code === 'string' && code.startsWith('ERR_SCRIBE_KEYS_') ? (code as ScribeKeysErrorCode) : null;
}
