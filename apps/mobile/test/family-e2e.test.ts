/// <reference types="node" />
/**
 * Co-parent sharing end to end (PRD V2 F11 6.2 A to D; BL-322; D-069; the TestFlight alpha of
 * D-106): create, peek, join and leave between two parents, with the app's own code on both
 * sides. Phones are real local databases (node:sqlite with the app's migrations) driven by the
 * real sync engine; the server is the real SQL (every file in supabase/migrations, in PGlite);
 * the family calls are lib/family/invites.ts, the very functions the screens call, over a small
 * PostgREST stand-in that resolves overloads by argument name, casts like PostgREST, passes the
 * idempotency-key header, and answers PGRST202 for a function the server does not have.
 *
 * Which server: develop's migrations always. When S02's v1 gate files are present (merged, or
 * pointed at with SCRIBE_E2E_EXTRA_MIGRATIONS=<dir> for a local run before they merge), the same
 * story runs against them and the cases that need them (peek with the inviter's name, the
 * device-made invite, leave only through the RPC, contributors refused) run too. Without them
 * the app's fallbacks are what is tested: the server-made token and the unnamed ask.
 *
 * Fictional family "Asha" only (CLAUDE.md): Mama (A) starts the book, Papa (B) joins, and C is a
 * stranger holding a forwarded link.
 */
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { beforeAll, describe, expect, it } from 'vitest';
import { canDo } from '@scribe/core/src/family-rules';
import { MIGRATIONS, migrate } from '../src/lib/db/migrations';
import { upsertPrefs } from '../src/lib/db/repos/children';
import type { SqlDb } from '../src/lib/db/sql';
import { inviteErrorKind } from '../src/lib/family/invite-errors.logic';
import { newInviteDraft, type InviteDraft } from '../src/lib/family/invite-draft.logic';
import { parseInviteInput, parseInviteUrl } from '../src/lib/family/invite-link.logic';
import { acceptInvite, createCoParentInvite, leaveBook, listPendingInvites, peekInvite, revokeInvite, shareInviteAgain, type FamilyClient } from '../src/lib/family/invites';
import { joinPlan } from '../src/lib/family/join-flow.logic';
import { familyTabState, leftSince, type MemberLike } from '../src/lib/family/members.logic';
import { createSyncEngine } from '../src/lib/sync/engine';
import { enqueueBookCreate, enqueueEntryUpsert, readSetting } from '../src/lib/sync/outbox';
import { takeOwnership } from '../src/lib/sync/ownership';
import { ALL_GROUPS, type RpcResult, type SupabaseLike } from '../src/lib/sync/types';
import { nodeDb } from './helpers/node-db';

// ── Server: PGlite with every migration ─────────────────────────────────
function migrationsDir(): string {
  for (const p of [resolve(process.cwd(), '../../supabase/migrations'), resolve(process.cwd(), 'supabase/migrations')]) {
    if (existsSync(p)) return p;
  }
  throw new Error('supabase/migrations not found');
}

/** develop's files, then any extra directory's files not already there, in timestamp order. */
function migrationFiles(): string[] {
  const dir = migrationsDir();
  const files = new Map(readdirSync(dir).filter((f) => f.endsWith('.sql')).map((f) => [f, join(dir, f)]));
  const extra = process.env.SCRIBE_E2E_EXTRA_MIGRATIONS;
  if (extra) for (const f of readdirSync(extra).filter((x) => x.endsWith('.sql'))) if (!files.has(f)) files.set(f, join(extra, f));
  return [...files.keys()].sort().map((f) => files.get(f)!);
}

const A = '11111111-1111-1111-1111-111111111111'; // Mama
const B = '22222222-2222-2222-2222-222222222222'; // Papa
const C = '33333333-3333-3333-3333-333333333333'; // a stranger with a forwarded link

let pg: PGlite;
let lock: Promise<unknown> = Promise.resolve();
/** PGlite has one connection: role switches and the call must not interleave. */
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = lock.then(fn, fn);
  lock = next.catch(() => undefined);
  return next;
}
const sys = (sql: string, params: unknown[] = []) => serial(() => pg.query<Record<string, unknown>>(sql, params));

