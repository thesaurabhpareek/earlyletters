// What a signed-in person can read or run on the server (BL-1921 item 2; FR-AIS-04, FR-AIS-08; follow-up to #1676).
// After every migration, list every privilege the `authenticated` role holds (directly or through PUBLIC) in every
// schema that is not Postgres's own: table and view privileges (has_table_privilege, so MAINTAIN is seen too, which
// information_schema.role_table_grants hides), column privileges where no table privilege is held, sequence
// privileges, function EXECUTE (pg_proc with has_function_privilege) and schema USAGE. Compare with the written
// allowlist: grants.mjs (GRANTS.authenticated and COLUMNS, imported, not copied) plus authenticated_surface.mjs for
// what grants.mjs does not hold. Fail on any held entry that is not listed, and on any listed entry that no longer
// exists, so the list cannot rot.
//
// Mutants, each in a transaction that is rolled back: a SECURITY DEFINER function returning raw_transcript and granted
// to authenticated (the row's named mutant), the same in another schema, and a table grant on the letters' history.
// Each must make the enumeration fail. A planted allowlist entry that does not exist must fail the staleness half.
//
// First, the non-author branch of sync_pull (20261123100000, `to_jsonb(be) - 'search'` over book_entries) returns no
// engine_version since 20261123200000 took it out of the view: asserted with a co-parent fixture, the author's own
// pull still carrying it so the check is not vacuous. Fictional family "Asha" only (CLAUDE.md).
import { createDb, users, uuid7 } from './harness.mjs';
import { GRANTS, COLUMNS } from './grants.mjs';
import { SCHEMAS, PUBLIC_FUNCTIONS, SYNC_PRIVATE_FOR_SIGNED_IN, SUPABASE_STUB_TABLES, SUPABASE_STUB_FUNCTIONS } from './authenticated_surface.mjs';

const h = await createDb(process.argv.slice(2));
const { db, check, as, sys, one, done, publishPolicies, consent, newChild, join } = h;
const { A, B } = users;

// ── sync_pull: the other parent's row has no engine_version ──────────────
for (const u of [A, B]) await sys(`insert into auth.users (id) values ($1) on conflict do nothing`, [u]);
await publishPolicies();
for (const u of [A, B]) await consent(u);
const CHILD = await newChild(A, 'Asha', '2025-04-12');
await join(B, 'parent', CHILD, A);
const LETTER = uuid7();
await as(A, `insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version,
    raw_transcript, final_text, in_book)
  values ($1, $2, $3, 'letter', '2026-10-01', now(), 'spoken', 7, 'um Asha laughed at the rain', 'Asha laughed at the rain.', true)`,
  [LETTER, CHILD, A]);
const pull = async (uid) => {
  await sys(`delete from sync_rate_windows where profile_id = $1`, [uid]);
  return (await one(uid, `select public.sync_pull('{}'::jsonb, 200) r`)).r;
};
// Every object in the pull whose id is the letter's, as JSON text.
const rowsOf = (r) => {
  const out = [];
  const walk = (x) => {
    if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === 'object') { if (x.id === LETTER) out.push(JSON.stringify(x)); Object.values(x).forEach(walk); }
  };
  walk(r);
  return out;
};
const ownRows = rowsOf(await pull(A));
const coRows = rowsOf(await pull(B));
check('[FR-AIS-08] the author\'s own pull carries engine_version (the own branch reads entries; the check below is not vacuous)',
  ownRows.length === 1 && ownRows[0].includes('"engine_version":7') && ownRows[0].includes('"own":true'));
check('[FR-AIS-08, 20261123200000] the other parent\'s pull carries the letter through the non-author branch (own false)',
  coRows.length === 1 && coRows[0].includes('"own":false') && coRows[0].includes('Asha laughed at the rain.')
  || console.log(`      got ${coRows.join(' | ')}`));
check('[FR-AIS-08, 20261123200000] and that row has no engine_version key (book_entries has no such column)',
  coRows.length === 1 && !coRows[0].includes('"engine_version"')
  && !(await sys(`select 1 from information_schema.columns where table_schema = 'public' and table_name = 'book_entries'
    and column_name = 'engine_version'`)).rows.length);

