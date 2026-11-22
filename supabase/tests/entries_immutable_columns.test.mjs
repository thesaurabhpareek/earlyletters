// [ARCH-P-01] entries_guard_immutable (live definition: 20261016000000_sync_v1_server.sql, lines 183-225, guard at
// 188-196) refuses a change to nine columns with SCIMM: id, raw_transcript, raw_sha256, captured_at, created_at,
// author_id, child_id, engine_version, and pack_ref once set. One check per column, per role that can reach the row, and a mutable column still works.
// Roles: the author (authenticated, through RLS), a co-parent (RLS hides the row: nothing changes), service_role
// (holds no table grant on entries since 20261023060000: refused before the trigger) and the owner (sys).
// Fictional family "Asha" only (CLAUDE.md). Run: npm run test:db -- entries_immutable
import { createDb, users } from './harness.mjs';

const { db, check, as, sys, codeOf, done, publishPolicies, consent, newChild, join } = await createDb(process.argv.slice(2));
const { A, B, S } = users;
await sys(`insert into auth.users values ('${A}'),('${B}'),('${S}')`);
await publishPolicies();
for (const u of [A, B, S]) await consent(u);
const CHILD = await newChild(A);
const OTHER = await newChild(S);
await join(B, 'parent', CHILD, A);

const ID = '0192b000-0000-7000-8000-0000000000c1';
await as(A, `insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book, machine_edits, stt_meta)
  values ('${ID}', '${CHILD}', '${A}', 'letter', '2026-09-29', now(), 'spoken', 1, 'um she walked', 'She walked.', true, '[]', '{"engine":"test"}')`);

await as(A, `update entries set pack_ref = 'en@1.0.0' where id='${ID}'`); // set once from null is allowed
check('[ARCH-P-01] pack_ref can be set once from null', (await sys(`select pack_ref from entries where id='${ID}'`)).rows[0].pack_ref === 'en@1.0.0');

// The change tried for each guarded column.
const CHANGES = {
  id: `'0192b000-0000-7000-8000-0000000000c2'`,
  pack_ref: `'fr@1.0.0'`,
  raw_transcript: `'she ran'`,
  raw_sha256: `'\\x00'`,
  captured_at: `now() - interval '1 day'`,
  created_at: `now() - interval '1 year'`,
  author_id: `'${B}'`,
  child_id: `'${OTHER}'`,
  engine_version: '2',
};
const snap = async () => JSON.stringify((await sys(`select id, pack_ref, raw_transcript, encode(raw_sha256,'hex') h, captured_at, created_at, author_id, child_id, engine_version from entries where id='${ID}'`)).rows[0]);
const before = await snap();
// Each attempt runs in a transaction that is rolled back (role and claims too), so a guard that fails to
// refuse changes nothing for the next check: only the dropped column's own checks can go red.
const attempt = async (role, sql, uid) => {
  await db.exec('begin');
  try {
    if (role) {
      const claims = JSON.stringify({ sub: uid ?? '', role }).replace(/'/g, "''");
      await db.exec(`select set_config('request.jwt.claim.sub', '${uid ?? ''}', true), set_config('request.jwt.claims', '${claims}', true); set local role ${role};`);
    }
    await db.query(sql);
    return 'ok';
  } catch (e) { return e.code ?? 'error'; } finally { await db.exec('rollback'); }
};

for (const [col, val] of Object.entries(CHANGES)) {
  const stmt = `update entries set ${col} = ${val} where id='${ID}'`;
  check(`[ARCH-P-01] the author cannot change ${col} (SCIMM)`, (await attempt('authenticated', stmt, A)) === 'SCIMM');
  check(`[ARCH-P-01] the owner cannot change ${col} (SCIMM)`, (await attempt(null, stmt)) === 'SCIMM');
  check(`[ARCH-P-01] a co-parent changes no row for ${col} (the row is not theirs)`, (await attempt('authenticated', stmt, B)) === 'ok' && (await snap()) === before);
  const sr = await attempt('service_role', stmt);
  check(`[ARCH-P-01] service_role cannot change ${col} (refused, 42501 or SCIMM)`, sr === '42501' || sr === 'SCIMM');
}
check('[ARCH-P-01] after every attempt the nine columns are exactly as written', (await snap()) === before);
check('[ARCH-P-01] one statement naming all nine is refused too', (await codeOf(() => as(A, `update entries set ${Object.entries(CHANGES).map(([c, v]) => `${c} = ${v}`).join(', ')} where id='${ID}'`))) === 'SCIMM');

// Mutable paths keep working: the guard is not a blanket freeze.
await as(A, `update entries set final_text = 'She walked to me.' where id='${ID}'`);
check('[ARCH-P-01] final_text still changes', (await sys(`select final_text from entries where id='${ID}'`)).rows[0].final_text === 'She walked to me.');
await as(A, `update entries set in_book = false where id='${ID}'`);
check('[ARCH-P-01] in_book still changes', (await sys(`select in_book from entries where id='${ID}'`)).rows[0].in_book === false);
// photo_path is no longer a mutable column: 20261110000000_photo_bucket_closed.sql refuses any new path (SCPHO), so the
// third mutable-column check moved to sounds_like_me, and the closed door is asserted here as well (not skipped).
await as(A, `update entries set sounds_like_me = true where id='${ID}'`);
check('[ARCH-P-01] sounds_like_me still changes', (await sys(`select sounds_like_me from entries where id='${ID}'`)).rows[0].sounds_like_me === true);
check('[ARCH-P-01] photo_path is refused (SCPHO), the server holds no pictures', (await codeOf(() => as(A, `update entries set photo_path='${CHILD}/${A}/${ID}.jpg' where id='${ID}'`))) === 'SCPHO');
await as(A, `update entries set deleted_at = now() where id='${ID}'`);
const t = (await sys(`select deleted_at is not null d, deleted_reason r from entries where id='${ID}'`)).rows[0];
check('[ARCH-P-01] the tombstone path still works', t.d && t.r === 'user');
check('[ARCH-P-01] a tombstoned letter still refuses a guarded column (SCIMM)', (await codeOf(() => sys(`update entries set raw_transcript='x' where id='${ID}'`))) === 'SCIMM');
check('[ARCH-P-01] the nine columns survived the whole run unchanged', (await snap()) === before);
done();
