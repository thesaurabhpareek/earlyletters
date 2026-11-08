/// <reference types="node" />
/**
 * Pack engine (ADR 0016) on a memory disk (`memory-ports.ts`), so free space on
 * the test machine never decides a result, with a real HTTP Range server where a
 * test needs real requests and faults. The interrupted-install matrix also
 * answers Range requests from memory, so it opens no socket. One test runs an
 * update and a kill on the real disk and checks the memory disk behaves the same.
 * Run by `npm test -w @scribe/mobile` and `npm test -w @scribe/api`
 * (vitest.consumers.config.ts).
 */
import * as fs from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateSigningKey, base64ToBytes, parsePackManifest, signDocument, type PackManifest } from '@scribe/api';
import { ENDPOINT_CLASSES } from '@scribe/api';
import { CELLULAR_FREE_BYTES, WASTED_CHUNKS_PER_RUN, PackManager, type PackEnv, type PackFs, type PackHttp, type PackProgress } from '../engine';
import { SignedDocumentClient } from '../../remote/documents';
import { MemoryDisk, MemoryFs, MemoryHttp, recordCalls, treeOf } from './memory-ports';
import { bytesOf, CrashError, FakeNetwork, LocalHttp, MemoryKv, NodeFs, sha256, startRangeServer, tempRoot, type CrashPlan, type ServedFile } from './node-ports';

const CHUNK = 1000;
const MEMORY_ROOT = '/packs';
const instantSleep = async (_ms: number, signal: AbortSignal) => {
  if (signal.aborted) throw Object.assign(new Error('aborted'), { name: 'AbortError' });
};

interface PackSpec {
  id: string;
  version: number;
  body: Uint8Array;
  language?: string;
  kind?: string;
  required?: boolean;
  minAppVersion?: string;
  mirrors?: string[];
  path?: string;
  /** Bytes the manifest declares, when different from the body (a wrong hash). */
  sha256?: string;
}

function manifestOf(specs: PackSpec[], version = 1): PackManifest {
  const r = parsePackManifest({
    schemaVersion: 1,
    version,
    generatedAt: '2026-10-03T12:00:00.000Z',
    packs: specs.map((s) => ({
      id: s.id,
      kind: s.kind ?? 'text-rules',
      language: s.language ?? 'pt',
      version: s.version,
      url: `https://packs.test${s.path ?? `/${s.id}/${s.version}/file.bin`}`,
      mirrors: s.mirrors ?? [],
      bytes: s.body.length,
      sha256: s.sha256 ?? sha256(s.body),
      fileName: 'file.bin',
      minAppVersion: s.minAppVersion ?? '1.0.0',
      required: s.required ?? true,
    })),
  });
  if (!r.ok) throw new Error('bad manifest fixture');
  return r.value;
}

let server: Awaited<ReturnType<typeof startRangeServer>> | undefined;
let files: Record<string, ServedFile>;
let disk: MemoryDisk;
let root: string;

beforeEach(() => {
  files = {};
  disk = new MemoryDisk();
  root = MEMORY_ROOT;
  server = undefined;
});

/** Starts the local Range server for each test in the calling describe. */
function useRangeServer() {
  beforeEach(async () => {
    server = await startRangeServer(files);
  });
  afterEach(async () => {
    await server?.close();
  });
}

/** Gives each test in the calling describe a fresh folder on the real disk, as `root`. */
function useTempRoot() {
  beforeEach(() => {
    root = tempRoot('engine');
  });
  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });
}

function serve(spec: PackSpec, extra: Partial<ServedFile> = {}) {
  files[spec.path ?? `/${spec.id}/${spec.version}/file.bin`] = { body: spec.body, ...extra };
}

/** A manager on the memory disk with the local Range server, unless the test passes its own ports. */
function makeManager(over: Partial<PackEnv> & { manifest?: () => Promise<PackManifest | null>; fsImpl?: PackFs; network?: FakeNetwork } = {}) {
  const env: PackEnv = {
    fs: over.fsImpl ?? new MemoryFs(disk, root),
    http: over.http ?? new LocalHttp(server!.base, (dest, bytes) => disk.write(dest, bytes)),
    network: over.network ?? new FakeNetwork('wifi'),
    settings: new MemoryKv(),
    appVersion: '1.0.0',
    manifest: over.manifest ?? (async () => null),
    downloadsPaused: over.downloadsPaused ?? (() => false),
    sleep: instantSleep,
    random: () => 0,
    chunkBytes: CHUNK,
    ...over,
  };
  return new PackManager(env);
}

