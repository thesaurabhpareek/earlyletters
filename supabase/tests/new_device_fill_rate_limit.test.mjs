// BL-2192 (SEC-R13, as the Edge Function read for release PR #1979 named it), 20261124132000: the per-person call limit on
// ops_new_device_pending_fill. Fictional family "Asha" only.
//   [SEC-R13 fill limit]  10 calls per person per hour; past it the answer is the same false as "nothing to fill" and no row
//                         changes, neither the pending row nor the counter. Per person, per window, swept like every bucket.
// Mutants: the guard is taken away (the counter row deleted, the window moved back) and the same attempt must then succeed.
import { createDb, users } from './harness.mjs';

const { check, as, sys, codeOf, done } = await createDb(process.argv.slice(2));
const { A, B } = users;   // A is Asha's parent, B the co-parent
await sys(`insert into auth.users values ('${A}'),('${B}')`);
const LIMIT = 10;
const svc = async (sql, params = []) => { await sys('set role service_role'); try { return await sys(sql, params); } finally { await sys('reset role'); } };
const h = (c) => Buffer.alloc(16, c);
const sess = (i) => `aaaaaaaa-0000-4000-8000-${String(i).padStart(12, '0')}`;
const fill = async (p, s, c, d) => (await svc('select public.ops_new_device_pending_fill($1, $2, $3, $4) r', [p, s, c, d])).rows[0].r;
const queue = (s, p) => sys('insert into ops.new_device_pending (session_id, profile_id) values ($1, $2)', [s, p]);
const pend = async (s) => (await sys('select class::text, device_hash from ops.new_device_pending where session_id = $1', [s])).rows[0];
const hits = async (p) => (await sys(`select hits from sync_rate_windows where profile_id = $1 and bucket = 'new_device_fill'`, [p])).rows[0]?.hits ?? null;
const snapshot = async () => JSON.stringify((await sys(`select session_id, profile_id, class::text, encode(device_hash, 'hex') h from ops.new_device_pending order by session_id`)).rows)
  + JSON.stringify((await sys(`select profile_id, bucket, window_start, hits from sync_rate_windows order by profile_id, bucket`)).rows);

// -- up to the limit: every call is served -----------------------------------------------------
for (let i = 1; i <= LIMIT + 3; i++) await queue(sess(i), A);
const served = [];
for (let i = 1; i <= LIMIT; i++) served.push(await fill(A, sess(i), 'apple', h(i)));
check(`[SEC-R13 fill limit] the first ${LIMIT} calls of one person in an hour are served (each fills its own pending row)`,
  served.every((r) => r === true) && (await hits(A)) === LIMIT && (await pend(sess(LIMIT))).class === 'apple');

// -- past the limit: the uniform false, and no row changes -------------------------------------
const before = await snapshot();
const past = [await fill(A, sess(LIMIT + 1), 'apple', h(50)), await fill(A, sess(LIMIT + 2), 'other', h(51))];
check(`[SEC-R13 fill limit] call ${LIMIT + 1} and after answer false, the same answer as an unfilled call`, past.every((r) => r === false));
check('[SEC-R13 fill limit] past the limit no row changes: the pending rows and the counter are exactly as before',
  (await snapshot()) === before && (await pend(sess(LIMIT + 1))).device_hash === null && (await pend(sess(LIMIT + 1))).class === null && (await hits(A)) === LIMIT);
check('[SEC-R13 fill limit] past the limit a call for a session with no pending row also answers false and inserts nothing',
  (await fill(A, sess(999), 'apple', h(52))) === false && (await snapshot()) === before);

// -- per person ---------------------------------------------------------------------------------
await queue(sess(100), B);
check('[SEC-R13 fill limit] the limit is per person: B is served while A is limited, and A\'s counter does not move',
  (await fill(B, sess(100), 'other', h(60))) === true && (await hits(B)) === 1 && (await hits(A)) === LIMIT);

// -- mutants: take the guard away and the same attempt succeeds ----------------------------------
await sys(`update sync_rate_windows set window_start = now() - interval '61 minutes' where profile_id = $1 and bucket = 'new_device_fill'`, [A]);
check('[SEC-R13 fill limit] after the window (61 minutes) the same refused fill is served and the count starts again at 1',
  (await fill(A, sess(LIMIT + 1), 'apple', h(50))) === true && (await hits(A)) === 1 && (await pend(sess(LIMIT + 1))).class === 'apple');
await sys(`update sync_rate_windows set hits = ${LIMIT} where profile_id = $1 and bucket = 'new_device_fill'`, [A]);
check('[SEC-R13 fill limit] a full window inside the hour refuses again', (await fill(A, sess(LIMIT + 2), 'apple', h(51))) === false && (await pend(sess(LIMIT + 2))).device_hash === null);
await sys(`delete from sync_rate_windows where profile_id = $1 and bucket = 'new_device_fill'`, [A]);
check('[SEC-R13 fill limit] mutant: with the counter row gone the same attempt is served (the counter is what refused it)',
  (await fill(A, sess(LIMIT + 2), 'apple', h(51))) === true && (await hits(A)) === 1);

// -- what does and does not count ---------------------------------------------------------------
await queue(sess(200), A);
const n0 = await hits(A);
check('[SEC-R13 fill limit] a call refused for its input (22P02 class, 23514 hash) rolls its count back; a null argument (22023) never counts',
  (await codeOf(() => fill(A, sess(200), 'banana', h(70)))) === '22P02' && (await codeOf(() => fill(A, sess(200), 'apple', Buffer.alloc(8)))) === '23514'
  && (await codeOf(() => fill(A, sess(200), 'apple', null))) === '22023' && (await hits(A)) === n0 && (await pend(sess(200))).device_hash === null);
const GHOST = '77777777-7777-4777-8777-777777777777';
check('[SEC-R13 fill limit] an id with no profile answers false and writes no counter (no 23503)',
  (await fill(GHOST, sess(200), 'apple', h(71))) === false && (await hits(GHOST)) === null);

// -- the counter is the same kind of row as every other bucket -----------------------------------
check('[SEC-R13 fill limit] the bucket check still refuses an unknown bucket (23514)',
  (await codeOf(() => sys(`insert into sync_rate_windows (profile_id, bucket, window_start, hits) values ($1, 'bogus', now(), 1)`, [B]))) === '23514');
await sys(`update sync_rate_windows set window_start = now() - interval '2 days' where profile_id = $1 and bucket = 'new_device_fill'`, [B]);
await sys('select public.sync_housekeeping()');
check('[SEC-R13 fill limit] sync_housekeeping sweeps a new_device_fill window older than a day', (await hits(B)) === null && (await hits(A)) !== null);
check('[SEC-R13 fill limit] no API role can read or reset the counter (42501)',
  (await codeOf(() => as(A, `select hits from sync_rate_windows where bucket = 'new_device_fill'`))) === '42501'
  && (await codeOf(() => as(A, `delete from sync_rate_windows where profile_id = auth.uid()`))) === '42501');
check('[SEC-R13 fill limit] the fill stays service_role only, security definer, search_path pinned',
  (await sys(`select has_function_privilege('service_role', p.oid, 'execute') s, has_function_privilege('authenticated', p.oid, 'execute') a,
    has_function_privilege('anon', p.oid, 'execute') n, p.prosecdef d, array_to_string(p.proconfig, ',') ~ 'search_path=pg_catalog' sp
    from pg_proc p where p.oid = 'public.ops_new_device_pending_fill(uuid,uuid,text,bytea)'::regprocedure`)).rows
    .every((r) => r.s && !r.a && !r.n && r.d && r.sp));

await done();
