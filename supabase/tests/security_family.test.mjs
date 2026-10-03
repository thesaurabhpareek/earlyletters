// Security and family (20261003000000_security_and_family.sql): invites,
// family approval and visibility (B F9), server consent gates, the policy
// notice-window fix, anonymous sessions, letters into deleted books.
// Test titles carry requirement ids. Fictional family "Asha" only (CLAUDE.md).
import { createDb, users } from './harness.mjs';

const h = await createDb(process.argv.slice(2));
const { check, as, sys, one, fails, codeOf, done, publishPolicies, consent, newChild, invite, join } = h;
const { A, B, C, N, S, U, W } = users;
const M = '88888888-8888-8888-8888-888888888888'; // Dada, a second family member
const V = '99999999-9999-9999-9999-999999999999'; // signed in, Terms without age attestation
const X = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; // signed in, Terms with age, no sensitive-data consent

await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}'),('${N}'),('${S}'),('${U}'),('${W}'),('${M}'),('${V}'),('${X}')`);
await publishPolicies();
for (const u of [A, B, C, N, S, M]) await consent(u);
await consent(V, { age: false });
await consent(X, { sensitive: false });

const CHILD = await newChild(A);
await join(B, 'parent', CHILD, A);
await join(N, 'contributor', CHILD, A);
await join(M, 'contributor', CHILD, B);
const SOLO = await newChild(S);