describe('install', () => {
  useRangeServer();

  it('[DECISION-15] downloads in Range chunks, verifies SHA-256 and installs atomically', async () => {
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(4500) };
    serve(pt);
    const m = makeManager({ manifest: async () => manifestOf([pt]) });
    const r = await m.ensurePack('text-rules.pt');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(sha256(disk.read(r.path))).toBe(sha256(pt.body));
    expect(r.path).toBe(`${root}/installed/text-rules.pt/1/file.bin`);
    expect(m.packPath('text-rules.pt')).toBe(r.path);
    expect(server!.log.map((l) => l.range)).toEqual(['bytes=0-999', 'bytes=1000-1999', 'bytes=2000-2999', 'bytes=3000-3999', 'bytes=4000-4499']);
    expect(disk.list(`${root}/staging`)).toEqual([]);
    expect(m.listInstalled().map((p) => [p.id, p.version, p.bytes])).toEqual([['text-rules.pt', 1, 4500]]);
  });

  it('returns an installed pack at once, offline', async () => {
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(1200) };
    serve(pt);
    await makeManager({ manifest: async () => manifestOf([pt]) }).ensurePack('text-rules.pt');
    const offline = makeManager({ manifest: async () => null, network: new FakeNetwork('none') });
    const r = await offline.ensurePack('text-rules.pt');
    expect(r).toEqual({ ok: true, path: `${root}/installed/text-rules.pt/1/file.bin`, version: 1 });
  });

  it('accepts a host that ignores Range and sends the whole file', async () => {
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(3000) };
    serve(pt, { ignoreRange: true });
    const r = await makeManager({ manifest: async () => manifestOf([pt]) }).ensurePack('text-rules.pt');
    expect(r.ok).toBe(true);
    expect(server!.log.length).toBe(1);
  });

  it('shares one download between concurrent callers', async () => {
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(2500) };
    serve(pt);
    const m = makeManager({ manifest: async () => manifestOf([pt]) });
    const [a, b] = await Promise.all([m.ensurePack('text-rules.pt', { requireLatest: true }), m.ensurePack('text-rules.pt', { requireLatest: true })]);
    expect(a).toEqual(b);
    expect(server!.log.length).toBe(3);
  });

  it('explains why a pack cannot be installed', async () => {
    const future: PackSpec = { id: 'text-rules.fr', version: 1, body: bytesOf(10), minAppVersion: '9.0.0' };
    const m = makeManager({ manifest: async () => manifestOf([future]) });
    expect(await m.ensurePack('text-rules.fr')).toEqual({ ok: false, reason: 'needs_app_update' });
    expect(await m.ensurePack('text-rules.xx')).toEqual({ ok: false, reason: 'not_in_manifest' });
    expect(await makeManager().ensurePack('text-rules.fr')).toEqual({ ok: false, reason: 'no_manifest' });
  });
});

describe('resume', () => {
  useRangeServer();

  it('[ADR-0016] continues from a partial file left by an earlier session', async () => {
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(5000) };
    serve(pt);
    const stage = `${root}/staging/text-rules.pt@1`;
    disk.mkdirp(stage);
    disk.write(`${stage}/meta.json`, JSON.stringify({ sha256: sha256(pt.body), bytes: 5000, fileName: 'file.bin' }));
    disk.write(`${stage}/file.bin.part`, pt.body.subarray(0, 3000));
    const r = await makeManager({ manifest: async () => manifestOf([pt]) }).ensurePack('text-rules.pt');
    expect(r.ok).toBe(true);
    expect(server!.log.map((l) => l.range)).toEqual(['bytes=3000-3999', 'bytes=4000-4999']);
  });

  it('[ADR-0016] resumes after cancel without fetching the same bytes twice', async () => {
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(6000) };
    serve(pt);
    let t = 0;
    // A clock that moves 1 s per reading, so every progress event passes the 200 ms throttle.
    const m = makeManager({ manifest: async () => manifestOf([pt]), now: () => (t += 1000) });
    const stop = m.onProgress((p) => {
      if (p.phase === 'downloading' && p.bytesDone >= 2000) m.cancel('text-rules.pt');
    });
    expect(await m.ensurePack('text-rules.pt')).toEqual({ ok: false, reason: 'cancelled' });
    stop();
    const partSize = disk.read(`${root}/staging/text-rules.pt@1/file.bin.part`).length;
    expect(partSize % CHUNK).toBe(0);
    const before = server!.log.length;
    const r = await m.ensurePack('text-rules.pt');
    expect(r.ok).toBe(true);
    expect(server!.log.slice(before)[0].range).toBe(`bytes=${partSize}-${partSize + CHUNK - 1}`);
    const fetched = server!.log.filter((l) => l.status === 206).length;
    expect(fetched).toBe(6);
  });

  it('retries a dropped connection and a 503, discarding the broken chunk', async () => {
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(3000) };
    serve(pt, { dropOnceAfter: 400, failFirst: 1 });
    const r = await makeManager({ manifest: async () => manifestOf([pt]) }).ensurePack('text-rules.pt');
    expect(r.ok).toBe(true);
    if (r.ok) expect(sha256(disk.read(r.path))).toBe(sha256(pt.body));
  });
});