// ── The enumeration ───────────────────────────────────────────────────────
const NOT_OURS = `n.nspname not in ('pg_catalog', 'information_schema') and n.nspname !~ '^pg_(toast|temp_|toast_temp_)'`;
const TABLE_PRIVS = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'];
const LETTER_OF = { SELECT: 'S', INSERT: 'I', UPDATE: 'U', DELETE: 'D', TRUNCATE: 'T', REFERENCES: 'R', TRIGGER: 'G', MAINTAIN: 'M' };
// Every entry `authenticated` holds, as "kind name detail" strings, sorted.
const surface = async () => {
  const q = async (s) => (await db.query(s)).rows.map((r) => r.v);
  const tables = (await q(`select n.nspname || '.' || c.relname || ' ' || p v from pg_class c join pg_namespace n on n.oid = c.relnamespace
      cross join unnest(array['${TABLE_PRIVS.join("','")}']) p
      where ${NOT_OURS} and c.relkind in ('r', 'p', 'v', 'm', 'f') and has_table_privilege('authenticated', c.oid, p)`))
    .reduce((m, v) => { const [rel, p] = v.split(' '); m.set(rel, (m.get(rel) ?? '') + LETTER_OF[p]); return m; }, new Map());
  const order = 'SIUDTRGM';
  return [
    ...[...tables].map(([rel, l]) => `table ${rel} ${[...l].sort((a, b) => order.indexOf(a) - order.indexOf(b)).join('')}`),
    ...await q(`select 'column ' || n.nspname || '.' || c.relname || '.' || a.attname || ' ' || p v
      from pg_class c join pg_namespace n on n.oid = c.relnamespace join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
      cross join unnest(array['SELECT', 'INSERT', 'UPDATE', 'REFERENCES']) p
      where ${NOT_OURS} and c.relkind in ('r', 'p', 'v', 'm', 'f')
        and has_column_privilege('authenticated', c.oid, a.attnum, p) and not has_table_privilege('authenticated', c.oid, p)`),
    ...await q(`select 'sequence ' || n.nspname || '.' || c.relname || ' ' || p v from pg_class c join pg_namespace n on n.oid = c.relnamespace
      cross join unnest(array['USAGE', 'SELECT', 'UPDATE']) p
      where ${NOT_OURS} and c.relkind = 'S' and has_sequence_privilege('authenticated', c.oid, p)`),
    ...await q(`select 'function ' || n.nspname || '.' || p.proname || '(' || replace(oidvectortypes(p.proargtypes), ', ', ',') || ')' v
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where ${NOT_OURS} and has_function_privilege('authenticated', p.oid, 'execute')`),
    ...await q(`select 'schema ' || n.nspname v from pg_namespace n where ${NOT_OURS} and has_schema_privilege('authenticated', n.oid, 'usage')`),
    // CREATE on a schema lets a signed-in caller add objects there; the allowlist holds none (review of #2117).
    ...await q(`select 'schema ' || n.nspname || ' CREATE' v from pg_namespace n
      where ${NOT_OURS} and has_schema_privilege('authenticated', n.oid, 'create')`),
  ].sort();
};
// The written allowlist, in the same form.
const allowlist = () => [
  ...Object.entries(GRANTS.authenticated).map(([rel, l]) => `table public.${rel} ${l}`),
  ...Object.entries(SUPABASE_STUB_TABLES).map(([rel, l]) => `table ${rel} ${l}`),
  ...Object.entries(COLUMNS).flatMap(([rel, cs]) => cs.split(',').map((c) => `column public.${rel}.${c} SELECT`)),
  ...PUBLIC_FUNCTIONS.map((f) => `function ${f}`),
  ...SYNC_PRIVATE_FOR_SIGNED_IN.map((f) => `function sync_private.${f}`),
  ...SUPABASE_STUB_FUNCTIONS.map((f) => `function ${f}`),
  ...SCHEMAS.map((s) => `schema ${s}`),
].sort();
const compare = (held, allowed) => ({
  unlisted: held.filter((v) => !allowed.includes(v)),
  stale: allowed.filter((v) => !held.includes(v)),
});
const report = ({ unlisted, stale }) => {
  for (const v of unlisted) console.log(`      held by authenticated, not on the allowlist: ${v}`);
  for (const v of stale) console.log(`      on the allowlist, not held (remove it): ${v}`);
};
// Runs `sql` in a transaction that is rolled back, and returns the comparison taken inside it.
const withMutant = async (sql) => {
  await db.exec('begin');
  try {
    await db.exec(sql);
    return compare(await surface(), allowlist());
  } finally {
    await db.exec('rollback');
  }
};

const held = await surface();
const allowed = allowlist();
const now = compare(held, allowed);
report(now);
const kinds = (k) => held.filter((v) => v.startsWith(`${k} `)).length;
check(`the enumeration is not empty (${kinds('table')} tables and views, ${kinds('column')} columns, ${kinds('function')} functions, `
  + `${kinds('schema')} schemas)`, kinds('table') >= 10 && kinds('column') >= 10 && kinds('function') >= 50 && kinds('schema') >= 2);
