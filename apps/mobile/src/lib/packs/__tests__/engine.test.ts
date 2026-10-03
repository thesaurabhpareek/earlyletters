/// <reference types="node" />
/**
 * Pack engine against a real file system and a real HTTP Range server
 * (ADR 0016). Run by `npm test -w @scribe/api` (vitest.consumers.config.ts).
 */
import * as fs from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateSigningKey, base64ToBytes, parsePackManifest, signDocument, type PackManifest } from '@scribe/api';
import { CELLULAR_FREE_BYTES, PackManager, type PackEnv, type PackProgress } from '../engine';
import { SignedDocumentClient } from '../../remote/documents';
import { bytesOf, CrashError, FakeNetwork, LocalHttp, MemoryKv, NodeFs, sha256, startRangeServer, tempRoot, type CrashPlan, type ServedFile } from './node-ports';

const CHUNK = 1000;
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

let server: Awaited<ReturnType<typeof startRangeServer>>;
let files: Record<string, ServedFile>;
let root: string;

beforeEach(async () => {
  files = {};
  server = await startRangeServer(files);
  root = tempRoot('engine');
});
afterEach(async () => {
  await server.close();
  fs.rmSync(root, { recursive: true, force: true });
});

function serve(spec: PackSpec, extra: Partial<ServedFile> = {}) {
  files[spec.path ?? `/${spec.id}/${spec.version}/file.bin`] = { body: spec.body, ...extra };
}

function makeManager(over: Partial<PackEnv> & { manifest?: () => Promise<PackManifest | null>; fsImpl?: NodeFs; network?: FakeNetwork } = {}) {
  const env: PackEnv = {
    fs: over.fsImpl ?? new NodeFs(root),
    http: new LocalHttp(server.base),
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

const read = (p: string) => new Uint8Array(fs.readFileSync(p));

describe('install', () => {
  it('[DECISION-15] downloads in Range chunks, verifies SHA-256 and installs atomically', async () => {
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(4500) };
    serve(pt);
    const m = makeManager({ manifest: async () => manifestOf([pt]) });
    const r = await m.ensurePack('text-rules.pt');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(sha256(read(r.path))).toBe(sha256(pt.body));
    expect(r.path).toBe(`${root}/installed/text-rules.pt/1/file.bin`);
    expect(m.packPath('text-rules.pt')).toBe(r.path);
    expect(server.log.map((l) => l.range)).toEqual(['bytes=0-999', 'bytes=1000-1999', 'bytes=2000-2999', 'bytes=3000-3999', 'bytes=4000-4499']);
    expect(fs.readdirSync(`${root}/staging`)).toEqual([]);
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
    expect(server.log.length).toBe(1);
  });

  it('shares one download between concurrent callers', async () => {
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(2500) };
    serve(pt);
    const m = makeManager({ manifest: async () => manifestOf([pt]) });
    const [a, b] = await Promise.all([m.ensurePack('text-rules.pt', { requireLatest: true }), m.ensurePack('text-rules.pt', { requireLatest: true })]);
    expect(a).toEqual(b);
    expect(server.log.length).toBe(3);
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
  it('[ADR-0016] continues from a partial file left by an earlier session', async () => {
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(5000) };
    serve(pt);
    const stage = `${root}/staging/text-rules.pt@1`;
    fs.mkdirSync(stage, { recursive: true });
    fs.writeFileSync(`${stage}/meta.json`, JSON.stringify({ sha256: sha256(pt.body), bytes: 5000, fileName: 'file.bin' }));
    fs.writeFileSync(`${stage}/file.bin.part`, pt.body.subarray(0, 3000));
    const r = await makeManager({ manifest: async () => manifestOf([pt]) }).ensurePack('text-rules.pt');
    expect(r.ok).toBe(true);
    expect(server.log.map((l) => l.range)).toEqual(['bytes=3000-3999', 'bytes=4000-4999']);
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
    const partSize = fs.statSync(`${root}/staging/text-rules.pt@1/file.bin.part`).size;
    expect(partSize % CHUNK).toBe(0);
    const before = server.log.length;
    const r = await m.ensurePack('text-rules.pt');
    expect(r.ok).toBe(true);
    expect(server.log.slice(before)[0].range).toBe(`bytes=${partSize}-${partSize + CHUNK - 1}`);
    const fetched = server.log.filter((l) => l.status === 206).length;
    expect(fetched).toBe(6);
  });

  it('retries a dropped connection and a 503, discarding the broken chunk', async () => {
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(3000) };
    serve(pt, { dropOnceAfter: 400, failFirst: 1 });
    const r = await makeManager({ manifest: async () => manifestOf([pt]) }).ensurePack('text-rules.pt');
    expect(r.ok).toBe(true);
    if (r.ok) expect(sha256(read(r.path))).toBe(sha256(pt.body));
  });
});