describe('a stalled request (TF1-DL, PR #541 reviews)', () => {
  const stalled = () => Object.assign(new Error('aborted'), { name: 'AbortError' });

  it('[TF1-DL] is a failed attempt that is retried, never a silent cancel', async () => {
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(2500) };
    const memory = new MemoryHttp({ [`/${pt.id}/1/file.bin`]: { body: pt.body } }, disk);
    let stalls = 1;
    const http: PackHttp = {
      async downloadRange(url, dest, start, end, opts) {
        // The adapter's stall timer fired: an AbortError while the caller's signal is not aborted.
        if (stalls-- > 0) throw stalled();
        return memory.downloadRange(url, dest, start, end, opts);
      },
    };
    const phases: string[] = [];
    const m = makeManager({ http, manifest: async () => manifestOf([pt]) });
    m.onProgress((p) => phases.push(p.phase));
    const r = await m.ensurePack('text-rules.pt');
    expect(r.ok).toBe(true);
    expect(phases).not.toContain('cancelled');
    expect(phases.at(-1)).toBe('installed');
  });

  it('[TF1-DL] every request stalls: download_failed after maxAttempts x hosts calls, with backoff that never shrinks', async () => {
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(2500), mirrors: ['https://mirror.test/text-rules.pt/1/file.bin'] };
    let calls = 0;
    const http: PackHttp = {
      async downloadRange() {
        calls++;
        throw stalled();
      },
    };
    const delays: number[] = [];
    const sleep = async (ms: number) => void delays.push(ms);
    const r = await makeManager({ http, sleep, manifest: async () => manifestOf([pt]) }).ensurePack('text-rules.pt');
    expect(r).toEqual({ ok: false, reason: 'download_failed' });
    expect(calls).toBe(ENDPOINT_CLASSES.pack_file.maxAttempts * 2);
    for (let i = 1; i < delays.length; i++) expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1]);
  });

  it('[TF1-DL] a slow but steady link that cannot carry a whole chunk still finishes, with smaller requests', async () => {
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(2500) };
    const memory = new MemoryHttp({ [`/${pt.id}/1/file.bin`]: { body: pt.body } }, disk);
    const sizes: number[] = [];
    const http: PackHttp = {
      async downloadRange(url, dest, start, end, opts) {
        sizes.push(end - start + 1);
        // This link stalls on anything over 300 bytes per request (CHUNK is 1000).
        if (end - start + 1 > 300) throw stalled();
        return memory.downloadRange(url, dest, start, end, opts);
      },
    };
    const r = await makeManager({ http, manifest: async () => manifestOf([pt]) }).ensurePack('text-rules.pt');
    expect(r.ok).toBe(true);
    if (r.ok) expect(sha256(disk.read(r.path))).toBe(sha256(pt.body));
    expect(Math.min(...sizes)).toBeLessThanOrEqual(300);
  });

  it('[TF1-DL] stops a run once stalled requests have lost two chunks of bytes, so a bad link never eats data', async () => {
    // Two mirrors: the attempt limit is maxAttempts x 3 hosts = 18 requests, so only the bytes cap can stop it sooner.
    const pt: PackSpec = {
      id: 'text-rules.pt',
      version: 1,
      body: bytesOf(5000),
      mirrors: ['https://mirror-a.test/text-rules.pt/1/file.bin', 'https://mirror-b.test/text-rules.pt/1/file.bin'],
    };
    let fetched = 0;
    let calls = 0;
    const http: PackHttp = {
      async downloadRange(_url, _dest, start, end, opts) {
        calls++;
        // Most of each request arrives, then it goes quiet: the bytes are lost with the request.
        const n = Math.floor((end - start + 1) * 0.9);
        fetched += n;
        opts.onBytes?.(n);
        throw stalled();
      },
    };
    const r = await makeManager({ http, manifest: async () => manifestOf([pt]) }).ensurePack('text-rules.pt');
    expect(r).toEqual({ ok: false, reason: 'download_failed' });
    const attemptLimit = ENDPOINT_CLASSES.pack_file.maxAttempts * 3;
    expect(calls).toBeLessThan(attemptLimit); // stopped by the bytes cap, not the attempt limit
    // At most WASTED_CHUNKS_PER_RUN chunks lost, plus the one request that crossed the line.
    expect(fetched).toBeLessThanOrEqual((WASTED_CHUNKS_PER_RUN + 1) * CHUNK);
    expect(fetched).toBeGreaterThan(WASTED_CHUNKS_PER_RUN * CHUNK);
  });

  it('[TF1-DL] still stops at once when the caller cancels', async () => {
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(2500) };
    const ctrl = new AbortController();
    const http: PackHttp = {
      async downloadRange() {
        ctrl.abort();
        throw stalled();
      },
    };
    const r = await makeManager({ http, manifest: async () => manifestOf([pt]) }).ensurePack('text-rules.pt', { signal: ctrl.signal });
    expect(r).toEqual({ ok: false, reason: 'cancelled' });
  });

  it('[TF1-DL] cancel(id) mid-request ends as cancelled (the card then offers Try again)', async () => {
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(2500) };
    let m: PackManager;
    const http: PackHttp = {
      downloadRange: (_u, _d, _s, _e, opts) =>
        new Promise((_resolve, reject) => {
          opts.signal.addEventListener('abort', () => reject(stalled()), { once: true });
          queueMicrotask(() => m.cancel('text-rules.pt'));
        }),
    };
    m = makeManager({ http, manifest: async () => manifestOf([pt]) });
    const phases: string[] = [];
    m.onProgress((p) => phases.push(p.phase));
    expect(await m.ensurePack('text-rules.pt')).toEqual({ ok: false, reason: 'cancelled' });
    expect(phases.at(-1)).toBe('cancelled');
  });

  it('[TF1-DL] a connection iOS reports as unknown (a VPN on Wi-Fi) holds a large pack as waiting_for_wifi', async () => {
    const big: PackSpec = { id: 'speech-model.test', version: 1, body: bytesOf(CELLULAR_FREE_BYTES + 1), kind: 'speech-model', language: 'mul', required: false };
    let calls = 0;
    const http: PackHttp = { downloadRange: async () => void calls++ };
    const m = makeManager({ http, manifest: async () => manifestOf([big]), network: new FakeNetwork('unknown') });
    const events: PackProgress[] = [];
    m.onProgress((p) => events.push(p));
    expect(await m.ensurePack('speech-model.test')).toEqual({ ok: false, reason: 'waiting_for_wifi' });
    expect(events.at(-1)).toMatchObject({ phase: 'waiting_for_wifi', bytesDone: 0 });
    expect(calls).toBe(0);
  });
});

