// BL-1963 (refines BL-1572): profiles.display_name is raised from 60 to 960 code points, the product limit (60) times 16, the same
// rule as children.name. 960 accepted, 961 refused with SQLSTATE 23514 and a value-free message (BL-244), counted in code points not
// bytes; the trigger function is run by no API role; the founder's APPLY.md File 48 check is run as written. Fictional family "Asha".
import { readFileSync } from 'node:fs';
import { createDb, users } from './harness.mjs';

const { check, as, sys, codeOf, done } = await createDb(process.argv.slice(2));
const { A } = users;
await sys(`insert into auth.users values ('${A}')`);

const dev = (n) => 'आशा'.repeat(Math.ceil(n / 3)).slice(0, n);   // n code points, each 3 bytes in UTF-8
const refusal = async (sql, params) => {
  await sys('savepoint dn');
  try { await sys(sql, params); await sys('rollback to dn'); return null; }
  catch (e) { await sys('rollback to dn'); return e; }
};
const up = `update profiles set display_name = $1 where id = '${A}'`;

// Through the role the app uses: the signed-in person updates their own row (authenticated holds UPDATE on profiles).
check('[BL-1963] as the signed-in person, 960 is accepted', (await codeOf(() => as(A, `update profiles set display_name = $1 where id = '${A}'`, [dev(960)]))) === 'ok');
check('[BL-1963] as the signed-in person, 961 is refused with 23514', (await codeOf(() => as(A, `update profiles set display_name = $1 where id = '${A}'`, [dev(961)]))) === '23514');

await sys('begin');
check('[BL-1963] display_name: 960 code points are accepted', (await refusal(up, [dev(960)])) === null);
const over = await refusal(up, [dev(961)]);
check('[BL-1963] display_name: 961 code points are refused, SQLSTATE 23514', over !== null && over.code === '23514');
check('[BL-1963] the refusal is value-free: fixed message, no DETAIL, no HINT, none of the name',
  !!over && over.message === 'profiles: display_name is over its limit' && !over.detail && !over.hint && !String(over.message).includes(dev(961).slice(0, 6)));
check('[BL-1963] the 61-code-point name the old check refused is accepted', (await refusal(up, [dev(61)])) === null);
check('[BL-1963] a 30-character Devanagari name (about 90 code points) is accepted', (await refusal(up, [dev(90)])) === null);
check('[BL-1963] 960 four-byte code points are accepted (the count is code points, not bytes)', (await refusal(up, ['\u{1F338}'.repeat(960)])) === null);
check('[BL-1963] a null display_name is still accepted', (await refusal(up, [null])) === null);
check('[BL-1963] an UPDATE of another column is not blocked', (await refusal(`update profiles set signs_as = 'Mama' where id = '${A}'`, [])) === null);
const ins = await refusal(`insert into profiles (id, display_name) values (gen_random_uuid(), $1)`, [dev(961)]);
check('[BL-1963] an INSERT of 961 is refused by the same trigger, value-free', ins?.code === '23514' && !ins.detail);

// Catalog: one check on the column at its own limit, none left at 60; the trigger exists; the function is run by no API role.
const defs = (await sys(`select pg_get_constraintdef(c.oid) def from pg_constraint c
  where c.conrelid = 'public.profiles'::regclass and c.contype = 'c' and pg_get_constraintdef(c.oid) ~ '\\(display_name\\)'`)).rows;
check('[BL-1963] exactly one check on display_name, at 960, none left at 60', defs.length === 1 && /<= 960\)/.test(defs[0].def) && !/<= 60\)/.test(defs[0].def));
const fn = (await sys(`select p.prosecdef, (select substr(c, 13) from unnest(coalesce(p.proconfig, '{}'::text[])) c where c like 'search_path=%' limit 1) sp,
    has_function_privilege('anon', p.oid, 'execute') anon, has_function_privilege('authenticated', p.oid, 'execute') auth,
    coalesce(has_function_privilege('service_role', p.oid, 'execute'), false) svc
  from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = 'profiles_validate_limits'`)).rows[0];
check('[BL-1963] profiles_validate_limits: SECURITY INVOKER, search_path pinned, EXECUTE held by no API role',
  !!fn && fn.prosecdef === false && /^pg_catalog\b.*pg_temp$/.test(fn.sp ?? '') && !fn.anon && !fn.auth && !fn.svc);
check('[BL-1963] profiles.signs_as is unchanged at 480 (File 47)',
  (await refusal(`update profiles set signs_as = $1 where id = '${A}'`, [dev(481)]))?.code === '23514');

// The founder's hosted check in APPLY.md File 48, run as written (extracted from the doc, so the two cannot drift): 2.
const apply = readFileSync(new URL('../APPLY.md', import.meta.url), 'utf8');
const sec = apply.slice(apply.indexOf('## File 48:'));
const q = /\*\*Check \[U\] \(hosted, founder\):\*\* `([^`]+)`/.exec(sec)?.[1];
check('[BL-1963] APPLY.md File 48 has a check query to run', !!q);
check('[BL-1963] the APPLY.md File 48 check query returns 2 on the migrated schema (the check at 960, the trigger present)',
  q && Number((await sys(q)).rows[0].count) === 2);
await sys('rollback');
done();
