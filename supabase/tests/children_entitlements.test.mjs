// Children with device ids and the first-run batch (20261003010000_children_and_entitlements.sql),
// and Plus as decided on 3 Oct 2026 (20261004000000_plus_on_device_only.sql, ADR 0013): Plus is
// Apple only and checked on the device, so the server keeps no entitlement state and never
// refuses a book for Plus. Fictional family "Asha" only.
import { createDb, users, uuid7 } from './harness.mjs';

const { check, as, sys, one, codeOf, done, publishPolicies, consent, join } = await createDb(process.argv.slice(2));
const { A, B, C, N, S, U } = users;
await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}'),('${N}'),('${S}'),('${U}')`);
await publishPolicies();
for (const u of [A, B, C, N, S]) await consent(u);

const create = (uid, id, name = 'Asha', dob = '2025-04-12', due = null) =>
  as(uid, `select public.create_child($1, $2, $3::date, $4::date) as id`, [id, name, dob, due]).then((r) => r.rows[0].id);
const started = async (uid) => (await sys(`select count(*)::int n from children where created_by=$1 and deleted_at is null`, [uid])).rows[0].n;

// ── create_child (A-REQ-015, DATA-REQ-044, B-REQ-001) ─────────────────────
const first = uuid7();
check('[A-REQ-015] the book keeps the device id', (await create(A, first)) === first);
check('[DATA-REQ-044] a retry with the same id is idempotent', (await create(A, first)) === first && (await started(A)) === 1);
check('the old create_child(text, date) is gone', (await codeOf(() => as(A, `select public.create_child('Asha', '2025-04-12'::date)`))) === '42883');
check('a v4 id is refused', (await codeOf(() => create(A, '0b2f9e3c-5a7d-4c1e-9f00-123456789abc'))) === 'SCCID');
check('a v7 id with the wrong variant is refused', (await codeOf(() => create(A, uuid7().replace(/-(.)/g, (m, c, i) => (i === 18 ? '-c' : m)).slice(0, 36)))) === 'SCCID');
check('a v7 id from the future is refused', (await codeOf(() => create(A, uuid7(Date.now() + 3 * 86400e3)))) === 'SCCID');
check('another person\'s book id is refused without saying whose', (await codeOf(() => create(C, first))) === 'SCCID');
check('[B-REQ-001] a birthday or a due date is required', (await codeOf(() => create(C, uuid7(), 'Asha', null, null))) === '22023');
check('a name is required', (await codeOf(() => create(C, uuid7(), '  ', '2025-04-12'))) === '22023');
check('a future birthday is refused', (await codeOf(() => create(C, uuid7(), 'Asha', '2099-01-01'))) === '22023');
const expecting = await create(C, uuid7(), 'Asha', null, new Date(Date.now() + 90 * 86400e3).toISOString().slice(0, 10));
check('[B-REQ-005] a book can start from a due date', (await sys(`select due_date is not null and date_of_birth is null ok from children where id=$1`, [expecting])).rows[0].ok);
check('[LEGAL-REQ-001] no book before consent (SCCON)', (await codeOf(() => create(U, uuid7()))) === 'SCCON');
check('children without a date are refused at the table too', (await codeOf(() => sys(`insert into children (id, name, created_by) values ($1, 'Asha', $2)`, [uuid7(), A]))) === '23514');

// ── Plus is checked on the device only (ADR 0013, founder decision 3) ─────
check('[ADR 0013] a second book is never refused by the server (Plus is decided on the device)', (await codeOf(() => create(A, uuid7()))) === 'ok' && (await started(A)) === 2);
await join(B, 'parent', first, A);
check('[PRD-REQ-015] a book joined as co-parent is not created_by the co-parent', (await sys(`select count(*)::int n from children where created_by=$1`, [B])).rows[0].n === 0);
check('the co-parent starts books of their own', (await codeOf(() => create(B, uuid7()))) === 'ok' && (await codeOf(() => create(B, uuid7()))) === 'ok');
check('the first-run batch is closed by the first book', (await sys(`select first_run_closed_at is not null c from profiles where id=$1`, [A])).rows[0].c);
check('a person cannot reopen their first-run batch', (await codeOf(() => as(A, `update profiles set first_run_closed_at=null where id=$1`, [A]))) === 'SCIMM');
check('a person can still edit their own profile', (await codeOf(() => as(A, `update profiles set signs_as='Papa' where id=$1`, [A]))) === 'ok');

