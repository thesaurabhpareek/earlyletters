// Bounded purge runs and retry backoff (20261003020000_purge_batching.sql).
// Fictional family "Asha" only (CLAUDE.md).
import { createDb, users } from './harness.mjs';

const { check, as, sys, one, codeOf, done, publishPolicies, consent, newChild, invite } = await createDb(process.argv.slice(2));
const { A, B } = users;
await sys(`insert into auth.users values ('${A}'),('${B}')`);
await publishPolicies();
for (const u of [A, B]) await consent(u);
const CHILD = await newChild(A);

// 25 tombstoned letters, each with a photo.
await sys(`insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, photo_path)
  select x.id, $1::uuid, $2::uuid, 'letter', '2026-09-29', now(), 'spoken', 1, 'um she walked', 'She walked.', $1::text || '/' || $2::text || '/' || x.id || '.jpg'
    from (select ('0192e000-0000-7000-8000-' || lpad(g::text, 12, '0'))::uuid id from generate_series(1, 25) g) x`, [CHILD, A]);
await sys(`update entries set deleted_at = now(), deleted_reason = 'user'`);
const left = async () => (await sys(`select count(*)::int n from entries`)).rows[0].n;

check('[TDD 02 C8] users cannot call purge_due', (await codeOf(() => as(A, `select public.purge_due()`))) === '42501');
const r1 = (await sys(`select public.purge_due(now() + interval '31 days', 10) r`)).rows[0].r;
check('[TDD 02 C8] one call purges at most p_limit letters and says there is more', r1.entries === 10 && r1.more === true && (await left()) === 15);
const r2 = (await sys(`select public.purge_due(now() + interval '31 days', 10) r`)).rows[0].r;
const r3 = (await sys(`select public.purge_due(now() + interval '31 days', 10) r`)).rows[0].r;
check('[TDD 02 C8] the cron loop finishes the backlog', r2.entries === 10 && r3.entries === 5 && r3.more === false && (await left()) === 0);
check('the default call still works (cron command unchanged)', (await sys(`select public.purge_due() r`)).rows[0].r.more === false);
check('every photo is queued once', (await sys(`select count(*)::int n from storage_purge_queue where reason='entry_purge'`)).rows[0].n === 25);

// Backoff for the purge worker.
const q = (await sys(`select id from storage_purge_queue order by id limit 1`)).rows[0].id;
const waitMin = async () => (await sys(`select round(extract(epoch from next_attempt_at - now()) / 60) m, attempts, last_error_code e from storage_purge_queue where id=$1`, [q])).rows[0];
await sys(`select public.record_purge_attempt($1, false, '503')`, [q]);
const w1 = await waitMin();
await sys(`select public.record_purge_attempt($1, false, '503')`, [q]);
await sys(`select public.record_purge_attempt($1, false, '503')`, [q]);
const w3 = await waitMin();
check('[TDD 02 C11] a failed object is retried after 1 minute, then 4 after three failures', Number(w1.m) === 1 && Number(w3.m) === 4 && w3.attempts === 3 && w3.e === '503');
for (let i = 0; i < 12; i++) await sys(`select public.record_purge_attempt($1, false, 'timeout')`, [q]);
check('[TDD 02 C11] backoff is capped at 6 hours', Number((await waitMin()).m) === 360);
await sys(`select public.record_purge_attempt($1, true)`, [q]);
check('a success marks the row done and clears the error', (await sys(`select done_at is not null d, last_error_code e from storage_purge_queue where id=$1`, [q])).rows[0].d
  && (await sys(`select last_error_code e from storage_purge_queue where id=$1`, [q])).rows[0].e === null);
check('users cannot record purge attempts', (await codeOf(() => as(A, `select public.record_purge_attempt($1, true)`, [q]))) === '42501');

// Re-enqueue a done path (TDD 02 C9).
const path = (await sys(`select object_path from storage_purge_queue where id=$1`, [q])).rows[0].object_path;
await sys(`select public.enqueue_storage_purge('entry-photos', $1, false, 'orphan')`, [path]);
check('[TDD 02 C9] enqueueing a path whose row is done re-arms it', (await sys(`select done_at is null d, attempts from storage_purge_queue where id=$1`, [q])).rows[0].d);

// Deletion steps backoff.
const req = (await one(B, `select request_id from public.request_account_deletion('ios')`)).request_id;
await sys(`select public.record_deletion_step($1, 'email_provider', 'pending', '429')`, [req]);
const st = (await sys(`select status, attempts, last_error_code e, next_attempt_at > now() + interval '50 seconds' later from deletion_request_steps where request_id=$1 and step='email_provider'`, [req])).rows[0];
check('[TDD 02 C11] a retryable step failure waits before the next attempt', st.status === 'pending' && st.attempts === 1 && st.e === '429' && st.later);
await sys(`select public.record_deletion_step($1, 'email_provider', 'done')`, [req]);
check('a finished step clears its error', (await sys(`select status, last_error_code e from deletion_request_steps where request_id=$1 and step='email_provider'`, [req])).rows[0].e === null);
check('no RevenueCat step is scheduled (StoreKit 2 direct)', (await sys(`select count(*)::int n from deletion_request_steps where request_id=$1 and step='revenuecat'`, [req])).rows[0].n === 0);

// Due account requests are bounded too.
await sys(`update deletion_requests set scheduled_for = now() - interval '1 day' where id=$1`, [req]);
const r4 = (await sys(`select public.purge_due(now(), 1) r`)).rows[0].r;
check('[TDD 02 C8] account hand-off counts against the limit', r4.accounts_due === 1 && r4.more === true);

// Invite retention keyed on use or revocation (TDD 05 X-14, K-18).
await invite(A, CHILD, 'contributor');
await sys(`update child_invites set revoked_at = now() - interval '91 days', expires_at = now() + interval '1 day'`);
await sys(`select public.purge_due()`);
check('[X-14] an invite hash goes 90 days after revocation, even before its expiry date', (await sys(`select count(*)::int n from child_invites`)).rows[0].n === 0);

// Purged book ids cannot be recreated.
await sys(`insert into purge_ledger (entity_type, entity_id) values ('child', '0192e000-0000-7000-8000-0000000000aa')`);
check('[FM-08] a purged book id cannot come back', (await codeOf(() => as(B, `select public.create_child('0192e000-0000-7000-8000-0000000000aa', 'Asha', '2025-04-12')`))) === 'SCDEL');

done();
