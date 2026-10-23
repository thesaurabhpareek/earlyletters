// Encrypted recording backup, owner side (20261023000000_backup_server.sql; PRD V2 F08 6.5,
// WP-F08-B3). Devices, book key wraps, upload reservations, quota, consent, switches and the
// entry-audio Storage policies. Escrow rules: audio_backup_escrow.test.mjs. Deletion and the
// purge paths: audio_backup_purge.test.mjs. Fictional family "Asha" only (CLAUDE.md).
import { createDb, users, uuid7 } from './harness.mjs';

const { check, as, sys, one, codeOf, done, publishPolicies, consent, newChild, join } = await createDb(process.argv.slice(2));
const { A, B, C, N, W } = users;
const hex = (byte, n) => Buffer.from(byte.repeat(n), 'hex');
const boxOf = (b) => JSON.stringify({ suite: 'hpke-x25519-sha256-aes256gcm', enc: Buffer.from(b.repeat(32), 'hex').toString('base64'),
  ct: Buffer.from(b.repeat(48), 'hex').toString('base64') });   // stored as 0x01 || enc || ct (81 bytes)
const WRAP = boxOf('ab');
const FKEY = hex('cd', 60);                        // a wrapped file key
const SHA = hex('ef', 32);

await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}'),('${N}'),('${W}')`);
await publishPolicies();
await sys(`insert into policy_versions (document, version, change_class, requires_reconsent, published_at, new_users_from, effective_at,
             content_sha256, url, summary)
           values ('backup', '1.0.0', 'initial', false, now() - interval '2 days', now() - interval '2 days', now() - interval '2 days',
             sha256('backup'::bytea), 'https://example.invalid/backup/1.0.0', 'First version')`);
for (const u of [A, B, C, N]) await consent(u);
const CHILD = await newChild(A);
await join(B, 'parent', CHILD, A);
await join(N, 'contributor', CHILD, A);
await sys(`insert into child_members (child_id, profile_id, role) values ($1, $2, 'contributor')`, [CHILD, W]);

const backupConsent = (uid, action = 'accept') =>
  as(uid, `select public.record_policy_act('backup', '1.0.0', $1, 'consent_sheet', 'backup.sheet', '1.0.0', 'ios')`, [action]);

