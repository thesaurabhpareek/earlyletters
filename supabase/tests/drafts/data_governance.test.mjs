// Tests the DRAFT data-governance migration on top of the live migrations.
// Run: node supabase/tests/drafts/data_governance.test.mjs supabase/migrations/*.sql supabase/migrations/drafts/20261002000000_data_governance.sql
// Fictional family "Asha" only (CLAUDE.md).
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const migrations = process.argv.slice(2).map((f) => readFileSync(f, 'utf8'));
const db = new PGlite();
const A = '11111111-1111-1111-1111-111111111111'; // parent A, creates the book
const B = '22222222-2222-2222-2222-222222222222'; // co-parent B
const N = '44444444-4444-4444-4444-444444444444'; // Nani, contributor
const S = '55555555-5555-5555-5555-555555555555'; // solo parent with own book
let failures = 0;
const check = (name, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if (!ok) failures++; };

await db.exec(`
  create role authenticated nologin; create role anon nologin;
  create schema auth; create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to authenticated;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'),1)-1] $$;
  alter table storage.objects enable row level security;
  grant usage on schema storage to authenticated; grant all on storage.objects to authenticated;
`);
for (const m of migrations) await db.exec(m);
check(`${migrations.length} migrations apply cleanly`, true);
await db.exec(`grant usage on schema public to authenticated;
  grant select, insert, update, delete on all tables in schema public to authenticated;
  insert into auth.users values ('${A}'),('${B}'),('${N}'),('${S}');`);

const as = async (uid, sql) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid}', false); set role authenticated;`);
  try { return await db.query(sql); } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`); }
};
const sys = (sql) => db.query(sql);
const fails = async (fn, code) => { try { await fn(); return false; } catch (e) { return code ? e.code === code : true; } };
const one = async (uid, sql) => (await as(uid, sql)).rows[0];

const CHILD = (await one(A, `select public.create_child('Asha', '2025-05-20') as id`)).id;
const join = async (uid, role) => {
  const t = (await one(A, `select public.create_child_invite('${CHILD}') as t`)).t;
  if (role === 'contributor') await sys(`update child_invites set role='contributor' where token_hash = sha256(convert_to('${t}','UTF8'))`);
  await as(uid, `select public.accept_child_invite('${t}')`);
};
await join(B, 'parent');
await join(N, 'contributor');
const SOLO = (await one(S, `select public.create_child('Asha', '2025-05-20') as id`)).id;

let seq = 0;
const newEntry = async (author, child = CHILD, inBook = true) => {
  const id = `0192b000-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
  await as(author, `insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book)
    values ('${id}', '${child}', '${author}', 'letter', '2026-09-29', now(), 'spoken', 1, 'um she walked', 'She walked.', ${inBook})`);
  return id;
};

// Integrity
const e1 = await newEntry(A);
check('raw_sha256 is set by the server', (await sys(`select encode(raw_sha256,'hex') h from entries where id='${e1}'`)).rows[0].h
  === (await sys(`select encode(sha256(convert_to('um she walked','UTF8')),'hex') h`)).rows[0].h);
check('raw_sha256 is immutable', await fails(() => as(A, `update entries set raw_sha256='\\x00' where id='${e1}'`), 'SCIMM'));
check('created_at is immutable', await fails(() => as(A, `update entries set created_at=now()-interval '1 year' where id='${e1}'`), 'SCIMM'));
check('photo path must be inside the entry folder', await fails(() => as(A, `update entries set photo_path='${SOLO}/${S}/x.jpg' where id='${e1}'`)));
await as(A, `update entries set photo_path='${CHILD}/${A}/${e1}.jpg' where id='${e1}'`);
check('photo path in own folder is accepted', true);
await as(A, `update entries set machine_edits='[{"type":"filler"}]'::jsonb where id='${e1}'`);
check('machine_edits change alone is versioned', (await sys(`select count(*)::int n from entry_versions where entry_id='${e1}' and machine_edits='[]'::jsonb`)).rows[0].n === 1);

// Tombstones
await as(A, `update entries set deleted_at='2000-01-01' where id='${e1}'`);
const t = (await sys(`select deleted_at > now() - interval '1 minute' as fresh, deleted_reason r from entries where id='${e1}'`)).rows[0];
check('client cannot back-date a tombstone', t.fresh && t.r === 'user');
check('delete is audited without content', (await sys(`select count(*)::int n from audit_events where action='entry_deleted' and subject_id='${e1}'`)).rows[0].n === 1);
check('deleted entry cannot be edited', await fails(() => as(A, `update entries set final_text='x' where id='${e1}'`), 'SCTMB'));
check('client cannot clear deleted_at directly', await fails(() => as(A, `update entries set deleted_at=null where id='${e1}'`), 'SCTMB'));
check('co-parent cannot restore', await fails(() => as(B, `select public.restore_entry('${e1}')`)));
check('author restores via restore_entry', (await one(A, `select public.restore_entry('${e1}') as ok`)).ok === true);
check('restore is idempotent', (await one(A, `select public.restore_entry('${e1}') as ok`)).ok === true);

