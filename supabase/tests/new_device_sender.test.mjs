// NS-08-R21 (20261121010000): the sender's definer functions into the three closed ops tables. Fictional family "Asha" only.
//   [NDF record]  first / new / known; one row per device; the class is closed.
//   [NDF take]    pickup deletes the pending row and returns it once.
//   [NDF mint]    SHA-256 only, expiry set in the database, 20 a day, the ceiling is counted.
//   [NDF grants]  service_role only; no table grant; a person cannot reach another's rows.
// Mutants: the guard is taken away and the same attempt must then succeed.
import { createHash } from 'node:crypto';
import { createDb, users } from './harness.mjs';

const { db, check, as, asAnon, sys, codeOf, done } = await createDb(process.argv.slice(2));
const { A, B } = users;
await sys(`insert into auth.users values ('${A}'),('${B}')`);
const S1 = '11111111-1111-4111-8111-111111111111', S2 = '22222222-2222-4222-8222-222222222222', S3 = '33333333-3333-4333-8333-333333333333';
const role = async (r, sql, params = []) => { await sys(`set role ${r}`); try { return await sys(sql, params); } finally { await sys('reset role'); } };
const svc = (sql, params) => role('service_role', sql, params);
const cnt = async (t) => Number((await sys(`select count(*) n from ${t}`)).rows[0].n);
const sha = (s) => createHash('sha256').update(s).digest();
const dev = (c) => Buffer.alloc(16, c);
const rec = async (p, h, c = 'apple') => (await svc('select public.ops_new_device_record($1, $2, $3) r', [p, h, c])).rows[0].r;

// -- record-device ---------------------------------------------------------------------------
check('[NDF record] the first device of a person is "first" and has no notified_at', (await rec(A, dev(1))) === 'first'
  && (await sys('select notified_at from ops.account_sessions_seen')).rows[0].notified_at === null);
check('[NDF record] the same device again is "known" and adds no row', (await rec(A, dev(1))) === 'known' && (await cnt('ops.account_sessions_seen')) === 1);
check('[NDF record] a second device is "new" and notified_at is set', (await rec(A, dev(2), 'other')) === 'new'
  && (await sys(`select notified_at from ops.account_sessions_seen where device_hash = $1`, [dev(2)])).rows[0].notified_at !== null);
check('[NDF record] the same hash for another person is that person\'s own first device', (await rec(B, dev(2))) === 'first' && (await cnt('ops.account_sessions_seen')) === 3);
await sys(`update ops.account_sessions_seen set last_seen_day = current_date - 5 where profile_id = '${A}' and device_hash = $1`, [dev(1)]);
await rec(A, dev(1));
check('[NDF record] a known device refreshes last_seen_day once a day', (await sys(`select last_seen_day = current_date ok from ops.account_sessions_seen where profile_id = '${A}' and device_hash = $1`, [dev(1)])).rows[0].ok);
check('[NDF record] a null class is stored as "other"', (await rec(A, dev(3), null)) === 'new'
  && (await sys(`select class from ops.account_sessions_seen where device_hash = $1 and profile_id = '${A}'`, [dev(3)])).rows[0].class === 'other');
check('[NDF record] an unknown class (22P02), a short hash (23514) and an unknown person (23503) are refused',
  (await codeOf(() => rec(A, dev(4), 'banana'))) === '22P02' && (await codeOf(() => rec(A, Buffer.alloc(8), 'apple'))) === '23514'
  && (await codeOf(() => rec('99999999-9999-4999-8999-999999999999', dev(4)))) === '23503' && (await cnt('ops.account_sessions_seen')) === 4);
// mutant: without the lock-and-check of earlier rows every device reads as "first" (a thief's device would send no email).
await sys(`create or replace function public.ops_new_device_record(p_profile uuid, p_device_hash bytea, p_class text) returns text language sql
  security definer set search_path = pg_catalog, public, pg_temp as $$ select 'first' $$`);
check('[NDF record] mutant: a record function that always says "first" is caught by the test above', (await rec(A, dev(9))) === 'first');
await db.exec(`drop function public.ops_new_device_record(uuid, bytea, text)`);   // restore below from the migration text
const { readFileSync } = await import('node:fs');
const mig = readFileSync(process.argv.slice(2).find((f) => f.includes('new_device_sender')), 'utf8');
await db.exec(mig.slice(mig.indexOf('create or replace function public.ops_new_device_record'), mig.indexOf('-- Pickup deletes')));
await db.exec(`grant execute on function public.ops_new_device_record(uuid, bytea, text) to service_role; revoke execute on function public.ops_new_device_record(uuid, bytea, text) from public`);
check('[NDF record] restored: a known device is "known" again', (await rec(A, dev(1))) === 'known');