async function as<T>(uid: string | null, headers: Record<string, string>, run: () => Promise<T>): Promise<T> {
  const claims = uid ? JSON.stringify({ sub: uid, role: 'authenticated', is_anonymous: false }) : '';
  await pg.query(`select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false), set_config('request.headers', $3, false)`, [
    uid ?? '',
    claims,
    JSON.stringify(headers),
  ]);
  await pg.exec(uid ? 'set role authenticated' : 'set role anon');
  try {
    return await run();
  } finally {
    await pg.exec(`reset role; select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claims', '', false), set_config('request.headers', '', false);`);
  }
}

type PgError = { code?: string; message?: string; detail?: string; hint?: string };
const asError = (e: unknown) => {
  const x = e as PgError;
  return { code: x.code ?? 'XX000', message: x.message ?? '', details: x.detail ?? null, hint: x.hint ?? null };
};

/** Overloads of public.<fn>: argument names, types and how many have no default. */
async function overloads(fn: string): Promise<{ names: string[]; types: string[]; required: number }[]> {
  const r = await pg.query<{ names: string[] | null; types: string; nargs: number; ndefaults: number }>(
    `select p.proargnames as names, oidvectortypes(p.proargtypes) as types, p.pronargs as nargs, p.pronargdefaults as ndefaults
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = $1`,
    [fn],
  );
  return r.rows.map((o) => ({ names: (o.names ?? []).slice(0, o.nargs), types: o.types ? o.types.split(', ') : [], required: o.nargs - o.ndefaults }));
}

/**
 * A JSON argument as PostgREST passes it to Postgres: text, cast to the argument's type. bytea
 * arrives as its text form (`\x` and hex); PGlite wants bytes for a bytea parameter, so that one
 * is decoded here, exactly as Postgres reads the text.
 */
function asParam(v: unknown, type: string): unknown {
  if (v === null || v === undefined) return null;
  if (type === 'bytea') {
    if (typeof v !== 'string' || !/^\\x([0-9a-fA-F]{2})*$/.test(v)) throw Object.assign(new Error('invalid input syntax for type bytea'), { code: '22P02' });
    return new Uint8Array(Buffer.from(v.slice(2), 'hex'));
  }
  return typeof v === 'object' ? JSON.stringify(v) : String(v);
}

/** A PostgREST-like call: named arguments, the overload chosen by name, PGRST202 when none fits. */
async function callRpc(uid: string | null, fn: string, args: Record<string, unknown>, headers: Record<string, string>): Promise<RpcResult> {
  return serial(async () => {
    const names = Object.keys(args);
    const fit = (await overloads(fn)).find((o) => names.every((n) => o.names.includes(n)) && o.names.slice(0, o.required).every((n) => names.includes(n)) && names.length <= o.names.length);
    if (!fit) return { data: null, error: { code: 'PGRST202', message: `Could not find the function public.${fn} with these arguments` }, status: 404 } as RpcResult;
    const typeOf = (n: string) => fit.types[fit.names.indexOf(n)];
    const list = names.map((n, i) => `${n} => $${i + 1}::${typeOf(n)}`).join(', ');
    try {
      const params = names.map((n) => asParam(args[n], typeOf(n)));
      const r = await as(uid, headers, () => pg.query<{ r: unknown }>(`select public.${fn}(${list}) as r`, params));
      return { data: r.rows[0].r, error: null, status: 200 } as RpcResult;
    } catch (e) {
      return { data: null, error: asError(e), status: 400 } as RpcResult;
    }
  });
}

/** What the sync engine talks to. */
function syncServer(uid: string): SupabaseLike {
  return { rpc: (fn, args = {}) => callRpc(uid, fn, args, {}) };
}

