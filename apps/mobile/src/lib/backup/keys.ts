/**
 * Keys on the phone (WP-F08-B2; F08 6.5 key model; ADR 0024 section 2).
 *
 * - One book key (BK) per (child, author, version) in a synchronizable Keychain
 *   item keyed `<profile_id>:<child_id>`, so it reaches the author's other
 *   Apple devices through iCloud Keychain (F08-REQ-021). Two parents of one
 *   book each have their own BK; neither is ever given the other's.
 * - One X25519 device key pair per install, private key this device only
 *   (F08-REQ-027). Its public key is registered in `backup_devices`; the escrow
 *   function seals released BKs to it.
 * - The never-create rule (F08-REQ-028): while the server holds an active
 *   `child_keys` row for (child, me), this phone never makes a BK. It waits up
 *   to 2 minutes for iCloud Keychain, then restores through escrow.
 * - Every BK is sealed on the phone to the escrow public key (wrap format 1,
 *   contract.ts) and stored through `backup_store_key`, so no server ever
 *   receives a plaintext BK (F08 6.5).
 * - A key check (HMAC under the BK, stored beside the wrap) proves the BK on
 *   this phone is the one the server escrowed. A Keychain item replaced by a
 *   sync conflict fails the check and is never used to encrypt or decrypt.
 */
import { b64, bytesToBase64, equalBytes } from './bytes';
import {
  ENCRYPT_KEY_VERSION,
  escrowAad,
  escrowInfo,
  isKeyExists,
  keyCheckLabel,
  releaseAad,
  releaseInfo,
  type BackupServer,
  type ChildKeyRow,
  type EscrowPublicKey,
  type ReleasedKey,
} from './contract';
import type { BookKeyRef, Clock, DeviceKey, KeyVault } from './ports';

/** How long a new phone waits for iCloud Keychain before asking escrow (F08 6.5 A step 4) [A]. */
export const ICLOUD_WAIT_MS = 2 * 60 * 1000;

export interface MetaStore {
  getMeta(key: string): string | null;
  setMeta(key: string, value: string): void;
  deleteMeta(key: string): void;
}

export type BookKeyState =
  | { kind: 'ready'; version: number }
  /** The server has a key this phone lacks: iCloud Keychain may still bring it. */
  | { kind: 'waiting'; until: number }
  /** iCloud Keychain did not bring it in time: restore through escrow. */
  | { kind: 'needs_escrow' }
  /** No key exists for this book on the server, and the caller did not ask to make one (restore). */
  | { kind: 'none' }
  | { kind: 'unavailable'; reason: 'unsupported' | 'no_escrow_key' | 'key_version' };

export interface KeyManagerDeps {
  vault: KeyVault;
  server: BackupServer;
  meta: MetaStore;
  clock: Clock;
  profileId: string;
  /** Escrow public keys this build trusts; the highest version seals new keys (F08 6.5 G4). */
  escrowKeys: () => readonly EscrowPublicKey[];
}

const waitKey = (childId: string) => `icloudWaitSince:${childId}`;
const DEVICE_REGISTERED = 'deviceRegistered';

