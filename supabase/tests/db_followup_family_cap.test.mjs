// Two parents per book, leaving and removing (20261005000000; DECISIONS D-069,
// pm-2 FAM-11, DELETION_AND_EXPORT_SPEC 2.4 and 2.5, TDD 02 2.4). Also the
// security review's PoC F2 (stale invite, third parent, no removal) and F6
// (photo moved into another family's folder), asserted as fixed.
// Fictional family "Asha" only (CLAUDE.md).
import { createDb, users } from './harness.mjs';

const h = await createDb(process.argv.slice(2));
const { check, as, sys, one, codeOf, done, publishPolicies, consent, newChild, invite, join } = h;
const { A, B, C, N, S, U } = users;
const M = '88888888-8888-8888-8888-888888888888'; // Dada, a second family member
const T = '99999999-9999-9999-9999-999999999999'; // another signed-in person

await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}'),('${N}'),('${S}'),('${U}'),('${M}'),('${T}')`);
await publishPolicies();
for (const u of [A, B, C, N, S, M, T]) await consent(u);

const setCap = (v) => sys(`select set_config('app.max_parents_per_book', $1, false)`, [v]);
const parents = async (child) => Number((await sys(`select count(*) c from child_members where child_id=$1 and role='parent'`, [child])).rows[0].c);
const roleOf = async (child, uid) => (await sys(`select role from child_members where child_id=$1 and profile_id=$2`, [child, uid])).rows[0]?.role ?? null;
const inviteRow = async (t) => (await sys(`select * from child_invites where token_hash = sha256(convert_to($1, 'UTF8'))`, [t])).rows[0];
const errOf = async (fn) => { try { await fn(); return null; } catch (e) { return e; } };
let seq = 0;
const letter = async (author, child, { inBook = true } = {}) => {
  const id = `0192d000-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
  await as(author, `insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book)
    values ($1, $2, $3, 'letter', '2026-09-29', now(), 'spoken', 1, 'um she walked', 'She walked.', $4)`, [id, child, author, inBook]);
  return id;
};
const entry = async (id) => (await sys(`select in_book, approval, deleted_at, reviewed_by from entries where id=$1`, [id])).rows[0];
const sees = async (uid, id) => (await as(uid, `select 1 from book_entries where id=$1`, [id])).rows.length === 1;

// ── The setting ─────────────────────────────────────────────────────────
const cap = async () => Number((await sys(`select public.max_parents_per_book() n`)).rows[0].n);
check('[D-069] the parent cap defaults to 2', (await cap()) === 2);
await setCap('3'); const three = await cap();
await setCap('0'); const zero = await cap();
await setCap('11'); const eleven = await cap();
await setCap('two'); const word = await cap();
await setCap('');
check('app.max_parents_per_book changes the cap without a migration (1 to 10; anything else reads as 2)',
  three === 3 && zero === 2 && eleven === 2 && word === 2);
check('people cannot read the cap helper directly', (await codeOf(() => as(A, `select public.max_parents_per_book()`))) === '42501');

// ── Third parent refused at invite and at accept (PoC F2c) ──────────────
const CHILD = await newChild(A);
await join(B, 'parent', CHILD, A);
const capErr = await errOf(() => as(A, `select public.create_child_invite($1, 'parent')`, [CHILD]));
check('[D-069] a book with two parents refuses a co-parent invite (SCCAP, detail = the cap)',
  capErr?.code === 'SCCAP' && capErr?.detail === '2');
check('[D-069] the co-parent is refused the same way', (await codeOf(() => as(B, `select public.create_child_invite($1, 'parent')`, [CHILD]))) === 'SCCAP');
check('family invites still work with two parents', /^[0-9a-f]{64}$/.test(await invite(A, CHILD, 'contributor')));

const BOOK2 = await newChild(S);
const t1 = await invite(S, BOOK2, 'parent');
const t2 = await invite(S, BOOK2, 'parent');
await as(C, `select public.accept_child_invite($1)`, [t1]);
check('[D-069] with one open seat, two open co-parent invites: the second acceptance is refused (SCCAP)',
  (await codeOf(() => as(M, `select public.accept_child_invite($1)`, [t2]))) === 'SCCAP' && (await parents(BOOK2)) === 2);
check('a refused acceptance does not use up the invite', (await inviteRow(t2)).accepted_at === null);
await setCap('3');
check('with the setting at 3 the same link works (support or a founder change, no migration)',
  (await one(M, `select public.accept_child_invite($1) c`, [t2])).c === BOOK2 && (await parents(BOOK2)) === 3);
await setCap('');
check('back at 2, a book that already has 3 parents refuses another', (await codeOf(() => as(S, `select public.create_child_invite($1, 'parent')`, [BOOK2]))) === 'SCCAP');

// ── Stale invites (PoC F2a-b) ───────────────────────────────────────────
const tStale = await invite(B, CHILD, 'contributor');
check('[H2] leave_child: a parent leaves with their letters kept', (await one(B, `select public.leave_child($1) r`, [CHILD])).r === 'left');
check('[H2] a parent who leaves takes their open invites with them', (await inviteRow(tStale)).revoked_at !== null
  && (await codeOf(() => as(C, `select public.accept_child_invite($1)`, [tStale]))) === 'SCINV');
// An invite that escaped revocation (made before this migration): its maker is no longer a parent.
await sys(`update child_invites set revoked_at = null where token_hash = sha256(convert_to($1, 'UTF8'))`, [tStale]);
const staleErr = await errOf(() => as(C, `select public.accept_child_invite($1)`, [tStale]));
check('[H2] an invite whose maker is no longer a parent of the book is refused', staleErr?.code === 'SCINV' && /not found/.test(staleErr?.message));
check('so the stranger is not a member', (await roleOf(CHILD, C)) === null);
// The direct own-row delete (child_members_leave policy) revokes too.
await join(B, 'parent', CHILD, A);
const tB2 = await invite(B, CHILD, 'contributor');
await as(B, `delete from child_members where child_id=$1 and profile_id=auth.uid()`, [CHILD]);
check('leaving by the direct own-row delete also revokes that parent\'s invites', (await inviteRow(tB2)).revoked_at !== null);
const tA = await invite(A, CHILD, 'contributor');
check('the remaining parent\'s invites are untouched', (await inviteRow(tA)).revoked_at === null);

// ── leave_child ─────────────────────────────────────────────────────────
const SOLO = await newChild(T);
const lpg = await errOf(() => as(T, `select public.leave_child($1)`, [SOLO]));
check('[DATA-REQ-016] the last parent of a live book cannot leave (SCLPG) and stays', lpg?.code === 'SCLPG' && (await roleOf(SOLO, T)) === 'parent');
const lpg2 = await codeOf(() => as(T, `select public.leave_child($1, false)`, [SOLO]));
check('a refused leave changes nothing, even with "take my letters out"', lpg2 === 'SCLPG');

await join(B, 'parent', CHILD, A);
const bIn = await letter(B, CHILD);
const bPriv = await letter(B, CHILD, { inBook: false });
check('leave_child keeps letters by default: A still reads B\'s in-book letter after B leaves',
  (await one(B, `select public.leave_child($1) r`, [CHILD])).r === 'left' && (await sees(A, bIn)) && (await entry(bIn)).in_book === true);
check('[DATA-REQ-016] the leaver still reads and can delete their own letters',
  (await as(B, `select 1 from entries where id in ($1, $2)`, [bIn, bPriv])).rows.length === 2
  && (await one(B, `select public.delete_entry($1) ok`, [bIn])).ok === true);
check('leave_child is idempotent: again is "not_member"', (await one(B, `select public.leave_child($1) r`, [CHILD])).r === 'not_member');
check('a left_book audit row is written by the leaver',
  (await as(B, `select 1 from audit_events where action='left_book' and child_id=$1`, [CHILD])).rows.length >= 1);

await join(B, 'parent', CHILD, A);
const bIn2 = await letter(B, CHILD);
check('"take my letters out": a parent\'s in-book letters leave the book, never deleted',
  (await one(B, `select public.leave_child($1, false) r`, [CHILD])).r === 'left'
  && (await entry(bIn2)).in_book === false && (await entry(bIn2)).deleted_at === null && !(await sees(A, bIn2)));

await join(N, 'contributor', CHILD, A);
const nAdded = await letter(N, CHILD);
const nPending = await letter(N, CHILD);
await as(A, `select public.review_family_letter($1, 'added')`, [nAdded]);
check('family letters start as added and pending', (await entry(nAdded)).approval === 'added' && (await entry(nPending)).approval === 'pending');
check('a family member leaving with "take my letters out" withdraws them (not deleted)',
  (await one(N, `select public.leave_child($1, false) r`, [CHILD])).r === 'left'
  && (await entry(nAdded)).approval === 'not_needed' && (await entry(nAdded)).in_book === false
  && (await entry(nPending)).approval === 'not_needed' && (await entry(nAdded)).deleted_at === null);

// Leaving is never consent-gated (LEGAL-REQ-009).
await join(N, 'contributor', CHILD, A);
await as(N, `select public.record_policy_act('sensitive-data', '1.0.0', 'withdraw', 'settings_toggle', 'settings.privacy', '1', 'ios')`);
check('[LEGAL-REQ-009] leaving works after consent is withdrawn', (await one(N, `select public.leave_child($1) r`, [CHILD])).r === 'left');
await consent(N);

// ── remove_child_member (either parent, no veto) ────────────────────────
await join(B, 'parent', CHILD, A);
await join(N, 'contributor', CHILD, A);
await join(M, 'contributor', CHILD, B);
const nKeep = await letter(N, CHILD);
await as(B, `select public.review_family_letter($1, 'added')`, [nKeep]);
check('[SPEC 2.5] a contributor cannot remove anyone', (await codeOf(() => as(N, `select public.remove_child_member($1, $2)`, [CHILD, M]))) === 'SCPAR');
check('a stranger cannot remove anyone', (await codeOf(() => as(C, `select public.remove_child_member($1, $2)`, [CHILD, N]))) === 'SCPAR');
check('[PRD B F8] a parent cannot remove the other parent (42501); only their own leave_child ends it',
  (await codeOf(() => as(A, `select public.remove_child_member($1, $2)`, [CHILD, B]))) === '42501' && (await roleOf(CHILD, B)) === 'parent');
check('removing yourself is not a removal (22023: use leave_child)', (await codeOf(() => as(A, `select public.remove_child_member($1, $2)`, [CHILD, A]))) === '22023');
check('[D-069] either parent removes a family member alone: A removes N',
  (await one(A, `select public.remove_child_member($1, $2) r`, [CHILD, N])).r === 'removed' && (await roleOf(CHILD, N)) === null);
check('[DATA-REQ-017] the removed member\'s added letter stays in the book', (await sees(B, nKeep)) && (await entry(nKeep)).in_book === true);
check('[DATA-REQ-017] the removed member still reads their own letter, and no longer reads the book',
  (await as(N, `select 1 from entries where id=$1`, [nKeep])).rows.length === 1
  && (await as(N, `select 1 from book_entries where child_id=$1 and author_id <> $2`, [CHILD, N])).rows.length === 0);
check('a member_removed audit row names the remover as actor',
  (await as(A, `select 1 from audit_events where action='member_removed' and child_id=$1 and subject_id=$2`, [CHILD, N])).rows.length === 1);
check('remove_child_member is idempotent: again is "not_member"', (await one(A, `select public.remove_child_member($1, $2) r`, [CHILD, N])).r === 'not_member');

const mAdded = await letter(M, CHILD);
const mPending = await letter(M, CHILD);
const mPrivate = await letter(M, CHILD, { inBook: false });
await as(A, `select public.review_family_letter($1, 'added')`, [mAdded]);
await as(B, `select public.record_policy_act('sensitive-data', '1.0.0', 'withdraw', 'settings_toggle', 'settings.privacy', '1', 'ios')`);
check('[D-069] the co-parent removes too, with "also take their letters out", even without current consent',
  (await one(B, `select public.remove_child_member($1, $2, true) r`, [CHILD, M])).r === 'removed');
await consent(B);
check('[SPEC 2.5] their added and pending letters are set aside, never deleted; private ones untouched',
  (await entry(mAdded)).approval === 'set_aside' && (await entry(mAdded)).in_book === false && (await entry(mAdded)).deleted_at === null
  && (await entry(mPending)).approval === 'set_aside' && (await entry(mPrivate)).approval === 'not_needed');
check('set-aside letters stay visible to parents only, under "Letters from family"', (await sees(A, mAdded)) && (await sees(B, mPending)));
check('a parent can add a set-aside letter back', (await one(A, `select public.review_family_letter($1, 'added', 'set_aside') r`, [mAdded])).r === 'added');
check('[FAM-11 item 8] either parent can invite a removed family member again',
  (await one(N, `select public.accept_child_invite($1) c`, [await invite(B, CHILD, 'contributor')])).c === CHILD && (await roleOf(CHILD, N)) === 'contributor');

// ── Rate limit on membership changes (TDD 02 4.1: 120 per hour) ─────────
await sys(`insert into sync_rate_windows (profile_id, bucket, window_start, hits) values ($1, 'membership', now(), 120)
           on conflict (profile_id, bucket) do update set hits = 120, window_start = now()`, [A]);
check('the 121st membership change in an hour is refused (SCRAT)', (await codeOf(() => as(A, `select public.remove_child_member($1, $2)`, [CHILD, N]))) === 'SCRAT'
  && (await roleOf(CHILD, N)) === 'contributor');
const tLimited = await invite(B, CHILD, 'contributor');
await sys(`insert into sync_rate_windows (profile_id, bucket, window_start, hits) values ($1, 'membership', now(), 120)
           on conflict (profile_id, bucket) do update set hits = 120, window_start = now()`, [T]);
check('accept_child_invite counts in the same window', (await codeOf(() => as(T, `select public.accept_child_invite($1)`, [tLimited]))) === 'SCRAT');
check('a refused call does not move the counter', Number((await sys(`select hits from sync_rate_windows where profile_id=$1 and bucket='membership'`, [A])).rows[0].hits) === 120);
await sys(`update sync_rate_windows set window_start = now() - interval '61 minutes' where profile_id in ($1, $2)`, [A, T]);
check('after the hour the window starts again', (await one(A, `select public.remove_child_member($1, $2) r`, [CHILD, N])).r === 'removed'
  && Number((await sys(`select hits from sync_rate_windows where profile_id=$1 and bucket='membership'`, [A])).rows[0].hits) === 1);

// ── Photos cannot be moved into another family's book (PoC F6, review L2) ──
const CB = await newChild(C);
const own = `${CB}/${C}/0192d000-0000-7000-8000-0000000000aa.jpg`;
await as(C, `insert into storage.objects (bucket_id, name) values ('entry-photos', $1)`, [own]);
const moved = await codeOf(() => as(C, `update storage.objects set name = $1 where name = $2`, [`${SOLO}/${C}/x.jpg`, own]));
check('[L2] renaming an own photo into another family\'s book folder is refused', moved === '42501'
  && (await sys(`select 1 from storage.objects where name=$1`, [own])).rows.length === 1);
check('renaming within an own live book still works',
  (await codeOf(() => as(C, `update storage.objects set name = $1 where name = $2`, [`${CB}/${C}/0192d000-0000-7000-8000-0000000000ab.jpg`, own]))) === 'ok');

done();
