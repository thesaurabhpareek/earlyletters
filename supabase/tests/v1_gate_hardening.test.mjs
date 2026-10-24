// BL-331 (R-17 gate). Regression tests for the 4 Oct security review PoC appendix
// (docs/reviews/2026-10-04-security-privacy.md, F1 to F6), now asserting the safe
// behaviour, plus the fixes in 20261015000000 for G-08 (birth date and due date,
// review M1), G-09 (sync_pull digest, M5) and G-10 (op receipts, L1), and the
// read-only views (PR #32 review DB-01). F2, F3 and F6 were fixed by
// 20261005000000; they are re-checked here so the PoC stays covered end to end.
// Ported from auto/2026-10-05-fixes d1cbddb (supabase/tests/db_fix_security_review.test.mjs).
// Fictional family "Asha" only (CLAUDE.md).
import { readFileSync } from 'node:fs';
import { createDb, users, uuid7 } from './harness.mjs';

const t = await createDb(process.argv.slice(2));
const { check, as, sys, one, codeOf, publishPolicies, consent, newChild, invite, join, done } = t;
// Test-only (20261023060000): these checks read book_entries' filter as each member. On a project only
// sync_pull reads the view (a definer function, as the owner), so no client role holds SELECT on it.
await sys(`grant select on public.book_entries to authenticated`);
const { A, B, C, N, S } = users;
const P2 = '88888888-8888-8888-8888-888888888888';
for (const u of [...Object.values(users), P2]) await sys(`insert into auth.users (id) values ($1) on conflict do nothing`, [u]);
await publishPolicies();
for (const u of [A, B, C, N, S, P2]) await consent(u);

const pull = async (u, since = {}, limit = 100) => (await one(u, `select public.sync_pull($1::jsonb, $2) r`, [JSON.stringify(since), limit])).r;
const push = async (u, ops) => (await one(u, `select public.sync_push($1::jsonb) r`, [JSON.stringify(ops)])).r;
const op = (type, id, data = {}, extra = {}) => ({ op: uuid7(), type, id, data, ...extra });
const letterData = (child, text, inBook) => ({
  child_id: child, kind: 'letter', occurred_on: '2025-06-01', captured_at: '2025-06-01T10:00:00.000Z', capture_mode: 'typed',
  engine_version: 4, raw_transcript: 'the words as spoken', final_text: text, in_book: inBook,
});

const child = await newChild(A, 'Asha', '2026-03-05', '2026-03-01');
await join(N, 'contributor', child, A);

