/// <reference types="node" />
/**
 * Keys on the phone (lib/backup/keys.ts; WP-F08-B2; F08 6.5 key model).
 * The Node vault does with node:crypto what ScribeKeys does with CryptoKit;
 * its HPKE is first checked against RFC 9180's own test vector, so the
 * escrow seal tested here is the standard one CryptoKit and Deno implement.
 * Fictional family Asha: Mama and Papa are her parents.
 */
import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { bytesToBase64, equalBytes } from '../src/lib/backup/bytes';
import { BackupServerError, escrowAad, escrowInfo, keyCheckLabel, packEscrowWrap, releaseAad, releaseInfo, unpackEscrowWrap, type BackupServer } from '../src/lib/backup/contract';
import { wrapAad } from '../src/lib/backup/format';
import { ICLOUD_WAIT_MS, createKeyManager, type MetaStore } from '../src/lib/backup/keys';
import { FakeBackend, FakeICloud, hpkeOpen, hpkeSeal, nodeVault, x25519PublicOf } from './helpers/backup-node';

const MAMA = '11111111-1111-4111-8111-111111111111';
const PAPA = '22222222-2222-4222-8222-222222222222';
const ASHA = 'a5a5a5a5-0000-4000-8000-000000000001';
const LETTER = '01928c3e-5a2b-7c3d-8e4f-000000000001';
const H = (h: string) => new Uint8Array(Buffer.from(h, 'hex'));

function memMeta(): MetaStore & { m: Map<string, string> } {
  const m = new Map<string, string>();
  return { m, getMeta: (k) => m.get(k) ?? null, setMeta: (k, v) => void m.set(k, v), deleteMeta: (k) => void m.delete(k) };
}

function phone(backend: FakeBackend, uid: string, icloud: FakeICloud | null, clock = { t: 1_000_000 }, server?: BackupServer) {
  backend.consent.set(uid, 'accept');
  const vault = nodeVault({ icloud });
  const keys = createKeyManager({
    vault,
    server: server ?? backend.serverFor(uid),
    meta: memMeta(),
    clock: { now: () => clock.t, sleep: async () => {} },
    profileId: uid,
    escrowKeys: () => backend.escrowKeys(),
  });
  return { vault, keys, clock };
}

describe('HPKE base mode is RFC 9180 (the escrow seal CryptoKit and the escrow function use)', () => {
  it('reproduces test vector A.1.1 (DHKEM X25519, HKDF-SHA256, AES-128-GCM)', () => {
    const skE = H('52c4a758a802cd8b936eceea314432798d5baf2d7e9235dc084ab1b9cfa2f736');
    const skR = H('4612c550263fc8ad58375df3f557aac531d26850903e55a9f23f21d8534e8ac8');
    const info = H('4f6465206f6e2061204772656369616e2055726e');
    const s = hpkeSeal(x25519PublicOf(skR), info, Buffer.from('Count-0'), Buffer.from('Beauty is truth, truth beauty'), 'aes-128-gcm', skE);
    expect(Buffer.from(s.enc).toString('hex')).toBe('37fda3567bdbd628e88668c3c8d7e97d1d1253b6d4ea6d44c150f741f1bf4431');
    expect(Buffer.from(s.sharedSecret).toString('hex')).toBe('fe0e18c9f024ce43799ae393c7e8fe8fce9d218875e8227b0187c04e7d2ea1fc');
    expect(Buffer.from(s.ct).toString('hex')).toBe('f938558b5d72f1a23810b4be2ab4f84331acc02fc97babc53a52ae8218a355a96d8770ac83d07bea87e13c512a');
    expect(Buffer.from(hpkeOpen(skR, s, info, Buffer.from('Count-0'), 'aes-128-gcm')).toString()).toBe('Beauty is truth, truth beauty');
  });

  it('with AES-256-GCM, opens only with the same info and associated data', () => {
    const sk = new Uint8Array(randomBytes(32));
    const recipient = x25519PublicOf(sk);
    const aad = escrowAad(MAMA, ASHA, 1, 1);
    const s = hpkeSeal(recipient, escrowInfo(), aad, new Uint8Array(32).fill(7));
    expect(hpkeOpen(sk, s, escrowInfo(), aad)).toEqual(new Uint8Array(32).fill(7));
    expect(() => hpkeOpen(sk, s, new Uint8Array([1, 2, 3]), aad)).toThrow();
    expect(() => hpkeOpen(sk, s, escrowInfo(), escrowAad(PAPA, ASHA, 1, 1))).toThrow();
    expect(() => hpkeOpen(sk, s, escrowInfo(), escrowAad(MAMA, ASHA, 1, 2))).toThrow();
  });
});

