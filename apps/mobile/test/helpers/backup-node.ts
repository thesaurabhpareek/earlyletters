/// <reference types="node" />
/**
 * Node stand-ins for the backup ports (lib/backup/ports.ts): the same crypto
 * the native ScribeKeys module does with CryptoKit, done with node:crypto
 * (AES-256-GCM, X25519, HPKE base mode per RFC 9180, checked against its test
 * vector in backup-keys.test.ts), a Keychain with an "iCloud" two phones can
 * share, files on disk, and a fake backend: the main project's RPCs and
 * bucket (resumable uploads) and the escrow project's function, with every
 * request body kept for the plaintext scan. Fictional family "Asha" only.
 */
import { createCipheriv, createDecipheriv, createHash, createHmac, createPrivateKey, createPublicKey, diffieHellman, generateKeyPairSync, randomBytes, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync, openSync, readSync, closeSync, writeSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  BACKUP_BUCKET,
  BACKUP_ERRORS,
  BackupServerError,
  escrowAad,
  escrowInfo,
  objectPathFor,
  releaseAad,
  releaseInfo,
  type BackupServer,
  type BlobRow,
  type ChildKeyRow,
  type EscrowClient,
  type ReleaseOutcome,
  type ReleasedKey,
  type RestoreRequest,
} from '../../src/lib/backup/contract';
import type { Aead, BookKeyRef, ByteSink, ByteSource, FileIO, KeyVault, Sealed } from '../../src/lib/backup/ports';
import type { HttpLike } from '../../src/lib/backup/tus';
import type { BlobDownloader } from '../../src/lib/backup/restore';

// ── AES-GCM and HPKE (RFC 9180 base mode, DHKEM(X25519, HKDF-SHA256), HKDF-SHA256) ──

const buf = (u: Uint8Array) => Buffer.from(u.buffer, u.byteOffset, u.byteLength);

function gcmSeal(alg: 'aes-128-gcm' | 'aes-256-gcm', key: Uint8Array, nonce: Uint8Array, pt: Uint8Array, aad: Uint8Array): Uint8Array {
  const c = createCipheriv(alg, buf(key), buf(nonce));
  c.setAAD(buf(aad));
  return new Uint8Array(Buffer.concat([c.update(buf(pt)), c.final(), c.getAuthTag()]));
}

function gcmOpen(alg: 'aes-128-gcm' | 'aes-256-gcm', key: Uint8Array, nonce: Uint8Array, sealed: Uint8Array, aad: Uint8Array): Uint8Array {
  if (sealed.length < 16) throw new Error('open_failed');
  const d = createDecipheriv(alg, buf(key), buf(nonce));
  d.setAAD(buf(aad));
  d.setAuthTag(buf(sealed.subarray(sealed.length - 16)));
  try {
    return new Uint8Array(Buffer.concat([d.update(buf(sealed.subarray(0, sealed.length - 16))), d.final()]));
  } catch {
    throw new Error('open_failed');
  }
}

export const nodeAead: Aead = {
  seal: async (key, nonce, pt, aad) => gcmSeal('aes-256-gcm', key, nonce, pt, aad),
  open: async (key, nonce, sealed, aad) => gcmOpen('aes-256-gcm', key, nonce, sealed, aad),
};

const PKCS8_X25519 = Buffer.from('302e020100300506032b656e04220420', 'hex');
const SPKI_X25519 = Buffer.from('302a300506032b656e032100', 'hex');
const xPriv = (raw: Uint8Array) => createPrivateKey({ key: Buffer.concat([PKCS8_X25519, buf(raw)]), format: 'der', type: 'pkcs8' });
const xPub = (raw: Uint8Array) => createPublicKey({ key: Buffer.concat([SPKI_X25519, buf(raw)]), format: 'der', type: 'spki' });
export const x25519PublicOf = (sk: Uint8Array) => new Uint8Array(createPublicKey(xPriv(sk)).export({ format: 'der', type: 'spki' }).subarray(-32));
export function x25519Pair(): { sk: Uint8Array; pk: Uint8Array } {
  const { privateKey, publicKey } = generateKeyPairSync('x25519');
  return {
    sk: new Uint8Array(privateKey.export({ format: 'der', type: 'pkcs8' }).subarray(-32)),
    pk: new Uint8Array(publicKey.export({ format: 'der', type: 'spki' }).subarray(-32)),
  };
}

