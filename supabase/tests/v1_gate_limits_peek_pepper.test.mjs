// BL-332 server limits (20261015000000, G-11: books per day; letter delete and
// restore limits; SCRAT stopping a sync batch instead of rejecting it; sync_books
// in the pull bucket), BL-334 (20261015010000, G-12: the consent pepper fails
// closed) and peek_invite (20261015010000, G-13; the server half of BL-322).
// Ported from auto/2026-10-05-fixes d1cbddb (supabase/tests/db_fix_limits_pepper_invite.test.mjs).
// Fictional family "Asha" only (CLAUDE.md).
import { createDb, users, uuid7, TEST_CONSENT_PEPPER } from './harness.mjs';

const t = await createDb(process.argv.slice(2));
const { check, as, sys, one, codeOf, publishPolicies, consent, newChild, invite, join, done } = t;
const { A, B, C, N, S, U } = users;
for (const u of Object.values(users)) await sys(`insert into auth.users (id) values ($1) on conflict do nothing`, [u]);
await publishPolicies();
for (const u of [A, B, C, N, S]) await consent(u);

const push = async (u, ops) => (await one(u, `select public.sync_push($1::jsonb) r`, [JSON.stringify(ops)])).r;
const op = (type, id, data = {}) => ({ op: uuid7(), type, id, data });
const letter = (child, id) => op('entry.upsert', id, {
  child_id: child, kind: 'letter', occurred_on: '2025-06-01', captured_at: '2025-06-01T10:00:00Z', capture_mode: 'typed',
  engine_version: 4, raw_transcript: 'Hello', final_text: 'Hello', in_book: true,
});
const booksOf = async (u) => (await sys(`select count(*)::int n from children where created_by = $1`, [u])).rows[0].n;
const age = (u, interval) => sys(`update children set created_at = now() - $2::interval where created_by = $1`, [u, interval]);

// ── G-11: at most 20 new books per person per rolling 24 hours ───────────
{
  const first = Array.from({ length: 6 }, (_, i) => ({ id: uuid7(), name: `Asha ${i + 1}`, date_of_birth: '2025-04-12' }));
  let r = await push(A, [op('book.first_run', uuid7(), { children: first })]);
  check('[G-11] a first-run batch of 6 is accepted', r.results[0].ok && (await booksOf(A)) === 6);
  check('a replay of the same first-run batch is free', (await push(A, [op('book.first_run', uuid7(), { children: first })])).results[0].ok);
  for (let i = 0; i < 14; i++) await newChild(A, `Asha ${i + 7}`);
  check('20 books in a day is allowed', (await booksOf(A)) === 20);
  const late = uuid7();
  check('[G-11] the 21st new book in 24 hours is SCRAT (create_child)',
    (await codeOf(() => as(A, `select public.create_child($1, 'Asha', '2025-04-12')`, [late]))) === 'SCRAT');
  check('a retry of a book that already exists is never limited',
    (await one(A, `select public.create_child($1, 'Asha 1', '2025-04-12') id`, [first[0].id])).id === first[0].id);
  // Inside sync_push the limit stops the batch: earlier ops are kept, the book op and the rest wait.
  const lid = uuid7();
  const before = uuid7();
  r = await push(A, [letter(first[0].id, before), op('book.create', late, { name: 'Leo', date_of_birth: '2026-09-01' }), letter(late, lid)]);
  check('[G-11] in sync_push, SCRAT stops the batch (not a per-op rejection)',
    r.stopped === true && r.code === 'SCRAT' && r.results.length === 1 && r.results[0].ok && r.results.every((x) => x.ok));
  check('the op before it was applied; the book was not created', (await sys(`select count(*)::int n from entries where id = $1`, [before])).rows[0].n === 1
    && (await sys(`select count(*)::int n from children where id = $1`, [late])).rows[0].n === 0);
  await age(A, '25 hours');
  r = await push(A, [op('book.create', late, { name: 'Leo', date_of_birth: '2026-09-01' }), letter(late, lid)]);
  check('[G-11] once the window has passed, the same retry succeeds with its letters', r.results.length === 2 && r.results.every((x) => x.ok)
    && (await sys(`select count(*)::int n from entries where id = $1`, [lid])).rows[0].n === 1);
  // First run counts only new books in the batch.
  for (let i = 0; i < 17; i++) await newChild(B, `Asha ${i}`);
  const six = Array.from({ length: 6 }, (_, i) => ({ id: uuid7(), name: `Asha b${i}`, date_of_birth: '2025-04-12' }));
  check('[G-11] a first-run batch that would pass 20 new books today is SCRAT',
    (await codeOf(() => as(B, `select public.create_first_run_children($1::jsonb)`, [JSON.stringify(six)]))) === 'SCRAT');
  check('and nothing of it was created (all or nothing)', (await booksOf(B)) === 17);
  r = await push(B, [op('book.first_run', uuid7(), { children: six })]);
  check('in sync_push the first-run batch waits (stopped, SCRAT), never rejected', r.stopped === true && r.code === 'SCRAT' && r.results.length === 0);
  check('three more fit', (await one(B, `select array_length(public.create_first_run_children($1::jsonb), 1) n`, [JSON.stringify(six.slice(0, 3))])).n === 3);
}

