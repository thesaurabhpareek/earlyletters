import { describe, expect, it } from 'vitest';
import { ConsentStore, createAnalytics, memoryStorage, recordingProvider, STORAGE_KEYS, majorOf } from '../src';

let n = 0;
const ids = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
const NOW = () => '2026-11-21T10:00:00.000Z';

function store(storage = memoryStorage(), currentVersion = '1.0') {
  return { storage, s: new ConsentStore(storage, ids, { currentVersion, now: NOW }) };
}

describe('[BL-251] consent version', () => {
  it('majorOf reads the major of "major.minor" and rejects anything else', () => {
    expect(majorOf('2.3')).toBe(2);
    expect(majorOf('1')).toBe(1);
    expect(majorOf('x')).toBeNull();
    expect(majorOf('')).toBeNull();
  });

  it('stores status, version and decided_at on grant and on revoke', async () => {
    const { storage, s } = store();
    await s.load();
    await s.grant();
    expect(JSON.parse(storage.dump()[STORAGE_KEYS.consentMeta]!)).toEqual({ version: '1.0', decided_at: NOW() });
    await s.revoke();
    expect(JSON.parse(storage.dump()[STORAGE_KEYS.consentMeta]!)).toEqual({ version: '1.0', decided_at: NOW() });
  });

  it('a newer major than the one granted loads as unknown, retires the id and keeps nothing live', async () => {
    const a = store();
    await a.s.load();
    const id = await a.s.grant();
    const b = store(a.storage, '2.0');
    const snap = await b.s.load();
    expect(snap.status).toBe('unknown');
    expect(b.s.id).toBeNull();
    expect(snap.retired).toContain(id);
  });

  it('a newer minor keeps the grant', async () => {
    const a = store();
    await a.s.load();
    await a.s.grant();
    const b = store(a.storage, '1.7');
    expect((await b.s.load()).status).toBe('granted');
  });

  it('a decline under an older major is asked again too', async () => {
    const a = store();
    await a.s.load();
    await a.s.revoke();
    const b = store(a.storage, '2.0');
    expect((await b.s.load()).status).toBe('unknown');
  });

  it('a grant from before versions existed counts as major 1', async () => {
    const storage = memoryStorage({ [STORAGE_KEYS.consent]: 'granted', [STORAGE_KEYS.id]: 'old-id' });
    const b = store(storage, '1.0');
    expect((await b.s.load()).status).toBe('granted');
    const c = store(memoryStorage({ [STORAGE_KEYS.consent]: 'granted', [STORAGE_KEYS.id]: 'old-id' }), '2.0');
    expect((await c.s.load()).status).toBe('unknown');
  });

  it('a malformed meta row is treated as major 1, never throws', async () => {
    const storage = memoryStorage({ [STORAGE_KEYS.consent]: 'granted', [STORAGE_KEYS.id]: 'i', [STORAGE_KEYS.consentMeta]: '{nope' });
    expect((await store(storage).s.load()).status).toBe('granted');
  });
});

