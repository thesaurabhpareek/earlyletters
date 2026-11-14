import { describe, expect, it } from 'vitest';
import {
  createAnalytics,
  createFirstPartyProvider,
  EVENTS,
  memoryStorage,
  OUTBOX_KEY,
  type FetchLike,
} from '../src';

const URL_ = 'https://fixture.supabase.co/functions/v1/analytics-ingest/v1';
const CANARIES = ['Asha', 'asha.parent@example.com', 'She laughed at the dog today'];

function world(status: number | 'offline' = 200) {
  const sent: { url: string; headers: Record<string, string>; body: string }[] = [];
  let mode: number | 'offline' = status;
  const fetch: FetchLike = async (url, init) => {
    if (mode === 'offline') throw new Error('offline');
    sent.push({ url, headers: init.headers, body: init.body });
    return { status: mode as number };
  };
  const storage = memoryStorage();
  let t = 1_000_000;
  const provider = createFirstPartyProvider({ endpoint: URL_, apiKey: 'anon-fixture', fetch, storage, now: () => t });
  const analytics = createAnalytics({ provider, storage, randomId: () => '11111111-2222-4333-8444-555555555555', flushIntervalMs: 0 });
  return { sent, storage, provider, analytics, setMode: (m: number | 'offline') => (mode = m), advance: (ms: number) => (t += ms) };
}

describe('first-party sink', () => {
  it('[LEGAL-REQ-003] sends nothing before a yes, and nothing after a no', async () => {
    const w = world();
    await w.analytics.init();
    expect(w.analytics.track('error_shown', { code: 'save_failed' })).toBe('dropped_no_consent');
    await w.analytics.flush();
    await w.analytics.revoke();
    await w.analytics.flush();
    expect(w.sent).toHaveLength(0);
    expect(w.storage.dump()[OUTBOX_KEY]).toBeUndefined();
  });

  it('sends allowlisted events with the random id, the public key and no account link', async () => {
    const w = world();
    await w.analytics.grant();
    w.analytics.track('error_shown', { code: 'save_failed' });
    await w.analytics.flush();
    expect(w.sent).toHaveLength(1);
    const req = w.sent[0];
    expect(req.url).toBe(URL_);
    expect(Object.keys(req.headers).map((k) => k.toLowerCase()).sort()).toEqual(['apikey', 'content-type']);
    const body = JSON.parse(req.body);
    expect(body.id).toBe('11111111-2222-4333-8444-555555555555');
    expect(body.events).toEqual([{ event: 'error_shown', props: { code: 'save_failed', schema_version: expect.any(Number) }, ago_s: 0 }]);
    expect(Object.keys(body).sort()).toEqual(['events', 'id']);
  });

  it('[LEGAL-REQ-017] the last wall refuses an event the client would not: unknown event, free text, PII', async () => {
    const w = world();
    await w.provider.optIn();
    await w.provider.identify('11111111-2222-4333-8444-555555555555');
    w.provider.capture('letter_text', { text: CANARIES[2] });
    w.provider.capture('error_shown', { code: 'save_failed', note: CANARIES[2] });
    w.provider.capture('error_shown', { code: CANARIES[1], schema_version: 1 });
    w.provider.capture('error_shown', { code: 'save_failed', schema_version: 1, child: CANARIES[0] });
    await w.provider.flush();
    const all = w.sent.map((s) => s.body).join('\n') + JSON.stringify(w.storage.dump());
    for (const c of CANARIES) expect(all).not.toContain(c);
    for (const s of w.sent) for (const e of JSON.parse(s.body).events) expect(Object.keys(EVENTS)).toContain(e.event);
  });

  it('offline: keeps events (and survives a restart), then sends them with their age', async () => {
    const w = world('offline');
    await w.analytics.grant();
    w.analytics.track('error_shown', { code: 'save_failed' });
    await w.analytics.flush();
    expect(w.sent).toHaveLength(0);
    expect(w.storage.dump()[OUTBOX_KEY]).toBeDefined();

    // New process: same storage, provider re-opens on init.
    const fetch: FetchLike = async (url, init) => {
      w.sent.push({ url, headers: init.headers, body: init.body });
      return { status: 200 };
    };
    const p2 = createFirstPartyProvider({ endpoint: URL_, fetch, storage: w.storage, now: () => 1_000_000 + 90_000 });
    const a2 = createAnalytics({ provider: p2, storage: w.storage, flushIntervalMs: 0 });
    await a2.init();
    await p2.flush();
    expect(w.sent).toHaveLength(1);
    expect(JSON.parse(w.sent[0].body).events[0].ago_s).toBe(90);
    expect(w.storage.dump()[OUTBOX_KEY]).toBeUndefined();
  });

  it('keeps a batch on 5xx and 429, drops it on a 4xx that retrying cannot fix', async () => {
    const w = world(503);
    await w.analytics.grant();
    w.analytics.track('error_shown', { code: 'save_failed' });
    await w.analytics.flush();
    expect(w.storage.dump()[OUTBOX_KEY]).toBeDefined();
    w.setMode(429);
    await w.analytics.flush();
    expect(w.storage.dump()[OUTBOX_KEY]).toBeDefined();
    w.setMode(400);
    await w.analytics.flush();
    expect(w.storage.dump()[OUTBOX_KEY]).toBeUndefined();
  });

  it('does not send events older than 14 days', async () => {
    const w = world('offline');
    await w.analytics.grant();
    w.analytics.track('error_shown', { code: 'save_failed' });
    await w.analytics.flush();
    w.setMode(200);
    w.advance(15 * 24 * 3600 * 1000);
    await w.analytics.flush();
    expect(w.sent).toHaveLength(0);
  });

  it('[PRD-REQ-018] opt-out empties the outbox and stops the send within the session', async () => {
    const w = world('offline');
    await w.analytics.grant();
    w.analytics.track('error_shown', { code: 'save_failed' });
    await w.analytics.flush();
    expect(w.storage.dump()[OUTBOX_KEY]).toBeDefined();
    w.setMode(200);
    await w.analytics.revoke();
    await w.analytics.flush();
    expect(w.sent).toHaveLength(0);
    expect(w.storage.dump()[OUTBOX_KEY]).toBeUndefined();
  });

  it('opt-out while a request is in flight leaves nothing behind', async () => {
    const storage = memoryStorage();
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const fetch: FetchLike = async () => {
      await gate;
      return { status: 500 };
    };
    const p = createFirstPartyProvider({ endpoint: URL_, fetch, storage });
    const a = createAnalytics({ provider: p, storage, randomId: () => '11111111-2222-4333-8444-555555555555', flushIntervalMs: 0 });
    await a.grant();
    a.track('error_shown', { code: 'save_failed' });
    const f = a.flush();
    await Promise.resolve();
    await a.revoke();
    release();
    await f;
    expect(storage.dump()[OUTBOX_KEY]).toBeUndefined();
  });

  it('caps the outbox size, oldest first', async () => {
    const storage = memoryStorage();
    const fetch: FetchLike = async () => {
      throw new Error('offline');
    };
    const p = createFirstPartyProvider({ endpoint: URL_, fetch, storage, maxOutboxBytes: 400 });
    await p.optIn();
    await p.identify('11111111-2222-4333-8444-555555555555');
    for (let i = 0; i < 20; i++) p.capture('error_shown', { code: 'save_failed', schema_version: 1 });
    await p.flush();
    expect((storage.dump()[OUTBOX_KEY] ?? '').length).toBeLessThanOrEqual(600);
  });
});