check('the allowlist has no duplicate entry', new Set(allowed).size === allowed.length);
check('[BL-1921] every privilege authenticated holds in any non-system schema is on the allowlist', now.unlisted.length === 0);
check('[BL-1921] every allowlist entry is still held (the list cannot rot)', now.stale.length === 0);
check('authenticated holds no privilege on any sequence', kinds('sequence') === 0);
check('authenticated holds CREATE on no schema', !held.some((v) => / CREATE$/.test(v) && v.startsWith('schema ')));
check('authenticated holds no schema-level entry in ops or insights (definer code and the service role only)',
  !held.some((v) => / (ops|insights)\./.test(v) || v === 'schema ops' || v === 'schema insights'));

// ── Mutants ───────────────────────────────────────────────────────────────
// The row's mutant: a definer function that hands any signed-in caller the raw transcript, granted to authenticated.
const RAW_FN = `create function public.mutant_raw(p_id uuid) returns text language sql security definer
  set search_path = pg_catalog, public, pg_temp as $$ select raw_transcript from public.entries where id = p_id $$;
  revoke execute on function public.mutant_raw(uuid) from public;
  grant execute on function public.mutant_raw(uuid) to authenticated;`;
const m1 = await withMutant(RAW_FN);
check('[mutant] a SECURITY DEFINER function returning raw_transcript, granted to authenticated, fails the enumeration',
  JSON.stringify(m1.unlisted) === JSON.stringify(['function public.mutant_raw(uuid)']) && m1.stale.length === 0
  || console.log(`      got ${JSON.stringify(m1)}`));
// It is a real leak, not only a name: the other parent reads the author's raw words through it.
await db.exec('begin');
let leaked;
try {
  await db.exec(RAW_FN);
  await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [B]);
  await db.exec('set local role authenticated');
  leaked = (await db.query(`select public.mutant_raw($1) v`, [LETTER])).rows[0].v;
} finally {
  await db.exec('rollback');
}
check('[mutant] and the leak is real: through it the other parent reads the author\'s raw transcript', leaked === 'um Asha laughed at the rain');
// The same in a schema the Data API does not expose: the enumeration is not limited to public.
const m2 = await withMutant(RAW_FN.replace(/public\.mutant_raw/g, 'sync_private.mutant_raw'));
check('[mutant] the same function in sync_private fails the enumeration too (every non-system schema is read)',
  JSON.stringify(m2.unlisted) === JSON.stringify(['function sync_private.mutant_raw(uuid)']) || console.log(`      got ${JSON.stringify(m2)}`));
// A function left executable by PUBLIC (Postgres's default) counts as authenticated's.
const m3 = await withMutant(`create function public.mutant_public() returns int language sql as $$ select 1 $$;`);
check('[mutant] a function left with Postgres\'s default EXECUTE for PUBLIC fails the enumeration',
  JSON.stringify(m3.unlisted) === JSON.stringify(['function public.mutant_public()']) || console.log(`      got ${JSON.stringify(m3)}`));
// A table grant: the letters' version history (no client grant since 20261023060000).
const m4 = await withMutant(`grant select on public.entry_versions to authenticated;`);
check('[mutant] a SELECT grant on entry_versions fails the enumeration',
  JSON.stringify(m4.unlisted) === JSON.stringify(['table public.entry_versions S']) || console.log(`      got ${JSON.stringify(m4)}`));
// Schema CREATE: a signed-in caller who can create objects in public could plant its own functions and views.
const m4c = await withMutant(`grant create on schema public to authenticated;`);
check('[mutant] a CREATE grant on schema public fails the enumeration',
  JSON.stringify(m4c.unlisted) === JSON.stringify(['schema public CREATE']) || console.log(`      got ${JSON.stringify(m4c)}`));
// A revoke of a listed grant fails the staleness half.
const m5 = await withMutant(`revoke execute on function public.sync_pull(jsonb, integer) from authenticated;`);
check('[mutant] revoking a listed function (sync_pull) fails the staleness half',
  JSON.stringify(m5.stale) === JSON.stringify(['function public.sync_pull(jsonb,integer)']) && m5.unlisted.length === 0
  || console.log(`      got ${JSON.stringify(m5)}`));
// A planted allowlist entry that does not exist is reported stale.
const planted = compare(held, [...allowed, 'function public.no_such_function(uuid)'].sort());
check('[mutant] a planted allowlist entry that no longer exists is reported stale',
  JSON.stringify(planted.stale) === JSON.stringify(['function public.no_such_function(uuid)']));

done();
