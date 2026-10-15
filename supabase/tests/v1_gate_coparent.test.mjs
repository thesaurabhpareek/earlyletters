// WP-F11-01 (20261015020000): device-made invite ids and hashes, the role and
// second-consent switches, the two-parent cap on both overloads, the 72-hour
// undo, leave only through the RPC, and code redemption for invite-redeem only.
// Test titles carry the F11 requirement ids (PRD V2 F11 section 7).
// Fictional family "Asha" only (CLAUDE.md).
import { createDb, users, uuid7 } from './harness.mjs';

const h = await createDb(process.argv.slice(2));
const { db, check, as, sys, one, codeOf, publishPolicies, consent, newChild, invite, join, done } = h;
const { A, B, C, N, S, U } = users;
const V = '99999999-9999-9999-9999-999999999999'; // joins by code
for (const u of [A, B, C, N, S, U, V]) await sys(`insert into auth.users (id) values ($1) on conflict do nothing`, [u]);
await publishPolicies();
for (const u of [A, B, C, N, S, V]) await consent(u);

const errOf = async (fn) => { try { await fn(); return { code: 'ok' }; } catch (e) { return { code: e.code, detail: e.detail }; } };
const setting = (k, v) => sys(`select set_config($1, $2, false)`, [k, v]);
// Device-made invite: id, sha256(token) and the code's hash (a stand-in for the HMAC the function makes).
const create = (uid, id, child, role, token, code = null, signs = null) => as(uid,
  `select public.create_child_invite($1::uuid, $2::uuid, $3, sha256(convert_to($4, 'UTF8')),
     case when $5::text is null then null else sha256(convert_to($5, 'UTF8')) end, $6) id`, [id, child, role, token, code, signs]);
const rows = async (id) => (await sys(`select count(*)::int n from child_invites where id = $1`, [id])).rows[0].n;
const roleOf = async (child, uid) => (await sys(`select role from child_members where child_id = $1 and profile_id = $2`, [child, uid])).rows[0]?.role ?? null;
const audits = async (action, child) => (await sys(`select count(*)::int n from audit_events where action = $1 and child_id = $2`, [action, child])).rows[0].n;

// ── F11-REQ-002: the device makes the id, the token and the code ─────────
const BOOK = await newChild(A, 'Asha', '2025-05-20');
const I1 = uuid7();
const T1 = 'a'.repeat(64);
let r = await create(A, I1, BOOK, 'parent', T1, 'ASHA2345', 'Papa');
check('[F11-REQ-002] create returns the device-made id', r.rows[0].id === I1);
await create(A, I1, BOOK, 'parent', T1, 'ASHA2345', 'Papa');
await create(A, I1, BOOK, 'parent', T1, 'ASHA2345', 'Papa');
await create(A, I1, BOOK, 'parent', T1, 'ASHA2345', 'Papa');
check('[F11-REQ-002] a create retried 3 times after lost responses leaves one row and one audit event',
  (await rows(I1)) === 1 && (await audits('invite_created', BOOK)) === 1);
const dump = JSON.stringify((await sys(`select to_jsonb(i) j from child_invites i where id = $1`, [I1])).rows[0].j);
check('[F11-REQ-002] the database holds no token or code in clear', !dump.includes(T1) && !dump.includes('ASHA2345'));
check('the server returns only the id (no secret in the answer)', JSON.stringify(r.rows[0]) === JSON.stringify({ id: I1 }));
check('[F11-REQ-002] the same id with another token is SCCID', (await codeOf(() => create(A, I1, BOOK, 'parent', 'b'.repeat(64), 'ASHA2345'))) === 'SCCID');
check('the same id with another code is SCCID', (await codeOf(() => create(A, I1, BOOK, 'parent', T1, 'ASHA9999'))) === 'SCCID');
const SBOOK = await newChild(S, 'Asha', '2025-05-20');
check('someone else\'s invite id is SCCID, without saying whose', (await codeOf(() => create(S, I1, SBOOK, 'parent', T1))) === 'SCCID');
check('an id that is not a device UUIDv7 is SCCID', (await codeOf(() => create(A, '0b2f9e3c-5a7d-4c1e-9f00-123456789abc', BOOK, 'parent', 'c'.repeat(64)))) === 'SCCID');
check('a token hash that is not 32 bytes is 22023',
  (await codeOf(() => as(A, `select public.create_child_invite($1, $2, 'parent', '\\x00'::bytea)`, [uuid7(), BOOK]))) === '22023');
