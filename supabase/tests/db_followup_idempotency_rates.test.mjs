// Idempotency keys and server rate limits (20261005000000; ADR 0017 rules 3 and 4,
// brief decision 17, D-067; security review M3). The key arrives the way
// PostgREST passes request headers: the `request.headers` setting as JSON with
// lower-case names. Fictional family "Asha" only (CLAUDE.md).
import { createDb, users, uuid7 } from './harness.mjs';

const h = await createDb(process.argv.slice(2));
const { check, as, sys, one, codeOf, done, publishPolicies, consent, newChild } = h;
const { A, B, C, N, S } = users;
const D = 'dddddddd-dddd-dddd-dddd-dddddddddddd'; // asks for account deletion repeatedly
const E = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'; // records many policy acts

await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}'),('${N}'),('${S}'),('${D}'),('${E}')`);
await publishPolicies();
for (const u of [A, B, C, N, S, D, E]) await consent(u);
const CHILD = await newChild(A);

const setHeaders = (obj) => sys(`select set_config('request.headers', $1, false)`, [obj === null ? '' : typeof obj === 'string' ? obj : JSON.stringify(obj)]);
const withKey = async (key, fn) => { await setHeaders({ 'idempotency-key': key, 'x-request-id': '0123456789ab' }); try { return await fn(); } finally { await setHeaders(null); } };
const keyNow = async () => (await sys(`select public.request_idempotency_key()::text k`)).rows[0].k;
const invites = async (child) => Number((await sys(`select count(*) c from child_invites where child_id=$1`, [child])).rows[0].c);
const acts = async (uid) => Number((await sys(`select count(*) c from policy_acceptances where profile_id=$1`, [uid])).rows[0].c);

// ── Reading the header ──────────────────────────────────────────────────
const K0 = uuid7();
check('no request.headers: no key', (await keyNow()) === null);
await setHeaders({ 'x-request-id': '0123456789ab' }); const none = await keyNow();
await setHeaders({ 'idempotency-key': K0 }); const got = await keyNow();
await setHeaders({ 'idempotency-key': K0.toUpperCase() }); const upper = await keyNow();
await setHeaders('not json'); const notJson = await keyNow();
await setHeaders({ 'idempotency-key': 'nope' }); const bad = await codeOf(() => sys(`select public.request_idempotency_key()`));
await setHeaders(null);
check('the idempotency-key header is read as a UUID (any case); absent or non-JSON headers mean no key',
  none === null && got === K0 && upper === K0 && notJson === null);
check('a malformed key is refused (22023), like the Edge Functions do', bad === '22023');

// ── create_child_invite ─────────────────────────────────────────────────
const K1 = uuid7();
const t1 = await withKey(K1, async () => (await one(A, `select public.create_child_invite($1, 'contributor', 'Nani') t`, [CHILD])).t);
const n1 = await invites(CHILD);
const t2 = await withKey(K1, async () => (await one(A, `select public.create_child_invite($1, 'contributor', ' Nani ') t`, [CHILD])).t);
check('[ADR 0017] a repeat with the same key makes no second invite', (await invites(CHILD)) === n1 && n1 === 1);
check('the repeat returns a fresh token for the same invite (tokens are never stored)', /^[0-9a-f]{64}$/.test(t2) && t2 !== t1);
check('the token from the lost first response no longer works; the new one does',
  (await codeOf(() => as(N, `select public.accept_child_invite($1)`, [t1]))) === 'SCINV'
  && (await one(N, `select public.accept_child_invite($1) c`, [t2])).c === CHILD);
check('the stored result holds the invite id only, never a token',
  !/[0-9a-f]{64}/.test(JSON.stringify((await sys(`select result from idempotency_keys`)).rows))
  && (await sys(`select result from idempotency_keys where idem_key = $1`, [K1])).rows[0].result.invite !== undefined);
check('once the invite is used, a repeat of that request says so (SCINV)',
  (await codeOf(() => withKey(K1, () => as(A, `select public.create_child_invite($1, 'contributor', 'Nani')`, [CHILD])))) === 'SCINV');
check('the same key with other arguments is refused (22023)',
  (await codeOf(() => withKey(K1, () => as(A, `select public.create_child_invite($1, 'contributor', 'Dadi')`, [CHILD])))) === '22023');
const tOther = await withKey(K1, async () => (await one(S, `select public.create_child_invite($1, 'contributor') t`, [await newChild(S)])).t);
check('keys are per person: another person may use the same key', /^[0-9a-f]{64}$/.test(tOther));
const K2 = uuid7();
const t3 = await withKey(K2, async () => (await one(A, `select public.create_child_invite($1, 'contributor') t`, [CHILD])).t);
await sys(`update idempotency_keys set created_at = now() - interval '25 hours' where idem_key = $1`, [K2]);
const before = await invites(CHILD);
const t4 = await withKey(K2, async () => (await one(A, `select public.create_child_invite($1, 'contributor') t`, [CHILD])).t);
check('[ADR 0017] after 24 hours a key is new again (a second invite)', (await invites(CHILD)) === before + 1 && t4 !== t3);
// The daily invite limit counts invites, not repeats.
await sys(`insert into child_invites (child_id, invited_by, token_hash, role, created_at)
  select $1, $2, sha256(convert_to('fill-' || g, 'UTF8')), 'contributor', now() - interval '1 hour' from generate_series(1, $3::int) g`,
  [CHILD, A, 19 - Number((await sys(`select count(*) c from child_invites where invited_by=$1 and created_at > now() - interval '24 hours'`, [A])).rows[0].c)]);
