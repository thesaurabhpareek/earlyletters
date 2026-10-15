// The recovery key's database side (20261015230000_backup_server.sql; PRD V2 F08 6.5 C and G,
// WP-F08-B4): the escrow_svc role, restore requests and holds, approvals that prove the enrolled
// device holds its key, the stop link, limits, the release invariant, the append-only access log
// and key rotation. The function itself: supabase/functions/escrow (npm run test:functions).
// Fictional family "Asha" only (CLAUDE.md).
import { createHash } from 'node:crypto';
import { createDb, users, uuid7 } from './harness.mjs';

const { db, check, as, sys, one, codeOf, done, publishPolicies, consent, newChild, join } = await createDb(process.argv.slice(2));
const { A, B, C, S } = users;
const hex = (byte, n) => Buffer.from(byte.repeat(n), 'hex');
const wrapOf = (b) => Buffer.concat([hex('01', 1), hex(b, 80)]);   // what boxOf(b) is stored as
const boxOf = (b) => JSON.stringify({ suite: 'hpke-x25519-sha256-aes256gcm', enc: Buffer.from(b.repeat(32), 'hex').toString('base64'),
  ct: Buffer.from(b.repeat(48), 'hex').toString('base64') });   // stored as 0x01 || enc || ct (81 bytes)

const sha = (buf) => createHash('sha256').update(buf).digest();
const PEPPER = 'pepper-for-tests-only-0123456789abcdef';

// Supabase's auth.users has email and auth.sessions exists; the harness stubs neither.
await sys(`alter table auth.users add column email text`);
await sys(`create table if not exists auth.sessions (id uuid primary key, user_id uuid not null, not_after timestamptz)`);
await sys(`insert into auth.users (id, email) values ('${A}', 'asha@example.com'),('${B}', 'papa@example.com'),('${C}', null),('${S}', 'nani@example.com')`);
await publishPolicies();
await sys(`insert into policy_versions (document, version, change_class, requires_reconsent, published_at, new_users_from, effective_at,
             content_sha256, url, summary)
           values ('backup', '1.0.0', 'initial', false, now() - interval '2 days', now() - interval '2 days', now() - interval '2 days',
             sha256('backup'::bytea), 'https://example.invalid/backup/1.0.0', 'First version')`);
for (const u of [A, B, C, S]) {
  await consent(u);
  await as(u, `select public.record_policy_act('backup', '1.0.0', 'accept', 'consent_sheet', 'backup.sheet', '1.0.0', 'ios')`);
}
await sys(`set app.backup_enabled = 'on'`);
const CHILD = await newChild(A);
const CHILD2 = await newChild(A, 'Asha', '2026-01-02');
await join(B, 'parent', CHILD, A);
const SOLO = await newChild(S, 'Asha', '2025-06-01');

const reg = (uid, dev, key) => as(uid, `select public.backup_register_device($1, $2::bytea)`, [dev, key]);
const OLD = uuid7(); const NEW = uuid7(); const S_NEW = uuid7(); const B_DEV = uuid7();
await reg(A, OLD, hex('a1', 32));
await reg(A, NEW, hex('a2', 32));
await reg(S, S_NEW, hex('b1', 32));
await reg(B, B_DEV, hex('c1', 32));
await as(A, `select public.backup_store_key($1, 1, 1, $2::jsonb)`, [CHILD, boxOf('aa')]);
await as(A, `select public.backup_store_key($1, 1, 1, $2::jsonb)`, [CHILD2, boxOf('ab')]);
await as(S, `select public.backup_store_key($1, 1, 1, $2::jsonb)`, [SOLO, boxOf('ba')]);
// These phones have been enrolled for a month: old enough to approve (7 days).
await sys(`update backup_devices set enrolled_at = now() - interval '30 days'`);
const SESS = Object.fromEntries([A, B, C, S].map((u) => [u, uuid7()]));
for (const u of [A, B, C, S]) await sys(`insert into auth.sessions (id, user_id) values ($1, $2)`, [SESS[u], u]);