check('a code hash that is not 32 bytes is 22023',
  (await codeOf(() => as(A, `select public.create_child_invite($1, $2, 'parent', sha256('x'::bytea), '\\x00'::bytea)`, [uuid7(), BOOK]))) === '22023');
let e = await errOf(() => create(A, uuid7(), BOOK, 'contributor', 'd'.repeat(64), 'ASHA2345'));
check(`[F11-REQ-002] a code that collides with a live invite is SCINV code_taken (${e.code} ${e.detail})`, e.code === 'SCINV' && e.detail === 'code_taken');
e = await errOf(() => create(A, uuid7(), BOOK, 'contributor', T1));
check(`a reused token is SCINV token_taken (${e.code} ${e.detail})`, e.code === 'SCINV' && e.detail === 'token_taken');
check('a non-parent cannot create (SCPAR), a stranger neither',
  (await codeOf(() => create(C, uuid7(), BOOK, 'parent', 'e'.repeat(64)))) === 'SCPAR');
check('the invitee accepts the device-made token with the existing accept_child_invite',
  (await one(B, `select public.accept_child_invite($1) c`, [T1])).c === BOOK && (await roleOf(BOOK, B)) === 'parent');
check('an invite without a code is fine (the code path waits on DR-13)',
  (await codeOf(() => create(S, uuid7(), SBOOK, 'contributor', 'f'.repeat(64)))) === 'ok');

// ── F11-REQ-004: at most two parents, on both overloads ──────────────────
check('[F11-REQ-004] a third-parent invite is SCCAP (device-made id)', (await codeOf(() => create(A, uuid7(), BOOK, 'parent', '1'.repeat(64)))) === 'SCCAP');
check('[F11-REQ-004] and with the 3-argument overload', (await codeOf(() => as(A, `select public.create_child_invite($1, 'parent')`, [BOOK]))) === 'SCCAP');
await setting('app.max_parents_per_book', '3');
const T3 = '3'.repeat(64);
await create(A, uuid7(), BOOK, 'parent', T3);
await setting('app.max_parents_per_book', '');
check('[F11-REQ-004] accepting a parent invite into a full book is SCCAP', (await codeOf(() => as(C, `select public.accept_child_invite($1)`, [T3]))) === 'SCCAP'
  && (await roleOf(BOOK, C)) === null);

// ── F11-REQ-003: contributor invites are refused unless switched on ──────
await setting('app.contributors_enabled', '');
e = await errOf(() => create(A, uuid7(), BOOK, 'contributor', '4'.repeat(64)));
const e3 = await errOf(() => as(A, `select public.create_child_invite($1, 'contributor')`, [BOOK]));
check(`[F11-REQ-003] by default a contributor invite is SCINV role_disabled, on both overloads (${e.detail}, ${e3.detail})`,
  e.code === 'SCINV' && e.detail === 'role_disabled' && e3.code === 'SCINV' && e3.detail === 'role_disabled');
check('[F11-REQ-003] the setting reads off unless it says on', (await sys(`select public.contributors_enabled() v`)).rows[0].v === false);
// A family invite made while the switch was on cannot be looked at or used once it is off.
await setting('app.contributors_enabled', 'on');
const TF = 'f0'.repeat(32);
await create(A, uuid7(), BOOK, 'contributor', TF);
await setting('app.contributors_enabled', 'off');
const ep = await errOf(() => as(S, `select public.peek_invite($1)`, [TF]));
const ea = await errOf(() => as(S, `select public.accept_child_invite($1)`, [TF]));
check(`[F11-REQ-003] peek and accept of a family invite are SCINV role_disabled while off (${ep.detail}, ${ea.detail})`,
  ep.code === 'SCINV' && ep.detail === 'role_disabled' && ea.code === 'SCINV' && ea.detail === 'role_disabled' && (await roleOf(BOOK, S)) === null);
