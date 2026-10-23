/// <reference types="node" />
/**
 * Upload and host checks (docs/ops/PACKS_HOSTING.md), run by
 * `npm test -w @scribe/api`: the SigV4 arithmetic against the worked example
 * in AWS's own documentation, uploads against a local S3 stand-in (order,
 * headers, never overwrite, never delete, dry run), and `checkHosted` against
 * a served release. No network.
 */
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as http from 'node:http';
import type { AddressInfo } from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { base64ToBytes, generateSigningKey, signDocument, type DocumentKind, type TrustedKey } from '../../packages/api/src/index';
import { LANGUAGE_CODES } from '../../packages/core/src/lang/index';
import { PROMPTS } from '../../packages/content/src/prompts';
import { onboardingStories } from '../../packages/content/src/stories.en';
import { readSigningKey, uploadOrder, type ReleaseIndex } from './lib';
import { buildRelease, serveRelease } from './release';
import { canonicalUri, checkHosted, decideUpload, documentIdentity, EMPTY_SHA256, s3ConfigFromEnv, signV4, uploadRelease, type S3Config } from './s3';

const REPO = path.resolve(__dirname, '../..');
const BASE = 'https://packs.test';
const key = generateSigningKey();
const trusted: TrustedKey[] = [{ keyId: 'el-test', publicKey: key.publicKey, kinds: ['pack-manifest', 'remote-config', 'content-bundle'] }];
const signing = readSigningKey({ EL_SIGNING_KEY: key.secretKey, EL_SIGNING_KEY_ID: 'el-test' }, trusted);
const tmp = (label: string) => fs.mkdtempSync(path.join(os.tmpdir(), `el-s3-${label}-`));
const sha256Hex = (b: Buffer) => createHash('sha256').update(b).digest('hex');

describe('AWS Signature Version 4', () => {
  it('reproduces the signature in the AWS documentation example (GET iam ListUsers, 2015-08-30)', () => {
    const s = signV4({
      method: 'GET',
      path: '/',
      query: 'Action=ListUsers&Version=2010-05-08',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', Host: 'iam.amazonaws.com', 'X-Amz-Date': '20150830T123600Z' },
      payloadSha256: EMPTY_SHA256,
      amzDate: '20150830T123600Z',
      region: 'us-east-1',
      service: 'iam',
      accessKeyId: 'AKIDEXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
    });
    expect(s.signedHeaders).toBe('content-type;host;x-amz-date');
    expect(s.stringToSign.split('\n')[3]).toBe('f536975d06c0309214f805bb90ccff089219ecd68b2577efef23edd43b7e1a59');
    expect(s.signature).toBe('5d672d79c15b13162d9279b0855cfba6789a8edb4c82c400e06b5924a6f2b5d7');
    expect(s.authorization).toBe('AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20150830/us-east-1/iam/aws4_request, SignedHeaders=content-type;host;x-amz-date, Signature=5d672d79c15b13162d9279b0855cfba6789a8edb4c82c400e06b5924a6f2b5d7');
  });

  it('encodes object keys per segment, RFC 3986', () => {
    expect(canonicalUri('text-rules.es/1000000/es.rules.json')).toBe('/text-rules.es/1000000/es.rules.json');
    expect(canonicalUri("a b/c*(d)'!")).toBe("/a%20b/c%2A%28d%29%27%21");
  });

  it('reads the bucket settings from PACKS_S3_* and names what is missing', () => {
    expect(() => s3ConfigFromEnv({})).toThrow(/PACKS_S3_ENDPOINT, PACKS_S3_BUCKET, PACKS_S3_ACCESS_KEY_ID, PACKS_S3_SECRET_ACCESS_KEY/);
    const env = { PACKS_S3_ENDPOINT: 'https://abc.r2.cloudflarestorage.com/', PACKS_S3_BUCKET: 'early-letters-packs', PACKS_S3_ACCESS_KEY_ID: 'id', PACKS_S3_SECRET_ACCESS_KEY: 'secret' };
    expect(s3ConfigFromEnv(env)).toEqual({ endpoint: 'https://abc.r2.cloudflarestorage.com', bucket: 'early-letters-packs', accessKeyId: 'id', secretAccessKey: 'secret', region: 'auto' });
    expect(s3ConfigFromEnv({ ...env, PACKS_S3_REGION: 'eu-west-1' }).region).toBe('eu-west-1');
    expect(() => s3ConfigFromEnv({ ...env, PACKS_S3_ENDPOINT: 'https://abc.r2.cloudflarestorage.com/bucket' })).toThrow(/no bucket, no path/);
  });
});

