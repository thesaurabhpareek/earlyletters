// scripts/release/doctor.ts: the read-only check of the alpha release connections. Nothing here calls Apple, Expo
// or GitHub; the token is verified against a key generated in the test, and every answer is fake. Values are
// fictional.
import { generateKeyPairSync, verify } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { appLookupPath, ascToken, checkApple, checkExpo, interpretAppLookup, PREVIEW_BUNDLE_ID, redact, render, repoFindings, signingKeyIds } from '../../../scripts/release/doctor';

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
  it('puts the bundle id in the request, and escapes characters that would change the query', () => {
    expect(appLookupPath('com.example.app')).toBe('/v1/apps?filter[bundleId]=com.example.app');
    expect(appLookupPath('a b&c=d')).toBe('/v1/apps?filter[bundleId]=a%20b%26c%3Dd');
  });
  it('passes when the app exists, and names both submit profiles for its Apple id', () => {
    const f = interpretAppLookup(200, { data: [{ id: '123456789' }] }, 'com.x.y');
    expect(f.level).toBe('PASS');
    expect(f.message).toContain('submit.testflight.ios.ascAppId');
    expect(f.message).toContain('submit.preview.ios.ascAppId');
    expect(f.message).toContain('123456789');
    expect(f.message).toMatch(/role.*not checked/);
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
  it('says "cannot be read" for a list that holds null or an app with no id, instead of a signing failure', () => {
    for (const data of [[null], [{}], [{ id: 5 }], [7]]) {
      const f = interpretAppLookup(200, { data }, 'com.x.y');
      expect(f.level).toBe('FAIL');
      expect(f.message).toMatch(/cannot be read/);
    }
  });
});

describe('signing keys, read like the preflight reads them', () => {
  it('ignores line and block comments', () => {
    expect(signingKeyIds("[\n  // { keyId: 'el-1', publicKey: 'x' },\n  /* { keyId: 'b' } */\n]")).toEqual([]);
    expect(signingKeyIds("[{ keyId: 'el-2026-10', publicKey: 'x' }, { keyId: \"el-2026-10-backup\", publicKey: 'y' }]")).toEqual(['el-2026-10', 'el-2026-10-backup']);
  });
});

describe('the repository wiring', () => {
  const key = (id: string) => `{ keyId: '${id}', publicKey: 'x' }`;
  const good = {
    appConfig: "owner: 'someone',\nextra: { eas: { projectId: '123e4567-e89b-12d3-a456-426614174000' } }",
    easJson: JSON.stringify({ submit: { testflight: { ios: { ascAppId: '1' } }, preview: { ios: { ascAppId: '2' } }, production: {} } }),
    keysTs: `[${key('a')}, ${key('a-backup')}]`,
  };
  const lvl = (f: ReturnType<typeof repoFindings>, text: string) => f.find((x) => x.message.includes(text))?.level;

  it('an alpha-ready repo has no FAIL, so the doctor can exit 0, and production is NOT NEEDED, not a failure', () => {
    const f = repoFindings(good);
    expect(f.filter((x) => x.level === 'FAIL')).toEqual([]);
    expect(lvl(f, 'submit.production')).toBe('NOT NEEDED');
  });
  it('fails each missing founder step, as develop is today (no production line fails)', () => {
    const f = repoFindings({ appConfig: 'export default {}', easJson: JSON.stringify({ submit: { production: {}, preview: {}, testflight: {} } }), keysTs: '[ ]' });
    // FAIL: the project id and the signing keys. WARN: the two ascAppId lines and the owner.
    expect(f.filter((x) => x.level === 'FAIL').length).toBe(2);
    expect(f.filter((x) => x.level === 'WARN').length).toBe(3);
    expect(repoFindings({ appConfig: 'export default {}', easJson: JSON.stringify({ submit: {} }), keysTs: '[ ]' }, true).filter((x) => x.level === 'FAIL').length).toBe(4);
    expect(lvl(f, 'submit.production')).toBe('NOT NEEDED');
  });
  it('a missing owner is a WARN, with or without --live: eas-cli 24.10.0 asks for it only below SDK 53, and this app is SDK 57', () => {
    const noOwner = { ...good, appConfig: "extra: { eas: { projectId: '123e4567-e89b-12d3-a456-426614174000' } }" };
    for (const live of [false, true]) {
      const owner = repoFindings(noOwner, live).find((x) => x.message.includes('`owner`'));
      expect(owner?.level).toBe('WARN');
      expect(owner?.message).toMatch(/SDK 53/);
      expect(owner?.message).toMatch(/must match the Expo account that owns the project/);
    }
    expect(repoFindings(noOwner).filter((x) => x.level === 'FAIL')).toEqual([]);
    expect(lvl(repoFindings(good), 'Expo owner')).toBe('PASS');
  });
  it('a missing project id says how to get one without committing it yourself', () => {
    const f = repoFindings({ ...good, appConfig: "owner: 'someone'" });
    const id = f.find((x) => x.message.includes('extra.eas.projectId'));
    expect(id?.level).toBe('FAIL');
    expect(id?.message).toMatch(/send the id/);
    expect(id?.message).not.toMatch(/commit the id/);
  });
  it('fails an ascAppId that is not numeric', () => {
    const f = repoFindings({ ...good, easJson: JSON.stringify({ submit: { testflight: { ios: { ascAppId: 'abc' } }, preview: { ios: { ascAppId: '2' } } } }) });
    expect(f.filter((x) => x.level === 'FAIL').map((x) => x.message)[0]).toContain('submit.testflight');
  });
  it('treats signing keys as the preflight does: none FAIL, one WARN, a repeated id FAIL, two PASS', () => {
    expect(lvl(repoFindings({ ...good, keysTs: '[]' }), 'keys.ts')).toBe('FAIL');
    expect(lvl(repoFindings({ ...good, keysTs: `[${key('a')}]` }), 'keys.ts')).toBe('WARN');
    expect(lvl(repoFindings({ ...good, keysTs: `[${key('a')}, ${key('a')}]` }), 'keys.ts')).toBe('FAIL');
    expect(lvl(repoFindings({ ...good, keysTs: `[${key('a')}, ${key('b')}]` }), 'keys.ts')).toBe('PASS');
  });
  it('fails, and does not throw, on broken eas.json', () => {
    expect(repoFindings({ ...good, easJson: '{' }).some((f) => f.level === 'FAIL' && /not valid JSON/.test(f.message))).toBe(true);
  });
});