let seq = 0;
const letter = async (author, child = CHILD) => {
  const id = `0192e100-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
  await sys(`insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book)
    values ($1, $2, $3, 'letter', '2026-09-29', now(), 'spoken', 1, 'um Asha laughed', 'Asha laughed.', true)`, [id, child, author]);
  return id;
};
const begin = (uid, entry, { child = CHILD, bytes = 1000, kv = 1, fkey = FKEY } = {}) =>
  one(uid, `select public.backup_begin($1, $2, $3, $4, $5::bytea) r`, [entry, child, bytes, kv, fkey]).then((x) => x.r);
const storeKey = (uid, { child = CHILD, kv = 1, wrap = WRAP, ekv = 1, check = null } = {}) =>
  one(uid, `select public.backup_store_key($1, $2, $3, $4::jsonb, $5::bytea) r`, [child, kv, ekv, wrap, check]).then((x) => x.r);
const putObject = (uid, name) => as(uid, `insert into storage.objects (bucket_id, name) values ('entry-audio', $1)`, [name]);

// ── The bucket and the tables ─────────────────────────────────────────────
const bucket = (await sys(`select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'entry-audio'`)).rows[0];
check('[F08-REQ-033] entry-audio is private, holds objects up to 20 MB, ciphertext only',
  bucket && bucket.public === false && Number(bucket.file_size_limit) === 20971520
  && JSON.stringify(bucket.allowed_mime_types) === JSON.stringify(['application/octet-stream']));
const TABLES = ['backup_devices', 'child_keys', 'audio_blobs', 'backup_usage', 'restore_requests', 'restore_approvals', 'escrow_unwraps',
  'escrow_rotation_notices'];
check('every backup table has row level security on', (await sys(`select count(*)::int n from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = any($1) and c.relrowsecurity`, [TABLES])).rows[0].n === TABLES.length);
check('every backup table has a restrictive anonymous-session policy', (await sys(`select count(distinct tablename)::int n from pg_policies
  where schemaname = 'public' and tablename = any($1) and permissive = 'RESTRICTIVE' and qual ~ 'is_anonymous'`, [TABLES])).rows[0].n === TABLES.length);
for (const t of TABLES) {
  check(`${t}: no client can write it directly`, await codeOf(() => as(A, `delete from ${t}`)) === '42501');
}
// Hosted Supabase grants every new table to service_role too (the harness mirrors that, so the
// first check proves the default is in force); the backup tables take it back.
const priv = async (t, p) => (await sys(`select has_table_privilege('service_role', $1, $2) v`, [`public.${t}`, p])).rows[0].v;
check('harness: a table without its own revoke is granted to service_role, as on hosted Supabase', await priv('entries', 'delete') === true);
for (const t of TABLES) {
  check(`${t}: the service role has no table privilege (only the backup_svc_* functions)`,
    !(await priv(t, 'select')) && !(await priv(t, 'insert')) && !(await priv(t, 'update')) && !(await priv(t, 'delete')));
}
check('the escrow wrap column is not readable by any client', await codeOf(() => as(A, `select escrow_wrap from child_keys`)) === '42501');
check('the stop token hash is not readable by any client', await codeOf(() => as(A, `select stop_token_hash from restore_requests`)) === '42501');
check('approval code hashes are not readable by any client', await codeOf(() => as(A, `select code_hash from restore_approvals`)) === '42501');
check('the backup policy document exists and needs its own act', (await sys(`select needs_affirmative_act a from policy_documents where key = 'backup'`)).rows[0]?.a === true);

// ── Switches and consent ──────────────────────────────────────────────────
const L1 = await letter(A);
check('[F08-REQ-041] with app.backup_enabled unset, storing a key is SCBKO', await codeOf(() => storeKey(A)) === 'SCBKO');
check('[F08-REQ-041] with app.backup_enabled unset, a reservation is SCBKO', await codeOf(() => begin(A, L1)) === 'SCBKO');
await sys(`set app.backup_enabled = 'on'`);
check('[F08-REQ-039] without a backup act, storing a key is SCCON', await codeOf(() => storeKey(A)) === 'SCCON');
check('[F08-REQ-039] without a backup act, a reservation is SCCON', await codeOf(() => begin(A, L1)) === 'SCCON');
const sccon = await (async () => { try { await storeKey(A); } catch (e) { return e.detail; } })();
check('SCCON names the backup consent so the app shows the right sheet', sccon === 'backup');
await backupConsent(A);
await backupConsent(B);
await backupConsent(N);
check('the sensitive-data consent does not stand in for the backup act (spec default, F08 Q6)',
  (await sys(`select public.has_active_consent($1, 'sensitive-data') s, public.has_active_consent($1, 'backup') b`, [C])).rows
    .every((r) => r.s === true && r.b === false));

// ── Devices ───────────────────────────────────────────────────────────────
const DEV_A = uuid7();
const KEY_A = hex('a1', 32);
const reg = (uid, dev, key) => one(uid, `select public.backup_register_device($1, $2::bytea) r`, [dev, key]).then((x) => x.r);
check('[F08-REQ-027] a device registers its 32-byte public key', (await reg(A, DEV_A, KEY_A)).created === true);
check('registering the same device again changes nothing', (await reg(A, DEV_A, KEY_A)).created === false);
check('a device id cannot be taken by another person', await codeOf(() => reg(B, DEV_A, KEY_A)) === 'SCIMM');
check('a device id cannot change its key', await codeOf(() => reg(A, DEV_A, hex('a2', 32))) === 'SCIMM');
check('a public key belongs to one device', await codeOf(() => reg(B, uuid7(), KEY_A)) === 'SCIMM');
check('a key that is not 32 bytes is refused', await codeOf(() => reg(A, uuid7(), hex('a3', 31))) === '22023');
check('anonymous sessions cannot register a device', await codeOf(() => as(W, `select public.backup_register_device($1, $2::bytea)`, [uuid7(), hex('a4', 32)], { anonymous: true })) === 'SCANO');
const DEV_X = uuid7();
await reg(A, DEV_X, hex('a5', 32));
check('the owner revokes a device', (await one(A, `select public.backup_revoke_device($1) r`, [DEV_X])).r.revoked === true);
check('a revoked device cannot come back under the same id', await codeOf(() => reg(A, DEV_X, hex('a5', 32))) === 'SCIMM');
check('nobody else can revoke the owner\'s device', await codeOf(() => as(B, `select public.backup_revoke_device($1)`, [DEV_A])) === 'P0002');
for (let i = 0; i < 9; i++) await reg(C, uuid7(), hex((0x10 + i).toString(16), 32));
check('at most 10 devices a day per account (SCRAT devices)', await codeOf(() => reg(C, uuid7(), hex('1f', 32))) === 'ok'
  && await codeOf(() => reg(C, uuid7(), hex('20', 32))) === 'SCRAT');
check('the owner reads their own devices only', (await as(A, `select device_id from backup_devices`)).rows.length === 2
  && (await as(B, `select device_id from backup_devices`)).rows.length === 0);

// ── Book keys ─────────────────────────────────────────────────────────────
check('[F08-REQ-021] a parent stores the escrow wrap of their book key, version 1', (await storeKey(A)).created === true);
check('storing the same wrap again changes nothing', (await storeKey(A)).created === false);
const keyExists = await (async () => { try { await storeKey(A, { wrap: boxOf('cc') }); } catch (e) { return `${e.code} ${e.detail}`; } })();
check('[F08-REQ-028] a different key for the same book and author is refused (restore instead)', keyExists === 'SCIMM key_exists');
check('[F08-REQ-028] v1.0 never makes a second key version', await codeOf(() => storeKey(A, { kv: 2 })) === 'SCIMM');
check('[F08-REQ-021] the co-parent keeps a book key of their own for the same book', (await storeKey(B)).created === true);
check('[F08-REQ-021] two keys exist for the book, one per parent', (await sys(`select count(*)::int n from child_keys where child_id = $1`, [CHILD])).rows[0].n === 2);
check('[F08-REQ-022] each parent reads only their own key row', (await as(A, `select profile_id from child_keys`)).rows.every((r) => r.profile_id === A)
  && (await as(B, `select profile_id from child_keys`)).rows.every((r) => r.profile_id === B));
check('family members cannot store a book key (SCPAR)', await codeOf(() => storeKey(N)) === 'SCPAR');
await backupConsent(C);
check('people outside the book cannot store a book key (SCPAR)', await codeOf(() => storeKey(C)) === 'SCPAR');
const badBox = (over) => JSON.stringify({ ...JSON.parse(WRAP), ...over });
check('a wrap that is not a SealedBox of the right suite and sizes is refused', await codeOf(() => storeKey(C, { wrap: badBox({ suite: 'hpke-p256' }) })) === '22023'
  && await codeOf(() => storeKey(C, { wrap: badBox({ enc: Buffer.alloc(31).toString('base64') }) })) === '22023'
  && await codeOf(() => storeKey(C, { wrap: badBox({ ct: Buffer.alloc(47).toString('base64') }) })) === '22023'
  && await codeOf(() => storeKey(C, { wrap: badBox({ ct: 'not base64!' }) })) === '22023'
  && await codeOf(() => storeKey(C, { wrap: badBox({ extra: 1 }) })) === '22023');
check('the wrap is stored in format 1 (0x01, enc, ct: 81 bytes)', (await sys(`select encode(escrow_wrap, 'hex') w from child_keys where profile_id = $1`, [A])).rows[0].w
  === '01' + 'ab'.repeat(80));
check('a key check that is not 16 bytes is refused', await codeOf(() => storeKey(C, { check: hex('11', 15) })) === '22023');
check('a wrap to an escrow key version the server does not trust is refused', await codeOf(() => storeKey(C, { ekv: 7 })) === '22023');

// ── Reservations, uploads and confirmation ────────────────────────────────
const r1 = await begin(A, L1);
const PATH1 = `${CHILD}/${A}/${L1}.m4a.enc`;
check('[DATA-REQ-047] a reservation names the one path {child}/{author}/{entry}.m4a.enc', r1.object_path === PATH1 && r1.state === 'pending' && r1.created === true);
check('the same reservation again resumes it', (await begin(A, L1)).created === false);
check('a re-encrypted upload replaces a pending reservation', (await begin(A, L1, { fkey: hex('ce', 60), bytes: 1200 })).replaced === true);
check('the quota counts reserved bytes', (await sys(`select used_bytes::int n from backup_usage where profile_id = $1`, [A])).rows[0].n === 1200);
check('[F08-REQ-032] a recording whose letter is not on the server yet is refused', await codeOf(() => begin(A, uuid7())) === 'P0002');
const BL = await letter(B);
check('a parent cannot back up the other parent\'s letter', await codeOf(() => begin(A, BL)) === 'P0002');
check('a recording id already reserved by one parent is refused for the other', await codeOf(() => begin(B, L1)) === 'SCIMM');
const NL = await letter(N);
check('a family member cannot back up into the book (SCPAR)', await codeOf(() => begin(N, NL)) === 'SCPAR');
const L2 = await letter(A);
check('[F08-REQ-033] a reservation over 20 MB is refused', await codeOf(() => begin(A, L2, { bytes: 20971521 })) === '22023');
check('a reservation needs the book key first', await codeOf(() => begin(A, L2, { kv: 2 })) === 'P0002');
await sys(`update entries set deleted_at = now(), deleted_reason = 'user' where id = $1`, [L2]);
check('a letter in Recently deleted is not backed up', await codeOf(() => begin(A, L2)) === 'P0002');

// Storage policies (the only gate the Storage API's signed upload and download URLs pass).
check('[F08-REQ-033] the owner uploads to the reserved path', await codeOf(() => putObject(A, PATH1)) === 'ok');
const L3 = await letter(A);
check('[F08-REQ-033] an upload with no matching pending row is refused by policy', await codeOf(() => putObject(A, `${CHILD}/${A}/${L3}.m4a.enc`)) === '42501');
check('[DATA-REQ-047] the co-parent cannot write into the owner\'s path', await codeOf(() => putObject(B, `${CHILD}/${A}/${L3}.m4a.enc`)) === '42501');
check('an anonymous session cannot write to entry-audio', await codeOf(() => as(W, `insert into storage.objects (bucket_id, name) values ('entry-audio', $1)`, [PATH1], { anonymous: true })) === '42501');
check('helper: the owner\'s pending path is writable', (await one(A, `select public.backup_object_writable($1) v`, [PATH1])).v === true);
const objCount = (uid, name, opts) => as(uid, `select 1 from storage.objects where bucket_id = 'entry-audio' and name = $1`, [name], opts).then((r) => r.rows.length);
check('[F08-REQ-022] only the owner reads the object', await objCount(A, PATH1) === 1 && await objCount(B, PATH1) === 0
  && await objCount(N, PATH1) === 0 && await objCount(C, PATH1) === 0 && await objCount(W, PATH1, { anonymous: true }) === 0);
check('no client deletes an object (the purge worker does)', (await as(A, `delete from storage.objects where name = $1`, [PATH1])).affectedRows === 0);

// Confirm.
const confirm = (uid, entry, sha = SHA) => one(uid, `select public.backup_confirm($1, $2::bytea) r`, [entry, sha]).then((x) => x.r);
const L4 = await letter(A);
await begin(A, L4, { bytes: 500 });
check('confirming before the object arrived is refused', await codeOf(() => confirm(A, L4)) === 'P0002');
check('without a recorded object size, nothing is confirmed on trust (P0002 object)', await (async () => {
  await sys(`insert into storage.objects (bucket_id, name) values ('entry-audio', $1)`, [`${CHILD}/${A}/${L4}.m4a.enc`]);
  try { await confirm(A, L4); return false; } catch (e) { return `${e.code} ${e.detail}` === 'P0002 object'; }
  finally { await sys(`delete from storage.objects where name = $1`, [`${CHILD}/${A}/${L4}.m4a.enc`]); }
})());
await sys(`alter table storage.objects add column metadata jsonb`);
await putObject(A, `${CHILD}/${A}/${L4}.m4a.enc`);
check('an object whose metadata has no size is not confirmed either (P0002)', await codeOf(() => confirm(A, L4)) === 'P0002');
await sys(`update storage.objects set metadata = '{"size": 499}' where name = $1`, [`${CHILD}/${A}/${L4}.m4a.enc`]);
check('confirming an object whose stored size differs from the reservation is refused', await codeOf(() => confirm(A, L4)) === '22023');
await sys(`update storage.objects set metadata = '{"size": 1200}' where name = $1`, [PATH1]);
check('the owner confirms an upload', (await confirm(A, L1)).created === true);
check('confirming again with the same hash changes nothing', (await confirm(A, L1)).created === false);
check('a confirmed recording never takes another hash', await codeOf(() => confirm(A, L1, hex('ee', 32))) === 'SCIMM');
check('nobody else can confirm the owner\'s recording', await codeOf(() => confirm(B, L1)) === 'P0002');
check('a confirmed reservation is reported as confirmed, not reopened', (await begin(A, L1)).state === 'confirmed');
check('a confirmed object can no longer be overwritten', (await one(A, `select public.backup_object_writable($1) v`, [PATH1])).v === false
  && (await as(A, `update storage.objects set name = name where bucket_id = 'entry-audio' and name = $1`, [PATH1])).affectedRows === 0);
check('helper: the owner\'s confirmed path stays readable', (await one(A, `select public.backup_object_readable($1) v`, [PATH1])).v === true);
check('[F08-REQ-022] audio_blobs rows are the owner\'s alone', (await as(A, `select entry_id from audio_blobs`)).rows.length >= 1
  && (await as(B, `select entry_id from audio_blobs`)).rows.length === 0 && (await as(N, `select entry_id from audio_blobs`)).rows.length === 0);

// Downloads are never gated: consent withdrawn and the switch off still read what is backed up.
await backupConsent(A, 'withdraw');
check('[F08-REQ-039] after a withdraw act, a new reservation is SCCON', await codeOf(() => begin(A, L3)) === 'SCCON');
check('after a withdraw act, the owner still reads what is backed up', await objCount(A, PATH1) === 1);
await sys(`set app.backup_enabled = 'off'`);
check('[F08-REQ-025] with the switch off, the owner still reads what is backed up', await objCount(A, PATH1) === 1);
check('with the switch off, nothing can be written', (await one(A, `select public.backup_object_writable($1) v`, [`${CHILD}/${A}/${L4}.m4a.enc`])).v === false);
await sys(`set app.backup_enabled = 'on'`);
await backupConsent(A);

// ── Quota and rate ────────────────────────────────────────────────────────
await sys(`update backup_usage set quota_bytes = used_bytes + 100 where profile_id = $1`, [A]);
check('[F08-REQ-033] a reservation past the 5 GB quota is SCQTA', await codeOf(() => begin(A, L3, { bytes: 101 })) === 'SCQTA');
check('the default quota is 5 GiB', (await sys(`select column_default d from information_schema.columns
  where table_name = 'backup_usage' and column_name = 'quota_bytes'`)).rows[0].d.includes('5368709120'));
await sys(`update backup_usage set quota_bytes = 5368709120, begin_window_hits = 600, begin_window_start = now() where profile_id = $1`, [A]);
const rate = await (async () => { try { await begin(A, L3); } catch (e) { return `${e.code} ${e.detail}`; } })();
check('at most 600 new reservations an hour (SCRAT begin)', rate === 'SCRAT begin');
check('a resumed reservation never counts against the hour', (await begin(A, L4, { bytes: 500 })).created === false);
await sys(`update backup_usage set begin_window_start = now() - interval '61 minutes' where profile_id = $1`, [A]);
check('the hour window starts again', (await begin(A, L3)).created === true);
// At most 20 reservations wait at once (the quota counts reserved sizes; confirm needs that size).
const pendingNow = Number((await sys(`select count(*) n from audio_blobs where author_id = $1 and state = 'pending'`, [A])).rows[0].n);
const FILLERS = Array.from({ length: 20 - pendingNow }, (_, i) => `0192e1ff-0000-7000-8000-${String(i + 1).padStart(12, '0')}`);
for (const f of FILLERS) {
  await sys(`insert into audio_blobs (entry_id, child_id, author_id, object_path, key_version, wrapped_file_key, bytes)
             values ($1, $2, $3, $4, 1, $5, 10)`, [f, CHILD, A, `${CHILD}/${A}/${f}.m4a.enc`, FKEY]);
}
const L5 = await letter(A);
const tooMany = await (async () => { try { await begin(A, L5); } catch (e) { return `${e.code} ${e.detail}`; } })();
check('[F08-REQ-033] with 20 reservations waiting, a 21st is SCRAT pending', tooMany === 'SCRAT pending');
check('a waiting reservation still resumes at the limit', (await begin(A, L4, { bytes: 500 })).created === false);
await sys(`delete from audio_blobs where entry_id = any($1::uuid[])`, [FILLERS]);
check('once uploads finish or go, reservations open again', (await begin(A, L5)).created === true);
await as(A, `select public.backup_discard($1)`, [L5]);
await sys(`update storage_purge_queue set done_at = now() where bucket_id = 'entry-audio'`);

// ── Discard and delete all ────────────────────────────────────────────────
const used = async (uid) => Number((await sys(`select used_bytes from backup_usage where profile_id = $1`, [uid])).rows[0].used_bytes);
const before = await used(A);
check('[F08-REQ-043] discarding a recording\'s backup removes its row', (await one(A, `select public.backup_discard($1) r`, [L3])).r.discarded === true);
check('[F08-REQ-043] the exact object path is queued for the purge worker',
  (await sys(`select 1 from storage_purge_queue where bucket_id = 'entry-audio' and object_path = $1 and not is_prefix`, [`${CHILD}/${A}/${L3}.m4a.enc`])).rows.length === 1);
check('[F08-REQ-043] the purge ledger holds audio_blob and storage_object rows for it',
  (await sys(`select entity_type from purge_ledger where (entity_type, entity_id) in (('audio_blob', $1), ('storage_object', $2)) order by 1`,
    [L3, `entry-audio/${CHILD}/${A}/${L3}.m4a.enc`])).rows.map((r) => r.entity_type).join(',') === 'audio_blob,storage_object');
check('the quota gives the bytes back', (await used(A)) === before - 1000);
const purging = await (async () => { try { await begin(A, L3); } catch (e) { return `${e.code} ${e.detail}`; } })();
check('while the old object still waits for the purge worker, a new reservation of that path waits (55P03 purging)', purging === '55P03 purging');
await sys(`update storage_purge_queue set done_at = now() where bucket_id = 'entry-audio' and object_path = $1`, [`${CHILD}/${A}/${L3}.m4a.enc`]);
check('once the old object is gone, the live letter can be backed up again', (await begin(A, L3)).created === true);
await as(A, `select public.backup_discard($1)`, [L3]);
await sys(`update storage_purge_queue set done_at = now() where bucket_id = 'entry-audio'`);
check('discarding someone else\'s recording does nothing', (await one(B, `select public.backup_discard($1) r`, [L1])).r.discarded === false);

const confirmed = Number((await sys(`select count(*) n from audio_blobs where author_id = $1 and state = 'confirmed'`, [A])).rows[0].n);
// "Delete the backup" needs a sign-in in the last 10 minutes (amr in the JWT PostgREST passes)
// in a session that still exists (auth.sessions; the stop link signs every session out).
const SESS_A = '0192e1ee-0000-7000-8000-0000000000a1';
await sys(`insert into auth.sessions (id, user_id) values ($1, $2)`, [SESS_A, A]);
const withAmr = async (uid, ageSec, sql, params, session = SESS_A) => {
  const claims = JSON.stringify({ sub: uid, role: 'authenticated', is_anonymous: false, session_id: session,
    amr: [{ method: 'otp', timestamp: Math.floor(Date.now() / 1000) - ageSec }] });
  await sys('reset role');
  await sys(`select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)`, [uid, claims]);
  await sys('set role authenticated');
  try { return await sys(sql, params); } finally {
    await sys('reset role');
    await sys(`select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claims', '', false)`);
  }
};
const stale = await (async () => { try { await withAmr(A, 3600, `select public.backup_delete_all($1)`, [confirmed]); } catch (e) { return `${e.code} ${e.detail}`; } })();
check('a session whose last sign-in is older than 10 minutes cannot delete the backup (SCSTP step_up_required)', stale === 'SCSTP step_up_required');
check('a token with no sign-in time cannot delete the backup either', await codeOf(() => as(A, `select public.backup_delete_all($1)`, [confirmed])) === 'SCSTP');
check('a fresh sign-in whose session was signed out cannot delete the backup (SCSTP)',
  await codeOf(() => withAmr(A, 60, `select public.backup_delete_all($1)`, [confirmed], '0192e1ee-0000-7000-8000-0000000000ff')) === 'SCSTP'
  && await codeOf(() => withAmr(A, 60, `select public.backup_delete_all($1)`, [confirmed], null)) === 'SCSTP');
