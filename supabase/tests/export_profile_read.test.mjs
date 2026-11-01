// The export's profile read (BL-529, LEGAL-REQ-034 "profile fields"; apps/mobile/src/lib/export/server-records.logic.ts
// PROFILE_COLUMNS, device.ts filters by the signed-in id) run against every migration as a signed-in person: the
// exact column list works, and the id filter returns only the person's own row even though row-level security lets
// co-parents read each other's profile.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDb, users } from './harness.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', '..', 'apps', 'mobile', 'src', 'lib', 'export', 'server-records.logic.ts'), 'utf8');
const m = src.match(/export const PROFILE_COLUMNS =\s*'([^']+)'/);
if (!m) throw new Error('PROFILE_COLUMNS not found in server-records.logic.ts');
const PROFILE_COLUMNS = m[1];

const { check, as, sys, done, publishPolicies, consent, newChild, join: joinBook } = await createDb(process.argv.slice(2));
const { A, B, C } = users;

await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}')`);
await publishPolicies();
for (const u of [A, B]) await consent(u);
await sys(`update public.profiles set display_name = 'Asha Mama', signs_as = 'Mama' where id = '${A}'`);
await sys(`update public.profiles set display_name = 'Asha Papa', signs_as = 'Papa' where id = '${B}'`);
const book = await newChild(A);
await joinBook(B, 'parent', book, A);

check('co-parents can read each other\'s profile (why the export filters by id)',
  (await as(A, `select id from public.profiles`)).rows.length === 2);

const own = (await as(A, `select ${PROFILE_COLUMNS} from public.profiles where id = $1 limit 2`, [A])).rows;
check('the export reads every column it names from profiles as a signed-in person, and gets exactly its own row',
  own.length === 1 && own[0].id === A && own[0].display_name === 'Asha Mama' && own[0].signs_as === 'Mama' && own[0].created_at !== undefined);
check('the column list names no other person\'s data and nothing beyond the profile fields',
  PROFILE_COLUMNS.split(',').map((c) => c.trim()).sort().join() === 'created_at,display_name,id,signs_as');
check('a stranger asking for someone else\'s profile by id gets nothing',
  (await as(C, `select ${PROFILE_COLUMNS} from public.profiles where id = $1`, [A])).rows.length === 0);

done();
