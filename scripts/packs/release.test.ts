/// <reference types="node" />
/**
 * The static release, end to end (docs/ops/PACKS_HOSTING.md), run by
 * `npm test -w @scribe/api` (vitest.consumers.config.ts):
 *
 *  1. keygen.mjs (plain node:crypto) makes a key the app's verifier accepts;
 *  2. `buildRelease` with a throwaway key writes the manifest at the path the
 *     app requests, every text-rules pack from packs/, and the speech models
 *     fetched from a (local) upstream and checked against the catalog hash;
 *  3. served by `serveRelease`, the app's own `SignedDocumentClient` fetches
 *     and verifies the manifest and lists the languages with their real
 *     sizes, and the app's own `PackManager` downloads, verifies and installs
 *     a pack through Range requests;
 *  4. a tampered manifest, a tampered pack and an app with no trusted key all
 *     fail closed.
 *
 * Nothing here touches the network or the repo: temp directories only.
 */
import { spawn, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  base64ToBytes,
  ENDPOINTS,
  generateSigningKey,
  KEY_ID_RE,
  parsePackManifest,
  publicKeyFor,
  requiredPacksForLanguage,
  resolvePack,
  signDocument,
  verifySignedDocument,
  type PackManifest,
  type TrustedKey,
} from '../../packages/api/src/index';
import { textRulesPackId } from '../../packages/core/src/lang/languages';
import { LANGUAGE_CODES } from '../../packages/core/src/lang/index';
import { PROMPTS } from '../../packages/content/src/prompts';
import { onboardingStories } from '../../packages/content/src/stories.en';
import { SPEECH_MODELS, type SpeechModel } from '../../apps/mobile/src/lib/models/catalog';
import { SignedDocumentClient, type DocHttp } from '../../apps/mobile/src/lib/remote/documents';
import { PackManager } from '../../apps/mobile/src/lib/packs/engine';
import { bytesOf, FakeNetwork, LocalHttp, MemoryKv, NodeFs, sha256, tempRoot } from '../../apps/mobile/src/lib/packs/__tests__/node-ports';
import { documentObjects, languagesNotAllowed, manifestLanguages, parseKeyFile, parseLanguages, readSigningKey, RELEASE_DOCUMENTS, speechFilePlan, uploadOrder, type ReleaseIndex } from './lib';
import { buildRelease, fetchVerified, serveRelease, sha256File, type BuildReleaseOptions } from './release';

const REPO = path.resolve(__dirname, '../..');
const KEYGEN = path.join(REPO, 'scripts/packs/keygen.mjs');
const KINDS: TrustedKey['kinds'] = ['pack-manifest', 'remote-config', 'content-bundle'];
const BASE = 'https://packs.test';
const UPSTREAM = 'https://upstream.test';
const LANGUAGES = ['ar', 'es', 'fr', 'hi', 'pt', 'zh'] as const;

const key = generateSigningKey();
const trusted: TrustedKey[] = [{ keyId: 'el-test', publicKey: key.publicKey, kinds: KINDS }];
const signing = readSigningKey({ EL_SIGNING_KEY: key.secretKey, EL_SIGNING_KEY_ID: 'el-test' }, trusted);
const content = { prompts: PROMPTS, stories: onboardingStories };
const remoteConfigSource = JSON.parse(fs.readFileSync(path.join(REPO, 'scripts/packs/remote-config.json'), 'utf8')) as unknown;
const instantSleep = async (_ms: number, signal: AbortSignal) => {
  if (signal.aborted) throw Object.assign(new Error('aborted'), { name: 'AbortError' });
};
const tmp = (label: string) => fs.mkdtempSync(path.join(os.tmpdir(), `el-release-${label}-`));

/** A small stand-in for the speech catalog: two upstream models and one we built, with the real ids and file names. */
const FAKE = {
  vad: bytesOf(2_000, 1),
  small: bytesOf(50_000, 2),
  hindi: bytesOf(3_000, 3),
};
function fakeCatalog(): Record<string, SpeechModel> {
  const vad = SPEECH_MODELS['speech-model.silero-vad-v6.2.0'];
  const small = SPEECH_MODELS['speech-model.whisper-small-q5_1'];
  const hindi = SPEECH_MODELS['speech-model.whisper-hindi-small-q5_1'];
  return {
    [vad.id]: { ...vad, url: `${UPSTREAM}/vad/${vad.fileName}`, bytes: FAKE.vad.length, sha256: sha256(FAKE.vad) },
    [small.id]: { ...small, url: `${UPSTREAM}/small/${small.fileName}`, bytes: FAKE.small.length, sha256: sha256(FAKE.small) },
    [hindi.id]: { ...hindi, url: `${BASE}/speech/whisper-hindi-small/fb4a24af/${hindi.fileName}`, bytes: FAKE.hindi.length, sha256: sha256(FAKE.hindi) },
  };
}

