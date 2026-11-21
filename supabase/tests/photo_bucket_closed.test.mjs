// BL-870 (S1, 20261110000000): the server refuses a picture. Fictional family "Asha" only (CLAUDE.md).
//   [NS-01-R61] the server refuses a picture: no client write to entry-photos, no new entries.photo_path.
//   [NS-36-R1d] no picture on the server: write denied for any role, 0 objects after the attempts.
// Each P0 row carries one in-file mutant: the old policy (or the trigger switched off) is put back and the
// same attempt must then succeed, which proves the check above it can fail. The mutant is undone after.
import { createDb, users, uuid7 } from './harness.mjs';

const h = await createDb(process.argv.slice(2));
const { check, as, asAnon, sys, codeOf, done, publishPolicies, consent, newChild, join } = h;
const { A, B, C, N } = users;
const F = '99999999-9999-9999-9999-999999999990'; // a former member (left the book)

await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}'),('${N}'),('${F}')`);
await publishPolicies();
for (const u of [A, B, C, N, F]) await consent(u);
const CHILD = await newChild(A);
await join(B, 'parent', CHILD, A);
await join(N, 'contributor', CHILD, A);
await join(F, 'contributor', CHILD, A);
await as(A, `select public.remove_child_member($1, $2)`, [CHILD, F]);

const objects = async () => (await sys(`select count(*)::int n from storage.objects where bucket_id = 'entry-photos'`)).rows[0].n;
const put = (uid, name) => as(uid, `insert into storage.objects (bucket_id, name) values ('entry-photos', $1)`, [name]);
const personas = [['owner', A], ['co-parent', B], ['family member', N], ['former member', F], ['outsider', C]];

// --- [NS-01-R61] bucket: insert refused for every role -------------------------------------------------
for (const [label, uid] of personas) {
  check(`[NS-01-R61] ${label} cannot upload to entry-photos (42501)`, (await codeOf(() => put(uid, `${CHILD}/${uid}/${uuid7()}.jpg`))) === '42501');
}
check('[NS-01-R61] anon cannot upload to entry-photos (42501)',
  (await codeOf(() => asAnon(`insert into storage.objects (bucket_id, name) values ('entry-photos', $1)`, [`${CHILD}/${A}/${uuid7()}.jpg`]))) === '42501');
check('[NS-36-R1d] 0 objects in entry-photos after every attempt', (await objects()) === 0);

// A legacy object (placed by the service, as the owner of the database) stays readable and deletable.
const legacy = `${CHILD}/${A}/${uuid7()}.jpg`;
await sys(`insert into storage.objects (bucket_id, name) values ('entry-photos', $1)`, [legacy]);
check('[NS-01-R61] the author still reads a legacy object', (await as(A, `select 1 from storage.objects where name = $1`, [legacy])).rows.length === 1);
check('[NS-01-R61] an update (rename, upsert) of a legacy object changes no row',
  await (async () => {
    await codeOf(() => as(A, `update storage.objects set name = $2 where name = $1`, [legacy, `${CHILD}/${A}/${uuid7()}.jpg`]));
    return (await sys(`select 1 from storage.objects where name = $1`, [legacy])).rows.length === 1;
  })());
check('[NS-01-R61] a stranger cannot read or delete it',
  (await as(C, `select 1 from storage.objects where name = $1`, [legacy])).rows.length === 0
  && ((await as(C, `delete from storage.objects where name = $1`, [legacy])).rowCount ?? 0) === 0);
check('[NS-01-R61] the author can delete it',
  ((await as(A, `delete from storage.objects where name = $1`, [legacy])).rowCount ?? 0) === 1);

// Mutant 1 (bucket): put the old insert policy back; the same upload now succeeds, so the checks above can fail.
await sys(`create policy entry_photos_author_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'entry-photos' and (storage.foldername(name))[2] = (select auth.uid())::text
  and public.is_child_member(((storage.foldername(name))[1])::uuid))`);
check('[NS-01-R61] mutant: with the old insert policy back, the owner upload succeeds',
  (await codeOf(() => put(A, `${CHILD}/${A}/${uuid7()}.jpg`))) === 'ok');
await sys(`drop policy entry_photos_author_insert on storage.objects`);
await sys(`delete from storage.objects where bucket_id = 'entry-photos'`);
check('[NS-36-R1d] mutant undone: the upload is refused again and 0 objects remain',
  (await codeOf(() => put(A, `${CHILD}/${A}/${uuid7()}.jpg`))) === '42501' && (await objects()) === 0);

