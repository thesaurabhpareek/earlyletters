/// <reference types="node" />
/**
 * Sync end to end (D-023): phones are real local databases (node:sqlite with
 * the app's migrations), the server is the real SQL (every file in
 * supabase/migrations, in PGlite), and the engine talks to it through a
 * SupabaseLike that runs each RPC as the signed-in user, as PostgREST would.
 * Fictional family "Asha" only (CLAUDE.md).
 */
import { randomBytes } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { beforeAll, describe, expect, it } from 'vitest';
import { MIGRATIONS, migrate } from '../src/lib/db/migrations';
import type { SqlDb } from '../src/lib/db/sql';
import { createSyncEngine, type SyncEngine } from '../src/lib/sync/engine';
import { digestOf } from '../src/lib/sync/merge';
import {
  enqueueBookCreate,
  enqueueEntryDelete,
  enqueueEntryRestore,
  enqueueEntryUpsert,
  pendingCount,
  readSetting,
} from '../src/lib/sync/outbox';
import { takeOwnership } from '../src/lib/sync/ownership';
import { ALL_GROUPS, type RpcResult, type SupabaseLike } from '../src/lib/sync/types';
import { nodeDb } from './helpers/node-db';

// ── Server (PGlite with every migration) ─────────────────────────────────
function migrationsDir(): string {
  for (const p of [resolve(process.cwd(), '../../supabase/migrations'), resolve(process.cwd(), 'supabase/migrations')]) {
    if (existsSync(p)) return p;
  }
  throw new Error('supabase/migrations not found');
}

const A = '11111111-1111-1111-1111-111111111111'; // Mama, two phones (A1, A2)
const B = '22222222-2222-2222-2222-222222222222'; // Papa, co-parent

let pg: PGlite;
let lock: Promise<unknown> = Promise.resolve();
/** PGlite has one connection: role switches and the call must not interleave. */
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = lock.then(fn, fn);
  lock = next.catch(() => undefined);
  return next;
}
const sys = (sql: string, params: unknown[] = []) => serial(() => pg.query<Record<string, unknown>>(sql, params));

async function asUser<T>(uid: string, run: () => Promise<T>): Promise<T> {
  const claims = JSON.stringify({ sub: uid, role: 'authenticated', is_anonymous: false });
  await pg.query(`select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)`, [uid, claims]);
  await pg.exec('set role authenticated');
  try {
    return await run();
  } finally {
    await pg.exec(`reset role; select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claims', '', false);`);
  }
}
const userSql = (uid: string, sql: string, params: unknown[] = []) => serial(() => asUser(uid, () => pg.query<Record<string, unknown>>(sql, params)));

/** PostgREST-like RPC: named arguments, errors as { code, message }, status 0 for no response. */
function serverFor(uid: string): SupabaseLike & { calls: { fn: string; args: Record<string, unknown> }[] } {
  const calls: { fn: string; args: Record<string, unknown> }[] = [];
  return {
    calls,
    rpc(fn: string, args: Record<string, unknown> = {}): PromiseLike<RpcResult> {
      calls.push({ fn, args: JSON.parse(JSON.stringify(args)) });
      const names = Object.keys(args);
      const sql = `select public.${fn}(${names.map((n, i) => `${n} => $${i + 1}${typeof args[n] === 'number' ? '::int' : '::jsonb'}`).join(', ')}) as r`;
      const params = names.map((n) => (typeof args[n] === 'number' ? args[n] : JSON.stringify(args[n])));
      return serial(() => asUser(uid, async () => {
        try {
          const r = await pg.query<{ r: unknown }>(sql, params);
          return { data: r.rows[0].r, error: null, status: 200 } as RpcResult;
        } catch (e) {
          const err = e as { code?: string; message?: string };
          return { data: null, error: { code: err.code ?? 'XX000', message: err.message }, status: 400 } as RpcResult;
        }
      }));
    },
  };
}