describe('integrity', () => {
  it('[ADR-0016] rejects a file whose SHA-256 does not match, and installs nothing', async () => {
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(2500) };
    serve(pt, { corrupt: true });
    const m = makeManager({ manifest: async () => manifestOf([pt]) });
    expect(await m.ensurePack('text-rules.pt')).toEqual({ ok: false, reason: 'hash_mismatch' });
    expect(m.packPath('text-rules.pt')).toBeNull();
    expect(fs.readdirSync(`${root}/staging`)).toEqual([]);
    expect(fs.existsSync(`${root}/installed/text-rules.pt`)).toBe(false);
  });

  it('falls back to a mirror when the primary host serves wrong bytes', async () => {
    const body = bytesOf(2500);
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body, path: '/primary/pt.bin', mirrors: ['https://mirror.test/mirror/pt.bin'] };
    files['/primary/pt.bin'] = { body, corrupt: true };
    files['/mirror/pt.bin'] = { body };
    const r = await makeManager({ manifest: async () => manifestOf([pt]) }).ensurePack('text-rules.pt');
    expect(r.ok).toBe(true);
    expect(server.log.some((l) => l.path === '/mirror/pt.bin')).toBe(true);
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
    expect(server.log.length).toBe(0);

    const genuine = signDocument('pack-manifest', payload, base64ToBytes(signer.secretKey)!, 'el-test');
    expect(client.accept(genuine, null)).toBe('updated');
    expect((await m.ensurePack('text-rules.pt')).ok).toBe(true);
  });
});

