/**
 * BL-1252 phone half (c): a retired id leaves the phone only when the server acknowledges it, and stays on any failure.
 */
import { ANALYTICS_FORGET_MAX_IDS } from '@scribe/api';
import { createAnalytics, MAX_FORGET_BATCH, MAX_RETIRED_IDS, recordingProvider } from '@scribe/analytics';
import { describe, expect, it } from 'vitest';
import { makeForgetRetiredId, type ForgetClient } from '../src/lib/analytics/forget-retired';

const ID = '00000000-0000-4000-8000-000000000001';

function fake(opts: { session?: unknown; answer?: { data?: unknown; error?: unknown }; throws?: boolean } = {}) {
  const calls: { name: string; body: unknown; headers: Record<string, string> }[] = [];
  const client: ForgetClient = {
    auth: { getSession: async () => ({ data: { session: (opts.session === undefined ? { user: {} } : opts.session) as never } }) },
    functions: {
      invoke: async (name, o) => {
        calls.push({ name, body: o.body, headers: o.headers });
        if (opts.throws) throw new Error('offline');
        return opts.answer ?? { data: { ok: true, data: { accepted: 1 } } };
      },
    },
  };
  return { client, calls };
}
const ID2 = '00000000-0000-4000-8000-000000000002';
const forgetWith = (f: ReturnType<typeof fake> | null) => makeForgetRetiredId({ client: () => f?.client ?? null, idempotencyKey: () => 'k-1' });

describe('forgetRetiredId', () => {
  it('BL-2163: sends every id in one call, and is false when the server counts fewer than were sent', async () => {
    const f = fake({ answer: { data: { ok: true, data: { accepted: 2 } } } });
    expect(await forgetWith(f)([ID, ID2])).toBe(true);
    expect(f.calls).toHaveLength(1);
    expect((f.calls[0]?.body as { ids: string[] }).ids).toEqual([ID, ID2]);
    expect(await forgetWith(fake({ answer: { data: { ok: true, data: { accepted: 1 } } } }))([ID, ID2])).toBe(false);
  });

  it('BL-2163: the analytics batch size is the function cap', () => {
    expect(MAX_FORGET_BATCH).toBe(ANALYTICS_FORGET_MAX_IDS);
  });

  it('sends the one id with reason retired_id and an idempotency key, and is true on 202', async () => {
    const f = fake();
    expect(await forgetWith(f)([ID])).toBe(true);
    expect(f.calls).toEqual([{ name: 'analytics-forget/v1', body: { ids: [ID], reason: 'retired_id' }, headers: { 'idempotency-key': 'k-1' } }]);
  });

  it('is false, and sends nothing, with no client, no session, an anonymous session or a malformed id', async () => {
    expect(await forgetWith(null)([ID])).toBe(false);
    const none = fake({ session: null });
    expect(await forgetWith(none)([ID])).toBe(false);
    const anon = fake({ session: { user: { is_anonymous: true } } });
    expect(await forgetWith(anon)([ID])).toBe(false);
    const ok = fake();
    expect(await forgetWith(ok)(['not-an-id'])).toBe(false);
    expect([none, anon, ok].flatMap((f) => f.calls)).toEqual([]);
  });

  it('is false on an error, a throw, or an answer that is not the 202 shape', async () => {
    expect(await forgetWith(fake({ answer: { error: new Error('refused') } }))([ID])).toBe(false);
    expect(await forgetWith(fake({ throws: true }))([ID])).toBe(false);
    expect(await forgetWith(fake({ answer: { data: { ok: true } } }))([ID])).toBe(false);
    expect(await forgetWith(fake({ answer: { data: { ok: true, data: { accepted: 0 } } } }))([ID])).toBe(false);
  });
});

describe('through the analytics client', () => {
  async function overCap(forgetRetiredId: (ids: string[]) => Promise<boolean>) {
    let n = 0;
    const analytics = createAnalytics({ provider: recordingProvider(), randomId: () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`, forgetRetiredId, flushIntervalMs: 0 });
    await analytics.init();
    for (let i = 0; i < MAX_RETIRED_IDS + 1; i++) {
      await analytics.grant();
      await analytics.revoke();
    }
    return analytics;
  }

  it('drops the oldest retired id after an acknowledgement', async () => {
    const f = fake();
    const analytics = await overCap(forgetWith(f));
    expect(f.calls).toHaveLength(1);
    expect(analytics.analyticsIds()).toHaveLength(MAX_RETIRED_IDS);
    expect(analytics.analyticsIds()).not.toContain((f.calls[0]?.body as { ids: string[] }).ids[0]);
  });

  it('keeps every id when the server refuses or the phone is signed out', async () => {
    for (const f of [fake({ answer: { error: new Error('refused') } }), fake({ session: null })]) {
      const analytics = await overCap(forgetWith(f));
      expect(analytics.analyticsIds()).toHaveLength(MAX_RETIRED_IDS + 1);
    }
  });
});