export function createKeyManager(d: KeyManagerDeps) {
  let rows: ChildKeyRow[] | null = null;
  const ref = (childId: string): BookKeyRef => ({ profileId: d.profileId, childId });
  const label = (childId: string, v: number) => keyCheckLabel(d.profileId, childId, v);
  const localCheckKey = (childId: string, v: number) => `keyCheck:${childId}:${v}`;
  /** Set when this phone made the key; cleared once the server is known to hold that very key. */
  const madeHereKey = (childId: string, v: number) => `madeHere:${childId}:${v}`;
  const unconfirmedHere = (childId: string, v: number) => d.meta.getMeta(madeHereKey(childId, v)) !== null && d.meta.getMeta(localCheckKey(childId, v)) === null;

  async function serverRows(refresh = false): Promise<ChildKeyRow[]> {
    if (!rows || refresh) rows = await d.server.listKeys();
    return rows;
  }

  function newestRow(all: ChildKeyRow[], childId: string): ChildKeyRow | null {
    let best: ChildKeyRow | null = null;
    for (const r of all) if (r.childId === childId && (!best || r.keyVersion > best.keyVersion)) best = r;
    return best;
  }

  /**
   * The check a local key of this version must pass: the server's, else the one
   * this device recorded when it stored the key itself, when escrow released it,
   * or when the key opened an object from the server. Null: nothing to compare.
   */
  function expectedCheck(row: ChildKeyRow): string | null {
    return row.keyCheck ?? d.meta.getMeta(localCheckKey(row.childId, row.keyVersion));
  }

  async function recordCheck(childId: string, version: number): Promise<void> {
    const check = await d.vault.bookKeyCheck(ref(childId), version, label(childId, version));
    d.meta.setMeta(localCheckKey(childId, version), bytesToBase64(check));
    d.meta.deleteMeta(madeHereKey(childId, version));
  }

  /**
   * True when this phone holds the row's version and it is the escrowed key. With
   * no check to compare, `trustUnverified` decides: true on the normal path (a key
   * iCloud Keychain brought), false where this phone may have made a different key.
   */
  async function holdsChecked(childId: string, row: ChildKeyRow, trustUnverified = true): Promise<boolean> {
    const local = await d.vault.bookKeyVersions(ref(childId));
    if (!local.includes(row.keyVersion)) return false;
    const expected = expectedCheck(row);
    // Made here and never confirmed as the escrowed key (its store lost a race): never trusted, on any call.
    if (!expected) return trustUnverified && !unconfirmedHere(childId, row.keyVersion);
    const check = await d.vault.bookKeyCheck(ref(childId), row.keyVersion, label(childId, row.keyVersion));
    return equalBytes(check, b64(expected));
  }

  function currentEscrowKey(): EscrowPublicKey | null {
    let best: EscrowPublicKey | null = null;
    for (const k of d.escrowKeys()) if (!best || k.version > best.version) best = k;
    return best;
  }

  async function waitOrEscrow(childId: string): Promise<BookKeyState> {
    const now = d.clock.now();
    const since = Number(d.meta.getMeta(waitKey(childId)) ?? NaN);
    const start = Number.isFinite(since) && since <= now ? since : now;
    if (start === now) d.meta.setMeta(waitKey(childId), String(now));
    return now - start < ICLOUD_WAIT_MS ? { kind: 'waiting', until: start + ICLOUD_WAIT_MS } : { kind: 'needs_escrow' };
  }

  async function storeLocalKey(childId: string, version: number, escrow: EscrowPublicKey): Promise<void> {
    const aad = escrowAad(d.profileId, childId, version, escrow.version);
    const sealed = await d.vault.sealBookKey(ref(childId), version, b64(escrow.publicKey), escrowInfo(), aad);
    const check = await d.vault.bookKeyCheck(ref(childId), version, label(childId, version));
    await d.server.storeKey({
      childId,
      keyVersion: version,
      escrowKeyVersion: escrow.version,
      keyCheck: bytesToBase64(check),
      enc: bytesToBase64(sealed.enc),
      ct: bytesToBase64(sealed.ct),
    });
    // The server holds exactly this key now: remember its check on this device.
    d.meta.setMeta(localCheckKey(childId, version), bytesToBase64(check));
    d.meta.deleteMeta(madeHereKey(childId, version));
  }

  return {
    /** Makes (once) and registers (once per device id) this install's device key pair. */
    async ensureDevice(): Promise<DeviceKey> {
      const key = (await d.vault.deviceKey()) ?? (await d.vault.createDeviceKey());
      if (d.meta.getMeta(DEVICE_REGISTERED) !== key.deviceId) {
        await d.server.registerDevice({ deviceId: key.deviceId, publicKey: bytesToBase64(key.publicKey) });
        d.meta.setMeta(DEVICE_REGISTERED, key.deviceId);
      }
      return key;
    },

    /**
     * The key to encrypt this book's recordings with (`create: true`, the upload
     * path; always version 1 in v1.0, ENCRYPT_KEY_VERSION) or whether this phone
     * can open what the server holds (`create: false`, the restore path).
     */
    async keyFor(childId: string, opts: { create: boolean }): Promise<BookKeyState> {
      if (!d.vault.supported()) return { kind: 'unavailable', reason: 'unsupported' };
      const all = await serverRows();
      let row = opts.create ? (all.find((r) => r.childId === childId && r.keyVersion === ENCRYPT_KEY_VERSION) ?? null) : newestRow(all, childId);
      if (opts.create && !row && newestRow(all, childId)) return { kind: 'unavailable', reason: 'key_version' };
      if (row) {
        if (await holdsChecked(childId, row)) {
          d.meta.deleteMeta(waitKey(childId));
          return { kind: 'ready', version: row.keyVersion };
        }
        return waitOrEscrow(childId); // never create while the server holds one (F08-REQ-028)
      }
      if (!opts.create) return { kind: 'none' };
      const escrow = currentEscrowKey();
      if (!escrow) return { kind: 'unavailable', reason: 'no_escrow_key' };
      // Version 1 already on this phone with no server row: an earlier store failed, or the server
      // was restored to an earlier point (F08-U30). Store it again; never make a second.
      const version = ENCRYPT_KEY_VERSION;
      if (!(await d.vault.bookKeyVersions(ref(childId))).includes(version)) {
        try {
          await d.vault.createBookKey(ref(childId), version);
          d.meta.setMeta(madeHereKey(childId, version), '1');
        } catch (e) {
          if ((e as { code?: string }).code !== 'key_exists') throw e;
        }
      }
      try {
        await storeLocalKey(childId, version, escrow);
      } catch (e) {
        if (!isKeyExists(e)) throw e;
        // Another of my devices stored this version first: theirs is the key. Ours is used only when a
        // check proves it is the same one; with nothing to compare, never (it may be a different key).
        row = (await serverRows(true)).find((r) => r.childId === childId && r.keyVersion === version) ?? null;
        if (row && (await holdsChecked(childId, row, false))) return { kind: 'ready', version };
        return waitOrEscrow(childId);
      }
      rows = null;
      d.meta.deleteMeta(waitKey(childId));
      return { kind: 'ready', version };
    },

    /** Whether this phone holds `version` of the book key and it is the escrowed one (restore of a given object). */
    async canOpen(childId: string, version: number): Promise<boolean> {
      const row = (await serverRows()).find((r) => r.childId === childId && r.keyVersion === version);
      return row ? holdsChecked(childId, row) : false;
    },

    /** The key opened an object the server holds: it is the escrowed one. Remember its check on this device. */
    async markVerified(childId: string, version: number): Promise<void> {
      if (!d.meta.getMeta(localCheckKey(childId, version))) await recordCheck(childId, version);
    },

    /**
     * Stores keys the escrow function released to this device for `requestId`.
     * A good key already here is left alone. A different one is replaced only
     * when the released key passes an expected check (native refuses otherwise),
     * so a wrong release can never overwrite a right key across iCloud Keychain.
     */
    async storeReleased(keys: readonly ReleasedKey[], deviceId: string, requestId: string): Promise<number> {
      const all = await serverRows(true);
      let stored = 0;
      for (const k of keys) {
        const row = all.find((r) => r.childId === k.childId && r.keyVersion === k.keyVersion);
        if (!row) continue;
        if (await holdsChecked(k.childId, row, false)) {
          stored += 1;
          continue;
        }
        const expected = expectedCheck(row);
        await d.vault.openBookKey(
          ref(k.childId),
          k.keyVersion,
          { enc: b64(k.enc), ct: b64(k.ct) },
          releaseInfo(),
          releaseAad(d.profileId, deviceId, requestId, k.childId, k.keyVersion),
          {
            expected: expected ? { check: b64(expected), label: label(k.childId, k.keyVersion) } : null,
            // A key made here that the server never confirmed may be replaced by the escrowed one.
            replaceUntrusted: unconfirmedHere(k.childId, k.keyVersion),
          },
        );
        await recordCheck(k.childId, k.keyVersion);
        stored += 1;
        d.meta.deleteMeta(waitKey(k.childId));
      }
      return stored;
    },

    /** Forget the cached server rows (after sign-in, or when another device may have stored a key). */
    refresh(): void {
      rows = null;
    },

    serverRows,
  };
}

export type KeyManager = ReturnType<typeof createKeyManager>;
