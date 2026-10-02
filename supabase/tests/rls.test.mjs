// Core access rules, run against every migration in supabase/migrations (PGlite,
// stub Supabase auth/storage schemas). Run all DB tests: npm run test:db
// Book members read others' letters through public.book_entries (PRD K-09).
// Requires: npm i @electric-sql/pglite (dev only).
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const migrations = process.argv.slice(2).map((f) => readFileSync(f, 'utf8'));
const db = new PGlite();
const A = '11111111-1111-1111-1111-111111111111'; // parent A (author)
const B = '22222222-2222-2222-2222-222222222222'; // parent B (invited co-parent)
const C = '33333333-3333-3333-3333-333333333333'; // stranger
let failures = 0;
const check = (name, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if (!ok) failures++; };

await db.exec(`
  create role authenticated nologin;
  create role anon nologin;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to authenticated;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'),1)-1] $$;
  alter table storage.objects enable row level security;
  grant usage on schema storage to authenticated;
  grant all on storage.objects to authenticated;
`);

for (const m of migrations) await db.exec(m);
check(`${migrations.length} migration(s) apply cleanly`, true);
await db.exec(`
  grant usage on schema public to authenticated;
  grant select, insert, update, delete on all tables in schema public to authenticated;
  insert into auth.users values ('${A}'),('${B}'),('${C}');
`);
const priv = async (fn) => (await db.query(`select has_function_privilege('authenticated', '${fn}', 'execute') as ok`)).rows[0].ok;
check('internal functions are not exposed to signed-in users',
  !(await priv('public.handle_new_user()')) && !(await priv('public.entries_record_version()')) && (await priv('public.is_child_member(uuid)')));
check('anonymous visitors cannot call the membership helper',
  !(await db.query(`select has_function_privilege('anon', 'public.is_child_member(uuid)', 'execute') as ok`)).rows[0].ok);
check('signup creates a profile automatically', (await db.query('select id from public.profiles')).rows.length === 3);

const as = async (uid, sql, params = []) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid}', false); set role authenticated;`);
  try { return await db.query(sql, params); } finally { await db.exec('reset role;'); }
};
const fails = async (fn) => { try { await fn(); return false; } catch { return true; } };

// Child + invite flow
const CHILD = (await as(A, `select public.create_child('Asha', '2025-05-20') as id`)).rows[0].id;
check('create_child makes the creator a member', (await as(A, 'select * from child_members')).rows.length === 1);
check('stranger cannot see the child', (await as(C, 'select * from children')).rows.length === 0);
check('cannot insert a child directly', await fails(() => as(C, `insert into children (name, created_by) values ('x', '${C}')`)));
check('cannot add yourself as a member directly', await fails(() => as(C, `insert into child_members (child_id, profile_id) values ('${CHILD}', '${C}')`)));
check('stranger cannot create an invite', await fails(() => as(C, `select public.create_child_invite('${CHILD}')`)));

const token = (await as(A, `select public.create_child_invite('${CHILD}') as t`)).rows[0].t;
check('invite token is long and random', /^[0-9a-f]{64}$/.test(token));
await db.exec('reset role;');
check('only a hash of the token is stored', (await db.query(`select 1 from child_invites where encode(token_hash, 'hex') = $1`, [token])).rows.length === 0);
check('wrong token is rejected', await fails(() => as(B, `select public.accept_child_invite('nope')`)));
check('co-parent can accept the invite', (await as(B, `select public.accept_child_invite('${token}') as c`)).rows[0].c === CHILD);
check('an invite works only once', await fails(() => as(C, `select public.accept_child_invite('${token}')`)));
check('co-parents can see each other\'s profile', (await as(B, 'select id from profiles')).rows.length === 2);
check('stranger sees only own profile', (await as(C, 'select id from profiles')).rows.length === 1);

// Entries
const insert = (id, inBook, author = A) => `insert into public.entries
  (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book)
  values ('${id}', '${CHILD}', '${author}', 'letter', '2026-09-29', now(), 'spoken', 1, 'um she walked', 'She walked.', ${inBook})`;
const PRIVATE = '0192b000-0000-7000-8000-000000000001';
const BOOK = '0192b000-0000-7000-8000-000000000002';

