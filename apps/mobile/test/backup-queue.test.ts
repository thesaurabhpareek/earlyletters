/// <reference types="node" />
/**
 * The upload queue (lib/backup/queue.ts; WP-F08-B5a; F08-REQ-018, -020,
 * -025, -031, -032; F08-U17). Real files on disk, the queue's real SQLite
 * store (node:sqlite), the Node vault and the fake bucket.
 *
 * The kill path: a kill is simulated as the process stopping, not as an
 * error: from the kill point on, every write to the backup database and to
 * the files throws, so nothing after that point is recorded. Then the app is
 * "relaunched" (a new queue over the same database and files, launch sweep
 * first) and must finish with exactly one confirmed object that decrypts to
 * the original. Fictional family Asha only.
 */
import { mkdtempSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { hexToBytes } from '../src/lib/backup/bytes';
import { BackupServerError, type BackupServer } from '../src/lib/backup/contract';
import { HEADER_LEN, SEGMENT_SIZE, decryptBody, parseHeader, wrapAad } from '../src/lib/backup/format';
import { createKeyManager } from '../src/lib/backup/keys';
import { openBackupDb, type BackupDb } from '../src/lib/backup/local-db';
import type { Aead, Conditions, FileIO, NetworkKind } from '../src/lib/backup/ports';
import { MAX_JOB_ATTEMPTS, createUploadQueue, type BackupSourceItem } from '../src/lib/backup/queue';
import { TUS_MAX_CREATES, TUS_MAX_OFFSET_ASKS, resolveLocation, tusUpload, type HttpLike } from '../src/lib/backup/tus';
import { FakeBackend, FakeICloud, fakeM4a, nodeAead, nodeFiles, nodeVault, sha256Hex } from './helpers/backup-node';
import { nodeDb } from './helpers/node-db';

const MAMA = '11111111-1111-4111-8111-111111111111';
const ASHA = 'a5a5a5a5-0000-4000-8000-000000000001';
const ASHA_TWIN = 'a5a5a5a5-0000-4000-8000-000000000002';
const PART = 64 * 1024;

class Killed extends Error {
  constructor() {
    super('killed');
  }
}

const roots: string[] = [];
afterEach(() => {
  for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true });
});

