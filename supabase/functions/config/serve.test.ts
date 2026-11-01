/// <reference types="node" />
/**
 * Contract tests for the `config` and `content` Edge Functions (ADR 0016,
 * ADR 0017), run in Node by `npm test -w @scribe/api`.
 */
import { describe, expect, it } from 'vitest';
import {
  base64ToBytes,
  CACHE_POLICY,
  DEFAULT_REMOTE_CONFIG,
  generateSigningKey,
  parseContentBundle,
  parseRemoteConfig,
  signDocument,
  verifySignedDocument,
} from '@scribe/api';
import { CANARY } from '../_shared/log/canary.ts';
import { makeContentHandler } from '../content/handler.ts';
import { makeConfigHandler } from './handler.ts';
import { matchesEtag, routeOf } from './serve.ts';

const key = generateSigningKey();
const secret = base64ToBytes(key.secretKey)!;
const trusted = [{ keyId: 'el-test', publicKey: key.publicKey, kinds: ['remote-config', 'pack-manifest', 'content-bundle'] as const }];
const configText = JSON.stringify(signDocument('remote-config', { ...DEFAULT_REMOTE_CONFIG, version: 9, generatedAt: '2026-10-03T12:00:00.000Z' }, secret, 'el-test'));
const manifestText = JSON.stringify(signDocument('pack-manifest', { schemaVersion: 1, version: 2, generatedAt: '2026-10-03T12:00:00.000Z', packs: [] }, secret, 'el-test'));
const bundleText = JSON.stringify(
  signDocument('content-bundle', { schemaVersion: 1, version: 3, generatedAt: '2026-10-03T12:00:00.000Z', locale: 'en', blocks: [] }, secret, 'el-test'),
);

function harness() {
  const lines: string[] = [];
  const sink = (l: string) => lines.push(l);
  const config = makeConfigHandler({ remoteConfig: configText, packManifest: manifestText }, { logSink: sink });
  const content = makeContentHandler({ en: bundleText }, { logSink: sink });
  return { config, content, lines };
}

const BASE = 'https://example.supabase.co/functions/v1';

describe('config function', () => {
  it('[DECISION-17] serves the signed document byte for byte with ETag, cache policy and a request id', async () => {
    const { config } = harness();
    const res = await config(new Request(`${BASE}/config/v1/remote-config`, { headers: { 'x-request-id': '0123456789ab' } }));
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe(CACHE_POLICY.remoteConfig);
    expect(res.headers.get('etag')).toMatch(/^"sha256-[0-9a-f]{32}"$/);
    expect(res.headers.get('x-request-id')).toBe('0123456789ab');
    expect(res.headers.get('content-type')).toContain('application/json');
    const text = await res.text();
    expect(text).toBe(configText);
    const verified = verifySignedDocument(JSON.parse(text), 'remote-config', trusted);
    expect(verified.ok).toBe(true);
    if (verified.ok) expect(parseRemoteConfig(verified.doc.payload).ok).toBe(true);
  });

  it('answers 304 to a matching If-None-Match and HEAD without a body', async () => {
    const { config } = harness();
    const first = await config(new Request(`${BASE}/config/v1/packs`));
    const etag = first.headers.get('etag')!;
    expect(first.headers.get('cache-control')).toBe(CACHE_POLICY.packManifest);
    const again = await config(new Request(`${BASE}/config/v1/packs`, { headers: { 'if-none-match': `W/${etag}, "other"` } }));
    expect(again.status).toBe(304);
    expect(await again.text()).toBe('');
    const head = await config(new Request(`${BASE}/config/v1/packs`, { method: 'HEAD' }));
    expect(head.status).toBe(200);
    expect(head.headers.get('etag')).toBe(etag);
  });

  it('works with the path the platform passes (function name first)', async () => {
    const { config } = harness();
    expect((await config(new Request('http://localhost/config/v1/remote-config'))).status).toBe(200);
    expect(routeOf('/functions/v1/config/v1/packs', 'config')).toBe('v1/packs');
    expect(routeOf('/config/v1/packs', 'config')).toBe('v1/packs');
    expect(matchesEtag('*', '"x"')).toBe(true);
  });

  it('refuses other methods and unknown routes with an uncached, content-free error envelope', async () => {
    const { config } = harness();
    const post = await config(new Request(`${BASE}/config/v1/remote-config`, { method: 'POST', body: CANARY.letterText }));
    expect(post.status).toBe(405);
    expect(post.headers.get('cache-control')).toBe('no-store');
    const body = (await post.json()) as { ok: boolean; error: { code: string }; requestId: string };
    expect(body).toMatchObject({ ok: false, error: { code: 'bad_request', retryable: false } });
    expect(body.requestId).toMatch(/^[0-9a-f]{12}$/);
    expect((await config(new Request(`${BASE}/config/v2/remote-config`))).status).toBe(404);
    expect((await config(new Request(`${BASE}/config/v1/unknown`))).status).toBe(404);
  });

  it('answers 404 until something is published (the app keeps its bundled defaults)', async () => {
    const empty = makeConfigHandler({ remoteConfig: null, packManifest: null }, { logSink: () => undefined });
    expect((await empty(new Request(`${BASE}/config/v1/remote-config`))).status).toBe(404);
  });

  it('[LEGAL-REQ-014] logs one content-free line per request, ignoring an invalid request id', async () => {
    const { config, lines } = harness();
    await config(new Request(`${BASE}/config/v1/remote-config?child=${CANARY.childName}`, { headers: { 'x-request-id': CANARY.requestId, authorization: `Bearer ${CANARY.sessionJwt}` } }));
    expect(lines).toHaveLength(1);
    const line = JSON.parse(lines[0]) as Record<string, unknown>;
    expect(line.event).toBe('request.done');
    expect(line.status).toBe(200);
    expect(line.req_id).toMatch(/^[0-9a-f]{12}$/);
    for (const v of Object.values(CANARY)) expect(lines[0]).not.toContain(v);
  });
});

describe('content function', () => {
  it('serves the English bundle and nothing for unknown or malformed locales', async () => {
    const { content } = harness();
    const res = await content(new Request(`${BASE}/content/v1/bundle?locale=en`));
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe(CACHE_POLICY.contentBundle);
    const verified = verifySignedDocument(JSON.parse(await res.text()), 'content-bundle', trusted);
    expect(verified.ok && parseContentBundle(verified.doc.payload).ok).toBe(true);
    expect((await content(new Request(`${BASE}/content/v1/bundle`))).status).toBe(200);
    expect((await content(new Request(`${BASE}/content/v1/bundle?locale=pt`))).status).toBe(404);
    expect((await content(new Request(`${BASE}/content/v1/bundle?locale=__proto__`))).status).toBe(404);
    expect((await content(new Request(`${BASE}/content/v1/bundle?locale=../../x`))).status).toBe(404);
  });
});
