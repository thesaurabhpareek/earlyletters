/// <reference types="node" />
import { describe, expect, it } from 'vitest';
import {
  base64ToBytes,
  DEFAULT_REMOTE_CONFIG,
  generateSigningKey,
  parseRemoteConfig,
  signDocument,
  type RemoteConfig,
  type TrustedKey,
} from '@scribe/api';
import { SignedDocumentClient, type DocHttp, type DocHttpResponse } from '../documents';

const key = generateSigningKey();
const secret = base64ToBytes(key.secretKey)!;
const trusted: TrustedKey[] = [{ keyId: 'el-test', publicKey: key.publicKey, kinds: ['remote-config'] }];

const config = (version: number, over: Record<string, unknown> = {}) => ({
  schemaVersion: 1,
  version,
  generatedAt: '2026-10-03T12:00:00.000Z',
  readTogetherFreeSessions: 5,
  ...over,
});
const signed = (payload: unknown) => JSON.stringify(signDocument('remote-config', payload, secret, 'el-test'));

class FakeHttp implements DocHttp {
  calls: Record<string, string>[] = [];
  queue: (DocHttpResponse | Error)[] = [];
  async get(_url: string, headers: Record<string, string>) {
    this.calls.push(headers);
    const next = this.queue.shift() ?? new Error('offline');
    if (next instanceof Error) throw next;
    return next;
  }
}

function setup(store = new Map<string, string>(), clock = { t: 1_000_000 }) {
  const http = new FakeHttp();
  const client = new SignedDocumentClient<RemoteConfig>({
    kind: 'remote-config',
    url: 'https://example.supabase.co/functions/v1/config/v1/remote-config',
    parse: (p) => {
      const r = parseRemoteConfig(p);
      return r.ok ? { ok: true, value: r.value } : { ok: false, reason: r.reason };
    },
    versionOf: (c) => c.version,
    fallback: DEFAULT_REMOTE_CONFIG,
    storage: { read: (n) => store.get(n) ?? null, write: (n, t) => void store.set(n, t), remove: (n) => void store.delete(n) },
    http,
    trustedKeys: () => trusted,
    appVersion: '1.0.0',
    minIntervalMs: 300_000,
    timeoutMs: 5000,
    now: () => clock.t,
  });
  return { client, http, store, clock };
}

describe('SignedDocumentClient', () => {
  it('[A-REQ-002] starts from the bundled defaults and never throws offline', async () => {
    const { client } = setup();
    expect(client.current()).toBe(DEFAULT_REMOTE_CONFIG);
    expect(await client.refresh()).toBe('offline');
    expect(client.current()).toBe(DEFAULT_REMOTE_CONFIG);
  });

  it('accepts a signed document, caches it, and serves it after a restart without the network', async () => {
    const { client, http, store, clock } = setup();
    http.queue.push({ status: 200, etag: '"v3"', body: signed(config(3)) });
    expect(await client.refresh()).toBe('updated');
    expect(client.current().readTogetherFreeSessions).toBe(5);
    const again = setup(store, clock).client;
    expect(again.current().version).toBe(3);
    expect(again.hasServerCopy()).toBe(true);
  });

  it('sends If-None-Match and treats 304 as unchanged', async () => {
    const { client, http, clock } = setup();
    http.queue.push({ status: 200, etag: '"v3"', body: signed(config(3)) });
    await client.refresh();
    clock.t += 301_000;
    http.queue.push({ status: 304, etag: '"v3"', body: null });
    expect(await client.refresh()).toBe('unchanged');
    expect(http.calls[1]['if-none-match']).toBe('"v3"');
    expect(http.calls[1]['x-request-id']).toMatch(/^[0-9a-f]{12}$/);
    expect(http.calls[1]['x-app-version']).toBe('1.0.0');
    expect(JSON.stringify(http.calls)).not.toMatch(/authorization|apikey/i);
  });

  it('respects the minimum interval unless forced', async () => {
    const { client, http } = setup();
    http.queue.push({ status: 200, etag: null, body: signed(config(3)) });
    await client.refresh();
    expect(await client.refresh()).toBe('skipped');
    http.queue.push({ status: 304, etag: null, body: null });
    expect(await client.refresh(true)).toBe('unchanged');
  });

  it('[ADR-0016] ignores a bad signature, a wrong payload and an older version, keeping the last good copy', async () => {
    const { client, http, clock } = setup();
    http.queue.push({ status: 200, etag: null, body: signed(config(5)) });
    await client.refresh();
    const stranger = generateSigningKey();
    const forged = JSON.stringify(signDocument('remote-config', config(6, { readTogetherFreeSessions: 50 }), base64ToBytes(stranger.secretKey)!, 'el-test'));
    for (const [body, outcome] of [
      [forged, 'bad_signature'],
      [signed({ nonsense: true }), 'invalid_payload'],
      [signed(config(4)), 'rollback'],
      ['not json', 'malformed'],
    ] as const) {
      clock.t += 301_000;
      http.queue.push({ status: 200, etag: null, body });
      expect(await client.refresh()).toBe(outcome);
      expect(client.current().version).toBe(5);
    }
    clock.t += 301_000;
    http.queue.push({ status: 503, etag: null, body: null });
    expect(await client.refresh()).toBe('http_error');
    expect(client.current().version).toBe(5);
  });

  it('notifies subscribers only when the document changes', async () => {
    const { client, http, clock } = setup();
    const seen: number[] = [];
    client.subscribe((c) => seen.push(c.version));
    http.queue.push({ status: 200, etag: null, body: signed(config(3)) });
    await client.refresh();
    clock.t += 301_000;
    http.queue.push({ status: 200, etag: null, body: signed(config(3)) });
    expect(await client.refresh()).toBe('unchanged');
    expect(seen).toEqual([3]);
  });

  it('drops a cache it can no longer parse', () => {
    const store = new Map([['remote-config.json', '{"v":1,"version":2,"payload":{"schemaVersion":99}}']]);
    const { client } = setup(store);
    expect(client.current()).toBe(DEFAULT_REMOTE_CONFIG);
    expect(store.has('remote-config.json')).toBe(false);
  });

  it('returns not_configured in a build without a server', async () => {
    const http = new FakeHttp();
    const client = new SignedDocumentClient<RemoteConfig>({
      kind: 'remote-config',
      url: null,
      parse: () => ({ ok: false, reason: 'x' }),
      versionOf: (c) => c.version,
      fallback: DEFAULT_REMOTE_CONFIG,
      storage: { read: () => null, write: () => undefined, remove: () => undefined },
      http,
      trustedKeys: () => trusted,
      appVersion: '1.0.0',
      minIntervalMs: 0,
      timeoutMs: 1000,
    });
    expect(await client.refresh()).toBe('not_configured');
    expect(http.calls).toEqual([]);
  });
});
