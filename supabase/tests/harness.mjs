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
    grant usage on schema storage to authenticated, anon; grant all on storage.objects to authenticated, anon;
    -- Mirror Supabase's default privileges (TDD 02 C18): every table and view a
    -- migration creates is granted to both API roles at creation, so a
    -- migration's own revoke (for example on book_entries) is what the tests see.
    grant usage on schema public to authenticated, anon;
    alter default privileges in schema public grant select, insert, update, delete on tables to authenticated, anon;
    -- Supabase also grants EXECUTE on every new public function and USAGE/SELECT
    -- on every new public sequence to the API roles (PDB-01). Without these the
    -- harness hides a missing revoke: a migration that revokes only from public
    -- would look locked down here but stay callable by anon on Supabase.
    alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
    alter default privileges in schema public grant usage, select on sequences to anon, authenticated;
    -- Supabase Vault stub (BL-115 X-12): public.server_secret() reads
    -- vault.decrypted_secrets by name. Tests change or delete these rows to
    -- exercise the fail-closed paths (SCCFG).
    create schema vault;
    create table vault.decrypted_secrets (name text primary key, decrypted_secret text);
    insert into vault.decrypted_secrets values
      ('consent_pepper', 'test-consent-pepper-0123456789abcdef0123'),
      ('invite_code_pepper', 'test-invite-code-pepper-0123456789abcdef');
  `);
  for (const f of files) await db.exec(readFileSync(f, 'utf8'));

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
      await as(uid, `select public.record_policy_act('${uuid7()}', 'terms', $1, 'accept', 'signin_sheet', 'auth.sheet', '1.0.0', 'ios', 'en-US', null, null, $2::jsonb)`, [version, ctx]);
    }
    if (sensitive) {
      await as(uid, `select public.record_policy_act('${uuid7()}', 'sensitive-data', '1.0.0', 'accept', 'consent_sheet', 'consent.sensitive', '1.0.0', 'ios')`);
    }
  };
  const newChild = async (uid, name = 'Asha', dob = '2025-04-12', due = null) => {
    const id = uuid7();
    return (await one(uid, `select public.create_child($1, $2, $3::date, $4::date) as id`, [id, name, dob, due])).id;
  };
  // The client makes the invite secret and code and sends only their SHA-256
  // digests (retry-safe invites). invite() returns the token; inviteWithCode()
  // returns { id, token, code }.
  const inviteWithCode = async (inviter, child, role) => {
    const token = randomBytes(32).toString('hex');
    const code = inviteCode();
    const id = uuid7();
    await one(inviter, `select public.create_child_invite($1, $2, $3, sha256(convert_to($4, 'UTF8')), sha256(convert_to($5, 'UTF8'))) as id`,
      [id, child, role, token, code]);
    return { id, token, code };
  };
  const invite = async (inviter, child, role) => (await inviteWithCode(inviter, child, role)).token;
  const join = async (uid, role, child, inviter) => {
    const t = await invite(inviter, child, role);
    await as(uid, `select public.accept_child_invite($1)`, [t]);
  };

  return { db, check, as, asAnon, sys, one, fails, codeOf, done, files, signIn, signOut,
           publishPolicies, consent, newChild, invite, inviteWithCode, join };
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

// An 8-character invite code in normal form (Crockford base32, no I, L, O, U).
const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const inviteCode = () => Array.from(randomBytes(8), (b) => CODE_ALPHABET[b & 31]).join('');

export const users = {
  A: '11111111-1111-1111-1111-111111111111', // parent A, creates the book
  B: '22222222-2222-2222-2222-222222222222', // co-parent B
  C: '33333333-3333-3333-3333-333333333333', // stranger
  N: '44444444-4444-4444-4444-444444444444', // Nani, contributor
  S: '55555555-5555-5555-5555-555555555555', // solo parent with own book
  W: '66666666-6666-6666-6666-666666666666', // anonymous web session (is_anonymous claim)
  U: '77777777-7777-7777-7777-777777777777', // signed in, no consent recorded yet
};