/** An S3 stand-in: PUT stores, HEAD answers size, nothing else. Records every request and checks the signature headers. */
async function startFakeS3(cfg: Omit<S3Config, 'endpoint'>) {
  const objects = new Map<string, { body: Buffer; headers: Record<string, string> }>();
  const requests: { method: string; key: string }[] = [];
  const problems: string[] = [];
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://x');
    const [, bucket, ...rest] = url.pathname.split('/');
    const key = rest.map(decodeURIComponent).join('/');
    const method = req.method ?? '';
    requests.push({ method, key });
    if (bucket !== cfg.bucket) problems.push(`wrong bucket ${bucket}`);
    const auth = String(req.headers.authorization ?? '');
    const m = /^AWS4-HMAC-SHA256 Credential=([^/]+)\/(\d{8})\/([^/]+)\/s3\/aws4_request, SignedHeaders=([a-z0-9;-]+), Signature=[0-9a-f]{64}$/.exec(auth);
    if (!m) problems.push(`bad authorization header on ${method} ${key}`);
    else if (m[1] !== cfg.accessKeyId || m[3] !== cfg.region) problems.push(`wrong credential scope ${m[1]}/${m[3]}`);
    if (!/^\d{8}T\d{6}Z$/.test(String(req.headers['x-amz-date']))) problems.push('missing x-amz-date');
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      if (method === 'PUT') {
        if (String(req.headers['x-amz-content-sha256']) !== sha256Hex(body)) problems.push(`payload hash mismatch on ${key}`);
        if (String(req.headers['content-length']) !== String(body.length)) problems.push(`content-length mismatch on ${key}`);
        if (!m?.[4].split(';').includes('x-amz-content-sha256')) problems.push(`payload hash not signed on ${key}`);
        const meta = req.headers['x-amz-meta-sha256'];
        objects.set(key, { body, headers: { 'content-type': String(req.headers['content-type']), 'cache-control': String(req.headers['cache-control']), ...(meta ? { 'x-amz-meta-sha256': String(meta) } : {}) } });
        res.writeHead(200, { etag: `"${createHash('md5').update(body).digest('hex')}"` }).end();
      } else if (method === 'HEAD' || method === 'GET') {
        const o = objects.get(key);
        // Like S3 and R2: the ETag of a single-part object is the MD5 of its bytes.
        if (!o) res.writeHead(404).end();
        else res.writeHead(200, { 'content-length': String(o.body.length), etag: `"${createHash('md5').update(o.body).digest('hex')}"`, ...o.headers }).end(method === 'GET' ? o.body : undefined);
      } else {
        problems.push(`unexpected ${method} ${key}`);
        res.writeHead(405).end();
      }
    });
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', () => ok()));
  const port = (server.address() as AddressInfo).port;
  return { objects, requests, problems, endpoint: `http://127.0.0.1:${port}`, close: () => new Promise<void>((ok) => server.close(() => ok())) };
}