const asRole = async (role, sql, params = []) => {
  await db.exec(`set role ${role}`);
  try { return await db.query(sql, params); } finally { await db.exec('reset role'); }
};
const esc = async (sql, params = []) => (await asRole('escrow_svc', sql, params)).rows[0]?.r;
const errOf = async (fn) => { try { await fn(); return 'ok'; } catch (e) { return [e.code, e.detail].filter(Boolean).join(' '); } };
let reqSeq = 0;
const rid = () => (++reqSeq).toString(16).padStart(12, '0');
const approvalFor = (device, code) => ({ device_id: device, code_hash_hex: sha(code).toString('hex'), sealed_code_hex: '01' + 'e1'.repeat(32) + 'c7'.repeat(48) });
const open = (profile, device, approvals, token = hex(rid().slice(-2), 32), session = SESS[profile]) =>
  esc(`select public.escrow_open_request($1, $2, $3, $4, $5::bytea, $6::jsonb) r`, [profile, device, session, rid(), token, JSON.stringify(approvals)]);
const load = (profile, device, request) => esc(`select public.escrow_load_wraps($1, $2, $3) r`, [profile, device, request]);
const record = (profile, device, request, rows) => esc(`select public.escrow_record_unwraps($1, $2, $3, $4::jsonb, $5) r`, [profile, device, request, JSON.stringify(rows), rid()]);
const setState = (profile, request, ev) => esc(`select public.escrow_set_request_state($1, $2, $3) r`, [profile, request, ev]);

// ── The escrow role reaches the escrow_* functions and nothing else (F08-REQ-034) ──
const ESCROW_FNS = ['escrow_load_wraps', 'escrow_open_request', 'escrow_record_unwraps', 'escrow_request_context',
  'escrow_rewrap_key', 'escrow_rotation_batch', 'escrow_rotation_failed', 'escrow_rotation_notified', 'escrow_rotation_pending',
  'escrow_set_request_state'];
const callable = (await sys(`select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and has_function_privilege('escrow_svc', p.oid, 'execute') order by 1`)).rows.map((r) => r.proname);
check('[F08-REQ-034] escrow_svc can execute exactly the ten escrow_* functions in public', JSON.stringify(callable) === JSON.stringify(ESCROW_FNS)
  || console.log(`      ${callable}`));
const tablesReachable = (await sys(`select n.nspname || '.' || c.relname t from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where c.relkind in ('r', 'v', 'm', 'p', 'f') and n.nspname in ('public', 'ops', 'insights', 'storage', 'auth')
    and (has_table_privilege('escrow_svc', c.oid, 'select') or has_table_privilege('escrow_svc', c.oid, 'insert')
      or has_table_privilege('escrow_svc', c.oid, 'update') or has_table_privilege('escrow_svc', c.oid, 'delete'))`)).rows;
check('[F08-REQ-034] escrow_svc can read or write no table or view', tablesReachable.length === 0 || console.log(`      ${tablesReachable.map((r) => r.t)}`));
check('[F08-REQ-034] escrow_svc cannot even look into ops, storage or auth', (await sys(`select has_schema_privilege('escrow_svc', 'ops', 'usage') o,
  has_schema_privilege('escrow_svc', 'storage', 'usage') s, has_schema_privilege('escrow_svc', 'auth', 'usage') a`)).rows.every((r) => !r.o && !r.s && !r.a));
const role = (await sys(`select rolsuper, rolbypassrls, rolcreaterole, rolinherit, rolcanlogin, rolconnlimit from pg_roles where rolname = 'escrow_svc'`)).rows[0];
check('escrow_svc is not a superuser, does not bypass RLS, makes no roles, inherits nothing, and is created without login',
  role.rolsuper === false && role.rolbypassrls === false && role.rolcreaterole === false && role.rolinherit === false && role.rolcanlogin === false && role.rolconnlimit === 5);
check('escrow_svc belongs to no role', (await sys(`select count(*)::int n from pg_auth_members where member = 'escrow_svc'::regrole`)).rows[0].n === 0);
check('no API role can execute an escrow_* function', (await sys(`select count(*)::int n from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname like 'escrow\\_%' and (has_function_privilege('authenticated', p.oid, 'execute')
    or has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('service_role', p.oid, 'execute'))`)).rows[0].n === 0);
