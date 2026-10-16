/**
 * Keys on the phone (WP-F08-B2; F08 6.5 key model; ADR 0024 section 2).
 *
 * - One book key (BK) per (child, author, version) in a synchronizable Keychain
 *   item per version keyed `<profile_id>:<child_id>:v<n>`, so it reaches the author's other
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
 *   It catches accidents, not a forger: whoever writes `child_keys` can seal a
 *   key of their own to the (public) escrow key and compute its check too.
 * - Until the server stores the check, a key this phone made whose store was
 *   refused (`key_exists`: another of my phones stored first) is marked
 *   untrusted and never used; the escrowed key replaces it.
 * - v1.0 has no rotation (the server refuses a second version), so a row above
 *   MAX_KEY_VERSION is never adopted: a forged higher version cannot steer new
 *   recordings onto a key someone else chose.
 */
import { b64, bytesToBase64, equalBytes } from './bytes';
import {
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

/** The highest book key version this build uses. Rotation (a later ADR) raises it with the server. */
export const MAX_KEY_VERSION = 1;

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
  | { kind: 'unavailable'; reason: 'unsupported' | 'no_escrow_key' | 'unknown_key_version' };

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
/** A local key of this version that may not be the escrowed one (its store was refused and the row has no check). */
const untrustedKey = (childId: string, v: number) => `untrustedKey:${childId}:${v}`;
const DEVICE_REGISTERED = 'deviceRegistered';

export function createKeyManager(d: KeyManagerDeps) {
  let rows: ChildKeyRow[] | null = null;
  const ref = (childId: string): BookKeyRef => ({ profileId: d.profileId, childId });
  const label = (childId: string, v: number) => keyCheckLabel(d.profileId, childId, v);

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
   * True when this phone holds `version` and it is the key the server row
   * escrowed. A row without a key check (stored before #151 kept one)
   * trusts a local key of that version, unless this phone marked it untrusted.
   */
  async function holdsChecked(childId: string, row: ChildKeyRow): Promise<boolean> {
    if (row.keyVersion < 1 || row.keyVersion > MAX_KEY_VERSION) return false;
    const local = await d.vault.bookKeyVersions(ref(childId));
    if (!local.includes(row.keyVersion)) return false;
    if (!row.keyCheck) return d.meta.getMeta(untrustedKey(childId, row.keyVersion)) === null;
    const check = await d.vault.bookKeyCheck(ref(childId), row.keyVersion, label(childId, row.keyVersion));
    return equalBytes(check, b64(row.keyCheck));
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
     * path) or to find whether one exists (`create: false`, the restore path).
     */
    async keyFor(childId: string, opts: { create: boolean }): Promise<BookKeyState> {
      if (!d.vault.supported()) return { kind: 'unavailable', reason: 'unsupported' };
      let row = newestRow(await serverRows(), childId);
      if (row && row.keyVersion > MAX_KEY_VERSION) return { kind: 'unavailable', reason: 'unknown_key_version' };
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
      // A version already on this phone with no server row: an earlier store failed, or the
      // server was restored to an earlier point (F08-U30). Store it again; never make a second.
      const local = (await d.vault.bookKeyVersions(ref(childId))).filter((v) => v <= MAX_KEY_VERSION);
      let version = local.length > 0 ? Math.max(...local) : 1;
      if (local.length === 0) {
        try {
          await d.vault.createBookKey(ref(childId), version);
        } catch (e) {
          if ((e as { code?: string }).code !== 'key_exists') throw e;
          version = Math.max(1, ...(await d.vault.bookKeyVersions(ref(childId))).filter((v) => v <= MAX_KEY_VERSION));
        }
      }
      try {
        await storeLocalKey(childId, version, escrow);
      } catch (e) {
        if (!isKeyExists(e)) throw e;
        // Another of my devices stored this version first: theirs is the key. Ours is used only if it is the same.
        row = newestRow(await serverRows(true), childId);
        // With no check on the row, "the same" cannot be shown: ours is probably the loser of the race
        // (or ours, if only the response was lost). Either way it is never used until escrow settles it.
        if (row && !row.keyCheck && row.keyVersion === version) d.meta.setMeta(untrustedKey(childId, version), '1');
        if (row && (await holdsChecked(childId, row))) return { kind: 'ready', version: row.keyVersion };
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

    /**
     * Stores keys the escrow function released to this device for `requestId`. A version this
     * phone already holds and trusts is left as it is; any other is checked against its row's key
     * check before it is written (natively), so a bad release never replaces a good key.
     */
    async storeReleased(keys: readonly ReleasedKey[], deviceId: string, requestId: string): Promise<number> {
      const all = await serverRows(true);
      let stored = 0;
      for (const k of keys) {
        const row = all.find((r) => r.childId === k.childId && r.keyVersion === k.keyVersion);
        if (!row || row.keyVersion > MAX_KEY_VERSION) continue;
        if (!(await holdsChecked(k.childId, row))) {
          await d.vault.openBookKey(
            ref(k.childId),
            k.keyVersion,
            { enc: b64(k.enc), ct: b64(k.ct) },
            releaseInfo(),
            releaseAad(d.profileId, deviceId, requestId, k.childId, k.keyVersion),
            row.keyCheck ? { label: label(k.childId, k.keyVersion), expected: b64(row.keyCheck) } : null,
          );
          d.meta.deleteMeta(untrustedKey(k.childId, k.keyVersion));
        }
        if (await holdsChecked(k.childId, row)) {
          stored += 1;
          d.meta.deleteMeta(waitKey(k.childId));
        }
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