// ── G-11: delete_entry and restore_entry, 300 per person per hour ────────
{
  const child = await newChild(S, 'Ravi', '2025-01-01');
  const id = uuid7();
  await push(S, [letter(child, id)]);
  check('delete and restore work under the limit', (await one(S, `select public.delete_entry($1) r`, [id])).r === true
    && (await one(S, `select public.restore_entry($1) r`, [id])).r === true);
  check('two calls counted in bucket entry_state',
    (await sys(`select hits from sync_rate_windows where profile_id = $1 and bucket = 'entry_state'`, [S])).rows[0].hits === 2);
  await sys(`update sync_rate_windows set hits = 300 where profile_id = $1 and bucket = 'entry_state'`, [S]);
  check('[G-11] delete_entry past 300 an hour is SCRAT', (await codeOf(() => as(S, `select public.delete_entry($1)`, [id]))) === 'SCRAT');
  check('[G-11] restore_entry past 300 an hour is SCRAT', (await codeOf(() => as(S, `select public.restore_entry($1)`, [id]))) === 'SCRAT');
  const r = await push(S, [op('entry.delete', id)]);
  check('[G-11] in sync_push a limited delete stops the batch and waits (never dropped)',
    r.stopped === true && r.code === 'SCRAT' && (await sys(`select deleted_at is null live from entries where id = $1`, [id])).rows[0].live);
  await sys(`update sync_rate_windows set window_start = now() - interval '61 minutes' where profile_id = $1 and bucket = 'entry_state'`, [S]);
  check('after the hour the delete goes through', (await push(S, [op('entry.delete', id)])).results[0].ok
    && !(await sys(`select deleted_at is null live from entries where id = $1`, [id])).rows[0].live);
  check('a failed call (not your letter) does not count: P0002',
    (await codeOf(() => as(C, `select public.delete_entry($1)`, [id]))) === 'P0002');
  check('the apple_token bucket exists for the apple-token function (10 an hour)',
    (await codeOf(() => as(C, `select public.rate_hit('apple_token')`))) === 'ok'
    && (await codeOf(() => as(C, `select public.rate_hit('nope')`))) === '22023');
}

