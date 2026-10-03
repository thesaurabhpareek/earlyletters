// Children with device ids (20261003010000_children_and_entitlements.sql), and
// founder decision 3: payments are StoreKit 2 on the device, so the server holds no
// entitlement objects and never enforces Plus. Fictional family "Asha" only.
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
check('children without a date are refused at the table too', (await codeOf(() => sys(`insert into children (id, name, created_by) values ($1, 'Asha', $2)`, [uuid7(), A]))) === '23514');

// ── No server-side Plus (founder decision 3, docs/agents/BRIEF-2026-10-03.md) ──
check('[decision 3] a second and third book need no server-side Plus', (await codeOf(() => create(A, uuid7()))) === 'ok'
  && (await codeOf(() => create(A, uuid7()))) === 'ok' && (await started(A)) === 3);
await join(B, 'parent', first, A);
check('a co-parent starts their own books freely too', (await codeOf(() => create(B, uuid7()))) === 'ok');
check('a person can still edit their own profile', (await codeOf(() => as(A, `update profiles set signs_as='Papa' where id=$1`, [A]))) === 'ok');
check('profile id and created_at stay server-owned (SCIMM)', (await codeOf(() => as(A, `update profiles set created_at=now() - interval '1 year' where id=$1`, [A]))) === 'SCIMM');
const gone = (await sys(`select to_regclass('public.store_subscriptions') a, to_regclass('public.store_notifications') b, to_regclass('public.app_account_tokens') c`)).rows[0];
check('[decision 3] no entitlement tables exist', gone.a === null && gone.b === null && gone.c === null);
const fns = (await sys(`select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'
  and p.proname in ('has_plus', 'book_has_plus', 'get_plan_state', 'my_app_account_token', 'apply_store_transaction',
                    'store_environment_allowed', 'create_first_run_children', 'create_child_row')`)).rows.map((r) => r.proname);
for (const f of fns) console.log(`      still defined: ${f}`);
check('[decision 3] no plan, purchase or first-run functions exist', fns.length === 0);
const scpls = (await sys(`select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prosrc ~ 'SCPLS'`)).rows;
check('[decision 3] no function raises SCPLS', scpls.length === 0);
check('no first_run_closed_at column', (await sys(`select 1 from information_schema.columns where table_name='profiles' and column_name='first_run_closed_at'`)).rows.length === 0);

done();
