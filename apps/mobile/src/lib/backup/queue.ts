/**
 * The upload queue (WP-F08-B5a; F08 6.5 A steps 5 and 6, 6.5 E; F08-REQ-018,
 * -020, -025, -031, -032; F08-U17).
 *
 * One job per recording, keyed by the letter's id (which is its draft id from
 * capture to save, so a held draft and the letter it becomes upload once).
 *
 *   queued -> sealed -> begun -> uploading -> uploaded -> confirmed
 *                                                      \-> blocked (hash differs: never uploaded)
 *
 *   queued     known, nothing done
 *   sealed     encrypted into backup-tmp; the wrapped file key, nonce prefix and
 *              ciphertext hash are saved, so the same bytes can be rebuilt
 *   begun      `backup_begin` accepted: a pending `audio_blobs` row and the path
 *   uploading  a resumable upload exists; its URL and offset are saved after every part
 *   uploaded   every byte is in the bucket; `backup_confirm` is next
 *   confirmed  `backup_confirm` succeeded. Only now is the recording backed up
 *
 * The kill path: each transition is one statement, written after the work it
 * records. A kill at any point leaves the previous state, and that state's
 * step is safe to run again: sealing makes a new key (nothing used the old
 * one), begin is idempotent on the entry id, upload asks the server for its
 * offset and rebuilds byte-identical ciphertext if backup-tmp lost the file,
 * confirm is idempotent.
 *
 * Never in the way (F08-REQ-025): nothing here blocks recording, saving,
 * playback or export. Jobs run one at a time, in the foreground, on Wi-Fi
 * unless mobile data is allowed, and stop between segments and between parts
 * when a recording or playback starts. No network, no sign-in, a full quota
 * or a kill switch only make jobs wait.
 */
import { ENDPOINT_CLASSES, retryDelayMs } from '@scribe/api';
import { b64, bytesToBase64, hexToBytes, wipe } from './bytes';
import {
  BACKUP_BUCKET,
  BACKUP_ERRORS,
  BackupServerError,
  MAX_OBJECT_BYTES,
  needsSignIn,
  type BackupServer,
} from './contract';
import { BackupStopped, KEY_LEN, NONCE_PREFIX_LEN, SEGMENT_SIZE, encryptObject, objectLength, wrapAad } from './format';
import type { KeyManager } from './keys';
import type { BackupDb, JobSource, UploadJob } from './local-db';
import type { Aead, Clock, Conditions, FileIO, KeyVault } from './ports';
import { tusUpload, type HttpLike } from './tus';

/** A recording of mine on this phone that backup should hold (letters.ts and drafts, via runtime.ts). */
export interface BackupSourceItem {
  entryId: string;
  childId: string;
  source: JobSource;
  audioUri: string;
  /** Null until hashed at capture or before save: such a recording waits. */
  audioSha256: string | null;
  audioBytes: number | null;
  capturedAt: string;
  /**
   * The server has an `entries` or `held_drafts` row with this id (F08 6.5 A
   * step 5): a saved letter whose upload op went through, or a held draft
   * whose held-draft op did. Until then the recording waits.
   */
  onServer: boolean;
}

export interface BackupSource {
  list(): BackupSourceItem[];
}

export type GateReason = 'off' | 'consent' | 'quota' | 'killed' | 'background' | 'busy' | 'offline' | 'wifi' | 'sign_in';

export type StepOutcome =
  | { kind: 'progressed' }
  | { kind: 'gate'; reason: GateReason }
  | { kind: 'key'; state: 'waiting' | 'needs_escrow' | 'unavailable' }
  | { kind: 'retry_later' }
  | { kind: 'blocked' };

export interface QueueDeps {
  db: BackupDb;
  keys: KeyManager;
  vault: KeyVault;
  aead: Aead;
  files: FileIO;
  server: BackupServer;
  http: HttpLike;
  conditions: Conditions;
  clock: Clock;
  profileId: string;
  source: BackupSource;
  random?: () => number;
  partBytes?: number;
  /** True once this service was stopped (another account signed in): no new step starts. */
  stopped?: () => boolean;
}

