/**
 * Backup for one signed-in person on this phone: turn on and off, the upload
 * queue, restore, and the quiet status Settings shows (WP-F08-B2, B5a, B5b,
 * B5c). Pure composition over the ports, so the Node end-to-end test drives
 * exactly this with a fake bucket, a fake escrow and two phones.
 */
import { sameAccountOnly } from './account';
import type { BackupServer, EscrowClient, EscrowPublicKey } from './contract';
import { createKeyManager } from './keys';
import type { BackupDb, UploadJob } from './local-db';
import type { Aead, Clock, Conditions, FileIO, KeyVault } from './ports';
import { META, createUploadQueue, type BackupSource, type GateReason } from './queue';
import { HAS_BACKUP_META, createRestore, type BlobDownloader, type RestoreKeyStatus, type RestoreLocal } from './restore';
import type { HttpLike } from './tus';

export interface BackupServiceDeps {
  db: BackupDb;
  vault: KeyVault;
  aead: Aead;
  files: FileIO;
  server: BackupServer;
  escrow: EscrowClient;
  http: HttpLike;
  downloader: BlobDownloader;
  conditions: Conditions;
  clock: Clock;
  profileId: string;
  /** The account the phone's live session belongs to now, or null: every server and escrow call checks it is `profileId` first. */
  sessionUid: () => Promise<string | null>;
  source: BackupSource;
  local: RestoreLocal;
  escrowKeys: () => readonly EscrowPublicKey[];
  random?: () => number;
  partBytes?: number;
  /** Called when what Settings shows changes in the middle of a pass (a download starts). */
  onChange?: () => void;
}

/**
 * What the Settings row says. Never a count of what is left (F08 6.5 A step 6;
 * VOICE.md, no counting). `restore` is set while recordings are coming back.
 * Nothing reads "Backed up" while any recording of mine is not backed up.
 */
export type BackupStatus =
  | { kind: 'unavailable' }
  | { kind: 'off' }
  | { kind: 'needs_consent' }
  | { kind: 'quota' }
  | { kind: 'paused' }
  /** A server call needs a fresh sign-in (`SCSTP`, `28000`): say so, never retry silently. */
  | { kind: 'sign_in_again' }
  /** This phone waits for its key from the recovery service before new recordings back up. */
  | { kind: 'waiting_key'; holdUntil: string }
  /** That wait was stopped (Stop, Not me, a revoked phone): only Try again asks once more. */
  | { kind: 'key_stopped' }
  | { kind: 'backing_up' }
  | { kind: 'waiting_wifi' }
  /** Every other recording is backed up, but some stay only on this phone (changed since capture, too long, not my book). */
  | { kind: 'some_kept_here' }
  | { kind: 'current'; lastBackedUpAt: string | null };

export interface BackupView {
  status: BackupStatus;
  restore: RestoreKeyStatus | null;
  /** The server holds recordings of mine: a returning person (the Off screen says theirs come back on their own). */
  hasBackup: boolean;
}

/** Blocked for good and kept only on this phone: never sent, so never "Backed up". */
const KEPT_HERE = new Set(['hash_mismatch', 'too_large', 'not_parent']);
const isOpen = (j: UploadJob) => j.state !== 'confirmed' && j.state !== 'blocked';