check('as escrow_svc, a direct read of the wraps is refused', await codeOf(() => asRole('escrow_svc', `select escrow_wrap from child_keys`)) === '42501');
check('as escrow_svc, the log cannot be read or written directly', await codeOf(() => asRole('escrow_svc', `delete from escrow_unwraps`)) === '42501');

// ── Off switch ────────────────────────────────────────────────────────────
check('[F08-REQ-041] with app.escrow_enabled unset, every escrow call is SCBKO', await errOf(() => open(A, NEW, [])) === 'SCBKO escrow'
  && await errOf(() => esc(`select public.escrow_rotation_batch(1, 10) r`)) === 'SCBKO escrow');
await sys(`set app.escrow_enabled = 'on'`);

// ── Opening a request: hold, approvals, one per device ────────────────────
const ctx = await esc(`select public.escrow_request_context($1, $2) r`, [A, NEW]);
check('context: the requesting device\'s key, and the other enrolled device to seal a code to',
  ctx.device_public_key_hex === 'a2'.repeat(32) && ctx.enrolled.length === 1 && ctx.enrolled[0].device_id === OLD && ctx.has_keys === true && ctx.open_request === null);
check('context: a device of another account is not found', await errOf(() => esc(`select public.escrow_request_context($1, $2) r`, [B, NEW])) === 'P0002 device_unknown');
check('a session that has ended (Stop signs out everywhere) cannot open a request', await errOf(() => open(A, NEW, [], undefined, uuid7())) === 'SCSES session_ended'
  && await errOf(() => open(A, NEW, [], undefined, SESS[B])) === 'SCSES session_ended');
await sys(`update auth.sessions set not_after = now() - interval '1 minute' where id = $1`, [SESS[A]]);
check('an expired session cannot open a request', await errOf(() => open(A, NEW, [])) === 'SCSES session_ended');
await sys(`update auth.sessions set not_after = null where id = $1`, [SESS[A]]);
check('a request must carry one approval code per enrolled device', await errOf(() => open(A, NEW, [])) === '22023 approvals'
  && await errOf(() => open(A, NEW, [approvalFor(B_DEV, hex('11', 32))])) === '22023 approvals');
check('nobody restores an account with nothing backed up', await errOf(() => open(C, uuid7(), [])) === 'P0002 device_unknown');
const CODE = hex('77', 32);
const r1 = await open(A, NEW, [approvalFor(OLD, CODE)]);
const hold1 = (await sys(`select extract(epoch from hold_until - requested_at) / 3600 h from restore_requests where id = $1`, [r1.request_id])).rows[0].h;
check('[F08-REQ-029] with another enrolled device, the hold is 72 hours', r1.created === true && r1.state === 'requested' && Math.round(Number(hold1)) === 72);
const again = await open(A, NEW, [approvalFor(OLD, CODE)], hex('3c', 32));
check('asking again from the same device returns the same request', again.request_id === r1.request_id && again.created === false);
check('a request whose email never went out takes the new stop token, so a retry can send the email', again.token_replaced === true
  && (await sys(`select stop_token_hash = $2 v from restore_requests where id = $1`, [r1.request_id, hex('3c', 32)])).rows[0].v === true);
check('the owner sees the request (without its stop token hash)', (await as(A, `select id, state from restore_requests`)).rows.some((r) => r.id === r1.request_id));
check('nobody else sees it', (await as(B, `select id from restore_requests`)).rows.length === 0);

// Waiting: no keys before the hold or an approval.
const w1 = await load(A, NEW, r1.request_id);
check('[F08-REQ-029] during the hold, no wraps are returned', w1.state === 'requested' && !('keys' in w1));
check('a request is loaded only by its own device and account', await errOf(() => load(A, OLD, r1.request_id)) === 'P0002'
  && await errOf(() => load(B, NEW, r1.request_id)) === 'P0002');