describe('[BL-251] pending acts', () => {
  it('records accept, decline and withdraw acts with version, surface and client time, and nothing else', async () => {
    const { storage, s } = store();
    await s.load();
    await s.grant('consent_sheet');
    await s.revoke('settings');
    expect(s.pendingActs()).toEqual([
      { action: 'accept', version: '1.0', surface: 'consent_sheet', client_recorded_at: NOW() },
      { action: 'withdraw', version: '1.0', surface: 'settings', client_recorded_at: NOW() },
    ]);
    expect(Object.keys(s.pendingActs()[0]!).sort()).toEqual(['action', 'client_recorded_at', 'surface', 'version']);
    expect(storage.dump()[STORAGE_KEYS.pendingActs]).toBeDefined();
  });

  it('a revoke while still unknown is a decline, a revoke after a grant is a withdraw', async () => {
    const { s } = store();
    await s.load();
    await s.revoke('consent_sheet');
    expect(s.pendingActs().map((a) => a.action)).toEqual(['decline']);
  });

  it('survives a restart and is dropped only once acknowledged, oldest first', async () => {
    const { storage, s } = store();
    await s.load();
    await s.grant('settings');
    await s.revoke('settings');
    const again = store(storage).s;
    await again.load();
    expect(again.pendingActs()).toHaveLength(2);
    await again.acknowledgeActs(1);
    expect(again.pendingActs().map((a) => a.action)).toEqual(['withdraw']);
    const third = store(storage).s;
    await third.load();
    expect(third.pendingActs().map((a) => a.action)).toEqual(['withdraw']);
  });

  it('is capped so a loop cannot grow the settings row without bound', async () => {
    const { s } = store();
    await s.load();
    for (let i = 0; i < 80; i++) await s.revoke('settings');
    expect(s.pendingActs().length).toBeLessThanOrEqual(50);
  });

  it('a malformed or hostile stored row yields only well-formed acts (no free text survives)', async () => {
    const bad = JSON.stringify([
      { action: 'accept', version: '1.0', surface: 'consent_sheet', client_recorded_at: NOW(), note: 'Asha laughed' },
      { action: 'steal', version: '1.0', surface: 'settings', client_recorded_at: NOW() },
      { action: 'decline', version: 'Asha', surface: 'settings', client_recorded_at: NOW() },
      'x',
    ]);
    const { s } = store(memoryStorage({ [STORAGE_KEYS.pendingActs]: bad }));
    await s.load();
    expect(s.pendingActs()).toEqual([{ action: 'accept', version: '1.0', surface: 'consent_sheet', client_recorded_at: NOW() }]);
  });

  it('forgetAllIds (erase) also wipes pending acts and meta', async () => {
    const { storage, s } = store();
    await s.load();
    await s.grant('settings');
    await s.forgetAllIds();
    expect(s.pendingActs()).toEqual([]);
    expect(storage.dump()[STORAGE_KEYS.pendingActs]).toBeUndefined();
    expect(storage.dump()[STORAGE_KEYS.consentMeta]).toBeUndefined();
  });
});

describe('[BL-251] createAnalytics', () => {
  it('sends nothing and opts out after a major bump, and exposes the pending acts', async () => {
    const storage = memoryStorage();
    const first = createAnalytics({ provider: recordingProvider(), storage, randomId: ids, flushIntervalMs: 0, consentVersion: '1.0' });
    await first.init();
    await first.grant('consent_sheet');
    const provider = recordingProvider();
    const next = createAnalytics({ provider, storage, randomId: ids, flushIntervalMs: 0, consentVersion: '2.0' });
    expect(await next.init()).toBe('unknown');
    expect(next.track('screen_view', { route: 'tonight' })).toBe('dropped_no_consent');
    expect(provider.calls.map((c) => c.method)).not.toContain('identify');
    expect(provider.calls.map((c) => c.method)).toContain('optOut');
    expect(next.pendingActs()).toHaveLength(1);
    await next.acknowledgeActs(1);
    expect(next.pendingActs()).toEqual([]);
  });
});

describe('[BL-251] guards', () => {
  it('an unparseable consent version throws without echoing it, in the store and in createAnalytics', () => {
    for (const v of ['v2', '', '1.0.0', 'Asha']) {
      expect(() => new ConsentStore(memoryStorage(), ids, { currentVersion: v })).toThrow(/major\.minor/);
      expect(() => createAnalytics({ provider: recordingProvider(), consentVersion: v })).toThrow(/major\.minor/);
      try {
        new ConsentStore(memoryStorage(), ids, { currentVersion: v });
      } catch (e) {
        if (v) expect((e as Error).message).not.toContain(v);
      }
    }
  });

  it('acknowledgeActs ignores NaN, Infinity, negative and fractional counts and keeps every act', async () => {
    const { s } = store();
    await s.load();
    await s.grant('settings');
    await s.revoke('settings');
    for (const bad of [NaN, Infinity, -Infinity, -1, 0.5]) {
      await s.acknowledgeActs(bad);
      expect(s.pendingActs()).toHaveLength(2);
    }
    await s.acknowledgeActs(1);
    expect(s.pendingActs()).toHaveLength(1);
  });
});
