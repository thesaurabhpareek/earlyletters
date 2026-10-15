/// <reference types="node" />
import { describe, expect, it } from 'vitest';
import {
  base64ToBytes,
  DEFAULT_REMOTE_CONFIG,
  documentPayloadSha256,
  generateSigningKey,
  parseContentBundle,
  parsePackManifest,
  parseRemoteConfig,
  signDocument,
  type ContentBundle,
  type DocumentKind,
  type PackManifest,
  type RemoteConfig,
  type TrustedKey,
  withFreshKillSwitches,
} from '@scribe/api';
import { SignedDocumentClient, type DocHttp, type DocHttpResponse } from '../documents';

const key = generateSigningKey();
const secret = base64ToBytes(key.secretKey)!;
// A second trusted key (rotation): the same payload signed by it is the same document.
const key2 = generateSigningKey();
const secret2 = base64ToBytes(key2.secretKey)!;
const ALL_KINDS: DocumentKind[] = ['remote-config', 'pack-manifest', 'content-bundle'];
const trusted: TrustedKey[] = [
  { keyId: 'el-test', publicKey: key.publicKey, kinds: ALL_KINDS },
  { keyId: 'el-test-2', publicKey: key2.publicKey, kinds: ALL_KINDS },
];

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

function setup(store = new Map<string, string>(), clock = { t: 1_000_000 }, withStaleness = false) {
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
    adjust: withStaleness ? (next, previous, { serverDate }) => withFreshKillSwitches(next, previous, serverDate) : undefined,
    signedTimeOf: (c) => Date.parse(c.generatedAt),
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

  it('[G-18] refuses a different config under the version already accepted, and keeps the accepted one', async () => {
    const { client, http, clock } = setup();
    const seen: boolean[] = [];
    client.subscribe((c) => seen.push(c.killSwitches.sync));
    http.queue.push({ status: 200, etag: '"a"', body: signed(config(7, { killSwitches: { sync: true } })) });
    expect(await client.refresh()).toBe('updated');
    // Same version, kill switch turned back off: a valid signature, but a different document.
    clock.t += 301_000;
    http.queue.push({ status: 200, etag: '"b"', body: signed(config(7, { killSwitches: { sync: false } })) });
    expect(await client.refresh()).toBe('same_version_conflict');
    expect(client.current().killSwitches.sync).toBe(true);
    expect(seen).toEqual([true]);
    // The conflict did not take the etag, so the next request still asks for the accepted copy.
    clock.t += 301_000;
    http.queue.push({ status: 304, etag: '"a"', body: null });
    expect(await client.refresh()).toBe('unchanged');
    expect(http.calls[2]['if-none-match']).toBe('"a"');
    // A real change ships as a new version.
    clock.t += 301_000;
    http.queue.push({ status: 200, etag: '"c"', body: signed(config(8, { killSwitches: { sync: false } })) });
    expect(await client.refresh()).toBe('updated');
    expect(seen).toEqual([true, false]);
  });

  it('[G-18] treats the same payload re-signed with another trusted key as the same document', async () => {
    const { client, http, clock } = setup();
    http.queue.push({ status: 200, etag: null, body: signed(config(4)) });
    await client.refresh();
    clock.t += 301_000;
    http.queue.push({ status: 200, etag: null, body: JSON.stringify(signDocument('remote-config', config(4), secret2, 'el-test-2')) });
    expect(await client.refresh()).toBe('unchanged');
  });

  it('[G-18] stores the payload hash, and still decides correctly for a cache written before it existed', async () => {
    const { client, http, store, clock } = setup();
    http.queue.push({ status: 200, etag: null, body: signed(config(5)) });
    await client.refresh();
    const rec = JSON.parse(store.get('remote-config.json')!);
    expect(rec.sha256).toBe(documentPayloadSha256(config(5)));
    // An older build's cache: no hash field.
    delete rec.sha256;
    store.set('remote-config.json', JSON.stringify(rec));
    const legacy = setup(store, clock);
    expect(legacy.client.current().version).toBe(5);
    legacy.clock.t += 301_000;
    legacy.http.queue.push({ status: 200, etag: null, body: signed(config(5, { readTogetherFreeSessions: 9 })) });
    expect(await legacy.client.refresh()).toBe('same_version_conflict');
    legacy.clock.t += 301_000;
    legacy.http.queue.push({ status: 200, etag: null, body: signed(config(5)) });
    expect(await legacy.client.refresh()).toBe('unchanged');
    expect(JSON.parse(store.get('remote-config.json')!).sha256).toBe(documentPayloadSha256(config(5)));
    void client;
  });

  it('[G-18] applies the same rule to the pack manifest and the content bundle', () => {
    const store = new Map<string, string>();
    const storage = { read: (n: string) => store.get(n) ?? null, write: (n: string, t: string) => void store.set(n, t), remove: (n: string) => void store.delete(n) };
    const base = { url: null, storage, http: new FakeHttp(), trustedKeys: () => trusted, appVersion: '1.0.0', minIntervalMs: 0, timeoutMs: 1000 };
    const manifest = new SignedDocumentClient<PackManifest>({
      ...base,
      kind: 'pack-manifest',
      parse: (p) => {
        const r = parsePackManifest(p);
        return r.ok ? { ok: true, value: r.value } : { ok: false, reason: 'invalid' };
      },
      versionOf: (m) => m.version,
      fallback: { schemaVersion: 1, version: 0, generatedAt: '1970-01-01T00:00:00.000Z', packs: [] },
    });
    const m = (generatedAt: string) => ({ schemaVersion: 1, version: 3, generatedAt, packs: [] });
    const sign = (kind: DocumentKind, p: unknown) => signDocument(kind, p, secret, 'el-test');
    expect(manifest.accept(sign('pack-manifest', m('2026-10-03T12:00:00.000Z')), null)).toBe('updated');
    expect(manifest.accept(sign('pack-manifest', m('2026-10-04T12:00:00.000Z')), null)).toBe('same_version_conflict');
    expect(manifest.accept(sign('pack-manifest', m('2026-10-03T12:00:00.000Z')), null)).toBe('unchanged');

    const content = new SignedDocumentClient<ContentBundle>({
      ...base,
      kind: 'content-bundle',
      parse: (p) => {
        const r = parseContentBundle(p);
        return r.ok ? { ok: true, value: r.value } : { ok: false, reason: 'invalid' };
      },
      versionOf: (b) => b.version,
      fallback: { schemaVersion: 1, version: 0, generatedAt: '1970-01-01T00:00:00.000Z', locale: 'en', blocks: [] },
    });
    const b = (generatedAt: string) => ({ schemaVersion: 1, version: 2, generatedAt, locale: 'en', blocks: [] });
    expect(content.accept(sign('content-bundle', b('2026-10-03T12:00:00.000Z')), null)).toBe('updated');
    expect(content.accept(sign('content-bundle', b('2026-10-05T12:00:00.000Z')), null)).toBe('same_version_conflict');
    expect(content.current().generatedAt).toBe('2026-10-03T12:00:00.000Z');
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

describe('[F19-REQ-008] a stale copy cannot clear a kill switch', () => {
  /** The phone's clock: 15 Oct 2026 14:00 UTC. */
  const NOW = Date.parse('2026-10-15T14:00:00Z');
  const killed = (version: number, generatedAt: string, invites: boolean) =>
    signed(config(version, { generatedAt, killSwitches: { invites } }));

  it('a newer copy generated more than 7 days before the server Date cannot clear a set switch', async () => {
    const { client, http } = setup(new Map(), { t: NOW }, true);
    http.queue.push({ status: 200, etag: '"v3"', body: killed(3, '2026-10-10T00:00:00.000Z', true), date: 'Sat, 10 Oct 2026 00:05:00 GMT' });
    expect(await client.refresh(true)).toBe('updated');
    expect(client.current().killSwitches.invites).toBe(true);
    // A cache replays version 4, signed long ago, with the switch cleared: the version applies, the switch does not.
    http.queue.push({ status: 200, etag: '"v4"', body: killed(4, '2026-10-01T00:00:00.000Z', false), date: 'Fri, 16 Oct 2026 00:00:00 GMT' });
    expect(await client.refresh(true)).toBe('updated');
    expect(client.current().version).toBe(4);
    expect(client.current().killSwitches.invites).toBe(true);
  });

  it('the kept switch survives a cold start (the used value is cached beside the signed payload)', async () => {
    const store = new Map<string, string>();
    const first = setup(store, { t: NOW }, true);
    first.http.queue.push({ status: 200, etag: '"v3"', body: killed(3, '2026-10-10T00:00:00.000Z', true), date: 'Sat, 10 Oct 2026 00:05:00 GMT' });
    await first.client.refresh(true);
    first.http.queue.push({ status: 200, etag: '"v5"', body: killed(5, '2026-09-01T00:00:00.000Z', false), date: 'Fri, 16 Oct 2026 00:00:00 GMT' });
    expect(await first.client.refresh(true)).toBe('updated');
    expect(first.client.current().killSwitches.invites).toBe(true);
    const again = setup(store, { t: NOW + 1000 }, true);
    expect(again.client.current().version).toBe(5);
    expect(again.client.current().killSwitches.invites).toBe(true);
  });

  it('a stale but newer copy still sets a switch on a new install', async () => {
    const { client, http } = setup(new Map(), { t: NOW }, true);
    http.queue.push({ status: 200, etag: '"v5"', body: killed(5, '2026-09-01T00:00:00.000Z', true), date: 'Fri, 16 Oct 2026 00:00:00 GMT' });
    expect(await client.refresh(true)).toBe('updated');
    expect(client.current().killSwitches.invites).toBe(true);
  });

  it('a forged far-future Date is ignored, so later configs are not all judged stale', async () => {
    const { client, http } = setup(new Map(), { t: NOW }, true);
    http.queue.push({ status: 200, etag: '"v3"', body: killed(3, '2026-10-15T00:00:00.000Z', false), date: 'Fri, 01 Jan 2100 00:00:00 GMT' });
    await client.refresh(true);
    http.queue.push({ status: 200, etag: '"v4"', body: killed(4, '2026-10-15T12:00:00.000Z', true), date: 'Thu, 15 Oct 2026 12:01:00 GMT' });
    await client.refresh(true);
    http.queue.push({ status: 200, etag: '"v5"', body: killed(5, '2026-10-15T13:00:00.000Z', false), date: 'Thu, 15 Oct 2026 13:01:00 GMT' });
    expect(await client.refresh(true)).toBe('updated');
    expect(client.current().killSwitches.invites).toBe(false);
  });

  it('a cached old copy with its own old Date is judged against the newest Date seen (the last good server Date)', async () => {
    const { client, http } = setup(new Map(), { t: NOW }, true);
    http.queue.push({ status: 200, etag: '"v3"', body: killed(3, '2026-10-15T00:00:00.000Z', true), date: 'Thu, 15 Oct 2026 00:01:00 GMT' });
    await client.refresh(true);
    // A CDN serves version 4, generated and dated 1 October: on its own it looks fresh.
    http.queue.push({ status: 200, etag: '"v4"', body: killed(4, '2026-10-01T00:00:00.000Z', false), date: 'Thu, 01 Oct 2026 00:00:30 GMT' });
    expect(await client.refresh(true)).toBe('updated');
    expect(client.current().killSwitches.invites).toBe(true);
  });

  it('a cached copy that kept its origin Date is judged by Date plus Age', async () => {
    const { client, http } = setup(new Map(), { t: NOW }, true);
    http.queue.push({ status: 200, etag: '"v3"', body: killed(3, '2026-09-19T00:00:00.000Z', true), date: 'Sat, 19 Sep 2026 00:05:00 GMT' });
    await client.refresh(true);
    http.queue.push({ status: 200, etag: '"v4"', body: killed(4, '2026-10-01T00:00:00.000Z', false), date: 'Thu, 01 Oct 2026 00:00:00 GMT', age: 14 * 86_400 });
    expect(await client.refresh(true)).toBe('updated');
    expect(client.current().killSwitches.invites).toBe(true);
  });

  it('a server clock recorded far ahead of a corrected phone clock is dropped at the next start', async () => {
    const store = new Map<string, string>();
    const ahead = setup(store, { t: NOW + 200 * 86_400_000 }, true);
    ahead.http.queue.push({ status: 200, etag: '"v3"', body: killed(3, '2026-10-15T00:00:00.000Z', false), date: new Date(NOW + 200 * 86_400_000).toUTCString() });
    await ahead.client.refresh(true);
    const fixed = setup(store, { t: NOW }, true);
    fixed.client.current();
    fixed.http.queue.push({ status: 200, etag: '"v4"', body: killed(4, '2026-10-15T13:00:00.000Z', true), date: 'Thu, 15 Oct 2026 13:01:00 GMT' });
    await fixed.client.refresh(true);
    fixed.http.queue.push({ status: 200, etag: '"v5"', body: killed(5, '2026-10-15T13:30:00.000Z', false), date: 'Thu, 15 Oct 2026 13:31:00 GMT' });
    await fixed.client.refresh(true);
    expect(fixed.client.current().killSwitches.invites).toBe(false);
  });

  it('listeners get the value in use, not the stale switches', async () => {
    const { client, http } = setup(new Map(), { t: NOW }, true);
    http.queue.push({ status: 200, etag: '"v3"', body: killed(3, '2026-10-10T00:00:00.000Z', true), date: 'Sat, 10 Oct 2026 00:05:00 GMT' });
    await client.refresh(true);
    const seen: boolean[] = [];
    client.subscribe((c) => seen.push(c.killSwitches.invites));
    http.queue.push({ status: 200, etag: '"v4"', body: killed(4, '2026-10-01T00:00:00.000Z', false), date: 'Fri, 16 Oct 2026 00:00:00 GMT' });
    await client.refresh(true);
    expect(seen).toEqual([true]);
  });

  it('a stale clearing copy never clears the switch, however long it is confirmed; only a fresh publish does', async () => {
    const clock = { t: NOW };
    const { client, http } = setup(new Map(), clock, true);
    http.queue.push({ status: 200, etag: '"v3"', body: killed(3, '2026-10-01T00:00:00.000Z', true), date: 'Thu, 01 Oct 2026 00:05:00 GMT' });
    await client.refresh(true);
    http.queue.push({ status: 200, etag: '"v4"', body: killed(4, '2026-10-02T00:00:00.000Z', false), date: 'Thu, 15 Oct 2026 12:00:00 GMT' });
    await client.refresh(true);
    clock.t = NOW + 30 * 86_400_000;
    http.queue.push({ status: 304, etag: '"v4"', body: null, date: 'Sat, 14 Nov 2026 12:00:00 GMT' });
    await client.refresh(true);
    expect(client.current().killSwitches.invites).toBe(true);
    http.queue.push({ status: 200, etag: '"v5"', body: killed(5, '2026-11-14T12:00:00.000Z', false), date: 'Sat, 14 Nov 2026 12:01:00 GMT' });
    await client.refresh(true);
    expect(client.current().killSwitches.invites).toBe(false);
  });

  it('a phone whose clock runs two days behind still takes real server dates near the signed time', async () => {
    const { client, http } = setup(new Map(), { t: NOW - 2 * 86_400_000 }, true);
    http.queue.push({ status: 200, etag: '"v3"', body: killed(3, '2026-10-15T00:00:00.000Z', true), date: 'Thu, 15 Oct 2026 14:00:00 GMT' });
    await client.refresh(true);
    http.queue.push({ status: 200, etag: '"v4"', body: killed(4, '2026-10-01T00:00:00.000Z', false), date: 'Thu, 15 Oct 2026 14:05:00 GMT' });
    await client.refresh(true);
    expect(client.current().killSwitches.invites).toBe(true);
  });

  it('a fresh newer copy can clear the switch', async () => {
    const { client, http } = setup(new Map(), { t: NOW }, true);
    http.queue.push({ status: 200, etag: '"v3"', body: killed(3, '2026-10-10T00:00:00.000Z', true), date: 'Sat, 10 Oct 2026 00:05:00 GMT' });
    await client.refresh(true);
    http.queue.push({ status: 200, etag: '"v4"', body: killed(4, '2026-10-15T00:00:00.000Z', false), date: 'Thu, 15 Oct 2026 00:01:00 GMT' });
    expect(await client.refresh(true)).toBe('updated');
    expect(client.current().killSwitches.invites).toBe(false);
  });
});