const i2osp = (n: number, l: number) => {
  const b = Buffer.alloc(l);
  b.writeUIntBE(n, 0, l);
  return b;
};
const extract = (salt: Buffer, ikm: Buffer) => createHmac('sha256', salt.length ? salt : Buffer.alloc(32)).update(ikm).digest();
function expand(prk: Buffer, info: Buffer, L: number): Buffer {
  let t = Buffer.alloc(0);
  const out: Buffer[] = [];
  for (let i = 1, n = 0; n < L; i++, n += 32) {
    t = createHmac('sha256', prk).update(Buffer.concat([t, info, Buffer.from([i])])).digest();
    out.push(t);
  }
  return Buffer.concat(out).subarray(0, L);
}
const V1 = Buffer.from('HPKE-v1');
const EMPTY = Buffer.alloc(0);
const lx = (suite: Buffer, salt: Buffer, label: string, ikm: Buffer) => extract(salt, Buffer.concat([V1, suite, Buffer.from(label), ikm]));
const le = (suite: Buffer, prk: Buffer, label: string, info: Buffer, L: number) => expand(prk, Buffer.concat([i2osp(L, 2), V1, suite, Buffer.from(label), info]), L);
const KEM_SUITE = Buffer.concat([Buffer.from('KEM'), i2osp(0x20, 2)]);
const AEADS = { 'aes-128-gcm': { id: 1, nk: 16 }, 'aes-256-gcm': { id: 2, nk: 32 } } as const;
type HpkeAead = keyof typeof AEADS;

function sharedSecret(dh: Buffer, enc: Uint8Array, pkR: Uint8Array): Buffer {
  return le(KEM_SUITE, lx(KEM_SUITE, EMPTY, 'eae_prk', dh), 'shared_secret', Buffer.concat([buf(enc), buf(pkR)]), 32);
}

function keySchedule(ss: Buffer, info: Uint8Array, aead: HpkeAead): { key: Buffer; nonce: Buffer } {
  const suite = Buffer.concat([Buffer.from('HPKE'), i2osp(0x20, 2), i2osp(1, 2), i2osp(AEADS[aead].id, 2)]);
  const ctx = Buffer.concat([Buffer.from([0]), lx(suite, EMPTY, 'psk_id_hash', EMPTY), lx(suite, EMPTY, 'info_hash', buf(info))]);
  const secret = lx(suite, ss, 'secret', EMPTY);
  return { key: le(suite, secret, 'key', ctx, AEADS[aead].nk), nonce: le(suite, secret, 'base_nonce', ctx, 12) };
}

/** HPKE base-mode single-shot seal. `skE` only for test vectors; normally a fresh ephemeral key. */
export function hpkeSeal(pkR: Uint8Array, info: Uint8Array, aad: Uint8Array, pt: Uint8Array, aead: HpkeAead = 'aes-256-gcm', skE?: Uint8Array): Sealed & { sharedSecret: Uint8Array } {
  const eph = skE ?? x25519Pair().sk;
  const enc = x25519PublicOf(eph);
  const ss = sharedSecret(diffieHellman({ privateKey: xPriv(eph), publicKey: xPub(pkR) }), enc, pkR);
  const { key, nonce } = keySchedule(ss, info, aead);
  return { enc, ct: gcmSeal(aead, key, nonce, pt, aad), sharedSecret: new Uint8Array(ss) };
}

export function hpkeOpen(skR: Uint8Array, s: Sealed, info: Uint8Array, aad: Uint8Array, aead: HpkeAead = 'aes-256-gcm'): Uint8Array {
  const ss = sharedSecret(diffieHellman({ privateKey: xPriv(skR), publicKey: xPub(s.enc) }), s.enc, x25519PublicOf(skR));
  const { key, nonce } = keySchedule(ss, info, aead);
  return gcmOpen(aead, key, nonce, s.ct, aad);
}

// ── Keychain and vault ──────────────────────────────────────────────────────

/** iCloud Keychain for one Apple Account: synchronizable items, shared by every phone signed in to it. */
export class FakeICloud {
  readonly items = new Map<string, Map<number, Uint8Array>>();
}

