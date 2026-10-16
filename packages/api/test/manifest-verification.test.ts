/**
 * Manifest verification end to end (ADR 0016, founder decision 15): a signed
 * pack manifest from key to parsed entries, every way the envelope is refused,
 * and every field rule an entry must meet to be installed. Keys are
 * ephemeral; nothing here touches the shipped trust list.
 */
import { describe, expect, it } from 'vitest';
import {
  base64ToBytes,
  compareEntries,
  compareSemver,
  generateSigningKey,
  MAX_PACK_BYTES,
  PACK_FILE_NAME_RE,
  PACK_ID_RE,
  parsePackManifest,
  parseSemver,
  requiredPacksForLanguage,
  resolveAll,
  resolvePack,
  satisfiesMin,
  signDocument,
  TRUSTED_SIGNING_KEYS,
  verifySignedDocument,
  type PackManifest,
  type TrustedKey,
} from '../src';

const H = 'a'.repeat(64);
const entry = (over: Record<string, unknown> = {}) => ({
  id: 'text-rules.pt',
  kind: 'text-rules',
  language: 'pt',
  version: 1,
  url: 'https://packs.example.app/text-rules/pt/1/pt.rules.json',
  bytes: 1234,
  sha256: H,
  fileName: 'pt.rules.json',
  minAppVersion: '1.0.0',
  required: true,
  ...over,
});
const manifest = (packs: unknown[], over: Record<string, unknown> = {}) => ({ schemaVersion: 1, version: 3, generatedAt: '2026-10-03T12:00:00.000Z', packs, ...over });

function keypair(kinds: TrustedKey['kinds'] = ['pack-manifest'], keyId = 'el-test') {
  const { secretKey, publicKey } = generateSigningKey();
  return { secret: base64ToBytes(secretKey)!, trusted: [{ keyId, publicKey, kinds }] as TrustedKey[] };
}

/** What the app does with a downloaded manifest: verify the envelope, then parse the payload. */
function install(input: unknown, trusted: readonly TrustedKey[]) {
  const v = verifySignedDocument(input, 'pack-manifest', trusted);
  if (!v.ok) return { stage: 'verify' as const, reason: v.reason };
  const p = parsePackManifest(v.doc.payload);
  if (!p.ok) return { stage: 'parse' as const, reason: p.reason };
  return { stage: 'ok' as const, manifest: p.value, skipped: p.skipped };
}

describe('[ADR-0016] a signed manifest from key to installed packs', () => {
  it('verifies, parses and resolves after a JSON round trip', () => {
    const { secret, trusted } = keypair();
    const doc = signDocument('pack-manifest', manifest([entry(), entry({ version: 2, minAppVersion: '1.2.0' })]), secret, 'el-test');
    const r = install(JSON.parse(JSON.stringify(doc)), trusted);
    expect(r.stage).toBe('ok');
    if (r.stage !== 'ok') return;
    expect(r.skipped).toBe(0);
    expect(r.manifest.version).toBe(3);
    expect(resolvePack(r.manifest, 'text-rules.pt', '1.1.0')?.version).toBe(1);
    expect(resolvePack(r.manifest, 'text-rules.pt', '1.2.0')?.version).toBe(2);
  });

  it('a changed hash inside the payload breaks the signature, before any entry is read', () => {
    const { secret, trusted } = keypair();
    const doc = signDocument('pack-manifest', manifest([entry()]), secret, 'el-test');
    const tampered = JSON.parse(JSON.stringify(doc)) as { payload: { packs: Array<{ sha256: string }> } };
    tampered.payload.packs[0].sha256 = 'b'.repeat(64);
    expect(install(tampered, trusted)).toEqual({ stage: 'verify', reason: 'bad_signature' });
  });

  it.each([
    ['a config signed with the same key is not a manifest', (d: Record<string, unknown>) => ({ ...d, kind: 'remote-config' }), 'wrong_kind'],
    ['an unknown key id', (d: Record<string, unknown>) => ({ ...d, keyId: 'el-other' }), 'unknown_key'],
    ['a signature of the wrong length', (d: Record<string, unknown>) => ({ ...d, sig: (d.sig as string).slice(1) }), 'malformed'],
    ['a signature that is not base64', (d: Record<string, unknown>) => ({ ...d, sig: '!'.repeat(88) }), 'malformed'],
    ['a key id with capitals', (d: Record<string, unknown>) => ({ ...d, keyId: 'EL-TEST' }), 'malformed'],
    ['no payload at all', (d: Record<string, unknown>) => ({ kind: d.kind, keyId: d.keyId, sig: d.sig }), 'malformed'],
    ['a payload that cannot be canonicalised', (d: Record<string, unknown>) => ({ ...d, payload: { ...(d.payload as object), version: Number.NaN } }), 'not_canonicalizable'],
  ])('refuses %s', (_name, mutate, reason) => {
    const { secret, trusted } = keypair();
    const doc = signDocument('pack-manifest', manifest([entry()]), secret, 'el-test') as unknown as Record<string, unknown>;
    expect(install(mutate(doc), trusted)).toEqual({ stage: 'verify', reason });
  });

  it('a key trusted for configs only may not sign a manifest, and a replayed manifest fails under a rotated key', () => {
    const { secret, trusted } = keypair(['remote-config']);
    const doc = signDocument('pack-manifest', manifest([entry()]), secret, 'el-test');
    expect(install(doc, trusted)).toEqual({ stage: 'verify', reason: 'key_not_allowed' });
    const rotated = keypair(['pack-manifest'], 'el-test'); // same id, new key
    expect(install(doc, rotated.trusted)).toEqual({ stage: 'verify', reason: 'bad_signature' });
  });

  it('signDocument refuses a bad key id or a seed of the wrong size; the app never signs', () => {
    const { secret } = keypair();
    expect(() => signDocument('pack-manifest', manifest([]), secret, 'Bad Id')).toThrow('invalid_key_id');
    expect(() => signDocument('pack-manifest', manifest([]), secret.slice(0, 31), 'el-test')).toThrow('invalid_secret_key');
  });

  it('the shipped trust list fails closed while empty (keys.ts: founder runs keygen), and any key it holds is well formed', () => {
    const { secret } = keypair();
    const doc = signDocument('pack-manifest', manifest([entry()]), secret, 'el-test');
    if (TRUSTED_SIGNING_KEYS.length === 0) expect(install(doc, TRUSTED_SIGNING_KEYS)).toEqual({ stage: 'verify', reason: 'unknown_key' });
    // A test key is never in the shipped list, empty or not.
    expect(TRUSTED_SIGNING_KEYS.some((k) => k.keyId === 'el-test')).toBe(false);
    for (const k of TRUSTED_SIGNING_KEYS) {
      expect(k.keyId, k.keyId).toMatch(/^[a-z0-9][a-z0-9-]{1,31}$/);
      expect(base64ToBytes(k.publicKey)?.length, k.keyId).toBe(32);
      expect(k.kinds.length, k.keyId).toBeGreaterThan(0);
    }
    expect(new Set(TRUSTED_SIGNING_KEYS.map((k) => k.keyId)).size).toBe(TRUSTED_SIGNING_KEYS.length);
  });
});

