/// <reference types="node" />
/**
 * A PGlite server with the Supabase pieces the migrations expect (roles, auth, storage) and every file in
 * supabase/migrations applied: the starting point of test/sync-e2e.test.ts and helpers/sync-server.ts (BL-443).
 * It is built once per set of migrations and then loaded from a dump (helpers/pglite-snapshot.ts), so the
 * several files that need it share one build instead of each applying every migration.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { PGlite } from '@electric-sql/pglite';
import { pgliteSnapshot } from './pglite-snapshot';

export function migrationsDir(): string {
  for (const p of [resolve(process.cwd(), '../../supabase/migrations'), resolve(process.cwd(), 'supabase/migrations')]) {
    if (existsSync(p)) return p;
  }
  throw new Error('supabase/migrations not found');
}

/** The Supabase pieces the migrations expect to find, as the database tests set them up. */
export const SERVER_SETUP = `
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
    `;

export async function migratedServer(): Promise<PGlite> {
  const dir = migrationsDir();
  const sources = readdirSync(dir)
    .filter((x) => x.endsWith('.sql'))
    .sort()
    .map((f) => [f, readFileSync(join(dir, f), 'utf8')] as const);
  return pgliteSnapshot([SERVER_SETUP, ...sources.flat()], async (pg) => {
    await pg.exec(SERVER_SETUP);
    for (const [, sql] of sources) await pg.exec(sql);
  });
}