describe('the Expo login', () => {
  it('is UNVERIFIED without a token, FAIL with --live, and does not run anything', () => {
    let ran = false;
    expect(checkExpo({}, false, () => { ran = true; }).level).toBe('UNVERIFIED');
    expect(checkExpo({}, true, () => { ran = true; }).level).toBe('FAIL');
    expect(ran).toBe(false);
  });
  it('passes when whoami succeeds', () => {
    expect(checkExpo({ EXPO_TOKEN: 'fictional-token-123456' }, false, () => {}).level).toBe('PASS');
  });
  it('keeps only the first line of an error and hides the token wherever it appears', () => {
    const f = checkExpo({ EXPO_TOKEN: 'fictional-token-123456' }, false, () => {
      throw new Error('Command failed: fictional-token-123456 whoami\nsecond line fictional-token-123456 stderr dump');
    });
    expect(f.level).toBe('FAIL');
    expect(f.message).not.toContain('fictional-token-123456');
    expect(f.message).not.toContain('second line');
    expect(f.message).toContain('Command failed');
  });
});

describe('the App Store Connect key', () => {
  const env = { ASC_API_KEY_ID: 'KEY1234567', ASC_API_ISSUER_ID: '11111111-2222-3333-4444-555555555555', ASC_API_KEY_P8_PATH: '/fictional/AuthKey_KEY1234567.p8' };
  const io = (over: Partial<Parameters<typeof checkApple>[2]> = {}) => ({
    readKey: () => pem,
    get: async () => ({ status: 200, body: { data: [{ id: '999' }] } }),
    nowSeconds: () => 1_800_000_000,
    ...over,
  });

  it('names the missing variables: UNVERIFIED, or FAIL with --live', async () => {
    const a = await checkApple({ ASC_API_KEY_ID: 'KEY1234567' }, false, io());
    expect(a[0].level).toBe('UNVERIFIED');
    expect(a[0].message).toContain('ASC_API_ISSUER_ID, ASC_API_KEY_P8_PATH are not set');
    expect((await checkApple({}, true, io()))[0].level).toBe('FAIL');
  });
  it('asks for the .preview record only, with a scoped bearer token, and passes', async () => {
    const seen: { url: string; token: string }[] = [];
    const out = await checkApple(env, false, io({ get: async (url, token) => { seen.push({ url, token }); return { status: 200, body: { data: [{ id: '999' }] } }; } }));
    expect(out.map((f) => f.level)).toEqual(['PASS']);
    expect(seen.length).toBe(1);
    expect(seen[0].url).toBe(`https://api.appstoreconnect.apple.com/v1/apps?filter[bundleId]=${PREVIEW_BUNDLE_ID}`);
    expect(decode(seen[0].token.split('.')[1]).scope).toEqual([`GET /v1/apps?filter[bundleId]=${PREVIEW_BUNDLE_ID}`]);
  });
  it('turns an unreadable key file, or a folder, into a clean FAIL that shows no path and does not throw', async () => {
    for (const message of ['EACCES: permission denied, open \'/fictional/AuthKey_KEY1234567.p8\'', 'EISDIR: illegal operation on a directory, read']) {
      const out = await checkApple(env, false, io({ readKey: () => { throw new Error(message); } }));
      expect(out.length).toBe(1);
      expect(out[0].level).toBe('FAIL');
      expect(out[0].message).toContain('could not be read');
      expect(out[0].message).not.toContain('AuthKey_');
      expect(out[0].message).not.toContain('/fictional');
    }
  });
  it('hides the bearer token, the key id, the issuer id and the key text when a request error echoes them', async () => {
    let sent = '';
    const out = await checkApple(env, false, io({
      get: async (_url, token) => {
        sent = token;
        throw new Error(`fetch failed: Authorization: Bearer ${token} kid=KEY1234567 iss=${env.ASC_API_ISSUER_ID}\nsecond line ${pem}`);
      },
    }));
    expect(out[0].level).toBe('FAIL');
    for (const secret of [sent, 'KEY1234567', env.ASC_API_ISSUER_ID, 'BEGIN PRIVATE KEY', 'second line']) expect(out[0].message).not.toContain(secret);
    expect(out[0].message).toContain('Could not sign or send');
  });
  it('hides the signed token itself when an error echoes it with no "Bearer " in front (the list, not the pattern, must catch it)', async () => {
    let sent = '';
    const out = await checkApple(env, false, io({
      get: async (_url, token) => {
        sent = token;
        throw new Error(`proxy said bad request for token ${token} and again ${token}`);
      },
    }));
    expect(sent.split('.').length).toBe(3);
    expect(out[0].level).toBe('FAIL');
    expect(out[0].message).not.toContain(sent);
    expect(out[0].message).not.toContain(sent.split('.')[1]);
    expect(out[0].message).toContain('[hidden]');
  });
  it('fails cleanly when the key text is not a key, and sends nothing', async () => {
    let sentAny = false;
    const out = await checkApple(env, false, io({ readKey: () => 'CANARY-KEY-CONTENT', get: async () => { sentAny = true; return { status: 200, body: {} }; } }));
    expect(out[0].level).toBe('FAIL');
    expect(out[0].message).not.toContain('CANARY-KEY-CONTENT');
    expect(sentAny).toBe(false);
  });
});