describe('entry rules: an entry that breaks one is skipped, never installed', () => {
  const skips = (over: Record<string, unknown>) => {
    const r = parsePackManifest(manifest([entry(over)]));
    if (!r.ok) throw new Error('top level should parse');
    return r.skipped === 1 && r.value.packs.length === 0;
  };

  it.each([
    ['an id with capitals', { id: 'Text-Rules.pt' }],
    ['an id without a kind prefix', { id: 'pt' }],
    ['an id with a path separator', { id: 'text-rules/pt' }],
    ['an unknown kind', { kind: 'font' }],
    ['a language that is not a tag', { language: 'portuguese' }],
    ['a version of 0', { version: 0 }],
    ['a fractional version', { version: 1.5 }],
    ['an http url', { url: 'http://packs.example.app/x' }],
    ['a url with a space', { url: 'https://packs.example.app/a b' }],
    ['four mirrors', { mirrors: ['https://a.example', 'https://b.example', 'https://c.example', 'https://d.example'] }],
    ['an http mirror', { mirrors: ['http://a.example'] }],
    ['zero bytes', { bytes: 0 }],
    ['more than the 4 GB cap', { bytes: MAX_PACK_BYTES + 1 }],
    ['fractional bytes', { bytes: 12.5 }],
    ['an uppercase hash', { sha256: H.toUpperCase() }],
    ['a short hash', { sha256: H.slice(1) }],
    ['a file name with a folder', { fileName: '../pt.rules.json' }],
    ['a hidden file name', { fileName: '.pt.rules.json' }],
    ['a two-part app version', { minAppVersion: '1.0' }],
    ['a pre-release app version', { minAppVersion: '1.0.0-beta' }],
    ['required as a string', { required: 'yes' }],
    ['a missing field', { sha256: undefined }],
  ])('%s', (_name, over) => {
    expect(skips(over)).toBe(true);
  });

  it('accepts every documented shape: mul, a script subtag, a region, three mirrors, the largest file', () => {
    const r = parsePackManifest(
      manifest([
        entry({ id: 'speech-model.whisper-large-v3-turbo-q5_0', kind: 'speech-model', language: 'mul', bytes: MAX_PACK_BYTES, fileName: 'ggml-large-v3-turbo-q5_0.bin', required: false }),
        entry({ id: 'text-rules.zh-hans', language: 'zh-Hans', fileName: 'zh-Hans.rules.json' }),
        entry({ id: 'prompts.pt-br', kind: 'prompts', language: 'pt-BR', fileName: 'pt-BR.prompts.json', mirrors: ['https://a.example/x', 'https://b.example/x', 'https://c.example:8443/x'] }),
      ]),
    );
    expect(r.ok && r.skipped).toBe(0);
    expect(r.ok && r.value.packs.map((p) => p.id)).toEqual(['speech-model.whisper-large-v3-turbo-q5_0', 'text-rules.zh-hans', 'prompts.pt-br']);
    expect(PACK_ID_RE.test('text-rules.pt')).toBe(true);
    expect(PACK_FILE_NAME_RE.test('pt.rules.json')).toBe(true);
  });

  it('the top level is strict: wrong schema version, version 0, a bad timestamp or more than 500 packs is invalid', () => {
    for (const over of [{ schemaVersion: 2 }, { version: 0 }, { generatedAt: 'yesterday' }, { packs: Array.from({ length: 501 }, () => entry()) }, { packs: 'none' }]) {
      expect(parsePackManifest(manifest([entry()], over)), JSON.stringify(Object.keys(over))).toEqual({ ok: false, reason: 'invalid' });
    }
    expect(parsePackManifest(null)).toEqual({ ok: false, reason: 'invalid' });
    expect(parsePackManifest(manifest([]))).toMatchObject({ ok: true, skipped: 0 });
  });

  it('a duplicate id and version keeps the first; the same id at another version is a second entry', () => {
    const r = parsePackManifest(manifest([entry({ bytes: 1 }), entry({ bytes: 2 }), entry({ version: 2 })]));
    expect(r.ok && r.skipped).toBe(1);
    expect(r.ok && r.value.packs.map((p) => `${p.version}:${p.bytes}`)).toEqual(['1:1', '2:1234']);
  });
});

