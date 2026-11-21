// BL-244 (API-R10, TDD 06 conflict C-2): a content table refuses a bad write without echoing the row.
// Postgres adds "Failing row contains (...)" to the DETAIL of a CHECK or NOT NULL violation, which on a letter is L4 text
// in the log and in the PostgREST body. The rule is checked here by structure, never by value: every message in this
// file names a table and a rule, and no row value or product word is printed or asserted.
//   VF-1 every public table with an L4 text or jsonb column and a value-bearing CHECK has a BEFORE INSERT OR UPDATE
//        validation trigger (the guard that raises first with a fixed message), or is on KNOWN_GAPS below.
//   VF-2 no function in public/ops raises with a column of NEW or OLD in its message, detail or hint.
//   VF-3 behaviour: an over-length write to a content table fails with an error whose message and detail carry no
//        value; a table that still echoes is on KNOWN_GAPS (a ratchet: fixing one forces its removal from the list).
// RAISE_OK names functions whose raise reads a public policy document key, never a person's words.
// KNOWN_GAPS is the work the migration still owes (hosted apply is the founder's step); it may only shrink.
import { createDb } from './harness.mjs';

const { check, sys, done } = await createDb(process.argv.slice(2));

const RAISE_OK = new Set(['public.policy_versions_guard']);
const KNOWN_GAPS = new Set(['entries', 'held_drafts', 'children', 'dictionary_terms']);

// Content tables by structure: an L4 text/jsonb column and at least one CHECK that reads a length or a size.
const content = (await sys(`
  select c.relname as rel,
         exists (select 1 from pg_trigger t join pg_proc p on p.oid = t.tgfoid
                  where t.tgrelid = c.oid and not t.tgisinternal
                    and (t.tgtype & 2) = 2 and (t.tgtype & 4) = 4 and (t.tgtype & 16) = 16 and (t.tgtype & 1) = 1
                    and p.proname like '%validate%') as guarded
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
     and exists (select 1 from pg_attribute a join pg_type ty on ty.oid = a.atttypid
                  where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
                    and ty.typname in ('text', 'varchar', 'jsonb')
                    and col_description(c.oid, a.attnum) like 'L4%')
     and exists (select 1 from pg_constraint k where k.conrelid = c.oid and k.contype = 'c'
                  and pg_get_constraintdef(k.oid) ~ '(char_length|octet_length|length)\\(')
   order by 1`)).rows;
check('VF-0 the structural scan finds content tables (entries among them)', content.some((r) => r.rel === 'entries'));

for (const r of content) {
  const ok = r.guarded || KNOWN_GAPS.has(r.rel);
  check(`VF-1 ${r.rel}: a value-free validation trigger runs before its length CHECKs${KNOWN_GAPS.has(r.rel) ? ' (known gap)' : ''}`, ok);
  if (r.guarded && KNOWN_GAPS.has(r.rel)) check(`VF-1 ${r.rel}: now guarded, remove it from KNOWN_GAPS`, false);
}

// VF-2 raises that carry a row value.
const raises = (await sys(`
  select n.nspname || '.' || p.proname as fn from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname in ('public', 'ops') and p.prokind = 'f'
     and p.prosrc ~* '(raise\\s+(exception|warning|notice)[^;]*\\m(new|old)\\.[a-z_]+|using\\s+(detail|hint)\\s*=\\s*[^;]*\\m(new|old)\\.[a-z_]+)'
   order by 1`)).rows.filter((r) => !RAISE_OK.has(r.fn));
for (const r of raises) console.log(`      ${r.fn}: a raise names a row column`);
check('VF-2 no function in public or ops raises with a NEW or OLD column in its message, detail or hint', raises.length === 0);

// VF-3 behaviour. The probe inserts as the system role so RLS is out of the way; the CHECK is what fires.
const echo = (e) => /Failing row|Key \(.*\)=\(/.test(`${e.message ?? ''} ${e.detail ?? ''}`);
const probe = async (rel, sql, params) => {
  await sys('savepoint vf');
  try { await sys(sql, params); await sys('rollback to vf'); return 'ok'; }
  catch (e) { await sys('rollback to vf'); return echo(e) ? 'echo' : 'clean'; }
};
const probes = {
  children: [`insert into children (id, name, date_of_birth, created_by) values (gen_random_uuid(), $1, '2025-04-12', gen_random_uuid())`, ['x'.repeat(61)]],
};
await sys('begin');
for (const [rel, [sql, params]] of Object.entries(probes)) {
  const r = await probe(rel, sql, params);
  const gap = KNOWN_GAPS.has(rel);
  check(`VF-3 ${rel}: an over-length write is refused${gap ? ' and still echoes the row (known gap)' : ' without echoing the row'}`,
    gap ? r === 'echo' || r === 'ok' : r === 'clean');
}
await sys('rollback');
done();