// The enrolled device: pending list with its sealed code, then approval by returning the code.
const pend = (await one(A, `select public.backup_pending_requests($1) r`, [OLD])).r;
check('the enrolled device sees the request and the code sealed to it', pend.length === 1 && pend[0].request_id === r1.request_id
  && pend[0].is_this_device === false && pend[0].approval?.suite === 'hpke-x25519-sha256-aes256gcm'
  && pend[0].approval.enc === Buffer.from('e1'.repeat(32), 'hex').toString('base64') && pend[0].approval.ct === Buffer.from('c7'.repeat(48), 'hex').toString('base64'));
check('the requesting phone sees its own request, with no code to open', (await one(A, `select public.backup_pending_requests($1) r`, [NEW])).r[0].is_this_device === true
  && (await one(A, `select public.backup_pending_requests($1) r`, [NEW])).r[0].approval === null);
const approve = (uid, dev, code) => as(uid, `select public.backup_approve_request($1, $2, $3::bytea)`, [r1.request_id, dev, code]);
check('the requesting device cannot approve itself', await errOf(() => approve(A, NEW, CODE)) === 'P0002 device_unknown');
check('a stolen session cannot approve with the old phone\'s id and a guessed code', await errOf(() => approve(A, OLD, hex('78', 32))) === '22023 code');
check('another account cannot approve', await errOf(() => approve(B, B_DEV, CODE)) === 'P0002');
check('[F08-REQ-029] the enrolled device approves by returning the code sealed to it', await errOf(() => approve(A, OLD, CODE)) === 'ok'
  && (await sys(`select state, approved_by_device d from restore_requests where id = $1`, [r1.request_id])).rows[0].d === OLD);

// Release: the request email first, then the log rows, then the state.
const n1 = await load(A, NEW, r1.request_id);
check('approved, but the request email has not gone out: still no wraps', n1.notified === false && !('keys' in n1));
check('rows cannot be recorded before the request email went out', await errOf(() => record(A, NEW, r1.request_id, [{ child_id: CHILD, key_version: 1, escrow_key_version: 1, outcome: 'opened' }])) === 'SCIMM');
await setState(A, r1.request_id, 'notified');
const ready = await load(A, NEW, r1.request_id);
check('[F08-REQ-029] approved and notified: every wrap of the account, and the requesting device\'s key to seal them to',
  ready.state === 'ready' && ready.keys.length === 2 && ready.device_public_key_hex === 'a2'.repeat(32)
  && ready.keys.some((k) => k.child_id === CHILD && k.escrow_wrap_hex === wrapOf('aa').toString('hex')));
check('[F08-REQ-042] release without a logged opening is refused (the release invariant)', await errOf(() => setState(A, r1.request_id, 'released')) === 'SCIMM');
check('a log row must name one of the account\'s keys', await errOf(() => record(A, NEW, r1.request_id, [{ child_id: SOLO, key_version: 1, escrow_key_version: 1, outcome: 'opened' }])) === '22023');
const rows = ready.keys.map((k) => ({ child_id: k.child_id, key_version: k.key_version, escrow_key_version: k.escrow_key_version, outcome: 'opened' }));
check('[F08-REQ-042] one log row per key opened', await record(A, NEW, r1.request_id, rows) === 2);
const rel = await setState(A, r1.request_id, 'released');
check('[F08-REQ-029] then the request is released', rel.state === 'released' && rel.created === true);
check('releasing again changes nothing', (await setState(A, r1.request_id, 'released')).created === false);
check('within a day, the same device may load again (an app killed after release)', (await load(A, NEW, r1.request_id)).state === 'ready');
await sys(`update restore_requests set released_at = now() - interval '25 hours' where id = $1`, [r1.request_id]);
check('after a day, a released request is closed', (await load(A, NEW, r1.request_id)).state === 'released' && !('keys' in (await load(A, NEW, r1.request_id))));
const mine = (await as(A, `select reason, outcome, device_id, restore_request_id from escrow_unwraps`)).rows;
check('[F08-REQ-042] the owner reads their own log rows', mine.length === 2 && mine.every((r) => r.reason === 'restore' && r.device_id === NEW && r.restore_request_id === r1.request_id));
check('nobody else reads them', (await as(B, `select 1 from escrow_unwraps`)).rows.length === 0);
check('the log holds ids and enums only, no key bytes', (await sys(`select count(*)::int n from information_schema.columns
  where table_name = 'escrow_unwraps' and data_type = 'bytea' and column_name <> 'subject_hash'`)).rows[0].n === 0);

