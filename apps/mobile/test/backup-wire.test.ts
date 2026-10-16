/// <reference types="node" />
/**
 * The wire to the S05 server (lib/backup/wire.ts) against the server's own
 * names and shapes, PR #151 at 66d56a3:
 * - supabase/migrations/<ts>_backup_server.sql: the RPC signatures, the
 *   columns granted to `authenticated`, and the bytea and SealedBox formats;
 * - supabase/functions/escrow/contract.ts: the two routes, `{ device_id }`,
 *   RequestView, ReleaseResult, the envelope, and 410 gone.
 * A change on either side fails here first. Fictional family Asha only.
 */
import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { b64, bytesToBase64, equalBytes } from '../src/lib/backup/bytes';
import { BackupServerError, ESCROW_DETAILS, SEAL_SUITE, keyCheckLabel, objectPathFor, packEscrowWrap } from '../src/lib/backup/contract';
import { createKeyManager, type MetaStore } from '../src/lib/backup/keys';
import {
  BLOB_COLUMNS,
  CHILD_KEY_COLUMNS,
  ESCROW_ROUTES,
  beginArgs,
  blobRow,
  childKeyRow,
  confirmArgs,
  createEscrowClient,
  fromBytea,
  registerDeviceArgs,
  storeKeyArgs,
  type FetchLike,
} from '../src/lib/backup/wire';
import { FakeBackend, nodeVault } from './helpers/backup-node';

const MAMA = '11111111-1111-4111-8111-111111111111';
const PAPA = '22222222-2222-4222-8222-222222222222';
const ASHA = 'a5a5a5a5-0000-4000-8000-000000000001';
const LETTER = '01928c3e-5a2b-7c3d-8e4f-000000000001';
const DEVICE = '072bd92d-7bff-4422-821c-e5088548ebde';
const REQUEST = '00704c32-9aec-42d4-9f6f-6bc7ec1ed27e';
const rnd = (n: number) => new Uint8Array(randomBytes(n));

// The server's signatures and grants (#151), in argument order.
const SQL = {
  registerDevice: ['p_device_id', 'p_public_key'],
  storeKey: ['p_child', 'p_key_version', 'p_escrow_key_version', 'p_wrap', 'p_key_check'],
  begin: ['p_entry', 'p_child', 'p_bytes', 'p_key_version', 'p_wrapped_file_key', 'p_format_version'],
  confirm: ['p_entry', 'p_cipher_sha256'],
  childKeysGranted: ['child_id', 'profile_id', 'key_version', 'escrow_key_version', 'key_check', 'created_at', 'rewrapped_at'],
  audioBlobs: ['entry_id', 'child_id', 'author_id', 'object_path', 'key_version', 'wrapped_file_key', 'cipher_sha256', 'bytes', 'format_version', 'state', 'created_at', 'updated_at', 'confirmed_at'],
};
const cols = (s: string) => s.split(',').map((c) => c.trim());
const isBytea = (s: unknown) => typeof s === 'string' && /^\\x([0-9a-f]{2})*$/.test(s);

