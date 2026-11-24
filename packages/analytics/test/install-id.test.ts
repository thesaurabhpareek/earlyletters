/**
 * ER-A04 (BL-1239): the anonymous install id. Minted only when asked (the gate allows an event), never before;
 * retired on off; a new one on a later on; the 21st retired id is forgotten on the server before it leaves the list.
 * Fictional family Asha only: no event data is involved.
 */
import { describe, expect, it } from 'vitest';
import { ConsentStore, MAX_RETIRED_IDS, STORAGE_KEYS, createAnalytics, memoryStorage, recordingProvider } from '../src';

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
function ids() {
  let n = 0;
  return () => uuid(++n);
}
const UUID_LOWER = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('install id (ER-A04)', () => {
  it('is not minted by loading, by asking for status, or by an ask_first person who has not said yes', async () => {
    const storage = memoryStorage();
    const provider = recordingProvider();
    const analytics = createAnalytics({ provider, storage, randomId: ids(), flushIntervalMs: 0 });
    await analytics.init();
    expect(analytics.track('screen_view', { route: 'family' })).toBe('dropped_no_consent');
    await analytics.flush();
    expect(storage.dump()[STORAGE_KEYS.id]).toBeUndefined();
    expect(analytics.analyticsIds()).toEqual([]);
    expect(provider.calls.map((c) => c.method)).not.toContain('identify');
  });

  it('is minted on the first ensureId call, as a lowercase id, and kept until it is retired', async () => {
    const storage = memoryStorage();
    const store = new ConsentStore(storage, () => uuid(7).toUpperCase());
    await store.load();
    expect(store.id).toBeNull();
    const id = store.ensureId();
    expect(id).toMatch(UUID_LOWER);
    expect(store.ensureId()).toBe(id);
    await store.settled();
    expect(storage.dump()[STORAGE_KEYS.id]).toBe(id);
    expect(store.id).toBe(id);
  });

  it('survives a restart when it was minted without a yes, and a yes keeps it instead of orphaning it', async () => {
    const storage = memoryStorage();
    const first = new ConsentStore(storage, ids());
    await first.load();
    const id = first.ensureId();
    await first.settled();

    const second = new ConsentStore(storage, ids());
    const snap = await second.load();
    expect(snap.status).toBe('unknown');
    expect(second.id).toBe(id);
    expect(await second.grant()).toBe(id);
    expect(second.allIds()).toEqual([id]);
  });

  it('is retired on off: no live id, kept only for deletion, and not stored as the live id', async () => {
    const storage = memoryStorage();
    const store = new ConsentStore(storage, ids());
    await store.load();
    const id = store.ensureId();
    await store.settled();
    await store.revoke();
    expect(store.id).toBeNull();
    expect(storage.dump()[STORAGE_KEYS.id]).toBeUndefined();
    expect(store.allIds()).toEqual([id]);
    // A restart in the off state does not bring the id back.
    const again = new ConsentStore(storage, ids());
    await again.load();
    expect(again.id).toBeNull();
  });

  it('gets a new id on a later on, and the old id is never the live one again', async () => {
    const store = new ConsentStore(memoryStorage(), ids());
    await store.load();
    const first = store.ensureId();
    await store.revoke();
    const second = store.ensureId();
    expect(second).not.toBe(first);
    expect(store.allIds()).toEqual([second, first]);
  });

  // A storage whose write of the id key lands late (~30 ms), like a slow disk. The plain
  // memoryStorage completes writes in order, so it cannot show a missing await.
  function slowIdStorage() {
    const base = memoryStorage();
    return {
      ...base,
      set: async (k: string, v: string) => {
        if (k === STORAGE_KEYS.id) await new Promise((r) => setTimeout(r, 30));
        await base.set(k, v);
      },
    };
  }
  const settle = () => new Promise((r) => setTimeout(r, 80));

  it('an off straight after a mint still removes the id from storage (the slow write is awaited first)', async () => {
    const storage = slowIdStorage();
    const store = new ConsentStore(storage, ids());
    await store.load();
    store.ensureId();
    await store.revoke();
    await settle();
    expect(storage.dump()[STORAGE_KEYS.id]).toBeUndefined();
  });

  it('an Erase straight after a mint still removes the id from storage (the slow write is awaited first)', async () => {
    const storage = slowIdStorage();
    const store = new ConsentStore(storage, ids());
    await store.load();
    store.ensureId();
    await store.forgetAllIds();
    await settle();
    expect(storage.dump()[STORAGE_KEYS.id]).toBeUndefined();
  });

  it('a storage write that fails is visible to the caller, so it can refuse to send that id', async () => {
    const storage = { ...memoryStorage(), set: () => Promise.reject(new Error('disk')) };
    const store = new ConsentStore(storage, ids());
    await store.load();
    store.ensureId();
    await expect(store.settled()).rejects.toThrow();
  });
});

