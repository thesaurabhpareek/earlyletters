/**
 * FU-5a (follow-up to BL-2239): account deletion sends analytics-forget only ids it can accept. A malformed or repeated
 * id kept on the phone (an older build, a damaged settings row, a settle that did not run) used to go out as stored: the
 * function refuses a whole body for one non-UUID id, so that batch failed on every retry and kept its good ids and the
 * retry flag for ever. Real store, fake server that applies the function's own request rules. No family data involved.
 */
import { parseAnalyticsForgetRequest } from '@scribe/api';
import { createAnalytics, memoryStorage, recordingProvider, STORAGE_KEYS } from '@scribe/analytics';
import { describe, expect, it } from 'vitest';
import { FORGET_PENDING_KEY, forgetAnalytics, type AnalyticsIds, type DeletionClient, type FlagStore } from '../src/lib/account-deletion/api';

const id = (n: number) => `abcdef00-0000-4000-8000-${String(n).padStart(12, '0')}`;

function flagsMap(): FlagStore & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return { map, get: (k) => map.get(k) ?? null, set: (k, v) => void map.set(k, v), remove: (k) => void map.delete(k) };
}

/** analytics-forget as the phone sees it: a body the function would refuse is an error, anything else is acknowledged. */
function server(): { client: DeletionClient; bodies: string[][] } {
  const bodies: string[][] = [];
  const client = {
    functions: {
      invoke: async (_name: string, o: { body: { ids: string[]; reason: string } }) => {
        bodies.push(o.body.ids);
        return parseAnalyticsForgetRequest(o.body) ? { data: { ok: true }, error: null } : { data: null, error: new Error('bad_request') };
      },
    },
  } as unknown as DeletionClient;
  return { client, bodies };
}

async function phone(retired: string[]) {
  const storage = memoryStorage({ [STORAGE_KEYS.id]: id(1), [STORAGE_KEYS.retired]: JSON.stringify(retired) });
  // No forgetRetiredId: settleRetired's own cleaning (BL-2239) does not run, as when it failed or never ran.
  const analytics = createAnalytics({ provider: recordingProvider(), storage, randomId: () => id(99), flushIntervalMs: 0 });
  await analytics.init();
  const ids: AnalyticsIds = { ids: () => analytics.analyticsIds(), forget: () => analytics.forgetIds(), forgetSome: (x) => analytics.forgetSomeIds(x) };
  return { storage, ids };
}

describe('FU-5a: deletion batches never carry an id the function refuses or dedupes', () => {
  it('a malformed and a repeated retired id are left out, every batch is acknowledged, and the phone is wiped', async () => {
    const retired = [...Array.from({ length: 24 }, (_, i) => id(i + 2)), 'not-an-id', id(3).toUpperCase(), id(1)];
    const p = await phone(retired);
    const s = server();
    const flags = flagsMap();
    expect(await forgetAnalytics(s.client, p.ids, flags, 'account_deletion', 'k')).toBe('done');
    expect(s.bodies.map((b) => b.length)).toEqual([21, 4]);
    expect(s.bodies.flat()).toEqual([id(1), ...Array.from({ length: 24 }, (_, i) => id(i + 2))]);
    expect(flags.map.has(FORGET_PENDING_KEY)).toBe(false);
    // The bad entries could never be forgotten by the server; they still leave the phone with the rest.
    expect(p.storage.dump()[STORAGE_KEYS.retired]).toBeUndefined();
    expect(p.storage.dump()[STORAGE_KEYS.id]).toBeUndefined();
  });

  it('a later retry after a dropped batch names only what is left, once', async () => {
    const retired = [...Array.from({ length: 24 }, (_, i) => id(i + 2)), id(20).toUpperCase()];
    const p = await phone(retired);
    const flags = flagsMap();
    const dropSecond = server();
    const invoke = dropSecond.client.functions.invoke.bind(dropSecond.client.functions);
    let n = 0;
    (dropSecond.client.functions as { invoke: typeof invoke }).invoke = async (name, o) => (++n === 2 ? { data: null, error: new Error('offline') } : invoke(name, o));
    expect(await forgetAnalytics(dropSecond.client, p.ids, flags, 'account_deletion', 'k')).toBe('pending');
    expect(flags.map.get(FORGET_PENDING_KEY)).toBe('account_deletion');
    const again = server();
    expect(await forgetAnalytics(again.client, p.ids, flags, 'account_deletion', 'k2')).toBe('done');
    expect(again.bodies).toEqual([Array.from({ length: 4 }, (_, i) => id(i + 22))]);
  });
});
