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

export async function createDb(files, options = {}) {
  const db = new PGlite(options);
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
    -- Mirror Supabase's default privileges (TDD 02 C18): every table, view and
    -- function a migration creates in public is granted to both API roles and the
    -- service role at creation, so a migration's own revoke (for example on
    -- book_entries, the backup tables' revoke from service_role, or an internal
    -- function's revoke from service_role) is what the tests see. Hosted projects
    -- run "alter default privileges in schema public grant all on tables" and
    -- "... grant all on functions" to anon, authenticated and service_role
    -- (supabase/postgres migrations/db/init-scripts/00000000000000-initial-schema.sql;
    -- docs "Securing your API", section "Default privileges for new tables and
    -- functions"). ALL on a table is SELECT, INSERT, UPDATE, DELETE, TRUNCATE,
    -- REFERENCES, TRIGGER and, from Postgres 17, MAINTAIN; ALL on a function is
    -- EXECUTE. Postgres itself also grants EXECUTE on every new function to PUBLIC,
    -- so a revoke from PUBLIC alone leaves these three explicit grants in place.
    -- Sequences (hosted grants ALL on them too) are not modelled: no test reads them.
    grant usage on schema public to authenticated, anon, service_role;
    alter default privileges in schema public grant all on tables to authenticated, anon, service_role;
    alter default privileges in schema public grant all on functions to authenticated, anon, service_role;
  `);
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

  return { db, check, as, asAnon, sys, one, fails, codeOf, done, files, signIn, signOut,
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