function rig() {
  const root = mkdtempSync(join(tmpdir(), 'asha-backup-'));
  roots.push(root);
  const clock = { t: Date.parse('2026-10-29T19:00:00Z') };
  const files = nodeFiles(root);
  const backend = new FakeBackend(() => clock.t);
  backend.consent.set(MAMA, 'accept');
  const vault = nodeVault({ icloud: new FakeICloud() });
  const sql = nodeDb().db;
  const iso = () => new Date(clock.t).toISOString();
  const cond = { net: 'wifi' as NetworkKind, fg: true, busy: false, cell: false, killed: false, escrowKilled: false, busyAfterSeals: undefined as number | undefined };
  const conditions: Conditions = {
    network: async () => cond.net,
    meteredNow: () => cond.net !== 'wifi',
    foreground: () => cond.fg,
    busy: () => cond.busy,
    cellularAllowed: () => cond.cell,
    uploadsKilled: () => cond.killed,
    escrowKilled: () => cond.escrowKilled,
  };
  const items: BackupSourceItem[] = [];
  const kill = { dead: false, at: null as string | null, countdown: 0 };
  const point = (name: string) => {
    if (kill.at === name && --kill.countdown <= 0) {
      kill.dead = true;
      kill.at = null;
      throw new Killed();
    }
  };
  const alive = () => {
    if (kill.dead) throw new Killed();
  };

  // The process dies: no write reaches the database or the disk after this point.
  const killableDb = (inner: BackupDb): BackupDb =>
    new Proxy(inner, {
      get(t, k: string) {
        const v = (t as unknown as Record<string, unknown>)[k];
        if (typeof v !== 'function') return v;
        const writes = ['updateJob', 'insertJob', 'deleteJob', 'setMeta', 'deleteMeta', 'setRestoreItem', 'resetForProfile'];
        return (...a: unknown[]) => {
          if (writes.includes(k)) alive();
          return (v as (...x: unknown[]) => unknown).apply(t, a);
        };
      },
    });
  const killableFiles: FileIO = {
    ...files,
    openWrite: (u) => {
      alive();
      const s = files.openWrite(u);
      return { write: (b) => (alive(), s.write(b)), close: () => s.close() };
    },
    remove: (u) => (alive(), files.remove(u)),
    moveNoReplace: (a, b) => (alive(), files.moveNoReplace(a, b)),
  };
  let seals = 0;
  const aead: Aead = {
    seal: async (...a) => {
      seals += 1;
      point('seal');
      if (cond.busyAfterSeals !== undefined && seals >= cond.busyAfterSeals) cond.busy = true;
      return nodeAead.seal(...a);
    },
    open: nodeAead.open,
  };
  const server = backend.serverFor(MAMA);
  const killableServer: BackupServer = Object.fromEntries(
    Object.entries(server).map(([name, fn]) => [
      name,
      async (...a: unknown[]) => {
        point(`before:${name}`);
        const r = await (fn as (...x: unknown[]) => Promise<unknown>)(...a);
        point(`after:${name}`);
        return r;
      },
    ]),
  ) as unknown as BackupServer;
  const httpHooks: ((method: string) => void)[] = [];
  const http: HttpLike = async (url, init) => {
    const r = await backend.http(url, init);
    for (const h of httpHooks) h(init.method);
    point(`tus:${init.method}:after`);
    return r;
  };

  let db = openBackupDb(sql, iso);
  db.resetForProfile(MAMA);
  db.setMeta('enabled', 'on');

  function make() {
    const kdb = killableDb(db);
    const keys = createKeyManager({ vault, server: killableServer, meta: kdb, clock: { now: () => clock.t, sleep: async () => {} }, profileId: MAMA, escrowKeys: () => backend.escrowKeys() });
    return createUploadQueue({
      db: kdb,
      keys,
      vault,
      aead,
      files: killableFiles,
      server: killableServer,
      http,
      conditions,
      clock: { now: () => clock.t, sleep: async () => {} },
      profileId: MAMA,
      source: { list: () => items },
      random: () => 0.5,
      partBytes: PART,
    });
  }

  let n = 0;
  async function addRecording(bytes: number, o: Partial<BackupSourceItem> = {}): Promise<{ item: BackupSourceItem; plain: Buffer }> {
    n += 1;
    const id = `01928c3e-5a2b-7c3d-8e4f-${String(n).padStart(12, '0')}`;
    const plain = fakeM4a(bytes);
    const uri = files.documentUri(`take-${n}.m4a`);
    writeFileSync(fileURLToPath(uri), plain);
    const item: BackupSourceItem = {
      entryId: id,
      childId: ASHA,
      source: 'letter',
      audioUri: uri,
      audioSha256: sha256Hex(plain),
      audioBytes: plain.length,
      capturedAt: new Date(clock.t + n * 1000).toISOString(),
      onServer: true,
      ...o,
    };
    items.push(item);
    if (item.onServer) backend.addRow(MAMA, id);
    return { item, plain };
  }

  /** Decrypts what the bucket holds for this letter with Mama's keys; null if absent. */
  async function serverPlaintext(entryId: string): Promise<Buffer | null> {
    const row = backend.blobs.get(entryId);
    if (!row || row.state !== 'confirmed') return null;
    const obj = backend.objects.get(row.objectPath)!;
    const h = parseHeader(obj.subarray(0, HEADER_LEN));
    const key = await vault.unwrapFileKey({ profileId: MAMA, childId: row.childId }, h.keyVersion, h.wrapped, wrapAad(entryId, MAMA, h.keyVersion));
    const parts: Uint8Array[] = [];
    let at = HEADER_LEN;
    await decryptBody(h, key, { read: (k) => obj.subarray(at, (at += k)), close() {} }, { write: (b) => void parts.push(Buffer.from(b)), close() {} }, nodeAead);
    return Buffer.concat(parts);
  }

  /** Relaunch until nothing is left to do (advances the clock past any backoff). */
  async function settle(times = 12) {
    for (let i = 0; i < times; i++) {
      const q = make();
      await q.drain();
      if (db.jobs().every((j) => j.state === 'confirmed' || j.state === 'blocked')) return;
      clock.t += 6 * 60 * 1000;
    }
  }

  return {
    root,
    clock,
    files,
    backend,
    vault,
    cond,
    items,
    kill,
    db: () => db,
    reopen: () => {
      db = openBackupDb(sql, iso);
    },
    make,
    addRecording,
    serverPlaintext,
    settle,
    seals: () => seals,
    tmpFiles: () => readdirSync(files.tmpDir),
    /** Runs after every resumable-upload call returns (before the queue sees the answer). */
    onHttp: (h: (method: string) => void) => void httpHooks.push(h),
  };
}

