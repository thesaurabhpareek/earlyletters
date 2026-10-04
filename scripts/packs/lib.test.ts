/// <reference types="node" />
/**
 * Publishing pipeline (ADR 0016), run by `npm test -w @scribe/api`. Checks
 * that what the script publishes is exactly what a phone accepts.
 */
import { describe, expect, it } from 'vitest';
import {
  base64ToBytes,
  generateSigningKey,
  parsePackManifest,
  sha256Hex,
  verifySignedDocument,
  type TrustedKey,
} from '../../packages/api/src/index';
import { ENGLISH_PACK } from '../../packages/core/src/lang/index';
import { PROMPTS } from '../../packages/content/src/prompts';
import { onboardingStories } from '../../packages/content/src/stories.en';
import { speechPackEntries } from '../../apps/mobile/src/lib/models/catalog';
import {
  buildContentBundle,
  buildManifest,
  buildRemoteConfig,
  buildTextRulesPack,
  configModule,
  contentModule,
  packVersionNumber,
  publishedVersion,
  readPublished,
  readSigningKey,
  sign,
  uploadCommands,
} from './lib';

const key = generateSigningKey();
const trusted: TrustedKey[] = [{ keyId: 'el-test', publicKey: key.publicKey, kinds: ['pack-manifest', 'remote-config', 'content-bundle'] }];
const env = { EL_SIGNING_KEY: key.secretKey, EL_SIGNING_KEY_ID: 'el-test' };
const spanishSource = JSON.stringify({ ...structuredClone(ENGLISH_PACK), language: 'es', name: { english: 'Spanish', native: 'Español' }, version: '1.2.3' }, null, 2);
const opts = { baseUrl: 'https://packs.earlyletters.com/', minAppVersion: '1.0.0' };

describe('signing key', () => {
  it('reads a trusted key from the environment', () => {
    const k = readSigningKey(env, trusted);
    expect(k.keyId).toBe('el-test');
    expect(k.secret).toEqual(base64ToBytes(key.secretKey));
  });

  it('refuses a missing, malformed or untrusted key', () => {
    expect(() => readSigningKey({}, trusted)).toThrow(/must be set/);
    expect(() => readSigningKey({ ...env, EL_SIGNING_KEY: 'short' }, trusted)).toThrow(/32-byte/);
    expect(() => readSigningKey({ ...env, EL_SIGNING_KEY_ID: 'el-other' }, trusted)).toThrow(/not in packages/);
    const other = generateSigningKey();
    expect(() => readSigningKey({ ...env, EL_SIGNING_KEY: other.secretKey }, trusted)).toThrow(/does not match/);
    expect(() => readSigningKey(env, [])).toThrow(/not in packages/);
  });
});

describe('text-rules packs', () => {
  it('builds a validated, minified, deterministic pack with an immutable URL', () => {
    const a = buildTextRulesPack('es', spanishSource, opts);
    const b = buildTextRulesPack('es', JSON.stringify(JSON.parse(spanishSource)), opts);
    expect(a.entry).toMatchObject({ id: 'text-rules.es', kind: 'text-rules', language: 'es', version: 1_002_003, fileName: 'es.rules.json', required: true });
    expect(a.entry.url).toBe('https://packs.earlyletters.com/text-rules.es/1002003/es.rules.json');
    expect(a.entry.sha256).toBe(sha256Hex(a.bytes));
    expect(a.entry.sha256).toBe(b.entry.sha256);
    expect(a.bytes.length).toBeLessThan(spanishSource.length);
  });

  it('[DECISION-15] never builds English (it ships in the app) and refuses invalid sources', () => {
    expect(() => buildTextRulesPack('en', JSON.stringify(ENGLISH_PACK), opts)).toThrow(/ships in the app/);
    expect(() => buildTextRulesPack('es', '{"kind":"text-rules"}', opts)).toThrow(/not valid/);
    expect(() => buildTextRulesPack('es', JSON.stringify({ ...JSON.parse(spanishSource), language: 'fr' }), opts)).toThrow(/not valid/);
    expect(() => buildTextRulesPack('de', spanishSource, opts)).toThrow(/not a v1.0 language/);
  });

  it('orders pack versions like their semver', () => {
    expect(packVersionNumber('1.0.0')).toBeLessThan(packVersionNumber('1.0.1'));
    expect(packVersionNumber('1.9.0')).toBeLessThan(packVersionNumber('1.10.0'));
    expect(packVersionNumber('1.999.999')).toBeLessThan(packVersionNumber('2.0.0'));
    expect(() => packVersionNumber('1.1000.0')).toThrow();
  });
});

