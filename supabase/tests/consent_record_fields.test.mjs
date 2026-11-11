// [BL-577] A consent record carries the build, the OS major version, the words shown and their
// language (PRIV-R21; 20261108000000_consent_record_fields.sql). Today's app keeps recording
// unchanged until the shared record builder ships; a builder-era call, or any call once
// app.consent_fields_required is on, cannot leave the hash or the language out of a sheet act.
// Fictional family "Asha" only (CLAUDE.md).
import { createDb, users } from './harness.mjs';

const { db, check, as, sys, codeOf, done, publishPolicies, consent } = await createDb(process.argv.slice(2));
const { A, B, C, U } = users;
await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}'),('${U}')`);
await publishPolicies();
for (const u of [A, B, C]) await consent(u);

const HASH = 'a1'.repeat(32);
const row = async (id) => (await sys(`select app_build, os_major, locale, encode(rendered_sha256, 'hex') h, method
  from policy_acceptances where id = $1`, [id])).rows[0];
const count = async (uid) => (await sys(`select count(*)::int n from policy_acceptances where profile_id = $1`, [uid])).rows[0].n;

// ── The schema ───────────────────────────────────────────────────────────
const cols = (await sys(`select attname, col_description(attrelid, attnum) c from pg_attribute
  where attrelid = 'public.policy_acceptances'::regclass and attname in ('app_build', 'os_major', 'locale') order by attname`)).rows;
check('[BL-577] policy_acceptances has app_build and os_major, both L2, and locale means the language shown (L3)',
  cols.length === 3 && /^L2\b/.test(cols[0].c) && /^L3\b.*text shown/.test(cols[1].c) && /^L2\b/.test(cols[2].c));
const fns = (await sys(`select p.oid::regprocedure::text f from pg_proc p where p.proname = 'record_policy_act'`)).rows.map((r) => r.f);
check('[BL-577] exactly one record_policy_act, with p_app_build and p_os_major last (no overload for PostgREST to choose between)',
  fns.length === 1 && fns[0].endsWith('jsonb,text,integer)'));
check('only authenticated may execute it (anon and service_role may not)',
  (await sys(`select has_function_privilege('authenticated', $1, 'execute') a, has_function_privilege('anon', $1, 'execute') b,
     has_function_privilege('service_role', $1, 'execute') s`, [fns[0]])).rows.every((r) => r.a && !r.b && !r.s));

// ── Today's app still records (apps/mobile/src/lib/auth/consent.ts, named arguments) ──
const todays = (uid, method, doc) => as(uid, `select public.record_policy_act(p_document => $1, p_version => '1.0.0', p_action => 'accept',
  p_method => $2, p_surface => 'auth.sheet', p_app_version => '1.0.0', p_platform => 'ios', p_locale => 'en',
  p_client_recorded_at => now(), p_context => '{}'::jsonb) id`, [doc, method]);
const legacy = (await todays(U, 'consent_sheet', 'sensitive-data')).rows[0].id;
check('given today\'s app (no hash, no build), when a sheet act is recorded, then it is recorded with the new fields empty',
  !!legacy && (await row(legacy)).app_build === null && (await row(legacy)).os_major === null);

// ── The builder's call ──────────────────────────────────────────────────
const full = (uid, { method = 'signin_sheet', locale = 'en', hash = HASH, build = '42', os = 17, doc = 'privacy', action = 'acknowledge' } = {}) =>
  as(uid, `select public.record_policy_act($1, '1.0.0', $2, $3, 'auth.sheet', '1.0.0', 'ios', $4, now(),
    case when $5::text is null then null else decode($5, 'hex') end, '{}'::jsonb, $6, $7) id`, [doc, action, method, locale, hash, build, os]);
const built = (await full(A)).rows[0].id;
const b = await row(built);
check('[BL-577] given the shared builder, when a sheet act is recorded, then the row holds build 42, OS major 17, the hash and the language',
  b.app_build === '42' && b.os_major === 17 && b.h === HASH && b.locale === 'en');

