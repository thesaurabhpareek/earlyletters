/**
 * Backup for one signed-in person on this phone: turn on and off, the upload
 * queue, restore, and the quiet status Settings shows (WP-F08-B2, B5a, B5b,
 * B5c). Pure composition over the ports, so the Node end-to-end test drives
 * exactly this with a fake bucket, a fake escrow and two phones.
 */
import type { BackupServer, EscrowClient, EscrowPublicKey } from './contract';
import { createKeyManager } from './keys';
import type { BackupDb } from './local-db';
import type { Aead, Clock, Conditions, FileIO, KeyVault } from './ports';
import { META, createUploadQueue, type BackupSource, type GateReason } from './queue';
import { createRestore, type BlobDownloader, type RestoreKeyStatus, type RestoreLocal } from './restore';
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
  source: BackupSource;
  local: RestoreLocal;
  escrowKeys: () => readonly EscrowPublicKey[];
  random?: () => number;
  partBytes?: number;
}

/**
 * What the Settings row says. Never a count of what is left (F08 6.5 A step 6;
 * VOICE.md, no counting). `restore` is set while recordings are coming back.
 */
export type BackupStatus =
  | { kind: 'unavailable' }
  | { kind: 'off' }
  | { kind: 'needs_consent' }
  | { kind: 'quota' }
  | { kind: 'paused' }
  | { kind: 'backing_up' }
  | { kind: 'waiting_wifi' }
  | { kind: 'current'; lastBackedUpAt: string | null };

export interface BackupView {
  status: BackupStatus;
  restore: RestoreKeyStatus | null;
}

export function createBackupService(d: BackupServiceDeps) {
  d.db.resetForProfile(d.profileId);
  const keys = createKeyManager({ vault: d.vault, server: d.server, meta: d.db, clock: d.clock, profileId: d.profileId, escrowKeys: d.escrowKeys });
  let stopped = false;
  const isStopped = () => stopped;
  const queue = createUploadQueue({ ...d, keys, stopped: isStopped });
  const restore = createRestore({ ...d, keys, stopped: isStopped });
  let lastGate: GateReason | null = null;
  let lastRestore: RestoreKeyStatus | null = null;

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
    // A restore pass asks the server for its list, so it runs only while a spoken letter of mine
    // has no recording on this phone (a new phone, or one restored from a device backup).
    if (d.local.anyMissing()) {
      try {
        const r = await restore.run();
        lastRestore = r.keys.kind === 'ready' ? null : r.keys;
      } catch {
        // the next tick tries again; restore never blocks the app
      }
    } else lastRestore = null;
    if (d.db.getMeta(META.enabled) !== 'on' || stopped) return;
    try {
      await uploads();
    } catch {
      // as above
    }
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

    /** Launch: sweep backup-tmp before anything runs, then work. Never throws. */
    async start(): Promise<void> {
      queue.sweepTmp();
      await tick();
    },

    /**
     * Turn on (F08 6.5 A steps 3 to 5): record the `backup` consent act first;
     * nothing is made or uploaded before the server has it (F08-REQ-039).
     */
    async turnOn(): Promise<'on' | 'unavailable'> {
      if (!available()) return 'unavailable';
      await d.server.recordConsent('accept');
      d.db.setMeta(META.enabled, 'on');
      d.db.deleteMeta(META.paused);
      await keys.ensureDevice();
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

    isOn: () => d.db.getMeta(META.enabled) === 'on',

    view(): BackupView {
      if (!available()) return { status: { kind: 'unavailable' }, restore: lastRestore };
      if (d.db.getMeta(META.enabled) !== 'on') return { status: { kind: 'off' }, restore: lastRestore };
      const paused = d.db.getMeta(META.paused);
      if (paused === 'consent') return { status: { kind: 'needs_consent' }, restore: lastRestore };
      if (paused === 'quota') return { status: { kind: 'quota' }, restore: lastRestore };
      const open = d.db.jobs().some((j) => j.state !== 'confirmed' && j.state !== 'blocked');
      const lastBackedUpAt = d.db.getMeta(META.lastBackedUpAt);
      if (!open) return { status: { kind: 'current', lastBackedUpAt }, restore: lastRestore };
      if (queue.isRunning()) return { status: { kind: 'backing_up' }, restore: lastRestore };
      if (lastGate === 'wifi' || lastGate === 'offline') return { status: { kind: 'waiting_wifi' }, restore: lastRestore };
      if (lastGate === 'killed') return { status: { kind: 'paused' }, restore: lastRestore };
      // A recording that is retrying, or waiting for its key, is not "backed up": say it carries on later.
      if (d.db.getMeta(META.keyState) || d.db.jobs().some((j) => j.state !== 'confirmed' && j.state !== 'blocked' && j.attempts > 0)) {
        return { status: { kind: 'paused' }, restore: lastRestore };
      }
      return { status: { kind: 'current', lastBackedUpAt }, restore: lastRestore };
    },

    /** Allow backup on mobile data (off by default, ADR 0016 section 4.3). */
    setCellular(on: boolean): void {
      d.db.setMeta('cellular', on ? 'on' : 'off');
    },
    cellular: () => d.db.getMeta('cellular') === 'on',
  };
}

export type BackupService = ReturnType<typeof createBackupService>;