await sys(`update auth.sessions set not_after = now() - interval '1 minute' where id = $1`, [SESS_A]);
check('nor can one whose session has passed its end', await codeOf(() => withAmr(A, 60, `select public.backup_delete_all($1)`, [confirmed])) === 'SCSTP');
await sys(`update auth.sessions set not_after = null where id = $1`, [SESS_A]);
const wrong = await (async () => { try { await withAmr(A, 60, `select public.backup_delete_all($1)`, [confirmed + 1]); } catch (e) { return `${e.code} ${e.detail} ${e.hint}`; } })();
check('[F08-REQ-035] "Delete the backup" deletes nothing unless the count matches what is backed up', wrong === `22023 count ${confirmed}`);
const del = (await withAmr(A, 60, `select public.backup_delete_all($1) r`, [confirmed])).rows[0].r;
check('[F08-REQ-035] with the right count, every recording and the book key go', del.deleted_recordings >= 1 && del.deleted_keys === 1
  && (await sys(`select count(*)::int n from audio_blobs where author_id = $1`, [A])).rows[0].n === 0
  && (await sys(`select count(*)::int n from child_keys where profile_id = $1`, [A])).rows[0].n === 0);
check('every deleted recording\'s exact path is queued', (await sys(`select count(*)::int n from storage_purge_queue where bucket_id = 'entry-audio' and object_path like $1`,
  [`${CHILD}/${A}/%`])).rows[0].n >= 3);