describe('[F08-REQ-020, F08-REQ-018] upload: encrypted on the phone, confirmed only after backup_confirm', () => {
  it('one recording goes queued, sealed, begun, uploading, uploaded, confirmed, and the bucket decrypts to the original', async () => {
    const r = rig();
    const { item, plain } = await r.addRecording(5 * SEGMENT_SIZE + 123);
    const q = r.make();
    await q.drain();
    const job = r.db().job(item.entryId)!;
    expect(job.state).toBe('confirmed');
    expect(r.db().getMeta('lastBackedUpAt')).not.toBeNull();
    expect(sha256Hex((await r.serverPlaintext(item.entryId))!)).toBe(sha256Hex(plain));
    expect(r.tmpFiles()).toEqual([]);
    // Every byte that left the phone is ciphertext: no ftyp box, no window of the original, no plaintext hash.
    for (const req of r.backend.requests) {
      expect(req.body.includes(Buffer.from('ftyp')), req.kind).toBe(false);
      expect(req.body.includes(plain.subarray(4096, 4160)), req.kind).toBe(false);
      expect(req.body.includes(Buffer.from(sha256Hex(plain))), req.kind).toBe(false);
      expect(req.body.includes(Buffer.from(hexToBytes(sha256Hex(plain)))), req.kind).toBe(false);
    }
    expect(r.backend.requests.filter((x) => x.kind === 'tus').length).toBeGreaterThan(5); // 6 MiB parts in the app; 64 KiB here
  });

  it('goes oldest first, one at a time', async () => {
    const r = rig();
    const a = await r.addRecording(1000);
    const b = await r.addRecording(1000);
    await r.make().drain();
    const begins = r.backend.requests.filter((x) => x.kind === 'begin').map((x) => JSON.parse(x.body.toString()).entryId);
    expect(begins).toEqual([a.item.entryId, b.item.entryId]);
  });
});