describe('the bytes the escrow function opens (pinned: change them only with the escrow function)', () => {
  // The S05 server draft's supabase/functions/escrow/hpke.ts (INFO, aad, packV1), read on 15 Oct 2026; a scratch
  // run sealed with each side and opened with the other. A change here is a change to the escrow function too.
  const DEVICE = '072bd92d-7bff-4422-821c-e5088548ebde';
  const REQUEST = '00704c32-9aec-42d4-9f6f-6bc7ec1ed27e';
  it('info and associated data: the codename, lowercase ids joined with |', () => {
    expect(Buffer.from(escrowInfo()).toString()).toBe('scribe/escrow/book-key/v1');
    expect(Buffer.from(releaseInfo()).toString()).toBe('scribe/escrow/release/v1');
    expect(Buffer.from(escrowAad(MAMA, ASHA.toUpperCase(), 1, 2)).toString()).toBe(`${MAMA}|${ASHA}|1|2`);
    expect(Buffer.from(releaseAad(MAMA, DEVICE, REQUEST, ASHA, 3)).toString()).toBe(`${MAMA}|${DEVICE}|${REQUEST}|${ASHA}|3`);
  });

  it('escrow wrap format 1 is 0x01, enc (32), ciphertext and tag (48): 81 bytes', () => {
    const enc = new Uint8Array(32).fill(1);
    const ct = new Uint8Array(48).fill(2);
    const w = packEscrowWrap(enc, ct);
    expect(w).toHaveLength(81);
    expect(w[0]).toBe(1);
    expect(unpackEscrowWrap(w)).toEqual({ enc, ct });
    expect(() => unpackEscrowWrap(new Uint8Array([2, ...enc, ...ct]))).toThrow();
  });
});

describe('[F08-REQ-021] one book key per (child, author); the escrow wrap is the same key', () => {
  it('the first backup makes version 1, seals it on the phone and stores it with a key check', async () => {
    const b = new FakeBackend(() => 0);
    const p = phone(b, MAMA, null);
    expect(await p.keys.keyFor(ASHA, { create: true })).toEqual({ kind: 'ready', version: 1 });
    expect(b.childKeys).toHaveLength(1);
    const row = b.childKeys[0];
    expect(row).toMatchObject({ uid: MAMA, childId: ASHA, keyVersion: 1, escrowKeyVersion: 1 });
    // What the server got opens only with the escrow private key, and it is this phone's key.
    const bk = hpkeOpen(b.escrow.sk, { enc: Buffer.from(row.enc, 'base64'), ct: Buffer.from(row.ct, 'base64') }, escrowInfo(), escrowAad(MAMA, ASHA, 1, 1));
    expect(bk).toHaveLength(32);
    const ref = { profileId: MAMA, childId: ASHA };
    expect(bytesToBase64(await p.vault.bookKeyCheck(ref, 1, keyCheckLabel(MAMA, ASHA, 1)))).toBe(row.keyCheck);
    // No request ever carried the plaintext book key.
    for (const r of b.requests) expect(r.body.includes(Buffer.from(bk)), r.kind).toBe(false);
    // A second call reuses it.
    expect(await p.keys.keyFor(ASHA, { create: true })).toEqual({ kind: 'ready', version: 1 });
    expect(b.childKeys).toHaveLength(1);
  });

  it('two parents of one book each have their own key; neither opens the other parent\'s file keys', async () => {
    const b = new FakeBackend(() => 0);
    const mama = phone(b, MAMA, null);
    const papa = phone(b, PAPA, null);
    await mama.keys.keyFor(ASHA, { create: true });
    await papa.keys.keyFor(ASHA, { create: true });
    expect(b.childKeys.map((k) => k.uid).sort()).toEqual([MAMA, PAPA].sort());
    const fileKey = new Uint8Array(randomBytes(32));
    const wrapped = await mama.vault.wrapFileKey({ profileId: MAMA, childId: ASHA }, 1, fileKey, wrapAad(LETTER, MAMA, 1));
    // Papa's phone has no item under Mama's account, and his own key does not open hers.
    await expect(papa.vault.unwrapFileKey({ profileId: MAMA, childId: ASHA }, 1, wrapped, wrapAad(LETTER, MAMA, 1))).rejects.toThrow();
    await expect(papa.vault.unwrapFileKey({ profileId: PAPA, childId: ASHA }, 1, wrapped, wrapAad(LETTER, MAMA, 1))).rejects.toThrow();
    await expect(b.serverFor(PAPA).listKeys()).resolves.toHaveLength(1);
  });
});