// --- [NS-01-R61] entries.photo_path ----------------------------------------------------------------------
const mk = (id, photo) => as(A, `insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book, photo_path)
  values ($1, $2, $3, 'letter', '2026-09-29', now(), 'spoken', 1, 'um she walked', 'She walked.', true, $4)`, [id, CHILD, A, photo]);
const path = (id) => `${CHILD}/${A}/${id}.jpg`;
const e1 = uuid7();
const e2 = uuid7();
check('[NS-01-R61] an insert with a photo_path raises SCPHO', (await codeOf(() => mk(e1, path(e1)))) === 'SCPHO');
check('[NS-01-R61] an insert without a photo_path passes', (await codeOf(() => mk(e2, null))) === 'ok');
check('[NS-01-R61] an update from null to a path raises SCPHO',
  (await codeOf(() => as(A, `update entries set photo_path = $1 where id = $2`, [path(e2), e2]))) === 'SCPHO');
check('[NS-01-R61] the owner of the database is refused too (any role)',
  (await codeOf(() => sys(`update entries set photo_path = $1 where id = $2`, [path(e2), e2]))) === 'SCPHO');

// CK8: a legacy row keeps working. Plant a path with the guard off (test setup), then edit around it.
await sys(`alter table public.entries disable trigger entries_15_photo_closed`);
await sys(`update entries set photo_path = $1 where id = $2`, [path(e2), e2]);
await sys(`alter table public.entries enable trigger entries_15_photo_closed`);
check('[NS-01-R61] an update that leaves the existing path unchanged passes (CK8)',
  (await codeOf(() => as(A, `update entries set final_text = 'She walked far.' where id = $1`, [e2]))) === 'ok'
  && (await codeOf(() => as(A, `update entries set photo_path = $1 where id = $2`, [path(e2), e2]))) === 'ok');
check('[NS-01-R61] changing a legacy path to another path raises SCPHO',
  (await codeOf(() => as(A, `update entries set photo_path = $1 where id = $2`, [`${CHILD}/${A}/${e2}.png`, e2]))) === 'SCPHO');
check('[NS-01-R61] clearing a legacy path passes',
  (await codeOf(() => as(A, `update entries set photo_path = null where id = $1`, [e2]))) === 'ok'
  && (await sys(`select photo_path from entries where id = $1`, [e2])).rows[0].photo_path === null);

// Mutant 2 (trigger): switched off, the same insert and update succeed.
await sys(`alter table public.entries disable trigger entries_15_photo_closed`);
const e3 = uuid7();
check('[NS-01-R61] mutant: with the trigger off, an insert with a photo_path succeeds', (await codeOf(() => mk(e3, path(e3)))) === 'ok');
await sys(`alter table public.entries enable trigger entries_15_photo_closed`);
check('[NS-01-R61] mutant undone: the trigger is enabled and refuses again',
  (await sys(`select tgenabled from pg_trigger where tgname = 'entries_15_photo_closed'`)).rows[0].tgenabled === 'O'
  && (await codeOf(() => mk(uuid7(), path(e3)))) === 'SCPHO');

// --- Order and grants (DB-R04, DB-R14) -----------------------------------------------------------------------
const before = (await sys(`select tgname from pg_trigger where tgrelid = 'public.entries'::regclass and not tgisinternal
  and (tgtype & 2) = 2 and (tgtype & 4) = 4 order by tgname collate "C"`)).rows.map((r) => r.tgname);
check(`[NS-01-R61] entries_15_photo_closed fires first of the before-insert triggers (DB-R04): ${before.join(', ')}`, before[0] === 'entries_15_photo_closed');
const beforeUpd = (await sys(`select tgname from pg_trigger where tgrelid = 'public.entries'::regclass and not tgisinternal
  and (tgtype & 2) = 2 and (tgtype & 16) = 16 order by tgname collate "C"`)).rows.map((r) => r.tgname);
check('[NS-01-R61] and first of the before-update triggers', beforeUpd[0] === 'entries_15_photo_closed');
check('[NS-01-R61] entries_photo_closed() is executable by no API role (DB-R14)',
  (await sys(`select bool_or(has_function_privilege(r, 'public.entries_photo_closed()', 'execute')) b
              from unnest(array['anon', 'authenticated']) r`)).rows[0].b === false);

done();