export function createBackupService(deps: BackupServiceDeps) {
  // A call while the live session is another account's is never made: it stops the pass instead (account.ts).
  const d: BackupServiceDeps = {
    ...deps,
    server: sameAccountOnly(deps.server, deps.sessionUid, deps.profileId, { recheck: true }),
    escrow: sameAccountOnly(deps.escrow, deps.sessionUid, deps.profileId),
  };
  d.db.resetForProfile(d.profileId);
  const keys = createKeyManager({ vault: d.vault, server: d.server, meta: d.db, clock: d.clock, profileId: d.profileId, escrowKeys: d.escrowKeys });
  let stopped = false;
  const isStopped = () => stopped;
  let lastRestore: RestoreKeyStatus | null = null;
  const queue = createUploadQueue({ ...d, keys, stopped: isStopped });
  const restore = createRestore({
    ...d,
    keys,
    stopped: isStopped,
    onRestoring: () => {
      if (lastRestore?.kind === 'restoring') return;
      lastRestore = { kind: 'restoring' };
      d.onChange?.();
    },
  });
  let lastGate: GateReason | null = null;
  /** The upload side's own wait for a key through escrow (a phone with every recording but no key). */
  let keyWait: RestoreKeyStatus | null = null;

  const available = () => d.vault.supported() && d.escrowKeys().length > 0;

  /** True until the queue has compared itself with the server's list once in this run (launch, and after Turn on). */
  let checkServer = true;

  async function uploads(): Promise<void> {
    queue.reconcile();
    if (checkServer) {
      await queue.reconcileWithServer();
      checkServer = false;
    }
    const r = await queue.drain();
    lastGate = r?.kind === 'gate' ? r.reason : null;
  }

  /**
   * One pass: restore what is missing, then upload what is new. Called at
   * launch, on foreground, when the store changes and when the network does.
   * Restoring is never gated by the backup switch or a plan (C-NFR-008).
   */
  let running: Promise<void> | null = null;

  /** One pass at a time: a call while a pass runs joins it (restore and upload never overlap themselves). */
  function tick(): Promise<void> {
    if (running) return running;
    running = pass().finally(() => {
      running = null;
    });
    return running;
  }

  async function pass(): Promise<void> {
    if (!d.vault.supported() || stopped) return;
    let askedEscrow = false;
    // A restore pass asks the server for its list, so it runs only while a spoken letter of mine
    // has no recording on this phone (a new phone, or one restored from a device backup) that a
    // listing in this run has not already left out (restore.ts worthListing).
    if (restore.worthListing()) {
      try {
        const r = await restore.run();
        askedEscrow = r.escrow;
        lastRestore = r.keys.kind === 'ready' ? (r.remaining > 0 ? { kind: 'restoring' } : null) : r.keys;
      } catch {
        // the next tick tries again; restore never blocks the app
        if (lastRestore?.kind === 'restoring') lastRestore = null;
      }
    } else lastRestore = null;
    if (d.db.getMeta(META.enabled) !== 'on' || stopped) return;
    try {
      await uploads();
      // New recordings wait for a key that only escrow can bring (iCloud Keychain did not), and
      // no restore asked for it in this pass: ask here, with the same Stop and sign-in rules.
      if (d.db.getMeta(META.keyState) === 'needs_escrow' && !askedEscrow && !stopped) {
        const k = await restore.escrowStep();
        keyWait = k.kind === 'ready' ? null : k;
        if (k.kind === 'ready') {
          d.db.deleteMeta(META.keyState);
          keys.refresh();
          await uploads();
        }
      } else if (d.db.getMeta(META.keyState) !== 'needs_escrow') keyWait = null;
    } catch {
      // as above
    }
  }

  function status(): BackupStatus {
    if (!available()) return { kind: 'unavailable' };
    if (d.db.getMeta(META.enabled) !== 'on') return { kind: 'off' };
    const paused = d.db.getMeta(META.paused);
    if (paused === 'consent') return { kind: 'needs_consent' };
    if (paused === 'quota') return { kind: 'quota' };
    const jobs = d.db.jobs();
    const keptHere = jobs.some((j) => j.state === 'blocked' && KEPT_HERE.has(j.lastError ?? ''));
    if (!jobs.some(isOpen)) return keptHere ? { kind: 'some_kept_here' } : { kind: 'current', lastBackedUpAt: d.db.getMeta(META.lastBackedUpAt) };
    if (queue.isRunning()) return { kind: 'backing_up' };
    if (lastGate === 'wifi' || lastGate === 'offline') return { kind: 'waiting_wifi' };
    if (lastGate === 'sign_in' || keyWait?.kind === 'sign_in_again') return { kind: 'sign_in_again' };
    if (keyWait?.kind === 'waiting_hold') return { kind: 'waiting_key', holdUntil: keyWait.holdUntil };
    if (keyWait?.kind === 'stopped') return { kind: 'key_stopped' };
    // Anything still open (retrying, waiting for its key, for its letter's text to sync, or for its
    // turn) is not backed up: say it carries on later. Never "Backed up" while one is waiting.
    return { kind: 'paused' };
  }

  return {
    keys,
    queue,
    restore,
    tick,

    /**
     * Another account signed in on this phone: no new step starts, the running
     * pass ends at its next check, and then backup-tmp is swept so no plaintext
     * of the old account's recordings stays behind.
     */
    async stop(): Promise<void> {
      stopped = true;
      await running?.catch(() => undefined);
      queue.sweepTmp();
    },

    /**
     * Launch: sweep backup-tmp before anything runs, then work. Never throws.
     * A quota pause is lifted once per launch, so one `backup_begin` asks again
     * (the quota may have been raised); a fresh `SCQTA` sets it back.
     */
    async start(): Promise<void> {
      queue.sweepTmp();
      if (d.db.getMeta(META.paused) === 'quota') d.db.deleteMeta(META.paused);
      await tick();
    },

    /**
     * Turn on (F08 6.5 A steps 3 to 5): record the `backup` consent act first;
     * nothing is made or uploaded before the server has it (F08-REQ-039). The
     * device key is registered after, best effort: uploads do not need it, and
     * restore asks again (so a refused or revoked device never fails turn-on).
     */
    async turnOn(): Promise<'on' | 'unavailable'> {
      if (!available()) return 'unavailable';
      await d.server.recordConsent('accept');
      d.db.setMeta(META.enabled, 'on');
      d.db.deleteMeta(META.paused);
      await keys.ensureDevice().catch(() => undefined);
      checkServer = true;
      void tick();
      return 'on';
    },

    /**
     * Turn off, keeping what is backed up (F08 6.5 D3, `backup.offKeep`): new
     * uploads stop; restoring stays possible. "Delete the backup" with the
     * only-in-backup count is WP-F08-B5d, not in this change.
     */
    async turnOffKeep(): Promise<void> {
      await d.server.recordConsent('withdraw');
      d.db.setMeta(META.enabled, 'off');
    },

    /** The person tapped Try again (a stopped restore, or a stopped wait for this phone's key). */
    async tryAgain(): Promise<void> {
      await restore.tryAgain();
      keyWait = null;
      if (lastRestore?.kind === 'stopped') lastRestore = null;
    },

    isOn: () => d.db.getMeta(META.enabled) === 'on',

    view(): BackupView {
      return { status: status(), restore: lastRestore, hasBackup: d.db.getMeta(HAS_BACKUP_META) === '1' };
    },

    /** When a waiting upload may run next (its backoff ends): the app wakes the queue then. */
    nextWakeAt: () => queue.nextWakeAt(),

    /** Allow backup on mobile data (off by default, ADR 0016 section 4.3). */
    setCellular(on: boolean): void {
      d.db.setMeta('cellular', on ? 'on' : 'off');
    },
    cellular: () => d.db.getMeta('cellular') === 'on',
  };
}

export type BackupService = ReturnType<typeof createBackupService>;