const K3 = uuid7();
const t20 = await withKey(K3, async () => (await one(A, `select public.create_child_invite($1, 'contributor') t`, [CHILD])).t);
check('the 21st invite of the day is refused (SCRAT, unchanged)', (await codeOf(() => as(A, `select public.create_child_invite($1, 'contributor')`, [CHILD]))) === 'SCRAT');
check('but a repeat of the 20th still answers (a retry is not a new invite)',
  /^[0-9a-f]{64}$/.test(await withKey(K3, async () => (await one(A, `select public.create_child_invite($1, 'contributor') t`, [CHILD])).t)) && t20.length === 64);
const BK = await newChild(B);
await as(B, `select public.create_child_invite($1, 'contributor')`, [BK]);
await as(B, `select public.create_child_invite($1, 'contributor')`, [BK]);
check('without a header nothing changes: two calls, two invites', (await invites(BK)) === 2);

// ── record_policy_act ───────────────────────────────────────────────────
const act = (uid, recordedAt = null, action = 'acknowledge') => as(uid,
  `select public.record_policy_act('privacy', '1.0.0', $1, 'signin_sheet', 'auth.sheet', '1.0.0', 'ios', 'en', $2::timestamptz) id`, [action, recordedAt]);
const K4 = uuid7();
const c0 = await acts(C);
const id1 = await withKey(K4, async () => (await act(C, '2026-10-03T10:00:00Z')).rows[0].id);
const id2 = await withKey(K4, async () => (await act(C, '2026-10-03T10:00:09Z')).rows[0].id);
check('[ADR 0017] a repeated policy act returns the first id and records nothing new (the device time, which a retry restamps, is not compared)',
  id1 === id2 && (await acts(C)) === c0 + 1);
check('the same key for another act is refused (22023)', (await codeOf(() => withKey(K4, () => act(C, null, 'accept')))) === '22023');
const CB = await newChild(C);
check('the same key for another function is refused (22023), and nothing is made',
  (await codeOf(() => withKey(K4, () => as(C, `select public.create_child_invite($1, 'contributor')`, [CB])))) === '22023' && (await invites(CB)) === 0);
await act(C); await act(C);
check('without a header every call records (unchanged)', (await acts(C)) === c0 + 3);
check('rendered_sha256 must be 32 bytes (22023)',
  (await codeOf(() => as(C, `select public.record_policy_act('privacy', '1.0.0', 'acknowledge', 'signin_sheet', 'auth.sheet', '1', 'ios', 'en', null, decode($1, 'hex'))`, ['ab'.repeat(31)]))) === '22023'
  && (await codeOf(() => as(C, `select public.record_policy_act('privacy', '1.0.0', 'acknowledge', 'signin_sheet', 'auth.sheet', '1', 'ios', 'en', null, decode($1, 'hex'))`, ['ab'.repeat(32)]))) === 'ok');

// Rate: 60 an hour, 200 a day (acts are append-only for life plus 3 years).
// policy_acceptances is append-only (its guard trigger); test-only backdating runs with triggers off.
const backdate = (uid, ago) => h.db.exec(`set session_replication_role = replica;
  update policy_acceptances set accepted_at = now() - interval '${ago}' where profile_id = '${uid}';
  set session_replication_role = origin;`);
const fill = (uid, n, ago) => sys(`insert into policy_acceptances (profile_id, document, version, action, method, surface, app_version, platform, accepted_at)
  select $1, 'privacy', '1.0.0', 'acknowledge', 'signin_sheet', 'fill', '1', 'ios', now() - $3::interval from generate_series(1, $2::int)`, [uid, n, ago]);
await fill(E, 60 - (await acts(E)), '1 minute');
check('[M3] the 61st policy act in an hour is refused (SCRAT)', (await codeOf(() => act(E))) === 'SCRAT');
await backdate(E, '2 hours');
check('an hour later it records again', (await codeOf(() => act(E))) === 'ok');
await fill(E, 200 - (await acts(E)), '3 hours');
check('[M3] the 201st in a day is refused (SCRAT)', (await codeOf(() => act(E))) === 'SCRAT');
await backdate(E, '25 hours');
check('a day later it records again', (await codeOf(() => act(E))) === 'ok');