export interface NodeVaultOptions {
  /** The synced store; null means iCloud Keychain is off on this phone. */
  icloud: FakeICloud | null;
  supported?: boolean;
}

export function nodeVault(o: NodeVaultOptions): KeyVault & { local: Map<string, Map<number, Uint8Array>>; devices: Map<string, { id: string; sk: Uint8Array }> } {
  const local = new Map<string, Map<number, Uint8Array>>();
  const store = () => o.icloud?.items ?? local;
  const acc = (r: BookKeyRef) => `${r.profileId}:${r.childId}`;
  const key = (r: BookKeyRef, v: number) => {
    const k = store().get(acc(r))?.get(v);
    if (!k) throw Object.assign(new Error('no_key'), { code: 'no_key' });
    return k;
  };
  const v = {
    local,
    /** As ScribeKeys: one device key per (install, account), this device only, never synced. */
    devices: new Map<string, { id: string; sk: Uint8Array }>(),
    supported: () => o.supported ?? true,
    async deviceKey(profileId: string) {
      const d = v.devices.get(profileId);
      return d ? { deviceId: d.id, publicKey: x25519PublicOf(d.sk) } : null;
    },
    async createDeviceKey(profileId: string) {
      if (!v.devices.has(profileId)) v.devices.set(profileId, { id: randomUUID(), sk: x25519Pair().sk });
      const d = v.devices.get(profileId)!;
      return { deviceId: d.id, publicKey: x25519PublicOf(d.sk) };
    },
    async deleteDeviceKey(profileId: string) {
      v.devices.delete(profileId);
    },
    async bookKeyVersions(r: BookKeyRef) {
      return [...(store().get(acc(r))?.keys() ?? [])].sort((a, b) => a - b);
    },
    async createBookKey(r: BookKeyRef, version: number) {
      const m = store().get(acc(r)) ?? new Map<number, Uint8Array>();
      if (m.has(version)) throw Object.assign(new Error('key_exists'), { code: 'key_exists' });
      m.set(version, new Uint8Array(randomBytes(32)));
      store().set(acc(r), m);
    },
    async deleteBookKeys(r: BookKeyRef) {
      store().delete(acc(r));
    },
    async bookKeyCheck(r: BookKeyRef, version: number, label: Uint8Array) {
      return new Uint8Array(createHmac('sha256', buf(key(r, version))).update(buf(label)).digest().subarray(0, 16));
    },
    async wrapFileKey(r: BookKeyRef, version: number, fileKey: Uint8Array, aad: Uint8Array) {
      const nonce = new Uint8Array(randomBytes(12));
      return new Uint8Array(Buffer.concat([buf(nonce), buf(gcmSeal('aes-256-gcm', key(r, version), nonce, fileKey, aad))]));
    },
    async unwrapFileKey(r: BookKeyRef, version: number, wrapped: Uint8Array, aad: Uint8Array) {
      return gcmOpen('aes-256-gcm', key(r, version), wrapped.subarray(0, 12), wrapped.subarray(12), aad);
    },
    async sealBookKey(r: BookKeyRef, version: number, recipient: Uint8Array, info: Uint8Array, aad: Uint8Array) {
      const s = hpkeSeal(recipient, info, aad, key(r, version));
      return { enc: s.enc, ct: s.ct };
    },
    async openBookKey(r: BookKeyRef, version: number, s: Sealed, info: Uint8Array, aad: Uint8Array, check: { label: Uint8Array; expected: Uint8Array } | null) {
      const device = v.devices.get(r.profileId);
      if (!device) throw new Error('no_device');
      const bk = hpkeOpen(device.sk, s, info, aad);
      // As ScribeKeys: a key that fails the row's check is never written.
      if (check && !createHmac('sha256', buf(bk)).update(buf(check.label)).digest().subarray(0, 16).equals(buf(check.expected))) {
        throw Object.assign(new Error('key_check_failed'), { code: 'key_check_failed' });
      }
      const m = store().get(acc(r)) ?? new Map<number, Uint8Array>();
      m.set(version, bk);
      store().set(acc(r), m);
    },
    randomBytes: (n: number) => new Uint8Array(randomBytes(n)),
  };
  return v;
}

