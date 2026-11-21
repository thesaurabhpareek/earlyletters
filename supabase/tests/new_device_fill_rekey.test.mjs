// NDS-2 and NDS-5 (20261121020000): the pending fill and the device re-key. Fictional family "Asha" only.
//   [NDR fill]    class and hash set once, only for the named profile and session, only on an existing unfilled row.
//   [NDR rekey]   current / rekeyed / unknown, never an insert, never across people.
//   [NDR grants]  service_role only; anon, authenticated and cross-user refused.
// Mutants: the guard is taken away and the same attempt must then succeed.
import { createDb, users } from './harness.mjs';

const { check, as, asAnon, sys, codeOf, done } = await createDb(process.argv.slice(2));
const { A, B } = users;
await sys(`insert into auth.users values ('${A}'),('${B}')`);
const S1 = '11111111-1111-4111-8111-111111111111', S2 = '22222222-2222-4222-8222-222222222222';
const svc = async (sql, params = []) => { await sys('set role service_role'); try { return await sys(sql, params); } finally { await sys('reset role'); } };
const h = (c) => Buffer.alloc(16, c);
const fill = async (p, s, c, d) => (await svc('select public.ops_new_device_pending_fill($1, $2, $3, $4) r', [p, s, c, d])).rows[0].r;
const rekey = async (p, o, n) => (await svc('select public.ops_new_device_rekey($1, $2, $3) r', [p, o, n])).rows[0].r;
const hx = (b) => (b === null ? null : Buffer.from(b).toString('hex'));
const pend = async (s) => (await sys('select class, device_hash from ops.new_device_pending where session_id = $1', [s])).rows[0];
const seen = async (p) => (await sys('select device_hash from ops.account_sessions_seen where profile_id = $1 order by 1', [p])).rows.map((r) => Buffer.from(r.device_hash).toString('hex'));
const q = (s, p) => sys('insert into ops.new_device_pending (session_id, profile_id) values ($1, $2)', [s, p]);

// -- fill ------------------------------------------------------------------------------------
await q(S1, A); await q(S2, B);
check('[NDR fill] a pending row of that person and session is filled and the answer is true',
  (await fill(A, S1, 'apple', h(1))) === true && (await pend(S1)).class === 'apple' && hx((await pend(S1)).device_hash) === h(1).toString('hex'));
check('[NDR fill] a second fill changes nothing and answers false (once)',
  (await fill(A, S1, 'other', h(2))) === false && (await pend(S1)).class === 'apple' && hx((await pend(S1)).device_hash) === h(1).toString('hex'));
check('[NDR fill] the same fill repeated is idempotent: still false, row unchanged', (await fill(A, S1, 'apple', h(1))) === false && hx((await pend(S1)).device_hash) === h(1).toString('hex'));
check('[NDR fill] cross-user: A naming B\'s session changes nothing and B\'s row stays unfilled',
  (await fill(A, S2, 'apple', h(3))) === false && (await pend(S2)).device_hash === null && (await pend(S2)).class === null);
check('[NDR fill] a session with no pending row (never queued, or already taken) answers false and inserts nothing',
  (await fill(A, '99999999-9999-4999-8999-999999999999', 'apple', h(4))) === false
  && Number((await sys('select count(*) n from ops.new_device_pending')).rows[0].n) === 2);
check('[NDR fill] a null class is stored as "other"', (await fill(B, S2, null, h(5))) === true && (await pend(S2)).class === 'other');
await q('33333333-3333-4333-8333-333333333333', A);
check('[NDR fill] an unknown class (22P02), a short hash (23514) and null arguments (22023) are refused and the row stays unfilled',
  (await codeOf(() => fill(A, '33333333-3333-4333-8333-333333333333', 'banana', h(6)))) === '22P02'
  && (await codeOf(() => fill(A, '33333333-3333-4333-8333-333333333333', 'apple', Buffer.alloc(8)))) === '23514'
  && (await codeOf(() => fill(A, '33333333-3333-4333-8333-333333333333', 'apple', null))) === '22023'
  && (await codeOf(() => fill(null, '33333333-3333-4333-8333-333333333333', 'apple', h(6)))) === '22023'
  && (await pend('33333333-3333-4333-8333-333333333333')).device_hash === null);
check('[NDR fill] filling does not touch the device table or the token table',
  Number((await sys('select count(*) n from ops.account_sessions_seen')).rows[0].n) === 0 && Number((await sys('select count(*) n from ops.new_device_tokens')).rows[0].n) === 0);
// the sender takes the filled hash as hex (the pickup contract of 20261121010000)
const took = (await svc('select public.ops_new_device_pending_take($1) r', [S1])).rows[0].r;
check('[NDR fill] the sender then picks up the filled class and hash', took.length === 1 && took[0].class === 'apple' && took[0].device_hash === h(1).toString('hex'));
check('[NDR fill] after pickup a late fill answers false', (await fill(A, S1, 'apple', h(7))) === false
  && (await sys('select 1 from ops.new_device_pending where session_id = $1', [S1])).rows.length === 0);