// ── F1 / G-08: family members never read the birth date or due date ───────
{
  const dob = await codeOf(() => as(N, `select date_of_birth from public.children where id = $1`, [child]));
  const due = await codeOf(() => as(N, `select due_date from public.children where id = $1`, [child]));
  check(`[F1] a family member cannot select children.date_of_birth (${dob}) or due_date (${due})`, dob === '42501' && due === '42501');
  check('[F1] nor through select * (the whole row)', (await codeOf(() => as(N, `select * from public.children`))) === '42501');
  check('[F1] nor by filtering on them (no oracle in WHERE)',
    (await codeOf(() => as(N, `select id from public.children where date_of_birth > '2026-01-01'`))) === '42501'
    && (await codeOf(() => as(N, `select id from public.children order by due_date`))) === '42501');
  const r = await one(N, `select name, nickname from public.children where id = $1`, [child]);
  check('[D-039] a family member still reads the name and nickname', r?.name === 'Asha');
  const books = (await one(N, `select public.sync_books() r`)).r.books;
  const meta = (await pull(N)).books.find((b) => b.id === child).meta;
  check('[D-039] family get the birthday month and day only, through sync_books and sync_pull',
    books[0].date_of_birth === null && books[0].due_date === null && books[0].birthday_md === '03-05'
    && meta.date_of_birth === null && meta.due_date === null && meta.birthday_md === '03-05');
  const pBooks = (await one(A, `select public.sync_books() r`)).r.books;
  const pMeta = (await pull(A)).books.find((b) => b.id === child).meta;
  check('parents read both dates through sync_books and sync_pull',
    pBooks[0].date_of_birth === '2026-03-05' && pBooks[0].due_date === '2026-03-01'
    && pMeta.date_of_birth === '2026-03-05' && pMeta.due_date === '2026-03-01');
  check('nobody reads the two columns from the table directly, parents included (one rule for every API role)',
    (await codeOf(() => as(A, `select date_of_birth from public.children`))) === '42501');
  check('the service role (sys) still reads them', (await sys(`select date_of_birth::text d from children where id = $1`, [child])).rows[0].d === '2026-03-05');

  // Writes go through book_update (and sync_push book.update, which calls it); since 20261023060000 no client
  // updates children directly.
  await as(A, `select public.book_update($1, '{"due_date": "2026-02-27"}'::jsonb)`, [child]);
  check('a parent still sets the due date (book_update), and a direct update is refused (42501)',
    (await sys(`select due_date::text d from children where id = $1`, [child])).rows[0].d === '2026-02-27'
    && (await codeOf(() => as(A, `update public.children set due_date = '2026-02-28' where id = $1`, [child]))) === '42501');
  let res = await push(A, [op('book.update', child, { date_of_birth: '2026-03-06', due_date: '2026-03-02', nickname: 'Ashu' })]);
  const row = (await sys(`select date_of_birth::text dob, due_date::text due, nickname from children where id = $1`, [child])).rows[0];
  check('sync_push book.update still changes the dates and settings (through book_update)',
    res.results[0].ok && row.dob === '2026-03-06' && row.due === '2026-03-02' && row.nickname === 'Ashu');
  res = await push(A, [op('book.update', child, { nickname: 'Ashu' })]);
  check('a book.update that changes nothing is fine', res.results[0].ok);
  check('book.update by a family member is SCPAR, by a stranger P0002, unknown field 22023',
    (await push(N, [op('book.update', child, { name: 'Nani says' })])).results[0].code === 'SCPAR'
    && (await push(C, [op('book.update', child, { name: 'x' })])).results[0].code === 'P0002'
    && (await push(A, [op('book.update', child, { colour: 'red' })])).results[0].code === '22023');
  check('a family member\'s book_update is still SCPAR', (await codeOf(() => as(N, `select public.book_update($1, '{"name": "X"}'::jsonb)`, [child]))) === 'SCPAR');
  // Consent gate on book.update (was children_consent_gate; book_update calls it itself).
  const U = users.U;
  await sys(`insert into auth.users (id) values ($1) on conflict do nothing`, [U]);
  await sys(`insert into child_members (child_id, profile_id, role) values ($1, $2, 'parent')`, [await newChild(S, 'Asha', '2025-02-02'), U]);
  const uBook = (await sys(`select child_id from child_members where profile_id = $1`, [U])).rows[0].child_id;
  res = await push(U, [op('book.update', uBook, { nickname: 'Mi' })]);
  check('book.update without consent pauses the batch (SCCON), it is not rejected', res.paused === true && res.results.length === 0);
  check('book_update called on its own also refuses a family member (SCPAR)',
    (await codeOf(() => as(N, `select public.book_update($1, '{"nickname": "x"}')`, [child]))) === 'SCPAR');
}

// ── F2 (fixed in 20261005000000): stale invite, third parent, removal ─────
{
  await join(B, 'parent', child, A);
  const staleFromB = await invite(B, child, 'contributor');
  await as(B, `select public.leave_child($1)`, [child]);
  check('[F2b] an invite made by a parent who left is refused (SCINV)', (await codeOf(() => as(C, `select public.accept_child_invite($1)`, [staleFromB]))) === 'SCINV');
  await join(B, 'parent', child, A);
  check('[F2c] a third parent is refused (SCCAP)', (await codeOf(() => as(A, `select public.create_child_invite($1, 'parent')`, [child]))) === 'SCCAP');
  check('[F2d] a parent removes a family member', (await one(A, `select public.remove_child_member($1, $2) r`, [child, N])).r === 'removed');
  await join(N, 'contributor', child, A);
}

// ── F3 (fixed in 20261005000000): the client cannot reset its rate counter ─
{
  await pull(A);
  check('[F3] update of own sync_rate_windows is refused', (await codeOf(() => as(A, `update public.sync_rate_windows set hits = 0 where profile_id = $1`, [A]))) === '42501');
  check('[F3b] delete of own sync_rate_windows is refused', (await codeOf(() => as(A, `delete from public.sync_rate_windows where profile_id = $1`, [A]))) === '42501');
}