// ── G-12: the consent pepper fails closed ────────────────────────────────
{
  const setPepper = (v) => sys(`select set_config('app.consent_pepper', $1, false)`, [v]);
  check('consent_pepper_ready() is true with the test pepper', (await sys(`select public.consent_pepper_ready() r`)).rows[0].r === true);
  await setPepper('');
  check('[G-12] consent_pepper_ready() is false when it is missing', (await sys(`select public.consent_pepper_ready() r`)).rows[0].r === false);
  const del = (u) => codeOf(() => sys(`delete from auth.users where id = $1`, [u]));
  check('[G-12] deleting a person with consent records and no pepper is refused (55000)', (await del(N)) === '55000'
    && (await sys(`select count(*)::int n from policy_acceptances where profile_id = $1`, [N])).rows[0].n > 0);
  await setPepper('short-pepper');
  check('[G-12] a pepper shorter than 32 characters is refused too', (await del(N)) === '55000');
  await setPepper(`   ${' '.repeat(40)}`);
  check('[G-12] blank characters do not count', (await del(N)) === '55000');
  check('a person with no consent records is deleted without a pepper', (await del(U)) === 'ok');
  await setPepper(TEST_CONSENT_PEPPER);
  check('with the pepper the deletion goes through', (await del(N)) === 'ok');
  const rows = (await sys(`select encode(subject_hash, 'hex') h from policy_acceptances where profile_id is null and pseudonymised_at is not null`)).rows;
  const want = (await sys(`select encode(sha256(convert_to($1 || $2, 'UTF8')), 'hex') h`, [N, TEST_CONSENT_PEPPER])).rows[0].h;
  check('[G-12] acceptances are hashed with id || pepper (unchanged formula)', rows.length > 0 && rows.every((r) => r.h === want));
  check('consent_pepper_ready() is service only', (await codeOf(() => as(A, `select public.consent_pepper_ready()`))) === '42501');

  // The alert path: the SLA report names the missing pepper while an account deletion waits.
  const missing = async () => (await sys(`select (public.ops_deletion_sla(now()) ->> 'consent_pepper_missing')::int n`)).rows[0].n;
  await setPepper('');
  check('[G-12] no deletion waiting: no pepper alert', (await missing()) === 0);
  await as(S, `select public.request_account_deletion('ios')`);
  check('[G-12] a deletion waiting and no pepper: consent_pepper_missing is 1 (worker alert pepper_missing)', (await missing()) === 1);
  await setPepper(TEST_CONSENT_PEPPER);
  check('[G-12] with the pepper set the alert clears', (await missing()) === 0);
  await as(S, `select public.cancel_account_deletion()`);
}

// ── G-13: peek_invite ────────────────────────────────────────────────────
{
  const child = await newChild(C, 'Asha', '2025-04-12');
  await as(C, `insert into child_member_prefs (child_id, profile_id, signs_as) values ($1, $2, 'Mama')`, [child, C]);
  const tok = await invite(C, child, 'parent');
  const V = '99999999-9999-9999-9999-999999999999'; // signed in, no consent recorded yet
  await sys(`insert into auth.users (id) values ($1)`, [V]);
  const r = (await one(V, `select public.peek_invite($1) r`, [tok])).r;
  check(`[G-13] before consent: inviter's sign-off and role only (${JSON.stringify(r)})`,
    JSON.stringify(Object.keys(r).sort()) === '["inviter","role"]' && r.inviter === 'Mama' && r.role === 'parent');
  check('[G-13] never the child\'s name or any id', !/Asha|[0-9a-f]{8}-[0-9a-f]{4}/i.test(JSON.stringify(r)));
  check('peeking does not join or use the invite', (await sys(`select count(*)::int n from child_members where profile_id = $1`, [V])).rows[0].n === 0
    && (await sys(`select accepted_at is null open from child_invites where child_id = $1 and role = 'parent'`, [child])).rows[0].open);
  await sys(`delete from child_member_prefs where child_id = $1 and profile_id = $2`, [child, C]);
  await sys(`update profiles set signs_as = 'Amma' where id = $1`, [C]);
  check('without a book signature the profile default is used', (await one(V, `select public.peek_invite($1) r`, [tok])).r.inviter === 'Amma');
  await sys(`update profiles set signs_as = null where id = $1`, [C]);
  check('and null when there is none', (await one(V, `select public.peek_invite($1) r`, [tok])).r.inviter === null);
  check('a wrong token is SCINV', (await codeOf(() => as(V, `select public.peek_invite('nope')`))) === 'SCINV');
  check('a member of the book is SCINV (already a member)', (await codeOf(() => as(C, `select public.peek_invite($1)`, [tok]))) === 'SCINV');
  await consent(V);
  await as(V, `select public.accept_child_invite($1)`, [tok]);
  check('after joining, the same person sees joined: true', (await one(V, `select public.peek_invite($1) r`, [tok])).r.joined === true);
  check('someone else gets SCINV (already used)', (await codeOf(() => as(A, `select public.peek_invite($1)`, [tok]))) === 'SCINV');
  const fam = await invite(C, child, 'contributor');
  const fullTok = await (async () => { await sys(`select set_config('app.max_parents_per_book', '3', false)`); const x = await invite(C, child, 'parent'); await sys(`select set_config('app.max_parents_per_book', '', false)`); return x; })();
  check('[G-13] a parent invite to a full book is SCCAP', (await codeOf(() => as(A, `select public.peek_invite($1)`, [fullTok]))) === 'SCCAP');
  check('a family invite to the same book is fine', (await one(A, `select public.peek_invite($1) r`, [fam])).r.role === 'contributor');
  await as(C, `select public.revoke_invite(id) from child_invites where child_id = $1 and role = 'contributor' and accepted_at is null`, [child]);
  check('a revoked invite is SCINV', (await codeOf(() => as(A, `select public.peek_invite($1)`, [fam]))) === 'SCINV');
  const exp = await invite(C, child, 'contributor');
  await sys(`update child_invites set expires_at = now() - interval '1 minute' where token_hash = sha256(convert_to($1, 'UTF8'))`, [exp]);
  check('an expired invite is SCINV', (await codeOf(() => as(A, `select public.peek_invite($1)`, [exp]))) === 'SCINV');
  const stale = await invite(V, child, 'contributor');
  await as(V, `select public.leave_child($1)`, [child]);
  check('an invite whose maker left is SCINV', (await codeOf(() => as(A, `select public.peek_invite($1)`, [stale]))) === 'SCINV');
  check('anonymous sessions are refused (SCANO)', (await codeOf(() => as(A, `select public.peek_invite($1)`, [fam], { anonymous: true }))) === 'SCANO');
  const fresh = await invite(C, child, 'contributor');
  await sys(`insert into sync_rate_windows (profile_id, bucket, window_start, hits) values ($1, 'membership', now(), 120)
             on conflict (profile_id, bucket) do update set hits = 120, window_start = now()`, [A]);
  check('[G-13] counts in the membership bucket: past 120 an hour is SCRAT', (await codeOf(() => as(A, `select public.peek_invite($1)`, [fresh]))) === 'SCRAT');
}