// ── No enrolled device: 24 hours; the 90-day rule; the hold passing ───────
const s1 = await open(S, S_NEW, []);
const hold2 = (await sys(`select extract(epoch from hold_until - requested_at) / 3600 h from restore_requests where id = $1`, [s1.request_id])).rows[0].h;
check('[F08-REQ-029] with no other enrolled device (the only phone was lost), the hold is 24 hours', Math.round(Number(hold2)) === 24);
await setState(S, s1.request_id, 'notified');
check('before the 24 hours pass, no wraps', !('keys' in await load(S, S_NEW, s1.request_id)));
await sys(`update restore_requests set hold_until = now() - interval '1 minute' where id = $1`, [s1.request_id]);
check('[F08-REQ-029] after the hold, the key is released without any approval', (await load(S, S_NEW, s1.request_id)).state === 'ready');
await sys(`update restore_requests set hold_until = now() - interval '8 days' where id = $1`, [s1.request_id]);
check('a request not released within 7 days of its hold expires', (await load(S, S_NEW, s1.request_id)).state === 'expired');
const S_OLD = uuid7();
await reg(S, S_OLD, hex('b2', 32));
await sys(`update backup_devices set last_seen_at = now() - interval '91 days' where device_id = $1`, [S_OLD]);
const s2 = await open(S, S_NEW, []);
check('a device not seen for 90 days does not count as enrolled (24-hour hold, no code for it)', s2.created === true && s2.enrolled_devices === 0);

// ── Limits ────────────────────────────────────────────────────────────────
await as(S, `select public.backup_cancel_request($1)`, [s2.request_id]);
const s3 = await open(S, S_NEW, []);
await as(S, `select public.backup_cancel_request($1)`, [s3.request_id]);
check('[F08-REQ-029] a fourth new-device restore in 30 days is SCRAT', await errOf(() => open(S, S_NEW, [])) === 'SCRAT limit_restores');
await sys(`update restore_requests set requested_at = now() - interval '31 days' where profile_id = $1`, [S]);
const s4 = await open(S, S_NEW, []);
check('the 30 days roll', s4.created === true);
await setState(S, s4.request_id, 'notified');
await sys(`update restore_requests set hold_until = now() - interval '1 minute' where id = $1`, [s4.request_id]);
await sys(`insert into escrow_unwraps (profile_id, child_id, key_version, escrow_key_version, reason, outcome)
  select $1, $2, 1, 1, 'rotation', 'opened' from generate_series(1, 25)`, [S, SOLO]);
check('a key rotation does not use up the 20 keys a day a restore may open', (await load(S, S_NEW, s4.request_id)).state === 'ready');
await sys(`insert into escrow_unwraps (profile_id, device_id, child_id, key_version, escrow_key_version, reason, outcome, restore_request_id)
  select $1, $2, $3, 1, 1, 'restore', 'opened', $4 from generate_series(1, 20)`, [S, S_NEW, SOLO, s4.request_id]);
check('[F08-REQ-029] more than 20 opened keys a day for one account is SCRAT', await errOf(() => load(S, S_NEW, s4.request_id)) === 'SCRAT limit_keys');