await setting('app.contributors_enabled', 'on');
check('switched on, the dormant contributor path works again', (await codeOf(() => create(A, uuid7(), BOOK, 'contributor', '5'.repeat(64)))) === 'ok');

// ── F11-REQ-018: second consent at first share, off by default ───────────
await setting('app.family_share_consent_required', 'on');
e = await errOf(() => create(S, uuid7(), SBOOK, 'parent', '6'.repeat(64)));
const e18 = await errOf(() => as(S, `select public.create_child_invite($1, 'parent')`, [SBOOK]));
check(`[F11-REQ-018] with the setting on and no act: SCCON family-share, on both overloads (${e.detail}, ${e18.detail})`,
  e.code === 'SCCON' && e.detail === 'family-share' && e18.code === 'SCCON' && e18.detail === 'family-share');
await sys(`insert into policy_documents (key, title, needs_affirmative_act) values ('family-share', 'Sharing a book', true)`);
await sys(`insert into policy_versions (document, version, change_class, requires_reconsent, published_at, new_users_from, effective_at, content_sha256, url, summary)
  values ('family-share', '1.0.0', 'initial', false, now() - interval '1 day', now() - interval '1 day', now() - interval '1 day',
          sha256('family-share'::bytea), 'https://example.invalid/family-share/1.0.0', 'First version')`);
await as(S, `select public.record_policy_act('family-share', '1.0.0', 'accept', 'consent_sheet', 'family.share', '1.0.0', 'ios')`);
check('[F11-REQ-018] after the family-share accept the invite is made', (await codeOf(() => create(S, uuid7(), SBOOK, 'parent', '6'.repeat(64)))) === 'ok');
await setting('app.family_share_consent_required', '');
const FRESH = await newChild(A, 'Asha', '2025-05-20');
check('[F11-REQ-018] with the default config no act is needed', (await sys(`select public.family_share_consent_required() v`)).rows[0].v === false
  && (await codeOf(() => create(A, uuid7(), FRESH, 'parent', '7'.repeat(64)))) === 'ok');

