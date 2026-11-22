// CR-71 C3 (20261111010000): the audit actions nothing wrote, and ops.security_events. Fictional family "Asha" only.
//   [C3-AUD] legal_hold_placed / legal_hold_released / support_access / export_created are written by what performs them.
//   [C3-SEC] security_events is service-only, content-free, append-only, 12 months, one threshold of 20 in an hour.
// Each P0 row carries one in-file mutant (the guard is taken away and the same attempt must then succeed).
import { createDb, users } from './harness.mjs';

const { db, check, as, asAnon, sys, codeOf, done, publishPolicies, consent, newChild } = await createDb(process.argv.slice(2));
const { A, B } = users;
await sys(`insert into auth.users values ('${A}'),('${B}')`);
await publishPolicies();
for (const u of [A, B]) await consent(u);
const CHILD = await newChild(A);
const svc = async (sql, params = []) => { await sys('set role service_role'); try { return await sys(sql, params); } finally { await sys('reset role'); } };
const rows = async (action) => (await sys(`select * from audit_events where action = $1 order by id`, [action])).rows;
const HEX = 'ab'.repeat(32);

// -- Legal holds -------------------------------------------------------------
const hold = (await sys(`insert into legal_holds (scope, scope_id, reason_code, matter_ref, placed_by, review_by)
  values ('child', $1, 'litigation', 'T-77', 'ops@asha.example', current_date + 30) returning id`, [CHILD])).rows[0].id;
let r = await rows('legal_hold_placed');
check('[C3-AUD] placing a hold writes one legal_hold_placed row: support, no actor, the book, scope and reason only',
  r.length === 1 && r[0].actor_kind === 'support' && r[0].actor_id === null && r[0].subject_id === hold && r[0].child_id === CHILD
  && JSON.stringify(Object.keys(r[0].detail).sort()) === '["reason_code","scope"]' && !JSON.stringify(r[0]).includes('T-77') && !JSON.stringify(r[0]).includes('asha.example'));
await sys(`update legal_holds set review_by = review_by + 7 where id = $1`, [hold]);
check('[C3-AUD] changing a hold other than releasing it writes nothing', (await rows('legal_hold_released')).length === 0);
await sys(`update legal_holds set released_at = now(), released_by = 'ops@asha.example' where id = $1`, [hold]);
check('[C3-AUD] releasing a hold writes one legal_hold_released row', (await rows('legal_hold_released')).length === 1);
const hold2 = (await sys(`insert into legal_holds (scope, scope_id, reason_code, matter_ref, placed_by, review_by)
  values ('profile', $1, 'regulator', 'T-79', 'ops', current_date + 30) returning id`, [A])).rows[0].id;
await sys('delete from legal_holds where id = $1', [hold2]);
r = await rows('legal_hold_released');
check('[C3-AUD] deleting a still-active hold writes a legal_hold_released row for it', r.length === 2 && r[1].subject_id === hold2 && r[1].detail.deleted === true);
await sys('alter table legal_holds disable trigger legal_holds_audit');
await sys(`insert into legal_holds (scope, scope_id, reason_code, matter_ref, placed_by, review_by) values ('profile', $1, 'other', 'T-78', 'ops', current_date + 30)`, [B]);
check('[C3-AUD] mutant: with the trigger off a hold writes no row, so the check above can fail', (await rows('legal_hold_placed')).length === 2);
await sys('alter table legal_holds enable trigger legal_holds_audit');

// -- Support access ----------------------------------------------------------
const sa = await svc(`select public.ops_support_access('ops@asha.example', 'T-80', 'subject_request', 'profile', $1, $2) id`, [B, CHILD]);
r = await rows('support_access');
const log = (await sys(`select * from ops.audit_log where runbook = 'break_glass' and ticket = 'T-80'`)).rows;
check('[C3-AUD] support access writes the ops.audit_log row and one support_access row, reason only',
  r.length === 1 && r[0].id === sa.rows[0].id && r[0].actor_kind === 'support' && JSON.stringify(r[0].detail) === '{"reason_code":"subject_request"}'
  && log.length === 1 && log[0].target_profile === B);
