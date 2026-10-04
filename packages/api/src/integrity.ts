/**
 * Integrity for everything the app downloads (ADR 0016, founder decision 15):
 *  - every pack file is checked by SHA-256 against its manifest entry;
 *  - every public document (pack manifest, remote config, content bundle) is
 *    an Ed25519-signed envelope over canonical JSON;
 *  - the private key never exists on a server or in the repo: documents are
 *    signed on the founder's machine (`scripts/packs`) with a key from env;
 *  - the public keys ship in the app (`keys.ts`).
 *
 * The signed bytes are `early-letters/<kind>/v1\n` + canonicalJson(payload).
 * The prefix separates kinds, so a signed config can never be replayed as a
 * pack manifest.
 */
import * as ed from '@noble/ed25519';
import { sha256, sha512 } from '@noble/hashes/sha2.js';
import * as v from 'valibot';
import { base64ToBytes, bytesToBase64, bytesToHex, utf8ToBytes } from './bytes';
import { canonicalJson } from './canonical';

// Synchronous SHA-512 for Ed25519 on every runtime (Hermes has no WebCrypto).
ed.hashes.sha512 = sha512;

export const DOCUMENT_KINDS = ['pack-manifest', 'remote-config', 'content-bundle'] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export interface TrustedKey {
  /** Short stable label, e.g. `el-2026-10`. */
  keyId: string;
  /** Raw 32-byte Ed25519 public key, standard base64. */
  publicKey: string;
  /** Which document kinds this key may sign. */
  kinds: readonly DocumentKind[];
}

export const KEY_ID_RE = /^[a-z0-9][a-z0-9-]{1,31}$/;

/** The envelope served for every public document. `payload` is validated by its own schema after the signature checks out. */
export const SignedDocumentSchema = v.object({
  kind: v.picklist(DOCUMENT_KINDS),
  keyId: v.pipe(v.string(), v.regex(KEY_ID_RE)),
  /** Ed25519 signature, 64 bytes, standard base64 (88 characters). */
  sig: v.pipe(v.string(), v.length(88)),
  payload: v.unknown(),
});
export type SignedDocument<T = unknown> = Omit<v.InferOutput<typeof SignedDocumentSchema>, 'payload'> & { payload: T };

export function signingBytes(kind: DocumentKind, payload: unknown): Uint8Array {
  return utf8ToBytes(`early-letters/${kind}/v1\n${canonicalJson(payload)}`);
}

export type VerifyFailure =
  | 'malformed'
  | 'wrong_kind'
  | 'unknown_key'
  | 'key_not_allowed'
  | 'bad_signature'
  | 'not_canonicalizable';

export type VerifyResult<T = unknown> = { ok: true; doc: SignedDocument<T> } | { ok: false; reason: VerifyFailure };

/**
 * Checks shape, kind, key and signature. Does NOT validate the payload: call
 * the kind's parser on `doc.payload` next. Never throws.
 */
export function verifySignedDocument(input: unknown, kind: DocumentKind, trusted: readonly TrustedKey[]): VerifyResult {
  const parsed = v.safeParse(SignedDocumentSchema, input);
  if (!parsed.success) return { ok: false, reason: 'malformed' };
  const doc = parsed.output;
  if (doc.kind !== kind) return { ok: false, reason: 'wrong_kind' };
  const key = trusted.find((k) => k.keyId === doc.keyId);
  if (!key) return { ok: false, reason: 'unknown_key' };
  if (!key.kinds.includes(kind)) return { ok: false, reason: 'key_not_allowed' };
  const pub = base64ToBytes(key.publicKey);
  const sig = base64ToBytes(doc.sig);
  if (!pub || pub.length !== 32 || !sig || sig.length !== 64) return { ok: false, reason: 'malformed' };
  let message: Uint8Array;
  try {
    message = signingBytes(kind, doc.payload);
  } catch {
    return { ok: false, reason: 'not_canonicalizable' };
  }
  let good = false;
  try {
    good = ed.verify(sig, message, pub);
  } catch {
    good = false;
  }
  return good ? { ok: true, doc } : { ok: false, reason: 'bad_signature' };
}

/**
 * Signs a payload. Used by `scripts/packs` (key from env) and by tests (an
 * ephemeral key). The app never signs anything.
 * @param secretKey 32-byte Ed25519 seed.
 */
export function signDocument<T>(kind: DocumentKind, payload: T, secretKey: Uint8Array, keyId: string): SignedDocument<T> {
  if (!KEY_ID_RE.test(keyId)) throw new Error('invalid_key_id');
  if (secretKey.length !== 32) throw new Error('invalid_secret_key');
  const sig = ed.sign(signingBytes(kind, payload), secretKey);
  return { kind, keyId, sig: bytesToBase64(sig), payload };
}

/** Public key (base64) for a 32-byte seed. */
export function publicKeyFor(secretKey: Uint8Array): string {
  return bytesToBase64(ed.getPublicKey(secretKey));
}

/** A fresh keypair: `{ secretKey, publicKey }` as base64. Only `scripts/packs/keygen.mjs` and tests call this. */
export function generateSigningKey(): { secretKey: string; publicKey: string } {
  const { secretKey, publicKey } = ed.keygen();
  return { secretKey: bytesToBase64(secretKey), publicKey: bytesToBase64(publicKey) };
}

// ---------------------------------------------------------------------------
// SHA-256
// ---------------------------------------------------------------------------

export const SHA256_HEX_RE = /^[0-9a-f]{64}$/;

export function sha256Hex(bytes: Uint8Array): string {
  return bytesToHex(sha256(bytes));
}

export interface IncrementalSha256 {
  update(chunk: Uint8Array): void;
  /** Finishes the hash. The object cannot be updated afterwards. */
  digestHex(): string;
}

/** Streaming SHA-256 for files read in slices (pure JS; slow on Hermes for very large files, see ADR 0016). */
export function createSha256(): IncrementalSha256 {
  const h = sha256.create();
  return {
    update: (chunk) => {
      h.update(chunk);
    },
    digestHex: () => bytesToHex(h.digest()),
  };
}