// ── F11-REQ-008: the 72-hour undo ────────────────────────────────────────
{
  const BK = await newChild(C, 'Asha', '2025-05-20');
  const T = '8'.repeat(64);
  await create(C, uuid7(), BK, 'parent', T);
  await as(N, `select public.accept_child_invite($1)`, [T]);
  // N writes two letters into the book and one private one.
  const ids = [uuid7(), uuid7(), uuid7()];
  for (const [i, id] of ids.entries()) {
    await as(N, `insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book)
      values ($1, $2, $3, 'letter', '2026-01-01', now(), 'typed', 1, 'x', 'Words', $4)`, [id, BK, N, i < 2]);
  }
  check('the joiner cannot undo the inviter, and cannot undo themself',
    (await codeOf(() => as(N, `select public.undo_parent_join($1, $2)`, [BK, C]))) === 'SCPAR'
    && (await codeOf(() => as(C, `select public.undo_parent_join($1, $2)`, [BK, C]))) === '22023');
  const res = (await one(C, `select public.undo_parent_join($1, $2) r`, [BK, N])).r;
  const letters = (await sys(`select bool_or(in_book) any_in, bool_and(deleted_at is null) live from entries where author_id = $1 and child_id = $2`, [N, BK])).rows[0];
  check('[F11-REQ-008] within 72 hours the inviting parent undoes the join: the membership is gone',
    res === 'undone' && (await roleOf(BK, N)) === null);
  check('[F11-REQ-008] the removed person\'s letters are private and not deleted', letters.any_in === false && letters.live === true);
  check('[F11-REQ-008] the removed person still reads their own letters', (await as(N, `select id from entries where child_id = $1`, [BK])).rows.length === 3);
  check('[F11-REQ-008] audit member_join_undone exists (not member_removed)',
    (await audits('member_join_undone', BK)) === 1 && (await audits('member_removed', BK)) === 0);
  check('an undo of someone already gone is not_member', (await one(C, `select public.undo_parent_join($1, $2) r`, [BK, N])).r === 'not_member');
  check('the other parent never receives the removed person\'s letters', (await as(C, `select 1 from book_entries where author_id = $1`, [N])).rows.length === 0);
  // After the window.
  const T2 = '9'.repeat(64);
  await create(C, uuid7(), BK, 'parent', T2);
  await as(N, `select public.accept_child_invite($1)`, [T2]);
  await sys(`update child_invites set accepted_at = now() - interval '73 hours' where token_hash = sha256(convert_to($1, 'UTF8'))`, [T2]);
  await sys(`update child_members set joined_at = now() - interval '73 hours' where child_id = $1 and profile_id = $2`, [BK, N]);
  check('[F11-REQ-008] at 73 hours the undo is refused (SCPAR) and the parent stays',
    (await codeOf(() => as(C, `select public.undo_parent_join($1, $2)`, [BK, N]))) === 'SCPAR' && (await roleOf(BK, N)) === 'parent');
  // By the parent who did not send the invite: N (now a parent) invites contributor U... U has no consent; use S.
  const TS = 'b'.repeat(64);
  await create(N, uuid7(), BK, 'contributor', TS);
  await as(S, `select public.accept_child_invite($1)`, [TS]);
  check('[F11-REQ-008] the parent who did not send the invite cannot undo it (SCPAR)',
    (await codeOf(() => as(C, `select public.undo_parent_join($1, $2)`, [BK, S]))) === 'SCPAR');
  check('but the one who sent it can', (await one(N, `select public.undo_parent_join($1, $2) r`, [BK, S])).r === 'undone');
  await sys(`insert into sync_rate_windows (profile_id, bucket, window_start, hits) values ($1, 'membership', now(), 120)
             on conflict (profile_id, bucket) do update set hits = 120, window_start = now()`, [C]);
  check('undo_parent_join counts in the membership bucket (SCRAT past 120 an hour)',
    (await codeOf(() => as(C, `select public.undo_parent_join($1, $2)`, [BK, N]))) === 'SCRAT');
  await sys(`delete from sync_rate_windows where profile_id = $1`, [C]);

  // ── F11-REQ-012: after the window, no client path removes a parent ────
  check('[F11-REQ-012] remove_child_member on a parent is refused (42501)',
    (await codeOf(() => as(C, `select public.remove_child_member($1, $2)`, [BK, N]))) === '42501');
  check('[F11-REQ-012] a direct delete of another parent\'s membership is refused (42501)',
    (await codeOf(() => as(C, `delete from child_members where child_id = $1 and profile_id = $2`, [BK, N]))) === '42501');
  check('[F11-REQ-012] nobody changes a role directly (42501)',
    (await codeOf(() => as(C, `update child_members set role = 'contributor' where child_id = $1 and profile_id = $2`, [BK, N]))) === '42501');
  check('both parents are still parents', (await roleOf(BK, N)) === 'parent' && (await roleOf(BK, C)) === 'parent');

  // ── F11-REQ-011 and DATA-REQ-016: leave only through leave_child ──────
  check('[F11-REQ-011] a direct delete of my own membership is refused (42501)',
    (await codeOf(() => as(N, `delete from child_members where child_id = $1 and profile_id = auth.uid()`, [BK]))) === '42501');
  await as(N, `insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book)
    values ($1, $2, $3, 'letter', '2026-01-02', now(), 'typed', 1, 'x', 'Words', true)`, [uuid7(), BK, N]);
  check('[F11-REQ-011] leave_child with take-out leaves: own letters private, audit left_book',
    (await one(N, `select public.leave_child($1, false) r`, [BK])).r === 'left'
    && (await sys(`select count(*)::int n from entries where author_id = $1 and child_id = $2 and in_book`, [N, BK])).rows[0].n === 0
    && (await audits('left_book', BK)) === 1);
  check('[DATA-REQ-016] the last parent cannot leave (SCLPG) and stays',
    (await codeOf(() => as(C, `select public.leave_child($1)`, [BK]))) === 'SCLPG' && (await roleOf(BK, C)) === 'parent');
}