describe('main project RPCs: the argument names and formats #151 declares', () => {
  it('backup_register_device(p_device_id, p_public_key bytea 32)', () => {
    const pk = rnd(32);
    const args = registerDeviceArgs({ deviceId: DEVICE, publicKey: bytesToBase64(pk) });
    expect(Object.keys(args)).toEqual(SQL.registerDevice);
    expect(isBytea(args.p_public_key)).toBe(true);
    expect(equalBytes(fromBytea(args.p_public_key as string), pk)).toBe(true);
    expect(() => registerDeviceArgs({ deviceId: DEVICE, publicKey: bytesToBase64(rnd(31)) })).toThrow(BackupServerError);
    expect(() => registerDeviceArgs({ deviceId: 'not-a-uuid', publicKey: bytesToBase64(pk) })).toThrow(BackupServerError);
  });

  it('backup_store_key takes a SealedBox (suite, enc 32, ct 48) and a 16-byte key check', () => {
    const enc = rnd(32);
    const ct = rnd(48);
    const check = rnd(16);
    const args = storeKeyArgs({ childId: ASHA, keyVersion: 1, escrowKeyVersion: 1, keyCheck: bytesToBase64(check), enc: bytesToBase64(enc), ct: bytesToBase64(ct) });
    expect(Object.keys(args)).toEqual(SQL.storeKey);
    const wrap = args.p_wrap as Record<string, string>;
    // The server refuses any other key in the object, and any other suite.
    expect(Object.keys(wrap).sort()).toEqual(['ct', 'enc', 'suite']);
    expect(wrap.suite).toBe('hpke-x25519-sha256-aes256gcm');
    expect(wrap.suite).toBe(SEAL_SUITE);
    // What the server stores, 0x01 || enc || ct, is the 81-byte format 1 the escrow function opens.
    expect(packEscrowWrap(b64(wrap.enc), b64(wrap.ct))).toHaveLength(81);
    expect(equalBytes(fromBytea(args.p_key_check as string), check)).toBe(true);
    const bad = { childId: ASHA, keyVersion: 1, escrowKeyVersion: 1, keyCheck: bytesToBase64(check), enc: bytesToBase64(enc), ct: bytesToBase64(ct) };
    expect(() => storeKeyArgs({ ...bad, ct: bytesToBase64(rnd(47)) })).toThrow(BackupServerError);
    expect(() => storeKeyArgs({ ...bad, keyCheck: bytesToBase64(rnd(32)) })).toThrow(BackupServerError);
  });

  it('backup_begin and backup_confirm: names in order, hashes and keys as bytea', () => {
    const wrapped = rnd(60);
    const b = beginArgs({ entryId: LETTER, childId: ASHA, bytes: 1234, keyVersion: 1, wrappedFileKey: bytesToBase64(wrapped) });
    expect(Object.keys(b)).toEqual(SQL.begin);
    expect(b.p_format_version).toBe(1);
    expect(equalBytes(fromBytea(b.p_wrapped_file_key as string), wrapped)).toBe(true);
    const sha = 'ab'.repeat(32);
    const c = confirmArgs(LETTER, sha);
    expect(Object.keys(c)).toEqual(SQL.confirm);
    expect(c.p_cipher_sha256).toBe(`\\x${sha}`);
    expect(() => confirmArgs(LETTER, 'ab'.repeat(31))).toThrow(BackupServerError);
  });
});

describe('table reads: only granted columns, only my rows', () => {
  it('child_keys reads granted columns only (never escrow_wrap) and its key check', () => {
    for (const c of cols(CHILD_KEY_COLUMNS)) expect(SQL.childKeysGranted).toContain(c);
    expect(cols(CHILD_KEY_COLUMNS)).not.toContain('escrow_wrap');
    const check = rnd(16);
    expect(childKeyRow({ child_id: ASHA, key_version: 1, escrow_key_version: 2, key_check: `\\x${Buffer.from(check).toString('hex')}` })).toEqual({
      childId: ASHA,
      keyVersion: 1,
      escrowKeyVersion: 2,
      keyCheck: bytesToBase64(check),
    });
    expect(childKeyRow({ child_id: ASHA, key_version: 1, escrow_key_version: 1, key_check: null }).keyCheck).toBeNull();
    expect(() => childKeyRow({ child_id: ASHA, key_version: 1, escrow_key_version: 1, key_check: '\\x00ff' })).toThrow(BackupServerError);
    expect(() => childKeyRow({ child_id: ASHA, key_version: 1, escrow_key_version: 1, key_check: 'AAAA' })).toThrow(BackupServerError);
  });

  it('audio_blobs: columns exist; a row of another author, or at another path, is dropped', () => {
    for (const c of cols(BLOB_COLUMNS)) expect(SQL.audioBlobs).toContain(c);
    expect(cols(BLOB_COLUMNS)).not.toContain('wrapped_file_key'); // restore reads the key block from the object
    const sha = 'cd'.repeat(32);
    const mine = { entry_id: LETTER, child_id: ASHA, author_id: MAMA, object_path: objectPathFor(ASHA, MAMA, LETTER), key_version: 1, cipher_sha256: `\\x${sha}`, bytes: '2048' };
    expect(blobRow(mine, MAMA)).toEqual({ entryId: LETTER, childId: ASHA, objectPath: mine.object_path, keyVersion: 1, cipherSha256: sha, bytes: 2048 });
    expect(blobRow({ ...mine, author_id: PAPA, object_path: objectPathFor(ASHA, PAPA, LETTER) }, MAMA)).toBeNull();
    expect(blobRow({ ...mine, object_path: objectPathFor(ASHA, PAPA, LETTER) }, MAMA)).toBeNull();
  });
});

// ── Escrow function ─────────────────────────────────────────────────────