// ── Files ───────────────────────────────────────────────────────────────────

export function nodeFiles(root: string): FileIO & { tmpDir: string; docDir: string } {
  const tmpDir = join(root, 'Library', 'Application Support', 'backup-tmp');
  const docDir = join(root, 'Documents');
  mkdirSync(tmpDir, { recursive: true });
  mkdirSync(docDir, { recursive: true });
  const p = (uri: string) => fileURLToPath(uri);
  return {
    tmpDir,
    docDir,
    exists: (uri) => existsSync(p(uri)),
    size: (uri) => (existsSync(p(uri)) ? statSync(p(uri)).size : null),
    openRead(uri): ByteSource {
      const fd = openSync(p(uri), 'r');
      return {
        read(n) {
          const b = Buffer.alloc(n);
          let got = 0;
          while (got < n) {
            const r = readSync(fd, b, got, n - got, null);
            if (r === 0) break;
            got += r;
          }
          return new Uint8Array(b.subarray(0, got));
        },
        close: () => closeSync(fd),
      };
    },
    openWrite(uri): ByteSink {
      const fd = openSync(p(uri), 'w');
      return { write: (b) => void writeSync(fd, buf(b)), close: () => closeSync(fd) };
    },
    readSlice(uri, offset, length) {
      return new Uint8Array(readFileSync(p(uri)).subarray(offset, offset + length));
    },
    remove(uri) {
      rmSync(p(uri), { force: true });
    },
    moveNoReplace(from, to) {
      if (existsSync(p(to))) throw Object.assign(new Error('exists'), { code: 'exists' });
      renameSync(p(from), p(to));
    },
    sha256: async (uri) => createHash('sha256').update(readFileSync(p(uri))).digest('hex'),
    tmpUri: (name) => pathToFileURL(join(tmpDir, name)).toString(),
    listTmp: () => readdirSync(tmpDir).map((n) => pathToFileURL(join(tmpDir, n)).toString()),
    documentUri: (name) => pathToFileURL(join(docDir, name)).toString(),
  };
}

/** A fake M4A: an `ftyp` box first, so a proxy scan can look for it, then random bytes. */
export function fakeM4a(bytes: number): Buffer {
  const head = Buffer.from('00000018667479704d344120000000004d344120', 'hex'); // size, 'ftyp', 'M4A '
  return Buffer.concat([head, randomBytes(Math.max(0, bytes - head.length))]).subarray(0, bytes);
}

export const sha256Hex = (b: Uint8Array) => createHash('sha256').update(buf(b)).digest('hex');

// ── Fake backend: main project (RPCs, bucket) and the escrow project ───────

interface BlobState extends BlobRow {
  state: 'pending' | 'confirmed';
  authorId: string;
  wrappedFileKey: string;
}

interface Upload {
  id: string;
  uid: string;
  path: string;
  length: number;
  data: Buffer;
}

export interface RecordedRequest {
  kind: string;
  body: Buffer;
}

export class FakeBackend {
  readonly devices = new Map<string, { uid: string; publicKey: string; enrolledAt: number; revoked: boolean }>();
  readonly childKeys: (ChildKeyRow & { uid: string; enc: string; ct: string })[] = [];
  readonly blobs = new Map<string, BlobState>();
  readonly objects = new Map<string, Buffer>();
  readonly uploads = new Map<string, Upload>();
  readonly consent = new Map<string, 'accept' | 'withdraw'>();
  /** Letters and held drafts the server has, by uid (what `backup_begin` checks). */
  readonly rows = new Map<string, Set<string>>();
  readonly requests: RecordedRequest[] = [];
  readonly restores = new Map<string, RestoreRequest & { uid: string; deviceId: string }>();
  readonly unwraps: { uid: string; deviceId: string; childId: string; keyVersion: number; reason: 'restore'; requestId: string }[] = [];
  readonly emails: { uid: string; kind: 'restore_requested' | 'key_opened' }[] = [];
  readonly escrow = x25519Pair();
  readonly escrowVersion = 1;
  quotaBytes = 5 * 1024 * 1024 * 1024;
  /** The 10-minute step-up fails (the session is older): every new request is refused. */
  stepUpRequired = false;
  /** The caller's session has ended (a Stop signed out every session): escrow answers 401 unauthorized, sqlstate 28000, detail session_ended. */
  sessionEnded = false;
  /**
   * `backup_begin` refuses with this SQLSTATE and detail while set. #151 raises `28000` (no detail) from
   * `require_user()` on every upload RPC; it raises `SCSTP` only from `backup_delete_all`, so an
   * `SCSTP` here is the client's defensive case.
   */
  refuseRpc: { code: string; detail: string | null } | null = null;
  /** Letters erased on the server (purge_ledger): `backup_begin` refuses them with SCDEL purged, as #151. */
  readonly purged = new Set<string>();
  /** False: rows are read back without a key check (a row stored before #151 kept one). */
  returnsKeyCheck = true;
  releaseCalls = 0;
  /** Fault injection: fail the next n calls of this kind with no response. */
  readonly faults = new Map<string, number>();

