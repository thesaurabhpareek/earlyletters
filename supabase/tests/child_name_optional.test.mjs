// A child's name is optional on the server; the date stays required (NX-31 R3 and R28, founder 9 Nov 2026).
// 20261109000000_child_name_optional.sql: children.name stays NOT NULL, may be '' (the phone stores ''),
// is at most 60 characters; create_child_row, which create_child and create_first_run_children call,
// accepts an empty name. Fictional family "Asha" only.
import { createDb, users, uuid7 } from './harness.mjs';

const { check, as, sys, codeOf, done, publishPolicies, consent } = await createDb(process.argv.slice(2));
const { A, B, C, S } = users;
await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}'),('${S}')`);
await publishPolicies();
for (const u of [A, B, C, S]) await consent(u);
const why = (fn) => fn().then(() => 'ok', (e) => `${e.code}: ${e.message}`);

const create = (uid, id, name, dob = '2025-04-12', due = null) =>
  as(uid, `select public.create_child($1, $2, $3::date, $4::date) as id`, [id, name, dob, due]).then((r) => r.rows[0].id);
const stored = async (id) => (await sys(`select name, date_of_birth::text d from children where id=$1`, [id])).rows[0];

const empty = uuid7();
check('[NX-31-R28] the server accepts a child with an empty name and a date',
  (await codeOf(() => create(A, empty, ''))) === 'ok' && (await stored(empty))?.name === '' && (await stored(empty))?.d === '2025-04-12');
check('[NX-31-R28] the server still refuses a child without a date',
  (await why(() => create(A, uuid7(), '', null, null))) === '22023: a birthday or a due date is needed'
  && (await why(() => create(A, uuid7(), 'Asha', null, null))) === '22023: a birthday or a due date is needed');
check('[NX-31-R28] a 61 character name is still refused',
  (await why(() => create(A, uuid7(), 'a'.repeat(61)))) === '22023: name must be at most 60 characters'
  && (await codeOf(() => sys(`insert into children (id, name, date_of_birth, created_by) values ($1, $2, '2025-04-12', $3)`, [uuid7(), 'a'.repeat(61), A]))) === '23514');

// Edges around the rule.
check('[NX-31-R28] a 60 character name is accepted', (await codeOf(() => create(A, uuid7(), 'a'.repeat(60)))) === 'ok');
const blank = uuid7();
check('[NX-31-R28] a name of spaces is stored as empty, never as a placeholder',
  (await codeOf(() => create(B, blank, '   '))) === 'ok' && (await stored(blank))?.name === '');
const missing = uuid7();
check('[NX-31-R28] a missing name is stored as empty (the column stays NOT NULL)',
  (await codeOf(() => as(B, `select public.create_child($1, null, '2025-04-12'::date, null)`, [missing]))) === 'ok' && (await stored(missing))?.name === '');
check('[NX-31-R28] the column still refuses NULL', (await codeOf(() => sys(`insert into children (id, name, date_of_birth, created_by) values ($1, null, '2025-04-12', $2)`, [uuid7(), A]))) === '23502');
check('[NX-31-R28] an empty-name create is idempotent on retry', (await codeOf(() => create(A, empty, ''))) === 'ok'
  && (await sys(`select count(*)::int n from children where id=$1`, [empty])).rows[0].n === 1);
check('[NX-31-R28] consent is still needed before an empty-name book', (await codeOf(() => create(users.U, uuid7(), ''))) === 'SCCON');

// First run: the batch RPC the phone calls.
const batch = JSON.stringify([{ id: uuid7(), name: '', date_of_birth: '2025-04-12' }, { id: uuid7(), name: 'Asha', due_date: null, date_of_birth: '2025-04-12' }]);
check('[NX-31-R28] create_first_run_children accepts an empty name',
  (await codeOf(() => as(C, `select public.create_first_run_children($1::jsonb)`, [batch]))) === 'ok'
  && (await sys(`select count(*)::int n from children where created_by=$1 and name=''`, [C])).rows[0].n === 1);
const noDate = JSON.stringify([{ id: uuid7(), name: '' }]);
check('[NX-31-R28] create_first_run_children still refuses a book without a date', (await why(() => as(S, `select public.create_first_run_children($1::jsonb)`, [noDate]))) === '22023: a birthday or a due date is needed');

// Later edit: set or clear the name through book_update.
check('[NX-31-R28] a later edit may set the name', (await codeOf(() => as(A, `select public.book_update($1, '{"name": "Asha"}'::jsonb)`, [empty]))) === 'ok' && (await stored(empty))?.name === 'Asha');
check('[NX-31-R28] a later edit may clear the name', (await codeOf(() => as(A, `select public.book_update($1, '{"name": ""}'::jsonb)`, [empty]))) === 'ok' && (await stored(empty))?.name === '');
check('[NX-31-R28] a later edit still cannot pass 60 characters', (await codeOf(() => as(A, `select public.book_update($1, $2::jsonb)`, [empty, JSON.stringify({ name: 'a'.repeat(61) })]))) === '23514');
check('[NX-31-R28] a later edit trims the name, like create',
  (await codeOf(() => as(A, `select public.book_update($1, '{"name": "  Asha  "}'::jsonb)`, [empty]))) === 'ok' && (await stored(empty))?.name === 'Asha');
check('[NX-31-R28] a later edit of spaces only, or null, stores the empty string, like create',
  (await codeOf(() => as(A, `select public.book_update($1, '{"name": "   "}'::jsonb)`, [empty]))) === 'ok' && (await stored(empty))?.name === ''
  && (await codeOf(() => as(A, `select public.book_update($1, '{"name": "Asha"}'::jsonb)`, [empty]))) === 'ok'
  && (await codeOf(() => as(A, `select public.book_update($1, '{"name": null}'::jsonb)`, [empty]))) === 'ok' && (await stored(empty))?.name === '');
check('[NX-31-R28] a later edit of 60 characters plus spaces is accepted, 61 after trimming is refused',
  (await codeOf(() => as(A, `select public.book_update($1, $2::jsonb)`, [empty, JSON.stringify({ name: ' ' + 'a'.repeat(60) + ' ' })]))) === 'ok'
  && (await stored(empty))?.name === 'a'.repeat(60)
  && (await codeOf(() => as(A, `select public.book_update($1, $2::jsonb)`, [empty, JSON.stringify({ name: ' ' + 'a'.repeat(61) })]))) === '23514');

// Access rules are unchanged: nobody but the server's own code calls the row writer.
check('[NX-31-R28] users still cannot call create_child_row', (await codeOf(() => as(A, `select public.create_child_row($1, $2, '', '2025-04-12', null)`, [A, uuid7()]))) === '42501');
const cfg = (await sys(`select p.proconfig cfg, p.prosecdef def from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='create_child_row'`)).rows[0];
check('[NX-31-R28] create_child_row stays a definer with pg_temp last', cfg.def === true && /search_path=pg_catalog, public, pg_temp/.test((cfg.cfg ?? []).join('|')));

// Post-apply check: the old 1-to-60 rule is really gone and children_name_check is the new one.
// A hosted project that named the old constraint differently would keep both and fail here.
const checks = (await sys(`select conname, pg_get_constraintdef(oid) def from pg_constraint where conrelid='public.children'::regclass and contype='c' and pg_get_constraintdef(oid) ~ '\\(name[) ,]'`)).rows;
check('[NX-31-R28] exactly one check mentions name, children_name_check, and it is <= 60 only',
  checks.length === 1 && checks[0].conname === 'children_name_check'
  && /char_length\(name\) <= 60/.test(checks[0].def) && !/>= 1|> 0|between/i.test(checks[0].def));

done();