/** Wraps a server: the next `n` calls fail without reaching it, or reach it and lose the answer. */
function flaky(inner: SupabaseLike, plan: { failBefore?: number; loseAnswer?: number; failOnCall?: number; only?: string }) {
  let call = 0;
  return {
    rpc(fn: string, args?: Record<string, unknown>): PromiseLike<RpcResult> {
      if (plan.only && fn !== plan.only) return inner.rpc(fn, args);
      call++;
      if (plan.failOnCall === call) return Promise.resolve({ data: null, error: { code: '', message: 'FetchError: offline' }, status: 0 });
      if ((plan.failBefore ?? 0) > 0) {
        plan.failBefore!--;
        return Promise.resolve({ data: null, error: { code: '', message: 'FetchError: offline' }, status: 0 });
      }
      if ((plan.loseAnswer ?? 0) > 0) {
        plan.loseAnswer!--;
        return Promise.resolve(inner.rpc(fn, args)).then(() => ({ data: null, error: { code: '', message: 'FetchError: reset' }, status: 0 }));
      }
      return inner.rpc(fn, args);
    },
  };
}

// ── Phones ───────────────────────────────────────────────────────────────
const uuid7 = (ms = Date.now()): string => {
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
};

const clock = { t: Date.now() };
const now = () => clock.t;
const iso = () => new Date(clock.t).toISOString();
const ctx = () => ({ now: iso(), newId: () => uuid7() });

function newPhone(): SqlDb {
  const { db } = nodeDb();
  migrate(db, { now: iso(), newId: () => uuid7() });
  return db;
}

function engineOn(db: SqlDb, uid: string, supabase: SupabaseLike, pageSize = 200): SyncEngine {
  return createSyncEngine({
    db, supabase, userId: uid, newId: () => uuid7(), now, random: () => 1, pageSize,
    setTimer: () => 0, clearTimer: () => {}, isActive: () => false,
  });
}

// Local writes, as store.ts makes them: the row and its upload op in one transaction.
function addBook(db: SqlDb, name: string, birthday: string, signsAs = 'Mama'): string {
  const id = uuid7();
  db.transaction(() => {
    db.run('INSERT INTO children (id, name, birthday, due_date, signs_as, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, ?, ?)', id, name, birthday, signsAs, iso(), iso());
    enqueueBookCreate(db, id, ctx());
  });
  return id;
}
let seq = 0;
function saveLetter(db: SqlDb, childId: string, text: string, opts: { inBook?: boolean; waiting?: boolean } = {}): string {
  const id = uuid7(clock.t + ++seq);
  db.transaction(() => {
    db.run(
      `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, prompt_key, engine_version, raw_transcript,
         machine_edits, final_text, in_book, sounds_like_me, updated_at, child_id, author_id, author_signs_as, audio_uri, transcript_status)
       VALUES (?, 'letter', '2026-09-29', ?, 'spoken', 'clean', NULL, 2, ?, '[]', ?, ?, NULL, ?, ?, ?, 'Mama', 'file:///a.m4a', ?)`,
      id, iso(), opts.waiting ? '' : `um ${text}`, opts.waiting ? '' : text, opts.inBook === false ? 0 : 1, iso(), childId,
      readSetting(db, 'sync.ownerId'), opts.waiting ? 'waiting' : null,
    );
    enqueueEntryUpsert(db, id, ALL_GROUPS, ctx());
  });
  return id;
}
function editLetter(db: SqlDb, id: string, text: string): void {
  db.transaction(() => {
    db.run('UPDATE entries SET final_text = ?, updated_at = ? WHERE id = ?', text, iso(), id);
    enqueueEntryUpsert(db, id, ['text'], ctx());
  });
}
function deleteLetter(db: SqlDb, id: string): void {
  db.transaction(() => {
    db.run('UPDATE entries SET deleted_at = ? WHERE id = ?', iso(), id);
    enqueueEntryDelete(db, id, ctx());
  });
}
function undelete(db: SqlDb, id: string): void {
  db.transaction(() => {
    db.run('UPDATE entries SET deleted_at = NULL WHERE id = ?', id);
    enqueueEntryRestore(db, id, ctx());
  });
}
const local = (db: SqlDb, id: string) =>
  db.get<{ final_text: string; deleted_at: string | null; sync_state: string; author_id: string | null; server_version: string | null; raw_transcript: string }>(
    'SELECT * FROM entries WHERE id = ?', id);
