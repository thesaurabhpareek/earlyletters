// [NS-42-R7] The contract between the phone's consent builder (apps/mobile/src/lib/auth/consent-record.ts, FP-2) and
// record_policy_act with its sheet-fields trigger (20261108000000). The builder's real output is sent by named
// argument, as PostgREST does; a hostile act with the hash left out must be refused (23502). Fictional family "Asha" only.
import { createHash } from 'node:crypto';
import { createDb, users } from './harness.mjs';

const { buildConsentAct } = await import(new URL('../../apps/mobile/src/lib/auth/consent-record.ts', import.meta.url).href);

const { db, check, as, sys, codeOf, done, publishPolicies, consent } = await createDb(process.argv.slice(2));
const { A, B } = users;
await sys(`insert into auth.users values ('${A}'),('${B}')`);
await publishPolicies();
await consent(B);

const env = { sha256: (t) => createHash('sha256').update(t, 'utf8').digest('hex'), appBuild: '42', appVersion: '1.0.0', osVersion: '17.4.1', platform: 'ios' };
const input = { document: 'privacy', version: '1.0.0', action: 'acknowledge', method: 'signin_sheet', surface: 'auth.consent.terms',
  shownText: 'x', locale: 'en', clientRecordedAt: '2026-11-20T10:00:00.000Z', context: {} };
const record = (uid, args) => as(uid, `select public.record_policy_act(p_document => $1, p_version => $2, p_action => $3, p_method => $4,
  p_surface => $5, p_app_version => $6, p_platform => $7, p_locale => $8, p_client_recorded_at => $9::timestamptz,
  p_rendered_sha256 => case when $10::text is null then null else decode(substr($10, 3), 'hex') end, p_context => $11::jsonb,
  p_app_build => $12, p_os_major => $13) id`,
  [args.p_document, args.p_version, args.p_action, args.p_method, args.p_surface, args.p_app_version, args.p_platform, args.p_locale,
   args.p_client_recorded_at, args.p_rendered_sha256, JSON.stringify(args.p_context), args.p_app_build, args.p_os_major]);
const row = async (id) => (await sys(`select app_build, os_major, locale, encode(rendered_sha256, 'hex') h, method, app_version, platform
  from policy_acceptances where id = $1`, [id])).rows[0];

const good = buildConsentAct({ ...input, shownText: 'The words as shown' }, env);
const id = (await record(A, good)).rows[0].id;
const r = await row(id);
check('[NS-42-R7] given the builder output, when a sheet act is recorded, then the row holds the hash, the language shown, build 42 and OS major 17',
  r.h === env.sha256('The words as shown') && r.locale === 'en' && r.app_build === '42' && r.os_major === 17);
check('[NS-42-R7] the row holds no device model, no full OS version and no age',
  JSON.stringify(r).indexOf('17.4') === -1 && !Object.keys(good).some((k) => /ip|agent|device|age_signal/.test(k)));

const hostile = { ...good, p_rendered_sha256: null };
check('[NS-42-R7] given an act with the hash left out and a build number, then the server refuses it (23502)',
  (await codeOf(() => record(A, hostile))) === '23502');
check('[NS-42-R7] given an act with the language left out, then the server refuses it (23502)',
  (await codeOf(() => record(A, { ...good, p_locale: null }))) === '23502');
check('the builder itself refuses empty words, so a hostile call cannot come from it',
  (() => { try { buildConsentAct({ ...input, shownText: '' }, env); return false; } catch { return true; } })());

await sys(`select set_config('app.consent_fields_required', 'on', false)`);
check('with the switch on, the builder output still records', (await codeOf(() => record(B, good))) === 'ok');
await sys(`select set_config('app.consent_fields_required', '', false)`);

await db.close();
done();