// ── Account deletion: 5 requests and 5 cancellations per rolling 24 h ───
const req = () => as(D, `select * from public.request_account_deletion('ios')`);
const cancel = async () => (await one(D, `select public.cancel_account_deletion() ok`)).ok;
let cycles = 0;
for (let i = 0; i < 5; i++) { await req(); if (await cancel()) cycles++; }
check('five request and cancel cycles in a day are fine', cycles === 5);
const dl = await (async () => { try { await req(); return 'ok'; } catch (e) { return e.code; } })();
check('[decision 17] the sixth request in 24 hours is refused (SCRAT) and schedules nothing', dl === 'SCRAT'
  && Number((await sys(`select count(*) c from deletion_requests where profile_id=$1 and status='scheduled'`, [D])).rows[0].c) === 0);
check('a cancel with nothing to cancel is never limited', (await cancel()) === false);
await sys(`update deletion_requests set requested_at = now() - interval '25 hours' where profile_id = $1`, [D]);
const open1 = (await req()).rows[0].request_id;
const open2 = (await req()).rows[0].request_id;
check('a repeat while a request is open returns it and is never limited', open1 === open2);
check('the sixth cancellation in 24 hours is refused (SCRAT); the request stays scheduled',
  (await codeOf(() => as(D, `select public.cancel_account_deletion()`))) === 'SCRAT'
  && (await sys(`select status from deletion_requests where id=$1`, [open1])).rows[0].status === 'scheduled');
await sys(`update deletion_requests set cancelled_at = now() - interval '25 hours' where profile_id = $1 and status = 'cancelled'`, [D]);
check('a day later the cancellation goes through (the 30-day grace makes the wait harmless)', (await cancel()) === true);

// ── policy_actions_needed: 60 an hour, volatile ─────────────────────────
check('policy_actions_needed is volatile now (it counts)', (await sys(`select provolatile v from pg_proc where proname='policy_actions_needed'`)).rows[0].v === 'v');
let pan = [];
for (let i = 0; i < 61; i++) pan.push(await codeOf(() => as(B, `select * from public.policy_actions_needed()`)));
check('[ADR 0017] policy_actions_needed: 60 an hour per person, then SCRAT (was client only)', pan.slice(0, 60).every((c) => c === 'ok') && pan[60] === 'SCRAT');

// ── Sync counters are server-owned (PoC F3) ─────────────────────────────
await sys(`delete from sync_rate_windows where profile_id = $1`, [N]);
for (let i = 0; i < 3; i++) await as(N, `select public.sync_pull('{}'::jsonb, 10)`);
check('[M3] a person cannot reset their sync counter (update and delete: 42501)',
  (await codeOf(() => as(N, `update sync_rate_windows set hits = 0 where profile_id = auth.uid()`))) === '42501'
  && (await codeOf(() => as(N, `delete from sync_rate_windows where profile_id = auth.uid()`))) === '42501'
  && (await codeOf(() => as(N, `insert into sync_rate_windows (profile_id, bucket, window_start, hits) values (auth.uid(), 'membership', now(), 0)`))) === '42501');
check('but still reads their own counter', Number((await one(N, `select hits from sync_rate_windows where bucket='pull'`)).hits) === 3);
await sys(`update sync_rate_windows set hits = 120 where profile_id = $1 and bucket = 'pull'`, [N]);
check('sync_pull is still 120 a minute (SCRAT), now through rate_hit()', (await codeOf(() => as(N, `select public.sync_pull('{}'::jsonb, 10)`))) === 'SCRAT');
await sys(`insert into sync_rate_windows (profile_id, bucket, window_start, hits) values ($1, 'push', now(), 60) on conflict (profile_id, bucket) do update set hits = 60, window_start = now()`, [N]);
check('sync_push is still 60 a minute (SCRAT)', (await codeOf(() => as(N, `select public.sync_push('[]'::jsonb)`))) === 'SCRAT');
await sys(`update sync_rate_windows set window_start = now() - interval '2 minutes' where profile_id = $1`, [N]);
check('a minute later both work again', (await codeOf(() => as(N, `select public.sync_pull('{}'::jsonb, 10)`))) === 'ok'
  && (await codeOf(() => as(N, `select public.sync_push('[]'::jsonb)`))) === 'ok');
check('rate_hit refuses an unknown bucket (22023)', (await codeOf(() => as(N, `select public.rate_hit('everything')`))) === '22023');

// ── Housekeeping trims keys after 24 hours ──────────────────────────────
await sys(`update idempotency_keys set created_at = now() - interval '25 hours' where idem_key = $1`, [K4]);
const hk = (await sys(`select public.sync_housekeeping() r`)).rows[0].r;
check('sync_housekeeping removes idempotency keys older than 24 hours', hk.idempotency_keys >= 1
  && (await sys(`select 1 from idempotency_keys where idem_key = $1`, [K4])).rows.length === 0
  && (await sys(`select 1 from idempotency_keys where idem_key = $1`, [K3])).rows.length === 1);
check('people cannot read idempotency keys', (await codeOf(() => as(A, `select * from idempotency_keys`))) === '42501');
check('keys go with the account (on delete cascade)', (await sys(`select confdeltype from pg_constraint where conname = 'idempotency_keys_profile_id_fkey'`)).rows[0].confdeltype === 'c');

done();
