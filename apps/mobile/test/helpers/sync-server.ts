/// <reference types="node" />
/**
 * The real server for sync tests: PGlite with every file in supabase/migrations
 * (S02's included, whatever has landed), run as PostgREST would run an RPC: as
 * the signed-in user, named jsonb arguments, errors as { code, message } and
 * status 0 for no response. Same harness as test/sync-e2e.test.ts.
 *
 * Protocol v1 (docs/adr/0025-sync-protocol-v1.md) needs S02's words compare and
 * set (WP-F16-14). Until a migration defines it, `startSyncServer({ protocol: 'v1' })`
 * loads helpers/sync-v1-standin.sql (the objects v1 adds) and applies the anchored
 * edits in helpers/sync-v1-standin.ts to the newest real sync_push: S03's request to
 * S02 as runnable SQL that never replaces S02's newer body. Once S02's migration
 * lands, the stand-in is skipped by itself (`standIn` reports it).
 * Fictional family "Asha" only (CLAUDE.md).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import type { RpcResult, SupabaseLike } from '../../src/lib/sync/types';
import { patchSyncPush } from './sync-v1-standin';

export interface SyncServer {
  pg: PGlite;
  /** True when protocol v1 came from the stand-in, false when the real migrations define it. */
  standIn: boolean;
  /** SQL as the migration role (no RLS). */
  sys: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
  /** SQL as a signed-in user (RLS applies). */
  userSql: (uid: string, sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
  /** A SupabaseLike for one account; `calls` records every RPC. */
  serverFor: (uid: string) => SupabaseLike & { calls: { fn: string; args: Record<string, unknown> }[] };
  /** Accepts Terms (with the age attestation) and sensitive-data consent for each account. */
  consent: (...uids: string[]) => Promise<void>;
  /** Withdraws or gives sensitive-data consent. */
  sensitiveConsent: (uid: string, act: 'accept' | 'withdraw') => Promise<void>;
}

function migrationsDir(): string {
  for (const p of [resolve(process.cwd(), '../../supabase/migrations'), resolve(process.cwd(), 'supabase/migrations')]) {
    if (existsSync(p)) return p;
  }
  throw new Error('supabase/migrations not found');
}

export async function startSyncServer(opts: { users: string[]; protocol?: 'v0' | 'v1' }): Promise<SyncServer> {
  const pg = new PGlite();
  let lock: Promise<unknown> = Promise.resolve();
  /** PGlite has one connection: role switches and the call must not interleave. */
  const serial = <T>(fn: () => Promise<T>): Promise<T> => {
    const next = lock.then(fn, fn);
    lock = next.catch(() => undefined);
    return next;
  };
  const asUser = async <T>(uid: string, run: () => Promise<T>): Promise<T> => {
    const claims = JSON.stringify({ sub: uid, role: 'authenticated', is_anonymous: false });
    await pg.query(`select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)`, [uid, claims]);
    await pg.exec('set role authenticated');
    try {
      return await run();
    } finally {
      await pg.exec(`reset role; select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claims', '', false);`);
    }
  };

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

  let standIn = false;
  if (opts.protocol === 'v1') {
    const has = await pg.query<{ v1: boolean }>(
      "select exists (select 1 from pg_proc where proname = 'sync_push' and prosrc like '%conflict_groups%') as v1",
    );
    if (!has.rows[0].v1) {
      await pg.exec(readFileSync(join(__dirname, 'sync-v1-standin.sql'), 'utf8'));
      // The words compare and set goes into S02's newest sync_push, never over an older copy of it.
      const def = await pg.query<{ d: string }>("select pg_get_functiondef('public.sync_push(jsonb)'::regprocedure) as d");
      await pg.exec(patchSyncPush(def.rows[0].d));
      standIn = true;
    }
  }

  await pg.exec(`insert into auth.users values ${opts.users.map((u) => `('${u}')`).join(', ')}`);
  for (const doc of ['terms', 'sensitive-data']) {
    await pg.query(`insert into policy_versions (document, version, change_class, requires_reconsent, published_at, new_users_from, effective_at, content_sha256, url, summary)
      values ($1, '1.0.0', 'initial', false, now() - interval '2 days', now() - interval '2 days', now() - interval '2 days', sha256(convert_to($1, 'UTF8')), 'https://example.invalid/' || $1, 'First version')`, [doc]);
  }

  const sys = (sql: string, params: unknown[] = []) => serial(() => pg.query<Record<string, unknown>>(sql, params));
  const userSql = (uid: string, sql: string, params: unknown[] = []) =>
    serial(() => asUser(uid, () => pg.query<Record<string, unknown>>(sql, params)));

  const serverFor = (uid: string) => {
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
  };

  const consent = async (...uids: string[]) => {
    for (const u of uids) {
      await userSql(u, `select public.record_policy_act('terms', '1.0.0', 'accept', 'signin_sheet', 'auth.sheet', '1', 'ios', 'en-US', null, null, '{"age_attested": true}'::jsonb)`);
      await userSql(u, `select public.record_policy_act('sensitive-data', '1.0.0', 'accept', 'consent_sheet', 'consent.sensitive', '1', 'ios')`);
    }
  };
  const sensitiveConsent = async (uid: string, act: 'accept' | 'withdraw') => {
    const [source, screen] = act === 'accept' ? ['consent_sheet', 'consent.sensitive'] : ['settings_toggle', 'settings.privacy'];
    await userSql(uid, `select public.record_policy_act('sensitive-data', '1.0.0', $1, $2, $3, '1', 'ios')`, [act, source, screen]);
  };

  return { pg, standIn, sys, userSql, serverFor, consent, sensitiveConsent };
}

/** Wraps a server: the next calls fail without reaching it, or reach it and lose the answer. */
export function flaky(inner: SupabaseLike, plan: { failBefore?: number; loseAnswer?: number; only?: string }): SupabaseLike {
  return {
    rpc(fn: string, args?: Record<string, unknown>): PromiseLike<RpcResult> {
      if (plan.only && fn !== plan.only) return inner.rpc(fn, args);
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