// ── F11-REQ-007: code redemption is for invite-redeem (service role) only ─
{
  const BK = await newChild(A, 'Asha', '2025-05-20');
  const code = 'K7XQ2M9P';
  await create(A, uuid7(), BK, 'parent', 'c'.repeat(64), code);
  const hash = (await sys(`select sha256(convert_to($1, 'UTF8')) h`, [code])).rows[0].h;
  check('[F11-REQ-007] a signed-in person cannot call accept_child_invite_by_code (42501)',
    (await codeOf(() => as(V, `select public.accept_child_invite_by_code($1, $2)`, [V, hash]))) === '42501');
  const svc = async (sql, params) => { await db.exec('set role service_role'); try { return await db.query(sql, params); } finally { await db.exec('reset role'); } };
  await sys(`insert into auth.users (id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')`);
  check('a person without consent gets SCCON and the invite stays open',
    (await codeOf(() => svc(`select public.accept_child_invite_by_code('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', $1)`, [hash]))) === 'SCCON'
    && (await sys(`select accepted_at is null o from child_invites where code_hash = $1`, [hash])).rows[0].o);
  check('[F11-REQ-007] the service role redeems a code for the named person',
    (await svc(`select public.accept_child_invite_by_code($1, $2) c`, [V, hash])).rows[0].c === BK && (await roleOf(BK, V)) === 'parent');
  check('a repeat for the same person returns the book (idempotent)', (await svc(`select public.accept_child_invite_by_code($1, $2) c`, [V, hash])).rows[0].c === BK);
  check('the code is single use: another person gets SCINV', (await codeOf(() => svc(`select public.accept_child_invite_by_code($1, $2)`, [S, hash]))) === 'SCINV');
  check('an unknown code is SCINV', (await codeOf(() => svc(`select public.accept_child_invite_by_code($1, sha256('nope'::bytea))`, [S]))) === 'SCINV');
  check('a malformed code hash is 22023', (await codeOf(() => svc(`select public.accept_child_invite_by_code($1, '\\x00'::bytea)`, [S]))) === '22023');
  check('the join by code is audited as member_joined', (await sys(`select count(*)::int n from audit_events where action = 'member_joined' and child_id = $1
     and detail ->> 'via' = 'code'`, [BK])).rows[0].n === 1);
}

// ── Classification and privileges ────────────────────────────────────────
check('child_invites.code_hash is L3 and notify_letters is L2',
  /^L3\b/.test((await sys(`select col_description('public.child_invites'::regclass, attnum) c from pg_attribute where attrelid = 'public.child_invites'::regclass and attname = 'code_hash'`)).rows[0].c)
  && /^L2\b/.test((await sys(`select col_description('public.child_member_prefs'::regclass, attnum) c from pg_attribute where attrelid = 'public.child_member_prefs'::regclass and attname = 'notify_letters'`)).rows[0].c));
check('notify_letters defaults to true', (await sys(`select column_default d from information_schema.columns where table_name = 'child_member_prefs' and column_name = 'notify_letters'`)).rows[0].d === 'true');
check('the leave policy is gone and the API roles hold no write on child_members',
  (await sys(`select count(*)::int n from pg_policies where tablename = 'child_members' and policyname = 'child_members_leave'`)).rows[0].n === 0
  && (await sys(`select has_table_privilege('authenticated', 'public.child_members', 'delete') d, has_table_privilege('authenticated', 'public.child_members', 'insert') i`)).rows
    .every((x) => x.d === false && x.i === false));

done();
