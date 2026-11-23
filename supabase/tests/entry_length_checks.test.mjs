// BL-1572 (NS-01-R54, NS-06-A, NS-16-R1, NS-16-R6 as cited by the row): the server counts a typed name and a signature in code
// points, and the phone counts graphemes at up to 16 code points each. 20261123200000 raises children.name to 960 and the four
// signs_as columns to 480, so a 30-character Devanagari name is no longer cut. Each limit is tested at the edge (960 accepted,
// 961 refused; 480 accepted, 481 refused), in code points not bytes, with the refusal value-free (BL-244). children.nickname stays 30.
// Fictional family "Asha" only; Devanagari is built from code points, never a real name.
import { readFileSync } from 'node:fs';
import { createDb, users, uuid7 } from './harness.mjs';

const { check, as, sys, codeOf, done, publishPolicies, consent, newChild } = await createDb(process.argv.slice(2));
const { A } = users;
await sys(`insert into auth.users values ('${A}')`);
await publishPolicies();
await consent(A);

const dev = (n) => 'आशा'.repeat(Math.ceil(n / 3)).slice(0, n);   // n code points, each 3 bytes in UTF-8
const kid = await newChild(A);
const refusal = async (sql, params) => {
  await sys('savepoint el');
  try { await sys(sql, params); await sys('rollback to el'); return null; }
  catch (e) { await sys('rollback to el'); return e; }
};
const bare = (e, v) => e && !e.detail && !e.hint && !String(e.message).includes(v.slice(0, 6));

// Every write path: [name, update sql with $1 the value, ceiling].
const paths = [
  ['children.name', `update children set name = $1 where id = '${kid}'`, 960],
  ['profiles.signs_as', `update profiles set signs_as = $1 where id = '${A}'`, 480],
  ['child_member_prefs.signs_as', `update child_member_prefs set signs_as = $1 where child_id = '${kid}' and profile_id = '${A}'`, 480],
  ['child_invites.signs_as', `update child_invites set signs_as = $1 where child_id = '${kid}'`, 480],
  ['entries.author_signs_as', `update entries set author_signs_as = $1 where child_id = '${kid}'`, 480],
];
await sys(`insert into child_member_prefs (child_id, profile_id) values ('${kid}', '${A}') on conflict do nothing`);
await sys(`insert into child_invites (child_id, invited_by, token_hash, role) values ('${kid}', '${A}', sha256(convert_to('asha-limit-test', 'UTF8')), 'contributor')`);
await sys(`insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text)
  values ('${uuid7()}', '${kid}', '${A}', 'letter', '2026-09-29', now(), 'spoken', 1, 'um she walked', 'She walked.')`);

// The row writer refuses by its own rule above 960, and accepts 960, through the RPC the app calls.
const create = (name) => as(A, `select public.create_child($1, $2, '2025-04-12'::date, null)`, [uuid7(), name]);
check('[BL-1572] create_child accepts a 960 code point name', (await codeOf(() => create(dev(960)))) === 'ok');
check('[BL-1572] create_child refuses 961 with 22023', (await codeOf(() => create(dev(961)))) === '22023');

await sys('begin');
for (const [name, sql, lim] of paths) {
  const at = await refusal(sql, [dev(lim)]);
  const over = await refusal(sql, [dev(lim + 1)]);
  check(`[BL-1572] ${name}: ${lim} code points are accepted`, at === null);
  // children and entries have a value-free trigger (BL-244); the other three are CHECK only, so Postgres adds its own DETAIL there
  // (to the table owner; the API roles do not reach it). The limit is what this file proves; BL-244 owns the echo.
  const guarded = name === 'children.name' || name === 'entries.author_signs_as';
  check(`[BL-1572] ${name}: ${lim + 1} code points are refused, SQLSTATE 23514${guarded ? ', value-free' : ''}`,
    over !== null && over.code === '23514' && (!guarded || bare(over, dev(lim + 1))));
}

// A 30-grapheme Devanagari name is about 30 x 3 code points: well inside the new limit (the reason for the row).
check('[BL-1572] a name of 90 Devanagari code points (30 characters of three) is accepted', (await refusal(paths[0][1], [dev(90)])) === null);

// The refusal at the edge is also the table CHECK when the trigger is not in the way (the last line), by definition text.
const defs = (await sys(`select c.conrelid::regclass::text rel, pg_get_constraintdef(c.oid) def
  from pg_constraint c where c.contype = 'c' and c.conrelid = any(array['public.children'::regclass, 'public.profiles'::regclass,
  'public.child_member_prefs'::regclass, 'public.child_invites'::regclass, 'public.entries'::regclass])
  and pg_get_constraintdef(c.oid) ~ '\\((name|signs_as|author_signs_as)\\)'`)).rows;
const lims = Object.fromEntries(defs.map((r) => [r.rel, []]));
for (const r of defs) lims[r.rel].push(r.def);
check('[BL-1572] exactly one check on each of the five columns, none left at the old limit',
  defs.length === 5 && defs.every((r) => /<= (960|480)\)/.test(r.def) && !/<= (60|30)\)/.test(r.def)));

// Not raised: nickname stays at 30 (not in the row's scope).
check('[BL-1572] children.nickname stays at 30',
  (await refusal(`update children set nickname = $1 where id = '${kid}'`, ['a'.repeat(30)])) === null
  && (await refusal(`update children set nickname = $1 where id = '${kid}'`, ['a'.repeat(31)]))?.code === '23514');

// The founder's hosted check in APPLY.md File 47, run as written (extracted from the doc, so the two cannot drift): 5.
const apply = readFileSync(new URL('../APPLY.md', import.meta.url), 'utf8');
const sec = apply.slice(apply.indexOf('## File 47:'));
const q = /\*\*Check \[U\] \(hosted, founder\):\*\* `([^`]+)`/.exec(sec)?.[1];
check('[BL-1572] APPLY.md File 47 has a check query to run', !!q);
check('[BL-1572] the APPLY.md File 47 check query returns 5 on the migrated schema (two closing parens, each name at its own limit)',
  q && Number((await sys(q)).rows[0].count) === 5);

await sys('rollback');
done();
