// Children with device ids, the server Plus rule, and Apple entitlements
// (20261003010000_children_and_entitlements.sql). Fictional family "Asha" only.
import { createDb, users, uuid7 } from './harness.mjs';

const { check, as, sys, one, codeOf, done, publishPolicies, consent, join } = await createDb(process.argv.slice(2));
const { A, B, C, N, S, U } = users;
await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}'),('${N}'),('${S}'),('${U}')`);
await publishPolicies();
for (const u of [A, B, C, N, S]) await consent(u);
// DB-07: profile deletion needs the consent pepper; the suite sets a test value.
await sys(`select set_config('app.consent_pepper', 'test-pepper-0123456789abcdef0123456789', false)`);

const create = (uid, id, name = 'Asha', dob = '2025-05-20', due = null) =>
  as(uid, `select public.create_child($1, $2, $3::date, $4::date) as id`, [id, name, dob, due]).then((r) => r.rows[0].id);
const started = async (uid) => (await sys(`select count(*)::int n from children where created_by=$1 and deleted_at is null`, [uid])).rows[0].n;

// ── create_child (A-REQ-015, DATA-REQ-044, B-REQ-001) ─────────────────────
const first = uuid7();
check('[A-REQ-015] the book keeps the device id', (await create(A, first)) === first);
check('[DATA-REQ-044] a retry with the same id is idempotent', (await create(A, first)) === first && (await started(A)) === 1);
check('the old create_child(text, date) is gone', (await codeOf(() => as(A, `select public.create_child('Asha', '2025-05-20'::date)`))) === '42883');
check('a v4 id is refused', (await codeOf(() => create(A, '0b2f9e3c-5a7d-4c1e-9f00-123456789abc'))) === 'SCCID');
check('a v7 id with the wrong variant is refused', (await codeOf(() => create(A, uuid7().replace(/-(.)/g, (m, c, i) => (i === 18 ? '-c' : m)).slice(0, 36)))) === 'SCCID');
check('a v7 id from the future is refused', (await codeOf(() => create(A, uuid7(Date.now() + 3 * 86400e3)))) === 'SCCID');
check('another person\'s book id is refused without saying whose', (await codeOf(() => create(C, first))) === 'SCCID');
check('[B-REQ-001] a birthday or a due date is required', (await codeOf(() => create(C, uuid7(), 'Asha', null, null))) === '22023');
check('a name is required', (await codeOf(() => create(C, uuid7(), '  ', '2025-05-20'))) === '22023');
check('a future birthday is refused', (await codeOf(() => create(C, uuid7(), 'Asha', '2099-01-01'))) === '22023');
const expecting = await create(C, uuid7(), 'Asha', null, new Date(Date.now() + 90 * 86400e3).toISOString().slice(0, 10));
check('[B-REQ-005] a book can start from a due date', (await sys(`select due_date is not null and date_of_birth is null ok from children where id=$1`, [expecting])).rows[0].ok);
check('[LEGAL-REQ-001] no book before consent (SCCON)', (await codeOf(() => create(U, uuid7()))) === 'SCCON');
check('children without a date are refused at the table too', (await codeOf(() => sys(`insert into children (id, name, created_by) values ($1, 'Asha', $2)`, [uuid7(), A]))) === '23514');

// ── Plus rule (PRD-REQ-015, K-28) ─────────────────────────────────────────
check('[PRD-REQ-015] a second book needs Plus (SCPLS)', (await codeOf(() => create(A, uuid7()))) === 'SCPLS');
await join(B, 'parent', first, A);
check('[PRD-REQ-015] a book joined as co-parent does not count: B starts one free', (await codeOf(() => create(B, uuid7()))) === 'ok');
check('[PRD-REQ-015] B\'s next book needs Plus', (await codeOf(() => create(B, uuid7()))) === 'SCPLS');
check('the first-run batch is closed by the first book', (await sys(`select first_run_closed_at is not null c from profiles where id=$1`, [A])).rows[0].c);
check('a person cannot reopen their first-run batch', (await codeOf(() => as(A, `update profiles set first_run_closed_at=null where id=$1`, [A]))) === 'SCIMM');
check('a person can still edit their own profile', (await codeOf(() => as(A, `update profiles set signs_as='Papa' where id=$1`, [A]))) === 'ok');

