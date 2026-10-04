import { describe, expect, it } from 'vitest';
import {
  base64ToBytes,
  bytesToBase64,
  canonicalJson,
  createSha256,
  generateSigningKey,
  sha256Hex,
  signDocument,
  utf8ToBytes,
  verifySignedDocument,
  type TrustedKey,
} from '../src';

function keypair(kinds: TrustedKey['kinds'] = ['pack-manifest', 'remote-config', 'content-bundle'], keyId = 'test-key') {
  const { secretKey, publicKey } = generateSigningKey();
  return { secret: base64ToBytes(secretKey)!, trusted: [{ keyId, publicKey, kinds }] as TrustedKey[] };
}

describe('canonicalJson', () => {
  it('sorts keys at every depth and drops whitespace', () => {
    expect(canonicalJson({ b: 1, a: { d: [3, { z: true, y: null }], c: 'x' } })).toBe('{"a":{"c":"x","d":[3,{"y":null,"z":true}]},"b":1}');
  });
  it('is independent of key insertion order', () => {
    const one = JSON.parse('{"x":1,"y":[1,2],"z":{"b":2,"a":1}}');
    const two = JSON.parse('{"z":{"a":1,"b":2},"y":[1,2],"x":1}');
    expect(canonicalJson(one)).toBe(canonicalJson(two));
  });
  it('escapes strings like JSON.stringify and keeps non-ASCII as is', () => {
    expect(canonicalJson({ s: 'line\n"quote"\\ नमस्ते 中文' })).toBe('{"s":"line\\n\\"quote\\"\\\\ नमस्ते 中文"}');
  });
  it('writes numbers in shortest form and -0 as 0', () => {
    expect(canonicalJson([1.5, 1e21, -0, 100])).toBe('[1.5,1e+21,0,100]');
  });
  it('omits undefined object members and writes undefined array items as null', () => {
    expect(canonicalJson({ a: undefined, b: [undefined] })).toBe('{"b":[null]}');
  });
  it('refuses values that cannot be signed', () => {
    expect(() => canonicalJson({ n: Number.NaN })).toThrow();
    expect(() => canonicalJson({ n: Infinity })).toThrow();
    expect(() => canonicalJson({ d: new Date() })).toThrow();
    const cyc: Record<string, unknown> = {};
    cyc.self = cyc;
    expect(() => canonicalJson(cyc)).toThrow();
  });
});

describe('base64', () => {
  it('round-trips every length', () => {
    for (let n = 0; n < 70; n++) {
      const bytes = Uint8Array.from({ length: n }, (_, i) => (i * 37 + n) & 255);
      const b64 = bytesToBase64(bytes);
      expect(b64).toBe(Buffer.from(bytes).toString('base64'));
      expect(Array.from(base64ToBytes(b64)!)).toEqual(Array.from(bytes));
    }
  });
  it('rejects non-canonical input', () => {
    expect(base64ToBytes('abc')).toBeNull();
    expect(base64ToBytes('ab$=')).toBeNull();
    expect(base64ToBytes('YQ')).toBeNull();
  });
});

describe('sha256', () => {
  it('matches the known vector and the incremental form', () => {
    expect(sha256Hex(utf8ToBytes('abc'))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    const h = createSha256();
    h.update(utf8ToBytes('a'));
    h.update(utf8ToBytes('bc'));
    expect(h.digestHex()).toBe(sha256Hex(utf8ToBytes('abc')));
  });
});

describe('signed documents', () => {
  const payload = { schemaVersion: 1, version: 7, items: ['a', 'b'], nested: { z: 1, a: 2 } };

  it('verifies a signature made by a trusted key', () => {
    const { secret, trusted } = keypair();
    const doc = signDocument('pack-manifest', payload, secret, 'test-key');
    const r = verifySignedDocument(JSON.parse(JSON.stringify(doc)), 'pack-manifest', trusted);
    expect(r.ok).toBe(true);
  });

  it('verifies after a JSON round trip that reorders keys', () => {
    const { secret, trusted } = keypair();
    const doc = signDocument('remote-config', payload, secret, 'test-key');
    const reordered = { payload: JSON.parse('{"nested":{"a":2,"z":1},"items":["a","b"],"version":7,"schemaVersion":1}'), sig: doc.sig, keyId: doc.keyId, kind: doc.kind };
    expect(verifySignedDocument(reordered, 'remote-config', trusted).ok).toBe(true);
  });

  it('[ADR-0016] rejects a tampered payload', () => {
    const { secret, trusted } = keypair();
    const doc = signDocument('pack-manifest', payload, secret, 'test-key');
    const tampered = { ...doc, payload: { ...payload, version: 8 } };
    expect(verifySignedDocument(tampered, 'pack-manifest', trusted)).toEqual({ ok: false, reason: 'bad_signature' });
  });

  it('[ADR-0016] separates document kinds: a signed config is not a manifest', () => {
    const { secret, trusted } = keypair();
    const config = signDocument('remote-config', payload, secret, 'test-key');
    expect(verifySignedDocument(config, 'pack-manifest', trusted)).toEqual({ ok: false, reason: 'wrong_kind' });
    const relabelled = { ...config, kind: 'pack-manifest' };
    expect(verifySignedDocument(relabelled, 'pack-manifest', trusted)).toEqual({ ok: false, reason: 'bad_signature' });
  });

  it('rejects unknown keys, keys not allowed for the kind, and an empty trust list', () => {
    const { secret, trusted } = keypair(['content-bundle']);
    const doc = signDocument('pack-manifest', payload, secret, 'test-key');
    expect(verifySignedDocument(doc, 'pack-manifest', trusted)).toEqual({ ok: false, reason: 'key_not_allowed' });
    expect(verifySignedDocument({ ...doc, keyId: 'other-key' }, 'pack-manifest', trusted)).toEqual({ ok: false, reason: 'unknown_key' });
    expect(verifySignedDocument(doc, 'pack-manifest', [])).toEqual({ ok: false, reason: 'unknown_key' });
  });

  it('rejects a signature from a different key with the same id', () => {
    const a = keypair();
    const b = keypair();
    const doc = signDocument('pack-manifest', payload, b.secret, 'test-key');
    expect(verifySignedDocument(doc, 'pack-manifest', a.trusted)).toEqual({ ok: false, reason: 'bad_signature' });
  });

  it('never throws on garbage', () => {
    const { trusted } = keypair();
    for (const junk of [null, 1, 'x', [], {}, { kind: 'pack-manifest', keyId: 'test-key', sig: 'A'.repeat(88), payload: { n: 1 } }]) {
      const r = verifySignedDocument(junk, 'pack-manifest', trusted);
      expect(r.ok).toBe(false);
    }
  });
});
