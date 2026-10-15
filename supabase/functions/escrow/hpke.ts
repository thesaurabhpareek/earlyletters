/**
 * HPKE base mode (RFC 9180), single shot, over WebCrypto only: DHKEM(X25519, HKDF-SHA256),
 * HKDF-SHA256, AES-256-GCM (suite 0x0020, 0x0001, 0x0002), the suite CryptoKit offers on iOS 17
 * as HPKE.Ciphersuite.Curve25519_SHA256_AES_GCM_256. AES-128-GCM is here only so the key schedule
 * can be checked against more vectors.
 *
 * No imports: this file runs inside the escrow trust boundary (docs/ops/BACKUP_RUNBOOK.md).
 * Cross-checked both ways against an independent implementation (test/hpke.test.ts fixtures).
 */

export type Aead = 'aes-256-gcm' | 'aes-128-gcm';

const KEM_ID = 0x0020;
const KDF_ID = 0x0001;
const AEAD_IDS: Record<Aead, number> = { 'aes-128-gcm': 0x0001, 'aes-256-gcm': 0x0002 };
const NK: Record<Aead, number> = { 'aes-128-gcm': 16, 'aes-256-gcm': 32 };
const NN = 12;
const NH = 32;
const te = new TextEncoder();
const subtle = crypto.subtle;

// PKCS#8 wrapper for a raw 32-byte X25519 private key (OID 1.3.101.110).
const PKCS8_PREFIX = new Uint8Array([0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6e, 0x04, 0x22, 0x04, 0x20]);
const BASE_POINT = new Uint8Array(32);
BASE_POINT[0] = 9;

export const concat = (...parts: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};
const i2osp = (n: number, len: number): Uint8Array => {
  const out = new Uint8Array(len);
  for (let i = len - 1; i >= 0; i--, n = Math.floor(n / 256)) out[i] = n & 0xff;
  return out;
};
const buf = (u: Uint8Array): ArrayBuffer => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;

async function hmac(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  // An empty HKDF salt is HashLen zero bytes (RFC 5869 2.2); HMAC pads short keys with zeros anyway.
  const k = await subtle.importKey('raw', buf(key.length ? key : new Uint8Array(NH)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await subtle.sign('HMAC', k, buf(data)));
}
const extract = (salt: Uint8Array, ikm: Uint8Array) => hmac(salt, ikm);
async function expand(prk: Uint8Array, info: Uint8Array, len: number): Promise<Uint8Array> {
  const out = new Uint8Array(len);
  let t: Uint8Array = new Uint8Array(0);
  for (let i = 1, o = 0; o < len; i++) {
    t = await hmac(prk, concat(t, info, new Uint8Array([i])));
    out.set(t.subarray(0, Math.min(t.length, len - o)), o);
    o += t.length;
  }
  return out;
}

const kemSuite = concat(te.encode('KEM'), i2osp(KEM_ID, 2));
const hpkeSuite = (aead: Aead) => concat(te.encode('HPKE'), i2osp(KEM_ID, 2), i2osp(KDF_ID, 2), i2osp(AEAD_IDS[aead], 2));
const labeledExtract = (suite: Uint8Array, salt: Uint8Array, label: string, ikm: Uint8Array) =>
  extract(salt, concat(te.encode('HPKE-v1'), suite, te.encode(label), ikm));
const labeledExpand = (suite: Uint8Array, prk: Uint8Array, label: string, info: Uint8Array, len: number) =>
  expand(prk, concat(i2osp(len, 2), te.encode('HPKE-v1'), suite, te.encode(label), info), len);

const importPrivate = (sk: Uint8Array) =>
  subtle.importKey('pkcs8', buf(concat(PKCS8_PREFIX, sk)), { name: 'X25519' }, false, ['deriveBits']);
const importPublic = (pk: Uint8Array) => subtle.importKey('raw', buf(pk), { name: 'X25519' }, false, []);
async function dh(sk: Uint8Array, pk: Uint8Array): Promise<Uint8Array> {
  if (pk.length !== 32 || sk.length !== 32) throw new HpkeError('bad_key');
  return new Uint8Array(await subtle.deriveBits({ name: 'X25519', public: await importPublic(pk) } as unknown as AlgorithmIdentifier, await importPrivate(sk), 256));
}

export class HpkeError extends Error {
  readonly code: 'bad_key' | 'decrypt_failed' | 'bad_input';
  constructor(code: 'bad_key' | 'decrypt_failed' | 'bad_input') {
    super(code);
    this.code = code;
  }
}

/** X25519 public key of a raw private key: X25519(sk, 9). */
export const publicKeyOf = (sk: Uint8Array): Promise<Uint8Array> => dh(sk, BASE_POINT);

/** A fresh X25519 key pair as raw 32-byte values. */
export async function generateKeyPair(): Promise<{ sk: Uint8Array; pk: Uint8Array }> {
  const pair = await subtle.generateKey({ name: 'X25519' } as unknown as AlgorithmIdentifier, true, ['deriveBits']) as CryptoKeyPair;
  const pkcs8 = new Uint8Array(await subtle.exportKey('pkcs8', pair.privateKey));
  const sk = pkcs8.slice(pkcs8.length - 32);
  return { sk, pk: new Uint8Array(await subtle.exportKey('raw', pair.publicKey)) };
}

async function keySchedule(aead: Aead, shared: Uint8Array, info: Uint8Array) {
  const suite = hpkeSuite(aead);
  const empty = new Uint8Array(0);
  const pskIdHash = await labeledExtract(suite, empty, 'psk_id_hash', empty);
  const infoHash = await labeledExtract(suite, empty, 'info_hash', info);
  const context = concat(new Uint8Array([0]), pskIdHash, infoHash);
  const secret = await labeledExtract(suite, shared, 'secret', empty);
  const key = await labeledExpand(suite, secret, 'key', context, NK[aead]);
  const nonce = await labeledExpand(suite, secret, 'base_nonce', context, NN);
  return { key, nonce };
}

async function sharedSecret(dhOut: Uint8Array, enc: Uint8Array, pkR: Uint8Array): Promise<Uint8Array> {
  const prk = await labeledExtract(kemSuite, new Uint8Array(0), 'eae_prk', dhOut);
  return labeledExpand(kemSuite, prk, 'shared_secret', concat(enc, pkR), 32);
}

const aesKey = (key: Uint8Array, use: KeyUsage) => subtle.importKey('raw', buf(key), { name: 'AES-GCM' }, false, [use]);

export interface SealOptions {
  aead?: Aead;
  /** Tests only: a fixed ephemeral private key, so a seal can be compared byte for byte. */
  ephemeralSk?: Uint8Array;
}

/** SealBase: returns enc (32 bytes) and ciphertext with its 16-byte tag. */
export async function seal(pkR: Uint8Array, info: Uint8Array, aad: Uint8Array, pt: Uint8Array, opts: SealOptions = {}): Promise<{ enc: Uint8Array; ct: Uint8Array }> {
  const aead = opts.aead ?? 'aes-256-gcm';
  const skE = opts.ephemeralSk ?? (await generateKeyPair()).sk;
  const enc = await publicKeyOf(skE);
  const shared = await sharedSecret(await dh(skE, pkR), enc, pkR);
  const { key, nonce } = await keySchedule(aead, shared, info);
  const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv: buf(nonce), additionalData: buf(aad), tagLength: 128 }, await aesKey(key, 'encrypt'), buf(pt)));
  return { enc, ct };
}

