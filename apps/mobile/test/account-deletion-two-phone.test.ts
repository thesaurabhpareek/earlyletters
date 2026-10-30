/// <reference types="node" />
/**
 * Delete account, end to end on the real SQL (coordinator D-117; critics' pass 30 Oct 2026, M1): every phone is a real
 * store facade over its own node:sqlite database with the app's migrations, the sync engine talks to one server, the
 * real supabase/migrations in PGlite run as the signed-in user (helpers/sync-server.ts), and the request and the cancel
 * are the real request_account_deletion and cancel_account_deletion. What is read off is what the screens read:
 * the listed books (Tonight, Book), Recently deleted, and the screen choice (lib/account-deletion/open-request.ts).
 *
 *  - A sole parent: the request closes her book on the server; her phone's next pull stops listing it and, with the
 *    request noted, she is on the deletion screen, not the welcome; the cancel puts the book and the letters back on the
 *    server, and the next pull lists the book again and empties Recently deleted.
 *  - A co-parent: the book is not closed by the request; her phone keeps listing it, her own letters wait in Recently
 *    deleted, and the cancel brings them back; the other parent's phone keeps the book throughout.
 * Not seen on a phone or on staging: these are the phone's SQLite and the repo's SQL, not the store build and not a
 * real Supabase project. Fictional family "Asha" only (CLAUDE.md).
 */
import { randomBytes } from 'node:crypto';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SqlDb } from '../src/lib/db/sql';
import type { SupabaseLike } from '../src/lib/sync/types';
import { chooseScreen, noteAfterCancel, noteAfterRead, noteWithBook, OPEN_REQUEST_KEY, parseOpenRequest, type OpenRequest } from '../src/lib/account-deletion/open-request';
import { nodeDb } from './helpers/node-db';
import { startSyncServer, type SyncServer } from './helpers/sync-server';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(randomBytes(n)) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const MAMA = '11111111-1111-1111-1111-111111111111'; // the sole parent
const SONA = '33333333-3333-3333-3333-333333333333'; // a parent who shares the book
const PAPA = '22222222-2222-2222-2222-222222222222'; // her co-parent

const clock = { t: Date.now() };
const iso = () => new Date(clock.t).toISOString();
const tick = (ms = 60_000) => {
  clock.t += ms;
};