describe('signed documents', () => {
  const k = readSigningKey(env, trusted);

  it('signs a manifest of text packs and hosted speech models that a phone accepts', () => {
    const es = buildTextRulesPack('es', spanishSource, opts);
    const manifest = buildManifest([es.entry, ...speechPackEntries('1.0.0')], 4, '2026-10-03T12:00:00.000Z');
    const { text } = sign('pack-manifest', manifest, k, trusted);
    const verified = verifySignedDocument(JSON.parse(text), 'pack-manifest', trusted);
    expect(verified.ok).toBe(true);
    const parsed = verified.ok ? parsePackManifest(verified.doc.payload) : null;
    expect(parsed?.ok && parsed.skipped).toBe(0);
    expect(parsed?.ok && parsed.value.packs.find((p) => p.id === 'text-rules.es')?.sha256).toBe(es.entry.sha256);
  });

  it('refuses a manifest entry the app would skip', () => {
    expect(() => buildManifest([{ ...buildTextRulesPack('es', spanishSource, opts).entry, url: 'http://insecure.example.com/x' }], 1, '2026-10-03T12:00:00.000Z')).toThrow(/do not match/);
  });

  it('builds the remote config strictly from remote-config.json', () => {
    const source = { readTogetherFreeSessions: 3, killSwitches: { sync: true } };
    const c = buildRemoteConfig(source, 7, '2026-10-03T12:00:00.000Z');
    expect(c.version).toBe(7);
    expect(c.killSwitches.sync).toBe(true);
    expect(() => buildRemoteConfig({ killSwitches: { recording: true } }, 1, '2026-10-03T12:00:00.000Z')).toThrow(/unknown keys/);
    expect(() => buildRemoteConfig({ readTogetherFreeSessions: -1 }, 1, '2026-10-03T12:00:00.000Z')).toThrow(/unknown keys/);
  });

  it('[DECISION-16] builds the content bundle from the packaged copy, so server and fallback start identical', () => {
    const bundle = buildContentBundle({ prompts: PROMPTS, stories: onboardingStories }, 1, '2026-10-03T12:00:00.000Z');
    expect(bundle.blocks.filter((b) => b.type === 'prompt')).toHaveLength(PROMPTS.filter((p) => !p.retired).length);
    expect(bundle.blocks.filter((b) => b.type === 'story')).toHaveLength(onboardingStories.length);
    expect(() =>
      buildContentBundle({ prompts: [], stories: [], extraBlocks: [{ type: 'tip', id: 'x', placement: 'book', body: 'Bad — dash' }] }, 1, '2026-10-03T12:00:00.000Z'),
    ).toThrow(/content rules/);
  });
});

describe('published modules', () => {
  it('round-trips the generated published.ts modules and bumps versions', () => {
    const k = readSigningKey(env, trusted);
    const doc = sign('remote-config', buildRemoteConfig({}, 3, '2026-10-03T12:00:00.000Z'), k, trusted).text;
    const mod = configModule(doc, null);
    expect(readPublished(mod, 'REMOTE_CONFIG')).toBe(doc);
    expect(readPublished(mod, 'PACK_MANIFEST')).toBeNull();
    expect(publishedVersion(readPublished(mod, 'REMOTE_CONFIG'))).toBe(3);
    expect(publishedVersion(null)).toBe(0);
    const cmod = contentModule({ en: doc });
    expect(readPublished(cmod, 'CONTENT_BUNDLES')).toEqual({ en: doc });
  });

  it('prints upload commands with immutable caching and a large-file tool', () => {
    const es = buildTextRulesPack('es', spanishSource, opts);
    const [cmd] = uploadCommands([es], 'early-letters-packs');
    expect(cmd).toContain('npx wrangler r2 object put early-letters-packs/text-rules.es/1002003/es.rules.json');
    expect(cmd).toContain('public, max-age=31536000, immutable');
    const big = uploadCommands([{ ...es, bytes: new Uint8Array(1) , entry: es.entry, objectKey: 'speech/x.bin' }].map((f) => ({ ...f, bytes: { length: 600_000_000 } as Uint8Array })), 'b');
    expect(big[0]).toMatch(/^rclone copyto/);
  });
});
