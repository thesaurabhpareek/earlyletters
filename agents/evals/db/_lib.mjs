// Shared by the db eval graders. Reuses the repo's PGlite harness (supabase/tests/harness.mjs) for the role,
// auth and storage stubs and for the post-20261023060000 default privileges, so a fixture sees the same
// database rules the real migrations do. The fixture is a slice, not the real schema: each task's schema.sql
// models only the policy or function under review (the model is stated in its task.md).
// Contract for the agent under test: never edit schema.sql; add new files under migrations/ (applied in
// name order after schema.sql), the way the repo ships database changes.
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createDb, users } from '../../../supabase/tests/harness.mjs';

export { users };
export const CHILD = '0c1d0000-0000-4000-8000-00000000a5a1'; // Asha's book (fictional)
export const ERASED = 'e5a5ed00-0000-4000-8000-000000000001'; // a letter id recorded in the purge ledger
export const FRESH = 'f4e5a000-0000-4000-8000-000000000002';

export function migrationFiles(workdir) {
  const dir = join(workdir, 'migrations');
  const extra = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().map((f) => join(dir, f)) : [];
  return [join(workdir, 'schema.sql'), ...extra];
}

// Builds the database and runs `body(h)`. A grader must never throw: an SQL error in the agent's migration
// is a failed outcome (the migration does not apply), not an unknown.
export async function withDb(workdir, body) {
  let h;
  try {
    h = await createDb(migrationFiles(workdir));
  } catch (e) {
    return { pass: false, reason: `the migrations do not apply: ${String(e.message).split('\n')[0]}` };
  }
  try {
    return await body(h);
  } catch (e) {
    return { pass: false, reason: `probe crashed: ${String(e.message).split('\n')[0]}` };
  } finally {
    try { await h.db.close(); } catch { /* already closed */ }
  }
}

// Seeds Asha's book: A is the author and a member, B a co-parent member, C a stranger.
export async function seedAsha(h) {
  const { A, B, C } = users;
  await h.sys(`insert into public.child_members (child_id, profile_id) values ('${CHILD}', '${A}'), ('${CHILD}', '${B}')`);
  return { A, B, C };
}

// Result of a statement as a code: 'ok' or the SQLSTATE (42501 is an RLS refusal).
export const attempt = async (h, uid, sql) => h.codeOf(() => h.as(uid, sql));
export const putPhoto = (h, uid, path) => attempt(h, uid, `insert into storage.objects (bucket_id, name) values ('entry-photos', '${path}')`);
export const renamePhoto = (h, uid, from, to) =>
  attempt(h, uid, `update storage.objects set name = '${to}' where bucket_id = 'entry-photos' and name = '${from}'`);
export const exists = async (h, path) => (await h.sys(`select count(*)::int n from storage.objects where name = $1`, [path])).rows[0].n > 0;
