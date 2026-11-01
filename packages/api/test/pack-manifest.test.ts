import { describe, expect, it } from 'vitest';
import { compareSemver, parsePackManifest, requiredPacksForLanguage, resolveAll, resolvePack, satisfiesMin } from '../src';

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
const manifest = (packs: unknown[]) => ({ schemaVersion: 1, version: 3, generatedAt: '2026-10-03T12:00:00.000Z', packs });

describe('semver', () => {
  it('compares numerically, not as strings', () => {
    expect(compareSemver('1.10.0', '1.9.9')).toBe(1);
    expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
    expect(satisfiesMin('1.2.0', '1.2.0')).toBe(true);
    expect(satisfiesMin('1.1.9', '1.2.0')).toBe(false);
    expect(satisfiesMin('garbage', '0.0.0')).toBe(false);
  });
});

describe('parsePackManifest', () => {
  it('accepts a valid manifest and fills defaults', () => {
    const r = parsePackManifest(manifest([entry()]));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.packs[0].mirrors).toEqual([]);
    expect(r.skipped).toBe(0);
  });

  it('skips entries it does not understand instead of failing (forward compatible)', () => {
    const r = parsePackManifest(
      manifest([
        entry(),
        entry({ id: 'phonetics.pt', kind: 'phonetics' }),
        entry({ id: 'text-rules.es', url: 'http://insecure.example.com/x' }),
        entry({ id: 'text-rules.fr', sha256: 'XYZ' }),
        entry({ id: 'text-rules.hi', fileName: '../escape.json' }),
        entry({ id: 'text-rules.ar', fileName: '.hidden' }),
        entry({ id: 'text-rules.zh', bytes: 0 }),
      ]),
    );
    expect(r.ok && r.value.packs.map((p) => p.id)).toEqual(['text-rules.pt']);
    expect(r.ok && r.skipped).toBe(6);
  });

  it('drops a duplicate id and version', () => {
    const r = parsePackManifest(manifest([entry(), entry({ url: 'https://other.example.com/x.json' })]));
    expect(r.ok && r.value.packs.length).toBe(1);
  });

  it('rejects a bad top level', () => {
    expect(parsePackManifest({ ...manifest([]), schemaVersion: 2 }).ok).toBe(false);
    expect(parsePackManifest({ ...manifest([]), version: 0 }).ok).toBe(false);
    expect(parsePackManifest(null).ok).toBe(false);
  });
});

describe('resolving packs', () => {
  const m = (() => {
    const r = parsePackManifest(
      manifest([
        entry({ version: 1 }),
        entry({ version: 2, minAppVersion: '1.1.0' }),
        entry({ version: 3, minAppVersion: '2.0.0' }),
        entry({ id: 'prompts.pt', kind: 'prompts', fileName: 'pt.prompts.json' }),
        entry({ id: 'text-rules.hi', language: 'hi', fileName: 'hi.rules.json' }),
        entry({ id: 'speech-model.whisper-small-q5_1', kind: 'speech-model', language: 'mul', required: false, fileName: 'ggml-small-q5_1.bin', bytes: 190_085_487 }),
      ]),
    );
    if (!r.ok) throw new Error('fixture');
    return r.value;
  })();

  it('picks the highest version this app can read', () => {
    expect(resolvePack(m, 'text-rules.pt', '1.0.0')?.version).toBe(1);
    expect(resolvePack(m, 'text-rules.pt', '1.5.2')?.version).toBe(2);
    expect(resolvePack(m, 'text-rules.pt', '2.0.0')?.version).toBe(3);
    expect(resolvePack(m, 'text-rules.xx', '2.0.0')).toBeNull();
  });

  it('[DECISION-15] choosing Portuguese needs the Portuguese packs and nothing else', () => {
    expect(requiredPacksForLanguage(m, 'pt', '1.0.0').map((p) => p.id)).toEqual(['prompts.pt', 'text-rules.pt']);
    expect(requiredPacksForLanguage(m, 'hi', '1.0.0').map((p) => p.id)).toEqual(['text-rules.hi']);
  });

  it('lists one entry per id', () => {
    expect(resolveAll(m, '1.5.0').map((p) => `${p.id}@${p.version}`)).toEqual([
      'prompts.pt@1',
      'speech-model.whisper-small-q5_1@1',
      'text-rules.hi@1',
      'text-rules.pt@2',
    ]);
  });
});