// First-run batch: twins and siblings added together are all free.
const twins = [uuid7(), uuid7(), uuid7()];
const batch = JSON.stringify(twins.map((id, i) => ({ id, name: `Asha ${i + 1}`, date_of_birth: '2025-05-20', due_date: null })));
const made = (await one(N, `select public.create_first_run_children($1::jsonb) ids`, [batch])).ids;
check('[PRD-REQ-015] every child in the first-run batch is free', made.length === 3 && (await started(N)) === 3);
check('[DATA-REQ-044] replaying the batch returns the same ids', (await one(N, `select public.create_first_run_children($1::jsonb) ids`, [batch])).ids.join() === made.join() && (await started(N)) === 3);
const later = JSON.stringify([{ id: uuid7(), name: 'Asha', date_of_birth: '2025-05-20' }]);
check('[PRD-REQ-015] the batch is one-time: a later batch follows the Plus rule', (await codeOf(() => as(N, `select public.create_first_run_children($1::jsonb)`, [later]))) === 'SCPLS');
check('the batch is capped at 6', (await codeOf(() => as(S, `select public.create_first_run_children($1::jsonb)`,
  [JSON.stringify(Array.from({ length: 7 }, () => ({ id: uuid7(), name: 'Asha', date_of_birth: '2025-05-20' })))]))) === '22023');
const bad = JSON.stringify([{ id: uuid7(), name: 'Asha', date_of_birth: '2025-05-20' }, { id: uuid7(), name: '', date_of_birth: '2025-05-20' }]);
check('a batch is all or nothing', (await codeOf(() => as(S, `select public.create_first_run_children($1::jsonb)`, [bad]))) === '22023' && (await started(S)) === 0
  && (await sys(`select first_run_closed_at is null o from profiles where id=$1`, [S])).rows[0].o);

// ── Entitlements: StoreKit 2 + App Store Server Notifications V2 ─────────
const token = (await one(A, `select public.my_app_account_token() t`)).t;
check('[TDD 08 3.2] the appAccountToken is random and stable, never the profile id',
  token !== A && (await one(A, `select public.my_app_account_token() t`)).t === token);
const apply = (o) => sys(`select public.apply_store_transaction($1, $2, $3, $4::timestamptz, $5, $6, $7, $8, $9, $10::timestamptz, $11::timestamptz, $12, null, 'USA') r`,
  [o.uuid ?? null, o.type ?? 'SUBSCRIBED', o.subtype ?? null, o.signed, o.env ?? 'production', o.otid ?? '2000000123456789', o.token ?? token,
   o.product ?? 'el_plus_annual_2999', o.status, o.expires ?? null, o.grace ?? null, o.renew ?? true]).then((r) => r.rows[0].r);
const iso = (days) => new Date(Date.now() + days * 86400e3).toISOString();
const n1 = '00000000-0000-4000-8000-000000000001';

check('users cannot write entitlements directly', (await codeOf(() => as(A, `insert into store_subscriptions (original_transaction_id, profile_id, product_id, status, environment, last_signed_at) values ('1', $1, 'p', 'active', 'production', now())`, [A]))) !== 'ok');
check('users cannot call apply_store_transaction', (await codeOf(() => as(A, `select public.apply_store_transaction(null, 'SUBSCRIBED', null, now(), 'production', '1', null, 'p', 'active', now())`))) === '42501');
check('users cannot call has_plus for anyone', (await codeOf(() => as(A, `select public.has_plus($1)`, [B]))) === '42501');
check('users cannot read the subscription or notification tables',
  (await as(A, `select 1 from store_subscriptions union all select 1 from store_notifications union all select 1 from app_account_tokens`)).rows.length === 0);

check('[K-28] no Plus before a purchase', (await one(A, `select has_plus from public.get_plan_state()`)).has_plus === false);
const r1 = await apply({ uuid: n1, signed: iso(-1 / 24), status: 'trial', expires: iso(30) });
check('a trial notification maps to the person through the appAccountToken', r1.outcome === 'applied' && (await one(A, `select has_plus, status from public.get_plan_state()`)).status === 'trial');
check('[C-NFR-002] a duplicate notification is ignored', (await apply({ uuid: n1, signed: iso(-1 / 24), status: 'expired', expires: iso(-1) })).duplicate === true
  && (await one(A, `select has_plus from public.get_plan_state()`)).has_plus === true);
