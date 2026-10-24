// The consent tables' grants match their row security (20261023050000_consent_grants_tightening.sql;
// review B on #248, notes G2 and G3). The harness grants every new table ALL for anon, authenticated and
// service_role, as hosted Supabase does, so this file shows the gap on the earlier files, applies this
// one, shows it closed, and shows every path that writes or reads these tables still working: the
// person's own act, the app's reads, publishing, pseudonymisation at account deletion, both retention
// purges and a support-assisted act. status_report_store is in subscription_status.test.mjs, which runs
// every file. Also the guards: a second run, and a run before 20261023030000 (55000, nothing changed).
// Fictional family "Asha" only (CLAUDE.md).
import { readFileSync } from 'node:fs';
import { createDb, users } from './harness.mjs';

const all = process.argv.slice(2);
const name = (f) => f.split('/').pop();
const mine = all.find((f) => name(f).startsWith('20261023050000'));
if (!mine) throw new Error('20261023050000_consent_grants_tightening.sql is not in the migration list');
const sql = readFileSync(mine, 'utf8');
const { db, check, as, asAnon, sys, codeOf, done, publishPolicies, consent } = await createDb(all.filter((f) => name(f) < name(mine)));
const { A, B } = users;

await sys(`insert into auth.users values ('${A}'),('${B}')`);
await publishPolicies();
for (const u of [A, B]) await consent(u);
for (const [u, ref] of [[A, 'a'], [B, 'b']]) {
  await sys(`insert into subscription_consents (profile_id, sub_ref, product_id, offer_type, terms_shown, shown_at)
    values ($1, $2, 'plus.annual', 'introductory', '1.0.0', now())`, [u, ref.repeat(64)]);
}
const counts = async () => (await sys(`select (select count(*) from policy_acceptances)::int p, (select count(*) from subscription_consents)::int s`)).rows[0];
const start = await counts();
const ownActs = async () => (await sys(`select count(*)::int n from policy_acceptances where profile_id = $1`, [A])).rows[0].n;
const aStart = await ownActs();

// One statement as a role, in a transaction rolled back, so nothing it does stays.
const asRole = async (role, statement) => {
  await db.exec('begin');
  try {
    if (role === 'authenticated') {
      await db.query(`select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true)`,
        [A, JSON.stringify({ sub: A, role: 'authenticated', is_anonymous: false })]);
    }
    await db.exec(`set local role ${role}`);
    await db.query(statement);
    return 'ok';
  } catch (e) {
    return e.code ?? 'error';
  } finally {
    await db.exec('rollback');
  }
};
const PRIVS = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'];
const privileges = async (x = sys) => (await x(`select r || ' ' || t || ' ' || p v from unnest(array['anon', 'authenticated', 'service_role']) r
  cross join unnest(array['policy_acceptances', 'policy_documents', 'policy_versions', 'subscription_consents']) t
  cross join unnest($1::text[]) p where has_table_privilege(r, 'public.' || t, p) order by 1`, [PRIVS])).rows.map((r) => r.v);

// ── Before: the gap ──────────────────────────────────────────────────────
check('before: a signed-in person may truncate policy_acceptances (TRUNCATE skips row security)',
  (await asRole('authenticated', 'truncate policy_acceptances')) === 'ok');
check('before: anon holds SELECT on policy_acceptances (row security gives it no row)',
  (await sys(`select has_table_privilege('anon', 'public.policy_acceptances', 'SELECT') x`)).rows[0].x);
check('before: a signed-in person may lock policy_versions exclusively (MAINTAIN, UPDATE or DELETE)',
  (await asRole('authenticated', 'lock table policy_versions in access exclusive mode')) === 'ok');
check('before: the service role may lock both consent record tables exclusively (MAINTAIN, kept by 20261023010000)',
  (await asRole('service_role', 'lock table policy_acceptances in access exclusive mode')) === 'ok'
  && (await asRole('service_role', 'lock table subscription_consents in access exclusive mode')) === 'ok');
const beforePrivs = await privileges();

// ── The guards ───────────────────────────────────────────────────────────
const early = await createDb(all.filter((f) => name(f) < '20261023030000'));
const earlyPrivs = await privileges(early.sys);
check('a run before 20261023030000 is refused (55000) and changes nothing', (await codeOf(() => early.db.exec(sql))) === '55000'
  && JSON.stringify(await privileges(early.sys)) === JSON.stringify(earlyPrivs) && earlyPrivs.includes('authenticated policy_acceptances INSERT'));
await early.db.close();

await db.exec(sql);
const afterPrivs = await privileges();
check('a second run is refused (55000) and changes nothing', (await codeOf(() => db.exec(sql))) === '55000'
  && JSON.stringify(await privileges()) === JSON.stringify(afterPrivs));

