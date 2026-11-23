/**
 * [FR-AIS-13] The pack manifest's signature is checked before any entry is read,
 * so a changed hash, size or download address in a speech-model entry is refused
 * as a bad signature and nothing is parsed (BL-1357 part A). Keys are ephemeral.
 */
import { describe, expect, it } from 'vitest';
import { base64ToBytes, generateSigningKey, parsePackManifest, signDocument, verifySignedDocument, type TrustedKey } from '../src';

const model = {
  id: 'speech-model.fixture-small',
  kind: 'speech-model',
  language: 'mul',
  version: 1,
  url: 'https://packs.example.app/speech/fixture-small.bin',
  mirrors: [] as string[],
  bytes: 190_085_487,
  sha256: 'a'.repeat(64),
  fileName: 'fixture-small.bin',
  minAppVersion: '1.0.0',
  required: false,
};
const payload = { schemaVersion: 1, version: 7, generatedAt: '2026-11-20T12:00:00.000Z', packs: [model] };

function signed() {
  const { secretKey, publicKey } = generateSigningKey();
  const trusted: TrustedKey[] = [{ keyId: 'el-test', publicKey, kinds: ['pack-manifest'] }];
  const doc = JSON.parse(JSON.stringify(signDocument('pack-manifest', payload, base64ToBytes(secretKey)!, 'el-test')));
  return { doc, trusted };
}

describe('[FR-AIS-13] a signed manifest is the only source of a model file hash and size', () => {
  it('[FR-AIS-13] the untouched manifest verifies and yields the hash and size', () => {
    const { doc, trusted } = signed();
    const v = verifySignedDocument(doc, 'pack-manifest', trusted);
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    const p = parsePackManifest(v.doc.payload);
    expect(p.ok && p.value.packs[0]).toMatchObject({ bytes: model.bytes, sha256: model.sha256 });
  });

  it.each([
    ['a changed size', (e: typeof model) => ({ ...e, bytes: e.bytes - 1 })],
    ['a changed hash', (e: typeof model) => ({ ...e, sha256: 'b'.repeat(64) })],
    ['a changed download address', (e: typeof model) => ({ ...e, url: 'https://evil.example.app/speech/fixture-small.bin' })],
    ['an added mirror', (e: typeof model) => ({ ...e, mirrors: ['https://evil.example.app/m.bin'] })],
  ])('[FR-AIS-13] %s breaks the signature, before any entry is read', (_n, change) => {
    const { doc, trusted } = signed();
    doc.payload.packs[0] = change(doc.payload.packs[0]);
    expect(verifySignedDocument(doc, 'pack-manifest', trusted)).toMatchObject({ ok: false, reason: 'bad_signature' });
  });

  it('[FR-AIS-13] a manifest signed by a key we do not trust is refused', () => {
    const { doc } = signed();
    const other = generateSigningKey();
    const trusted: TrustedKey[] = [{ keyId: 'el-test', publicKey: other.publicKey, kinds: ['pack-manifest'] }];
    expect(verifySignedDocument(doc, 'pack-manifest', trusted)).toMatchObject({ ok: false, reason: 'bad_signature' });
  });
});