describe('integrity', () => {
  useRangeServer();

  it('[ADR-0016] rejects a file whose SHA-256 does not match, and installs nothing', async () => {
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(2500) };
    serve(pt, { corrupt: true });
    const m = makeManager({ manifest: async () => manifestOf([pt]) });
    expect(await m.ensurePack('text-rules.pt')).toEqual({ ok: false, reason: 'hash_mismatch' });
    expect(m.packPath('text-rules.pt')).toBeNull();
    expect(disk.list(`${root}/staging`)).toEqual([]);
    expect(disk.has(`${root}/installed/text-rules.pt`)).toBe(false);
  });

  it('falls back to a mirror when the primary host serves wrong bytes', async () => {
    const body = bytesOf(2500);
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body, path: '/primary/pt.bin', mirrors: ['https://mirror.test/mirror/pt.bin'] };
    files['/primary/pt.bin'] = { body, corrupt: true };
    files['/mirror/pt.bin'] = { body };
    const r = await makeManager({ manifest: async () => manifestOf([pt]) }).ensurePack('text-rules.pt');
    expect(r.ok).toBe(true);
    expect(server!.log.some((l) => l.path === '/mirror/pt.bin')).toBe(true);
  });

  it('[ADR-0016] installs nothing when the manifest signature does not verify', async () => {
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(1500) };
    serve(pt);
    const signer = generateSigningKey();
    const impostor = generateSigningKey();
    const trusted = [{ keyId: 'el-test', publicKey: signer.publicKey, kinds: ['pack-manifest'] as const }];
    const store = new Map<string, string>();
    const client = new SignedDocumentClient<PackManifest>({
      kind: 'pack-manifest',
      url: null,
      parse: (p) => {
        const r = parsePackManifest(p);
        return r.ok ? { ok: true, value: r.value } : { ok: false, reason: r.reason };
      },
      versionOf: (x) => x.version,
      fallback: { schemaVersion: 1, version: 0, generatedAt: '1970-01-01T00:00:00.000Z', packs: [] },
      storage: { read: (n) => store.get(n) ?? null, write: (n, t) => void store.set(n, t), remove: (n) => void store.delete(n) },
      http: { get: async () => ({ status: 500, etag: null, body: null }) },
      trustedKeys: () => trusted,
      appVersion: '1.0.0',
      minIntervalMs: 0,
      timeoutMs: 1000,
    });
    const payload = JSON.parse(JSON.stringify(manifestOf([pt])));
    const forged = signDocument('pack-manifest', payload, base64ToBytes(impostor.secretKey)!, 'el-test');
    expect(client.accept(forged, null)).toBe('bad_signature');
    const m = makeManager({ manifest: async () => (client.current().version > 0 ? client.current() : null) });
    expect(await m.ensurePack('text-rules.pt')).toEqual({ ok: false, reason: 'no_manifest' });
    expect(server!.log.length).toBe(0);

    const genuine = signDocument('pack-manifest', payload, base64ToBytes(signer.secretKey)!, 'el-test');
    expect(client.accept(genuine, null)).toBe('updated');
    expect((await m.ensurePack('text-rules.pt')).ok).toBe(true);
  });
});