/** `fetch` that maps the fake https hosts to local servers (our schema accepts https only). */
function mappedFetch(map: Record<string, string>): typeof fetch {
  return (input, init) => {
    let url = String(input);
    for (const [from, to] of Object.entries(map)) url = url.replace(from, to);
    return fetch(url, init);
  };
}

describe('keygen.mjs', () => {
  it('prints nothing secret to a pipe, a file or CI unless --to-pipe is given on purpose', () => {
    // spawnSync's stdout is a pipe, as it is for `keygen.mjs > file`, a CI log or an agent transcript.
    for (const env of [{ ...process.env, CI: '' }, { ...process.env, CI: 'true' }]) {
      const r = spawnSync(process.execPath, [KEYGEN, 'el-2026-10'], { encoding: 'utf8', env });
      expect(r.status).toBe(3);
      expect(r.stdout).toBe('');
      expect(r.stderr).toMatch(/Refusing to print a signing key/);
    }
  });

  it('gives the cold backup its own key id and its own storage advice, so two runs in one month never share an id (review A of #162, N5)', () => {
    const month = new Date().toISOString().slice(0, 7);
    const primary = spawnSync(process.execPath, [KEYGEN, '--to-pipe'], { encoding: 'utf8' });
    const backup = spawnSync(process.execPath, [KEYGEN, '--backup', '--to-pipe'], { encoding: 'utf8' });
    expect([primary.status, backup.status]).toEqual([0, 0]);
    expect(parseKeyFile(primary.stdout).EL_SIGNING_KEY_ID).toBe(`el-${month}`);
    expect(parseKeyFile(backup.stdout).EL_SIGNING_KEY_ID).toBe(`el-${month}-backup`);
    expect(primary.stdout).toMatch(/--key-file <path>/);
    expect(backup.stdout).toContain('This is the cold backup.');
    expect(backup.stdout).toContain('never in signing.env');
    expect(backup.stdout).not.toMatch(/--key-file <path>/);
    expect(parseKeyFile(primary.stdout).EL_SIGNING_KEY).not.toBe(parseKeyFile(backup.stdout).EL_SIGNING_KEY);
  });

  it('makes a key with plain Node that the app verifier accepts, and prints the secret once, to stdout only', () => {
    const r = spawnSync(process.execPath, [KEYGEN, 'el-2026-10', '--to-pipe'], { encoding: 'utf8' });
    expect(r.status).toBe(0);
    expect(r.stderr).toBe('');
    const pub = /publicKey: '([A-Za-z0-9+/=]{44})'/.exec(r.stdout)?.[1];
    expect(pub).toBeTruthy();
    expect(r.stdout).toContain("kinds: ['pack-manifest', 'remote-config', 'content-bundle']");
    // The password-manager block is exactly what --key-file reads back.
    const env = parseKeyFile(r.stdout);
    expect(env.EL_SIGNING_KEY_ID).toBe('el-2026-10');
    const secret = base64ToBytes(env.EL_SIGNING_KEY ?? '');
    expect(secret?.length).toBe(32);
    expect(publicKeyFor(secret!)).toBe(pub);
    const t: TrustedKey[] = [{ keyId: 'el-2026-10', publicKey: pub!, kinds: KINDS }];
    const k = readSigningKey(env, t);
    const doc = signDocument('pack-manifest', { schemaVersion: 1, version: 1, generatedAt: '2026-10-15T00:00:00.000Z', packs: [] }, k.secret, k.keyId);
    expect(verifySignedDocument(JSON.parse(JSON.stringify(doc)), 'pack-manifest', t).ok).toBe(true);
    expect(verifySignedDocument(doc, 'pack-manifest', trusted)).toEqual({ ok: false, reason: 'unknown_key' });
  });

  it('refuses a bad key id and keeps the same rule as packages/api', () => {
    const r = spawnSync(process.execPath, [KEYGEN, 'Bad Id', '--to-pipe'], { encoding: 'utf8' });
    expect(r.status).toBe(2);
    expect(r.stdout).toBe('');
    expect(fs.readFileSync(KEYGEN, 'utf8')).toContain(`KEY_ID_RE = ${KEY_ID_RE.toString()}`);
  });

  it('parses a key file with exports, quotes and comments; a key the app does not trust is refused', () => {
    const env = parseKeyFile(`# signing key\nexport EL_SIGNING_KEY_ID="el-test"\nEL_SIGNING_KEY='${key.secretKey}'\n`);
    expect(readSigningKey(env, trusted).keyId).toBe('el-test');
    expect(() => readSigningKey(env, [])).toThrow(/not in packages/);
    expect(() => readSigningKey({}, trusted)).toThrow(/--key-file/);
  });
});