// -- take-pending ----------------------------------------------------------------------------
const q = (s, p, c, h) => sys(`insert into ops.new_device_pending (session_id, profile_id, class, device_hash) values ($1, $2, $3, $4)`, [s, p, c, h]);
await q(S1, A, 'apple', dev(1)); await q(S2, B, null, null);
await sys(`update ops.new_device_pending set queued_at = now() - interval '1 minute' where session_id = '${S1}'`);
let r = (await svc('select public.ops_new_device_pending_take($1) r', [S2])).rows[0].r;
check('[NDF take] a named session is returned with class "other" for null and the row is deleted',
  r.length === 1 && r[0].session_id === S2 && r[0].profile_id === B && r[0].class === 'other' && r[0].device_hash === null && (await cnt('ops.new_device_pending')) === 1);
r = (await svc('select public.ops_new_device_pending_take() r')).rows[0].r;
check('[NDF take] the oldest are returned with the hash as hex, and pickup leaves nothing',
  r.length === 1 && r[0].device_hash === dev(1).toString('hex') && r[0].class === 'apple' && (await cnt('ops.new_device_pending')) === 0);
check('[NDF take] a second pickup returns an empty list (each row is taken once)', (await svc('select public.ops_new_device_pending_take() r')).rows[0].r.length === 0
  && (await svc('select public.ops_new_device_pending_take($1) r', [S1])).rows[0].r.length === 0);
for (let i = 0; i < 3; i++) await q(`aaaaaaaa-aaaa-4aaa-8aaa-00000000000${i}`, A, null, null);
check('[NDF take] the limit is honoured (2 of 3) and a limit of 0 or less still takes one, never all',
  (await svc('select public.ops_new_device_pending_take(null, 2) r')).rows[0].r.length === 2 && (await svc('select public.ops_new_device_pending_take(null, 0) r')).rows[0].r.length === 1
  && (await cnt('ops.new_device_pending')) === 0);
// mutant: a pickup that only reads leaves the row for a second send.
await q(S3, A, 'apple', dev(1));
await sys(`create or replace function public.ops_new_device_pending_take(p_session uuid default null, p_limit int default 20) returns jsonb language sql
  security definer set search_path = pg_catalog, public, pg_temp as $$ select coalesce(jsonb_agg(session_id), '[]'::jsonb) from ops.new_device_pending $$`);
await svc('select public.ops_new_device_pending_take() r');
check('[NDF take] mutant: a read-only pickup leaves the row behind (so the deletion test above can fail)', (await cnt('ops.new_device_pending')) === 1);

// -- mint-token ------------------------------------------------------------------------------
const TOK = 'a'.repeat(43), H = sha(TOK);
const mint = (p, s, h, ttl) => svc(ttl ? 'select public.ops_new_device_token_mint($1, $2, $3, $4::interval) r' : 'select public.ops_new_device_token_mint($1, $2, $3) r', ttl ? [p, s, h, ttl] : [p, s, h]);
const e1 = (await mint(A, S1, H)).rows[0].r;
const row = (await sys('select encode(token_hash, \'hex\') h, profile_id, session_id, used_at, outcome, extract(epoch from expires_at - created_at)::int life from ops.new_device_tokens')).rows[0];
check('[NDF mint] the row holds the SHA-256 and no plaintext, unused, 48 hours by default, bound to the one session',
  row.h === H.toString('hex') && !JSON.stringify(row).includes(TOK) && row.profile_id === A && row.session_id === S1 && row.used_at === null
  && row.outcome === null && row.life === 172800 && e1 !== null);
check('[NDF mint] the same token twice is refused (23505): a token is made once', (await codeOf(() => mint(A, S2, H))) === '23505' && (await cnt('ops.new_device_tokens')) === 1);
check('[NDF mint] a lifetime under a minute or over 7 days is refused (22023); a short one is kept',
  (await codeOf(() => mint(A, S1, sha('s1'), '10 seconds'))) === '22023' && (await codeOf(() => mint(A, S1, sha('s2'), '8 days'))) === '22023'
  && (await codeOf(() => mint(A, S1, sha('s3'), '1 hour'))) === 'ok');
check('[NDF mint] a hash that is not 32 bytes (23514) and an unknown person (23503) are refused',
  (await codeOf(() => mint(A, S1, Buffer.from(TOK)))) === '23514' && (await codeOf(() => mint('99999999-9999-4999-8999-999999999999', S1, sha('x')))) === '23503');