describe('atomic swap', () => {
  useRangeServer();

  it('[ADR-0016] keeps serving the old version until the new one is in place, then removes the old', async () => {
    const v1: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(1500, 1) };
    const v2: PackSpec = { id: 'text-rules.pt', version: 2, body: bytesOf(2500, 2) };
    serve(v1);
    serve(v2);
    let manifest = manifestOf([v1]);
    const m = makeManager({ manifest: async () => manifest });
    const r1 = await m.ensurePack('text-rules.pt');
    expect(r1.ok).toBe(true);
    manifest = manifestOf([v1, v2], 2);
    const seenDuring: (string | null)[] = [];
    m.onProgress((p: PackProgress) => {
      if (p.phase === 'downloading' || p.phase === 'verifying' || p.phase === 'installing') seenDuring.push(m.packPath('text-rules.pt'));
    });
    const r2 = await m.ensurePack('text-rules.pt', { requireLatest: true });
    expect(r2).toMatchObject({ ok: true, version: 2 });
    expect(new Set(seenDuring)).toEqual(new Set([`${root}/installed/text-rules.pt/1/file.bin`]));
    expect(sha256(disk.read(m.packPath('text-rules.pt')!))).toBe(sha256(v2.body));
    expect(disk.list(`${root}/installed/text-rules.pt`)).toEqual(['2']);
  });

  it('updates in the background when an older version is installed', async () => {
    const v1: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(1200, 1) };
    const v2: PackSpec = { id: 'text-rules.pt', version: 2, body: bytesOf(1300, 2) };
    serve(v1);
    serve(v2);
    let manifest = manifestOf([v1]);
    const m = makeManager({ manifest: async () => manifest });
    await m.ensurePack('text-rules.pt');
    manifest = manifestOf([v1, v2], 2);
    const installed = new Promise<void>((resolve) => m.onProgress((p) => p.phase === 'installed' && p.version === 2 && resolve()));
    const r = await m.ensurePack('text-rules.pt');
    expect(r).toMatchObject({ ok: true, version: 1 });
    await installed;
    expect(m.packPath('text-rules.pt')).toBe(`${root}/installed/text-rules.pt/2/file.bin`);
  });
});

