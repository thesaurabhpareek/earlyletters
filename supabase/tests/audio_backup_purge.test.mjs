// Backup deletion paths (20261015230000_backup_server.sql; PRD V2 F08 6.5 D, F17 8.4,
// WP-F08-B3p): a purged letter, a purged book, the orphan and stale sweeps, and account deletion
// from request to finalize, each by exact object path with its ledger rows. The worker side
// (draining the queue, the daily log copy) is in supabase/functions/purge-worker/test.
// Fictional family "Asha" only (CLAUDE.md).
import { createDb, users, uuid7 } from './harness.mjs';

const { db, check, as, sys, codeOf, done, publishPolicies, consent, newChild, join } = await createDb(process.argv.slice(2));
const { A, B, S } = users;
const hex = (byte, n) => Buffer.from(byte.repeat(n), 'hex');
const boxOf = (b) => JSON.stringify({ suite: 'hpke-x25519-sha256-aes256gcm', enc: Buffer.from(b.repeat(32), 'hex').toString('base64'),
  ct: Buffer.from(b.repeat(48), 'hex').toString('base64') });   // stored as 0x01 || enc || ct (81 bytes)
const PEPPER = 'pepper-for-tests-only-0123456789abcdef';
// Supabase's storage.objects has owner and metadata columns; the harness stub does not (as in ops_deletion_worker).
await sys(`alter table storage.objects add column owner uuid, add column owner_id text, add column created_at timestamptz not null default now(),
  add column metadata jsonb`);

await sys(`insert into auth.users values ('${A}'),('${B}'),('${S}')`);
await publishPolicies();
await sys(`insert into policy_versions (document, version, change_class, requires_reconsent, published_at, new_users_from, effective_at,
             content_sha256, url, summary)
           values ('backup', '1.0.0', 'initial', false, now() - interval '2 days', now() - interval '2 days', now() - interval '2 days',
             sha256('backup'::bytea), 'https://example.invalid/backup/1.0.0', 'First version')`);
for (const u of [A, B, S]) {
  await consent(u);
  await as(u, `select public.record_policy_act('backup', '1.0.0', 'accept', 'consent_sheet', 'backup.sheet', '1.0.0', 'ios')`);
}
await sys(`set app.backup_enabled = 'on'`);
await sys(`set app.escrow_enabled = 'on'`);
await sys(`set app.consent_pepper = '${PEPPER}'`);
const SHARED = await newChild(A);
await join(B, 'parent', SHARED, A);
const SOLO = await newChild(S, 'Asha', '2025-06-01');
for (const [u, c, b] of [[A, SHARED, 'aa'], [B, SHARED, 'bb'], [S, SOLO, 'cc']]) {
  await as(u, `select public.backup_store_key($1, 1, 1, $2::jsonb)`, [c, boxOf(b)]);
}