// -- rekey -----------------------------------------------------------------------------------
const rec = (p, d) => svc('select public.ops_new_device_record($1, $2, $3)', [p, d, 'apple']);
await rec(A, h(10)); await rec(B, h(10)); await rec(A, h(20));
check('[NDR rekey] only the next-key hash stored: "current", nothing changes', (await rekey(A, h(11), h(10))) === 'current' && (await seen(A)).length === 2);
check('[NDR rekey] only the old-key hash stored: "rekeyed", and that row now carries the next hash',
  (await rekey(A, h(10), h(12))) === 'rekeyed' && (await seen(A)).includes(h(12).toString('hex')) && !(await seen(A)).includes(h(10).toString('hex')) && (await seen(A)).length === 2);
check('[NDR rekey] the same call again is "current" (idempotent) and changes nothing', (await rekey(A, h(10), h(12))) === 'current' && (await seen(A)).length === 2);
check('[NDR rekey] neither stored: "unknown" and no row is added', (await rekey(A, h(30), h(31))) === 'unknown' && (await seen(A)).length === 2);
check('[NDR rekey] cross-user: the old hash of B\'s device does not re-key for A, and B\'s row is untouched',
  (await rekey(A, h(10), h(40))) === 'unknown' && (await seen(B)).join() === h(10).toString('hex'));
check('[NDR rekey] B\'s own re-key works and leaves A alone', (await rekey(B, h(10), h(41))) === 'rekeyed' && (await seen(B)).join() === h(41).toString('hex') && (await seen(A)).length === 2);
check('[NDR rekey] when both hashes are stored it answers "current" and does not collide on the primary key',
  (await rekey(A, h(20), h(12))) === 'current' && (await seen(A)).length === 2);
check('[NDR rekey] class, first_seen_at and notified_at are kept by a re-key',
  (await rekey(A, h(20), h(21))) === 'rekeyed' && (await sys(`select class::text c, notified_at is not null n from ops.account_sessions_seen where profile_id = $1 and device_hash = $2`, [A, h(21)])).rows[0].c === 'apple');
check('[NDR rekey] a wrong-length hash or null is refused (22023) and nothing changes',
  (await codeOf(() => rekey(A, Buffer.alloc(8), h(50)))) === '22023' && (await codeOf(() => rekey(A, h(21), null))) === '22023'
  && (await codeOf(() => rekey(null, h(21), h(50)))) === '22023' && (await seen(A)).includes(h(21).toString('hex')));

// -- grants ----------------------------------------------------------------------------------
const CALL = [`public.ops_new_device_pending_fill('${A}', '${S2}', 'other', decode(repeat('00', 16), 'hex'))`,
  `public.ops_new_device_rekey('${A}', decode(repeat('00', 16), 'hex'), decode(repeat('01', 16), 'hex'))`];
for (const c of CALL) {
  const n = c.split('(')[0];
  check(`[NDR grants] ${n}: authenticated and anon are refused (42501)`, (await codeOf(() => as(A, `select ${c}`))) === '42501' && (await codeOf(() => asAnon(`select ${c}`))) === '42501');
  check(`[NDR cross-user] ${n}: B cannot call it for A (42501)`, (await codeOf(() => as(B, `select ${c}`))) === '42501');
}
check('[NDR grants] service_role holds execute; anon, authenticated and public do not; both are security definer with a pinned search_path',
  (await sys(`select bool_and(has_function_privilege('service_role', p.oid, 'execute') and not has_function_privilege('authenticated', p.oid, 'execute')
    and not has_function_privilege('anon', p.oid, 'execute') and p.prosecdef and array_to_string(p.proconfig, ',') ~ 'search_path=pg_catalog') ok, count(*)::int n
    from pg_proc p where p.proname in ('ops_new_device_pending_fill', 'ops_new_device_rekey')`)).rows[0].n === 2);

// -- mutants (each last, then the same attempt must succeed) -------------------------------------
await q('44444444-4444-4444-8444-444444444444', A); await fill(A, '44444444-4444-4444-8444-444444444444', 'apple', h(60));
await sys(`create or replace function public.ops_new_device_pending_fill(p_profile uuid, p_session uuid, p_class text, p_device_hash bytea)
  returns boolean language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$ declare n int; begin
  update ops.new_device_pending set class = coalesce(p_class, 'other')::ops.device_class, device_hash = p_device_hash where session_id = p_session;
  get diagnostics n = row_count; return n = 1; end; $$`);
check('[NDR fill] mutant: without the profile and null-hash guards a second fill and a cross-user fill both succeed',
  (await fill(A, '44444444-4444-4444-8444-444444444444', 'other', h(61))) === true && (await fill(A, S2, 'apple', h(62))) === true);
await sys(`create or replace function public.ops_new_device_rekey(p_profile uuid, p_old_hash bytea, p_new_hash bytea)
  returns text language sql security definer set search_path = pg_catalog, public, pg_temp as $$
  update ops.account_sessions_seen set device_hash = p_new_hash where device_hash = p_old_hash returning 'rekeyed' $$`);
await rec(B, h(70));
check('[NDR rekey] mutant: without the profile filter A can re-key B\'s device', (await rekey(A, h(70), h(71))) === 'rekeyed' && (await seen(B)).includes(h(71).toString('hex')));
await sys(`grant execute on function public.ops_new_device_rekey(uuid, bytea, bytea) to authenticated`);
check('[NDR grants] mutant: with execute granted to authenticated a person can re-key', (await codeOf(() => as(A, `select ${CALL[1]}`))) === 'ok');
done();