// ── Cancelling: owner, "Not me", stop link, revocation, deletion ──────────
await sys(`update restore_requests set state = 'cancelled', cancelled_at = now(), cancel_source = 'owner' where profile_id = $1 and state in ('requested', 'approved')`, [S]);
await sys(`update restore_requests set requested_at = now() - interval '31 days' where profile_id = $1`, [S]);
const S_FRESH = uuid7();
await reg(S, S_FRESH, hex('b3', 32));
const sCtx = await esc(`select public.escrow_request_context($1, $2) r`, [S, S_NEW]);
check('a device enrolled today gets no approval code', sCtx.enrolled.length === 0);
check('a device enrolled today cannot be handed a code either', await errOf(() => open(S, S_NEW, [approvalFor(S_FRESH, hex('41', 32))])) === '22023 approvals');
const s5 = await open(S, S_NEW, []);
const hold5 = (await sys(`select extract(epoch from hold_until - requested_at) / 3600 h from restore_requests where id = $1`, [s5.request_id])).rows[0].h;
check('[F08-REQ-029] registering a second device never shortens the hold: still 72 hours, with no approver', Math.round(Number(hold5)) === 72 && s5.enrolled_devices === 0);
check('[F08-REQ-029] a device enrolled after the request was not yet 7 days old cannot approve, whatever code it sends',
  await errOf(() => as(S, `select public.backup_approve_request($1, $2, $3::bytea)`, [s5.request_id, S_FRESH, hex('41', 32)])) === 'P0002 device_unknown');
await as(S, `select public.backup_cancel_request($1)`, [s5.request_id]);
await sys(`update restore_requests set requested_at = now() - interval '31 days' where profile_id = $1`, [S]);
const A_NEW2 = uuid7();
await reg(A, A_NEW2, hex('a3', 32));
const r2 = await open(A, A_NEW2, [approvalFor(NEW, hex('21', 32)), approvalFor(OLD, hex('22', 32))]);
check('"Not me" on an enrolled device cancels with cancel_source enrolled_device', await errOf(() => as(A, `select public.backup_cancel_request($1, $2)`, [r2.request_id, OLD])) === 'ok'
  && (await sys(`select cancel_source s from restore_requests where id = $1`, [r2.request_id])).rows[0].s === 'enrolled_device');
check('a cancelled request never releases', (await load(A, A_NEW2, r2.request_id)).state === 'cancelled');

const TOKEN = hex('99', 32);
const r3 = await open(A, A_NEW2, [approvalFor(NEW, hex('23', 32)), approvalFor(OLD, hex('24', 32))], sha(TOKEN));
const stop = (h) => asRole('service_role', `select public.backup_svc_stop($1::bytea) r`, [h]).then((x) => x.rows[0].r);
check('a wrong stop token changes nothing and names no account', JSON.stringify(await stop(sha(hex('98', 32)))) === '{"stopped":false}');
const st = await stop(sha(TOKEN));
check('[F08-REQ-042] the stop link cancels every open request of its account (cancel_source stop_link)', st.stopped === true && st.profile_id === A && st.cancelled === 1
  && (await sys(`select cancel_source s from restore_requests where id = $1`, [r3.request_id])).rows[0].s === 'stop_link');
check('[F08-REQ-042] the stop link works once', (await stop(sha(TOKEN))).stopped === false);
check('users cannot call the stop function', await codeOf(() => as(A, `select public.backup_svc_stop($1::bytea)`, [sha(TOKEN)])) === '42501');
const T2 = hex('97', 32);
await sys(`update restore_requests set requested_at = now() - interval '31 days' where profile_id = $1`, [A]);
const r4 = await open(A, A_NEW2, [approvalFor(NEW, hex('25', 32)), approvalFor(OLD, hex('26', 32))], sha(T2));
await sys(`update restore_requests set stop_token_expires_at = now() - interval '1 minute' where id = $1`, [r4.request_id]);
check('an expired stop link changes nothing', (await stop(sha(T2))).stopped === false);
await as(A, `select public.backup_revoke_device($1)`, [A_NEW2]);
check('revoking the requesting device cancels its request', (await sys(`select state, cancel_source s from restore_requests where id = $1`, [r4.request_id])).rows[0].s === 'owner'
  && (await load(A, A_NEW2, r4.request_id)).state === 'cancelled');

const B_NEW = uuid7();
await reg(B, B_NEW, hex('c2', 32));
await as(B, `select public.backup_store_key($1, 1, 1, $2::jsonb)`, [CHILD, boxOf('ca')]);
const b1 = await open(B, B_NEW, [approvalFor(B_DEV, hex('31', 32))]);
await as(B, `select * from public.request_account_deletion('ios')`);
check('[F17 8.4] an account deletion request cancels every open restore request at once (cancel_source deletion)',
  (await sys(`select state, cancel_source s from restore_requests where id = $1`, [b1.request_id])).rows[0].s === 'deletion');