export const META = {
  enabled: 'enabled',
  paused: 'paused',
  lastBackedUpAt: 'lastBackedUpAt',
  keyState: 'keyState',
} as const;

const tmpName = (entryId: string) => `${entryId}.enc`;

/**
 * A recording refused this many times in a row (`write_rpc.maxAttempts`, packages/api standards)
 * rests until the next launch, so a permanent refusal never re-sends parts all day.
 */
export const MAX_JOB_ATTEMPTS = ENDPOINT_CLASSES.write_rpc.maxAttempts;

export function createUploadQueue(d: QueueDeps) {
  const random = d.random ?? Math.random;
  let onServer = new Map<string, boolean>();
  let running: Promise<StepOutcome | null> | null = null;

  /** Jobs that reached MAX_JOB_ATTEMPTS in this run of the app: they wait for the next launch. */
  const resting = new Set<string>();

  const stopped = () => d.stopped?.() ?? false;
  const keepGoing = () => !stopped() && !d.conditions.busy() && d.conditions.foreground() && !d.conditions.uploadsKilled();
  /** Before every part: as keepGoing, and never on mobile data without the person's yes (ADR 0016 section 4.3). */
  const keepSending = () => keepGoing() && (d.conditions.cellularAllowed() || !d.conditions.meteredNow());

  /** Why a step stopped part way: the gate that closed, so Settings says the true thing ("Backs up on Wi-Fi"). */
  async function stopReason(): Promise<GateReason> {
    const g = await gate();
    if (g) return g;
    return !d.conditions.cellularAllowed() && d.conditions.meteredNow() ? 'wifi' : 'busy';
  }

  async function gate(): Promise<GateReason | null> {
    if (stopped() || d.db.getMeta(META.enabled) !== 'on') return 'off';
    const paused = d.db.getMeta(META.paused);
    if (paused === 'consent' || paused === 'quota') return paused;
    if (d.conditions.uploadsKilled()) return 'killed';
    if (!d.conditions.foreground()) return 'background';
    if (d.conditions.busy()) return 'busy';
    const net = await d.conditions.network();
    if (net === 'none') return 'offline';
    if (net !== 'wifi' && !d.conditions.cellularAllowed()) return 'wifi';
    return null;
  }

  function discardTmp(job: Pick<UploadJob, 'tmpUri'>): void {
    if (job.tmpUri) d.files.remove(job.tmpUri);
  }

  /** Back to the start: a new key and new ciphertext, and a fresh upload (the server replaces a pending row). */
  function reset(job: UploadJob, patch: Partial<UploadJob> = {}): void {
    discardTmp(job);
    d.db.updateJob(job.entryId, {
      state: 'queued',
      keyVersion: null,
      wrappedFileKey: null,
      noncePrefix: null,
      tmpUri: null,
      cipherBytes: null,
      cipherSha256: null,
      objectPath: null,
      uploadUrl: null,
      uploadToken: null,
      uploadOffset: 0,
      ...patch,
    });
  }

  function later(job: UploadJob, code: string, retryAfterSeconds: number | null = null): StepOutcome {
    const attempts = job.attempts + 1;
    if (attempts >= MAX_JOB_ATTEMPTS) resting.add(job.entryId);
    d.db.updateJob(job.entryId, {
      attempts,
      lastError: code,
      nextAttemptAt: d.clock.now() + retryDelayMs('write_rpc', attempts, random, retryAfterSeconds),
    });
    return { kind: 'retry_later' };
  }

  function onServerError(job: UploadJob, e: unknown): StepOutcome {
    if (e instanceof BackupStopped) return { kind: 'gate', reason: 'busy' };
    // `SCSTP` (a sign-in in the last 10 minutes is needed) or `28000` (signed out, or the Stop link
    // ended the session): the person signs in again, then the next pass retries. Not the job's
    // fault, so no attempt is counted, and never a silent token refresh.
    if (needsSignIn(e)) return { kind: 'gate', reason: 'sign_in' };
    if (e instanceof BackupServerError) {
      if (e.code === BACKUP_ERRORS.consent) {
        d.db.setMeta(META.paused, 'consent');
        return { kind: 'gate', reason: 'consent' };
      }
      if (e.code === BACKUP_ERRORS.quota) {
        d.db.setMeta(META.paused, 'quota');
        return { kind: 'gate', reason: 'quota' };
      }
      // `SCDEL purged`: the letter was erased on the server. Its recording is never sent again.
      if (e.code === BACKUP_ERRORS.deleted && e.detail === 'purged') {
        d.db.updateJob(job.entryId, { state: 'blocked', lastError: 'purged' });
        return { kind: 'blocked' };
      }
      // The upload refused us (an expired signed token, a session or policy change): ask backup_begin again.
      // It is idempotent on the entry id, so the job goes back to `sealed` with no upload URL.
      if ((job.state === 'begun' || job.state === 'uploading') && /^HTTP(400|401|403)$/.test(e.code)) {
        d.db.updateJob(job.entryId, { state: 'sealed', objectPath: null, uploadUrl: null, uploadToken: null, uploadOffset: 0 });
        return later(job, e.code);
      }
      // Not a parent of this book (anymore): kept on the phone, never sent.
      if (e.code === BACKUP_ERRORS.notParent) {
        d.db.updateJob(job.entryId, { state: 'blocked', lastError: 'not_parent' });
        return { kind: 'blocked' };
      }
      // The server has no key for this book yet (a server restore, or the store raced): look again.
      if (e.code === BACKUP_ERRORS.notFound && e.detail === 'key') d.keys.refresh();
      // `P0002 entry`: the letter's row is not on the server yet; `SCBKO`: switched off there. Both wait.
      return later(job, e.detail ? `${e.code}:${e.detail}` : e.code || 'network', e.retryAfterSeconds);
    }
    return later(job, (e as { code?: string })?.code ?? 'error');
  }

  /** Encrypts the original into backup-tmp. With `rebuild`, re-creates the saved ciphertext exactly. */
  async function sealInto(job: UploadJob, rebuild: boolean): Promise<{ bytes: number; sha256: string } | 'stopped' | 'mismatch' | 'missing'> {
    if (!d.files.exists(job.audioUri)) return 'missing';
    const ref = { profileId: d.profileId, childId: job.childId };
    const version = job.keyVersion!;
    const aad = wrapAad(job.entryId, d.profileId, version);
    let fileKey: Uint8Array | null = null;
    let wrapped: Uint8Array;
    let prefix: Uint8Array;
    if (rebuild) {
      wrapped = b64(job.wrappedFileKey!);
      prefix = b64(job.noncePrefix!);
      fileKey = await d.vault.unwrapFileKey(ref, version, wrapped, aad);
    } else {
      fileKey = d.vault.randomBytes(KEY_LEN);
      prefix = d.vault.randomBytes(NONCE_PREFIX_LEN);
      wrapped = await d.vault.wrapFileKey(ref, version, fileKey, aad);
    }
    const tmp = d.files.tmpUri(tmpName(job.entryId));
    const source = d.files.openRead(job.audioUri);
    const sink = d.files.openWrite(tmp);
    try {
      await encryptObject({
        stream: { entryId: job.entryId, authorId: d.profileId, noncePrefix: prefix, segmentSize: SEGMENT_SIZE },
        keyBlock: { keyVersion: version, wrapped },
        fileKey,
        plainSha256: hexToBytes(job.audioSha256),
        plainLength: job.audioBytes,
        source,
        sink,
        aead: d.aead,
        keepGoing,
      });
    } catch (e) {
      source.close();
      sink.close();
      d.files.remove(tmp);
      if (e instanceof BackupStopped) return 'stopped';
      if ((e as { code?: string }).code === 'length') return 'mismatch';
      throw e;
    } finally {
      wipe(fileKey);
    }
    source.close();
    sink.close();
    const sha256 = await d.files.sha256(tmp);
    const bytes = d.files.size(tmp) ?? 0;
    if (!rebuild) {
      d.db.updateJob(job.entryId, {
        state: 'sealed',
        wrappedFileKey: bytesToBase64(wrapped),
        noncePrefix: bytesToBase64(prefix),
        tmpUri: tmp,
        cipherBytes: bytes,
        cipherSha256: sha256,
      });
    }
    return { bytes, sha256 };
  }

  async function stepQueued(job: UploadJob): Promise<StepOutcome> {
    const key = await d.keys.keyFor(job.childId, { create: true });
    if (key.kind !== 'ready') {
      d.db.setMeta(META.keyState, key.kind);
      return { kind: 'key', state: key.kind === 'none' ? 'unavailable' : key.kind };
    }
    d.db.deleteMeta(META.keyState);
    if (!d.files.exists(job.audioUri)) return later(job, 'missing'); // a stale path the launch sweep rebases
    // Never upload a file whose hash differs from the one taken at capture (F08-U02): flag it, keep it.
    if ((await d.files.sha256(job.audioUri)) !== job.audioSha256) {
      d.db.updateJob(job.entryId, { state: 'blocked', lastError: 'hash_mismatch' });
      return { kind: 'blocked' };
    }
    // Over the bucket's object limit (a take of about 40 minutes): kept on the phone, never sent.
    if (objectLength(job.audioBytes) > MAX_OBJECT_BYTES) {
      d.db.updateJob(job.entryId, { state: 'blocked', lastError: 'too_large' });
      return { kind: 'blocked' };
    }
    d.db.updateJob(job.entryId, { keyVersion: key.version });
    const r = await sealInto({ ...job, keyVersion: key.version }, false);
    if (r === 'stopped') return { kind: 'gate', reason: await stopReason() };
    if (r === 'missing') return later(job, 'missing');
    if (r === 'mismatch') {
      d.db.updateJob(job.entryId, { state: 'blocked', lastError: 'hash_mismatch' });
      return { kind: 'blocked' };
    }
    return { kind: 'progressed' };
  }

  async function stepSealed(job: UploadJob): Promise<StepOutcome> {
    const r = await d.server.begin({
      entryId: job.entryId,
      childId: job.childId,
      bytes: job.cipherBytes!,
      keyVersion: job.keyVersion!,
      wrappedFileKey: job.wrappedFileKey!,
    });
    if (r.state === 'confirmed') return confirmed(job);
    d.db.updateJob(job.entryId, { state: 'begun', objectPath: r.objectPath, uploadToken: r.uploadToken });
    return { kind: 'progressed' };
  }

  /** The saved ciphertext is on disk and unchanged, or is rebuilt byte for byte from what was saved. */
  async function ensureTmp(job: UploadJob): Promise<'ok' | 'reset' | 'stopped'> {
    if (job.tmpUri && d.files.exists(job.tmpUri) && (await d.files.sha256(job.tmpUri)) === job.cipherSha256) return 'ok';
    // A rebuild reuses the saved file key and nonce prefix, so it may only ever encrypt the same
    // original: a changed file under the same (key, nonce) would be GCM nonce reuse. Check first;
    // a reset job goes back through `queued`, which flags a changed file and never sends it.
    if (!d.files.exists(job.audioUri) || (await d.files.sha256(job.audioUri)) !== job.audioSha256) {
      reset(job);
      return 'reset';
    }
    if (!(await d.keys.canOpen(job.childId, job.keyVersion!))) {
      reset(job);
      return 'reset';
    }
    const r = await sealInto(job, true);
    if (r === 'stopped') return 'stopped';
    if (r === 'missing' || r === 'mismatch' || r.sha256 !== job.cipherSha256) {
      reset(job);
      return 'reset';
    }
    if (job.tmpUri !== d.files.tmpUri(tmpName(job.entryId))) d.db.updateJob(job.entryId, { tmpUri: d.files.tmpUri(tmpName(job.entryId)) });
    return 'ok';
  }

  async function stepUpload(job: UploadJob): Promise<StepOutcome> {
    const tmp = await ensureTmp(job);
    if (tmp === 'stopped') return { kind: 'gate', reason: await stopReason() };
    if (tmp === 'reset') return { kind: 'progressed' };
    const fresh = d.db.job(job.entryId)!;
    const target = await d.server.uploadTarget(fresh.objectPath!, fresh.uploadToken);
    const result = await tusUpload({
      http: d.http,
      target,
      bucket: BACKUP_BUCKET,
      objectPath: fresh.objectPath!,
      length: fresh.cipherBytes!,
      readPart: (offset, length) => d.files.readSlice(fresh.tmpUri!, offset, length),
      progress: { url: fresh.uploadUrl, offset: fresh.uploadOffset },
      onProgress: (p) => d.db.updateJob(job.entryId, { state: 'uploading', uploadUrl: p.url, uploadOffset: p.offset }),
      keepGoing: keepSending,
      partBytes: d.partBytes,
    });
    if (result === 'stopped') return { kind: 'gate', reason: await stopReason() };
    d.db.updateJob(job.entryId, { state: 'uploaded' });
    return { kind: 'progressed' };
  }

  function confirmed(job: UploadJob): StepOutcome {
    const at = new Date(d.clock.now()).toISOString();
    discardTmp(job);
    d.db.updateJob(job.entryId, { state: 'confirmed', confirmedAt: at, tmpUri: null, uploadUrl: null, uploadToken: null, attempts: 0, nextAttemptAt: null, lastError: null });
    d.db.setMeta(META.lastBackedUpAt, at);
    return { kind: 'progressed' };
  }

  async function stepUploaded(job: UploadJob): Promise<StepOutcome> {
    try {
      await d.server.confirm(job.entryId, job.cipherSha256!);
    } catch (e) {
      // The server has no object at the path (`P0002 object`), one of another size (`22023 size`), or no
      // reservation at all (`P0002` with no detail: the daily sweep removed a pending row older than 24
      // hours; review A on #150): asking again would never succeed, so the recording goes again from the
      // start, after a backoff.
      if (e instanceof BackupServerError && ((e.code === BACKUP_ERRORS.notFound && (e.detail === 'object' || !e.detail)) || (e.code === '22023' && e.detail === 'size'))) {
        const attempts = job.attempts + 1;
        reset(job, { attempts, lastError: `${e.code}:${e.detail ?? 'none'}`, nextAttemptAt: d.clock.now() + retryDelayMs('write_rpc', attempts, random, null) });
        return { kind: 'retry_later' };
      }
      throw e;
    }
    return confirmed(job);
  }

  async function step(job: UploadJob): Promise<StepOutcome> {
    try {
      switch (job.state) {
        case 'queued':
          return await stepQueued(job);
        case 'sealed':
          return await stepSealed(job);
        case 'begun':
        case 'uploading':
          return await stepUpload(job);
        case 'uploaded':
          return await stepUploaded(job);
        default:
          return { kind: 'blocked' };
      }
    } catch (e) {
      return onServerError(job, e);
    }
  }

  function nextJob(): UploadJob | null {
    const now = d.clock.now();
    for (const j of d.db.jobs()) {
      if (j.state === 'confirmed' || j.state === 'blocked') continue;
      if ((j.nextAttemptAt ?? 0) > now) continue;
      if (!onServer.get(j.entryId) || resting.has(j.entryId)) continue;
      return j;
    }
    return null;
  }

  const api = {
    /**
     * Brings the jobs in line with the recordings on this phone: new ones queue,
     * moved paths follow, recordings that are gone (erased, discarded) stop.
     */
    reconcile(): void {
      const items = d.source.list();
      const seen = new Set<string>();
      const next = new Map<string, boolean>();
      for (const it of items) {
        // Still on the phone, just not hashed (yet): keep its job as it is; do not start one.
        seen.add(it.entryId);
        if (!it.audioSha256 || it.audioBytes == null) continue;
        next.set(it.entryId, it.onServer);
        const job = d.db.job(it.entryId);
        if (!job) {
          d.db.insertJob({
            entryId: it.entryId,
            childId: it.childId,
            source: it.source,
            audioUri: it.audioUri,
            audioSha256: it.audioSha256,
            audioBytes: it.audioBytes,
            capturedAt: it.capturedAt,
          });
          // Brought back by restore from a confirmed backup: it is backed up already; never encrypt it again.
          if (d.db.restoreItem(it.entryId)?.state === 'done') d.db.updateJob(it.entryId, { state: 'confirmed', confirmedAt: new Date(d.clock.now()).toISOString() });
          continue;
        }
        const changedFile = job.audioSha256 !== it.audioSha256 || job.audioBytes !== it.audioBytes;
        const moved = job.childId !== it.childId;
        if (job.state === 'confirmed' && !changedFile && !moved) {
          if (job.audioUri !== it.audioUri || job.source !== it.source) d.db.updateJob(job.entryId, { audioUri: it.audioUri, source: it.source });
          continue;
        }
        // Moved to another book before upload finished, or re-hashed: start again under the right key.
        // A move after upload is the rewrap flow (F08 6.5 E, `replaceKeyBlock`), owned by F12 Move.
        if ((moved || changedFile) && job.state !== 'confirmed') {
          reset(job, { childId: it.childId, audioUri: it.audioUri, audioSha256: it.audioSha256, audioBytes: it.audioBytes, source: it.source, attempts: 0, nextAttemptAt: null, lastError: null });
          continue;
        }
        if (job.audioUri !== it.audioUri || job.source !== it.source) d.db.updateJob(job.entryId, { audioUri: it.audioUri, source: it.source });
      }
      for (const j of d.db.jobs()) {
        if (seen.has(j.entryId)) continue;
        discardTmp(j);
        d.db.deleteJob(j.entryId);
      }
      onServer = next;
    },

    /**
     * After a server restore (F08-U30, F08-REQ-031): a recording this phone
     * believes confirmed but the server no longer lists goes again, and one the
     * server lists as confirmed is marked done.
     */
    async reconcileWithServer(opts: { force?: boolean } = {}): Promise<void> {
      const blobs = await d.server.listBlobs();
      const onServerIds = new Set(blobs.map((b) => b.entryId));
      // An empty answer resets nothing unless forced: a whole-server restore is signalled by sync's epoch
      // change (`force`, request to S03), not by one read that may have come back empty for another reason.
      const resetMissing = blobs.length > 0 || opts.force === true;
      for (const j of d.db.jobs()) {
        if (j.state === 'confirmed' && !onServerIds.has(j.entryId)) {
          if (resetMissing) reset(j, { attempts: 0, nextAttemptAt: null });
        }
        else if (j.state !== 'confirmed' && j.state !== 'blocked' && onServerIds.has(j.entryId)) confirmed(j);
      }
    },

    /** Runs jobs until none can move or a gate closes. One run at a time; a second call joins the first. */
    drain(): Promise<StepOutcome | null> {
      if (running) return running;
      running = (async () => {
        let last: StepOutcome | null = null;
        try {
          api.reconcile();
          for (;;) {
            const g = await gate();
            if (g) return { kind: 'gate', reason: g } as StepOutcome;
            const job = nextJob();
            if (!job) return last;
            last = await step(job);
            if (last.kind === 'gate' || last.kind === 'key') return last;
          }
        } finally {
          running = null;
        }
      })();
      return running;
    },

    /**
     * Launch sweep of backup-tmp (F08-U17): removes every file no upload job
     * points at, including any half-written download or decrypted take a kill
     * left behind, so no partial plaintext outlives the run that made it.
     * Call before the queue and the restore start.
     */
    sweepTmp(): number {
      const keep = new Set(d.db.jobs().map((j) => j.tmpUri).filter((u): u is string => !!u));
      let n = 0;
      for (const uri of d.files.listTmp()) {
        if (keep.has(uri)) continue;
        d.files.remove(uri);
        n += 1;
      }
      return n;
    },

    isRunning: () => running !== null,
    gate,

    /**
     * When the next waiting job may run (its backoff ends), or null: the app wakes the queue then
     * while it is in the foreground, instead of waiting for the next foreground or store change.
     */
    nextWakeAt(): number | null {
      const now = d.clock.now();
      let best: number | null = null;
      for (const j of d.db.jobs()) {
        if (j.state === 'confirmed' || j.state === 'blocked' || resting.has(j.entryId)) continue;
        if (!onServer.get(j.entryId) || j.nextAttemptAt === null || j.nextAttemptAt <= now) continue;
        if (best === null || j.nextAttemptAt < best) best = j.nextAttemptAt;
      }
      return best;
    },
  };
  return api;
}

export type UploadQueue = ReturnType<typeof createUploadQueue>;