  constructor(readonly now: () => number) {}

  addRow(uid: string, entryId: string): void {
    const s = this.rows.get(uid) ?? new Set<string>();
    s.add(entryId);
    this.rows.set(uid, s);
  }

  private record(kind: string, body: unknown): void {
    this.requests.push({ kind, body: body instanceof Uint8Array ? Buffer.from(body) : Buffer.from(JSON.stringify(body ?? null)) });
  }

  private fault(kind: string): void {
    const n = this.faults.get(kind) ?? 0;
    if (n > 0) {
      this.faults.set(kind, n - 1);
      throw new BackupServerError('', true);
    }
  }

  private requireConsent(uid: string): void {
    if (this.consent.get(uid) !== 'accept') throw new BackupServerError(BACKUP_ERRORS.consent, false);
  }

  /** The main project as one signed-in person sees it (RLS: own rows only). */
  serverFor(uid: string): BackupServer {
    const b = this;
    return {
      async registerDevice(x) {
        b.record('registerDevice', x);
        b.fault('registerDevice');
        // As #151 backup_register_device: a device id is one profile's, with one public key; a revoked one stays revoked.
        const d = b.devices.get(x.deviceId);
        if (d && (d.uid !== uid || d.publicKey !== x.publicKey)) throw new BackupServerError(BACKUP_ERRORS.immutable, false);
        if (d?.revoked) throw new BackupServerError(BACKUP_ERRORS.immutable, false, null, 'revoked');
        if (!d && [...b.devices.values()].some((o) => o.publicKey === x.publicKey)) throw new BackupServerError(BACKUP_ERRORS.immutable, false);
        if (!d) b.devices.set(x.deviceId, { uid, publicKey: x.publicKey, enrolledAt: b.now(), revoked: false });
      },
      async listKeys() {
        b.fault('listKeys');
        return b.childKeys
          .filter((k) => k.uid === uid)
          .map(({ childId, keyVersion, escrowKeyVersion, keyCheck }) => ({ childId, keyVersion, escrowKeyVersion, keyCheck: b.returnsKeyCheck ? keyCheck : null }));
      },
      async storeKey(x) {
        b.record('storeKey', x);
        b.fault('storeKey');
        b.requireConsent(uid);
        // As #151: one key per (child, author); a second version is refused too (SCIMM key_exists).
        if (b.childKeys.some((k) => k.uid === uid && k.childId === x.childId)) throw new BackupServerError(BACKUP_ERRORS.immutable, false, null, 'key_exists');
        b.childKeys.push({ ...x, uid });
      },
      async begin(x) {
        b.record('begin', x);
        b.fault('begin');
        if (b.refuseRpc) throw new BackupServerError(b.refuseRpc.code, false, null, b.refuseRpc.detail);
        b.requireConsent(uid);
        if (!b.childKeys.some((k) => k.uid === uid && k.childId === x.childId && k.keyVersion === x.keyVersion)) throw new BackupServerError(BACKUP_ERRORS.notFound, false, null, 'key');
        if (b.purged.has(x.entryId)) throw new BackupServerError(BACKUP_ERRORS.deleted, false, null, 'purged');
        if (!b.rows.get(uid)?.has(x.entryId)) throw new BackupServerError(BACKUP_ERRORS.notFound, false, null, 'entry');
        const existing = b.blobs.get(x.entryId);
        if (existing && existing.authorId !== uid) throw new BackupServerError('42501', false);
        const path = objectPathFor(x.childId, uid, x.entryId);
        if (existing?.state === 'confirmed') return { objectPath: existing.objectPath, state: 'confirmed', uploadToken: null };
        const used = [...b.blobs.values()].filter((r) => r.authorId === uid && r.entryId !== x.entryId).reduce((n, r) => n + r.bytes, 0);
        if (used + x.bytes > b.quotaBytes) throw new BackupServerError(BACKUP_ERRORS.quota, false);
        b.blobs.set(x.entryId, {
          entryId: x.entryId,
          childId: x.childId,
          objectPath: path,
          keyVersion: x.keyVersion,
          cipherSha256: '',
          bytes: x.bytes,
          state: 'pending',
          authorId: uid,
          wrappedFileKey: x.wrappedFileKey,
        });
        return { objectPath: path, state: 'pending', uploadToken: null };
      },
      async confirm(entryId, cipherSha256) {
        b.record('confirm', { entryId, cipherSha256 });
        b.fault('confirm');
        const row = b.blobs.get(entryId);
        if (!row || row.authorId !== uid) throw new BackupServerError('P0002', false);
        if (row.state === 'confirmed') return;
        // As #151: no object is P0002 object, another size is 22023 size. The hash check is the fake's own (stricter).
        const obj = b.objects.get(row.objectPath);
        if (!obj) throw new BackupServerError('P0002', false, null, 'object');
        if (obj.length !== row.bytes) throw new BackupServerError('22023', false, null, 'size');
        if (sha256Hex(obj) !== cipherSha256) throw new BackupServerError('22023', false);
        row.state = 'confirmed';
        row.cipherSha256 = cipherSha256;
      },
      async listBlobs() {
        b.fault('listBlobs');
        return [...b.blobs.values()]
          .filter((r) => r.authorId === uid && r.state === 'confirmed')
          .map(({ entryId, childId, objectPath, keyVersion, cipherSha256, bytes }) => ({ entryId, childId, objectPath, keyVersion, cipherSha256, bytes }));
      },
      async recordConsent(action) {
        b.record('recordConsent', { action });
        b.consent.set(uid, action);
      },
      async uploadTarget() {
        return { endpoint: 'https://fake.storage/storage/v1/upload/resumable', headers: { Authorization: `Bearer ${uid}` } };
      },
      async downloadUrl(objectPath) {
        const row = [...b.blobs.values()].find((r) => r.objectPath === objectPath);
        if (!row || row.authorId !== uid) throw new BackupServerError('42501', false);
        return `https://fake.storage/download/${encodeURIComponent(objectPath)}?for=${uid}`;
      },
    };
  }