for (const method of ['signin_sheet', 'consent_sheet', 'reconsent_sheet']) {
  const n = await count(A);
  check(`[BL-577] given a build number, when a ${method} act has no rendered_sha256, then it is refused (23502) and nothing is recorded`,
    (await codeOf(() => full(A, { method, hash: null }))) === '23502' && (await count(A)) === n);
  check(`[BL-577] given a build number, when a ${method} act has no locale, then it is refused (23502)`,
    (await codeOf(() => full(A, { method, locale: null }))) === '23502');
}
check('a settings toggle needs no rendered text (not a sheet method)',
  (await codeOf(() => full(A, { method: 'settings_toggle', hash: null, locale: null, doc: 'sensitive-data', action: 'withdraw' }))) === 'ok');
check('app_build is digits with at most two dots (23514)',
  (await codeOf(() => full(A, { build: '42; drop' }))) === '23514' && (await codeOf(() => full(A, { build: '1.0.3' }))) === 'ok');
check('os_major is 1 to 999, never a full version (23514)',
  (await codeOf(() => full(A, { os: 0 }))) === '23514' && (await codeOf(() => full(A, { os: 1000 }))) === '23514');

// ── The switch that retires old builds ───────────────────────────────────
await sys(`select set_config('app.consent_fields_required', 'on', false)`);
const n0 = await count(B);
check('[BL-577] given app.consent_fields_required on, when today\'s app records a sheet act, then it is refused (23502) and nothing is recorded',
  (await codeOf(() => todays(B, 'signin_sheet', 'privacy'))) === '23502' && (await count(B)) === n0);
check('with it on, a complete sheet act still records', (await codeOf(() => full(B))) === 'ok');
check('the owner (support-assisted path) is held to the same rule on a sheet method',
  (await codeOf(() => sys(`insert into policy_acceptances (profile_id, document, version, action, method, surface, app_version, platform)
    values ($1, 'privacy', '1.0.0', 'acknowledge', 'consent_sheet', 'support', '1', 'ios')`, [B]))) === '23502');
await sys(`select set_config('app.consent_fields_required', '', false)`);

// ── Idempotency: a retry across the deploy still replays ─────────────────
const setKey = (k) => sys(`select set_config('request.headers', $1, false)`, [k ? JSON.stringify({ 'idempotency-key': k }) : '']);
const K = '0190f0f0-0000-7000-8000-000000000577';
await setKey(K);
const r1 = (await todays(C, 'signin_sheet', 'privacy')).rows[0].id;
const r2 = (await todays(C, 'signin_sheet', 'privacy')).rows[0].id;
const K2 = '0190f0f0-0000-7000-8000-000000000578';
await setKey(K2);
const r3 = (await full(C)).rows[0].id;
const reused = await codeOf(() => full(C, { build: '43' }));
await setKey(null);
check('a repeated call with the same key returns the first id, with or without the new fields; another build on that key is refused (22023)',
  r1 === r2 && !!r3 && reused === '22023');

// ── The row stays a record ──────────────────────────────────────────────
// The guard lets only the pseudonymisation step through; that step may not carry a change to the new columns.
const pseudo = (set) => codeOf(() => sys(`update policy_acceptances set profile_id = null, subject_hash = '\\x00', ${set} where id = $1`, [built]));
check('[BL-577] the pseudonymisation step cannot change app_build or os_major',
  (await pseudo(`app_build = '43'`)) !== 'ok' && (await pseudo('os_major = 18')) !== 'ok' && (await row(built)).app_build === '42');
// Why a trigger and not CHECK ... NOT VALID: pseudonymising a build 1 row (no hash) must still work.
await sys(`select set_config('app.consent_fields_required', 'on', false)`);
const before = await count(U);
const del = await codeOf(() => sys(`delete from profiles where id = $1`, [U]));
const kept = (await sys(`select count(*)::int n from policy_acceptances where id = $1 and profile_id is null and subject_hash is not null
  and app_build is null and rendered_sha256 is null`, [legacy])).rows[0].n;
await sys(`select set_config('app.consent_fields_required', '', false)`);
check('[BL-577] given a build 1 sheet row with no hash and the switch on, when its owner\'s profile is deleted, then the row is pseudonymised, not refused',
  before > 0 && del === 'ok' && kept === 1);

await db.close();
done();