// Purge after 30 days
await as(A, `select public.delete_entry('${e1}')`);
await sys(`select public.purge_due(now() + interval '29 days')`);
check('not purged before 30 days', (await sys(`select 1 from entries where id='${e1}'`)).rows.length === 1);
await sys(`insert into legal_holds (scope, scope_id, reason_code, matter_ref, placed_by, review_by) values ('entry', '${e1}', 'litigation', 'T-1', 'ops', '2027-01-01')`);
await sys(`select public.purge_due(now() + interval '31 days')`);
check('legal hold blocks purge', (await sys(`select 1 from entries where id='${e1}'`)).rows.length === 1);
await sys(`update legal_holds set released_at=now(), released_by='ops'`);
const res = (await sys(`select public.purge_due(now() + interval '31 days') r`)).rows[0].r;
check('purged after 30 days', res.entries === 1 && (await sys(`select 1 from entries where id='${e1}'`)).rows.length === 0);
check('versions purged with the entry', (await sys(`select 1 from entry_versions where entry_id='${e1}'`)).rows.length === 0);
check('photo queued for Storage API deletion', (await sys(`select 1 from storage_purge_queue where object_path='${CHILD}/${A}/${e1}.jpg'`)).rows.length === 1);
check('purge ledger keeps the id only', (await sys(`select 1 from purge_ledger where entity_type='entry' and entity_id='${e1}'`)).rows.length === 1);
check('users cannot call purge_due', await fails(() => as(A, `select public.purge_due()`)));
check('users cannot read legal holds', (await as(A, 'select * from legal_holds')).rows.length === 0);

// Children guard and last parent
check('member cannot tombstone the book directly', await fails(() => as(N, `update children set deleted_at=now() where id='${CHILD}'`), 'SCDEL'));
check('contributor cannot delete the book', await fails(() => as(N, `select public.request_book_deletion('${CHILD}', 'ios')`), 'SCDEL'));
check('sole parent cannot simply leave', await fails(() => as(S, `delete from child_members where profile_id='${S}'`), 'SCLPG'));

// Delete book with a co-parent = remove own letters and leave
const a2 = await newEntry(A); const b2 = await newEntry(B); const n2 = await newEntry(N);
check('with a co-parent, delete = leave and remove own letters',
  (await one(A, `select public.request_book_deletion('${CHILD}', 'ios') as m`)).m === 'left_and_removed_own_letters');
check('co-parent letters untouched', (await sys(`select deleted_at is null as live from entries where id='${b2}'`)).rows[0].live);
check('family letter untouched', (await sys(`select deleted_at is null as live from entries where id='${n2}'`)).rows[0].live);
check('leaver letter tombstoned', (await sys(`select deleted_reason r from entries where id='${a2}'`)).rows[0].r === 'book_deletion');
check('leaver can still read own letter', (await as(A, `select id from entries where id='${a2}'`)).rows.length === 1);

// Creator account deletion no longer cascades the shared book
const req = await one(A, `select * from public.request_account_deletion('ios', false)`);
check('account deletion is scheduled 30 days out', (await sys(`select scheduled_for > now() + interval '29 days' as ok from deletion_requests where id='${req.request_id}'`)).rows[0].ok);
check('request is idempotent', (await one(A, `select request_id from public.request_account_deletion('ios', false)`)).request_id === req.request_id);
check('cancel restores', (await one(A, `select public.cancel_account_deletion() as ok`)).ok === true);
await as(A, `select * from public.request_account_deletion('ios', true)`);
const r2 = (await sys(`select id from deletion_requests where kind='account' and status='scheduled'`)).rows[0].id;
await sys(`select public.purge_due(now() + interval '31 days')`);
check('due request moves to executing', (await sys(`select status from deletion_requests where id='${r2}'`)).rows[0].status === 'executing');
await sys(`select public.prepare_account_purge('${r2}')`);
await sys(`delete from auth.users where id='${A}'`);
await sys(`select public.finalize_account_deletion('${r2}', '{"entries":1}'::jsonb)`);
check('book survives creator deletion', (await sys(`select created_by from children where id='${CHILD}'`)).rows[0]?.created_by === null);
check("co-parent's letter survives", (await sys(`select 1 from entries where id='${b2}'`)).rows.length === 1);
check('audit is pseudonymised', (await sys(`select count(*)::int n from audit_events where actor_id='${A}'`)).rows[0].n === 0);
check('request completed and unlinked', (await sys(`select status, profile_id from deletion_requests where id='${r2}'`)).rows[0].profile_id === null);

// Sole parent book deletion
const s1 = await newEntry(S, SOLO);
check('sole parent schedules book deletion', (await one(S, `select public.request_book_deletion('${SOLO}', 'ios') as m`)).m === 'book_scheduled');
check('sole parent can cancel', (await one(S, `select public.cancel_book_deletion('${SOLO}') as ok`)).ok === true);
await as(S, `select public.request_book_deletion('${SOLO}', 'ios')`);
await sys(`select public.purge_due(now() + interval '31 days')`);
check('book purged after 30 days', (await sys(`select 1 from children where id='${SOLO}'`)).rows.length === 0
  && (await sys(`select 1 from entries where id='${s1}'`)).rows.length === 0);

// Short-lived records
await sys(`insert into safety_events (author_id, tier, created_at) values ('${B}', 1, now() - interval '13 months'), ('${B}', 1, now())`);
await sys(`select public.purge_due()`);
check('safety events older than 12 months are erased', (await sys(`select count(*)::int n from safety_events`)).rows[0].n === 1);

console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