function uuid7(ms = clock.t): string {
  const b = randomBytes(16);
  let t = BigInt(ms);
  for (let i = 5; i >= 0; i--) {
    b[i] = Number(t & 0xffn);
    t >>= 8n;
  }
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

type Store = typeof import('../src/lib/store');

interface Phone {
  store: Store;
  db: SqlDb;
  sync: (server?: SupabaseLike) => Promise<unknown>;
  signIn: () => Promise<void>;
  /** The screen this phone would choose now (the welcome route's gate), from its own listed books and note. */
  screen: (o?: { signedIn?: boolean; checked?: boolean }) => ReturnType<typeof chooseScreen>;
  note: () => OpenRequest | null;
}

let server: SyncServer;

async function phone(uid: string): Promise<Phone> {
  vi.resetModules();
  const store = (await import('../src/lib/store')) as Store;
  const caps = await import('../src/lib/capabilities');
  caps.setServerFeaturesForTests(true);
  const { createSyncEngine } = await import('../src/lib/sync/engine');
  const handle = nodeDb();
  expect(store.openStore({ open: () => ({ db: handle.db, close: () => {} }), now: iso, newId: (at?: number) => uuid7(at ?? clock.t) }).ok).toBe(true);
  const engine = (s: SupabaseLike) =>
    createSyncEngine({
      db: store.localSqlDb(), supabase: s, userId: uid, newId: () => uuid7(), now: () => clock.t, random: () => 1,
      setTimer: () => 0, clearTimer: () => {}, isActive: () => false,
      afterPull: () => store.finishServerErased(() => {}),
    });
  const hasDeleted = () => store.localSqlDb().get("SELECT 1 AS x FROM children WHERE server_state = 'deleted' LIMIT 1") !== null;
  const note = () => parseOpenRequest(store.getSetting(OPEN_REQUEST_KEY));
  return {
    store,
    db: handle.db,
    sync: (s = server.serverFor(uid)) => engine(s).sync(),
    signIn: async () => {
      const e = engine(server.serverFor(uid));
      expect(e.start()).not.toBeNull();
      await e.sync();
    },
    screen: (o = {}) =>
      chooseScreen({
        hasBook: store.listChildren().length > 0, note: note(), nowMs: Date.now(), signedIn: o.signedIn ?? true, hasDeletedBook: hasDeleted(), checked: o.checked ?? false,
      }),
    note,
  };
}

function writeLetter(p: Phone, childId: string, text: string): string {
  tick(5_000);
  const d = p.store.createDraft({ childId, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: text });
  const child = p.store.getChild(childId)!;
  p.store.saveLetterFromDraft(d.id, {
    id: d.id, kind: 'letter', occurredOn: iso().slice(0, 10), capturedAt: d.createdAt, captureMode: 'typed', editLevel: 'verbatim',
    promptKey: null, engineVersion: 5, rawTranscript: text, machineEdits: [], finalText: text, inBook: true,
    soundsLikeMe: null, childId, authorSignsAs: child.signsAs, audioUri: null,
  });
  return d.id;
}

/** What the person's own request does to the server, as the screen's Delete account press does (api.ts requestDeletion). */
const requestDeletion = async (uid: string) => (await server.userSql(uid, `select * from public.request_account_deletion('ios', false)`)).rows[0] as { request_id: string; scheduled_for: string };
const cancelDeletion = async (uid: string) => (await server.userSql(uid, `select public.cancel_account_deletion() as ok`)).rows[0].ok as boolean;
const openStatus = async (uid: string) => (await server.userSql(uid, `select id, status, scheduled_for from deletion_requests where kind = 'account' and status in ('scheduled', 'held', 'executing')`)).rows;
const bookDeletedAt = async (id: string) => (await server.sys('select deleted_at from children where id = $1', [id])).rows[0].deleted_at as string | null;
const serverEntryDeletedAt = async (id: string) => (await server.sys('select deleted_at from entries where id = $1', [id])).rows[0].deleted_at as string | null;

describe('Delete account on the real SQL: the sole parent and the co-parent', () => {
  let mama: Phone;
  let sona: Phone;
  let papa: Phone;
  let ASHA = '';
  let SHARED = '';
  const ids: Record<string, string> = {};

  beforeEach(async () => {
    if (server) await server.sys('delete from sync_rate_windows');
  });

  beforeAll(async () => {
    server = await startSyncServer({ users: [MAMA, SONA, PAPA], protocol: 'v1' });
    await server.consent(MAMA, SONA, PAPA);
    mama = await phone(MAMA);
    sona = await phone(SONA);
    papa = await phone(PAPA);

    ASHA = mama.store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
    ids.m1 = writeLetter(mama, ASHA, 'You laughed at the rain today.');
    ids.m2 = writeLetter(mama, ASHA, 'You found your feet.');
    await mama.signIn();

    SHARED = sona.store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Sona' }).id;
    ids.s1 = writeLetter(sona, SHARED, 'You waved at the bus.');
    await sona.signIn();
    const token = (await server.userSql(SONA, `select public.create_child_invite($1, 'parent') t`, [SHARED])).rows[0].t;
    await server.userSql(PAPA, 'select public.accept_child_invite($1)', [token]);
    await papa.signIn();
    ids.p1 = writeLetter(papa, SHARED, 'Bath time, and you splashed us both.');
    await papa.sync();
    await sona.sync();
  }, 180_000);

  it('[sole parent] before any request: the book is listed and the phone is on the app', () => {
    expect(mama.store.listChildren().map((b) => b.id)).toEqual([ASHA]);
    expect(mama.screen()).toBe('app');
    expect(mama.store.listDeleted()).toEqual([]);
  });

  it('[sole parent] the request closes her book on the server; her phone\'s next pull stops listing it; with the request noted she is on the deletion screen, never the welcome', async () => {
    const r = await requestDeletion(MAMA);
    expect(await bookDeletedAt(ASHA)).not.toBeNull(); // the book goes with the account (the equals rule)
    expect(await serverEntryDeletedAt(ids.m1)).not.toBeNull();

    // What use-account-deletion writes when the request is answered.
    mama.store.setSetting(OPEN_REQUEST_KEY, JSON.stringify({ state: 'scheduled', requestId: r.request_id, scheduledFor: new Date(r.scheduled_for).toISOString() }));

    await mama.sync();
    expect(mama.db.get('SELECT server_state FROM children WHERE id = ?', ASHA)).toEqual({ server_state: 'deleted' });
    expect(mama.store.listChildren()).toEqual([]); // this is the state in which the app drew the first-run welcome
    expect(mama.store.listDeleted().map((e) => e.id).sort()).toEqual([ids.m1, ids.m2].sort()); // her letters wait in Recently deleted
    expect(mama.screen()).toBe('deletion');
    expect(mama.screen({ signedIn: false })).toBe('deletion');
    expect(mama.note()).toMatchObject({ state: 'scheduled', requestId: r.request_id });
  }, 60_000);

  it('[sole parent] the request is open on the server and can be read back by a phone that signs in again (the existing read the Delete account page makes)', async () => {
    const rows = await openStatus(MAMA);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ status: 'scheduled' });
    // Nobody else can read it (RLS: own rows).
    expect(await openStatus(SONA)).toEqual([]);
  });

  it('[sole parent, a second phone] a phone with no note waits on paper, then follows the server\'s answer to the deletion screen', async () => {
    const second = await phone(MAMA);
    await second.signIn(); // the account's book is closed: nothing to pull, nothing listed
    expect(second.store.listChildren()).toEqual([]);
    // Nothing closed locally: a brand new phone is first run (its sign-in sheet and the status read follow).
    expect(second.screen({ checked: true })).toBe('welcome');
    const rows = await openStatus(MAMA);
    const status = { state: 'scheduled' as const, requestId: String(rows[0].id), scheduledFor: new Date(String(rows[0].scheduled_for)).toISOString() };
    second.store.setSetting(OPEN_REQUEST_KEY, JSON.stringify(noteAfterRead(null, status, { hasBook: false, nowIso: iso() })));
    expect(second.screen({ checked: true })).toBe('deletion');
  }, 60_000);

  it('[sole parent] Cancel deletion puts the book and her letters back on the server, and her phone lists the book again after the next pull', async () => {
    expect(await cancelDeletion(MAMA)).toBe(true);
    expect(await bookDeletedAt(ASHA)).toBeNull();
    expect(await serverEntryDeletedAt(ids.m1)).toBeNull();
    expect(await serverEntryDeletedAt(ids.m2)).toBeNull();
    expect(await openStatus(MAMA)).toEqual([]);

    // What the phone does at once: no book is listed yet, so it notes the wait and is still not the welcome.
    mama.store.setSetting(OPEN_REQUEST_KEY, JSON.stringify(noteAfterCancel({ hasBook: mama.store.listChildren().length > 0 }, iso())));
    expect(mama.note()).toMatchObject({ state: 'cancelled' });
    expect(mama.screen()).toBe('deletion');

    await mama.sync();
    expect(mama.db.get('SELECT server_state FROM children WHERE id = ?', ASHA)).toEqual({ server_state: 'synced' });
    expect(mama.store.listChildren().map((b) => b.id)).toEqual([ASHA]);
    expect(mama.store.listDeleted()).toEqual([]);
    expect(mama.store.getEntry(ids.m1)).toMatchObject({ finalText: 'You laughed at the rain today.' });
    expect(mama.screen()).toBe('app');

    // The wait is over once the book is listed.
    const left = noteWithBook(mama.note());
    expect(left).toBeNull();
  }, 60_000);

  it('[co-parent] the request does not close the shared book: Sona\'s phone keeps listing it and stays on the app, Settings reachable', async () => {
    const r = await requestDeletion(SONA);
    expect(await bookDeletedAt(SHARED)).toBeNull(); // the book stays with the other parent
    expect(await serverEntryDeletedAt(ids.s1)).not.toBeNull(); // her own letter leaves it
    expect(await serverEntryDeletedAt(ids.p1)).toBeNull(); // his stays

    sona.store.setSetting(OPEN_REQUEST_KEY, JSON.stringify({ state: 'scheduled', requestId: r.request_id, scheduledFor: new Date(r.scheduled_for).toISOString() }));
    await sona.sync();
    await papa.sync();

    expect(sona.db.get('SELECT server_state FROM children WHERE id = ?', SHARED)).toEqual({ server_state: 'synced' });
    expect(sona.store.listChildren().map((b) => b.id)).toEqual([SHARED]);
    expect(sona.screen()).toBe('app'); // the open request does not take the app away from a phone that lists a book
    expect(sona.store.listDeleted().map((e) => e.id)).toEqual([ids.s1]); // as step 1 said: "Your letter leaves it", kept here
    expect(papa.store.listChildren().map((b) => b.id)).toEqual([SHARED]);
    expect(papa.screen()).toBe('app');
  }, 60_000);

  it('[co-parent] Cancel deletion brings her letter back, and the note is simply cleared (nothing to wait for)', async () => {
    expect(await cancelDeletion(SONA)).toBe(true);
    expect(noteAfterCancel({ hasBook: sona.store.listChildren().length > 0 }, iso())).toBeNull();
    sona.store.deleteSetting(OPEN_REQUEST_KEY);
    await sona.sync();
    await papa.sync();
    expect(sona.store.listDeleted()).toEqual([]);
    expect(sona.store.getEntry(ids.s1)).toMatchObject({ finalText: 'You waved at the bus.' });
    expect(sona.screen()).toBe('app');
    expect(papa.store.getEntry(ids.s1)).toMatchObject({ finalText: 'You waved at the bus.' });
  }, 60_000);

  it('the server accepts a new book for a person with an open request (read-only finding: nothing there refuses it), so the phone must not offer one', async () => {
    const r = await requestDeletion(MAMA);
    const NEW = uuid7();
    const created = await server.userSql(MAMA, `select public.create_child($1, 'Ravi', '2026-05-01', null) as id`, [NEW]);
    expect(created.rows[0].id).toBe(NEW);
    expect(await openStatus(MAMA)).toHaveLength(1);
    expect(String((await openStatus(MAMA))[0].id)).toBe(r.request_id);
    await cancelDeletion(MAMA);
  }, 60_000);
});