// ── F4 / G-10: op ids are per person ─────────────────────────────────────
{
  const sChild = await newChild(S, 'Ravi', '2025-01-01');
  const X = uuid7();
  check('[F4] a client cannot insert a receipt', (await codeOf(() => as(C, `insert into public.sync_op_receipts (op_id, profile_id) values ($1, $2)`, [X, C]))) === '42501');
  check('[F4] a client cannot delete a receipt', (await codeOf(() => as(C, `delete from public.sync_op_receipts where profile_id = $1`, [C]))) === '42501');
  // C claims X for itself (the only thing sync_op_claim can do); S's op X is still new for S.
  check('sync_op_claim: new is true, repeat is false', (await one(C, `select public.sync_op_claim($1) r`, [X])).r === true
    && (await one(C, `select public.sync_op_claim($1) r`, [X])).r === false);
  const id = uuid7();
  const res = await push(S, [{ op: X, type: 'entry.upsert', id, data: letterData(sChild, 'Hello Ravi', true) }]);
  const stored = (await sys(`select count(*)::int n from entries where id = $1`, [id])).rows[0].n;
  check(`[F4] S's op with the id C claimed is applied (dup=${res.results[0].dup}, stored=${stored})`, res.results[0].ok && !res.results[0].dup && stored === 1);
  const again = await push(S, [{ op: X, type: 'entry.upsert', id, data: letterData(sChild, 'Hello Ravi', true) }]);
  check('a retry of the same op by the same person is still a duplicate', again.results[0].dup === true);
  check('receipts are keyed (profile_id, op_id)', (await sys(`select count(*)::int n from sync_op_receipts where op_id = $1`, [X])).rows[0].n === 2);
  check('sync_op_claim needs an op id (22023)', (await codeOf(() => as(C, `select public.sync_op_claim(null)`))) === '22023');
  // Housekeeping trims by (person, op id): an old receipt of one person never removes another's fresh one.
  await sys(`update sync_op_receipts set applied_at = now() - interval '31 days' where op_id = $1 and profile_id = $2`, [X, C]);
  await sys(`select public.sync_housekeeping()`);
  check('housekeeping removes only the old receipt of that person',
    (await sys(`select profile_id from sync_op_receipts where op_id = $1`, [X])).rows.map((r) => r.profile_id).join() === S);
}

