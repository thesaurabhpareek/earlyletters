// Ops schema and service-only functions for the purge worker, analytics-forget and
// the ops runbook scripts (20261004200000_ops_deletion_worker.sql).
// Fictional family "Asha" only (CLAUDE.md). Run all DB tests: npm run test:db
import { createDb, users } from './harness.mjs';

const { check, as, asAnon, sys, codeOf, done, publishPolicies, consent, newChild, join } = await createDb(process.argv.slice(2));
const { A, B, N, S, C } = users;
// Supabase's storage.objects has owner (uuid, deprecated), owner_id (text) and created_at; the harness stub does not.
await sys(`alter table storage.objects add column owner uuid, add column owner_id text, add column created_at timestamptz not null default now()`);
await sys(`insert into auth.users values ('${A}'),('${B}'),('${N}'),('${S}'),('${C}')`);
await publishPolicies();
for (const u of [A, B, N, S, C]) await consent(u);

const SHARED = await newChild(A);
await join(B, 'parent', SHARED, A);
const SOLO = await newChild(S, 'Asha', '2025-06-01');
await join(N, 'contributor', SOLO, S);

let seq = 0;
const letter = async (author, child, photo = false) => {
  const id = `0192e000-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
  await sys(`insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book, photo_path)
    values ($1, $2, $3, 'letter', '2026-09-29', now(), 'spoken', 1, 'um Asha laughed', 'Asha laughed.', true, $4)`,
    [id, child, author, photo ? `${child}/${author}/${id}.jpg` : null]);
  if (photo) await sys(`insert into storage.objects (bucket_id, name, owner, owner_id) values ('entry-photos', $1, $2::uuid, $3)`, [`${child}/${author}/${id}.jpg`, author, author]);
  return id;
};
const j = async (sql, params = []) => (await sys(sql, params)).rows[0].v;

const sLetters = [await letter(S, SOLO, true), await letter(S, SOLO, false)];
const nLetter = await letter(N, SOLO, true);
const aLetter = await letter(A, SHARED, true);
const bLetter = await letter(B, SHARED, false);

// ── Access: service role only ─────────────────────────────────────────────
const SERVICE_ONLY = [
  `select public.ops_deletion_work(10)`, `select public.ops_merge_deletion_receipt('${A}', '{}')`,
  `select public.ops_storage_queue_due(10, null)`, `select public.ops_storage_owned_by('${A}', 10)`,
  `select public.ops_storage_residue('${A}', 10)`, `select public.ops_deletion_residue('${A}', 'before_finalize')`,
  `select public.ops_deletion_contributors('${A}')`, `select public.ops_set_child_photo_path('${SHARED}', 'a', 'b')`,
  `select public.ops_deletion_sla(now())`, `select public.ops_alert_claim('x', 1)`, `select public.ops_alert_reset('x')`,
  `select public.ops_consume_forget_quota('${A}', 5)`, `select public.ops_apple_token_put('${A}', 'v1.AAAAAAAAAAAAAAAA.AAAAAAAAAAAAAAAAAAAAAAAA', 1, 'com.earlyletters.scribe')`,
  `select public.ops_apple_token_get('${A}')`, `select public.ops_apple_token_delete('${A}')`,
  `select public.ops_ledger_between(now(), now(), 10)`, `select public.ops_retention(now())`,
  `select public.ops_audit_write('op', 'deletion', 'test', 'T-1')`, `select public.ops_incident_scope('{}')`,
  `select public.ops_replay_ledger('[]')`, `select public.ops_row_counts()`, `select public.ops_raw_sha(null, 1, now())`,
  `select public.ops_schema_health()`, `select public.ops_deletion_request_status('${A}')`,
];
for (const sql of SERVICE_ONLY) {
  const name = sql.match(/public\.(\w+)/)[1];
  const got = [await codeOf(() => as(A, sql)), await codeOf(() => as(C, sql, [], { anonymous: true })), await codeOf(() => asAnon(sql))];
  check(`service-only ${name}: refused for users, anonymous and anon`, got.every((g) => g === '42501') || console.log(`      got ${got}`));
}
const fns = (await sys(`select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname like 'ops\\_%'`)).rows.map((r) => r.proname);
check('every ops_* function is in the service-only list above', fns.every((f) => SERVICE_ONLY.some((s) => s.includes(`public.${f}(`))) || console.log(`      ${fns}`));
check('no ops_* function is callable by authenticated or anon', (await sys(`select count(*)::int n from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname like 'ops\\_%' and (has_function_privilege('authenticated', p.oid, 'execute') or has_function_privilege('anon', p.oid, 'execute'))`)).rows[0].n === 0);
check('every ops_* function is security definer with a pinned search_path', (await sys(`select count(*)::int n from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname like 'ops\\_%' and not (p.prosecdef and array_to_string(p.proconfig, ',') ~ 'search_path=')`)).rows[0].n === 0);

// ── The ops schema is invisible to clients, has RLS and classified columns ─
for (const t of ['audit_log', 'alert_state', 'forget_quota', 'apple_tokens']) {
  check(`ops.${t}: a signed-in user cannot read it`, (await codeOf(() => as(A, `select * from ops.${t}`))) === '42501');
  check(`ops.${t}: anon cannot read it`, (await codeOf(() => asAnon(`select * from ops.${t}`))) === '42501');
}
check('every ops table has row level security on', (await sys(`select count(*)::int n from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'ops' and c.relkind = 'r' and not c.relrowsecurity`)).rows[0].n === 0);
const unclassified = (await sys(`select c.relname || '.' || a.attname col from pg_class c join pg_namespace n on n.oid = c.relnamespace join pg_attribute a on a.attrelid = c.oid
  where n.nspname = 'ops' and c.relkind = 'r' and a.attnum > 0 and not a.attisdropped and coalesce(col_description(c.oid, a.attnum), '') !~ '^L[1-4]'`)).rows;
check('every ops column has an L1 to L4 comment', unclassified.length === 0 || console.log(`      ${unclassified.map((r) => r.col)}`));
const health = await j(`select public.ops_schema_health() v`);
check('ops schema health: no table without RLS, nothing visible to clients, nothing callable by anon',
  Object.keys(health).length === 4 && Object.values(health).every((n) => n === 0) || console.log(`      ${JSON.stringify(health)}`));
check('the ops-ledger bucket exists and is private', (await sys(`select public from storage.buckets where id='ops-ledger'`)).rows[0]?.public === false);

// ── Deletion work list and receipts ───────────────────────────────────────
const reqS = (await as(S, `select request_id from public.request_account_deletion('ios', true)`)).rows[0].request_id;
let work = await j(`select public.ops_deletion_work(10) v`);
check('a new account request asks for its "request received" email', work.request_emails.some((w) => w.id === reqS && w.profile_id === S));
check('a sole-parent book with a family member queues a "save a copy" notice', work.notices.some((n) => n.request_id === reqS && n.kind === 'account'));
check('the notice goes to the family member, never to the requester',
  JSON.stringify(await j(`select public.ops_deletion_contributors($1) v`, [reqS])) === JSON.stringify([N]));
await sys(`select public.ops_merge_deletion_receipt($1, '{"request_email": "sent"}')`, [reqS]);
check('a sent request email is not asked for again', !(await j(`select public.ops_deletion_work(10) v`)).request_emails.some((w) => w.id === reqS));
check('receipt parts must be objects', (await codeOf(() => sys(`select public.ops_merge_deletion_receipt($1, '[1]')`, [reqS]))) === '22023');
check('the receipt column still caps size at 2 KB', (await codeOf(() => sys(`select public.ops_merge_deletion_receipt($1, jsonb_build_object('x', repeat('a', 3000)))`, [reqS]))) === '23514');
check('the requester can read their own receipt flags', (await as(S, `select receipt from deletion_requests where id=$1`, [reqS])).rows[0].receipt.request_email === 'sent');

const reqA = (await as(A, `select request_id from public.request_account_deletion('ios')`)).rows[0].request_id;
await as(A, `select public.cancel_account_deletion()`);
work = await j(`select public.ops_deletion_work(10) v`);
check('a cancelled request asks for its cancellation email', work.cancel_emails.some((w) => w.id === reqA && w.cancelled_at));
await sys(`select public.ops_merge_deletion_receipt($1, '{"cancel_email": "sent"}')`, [reqA]);
check('a sent cancellation email is not asked for again', !(await j(`select public.ops_deletion_work(10) v`)).cancel_emails.some((w) => w.id === reqA));

// Day 30: purge_due hands the request to the worker.
await sys(`select public.purge_due(now() + interval '31 days')`);
work = await j(`select public.ops_deletion_work(10) v`);
const ex = work.executing.find((r) => r.id === reqS);
check('day 30: the request is executing and comes with its steps', ex && ex.profile_id === S && ex.steps.length >= 7 && ex.had_active_subscription === true);
check('executing requests are not in the scheduled notice list', !work.notices.some((n) => n.request_id === reqS));

// ── Storage queue, ownership and residue ─────────────────────────────────
const prep = await j(`select public.prepare_account_purge($1) v`, [reqS]);
check('prepare_account_purge runs for the executing request', prep.held !== true);
// purge_due already purged the sole-parent book at day 30 and queued its whole folder.
const general = await j(`select public.ops_storage_queue_due(1000, null) v`);
check('day 30: the deleted book\'s folder is queued for the worker', general.some((r) => r.object_path === `${SOLO}/` && r.is_prefix));
await sys(`select public.enqueue_storage_purge('entry-photos', $1, true, 'account_purge', $2)`, [`${SHARED}/${S}/`, reqS]);
const rows = await j(`select public.ops_storage_queue_due(100, $1) v`, [reqS]);
check('a request\'s own queued folders are listed for the worker', rows.length === 1 && rows[0].request_id === reqS && typeof rows[0].id === 'number');
await sys(`select public.record_purge_attempt($1, false, 'http_503')`, [rows[0].id]);
check('with a request id, rows in backoff are still listed (the step has its own backoff)',
  (await j(`select public.ops_storage_queue_due(100, $1) v`, [reqS])).some((r) => r.id === rows[0].id));
check('without a request id, an account\'s rows are left to its own step', !(await j(`select public.ops_storage_queue_due(1000, null) v`)).some((r) => r.request_id !== null));
const generalId = general.find((r) => r.object_path === `${SOLO}/`).id;
await sys(`select public.record_purge_attempt($1, false, 'http_503')`, [generalId]);
check('without a request id, rows in backoff wait', !(await j(`select public.ops_storage_queue_due(1000, null) v`)).some((r) => r.id === generalId));

const owned = await j(`select public.ops_storage_owned_by($1, 100) v`, [S]);
check('objects Storage records as owned by the person are found (owner and owner_id)', owned.length === 1 && owned[0].bucket_id === 'entry-photos');
check('a path with the person as a folder is residue', (await j(`select public.ops_storage_residue($1, 10) v`, [S])).length === 1);
check('another person\'s objects are not residue', (await j(`select public.ops_storage_residue($1, 10) v`, [N])).length === 1
  && (await j(`select public.ops_storage_owned_by($1, 100) v`, [N])).length === 1);
await sys(`delete from storage.objects where owner = $1`, [S]);
check('after the Storage API delete, nothing is owned or left in folders', (await j(`select public.ops_storage_owned_by($1, 100) v`, [S])).length === 0
  && (await j(`select public.ops_storage_residue($1, 10) v`, [S])).length === 0);

const before = await j(`select public.ops_deletion_residue($1, 'before_finalize') v`, [S]);
check('while the profile exists, residue lists it', before.some((r) => r.table_schema === 'public' && r.table_name === 'profiles' && r.column_name === 'id'));
check('residue rejects an unknown phase', (await codeOf(() => sys(`select public.ops_deletion_residue($1, 'x')`, [S]))) === '22023');
// The worker's auth_user step: Auth deletes the user, profiles and everything keyed to it cascade.
await sys(`delete from auth.users where id = $1`, [S]);
check('after the Auth user is deleted, no residue before finalize', (await j(`select public.ops_deletion_residue($1, 'before_finalize') v`, [S])).length === 0
  || console.log(`      ${JSON.stringify(await j(`select public.ops_deletion_residue($1, 'before_finalize') v`, [S]))}`));
check('audit actor ids are the only thing left for finalize to clear', (await j(`select public.ops_deletion_residue($1, 'after_finalize') v`, [S]))
  .every((r) => r.table_name === 'audit_events' || r.table_name === 'deletion_requests'));
await sys(`select public.finalize_account_deletion($1, '{"verified": true}')`, [reqS]);
check('after finalize, no residue at all', (await j(`select public.ops_deletion_residue($1, 'after_finalize') v`, [S])).length === 0);
const st = await j(`select public.ops_deletion_request_status($1) v`, [reqS]);
check('request status for the verify script: completed, unlinked, receipt and steps', st.status === 'completed' && st.profile_linked === false
  && st.receipt.verified === true && typeof st.steps.auth_user === 'string');
check('an unknown request has an empty status', JSON.stringify(await j(`select public.ops_deletion_request_status($1) v`, [A])) === '{}');
check('the contributor\'s own letter in the deleted book went with the book (they were offered a copy)', (await sys(`select 1 from entries where id=$1`, [nLetter])).rows.length === 0);
check('the shared book and both parents\' letters are untouched', (await sys(`select count(*)::int n from entries where id = any($1)`, [[aLetter, bLetter]])).rows[0].n === 2);
check('the purge ledger has the deleted letters', (await sys(`select count(*)::int n from purge_ledger where entity_type='entry' and entity_id = any($1)`, [sLetters])).rows[0].n === 2);

// ── Child photo re-homing ─────────────────────────────────────────────────
const old = `${SHARED}/0192e000-0000-7000-8000-0000000000c1.jpg`;
const neu = `${SHARED}/0192e000-0000-7000-8000-0000000000c2.jpg`;
await sys(`update children set photo_path = $1 where id = $2`, [old, SHARED]);
check('re-home repoints a book that uses the old photo', (await j(`select public.ops_set_child_photo_path($1, $2, $3) v`, [SHARED, old, neu])) === true);
check('re-home does nothing when the book uses another photo', (await j(`select public.ops_set_child_photo_path($1, $2, $3) v`, [SHARED, old, neu])) === false);

// ── SLA report ────────────────────────────────────────────────────────────
await as(B, `select public.delete_entry($1)`, [bLetter]);
const sla = await j(`select public.ops_deletion_sla(now() + interval '40 days') v`);
check('SLA: a tombstone past 31 days is overdue', sla.tombstones_overdue === 1);
check('SLA: counts only', Object.values(sla).every((v) => v === null || typeof v === 'number'));
check('SLA: the last purge run is recent', (await j(`select public.ops_deletion_sla(now()) v`)).purge_run_age_minutes <= 1);
await sys(`insert into legal_holds (scope, scope_id, reason_code, matter_ref, placed_by, review_by) values ('entry', $1, 'other', 'T-1', 'ops', current_date - 1)`, [bLetter]);
const held = await j(`select public.ops_deletion_sla(now() + interval '40 days') v`);
check('SLA: a held tombstone is not overdue, and a hold past review is reported', held.tombstones_overdue === 0 && held.holds_past_review === 1);

// ── Alert cooldown ────────────────────────────────────────────────────────
const claim = async () => j(`select public.ops_alert_claim('request_stuck', 1440) v`);
check('an alert kind is claimed once per cooldown', (await claim()) === true && (await claim()) === false);
await sys(`select public.ops_alert_reset('request_stuck')`);
check('a released claim can be claimed again (the email failed)', (await claim()) === true);

// ── analytics-forget quota ────────────────────────────────────────────────
const quota = [];
for (let i = 0; i < 6; i++) quota.push(await j(`select public.ops_consume_forget_quota($1, 5) v`, [A]));
check('analytics-forget allows 5 calls a day per person, then refuses', JSON.stringify(quota) === JSON.stringify([true, true, true, true, true, false]));
check('the quota keeps counts only (no analytics ids)', (await sys(`select column_name from information_schema.columns where table_schema='ops' and table_name='forget_quota' order by 1`)).rows
  .map((r) => r.column_name).join(',') === 'calls,day,profile_id');

// ── Apple refresh tokens ──────────────────────────────────────────────────
const ct = 'v1.AAAAAAAAAAAAAAAA.' + 'B'.repeat(40);
await sys(`select public.ops_apple_token_put($1, $2, 1, 'com.earlyletters.scribe')`, [B, ct]);
const tok = await j(`select public.ops_apple_token_get($1) v`, [B]);
check('the worker reads the wrapped token, its key version and client id', tok.length === 1 && tok[0].ciphertext === ct && tok[0].key_version === 1 && tok[0].client_id === 'com.earlyletters.scribe');
check('only wrapped tokens are stored (plaintext refused)', (await codeOf(() => sys(`select public.ops_apple_token_put($1, 'raw-refresh-token', 1, 'com.earlyletters.scribe')`, [B]))) === '23514');
check('after revocation the row is deleted', (await j(`select public.ops_apple_token_delete($1) v`, [B])) === true && (await j(`select public.ops_apple_token_get($1) v`, [B])).length === 0);
await sys(`select public.ops_apple_token_put($1, $2, 1, 'com.earlyletters.scribe')`, [C, ct]);
await sys(`delete from auth.users where id = $1`, [C]);
check('a stored token goes with the profile (cascade)', (await sys(`select count(*)::int n from ops.apple_tokens`)).rows[0].n === 0);

// ── Ledger, audit log and retention ───────────────────────────────────────
const led = await j(`select public.ops_ledger_between(now() - interval '1 day', now() + interval '1 day', 1000) v`);
check('the ledger export holds types, ids and times only', led.length >= 3 && led.every((r) => Object.keys(r).sort().join(',') === 'at,id,t'));
const auditId = await j(`select public.ops_audit_write('founder', 'verify_deletion', 'scheduled_check', 'T-42', $1) v`, [S]);
check('a runbook run writes one audit row', typeof auditId === 'number' || typeof auditId === 'string');
check('the runbook log is append-only', (await codeOf(() => sys(`update ops.audit_log set ticket='x'`))) === 'SCIMM'
  && (await codeOf(() => sys(`delete from ops.audit_log`))) === 'SCIMM');
check('runbook log detail is capped at 512 bytes', (await codeOf(() => sys(`select public.ops_audit_write('f', 'deletion', 'x', 'T', null, null, null, jsonb_build_object('a', repeat('b', 600)))`))) === '23514');
check('runbook names are a closed list', (await codeOf(() => sys(`select public.ops_audit_write('f', 'browse_letters', 'x', 'T')`))) === '23514');
await sys(`insert into ops.audit_log (at, operator, runbook, reason_code, ticket) values (now() - interval '13 months', 'f', 'deletion', 'old', 'T-0')`);
const ret = await j(`select public.ops_retention(now()) v`);
check('retention removes runbook rows older than 12 months only', ret.audit_log === 1 && (await sys(`select count(*)::int n from ops.audit_log`)).rows[0].n === 1);

// ── Incident scope (LEGAL-REQ-039) ────────────────────────────────────────
const S2 = '88888888-8888-8888-8888-888888888888';
await sys(`insert into auth.users values ('${S2}')`);
await consent(S2);
const BOOK2 = await newChild(S2, 'Asha', '2025-07-01');
await letter(S2, BOOK2, true);
const byChild = await j(`select public.ops_incident_scope($1) v`, [JSON.stringify({ child_ids: [SHARED] })]);
const pa = byChild.profiles.find((p) => p.profile_id === A);
check('incident by book: both parents listed, with letter counts and categories', byChild.profiles.length === 2 && pa
  && pa.categories.includes('child_identity') && pa.categories.includes('letter_text') && pa.letters === 1 && pa.roles.includes('parent'));
const byTable = await j(`select public.ops_incident_scope($1) v`, [JSON.stringify({ tables: ['entries'], until: new Date(Date.now() + 60_000).toISOString() })]);
check('incident by table: every author is listed, and their book members as book_content',
  byTable.profiles.some((p) => p.profile_id === S2 && p.categories.includes('letter_text'))
  && byTable.profiles.some((p) => p.profile_id === B && p.categories.includes('book_content')));
const before2020 = await j(`select public.ops_incident_scope($1) v`, [JSON.stringify({ tables: ['entries'], until: '2020-01-01T00:00:00Z' })]);
check('incident window: rows created after the window are out of scope', before2020.profiles.length === 0);
const byBucket = await j(`select public.ops_incident_scope($1) v`, [JSON.stringify({ buckets: ['entry-photos'] })]);
check('incident by bucket: photo owners listed with photo counts', byBucket.profiles.some((p) => p.profile_id === S2 && p.photos === 1)
  && byBucket.totals.photos >= 2);
const all = await j(`select public.ops_incident_scope('{"all": true}') v`);
check('incident "all": every remaining person, flags for audio and escrow', all.totals.profiles === (await sys(`select count(*)::int n from profiles`)).rows[0].n
  && all.audio_on_server === false && all.escrow_present === false);
check('incident output carries no content', !JSON.stringify(all).includes('Asha') && !JSON.stringify(all).includes('laughed'));
check('incident scope rejects unknown tables', (await codeOf(() => sys(`select public.ops_incident_scope('{"tables": ["entries; drop table x"]}')`))) === '22023');

// ── Restore replay and drill helpers ──────────────────────────────────────
const counts = await j(`select public.ops_row_counts() v`);
check('row counts are numbers', typeof counts.entries === 'number' && counts.entries >= 2);
const sample = await j(`select public.ops_raw_sha(null, 10, now() + interval '1 minute') v`);
const again = await j(`select public.ops_raw_sha($1, 10, now()) v`, [JSON.stringify(sample.map((s) => s.id))]);
check('raw hash sample is reproducible by id', sample.length >= 1 && JSON.stringify(sample) === JSON.stringify(again));
// Simulate a restore that brought back a purged letter: it is in the ledger but in the table again.
const ghost = '0192e000-0000-7000-8000-0000000000ff';
await sys(`insert into purge_ledger (entity_type, entity_id) values ('entry', $1)`, [ghost]);
await sys(`delete from purge_ledger where entity_id = $1`, [ghost]);
await sys(`insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text)
  values ($1, $2, $3, 'letter', '2026-09-29', now(), 'spoken', 1, 'restored', 'restored')`, [ghost, SHARED, A]);
const rep = await j(`select public.ops_replay_ledger($1) v`, [JSON.stringify([{ t: 'entry', id: ghost }, { t: 'child', id: BOOK2 }, { t: 'profile', id: S2 }])]);
check('replay re-deletes restored letters and books', rep.entries === 1 && rep.books === 1
  && (await sys(`select count(*)::int n from entries where id=$1`, [ghost])).rows[0].n === 0
  && (await sys(`select count(*)::int n from children where id=$1`, [BOOK2])).rows[0].n === 0);
check('replay reports profiles whose Auth user the script must delete', JSON.stringify(rep.profiles_to_delete) === JSON.stringify([S2]));
check('replay is audited with counts only', (await sys(`select detail from audit_events where action='restore_replayed' order by id desc limit 1`)).rows[0].detail.entries === 1);
check('replay is idempotent', (await j(`select public.ops_replay_ledger($1) v`, [JSON.stringify([{ t: 'entry', id: ghost }])])).entries === 0);

done();