interface Call {
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

function fakeEscrow(answer: (url: string) => { status: number; body: unknown }) {
  const calls: Call[] = [];
  const fetch: FetchLike = async (url, init) => {
    calls.push({ url, headers: init.headers, body: JSON.parse(init.body) });
    const a = answer(url);
    return { ok: a.status < 400, status: a.status, json: async () => a.body };
  };
  let n = 0;
  const client = createEscrowClient({
    baseUrl: 'https://escrow.example.test/',
    accessToken: async () => 'jwt-for-mama',
    fetch,
    idempotency: { header: 'Idempotency-Key', newId: () => `id-${++n}` },
  });
  return { client, calls };
}

const ok = (data: unknown) => ({ status: 200, body: { ok: true, data, requestId: 'x' } });
const refuse = (status: number, code: string, detail?: string, retryable = false) => ({ status, body: { ok: false, error: { code, retryable, detail }, requestId: 'x' } });

describe('escrow function: two routes, { device_id }, snake_case answers (#151 contract.ts)', () => {
  it('create posts device_id with the main-project token and an idempotency key', async () => {
    const { client, calls } = fakeEscrow(() => ok({ request_id: REQUEST, state: 'requested', hold_until: '2026-10-18T10:00:00Z', is_this_device: true }));
    expect(await client.request(DEVICE)).toEqual({ requestId: REQUEST, state: 'requested', holdUntil: '2026-10-18T10:00:00Z' });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`https://escrow.example.test${ESCROW_ROUTES.create}`);
    expect(calls[0].url.endsWith('/functions/v1/escrow/v1/restore-requests')).toBe(true);
    expect(calls[0].body).toEqual({ device_id: DEVICE });
    expect(calls[0].headers.Authorization).toBe('Bearer jwt-for-mama');
    expect(calls[0].headers['Idempotency-Key']).toBe('id-1');
  });

  it('release polls the request by id; held answers keep the hold', async () => {
    const { client, calls } = fakeEscrow(() => ok({ state: 'approved', request_id: REQUEST, hold_until: '2026-10-18T10:00:00Z' }));
    expect(await client.release(REQUEST, DEVICE)).toEqual({ state: 'approved', holdUntil: '2026-10-18T10:00:00Z', requestId: REQUEST });
    expect(calls[0].url).toBe(`https://escrow.example.test/functions/v1/escrow/v1/restore-requests/${REQUEST}/release`);
    expect(calls[0].body).toEqual({ device_id: DEVICE });
  });

  it('a closed request (410 gone, cancelled or expired) is a closed outcome, not an error', async () => {
    for (const detail of ['cancelled', 'expired'] as const) {
      const { client } = fakeEscrow(() => refuse(410, 'gone', detail));
      expect(await client.release(REQUEST, DEVICE)).toEqual({ state: detail });
    }
  });

  it('refusals keep the code and the closed detail; the ones restore stops on are the server\'s words', async () => {
    const cases: [number, string, string | undefined, boolean][] = [
      [401, 'reauth_required', 'step_up_required', false],
      [401, 'unauthorized', undefined, false],
      [403, 'deleted', 'deletion_pending', false],
      [404, 'not_found', 'device_unknown', false],
      [429, 'rate_limited', 'limit_restores', true],
      [503, 'paused', 'escrow', true],
    ];
    for (const [status, code, detail, retryable] of cases) {
      const { client } = fakeEscrow(() => refuse(status, code, detail, retryable));
      const e = await client.request(DEVICE).catch((x: unknown) => x);
      expect(e).toBeInstanceOf(BackupServerError);
      expect(e).toMatchObject({ code, detail: detail ?? null, retryable });
    }
    // Every detail restore stops on, or asks to sign in again for, is one the escrow function sends.
    const SERVER_DETAILS = ['step_up_required', 'device_unknown', 'cancelled', 'expired', 'deletion_pending', 'limit_restores', 'limit_keys', 'escrow'];
    for (const d of ESCROW_DETAILS.stopped) expect(SERVER_DETAILS).toContain(d);
    expect(SERVER_DETAILS).toContain('step_up_required');
    // 401 unauthorized (a refused token, or #151's SCSES session_ended) asks to sign in again.
    expect(ESCROW_DETAILS.signInAgain).toContain('unauthorized');
  });

  it('a release for another request id, or with another suite or size, is refused', async () => {
    const other = '00704c32-9aec-42d4-9f6f-000000000000';
    const sealed = { suite: SEAL_SUITE, enc: bytesToBase64(rnd(32)), ct: bytesToBase64(rnd(48)) };
    const answer = (request_id: string, s: object) => ok({ state: 'released', request_id, keys: [{ child_id: ASHA, key_version: 1, sealed: s }] });
    await expect(fakeEscrow(() => answer(other, sealed)).client.release(REQUEST, DEVICE)).rejects.toMatchObject({ code: 'bad_response' });
    await expect(fakeEscrow(() => answer(REQUEST, { ...sealed, suite: 'hpke-x25519-sha256-aes128gcm' })).client.release(REQUEST, DEVICE)).rejects.toMatchObject({ code: 'bad_response' });
    await expect(fakeEscrow(() => answer(REQUEST, { ...sealed, ct: bytesToBase64(rnd(64)) })).client.release(REQUEST, DEVICE)).rejects.toMatchObject({ code: 'bad_response' });
  });

  it('no https URL, no token or no network: unavailable, unauthorized, or a retry', async () => {
    const base = { accessToken: async () => 'jwt', fetch: (async () => ({ ok: true, status: 200, json: async () => ({}) })) as FetchLike, idempotency: { header: 'k', newId: () => '1' } };
    await expect(createEscrowClient({ ...base, baseUrl: '' }).request(DEVICE)).rejects.toMatchObject({ code: 'unavailable' });
    await expect(createEscrowClient({ ...base, baseUrl: 'http://escrow.example.test' }).request(DEVICE)).rejects.toMatchObject({ code: 'unavailable' });
    await expect(createEscrowClient({ ...base, baseUrl: 'https://e.test', accessToken: async () => null }).request(DEVICE)).rejects.toMatchObject({ code: 'unauthorized' });
    const down: FetchLike = async () => {
      throw new Error('offline');
    };
    await expect(createEscrowClient({ ...base, baseUrl: 'https://e.test', fetch: down }).request(DEVICE)).rejects.toMatchObject({ code: 'network', retryable: true });
  });
});

