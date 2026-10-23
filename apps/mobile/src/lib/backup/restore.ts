/**
 * Restore on a new phone (WP-F08-B5b; F08 6.5 B; F08-REQ-023; F08-U18 to
 * U20, U26). After sign-in, text arrives through sync; this brings each
 * backed-up recording back: list, download, check, decrypt, check again,
 * then place it beside the letter.
 *
 * Conflict rules (`planRestore`, pure, tested with the Asha fixtures):
 * 1. No local letter with that id yet (its text has not synced): wait.
 * 2. Someone else's letter, or a deleted one: skip. Owner-only in v1.0.
 * 3. A local file is there: never overwrite it. If it matches the letter's
 *    hash it is the recording (an iCloud device backup brought it); if it
 *    differs it is kept as it is and flagged (F08-U02), never replaced.
 * 4. Otherwise download.
 *
 * Checks on every download: the ciphertext's SHA-256 equals `audio_blobs`;
 * the header names this entry, this author and the row's key version; every
 * segment authenticates; the original's SHA-256 inside the object equals the
 * decrypted file's, and the letter's own `audio_sha256` when this phone has
 * one. A failure discards the download and tries once more, then leaves the
 * letter "not on this phone" (F08-U20).
 *
 * Kill path: decrypted bytes exist only in backup-tmp (excluded from device
 * backup, swept at launch). The letter is pointed at its final path first and
 * the file moved there second, so a kill leaves at worst a letter whose file
 * is missing (the next run restores it), never a stray recording in Documents
 * that the launch sweep would turn into a draft. The move never replaces a
 * file (a newer local file wins).
 */
import { bytesToHex } from './bytes';
import { BackupServerError, ESCROW_DETAILS, needsSignIn, type BackupServer, type BlobRow, type EscrowClient, type ReleasedKey } from './contract';
import { BackupStopped, HEADER_LEN, decryptBody, parseHeader, wrapAad } from './format';
import { DeviceRevoked, type KeyManager, type BookKeyState } from './keys';
import type { BackupDb } from './local-db';
import type { Aead, Clock, Conditions, FileIO, KeyVault } from './ports';

/** A letter as this phone holds it. */
export interface LocalLetter {
  entryId: string;
  /** Null for letters written before the first sign-in on this phone: they are this person's. */
  authorId: string | null;
  deleted: boolean;
  audioUri: string | null;
  audioSha256: string | null;
}

export interface RestoreLocal {
  letter(entryId: string): LocalLetter | null;
  /**
   * Points a letter that has no recording on this phone at `uri`, once. Never
   * changes a recording that is there; never changes a hash already set.
   * False when the letter now has a file of its own.
   */
  attachAudio(entryId: string, uri: string, sha256: string, bytes: number): boolean;
  /** Undoes a hash `attachAudio` filled in, when the move then lost to a file already at that path. */
  clearRestoredHash(entryId: string, sha256: string): void;
  /** Whether any live spoken letter of mine has no recording on this phone (so a restore pass is worth a request). */
  anyMissing(): boolean;
}

export interface BlobDownloader {
  /** Writes the object at a signed URL to `toUri`. Throws BackupServerError on failure. */
  download(url: string, toUri: string): Promise<void>;
}