describe('interrupted install', () => {
  // Memory disk and memory Range server: no disk and no socket, so a case meets the kill it plans and nothing
  // else. On the shared disk, a full volume once failed a real write here (ENOSPC, 17 Oct) and read as an engine result.
  const v1: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(1500, 11) };
  const v2: PackSpec = { id: 'text-rules.pt', version: 2, body: bytesOf(2600, 22) };
  /** The file operations of one update from v1 to v2, counted by the first test below. The matrix kills each one. */
  const OPS_PER_UPDATE = { rename: 4, writeText: 2, remove: 13, appendFile: 3 } as const;
  /**
   * Kills that land inside the chunk loop's try (engine.ts:609-643). Its retry path catches them and the job
   * goes on, which no real kill allows. appendFile #1-3 then end on v2. After remove #4, #6 or #8 the next
   * request appends the same chunk again (`have` is not refreshed, engine.ts:628) and the job ends in
   * hash_mismatch: safe, but the download is lost. Every other kill ends the job with storage_error.
   */
  const ABSORBED_BY_RETRY = ['appendFile #1', 'appendFile #2', 'appendFile #3', 'remove #4', 'remove #6', 'remove #8'];
  const plans: CrashPlan[] = (Object.keys(OPS_PER_UPDATE) as CrashPlan['op'][]).flatMap((op) =>
    Array.from({ length: OPS_PER_UPDATE[op] }, (_, i) => ({ op, nth: i + 1 })),
  );
  const ports = (crash: CrashPlan | null = null) => ({ fsImpl: new MemoryFs(disk, root, crash), http: new MemoryHttp(files, disk) });

  it('[ADR-0016] the matrix kills every file operation of an update', async () => {
    serve(v1);
    serve(v2);
    await makeManager({ manifest: async () => manifestOf([v1]), ...ports() }).ensurePack('text-rules.pt');
    const counting = new MemoryFs(disk, root);
    const r = await makeManager({ manifest: async () => manifestOf([v1, v2], 2), ...ports(), fsImpl: counting }).ensurePack('text-rules.pt', { requireLatest: true });
    expect(r).toMatchObject({ ok: true, version: 2 });
    expect(counting.counts).toEqual(OPS_PER_UPDATE);
  });

  it.each(plans)('[ADR-0016] a kill at $op #$nth leaves the old version or the new one, never a broken file', async (plan) => {
    serve(v1);
    serve(v2);
    await makeManager({ manifest: async () => manifestOf([v1]), ...ports() }).ensurePack('text-rules.pt');

    // The "crash": the file system throws once at the chosen step, and the process is gone (a fresh manager follows).
    const crashing = makeManager({ manifest: async () => manifestOf([v1, v2], 2), ...ports(plan) });
    let crashed = false;
    let stopped = false;
    try {
      const r = await crashing.ensurePack('text-rules.pt', { requireLatest: true });
      crashed = !r.ok;
      stopped = !r.ok && r.reason === 'storage_error';
    } catch (e) {
      crashed = e instanceof CrashError;
      stopped = crashed;
    }
    crashing.dispose();
    expect(stopped).toBe(!ABSORBED_BY_RETRY.includes(`${plan.op} #${plan.nth}`));

    const restarted = makeManager({ manifest: async () => manifestOf([v1, v2], 2), ...ports() });
    restarted.load();
    const path = restarted.packPath('text-rules.pt');
    expect(path).not.toBeNull();
    const digest = sha256(disk.read(path!));
    expect([sha256(v1.body), sha256(v2.body)]).toContain(digest);
    expect(restarted.listInstalled()).toHaveLength(1);
    if (!crashed) expect(digest).toBe(sha256(v2.body));

    // And the next attempt always ends on v2.
    const r = await restarted.ensurePack('text-rules.pt', { requireLatest: true });
    expect(r).toMatchObject({ ok: true, version: 2 });
    expect(sha256(disk.read(restarted.packPath('text-rules.pt')!))).toBe(sha256(v2.body));
    expect(disk.list(`${root}/installed/text-rules.pt`)).toEqual(['2']);
  });

  it('[ADR-0016] a full disk at the install step returns storage_error, keeps v1, and installs v2 once space returns', async () => {
    serve(v1);
    serve(v2);
    await makeManager({ manifest: async () => manifestOf([v1]), ...ports() }).ensurePack('text-rules.pt');
    // The 17 Oct sequence: v2 is downloaded and verified, then a kill lands at the first step of install().
    const crashing = makeManager({ manifest: async () => manifestOf([v1, v2], 2), ...ports({ op: 'remove', nth: 9 }) });
    expect(await crashing.ensurePack('text-rules.pt', { requireLatest: true })).toEqual({ ok: false, reason: 'storage_error' });
    crashing.dispose();

    disk.full = true;
    const http = new MemoryHttp(files, disk);
    const restarted = makeManager({ manifest: async () => manifestOf([v1, v2], 2), ...ports(), http });
    expect(await restarted.ensurePack('text-rules.pt', { requireLatest: true })).toEqual({ ok: false, reason: 'storage_error' });
    expect(disk.refused).toEqual([`${root}/staging/text-rules.pt@2/pack.json.tmp`]);
    expect(restarted.listInstalled().map((p) => p.version)).toEqual([1]);
    expect(sha256(disk.read(restarted.packPath('text-rules.pt')!))).toBe(sha256(v1.body));
    expect(disk.list(`${root}/installed/text-rules.pt`)).toEqual(['1']);

    disk.full = false;
    expect(await restarted.ensurePack('text-rules.pt', { requireLatest: true })).toMatchObject({ ok: true, version: 2 });
    expect(sha256(disk.read(restarted.packPath('text-rules.pt')!))).toBe(sha256(v2.body));
    expect(disk.list(`${root}/installed/text-rules.pt`)).toEqual(['2']);
    expect(http.requests).toBe(0); // the verified v2 waited in staging through the full disk; nothing was fetched again
  });

  it('cleans broken and orphaned version folders on load', () => {
    disk.mkdirp(`${root}/installed/text-rules.pt/1`);
    disk.write(`${root}/installed/text-rules.pt/1/file.bin`, 'abc');
    disk.write(`${root}/installed/text-rules.pt/1/pack.json`, JSON.stringify({ id: 'text-rules.pt', version: 1, fileName: 'file.bin', bytes: 999, sha256: 'x' }));
    disk.mkdirp(`${root}/installed/junk`);
    const m = makeManager({ ...ports() });
    m.load();
    expect(m.listInstalled()).toEqual([]);
    expect(disk.list(`${root}/installed`)).toEqual([]);
  });
});