// ── After: exactly what a path uses ──────────────────────────────────────
check('after: anon and authenticated hold SELECT only, where a path reads; service_role SELECT on the records and everything on the published texts',
  JSON.stringify(afterPrivs) === JSON.stringify([
    'anon policy_documents SELECT', 'anon policy_versions SELECT',
    'authenticated policy_acceptances SELECT', 'authenticated policy_documents SELECT', 'authenticated policy_versions SELECT',
    'service_role policy_acceptances SELECT',
    ...PRIVS.map((p) => `service_role policy_documents ${p}`).sort(), ...PRIVS.map((p) => `service_role policy_versions ${p}`).sort(),
    'service_role subscription_consents SELECT',
  ].sort()) || console.log(`      holds: ${afterPrivs.join(', ')}`));
check('after: nothing else changed (every privilege taken away was in the list this file names)',
  beforePrivs.filter((v) => !afterPrivs.includes(v)).every((v) => /^(anon|authenticated) policy_(acceptances|documents|versions) |^anon policy_acceptances SELECT$|^service_role (policy_acceptances|subscription_consents) MAINTAIN$/.test(v))
  && afterPrivs.every((v) => beforePrivs.includes(v)));
for (const [label, role, statement] of [
  ['a signed-in person cannot truncate policy_acceptances', 'authenticated', 'truncate policy_acceptances'],
  ['nor delete their own acts', 'authenticated', 'delete from policy_acceptances where profile_id = auth.uid()'],
  ['nor edit a published version', 'authenticated', `update policy_versions set summary = 'x'`],
  ['nor lock a consent table exclusively', 'authenticated', 'lock table policy_versions in access exclusive mode'],
  ['anon cannot read policy_acceptances', 'anon', 'select 1 from policy_acceptances'],
  ['anon cannot add a policy document', 'anon', `insert into policy_documents (key, title, needs_affirmative_act) values ('grants-doc', 'x', false)`],
  ['the service role cannot lock policy_acceptances exclusively', 'service_role', 'lock table policy_acceptances in access exclusive mode'],
  ['nor subscription_consents', 'service_role', 'lock table subscription_consents in access exclusive mode'],
]) check(`after: ${label} (42501)`, (await asRole(role, statement)) === '42501');
check('every record is still there', JSON.stringify(await counts()) === JSON.stringify(start));

// ── The paths that must still work ───────────────────────────────────────
await as(A, `select public.record_policy_act('privacy', '1.0.0', 'acknowledge', 'signin_sheet', 'auth.sheet', '1', 'ios')`);
check('record_policy_act still records a person\'s own act', (await counts()).p === start.p + 1);
check('the app still reads its own state (my_policy_state) and its own acts',
  (await as(A, `select document from my_policy_state`)).rows.length >= 2
  && (await as(A, `select 1 from policy_acceptances`)).rows.length === aStart + 1);
check('policy_actions_needed and the sync gate still answer', (await codeOf(() => as(A, `select * from public.policy_actions_needed()`))) === 'ok'
  && (await codeOf(() => as(A, `select * from public.my_sync_gate()`))) === 'ok');
check('the published versions are still read before sign-in (anon) and after (the consent sheets, the staging smoke)',
  (await asAnon(`select document, version, effective_at from policy_versions`)).rows.length >= 4
  && (await asAnon(`select key from policy_documents`)).rows.length >= 4
  && (await as(A, `select 1 from policy_versions where document = 'terms'`)).rows.length === 1);
check('the service role still publishes a version and reads the records', (await asRole('service_role', `insert into policy_versions
  (document, version, change_class, requires_reconsent, published_at, new_users_from, effective_at, content_sha256, url, summary)
  values ('privacy', '1.0.1', 'patch', false, now(), now(), now(), '\\x00', 'https://example.invalid/privacy/1.0.1', 'x')`)) === 'ok'
  && (await asRole('service_role', 'select 1 from policy_acceptances')) === 'ok' && (await asRole('service_role', 'select 1 from subscription_consents')) === 'ok'
  && (await asRole('service_role', 'lock table policy_acceptances in access share mode')) === 'ok');
await sys(`insert into policy_acceptances (profile_id, document, version, action, method, surface, app_version, platform)
  values ($1, 'terms', '1.0.0', 'accept', 'support_assisted', 'support.desk', '1', 'ios')`, [A]);
check('the owner still records a support-assisted act (SQL Editor)', (await counts()).p === start.p + 2);
await sys(`delete from auth.users where id = $1`, [B]);
const pseud = (await sys(`select (select count(*) from policy_acceptances where profile_id is null and pseudonymised_at is not null)::int p,
  (select count(*) from subscription_consents where profile_id is null and pseudonymised_at is not null)::int s`)).rows[0];
check('deleting an account still pseudonymises both kinds of record', pseud.p > 0 && pseud.s === 1);
await db.exec('set role service_role');
let purged;
try {
  purged = {
    s: (await db.query(`select public.subscription_retention_purge(now() + interval '4 years') n`)).rows[0].n,
    p: (await db.query(`select public.purge_due(now() + interval '4 years') r`)).rows[0].r,
  };
} finally {
  await db.exec('reset role');
}
check('the service role\'s subscription_retention_purge still deletes records 3 years after pseudonymisation', purged.s === 1);
check('the service role\'s purge_due still deletes pseudonymised acceptances after 3 years',
  (await sys(`select count(*)::int n from policy_acceptances where profile_id is null`)).rows[0].n === 0
  && (await ownActs()) === aStart + 2);

done();
