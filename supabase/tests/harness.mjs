// Shared PGlite harness: stub Supabase auth/storage schemas and roles, apply
// migrations, and run SQL as a signed-in user. Fictional family "Asha" only (CLAUDE.md).
//
// Sessions: `as(uid, sql)` runs as `authenticated` with the JWT claims Supabase
// sets (`request.jwt.claim.sub` and `request.jwt.claims` JSON). Pass
// `{ anonymous: true }` as the 4th argument for an anonymous sign-in (claim
// is_anonymous = true). `asAnon(sql)` runs as the `anon` role with no JWT.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

// The consent pepper fails closed since 20261015010000 (BL-334); tests run with a fixed test value.
export const TEST_CONSENT_PEPPER = 'test-pepper-0123456789abcdef0123456789abcdef';

// Which default privileges Supabase gives the objects a migration creates in public (lens A on #261,
// comment 6378839652; GitHub discussion supabase 45329; Supabase CLI 2.119.0
// RevokeDefaultDataApiPrivilegesSql, which matches what Studio runs at project creation):
//   'none'    (the default) a project created since 30 May 2026, and every project for objects made after
//             30 Oct 2026: no SELECT, INSERT, UPDATE or DELETE on new tables and no USAGE or SELECT on new
//             sequences for anon, authenticated and service_role, which keep TRUNCATE, REFERENCES, TRIGGER and
//             MAINTAIN on tables and UPDATE on sequences; no EXECUTE for them on new functions (PUBLIC keeps
//             Postgres's own EXECUTE). A missing grant fails here, as it does on staging and production.
//   'legacy'  SCRIBE_DEFAULT_GRANTS=legacy (the nightly): the old automatic grants, ALL on new tables,
//             sequences and functions for the three roles (supabase/postgres
//             migrations/db/init-scripts/00000000000000-initial-schema.sql), so a migration's own revoke (for
//             example an internal function's revoke from service_role) is what the tests see.
// createDb(files, { defaultGrants: 'legacy' }) overrides it for one database (a test of an old server).
export const DEFAULT_GRANTS = process.env.SCRIBE_DEFAULT_GRANTS === 'legacy' ? 'legacy' : 'none';

// What a table, a sequence and a function (revoked from PUBLIC) created in public give anon, authenticated and
// service_role, read before any migration: the harness's own liveness check (#261 F4; access_matrix).
const PROBE_PRIVS = { table: ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'],
  sequence: ['USAGE', 'SELECT', 'UPDATE'], function: ['EXECUTE'] };
export const EXPECTED_PROBE = {
  legacy: { table: PROBE_PRIVS.table, sequence: PROBE_PRIVS.sequence, function: ['EXECUTE'] },
  none: { table: ['TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'], sequence: ['UPDATE'], function: [] },
};
async function probeDefaults(db) {
  await db.exec('begin');
  try {
    await db.exec(`create table public.harness_probe (x int); create sequence public.harness_probe_seq;
      create function public.harness_probe() returns int language sql as $$ select 1 $$;
      revoke execute on function public.harness_probe() from public;`);
    const out = {};
    for (const role of ['anon', 'authenticated', 'service_role']) {
      const held = (sql) => db.query(sql, [role]).then((r) => r.rows.filter((x) => x.ok).map((x) => x.p));
      out[role] = {
        table: await held(`select p, has_table_privilege($1, 'public.harness_probe', p) ok from unnest(array['${PROBE_PRIVS.table.join("','")}']) p`),
        sequence: await held(`select p, has_sequence_privilege($1, 'public.harness_probe_seq', p) ok from unnest(array['${PROBE_PRIVS.sequence.join("','")}']) p`),
        function: await held(`select 'EXECUTE' p, has_function_privilege($1, 'public.harness_probe()', 'execute') ok`),
      };
    }
    return out;
  } finally {
    await db.exec('rollback');
  }
}