let seq = 0;
const letter = async (author, child) => {
  const id = `0192e300-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
  await sys(`insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book)
    values ($1, $2, $3, 'letter', '2026-09-29', now(), 'spoken', 1, 'um Asha laughed', 'Asha laughed.', true)`, [id, child, author]);
  return id;
};
// A recording backed up end to end: reservation, upload (owned by the author, as the Storage API records), confirmation.
const backedUp = async (author, child) => {
  const id = await letter(author, child);
  const path = (await as(author, `select public.backup_begin($1, $2, 1000, 1, $3::bytea) r`, [id, child, hex('dd', 60)])).rows[0].r.object_path;
  await as(author, `insert into storage.objects (bucket_id, name) values ('entry-audio', $1)`, [path]);
  await sys(`update storage.objects set owner = $2::uuid, owner_id = $2, metadata = '{"size": 1000}' where name = $1`, [path, author]);
  await as(author, `select public.backup_confirm($1, $2::bytea)`, [id, hex('ee', 32)]);
  return { id, path };
};
const queued = async (path) => (await sys(`select 1 from storage_purge_queue where bucket_id = 'entry-audio' and object_path = $1 and not is_prefix and done_at is null`, [path])).rows.length === 1;
const ledgered = async (id, path) => (await sys(`select entity_type from purge_ledger where (entity_type, entity_id) in (('audio_blob', $1), ('storage_object', $2)) order by 1`,
  [id, `entry-audio/${path}`])).rows.map((r) => r.entity_type).join(',') === 'audio_blob,storage_object';
const blobs = async (where, params) => (await sys(`select count(*)::int n from audio_blobs where ${where}`, params)).rows[0].n;

// ── The ledger kind ───────────────────────────────────────────────────────
const def = (await sys(`select pg_get_constraintdef(oid) d from pg_constraint where conname = 'purge_ledger_entity_type_check'`)).rows[0].d;
check('purge_ledger keeps every earlier kind and gains audio_blob', ['entry', 'child', 'profile', 'storage_object', 'audio_blob'].every((k) => def.includes(`'${k}'`)));

// ── A letter purged on day 30 takes its backup with it (F08-REQ-024) ─────
const l1 = await backedUp(A, SHARED);
await sys(`update entries set deleted_at = now(), deleted_reason = 'user' where id = $1`, [l1.id]);
check('in Recently deleted, the backup stays (the letter can still come back)', await blobs('entry_id = $1', [l1.id]) === 1);
await sys(`select public.purge_due(now() + interval '31 days')`);
check('[F08-REQ-024] day 30: the letter\'s audio_blobs row is gone', await blobs('entry_id = $1', [l1.id]) === 0);
check('[F08-REQ-024] day 30: its exact object_path is queued in entry-audio', await queued(l1.path));
check('[F08-REQ-024] day 30: purge_ledger holds storage_object and audio_blob rows for it', await ledgered(l1.id, l1.path));
check('[F08-REQ-024] and the entry row itself, as before', (await sys(`select 1 from purge_ledger where entity_type = 'entry' and entity_id = $1`, [l1.id])).rows.length === 1);
check('a purged letter\'s id can never be reserved again (SCDEL purged)', await codeOf(() => as(A, `select public.backup_begin($1, $2, 1000, 1, $3::bytea)`, [l1.id, SHARED, hex('dd', 60)])) === 'SCDEL');

// Any hard delete of a letter (the F16 erase op, a replayed ledger) does the same.
const l2 = await backedUp(A, SHARED);
await sys(`delete from entries where id = $1`, [l2.id]);
check('[F08-REQ-024] a letter hard-deleted by any path takes its backup in the same transaction', await blobs('entry_id = $1', [l2.id]) === 0
  && await queued(l2.path) && await ledgered(l2.id, l2.path));

// ── A purged book takes every backup in it (whole-book prefix plus exact paths) ──
const s1 = await backedUp(S, SOLO);
const s2 = await backedUp(S, SOLO);
await as(S, `select public.request_book_deletion($1, 'ios')`, [SOLO]);
await sys(`select public.purge_due(now() + interval '31 days')`);
check('a purged book: every backup row in it is gone', await blobs('child_id = $1', [SOLO]) === 0);
check('a purged book: each exact path is queued', await queued(s1.path) && await queued(s2.path));
check('a purged book: the whole-book prefix the worker mirrors into entry-audio is queued', (await sys(`select 1 from storage_purge_queue
  where bucket_id = 'entry-photos' and object_path = $1 and is_prefix`, [`${SOLO}/`])).rows.length === 1);
check('a purged book: its book key rows are gone', (await sys(`select count(*)::int n from child_keys where child_id = $1`, [SOLO])).rows[0].n === 0);

// ── Sweeps (F08 6.5 D6) ───────────────────────────────────────────────────
const sweep = async (at = 'now()') => (await (async () => { await db.exec('set role service_role'); try { return await db.query(`select public.backup_svc_sweep(${at}, 100) r`); } finally { await db.exec('reset role'); } })()).rows[0].r;
const l3 = await backedUp(A, SHARED);
await sys(`update entries set deleted_at = now(), deleted_reason = 'user' where id = $1`, [l3.id]);
await sys(`update audio_blobs set created_at = now() - interval '60 days' where entry_id = $1`, [l3.id]);
const sw0 = await sweep();
check('the sweep never takes the backup of a letter in Recently deleted', sw0.orphans === 0 && await blobs('entry_id = $1', [l3.id]) === 1);
await sys(`update entries set deleted_at = null, deleted_reason = null where id = $1`, [l3.id]);
const orphanId = uuid7();
const orphanYoung = uuid7();
for (const [id, age] of [[orphanId, '31 days'], [orphanYoung, '29 days']]) {
  await sys(`insert into audio_blobs (entry_id, child_id, author_id, object_path, key_version, wrapped_file_key, bytes, created_at)
    values ($1, $2, $3, $4, 1, $5::bytea, 10, now() - $6::interval)`, [id, SHARED, A, `${SHARED}/${A}/${id}.m4a.enc`, hex('dd', 60), age]);
}
const l4 = await letter(A, SHARED);
const l5 = await letter(A, SHARED);
await as(A, `select public.backup_begin($1, $2, 1000, 1, $3::bytea)`, [l4, SHARED, hex('dd', 60)]);
await as(A, `select public.backup_begin($1, $2, 1000, 1, $3::bytea)`, [l5, SHARED, hex('dd', 60)]);
await sys(`update audio_blobs set updated_at = now() - interval '25 hours' where entry_id = $1`, [l4]);
await sys(`update audio_blobs set updated_at = now() - interval '23 hours' where entry_id = $1`, [l5]);
const sw = await sweep();
check('[F08-REQ-043] the sweep purges a backup with no letter for 30 days (a crash path)', sw.orphans === 1 && await blobs('entry_id = $1', [orphanId]) === 0
  && await queued(`${SHARED}/${A}/${orphanId}.m4a.enc`));
check('the sweep leaves a younger one alone', await blobs('entry_id = $1', [orphanYoung]) === 1);
check('the sweep purges a reservation never confirmed in 24 hours (its object, if any, goes too)', sw.stale_pending === 1 && await blobs('entry_id = $1', [l4]) === 0
  && await queued(`${SHARED}/${A}/${l4}.m4a.enc`));
check('a reservation younger than 24 hours stays (a slow upload)', await blobs('entry_id = $1', [l5]) === 1);
await as(A, `select public.backup_discard($1)`, [l5]);
check('users cannot run the sweep', await codeOf(() => as(A, `select public.backup_svc_sweep(now(), 1)`)) === '42501');

// ── Account deletion from request to finalize (F17 8.4, F08-REQ-040 server part) ──
const keepB = await backedUp(B, SHARED);
const a1 = await backedUp(A, SHARED);
const DEV = uuid7();
const DEV_NEW = uuid7();
const SESS_A = uuid7();
await as(A, `select public.backup_register_device($1, $2::bytea)`, [DEV, hex('a1', 32)]);
await as(A, `select public.backup_register_device($1, $2::bytea)`, [DEV_NEW, hex('a2', 32)]);
await sys(`update backup_devices set enrolled_at = now() - interval '30 days' where device_id = $1`, [DEV]);
await sys(`insert into auth.sessions (id, user_id) values ($1, $2)`, [SESS_A, A]);
await db.exec('set role escrow_svc');
const req = (await db.query(`select public.escrow_open_request($1, $2, $3, '0123456789ab', $4::bytea, $5::jsonb) r`,
  [A, DEV_NEW, SESS_A, hex('5a', 32), JSON.stringify([{ device_id: DEV, code_hash_hex: '11'.repeat(32), sealed_code_hex: '5c'.repeat(80) }])])).rows[0].r;
await db.exec('reset role');
await sys(`insert into escrow_unwraps (profile_id, device_id, child_id, key_version, escrow_key_version, reason, outcome, restore_request_id)
  values ($1, $2, $3, 1, 1, 'restore', 'opened', $4)`, [A, DEV_NEW, SHARED, req.request_id]);

const dreq = (await as(A, `select request_id from public.request_account_deletion('ios')`)).rows[0].request_id;
check('[F17 8.4] at request: the open restore request is cancelled (cancel_source deletion)',
  (await sys(`select state, cancel_source s from restore_requests where id = $1`, [req.request_id])).rows[0].s === 'deletion');
check('[F17 8.4] during the grace period, the backup is kept so a cancel restores everything', await blobs('author_id = $1', [A]) >= 1);
await sys(`select public.purge_due(now() + interval '31 days')`);
await sys(`select public.prepare_account_purge($1)`, [dreq]);
check('[F08-REQ-040] prepare: the person\'s letters go, and their backups with them by exact path', await blobs('entry_id = $1', [a1.id]) === 0
  && await queued(a1.path) && await ledgered(a1.id, a1.path));
// The worker's storage step deletes what the person owns, then Auth deletes the user (cascade).
await sys(`delete from storage.objects where owner = $1`, [A]);
await sys(`delete from auth.users where id = $1`, [A]);
const left = (await sys(`select (select count(*) from backup_devices where profile_id = $1) d, (select count(*) from child_keys where profile_id = $1) k,
  (select count(*) from audio_blobs where author_id = $1) b, (select count(*) from backup_usage where profile_id = $1) u,
  (select count(*) from restore_requests where profile_id = $1) r, (select count(*) from restore_approvals where device_id = $2) a`, [A, DEV])).rows[0];
check('[F08-REQ-040] execution: devices, book keys, recordings, usage, restore requests and approval codes are gone',
  Object.values(left).every((n) => Number(n) === 0) || console.log(`      ${JSON.stringify(left)}`));
check('[F17 8.4] execution: the access log stays, pseudonymised (named exception, 24 months)', (await sys(`select count(*)::int n from escrow_unwraps
  where profile_id is null and subject_hash = sha256(convert_to($1 || $2, 'UTF8'))`, [A, PEPPER])).rows[0].n === 1);
const residue = (await sys(`select public.ops_deletion_residue($1, 'before_finalize') v`, [A])).rows[0].v;
check('[LEGAL-REQ-029] the residue scan finds nothing of the person in any backup table', residue.length === 0 || console.log(`      ${JSON.stringify(residue)}`));
await sys(`select public.finalize_account_deletion($1, '{"verified": true}')`, [dreq]);
check('[LEGAL-REQ-029] after finalize, no residue at all', (await sys(`select public.ops_deletion_residue($1, 'after_finalize') v`, [A])).rows[0].v.length === 0);
check('the co-parent\'s backup in the shared book is untouched', await blobs('entry_id = $1', [keepB.id]) === 1
  && (await sys(`select count(*)::int n from child_keys where profile_id = $1`, [B])).rows[0].n === 1);
check('the usage counter only ever counts what exists', Number((await sys(`select used_bytes from backup_usage where profile_id = $1`, [B])).rows[0].used_bytes)
  === Number((await sys(`select coalesce(sum(bytes), 0) s from audio_blobs where author_id = $1`, [B])).rows[0].s));

done();