describe('policy', () => {
  useRangeServer();

  it('[DECISION-15] large packs wait for Wi-Fi by default, then start on their own', async () => {
    const big: PackSpec = { id: 'speech-model.test', version: 1, body: bytesOf(CELLULAR_FREE_BYTES + 1), kind: 'speech-model', language: 'mul', required: false };
    serve(big);
    const network = new FakeNetwork('cellular');
    const m = makeManager({ manifest: async () => manifestOf([big]), network, chunkBytes: 2_000_000 });
    m.load();
    expect(await m.ensurePack('speech-model.test')).toEqual({ ok: false, reason: 'waiting_for_wifi' });
    expect(server!.log.length).toBe(0);
    expect(m.waiting()).toEqual(['speech-model.test']);
    const done = new Promise<void>((resolve) => m.onProgress((p) => p.phase === 'installed' && resolve()));
    network.set('wifi');
    await done;
    expect(m.packPath('speech-model.test')).not.toBeNull();
  });

  it('downloads small packs on mobile data, and large ones when the person allows it', async () => {
    const small: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(2000) };
    const big: PackSpec = { id: 'speech-model.test', version: 1, body: bytesOf(CELLULAR_FREE_BYTES + 1), kind: 'speech-model', language: 'mul', required: false };
    serve(small);
    serve(big);
    const m = makeManager({ manifest: async () => manifestOf([small, big]), network: new FakeNetwork('cellular'), chunkBytes: 3_000_000 });
    expect((await m.ensurePack('text-rules.pt')).ok).toBe(true);
    expect((await m.ensurePack('speech-model.test', { allowCellularOnce: true })).ok).toBe(true);
    m.setAllowCellular(true);
    expect(m.allowCellular()).toBe(true);
  });

  it('[F05-U29] an automatic retry (wifiOnly) never uses mobile data for a large pack, even with "Use mobile data" on', async () => {
    const small: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(2000) };
    const big: PackSpec = { id: 'speech-model.test', version: 1, body: bytesOf(CELLULAR_FREE_BYTES + 1), kind: 'speech-model', language: 'mul', required: false };
    serve(small);
    serve(big);
    const m = makeManager({ manifest: async () => manifestOf([small, big]), network: new FakeNetwork('cellular'), chunkBytes: 3_000_000 });
    m.setAllowCellular(true);
    expect(await m.ensurePack('speech-model.test', { wifiOnly: true, allowCellularOnce: true })).toEqual({ ok: false, reason: 'waiting_for_wifi' });
    expect(server!.log.length).toBe(0);
    expect((await m.ensurePack('text-rules.pt', { wifiOnly: true })).ok).toBe(true); // small packs are not mobile data worth asking about
    expect((await m.ensurePack('speech-model.test')).ok).toBe(true); // the person's own standing yes still works
  });

  it('stops when the remote kill switch pauses downloads, and when offline or out of space', async () => {
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(1000) };
    serve(pt);
    expect(await makeManager({ manifest: async () => manifestOf([pt]), downloadsPaused: () => true }).ensurePack('text-rules.pt')).toEqual({ ok: false, reason: 'downloads_paused' });
    expect(await makeManager({ manifest: async () => manifestOf([pt]), network: new FakeNetwork('none') }).ensurePack('text-rules.pt')).toEqual({ ok: false, reason: 'offline' });
    expect(await makeManager({ manifest: async () => manifestOf([pt]), fsImpl: new MemoryFs(disk, root, null, 1000) }).ensurePack('text-rules.pt')).toEqual({ ok: false, reason: 'no_space' });
    expect(server!.log.length).toBe(0);
  });
});

