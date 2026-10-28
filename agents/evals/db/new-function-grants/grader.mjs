// Outcome grader. Model of the repo's grants rule (CLAUDE.md): a new public function carries its own grant in
// its own migration, and its grant goes in supabase/tests/grants.mjs. Static + database: the probe reads the
// real privileges after the migrations apply and compares them with the grants file in both directions, the
// way the access matrix does. This is a model of grants.mjs (FUNCTION_GRANTS), not the repo file.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { withDb, seedAsha, CHILD } from '../_lib.mjs';

const ROLES = ['anon', 'authenticated', 'service_role'];

export async function grade({ workdir }) {
  const listed = readFileSync(join(workdir, 'applied.txt'), 'utf8').trim().split(/\s+/)[1];
  const sha = createHash('sha256').update(readFileSync(join(workdir, 'schema.sql'))).digest('hex');
  if (listed !== sha) return { pass: false, reason: 'schema.sql is applied and was edited; ship the change in a migration' };
  let grants;
  try {
    grants = (await import(`${pathToFileURL(join(workdir, 'grants.mjs')).href}?t=${Date.now()}`)).FUNCTION_GRANTS;
  } catch (e) {
    return { pass: false, reason: `grants.mjs does not load: ${String(e.message).split('\n')[0]}` };
  }
  return withDb(workdir, async (h) => {
    const { A, C } = await seedAsha(h);
    const actual = {};
    for (const role of ROLES) {
      actual[role] = (await h.sys(`select p.proname || '(' || oidvectortypes(p.proargtypes) || ')' sig from pg_proc p
          where p.pronamespace = 'public'::regnamespace and p.prokind = 'f' and has_function_privilege($1, p.oid, 'execute') order by 1`, [role])).rows.map((r) => r.sig);
    }
    const diffs = [];
    for (const role of ROLES) {
      const want = [...(grants?.[role] ?? [])].sort();
      const got = actual[role];
      const extra = got.filter((s) => !want.includes(s)); const missing = want.filter((s) => !got.includes(s));
      if (extra.length) diffs.push(`${role} can execute but grants.mjs does not list: ${extra.join(', ')}`);
      if (missing.length) diffs.push(`${role} is listed in grants.mjs but cannot execute: ${missing.join(', ')}`);
    }
    if (diffs.length) return { pass: false, reason: diffs.join('; ') };
    if (!actual.authenticated.includes('child_book_members(uuid)')) return { pass: false, reason: 'child_book_members(uuid) is not callable by authenticated' };
    const n = (await h.as(A, `select public.child_book_members('${CHILD}') n`)).rows[0].n;
    const s = (await h.as(C, `select public.child_book_members('${CHILD}') n`)).rows[0].n;
    if (n !== 2 || s !== null) return { pass: false, reason: `control broke: function answers ${n} for a member and ${s} for a stranger` };
    return { pass: true, reason: 'only the listed roles can execute each public function; grants.mjs matches the database; applied file untouched' };
  });
}