describe('[F08-REQ-025] backup never gets in the way, and waits for what it needs', () => {
  it('never during a recording or playback: nothing is read, sealed or sent', async () => {
    const r = rig();
    await r.addRecording(1000);
    r.cond.busy = true;
    expect(await r.make().drain()).toEqual({ kind: 'gate', reason: 'busy' });
    expect(r.backend.requests).toEqual([]);
    expect(r.tmpFiles()).toEqual([]);
  });

  it('a recording that starts mid-encryption stops the job between segments; it resumes after', async () => {
    const r = rig();
    const { item } = await r.addRecording(6 * SEGMENT_SIZE);
    r.cond.busyAfterSeals = 3;
    expect(await r.make().drain()).toEqual({ kind: 'gate', reason: 'busy' });
    expect(r.db().job(item.entryId)!.state).toBe('queued');
    expect(r.tmpFiles()).toEqual([]);
    r.cond.busyAfterSeals = undefined;
    r.cond.busy = false;
    await r.make().drain();
    expect(r.db().job(item.entryId)!.state).toBe('confirmed');
  });

  it('Wi-Fi only unless mobile data is allowed; offline, in the background or killed it waits', async () => {
    const r = rig();
    const { item } = await r.addRecording(1000);
    r.cond.net = 'cellular';
    expect(await r.make().drain()).toEqual({ kind: 'gate', reason: 'wifi' });
    r.cond.net = 'none';
    expect(await r.make().drain()).toEqual({ kind: 'gate', reason: 'offline' });
    r.cond.net = 'wifi';
    r.cond.fg = false;
    expect(await r.make().drain()).toEqual({ kind: 'gate', reason: 'background' });
    r.cond.fg = true;
    r.cond.killed = true;
    expect(await r.make().drain()).toEqual({ kind: 'gate', reason: 'killed' });
    expect(r.backend.requests).toEqual([]);
    r.cond.killed = false;
    r.cond.net = 'cellular';
    r.cond.cell = true;
    await r.make().drain();
    expect(r.db().job(item.entryId)!.state).toBe('confirmed');
  });

  it('[ADR 0016 4.3] leaving Wi-Fi mid-upload stops before the next part; back on Wi-Fi it resumes from the saved offset', async () => {
    const r = rig();
    const { item, plain } = await r.addRecording(5 * SEGMENT_SIZE);
    let patches = 0;
    let afterSwitch = 0;
    r.onHttp((m) => {
      if (m !== 'PATCH') return;
      if (patches >= 1) afterSwitch += 1;
      patches += 1;
      if (patches === 1) r.cond.net = 'cellular'; // the phone walks out of the house after the first part
    });
    expect(await r.make().drain()).toEqual({ kind: 'gate', reason: 'wifi' });
    expect(afterSwitch).toBeLessThanOrEqual(1);
    const job = r.db().job(item.entryId)!;
    expect(job.state).toBe('uploading');
    expect(job.uploadOffset).toBe(PART);
    // Still on mobile data: nothing more is sent.
    const sent = r.backend.requests.filter((x) => x.kind === 'tus').length;
    expect(await r.make().drain()).toEqual({ kind: 'gate', reason: 'wifi' });
    expect(r.backend.requests.filter((x) => x.kind === 'tus').length).toBe(sent);
    // Wi-Fi again: the rest goes, from the saved offset, and nothing is sent twice.
    r.cond.net = 'wifi';
    await r.make().drain();
    expect(r.db().job(item.entryId)!.state).toBe('confirmed');
    expect(sha256Hex((await r.serverPlaintext(item.entryId))!)).toBe(sha256Hex(plain));
    const bodyBytes = r.backend.requests.filter((x) => x.kind === 'tus').reduce((n, x) => n + x.body.length, 0);
    expect(bodyBytes).toBe(r.db().job(item.entryId)!.cipherBytes);
  });

  it('with Use cellular data on, leaving Wi-Fi does not stop the upload', async () => {
    const r = rig();
    const { item } = await r.addRecording(5 * SEGMENT_SIZE);
    r.cond.cell = true;
    r.onHttp((m) => {
      if (m === 'PATCH') r.cond.net = 'cellular';
    });
    await r.make().drain();
    expect(r.db().job(item.entryId)!.state).toBe('confirmed');
  });

  it(`a recording refused ${MAX_JOB_ATTEMPTS} times rests until the next launch; before that the queue says when to wake`, async () => {
    const r = rig();
    const { item } = await r.addRecording(2000);
    r.backend.faults.set('begin', 1000);
    const q = r.make();
    await q.drain();
    const first = r.db().job(item.entryId)!;
    expect(first.attempts).toBe(1);
    expect(q.nextWakeAt()).toBe(first.nextAttemptAt);
    for (let i = 1; i < MAX_JOB_ATTEMPTS; i++) {
      r.clock.t = q.nextWakeAt()!;
      await q.drain();
    }
    expect(r.db().job(item.entryId)!.attempts).toBe(MAX_JOB_ATTEMPTS);
    expect(q.nextWakeAt()).toBeNull();
    const begins = r.backend.requests.filter((x) => x.kind === 'begin').length;
    r.clock.t += 24 * 60 * 60 * 1000;
    await q.drain();
    expect(r.backend.requests.filter((x) => x.kind === 'begin').length).toBe(begins); // resting until the next launch
    r.backend.faults.set('begin', 0);
    await r.make().drain(); // the next launch tries again
    expect(r.db().job(item.entryId)!.state).toBe('confirmed');
  });

  it('[F08-REQ-032] a recording whose letter or held draft has no server row yet waits for it', async () => {
    const r = rig();
    const { item } = await r.addRecording(1000, { onServer: false, source: 'held' });
    await r.make().drain();
    expect(r.db().job(item.entryId)!.state).toBe('queued');
    expect(r.backend.requests.filter((x) => x.kind === 'begin')).toEqual([]);
    item.onServer = true;
    r.backend.addRow(MAMA, item.entryId);
    await r.make().drain();
    expect(r.db().job(item.entryId)!.state).toBe('confirmed');
    expect(r.backend.blobs.get(item.entryId)!.state).toBe('confirmed');
  });

  it('a held draft that becomes a letter keeps its id and uploads once', async () => {
    const r = rig();
    const { item } = await r.addRecording(1000, { source: 'held' });
    await r.make().drain();
    const tusBefore = r.backend.requests.filter((x) => x.kind === 'tus').length;
    item.source = 'letter';
    await r.make().drain();
    expect(r.db().job(item.entryId)!).toMatchObject({ state: 'confirmed', source: 'letter' });
    expect(r.backend.requests.filter((x) => x.kind === 'tus').length).toBe(tusBefore);
  });

  it('[F08-REQ-039] no active consent act: the server says SCCON and the whole queue pauses', async () => {
    const r = rig();
    await r.addRecording(1000);
    r.backend.consent.set(MAMA, 'withdraw');
    expect(await r.make().drain()).toEqual({ kind: 'gate', reason: 'consent' });
    expect(r.db().getMeta('paused')).toBe('consent');
    expect(await r.make().drain()).toEqual({ kind: 'gate', reason: 'consent' });
  });

  it('[F08-U28] at the quota, backup pauses; recording and saving are untouched', async () => {
    const r = rig();
    await r.addRecording(1000);
    r.backend.quotaBytes = 10;
    expect(await r.make().drain()).toEqual({ kind: 'gate', reason: 'quota' });
    expect(r.db().getMeta('paused')).toBe('quota');
  });

  it('a letter erased on the server (SCDEL purged) is never sent and does not retry', async () => {
    const r = rig();
    const { item } = await r.addRecording(1000);
    r.backend.purged.add(item.entryId);
    await r.make().drain();
    expect(r.db().job(item.entryId)!).toMatchObject({ state: 'blocked', lastError: 'purged' });
    expect(r.backend.requests.filter((x) => x.kind === 'tus')).toEqual([]);
  });

  it('the server lost the object before backup_confirm (P0002 object): sent again from the start, then confirmed', async () => {
    const r = rig();
    const { item, plain } = await r.addRecording(3 * SEGMENT_SIZE);
    r.kill.at = 'before:confirm';
    r.kill.countdown = 1;
    await expect(r.make().drain()).rejects.toBeInstanceOf(Killed);
    r.kill.dead = false;
    r.reopen();
    const path = r.db().job(item.entryId)!.objectPath!;
    r.backend.objects.delete(path);
    await r.make().drain();
    expect(r.db().job(item.entryId)!).toMatchObject({ state: 'queued', lastError: 'P0002:object' });
    await r.settle();
    expect(r.db().job(item.entryId)!.state).toBe('confirmed');
    expect(sha256Hex((await r.serverPlaintext(item.entryId))!)).toBe(sha256Hex(plain));
  });

  it('the stored object has another size than reserved (22023 size): sent again from the start, then confirmed', async () => {
    const r = rig();
    const { item, plain } = await r.addRecording(3 * SEGMENT_SIZE);
    r.kill.at = 'before:confirm';
    r.kill.countdown = 1;
    await expect(r.make().drain()).rejects.toBeInstanceOf(Killed);
    r.kill.dead = false;
    r.reopen();
    const path = r.db().job(item.entryId)!.objectPath!;
    r.backend.objects.set(path, r.backend.objects.get(path)!.subarray(0, 100));
    await r.make().drain();
    expect(r.db().job(item.entryId)!).toMatchObject({ state: 'queued', lastError: '22023:size' });
    await r.settle();
    expect(r.db().job(item.entryId)!.state).toBe('confirmed');
    expect(sha256Hex((await r.serverPlaintext(item.entryId))!)).toBe(sha256Hex(plain));
  });

  it('a recording that is retrying is never shown as backed up', async () => {
    const r = rig();
    await r.addRecording(1000);
    r.backend.faults.set('begin', 1);
    const q = r.make();
    await q.drain();
    const job = r.db().jobs()[0];
    expect(job.attempts).toBe(1);
    expect(job.state).not.toBe('confirmed');
  });

  it('[F08-U02] a file whose hash differs from the one taken at capture is never uploaded', async () => {
    const r = rig();
    const { item } = await r.addRecording(1000);
    writeFileSync(fileURLToPath(item.audioUri), fakeM4a(1000));
    await r.make().drain();
    expect(r.db().job(item.entryId)!).toMatchObject({ state: 'blocked', lastError: 'hash_mismatch' });
    expect(r.backend.requests.filter((x) => x.kind === 'begin')).toEqual([]);
  });

  it('an erased letter or discarded draft stops: its job and ciphertext go', async () => {
    const r = rig();
    const { item } = await r.addRecording(3 * SEGMENT_SIZE);
    r.kill.at = 'before:begin';
    r.kill.countdown = 1;
    await expect(r.make().drain()).rejects.toBeInstanceOf(Killed);
    r.kill.dead = false;
    expect(r.tmpFiles()).toHaveLength(1);
    r.items.splice(r.items.indexOf(item), 1);
    r.make().reconcile();
    expect(r.db().job(item.entryId)).toBeNull();
    expect(r.tmpFiles()).toEqual([]);
  });

  it('moved to another book before the upload finished: starts again under that book\'s key', async () => {
    const r = rig();
    const { item, plain } = await r.addRecording(2 * SEGMENT_SIZE);
    r.kill.at = 'before:begin';
    r.kill.countdown = 1;
    await expect(r.make().drain()).rejects.toBeInstanceOf(Killed);
    r.kill.dead = false;
    item.childId = ASHA_TWIN;
    await r.settle();
    expect(r.backend.blobs.get(item.entryId)!.childId).toBe(ASHA_TWIN);
    expect(r.backend.childKeys.map((k) => k.childId).sort()).toEqual([ASHA, ASHA_TWIN].sort());
    expect(sha256Hex((await r.serverPlaintext(item.entryId))!)).toBe(sha256Hex(plain));
  });

  it('[F08-REQ-031, F08-U30] after a server restore, a recording the server lost goes again', async () => {
    const r = rig();
    const { item, plain } = await r.addRecording(1000);
    const kept = await r.addRecording(1000);
    await r.make().drain();
    const row = r.backend.blobs.get(item.entryId)!;
    r.backend.objects.delete(row.objectPath);
    r.backend.blobs.delete(item.entryId);
    const q = r.make();
    await q.reconcileWithServer();
    expect(r.db().job(item.entryId)!.state).toBe('queued');
    expect(r.db().job(kept.item.entryId)!.state).toBe('confirmed');
    await q.drain();
    expect(sha256Hex((await r.serverPlaintext(item.entryId))!)).toBe(sha256Hex(plain));
  });

  it('an empty answer from the server resets nothing, unless sync says the server was restored', async () => {
    const r = rig();
    const { item } = await r.addRecording(1000);
    await r.make().drain();
    r.backend.objects.clear();
    r.backend.blobs.clear();
    const q = r.make();
    await q.reconcileWithServer();
    expect(r.db().job(item.entryId)!.state).toBe('confirmed');
    await q.reconcileWithServer({ force: true }); // the sync epoch changed (request to S03)
    expect(r.db().job(item.entryId)!.state).toBe('queued');
  });

  it('a recording that is briefly unhashed keeps its job and its upload', async () => {
    const r = rig();
    const { item } = await r.addRecording(3 * SEGMENT_SIZE);
    r.kill.at = 'before:begin';
    r.kill.countdown = 1;
    await expect(r.make().drain()).rejects.toBeInstanceOf(Killed);
    r.kill.dead = false;
    const sha = item.audioSha256;
    item.audioSha256 = null;
    r.make().reconcile();
    expect(r.db().job(item.entryId)!.state).toBe('sealed');
    expect(r.tmpFiles()).toHaveLength(1);
    item.audioSha256 = sha;
    await r.settle();
    expect(r.db().job(item.entryId)!.state).toBe('confirmed');
  });

  it('an upload the server refuses (an expired token, a policy change) asks backup_begin again', async () => {
    const r = rig();
    const { item, plain } = await r.addRecording(3 * SEGMENT_SIZE);
    const inner = r.backend.http;
    let refusals = 1;
    (r.backend as unknown as { http: HttpLike }).http = async (url, init) => {
      if (init.method === 'PATCH' && refusals > 0) {
        refusals -= 1;
        return { status: 403, header: () => null };
      }
      return inner(url, init);
    };
    await r.settle();
    expect(r.db().job(item.entryId)!.state).toBe('confirmed');
    expect(r.backend.requests.filter((x) => x.kind === 'begin').length).toBe(2);
    expect(sha256Hex((await r.serverPlaintext(item.entryId))!)).toBe(sha256Hex(plain));
  });
});