describe('atomic swap', () => {
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
    expect(sha256(read(m.packPath('text-rules.pt')!))).toBe(sha256(v2.body));
    expect(fs.readdirSync(`${root}/installed/text-rules.pt`)).toEqual(['2']);
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
  const plans: CrashPlan[] = [];
  for (const op of ['rename', 'writeText', 'remove', 'appendFile'] as const) for (let nth = 1; nth <= 12; nth++) plans.push({ op, nth });

  it.each(plans)('[ADR-0016] a kill at $op #$nth leaves the old version or the new one, never a broken file', async (plan) => {
    const v1: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(1500, 11) };
    const v2: PackSpec = { id: 'text-rules.pt', version: 2, body: bytesOf(2600, 22) };
    serve(v1);
    serve(v2);
    await makeManager({ manifest: async () => manifestOf([v1]) }).ensurePack('text-rules.pt');

    // The "crash": the file system throws once at the chosen step, and the process is gone (a fresh manager follows).
    const crashing = makeManager({ manifest: async () => manifestOf([v1, v2], 2), fsImpl: new NodeFs(root, plan) });
    let crashed = false;
    try {
      const r = await crashing.ensurePack('text-rules.pt', { requireLatest: true });
      crashed = !r.ok;
    } catch (e) {
      crashed = e instanceof CrashError;
    }
    crashing.dispose();

    const restarted = makeManager({ manifest: async () => manifestOf([v1, v2], 2) });
    restarted.load();
    const path = restarted.packPath('text-rules.pt');
    expect(path).not.toBeNull();
    const digest = sha256(read(path!));
    expect([sha256(v1.body), sha256(v2.body)]).toContain(digest);
    expect(restarted.listInstalled()).toHaveLength(1);
    if (!crashed) expect(digest).toBe(sha256(v2.body));

    // And the next attempt always ends on v2.
    const r = await restarted.ensurePack('text-rules.pt', { requireLatest: true });
    expect(r).toMatchObject({ ok: true, version: 2 });
    expect(sha256(read(restarted.packPath('text-rules.pt')!))).toBe(sha256(v2.body));
    expect(fs.readdirSync(`${root}/installed/text-rules.pt`)).toEqual(['2']);
  });

  it('cleans broken and orphaned version folders on load', () => {
    fs.mkdirSync(`${root}/installed/text-rules.pt/1`, { recursive: true });
    fs.writeFileSync(`${root}/installed/text-rules.pt/1/file.bin`, 'abc');
    fs.writeFileSync(`${root}/installed/text-rules.pt/1/pack.json`, JSON.stringify({ id: 'text-rules.pt', version: 1, fileName: 'file.bin', bytes: 999, sha256: 'x' }));
    fs.mkdirSync(`${root}/installed/junk`, { recursive: true });
    const m = makeManager();
    m.load();
    expect(m.listInstalled()).toEqual([]);
    expect(fs.readdirSync(`${root}/installed`)).toEqual([]);
  });
});

describe('policy', () => {
  it('[DECISION-15] large packs wait for Wi-Fi by default, then start on their own', async () => {
    const big: PackSpec = { id: 'speech-model.test', version: 1, body: bytesOf(CELLULAR_FREE_BYTES + 1), kind: 'speech-model', language: 'mul', required: false };
    serve(big);
    const network = new FakeNetwork('cellular');
    const m = makeManager({ manifest: async () => manifestOf([big]), network, chunkBytes: 2_000_000 });
    m.load();
    expect(await m.ensurePack('speech-model.test')).toEqual({ ok: false, reason: 'waiting_for_wifi' });
    expect(server.log.length).toBe(0);
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

  it('stops when the remote kill switch pauses downloads, and when offline or out of space', async () => {
    const pt: PackSpec = { id: 'text-rules.pt', version: 1, body: bytesOf(1000) };
    serve(pt);
    expect(await makeManager({ manifest: async () => manifestOf([pt]), downloadsPaused: () => true }).ensurePack('text-rules.pt')).toEqual({ ok: false, reason: 'downloads_paused' });
    expect(await makeManager({ manifest: async () => manifestOf([pt]), network: new FakeNetwork('none') }).ensurePack('text-rules.pt')).toEqual({ ok: false, reason: 'offline' });
    expect(await makeManager({ manifest: async () => manifestOf([pt]), fsImpl: new NodeFs(root, null, 1000) }).ensurePack('text-rules.pt')).toEqual({ ok: false, reason: 'no_space' });
    expect(server.log.length).toBe(0);
  });
});

describe('languages and removal', () => {
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
    fs.mkdirSync(`${root}/staging/text-rules.pt@2`, { recursive: true });
    fs.writeFileSync(`${root}/staging/text-rules.pt@2/file.bin.part`, 'partial');
    const events: string[] = [];
    m.onProgress((p) => events.push(p.phase));
    expect(m.storageBytes()).toEqual({ installed: 1500, partial: 7 });
    await m.removePack('text-rules.pt');
    expect(m.packPath('text-rules.pt')).toBeNull();
    expect(m.listInstalled()).toEqual([]);
    expect(fs.existsSync(`${root}/installed/text-rules.pt`)).toBe(false);
    expect(fs.readdirSync(`${root}/staging`)).toEqual([]);
    expect(events).toContain('removed');
  });
});
