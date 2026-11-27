/// <reference types="node" />
/**
 * [BL-528][LEGAL-REQ-034] An offline export carries this phone's copy of the consent record (council ruling CPrivO-21).
 * After a full signed-in read the phone keeps the person's own rows, in the shapes the export already writes, with
 * when they were read. An export that cannot read the server then holds that record and says when it was read. A copy
 * for another account is never used, no copy keeps `unavailable`, and a failed or partial read never replaces a good
 * copy. Each delete path (sign-out, the account-deletion request, Erase everything) has a test that fails without it.
 * Fictional family "Asha" only (CLAUDE.md).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSENT_COPY_KEY, consentFromCopy, copyStoreFor, encodeConsentCopy, readServerRecordsWithCopy, type ConsentCopyStore } from '../src/lib/export/consent-copy.logic';
import type { ReadOptions, ReadResult, ServerRecordsReader } from '../src/lib/export/server-records.logic';
import type { OpenRequest } from '../src/lib/account-deletion/open-request';
import { removeEverything } from '../src/lib/db/repos/wipe';
import { nodeDb } from './helpers/node-db';

const h = vi.hoisted(() => ({ settings: new Map<string, string>(), calls: [] as string[] }));
vi.mock('@/lib/store', () => ({ getSetting: (k: string) => h.settings.get(k) ?? null, setSetting: (k: string, v: string) => void h.settings.set(k, v), deleteSetting: (k: string) => void h.settings.delete(k) }));
vi.mock('../src/lib/auth/apple', () => ({ forgetAppleUser: async () => void h.calls.push('apple'), clearPendingAppleName: async () => void h.calls.push('pendingName') }));
vi.mock('../src/lib/auth/pending', () => ({ clearPendingEmailRequest: async () => void h.calls.push('pending') }));

import { deviceConsentCopy } from '../src/lib/export/consent-copy';
import { forgetSignOutLeftovers } from '../src/lib/auth/sign-out-leftovers';

const ASHA_MAMA = 'user-asha-mama';
const ASHA_PAPA = 'user-asha-papa';
const HASH = 'cd'.repeat(32);
const READ_AT = '2027-03-01T09:00:00.000Z';
const LATER = '2027-03-15T10:00:00.000Z';

const act = (over: Record<string, unknown> = {}) => ({
  id: 'a1', profile_id: ASHA_MAMA, subject_hash: 'ef'.repeat(32), pseudonymised_at: null, document: 'terms', version: '1.0.0', action: 'accept',
  method: 'signin_sheet', surface: 'signin.terms', accepted_at: '2027-01-02T00:00:00+00:00', client_recorded_at: '2027-01-01T23:59:58+00:00',
  app_version: '1.0.0', platform: 'ios', locale: 'en-US', rendered_sha256: `\\x${HASH}`, context: { auth: 'apple', age_attested: true }, ...over,
});
const state = [{ document: 'terms', version: '1.0.0', action: 'accept', accepted_at: '2027-01-02T00:00:00+00:00' }];
const ok = (data: unknown[]): ReadResult => ({ data, error: null });
const online = (acts: unknown[] = [act()]): ServerRecordsReader => ({
  acts: async () => ok(acts),
  state: async () => ok(state),
  profile: async (_s, uid) => ok([{ id: uid, display_name: 'Asha Mama', signs_as: 'Mama', created_at: '2026-10-01T00:00:00+00:00' }]),
});
const down = async (): Promise<ReadResult> => ({ data: null, error: { message: 'Network request failed' } });
const offline: ServerRecordsReader = { acts: down, state: down, profile: down };

const memoryStore = () => {
  const s = { value: null as string | null, writes: 0, read: () => s.value, write: (v: string) => void ((s.writes += 1), (s.value = v)) };
  return s;
};
const opts = (over: Partial<ReadOptions> = {}): ReadOptions =>
  ({ authUserId: ASHA_MAMA, ownerId: ASHA_MAMA, reader: online(), timeoutMs: 200, now: () => new Date(READ_AT), ...over });

beforeEach(() => void (h.settings.clear(), (h.calls.length = 0)));

describe('[BL-528][LEGAL-REQ-034] an offline export after one signed-in read', () => {
  it('holds the record and says when it was read (the earlier read, not the export time)', async () => {
    const store = memoryStore();
    const first = await readServerRecordsWithCopy(opts(), store);
    expect([first.consent.status, store.writes]).toEqual(['included', 1]);
    const off = await readServerRecordsWithCopy(opts({ reader: offline, now: () => new Date(LATER) }), store);
    expect(off.consent).toEqual({ ...first.consent, status: 'included', read_at: READ_AT });
    expect(off.consent.acts[0]).toMatchObject({ id: 'a1', document: 'terms', rendered_sha256: HASH });
    expect(off.profile.status).toBe('unavailable'); // the profile is not copied
  });

  it('a later full read replaces the copy with the newer record and time', async () => {
    const store = memoryStore();
    await readServerRecordsWithCopy(opts(), store);
    await readServerRecordsWithCopy(opts({ reader: online([act(), act({ id: 'a2', accepted_at: '2027-03-10T00:00:00+00:00' })]), now: () => new Date(LATER) }), store);
    const off = (await readServerRecordsWithCopy(opts({ reader: offline }), store)).consent;
    expect([off.read_at, off.acts.map((a) => a.id)]).toEqual([LATER, ['a1', 'a2']]);
  });
});

describe('[BL-528][LEGAL-REQ-034] no copy, or a copy that is not this account\'s', () => {
  it('no copy keeps `unavailable`', async () => {
    const off = await readServerRecordsWithCopy(opts({ reader: offline }), memoryStore());
    expect(off.consent).toEqual({ status: 'unavailable', read_at: null, current: [], acts: [] });
  });

  it('a copy read for another account is never used', async () => {
    const store = memoryStore();
    await readServerRecordsWithCopy(opts({ authUserId: ASHA_PAPA, ownerId: ASHA_PAPA }), store);
    expect((await readServerRecordsWithCopy(opts({ reader: offline }), store)).consent).toMatchObject({ status: 'unavailable', acts: [] });
    expect(consentFromCopy(store.value, ASHA_MAMA)).toBeNull();
  });

  it('signed out, or another account than the letters\' owner: the copy is neither read nor written', async () => {
    const store = memoryStore();
    await readServerRecordsWithCopy(opts(), store);
    const saved = store.value;
    let reads = 0;
    const counting: ConsentCopyStore = { read: () => (reads++, store.value), write: store.write };
    expect((await readServerRecordsWithCopy(opts({ authUserId: null, reader: offline }), counting)).consent.status).toBe('not_signed_in');
    expect((await readServerRecordsWithCopy(opts({ authUserId: ASHA_PAPA }), counting)).consent.status).toBe('different_account');
    expect([reads, store.writes, store.value]).toEqual([0, 1, saved]);
  });

  it('no store (an account-deletion request is open): an offline export says `unavailable`', async () => {
    expect((await readServerRecordsWithCopy(opts({ reader: offline }), null)).consent.status).toBe('unavailable');
    // The app passes the store through copyStoreFor with the phone's note on the request (export/device.ts).
    const device = readFileSync(join(__dirname, '..', 'src/lib/export/device.ts'), 'utf8');
    expect(device).toMatch(/\}, copyStoreFor\(\(\) => readOpenRequest\(\{ get: getSetting \}\), authUserId, Date\.now, deviceConsentCopy\)\)/);
  });

  it('[DATA-REQ-053] while this account has a request open, the copy is neither read nor written', async () => {
    const store = memoryStore();
    await readServerRecordsWithCopy(opts(), store);
    const saved = store.value;
    const writes = store.writes;
    const open: OpenRequest = { state: 'scheduled', requestId: 'req-1', scheduledFor: '2099-01-01T00:00:00.000Z', userId: ASHA_MAMA };
    const now = Date.parse('2027-03-15T10:00:00.000Z');
    const at = () => now;
    expect(copyStoreFor(() => open, ASHA_MAMA, at, store)).toBeNull();
    const offlineExport = await readServerRecordsWithCopy(opts({ reader: offline }), copyStoreFor(() => open, ASHA_MAMA, at, store));
    expect(offlineExport.consent.status).toBe('unavailable');
    const onlineExport = await readServerRecordsWithCopy(opts(), copyStoreFor(() => open, ASHA_MAMA, at, store));
    expect(onlineExport.consent.status).toBe('included');
    expect([store.writes, store.value]).toEqual([writes, saved]);
    // No note, or a note for another account: the copy is used as usual, through the store.
    for (const note of [null, { ...open, userId: ASHA_PAPA }]) {
      const through = copyStoreFor(() => note, ASHA_MAMA, at, store);
      expect(through?.read()).toBe(saved);
      await readServerRecordsWithCopy(opts(), through);
    }
    expect(store.writes).toBe(writes + 2);
  });

  it('a note that cannot be read writes nothing and reads nothing', async () => {
    const store = memoryStore();
    await readServerRecordsWithCopy(opts(), store);
    let fail = false;
    const copy = copyStoreFor(() => { if (fail) throw new Error('database locked'); return null; }, ASHA_MAMA, Date.now, store);
    fail = true;
    expect((await readServerRecordsWithCopy(opts({ reader: offline }), copy)).consent.status).toBe('unavailable');
    expect((await readServerRecordsWithCopy(opts(), copy)).consent.status).toBe('included');
    expect(store.writes).toBe(1);
  });
});

describe('[FU-13a][DATA-REQ-053] a request made while the export reads the server', () => {
  const open: OpenRequest = { state: 'scheduled', requestId: 'req-1', scheduledFor: '2099-01-01T00:00:00.000Z', userId: ASHA_MAMA };
  // The server read waits on `gate`; the test makes the request on this phone in between, as the screen would.
  const paused = (base: ServerRecordsReader) => {
    let release = () => {};
    const gate = new Promise<void>((r) => (release = r));
    const reader: ServerRecordsReader = { ...base, acts: async (...a) => (await gate, base.acts(...a)) };
    return { reader, release };
  };
  // What use-account-deletion.ts does once the server takes the request: the note first, then the copy goes.
  const requestOnThisPhone = (store: ReturnType<typeof memoryStore>, notes: { value: OpenRequest | null }) => {
    notes.value = open;
    store.value = null;
  };

  it('a full read that ends after the request does not put the copy back', async () => {
    const store = memoryStore();
    await readServerRecordsWithCopy(opts(), store);
    const notes = { value: null as OpenRequest | null };
    const { reader, release } = paused(online());
    const exporting = readServerRecordsWithCopy(opts({ reader }), copyStoreFor(() => notes.value, ASHA_MAMA, Date.now, store));
    await Promise.resolve();
    requestOnThisPhone(store, notes);
    release();
    const r = await exporting;
    expect(r.consent.status).toBe('included'); // the export still carries what it read
    expect([store.value, store.writes]).toEqual([null, 1]);
  });

  it('an offline read that ends after the request does not read the copy', async () => {
    const store = memoryStore();
    await readServerRecordsWithCopy(opts(), store);
    const saved = store.value;
    const notes = { value: null as OpenRequest | null };
    const { reader, release } = paused(offline);
    const exporting = readServerRecordsWithCopy(opts({ reader }), copyStoreFor(() => notes.value, ASHA_MAMA, Date.now, store));
    await Promise.resolve();
    // Another phone's request reaches this one as a note only; its copy is still there and must not be used.
    notes.value = open;
    release();
    expect((await exporting).consent.status).toBe('unavailable');
    expect(store.value).toBe(saved);
  });
});

describe('[BL-528][LEGAL-REQ-034] a failed or partial read never replaces a good copy', () => {
  it('an error, a bad row or a short state read leaves the copy as it was, and writes nothing', async () => {
    const store = memoryStore();
    await readServerRecordsWithCopy(opts(), store);
    const good = store.value;
    const badRow = online([act(), act({ id: 'a3', action: 'shrug' })]);
    const stateFails: ServerRecordsReader = { ...online(), state: async () => ({ data: null, error: { message: 'boom' } }) };
    for (const reader of [offline, badRow, stateFails]) {
      const r = await readServerRecordsWithCopy(opts({ reader, now: () => new Date(LATER) }), store);
      expect([r.consent.status, r.consent.read_at]).toEqual(['included', READ_AT]);
    }
    expect([store.writes, store.value]).toEqual([1, good]);
    const fresh = memoryStore(); // a first read with a bad row writes nothing at all
    expect((await readServerRecordsWithCopy(opts({ reader: badRow }), fresh)).consent.status).toBe('unavailable');
    expect([fresh.writes, fresh.value]).toEqual([0, null]);
  });

  it('a stored copy with a bad row, the wrong shape or bad JSON is no copy, never a shorter one', () => {
    const good = JSON.parse(encodeConsentCopy(ASHA_MAMA, { status: 'included', read_at: READ_AT, current: [], acts: [] })!);
    const withAct = { ...good, acts: [{ id: 'a1', document: 'terms', version: '1.0.0', action: 'accept', method: '', surface: '', at: READ_AT, client_recorded_at: null, app_version: '1.0.0', platform: 'ios', locale: null, rendered_sha256: null, context: {} }] };
    expect(consentFromCopy(JSON.stringify(withAct), ASHA_MAMA)?.acts).toHaveLength(1);
    const bad = [{ ...withAct, acts: [...withAct.acts, { ...withAct.acts[0], id: 'a2', action: 'shrug' }] }, { ...good, v: 2 }, { ...good, read_at: 'yesterday' }];
    for (const raw of [...bad.map((b) => JSON.stringify(b)), '{not json']) expect(consentFromCopy(raw, ASHA_MAMA)).toBeNull();
  });
});

describe('[BL-528][CPrivO-21] the stored shape', () => {
  it('holds only the exported shapes, the account and when: never profile_id, subject_hash or a retention column', async () => {
    const store = memoryStore();
    await readServerRecordsWithCopy(opts(), store);
    const raw = store.value ?? '';
    for (const banned of ['profile_id', 'subject_hash', 'pseudonymised_at', 'ef'.repeat(32), 'display_name', 'signs_as']) expect(raw).not.toContain(banned);
    const v = JSON.parse(raw);
    expect(Object.keys(v).sort()).toEqual(['account_id', 'acts', 'current', 'read_at', 'v']);
    const exported = (await readServerRecordsWithCopy(opts(), null)).consent;
    expect(Object.keys(v.acts[0]).sort()).toEqual(Object.keys(exported.acts[0]).sort()); // exactly what account.json carries
    expect(Object.keys(v.current[0]).sort()).toEqual(['action', 'at', 'document', 'version']);
    expect([v.account_id, v.read_at]).toEqual([ASHA_MAMA, READ_AT]);
  });

  it('nothing but a full read is ever encoded', async () => {
    for (const status of ['unavailable', 'not_signed_in', 'different_account'] as const) expect(encodeConsentCopy(ASHA_MAMA, { status, read_at: null, current: [], acts: [] })).toBeNull();
  });
});

describe('[BL-528][CPrivO-21] the copy is deleted', () => {
  it('on every sign-out: the shared step removes it, with the other leftovers', async () => {
    deviceConsentCopy.write(encodeConsentCopy(ASHA_MAMA, { status: 'included', read_at: READ_AT, current: [], acts: [] }) ?? '');
    h.settings.set('child.bornCardHidden.asha', '2026-03-01');
    expect(h.settings.size).toBe(2);
    await forgetSignOutLeftovers();
    expect([...h.settings.keys()]).toEqual(['child.bornCardHidden.asha']);
    expect(h.calls).toEqual(['apple', 'pendingName', 'pending']);
  });

  it('by Erase everything: every setting goes, the copy with them', () => {
    const { db, close } = nodeDb();
    db.exec('CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    for (const [k, v] of [[CONSENT_COPY_KEY, '{"v":1}'], ['erase.everything.pending', 'x']]) db.run('INSERT INTO settings (key, value) VALUES (?, ?)', k, v);
    removeEverything({ db } as never);
    expect(db.all<{ key: string }>('SELECT key FROM settings').map((r) => r.key)).toEqual(['erase.everything.pending']);
    close();
  });
});