check('the other parent\'s key is untouched', (await sys(`select count(*)::int n from child_keys where profile_id = $1`, [B])).rows[0].n === 1);
check('turning backup on again stores the same book key as version 1, with its key check', (await storeKey(A, { check: hex('3c', 16) })).created === true);
check('the owner reads the key check (which key was escrowed), never the wrap', (await as(A, `select encode(key_check, 'hex') c from child_keys`)).rows[0].c === '3c'.repeat(16));
const otherKey = await (async () => { try { await storeKey(A, { check: hex('3d', 16) }); } catch (e) { return `${e.code} ${e.detail}`; } })();
check('[F08-REQ-028] the same version with another key check is another key: SCIMM key_exists', otherKey === 'SCIMM key_exists');
await sys(`update storage_purge_queue set done_at = now() where bucket_id = 'entry-audio'`);
check('after "Delete the backup" and turning it on again, the same recordings back up again', (await begin(A, L4, { bytes: 500 })).created === true);

// ── An account being deleted stops uploads ────────────────────────────────
await as(B, `select * from public.request_account_deletion('ios')`);
const delCode = await (async () => { try { await begin(B, BL); } catch (e) { return `${e.code} ${e.detail}`; } })();
check('[F17 8.4] once account deletion is requested, uploads stop (SCDEL deletion_pending)', delCode === 'SCDEL deletion_pending');
check('once account deletion is requested, no new device registers', await codeOf(() => reg(B, uuid7(), hex('b1', 32))) === 'SCDEL');
await as(B, `select public.cancel_account_deletion()`);
check('cancelling the deletion lets uploads start again', (await begin(B, BL)).created === true);

done();
