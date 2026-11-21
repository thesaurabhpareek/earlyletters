// The export's server reads (BL-323, LEGAL-REQ-034; apps/mobile/src/lib/export/server-records.logic.ts)
// run against every migration as a signed-in person: the exact column lists the phone selects work,
// return only that person's rows, and never carry an account id. A grant or column change that would
// make every signed-in export say "unavailable" fails here instead of on a phone.
// The spelling list is not read from the server: no client may read dictionary_terms (20261023060000).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDb, users } from './harness.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', '..', 'apps', 'mobile', 'src', 'lib', 'export', 'server-records.logic.ts'), 'utf8');
const constant = (name) => {
  const m = src.match(new RegExp(`export const ${name} =\\s*'([^']+)'`));
  if (!m) throw new Error(`${name} not found in server-records.logic.ts`);
  return m[1];
};
const ACT_COLUMNS = constant('ACT_COLUMNS');
const STATE_COLUMNS = constant('STATE_COLUMNS');

const { check, as, sys, codeOf, done, publishPolicies, consent } = await createDb(process.argv.slice(2));
const { A, B, C } = users;

await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}')`);
await publishPolicies();
await consent(A);
await consent(B);

const actsA = (await as(A, `select ${ACT_COLUMNS} from public.policy_acceptances order by accepted_at, id`)).rows;
check('the export reads every column it names from policy_acceptances as a signed-in person', actsA.length === 2);
check('it gets only its own acts (terms and sensitive-data), never another person\'s',
  actsA.map((r) => r.document).sort().join() === 'sensitive-data,terms');
check('no account id or retention column is selected',
  !/\b(profile_id|subject_hash|pseudonymised_at)\b/.test(ACT_COLUMNS) && actsA.every((r) => !('profile_id' in r) && !('subject_hash' in r)));
check('the terms act carries the age attestation in its context, as stored',
  actsA.find((r) => r.document === 'terms')?.context?.age_attested === true);

const stateA = (await as(A, `select ${STATE_COLUMNS} from public.my_policy_state order by document`)).rows;
check('the export reads my_policy_state: the latest act per document, own only',
  stateA.map((r) => `${r.document}:${r.action}`).join() === 'sensitive-data:accept,terms:accept');

check('a person with no acts gets none (and nobody else\'s)',
  (await as(C, `select ${ACT_COLUMNS} from public.policy_acceptances`)).rows.length === 0
  && (await as(C, `select ${STATE_COLUMNS} from public.my_policy_state`)).rows.length === 0);

check('the spelling list stays on the device: no client reads dictionary_terms (42501)',
  (await codeOf(() => as(A, 'select term from public.dictionary_terms'))) === '42501');

done();