/** What lib/family/invites.ts talks to: rpc (with setHeader) and from().select() for child_invites and children. */
function familyClient(uid: string | null, log: { fn: string; args: Record<string, unknown> }[] = []): FamilyClient {
  const rpc = (fn: string, args: Record<string, unknown> = {}) => {
    log.push({ fn, args });
    const headers: Record<string, string> = {};
    const call = {
      setHeader(name: string, value: string) {
        headers[name] = value;
        return call;
      },
      then<T1, T2>(ok?: (r: RpcResult) => T1 | PromiseLike<T1>, bad?: (e: unknown) => T2 | PromiseLike<T2>) {
        return callRpc(uid, fn, args, headers).then(ok, bad);
      },
    };
    return call;
  };
  const from = (table: string) => {
    let cols = '*';
    const where: string[] = [];
    const params: unknown[] = [];
    let order = '';
    const q = {
      select(c: string) {
        cols = c;
        return q;
      },
      eq(col: string, v: unknown) {
        params.push(v);
        where.push(`${col} = $${params.length}`);
        return q;
      },
      is(col: string, v: null) {
        where.push(`${col} is ${v === null ? 'null' : 'not null'}`);
        return q;
      },
      gt(col: string, v: unknown) {
        params.push(v);
        where.push(`${col} > $${params.length}`);
        return q;
      },
      order(col: string, o: { ascending: boolean }) {
        order = ` order by ${col} ${o.ascending ? 'asc' : 'desc'}`;
        return q;
      },
      run() {
        return serial(async () => {
          try {
            const sql = `select ${cols} from public.${table}${where.length ? ` where ${where.join(' and ')}` : ''}${order}`;
            const r = await as(uid, {}, () => pg.query<Record<string, unknown>>(sql, params));
            return { data: r.rows, error: null };
          } catch (e) {
            return { data: null, error: asError(e) };
          }
        });
      },
      maybeSingle() {
        return q.run().then((r) => ({ data: r.data?.[0] ?? null, error: r.error }));
      },
      then<T1, T2>(ok?: (r: { data: unknown; error: unknown }) => T1 | PromiseLike<T1>, bad?: (e: unknown) => T2 | PromiseLike<T2>) {
        return q.run().then(ok, bad);
      },
    };
    return q;
  };
  return { rpc, from } as unknown as FamilyClient;
}

/** The thrown error of a family call, as the screens would read it. */
async function kindOf(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return 'ok';
  } catch (e) {
    return inviteErrorKind(e);
  }
}

// ── Phones ──────────────────────────────────────────────────────────────
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
const draftDeps = {
  randomBytes: (n: number) => new Uint8Array(randomBytes(n)),
  sha256Hex: async (t: string) => createHash('sha256').update(t, 'utf8').digest('hex'),
  newId: () => uuid7(),
};

const clock = { t: Date.now() };
const iso = () => new Date(clock.t).toISOString();
const ctx = () => ({ now: iso(), newId: () => uuid7() });

function newPhone(): SqlDb {
  const { db } = nodeDb();
  migrate(db, ctx());
  return db;
}
function sync(db: SqlDb, uid: string) {
  return createSyncEngine({
    db, supabase: syncServer(uid), userId: uid, newId: () => uuid7(), now: () => clock.t, random: () => 1, pageSize: 200,
    setTimer: () => 0, clearTimer: () => {}, isActive: () => false,
  }).sync();
}
/** A few syncs: removals can take a digest round and an id round to reach a phone (F16). */
async function settle(db: SqlDb, uid: string) {
  for (let i = 0; i < 3; i++) await sync(db, uid);
}
let seq = 0;
function saveLetter(db: SqlDb, childId: string, text: string, signsAs: string, inBook: boolean): string {
  const id = uuid7(clock.t + ++seq);
  db.transaction(() => {
    db.run(
      `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, prompt_key, engine_version, raw_transcript,
         machine_edits, final_text, in_book, sounds_like_me, updated_at, child_id, author_id, author_signs_as, audio_uri, transcript_status)
       VALUES (?, 'letter', '2026-10-15', ?, 'typed', 'clean', NULL, 2, ?, '[]', ?, ?, NULL, ?, ?, ?, ?, NULL, NULL)`,
      id, iso(), text, text, inBook ? 1 : 0, iso(), childId, readSetting(db, 'sync.ownerId'), signsAs,
    );
    enqueueEntryUpsert(db, id, ALL_GROUPS, ctx());
  });
  return id;
}
const letterOn = (db: SqlDb, id: string) => db.get<{ final_text: string; author_signs_as: string | null; author_id: string | null }>('SELECT * FROM entries WHERE id = ? AND deleted_at IS NULL', id);
/** The book's members as store `listMembers` reads them (sync_books.members, without me). */
function membersOn(db: SqlDb, childId: string): MemberLike[] {
  const r = db.get<{ members: string | null }>('SELECT members FROM sync_books WHERE child_id = ?', childId);
  if (!r?.members) return [];
  return (JSON.parse(r.members) as { profile_id: string; role: string; is_me: boolean; signs_as: string | null }[])
    .filter((m) => !m.is_me)
    .map((m) => ({ id: m.profile_id, signsAs: m.signs_as ?? '', role: m.role === 'contributor' ? 'contributor' : 'parent' }));
}
const roleOf = (db: SqlDb, childId: string) => db.get<{ role: 'parent' | 'contributor' | null }>('SELECT role FROM children WHERE id = ?', childId)?.role ?? undefined;