/** OpenBase. Throws HpkeError('decrypt_failed') on any authentication failure. */
export async function open(skR: Uint8Array, enc: Uint8Array, info: Uint8Array, aad: Uint8Array, ct: Uint8Array, opts: { aead?: Aead } = {}): Promise<Uint8Array> {
  const aead = opts.aead ?? 'aes-256-gcm';
  if (enc.length !== 32 || ct.length < 16) throw new HpkeError('bad_input');
  const pkR = await publicKeyOf(skR);
  let shared: Uint8Array;
  try {
    shared = await sharedSecret(await dh(skR, enc), enc, pkR);
  } catch {
    throw new HpkeError('decrypt_failed');
  }
  const { key, nonce } = await keySchedule(aead, shared, info);
  try {
    return new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: buf(nonce), additionalData: buf(aad), tagLength: 128 }, await aesKey(key, 'decrypt'), buf(ct)));
  } catch {
    throw new HpkeError('decrypt_failed');
  }
}

// ── The escrow formats (format 1: 0x01 || enc (32) || ct) ─────────────────
// Labels name the codename, never the product (CLAUDE.md: the public name lives in packages/brand).

export const FORMAT_V1 = 1;
export const INFO = {
  /** A book key sealed on the phone to the escrow public key (child_keys.escrow_wrap). */
  bookKey: te.encode('scribe/escrow/book-key/v1'),
  /** A book key the escrow function opened, sealed to the requesting device. */
  release: te.encode('scribe/escrow/release/v1'),
  /** A random approval code sealed to an enrolled device (restore_approvals.sealed_code). */
  approval: te.encode('scribe/escrow/approval/v1'),
} as const;

/** Associated data: lowercase ids joined with '|', so a wrap cannot be moved to another row. */
export const aad = {
  bookKey: (profile: string, child: string, keyVersion: number, escrowKeyVersion: number) =>
    te.encode([profile, child, keyVersion, escrowKeyVersion].join('|').toLowerCase()),
  release: (profile: string, device: string, request: string, child: string, keyVersion: number) =>
    te.encode([profile, device, request, child, keyVersion].join('|').toLowerCase()),
  approval: (profile: string, device: string) => te.encode([profile, device].join('|').toLowerCase()),
};

export const packV1 = (s: { enc: Uint8Array; ct: Uint8Array }): Uint8Array => concat(new Uint8Array([FORMAT_V1]), s.enc, s.ct);
export function unpackV1(b: Uint8Array): { enc: Uint8Array; ct: Uint8Array } {
  if (b.length < 1 + 32 + 16 || b[0] !== FORMAT_V1) throw new HpkeError('bad_input');
  return { enc: b.subarray(1, 33), ct: b.subarray(33) };
}