describe('[F08-REQ-028] never create a book key while the server holds one', () => {
  it('a new phone without iCloud Keychain waits 2 minutes, then asks escrow, and makes nothing', async () => {
    const b = new FakeBackend(() => 0);
    const a = phone(b, MAMA, null);
    await a.keys.keyFor(ASHA, { create: true });
    const clock = { t: 5_000_000 };
    const c = phone(b, MAMA, null, clock);
    const first = await c.keys.keyFor(ASHA, { create: true });
    expect(first).toEqual({ kind: 'waiting', until: 5_000_000 + ICLOUD_WAIT_MS });
    clock.t += ICLOUD_WAIT_MS - 1;
    expect((await c.keys.keyFor(ASHA, { create: true })).kind).toBe('waiting');
    clock.t += 1;
    expect(await c.keys.keyFor(ASHA, { create: true })).toEqual({ kind: 'needs_escrow' });
    expect(await c.vault.bookKeyVersions({ profileId: MAMA, childId: ASHA })).toEqual([]);
    expect(b.childKeys).toHaveLength(1);
  });

  it('a new phone with iCloud Keychain on the same Apple Account has the key at once', async () => {
    const b = new FakeBackend(() => 0);
    const icloud = new FakeICloud();
    await phone(b, MAMA, icloud).keys.keyFor(ASHA, { create: true });
    const second = phone(b, MAMA, icloud);
    expect(await second.keys.keyFor(ASHA, { create: true })).toEqual({ kind: 'ready', version: 1 });
    expect(await second.keys.canOpen(ASHA, 1)).toBe(true);
  });

  it('a Keychain item replaced by a different key (a sync conflict) fails the key check and is never used', async () => {
    const b = new FakeBackend(() => 0);
    const icloud = new FakeICloud();
    const p = phone(b, MAMA, icloud);
    await p.keys.keyFor(ASHA, { create: true });
    icloud.items.get(`${MAMA}:${ASHA}`)!.set(1, new Uint8Array(randomBytes(32)));
    p.keys.refresh();
    expect((await p.keys.keyFor(ASHA, { create: true })).kind).toBe('waiting');
    expect(await p.keys.canOpen(ASHA, 1)).toBe(false);
  });

  it('a key made on this phone whose store failed is stored again, never replaced by a second one', async () => {
    const b = new FakeBackend(() => 0);
    const p = phone(b, MAMA, null);
    b.faults.set('storeKey', 1);
    await expect(p.keys.keyFor(ASHA, { create: true })).rejects.toBeInstanceOf(BackupServerError);
    expect(await p.vault.bookKeyVersions({ profileId: MAMA, childId: ASHA })).toEqual([1]);
    expect(await p.keys.keyFor(ASHA, { create: true })).toEqual({ kind: 'ready', version: 1 });
    expect(b.childKeys).toHaveLength(1);
    expect(b.childKeys[0].keyCheck).toBe(bytesToBase64(await p.vault.bookKeyCheck({ profileId: MAMA, childId: ASHA }, 1, keyCheckLabel(MAMA, ASHA, 1))));
  });

  it('two of my phones racing to make version 1: the second is refused and does not use its own key', async () => {
    const b = new FakeBackend(() => 0);
    const one = phone(b, MAMA, null);
    const two = phone(b, MAMA, null);
    await two.keys.serverRows(); // two read "no key" before one stored it
    await one.keys.keyFor(ASHA, { create: true });
    const r = await two.keys.keyFor(ASHA, { create: true });
    expect(r.kind).toBe('waiting');
    expect(b.childKeys).toHaveLength(1);
  });

  it('without CryptoKit support or an escrow key, backup is unavailable and nothing is made', async () => {
    const b = new FakeBackend(() => 0);
    const noEscrow = createKeyManager({
      vault: nodeVault({ icloud: null }),
      server: b.serverFor(MAMA),
      meta: memMeta(),
      clock: { now: () => 0, sleep: async () => {} },
      profileId: MAMA,
      escrowKeys: () => [],
    });
    expect(await noEscrow.keyFor(ASHA, { create: true })).toEqual({ kind: 'unavailable', reason: 'no_escrow_key' });
    const old = createKeyManager({
      vault: nodeVault({ icloud: null, supported: false }),
      server: b.serverFor(MAMA),
      meta: memMeta(),
      clock: { now: () => 0, sleep: async () => {} },
      profileId: MAMA,
      escrowKeys: () => b.escrowKeys(),
    });
    expect(await old.keyFor(ASHA, { create: true })).toEqual({ kind: 'unavailable', reason: 'unsupported' });
    expect(b.childKeys).toHaveLength(0);
  });
});