async function consent(uid: string) {
  await serial(() => as(uid, {}, async () => {
    await pg.query(`select public.record_policy_act('terms', '1.0.0', 'accept', 'signin_sheet', 'auth.sheet', '1', 'ios', 'en-US', null, null, '{"age_attested": true}'::jsonb)`);
    await pg.query(`select public.record_policy_act('sensitive-data', '1.0.0', 'accept', 'consent_sheet', 'consent.sensitive', '1', 'ios')`);
  }));
}

// ── The story ───────────────────────────────────────────────────────────
describe('co-parent sharing end to end: create, peek, join, leave (phones on node:sqlite, server SQL on PGlite)', () => {
  let gate = false; // S02's v1 gate files are applied
  let A1: SqlDb;
  let B1: SqlDb;
  let ASHA = '';
  const ids: Record<string, string> = {};
  let link = '';
  let token = '';
  let draft: InviteDraft;
  let spare = ''; // a second invite, made before Papa joined (a forwarded link)

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
    for (const f of migrationFiles()) await pg.exec(readFileSync(f, 'utf8'));
    // What the hosted project sets with `alter database` (supabase/APPLY.md): the consent pepper (BL-334).
    // Family invites stay at their production default, off (F11-REQ-003).
    await pg.query(`select set_config('app.consent_pepper', $1, false)`, ['e2e-pepper-0123456789abcdef0123456789abcdef']);
    gate = (await pg.query<{ ok: boolean }>(`select to_regprocedure('public.peek_invite(text)') is not null as ok`)).rows[0].ok;
    await pg.exec(`insert into auth.users values ('${A}'), ('${B}'), ('${C}')`);
    for (const doc of ['terms', 'sensitive-data']) {
      await pg.query(`insert into policy_versions (document, version, change_class, requires_reconsent, published_at, new_users_from, effective_at, content_sha256, url, summary)
        values ($1, '1.0.0', 'initial', false, now() - interval '2 days', now() - interval '2 days', now() - interval '2 days', sha256(convert_to($1, 'UTF8')), 'https://example.invalid/' || $1, 'First version')`, [doc]);
    }
    await consent(A);
    await consent(C);
    A1 = newPhone();
    B1 = newPhone();
    expect(MIGRATIONS.length).toBeGreaterThan(0);
  }, 180_000);

  it('Mama starts Asha\'s book with one letter in it and one kept private, and it reaches the server', async () => {
    ASHA = uuid7();
    A1.transaction(() => {
      A1.run('INSERT INTO children (id, name, birthday, due_date, signs_as, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, ?, ?)', ASHA, 'Asha', '2025-04-12', 'Mama', iso(), iso());
      // The sign-off lives in child_member_prefs since local schema v7, and sync sends it from there
      // (lib/sync/outbox.ts). The app's create path writes both places (db/repos/children.ts insert).
      upsertPrefs(A1, ASHA, { signsAs: 'Mama', remindersOn: true }, iso());
      enqueueBookCreate(A1, ASHA, ctx());
    });
    expect(takeOwnership(A1, A, ctx()).outcome).toBe('claimed');
    ids.inBook = saveLetter(A1, ASHA, 'You laughed at the rain today.', 'Mama', true);
    ids.private = saveLetter(A1, ASHA, 'A note just for me.', 'Mama', false);
    expect(await sync(A1, A)).toMatchObject({ rejected: 0, phase: 'idle' });
    expect((await sys('select count(*)::int n from entries where child_id = $1', [ASHA])).rows[0].n).toBe(2);
    // One parent: inviting is offered, leaving is not (a sole parent deletes instead).
    expect(familyTabState({ role: roleOf(A1, ASHA), members: membersOn(A1, ASHA), openInvites: 0 })).toMatchObject({ parents: 1, showInviteCard: true, canLeave: false });
  }, 60_000);

  it('[F11-REQ-002] [B-NFR-002] Mama creates an invite: the link carries the token, the server keeps only its hash, a retry is one invite', async () => {
    draft = await newInviteDraft(draftDeps);
    const log: { fn: string; args: Record<string, unknown> }[] = [];
    const mama = familyClient(A, log);
    const made = await createCoParentInvite(mama, ASHA, 'Papa', draft);
    expect(made.madeBy).toBe(gate ? 'device' : 'server');
    link = made.url;
    token = parseInviteUrl(link, 'https://earlyletters.com')!;
    expect(token).toBeTruthy();
    expect(parseInviteInput(`Join me for Asha: ${link}`, 'https://earlyletters.com')).toBe(token);
    if (gate) {
      expect(made.id).toBe(draft.id);
      expect(token).toBe(draft.token);
      // The token itself never went to the server; only its hash did.
      expect(JSON.stringify(log)).not.toContain(draft.token);
      expect(log[0].args.p_token_hash).toBe(`\\x${draft.tokenHash}`);
    } else {
      // develop's server has no device-made overload: the app fell back to the server-made token.
      expect(log.map((c) => c.fn)).toEqual(['create_child_invite', 'create_child_invite']);
    }
    // A retry after a lost answer, and a second tap, send the same draft: still one invite. (On a
    // server without the device-made overload a replay hands back a fresh token for the same
    // invite, so the link to share is the last one; with it, the token never changes.)
    await createCoParentInvite(mama, ASHA, 'Papa', draft);
    const again = await createCoParentInvite(mama, ASHA, 'Papa', draft);
    if (gate) expect(again.url).toBe(link);
    link = again.url;
    token = parseInviteUrl(link, 'https://earlyletters.com')!;
    const rows = (await sys('select to_jsonb(i) j from child_invites i where child_id = $1', [ASHA])).rows;
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows)).not.toContain(draft.token);
    // F11-REQ-019: the open invite is listed for Mama, without any hash column.
    const open = await listPendingInvites(mama, ASHA, new Date(clock.t));
    expect(open).toHaveLength(1);
    expect(open[0]).toMatchObject({ signsAs: 'Papa' });
    expect(Object.keys(open[0]).sort()).toEqual(['createdAt', 'expiresAt', 'id', 'signsAs']);
    expect(Date.parse(open[0].expiresAt) - Date.parse(open[0].createdAt)).toBe(7 * 24 * 3600 * 1000);
    // A second invite, made while the book has one parent: it is forwarded to a stranger later.
    const second = await createCoParentInvite(mama, ASHA, null, await newInviteDraft(draftDeps));
    spare = parseInviteUrl(second.url, 'https://earlyletters.com')!;
  }, 60_000);

  it('[F11-REQ-019] Share again, then the sheet is closed or fails: nothing was sent, so the first link keeps working', async (t) => {
    if (!gate) {
      t.skip(); // reads the links with peek_invite and needs device-made invite ids (S02's v1 gate files)
      return;
    }
    const mama = familyClient(A);
    const papa = familyClient(B);
    const row = (await listPendingInvites(mama, ASHA, new Date(clock.t))).find((r) => r.signsAs === 'Papa')!;
    expect(row).toBeDefined();
    // Closed without sending: the first link still works, and the new invite, which nobody has, is cancelled again.
    const closed = await newInviteDraft(draftDeps);
    expect(await shareInviteAgain(mama, ASHA, row, closed, async () => 'dismissed')).toBe('dismissed');
    expect(await peekInvite(papa, token)).toEqual({ inviter: 'Mama', role: 'parent', joined: false, known: true });
    expect(await kindOf(peekInvite(papa, closed.token))).toBe('revoked');
    // The sheet itself fails: nothing is known to be sent, so nothing is cancelled, and the screen says so.
    const failed = await newInviteDraft(draftDeps);
    const unavailable = async (): Promise<'shared'> => {
      throw new Error('share_unavailable');
    };
    expect(await shareInviteAgain(mama, ASHA, row, failed, unavailable)).toBe('not_sent');
    expect(await peekInvite(papa, token)).toMatchObject({ inviter: 'Mama', known: true });
    expect((await listPendingInvites(mama, ASHA, new Date(clock.t))).map((r) => r.id)).toEqual(expect.arrayContaining([row.id, failed.id]));
    await revokeInvite(mama, failed.id); // back to the two open invites of the story
    expect(await listPendingInvites(mama, ASHA, new Date(clock.t))).toHaveLength(2);
  }, 60_000);

  it('[F11-REQ-019] Share again, sent: the first link stops working; when cancelling it fails, both work and Mama is told', async (t) => {
    if (!gate) {
      t.skip(); // as above
      return;
    }
    const mama = familyClient(A);
    const papa = familyClient(B);
    const row = (await listPendingInvites(mama, ASHA, new Date(clock.t))).find((r) => r.signsAs === 'Papa')!;
    let sent = '';
    const share = async (url: string): Promise<'shared'> => {
      sent = url;
      return 'shared';
    };
    // Sent, but the cancel of the first invite does not reach the server (offline, say).
    const offline = {
      from: mama.from,
      rpc: (fn: string, args?: Record<string, unknown>) =>
        fn === 'revoke_invite' ? Promise.resolve({ data: null, error: { code: '', message: 'TypeError: Network request failed' } }) : mama.rpc(fn, args),
    } as unknown as FamilyClient;
    const kept = await newInviteDraft(draftDeps);
    expect(await shareInviteAgain(offline, ASHA, row, kept, share)).toBe('old_still_open');
    expect(parseInviteUrl(sent, 'https://earlyletters.com')).toBe(kept.token);
    expect(await peekInvite(papa, token)).toMatchObject({ inviter: 'Mama', known: true });
    expect(await peekInvite(papa, kept.token)).toMatchObject({ inviter: 'Mama', known: true });
    await revokeInvite(mama, kept.id); // Mama cancels the extra one from the list
    // Sent, and the cancel works: the first link now reads as cancelled, and the new one is Papa's invite.
    const fresh = await newInviteDraft(draftDeps);
    expect(await shareInviteAgain(mama, ASHA, row, fresh, share)).toBe('shared');
    expect(await kindOf(peekInvite(papa, token))).toBe('revoked');
    expect(await peekInvite(papa, fresh.token)).toEqual({ inviter: 'Mama', role: 'parent', joined: false, known: true });
    link = sent;
    token = fresh.token;
    expect(await listPendingInvites(mama, ASHA, new Date(clock.t))).toHaveLength(2);
  }, 60_000);

  it('[BL-322] before sign-in nothing about the invite can be learned', async () => {
    expect(joinPlan({ loaded: true, token, signedIn: false, canSync: false, preview: null, busy: null, wantsJoin: false, joinedChildId: null, error: null }).next).toBe('none');
    // Even a direct call without an account learns nothing: refused by the v1 gate server, and an
    // older server has no peek at all (the app then asks without a name).
    try {
      expect(await peekInvite(familyClient(null), token)).toEqual({ inviter: null, role: 'parent', joined: false, known: false });
      expect(gate).toBe(false);
    } catch (e) {
      expect(['not_allowed', 'signed_out']).toContain(inviteErrorKind(e));
    }
  }, 60_000);

  it('[BL-322] Papa signs in: the invite says who sent it, only the sign-off, before any consent, and nothing joins', async () => {
    const papa = familyClient(B);
    const preview = await peekInvite(papa, token);
    if (gate) {
      expect(preview).toEqual({ inviter: 'Mama', role: 'parent', joined: false, known: true });
    } else {
      expect(preview).toEqual({ inviter: null, role: 'parent', joined: false, known: false });
    }
    expect(JSON.stringify(preview)).not.toMatch(/Asha|[0-9a-f]{8}-/);
    expect((await sys('select count(*)::int n from child_members where child_id = $1 and profile_id = $2', [ASHA, B])).rows[0].n).toBe(0);
    // The sheet asks; it does not accept until Join is tapped.
    expect(joinPlan({ loaded: true, token, signedIn: true, canSync: false, preview, busy: null, wantsJoin: false, joinedChildId: null, error: null })).toEqual({ view: 'ask', next: 'none' });
  }, 60_000);

  it('[LEGAL-REQ-006] [F11-U11] joining without consent is refused and does not use the invite up', async () => {
    const papa = familyClient(B);
    expect(await kindOf(acceptInvite(papa, token))).toBe('consent_needed');
    expect((await sys('select count(*)::int n from child_invites where child_id = $1 and accepted_at is not null', [ASHA])).rows[0].n).toBe(0);
  }, 60_000);

  it('[B-REQ-007] [PRD-REQ-014] Papa consents and joins Asha\'s book as a parent; the same accept again only returns the book', async () => {
    await consent(B);
    const papa = familyClient(B);
    expect(await acceptInvite(papa, token)).toBe(ASHA);
    expect(await acceptInvite(papa, token)).toBe(ASHA); // a second phone, or a lost answer
    expect((await sys('select role from child_members where child_id = $1 and profile_id = $2', [ASHA, B])).rows[0].role).toBe('parent');
    if (gate) expect((await peekInvite(papa, token)).joined).toBe(true);
  }, 60_000);

  it('[F11-REQ-009] Papa\'s phone gets the book, signed for Papa, with Mama\'s in-book letter only, never the private one', async () => {
    expect(takeOwnership(B1, B, ctx()).outcome).toBe('claimed');
    await settle(B1, B);
    const book = B1.get<{ name: string; signs_as: string; role: string; created_by_me: number }>('SELECT * FROM children WHERE id = ?', ASHA);
    expect(book).toMatchObject({ name: 'Asha', signs_as: 'Papa', role: 'parent', created_by_me: 0 }); // the inviter's suggestion (F11-REQ-024)
    expect(letterOn(B1, ids.inBook)).toMatchObject({ final_text: 'You laughed at the rain today.', author_signs_as: 'Mama', author_id: A });
    expect(letterOn(B1, ids.private)).toBeNull();
    // No setting says which book is open: joining never switched it (BL-322).
    expect(B1.get('SELECT value FROM settings WHERE key = ?', 'activeChildId')).toBeNull();
    // Two parents now, on both phones.
    await settle(A1, A);
    for (const [db, other] of [[B1, 'Mama'], [A1, 'Papa']] as const) {
      const st = familyTabState({ role: roleOf(db, ASHA), members: membersOn(db, ASHA), openInvites: 0 });
      expect(st).toMatchObject({ parents: 2, full: true, showInviteCard: false, canLeave: true });
      expect(st.coParents.map((m) => m.signsAs)).toEqual([other]);
    }
  }, 60_000);

  it('[F11-REQ-004] [F11-REQ-026] a third parent is refused: a new invite, and the forwarded link, both say the book is full', async () => {
    expect(canDo('parent', 'invite_coparent', { parents: 2 })).toBe(false);
    expect(await kindOf(createCoParentInvite(familyClient(A), ASHA, null, await newInviteDraft(draftDeps)))).toBe('book_full');
    const stranger = familyClient(C);
    if (gate) expect(await kindOf(peekInvite(stranger, spare))).toBe('book_full');
    expect(await kindOf(acceptInvite(stranger, spare))).toBe('book_full');
    expect((await sys('select count(*)::int n from child_members where child_id = $1 and profile_id = $2', [ASHA, C])).rows[0].n).toBe(0);
    // The leftover invite can still be cancelled by either parent.
    const open = await listPendingInvites(familyClient(B), ASHA, new Date(clock.t));
    expect(open).toHaveLength(1);
    await revokeInvite(familyClient(B), open[0].id);
    expect(await kindOf(acceptInvite(stranger, spare))).toBe('revoked');
  }, 60_000);

  it('[F11-REQ-010] Papa writes a letter into the book; Mama reads it signed "Papa", with no approval step', async () => {
    ids.papa = saveLetter(B1, ASHA, 'You fell asleep on my chest after the bath.', 'Papa', true);
    expect(await sync(B1, B)).toMatchObject({ rejected: 0 });
    await settle(A1, A);
    expect(letterOn(A1, ids.papa)).toMatchObject({ final_text: 'You fell asleep on my chest after the bath.', author_signs_as: 'Papa', author_id: B });
  }, 60_000);

  it('[F11-REQ-011] [B-REQ-010] Papa leaves and takes his letters out: they stay his, leave Mama\'s phone, and Mama keeps the book', async () => {
    const papa = familyClient(B);
    expect(await leaveBook(papa, ASHA, false)).toBe('left');
    expect(await leaveBook(papa, ASHA, false)).toBe('not_member'); // a retry after a lost answer
    const row = (await sys('select in_book, deleted_at from entries where id = $1', [ids.papa])).rows[0];
    expect(row).toMatchObject({ in_book: false, deleted_at: null }); // taken out, never deleted
    // Papa's phone: Mama's letters leave it, his own stays, and the book is no longer one he belongs to.
    await settle(B1, B);
    expect(letterOn(B1, ids.inBook)).toBeNull();
    expect(letterOn(B1, ids.papa)).toMatchObject({ final_text: 'You fell asleep on my chest after the bath.' });
    expect(B1.get<{ server_state: string }>('SELECT server_state FROM children WHERE id = ?', ASHA)?.server_state).toBe('left');
    // Mama's phone: Papa's letter is gone from the book; her own letters are untouched.
    await settle(A1, A);
    expect(letterOn(A1, ids.papa)).toBeNull();
    expect(letterOn(A1, ids.inBook)).toMatchObject({ final_text: 'You laughed at the rain today.' });
    // F11-REQ-023: Mama's Family tab showed Papa before; now one note says he left.
    const now = membersOn(A1, ASHA);
    expect(leftSince([{ id: B, signsAs: 'Papa' }], now, roleOf(A1, ASHA) !== undefined)).toEqual([{ id: B, signsAs: 'Papa' }]);
    expect(familyTabState({ role: roleOf(A1, ASHA), members: now, openInvites: 0 })).toMatchObject({ parents: 1, showInviteCard: true, canLeave: false });
  }, 60_000);

  it('[DATA-REQ-016] Mama, now the only parent, cannot leave; the seat is free for a new invite', async () => {
    const mama = familyClient(A);
    expect(await kindOf(leaveBook(mama, ASHA, true))).toBe('last_parent');
    expect(await kindOf(createCoParentInvite(mama, ASHA, 'Papa', await newInviteDraft(draftDeps)))).toBe('ok');
  }, 60_000);

  it('[F11-REQ-011] [F11-REQ-003] with the v1 gate server: leave only through the RPC, and contributor invites refused', async (t) => {
    if (!gate) {
      t.skip(); // needs S02's 20261015020000; runs once it is merged (or with SCRIBE_E2E_EXTRA_MIGRATIONS)
      return;
    }
    const direct = await serial(() => as(A, {}, () => pg.query('delete from child_members where child_id = $1 and profile_id = $2', [ASHA, A]))).then(() => 'ok', (e) => inviteErrorKind(asError(e)));
    expect(direct).toBe('not_allowed');
    const contributor = await callRpc(A, 'create_child_invite', { p_invite_id: uuid7(), p_child: ASHA, p_role: 'contributor', p_token_hash: `\\x${'ab'.repeat(32)}` }, {});
    expect(contributor.error).toMatchObject({ code: 'SCINV', details: 'role_disabled' });
    expect(inviteErrorKind(contributor.error)).toBe('unknown');
  }, 60_000);
});