describe('[F08-U17] the kill path: a kill at any step resumes to one confirmed, decryptable object', () => {
  const POINTS: { at: string; countdown: number; why: string }[] = [
    { at: 'seal', countdown: 3, why: 'mid-encryption, after two segments' },
    { at: 'before:begin', countdown: 1, why: 'sealed, before backup_begin' },
    { at: 'after:begin', countdown: 1, why: 'backup_begin reached the server, the answer was lost' },
    { at: 'tus:POST:after', countdown: 1, why: 'the resumable upload was made, its URL was never saved' },
    { at: 'tus:PATCH:after', countdown: 2, why: 'two parts in the bucket, the offset was never saved' },
    { at: 'tus:PATCH:after', countdown: 6, why: 'every part in the bucket, "uploaded" was never saved' },
    { at: 'before:confirm', countdown: 1, why: '"uploaded" saved, backup_confirm never sent' },
    { at: 'after:confirm', countdown: 1, why: 'backup_confirm went through, the answer was lost' },
  ];

  for (const p of POINTS) {
    it(`${p.at} x${p.countdown}: ${p.why}`, async () => {
      const r = rig();
      const { item, plain } = await r.addRecording(5 * SEGMENT_SIZE + 321);
      r.kill.at = p.at;
      r.kill.countdown = p.countdown;
      await expect(r.make().drain()).rejects.toBeInstanceOf(Killed);
      // Relaunch: the database file and the disk are as the kill left them.
      r.kill.dead = false;
      r.reopen();
      r.make().sweepTmp();
      await r.settle();
      expect(r.db().job(item.entryId)!.state).toBe('confirmed');
      expect([...r.backend.blobs.values()].filter((b) => b.entryId === item.entryId && b.state === 'confirmed')).toHaveLength(1);
      expect(sha256Hex((await r.serverPlaintext(item.entryId))!)).toBe(sha256Hex(plain));
      expect(r.tmpFiles()).toEqual([]);
    });
  }

  it('two kills in a row (mid-upload, then right after the relaunch asked for the offset): still one confirmed object', async () => {
    const r = rig();
    const { item, plain } = await r.addRecording(5 * SEGMENT_SIZE + 77);
    r.kill.at = 'tus:PATCH:after';
    r.kill.countdown = 2;
    await expect(r.make().drain()).rejects.toBeInstanceOf(Killed);
    r.kill.dead = false;
    r.reopen();
    r.make().sweepTmp();
    r.kill.at = 'tus:HEAD:after';
    r.kill.countdown = 1;
    await expect(r.make().drain()).rejects.toBeInstanceOf(Killed);
    r.kill.dead = false;
    r.reopen();
    r.make().sweepTmp();
    await r.settle();
    expect(r.db().job(item.entryId)!.state).toBe('confirmed');
    expect([...r.backend.blobs.values()].filter((b) => b.entryId === item.entryId && b.state === 'confirmed')).toHaveLength(1);
    expect(sha256Hex((await r.serverPlaintext(item.entryId))!)).toBe(sha256Hex(plain));
    expect(r.tmpFiles()).toEqual([]);
  });

  it('the ciphertext file was lost mid-upload (iOS purged it): rebuilt byte for byte, the upload resumes at its offset', async () => {
    const r = rig();
    const { item, plain } = await r.addRecording(5 * SEGMENT_SIZE);
    r.kill.at = 'tus:PATCH:after';
    r.kill.countdown = 3;
    await expect(r.make().drain()).rejects.toBeInstanceOf(Killed);
    r.kill.dead = false;
    r.reopen();
    const job = r.db().job(item.entryId)!;
    expect(job.state).toBe('uploading');
    expect(job.uploadOffset).toBe(2 * PART); // the third part landed but its offset was never saved
    rmSync(fileURLToPath(job.tmpUri!));
    const patchesBefore = r.backend.requests.filter((x) => x.kind === 'tus').length;
    await r.settle();
    expect(r.db().job(item.entryId)!.state).toBe('confirmed');
    expect(sha256Hex((await r.serverPlaintext(item.entryId))!)).toBe(sha256Hex(plain));
    // It asked for the offset and sent only what was missing, not the whole object again.
    const sent = r.backend.requests.filter((x) => x.kind === 'tus').slice(patchesBefore);
    expect(sent.reduce((n, x) => n + x.body.length, 0)).toBe(job.cipherBytes! - 3 * PART);
  });

  it('the ciphertext was lost and the original changed since sealing: never re-encrypted under the saved key and nonce', async () => {
    const r = rig();
    const { item, plain } = await r.addRecording(5 * SEGMENT_SIZE);
    r.kill.at = 'tus:PATCH:after';
    r.kill.countdown = 2;
    await expect(r.make().drain()).rejects.toBeInstanceOf(Killed);
    r.kill.dead = false;
    r.reopen();
    const job = r.db().job(item.entryId)!;
    rmSync(fileURLToPath(job.tmpUri!));
    // Same length, different bytes: a rebuild would reuse (file key, nonce prefix) on new plaintext.
    const changed = Buffer.from(plain);
    changed[changed.length - 1] ^= 0xff;
    writeFileSync(fileURLToPath(item.audioUri), changed);
    const sealsBefore = r.seals();
    await r.settle();
    expect(r.seals()).toBe(sealsBefore);
    expect(r.db().job(item.entryId)!).toMatchObject({ state: 'blocked', lastError: 'hash_mismatch' });
    expect([...r.backend.blobs.values()].filter((b) => b.entryId === item.entryId && b.state === 'confirmed')).toHaveLength(0);
  });

  it('the launch sweep keeps a job\'s ciphertext and removes everything else in backup-tmp', async () => {
    const r = rig();
    const { item } = await r.addRecording(2 * SEGMENT_SIZE);
    r.kill.at = 'before:begin';
    r.kill.countdown = 1;
    await expect(r.make().drain()).rejects.toBeInstanceOf(Killed);
    r.kill.dead = false;
    writeFileSync(join(r.files.tmpDir, 'stray.restoring'), 'x');
    writeFileSync(join(r.files.tmpDir, 'other.enc'), 'x');
    expect(r.make().sweepTmp()).toBe(2);
    expect(r.tmpFiles()).toEqual([`${item.entryId}.enc`]);
    expect(pathToFileURL(join(r.files.tmpDir, `${item.entryId}.enc`)).toString()).toBe(r.db().job(item.entryId)!.tmpUri);
  });
});