  /** Supabase's resumable endpoint, enough of it: create, offset, append; inserts only where a pending row of the caller matches. */
  readonly http: HttpLike = async (url, init) => {
    const ok = (status: number, headers: Record<string, string> = {}) => ({ status, header: (n: string) => headers[n] ?? headers[n.toLowerCase()] ?? null });
    const uid = (init.headers.Authorization ?? '').replace(/^Bearer /, '');
    if (init.body) this.record('tus', init.body);
    this.fault('tus');
    if (init.method === 'POST') {
      const metaPairs = Object.fromEntries(
        (init.headers['Upload-Metadata'] ?? '').split(',').map((p) => {
          const [k, v] = p.split(' ');
          return [k, Buffer.from(v ?? '', 'base64').toString('utf8')];
        }),
      );
      if (metaPairs.bucketName !== BACKUP_BUCKET) return ok(400);
      const row = [...this.blobs.values()].find((r) => r.objectPath === metaPairs.objectName);
      if (!row || row.authorId !== uid || row.state !== 'pending') return ok(403);
      const id = randomUUID();
      this.uploads.set(id, { id, uid, path: metaPairs.objectName, length: Number(init.headers['Upload-Length']), data: Buffer.alloc(0) });
      return ok(201, { Location: `/storage/v1/upload/resumable/${id}` });
    }
    const id = url.split('/').pop()!;
    const up = this.uploads.get(id);
    if (!up || up.uid !== uid) return ok(404);
    if (init.method === 'HEAD') return ok(200, { 'Upload-Offset': String(up.data.length) });
    if (Number(init.headers['Upload-Offset']) !== up.data.length) return ok(409);
    up.data = Buffer.concat([up.data, Buffer.from(init.body ?? new Uint8Array(0))]);
    if (up.data.length > up.length) return ok(400);
    if (up.data.length === up.length) {
      this.objects.set(up.path, up.data);
      this.uploads.delete(id);
    }
    return ok(204, { 'Upload-Offset': String(up.data.length) });
  };

