/**
 * G-22 (security review L6): the app bundle decodes links with
 * shims/decode-uri-component.js, not decode-uri-component 0.2.2, whose
 * malformed-input fallback is super-linear (GHSA-vcc3-ghjq-m6fr). These
 * tests pin three things: metro resolves the package to the shim on every
 * platform, the shim decodes exactly like 0.2.2 (the package query-string 7
 * was written against), and a crafted link cannot hang it.
 */
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const APP = join(__dirname, '..');
const SHIM = join(APP, 'shims', 'decode-uri-component.js');
const shim = require(SHIM) as (s: string) => string;
// The installed 0.2.2, still used by Node tooling; the reference for behaviour on small inputs.
const original = require(require.resolve('decode-uri-component', { paths: [require.resolve('query-string')] })) as (s: string) => string;

describe('[G-22] metro bundles the shim instead of decode-uri-component 0.2.2', () => {
  it('resolves decode-uri-component to the shim on ios, android and web', () => {
    const config = require(join(APP, 'metro.config.js')) as {
      resolver: { resolveRequest: (ctx: unknown, name: string, platform: string) => { type: string; filePath: string } };
    };
    const context = {
      originModulePath: require.resolve('query-string'),
      resolveRequest: () => {
        throw new Error('decode-uri-component must not reach the default resolver');
      },
    };
    for (const platform of ['ios', 'android', 'web']) {
      expect(config.resolver.resolveRequest(context, 'decode-uri-component', platform)).toEqual({ type: 'sourceFile', filePath: SHIM });
    }
  });
});

describe('[G-22] same results as 0.2.2', () => {
  const corpus = [
    '',
    'plain',
    'a+b+c',
    'Asha%20and%20Ravi',
    '%E0%A4%86%E0%A4%B6%E0%A4%BE',
    '%F0%9F%8C%99',
    'caf%C3%A9',
    '%',
    '%%',
    '%G1',
    '100%',
    '%E0%A4%A',
    '%C3%28',
    '%80%80',
    '%E0%A4%86%E0%A4',
    '%F0%9F%98',
    '%FE%FF',
    '%FF%FE',
    '%C2',
    'a%C2b%C2%A9c',
    'mixed%20%E0%A4%86+%ZZ%C3%A9%E0',
    't=abc%2Fdef#frag',
  ];
  for (const input of corpus) {
    it(`decodes ${JSON.stringify(input)} like 0.2.2`, () => {
      expect(shim(input)).toBe(original(input));
    });
  }

  it('reads + as a space, as 0.2.2 does', () => {
    expect(shim('Read+together')).toBe('Read together');
  });

  it('refuses a non-string like 0.2.2', () => {
    expect(() => shim(42 as unknown as string)).toThrow(TypeError);
    expect(() => original(42 as unknown as string)).toThrow(TypeError);
  });

  it('matches 0.2.2 on malformed runs up to the size 0.2.2 can still finish quickly', () => {
    for (const unit of ['%E0', '%80', '%E0%A4', '%F0%9F%98', '%C3%A9%E0']) {
      const input = `x${unit.repeat(12)}y`;
      expect(shim(input), unit).toBe(original(input));
    }
  });
});

describe('[G-22] a crafted link cannot hang the app', () => {
  it('decodes 6,000 malformed escapes in well under a second (0.2.2 takes seconds for 600)', () => {
    const input = '%F0%9F%98'.repeat(2_000);
    const started = performance.now();
    const out = shim(input);
    const ms = performance.now() - started;
    expect(out).toBe(input); // nothing decodable: left literal
    expect(ms).toBeLessThan(500);
  });
});
