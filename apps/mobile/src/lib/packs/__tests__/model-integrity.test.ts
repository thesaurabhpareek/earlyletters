/// <reference types="node" />
/**
 * [FR-AIS-13] A model file is trusted only when its SHA-256 equals the signed
 * manifest's value and its size equals `bytes` (BL-1357 part A). The engine's
 * own tests cover the happy resume, a wrong hash and a forged signature; this
 * file adds the refusals they leave open: a partial file whose stored hash or
 * size differs from the manifest is never resumed, a declared size that is not
 * the file's size installs nothing, and a finished file left in staging with
 * the wrong bytes is deleted, not installed. Memory disk, local Range host.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parsePackManifest, type PackManifest } from '@scribe/api';
import { PackManager, type PackEnv } from '../engine';
import { MemoryDisk, MemoryFs } from './memory-ports';
import { bytesOf, FakeNetwork, LocalHttp, MemoryKv, sha256, startRangeServer } from './node-ports';

const CHUNK = 1000;
const ROOT = '/packs';
const ID = 'speech-model.fixture-small';
const PATH = `/${ID}/1/model.bin`;
const instantSleep = async () => {};

let server: Awaited<ReturnType<typeof startRangeServer>>;
let disk: MemoryDisk;
const body = bytesOf(5000);

beforeEach(async () => {
  disk = new MemoryDisk();
  server = await startRangeServer({ [PATH]: { body } });
});
afterEach(async () => {
  await server.close();
});

function manifestOf(over: { bytes?: number; sha256?: string } = {}): PackManifest {
  const r = parsePackManifest({
    schemaVersion: 1,
    version: 1,
    generatedAt: '2026-11-20T12:00:00.000Z',
    packs: [
      {
        id: ID,
        kind: 'speech-model',
        language: 'mul',
        version: 1,
        url: `https://packs.test${PATH}`,
        mirrors: [],
        bytes: over.bytes ?? body.length,
        sha256: over.sha256 ?? sha256(body),
        fileName: 'model.bin',
        minAppVersion: '1.0.0',
        required: false,
      },
    ],
  });
  if (!r.ok) throw new Error('bad manifest fixture');
  return r.value;
}

function manager(m: PackManifest) {
  const env: PackEnv = {
    fs: new MemoryFs(disk, ROOT),
    http: new LocalHttp(server.base, (dest, bytes) => disk.write(dest, bytes)),
    network: new FakeNetwork('wifi'),
    settings: new MemoryKv(),
    appVersion: '1.0.0',
    manifest: async () => m,
    downloadsPaused: () => false,
    sleep: instantSleep,
    random: () => 0,
    chunkBytes: CHUNK,
  };
  return new PackManager(env);
}

/** A half-downloaded file in staging, with the meta the engine wrote for it. */
function plantPartial(meta: { sha256: string; bytes: number }) {
  const stage = `${ROOT}/staging/${ID}@1`;
  disk.mkdirp(stage);
  disk.write(`${stage}/meta.json`, JSON.stringify({ ...meta, fileName: 'model.bin' }));
  disk.write(`${stage}/model.bin.part`, body.subarray(0, 3000));
}

describe('[FR-AIS-13] a model file is trusted only when hash and size match the signed manifest', () => {
  it('[FR-AIS-13] a partial file whose stored hash differs is not resumed: the download starts again from byte 0', async () => {
    plantPartial({ sha256: 'c'.repeat(64), bytes: body.length });
    const r = await manager(manifestOf()).ensurePack(ID);
    expect(r.ok).toBe(true);
    expect(server.log[0].range).toBe('bytes=0-999');
  });

  it('[FR-AIS-13] a partial file whose stored size differs is not resumed: the download starts again from byte 0', async () => {
    plantPartial({ sha256: sha256(body), bytes: body.length + 1 });
    const r = await manager(manifestOf()).ensurePack(ID);
    expect(r.ok).toBe(true);
    expect(server.log[0].range).toBe('bytes=0-999');
  });

  it('[FR-AIS-13] a declared size that is not the file size installs nothing', async () => {
    const r = await manager(manifestOf({ bytes: body.length - 1 })).ensurePack(ID);
    expect(r).toEqual({ ok: false, reason: 'hash_mismatch' });
    expect(disk.has(`${ROOT}/installed/${ID}`)).toBe(false);
    expect(disk.list(`${ROOT}/staging`)).toEqual([]);
  });

  it('[FR-AIS-13] a finished file left in staging with other bytes is deleted and never installed', async () => {
    const stage = `${ROOT}/staging/${ID}@1`;
    disk.mkdirp(stage);
    disk.write(`${stage}/meta.json`, JSON.stringify({ sha256: sha256(body), bytes: body.length, fileName: 'model.bin' }));
    disk.write(`${stage}/model.bin`, bytesOf(body.length, 9)); // right size, wrong bytes
    const m = manager(manifestOf());
    expect(await m.ensurePack(ID)).toEqual({ ok: false, reason: 'hash_mismatch' });
    expect(m.packPath(ID)).toBeNull();
    expect(disk.list(`${ROOT}/staging`)).toEqual([]);
    expect(disk.has(`${ROOT}/installed/${ID}`)).toBe(false);
  });
});
