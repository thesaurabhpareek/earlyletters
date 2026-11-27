/// <reference types="node" />
/**
 * A letter for another day (NS-15, BL-945), across phones and on the server. Each phone is the real store facade over
 * its own node:sqlite database with the app's migrations; the sync engine talks to one server, every file in
 * supabase/migrations in PGlite, run as the signed-in user (helpers/sync-server.ts), as sync-two-phone.test.ts does.
 * The about-day is `occurred_on` with `occurred_precision` (its own field group, last change wins); the said-on day is
 * `captured_at`, immutable on the server. The account purge runs the real request_account_deletion,
 * prepare_account_purge, the cascade from auth.users and finalize_account_deletion, in the purge worker's order.
 * Not seen on a phone or on staging. Fictional family "Asha" only: Mama (two phones) and Papa.
 */
import { randomBytes } from 'node:crypto';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SqlDb } from '../src/lib/db/sql';
import type { SyncEngine } from '../src/lib/sync/engine';
import type { SupabaseLike } from '../src/lib/sync/types';
import { nodeDb } from './helpers/node-db';
import { flaky, startSyncServer, type SyncServer } from './helpers/sync-server';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(randomBytes(n)) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const MAMA = '11111111-1111-1111-1111-111111111111';
const PAPA = '22222222-2222-2222-2222-222222222222';

// The server checks capture times against its own clock (within a day), so the phones start at now.
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
  sync: (server?: SupabaseLike) => ReturnType<SyncEngine['sync']>;
  signIn: () => Promise<void>;
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
  return {
    store,
    db: handle.db,
    sync: (s = server.serverFor(uid)) => engine(s).sync(),
    signIn: async () => {
      const e = engine(server.serverFor(uid));
      expect(e.start()).not.toBeNull();
      await e.sync();
    },
  };
}

/** A typed letter through Review's path: the draft, the parent's pick on it (setDraftOccurred), then Keep. */
function writeLetter(p: Phone, childId: string, text: string, about?: { day: string; precision: 'day' | 'month' }): string {
  tick(5_000);
  const d = p.store.createDraft({ childId, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: text });
  if (about) expect(p.store.setDraftOccurred(d.id, about.day, about.precision)).toBe(true);
  const child = p.store.getChild(childId)!;
  p.store.saveLetterFromDraft(d.id, {
    id: d.id, kind: 'letter', occurredOn: iso().slice(0, 10), capturedAt: d.createdAt, captureMode: 'typed', editLevel: 'verbatim',
    promptKey: null, engineVersion: 5, rawTranscript: text, machineEdits: [], finalText: text, inBook: true,
    soundsLikeMe: null, childId, authorSignsAs: child.signsAs, audioUri: null,
  });
  return d.id;
}

const serverDays = async (id: string) =>
  (await server.sys('select occurred_on::text as occurred_on, occurred_precision, captured_at from entries where id = $1', [id])).rows[0] as
    | { occurred_on: string; occurred_precision: string; captured_at: Date }
    | undefined;
/** A phone's row, with captured_at as one instant: a pulled row writes it as the server does (+00:00), a local one with Z. */
const localDays = (p: Phone, id: string) => {
  const r = p.db.get<{ occurred_on: string; occurred_precision: string; captured_at: string }>('SELECT occurred_on, occurred_precision, captured_at FROM entries WHERE id = ?', id);
  return r && { ...r, captured_at: new Date(r.captured_at).toISOString() };
};
const outbox = (p: Phone) => p.db.all<{ op_id: string; type: string }>('SELECT op_id, type FROM sync_outbox ORDER BY lane, seq');

