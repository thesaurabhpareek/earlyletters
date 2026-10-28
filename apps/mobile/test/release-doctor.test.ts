// scripts/release/doctor.ts: the read-only check of the release connections. Nothing here calls Apple, Expo or
// GitHub; the token is verified against a key generated in the test, and the answers are fake.
import { generateKeyPairSync, verify } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { appLookupPath, ascToken, interpretAppLookup, redact, render, repoFindings } from '../../../scripts/release/doctor';

const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const decode = (s: string) => JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));

describe('App Store Connect token (Apple: ES256, aud appstoreconnect-v1, at most 20 minutes)', () => {
  const now = 1_800_000_000;
  const token = ascToken({ keyId: 'KEY1234567', issuerId: '11111111-2222-3333-4444-555555555555', privateKeyPem: pem, nowSeconds: now, scope: ['GET /v1/apps'] });
  const [h, p, sig] = token.split('.');

  it('has the header and claims Apple documents', () => {
    expect(decode(h)).toEqual({ alg: 'ES256', kid: 'KEY1234567', typ: 'JWT' });
    expect(decode(p)).toEqual({ iss: '11111111-2222-3333-4444-555555555555', iat: now, exp: now + 120, aud: 'appstoreconnect-v1', scope: ['GET /v1/apps'] });
    expect(decode(p).exp - decode(p).iat).toBeLessThanOrEqual(20 * 60);
  });

  it('carries a signature that verifies with the public key, in the raw r||s form JWT requires', () => {
    const raw = Buffer.from(sig, 'base64url');
    expect(raw.length).toBe(64);
    expect(verify('sha256', Buffer.from(`${h}.${p}`), { key: publicKey, dsaEncoding: 'ieee-p1363' }, raw)).toBe(true);
  });
});

describe('reading an app lookup', () => {
  it('names the bundle id in the request and escapes it', () => {
    expect(appLookupPath('com.example.app')).toBe('/v1/apps?filter[bundleId]=com.example.app');
  });
  it('passes when the app exists, and says where its Apple id goes', () => {
    const f = interpretAppLookup(200, { data: [{ id: '123456789' }] }, 'com.x.y');
    expect(f.level).toBe('PASS');
    expect(f.message).toContain('ascAppId');
  });
  it('fails when the key works but the record does not exist', () => {
    expect(interpretAppLookup(200, { data: [] }, 'com.x.y').level).toBe('FAIL');
  });
  it('fails on a refused key, another status, and an answer it cannot read', () => {
    expect(interpretAppLookup(401, null, 'com.x.y').message).toMatch(/refused the key/);
    expect(interpretAppLookup(403, null, 'com.x.y').level).toBe('FAIL');
    expect(interpretAppLookup(500, null, 'com.x.y').level).toBe('FAIL');
    expect(interpretAppLookup(200, { data: 'nope' }, 'com.x.y').message).toMatch(/cannot be read/);
  });
});

describe('the repository wiring', () => {
  const good = {
    appConfig: "owner: 'someone',\nextra: { eas: { projectId: '123e4567-e89b-12d3-a456-426614174000' } }",
    easJson: JSON.stringify({ submit: { testflight: { ios: { ascAppId: '1' } }, preview: { ios: { ascAppId: '2' } }, production: { ios: { ascAppId: '3' } } } }),
    keysTs: "export const T = [{ keyId: 'a', publicKey: 'b' }];",
  };
  it('passes everything when the founder steps are done', () => {
    expect(repoFindings(good).every((f) => f.level === 'PASS')).toBe(true);
  });
  it('fails each missing founder step, as develop is today', () => {
    const f = repoFindings({ appConfig: 'export default {}', easJson: JSON.stringify({ submit: { production: {}, preview: {}, testflight: {} } }), keysTs: '[ ]' });
    expect(f.filter((x) => x.level === 'FAIL').length).toBe(6);
  });
  it('does not count the commented example key line as a signing key', () => {
    const f = repoFindings({ ...good, keysTs: "export const T = [\n  // { keyId: 'el-2026-10', publicKey: 'x' },\n  /* { keyId: 'b' } */\n];" });
    expect(f.find((x) => x.message.includes('keys.ts'))?.level).toBe('FAIL');
  });
  it('fails, and does not throw, on broken eas.json', () => {
    expect(repoFindings({ ...good, easJson: '{' }).some((f) => f.level === 'FAIL' && /not valid JSON/.test(f.message))).toBe(true);
  });
});

describe('output', () => {
  it('lists failures first and counts each level', () => {
    const out = render([{ level: 'PASS', area: 'repo', message: 'a' }, { level: 'FAIL', area: 'expo', message: 'b' }, { level: 'UNVERIFIED', area: 'apple', message: 'c' }]);
    expect(out.indexOf('FAIL')).toBeLessThan(out.indexOf('UNVERIFIED'));
    expect(out.indexOf('UNVERIFIED')).toBeLessThan(out.indexOf('PASS'));
    expect(out).toContain('1 pass, 1 unverified, 1 fail.');
  });
  it('hides a secret that reaches an error message, and ignores short strings', () => {
    expect(redact('bad token abcdef123456 here', ['abcdef123456'])).toBe('bad token [hidden] here');
    expect(redact('abc stays', ['abc'])).toBe('abc stays');
  });
});