describe('retired ids past the cap (ER-A04)', () => {
  async function toggled(times: number, forgetRetired?: (id: string) => boolean | Promise<boolean>) {
    const storage = memoryStorage();
    const store = new ConsentStore(storage, ids(), { forgetRetired });
    await store.load();
    const minted: string[] = [];
    for (let i = 0; i < times; i++) {
      minted.push(store.ensureId());
      await store.revoke();
    }
    return { store, storage, minted };
  }

  it('keeps 20 with no call up to the cap', async () => {
    const calls: string[] = [];
    const { store } = await toggled(MAX_RETIRED_IDS, (id) => (calls.push(id), true));
    await store.settleRetired();
    expect(store.allIds()).toHaveLength(MAX_RETIRED_IDS);
    expect(calls).toEqual([]);
  });

  it('the 21st toggle asks to forget the oldest id first, and removes it only once acknowledged', async () => {
    const order: string[] = [];
    let listAtCall: string[] = [];
    const holder: { store?: ConsentStore } = {};
    const { store, minted } = await toggled(MAX_RETIRED_IDS + 1, (id) => {
      order.push(id);
      listAtCall = holder.store?.allIds() ?? [];
      return true;
    }).then((r) => ((holder.store = r.store), r));
    expect(order).toEqual([]);
    await store.settleRetired();
    expect(order).toEqual([minted[0]]);
    expect(listAtCall).toContain(minted[0]);
    expect(store.allIds()).toHaveLength(MAX_RETIRED_IDS);
    expect(store.allIds()).not.toContain(minted[0]);
  });

  it('keeps the oldest id when the call is refused, throws or rejects, and tries it again next time', async () => {
    for (const answer of [() => false, () => { throw new Error('offline'); }, () => Promise.reject(new Error('offline'))]) {
      const { store, storage, minted } = await toggled(MAX_RETIRED_IDS + 1, answer as () => boolean);
      await store.settleRetired();
      expect(store.allIds()).toHaveLength(MAX_RETIRED_IDS + 1);
      expect(store.allIds()).toContain(minted[0]);
      expect(JSON.parse(storage.dump()[STORAGE_KEYS.retired] as string)).toContain(minted[0]);
    }
    const retry: string[] = [];
    let up = false;
    const { store, minted } = await toggled(MAX_RETIRED_IDS + 1, (id) => (retry.push(id), up));
    await store.settleRetired();
    up = true;
    await store.settleRetired();
    expect(retry).toEqual([minted[0], minted[0]]);
    expect(store.allIds()).not.toContain(minted[0]);
  });

  it('never drops an id when there is no forget callback at all', async () => {
    const { store, minted } = await toggled(MAX_RETIRED_IDS + 3);
    await store.settleRetired();
    expect(store.allIds()).toHaveLength(MAX_RETIRED_IDS + 3);
    expect(store.allIds()).toContain(minted[0]);
  });

  it('through the client: the off finishes first, then the oldest id is forgotten', async () => {
    const calls: string[] = [];
    const provider = recordingProvider();
    const analytics = createAnalytics({
      provider,
      randomId: ids(),
      flushIntervalMs: 0,
      forgetRetiredId: (id) => {
        calls.push(`forget:${provider.calls.map((c) => c.method).at(-1)}`);
        void id;
        return true;
      },
    });
    await analytics.init();
    for (let i = 0; i < MAX_RETIRED_IDS + 1; i++) {
      await analytics.grant();
      await analytics.revoke();
    }
    expect(calls).toEqual(['forget:reset']);
    expect(analytics.analyticsIds()).toHaveLength(MAX_RETIRED_IDS);
  });
});