for (const [what, args] of [['a ticket-less call', `'ops', '', 'subject_request'`], ['a ticket with spaces and text', `'ops', 'the child said hello', 'subject_request'`],
  ['a free-text reason', `'ops', 'T-1', 'Asha laughed at the dog'`], ['an email as operator', `'a b@asha.example', 'T-1', 'subject_request'`]]) {
  check(`[C3-AUD] ${what} to support access is refused (22023) and writes no row`,
    (await codeOf(() => svc(`select public.ops_support_access(${args}, 'profile', $1)`, [B]))) === '22023' && (await rows('support_access')).length === 1);
}
check('[C3-AUD] an unknown subject type is refused (22023)', (await codeOf(() => svc(`select public.ops_support_access('ops', 'T-1', 'subject_request', 'raw_transcript', $1)`, [B]))) === '22023');
check('[C3-AUD] a signed-in person cannot call ops_support_access (42501)',
  (await codeOf(() => as(A, `select public.ops_support_access('a', 'T-1', 'x', 'profile', $1)`, [A]))) === '42501');
check('[C3-AUD] anon cannot call ops_support_access (42501)', (await codeOf(() => asAnon(`select public.ops_support_access('a', 'T-1', 'x', 'profile', $1)`, [A]))) === '42501');

// -- Export ------------------------------------------------------------------
const exp = (uid, files = 3, bytes = 4096, sha = HEX) => as(uid, `select public.record_export_created($1, $2, $3) ok`, [files, bytes, sha]);
check('[C3-AUD] a signed-in export writes one row: own actor, files, bytes and the manifest hash only',
  (await exp(A)).rows[0].ok === true && (await rows('export_created')).length === 1);
r = (await rows('export_created'))[0];
check('[C3-AUD] the export row is the caller\'s and holds exactly files, bytes, manifest_sha256, source',
  r.actor_id === A && r.actor_kind === 'user' && r.detail.source === 'device' && JSON.stringify(Object.keys(r.detail).sort()) === '["bytes","files","manifest_sha256","source"]');
check('[C3-AUD] a bad manifest hash is refused (22023)', (await codeOf(() => exp(A, 3, 1, 'not-a-hash'))) === '22023');
check('[C3-AUD] a negative size is refused (22023)', (await codeOf(() => exp(A, 3, -1))) === '22023');
check('[C3-AUD] anon cannot record an export (42501)', (await codeOf(() => asAnon(`select public.record_export_created(1, 1, $1)`, [HEX]))) === '42501');
check('[C3-AUD] service_role cannot record an export for a person (42501)', (await codeOf(() => svc(`select public.record_export_created(1, 1, $1)`, [HEX]))) === '42501');
for (let i = 0; i < 4; i++) await exp(A);
check('[C3-AUD] the sixth export in a day writes nothing and returns false', (await exp(A)).rows[0].ok === false && (await rows('export_created')).length === 5);
check('[C3-AUD] the cap is per person: B still records', (await exp(B)).rows[0].ok === true);

// -- security_events: nobody but the service functions ---------------------------
const KEEP = `select public.ops_security_event_write('wrong_code_burst', 1)`;
for (const [label, run] of [['signed in', (s) => as(A, s)], ['anon', (s) => asAnon(s)]]) {
  for (const s of [KEEP, `select public.ops_security_events_check()`, `select public.ops_security_events_retention()`, 'select * from ops.security_events', 'insert into ops.security_events (kind) values (\'step_up_failed\')']) {
    check(`[C3-SEC] ${label} is refused (42501): ${s.slice(0, 60)}`, (await codeOf(() => run(s))) === '42501');
  }
}
check('[C3-SEC] service_role holds no direct table privilege (42501)', (await codeOf(() => svc('select * from ops.security_events'))) === '42501');
await db.exec('grant usage on schema ops to authenticated; grant select on ops.security_events to authenticated');
await sys('alter table ops.security_events disable row level security');
check('[C3-SEC] mutant: with a grant and RLS off a signed-in person reads it, so the deny checks can fail',
  (await codeOf(() => as(A, 'select * from ops.security_events'))) === 'ok');
await db.exec('alter table ops.security_events enable row level security; revoke select on ops.security_events from authenticated; revoke usage on schema ops from authenticated');

