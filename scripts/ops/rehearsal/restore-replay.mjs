// Rehearsal 4 (B2-25), the part that can run without a real project: after a database restore,
// (1) the purge ledger replay must re-delete what was purged after the restore point and nothing else,
// (2) the new sync epoch must tell phones on the old epoch to start over, and (3) letters that were
// kept must keep the exact bytes of their raw transcript.
//
// What it protects: the broken promise in docs/ops/runbooks/restore-drill.md. Without the replay, a
// deleted letter comes back; without the epoch, a phone never re-uploads what the restore lost.
// What it does NOT prove: the dashboard restore, the Storage bucket, Auth users, RTO. Those need a
// real throwaway project (docs/ops/runbooks/rollback-rehearsals.md, rehearsal 4).
//
// Runs only in embedded Postgres (PGlite) with the repo's migrations. It never takes a URL or a key.
// Sabotage names exist so a test can show the checks fail when the thing they guard is broken.
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDb, users } from '../../../supabase/tests/harness.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export const SABOTAGE = ['skip-replay', 'skip-epoch', 'over-delete', 'tamper-raw'];

export const defaultMigrations = () => {
  const dir = join(here, '..', '..', '..', 'supabase', 'migrations');
  return readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().map((f) => join(dir, f));
};

/** @returns {Promise<{id: string, name: string, ok: boolean}[]>} */
export async function rehearse({ migrations = defaultMigrations(), sabotage = null } = {}) {
  if (sabotage && !SABOTAGE.includes(sabotage)) throw new Error(`unknown sabotage ${sabotage}; known: ${SABOTAGE.join(', ')}`);
  const log = console.log; console.log = () => {}; // the harness prints its own PASS lines
  let h;
  try { h = await createDb(migrations); } finally { console.log = log; }
  const { sys, as, one, codeOf, publishPolicies, consent, newChild } = h;
  const { A } = users;
  const out = [];
  const check = (id, name, ok) => out.push({ id, name, ok: !!ok });

  await sys(`insert into auth.users values ('${A}')`);
  await publishPolicies();
  await consent(A);
  const book = await newChild(A);
  const id = (n) => `0192e100-0000-7000-8000-${String(n).padStart(12, '0')}`;
  const addLetter = (n, raw) => sys(`insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book)
    values ($1, $2, $3, 'letter', '2026-09-29', now(), 'spoken', 1, $4, 'Asha laughed.', true)`, [id(n), book, A, raw]);
  const present = async (n) => (await sys(`select count(*)::int c from entries where id = $1`, [id(n)])).rows[0].c === 1;

  // State "in the backup": a kept letter and a letter that was purged after the restore point, so the
  // restored copy holds both (the ghost).
  await addLetter(1, 'Asha said her first word');
  await addLetter(2, 'Asha ghost letter');
  const shaBefore = (await sys(`select encode(sha256(convert_to(raw_transcript, 'UTF8')), 'hex') s from entries where id = $1`, [id(1)])).rows[0].s;
  if (sabotage === 'tamper-raw') { // a restore that rewrote words; the raw_transcript trigger normally refuses, so lift it for the plant only
    await sys(`set session_replication_role = replica`);
    await sys(`update entries set raw_transcript = 'Asha said her first word!' where id = $1`, [id(1)]);
    await sys(`set session_replication_role = origin`);
  }

  // The ledger rows the daily ops-ledger files hold for the purge after the restore point.
  const ledger = [{ t: 'entry', id: id(2) }];
  if (sabotage === 'over-delete') ledger.push({ t: 'entry', id: id(1) });
  let first = null; let second = null;
  if (sabotage !== 'skip-replay') {
    first = (await sys(`select public.ops_replay_ledger($1) v`, [JSON.stringify(ledger)])).rows[0].v;
    second = (await sys(`select public.ops_replay_ledger($1) v`, [JSON.stringify(ledger)])).rows[0].v;
  }
  check('RH4.1', 'the letter purged after the restore point is gone after replay', !(await present(2)));
  check('RH4.2', 'a letter that was kept is still there after replay', await present(1));
  check('RH4.3', 'replaying the same ledger twice deletes nothing the second time', second !== null && second.entries === 0 && first.entries === 1);
  const shaAfter = (await sys(`select encode(sha256(convert_to(raw_transcript, 'UTF8')), 'hex') s from entries where id = $1`, [id(1)])).rows[0]?.s;
  check('RH4.4', 'the kept letter has the same raw_transcript hash as before (hash sample matches)', shaAfter === shaBefore);

  // The epoch. A phone that last pulled on epoch 1 must be told to start over.
  const pull = async (epoch) => (await one(A, `select public.sync_pull($1::jsonb, 200) r`, [JSON.stringify({ epoch, books: {} })])).r;
  const restorePoint = new Date(Date.now() - 3600_000).toISOString();
  let epoch = null;
  if (sabotage !== 'skip-epoch') epoch = (await sys(`select public.sync_begin_epoch('drill', $1) e`, [restorePoint])).rows[0].e;
  await sys(`delete from sync_rate_windows where profile_id = $1`, [A]);
  const r = await pull(1);
  check('RH4.5', 'a phone on the old epoch is told to start over', r.reset === true && r.reason === 'epoch');
  check('RH4.6', 'the epoch moved forward by one', epoch === 2);
  check('RH4.7', 'a signed-in person cannot begin an epoch (service role only)', (await codeOf(() => as(A, `select public.sync_begin_epoch('drill')`))) === '42501');
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--sabotage');
  const results = await rehearse({ sabotage: i > 0 ? process.argv[i + 1] : null });
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.id}  ${r.name}`);
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed ? `\n${failed} FAILED of ${results.length}` : `\nALL PASSED (${results.length} checks), embedded Postgres only: this is not the restore rehearsal`);
  process.exit(failed ? 1 : 0);
}