describe('end to end through the wire: an escrow release opens on this phone and passes its key check', () => {
  it('keys released by the escrow function, carried in #151 shapes, are stored and usable', async () => {
    const b = new FakeBackend(() => 0);
    b.consent.set(MAMA, 'accept');
    const meta = new Map<string, string>();
    const store: MetaStore = { getMeta: (k) => meta.get(k) ?? null, setMeta: (k, v) => void meta.set(k, v), deleteMeta: (k) => void meta.delete(k) };
    const mk = () =>
      createKeyManager({ vault: nodeVault({ icloud: null }), server: b.serverFor(MAMA), meta: store, clock: { now: () => 0, sleep: async () => {} }, profileId: MAMA, escrowKeys: () => b.escrowKeys() });
    const first = nodeVault({ icloud: null });
    await createKeyManager({ vault: first, server: b.serverFor(MAMA), meta: store, clock: { now: () => 0, sleep: async () => {} }, profileId: MAMA, escrowKeys: () => b.escrowKeys() }).keyFor(ASHA, { create: true });
    meta.clear();
    const phone = mk();
    const device = await phone.ensureDevice();
    const req = await b.escrowFor(MAMA).request(device.deviceId);
    b.restores.get(req.requestId)!.state = 'approved';
    const out = await b.escrowFor(MAMA).release(req.requestId, device.deviceId);
    if (out.state !== 'released') throw new Error('expected a release');
    // The same keys as the escrow function puts them on the wire.
    const wireBody = { state: 'released', request_id: req.requestId, keys: out.keys.map((k) => ({ child_id: k.childId, key_version: k.keyVersion, sealed: { suite: SEAL_SUITE, enc: k.enc, ct: k.ct } })) };
    const { client } = fakeEscrow(() => ok(wireBody));
    const released = await client.release(req.requestId, device.deviceId);
    if (released.state !== 'released') throw new Error('expected a release');
    expect(await phone.storeReleased(released.keys, device.deviceId, released.requestId ?? req.requestId)).toBe(1);
    expect(await phone.canOpen(ASHA, 1)).toBe(true);
    const label = keyCheckLabel(MAMA, ASHA, 1);
    expect(bytesToBase64(await first.bookKeyCheck({ profileId: MAMA, childId: ASHA }, 1, label))).toBe(b.childKeys[0].keyCheck);
  });
});