describe('NS-15 across phones and on the server (protocol v1)', () => {
  let mama: Phone;
  let mama2: Phone;
  let papa: Phone;
  let ASHA = '';
  let letter = '';
  let saidAt = '';

  beforeEach(async () => {
    if (server) await server.sys('delete from sync_rate_windows');
  });

  beforeAll(async () => {
    server = await startSyncServer({ users: [MAMA, PAPA], protocol: 'v1' });
    await server.consent(MAMA, PAPA);
    // The deletion path refuses to run without the consent pepper (supabase/APPLY.md step 6); a fixed test value.
    await server.sys(`select set_config('app.consent_pepper', 'test-pepper-0123456789abcdef0123456789abcdef', false)`);
    mama = await phone(MAMA);
    papa = await phone(PAPA);
    mama2 = await phone(MAMA);
    ASHA = mama.store.addChild({ name: 'Asha', birthday: '2026-03-13', dueDate: null, signsAs: 'Mama' }).id;
    letter = writeLetter(mama, ASHA, 'The day you first held your head up.', { day: '2026-05-20', precision: 'day' });
    saidAt = mama.store.getEntry(letter)!.capturedAt;
    await mama.signIn();
    const token = (await server.userSql(MAMA, `select public.create_child_invite($1, 'parent') t`, [ASHA])).rows[0].t;
    await server.userSql(PAPA, 'select public.accept_child_invite($1)', [token]);
    await papa.signIn();
    await mama2.signIn();
  }, 180_000);

  it('the letter Review filed by its about-day reaches the server and both other phones with both days', async () => {
    expect(await serverDays(letter)).toMatchObject({ occurred_on: '2026-05-20', occurred_precision: 'day' });
    expect(new Date((await serverDays(letter))!.captured_at).toISOString()).toBe(saidAt);
    expect(localDays(mama2, letter)).toMatchObject({ occurred_on: '2026-05-20', occurred_precision: 'day', captured_at: saidAt });
    expect(localDays(papa, letter)).toMatchObject({ occurred_on: '2026-05-20', occurred_precision: 'day', captured_at: saidAt });
  }, 60_000);

  it('[NS-15-R10] offline change syncs: a move made with no network waits in the outbox and applies at the next sync', async () => {
    expect(mama.store.setEntryDate(letter, '2026-04-20', 'day')).toBe(true);
    const off = await mama.sync(flaky(server.serverFor(MAMA), { failBefore: 50 }));
    expect(off.phase).toBe('offline');
    expect(outbox(mama).map((o) => o.type)).toEqual(['entry.upsert']);
    expect((await serverDays(letter))?.occurred_on).toBe('2026-05-20');
    tick(2_000);
    expect(await mama.sync()).toMatchObject({ rejected: 0, conflicts: 0 });
    expect(outbox(mama)).toEqual([]);
    expect(await serverDays(letter)).toMatchObject({ occurred_on: '2026-04-20', occurred_precision: 'day' });
  }, 60_000);

  it('[NS-15-R9] applied once: a move whose answer was lost is sent again with the same op, and the server takes it once', async () => {
    expect(mama.store.setEntryDate(letter, '2026-06-02', 'day')).toBe(true);
    const [op] = outbox(mama);
    const lost = await mama.sync(flaky(server.serverFor(MAMA), { loseAnswer: 1, only: 'sync_push' }));
    expect(lost.phase).toBe('offline');
    expect(outbox(mama).map((o) => o.op_id)).toEqual([op.op_id]); // the sent op is never rewritten
    tick(2_000);
    expect(await mama.sync()).toMatchObject({ rejected: 0, conflicts: 0 });
    expect((await server.sys('select count(*)::int as n from sync_op_receipts where op_id = $1', [op.op_id])).rows[0].n).toBe(1);
    expect(outbox(mama)).toEqual([]);
    expect(await serverDays(letter)).toMatchObject({ occurred_on: '2026-06-02', occurred_precision: 'day' });
    expect(localDays(mama, letter)).toMatchObject({ occurred_on: '2026-06-02', occurred_precision: 'day', captured_at: saidAt });
  }, 60_000);

  it('[NS-15-R8] last change wins across phones: the second phone\'s later move wins by the field-group rule, and both show it', async () => {
    tick();
    expect(mama.store.setEntryDate(letter, '2026-04-25', 'day')).toBe(true);
    await mama.sync();
    tick();
    // Mama's second phone has not pulled the first move; its later change is to a month.
    expect(localDays(mama2, letter)?.occurred_on).not.toBe('2026-04-25');
    expect(mama2.store.setEntryDate(letter, '2026-06-13', 'month')).toBe(true);
    expect(await mama2.sync()).toMatchObject({ rejected: 0, conflicts: 0 });
    await mama.sync();
    expect(await serverDays(letter)).toMatchObject({ occurred_on: '2026-06-13', occurred_precision: 'month' });
    for (const p of [mama, mama2]) {
      expect(localDays(p, letter)).toMatchObject({ occurred_on: '2026-06-13', occurred_precision: 'month', captured_at: saidAt });
      expect(p.store.listConflicts(letter)).toEqual([]);
    }
  }, 60_000);

  it('[NS-15-R7] [NS-15-R14] the co-parent\'s phone cannot move it, and re-files it after its next pull', async () => {
    expect(papa.store.setEntryDate(letter, '2026-04-01', 'day')).toBe(false);
    await papa.sync();
    expect(localDays(papa, letter)).toMatchObject({ occurred_on: '2026-06-13', occurred_precision: 'month', captured_at: saidAt });
  }, 60_000);

  it('[NS-15-R11] account deletion: the purge takes the letter and a held draft from the server, with both their days', async () => {
    const held = mama.store.createDraft({ childId: ASHA, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'Your first swim.' });
    expect(mama.store.setDraftOccurred(held.id, '2026-07-04', 'day')).toBe(true);
    expect(mama.store.holdDraft(held.id, { inBookChoice: true })).toBe(true);
    await mama.sync();
    expect((await server.sys('select occurred_on::text as d from held_drafts where id = $1', [held.id])).rows[0]?.d).toBe('2026-07-04');

    const requestId = (await server.userSql(MAMA, `select * from public.request_account_deletion('ios', false)`)).rows[0].request_id as string;
    await server.sys(`update deletion_requests set status = 'executing', executing_at = now() where id = $1`, [requestId]);
    await server.sys('select public.prepare_account_purge($1)', [requestId]);
    await server.sys('delete from auth.users where id = $1', [MAMA]);
    await server.sys(`select public.finalize_account_deletion($1, '{"verified": true}')`, [requestId]);

    expect(await serverDays(letter)).toBeUndefined();
    expect((await server.sys('select count(*)::int as n from entry_versions where entry_id = $1', [letter])).rows[0].n).toBe(0);
    expect((await server.sys('select count(*)::int as n from held_drafts where id = $1', [held.id])).rows[0].n).toBe(0);
  }, 60_000);
});