check('while the deletion is pending, no restore can open', await errOf(() => open(B, B_NEW, [approvalFor(B_DEV, hex('32', 32))])) === 'SCDEL deletion_pending');
await as(B, `select public.cancel_account_deletion()`);

// ── The log is append-only for every role (F08-REQ-042) ───────────────────
const anyRow = (await sys(`select id from escrow_unwraps where profile_id = $1 order by id limit 1`, [A])).rows[0].id;
check('[F08-REQ-042] even the owner of the table cannot change a row', await codeOf(() => sys(`update escrow_unwraps set outcome = 'failed' where id = $1`, [anyRow])) === 'SCIMM');
check('[F08-REQ-042] even the owner of the table cannot delete a recent row', await codeOf(() => sys(`delete from escrow_unwraps where id = $1`, [anyRow])) === 'SCIMM');
check('[F08-REQ-042] truncate is refused', await codeOf(() => sys(`truncate escrow_unwraps`)) === 'SCIMM');
await sys(`set app.consent_pepper = '${PEPPER}'`);
const fakeHash = sha(Buffer.from('not the pseudonym'));
check('[F08-REQ-042] a pseudonym that is not sha256(id || pepper) is refused', await codeOf(() => sys(`update escrow_unwraps set profile_id = null, subject_hash = $2 where id = $1`, [anyRow, fakeHash])) === 'SCIMM');
check('[F08-REQ-042] pseudonymising may not change anything else', await codeOf(() => sys(`update escrow_unwraps set profile_id = null,
  subject_hash = sha256(convert_to(profile_id::text || $2, 'UTF8')), outcome = 'failed' where id = $1`, [anyRow, PEPPER])) === 'SCIMM');
await sys(`insert into escrow_unwraps (profile_id, child_id, key_version, escrow_key_version, reason, outcome, occurred_at)
  values ($1, $2, 1, 1, 'rotation', 'opened', now() - interval '25 months'), ($1, $2, 1, 1, 'rotation', 'opened', now() - interval '23 months')`, [A, CHILD]);
const swept = await asRole('service_role', `select public.backup_svc_sweep(now(), 100) r`).then((x) => x.rows[0].r);
check('[F08-REQ-042] retention removes rows older than 24 months, and only those', swept.old_log_rows === 1
  && (await sys(`select count(*)::int n from escrow_unwraps where occurred_at < now() - interval '22 months'`)).rows[0].n === 1);
check('[F08-REQ-042] a 23-month-old row is still refused for delete', await codeOf(() => sys(`delete from escrow_unwraps where occurred_at < now() - interval '22 months'`)) === 'SCIMM');

// Account deletion pseudonymises the log; without the pepper it stops instead (fails closed).
await sys(`reset app.consent_pepper`);
check('[F17 8.4] deleting a person with log rows needs the pepper (55000), and nothing is deleted', await codeOf(() => sys(`delete from auth.users where id = $1`, [S])) === '55000'
  && (await sys(`select 1 from profiles where id = $1`, [S])).rows.length === 1);
await sys(`set app.consent_pepper = '${PEPPER}'`);
const sRows = Number((await sys(`select count(*) n from escrow_unwraps where profile_id = $1`, [S])).rows[0].n);
// As prepare_account_purge does: the sole-parent book goes first, then the person.
await sys(`update children set deleted_at = now() where id = $1`, [SOLO]);
await sys(`delete from children where id = $1`, [SOLO]);
await sys(`delete from auth.users where id = $1`, [S]);
const pseud = (await sys(`select count(*)::int n from escrow_unwraps where profile_id is null and subject_hash = sha256(convert_to($1 || $2, 'UTF8'))`, [S, PEPPER])).rows[0].n;
check('[F17 8.4] after deletion the log rows stay under the pseudonym sha256(id || pepper)', sRows > 0 && pseud === sRows);
check('[F17 8.4] and every other backup row of that person is gone', (await sys(`select (select count(*) from backup_devices where profile_id = $1)
  + (select count(*) from child_keys where profile_id = $1) + (select count(*) from restore_requests where profile_id = $1)
  + (select count(*) from backup_usage where profile_id = $1) n`, [S])).rows[0].n == 0);