// -- security_events: content-free columns ---------------------------------------
const put = (args) => codeOf(() => svc(`select public.ops_security_event_write(${args})`));
check('[C3-SEC] a kind, a count and a 12-hex request id are written', (await put(`'step_up_failed', 2, null, 'abcdef012345', '{"step": 1}'`)) === 'ok');
check('[C3-SEC] a kind outside the closed list is refused (23514)', (await put(`'sign_in_text', 1`)) === '23514');
for (const [what, args] of [['an email', `'step_up_failed', 1, null, null, '{"who": "asha@example.com"}'`], ['a uuid', `'step_up_failed', 1, null, null, '{"who": "${A}"}'`],
  ['a hex token', `'step_up_failed', 1, null, null, '{"t": "deadbeefdeadbeefdeadbeef"}'`], ['a lowercase word', `'step_up_failed', 1, null, null, '{"who": "asha"}'`], ['free text with spaces', `'step_up_failed', 1, null, null, '{"note": "the child said hello"}'`],
  ['a name as a key', `'step_up_failed', 1, null, null, '{"Asha": 1}'`], ['a nested object', `'step_up_failed', 1, null, null, '{"a": {"b": 1}}'`],
  ['more than 256 bytes', `'step_up_failed', 1, null, null, jsonb_build_object('a', repeat('x', 300))`], ['a 16-byte-wrong hash', `'step_up_failed', 1, '\\x0102'::bytea`],
  ['a request id with other characters', `'step_up_failed', 1, null, 'asha@example.com'`], ['a zero count', `'step_up_failed', 0`]]) {
  check(`[C3-SEC] ${what} is refused (23514)`, (await put(args)) === '23514');
}
check('[C3-SEC] a 16-byte keyed hash is accepted', (await put(`'restore_requested', 1, '\\x00112233445566778899aabbccddeeff'::bytea`)) === 'ok');
const colRows = (await sys(`select a.attname, col_description(c.oid, a.attnum) cm from pg_class c join pg_namespace n on n.oid = c.relnamespace
  join pg_attribute a on a.attrelid = c.oid where n.nspname = 'ops' and c.relname = 'security_events' and a.attnum > 0 and not a.attisdropped`)).rows;
check('[C3-SEC] every column is classified L1 to L4; subject_hash is L3; no column can hold a name, email, text or token',
  colRows.length === 7 && colRows.every((x) => /^L[1-4]\b/.test(x.cm ?? '')) && /^L3/.test(colRows.find((x) => x.attname === 'subject_hash').cm)
  && !colRows.some((x) => /name|email|text|transcript|token|child_id|profile_id/.test(x.attname)));

// -- security_events: append-only, 12 months -------------------------------------
const tryIt = async (sql) => { await db.exec('begin'); try { await db.query(sql); return 'ok'; } catch (e) { return e.code ?? 'error'; } finally { await db.exec('rollback'); } };
check('[C3-SEC] a row cannot be updated (SCIMM)', (await tryIt(`update ops.security_events set n = 9`)) === 'SCIMM');
check('[C3-SEC] a row cannot be deleted outside retention (SCIMM)', (await tryIt(`delete from ops.security_events`)) === 'SCIMM');
check('[C3-SEC] the store cannot be truncated (SCIMM)', (await tryIt(`truncate ops.security_events`)) === 'SCIMM');
await sys(`alter table ops.security_events disable trigger security_events_guard`);
await sys(`update ops.security_events set at = now() - interval '13 months' where id = (select min(id) from ops.security_events)`);
await sys(`update ops.security_events set at = now() - interval '11 months' where id = (select max(id) from ops.security_events)`);
await sys(`alter table ops.security_events enable trigger security_events_guard`);
const before = (await sys('select count(*)::int n from ops.security_events')).rows[0].n;
const gone = (await svc(`select public.ops_security_events_retention(now() + interval '50 years') n`)).rows[0].n; // a far-future clock must not widen it
check('[C3-SEC] retention removes only rows older than 12 months, whatever clock the caller sends (the 11-month row stays)', gone === 1 && (await sys('select count(*)::int n from ops.security_events')).rows[0].n === before - 1);

// -- security_events: the reader and its threshold (20 of one kind in one hour) ---------
await sys('alter table ops.security_events disable trigger security_events_guard');
await sys('delete from ops.security_events');
for (let i = 0; i < 19; i++) await svc(`select public.ops_security_event_write('wrong_code_burst')`);
const chk = async () => (await svc('select public.ops_security_events_check() v')).rows[0].v;
check('[C3-SEC] 19 events of one kind in the hour is below the threshold', JSON.stringify((await chk()).over) === '[]' && (await chk()).counts.wrong_code_burst === 19);
await svc(`select public.ops_security_event_write('wrong_code_burst')`);
check('[C3-SEC] the 20th event of one kind in the hour names the kind', JSON.stringify((await chk()).over) === '["wrong_code_burst"]');
await sys(`update ops.security_events set at = now() - interval '2 hours' where id = (select min(id) from ops.security_events)`);
check('[C3-SEC] events older than the hour do not count', JSON.stringify((await chk()).over) === '[]' && (await chk()).counts.wrong_code_burst === 19);
await svc(`select public.ops_security_event_write('step_up_failed', 19)`);
check('[C3-SEC] kinds are counted apart (19 and 19 is not an alert)', JSON.stringify((await chk()).over) === '[]');
done();