/** Last path segment, decoded (the same rule as the capture sweep's `fileNameOf`). */
export function fileNameOf(uri: string): string {
  const clean = uri.split(/[?#]/)[0].replace(/\/+$/, '');
  const name = clean.slice(clean.lastIndexOf('/') + 1);
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

export type RestorePlan =
  | { kind: 'wait_for_letter' }
  | { kind: 'skip'; reason: 'not_mine' | 'deleted' }
  | { kind: 'present' }
  | { kind: 'keep_local' }
  | { kind: 'download' };

export function planRestore(x: {
  blob: Pick<BlobRow, 'entryId'>;
  letter: LocalLetter | null;
  me: string;
  /** The local file the letter points at, if it exists, and its hash. */
  file: { exists: boolean; sha256: string | null };
}): RestorePlan {
  if (!x.letter) return { kind: 'wait_for_letter' };
  if (x.letter.authorId && x.letter.authorId !== x.me) return { kind: 'skip', reason: 'not_mine' };
  if (x.letter.deleted) return { kind: 'skip', reason: 'deleted' };
  if (x.letter.audioUri && x.file.exists) {
    if (!x.letter.audioSha256 || x.file.sha256 === x.letter.audioSha256) return { kind: 'present' };
    return { kind: 'keep_local' };
  }
  return { kind: 'download' };
}

export type RestoreOutcome =
  | { kind: 'done' }
  | { kind: 'present' }
  | { kind: 'kept_local' }
  | { kind: 'waiting_letter' }
  | { kind: 'skipped' }
  | { kind: 'key'; state: BookKeyState['kind'] }
  | { kind: 'gate'; reason: 'offline' | 'wifi' | 'background' | 'killed' | 'busy' | 'stopped' }
  | { kind: 'retry' }
  | { kind: 'failed' };

/** What the person sees about restore (F08 6.7 `backup.restoreWaiting`, `restoreUnavailable`). */
export type RestoreKeyStatus =
  | { kind: 'ready' }
  /** Keys are here and recordings are downloading: "Bringing your recordings to this phone." */
  | { kind: 'restoring' }
  | { kind: 'waiting_icloud'; until: number }
  | { kind: 'waiting_hold'; holdUntil: string }
  | { kind: 'stopped' }
  /** The escrow request needs a sign-in in the last 10 minutes (F08 6.5 C1). */
  | { kind: 'sign_in_again' }
  | { kind: 'unavailable' };

export interface RestoreDeps {
  db: BackupDb;
  keys: KeyManager;
  vault: KeyVault;
  aead: Aead;
  files: FileIO;
  server: BackupServer;
  escrow: EscrowClient;
  downloader: BlobDownloader;
  local: RestoreLocal;
  conditions: Conditions;
  clock: Clock;
  profileId: string;
  /** True once this service was stopped (another account signed in): no new step starts. */
  stopped?: () => boolean;
  /** Called as a download starts, so Settings can say recordings are coming back while they do. */
  onRestoring?: () => void;
}

/** A download tried this many times with a bad object is left "not on this phone" (F08-U20: retried once). */
export const RESTORE_TRIES = 2;
/** A recording at most this size may download on mobile data when its letter is opened (ADR 0016 section 4.3). */
export const SMALL_DOWNLOAD_BYTES = 5 * 1000 * 1000;

/** How often a held escrow request is asked again (an approval on an enrolled phone shows up then). */
export const ESCROW_POLL_MS = 5 * 60 * 1000;

const REQUEST_META = 'restoreRequest';
const STOPPED_META = 'restoreStopped';
/**
 * Keys escrow released to this device, saved (still sealed to this device's key, so ciphertext
 * only) before they are used. A failure after a release retries from this copy and never asks
 * escrow to release again on its own: every release opens the keys again, writes access-log
 * rows and emails the owner (#151), so only Try again asks once more.
 */
const RELEASED_META = 'restoreReleased';

/** Keys escrow released to this device for one request, still sealed to it. */
interface Release {
  requestId: string;
  deviceId: string;
  keys: ReleasedKey[];
}

/** The release itself cannot be used here (it does not open, or fails its row's key check): only escrow can fix it. */
const releaseUnusable = (e: unknown) => {
  const code = (e as { code?: unknown } | null)?.code;
  return code === 'key_check_failed' || code === 'key_open_failed';
};
/** The Keychain could not take the key just now (the phone locked as the release landed): the release is fine. */
const keychainBusy = (e: unknown) => (e as { code?: unknown } | null)?.code === 'keychain_unavailable';
/** The server has confirmed recordings of mine (a returning person: Settings says so when backup is off here). */
export const HAS_BACKUP_META = 'hasBackup';

export function createRestore(d: RestoreDeps) {
  let blobs: BlobRow[] | null = null;
  /** One restore per letter at a time: a pass and an opened letter join the same attempt. */
  const inflight = new Map<string, Promise<RestoreOutcome>>();
  let attempt = 0;
  /**
   * This session's copy of the last release, beside the saved one in backup.db: a save that
   * fails for a reason on this phone retries from it, and so does Try again, without asking
   * escrow (which would open the keys again and email the owner again). Escrow is asked again
   * only when the release itself is unusable, or when both copies are gone.
   */
  let heldRelease: Release | null = null;
  const savedRelease = (): Release | null => {
    const m = d.db.getMeta(RELEASED_META);
    if (m) {
      try {
        return JSON.parse(m) as Release;
      } catch {
        // an unreadable saved copy: this session's copy, if any
      }
    }
    return heldRelease;
  };
  const stopped = () => d.stopped?.() ?? false;
  // `backupUploads` stops new uploads only, never a restore (packages/api standards.ts; review B M1 on #150).
  // The escrow request has its own switch, `escrow` (escrowKilled).
  const keepGoing = () => !stopped() && !d.conditions.busy() && d.conditions.foreground();

  async function listBlobs(refresh = false): Promise<BlobRow[]> {
    if (!blobs || refresh) blobs = await d.server.listBlobs();
    if (blobs.length > 0 && !d.db.getMeta(HAS_BACKUP_META)) d.db.setMeta(HAS_BACKUP_META, '1');
    return blobs;
  }

  async function localFile(letter: LocalLetter | null): Promise<{ exists: boolean; sha256: string | null }> {
    if (!letter?.audioUri || !d.files.exists(letter.audioUri)) return { exists: false, sha256: null };
    return { exists: true, sha256: await d.files.sha256(letter.audioUri) };
  }

  async function networkGate(blob: BlobRow, priority: boolean): Promise<RestoreOutcome | null> {
    if (stopped()) return { kind: 'gate', reason: 'stopped' };
    if (!d.conditions.foreground()) return { kind: 'gate', reason: 'background' };
    // Never while recording, reviewing or playing (F08-REQ-025): the same rule as uploads.
    if (d.conditions.busy()) return { kind: 'gate', reason: 'busy' };
    const net = await d.conditions.network();
    if (net === 'none') return { kind: 'gate', reason: 'offline' };
    if (net === 'wifi' || d.conditions.cellularAllowed()) return null;
    if (priority && blob.bytes <= SMALL_DOWNLOAD_BYTES) return null;
    return { kind: 'gate', reason: 'wifi' };
  }

  function failOnce(entryId: string): RestoreOutcome {
    const tries = (d.db.restoreItem(entryId)?.attempts ?? 0) + 1;
    d.db.setRestoreItem(entryId, tries >= RESTORE_TRIES ? 'failed' : 'pending', tries);
    return tries >= RESTORE_TRIES ? { kind: 'failed' } : { kind: 'retry' };
  }

  function restoreOne(blob: BlobRow, priority = false): Promise<RestoreOutcome> {
    const running = inflight.get(blob.entryId);
    if (running) return running;
    const p = restoreOnce(blob, priority).finally(() => inflight.delete(blob.entryId));
    inflight.set(blob.entryId, p);
    return p;
  }

  async function restoreOnce(blob: BlobRow, priority: boolean): Promise<RestoreOutcome> {
    const item = d.db.restoreItem(blob.entryId);
    if (item && item.state !== 'pending') return { kind: item.state === 'done' ? 'done' : item.state === 'kept_local' ? 'kept_local' : 'failed' };
    const letter = d.local.letter(blob.entryId);
    const plan = planRestore({ blob, letter, me: d.profileId, file: await localFile(letter) });
    if (plan.kind === 'wait_for_letter') return { kind: 'waiting_letter' };
    if (plan.kind === 'skip') return { kind: 'skipped' };
    if (plan.kind === 'present') {
      d.db.setRestoreItem(blob.entryId, 'done', item?.attempts ?? 0);
      return { kind: 'present' };
    }
    if (plan.kind === 'keep_local') {
      d.db.setRestoreItem(blob.entryId, 'kept_local', item?.attempts ?? 0);
      return { kind: 'kept_local' };
    }
    if (!(await d.keys.canOpen(blob.childId, blob.keyVersion))) {
      const st = await d.keys.keyFor(blob.childId, { create: false });
      return { kind: 'key', state: st.kind };
    }
    const gated = await networkGate(blob, priority);
    if (gated) return gated;

    attempt += 1;
    d.onRestoring?.();
    const dl = d.files.tmpUri(`${blob.entryId}.${attempt}.dl`);
    const plain = d.files.tmpUri(`${blob.entryId}.${attempt}.restoring`);
    const cleanup = () => {
      d.files.remove(dl);
      d.files.remove(plain);
    };
    try {
      await d.downloader.download(await d.server.downloadUrl(blob.objectPath), dl);
    } catch (e) {
      cleanup();
      // The live session is another account's now (account.ts): a stop, not a failed try.
      if (e instanceof BackupStopped) return { kind: 'gate', reason: 'stopped' };
      if (e instanceof BackupServerError && e.retryable) return { kind: 'retry' };
      return failOnce(blob.entryId);
    }
    try {
      // The ciphertext hash is a transfer check only (review A note 1 on #150). backup_confirm stores the
      // phone's hash without reading the object, so two phones of one author that sealed the same letter
      // can leave the row naming one encryption and the bucket holding the other. A different hash is
      // therefore not a refusal by itself: the object must still name this entry, author and key version,
      // authenticate segment by segment under this author's book key, and decrypt to the inner hash, which
      // must match the letter's own. A server that lies about the hash gains nothing either way. Reading
      // the header back before confirming is #151's follow-up.
      const header = parseHeader(d.files.readSlice(dl, 0, HEADER_LEN));
      if (header.entryId !== blob.entryId || header.authorId !== d.profileId || header.keyVersion !== blob.keyVersion) {
        cleanup();
        return failOnce(blob.entryId);
      }
      const ref = { profileId: d.profileId, childId: blob.childId };
      const fileKey = await d.vault.unwrapFileKey(ref, header.keyVersion, header.wrapped, wrapAad(blob.entryId, d.profileId, header.keyVersion));
      let result;
      let halted = false;
      // The file key is wiped however this ends, including when a file cannot be opened.
      try {
        const source = d.files.openRead(dl);
        try {
          source.read(HEADER_LEN);
          const sink = d.files.openWrite(plain);
          try {
            result = await decryptBody(header, fileKey, source, sink, d.aead, keepGoing);
          } catch (e) {
            if (!(e instanceof BackupStopped)) throw e;
            halted = true;
          } finally {
            sink.close();
          }
        } finally {
          source.close();
        }
      } finally {
        fileKey.fill(0);
      }
      if (halted || !result) {
        cleanup();
        return { kind: 'gate', reason: stopped() ? 'stopped' : 'busy' };
      }
      const sha = await d.files.sha256(plain);
      const inner = bytesToHex(result.plainSha256);
      if (sha !== inner || (letter?.audioSha256 && letter.audioSha256 !== sha)) {
        cleanup();
        return failOnce(blob.entryId);
      }
      d.files.remove(dl);
      // Re-read: capture, sync or an iCloud restore may have brought a file while this downloaded.
      const now = d.local.letter(blob.entryId);
      const again = planRestore({ blob, letter: now, me: d.profileId, file: await localFile(now) });
      if (again.kind !== 'download') {
        d.files.remove(plain);
        d.db.setRestoreItem(blob.entryId, again.kind === 'present' ? 'done' : again.kind === 'keep_local' ? 'kept_local' : 'pending', 0);
        return again.kind === 'present' ? { kind: 'present' } : again.kind === 'keep_local' ? { kind: 'kept_local' } : { kind: 'skipped' };
      }
      // A letter that still names a file (an older container path) gets it back under the same name in
      // this container's Documents, where the launch sweep matches files by name; otherwise `<entry id>.m4a`.
      const final = d.files.documentUri(now?.audioUri ? fileNameOf(now.audioUri) : `${blob.entryId}.m4a`);
      const filledHash = !now?.audioSha256;
      if (!d.local.attachAudio(blob.entryId, final, sha, result.plainLength)) {
        d.files.remove(plain);
        d.db.setRestoreItem(blob.entryId, 'kept_local', 0);
        return { kind: 'kept_local' };
      }
      try {
        d.files.moveNoReplace(plain, final);
      } catch {
        // A file appeared at that path: it wins. Ours goes, and so does the hash we filled in for it.
        d.files.remove(plain);
        const there = (await d.files.sha256(final)) === sha;
        if (!there && filledHash) d.local.clearRestoredHash(blob.entryId, sha);
        d.db.setRestoreItem(blob.entryId, there ? 'done' : 'kept_local', 0);
        return { kind: there ? 'present' : 'kept_local' };
      }
      // The file at its final path is the one that was checked.
      if ((await d.files.sha256(final)) !== sha) {
        d.db.setRestoreItem(blob.entryId, 'kept_local', 0);
        return { kind: 'kept_local' };
      }
      d.db.setRestoreItem(blob.entryId, 'done', 0);
      return { kind: 'done' };
    } catch (e) {
      cleanup();
      if (e instanceof BackupServerError && e.retryable) return { kind: 'retry' };
      return failOnce(blob.entryId);
    }
  }

  /**
   * Escrow, when iCloud Keychain did not bring a key (F08 6.5 B step 3, C).
   * A held request is polled through `release`, which answers the hold without
   * opening anything: at most every 5 minutes (an approval on an enrolled phone
   * shows up then), and at once when the hold has ended. Never re-asks on its
   * own after a Stop, a Not me, an expiry or a revoked device.
   */
  /** Stores keys saved from a release. A key that can never be stored here stops (Try again asks escrow once more). */
  async function storeSaved(held: Release): Promise<RestoreKeyStatus> {
    try {
      await d.keys.storeReleased(held.keys, held.deviceId, held.requestId);
    } catch (e) {
      // A network blip while checking the rows, or the Keychain refusing a write as the phone locks:
      // the release is fine, so the next pass stores it from the kept copy, asking escrow nothing.
      // So does a check that found the live session is another account's (account.ts).
      if ((e instanceof BackupServerError && e.retryable) || keychainBusy(e) || e instanceof BackupStopped) return { kind: 'unavailable' };
      if (needsSignIn(e)) return { kind: 'sign_in_again' };
      // The release does not open here or fails its row's check: only a new release can help, and
      // escrow is never asked for one on its own. Try again asks once more.
      if (releaseUnusable(e)) {
        d.db.setMeta(STOPPED_META, 'release_unusable');
        return { kind: 'stopped' };
      }
      // Anything else on this phone: stop, and Try again stores from the kept copy (no new release).
      d.db.setMeta(STOPPED_META, 'release_not_saved');
      return { kind: 'stopped' };
    }
    heldRelease = null;
    d.db.deleteMeta(RELEASED_META);
    d.db.deleteMeta(REQUEST_META);
    return { kind: 'ready' };
  }

  async function escrowStep(): Promise<RestoreKeyStatus> {
    if (d.db.getMeta(STOPPED_META)) return { kind: 'stopped' };
    if (stopped()) return { kind: 'unavailable' };
    const held = savedRelease();
    if (held) return storeSaved(held);
    if (d.conditions.escrowKilled()) return { kind: 'unavailable' };
    try {
      const device = await d.keys.ensureDevice();
      const saved = d.db.getMeta(REQUEST_META);
      if (!saved) {
        const req = await d.escrow.request(device.deviceId);
        d.db.setMeta(REQUEST_META, JSON.stringify({ requestId: req.requestId, holdUntil: req.holdUntil, polledAt: d.clock.now() }));
        return { kind: 'waiting_hold', holdUntil: req.holdUntil };
      }
      const req = JSON.parse(saved) as { requestId: string; holdUntil: string; polledAt: number };
      const now = d.clock.now();
      if (now < Date.parse(req.holdUntil) && now - req.polledAt < ESCROW_POLL_MS) return { kind: 'waiting_hold', holdUntil: req.holdUntil };
      const r = await d.escrow.release(req.requestId, device.deviceId);
      if (r.state === 'cancelled' || r.state === 'expired') {
        d.db.deleteMeta(REQUEST_META);
        d.db.setMeta(STOPPED_META, r.state);
        return { kind: 'stopped' };
      }
      // The server answers for the device's current request; keep its id, since a release is sealed to it.
      const requestId = r.requestId ?? req.requestId;
      if (r.state === 'requested' || r.state === 'approved') {
        d.db.setMeta(REQUEST_META, JSON.stringify({ requestId, holdUntil: r.holdUntil, polledAt: now }));
        return { kind: 'waiting_hold', holdUntil: r.holdUntil };
      }
      if (r.state !== 'released') return { kind: 'unavailable' };
      // Saved first: whatever happens next, this release is not asked for again on its own.
      const release: Release = { requestId, deviceId: device.deviceId, keys: r.keys };
      heldRelease = release;
      try {
        d.db.setMeta(RELEASED_META, JSON.stringify(release));
      } catch {
        // kept in memory for the rest of this session
      }
      d.db.setMeta(REQUEST_META, JSON.stringify({ requestId, holdUntil: req.holdUntil, polledAt: now }));
      return await storeSaved(release);
    } catch (e) {
      // This account's device key was revoked (Not me, or removed in Settings): only Try again makes a new one.
      if (e instanceof DeviceRevoked) {
        d.db.deleteMeta(REQUEST_META);
        d.db.setMeta(STOPPED_META, 'device_revoked');
        return { kind: 'stopped' };
      }
      const detail = e instanceof BackupServerError ? e.detail : null;
      if (detail && (ESCROW_DETAILS.stopped as readonly string[]).includes(detail)) {
        d.db.deleteMeta(REQUEST_META);
        d.db.setMeta(STOPPED_META, detail);
        return { kind: 'stopped' };
      }
      // The 10-minute step-up (F08 6.5 C1), or a session the Stop link ended: sign in again. Nothing was asked.
      if (needsSignIn(e)) return { kind: 'sign_in_again' };
      return { kind: 'unavailable' };
    }
  }

  return {
    planRestore,
    restoreOne,

    /**
     * Brings back every backed-up recording it can, oldest letter first. When
     * escrow releases keys during this pass, the recordings they open come back
     * in the same pass. Returns what is still waiting on keys.
     */
    async run(): Promise<{ restored: number; keys: RestoreKeyStatus; remaining: number; escrow: boolean }> {
      const pass = async () => {
        let restored = 0;
        let remaining = 0;
        let waitingUntil: number | null = null;
        let needEscrow = false;
        const all = [...(await listBlobs(true))].sort((a, b) => (a.entryId < b.entryId ? -1 : 1));
        for (let i = 0; i < all.length; i++) {
          const blob = all[i];
          if (stopped()) {
            remaining += all.length - i;
            break;
          }
          const r = await restoreOne(blob);
          if (r.kind === 'done') restored += 1;
          else if (r.kind === 'retry') remaining += 1;
          else if (r.kind === 'gate') {
            remaining += all.length - i;
            break;
          } else if (r.kind === 'key') {
            if (r.state === 'needs_escrow') needEscrow = true;
            else if (r.state === 'waiting') {
              const st = await d.keys.keyFor(blob.childId, { create: false });
              if (st.kind === 'waiting') waitingUntil = Math.max(waitingUntil ?? 0, st.until);
            }
          }
        }
        return { restored, remaining, waitingUntil, needEscrow };
      };
      const first = await pass();
      if (first.needEscrow) {
        const keys = await escrowStep();
        if (keys.kind !== 'ready') return { restored: first.restored, keys, remaining: first.remaining, escrow: true };
        const second = await pass();
        return { restored: first.restored + second.restored, keys: second.needEscrow ? { kind: 'unavailable' } : { kind: 'ready' }, remaining: second.remaining, escrow: true };
      }
      if (first.waitingUntil !== null) return { restored: first.restored, keys: { kind: 'waiting_icloud', until: first.waitingUntil }, remaining: first.remaining, escrow: false };
      return { restored: first.restored, keys: { kind: 'ready' }, remaining: first.remaining, escrow: false };
    },

    /** One letter, when it is opened: may use mobile data for a small recording. */
    async restoreEntry(entryId: string): Promise<RestoreOutcome | null> {
      const blob = (await listBlobs()).find((b) => b.entryId === entryId);
      return blob ? restoreOne(blob, true) : null;
    },

    /**
     * The person tapped Try again after a stopped, expired or unusable request. A revoked or
     * unknown device gets a new device key first (never on its own, ADR 0024). A release kept
     * here is stored again from that copy, with no new release; only an unusable release is
     * dropped, so escrow is asked once more.
     */
    async tryAgain(): Promise<void> {
      const why = d.db.getMeta(STOPPED_META);
      if (why === 'device_revoked' || why === 'device_unknown') await d.keys.replaceDevice();
      if (why === 'release_unusable') {
        heldRelease = null;
        d.db.deleteMeta(RELEASED_META);
      }
      d.db.deleteMeta(STOPPED_META);
    },

    escrowStep,
  };
}

export type Restore = ReturnType<typeof createRestore>;