export async function createDb(files, options = {}) {
  const { defaultGrants = DEFAULT_GRANTS, ...pgliteOptions } = options;
  if (!['none', 'legacy'].includes(defaultGrants)) throw new Error(`unknown defaultGrants: ${defaultGrants}`);
  const db = new PGlite(pgliteOptions);
  await db.exec(`
    create role authenticated nologin; create role anon nologin; create role service_role nologin bypassrls;
    create schema auth; create table auth.users (id uuid primary key);
    create table auth.sessions (id uuid primary key, user_id uuid not null, not_after timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated, anon;
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
    create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'),1)-1] $$;
    alter table storage.objects enable row level security;
    grant usage on schema storage to authenticated, anon; grant all on storage.objects to authenticated, anon;
    -- Supabase's default privileges (TDD 02 C18; DEFAULT_GRANTS above). The old automatic grants first, as
    -- the init script makes them; then, in the 'none' world, the revoke Studio and the CLI run at project
    -- creation, for the role the migrations run as (postgres here and on hosted).
    grant usage on schema public to authenticated, anon, service_role;
    alter default privileges in schema public grant all on tables to authenticated, anon, service_role;
    alter default privileges in schema public grant all on sequences to authenticated, anon, service_role;
    alter default privileges in schema public grant all on functions to authenticated, anon, service_role;
  `);
  if (defaultGrants === 'none') {
    await db.exec(`
      alter default privileges for role postgres in schema public revoke select, insert, update, delete on tables from anon, authenticated, service_role;
      alter default privileges for role postgres in schema public revoke usage, select on sequences from anon, authenticated, service_role;
      alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated, service_role;
    `);
  }
  const defaults = { mode: defaultGrants, probe: await probeDefaults(db) };
  for (const f of files) await db.exec(readFileSync(f, 'utf8'));
  // Session settings the hosted project sets with `alter database` (supabase/APPLY.md):
  // the consent pepper (step 6, BL-334), and family invites on, because the dormant
  // contributor rules keep their tests (B-REQ-009 Rev); in production the setting
  // is off (F11-REQ-003) and v1_gate_coparent.test.mjs proves the default.
  await db.query(`select set_config('app.consent_pepper', $1, false), set_config('app.contributors_enabled', 'on', false)`,
    [TEST_CONSENT_PEPPER]);

  let failures = 0;
  let passes = 0;
  const check = (name, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if (ok) passes++; else failures++; };
  const signIn = (uid, anonymous = false) => {
    const claims = JSON.stringify({ sub: uid, role: 'authenticated', is_anonymous: anonymous }).replace(/'/g, "''");
    return db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid}', false),
      set_config('request.jwt.claims', '${claims}', false); set role authenticated;`);
  };
  const signOut = () => db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claims', '', false);`);
  const as = async (uid, sql, params = [], opts = {}) => {
    await signIn(uid, !!opts.anonymous);
    try { return await db.query(sql, params); } finally { await signOut(); }
  };
  const asAnon = async (sql, params = []) => {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claims', '', false); set role anon;`);
    try { return await db.query(sql, params); } finally { await signOut(); }
  };
  const sys = (sql, params = []) => db.query(sql, params);
  const one = async (uid, sql, params, opts) => (await as(uid, sql, params, opts)).rows[0];
  const fails = async (fn, code) => { try { await fn(); return false; } catch (e) { return code ? e.code === code : true; } };
  // Error code of a failing call, or 'ok'.
  const codeOf = async (fn) => { try { await fn(); return 'ok'; } catch (e) { return e.code ?? 'error'; } };
  const done = () => {
    console.log(failures ? `\n${failures} FAILED (${passes} passed)` : `\nALL PASSED (${passes} checks)`);
    process.exit(failures ? 1 : 0);
  };

  // ── Fixtures ───────────────────────────────────────────────────────────
  // Publishes version 1.0.0 of the documents the content gate reads.
  const publishPolicies = async () => {
    for (const doc of ['terms', 'sensitive-data', 'contributor-notice', 'privacy']) {
      await sys(`insert into policy_versions (document, version, change_class, requires_reconsent, published_at, new_users_from,
                   effective_at, content_sha256, url, summary)
                 values ($1, '1.0.0', 'initial', false, now() - interval '2 days', now() - interval '2 days', now() - interval '2 days',
                   sha256(convert_to($1, 'UTF8')), 'https://example.invalid/' || $1 || '/1.0.0', 'First version')
                 on conflict do nothing`, [doc]);
    }
  };
  // Terms accepted with the age attestation, then sensitive-data consent (LEGAL-REQ-001, -002, -006).
  const consent = async (uid, { terms = true, age = true, sensitive = true, version = '1.0.0' } = {}) => {
    if (terms) {
      const ctx = JSON.stringify(age ? { age_attested: true, age_signal: 'none' } : {});
      await as(uid, `select public.record_policy_act('terms', $1, 'accept', 'signin_sheet', 'auth.sheet', '1.0.0', 'ios', 'en-US', null, null, $2::jsonb)`, [version, ctx]);
    }
    if (sensitive) {
      await as(uid, `select public.record_policy_act('sensitive-data', '1.0.0', 'accept', 'consent_sheet', 'consent.sensitive', '1.0.0', 'ios')`);
    }
  };
  const newChild = async (uid, name = 'Asha', dob = '2025-04-12', due = null) => {
    const id = uuid7();
    return (await one(uid, `select public.create_child($1, $2, $3::date, $4::date) as id`, [id, name, dob, due])).id;
  };
  const invite = async (inviter, child, role) =>
    (await one(inviter, `select public.create_child_invite($1, $2) as t`, [child, role])).t;
  const join = async (uid, role, child, inviter) => {
    const t = await invite(inviter, child, role);
    await as(uid, `select public.accept_child_invite($1)`, [t]);
  };

  return { db, check, as, asAnon, sys, one, fails, codeOf, done, files, signIn, signOut, defaults,
           publishPolicies, consent, newChild, invite, join };
}

// RFC 9562 UUIDv7 (what the app makes on the device).
export const uuid7 = (ms = Date.now()) => {
  const b = randomBytes(16);
  let t = BigInt(ms);
  for (let i = 5; i >= 0; i--) { b[i] = Number(t & 0xffn); t >>= 8n; }
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

export const users = {
  A: '11111111-1111-1111-1111-111111111111', // parent A, creates the book
  B: '22222222-2222-2222-2222-222222222222', // co-parent B
  C: '33333333-3333-3333-3333-333333333333', // stranger
  N: '44444444-4444-4444-4444-444444444444', // Nani, contributor
  S: '55555555-5555-5555-5555-555555555555', // solo parent with own book
  W: '66666666-6666-6666-6666-666666666666', // anonymous web session (is_anonymous claim)
  U: '77777777-7777-7777-7777-777777777777', // signed in, no consent recorded yet
};