describe('keys after review: no server key check (production today), releases, version pin', () => {
  it('with no key check from the server, a phone that made a key and lost the race to store it never uses it', async () => {
    const b = new FakeBackend(() => 0);
    expect(b.serverKeyChecks).toBe(false);
    const one = phone(b, MAMA, null);
    const two = phone(b, MAMA, null);
    await two.keys.serverRows();
    await one.keys.keyFor(ASHA, { create: true });
    expect((await two.keys.keyFor(ASHA, { create: true })).kind).toBe('waiting');
    // On every later call too: a key made here that the server never confirmed is never trusted.
    expect((await two.keys.keyFor(ASHA, { create: true })).kind).toBe('waiting');
    expect(await two.keys.canOpen(ASHA, 1)).toBe(false);
    // Escrow brings the escrowed key, and it replaces the unconfirmed one.
    const device = await two.keys.ensureDevice();
    const req = await b.escrowFor(MAMA).request(device.deviceId);
    b.restores.get(req.requestId)!.state = 'approved';
    const released = await b.escrowFor(MAMA).release(req.requestId, device.deviceId);
    if (released.state !== 'released') throw new Error('expected a release');
    expect(await two.keys.storeReleased(released.keys, device.deviceId, req.requestId)).toBe(1);
    expect(await two.keys.keyFor(ASHA, { create: true })).toEqual({ kind: 'ready', version: 1 });
    const ref = { profileId: MAMA, childId: ASHA };
    expect(Buffer.from(await two.vault.bookKeyCheck(ref, 1, keyCheckLabel(MAMA, ASHA, 1))).equals(Buffer.from(await one.vault.bookKeyCheck(ref, 1, keyCheckLabel(MAMA, ASHA, 1))))).toBe(true);
  });

  it('the device that stored the key remembers its check, so a Keychain item replaced later is caught without the server', async () => {
    const b = new FakeBackend(() => 0);
    const icloud = new FakeICloud();
    const p = phone(b, MAMA, icloud);
    await p.keys.keyFor(ASHA, { create: true });
    icloud.items.get(`${MAMA}:${ASHA}`)!.set(1, new Uint8Array(randomBytes(32)));
    p.keys.refresh();
    expect((await p.keys.keyFor(ASHA, { create: true })).kind).toBe('waiting');
  });

  it('a release never overwrites a good key that is already here, and a release that fails its check writes nothing', async () => {
    const b = new FakeBackend(() => 0);
    const icloud = new FakeICloud();
    const a = phone(b, MAMA, icloud);
    await a.keys.keyFor(ASHA, { create: true });
    const good = new Uint8Array(icloud.items.get(`${MAMA}:${ASHA}`)!.get(1)!);
    const device = await a.keys.ensureDevice();
    const req = await b.escrowFor(MAMA).request(device.deviceId);
    b.restores.get(req.requestId)!.state = 'approved';
    // A wrong release: the server's wrap was swapped for another key (a bug, or tampering).
    b.childKeys[0] = { ...b.childKeys[0], ...(() => {
      const s = hpkeSeal(b.escrow.pk, escrowInfo(), escrowAad(MAMA, ASHA, 1, 1), new Uint8Array(randomBytes(32)));
      return { enc: Buffer.from(s.enc).toString('base64'), ct: Buffer.from(s.ct).toString('base64') };
    })() };
    const released = await b.escrowFor(MAMA).release(req.requestId, device.deviceId);
    if (released.state !== 'released') throw new Error('expected a release');
    expect(await a.keys.storeReleased(released.keys, device.deviceId, req.requestId)).toBe(1); // skipped: the good key passes its check
    expect(Buffer.from(icloud.items.get(`${MAMA}:${ASHA}`)!.get(1)!).equals(Buffer.from(good))).toBe(true);
    // A phone whose item was replaced by a conflict, receiving that wrong release: the check refuses it.
    icloud.items.get(`${MAMA}:${ASHA}`)!.set(1, new Uint8Array(randomBytes(32)));
    const conflicted = new Uint8Array(icloud.items.get(`${MAMA}:${ASHA}`)!.get(1)!);
    await expect(a.keys.storeReleased(released.keys, device.deviceId, req.requestId)).rejects.toMatchObject({ code: 'check_failed' });
    expect(Buffer.from(icloud.items.get(`${MAMA}:${ASHA}`)!.get(1)!).equals(Buffer.from(conflicted))).toBe(true);
  });

  it('a higher key version on the server (only a direct table write could make one) is never used to encrypt', async () => {
    const b = new FakeBackend(() => 0);
    const p = phone(b, MAMA, null);
    b.childKeys.push({ uid: MAMA, childId: ASHA, keyVersion: 2, escrowKeyVersion: 1, keyCheck: '', enc: '', ct: '' });
    expect(await p.keys.keyFor(ASHA, { create: true })).toEqual({ kind: 'unavailable', reason: 'key_version' });
    expect(await p.vault.bookKeyVersions({ profileId: MAMA, childId: ASHA })).toEqual([]);
  });
});