  readonly downloader: BlobDownloader = {
    download: async (url, toUri) => {
      this.fault('download');
      const m = /\/download\/([^?]+)\?for=(.+)$/.exec(url);
      const obj = m ? this.objects.get(decodeURIComponent(m[1])) : undefined;
      if (!obj) throw new BackupServerError('HTTP404', false);
      writeFileSync(fileURLToPath(toUri), obj);
    },
  };

  /** The escrow function (F08 6.5 C), as one signed-in person calls it. */
  escrowFor(uid: string): EscrowClient {
    const b = this;
    const H = 3600 * 1000;
    return {
      async request(deviceId) {
        b.record('escrow.request', { deviceId });
        if (b.stepUpRequired) throw new BackupServerError('reauth_required', false);
        if (b.sessionEnded) throw new BackupServerError('unauthorized', false, null, 'session_ended');
        const d = b.devices.get(deviceId);
        // As #151: an unknown or revoked device is P0002 device_unknown (escrow 404).
        if (!d || d.uid !== uid || d.revoked) throw new BackupServerError('not_found', false, null, 'device_unknown');
        const recent = b.now() - 90 * 24 * H;
        const other = [...b.devices.entries()].some(([id, x]) => id !== deviceId && x.uid === uid && !x.revoked && x.enrolledAt >= recent);
        const req = { requestId: randomUUID(), state: 'requested' as const, holdUntil: new Date(b.now() + (other ? 72 : 24) * H).toISOString(), uid, deviceId };
        b.restores.set(req.requestId, req);
        b.emails.push({ uid, kind: 'restore_requested' });
        return { requestId: req.requestId, state: req.state, holdUntil: req.holdUntil };
      },
      async release(requestId, deviceId): Promise<ReleaseOutcome> {
        b.record('escrow.release', { requestId, deviceId });
        b.releaseCalls += 1;
        const r = b.restores.get(requestId);
        if (!r || r.uid !== uid || r.deviceId !== deviceId) throw new BackupServerError('forbidden', false, null, 'device_unknown');
        if (b.devices.get(deviceId)?.revoked) throw new BackupServerError('not_found', false, null, 'device_unknown');
        if (r.state === 'cancelled' || r.state === 'expired') return { state: r.state };
        // Held: the answer is the hold, nothing is opened (recovery-key.ts ReleaseResult).
        if (r.state !== 'approved' && b.now() < Date.parse(r.holdUntil)) return { state: r.state === 'requested' ? 'requested' : 'approved', holdUntil: r.holdUntil };
        const device = b.devices.get(deviceId)!;
        const out: ReleasedKey[] = [];
        for (const k of b.childKeys.filter((x) => x.uid === uid)) {
          const bk = hpkeOpen(b.escrow.sk, { enc: Buffer.from(k.enc, 'base64'), ct: Buffer.from(k.ct, 'base64') }, escrowInfo(), escrowAad(uid, k.childId, k.keyVersion, k.escrowKeyVersion));
          const s = hpkeSeal(Buffer.from(device.publicKey, 'base64'), releaseInfo(), releaseAad(uid, deviceId, requestId, k.childId, k.keyVersion), bk);
          bk.fill(0);
          out.push({ childId: k.childId, keyVersion: k.keyVersion, enc: Buffer.from(s.enc).toString('base64'), ct: Buffer.from(s.ct).toString('base64') });
          b.unwraps.push({ uid, deviceId, childId: k.childId, keyVersion: k.keyVersion, reason: 'restore', requestId });
          b.emails.push({ uid, kind: 'key_opened' });
        }
        r.state = 'released';
        return { state: 'released', keys: out };
      },
    };
  }

  escrowKeys() {
    return [{ version: this.escrowVersion, publicKey: Buffer.from(this.escrow.pk).toString('base64') }];
  }
}