// First-run batch: twins and siblings added together, in one call.
const twins = [uuid7(), uuid7(), uuid7()];
const batch = JSON.stringify(twins.map((id, i) => ({ id, name: `Asha ${i + 1}`, date_of_birth: '2025-04-12', due_date: null })));
const made = (await one(N, `select public.create_first_run_children($1::jsonb) ids`, [batch])).ids;
check('[PRD-REQ-015] every child in the first-run batch is created', made.length === 3 && (await started(N)) === 3);
check('[DATA-REQ-044] replaying the batch returns the same ids', (await one(N, `select public.create_first_run_children($1::jsonb) ids`, [batch])).ids.join() === made.join() && (await started(N)) === 3);
check('the batch closes first run (sync_books reports first_run_open = false)',
  (await one(N, `select (public.sync_books() ->> 'first_run_open')::boolean o`)).o === false);
const later = JSON.stringify([{ id: uuid7(), name: 'Asha', date_of_birth: '2025-04-12' }]);
check('[ADR 0013] a later batch is not refused by the server either', (await codeOf(() => as(N, `select public.create_first_run_children($1::jsonb)`, [later]))) === 'ok' && (await started(N)) === 4);
check('the batch is capped at 6', (await codeOf(() => as(S, `select public.create_first_run_children($1::jsonb)`,
  [JSON.stringify(Array.from({ length: 7 }, () => ({ id: uuid7(), name: 'Asha', date_of_birth: '2025-04-12' })))]))) === '22023');
const bad = JSON.stringify([{ id: uuid7(), name: 'Asha', date_of_birth: '2025-04-12' }, { id: uuid7(), name: '', date_of_birth: '2025-04-12' }]);
check('a batch is all or nothing', (await codeOf(() => as(S, `select public.create_first_run_children($1::jsonb)`, [bad]))) === '22023' && (await started(S)) === 0
  && (await sys(`select first_run_closed_at is null o from profiles where id=$1`, [S])).rows[0].o);
check('first run is open before any book', (await one(S, `select (public.sync_books() ->> 'first_run_open')::boolean o`)).o === true);

// ── No server entitlement state remains ───────────────────────────────────
const gone = (await sys(`select to_regclass('public.store_subscriptions') a, to_regclass('public.store_notifications') b,
  to_regclass('public.app_account_tokens') c`)).rows[0];
check('[ADR 0013] the App Store entitlement tables are gone', gone.a === null && gone.b === null && gone.c === null);
const fns = (await sys(`select coalesce(string_agg(p.proname, ',' order by p.proname), '') f from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname in ('apply_store_transaction', 'my_app_account_token', 'get_plan_state', 'has_plus',
    'book_has_plus', 'store_environment_allowed')`)).rows[0].f;
check('[ADR 0013] no entitlement functions remain', fns === '' || console.log(`      still present: ${fns}`));
const scpls = (await sys(`select coalesce(string_agg(p.proname, ','), '') f from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosrc ~ 'SCPLS|has_plus|store_subscriptions|store_notifications|app_account_tokens'`)).rows[0].f;
check('[ADR 0013] no function enforces or reads Plus on the server', scpls === '' || console.log(`      still referencing Plus: ${scpls}`));
check('only the 5-argument create_child_row exists', (await sys(`select count(*)::int n from pg_proc where proname = 'create_child_row'`)).rows[0].n === 1);
check('users cannot call create_child_row', (await codeOf(() => as(A, `select public.create_child_row($1, $2, 'Asha', '2025-04-12', null)`, [A, uuid7()]))) === '42501');

// The purge job ran over the notification ledger; it must still run without it.
check('purge_due runs without the notification ledger', (await codeOf(() => sys(`select public.purge_due()`))) === 'ok');

// A lapse is invisible to the server: existing books stay writable (C-REQ-028).
check('[C-REQ-028] existing books stay writable', (await codeOf(() => as(A, `update children set nickname='Ashu' where id=$1`, [first]))) === 'ok');

// Account deletion no longer has a purchase ledger to pseudonymise.
await sys(`update children set deleted_at = now() where created_by=$1`, [A]);
check('account deletion still removes the person', (await codeOf(() => sys(`delete from auth.users where id=$1`, [A]))) === 'ok'
  && (await sys(`select 1 from profiles where id=$1`, [A])).rows.length === 0);

done();