let seq = 0;
const letter = async (author, { child = CHILD, inBook = true, text = 'She walked.' } = {}) => {
  const id = `0192c000-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
  await as(author, `insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book)
    values ($1, $2, $3, 'letter', '2026-09-29', now(), 'spoken', 1, 'um she walked', $4, $5)`, [id, child, author, text, inBook]);
  return id;
};
const row = async (id) => (await sys(`select approval, in_book, reviewed_by from entries where id=$1`, [id])).rows[0];
const sees = async (uid, id) => (await as(uid, `select 1 from book_entries where id=$1`, [id])).rows.length === 1;
const ids = async (uid, child = CHILD) => (await as(uid, `select id from book_entries where child_id=$1 order by id`, [child])).rows.map((r) => r.id);

// ── Invites (LEGAL-REQ-024, B-REQ-007, B-NFR-004, TDD 04 3.4.2) ───────────
check('[LEGAL-REQ-024] a contributor cannot create a parent invite',
  (await codeOf(() => as(N, `select public.create_child_invite($1, 'parent')`, [CHILD]))) === 'SCPAR');
check('[LEGAL-REQ-024] a contributor cannot create a family invite either',
  (await codeOf(() => as(N, `select public.create_child_invite($1, 'contributor')`, [CHILD]))) === 'SCPAR');
check('[LEGAL-REQ-024] a stranger cannot create an invite', (await codeOf(() => as(C, `select public.create_child_invite($1, 'contributor')`, [CHILD]))) === 'SCPAR');
check('[B-REQ-007] the role must be explicit', (await codeOf(() => as(A, `select public.create_child_invite($1, null)`, [CHILD]))) === 'SCINV'
  && (await codeOf(() => as(A, `select public.create_child_invite($1, 'admin')`, [CHILD]))) === 'SCINV');
check('[LEGAL-REQ-024] the old one-argument invite function is gone', (await codeOf(() => as(A, `select public.create_child_invite($1::uuid)`, [CHILD]))) === '42883');
check('child_invites.role has no default', (await sys(`select column_default from information_schema.columns where table_name='child_invites' and column_name='role'`)).rows[0].column_default === null);

const tParent = await invite(B, CHILD, 'parent');
const tFamily = await invite(A, CHILD, 'contributor');
const life = async (t) => (await sys(`select round(extract(epoch from expires_at - created_at) / 86400) d from child_invites where token_hash = sha256(convert_to($1,'UTF8'))`, [t])).rows[0].d;
check('[K-18] co-parent invites last 7 days, family invites 14', Number(await life(tParent)) === 7 && Number(await life(tFamily)) === 14);
check('[B-NFR-002] only the token hash is stored', (await sys(`select 1 from child_invites where encode(token_hash,'hex')=$1`, [tFamily])).rows.length === 0);
check('[S-9] invites are visible to parents only', (await as(A, 'select 1 from child_invites')).rows.length > 0
  && (await as(N, 'select 1 from child_invites')).rows.length === 0);
check('the inviter cannot accept their own invite', (await codeOf(() => as(B, `select public.accept_child_invite($1)`, [tParent]))) === 'SCINV');
check('[LEGAL-REQ-001] accepting needs consent, and a refused accept does not use up the invite',
  (await codeOf(() => as(U, `select public.accept_child_invite($1)`, [tFamily]))) === 'SCCON'
  && (await sys(`select accepted_at from child_invites where token_hash = sha256(convert_to($1,'UTF8'))`, [tFamily])).rows[0].accepted_at === null);
check('a family invite makes a contributor', (await one(C, `select public.accept_child_invite($1) as c`, [tFamily])).c === CHILD
  && (await sys(`select role from child_members where child_id=$1 and profile_id=$2`, [CHILD, C])).rows[0].role === 'contributor');
check('accept is idempotent for the same person', (await one(C, `select public.accept_child_invite($1) as c`, [tFamily])).c === CHILD);
check('an existing member cannot use another invite to change role', (await codeOf(() => as(C, `select public.accept_child_invite($1)`, [tParent]))) === 'SCINV');
await sys(`delete from child_members where child_id=$1 and profile_id=$2`, [CHILD, C]);

const tRevoke = await invite(A, CHILD, 'contributor');
const revId = (await sys(`select id from child_invites where token_hash = sha256(convert_to($1,'UTF8'))`, [tRevoke])).rows[0].id;
check('a contributor cannot revoke an invite', (await codeOf(() => as(N, `select public.revoke_invite($1)`, [revId]))) === 'P0002');
check('a parent revokes an invite', (await one(B, `select public.revoke_invite($1) as ok`, [revId])).ok === true);
check('a revoked invite is refused', (await codeOf(() => as(U, `select public.accept_child_invite($1)`, [tRevoke]))) === 'SCINV');
const tOld = await invite(A, CHILD, 'contributor');
await sys(`update child_invites set expires_at = now() - interval '1 minute' where token_hash = sha256(convert_to($1,'UTF8'))`, [tOld]);
check('an expired invite is refused', (await codeOf(() => as(C, `select public.accept_child_invite($1)`, [tOld]))) === 'SCINV');
check('invites are audited by role, without tokens',
  (await sys(`select count(*)::int n from audit_events where action='invite_created' and detail ? 'role' and not detail ? 'token'`)).rows[0].n >= 4);

// Rate limits: 20 per book and 20 per parent in 24 hours.
const today = async (child) => (await sys(`select count(*)::int n from child_invites where child_id=$1 and created_at > now() - interval '24 hours'`, [child])).rows[0].n;
await sys(`insert into child_invites (child_id, invited_by, token_hash, role, created_at)
  select $1, $2, sha256(convert_to('fill-' || g, 'UTF8')), 'contributor', now() - interval '1 hour' from generate_series(1, $3::int) g`, [CHILD, B, 19 - (await today(CHILD))]);
check('[B-NFR-004] the 20th invite of the day for a book is allowed', (await codeOf(() => invite(A, CHILD, 'contributor'))) === 'ok');
check('[B-NFR-004] the 21st invite of the day for a book is refused', (await codeOf(() => invite(A, CHILD, 'contributor'))) === 'SCRAT');
await sys(`insert into child_invites (child_id, invited_by, token_hash, role) select $1, $2, sha256(convert_to('s-' || g, 'UTF8')), 'contributor' from generate_series(1, 20) g`, [CHILD, S]);
check('[B-NFR-004] a parent who sent 20 invites today is refused in another book', (await codeOf(() => invite(S, SOLO, 'contributor'))) === 'SCRAT');
await sys(`update child_invites set created_at = created_at - interval '2 days'`);

// ── Family approval and visibility (B-REQ-009, B-REQ-011, B F9) ──────────
const aPrivate = await letter(A, { inBook: false });
const aBook = await letter(A);
const bBook = await letter(B);
const nSent = await letter(N);
const nPrivate = await letter(N, { inBook: false });
const mSent = await letter(M);

check('[B-REQ-009] a family letter sent to the book waits as pending', JSON.stringify(await row(nSent)) === JSON.stringify({ approval: 'pending', in_book: false, reviewed_by: null }));
check('[B-REQ-011] a family letter not sent stays private', (await row(nPrivate)).approval === 'not_needed' && !(await sees(A, nPrivate)) && !(await sees(B, nPrivate)));
check('[B F9] parents\' own letters need no approval', (await row(aBook)).approval === 'not_needed' && (await row(aBook)).in_book === true);
check('[B-REQ-009] both parents see the pending letter', (await sees(A, nSent)) && (await sees(B, nSent)));
check('[B-REQ-009] no other family member sees it', !(await sees(M, nSent)));
check('[B-REQ-011] family can read off: a contributor reads only own letters',
  (await ids(N)).join() === [nSent, nPrivate].sort().join() && (await ids(M)).join() === mSent);
check('[B-REQ-009] a contributor cannot set approval', (await codeOf(() => as(N, `update entries set approval='added' where id=$1`, [nSent]))) === 'SCAPR');
await as(N, `update entries set in_book = true, final_text = 'She walked to Nani.' where id=$1`, [nSent]);
check('[B-REQ-009] setting in_book again does not put it in the book', (await row(nSent)).in_book === false);

check('[B-REQ-009] a contributor cannot review', (await codeOf(() => as(N, `select public.review_family_letter($1, 'added')`, [mSent]))) === 'P0002');
check('a parent\'s own letter is not reviewable', (await codeOf(() => as(B, `select public.review_family_letter($1, 'added')`, [aBook]))) === 'P0002');
check('[B-REQ-009] parent B adds it', (await one(B, `select public.review_family_letter($1, 'added') r`, [nSent])).r === 'added');
const nRow = await row(nSent);
check('[B-REQ-009] it is in the book, reviewed by B', nRow.approval === 'added' && nRow.in_book === true && nRow.reviewed_by === B);
check('[B-REQ-009] first action wins: A\'s later set-aside of a pending letter is a no-op',
  (await one(A, `select public.review_family_letter($1, 'set_aside') r`, [nSent])).r === 'added' && (await row(nSent)).approval === 'added');
check('[B-REQ-009] the contributor sees "In the book"', (await one(N, `select approval, in_book from entries where id=$1`, [nSent])).approval === 'added');
check('review is audited with the decision only', (await sys(`select detail from audit_events where action='family_letter_reviewed' and subject_id=$1`, [nSent])).rows[0].detail.decision === 'added');

check('[B F7] a parent sets aside a letter', (await one(A, `select public.review_family_letter($1, 'set_aside') r`, [mSent])).r === 'set_aside');
check('[B F9] parents still see set-aside letters; the author sees "With {inviter}"', (await sees(B, mSent)) && (await one(M, `select approval from entries where id=$1`, [mSent])).approval === 'set_aside');
check('a parent can later add a set-aside letter when they say what they saw',
  (await one(B, `select public.review_family_letter($1, 'added', 'set_aside') r`, [mSent])).r === 'added');
await as(A, `select public.review_family_letter($1, 'set_aside', 'added')`, [mSent]);

await as(A, `update children set family_can_read = true where id=$1`, [CHILD]);
check('[B-REQ-011] family can read on: a contributor reads in-book letters, own letters, never others\' private or set-aside',
  (await ids(N)).join() === [aBook, bBook, nSent, nPrivate].sort().join() && !(await sees(N, aPrivate)) && !(await sees(N, mSent)));
check('[B-REQ-011] another contributor\'s added letter is readable under the same rule', await sees(M, nSent));

await as(N, `update entries set final_text = 'She ran to Nani.' where id=$1`, [nSent]);
check('changing the words of an added family letter returns it to the parents', (await row(nSent)).approval === 'pending' && !(await sees(M, nSent)));
await as(N, `update entries set in_book = false where id=$1`, [nSent]);
check('writing in_book = false does not un-send a pending letter (in_book is already false)', (await row(nSent)).approval === 'pending');
check('another person cannot withdraw a family letter', (await codeOf(() => as(A, `select public.withdraw_family_letter($1)`, [nSent]))) === 'P0002');
await as(N, `select public.withdraw_family_letter($1)`, [nSent]);
check('a contributor takes back a pending letter with withdraw_family_letter', (await row(nSent)).approval === 'not_needed' && !(await sees(A, nSent)));

check('[K-12] only parents set auto-add', (await codeOf(() => as(N, `select public.set_member_auto_add($1, $2, true)`, [CHILD, N]))) === 'SCPAR');
check('auto-add does not apply to parents', (await one(A, `select public.set_member_auto_add($1, $2, true) ok`, [CHILD, B])).ok === false);
await as(A, `select public.set_member_auto_add($1, $2, true)`, [CHILD, N]);
const nAuto = await letter(N);
check('[K-12] with auto-add on, a family letter goes straight into the book', (await row(nAuto)).approval === 'added' && (await row(nAuto)).in_book);
await as(N, `update entries set final_text = 'Auto added, then edited.' where id=$1`, [nAuto]);
check('with auto-add on, editing keeps it in the book', (await row(nAuto)).approval === 'added');
await as(A, `select public.set_member_auto_add($1, $2, false)`, [CHILD, N]);

// Photos follow the letters.
const photoOf = async (author, id) => {
  const p = `${CHILD}/${author}/${id}.jpg`;
  await as(author, `update entries set photo_path=$1 where id=$2`, [p, id]);
  await as(author, `insert into storage.objects (bucket_id, name) values ('entry-photos', $1)`, [p]);
  return p;
};
const nPending = await letter(N);
const pN = await photoOf(N, nPending);
const pA = await photoOf(A, aBook);
const canSee = async (uid, p) => (await as(uid, `select 1 from storage.objects where name=$1`, [p])).rows.length === 1;
check('[B F9] parents see the photo of a pending family letter; other family do not', (await canSee(B, pN)) && !(await canSee(M, pN)));
check('[B-REQ-011] contributors see in-book photos only while family can read is on', await canSee(N, pA));
await as(B, `update children set family_can_read = false where id=$1`, [CHILD]);
check('[B-REQ-011] switching family can read off hides letters and photos from contributors',
  !(await canSee(N, pA)) && !(await sees(N, aBook)) && (await sees(B, aBook)));

// ── Consent gates (LEGAL-REQ-001, -002, -006; TDD 05 X-03) ───────────────
const gate = async (uid) => one(uid, `select * from public.my_sync_gate()`);
check('[LEGAL-REQ-006] my_sync_gate reports what is missing', !(await gate(U)).content_allowed && (await gate(A)).content_allowed
  && (await gate(V)).age_attested === false && (await gate(X)).sensitive_data === false);
const err = async (fn) => { try { await fn(); return null; } catch (e) { return e; } };
const eU = await err(() => newChild(U));
check('[LEGAL-REQ-001] no book before Terms: SCCON', eU?.code === 'SCCON' && /terms/.test(eU.detail));
const eV = await err(() => newChild(V));
check('[LEGAL-REQ-002] no book without the age attestation: SCCON age', eV?.code === 'SCCON' && eV.detail === 'age');
const eX = await err(() => newChild(X));
check('[LEGAL-REQ-006] no book without sensitive-data consent: SCCON sensitive-data', eX?.code === 'SCCON' && eX.detail === 'sensitive-data');
check('age_attested can only be true', (await codeOf(() => as(V, `select public.record_policy_act('terms', '1.0.0', 'accept', 'signin_sheet', 'auth.sheet', '1.0.0', 'ios', null, null, null, '{"age_attested": false}'::jsonb)`))) === '22023');
check('policy act context keys are allowlisted', (await codeOf(() => as(V, `select public.record_policy_act('terms', '1.0.0', 'accept', 'signin_sheet', 'auth.sheet', '1.0.0', 'ios', null, null, null, '{"email": "x"}'::jsonb)`))) === '22023');

// B withdraws sensitive-data consent.
const bPrivate = await letter(B, { inBook: false });
await as(B, `select public.record_policy_act('sensitive-data', '1.0.0', 'withdraw', 'settings_toggle', 'settings.privacy', '1.0.0', 'ios')`);
check('[LEGAL-REQ-006] after withdrawal a new letter is refused with SCCON (pause, not reject)', (await codeOf(() => letter(B))) === 'SCCON');
check('[LEGAL-REQ-006] editing words is refused', (await codeOf(() => as(B, `update entries set final_text='x' where id=$1`, [bPrivate]))) === 'SCCON');
check('[LEGAL-REQ-006] putting a letter in the book is refused', (await codeOf(() => as(B, `update entries set in_book=true where id=$1`, [bPrivate]))) === 'SCCON');
check('[LEGAL-REQ-009] taking a letter out of the book still works', (await codeOf(() => as(B, `update entries set in_book=false where id=$1`, [bBook]))) === 'ok');
check('[LEGAL-REQ-009] deleting a letter still works (PATCH and RPC)', (await codeOf(() => as(B, `update entries set deleted_at=now() where id=$1`, [bPrivate]))) === 'ok'
  && (await codeOf(() => as(B, `select public.delete_entry($1)`, [bBook]))) === 'ok');
check('[LEGAL-REQ-006] dictionary terms are refused', (await codeOf(() => as(B, `insert into dictionary_terms (owner_id, term, kind) values ($1, 'Ashu', 'nickname')`, [B]))) === 'SCCON');
check('[LEGAL-REQ-006] per-book prefs are refused', (await codeOf(() => as(B, `insert into child_member_prefs (child_id, profile_id, signs_as) values ($1, $2, 'Mumma')`, [CHILD, B]))) === 'SCCON');
check('[LEGAL-REQ-006] book settings are refused', (await codeOf(() => as(B, `update children set nickname='Ashu' where id=$1`, [CHILD]))) === 'SCCON');
check('[LEGAL-REQ-006] photo uploads are refused', await fails(() => as(B, `insert into storage.objects (bucket_id, name) values ('entry-photos', $1)`, [`${CHILD}/${B}/${bPrivate}.jpg`])));
check('[LEGAL-REQ-006] invites are refused', (await codeOf(() => invite(B, CHILD, 'contributor'))) === 'SCCON');
check('[LEGAL-REQ-006] reviews are refused', (await codeOf(() => as(B, `select public.review_family_letter($1, 'added')`, [nPending]))) === 'SCCON');
check('reading still works after withdrawal', await sees(B, aBook));
await as(B, `select public.record_policy_act('sensitive-data', '1.0.0', 'accept', 'settings_toggle', 'settings.privacy', '1.0.0', 'ios')`);
check('[LEGAL-REQ-006] consent again: writes resume', (await codeOf(() => letter(B))) === 'ok');

// ── Anonymous sessions (TDD 04 S-2, K-08) ─────────────────────────────────
await sys(`insert into child_members (child_id, profile_id, role) values ($1, $2, 'contributor')`, [CHILD, W]);
await sys(`update children set family_can_read = true where id=$1`, [CHILD]);
const anon = { anonymous: true };
const asW = (sql, params = []) => as(W, sql, params, anon);
check('[K-08] an anonymous member reads no book, member or letter rows',
  (await asW(`select 1 from children union all select 1 from child_members union all select 1 from book_entries union all select 1 from profiles`)).rows.length === 0);
check('[K-08] the same person with a full session reads the book', (await as(W, `select 1 from book_entries where child_id=$1`, [CHILD])).rows.length > 0);
for (const [name, sql, params] of [
  ['create_child', `select public.create_child('0192d000-0000-7000-8000-000000000001', 'Asha', '2025-05-20')`, []],
  ['create_child_invite', `select public.create_child_invite($1, 'contributor')`, [CHILD]],
  ['accept_child_invite', `select public.accept_child_invite('x')`, []],
  ['request_account_deletion', `select * from public.request_account_deletion('web')`, []],
  ['delete_entry', `select public.delete_entry($1)`, [aBook]],
  ['policy_actions_needed', `select * from public.policy_actions_needed()`, []],
  ['record_policy_act (sign-in sheet)', `select public.record_policy_act('terms', '1.0.0', 'accept', 'signin_sheet', 'auth.sheet', '1', 'web')`, []],
]) {
  check(`[K-08] anonymous session cannot call ${name}`, (await codeOf(() => asW(sql, params))) === 'SCANO');
}
check('[K-08] anonymous session cannot write a letter', (await codeOf(() => asW(`insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text)
  values ('0192d000-0000-7000-8000-000000000002', $1, $2, 'letter', '2026-09-29', now(), 'spoken', 1, 'x', 'x')`, [CHILD, W]))) === 'SCANO');
check('[K-08] anonymous session cannot write dictionary terms', await fails(() => asW(`insert into dictionary_terms (owner_id, term, kind) values ($1, 'Asha', 'child')`, [W])));
check('[K-08] anonymous session cannot upload photos', await fails(() => asW(`insert into storage.objects (bucket_id, name) values ('entry-photos', $1)`, [`${CHILD}/${W}/x.jpg`])));
check('[LEGAL-REQ-002] the web page records the contributor notice with the age attestation',
  (await codeOf(() => asW(`select public.record_policy_act('contributor-notice', '1.0.0', 'accept', 'web_contributor_page', 'web.send', '1', 'web', null, null, null, '{"age_attested": true}'::jsonb)`))) === 'ok');
await sys(`delete from child_members where profile_id=$1`, [W]);

// ── Letters into deleted books (TDD 02 C10) ──────────────────────────────
const sLetter = await letter(S, { child: SOLO });
await as(S, `select public.request_book_deletion($1, 'ios')`, [SOLO]);
check('[TDD 02 C10] a new letter into a deleted book is refused with SCDEL', (await codeOf(() => letter(S, { child: SOLO }))) === 'SCDEL');
check('editing a letter in a deleted book is refused', (await codeOf(() => as(S, `update entries set final_text='x' where id=$1`, [sLetter]))) === 'SCDEL');
check('deleting a letter in a deleted book still works', (await codeOf(() => as(S, `update entries set deleted_at=now() where id=$1`, [sLetter]))) === 'ok');
check('request_book_deletion refuses a client claiming source support', (await codeOf(() => as(A, `select public.request_book_deletion($1, 'support')`, [CHILD]))) === '22023');
check('[TDD 05 X-11] request_account_deletion refuses source support', (await codeOf(() => as(C, `select * from public.request_account_deletion('support')`))) === '22023');

// ── Policy notice window (TDD 05 X-01) ───────────────────────────────────
await sys(`insert into policy_versions (document, version, change_class, requires_reconsent, published_at, new_users_from, effective_at, content_sha256, url, summary)
  values ('terms', '2.0.0', 'major', true, now(), now(), now() + interval '30 days', sha256('t2'::bytea), 'https://example.invalid/terms/2.0.0', 'Second version')`);
const offered = (await as(U, `select version from policy_actions_needed() where document='terms'`)).rows[0]?.version;
check('[X-01] a new user during the notice window is offered the new version', offered === '2.0.0');
check('[X-01] and can accept it', (await codeOf(() => consent(U, { version: '2.0.0' }))) === 'ok');
check('[X-01] after accepting, nothing is asked and content is allowed',
  (await as(U, `select 1 from policy_actions_needed() where document='terms'`)).rows.length === 0 && (await gate(U)).content_allowed);
check('[X-01] the old version is refused to new users', (await codeOf(() => as(C, `select public.record_policy_act('terms', '1.0.0', 'accept', 'signin_sheet', 'auth.sheet', '1.0.0', 'ios')`))) === 'SCVER');
check('[X-01] existing acceptors are not asked until the change is in force',
  (await as(A, `select 1 from policy_actions_needed() where document='terms'`)).rows.length === 0 && (await gate(A)).content_allowed);

// A re-consent version already in force, followed by a minor version: the old
// function compared only against the newest in-force version (a minor) and
// missed the major change.
await as(A, `select public.record_policy_act('contributor-notice', '1.0.0', 'accept', 'consent_sheet', 'notice', '1', 'ios')`);
await sys(`insert into policy_versions (document, version, change_class, requires_reconsent, published_at, new_users_from, effective_at, content_sha256, url, summary) values
  ('contributor-notice', '2.0.0', 'major', true, now() - interval '40 days', now() - interval '40 days', now() - interval '5 days', sha256('c2'::bytea), 'https://example.invalid/cn/2.0.0', 'Major'),
  ('contributor-notice', '2.1.0', 'minor', false, now() - interval '2 days', now() - interval '2 days', now() - interval '2 days', sha256('c21'::bytea), 'https://example.invalid/cn/2.1.0', 'Minor')`);
check('[X-01] an acceptor of 1.0.0 is asked after a major change, even when a minor followed',
  (await as(A, `select version from policy_actions_needed() where document='contributor-notice'`)).rows[0]?.version === '2.1.0');
await as(A, `select public.record_policy_act('contributor-notice', '2.1.0', 'accept', 'reconsent_sheet', 'notice', '1', 'ios')`);
check('[X-01] accepting the offered version clears it', (await as(A, `select 1 from policy_actions_needed() where document='contributor-notice'`)).rows.length === 0);

done();