// ── Rotation (F08-REQ-030) ────────────────────────────────────────────────
await sys(`set app.escrow_key_versions = '1,2'`);
const batch = await esc(`select public.escrow_rotation_batch(1, 10) r`);
check('a rotation batch lists wraps still on the old version, without decrypting anything', batch.length >= 3 && batch.every((k) => k.escrow_wrap_hex.length === 162));
const rewrap = (child, from = 1, to = 2) => esc(`select public.escrow_rewrap_key($1, $2, 1, $3, $4, $5::bytea, $6) r`, [A, child, from, to, wrapOf('dd'), rid()]);
const pending = () => esc(`select public.escrow_rotation_pending(2, 50) r`);
check('before any rewrap, no account is owed a rotation email (and no address is handed out)', (await pending()).length === 0);
const first = await rewrap(CHILD);
check('[F08-REQ-030] a rewrap moves one key to the new version', first.updated === true);
check('[F08-REQ-030] and the account is now owed its one rotation email, with its address', JSON.stringify(await pending()) === JSON.stringify([{ profile_id: A, email: 'asha@example.com' }]));
await rewrap(CHILD2);
check('[F08-REQ-030] the second key of the same account owes no second email', (await pending()).length === 1);
check('[F08-REQ-030] until the send is marked done, the email stays owed (a failed send is retried)', (await pending()).length === 1);
await esc(`select public.escrow_rotation_notified($1, 2) r`, [A]);
check('[F08-REQ-030] once sent, never again', (await pending()).length === 0);
const failArgs = [B, CHILD, 1, 1, rid()];
await esc(`select public.escrow_rotation_failed($1, $2, $3, $4, $5) r`, failArgs);
await esc(`select public.escrow_rotation_failed($1, $2, $3, $4, $5) r`, failArgs);
check('a wrap that would not open is logged once as a failed rotation', (await sys(`select count(*)::int n from escrow_unwraps
  where profile_id = $1 and reason = 'rotation' and outcome = 'failed'`, [B])).rows[0].n === 1);
check('and the next batch skips it, so it never stalls the rotation', !(await esc(`select public.escrow_rotation_batch(1, 10) r`)).some((k) => k.profile_id === B));
check('[F08-REQ-030] compare-and-set: rewrapping from the old version again does nothing', (await rewrap(CHILD)).updated === false);
check('[F08-REQ-030] each rewrap writes a rotation log row in the same transaction', (await sys(`select count(*)::int n from escrow_unwraps
  where profile_id = $1 and reason = 'rotation' and escrow_key_version = 1 and occurred_at > now() - interval '1 hour'`, [A])).rows[0].n === 2);
check('a rewrap to a version the server does not trust is refused', await errOf(() => rewrap(CHILD, 2, 3)) === '22023');
check('after rotation, restores read the new wraps', (await sys(`select escrow_key_version v from child_keys where profile_id = $1 and child_id = $2`, [A, CHILD])).rows[0].v === 2);

// ── The daily copy holds ids and enums, never key bytes ───────────────────
const copy = await asRole('service_role', `select public.backup_svc_unwraps_between(now() - interval '1 day', now() + interval '1 minute', 100) r`).then((x) => x.rows[0].r);
check('[F08-REQ-042] the daily copy lists the day\'s rows with ids, reason, outcome and times', copy.length >= 4 && copy.every((r) => r.id && r.at && r.reason && r.outcome));
check('[F08-REQ-042] the daily copy has no key bytes', !JSON.stringify(copy).includes('aaaa') && copy.every((r) => !('escrow_wrap_hex' in r)));
check('users cannot read the daily copy function', await codeOf(() => as(A, `select public.backup_svc_unwraps_between(now(), now(), 1)`)) === '42501');

done();