describe('release directory', () => {
  let upstream: Awaited<ReturnType<typeof serveRelease>>;
  let served: Awaited<ReturnType<typeof serveRelease>>;
  let out: string;
  let modelsDir: string;
  let index: ReleaseIndex;
  let manifestText: string;
  const log: string[] = [];

  const options = (over: Partial<BuildReleaseOptions> = {}): BuildReleaseOptions => ({
    root: REPO,
    out,
    baseUrl: BASE,
    minAppVersion: '1.0.0',
    key: signing,
    trusted,
    models: 'download',
    // Every language, so the release below holds every pack; the English-only default has its own tests.
    languages: LANGUAGE_CODES,
    modelsDir,
    includeModels: ['speech-model.whisper-hindi-small-q5_1'],
    catalog: fakeCatalog(),
    previous: { manifest: 0, config: 0, content: 0 },
    content,
    remoteConfigSource,
    fetch: mappedFetch({ [UPSTREAM]: upstream.url }),
    now: () => new Date('2026-10-15T00:00:00.000Z'),
    log: (l) => log.push(l),
    ...over,
  });

  beforeAll(async () => {
    const upstreamDir = tmp('upstream');
    fs.mkdirSync(path.join(upstreamDir, 'vad'), { recursive: true });
    fs.mkdirSync(path.join(upstreamDir, 'small'), { recursive: true });
    fs.writeFileSync(path.join(upstreamDir, 'vad/ggml-silero-v6.2.0.bin'), FAKE.vad);
    fs.writeFileSync(path.join(upstreamDir, 'small/ggml-small-q5_1.bin'), FAKE.small);
    upstream = await serveRelease(upstreamDir);
    modelsDir = tmp('models');
    fs.writeFileSync(path.join(modelsDir, 'ggml-whisper-hindi-small-q5_1.bin'), FAKE.hindi);
    out = tmp('out');
    const built = await buildRelease(options());
    index = built.index;
    manifestText = built.documents['pack-manifest'];
    served = await serveRelease(out);
  });

  afterAll(async () => {
    await upstream.close();
    await served.close();
  });

  it('puts the signed documents at the exact paths the app requests under EXPO_PUBLIC_DOCS_BASE_URL', () => {
    expect(RELEASE_DOCUMENTS['pack-manifest'].path).toBe(ENDPOINTS.packManifest.path.slice(1));
    expect(RELEASE_DOCUMENTS['remote-config'].path).toBe(ENDPOINTS.remoteConfig.path.slice(1));
    expect(RELEASE_DOCUMENTS['content-bundle'].path).toBe(ENDPOINTS.contentBundle.path.slice(1));
    for (const kind of ['pack-manifest', 'remote-config', 'content-bundle'] as const) {
      const text = fs.readFileSync(path.join(out, RELEASE_DOCUMENTS[kind].path), 'utf8');
      expect(verifySignedDocument(JSON.parse(text), kind, trusted).ok).toBe(true);
    }
    expect(fs.readFileSync(path.join(out, 'functions/v1/config/v1/packs'), 'utf8')).toBe(manifestText);
  });

  it('holds every language pack, every model (downloaded or copied, hash-checked) and an index that matches the bytes on disk', async () => {
    const packs = index.files.filter((f) => f.kind === 'pack');
    expect(packs.map((f) => f.id).sort()).toEqual([...LANGUAGES.map((l) => `text-rules.${l}`), 'speech-model.silero-vad-v6.2.0', 'speech-model.whisper-hindi-small-q5_1', 'speech-model.whisper-small-q5_1'].sort());
    expect(index.files).toHaveLength(LANGUAGES.length + 3 + 3);
    expect(index.notIncluded).toEqual([]);
    for (const f of index.files) {
      const p = path.join(out, f.path);
      expect(fs.statSync(p).size, f.path).toBe(f.bytes);
      expect(await sha256File(p), f.path).toBe(f.sha256);
    }
    expect(index.files.find((f) => f.id === 'speech-model.silero-vad-v6.2.0')).toMatchObject({ path: 'speech-model.silero-vad-v6.2.0/1/ggml-silero-v6.2.0.bin', origin: 'downloaded', source: `${UPSTREAM}/vad/ggml-silero-v6.2.0.bin`, cacheControl: 'public, max-age=31536000, immutable', contentType: 'application/octet-stream' });
    expect(index.files.find((f) => f.id === 'speech-model.whisper-hindi-small-q5_1')).toMatchObject({ path: 'speech/whisper-hindi-small/fb4a24af/ggml-whisper-hindi-small-q5_1.bin', origin: 'copied' });
    expect(index.files.find((f) => f.id === 'text-rules.es')).toMatchObject({ path: expect.stringMatching(/^text-rules\.es\/\d+\/es\.rules\.json$/), origin: 'built', contentType: 'application/json' });
    expect(index.files.find((f) => f.document === 'pack-manifest')).toMatchObject({ path: 'functions/v1/config/v1/packs', cacheControl: 'no-cache', contentType: 'application/json; charset=utf-8' });
    // The static-host fallback gets the same headers per file, and is not itself part of the release index.
    const vercel = JSON.parse(fs.readFileSync(path.join(out, 'vercel.json'), 'utf8')) as { headers: { source: string; headers: { key: string; value: string }[] }[] };
    expect(vercel.headers).toHaveLength(index.files.length);
    expect(vercel.headers.find((h) => h.source === '/functions/v1/config/v1/packs')?.headers).toEqual([
      { key: 'Content-Type', value: 'application/json; charset=utf-8' },
      { key: 'Cache-Control', value: 'no-cache' },
    ]);
    expect(index.files.some((f) => f.path === 'vercel.json' || f.path === 'release.json')).toBe(false);
    // One rule for where documents live: the same keys as #126's `documentObjects` (used by `publish.ts all`).
    expect(Object.values(RELEASE_DOCUMENTS).map((d) => d.path).sort()).toEqual(documentObjects({ remoteConfig: 'x', packManifest: 'x', contentEn: 'x' }).map((o) => o.objectKey).sort());
  });

  it('[ADR-0016] the manifest points models at our host with the pinned upstream as mirror, and text packs at their immutable paths', () => {
    const verified = verifySignedDocument(JSON.parse(manifestText), 'pack-manifest', trusted);
    expect(verified.ok).toBe(true);
    const parsed = parsePackManifest(verified.ok ? verified.doc.payload : null);
    expect(parsed.ok && parsed.skipped).toBe(0);
    const m = parsed.ok ? parsed.value : null;
    expect(m?.version).toBe(1);
    expect(resolvePack(m!, 'speech-model.silero-vad-v6.2.0', '1.0.0')).toMatchObject({ url: `${BASE}/speech-model.silero-vad-v6.2.0/1/ggml-silero-v6.2.0.bin`, mirrors: [`${UPSTREAM}/vad/ggml-silero-v6.2.0.bin`], bytes: FAKE.vad.length, required: false });
    expect(resolvePack(m!, 'speech-model.whisper-hindi-small-q5_1', '1.0.0')).toMatchObject({ url: `${BASE}/speech/whisper-hindi-small/fb4a24af/ggml-whisper-hindi-small-q5_1.bin`, mirrors: [], bytes: FAKE.hindi.length });
    const es = resolvePack(m!, textRulesPackId('es'), '1.0.0');
    expect(es).toMatchObject({ url: expect.stringMatching(new RegExp(`^${BASE}/text-rules\\.es/\\d+/es\\.rules\\.json$`)), required: true, language: 'es' });
    expect(requiredPacksForLanguage(m!, 'pt', '1.0.0').map((p) => p.id)).toEqual(['text-rules.pt']);
  });

  it('is idempotent: a second build re-uses the verified model files instead of fetching them again', async () => {
    log.length = 0;
    const again = await buildRelease(options({ previous: { manifest: 1, config: 1, content: 1 } }));
    expect(again.manifest.version).toBe(2);
    expect(log.filter((l) => /already in the release, verified/.test(l))).toHaveLength(3);
    expect(log.some((l) => /downloading/.test(l))).toBe(false);
    // Restore the v1 release for the tests below.
    await buildRelease(options());
  });

  it('resumes an interrupted model download and refuses bytes that do not match the catalog', async () => {
    const dir = tmp('resume');
    const dest = path.join(dir, 'ggml-small-q5_1.bin');
    const f = mappedFetch({ [UPSTREAM]: upstream.url });
    fs.writeFileSync(`${dest}.part`, FAKE.small.subarray(0, 20_000));
    const lines: string[] = [];
    expect(await fetchVerified(`${UPSTREAM}/small/ggml-small-q5_1.bin`, dest, { bytes: FAKE.small.length, sha256: sha256(FAKE.small) }, f, (l) => lines.push(l))).toBe('downloaded');
    expect(lines[0]).toMatch(/^resuming .* \(20000 of 50000 bytes\)/);
    expect(await sha256File(dest)).toBe(sha256(FAKE.small));
    expect(await fetchVerified(`${UPSTREAM}/small/ggml-small-q5_1.bin`, dest, { bytes: FAKE.small.length, sha256: sha256(FAKE.small) }, f)).toBe('present');
    await expect(fetchVerified(`${UPSTREAM}/small/ggml-small-q5_1.bin`, path.join(dir, 'wrong.bin'), { bytes: FAKE.small.length, sha256: sha256(FAKE.vad) }, f)).rejects.toThrow(/SHA-256 .* does not match/);
    expect(fs.existsSync(path.join(dir, 'wrong.bin'))).toBe(false);
    await expect(fetchVerified(`${UPSTREAM}/missing.bin`, path.join(dir, 'm.bin'), { bytes: 1, sha256: sha256(FAKE.vad) }, f)).rejects.toThrow(/HTTP 404/);
  });

  it('with --models upstream the real catalog is listed as today: three hosted models on Hugging Face with their real sizes, none downloaded', async () => {
    const dir = tmp('upstream-mode');
    const built = await buildRelease(options({ out: dir, models: 'upstream', catalog: undefined, includeModels: [], fetch: () => Promise.reject(new Error('no network in this test')) }));
    const ids = built.manifest.packs.filter((p) => p.kind === 'speech-model');
    expect(ids.map((p) => [p.id, p.bytes, new URL(p.url).host, p.mirrors.length])).toEqual([
      ['speech-model.silero-vad-v6.2.0', 885_098, 'huggingface.co', 0],
      ['speech-model.whisper-large-v3-turbo-q5_0', 574_041_195, 'huggingface.co', 0],
      ['speech-model.whisper-small-q5_1', 190_085_487, 'huggingface.co', 0],
    ]);
    expect(built.index.notIncluded.map((n) => n.id)).toEqual(ids.map((p) => p.id));
    expect(built.index.files.filter((f) => f.kind === 'pack')).toHaveLength(LANGUAGES.length);
    expect(speechFilePlan(BASE).map((p) => p.objectKey)).toEqual([
      'speech-model.silero-vad-v6.2.0/1/ggml-silero-v6.2.0.bin',
      'speech-model.whisper-large-v3-turbo-q5_0/1/ggml-large-v3-turbo-q5_0.bin',
      'speech-model.whisper-small-q5_1/1/ggml-small-q5_1.bin',
    ]);
  });

  it('a model that cannot be fetched stays on its upstream URL (or fails the build with --strict-models); a built model needs its file', async () => {
    const dir = tmp('nonet');
    const offline: typeof fetch = () => Promise.reject(new Error('ENOTFOUND upstream.test'));
    const built = await buildRelease(options({ out: dir, modelsDir: null, includeModels: [], fetch: offline }));
    expect(built.index.notIncluded.map((n) => [n.id, n.url])).toEqual([
      ['speech-model.silero-vad-v6.2.0', `${UPSTREAM}/vad/ggml-silero-v6.2.0.bin`],
      ['speech-model.whisper-small-q5_1', `${UPSTREAM}/small/ggml-small-q5_1.bin`],
    ]);
    expect(log.some((l) => /^WARN speech-model.silero-vad-v6.2.0: .*ENOTFOUND/.test(l))).toBe(true);
    // Nothing half-made is left for a static host to serve: no empty model folders.
    expect(fs.readdirSync(dir).filter((n) => n.startsWith('speech-model.'))).toEqual([]);
    await expect(buildRelease(options({ out: tmp('strict'), modelsDir: null, includeModels: [], fetch: offline, strictModels: true }))).rejects.toThrow(/ENOTFOUND/);
    await expect(buildRelease(options({ out: tmp('nofile'), modelsDir: null }))).rejects.toThrow(/put ggml-whisper-hindi-small-q5_1.bin in --models-dir/);
    await expect(buildRelease(options({ out: tmp('unknown'), includeModels: ['speech-model.nope'] }))).rejects.toThrow(/not in the catalog/);
  });

  describe('[D-111 item 4] the languages allowlist: English only unless named', () => {
    it('by default a release carries English only: no text pack, only the multilingual speech models, and a manifest that offers no other language', async () => {
      const built = await buildRelease(options({ out: tmp('en-only'), languages: undefined, includeModels: [] }));
      expect(built.index.languages).toEqual(['en']);
      expect(built.index.files.filter((f) => f.id?.startsWith('text-rules.'))).toEqual([]);
      expect(built.manifest.packs.map((p) => [p.id, p.language])).toEqual([
        ['speech-model.silero-vad-v6.2.0', 'mul'],
        ['speech-model.whisper-small-q5_1', 'mul'],
      ]);
      expect(manifestLanguages(built.documents['pack-manifest'])).toEqual([]);
      expect(languagesNotAllowed(built.documents['pack-manifest'], parseLanguages(null))).toEqual([]);
      expect(log).toContain('languages: en (English is bundled in the app, so it has no text pack; mul speech models serve every language)');
    });

    it('an explicit list adds exactly the languages it names, and upload needs the same list', async () => {
      const built = await buildRelease(options({ out: tmp('en-hi'), languages: parseLanguages('en,hi') }));
      expect(built.index.languages).toEqual(['en', 'hi']);
      expect(built.manifest.packs.map((p) => p.id).sort()).toEqual(['speech-model.silero-vad-v6.2.0', 'speech-model.whisper-hindi-small-q5_1', 'speech-model.whisper-small-q5_1', 'text-rules.hi']);
      expect(manifestLanguages(built.documents['pack-manifest'])).toEqual(['hi']);
      expect(languagesNotAllowed(built.documents['pack-manifest'], parseLanguages(null))).toEqual(['hi']);
      expect(languagesNotAllowed(built.documents['pack-manifest'], parseLanguages('en,hi'))).toEqual([]);
      // The full release above offers all six; the default allowlist refuses every one of them.
      expect(languagesNotAllowed(manifestText, parseLanguages(null))).toEqual(['ar', 'es', 'fr', 'hi', 'pt', 'zh']);
    });

    it('the mode decides what an out folder may hold: an upstream run never reuses a downloaded model, and leftovers are refused (review B of #162, B6)', async () => {
      const en = { languages: undefined, includeModels: [] };
      const dir = tmp('mixed');
      const down = await buildRelease(options({ ...en, out: dir }));
      expect(down.index.notIncluded).toEqual([]);
      // Before this fix the upstream run reused both files and put the models on our host (about 765 MB on R2).
      await expect(buildRelease(options({ ...en, out: dir, models: 'upstream' }))).rejects.toThrow(/holds 2 file\(s\) this release does not include, left by an earlier run .*speech-model\./);
      const up = await buildRelease(options({ ...en, out: tmp('fresh-upstream'), models: 'upstream' }));
      expect(up.index.notIncluded.map((n) => n.id)).toEqual(['speech-model.silero-vad-v6.2.0', 'speech-model.whisper-small-q5_1']);
      expect(up.index.files.filter((f) => f.kind === 'pack')).toEqual([]);
      // A download run into its own folder still reuses its verified files.
      const again = await buildRelease(options({ ...en, out: dir }));
      expect(again.index.files.filter((f) => f.kind === 'pack').map((f) => f.origin)).toEqual(['copied', 'copied']);
      // Text packs left by an earlier --languages run are refused too (a static host would serve them).
      const langs = tmp('langs');
      await buildRelease(options({ ...en, out: langs, models: 'upstream', languages: ['en', 'es'] }));
      await expect(buildRelease(options({ ...en, out: langs, models: 'upstream' }))).rejects.toThrow(/text-rules\.es\/1000000\/es\.rules\.json/);
    });

    it('refuses an unknown or empty code, and a model for a language the list does not name', async () => {
      expect(parseLanguages(null)).toEqual(['en']);
      expect(parseLanguages('hi')).toEqual(['en', 'hi']);
      expect(parseLanguages(' zh , en ')).toEqual(['en', 'zh']);
      expect(() => parseLanguages('en,xx')).toThrow(/unknown language code xx; known: en, hi, es, zh, fr, ar, pt/);
      expect(() => parseLanguages('EN')).toThrow(/unknown language code EN/);
      expect(() => parseLanguages('')).toThrow(/at least one code/);
      await expect(buildRelease(options({ out: tmp('bad-lang'), languages: ['en', 'xx'] }))).rejects.toThrow(/unknown language code xx/);
      await expect(buildRelease(options({ out: tmp('hi-model'), languages: undefined }))).rejects.toThrow(/speech-model.whisper-hindi-small-q5_1: hi.*name it in --languages/);
    });
  });

  it('uploads packs first and the manifest last', () => {
    const order = uploadOrder(index).map((f) => f.path);
    expect(order.at(-1)).toBe('functions/v1/config/v1/packs');
    expect(order.at(-2)).toBe('functions/v1/config/v1/remote-config');
    expect(order.at(-3)).toBe('functions/v1/content/v1/bundle');
    expect(order.slice(0, -3).every((p) => !p.startsWith('functions/'))).toBe(true);
  });

  describe('served by a static host, the app', () => {
    const mapStorage = (store: Map<string, string>) => ({ read: (n: string) => store.get(n) ?? null, write: (n: string, t: string) => void store.set(n, t), remove: (n: string) => void store.delete(n) });
    const http = (): DocHttp & { headers: Record<string, string>[] } => ({
      headers: [],
      async get(url, headers) {
        this.headers.push(headers);
        const res = await fetch(url.replace(BASE, served.url), { headers });
        return { status: res.status, etag: res.headers.get('etag'), body: res.status === 200 ? await res.text() : null };
      },
    });
    const EMPTY: PackManifest = { schemaVersion: 1, version: 0, generatedAt: '1970-01-01T00:00:00.000Z', packs: [] };
    const client = (keys: () => readonly TrustedKey[], h = http(), store = new Map<string, string>()) =>
      new SignedDocumentClient<PackManifest>({
        kind: 'pack-manifest',
        url: `${BASE}${ENDPOINTS.packManifest.path}`,
        parse: (p) => {
          const r = parsePackManifest(p);
          return r.ok ? { ok: true, value: r.value } : { ok: false, reason: r.reason };
        },
        versionOf: (m) => m.version,
        fallback: EMPTY,
        storage: mapStorage(store),
        http: h,
        trustedKeys: keys,
        appVersion: '1.0.0',
        minIntervalMs: 0,
        timeoutMs: 5000,
      });

    it('fetches the manifest from the base URL, verifies it, and lists every language with its real size (what Settings > Spoken language shows)', async () => {
      const h = http();
      const c = client(() => trusted, h);
      expect(await c.refresh()).toBe('updated');
      expect(h.headers[0]).toMatchObject({ accept: 'application/json', 'x-app-version': '1.0.0' });
      const m = c.current();
      expect(m.version).toBe(1);
      for (const code of LANGUAGES) {
        const entry = resolvePack(m, textRulesPackId(code), '1.0.0');
        const onDisk = index.files.find((f) => f.id === textRulesPackId(code))!;
        expect(entry?.bytes, code).toBe(fs.statSync(path.join(out, onDisk.path)).size);
        expect(entry?.bytes, code).toBeGreaterThan(1000);
      }
      expect(resolvePack(m, 'speech-model.whisper-small-q5_1', '1.0.0')?.bytes).toBe(FAKE.small.length);
      // Conditional GET: the host's ETag turns the next refresh into a 304.
      expect(await c.refresh(true)).toBe('unchanged');
      expect(h.headers[1]['if-none-match']).toMatch(/^"sha256-/);
    });

    it('[ADR-0016] fails closed: no trusted key (keys.ts as shipped today) or a tampered manifest leaves the app on its empty manifest', async () => {
      const closed = client(() => []);
      expect(await closed.refresh()).toBe('unknown_key');
      expect(closed.current()).toBe(EMPTY);
      const doc = JSON.parse(manifestText) as { payload: { packs: { bytes: number }[] } };
      doc.payload.packs[0].bytes += 1;
      const c = client(() => trusted);
      expect(c.accept(doc, null)).toBe('bad_signature');
      expect(c.current()).toBe(EMPTY);
      expect(c.accept({ ...JSON.parse(manifestText), kind: 'remote-config' }, null)).toBe('wrong_kind');
    });

    it('downloads a language pack and a speech model from the host in Range chunks, verifies each SHA-256 and installs them (the pack engine as on the phone)', async () => {
      const c = client(() => trusted);
      await c.refresh();
      const root = tempRoot('release-e2e');
      const transport = new LocalHttp(served.url);
      const pm = new PackManager({
        fs: new NodeFs(root),
        http: transport,
        network: new FakeNetwork('wifi'),
        settings: new MemoryKv(),
        appVersion: '1.0.0',
        manifest: async () => c.current(),
        downloadsPaused: () => false,
        sleep: instantSleep,
        chunkBytes: 16 * 1024,
      });
      const es = await pm.ensureLanguage('es');
      expect(Object.keys(es)).toEqual(['text-rules.es']);
      expect(es['text-rules.es'].ok).toBe(true);
      const installed = pm.packPath('text-rules.es')!;
      const onDisk = index.files.find((f) => f.id === 'text-rules.es')!;
      expect(fs.readFileSync(installed)).toEqual(fs.readFileSync(path.join(out, onDisk.path)));
      expect(JSON.parse(fs.readFileSync(installed, 'utf8')).language).toBe('es');

      const small = await pm.ensurePack('speech-model.whisper-small-q5_1');
      expect(small.ok).toBe(true);
      expect(fs.readFileSync(pm.packPath('speech-model.whisper-small-q5_1')!)).toEqual(Buffer.from(FAKE.small));
      const ranges = transport.requests.filter((r) => r.url.includes('ggml-small-q5_1.bin')).map((r) => r.range);
      expect(ranges.length).toBeGreaterThan(2);
      expect(ranges[0]).toBe('bytes=0-16383');
      expect(pm.listInstalled().map((p) => [p.id, p.bytes])).toEqual([
        ['speech-model.whisper-small-q5_1', FAKE.small.length],
        ['text-rules.es', onDisk.bytes],
      ]);
    });

    it('[ADR-0016] a pack whose bytes changed on the host is deleted after download, never installed', async () => {
      const c = client(() => trusted);
      await c.refresh();
      const file = path.join(out, 'speech/whisper-hindi-small/fb4a24af/ggml-whisper-hindi-small-q5_1.bin');
      const original = fs.readFileSync(file);
      const bad = Buffer.from(original);
      bad[10] ^= 0xff;
      fs.writeFileSync(file, bad);
      try {
        const pm = new PackManager({ fs: new NodeFs(tempRoot('tamper')), http: new LocalHttp(served.url), network: new FakeNetwork('wifi'), settings: new MemoryKv(), appVersion: '1.0.0', manifest: async () => c.current(), downloadsPaused: () => false, sleep: instantSleep, chunkBytes: 1024 });
        expect(await pm.ensurePack('speech-model.whisper-hindi-small-q5_1')).toEqual({ ok: false, reason: 'hash_mismatch' });
        expect(pm.packPath('speech-model.whisper-hindi-small-q5_1')).toBeNull();
      } finally {
        fs.writeFileSync(file, original);
      }
    });
  });

  describe('publish.ts (the founder command)', () => {
    const tsx = path.join(REPO, 'node_modules/.bin/tsx');
    const run = (args: string[], env: Record<string, string> = {}) =>
      spawnSync(tsx, [path.join(REPO, 'scripts/packs/publish.ts'), ...args], { cwd: REPO, encoding: 'utf8', env: { ...process.env, EL_SIGNING_KEY: '', EL_SIGNING_KEY_ID: '', ...env } });

    it('upload refuses a release that offers a language --languages does not name, before reading credentials; an unknown code stops release before the key', () => {
      const refused = run(['upload', '--from', out, '--dry-run'], { PACKS_S3_ENDPOINT: 'http://127.0.0.1:9', PACKS_S3_BUCKET: 'early-letters-packs', PACKS_S3_ACCESS_KEY_ID: 'id', PACKS_S3_SECRET_ACCESS_KEY: 'not-a-secret' });
      expect(refused.status).toBe(1);
      expect(refused.stderr).toMatch(/This release offers ar, es, fr, hi, pt, zh, which --languages does not name \(en\)\. Nothing was sent\./);
      expect(refused.stdout).not.toMatch(/would put/);
      const named = run(['upload', '--from', out, '--dry-run', '--languages', 'en,ar,es,fr,hi,pt,zh'], { PACKS_S3_ENDPOINT: 'http://127.0.0.1:9', PACKS_S3_BUCKET: 'early-letters-packs', PACKS_S3_ACCESS_KEY_ID: 'id', PACKS_S3_SECRET_ACCESS_KEY: 'not-a-secret' });
      // Past the language gate, the shipped (empty) keys.ts does not trust the test key, so even a dry run stops before credentials (review A N1).
      expect(named.status).toBe(1);
      expect(named.stdout).toMatch(/Languages: en, hi, es, zh, fr, ar, pt/);
      expect(named.stderr).toMatch(/does not verify against packages\/api\/src\/keys\.ts \(unknown_key\); nothing was sent/);
      expect(named.stdout).not.toMatch(/would put/);
      const unknown = run(['release', '--languages', 'en,xx']);
      expect(unknown.status).toBe(1);
      expect(unknown.stderr).toMatch(/unknown language code xx/);
      expect(unknown.stderr).not.toMatch(/EL_SIGNING_KEY/);
    }, 60_000);

    it('refuses a key file inside the repository and a key the shipped keys.ts does not trust', () => {
      const inside = run(['release', '--key-file', 'scripts/packs/remote-config.json']);
      expect(inside.status).toBe(1);
      expect(inside.stderr).toMatch(/inside this repository/);
      // The bypass from the review of #162: the same file reached through a symlinked folder outside the repo.
      const link = path.join(tmp('symlink'), 'repo');
      fs.symlinkSync(REPO, link, 'dir');
      const viaLink = run(['release', '--key-file', path.join(link, 'scripts/packs/remote-config.json')]);
      expect(viaLink.status).toBe(1);
      expect(viaLink.stderr).toMatch(/inside this repository .*reached through/);
      const file = path.join(tmp('keyfile'), 'signing.env');
      fs.writeFileSync(file, `EL_SIGNING_KEY_ID=el-test\nEL_SIGNING_KEY=${key.secretKey}\n`);
      const untrusted = run(['release', '--key-file', file]);
      expect(untrusted.status).toBe(1);
      expect(untrusted.stderr).toMatch(/not in packages\/api\/src\/keys\.ts/);
      expect(untrusted.stdout + untrusted.stderr).not.toContain(key.secretKey);
    }, 60_000);

    it('`verify` reports what a phone would see: today, with keys.ts empty, the served manifest is not trusted', async () => {
      // Async spawn: the release server runs in this process, so a sync spawn would block it from answering.
      const r = await new Promise<{ status: number | null; stdout: string }>((resolve) => {
        const child = spawn(tsx, [path.join(REPO, 'scripts/packs/publish.ts'), 'verify', '--base-url', served.url], { cwd: REPO, env: process.env });
        let stdout = '';
        child.stdout.on('data', (c: Buffer) => (stdout += c.toString('utf8')));
        child.on('close', (status) => resolve({ status, stdout }));
      });
      expect(r.status).toBe(1);
      expect(r.stdout).toMatch(/trusted key ids: NONE/);
      expect(r.stdout).toMatch(/FAIL pack-manifest: signature check failed \(unknown_key\)/);
    }, 60_000);
  });
});
