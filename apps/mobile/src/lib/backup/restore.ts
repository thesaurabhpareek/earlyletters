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
import { BackupServerError, ESCROW_DETAILS, type BackupServer, type BlobRow, type EscrowClient } from './contract';
import { BackupStopped, HEADER_LEN, decryptBody, parseHeader, wrapAad } from './format';
import type { KeyManager, BookKeyState } from './keys';
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
}

/** A download tried this many times with a bad object is left "not on this phone" (F08-U20: retried once). */
export const RESTORE_TRIES = 2;
/** A recording at most this size may download on mobile data when its letter is opened (ADR 0016 section 4.3). */
export const SMALL_DOWNLOAD_BYTES = 5 * 1000 * 1000;

/** How often a held escrow request is asked again (an approval on an enrolled phone shows up then). */
export const ESCROW_POLL_MS = 5 * 60 * 1000;

const REQUEST_META = 'restoreRequest';
const STOPPED_META = 'restoreStopped';

export function createRestore(d: RestoreDeps) {
  let blobs: BlobRow[] | null = null;
  /** One restore per letter at a time: a pass and an opened letter join the same attempt. */
  const inflight = new Map<string, Promise<RestoreOutcome>>();
  let attempt = 0;
  const stopped = () => d.stopped?.() ?? false;
  const keepGoing = () => !stopped() && !d.conditions.busy() && d.conditions.foreground() && !d.conditions.uploadsKilled();

  async function listBlobs(refresh = false): Promise<BlobRow[]> {
    if (!blobs || refresh) blobs = await d.server.listBlobs();
    return blobs;
  }

  async function localFile(letter: LocalLetter | null): Promise<{ exists: boolean; sha256: string | null }> {
    if (!letter?.audioUri || !d.files.exists(letter.audioUri)) return { exists: false, sha256: null };
    return { exists: true, sha256: await d.files.sha256(letter.audioUri) };
  }

  async function networkGate(blob: BlobRow, priority: boolean): Promise<RestoreOutcome | null> {
    if (stopped()) return { kind: 'gate', reason: 'stopped' };
    if (d.conditions.uploadsKilled()) return { kind: 'gate', reason: 'killed' };
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
      if (e instanceof BackupServerError && e.retryable) return { kind: 'retry' };
      return failOnce(blob.entryId);
    }
    try {
      if ((await d.files.sha256(dl)) !== blob.cipherSha256) {
        cleanup();
        return failOnce(blob.entryId);
      }
      const header = parseHeader(d.files.readSlice(dl, 0, HEADER_LEN));
      if (header.entryId !== blob.entryId || header.authorId !== d.profileId || header.keyVersion !== blob.keyVersion) {
        cleanup();
        return failOnce(blob.entryId);
      }
      const ref = { profileId: d.profileId, childId: blob.childId };
      const fileKey = await d.vault.unwrapFileKey(ref, header.keyVersion, header.wrapped, wrapAad(blob.entryId, d.profileId, header.keyVersion));
      const source = d.files.openRead(dl);
      source.read(HEADER_LEN);
      const sink = d.files.openWrite(plain);
      let result;
      let halted = false;
      try {
        result = await decryptBody(header, fileKey, source, sink, d.aead, keepGoing);
      } catch (e) {
        if (!(e instanceof BackupStopped)) throw e;
        halted = true;
      } finally {
        fileKey.fill(0);
        source.close();
        sink.close();
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
      // This key opened an object the server holds: it is the escrowed key. Remember its check here.
      await d.keys.markVerified(blob.childId, header.keyVersion);
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
  async function escrowStep(): Promise<RestoreKeyStatus> {
    if (d.db.getMeta(STOPPED_META)) return { kind: 'stopped' };
    if (d.conditions.escrowKilled() || stopped()) return { kind: 'unavailable' };
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
      // The server names the request it answered; a different one (it replaced ours) is adopted.
      if (r.state === 'requested' || r.state === 'approved') {
        d.db.setMeta(REQUEST_META, JSON.stringify({ requestId: r.requestId, holdUntil: r.holdUntil, polledAt: now }));
        return { kind: 'waiting_hold', holdUntil: r.holdUntil };
      }
      if (r.state !== 'released') return { kind: 'unavailable' };
      await d.keys.storeReleased(r.keys, device.deviceId, r.requestId);
      d.db.deleteMeta(REQUEST_META);
      return { kind: 'ready' };
    } catch (e) {
      const detail = e instanceof BackupServerError ? e.detail : null;
      const code = e instanceof BackupServerError ? e.code : null;
      if (detail && (ESCROW_DETAILS.stopped as readonly string[]).includes(detail)) {
        d.db.deleteMeta(REQUEST_META);
        d.db.setMeta(STOPPED_META, detail);
        return { kind: 'stopped' };
      }
      // The 10-minute step-up (F08 6.5 C1): the request needs a fresh sign-in. Nothing was asked.
      const again = ESCROW_DETAILS.signInAgain as readonly string[];
      if ((detail && again.includes(detail)) || (code && again.includes(code))) return { kind: 'sign_in_again' };
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
    async run(): Promise<{ restored: number; keys: RestoreKeyStatus }> {
      const pass = async () => {
        let restored = 0;
        let waitingUntil: number | null = null;
        let needEscrow = false;
        const all = [...(await listBlobs(true))].sort((a, b) => (a.entryId < b.entryId ? -1 : 1));
        for (const blob of all) {
          if (stopped()) break;
          const r = await restoreOne(blob);
          if (r.kind === 'done') restored += 1;
          else if (r.kind === 'gate') break;
          else if (r.kind === 'key') {
            if (r.state === 'needs_escrow') needEscrow = true;
            else if (r.state === 'waiting') {
              const st = await d.keys.keyFor(blob.childId, { create: false });
              if (st.kind === 'waiting') waitingUntil = Math.max(waitingUntil ?? 0, st.until);
            }
          }
        }
        return { restored, waitingUntil, needEscrow };
      };
      const first = await pass();
      if (first.needEscrow) {
        const keys = await escrowStep();
        if (keys.kind !== 'ready') return { restored: first.restored, keys };
        const second = await pass();
        return { restored: first.restored + second.restored, keys: second.needEscrow ? { kind: 'unavailable' } : { kind: 'ready' } };
      }
      if (first.waitingUntil !== null) return { restored: first.restored, keys: { kind: 'waiting_icloud', until: first.waitingUntil } };
      return { restored: first.restored, keys: { kind: 'ready' } };
    },

    /** One letter, when it is opened: may use mobile data for a small recording. */
    async restoreEntry(entryId: string): Promise<RestoreOutcome | null> {
      const blob = (await listBlobs()).find((b) => b.entryId === entryId);
      return blob ? restoreOne(blob, true) : null;
    },

    /** The person tapped Try again after a stopped or expired request. */
    clearStopped(): void {
      d.db.deleteMeta(STOPPED_META);
    },

    escrowStep,
  };
}

export type Restore = ReturnType<typeof createRestore>;