check('[K-28] the book has Plus for its members, including contributors and co-parents',
  (await one(B, `select public.book_has_plus($1) p`, [first])).p === true);
check('book_has_plus says nothing to non-members', (await one(C, `select public.book_has_plus($1) p`, [first])).p === false);
check('[PRD-REQ-015] with Plus, a second book is allowed', (await codeOf(() => create(A, uuid7()))) === 'ok');
check('a stale notification signed before the stored state changes nothing',
  (await apply({ uuid: '00000000-0000-4000-8000-000000000002', signed: iso(-2), status: 'expired', expires: iso(-1) })).outcome === 'stale'
  && (await one(A, `select status from public.get_plan_state()`)).status === 'trial');
await apply({ uuid: '00000000-0000-4000-8000-000000000003', type: 'DID_FAIL_TO_RENEW', subtype: 'GRACE_PERIOD', signed: iso(0), status: 'grace', expires: iso(-1), grace: iso(10) });
check('[C-REQ-027] billing grace keeps Plus', (await one(A, `select has_plus, status from public.get_plan_state()`)).has_plus === true);
await apply({ uuid: '00000000-0000-4000-8000-000000000004', type: 'REFUND', signed: iso(1 / 24), status: 'refunded', expires: iso(-1) });
check('[C-REQ-029] a refund ends Plus', (await one(A, `select has_plus, status from public.get_plan_state()`)).has_plus === false);
check('[C-REQ-028] lapse never closes a book: existing books stay writable', (await codeOf(() => as(A, `update children set nickname='Ashu' where id=$1`, [first]))) === 'ok');
check('[PRD-REQ-015] after the refund a further new book needs Plus again', (await codeOf(() => create(A, uuid7()))) === 'SCPLS');

check('production ignores sandbox purchases', (await apply({ uuid: '00000000-0000-4000-8000-000000000005', env: 'sandbox', otid: '1000000000000001', signed: iso(0), status: 'active', expires: iso(30) })).outcome === 'environment_mismatch'
  && (await one(A, `select has_plus from public.get_plan_state()`)).has_plus === false);
check('an unknown appAccountToken is stored unmapped', (await apply({ uuid: '00000000-0000-4000-8000-000000000006', token: '00000000-0000-4000-8000-0000000000ff', otid: '3000000000000001', signed: iso(0), status: 'active', expires: iso(30) })).outcome === 'unmapped');
check('the notification ledger keeps ids and outcomes, never payloads',
  (await sys(`select count(*)::int n from store_notifications where outcome is not null`)).rows[0].n === 6
  && (await sys(`select count(*)::int n from information_schema.columns where table_name='store_notifications' and column_name ~ 'payload|price|receipt|jws'`)).rows[0].n === 0);
check('bad status values are refused', (await codeOf(() => apply({ signed: iso(0), status: 'gifted', expires: iso(1) }))) === '23514');

check('dev and staging count sandbox purchases when app.store_environment = sandbox',
  await (async () => { await sys(`set app.store_environment = 'sandbox'`);
    const ok = (await apply({ uuid: '00000000-0000-4000-8000-000000000007', env: 'sandbox', otid: '1000000000000001', signed: iso(0), status: 'active', expires: iso(30) })).outcome === 'applied'
      && (await one(A, `select has_plus from public.get_plan_state()`)).has_plus === true;
    await sys(`reset app.store_environment`);
    return ok && (await one(A, `select has_plus from public.get_plan_state()`)).has_plus === false; })());

// Account deletion pseudonymises the purchase ledger (books were removed by prepare_account_purge first).
await sys(`update children set deleted_at = now() where created_by=$1`, [A]);
await sys(`delete from auth.users where id=$1`, [A]);
check('account deletion keeps the transaction but drops the person', (await sys(`select profile_id from store_subscriptions where original_transaction_id='2000000123456789'`)).rows[0].profile_id === null
  && (await sys(`select 1 from app_account_tokens where profile_id=$1`, [A])).rows.length === 0);

done();