describe('output', () => {
  it('lists failures first, then warnings, unverified, not needed and passes, and counts each', () => {
    const out = render([
      { level: 'PASS', area: 'repo', message: 'a' },
      { level: 'NOT NEEDED', area: 'repo', message: 'n' },
      { level: 'FAIL', area: 'expo', message: 'b' },
      { level: 'UNVERIFIED', area: 'apple', message: 'c' },
      { level: 'WARN', area: 'repo', message: 'w' },
    ]);
    const at = (l: string) => out.indexOf(`${l.padEnd(10)} [`);
    expect(at('FAIL')).toBeLessThan(at('WARN'));
    expect(at('WARN')).toBeLessThan(at('UNVERIFIED'));
    expect(at('UNVERIFIED')).toBeLessThan(at('NOT NEEDED'));
    expect(at('NOT NEEDED')).toBeLessThan(at('PASS'));
    expect(out).toContain('1 pass, 1 warn, 1 unverified, 1 not needed, 1 fail.');
  });
  it('hides every occurrence of a secret, ignores short strings, and hides any bearer token', () => {
    expect(redact('bad token abcdef123456 and again abcdef123456', ['abcdef123456'])).toBe('bad token [hidden] and again [hidden]');
    expect(redact('abc stays', ['abc'])).toBe('abc stays');
    expect(redact('sent eyJhbGci.eyJpc3Mi.c2ln failed', ['eyJhbGci.eyJpc3Mi.c2ln'])).toBe('sent [hidden] failed');
    expect(redact('sent Authorization: Bearer eyJhbGci.eyJpc3Mi.c2ln failed', [])).toBe('sent Authorization: Bearer [hidden] failed');
  });
});