describe('review fixes on #150: a swept reservation, the tus loop, the upload URL', () => {
  it('[review A, outside its lens] a confirm whose reservation the daily sweep removed (P0002, no detail) starts over', async () => {
    const r = rig();
    const { item, plain } = await r.addRecording(3 * SEGMENT_SIZE + 5);
    r.kill.at = 'before:confirm';
    r.kill.countdown = 1;
    await expect(r.make().drain()).rejects.toBeInstanceOf(Killed);
    r.kill.dead = false;
    expect(r.db().job(item.entryId)!.state).toBe('uploaded');
    // #151's daily sweep: a reservation never confirmed in 24 hours goes, and its object with it.
    const row = r.backend.blobs.get(item.entryId)!;
    r.backend.objects.delete(row.objectPath);
    r.backend.blobs.delete(item.entryId);
    r.reopen();
    await r.settle();
    expect(r.db().job(item.entryId)!.state).toBe('confirmed');
    expect(sha256Hex((await r.serverPlaintext(item.entryId))!)).toBe(sha256Hex(plain));
  });

  it(`[review B re-check] a confirm that keeps answering P0002 restarts at most ${MAX_JOB_ATTEMPTS} times, then rests until the next launch`, async () => {
    const r = rig();
    const { item, plain } = await r.addRecording(2000); // one part: one PATCH per upload
    let sweeping = true;
    // Every upload lands, then its reservation is gone before backup_confirm (P0002, no detail).
    r.onHttp((m) => {
      const row = r.backend.blobs.get(item.entryId);
      if (sweeping && m === 'PATCH' && row) {
        r.backend.objects.delete(row.objectPath);
        r.backend.blobs.delete(item.entryId);
      }
    });
    const begins = () => r.backend.requests.filter((x) => x.kind === 'begin').length;
    const q = r.make();
    for (let pass = 0; pass < 30; pass++) {
      await q.drain();
      r.clock.t += 6 * 60 * 1000;
    }
    expect(begins()).toBe(MAX_JOB_ATTEMPTS);
    expect(r.db().job(item.entryId)!).toMatchObject({ state: 'queued', attempts: MAX_JOB_ATTEMPTS, lastError: 'P0002:none' });
    expect(q.nextWakeAt()).toBeNull();
    sweeping = false;
    await r.make().drain(); // the next launch tries again
    expect(r.db().job(item.entryId)!.state).toBe('confirmed');
    expect(sha256Hex((await r.serverPlaintext(item.entryId))!)).toBe(sha256Hex(plain));
  });

  const EP = 'https://fake.storage/storage/v1/upload/resumable';
  const input = (http: HttpLike, url: string | null = null) => ({
    http, target: { endpoint: EP, headers: { Authorization: `Bearer ${MAMA}` } }, bucket: 'entry-audio', objectPath: `${ASHA}/${MAMA}/x.m4a.enc`,
    length: 10, readPart: () => new Uint8Array(10), progress: { url, offset: 0 }, onProgress: () => {}, keepGoing: () => true,
  });
  const created = (n: number) => ({ status: 201, header: (h: string) => (h === 'Location' ? `/storage/v1/upload/resumable/u${n}` : null) });

  it('[review B m1] a bucket that answers 404 to every PATCH: at most TUS_MAX_CREATES uploads in a call, then a retryable error', async () => {
    let posts = 0;
    let patches = 0;
    const http: HttpLike = async (_u, init) => (init.method === 'POST' ? created(++posts) : (patches++, { status: 404, header: () => null }));
    const e = await tusUpload(input(http)).catch((x: unknown) => x);
    expect(e).toBeInstanceOf(BackupServerError);
    expect((e as BackupServerError).retryable).toBe(true);
    expect(posts).toBe(TUS_MAX_CREATES);
    expect(patches).toBe(TUS_MAX_CREATES);
  });

  it('[review B m1] a bucket that answers 409 to every PATCH: at most TUS_MAX_OFFSET_ASKS offset reads in a call, then a retryable error', async () => {
    let heads = 0;
    const http: HttpLike = async (_u, init) =>
      init.method === 'POST' ? created(1) : init.method === 'HEAD' ? (heads++, { status: 200, header: (h: string) => (h === 'Upload-Offset' ? '0' : null) }) : { status: 409, header: () => null };
    const e = await tusUpload(input(http)).catch((x: unknown) => x);
    expect(e).toBeInstanceOf(BackupServerError);
    expect((e as BackupServerError).retryable).toBe(true);
    expect(heads).toBe(TUS_MAX_OFFSET_ASKS);
  });

  it('[review B m1] past the cap the job waits out the queue backoff, and finishes once the bucket answers', async () => {
    const r = rig();
    const { item, plain } = await r.addRecording(2 * SEGMENT_SIZE + 9);
    const real = r.backend.http;
    let broken = true;
    (r.backend as { http: HttpLike }).http = async (url, init) => (broken && init.method === 'PATCH' ? { status: 404, header: () => null } : real(url, init));
    await r.make().drain();
    const job = r.db().job(item.entryId)!;
    expect(job.state).not.toBe('confirmed');
    expect(job.nextAttemptAt ?? 0).toBeGreaterThan(r.clock.t);
    broken = false;
    await r.settle();
    expect(r.db().job(item.entryId)!.state).toBe('confirmed');
    expect(sha256Hex((await r.serverPlaintext(item.entryId))!)).toBe(sha256Hex(plain));
  });

  it('[review A note 2] the upload URL must be https on the endpoint origin, so the token never goes anywhere else', () => {
    expect(resolveLocation('/storage/v1/upload/resumable/abc', EP)).toBe('https://fake.storage/storage/v1/upload/resumable/abc');
    expect(resolveLocation('abc', EP)).toBe(`${EP}/abc`);
    expect(resolveLocation('https://FAKE.storage/storage/v1/upload/resumable/abc', EP)).toBe('https://FAKE.storage/storage/v1/upload/resumable/abc');
    for (const bad of ['https://evil.example/x', 'http://fake.storage/x', '//evil.example/x', 'https://fake.storage@evil.example/x',
      'https://fake.storage:8443/x', 'javascript:alert(1)', 'https:\\\\evil.example\\x', 'https://fake.storage/x y']) {
      const e = (() => {
        try {
          resolveLocation(bad, EP);
          return null;
        } catch (x) {
          return x;
        }
      })();
      expect(e, bad).toBeInstanceOf(BackupServerError);
      expect((e as BackupServerError).retryable, bad).toBe(false);
    }
    expect(() => resolveLocation('/x', 'http://fake.storage/storage/v1/upload/resumable')).toThrow(BackupServerError);
  });

  it('[review A note 2] a saved upload URL on another origin is never asked: a fresh upload starts on the endpoint', async () => {
    const seen: string[] = [];
    const http: HttpLike = async (url, init) => {
      seen.push(`${init.method} ${url}`);
      return init.method === 'POST' ? created(1) : { status: 204, header: (h: string) => (h === 'Upload-Offset' ? '10' : null) };
    };
    expect(await tusUpload(input(http, 'https://evil.example/storage/v1/upload/resumable/u0'))).toBe('done');
    expect(seen).toEqual([`POST ${EP}`, `PATCH ${EP}/u1`]);
  });
});
