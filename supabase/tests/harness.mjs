// Shared PGlite harness: stub Supabase auth/storage schemas and roles, apply
// migrations, and run SQL as a signed-in user. Fictional family "Asha" only (CLAUDE.md).
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

export async function createDb(files, options = {}) {
  const db = new PGlite(options);
  await db.exec(`
    create role authenticated nologin; create role anon nologin; create role service_role nologin bypassrls;
    create schema auth; create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated, anon;
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
    create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'),1)-1] $$;
    alter table storage.objects enable row level security;
    grant usage on schema storage to authenticated; grant all on storage.objects to authenticated;
  `);
  for (const f of files) await db.exec(readFileSync(f, 'utf8'));
  // Supabase grants table privileges to the API roles by default; RLS does the rest.
  await db.exec(`grant usage on schema public to authenticated, anon;
    grant select, insert, update, delete on all tables in schema public to authenticated;`);

  let failures = 0;
  const check = (name, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if (!ok) failures++; };
  const as = async (uid, sql, params = []) => {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid}', false); set role authenticated;`);
    try { return await db.query(sql, params); } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`); }
  };
  const sys = (sql, params = []) => db.query(sql, params);
  const one = async (uid, sql, params) => (await as(uid, sql, params)).rows[0];
  const fails = async (fn, code) => { try { await fn(); return false; } catch (e) { return code ? e.code === code : true; } };
  const done = () => {
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  };
  return { db, check, as, sys, one, fails, done, files };
}

export const users = {
  A: '11111111-1111-1111-1111-111111111111', // parent A, creates the book
  B: '22222222-2222-2222-2222-222222222222', // co-parent B
  C: '33333333-3333-3333-3333-333333333333', // stranger
  N: '44444444-4444-4444-4444-444444444444', // Nani, contributor
  S: '55555555-5555-5555-5555-555555555555', // solo parent with own book
};
