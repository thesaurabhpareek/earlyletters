// BL-1997 (refines BL-1572, File 47): children.name is capped at 960 code points and the four signs_as columns at 480.
// A btree entry must fit about a third of an 8 kB page: error 54000 "index row size N exceeds btree version 4 maximum 2704".
// 960 four-byte code points are 3,840 bytes and 960 Devanagari code points are 2,880, both over 2,704 on paper; 480 four-byte
// code points are 1,920, which fits alone but not beside a wide second key. The entry is compressed first, so a real name
// often fits and a value that does not compress fails (measured at the end of this file). A write that fails only for some
// values is the worst kind, so no btree index may hold these columns (as a key or as an INCLUDE payload): a lookup that needs
// one uses a hash index, or an expression on a prefix or md5 (left(name, 64), md5(name)). Fictional family "Asha" only.
//
// What this file does:
//   1. reads the catalogue (pg_index, not a grep of migrations) and fails on any btree index on the five columns;
//   2. proves the detector on a scratch index it creates and rolls back (the "make it fail" step of the row);
//   3. measures, on the embedded Postgres, what a btree does with a long value, so the byte claim is not from memory.
import { createDb, users } from './harness.mjs';

const { check, sys, codeOf, done, publishPolicies, consent, newChild } = await createDb(process.argv.slice(2));
const { A } = users;
await sys(`insert into auth.users values ('${A}')`);
await publishPolicies();
await consent(A);

const COLUMNS = [
  ['children', 'name'],
  ['profiles', 'signs_as'],
  ['child_member_prefs', 'signs_as'],
  ['child_invites', 'signs_as'],
  ['entries', 'author_signs_as'],
];

// Every btree index (unique constraints and primary keys included) that holds one of the columns as a plain key or INCLUDE
// column. An expression index (left(name, 64), md5(name)) has attnum 0 in indkey and is the allowed way; it is not listed.
const BTREE_ON_LONG_COLUMNS = `
  select c.relname as tbl, a.attname as col, i.relname as idx, pg_get_indexdef(x.indexrelid) as def
    from pg_index x
    join pg_class i on i.oid = x.indexrelid
    join pg_class c on c.oid = x.indrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_am am on am.oid = i.relam
    join lateral unnest(x.indkey::int2[]) as k(attnum) on true
    join pg_attribute a on a.attrelid = c.oid and a.attnum = k.attnum
   where am.amname = 'btree' and n.nspname = 'public'
     and (c.relname, a.attname) in (${COLUMNS.map(([t, col]) => `('${t}', '${col}')`).join(', ')})`;

const offenders = async () => (await sys(BTREE_ON_LONG_COLUMNS)).rows;

const reason = (rows) => rows.map((r) => `${r.idx} on ${r.tbl}.${r.col}`).join('; ')
  + '. These columns take up to 960 or 480 code points (BL-1572), up to 3,840 bytes, and a btree entry over about 2,704 bytes is refused (54000), '
  + 'so a long value would fail on write. Use a hash index, or an expression on a prefix or md5.';

// 1. The catalogue today.
const found = await offenders();
check(`[BL-1997] no btree index covers children.name or a signs_as column${found.length ? ': ' + reason(found) : ''}`, found.length === 0);
check('[BL-1997] the five columns exist (the detector is not blind to a rename)',
  Number((await sys(`select count(*) from information_schema.columns where table_schema = 'public'
    and (table_name, column_name) in (${COLUMNS.map(([t, col]) => `('${t}', '${col}')`).join(', ')})`)).rows[0].count) === COLUMNS.length);

// 2. The detector fires on a scratch index and ignores the allowed shapes. All of it is rolled back.
await sys('begin');
const scratch = async (ddl) => {
  await sys('savepoint s');
  await sys(ddl);
  const rows = await offenders();
  await sys('rollback to s');
  return rows;
};
for (const [t, col] of COLUMNS) {
  const rows = await scratch(`create index scratch_${t}_${col} on public.${t} (${col})`);
  check(`[BL-1997] detector: a scratch btree index on ${t}.${col} is found`, rows.length === 1 && rows[0].col === col);
}
check('[BL-1997] detector: a btree index that only INCLUDEs children.name is found',
  (await scratch('create index scratch_inc on public.children (id) include (name)')).length === 1);
check('[BL-1997] detector: a composite btree index with children.name second is found',
  (await scratch('create index scratch_comp on public.children (id, name)')).length === 1);
check('[BL-1997] detector: a hash index on children.name is allowed', (await scratch('create index scratch_hash on public.children using hash (name)')).length === 0);
check('[BL-1997] detector: an md5 expression index on children.name is allowed', (await scratch('create index scratch_md5 on public.children (md5(name))')).length === 0);
check('[BL-1997] detector: a prefix expression index on children.name is allowed', (await scratch('create index scratch_left on public.children (left(name, 64))')).length === 0);

// 3. Measured on the embedded Postgres (PGlite, PostgreSQL 18, 8 kB blocks): what a btree does with a long value. The index
// entry is compressed before the size test, so only a value that does not compress fails: code points drawn from the whole
// four-byte range do not; a repeated string, or a narrow range, shrinks under the limit and proves nothing (measured below).
const draw = (n, lo, span) => { let s = 12345; let out = ''; for (let i = 0; i < n; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; out += String.fromCodePoint(lo + (s % span)); } return out; };
const lcg = (n) => draw(n, 0x10000, 0xF0000);
const name4 = lcg(960);
const bytes = Buffer.byteLength(name4, 'utf8');
check(`[BL-1997] measured: a 960 code point name of four-byte characters is ${bytes} bytes in UTF-8 (over 2,704)`,
  [...name4].length === 960 && bytes === 3840);
const kid = await newChild(A);
const trial = async (value) => {
  await sys('savepoint t');
  await sys('create index scratch_name on public.children (name)');
  let out;
  try { await sys(`update public.children set name = $1 where id = '${kid}'`, [value]); out = { code: 'ok' }; }
  catch (e) { out = { code: e.code ?? 'error', message: String(e.message) }; }
  await sys('rollback to t');
  return out;
};
const over = await trial(name4);
console.log(`     measured: 960 four-byte code points under a btree on children.name -> ${over.code} ${over.message ?? ''}`);
check('[BL-1997] measured: 960 four-byte code points under a btree index are refused with 54000 (index row size over the btree maximum)',
  over.code === '54000' && /index row size/.test(over.message));
// Recorded, not asserted: whether a value of this size fits depends on how well it compresses, which is the point of the note.
for (const [label, v] of [['960 Devanagari code points, repeated (2,880 bytes)', 'आशा'.repeat(320)], ['960 random three-byte code points (2,880 bytes)', draw(960, 0x800, 0xD000)]]) {
  const r = await trial(v);
  console.log(`     measured: ${label} under a btree on children.name -> ${r.code} ${r.message ?? ''}`);
}
const small = await trial(lcg(60));
check('[BL-1997] measured: the same index takes a 60 character name (the product limit), so the failure is the length, not the index', small.code === 'ok');

await sys('rollback');
done();
