// [BL-585] audit_events refuses UPDATE (except finalize_account_deletion's nulling) and DELETE
// outside the retention purge; audit_events, policy_acceptances and ops.audit_log refuse TRUNCATE
// (20261108020000_audit_append_only.sql). Checks run as the owner, the role the guards exist for:
// no API role holds these privileges at all. Fictional family "Asha" only (CLAUDE.md).
import { createDb, users } from './harness.mjs';

const { db, check, one, sys, codeOf, done, publishPolicies, consent, newChild } = await createDb(process.argv.slice(2));
const { A, B } = users;
await sys(`insert into auth.users values ('${A}'),('${B}')`);
await publishPolicies();
for (const u of [A, B]) await consent(u);
const CHILD = await newChild(A);

// One statement in a transaction rolled back, so a statement that passes changes nothing here.
const tryIt = async (sql, params = []) => {
  await db.exec('begin');
  try { await db.query(sql, params); return 'ok'; } catch (e) { return e.code ?? 'error'; } finally { await db.exec('rollback'); }
};
const audit = (actor, kind, action, type, subject, child = null, detail = '{}') => sys(`insert into audit_events
  (actor_id, actor_kind, action, subject_type, subject_id, child_id, detail) values ($1, $2, $3, $4, $5, $6, $7::jsonb) returning id`,
  [actor, kind, action, type, subject, child, detail]).then((r) => r.rows[0].id);
const ev = await audit(A, 'user', 'left_book', 'membership', A, CHILD, '{"n": 1}');
const evEntry = await audit(A, 'user', 'entry_deleted', 'entry', B, CHILD);
await sys(`select public.ops_audit_write('ops@asha.example', 'dsar', 'subject_request', 'T-1', null, null, null, '{}'::jsonb)`);

// ── UPDATE ───────────────────────────────────────────────────────────────
for (const [what, set] of [['the action', `action = 'entry_restored'`], ['the time', `at = at - interval '1 day'`],
  ['the detail', `detail = '{}'`], ['the book', 'child_id = null'], ['the actor to someone else', `actor_id = '${B}'`]]) {
  check(`[BL-585] given an audit row, when ${what} is changed, then it fails with SCIMM`,
    (await tryIt(`update audit_events set ${set} where id = $1`, [ev])) === 'SCIMM');
}
check('[BL-585] nulling the actor together with any other change fails with SCIMM',
  (await tryIt(`update audit_events set actor_id = null, detail = '{}' where id = $1`, [ev])) === 'SCIMM');
check('[BL-585] nulling the subject of an entry row (not a person) fails with SCIMM',
  (await tryIt(`update audit_events set subject_id = null where id = $1`, [evEntry])) === 'SCIMM');
check('finalize\'s nulling of the actor alone passes',
  (await tryIt(`update audit_events set actor_id = null where id = $1`, [ev])) === 'ok');
check('finalize\'s nulling of a membership row\'s subject alone passes',
  (await tryIt(`update audit_events set subject_id = null where id = $1`, [ev])) === 'ok');

// ── DELETE ───────────────────────────────────────────────────────────────
check('[BL-585] given an audit row, when it is deleted outside the retention purge, then it fails with SCIMM',
  (await tryIt(`delete from audit_events where id = $1`, [ev])) === 'SCIMM');

// ── TRUNCATE ─────────────────────────────────────────────────────────────
for (const t of ['audit_events', 'policy_acceptances', 'ops.audit_log']) {
  check(`[BL-585] given ${t}, when it is truncated (as the owner), then it fails with SCIMM`, (await tryIt(`truncate ${t}`)) === 'SCIMM');
}
check('subscription_consents still refuses it too (the pattern followed)', (await tryIt('truncate subscription_consents')) === 'SCIMM');

// ── The documented paths still work ──────────────────────────────────────
const req = (await one(A, `select * from public.request_account_deletion('ios', false)`)).request_id;
await sys(`select public.purge_due(now() + interval '31 days')`);
await sys(`select public.prepare_account_purge($1)`, [req]);
await sys(`delete from auth.users where id = $1`, [A]);
check('given a completed deletion, finalize_account_deletion still nulls the person in the audit log',
  (await codeOf(() => sys(`select public.finalize_account_deletion($1, '{}'::jsonb)`, [req]))) === 'ok'
  && (await sys(`select count(*)::int n from audit_events where actor_id = $1 or subject_id = $1`, [A])).rows[0].n === 0
  && (await sys(`select subject_id from audit_events where id = $1`, [evEntry])).rows[0].subject_id === B);

const auditCount = async () => (await sys(`select count(*)::int n from audit_events`)).rows[0].n;
const n0 = await auditCount();
await sys(`select public.purge_due(now() + interval '23 months')`);
check('before 24 months the retention purge keeps the rows', (await auditCount()) === n0 + 1 /* its own purge_run row */);
const res = await codeOf(() => sys(`select public.purge_due(now() + interval '25 months')`));
const left = (await sys(`select array_agg(action) a from audit_events`)).rows[0].a;
check('[BL-585] given the retention purge (app.retention_purge on inside it), then the 24-month audit delete still succeeds',
  res === 'ok' && n0 > 3 && JSON.stringify(left) === '["purge_run"]' /* only the run's own new row */);
check('the switch is off again after the purge', (await sys(`select current_setting('app.retention_purge', true) s`)).rows[0].s !== 'on');

await sys(`select public.ops_audit_write('ops@asha.example', 'dsar', 'subject_request', 'T-2', null, null, null, '{}'::jsonb)`);
const logRows = async () => (await sys(`select count(*)::int n from ops.audit_log`)).rows[0].n;
const l0 = await logRows();
check('ops.audit_log still refuses a delete outside ops_retention (unchanged)', (await tryIt('delete from ops.audit_log')) === 'SCIMM');
await sys(`select public.ops_retention(now() + interval '13 months')`);
check('ops_retention still deletes runbook rows after 12 months', l0 === 2 && (await logRows()) === 0);

check('no API role may execute the new trigger functions',
  (await sys(`select bool_or(has_function_privilege(r, p.oid, 'execute')) x from pg_proc p
     cross join unnest(array['anon', 'authenticated', 'service_role']) r
     where p.proname in ('audit_events_guard', 'audit_events_no_truncate', 'policy_acceptances_no_truncate', 'audit_log_no_truncate')`)).rows[0].x === false);

await db.close();
done();
