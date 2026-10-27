/**
 * The device surfaces backup needs, as interfaces (ADR 0024). The app
 * implements them with the native `ScribeKeys` module, expo-file-system and
 * expo-network (runtime.ts); Node tests implement them with node:crypto, the
 * file system and fakes (test/helpers/backup-node.ts). Nothing in this
 * folder except runtime.ts imports React Native or Expo.
 */

/** Which book key: one per (child, author) (F08 6.5, R2 AR-05). Each version is its own Keychain item, account `<profileId>:<childId>:v<n>`. */
export interface BookKeyRef {
  profileId: string;
  childId: string;
}

export interface DeviceKey {
  /** Random id made with the key; registered in `backup_devices`. */
  deviceId: string;
  /** X25519 public key, 32 raw bytes. */
  publicKey: Uint8Array;
}

/** An HPKE base-mode seal: the encapsulated key and the ciphertext (RFC 9180; ADR 0024 section 4). */
export interface Sealed {
  enc: Uint8Array;
  ct: Uint8Array;
}

/**
 * Keys that never leave native code in the app: the book keys (a synchronizable
 * Keychain item per book, author and version) and a device private key per
 * install and account (this device only, never synced). JavaScript only ever
 * sees per-recording file keys, wrapped keys and public keys.
 */
export interface KeyVault {
  /** False where the platform lacks what backup needs (iOS before 17, web, Android today). */
  supported(): boolean;
  /**
   * This install's device key for one account. One pair per (install, profile): the server ties
   * a device id to one profile (#151 `backup_register_device`), so a second account on this phone
   * gets its own pair, and a revoked one is replaced by a new pair (only after Try again).
   */
  deviceKey(profileId: string): Promise<DeviceKey | null>;
  /** Makes the pair the first time; returns the existing one after that. */
  createDeviceKey(profileId: string): Promise<DeviceKey>;
  deleteDeviceKey(profileId: string): Promise<void>;
  /** Versions of this book key present on this phone (from the synchronizable items). Empty when none. */
  bookKeyVersions(ref: BookKeyRef): Promise<number[]>;
  /** Adds a random 256-bit key under `version`. Throws `key_exists` when that version is already there. */
  createBookKey(ref: BookKeyRef, version: number): Promise<void>;
  deleteBookKeys(ref: BookKeyRef): Promise<void>;
  /** HMAC-SHA256(HKDF(BK, BOOK_SUBKEY_INFO.keyCheck), label) truncated to 16 bytes: lets the server row prove which key it escrowed, without the key. */
  bookKeyCheck(ref: BookKeyRef, version: number, label: Uint8Array): Promise<Uint8Array>;
  /** AES-256-GCM of a 32-byte file key under HKDF(BK, BOOK_SUBKEY_INFO.fileKeyWrap): 12-byte nonce, then ciphertext and tag (60 bytes). */
  wrapFileKey(ref: BookKeyRef, version: number, fileKey: Uint8Array, aad: Uint8Array): Promise<Uint8Array>;
  /** Codes: `key_open_failed` (the wrapped key does not authenticate), `keychain_unavailable` (the Keychain is not reading now). */
  unwrapFileKey(ref: BookKeyRef, version: number, wrapped: Uint8Array, aad: Uint8Array): Promise<Uint8Array>;
  /** Seals the book key to a recipient X25519 public key (the escrow key) with HPKE base mode. */
  sealBookKey(ref: BookKeyRef, version: number, recipient: Uint8Array, info: Uint8Array, aad: Uint8Array): Promise<Sealed>;
  /**
   * Opens a book key sealed to this device's key (the one for `ref.profileId`) and stores it under `version`. Throws on any
   * mismatch. With `check`, the opened key must match `check.expected` (HMAC under it of
   * `check.label`, 16 bytes) or nothing is written (`key_check_failed`). Codes: `key_check_failed`
   * and `key_open_failed` (the release is unusable), `keychain_unavailable` (no device key, or
   * the Keychain refused the write just now, for example as the phone locks).
   */
  openBookKey(
    ref: BookKeyRef,
    version: number,
    sealed: Sealed,
    info: Uint8Array,
    aad: Uint8Array,
    check: { label: Uint8Array; expected: Uint8Array } | null,
  ): Promise<void>;
  randomBytes(n: number): Uint8Array;
}

/** AES-256-GCM on one segment. `sealed` is ciphertext followed by the 16-byte tag. */
export interface Aead {
  seal(key: Uint8Array, nonce: Uint8Array, plaintext: Uint8Array, aad: Uint8Array): Promise<Uint8Array>;
  open(key: Uint8Array, nonce: Uint8Array, sealed: Uint8Array, aad: Uint8Array): Promise<Uint8Array>;
}

/** A file read from the start, a piece at a time. `read` returns fewer bytes only at the end. */
export interface ByteSource {
  read(n: number): Uint8Array;
  close(): void;
}

export interface ByteSink {
  write(bytes: Uint8Array): void;
  close(): void;
}

/**
 * Files. Every path is a `file://` URI. `moveNoReplace` is the restore's rule
 * in one call: it never replaces an existing file (a newer local file wins).
 */
export interface FileIO {
  exists(uri: string): boolean;
  size(uri: string): number | null;
  openRead(uri: string): ByteSource;
  /** Creates or truncates. */
  openWrite(uri: string): ByteSink;
  readSlice(uri: string, offset: number, length: number): Uint8Array;
  /** Removing a file that is not there is fine. */
  remove(uri: string): void;
  /** Throws `exists` when `to` exists; the source is then left where it was. */
  moveNoReplace(from: string, to: string): void;
  /** SHA-256 of the file, lowercase hex. */
  sha256(uri: string): Promise<string>;
  /** `Application Support/backup-tmp/<name>`: excluded from device backup, swept at launch. */
  tmpUri(name: string): string;
  listTmp(): string[];
  /** Where restored originals go: `Documents/<name>`, beside the recorder's files (in device backup, D-033). */
  documentUri(name: string): string;
}

export type NetworkKind = 'wifi' | 'cellular' | 'none' | 'unknown';

/** What may run right now. Read between every step and every part of an upload. */
export interface Conditions {
  network(): Promise<NetworkKind>;
  /**
   * The last network seen is not Wi-Fi (cellular, unknown or none), read synchronously between
   * parts and segments, so an upload that began on Wi-Fi stops when the phone leaves it.
   */
  meteredNow(): boolean;
  /** The app is in the foreground (uploads never run in the background, F08 6.5 A step 5). */
  foreground(): boolean;
  /** A recording, Review or playback is live: backup waits (F08-REQ-025, never during capture). */
  busy(): boolean;
  /** The person allowed mobile data for backup (default off: Wi-Fi only, ADR 0016 section 4.3). */
  cellularAllowed(): boolean;
  /** Remote kill switch `backupUploads` (F08-REQ-041). */
  uploadsKilled(): boolean;
  /** Remote kill switch `escrow` (F08-REQ-041, F08-U19): no restore request or release is asked for. */
  escrowKilled(): boolean;
}

export interface Clock {
  now(): number;
  sleep(ms: number): Promise<void>;
}