describe('languages and removal', () => {
  useRangeServer();

  it('[DECISION-15] choosing Portuguese downloads the Portuguese packs and nothing else', async () => {
    const specs: PackSpec[] = [
      { id: 'text-rules.pt', version: 1, body: bytesOf(1100) },
      { id: 'prompts.pt', version: 1, body: bytesOf(900), kind: 'prompts' },
      { id: 'text-rules.hi', version: 1, body: bytesOf(1000), language: 'hi' },
      { id: 'speech-model.small', version: 1, body: bytesOf(1000), kind: 'speech-model', language: 'mul', required: false },
    ];
    specs.forEach((s) => serve(s));
    const m = makeManager({ manifest: async () => manifestOf(specs) });
    const r = await m.ensureLanguage('pt');
    expect(Object.keys(r)).toEqual(['prompts.pt', 'text-rules.pt']);
    expect(m.listInstalled().map((p) => p.id)).toEqual(['prompts.pt', 'text-rules.pt']);
  });

  it('lets an engine add the packs it needs for a language', async () => {
    const specs: PackSpec[] = [
      { id: 'text-rules.pt', version: 1, body: bytesOf(1100) },
      { id: 'speech-model.small', version: 1, body: bytesOf(1000), kind: 'speech-model', language: 'mul', required: false },
    ];
    specs.forEach((s) => serve(s));
    const m = makeManager({ manifest: async () => manifestOf(specs) });
    const off = m.addLanguageResolver((lang) => (lang === 'pt' ? ['speech-model.small'] : []));
    expect(Object.keys(await m.ensureLanguage('pt'))).toEqual(['speech-model.small', 'text-rules.pt']);
    off();
  });

  it('removes an installed pack and any partial download', async () => {
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(1500) };
    serve(pt);
    const m = makeManager({ manifest: async () => manifestOf([pt]) });
    await m.ensurePack('text-rules.pt');
    disk.mkdirp(`${root}/staging/text-rules.pt@2`);
    disk.write(`${root}/staging/text-rules.pt@2/file.bin.part`, 'partial');
    const events: string[] = [];
    m.onProgress((p) => events.push(p.phase));
    expect(m.storageBytes()).toEqual({ installed: 1500, partial: 7 });
    await m.removePack('text-rules.pt');
    expect(m.packPath('text-rules.pt')).toBeNull();
    expect(m.listInstalled()).toEqual([]);
    expect(disk.has(`${root}/installed/text-rules.pt`)).toBe(false);
    expect(disk.list(`${root}/staging`)).toEqual([]);
    expect(events).toContain('removed');
  });
});

describe('on the real disk', () => {
  // The one test that writes to the machine's disk: it keeps the memory disk honest. The same update and the
  // same kill run on NodeFs with the socket Range server and on MemoryFs with MemoryHttp, and must make the
  // same file calls with the same results and leave the same files after each step.
  useTempRoot();
  useRangeServer();

  it('[ADR-0016] an update, a kill at remove #9 and the restart make the same file calls and leave the same files as on the memory disk', async () => {
    const v1: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(1500, 11) };
    const v2: PackSpec = { id: 'text-rules.pt', version: 2, body: bytesOf(2600, 22) };
    serve(v1);
    serve(v2);
    const run = async (ports: (crash: CrashPlan | null) => { fsImpl: PackFs; http: PackHttp }) => {
      const calls: string[] = [];
      const results: unknown[] = [];
      const trees: string[][] = [];
      const step = async (crash: CrashPlan | null, manifest: PackManifest, opts: { requireLatest?: boolean }) => {
        const { fsImpl, http } = ports(crash);
        // A fixed clock, so pack.json is the same bytes on both disks.
        const m = makeManager({ manifest: async () => manifest, fsImpl: recordCalls(fsImpl, calls), http, now: () => 0 });
        const r = await m.ensurePack('text-rules.pt', opts);
        m.dispose();
        results.push(JSON.parse(JSON.stringify(r).split(fsImpl.root).join('~')));
        trees.push(await treeOf(fsImpl));
      };
      await step(null, manifestOf([v1]), {});
      await step({ op: 'remove', nth: 9 }, manifestOf([v1, v2], 2), { requireLatest: true });
      await step(null, manifestOf([v1, v2], 2), { requireLatest: true });
      return { calls, results, trees };
    };
    const real = await run((crash) => ({ fsImpl: new NodeFs(root, crash), http: new LocalHttp(server!.base) }));
    const memory = await run((crash) => ({ fsImpl: new MemoryFs(disk, MEMORY_ROOT, crash), http: new MemoryHttp(files, disk) }));
    expect(real.results).toEqual([
      { ok: true, path: '~/installed/text-rules.pt/1/file.bin', version: 1 },
      { ok: false, reason: 'storage_error' },
      { ok: true, path: '~/installed/text-rules.pt/2/file.bin', version: 2 },
    ]);
    expect(real.calls).toContain('remove("~/staging/text-rules.pt@2/pack.json.tmp") threw CrashError: crash at remove #9');
    expect(memory).toEqual(real);
  });
});