const server = async (id: string) => (await sys('select final_text, deleted_at, raw_transcript from entries where id = $1', [id])).rows[0] as
  { final_text: string; deleted_at: string | null; raw_transcript: string } | undefined;
const outboxTypes = (db: SqlDb) => db.all<{ type: string }>('SELECT type FROM sync_outbox ORDER BY lane, seq').map((r) => r.type);

// ── The story ────────────────────────────────────────────────────────────
describe('sync end to end (phones on node:sqlite, server SQL on PGlite)', () => {
  let A1: SqlDb; let A2: SqlDb; let B1: SqlDb;
  let ASHA = ''; let NINA = '';
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    pg = new PGlite();
    await pg.exec(`
      create role authenticated nologin; create role anon nologin; create role service_role nologin bypassrls;
      create schema auth; create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated, anon;
      create schema storage;
      create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
      create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'),1)-1] $$;
      alter table storage.objects enable row level security;
      grant usage on schema storage to authenticated, anon; grant all on storage.objects to authenticated, anon;
      grant usage on schema public to authenticated, anon;
      alter default privileges in schema public grant select, insert, update, delete on tables to authenticated, anon;
    `);
    const dir = migrationsDir();
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) await pg.exec(readFileSync(join(dir, f), 'utf8'));
    await pg.exec(`insert into auth.users values ('${A}'), ('${B}')`);
    for (const doc of ['terms', 'sensitive-data']) {
      await pg.query(`insert into policy_versions (document, version, change_class, requires_reconsent, published_at, new_users_from, effective_at, content_sha256, url, summary)
        values ($1, '1.0.0', 'initial', false, now() - interval '2 days', now() - interval '2 days', now() - interval '2 days', sha256(convert_to($1, 'UTF8')), 'https://example.invalid/' || $1, 'First version')`, [doc]);
    }
    for (const u of [A, B]) {
      await userSql(u, `select public.record_policy_act('terms', '1.0.0', 'accept', 'signin_sheet', 'auth.sheet', '1', 'ios', 'en-US', null, null, '{"age_attested": true}'::jsonb)`);
      await userSql(u, `select public.record_policy_act('sensitive-data', '1.0.0', 'accept', 'consent_sheet', 'consent.sensitive', '1', 'ios')`);
    }
    A1 = newPhone(); A2 = newPhone(); B1 = newPhone();
  }, 120_000);

  it('[A-REQ-015] first sign-in: local books and letters become the account\'s in one transaction, uploaded in order', async () => {
    // Before any account: twins started in first run, three letters, one waiting for its words, one deleted.
    ASHA = addBook(A1, 'Asha', '2025-04-12');
    NINA = addBook(A1, 'Nina', '2025-04-12');
    ids.first = saveLetter(A1, ASHA, 'She walked to me.');
    ids.twin = saveLetter(A1, NINA, 'Nina laughed.');
    ids.waiting = saveLetter(A1, ASHA, '', { waiting: true });
    ids.gone = saveLetter(A1, ASHA, 'Deleted before any account.');
    deleteLetter(A1, ids.gone);
    expect(pendingCount(A1)).toBe(0); // nothing queues before the first sign-in

    const own = takeOwnership(A1, A, ctx());
    expect(own).toMatchObject({ outcome: 'claimed', books: 2, localOnlyBooks: 0 });
    expect(local(A1, ids.first)?.author_id).toBe(A);
    expect(outboxTypes(A1)).toEqual(['book.first_run', 'prefs.upsert', 'prefs.upsert', 'entry.upsert', 'entry.upsert']);
    expect(takeOwnership(A1, A, ctx()).outcome).toBe('already');
    expect(() => takeOwnership(A1, B, ctx())).toThrow('sync_account_mismatch');

    const s = serverFor(A);
    const report = await engineOn(A1, A, s).sync();
    expect(report).toMatchObject({ pushed: 5, rejected: 0, phase: 'idle' });
    expect(s.calls.map((c) => c.fn)).toEqual(['sync_push', 'sync_pull']);
    expect((await sys('select count(*)::int n from children where created_by = $1', [A])).rows[0].n).toBe(2);
    expect((await server(ids.first))?.raw_transcript).toBe('um She walked to me.');
    expect(await server(ids.waiting)).toBeUndefined(); // held until its words exist
    expect(await server(ids.gone)).toBeUndefined(); // deleted before it ever left the phone
    expect(local(A1, ids.first)?.sync_state).toBe('synced');
    expect(pendingCount(A1)).toBe(0);
  }, 60_000);

  it('ordered and coalesced: three edits before a sync go up as one op, after the letter they edit', async () => {
    ids.edited = saveLetter(A1, ASHA, 'Two teeth.');
    editLetter(A1, ids.edited, 'Two teeth today.');
    editLetter(A1, ids.edited, 'Two teeth today, both at once.');
    expect(outboxTypes(A1)).toEqual(['entry.upsert']);
    // The waiting letter gets its words: its first upload.
    A1.transaction(() => {
      A1.run("UPDATE entries SET raw_transcript = 'um you sang', final_text = 'You sang.', transcript_status = NULL WHERE id = ?", ids.waiting);
      enqueueEntryUpsert(A1, ids.waiting, ALL_GROUPS, ctx());
    });
    await engineOn(A1, A, serverFor(A)).sync();
    expect((await server(ids.edited))?.final_text).toBe('Two teeth today, both at once.');
    expect((await sys('select count(*)::int n from entry_versions where entry_id = $1', [ids.edited])).rows[0].n).toBe(0);
    expect((await server(ids.waiting))?.final_text).toBe('You sang.');
  }, 60_000);

  it('the co-parent joins and receives the book, its settings and the in-book letters, never raw transcripts', async () => {
    const token = (await userSql(A, `select public.create_child_invite($1, 'parent') t`, [ASHA])).rows[0].t;
    await userSql(B, 'select public.accept_child_invite($1)', [token]);
    expect(takeOwnership(B1, B, ctx()).outcome).toBe('claimed');
    await engineOn(B1, B, serverFor(B)).sync();
    const book = B1.get<{ name: string; role: string; created_by_me: number; server_state: string }>('SELECT * FROM children WHERE id = ?', ASHA);
    expect(book).toMatchObject({ name: 'Asha', role: 'parent', created_by_me: 0, server_state: 'synced' });
    expect(local(B1, ids.first)).toMatchObject({ final_text: 'She walked to me.', raw_transcript: '', author_id: A });
    expect(B1.get('SELECT 1 FROM children WHERE id = ?', NINA)).toBeNull(); // not invited to the twin's book
    const members = JSON.parse(B1.get<{ members: string }>('SELECT members FROM sync_books WHERE child_id = ?', ASHA)!.members) as { profile_id: string }[];
    expect(members.map((m) => m.profile_id).sort()).toEqual([A, B].sort());
  }, 60_000);

  it('[DATA-REQ-044] retries with backoff: offline pushes wait, survive a restart and go once', async () => {
    ids.retry = saveLetter(A1, ASHA, 'Rain on the window.');
    const s = flaky(serverFor(A), { failBefore: 2, only: 'sync_push' });
    const e1 = engineOn(A1, A, s);
    let r = await e1.sync();
    expect(r.phase).toBe('offline');
    const head1 = A1.get<{ attempts: number; next_attempt_at: string }>('SELECT attempts, next_attempt_at FROM sync_outbox')!;
    expect(head1.attempts).toBe(1);
    expect(Date.parse(head1.next_attempt_at) - now()).toBe(1000); // random() = 1: 1 s, then doubling, capped at 5 min
    r = await e1.sync(); // still backing off: nothing is sent (the pull still runs)
    expect(A1.get<{ attempts: number }>('SELECT attempts FROM sync_outbox')!.attempts).toBe(1);
    expect(await server(ids.retry)).toBeUndefined();
    clock.t += 1_500;
    r = await e1.sync();
    const head2 = A1.get<{ attempts: number; next_attempt_at: string }>('SELECT attempts, next_attempt_at FROM sync_outbox')!;
    expect(head2.attempts).toBe(2);
    expect(Date.parse(head2.next_attempt_at) - now()).toBe(2000);
    // The app is killed here; a new process (new engine on the same file) picks the queue up.
    clock.t += 2_500;
    r = await engineOn(A1, A, s).sync();
    expect(r).toMatchObject({ pushed: 1, phase: 'idle' });
    expect((await server(ids.retry))?.final_text).toBe('Rain on the window.');
  }, 60_000);

  it('[DATA-REQ-044] a duplicate push after a lost answer is applied once', async () => {
    editLetter(A1, ids.retry, 'Rain on the window, and you pointed.');
    const s = flaky(serverFor(A), { loseAnswer: 1 });
    let r = await engineOn(A1, A, s).sync();
    expect(r.phase).toBe('offline');
    expect((await server(ids.retry))?.final_text).toBe('Rain on the window, and you pointed.'); // the server did apply it
    const op = A1.get<{ op_id: string; sent_at: string | null }>('SELECT op_id, sent_at FROM sync_outbox')!;
    expect(op.sent_at).not.toBeNull(); // possibly applied: never rewritten again
    editLetter(A1, ids.retry, 'Rain on the window, and you pointed at it.');
    expect(outboxTypes(A1)).toEqual(['entry.upsert', 'entry.upsert']); // a new op, the sent one untouched
    clock.t += 1_500;
    const inner = serverFor(A);
    r = await engineOn(A1, A, inner).sync();
    const pushed = inner.calls.find((c) => c.fn === 'sync_push')!;
    expect((pushed.args.p_ops as { op: string }[])[0].op).toBe(op.op_id); // the same op id went again
    expect((await server(ids.retry))?.final_text).toBe('Rain on the window, and you pointed at it.');
    expect((await sys('select count(*)::int n from entry_versions where entry_id = $1', [ids.retry])).rows[0].n).toBe(2);
    expect(pendingCount(A1)).toBe(0);
  }, 60_000);

  it('cursor resume: a pull cut off half way continues where it stopped, with no gaps and no repeats', async () => {
    for (let i = 0; i < 6; i++) saveLetter(A1, ASHA, `Page test ${i}.`);
    await engineOn(A1, A, serverFor(A)).sync();
    const before = B1.get<{ cursor: string }>('SELECT cursor FROM sync_books WHERE child_id = ?', ASHA)!.cursor;
    const inner = serverFor(B);
    // Pages of 2 rows; the second page request never gets an answer (the app was killed).
    const r1 = await engineOn(B1, B, flaky(inner, { failOnCall: 2 }), 2).sync();
    expect(r1.pulled).toBe(2);
    const mid = B1.get<{ cursor: string }>('SELECT cursor FROM sync_books WHERE child_id = ?', ASHA)!.cursor;
    expect(mid).not.toBe(before);
    const resumed = serverFor(B);
    const r2 = await engineOn(B1, B, resumed, 2).sync();
    // Since B's last pull: the letter edited in the two tests above, and the six new ones.
    expect(r1.pulled + r2.pulled).toBe(7);
    expect((resumed.calls[0].args.p_since as { books: Record<string, { cursor: string }> }).books[ASHA].cursor).toBe(mid);
    expect(B1.get<{ n: number }>("SELECT COUNT(*) AS n FROM entries WHERE final_text LIKE 'Page test%'")!.n).toBe(6);
  }, 60_000);

  it('[D-023] two phones edit one letter offline: last writer wins, both converge, the earlier words stay in history', async () => {
    expect(takeOwnership(A2, A, ctx()).outcome).toBe('claimed');
    await engineOn(A2, A, serverFor(A)).sync(); // a second phone for the same account: the whole book comes down
    expect(local(A2, ids.first)).toMatchObject({ final_text: 'She walked to me.', raw_transcript: 'um She walked to me.', sync_state: 'synced' });
    editLetter(A1, ids.first, 'She walked to me from the sofa.');
    editLetter(A2, ids.first, 'She walked all the way to me.');
    await engineOn(A1, A, serverFor(A)).sync();
    await engineOn(A2, A, serverFor(A)).sync();
    await engineOn(A1, A, serverFor(A)).sync();
    expect((await server(ids.first))?.final_text).toBe('She walked all the way to me.');
    expect(local(A1, ids.first)?.final_text).toBe('She walked all the way to me.');
    expect(local(A2, ids.first)?.final_text).toBe('She walked all the way to me.');
    expect((await sys(`select 1 from entry_versions where entry_id = $1 and final_text = 'She walked to me from the sofa.'`, [ids.first])).rows.length).toBe(1);
    expect(local(A1, ids.first)?.raw_transcript).toBe('um She walked to me.'); // never changes
  }, 60_000);

  it('tombstones: a delete reaches my other phone as Recently deleted and leaves the co-parent\'s phone; a restore brings it back', async () => {
    deleteLetter(A1, ids.edited);
    await engineOn(A1, A, serverFor(A)).sync();
    expect((await server(ids.edited))?.deleted_at).not.toBeNull();
    await engineOn(A2, A, serverFor(A)).sync();
    expect(local(A2, ids.edited)?.deleted_at).not.toBeNull(); // kept, restorable
    await engineOn(B1, B, serverFor(B)).sync();
    expect(local(B1, ids.edited)).toBeNull(); // someone else's deleted letter leaves the phone
    // Private works the same way for the co-parent.
    A1.transaction(() => {
      A1.run('UPDATE entries SET in_book = 0 WHERE id = ?', ids.retry);
      enqueueEntryUpsert(A1, ids.retry, ['in_book'], ctx());
    });
    await engineOn(A1, A, serverFor(A)).sync();
    await engineOn(B1, B, serverFor(B)).sync();
    expect(local(B1, ids.retry)).toBeNull();
    undelete(A1, ids.edited);
    expect(outboxTypes(A1)).toEqual(['entry.restore', 'entry.upsert']);
    await engineOn(A1, A, serverFor(A)).sync();
    expect((await server(ids.edited))?.deleted_at).toBeNull();
    await engineOn(B1, B, serverFor(B)).sync();
    expect(local(B1, ids.edited)?.final_text).toBe('Two teeth today, both at once.');
    const mine = B1.all<{ id: string }>('SELECT id FROM entries WHERE child_id = ? AND server_version IS NOT NULL', ASHA).map((r) => r.id);
    const theirs = (await userSql(B, `select id from book_entries where child_id = $1`, [ASHA])).rows.map((r) => r.id as string);
    expect(digestOf(mine)).toEqual(digestOf(theirs));
  }, 60_000);

  it('[LEGAL-REQ-006, -009] consent withdrawn: new letters wait on the phone, deletions still go, then everything resumes', async () => {
    await userSql(A, `select public.record_policy_act('sensitive-data', '1.0.0', 'withdraw', 'settings_toggle', 'settings.privacy', '1', 'ios')`);
    ids.paused = saveLetter(A1, ASHA, 'Written while paused.');
    deleteLetter(A1, ids.twin);
    const e = engineOn(A1, A, serverFor(A));
    const r = await e.sync();
    expect(r.phase).toBe('paused_consent');
    expect(e.status().consent).toContain('sensitive-data');
    expect(await server(ids.paused)).toBeUndefined();
    expect((await server(ids.twin))?.deleted_at).not.toBeNull();
    expect(local(A1, ids.paused)?.sync_state).toBe('pending');
    expect(outboxTypes(A1)).toEqual(['entry.upsert']);
    await userSql(A, `select public.record_policy_act('sensitive-data', '1.0.0', 'accept', 'consent_sheet', 'consent.sensitive', '1', 'ios')`);
    const r2 = await e.sync();
    expect(r2.phase).toBe('idle');
    expect((await server(ids.paused))?.final_text).toBe('Written while paused.');
    expect(readSetting(A1, 'sync.pausedFor')).toBeNull();
  }, 60_000);

  it('[TDD 06 P-1] a server restore never wipes a phone: the newest letters go back up and others\' letters are held, not deleted', async () => {
    ids.newest = saveLetter(A1, ASHA, 'Written after the backup.');
    editLetter(A1, ids.paused, 'Written while paused, then edited.');
    await engineOn(A1, A, serverFor(A)).sync();
    await engineOn(B1, B, serverFor(B)).sync();
    expect(local(B1, ids.newest)?.final_text).toBe('Written after the backup.');
    // Restore to a point before those writes: the newest letter is gone, the edit is undone.
    const restorePoint = new Date(Date.now() - 3600_000).toISOString();
    await sys('set session_replication_role = replica');
    await sys('delete from entries where id = $1', [ids.newest]);
    await sys(`update entries set final_text = 'Written while paused.', updated_at = $2 where id = $1`, [ids.paused, restorePoint]);
    await sys('set session_replication_role = origin');
    await sys(`select public.sync_begin_epoch('drill', $1)`, [restorePoint]);

    // The co-parent's phone notices first: nothing is deleted, A's newest letter is held.
    let r = await engineOn(B1, B, serverFor(B)).sync();
    expect(r.reset).toBe(true);
    expect(local(B1, ids.newest)).toMatchObject({ final_text: 'Written after the backup.', sync_state: 'held' });

    // Mama's phone re-uploads what the server lost, before anything else.
    const s = serverFor(A);
    r = await engineOn(A1, A, s).sync();
    expect(r.reset).toBe(true);
    const reup = s.calls.filter((c) => c.fn === 'sync_push').flatMap((c) => (c.args.p_ops as { type: string }[]).map((o) => o.type));
    expect(reup[0]).toBe('book.create');
    expect(reup).toContain('entry.reupload');
    expect((await server(ids.newest))?.final_text).toBe('Written after the backup.');
    expect((await server(ids.paused))?.final_text).toBe('Written while paused, then edited.');
    expect(A1.get<{ n: number }>('SELECT COUNT(*) AS n FROM entries WHERE deleted_at IS NULL AND author_id = ?', A)!.n)
      .toBe((await sys('select count(*)::int n from entries where deleted_at is null and author_id = $1', [A])).rows[0].n);
    expect(pendingCount(A1)).toBe(0);
    expect(readSetting(A1, 'sync.epoch')).toBe('2');

    // The co-parent's held copy is confirmed again.
    await engineOn(B1, B, serverFor(B)).sync();
    expect(local(B1, ids.newest)?.sync_state).toBe('synced');
    // My other phone also re-uploads; the newer knowledge already on the server is not overwritten.
    await engineOn(A2, A, serverFor(A)).sync();
    expect((await server(ids.paused))?.final_text).toBe('Written while paused, then edited.');
    expect(local(A2, ids.paused)?.final_text).toBe('Written while paused, then edited.');
  }, 120_000);

  it('[D-084] the quiet-day migration blanks an old sentence through the outbox; the server accepts it and keeps the old text in history', async () => {
    // A mark saved by an older build: it holds the template sentence, and it already reached the server.
    const old = 'Tuesday. Not much today. Just Asha, and us, and an ordinary day.';
    const id = uuid7(clock.t + ++seq);
    A1.transaction(() => {
      A1.run(
        `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, prompt_key, engine_version, raw_transcript,
           machine_edits, final_text, in_book, sounds_like_me, updated_at, child_id, author_id, author_signs_as)
         VALUES (?, 'not_much', '2026-09-30', ?, 'typed', 'verbatim', NULL, 2, ?, '[]', ?, 0, NULL, ?, ?, ?, 'Mama')`,
        id, iso(), old, old, iso(), ASHA, readSetting(A1, 'sync.ownerId'),
      );
      enqueueEntryUpsert(A1, id, ALL_GROUPS, ctx());
    });
    await engineOn(A1, A, serverFor(A)).sync();
    expect((await server(id))?.final_text).toBe(old);

    clock.t += 1000;
    const v5 = MIGRATIONS.find((m) => m.version === 5)!;
    A1.transaction(() => v5.up(A1, ctx()));
    expect(local(A1, id)).toMatchObject({ final_text: '', raw_transcript: old, sync_state: 'pending' });
    expect(outboxTypes(A1)).toEqual(['entry.upsert']);

    const report = await engineOn(A1, A, serverFor(A)).sync();
    expect(report).toMatchObject({ pushed: 1, rejected: 0 });
    expect(await server(id)).toMatchObject({ final_text: '', raw_transcript: old }); // raw never changes
    expect((await sys('select 1 from entry_versions where entry_id = $1 and final_text = $2', [id, old])).rows.length).toBe(1);
    expect(local(A1, id)?.sync_state).toBe('synced');
  }, 60_000);
});