describe('upload to an S3-compatible bucket', () => {
  let out: string;
  let index: ReleaseIndex;
  let s3: Awaited<ReturnType<typeof startFakeS3>>;
  let cfg: S3Config;
  const creds = { bucket: 'early-letters-packs', accessKeyId: 'AKIDTEST', secretAccessKey: 'secret-test', region: 'auto' };

  beforeAll(async () => {
    out = tmp('release');
    const built = await buildRelease({
      root: REPO,
      out,
      baseUrl: BASE,
      minAppVersion: '1.0.0',
      key: signing,
      trusted,
      models: 'upstream',
      // Every language, so the upload below carries text packs; the English-only default is tested in release.test.ts.
      languages: LANGUAGE_CODES,
      previous: { manifest: 4, config: 2, content: 1 },
      content: { prompts: PROMPTS, stories: onboardingStories },
      remoteConfigSource: JSON.parse(fs.readFileSync(path.join(REPO, 'scripts/packs/remote-config.json'), 'utf8')),
      fetch: () => Promise.reject(new Error('no network')),
    });
    index = built.index;
    s3 = await startFakeS3(creds);
    cfg = { ...creds, endpoint: s3.endpoint };
  });
  afterAll(() => s3.close());

  it('a dry run sends nothing', async () => {
    const lines: string[] = [];
    const s = await uploadRelease(out, index, cfg, { dryRun: true, log: (l) => lines.push(l) });
    expect(s3.requests).toEqual([]);
    expect(s.uploaded).toHaveLength(index.files.length);
    expect(lines.every((l) => l.startsWith('would put'))).toBe(true);
  });

  it('puts every file with its content type and cache headers, packs first and the manifest last, signed and hashed', async () => {
    const s = await uploadRelease(out, index, cfg);
    expect(s3.problems).toEqual([]);
    expect(s.uploaded).toEqual(uploadOrder(index).map((f) => f.path));
    expect(s.skipped).toEqual([]);
    const puts = s3.requests.filter((r) => r.method === 'PUT').map((r) => r.key);
    expect(puts.at(-1)).toBe('functions/v1/config/v1/packs');
    expect(puts.slice(0, -3).every((k) => k.startsWith('text-rules.'))).toBe(true);
    // Documents change in place: every cache revalidates (DOCUMENT_CACHE, #126). Packs never change: immutable.
    const manifest = index.files.find((f) => f.document === 'pack-manifest')!;
    expect(s3.objects.get('functions/v1/config/v1/packs')?.headers).toEqual({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-cache', 'x-amz-meta-sha256': manifest.sha256 });
    const es = index.files.find((f) => f.id === 'text-rules.es')!;
    expect(s3.objects.get(es.path)?.headers).toEqual({ 'content-type': 'application/json', 'cache-control': 'public, max-age=31536000, immutable', 'x-amz-meta-sha256': es.sha256 });
    expect(s3.objects.get(es.path)?.body).toEqual(fs.readFileSync(path.join(out, es.path)));
    expect(s.bytesSent).toBe(index.files.reduce((n, f) => n + f.bytes, 0));
  });

  it('a second upload of the same release sends nothing: packs are there (HEAD, same size), documents identical (GET, same version and payload)', async () => {
    s3.requests.length = 0;
    const s = await uploadRelease(out, index, cfg);
    expect(s3.problems).toEqual([]);
    expect(s.uploaded).toEqual([]);
    expect(s.skipped).toHaveLength(index.files.length);
    expect(s3.requests.filter((r) => r.method === 'PUT')).toEqual([]);
    expect(s3.requests.filter((r) => r.method === 'GET').map((r) => r.key)).toEqual(['functions/v1/content/v1/bundle', 'functions/v1/config/v1/remote-config', 'functions/v1/config/v1/packs']);
  });

  it('[G-18] refuses to replace a live document with a different one under the same version, or with an older one', async () => {
    const manifestKey = 'functions/v1/config/v1/packs';
    const stored = s3.objects.get(manifestKey)!;
    const live = JSON.parse(stored.body.toString('utf8')) as { payload: { version: number; generatedAt: string } };
    const put = (payload: unknown) => s3.objects.set(manifestKey, { ...stored, body: Buffer.from(JSON.stringify({ ...live, payload })) });
    s3.requests.length = 0;
    try {
      // Same version, different content: what an uncommitted published.ts followed by a rebuild produces.
      put({ ...live.payload, generatedAt: '2026-10-16T00:00:00.000Z' });
      await expect(uploadRelease(out, index, cfg)).rejects.toThrow(/already serves v5 with different content.*same_version_conflict.*Commit supabase\/functions/);
      // The host is ahead of this release.
      put({ ...live.payload, version: 9 });
      await expect(uploadRelease(out, index, cfg)).rejects.toThrow(/already serves v9, newer than.*rollback/);
      // Nothing was written: the other documents were unchanged and the manifest was refused before its PUT.
      expect(s3.requests.filter((r) => r.method === 'PUT')).toEqual([]);
    } finally {
      s3.objects.set(manifestKey, stored);
    }
    expect(decideUpload(null, stored.body.toString('utf8'))).toBe('accept');
    expect(decideUpload(stored.body.toString('utf8'), stored.body.toString('utf8'))).toBe('unchanged');
    expect(documentIdentity('not json')).toBeNull();
  });

  it('never overwrites a versioned path with different bytes, and refuses a file that changed after the build', async () => {
    const es = index.files.find((f) => f.id === 'text-rules.es')!;
    const stored = s3.objects.get(es.path)!;
    expect(stored.headers['x-amz-meta-sha256']).toBe(es.sha256);
    // A different size.
    s3.objects.set(es.path, { ...stored, body: Buffer.concat([stored.body, Buffer.from(' ')]) });
    await expect(uploadRelease(out, index, cfg)).rejects.toThrow(/already on the host with different bytes \(\d+ bytes on the host, \d+ in this release\).*bump the pack version/);
    // The same size, different bytes: caught by the SHA-256 metadata.
    const flipped = Buffer.from(stored.body);
    flipped[5] ^= 1;
    s3.objects.set(es.path, { ...stored, body: flipped, headers: { ...stored.headers, 'x-amz-meta-sha256': sha256Hex(flipped) } });
    await expect(uploadRelease(out, index, cfg)).rejects.toThrow(/different bytes \(SHA-256 .* on the host\)/);
    // Uploaded earlier by another tool (no metadata): the MD5 ETag decides, both ways.
    const { 'x-amz-meta-sha256': _meta, ...noMeta } = stored.headers;
    s3.objects.set(es.path, { body: flipped, headers: noMeta });
    await expect(uploadRelease(out, index, cfg)).rejects.toThrow(/different bytes \(MD5 .* on the host\)/);
    s3.objects.set(es.path, { body: stored.body, headers: noMeta });
    const lines: string[] = [];
    await uploadRelease(out, index, cfg, { log: (l) => lines.push(l) });
    expect(lines).toContain(`skip   ${es.path} (already on the host, same MD5 (ETag))`);
    s3.objects.set(es.path, stored);
    const file = path.join(out, es.path);
    const original = fs.readFileSync(file);
    fs.writeFileSync(file, Buffer.concat([original, Buffer.from('\n')]));
    try {
      await expect(uploadRelease(out, index, cfg)).rejects.toThrow(/changed since release.json was written/);
    } finally {
      fs.writeFileSync(file, original);
    }
    expect(s3.requests.some((r) => r.method === 'DELETE')).toBe(false);
  });

  describe('checkHosted (what a phone will see)', () => {
    let served: Awaited<ReturnType<typeof serveRelease>>;
    /** Our host maps to the local server; the Hugging Face URLs of the upstream models answer like a CDN would, without the network. */
    const fetchFn: typeof fetch = async (input, init) => {
      const url = String(input);
      if (url.startsWith(BASE)) return fetch(url.replace(BASE, served.url), init);
      const m = index.notIncluded.find((n) => n.url === url);
      if (!m) return new Response('not found', { status: 404 });
      const range = new Headers(init?.headers).get('range');
      return new Response(range ? 'x'.repeat(16) : null, { status: range ? 206 : 200, headers: { 'content-length': String(range ? 16 : m.bytes), 'accept-ranges': 'bytes' } });
    };
    beforeAll(async () => {
      served = await serveRelease(out);
    });
    afterAll(() => served.close());

    it('passes for a complete release signed by a trusted key', async () => {
      const r = await checkHosted(BASE, trusted, fetchFn);
      expect(r.lines.filter((l) => !l.startsWith('ok'))).toEqual([]);
      expect(r.ok).toBe(true);
      expect(r.manifestVersion).toBe(5);
      expect(r.packs).toHaveLength(index.files.filter((f) => f.kind === 'pack').length + index.notIncluded.length);
      expect(r.packs.every((p) => p.ok)).toBe(true);
      expect(r.lines[0]).toMatch(/^ok {3}pack-manifest: signed by el-test/);
      expect(r.lines.some((l) => /speech-model.whisper-large-v3-turbo-q5_0 v1: 574041195 bytes, Range supported \(huggingface.co\)/.test(l))).toBe(true);
      expect(r.lines.some((l) => /^ok {3}text-rules.es v\d+: \d+ bytes, SHA-256 matches, Range supported \(packs.test\)/.test(l))).toBe(true);
    });

    it('fails when the app would not trust the key, when a pack is missing, and when the manifest is not there', async () => {
      const other = generateSigningKey();
      const wrong = await checkHosted(BASE, [{ keyId: 'el-test', publicKey: other.publicKey, kinds: ['pack-manifest'] }], fetchFn);
      expect(wrong.ok).toBe(false);
      expect(wrong.lines[0]).toMatch(/^FAIL pack-manifest: signature check failed \(bad_signature\)/);
      const es = index.files.find((f) => f.id === 'text-rules.es')!;
      const file = path.join(out, es.path);
      const original = fs.readFileSync(file);
      fs.rmSync(file);
      try {
        const missing = await checkHosted(BASE, trusted, fetchFn);
        expect(missing.ok).toBe(false);
        expect(missing.lines).toContain(`FAIL text-rules.es v${es.version}: HEAD ${BASE}/${es.path} answered HTTP 404`);
        // The right size but the wrong bytes (a stale cache, a hand upload): phones would refuse it, so verify does too.
        const flipped = Buffer.from(original);
        flipped[5] ^= 1;
        fs.writeFileSync(file, flipped);
        const wrongBytes = await checkHosted(BASE, trusted, fetchFn);
        expect(wrongBytes.ok).toBe(false);
        expect(wrongBytes.lines).toContain(`FAIL text-rules.es v${es.version}: ${BASE}/${es.path} serves bytes whose SHA-256 is not the manifest's; phones would refuse it (hash_mismatch)`);
      } finally {
        fs.writeFileSync(file, original);
      }
      const nothing = await checkHosted('https://nothing.test', trusted, async () => new Response('', { status: 404 }));
      expect(nothing.ok).toBe(false);
      expect(nothing.lines[0]).toMatch(/^FAIL pack-manifest: .* answered HTTP 404/);
    });
  });
});

describe('checkHosted accepts a document only as the app does (review A of #162, finding 6)', () => {
  const secret = base64ToBytes(key.secretKey)!;
  const at = '2026-10-16T00:00:00.000Z';
  const PATHS: Record<DocumentKind, string> = { 'pack-manifest': 'functions/v1/config/v1/packs', 'remote-config': 'functions/v1/config/v1/remote-config', 'content-bundle': 'functions/v1/content/v1/bundle' };
  const manifest = (version: number, packs: unknown[] = []) => ({ schemaVersion: 1, version, generatedAt: at, packs });
  const config = (over: Record<string, unknown> = {}) => ({ schemaVersion: 1, version: 3, generatedAt: at, ...over });
  const bundle = (blocks: unknown[]) => ({ schemaVersion: 1, version: 2, generatedAt: at, locale: 'en', blocks });
  /** A host serving exactly these signed documents, and pack files by URL and size. */
  const host = (docs: Partial<Record<DocumentKind, unknown>>, files: Record<string, number> = {}): typeof fetch => async (input, init) => {
    const url = String(input).replace(/\?.*$/, '');
    const kind = (Object.keys(docs) as DocumentKind[]).find((k) => url === `${BASE}/${PATHS[k]}`);
    if (kind) return new Response(JSON.stringify(signDocument(kind, docs[kind], secret, 'el-test')), { status: 200, headers: { 'content-type': 'application/json', etag: '"x"' } });
    const size = files[url];
    if (size === undefined) return new Response('', { status: 404 });
    const range = new Headers(init?.headers).get('range');
    return new Response(init?.method === 'HEAD' ? null : 'x'.repeat(range ? 16 : size), { status: range ? 206 : 200, headers: { 'content-length': String(range ? 16 : size) } });
  };

  it('fails a signed remote config or content bundle that the app would drop', async () => {
    const r = await checkHosted(BASE, trusted, host({ 'pack-manifest': manifest(1), 'remote-config': { schemaVersion: 2, version: 3 }, 'content-bundle': { schemaVersion: 1, version: 'two' } }));
    expect(r.ok).toBe(false);
    expect(r.lines).toContain('FAIL remote-config: the payload does not match the RemoteConfig schema; the app drops it and keeps its bundled defaults (kill switches included)');
    expect(r.lines).toContain('FAIL content-bundle: the payload does not match the ContentBundle schema; the app drops it and shows its packaged copy');
  });

  it('warns about values the app ignores or replaces, and blocks it skips', async () => {
    const r = await checkHosted(
      BASE,
      trusted,
      host({
        'pack-manifest': manifest(1),
        'remote-config': config({ readTogetherFreeSessions: -1, killSwitches: { packDownloads: true, recording: true } }),
        'content-bundle': bundle([{ type: 'tip', id: 'calm', placement: 'book', body: 'Bad \u2014 dash' }, { type: 'nope' }]),
      }),
    );
    expect(r.ok).toBe(true);
    expect(r.lines.find((l) => l.startsWith('WARN remote-config: the app ignores or replaces'))).toMatch(/\$\.readTogetherFreeSessions.*\$\.killSwitches\.recording/);
    expect(r.lines).toContain('ok   remote-config v3: kill switches on: packDownloads');
    expect(r.lines).toContain('WARN content-bundle: 2 blocks the app would skip (unknown type, bad fields or a content rule); those slots fall back to the packaged copy');
  });

  it('compares the live versions with the ones committed in published.ts (rollback protection)', async () => {
    const docs = host({ 'pack-manifest': manifest(4), 'remote-config': config(), 'content-bundle': bundle([]) });
    const behind = await checkHosted(BASE, trusted, docs, { 'pack-manifest': 5, 'remote-config': 3, 'content-bundle': 2 });
    expect(behind.lines).toContain('WARN pack-manifest: the host serves v4, but published.ts says v5 was published. A phone that has v5 refuses v4 as a rollback; upload the latest release.');
    const ahead = await checkHosted(BASE, trusted, docs, { 'pack-manifest': 3 });
    expect(ahead.lines.some((l) => /^WARN pack-manifest: the host serves v4, newer than published.ts \(v3\)/.test(l))).toBe(true);
    const same = await checkHosted(BASE, trusted, docs, { 'pack-manifest': 4, 'remote-config': 3, 'content-bundle': 2 });
    expect(same.lines.filter((l) => l.startsWith('WARN'))).toEqual([]);
  });

  it('checks every mirror for the listed size', async () => {
    const entry = { id: 'speech-model.whisper-small-q5_1', kind: 'speech-model', language: 'mul', version: 1, url: `${BASE}/m/1/ggml-small-q5_1.bin`, mirrors: ['https://mirror-a.test/m.bin', 'https://mirror-b.test/m.bin'], bytes: 6_000_000, sha256: 'a'.repeat(64), fileName: 'ggml-small-q5_1.bin', minAppVersion: '1.0.0', required: false };
    const r = await checkHosted(BASE, trusted, host({ 'pack-manifest': manifest(1, [entry]) }, { [entry.url]: 6_000_000, 'https://mirror-a.test/m.bin': 6_000_000, 'https://mirror-b.test/m.bin': 5 }));
    expect(r.lines).toContain('ok   speech-model.whisper-small-q5_1 v1: mirror mirror-a.test has 6000000 bytes');
    expect(r.lines).toContain('WARN speech-model.whisper-small-q5_1 v1: mirror https://mirror-b.test/m.bin has 5 bytes, manifest says 6000000');
  });
});