// ── F5 / G-09: the pull digest does not reveal private writes ────────────
{
  const b2 = await newChild(S, 'Asha', '2025-02-02');
  await join(P2, 'parent', b2, S);
  const first = await pull(P2);
  const book = first.books.find((b) => b.id === b2);
  const fake = { n: 999, sum: 1 };
  const req = (cur, have = fake, extra = {}) => ({ epoch: first.epoch, books: { [b2]: { cursor: cur, access: book.access, meta: book.meta_hash, have, ...extra } } });
  const quiet = (await pull(P2, req(book.cursor))).books[0];
  const priv = uuid7();
  await push(S, [op('entry.upsert', priv, letterData(b2, 'private', false))]);
  const afterInsert = (await pull(P2, req(book.cursor))).books[0];
  const edit = await push(S, [op('entry.upsert', priv, letterData(b2, 'private, edited', false), { changed: ['text'] })]);
  check('(the private edit was applied)', edit.results[0].ok && edit.results[0].applied);
  await push(S, [op('entry.delete', priv)]);
  const afterEdits = (await pull(P2, req(book.cursor))).books[0];
  check(`[F5] a private write, edit and delete never change the answer (echo ${JSON.stringify(quiet.visible)}, then ${JSON.stringify(afterInsert.visible)}, ${JSON.stringify(afterEdits.visible)})`,
    quiet.visible.n === 999 && afterInsert.visible.n === 999 && afterEdits.visible.n === 999 && afterInsert.rows.length === 0 && afterEdits.rows.length === 0);

  // Removal still works: a letter P2 held leaves the book, P2 gets the real digest and the id list.
  const shared = uuid7();
  await push(S, [op('entry.upsert', shared, letterData(b2, 'in the book', true))]);
  const got = await pull(P2, req(book.cursor, fake));
  const gotBook = got.books[0];
  check('a new in-book letter comes down with the real digest', gotBook.rows.some((r) => r.id === shared) && gotBook.visible.n === 1);
  const held = gotBook.visible;
  const quiet2 = (await pull(P2, req(gotBook.cursor, held))).books[0];
  check('nothing changed: the phone\'s own digest is echoed', JSON.stringify(quiet2.visible) === JSON.stringify(held));
  await push(S, [op('entry.upsert', shared, letterData(b2, 'in the book', false), { changed: ['in_book'] })]);
  const gone = (await pull(P2, req(gotBook.cursor, held))).books[0];
  check('[G-09] a letter taken out of the book gives the real digest (n 1 -> 0), with no row', gone.visible.n === 0 && gone.rows.length === 0);
  const ids = (await pull(P2, req(gotBook.cursor, held, { ids: true }))).books[0];
  check('and the id list no longer has it', Array.isArray(ids.ids) && !ids.ids.includes(shared));
  // A private edit of the now-private letter, seen with a cursor after its removal, changes nothing.
  check('(the later private edit was applied)', (await push(S, [op('entry.upsert', shared, letterData(b2, 'private again, edited', false), { changed: ['text'] })])).results[0].applied);
  const later = (await pull(P2, req(gone.cursor, fake))).books[0];
  check('[G-09] later private edits of a letter that left the book are not revealed', later.visible.n === 999);

  // Deleting an in-book letter stamps it too.
  const del = uuid7();
  await push(S, [op('entry.upsert', del, letterData(b2, 'to delete', true))]);
  const c1 = (await pull(P2, req(later.cursor, fake))).books[0];
  await push(S, [op('entry.delete', del)]);
  const c2 = (await pull(P2, req(c1.cursor, c1.visible))).books[0];
  check('a deleted in-book letter gives the real digest', c2.visible.n === c1.visible.n - 1);

  // Family: with "Family can read", a family member is told when a letter leaves the book;
  // a family letter waiting for review (parents only) leaving review is not shown to family.
  await sys(`update children set family_can_read = true where id = $1`, [child]);
  const n0 = await pull(N);
  const nb = n0.books.find((b) => b.id === child);
  const nreq = (cur, have, extra = {}) => ({ epoch: n0.epoch, books: { [child]: { cursor: cur, access: nb.access, meta: nb.meta_hash, have, ...extra } } });
  const famLetter = uuid7();
  await push(A, [op('entry.upsert', famLetter, letterData(child, 'for the family', true))]);
  const f1 = (await pull(N, nreq(nb.cursor, { n: 999, sum: 1 }))).books[0];
  await push(A, [op('entry.upsert', famLetter, letterData(child, 'for the family', false), { changed: ['in_book'] })]);
  const f2 = (await pull(N, nreq(f1.cursor, f1.visible))).books[0];
  check('[G-09] family: a letter that leaves the book gives the real digest', f2.visible.n === f1.visible.n - 1);
  // B's private letters are invisible to N: no change in N's answer.
  const bPriv = uuid7();
  await push(B, [op('entry.upsert', bPriv, letterData(child, 'just for me', false))]);
  const f3 = (await pull(N, nreq(f2.cursor, { n: 999, sum: 1 }))).books[0];
  check('[G-09] family: a co-parent\'s private letter is not revealed', f3.visible.n === 999);
  // Parents: a family letter waiting for review that is withdrawn leaves the parents' view.
  const pend = uuid7();
  await push(N, [op('entry.upsert', pend, letterData(child, 'from Nani', true))]);
  const p0 = await pull(A);
  const pb = p0.books.find((b) => b.id === child);
  check('parents see the pending family letter', pb.rows.some((r) => r.id === pend));
  const preq = (cur, have) => ({ epoch: p0.epoch, books: { [child]: { cursor: cur, access: pb.access, meta: pb.meta_hash, have } } });
  await as(N, `select public.withdraw_family_letter($1)`, [pend]);
  const p1 = (await pull(A, preq(pb.cursor, pb.visible))).books[0];
  check('[G-09] parents: a withdrawn family letter gives the real digest', p1.visible.n === pb.visible.n - 1);
  check('the stamps are system columns clients cannot set',
    (await as(S, `update public.entries set left_parents_xid = '1', left_family_xid = '1' where id = $1 returning left_parents_xid::text p, left_family_xid::text f`, [priv])).rows
      .every((r) => r.p === null && r.f === null));
}