// The minted token works with the press of 20261121000000 once, and expires.
await sys(`insert into auth.sessions (id, user_id) values ($1, $2)`, [S1, A]);
const press = (h) => svc('select public.ops_new_device_sign_out($1) r', [h]);
check('[NDF mint] the minted token ends its session once, then says "already"', (await press(H)).rows[0].r === 'ended' && (await press(H)).rows[0].r === 'already');
await mint(B, S2, sha('exp'), '1 minute');
await sys(`update ops.new_device_tokens set created_at = now() - interval '2 minutes', expires_at = now() - interval '1 minute' where token_hash = $1`, [sha('exp')]);
check('[NDF mint] an expired minted token answers "unknown" and does not end the session', (await press(sha('exp'))).rows[0].r === 'unknown');
// ceiling: 20 a day per person, counted, never the 21st.
await sys('delete from ops.new_device_tokens');
for (let i = 0; i < 20; i++) await mint(A, S1, sha(`c${i}`));
check('[NDF mint] twenty tokens a day are made', (await cnt(`ops.new_device_tokens where profile_id = '${A}'`)) === 20);
const over = (await mint(A, S1, sha('c20'))).rows[0].r;
const ev = (await sys(`select * from ops.security_events where kind = 'alert_mail_ceiling'`)).rows;
check('[NDF mint] the 21st returns null, makes no token, and counts one alert_mail_ceiling with no subject or detail',
  over === null && (await cnt(`ops.new_device_tokens where profile_id = '${A}'`)) === 20 && ev.length === 1 && ev[0].kind === 'alert_mail_ceiling'
  && ev[0].subject_hash === null && JSON.stringify(ev[0].detail) === '{}');
check('[NDF mint] the ceiling is per person: B still gets a token', (await mint(B, S2, sha('b1'))).rows[0].r !== null);
await sys(`update ops.new_device_tokens set created_at = now() - interval '25 hours', expires_at = now() - interval '1 hour' where profile_id = '${A}' and token_hash = $1`, [sha('c0')]);
check('[NDF mint] a day later the count falls and a token is made again', (await mint(A, S1, sha('c21'))).rows[0].r !== null);
// mutant: without the ceiling the 21st token is made.
await sys(`create or replace function public.ops_new_device_token_mint(p_profile uuid, p_session uuid, p_token_hash bytea, p_ttl interval default interval '48 hours')
  returns timestamptz language sql security definer set search_path = pg_catalog, public, pg_temp as
  $$ insert into ops.new_device_tokens (token_hash, profile_id, session_id, expires_at) values (p_token_hash, p_profile, p_session, now() + p_ttl) returning expires_at $$`);
check('[NDF mint] mutant: without the ceiling the 21st token is made', (await mint(A, S1, sha('c22'))).rows[0].r !== null && (await cnt(`ops.new_device_tokens where profile_id = '${A}' and created_at > now() - interval '24 hours'`)) === 21);

// -- grants ----------------------------------------------------------------------------------
const FN = ['ops_new_device_record(uuid,bytea,text)', 'ops_new_device_pending_take(uuid,int)', 'ops_new_device_token_mint(uuid,uuid,bytea,interval)'];
const CALL = [`public.ops_new_device_record('${A}', decode(repeat('00', 16), 'hex'), 'other')`, 'public.ops_new_device_pending_take()',
  `public.ops_new_device_token_mint('${B}', '${A}', decode(repeat('01', 32), 'hex'))`];
for (const c of CALL) {
  const n = c.split('(')[0];
  check(`[NDF grants] ${n}: authenticated and anon are refused (42501)`, (await codeOf(() => as(A, `select ${c}`))) === '42501' && (await codeOf(() => asAnon(`select ${c}`))) === '42501');
  check(`[NDF cross-user] ${n}: a person cannot call it for another person (42501)`, (await codeOf(() => as(B, `select ${c.replace(/'[^']{36}'/, `'${A}'`)}`))) === '42501');
}
check('[NDF grants] service_role holds execute on all three, anon, authenticated and public on none',
  (await sys(`select bool_and(has_function_privilege('service_role', 'public.' || f, 'execute') and not has_function_privilege('authenticated', 'public.' || f, 'execute')
    and not has_function_privilege('anon', 'public.' || f, 'execute')) ok from unnest($1::text[]) f`, [FN])).rows[0].ok);
check('[NDF grants] all three are security definer with a pinned search_path',
  (await sys(`select count(*)::int n from pg_proc p where p.proname in ('ops_new_device_record', 'ops_new_device_pending_take', 'ops_new_device_token_mint')
   and p.prosecdef and array_to_string(p.proconfig, ',') ~ 'search_path=pg_catalog'`)).rows[0].n === 3);
check('[NDF grants] no table privilege for service_role, anon or authenticated, and a person cannot read a table',
  !(await sys(`select bool_or(has_table_privilege(r, t, p)) x from unnest(array['anon','authenticated','service_role']) r,
    unnest(array['ops.account_sessions_seen','ops.new_device_pending','ops.new_device_tokens']) t, unnest(array['SELECT','INSERT','UPDATE','DELETE']) p`)).rows[0].x
  && (await codeOf(() => as(A, 'select * from ops.new_device_pending'))) === '42501');
// mutant: granted to authenticated, a person can mint a token for anyone.
await db.exec(`grant execute on function public.ops_new_device_token_mint(uuid, uuid, bytea, interval) to authenticated`);
check('[NDF grants] mutant: with execute granted to authenticated a person can mint a token for another', (await codeOf(() => as(A, `select ${CALL[2]}`))) === 'ok');
done();