describe('resolving what this app may install', () => {
  const m = (() => {
    const r = parsePackManifest(
      manifest([
        entry({ version: 1 }),
        entry({ version: 3, minAppVersion: '2.0.0' }),
        entry({ version: 2, minAppVersion: '1.1.0' }),
        entry({ id: 'prompts.pt', kind: 'prompts', fileName: 'pt.prompts.json', required: false }),
        entry({ id: 'text-rules.hi', language: 'hi', fileName: 'hi.rules.json' }),
        entry({ id: 'speech-model.small', kind: 'speech-model', language: 'mul', fileName: 'small.bin', required: true }),
      ]),
    );
    if (!r.ok) throw new Error('fixture');
    return r.value as PackManifest;
  })();

  it('the highest version the app meets wins, whatever the listing order; an unparseable app version installs nothing', () => {
    expect(resolvePack(m, 'text-rules.pt', '1.0.0')?.version).toBe(1);
    expect(resolvePack(m, 'text-rules.pt', '1.1.0')?.version).toBe(2);
    expect(resolvePack(m, 'text-rules.pt', '1.99.99')?.version).toBe(2);
    expect(resolvePack(m, 'text-rules.pt', '2.0.0')?.version).toBe(3);
    expect(resolvePack(m, 'text-rules.pt', '0.9.0')).toBeNull();
    expect(resolvePack(m, 'text-rules.pt', '1.0')).toBeNull();
    expect(resolvePack(m, 'text-rules.pt', '')).toBeNull();
    expect(resolveAll(m, 'junk')).toEqual([]);
  });

  it('[DECISION-15] a chosen language fetches its required packs only: never optional ones, never the multilingual model', () => {
    expect(requiredPacksForLanguage(m, 'pt', '1.0.0').map((p) => p.id)).toEqual(['text-rules.pt']);
    expect(requiredPacksForLanguage(m, 'hi', '1.0.0').map((p) => p.id)).toEqual(['text-rules.hi']);
    expect(requiredPacksForLanguage(m, 'mul', '1.0.0').map((p) => p.id)).toEqual(['speech-model.small']);
    expect(requiredPacksForLanguage(m, 'fr', '1.0.0')).toEqual([]);
  });

  it('resolveAll is sorted by id and compareEntries puts newer versions first within an id', () => {
    expect(resolveAll(m, '2.0.0').map((p) => `${p.id}@${p.version}`)).toEqual(['prompts.pt@1', 'speech-model.small@1', 'text-rules.hi@1', 'text-rules.pt@3']);
    const sorted = [...m.packs].sort(compareEntries).map((p) => `${p.id}@${p.version}`);
    expect(sorted).toEqual(['prompts.pt@1', 'speech-model.small@1', 'text-rules.hi@1', 'text-rules.pt@3', 'text-rules.pt@2', 'text-rules.pt@1']);
  });

  it('semver: numeric, three parts, no leading zeros, no pre-release; unparseable sorts below everything', () => {
    expect(parseSemver('1.10.0')).toEqual([1, 10, 0]);
    expect(parseSemver('01.0.0')).toBeNull();
    expect(parseSemver('1.0.0-rc1')).toBeNull();
    expect(parseSemver('1000000.0.0')).toBeNull();
    expect(compareSemver('1.10.0', '1.9.9')).toBe(1);
    expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
    expect(compareSemver('x', 'y')).toBe(0);
    expect(compareSemver('x', '0.0.0')).toBe(-1);
    expect(satisfiesMin('1.0.0', '1.0.0')).toBe(true);
    expect(satisfiesMin('x', '0.0.0')).toBe(false);
  });
});