// ── BL-332: sync_books counts in the pull bucket (was client only, F16 section 9) ─
{
  await sys(`delete from sync_rate_windows where profile_id = $1`, [S]);
  await as(S, `select public.sync_books()`);
  check('[BL-332] sync_books counts one hit in the pull bucket',
    (await sys(`select hits from sync_rate_windows where profile_id = $1 and bucket = 'pull'`, [S])).rows[0]?.hits === 1);
  await sys(`update sync_rate_windows set hits = 120 where profile_id = $1 and bucket = 'pull'`, [S]);
  check('[BL-332] past 120 a minute sync_books is SCRAT', (await codeOf(() => as(S, `select public.sync_books()`))) === 'SCRAT');
  await sys(`update sync_rate_windows set window_start = now() - interval '2 minutes' where profile_id = $1`, [S]);
  check('a minute later it answers again', (await codeOf(() => as(S, `select public.sync_books()`))) === 'ok');
}

// ── peek_invite: the rest of the path (BL-322, review H2) ────────────────
{
  await sys(`delete from sync_rate_windows where bucket = 'membership'`);   // the block above filled A's
  const child = await newChild(S, 'Asha', '2025-04-12');
  const tok = await invite(S, child, 'parent');
  check('the anon role cannot peek (no JWT: 42501)', (await codeOf(() => t.asAnon(`select public.peek_invite($1)`, [tok]))) === '42501');
  check('a null token is SCINV', (await codeOf(() => as(A, `select public.peek_invite(null)`))) === 'SCINV');
  const before = (await sys(`select count(*)::int n from audit_events`)).rows[0].n;
  const r = (await one(A, `select public.peek_invite($1) r`, [tok])).r;
  check('[BL-322] peeking writes no audit row and no membership', (await sys(`select count(*)::int n from audit_events`)).rows[0].n === before
    && (await sys(`select count(*)::int n from child_members where child_id = $1 and profile_id = $2`, [child, A])).rows[0].n === 0);
  check('the answer has exactly the inviter and the role', JSON.stringify(Object.keys(r).sort()) === '["inviter","role"]');
  await as(S, `select public.request_book_deletion($1, 'ios')`, [child]);
  check('an invite to a book being deleted is SCINV', (await codeOf(() => as(A, `select public.peek_invite($1)`, [tok]))) === 'SCINV');
  check('peek_invite is security definer with a pinned search_path ending in pg_temp',
    (await sys(`select p.prosecdef and array_to_string(p.proconfig, ',') ~ 'search_path=pg_catalog, public, pg_temp' ok
                  from pg_proc p where p.proname = 'peek_invite'`)).rows[0].ok === true);
}

done();