describe('[F08-REQ-027] a device key pair per install', () => {
  it('is made once and registered once', async () => {
    const b = new FakeBackend(() => 0);
    const p = phone(b, MAMA, null);
    const k1 = await p.keys.ensureDevice();
    const k2 = await p.keys.ensureDevice();
    expect(k1.deviceId).toBe(k2.deviceId);
    expect(equalBytes(k1.publicKey, k2.publicKey)).toBe(true);
    expect(b.requests.filter((r) => r.kind === 'registerDevice')).toHaveLength(1);
    expect(b.devices.get(k1.deviceId)).toMatchObject({ uid: MAMA, publicKey: bytesToBase64(k1.publicKey) });
  });

  it('a released key opens only on the device it was sealed to, and is checked against its row', async () => {
    const b = new FakeBackend(() => 0);
    await phone(b, MAMA, null).keys.keyFor(ASHA, { create: true });
    const c = phone(b, MAMA, null);
    const device = await c.keys.ensureDevice();
    const req = await b.escrowFor(MAMA).request(device.deviceId);
    b.restores.get(req.requestId)!.state = 'approved';
    const released = await b.escrowFor(MAMA).release(req.requestId, device.deviceId);
    if (released.state !== 'released') throw new Error('expected a release');
    const keys = released.keys;
    // Another phone cannot open what was sealed to this one.
    const other = phone(b, MAMA, null);
    await other.keys.ensureDevice();
    await expect(other.keys.storeReleased(keys, device.deviceId, req.requestId)).rejects.toThrow();
    // Sealed for this request: the same keys presented for another request do not open.
    await expect(c.keys.storeReleased(keys, device.deviceId, '00000000-0000-4000-8000-000000000000')).rejects.toThrow();
    expect(await c.keys.storeReleased(keys, device.deviceId, req.requestId)).toBe(1);
    expect(await c.keys.canOpen(ASHA, 1)).toBe(true);
    expect(b.unwraps).toHaveLength(1);
  });
});