// ── F6 (fixed in 20261005000000): no Storage move into another book ──────
{
  const own = await newChild(C, 'Kiran', '2025-03-03');
  const foreign = await newChild(S, 'Dev', '2025-04-04');
  await as(C, `insert into storage.objects (bucket_id, name) values ('entry-photos', $1)`, [`${own}/${C}/x.jpg`]);
  const code = await codeOf(() => as(C, `update storage.objects set name = $1 where name = $2`, [`${foreign}/${C}/x.jpg`, `${own}/${C}/x.jpg`]));
  const moved = (await sys(`select count(*)::int n from storage.objects where name = $1`, [`${foreign}/${C}/x.jpg`])).rows[0].n;
  check(`[F6] an object cannot be moved into another family's book folder (${code})`, moved === 0);
}

// ── DB-01 (PR #32 review): nobody writes through the reading views ───────
// On develop before 20261015000000 a co-parent could rewrite the other parent's
// in-book letter with `update book_entries` (the view runs as its owner, so the
// entries policies were skipped). K-10, F11-REQ-082: nobody edits another person's words.
{
  const id = uuid7();
  await push(A, [op('entry.upsert', id, letterData(child, 'Her own words.', true))]);
  check('(B, the co-parent, reads the letter through book_entries)',
    (await as(B, `select final_text from public.book_entries where id = $1`, [id])).rows[0]?.final_text === 'Her own words.');
  const upd = await codeOf(() => as(B, `update public.book_entries set final_text = 'Other words' where id = $1`, [id]));
  const del = await codeOf(() => as(B, `delete from public.book_entries where id = $1`, [id]));
  const ins = await codeOf(() => as(B, `insert into public.book_entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode,
      engine_version, final_text) values ($1, $2, $3, 'letter', '2026-01-01', now(), 'typed', 1, 'x')`, [uuid7(), child, B]));
  check(`[F11-REQ-082] the other parent cannot update, delete or insert through book_entries (${upd}, ${del}, ${ins})`,
    upd === '42501' && del === '42501' && ins === '42501');
  check('the author\'s words are unchanged', (await sys(`select final_text from entries where id = $1`, [id])).rows[0].final_text === 'Her own words.');
  check('nor through my_policy_state', (await codeOf(() => as(B, `delete from public.my_policy_state`))) !== 'ok'
    && (await sys(`select has_table_privilege('authenticated', 'public.my_policy_state', 'delete') d`)).rows[0].d === false);
}

// ── Run once: a second run stops instead of putting back older sync functions ──
{
  const file = process.argv.slice(2).find((f) => f.endsWith('20261015000000_v1_gate_membership_sync_hardening.sql'));
  const before = (await sys(`select md5(pg_get_functiondef('public.sync_push(jsonb)'::regprocedure)) h`)).rows[0].h;
  let code = 'ok';
  try { await t.db.exec(`begin; ${readFileSync(file, 'utf8')}; commit;`); } catch (e) { code = e.code; await t.db.exec('rollback'); }
  const after = (await sys(`select md5(pg_get_functiondef('public.sync_push(jsonb)'::regprocedure)) h`)).rows[0].h;
  check(`a second run of 20261015000000 stops (55000) and changes nothing (${code})`, code === '55000' && before === after);
  // Files 14 and 15 refuse a second run the same way; file 16 fails at its first constraint.
  for (const name of ['20261015010000_v1_gate_peek_invite_consent_pepper.sql', '20261015020000_v1_gate_coparent_invites_undo.sql',
                      '20261015030000_v1_wire_contract_columns.sql']) {
    const f = process.argv.slice(2).find((x) => x.endsWith(name));
    let c = 'ok';
    try { await t.db.exec(`begin; ${readFileSync(f, 'utf8')}; commit;`); } catch (e) { c = e.code; await t.db.exec('rollback'); }
    check(`a second run of ${name.slice(0, 14)} is refused (${c})`, name.startsWith('20261015030000') ? c !== 'ok' : c === '55000');
  }
  check('sync_push is still the wire-contract version after the attempts',
    (await sys(`select md5(pg_get_functiondef('public.sync_push(jsonb)'::regprocedure)) h`)).rows[0].h === before);
}

done();
