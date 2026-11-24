// NS-08-R21 / E83 (20261121000000): the new-device sign-in email, database half. Fictional family "Asha" only.
//   [NS-08-R21 hook]    the access token hook queues one row per sign-in, ignores token_refresh, fails open.
//   [NS-08-R21 token]   the Not-you token is hashed, single use, expiring, bound to one session.
//   [NS-08-R21 session] only service_role ends a session, and only the one it is asked for.
//   [NS-08-R21 closed]  no API role reaches any table; no column can hold an IP, user agent or device name; deletion cascades.
// Each P0 row carries one in-file mutant: the guard is taken away and the same attempt must then succeed.
import { writeFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { createDb, users } from './harness.mjs';

// The harness has no supabase_auth_admin role; a file ahead of the migrations makes it, so the migration's own grant runs.
const pre = join(mkdtempSync(join(tmpdir(), 'nd-')), '000_role.sql');
writeFileSync(pre, 'create role supabase_auth_admin nologin; grant usage on schema public to supabase_auth_admin;');
const { db, check, as, asAnon, sys, codeOf, done } = await createDb([pre, ...process.argv.slice(2)]);
const { A, B } = users;
await sys(`insert into auth.users values ('${A}'),('${B}')`);
const SA = '11111111-1111-4111-8111-111111111111', SB = '22222222-2222-4222-8222-222222222222', SC = '33333333-3333-4333-8333-333333333333';
const role = async (r, sql, params = []) => { await sys(`set role ${r}`); try { return await sys(sql, params); } finally { await sys('reset role'); } };
const hook = (event) => role('supabase_auth_admin', 'select public.hook_new_device_sign_in($1::jsonb) r', [JSON.stringify(event)]);
const ev = (user, sid, method = 'otp') => ({ user_id: user, authentication_method: method, claims: { session_id: sid, email: 'asha@example.com', sub: user } });
const cnt = async (t) => Number((await sys(`select count(*) n from ${t}`)).rows[0].n);
const sha = (s) => createHash('sha256').update(s).digest();
const fail = async (f) => { try { await f(); return 'ok'; } catch (e) { return e.code ?? 'error'; } };

// -- Hook ----------------------------------------------------------------------------------
let r = (await hook(ev(A, SA))).rows[0].r;
check('[NS-08-R21 hook] a sign-in queues one pending row for the person and the session, and returns the claims unchanged',
  (await cnt('ops.new_device_pending')) === 1 && r.claims.session_id === SA && r.claims.sub === A);
await hook(ev(A, SA));
check('[NS-08-R21 hook] the same session twice still holds one row', (await cnt('ops.new_device_pending')) === 1);
for (let i = 0; i < 10; i++) await hook(ev(A, SB, 'token_refresh'));
check('[NS-08-R21 hook] ten refreshes write nothing', (await cnt('ops.new_device_pending')) === 1);
await hook(ev('99999999-9999-4999-8999-999999999999', SC));
check('[NS-08-R21 hook] a person with no profile yet (first sign-in) queues nothing and does not fail',
  (await cnt('ops.new_device_pending')) === 1 && (await cnt('ops.security_events')) === 0);
await db.exec(`create function ops.nd_boom() returns trigger language plpgsql as $$ begin raise exception 'boom'; end $$;
  create trigger nd_boom before insert on ops.new_device_pending for each row execute function ops.nd_boom()`);
r = (await hook(ev(B, SB))).rows[0].r;
check('[NS-08-R21 hook] fail open: a failing insert still returns the claims, queues nothing, and counts one failure',
  r.claims.session_id === SB && (await cnt('ops.new_device_pending')) === 1
  && (await sys(`select count(*) n from ops.security_events where kind = 'new_device_hook_failed'`)).rows[0].n == 1);
check('[NS-08-R21 hook] fail open: garbage input (no session id, bad uuid) does not raise',
  (await fail(() => hook({ user_id: 'x', claims: {} }))) === 'ok' && (await fail(() => hook({}))) === 'ok');
// BL-1184: a statement timeout (57014, query_canceled) is not caught by `when others`. A trigger that raises it stands in for
// the timeout; the hook must still let the sign-in through, count one failure, and queue nothing.
const failures = async () => Number((await sys(`select count(*) n from ops.security_events where kind = 'new_device_hook_failed'`)).rows[0].n);
await sys(`drop trigger nd_boom on ops.new_device_pending`);
await db.exec(`create function ops.nd_timeout() returns trigger language plpgsql as $$ begin raise exception 'canceling statement due to statement timeout' using errcode = '57014'; end $$;
  create trigger nd_timeout before insert on ops.new_device_pending for each row execute function ops.nd_timeout()`);
const pendingBefore = await cnt('ops.new_device_pending'), failedBefore = await failures();
const evT = ev(B, SB);
const rT = await fail(() => hook(evT));
check('[BL-1184 hook] a statement timeout on the queue insert does not break the sign-in', rT === 'ok');
r = (await hook(evT)).rows[0].r;
check('[BL-1184 hook] a statement timeout returns the claims unchanged, queues nothing and counts one failure per sign-in (two sign-ins, two counts)',
  isDeepStrictEqual(r, { claims: evT.claims }) && (await cnt('ops.new_device_pending')) === pendingBefore && (await failures()) === failedBefore + 2);
// the counter insert can time out too: still no error, and no count.
await db.exec(`create function ops.nd_timeout2() returns trigger language plpgsql as $$ begin raise exception 'timeout' using errcode = '57014'; end $$;
  create trigger nd_timeout2 before insert on ops.security_events for each row execute function ops.nd_timeout2()`);
r = (await fail(() => hook(evT))) === 'ok' ? (await hook(evT)).rows[0].r : null;
check('[BL-1184 hook] when the failure counter times out as well, the claims still come back and no count is written',
  r !== null && isDeepStrictEqual(r, { claims: evT.claims }) && (await failures()) === failedBefore + 2);
await sys(`drop trigger nd_timeout2 on ops.security_events`);
await sys(`drop trigger nd_timeout on ops.new_device_pending`);
await db.exec(`create trigger nd_boom before insert on ops.new_device_pending for each row execute function ops.nd_boom()`);

// BL-1187: in every branch the hook returns exactly { claims } and the claims equal the input claims, key for key. A handler
// that adds a role (or any) claim in the fail-open branch must turn this red.
const sameClaims = (event, out) => {
  const o = out?.rows?.[0]?.r;
  return o !== undefined && o !== null && isDeepStrictEqual(Object.keys(o), ['claims']) && isDeepStrictEqual(o.claims, event.claims); // jsonb reorders keys, so a deep compare, not a string compare
};
const branches = {
  'sign-in that queues': ev(A, '66666666-6666-4666-8666-666666666666'),
  'same session again': ev(A, '66666666-6666-4666-8666-666666666666'),
  'token_refresh': ev(A, SB, 'token_refresh'),
  'no profile yet': ev('99999999-9999-4999-8999-999999999999', SC),
  'no authentication_method': { user_id: A, claims: { session_id: SC, sub: A, aal: 'aal1' } },
  'failing insert (fail open)': ev(B, SC),
  'bad uuid (outer fail open)': { user_id: 'x', claims: { session_id: 'not-a-uuid', sub: 'x', email: 'asha@example.com' } },
};
for (const [name, event] of Object.entries(branches)) {
  check(`[BL-1187 hook] ${name}: the claims out equal the claims in and nothing else is returned`, sameClaims(event, await hook(event)));
}
// mutants of the fail-open branches: each adds a claim and must be caught by sameClaims.
const planted = async (body) => {
  await sys(`create or replace function public.hook_new_device_sign_in(event jsonb) returns jsonb language plpgsql security definer
    set search_path = pg_catalog, public, pg_temp as $$ begin ${body} end $$`);
};
const probe = ev(B, SC);
await planted(`begin raise exception 'boom'; exception when others then return jsonb_build_object('claims', (event->'claims') || '{"role":"service_role"}'::jsonb); end;`);
check('[BL-1187 hook] mutant: a fail-open branch that adds a role claim is caught', !sameClaims(probe, await hook(probe)));
await planted(`begin raise exception 'boom'; exception when others then return jsonb_build_object('claims', event->'claims', 'role', 'service_role'); end;`);
check('[BL-1187 hook] mutant: a fail-open branch that adds a top-level key is caught', !sameClaims(probe, await hook(probe)));
await planted(`return jsonb_build_object('claims', (event->'claims') - 'email');`);
check('[BL-1187 hook] mutant: a branch that drops a claim is caught', !sameClaims(probe, await hook(probe)));
await planted(`return jsonb_build_object('claims', event->'claims');`);
check('[BL-1187 hook] the checker passes a faithful handler (it is not always red)', sameClaims(probe, await hook(probe)));
// put the shipped body back for the rest of the file (the mutants below replace it again).
const shipped = readFileSync(join(import.meta.dirname, '..', 'migrations', '20261124100000_new_device_hook_statement_timeout.sql'), 'utf8');
await db.exec(shipped.slice(shipped.indexOf('create or replace function')));
// mutant: a hook without the exception block lets the error reach the sign-in.
await sys(`create or replace function public.hook_new_device_sign_in(event jsonb) returns jsonb language plpgsql security definer
  set search_path = pg_catalog, public, pg_temp as $$ begin
  insert into ops.new_device_pending (session_id, profile_id) values ((event->'claims'->>'session_id')::uuid, (event->>'user_id')::uuid);
  return jsonb_build_object('claims', event->'claims'); end $$`);
check('[NS-08-R21 hook] mutant: without the exception block the same failure breaks the sign-in', (await fail(() => hook(ev(B, SC)))) !== 'ok');
// mutant: a hook that does not exclude refresh queues a row.
await sys(`drop trigger nd_boom on ops.new_device_pending`);
await hook(ev(A, SC, 'token_refresh'));
check('[NS-08-R21 hook] mutant: without the refresh exclusion a refresh writes a row', (await cnt('ops.new_device_pending')) === 2);
await sys(`delete from ops.new_device_pending where session_id = '${SC}'`);

check('[NS-08-R21 hook] the hook is executable by supabase_auth_admin only',
  (await sys(`select has_function_privilege('supabase_auth_admin', 'public.hook_new_device_sign_in(jsonb)', 'execute') a,
    has_function_privilege('authenticated', 'public.hook_new_device_sign_in(jsonb)', 'execute') b,
    has_function_privilege('anon', 'public.hook_new_device_sign_in(jsonb)', 'execute') c,
    has_function_privilege('service_role', 'public.hook_new_device_sign_in(jsonb)', 'execute') d`)).rows[0]
  .a === true);
const g = (await sys(`select has_function_privilege('authenticated', 'public.hook_new_device_sign_in(jsonb)', 'execute') b,
    has_function_privilege('anon', 'public.hook_new_device_sign_in(jsonb)', 'execute') c,
    has_function_privilege('service_role', 'public.hook_new_device_sign_in(jsonb)', 'execute') d`)).rows[0];
check('[NS-08-R21 hook] anon, authenticated and service_role cannot execute the hook', !g.b && !g.c && !g.d);
check('[NS-08-R21 hook] a signed-in person calling the hook gets 42501', (await codeOf(() => as(A, 'select public.hook_new_device_sign_in($1::jsonb)', [JSON.stringify(ev(A, SA))]))) === '42501');

// -- Token and session lever -----------------------------------------------------------------
const TOK = 'a'.repeat(43), H = sha(TOK);
await sys(`insert into auth.sessions (id, user_id) values ($1, $2), ($3, $2), ($4, $5)`, [SA, A, SB, SC, B]);
await sys(`insert into ops.new_device_tokens (token_hash, profile_id, session_id, expires_at) values ($1, $2, $3, now() + interval '48 hours')`, [H, A, SB]);
const press = (h, rid = null) => role('service_role', 'select public.ops_new_device_sign_out($1, $2) r', [h, rid]);
const live = async () => (await sys('select id from auth.sessions order by id')).rows.map((x) => x.id);
check('[NS-08-R21 token] the token row holds the SHA-256 and no plaintext',
  (await sys(`select encode(token_hash, 'hex') h from ops.new_device_tokens`)).rows[0].h === H.toString('hex') && !JSON.stringify((await sys('select * from ops.new_device_tokens')).rows).includes(TOK));
check('[NS-08-R21 token] an unknown token answers "unknown" and ends nothing', (await press(sha('nope'))).rows[0].r === 'unknown' && (await live()).length === 3);
check('[NS-08-R21 session] the press ends exactly the one session of three accounts-sessions: 2 live remain',
  (await press(H, 'abcdef012345')).rows[0].r === 'ended' && JSON.stringify(await live()) === JSON.stringify([SA, SC]));
let t = (await sys('select used_at, outcome from ops.new_device_tokens')).rows[0];
check('[NS-08-R21 token] the press sets used_at and the closed outcome', t.used_at !== null && t.outcome === 'ended');
const ev1 = (await sys(`select * from ops.security_events where kind = 'new_device_signed_out'`)).rows;
check('[NS-08-R21 token] one audit row, content free, written on the press', ev1.length === 1 && ev1[0].request_id === 'abcdef012345' && JSON.stringify(ev1[0].detail) === '{"ended":true}' && ev1[0].subject_hash === null);
check('[NS-08-R21 token] a second press says "already", ends nothing more and writes no second audit row',
  (await press(H)).rows[0].r === 'already' && (await live()).length === 2 && (await cnt(`ops.security_events where kind = 'new_device_signed_out'`)) === 1);
// mutant: single use removed. The token is un-used and pointed at a second live session of the same person: the press then
// ends that second session, so the used_at check above is the only thing that stopped it.
const SD = '55555555-5555-4555-8555-555555555555';
await sys(`insert into auth.sessions (id, user_id) values ($1, $2)`, [SD, A]);
await sys(`update ops.new_device_tokens set used_at = null, outcome = null, session_id = $1`, [SD]);
check('[NS-08-R21 token] mutant: with used_at cleared the same token presses again and ends a second session',
  (await press(H)).rows[0].r === 'ended' && !(await live()).includes(SD) && (await cnt(`ops.security_events where kind = 'new_device_signed_out'`)) === 2);
// expiry
const H2 = sha('b'.repeat(43));
await sys(`insert into ops.new_device_tokens (token_hash, profile_id, session_id, created_at, expires_at) values ($1, $2, $3, now() - interval '3 days', now() - interval '1 hour')`, [H2, B, SC]);
check('[NS-08-R21 token] an expired token answers "unknown" (as an unknown one) and ends nothing', (await press(H2)).rows[0].r === 'unknown' && (await live()).includes(SC));
await sys(`update ops.new_device_tokens set expires_at = now() + interval '1 hour' where token_hash = $1`, [H2]);
check('[NS-08-R21 token] mutant: the same token before expiry does end the session', (await press(H2)).rows[0].r === 'ended' && !(await live()).includes(SC));
// BL-1204: the table itself caps a token's life at 7 days, whatever path inserts it.
const capFail = (secs) => fail(() => sys(`insert into ops.new_device_tokens (token_hash, profile_id, session_id, created_at, expires_at)
  values ($1, $2, $3, '2026-11-24T00:00:00Z', timestamp with time zone '2026-11-24T00:00:00Z' + make_interval(secs => $4))`, [sha(`cap${secs}`), A, SA, secs]));
check('[BL-1204 token] a token that lives 48 hours is accepted', (await capFail(48 * 3600)) === 'ok');
check('[BL-1204 token] a token that lives exactly 7 days is accepted', (await capFail(7 * 86400)) === 'ok');
check('[BL-1204 token] a token that lives 7 days and a second is refused (23514)', (await capFail(7 * 86400 + 1)) === '23514');
check('[BL-1204 token] a token that lives 30 days is refused (23514)', (await capFail(30 * 86400)) === '23514');
check('[BL-1204 token] the cap is a named table constraint', (await sys(`select 1 from pg_constraint where conname = 'new_device_tokens_expiry_cap' and conrelid = 'ops.new_device_tokens'::regclass`)).rows.length === 1);
// mutant: without the constraint the 30 day token goes in.
await sys(`alter table ops.new_device_tokens drop constraint new_device_tokens_expiry_cap`);
check('[BL-1204 token] mutant: with the cap dropped a 30 day token is accepted', (await capFail(30 * 86400)) === 'ok');
await sys(`delete from ops.new_device_tokens where token_hash = any($1)`, [[sha(`cap${48 * 3600}`), sha(`cap${7 * 86400}`), sha(`cap${30 * 86400}`)]]);
await sys(`alter table ops.new_device_tokens add constraint new_device_tokens_expiry_cap check (expires_at <= created_at + interval '7 days')`);
// bound to one account
await sys(`insert into auth.sessions (id, user_id) values ($1, $2)`, [SC, B]);
await sys(`insert into ops.new_device_tokens (token_hash, profile_id, session_id, expires_at) values ($1, $2, $3, now() + interval '1 hour')`, [sha('c'.repeat(43)), A, SC]);
check('[NS-08-R21 session] a token of one person naming another person\'s session ends nothing', (await press(sha('c'.repeat(43)))).rows[0].r === 'already' && (await live()).includes(SC));
check('[NS-08-R21 token] the outcome list is closed and used_at without outcome is refused',
  (await fail(() => sys(`update ops.new_device_tokens set outcome = 'banana'`))) === '22P02'
  && (await fail(() => sys(`update ops.new_device_tokens set used_at = now(), outcome = null where token_hash = $1`, [H2]))) === '23514'
  && (await fail(() => sys(`insert into ops.new_device_tokens (token_hash, profile_id, session_id, expires_at) values ($1, $2, $3, now() + interval '1 hour')`, [Buffer.alloc(8), A, SA]))) === '23514');

// session delete only by service_role
const calls = [`public.ops_end_session('${A}', '${SA}')`, `public.ops_new_device_sign_out(decode(repeat('00', 32), 'hex'), null)`, 'public.ops_new_device_retention()'];
for (const c of calls) {
  check(`[NS-08-R21 session] authenticated cannot call ${c.split('(')[0]} (42501)`, (await codeOf(() => as(A, `select ${c}`))) === '42501');
  check(`[NS-08-R21 session] anon cannot call ${c.split('(')[0]} (42501)`, (await codeOf(() => asAnon(`select ${c}`))) === '42501');
}
await sys(`insert into auth.sessions (id, user_id) values ('44444444-4444-4444-8444-444444444444', $1)`, [A]);
check('[NS-08-R21 session] service_role ends one session and reports 1; the second call reports 0',
  (await role('service_role', `select public.ops_end_session($1, '44444444-4444-4444-8444-444444444444') n`, [A])).rows[0].n === 1
  && (await role('service_role', `select public.ops_end_session($1, '44444444-4444-4444-8444-444444444444') n`, [A])).rows[0].n === 0);
await db.exec(`revoke all on function public.ops_end_session(uuid, uuid) from service_role; grant execute on function public.ops_end_session(uuid, uuid) to authenticated`);
check('[NS-08-R21 session] mutant: with the function granted to authenticated a person can end a session', (await codeOf(() => as(A, 'select public.ops_end_session($1, $2)', [A, SA]))) === 'ok');
await db.exec(`revoke execute on function public.ops_end_session(uuid, uuid) from authenticated; grant execute on function public.ops_end_session(uuid, uuid) to service_role`);

// -- Closed to the API; no IP or user agent column -------------------------------------------
const tables = ['ops.account_sessions_seen', 'ops.new_device_pending', 'ops.new_device_tokens'];
for (const tb of tables) {
  const rls = (await sys(`select relrowsecurity r from pg_class where oid = '${tb}'::regclass`)).rows[0].r;
  const pol = await cnt(`pg_policy where polrelid = '${tb}'::regclass`);
  const priv = (await sys(`select bool_or(has_table_privilege(r, '${tb}', p)) any_ from unnest(array['anon','authenticated','service_role']) r, unnest(array['SELECT','INSERT','UPDATE','DELETE']) p`)).rows[0].any_;
  check(`[NS-08-R21 closed] ${tb}: RLS on, no policy, no privilege for anon, authenticated or service_role`, rls === true && pol === 0 && priv === false);
}
check('[NS-08-R21 closed] a signed-in person cannot read a table (42501)', (await codeOf(() => as(A, 'select * from ops.new_device_tokens'))) === '42501');
const cols = (await sys(`select c.relname t, string_agg(a.attname, ',' order by a.attnum) cols from pg_class c join pg_attribute a on a.attrelid = c.oid
  where c.oid = any(array['ops.account_sessions_seen'::regclass, 'ops.new_device_pending'::regclass, 'ops.new_device_tokens'::regclass]) and a.attnum > 0 and not a.attisdropped group by 1`)).rows
  .reduce((o, x) => ({ ...o, [x.t]: x.cols }), {});
check('[NS-08-R21 closed] the device row has exactly the specified columns', cols.account_sessions_seen === 'profile_id,device_hash,class,first_seen_at,last_seen_day,notified_at');
const BAD = /(^|_)(ip|ips|address|agent|ua|browser|os|model|name|device_name|city|country|region|lat|lng|location|email|locale|timezone)(_|$)/;
const allCols = Object.values(cols).join(',').split(',');
check('[NS-08-R21 canary] no column of the three tables can hold an IP, user agent, device name, model, place or email',
  allCols.length > 10 && !allCols.some((c) => BAD.test(c)) && !(await sys(`select 1 from pg_attribute a where a.attrelid = any(array['ops.account_sessions_seen'::regclass, 'ops.new_device_pending'::regclass,
    'ops.new_device_tokens'::regclass]) and a.attnum > 0 and a.atttypid in ('text'::regtype, 'varchar'::regtype, 'inet'::regtype, 'jsonb'::regtype)`)).rows.length);
const unl = (await sys(`select c.relname, a.attname from pg_class c join pg_namespace n on n.oid = c.relnamespace join pg_attribute a on a.attrelid = c.oid
  where n.nspname = 'ops' and c.relname in ('account_sessions_seen', 'new_device_pending', 'new_device_tokens') and a.attnum > 0 and not a.attisdropped
  and coalesce(col_description(c.oid, a.attnum), '') !~ '^L[1-4]\\y'`)).rows;
check('[NS-08-R21 closed] every column carries a level comment', unl.length === 0);
check('[NS-08-R21 closed] the device hash and token hash lengths are enforced',
  (await fail(() => sys(`insert into ops.account_sessions_seen (profile_id, device_hash, class) values ($1, $2, 'apple')`, [A, Buffer.alloc(4)]))) === '23514');

// -- Retention and deletion ---------------------------------------------------------------------
await db.exec(`delete from ops.new_device_pending; delete from ops.new_device_tokens; delete from ops.account_sessions_seen`);
await sys(`insert into ops.new_device_pending (session_id, profile_id, queued_at) values ($1, $2, now() - interval '25 hours'), ($3, $2, now() - interval '1 hour')`, [SA, A, SB]);
await sys(`insert into ops.new_device_tokens (token_hash, profile_id, session_id, created_at, expires_at) values ($1, $3, $4, now() - interval '12 days', now() - interval '8 days'),
  ($2, $3, $5, now() - interval '5 days', now() - interval '3 days')`, [sha('d'), sha('e'), A, SA, SB]);
await sys(`insert into ops.account_sessions_seen (profile_id, device_hash, class, last_seen_day) values ($1, $2, 'apple', current_date - 91), ($1, $3, 'other', current_date - 89)`, [A, Buffer.alloc(16, 1), Buffer.alloc(16, 2)]);
const ret = (await role('service_role', 'select public.ops_new_device_retention() r')).rows[0].r;
check('[NS-08-R21 retention] pending after 24 h, tokens 7 days past expiry, devices 90 days not seen: only those go',
  ret.pending === 1 && ret.tokens === 1 && ret.devices === 1 && (await cnt('ops.new_device_pending')) === 1 && (await cnt('ops.new_device_tokens')) === 1 && (await cnt('ops.account_sessions_seen')) === 1);
const future = (await role('service_role', `select public.ops_new_device_retention(now() + interval '10 years') r`)).rows[0].r;
check('[NS-08-R21 retention] a future clock from the caller deletes nothing more (the server clock rules)', future.pending === 0 && future.tokens === 0 && future.devices === 0);
await sys(`insert into ops.new_device_pending (session_id, profile_id) values ($1, $2)`, [SC, B]);
await sys(`delete from auth.users where id = $1`, [A]);
check('[NS-08-R21 deletion] deleting the account removes its pending, token and device rows and leaves the other person\'s',
  (await cnt(`ops.new_device_pending where profile_id = '${A}'`)) === 0 && (await cnt(`ops.new_device_tokens where profile_id = '${A}'`)) === 0
  && (await cnt(`ops.account_sessions_seen where profile_id = '${A}'`)) === 0 && (await cnt(`ops.new_device_pending where profile_id = '${B}'`)) === 1);
check('[NS-08-R21 closed] the security_events kind list is closed: an unknown kind is refused (23514)',
  (await fail(() => sys(`insert into ops.security_events (kind) values ('new_device_pwned')`))) === '23514'
  && (await fail(() => sys(`insert into ops.security_events (kind) values ('new_device_signed_out')`))) === 'ok');
check('[NS-08-R21 closed] a second run of the migration is refused (55000)', (await fail(() => db.exec(readFileSync(process.argv.slice(2).find((f) => f.includes('new_device_sign_in')), 'utf8')))) === '55000');
done();