await as(A, insert(PRIVATE, false));
await as(A, insert(BOOK, true));
check('author sees both own entries', (await as(A, 'select id from entries')).rows.length === 2);
const partner = (await as(B, 'select id from book_entries')).rows.map((r) => r.id);
check('co-parent sees only the book entry', partner.length === 1 && partner[0] === BOOK);
check('co-parent cannot read the author\'s rows in the entries table', (await as(B, 'select id from entries')).rows.length === 0);
check('book view has no raw transcript column', await fails(() => as(B, 'select raw_transcript from book_entries')));
check('stranger sees nothing', (await as(C, 'select id from entries')).rows.length === 0 && (await as(C, 'select id from book_entries')).rows.length === 0);
check('co-parent cannot edit the author\'s entry', (await as(B, `update entries set final_text='x' where id='${BOOK}'`)).affectedRows === 0);
check('nobody can hard-delete an entry', (await as(A, `delete from entries where id='${BOOK}'`)).affectedRows === 0);
check('stranger cannot write to a child they do not belong to', await fails(() => as(C, insert('0192b000-0000-7000-8000-000000000009', false, C))));
check('cannot write an entry as someone else', await fails(() => as(B, insert('0192b000-0000-7000-8000-000000000008', false))));
check('raw transcript is immutable', await fails(() => as(A, `update entries set raw_transcript='changed' where id='${PRIVATE}'`)));
check('captured_at is immutable', await fails(() => as(A, `update entries set captured_at=now() - interval '1 day' where id='${PRIVATE}'`)));

await as(A, `update entries set final_text='She walked to me.' where id='${PRIVATE}'`);
await db.exec('reset role;');
const versions = await db.query(`select final_text from entry_versions where entry_id='${PRIVATE}'`);
check('edits are versioned server-side', versions.rows.length === 1 && versions.rows[0].final_text === 'She walked.');
check('author can read own history', (await as(A, 'select * from entry_versions')).rows.length === 1);
check('co-parent cannot read history', (await as(B, 'select * from entry_versions')).rows.length === 0);

await as(A, `update entries set deleted_at=now() where id='${BOOK}'`);
check('tombstoned entry leaves the co-parent view', (await as(B, 'select id from book_entries')).rows.length === 0);
check('full-text search works', (await as(A, `select id from entries where search @@ plainto_tsquery('simple', 'walked')`)).rows.length >= 1);

// Storage: {child_id}/{author_id}/{entry_id}.jpg
const photo = `${CHILD}/${A}/${PRIVATE}.jpg`;
await as(A, `insert into storage.objects (bucket_id, name) values ('entry-photos', '${photo}')`);
check('author can read own photo', (await as(A, 'select name from storage.objects')).rows.length === 1);
await as(A, `update entries set photo_path='${photo}' where id='${PRIVATE}'`);
check('co-parent cannot read the photo of a private entry', (await as(B, 'select name from storage.objects')).rows.length === 0);
await as(A, `update entries set in_book=true where id='${PRIVATE}'`);
check('co-parent can read the photo once it is in the book', (await as(B, 'select name from storage.objects')).rows.length === 1);
check('stranger cannot upload into another family\'s folder', await fails(() => as(C, `insert into storage.objects (bucket_id, name) values ('entry-photos', '${CHILD}/${C}/x.jpg')`)));
check('cannot upload under another author\'s folder', await fails(() => as(B, `insert into storage.objects (bucket_id, name) values ('entry-photos', '${CHILD}/${A}/y.jpg')`)));

await as(A, `insert into dictionary_terms (owner_id, child_id, term, kind, heard_as) values ('${A}', '${CHILD}', 'Asha', 'child', '{Asia}')`);
check('dictionary is private to its owner', (await as(B, 'select * from dictionary_terms')).rows.length === 0);
check('no server table for safety tiers (PRD K-06)', await fails(() => as(A, `insert into safety_events (author_id, tier) values ('${A}', 1)`)));

// Leaving
await as(B, `delete from child_members where profile_id='${B}'`);
check('a co-parent who leaves loses access to the book', (await as(B, 'select id from book_entries')).rows.length === 0);

console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
