// BL-334 (20261015000000; LEGAL-REQ-009, DATA-REQ-006, TDD 05 X-12): account
// deletion pseudonymises consent records only with a real pepper. Missing or
// shorter than 32 characters: SCPEP and nothing is deleted, never a hash with an
// empty pepper. The harness sets a pepper (a configured environment); this file
// unsets it. Fictional family "Asha" only (CLAUDE.md).
import { createDb, users } from './harness.mjs';

const h = await createDb(process.argv.slice(2));
const { check, as, sys, codeOf, done, publishPolicies, consent } = h;
const { A, B, C, U } = users;

await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}'),('${U}')`);
await publishPolicies();
for (const u of [A, B, C]) await consent(u);

const setPepper = (v) => sys(`select set_config('app.consent_pepper', $1, false)`, [v]);
const ready = async () => (await sys(`select public.consent_pepper_ready() r`)).rows[0].r;
const profileExists = async (uid) => (await sys(`select 1 from profiles where id = $1`, [uid])).rows.length === 1;
const rowsOf = async (uid) => Number((await sys(`select count(*) c from policy_acceptances where profile_id = $1`, [uid])).rows[0].c);

// ── Missing pepper ──────────────────────────────────────────────────────
await setPepper('');
check('[BL-334] consent_pepper_ready() is false with no pepper', (await ready()) === false);
const before = await rowsOf(A);
check('[BL-334][LEGAL-REQ-009] deleting an account with consent records and no pepper is refused (SCPEP)',
  (await codeOf(() => sys(`delete from auth.users where id = $1`, [A]))) === 'SCPEP');
check('[BL-334] nothing changed: the profile and its consent records are still there, none hashed',
  (await profileExists(A)) && (await rowsOf(A)) === before
  && Number((await sys(`select count(*) c from policy_acceptances where subject_hash = sha256(convert_to($1, 'UTF8'))`, [A])).rows[0].c) === 0);

// ── Short pepper ────────────────────────────────────────────────────────
await setPepper('x'.repeat(31));
check('[BL-334] a 31-character pepper is not ready', (await ready()) === false);
check('[BL-334] and deletion is refused with it (SCPEP)', (await codeOf(() => sys(`delete from auth.users where id = $1`, [A]))) === 'SCPEP');

// ── No consent records: nothing to hash, never blocked ──────────────────
check('an account with no consent records deletes without a pepper', (await codeOf(() => sys(`delete from auth.users where id = $1`, [U]))) === 'ok'
  && !(await profileExists(U)));

// ── A real pepper ───────────────────────────────────────────────────────
const pepper = 'a'.repeat(16) + '0123456789abcdef0123456789abcdef';
await setPepper(pepper);
check('[BL-334] consent_pepper_ready() is true with a 32+ character pepper', (await ready()) === true);
const ids = (await sys(`select id from policy_acceptances where profile_id = $1`, [A])).rows.map((r) => r.id);
check('with the pepper, account deletion goes through', (await codeOf(() => sys(`delete from auth.users where id = $1`, [A]))) === 'ok');
const hashed = (await sys(`select bool_and(subject_hash = sha256(convert_to($1 || $2, 'UTF8'))) ok, bool_and(profile_id is null) gone, count(*) c
  from policy_acceptances where id = any($3::uuid[])`, [A, pepper, ids])).rows[0];
check('[DATA-REQ-006] the records are kept, unlinked, under sha256(id || pepper)', hashed.ok && hashed.gone && Number(hashed.c) === ids.length);
check('[BL-334] and not under the empty-pepper hash',
  Number((await sys(`select count(*) c from policy_acceptances where subject_hash = sha256(convert_to($1, 'UTF8'))`, [A])).rows[0].c) === 0);

// ── Who may ask ─────────────────────────────────────────────────────────
check('people cannot call consent_pepper_ready()', (await codeOf(() => as(B, `select public.consent_pepper_ready()`))) === '42501');
check('people cannot call consent_pepper_ok()', (await codeOf(() => as(B, `select public.consent_pepper_ok()`))) === '42501');
check('the service role can', (await codeOf(() => h.db.exec(`set role service_role; select public.consent_pepper_ready(); reset role;`))) === 'ok');
await h.db.exec('reset role');
check('the pepper value never comes back from the check', typeof (await ready()) === 'boolean');

done();
