// Compliance gates (20261031000000; CTO ruling CR-26; skill regulatory-compliance). The before-user-created
// hook refuses sign-up from a blocked country with 403 `signup_unavailable_region`, fails open (and counts it)
// without geo data, an IP, a known country or on an internal error, stores no IP and no person id, ignores
// region rows, and is executable by nobody but supabase_auth_admin. Counts, the regulatory watch, the report
// and retention are service-only. Documentation addresses only (RFC 5737, RFC 3849); fictional family "Asha".
import { createDb } from './harness.mjs';

const { db, check, as, asAnon, sys, codeOf, done } = await createDb(process.argv.slice(2));
const A = '11111111-1111-4111-8111-111111111111';

const hook = async (ip) => (await sys(`select public.hook_before_user_created($1::jsonb) r`, [JSON.stringify({
  metadata: { uuid: 'x', time: '2026-10-31T00:00:00Z', name: 'before-user-created', ...(ip === undefined ? {} : { ip_address: ip }) },
  user: { id: A, email: 'asha.parent@example.invalid', is_anonymous: false },
})])).rows[0].r;
const counts = async () => (await sys(`select check_name, outcome, jurisdiction, n from ops.compliance_check_counts order by 1, 2, 3`)).rows
  .map((r) => `${r.check_name} ${r.outcome} ${r.jurisdiction || '-'} ${r.n}`);
const isAllow = (r) => JSON.stringify(r) === '{}';

// 1. Before any geo data: allow, count geo_unknown.
check('no geo data: sign-up allowed', isAllow(await hook('192.0.2.10')));
check('no geo data: counted as geo_unknown', (await counts()).join('|') === 'signup_region geo_unknown - 1');

// Load a tiny fixture: 192.0.2.0/24 is KP, 198.51.100.0/24 is US, 2001:db8::/32 is IR, 203.0.113.0/24 is ZZ.
await sys(`insert into ops.geo_ip_ranges values
  ('192.0.2.0', '192.0.2.255', 'KP'), ('198.51.100.0', '198.51.100.255', 'US'),
  ('2001:db8::', '2001:db8:ffff:ffff:ffff:ffff:ffff:ffff', 'IR'), ('203.0.113.0', '203.0.113.255', 'ZZ')`);
await sys(`insert into ops.geo_ip_meta (source, source_version, row_count) values ('dbip-country-lite', 'test', 4)`);
await sys(`truncate ops.compliance_check_counts`);

const blocked = await hook('192.0.2.10');
check('KP address: refused with 403', blocked?.error?.http_code === 403);
check('KP address: machine message only, no product copy', blocked?.error?.message === 'signup_unavailable_region');
check('IPv6 IR address: refused', (await hook('2001:db8::1'))?.error?.http_code === 403);
check('US address: allowed', isAllow(await hook('198.51.100.7')));
check('ZZ (unknown) address: allowed', isAllow(await hook('203.0.113.9')));
check('address outside every range: allowed', isAllow(await hook('100.64.0.1')));
check('missing ip_address: allowed', isAllow(await hook(undefined)));
check('garbage ip_address: allowed', isAllow(await hook('not-an-ip')));
check('IPv4-mapped IPv6 KP address: refused', (await hook('::ffff:192.0.2.77'))?.error?.http_code === 403);
check('address with a mask is looked up as a host', (await hook('192.0.2.200/8'))?.error?.http_code === 403);
const afterBasics = await counts();
console.log('      counts:', afterBasics.join(' | '));
check('counts: blocks by jurisdiction, nothing else identifying', afterBasics.join('|') ===
  'signup_region block IR 1|signup_region block KP 3|signup_region geo_unknown - 4|signup_region pass - 1');

// 2. No IP and no person id is stored anywhere in ops.
const leaked = (await sys(`select table_name, column_name from information_schema.columns
  where table_schema = 'ops' and table_name in ('compliance_check_counts', 'regulatory_watch')
    and (data_type in ('inet', 'cidr', 'uuid') or column_name ~ '(ip|user|actor|email|profile)')`)).rows;
check('counts and watch tables have no IP, uuid or person column', leaked.length === 0);
const dump = JSON.stringify((await sys(`select * from ops.compliance_check_counts`)).rows);
check('no address text in the counts', !/192\.0\.2|2001:db8|198\.51/.test(dump));

// 3. Region rows never block at the hook (country data cannot resolve them).
await sys(`insert into ops.geo_ip_ranges values ('100.64.0.0', '100.64.0.255', 'UA')`);
check('UA address: allowed (region rows are web-page only)', isAllow(await hook('100.64.0.5')));

// 4. Allowing a country is data, not code.
await sys(`update ops.restricted_jurisdictions set status = 'allow' where code = 'IR'`);
check('IR set to allow: allowed', isAllow(await hook('2001:db8::2')));
await sys(`update ops.restricted_jurisdictions set status = 'block' where code = 'IR'`);

// 5. Stale data still applies, and is counted.
await sys(`update ops.geo_ip_meta set loaded_at = now() - interval '60 days'`);
await sys(`truncate ops.compliance_check_counts`);
check('stale data: KP still refused', (await hook('192.0.2.1'))?.error?.http_code === 403);
check('stale data: counted as geo_stale', (await counts()).includes('signup_region geo_stale - 1'));
await sys(`update ops.geo_ip_meta set loaded_at = now()`);

// 6. Seed (D-131): the embargoed and export-licence countries, and the four regions.
const codes = (await sys(`select string_agg(code, ',' order by code) c from ops.restricted_jurisdictions`)).rows[0].c;
check('seeded jurisdictions follow D-131', codes === 'BY,CU,IR,KP,RU,SY,UA-09,UA-14,UA-40,UA-43');
check('a region code must be scope region', (await codeOf(() => sys(`insert into ops.restricted_jurisdictions
  (code, name, program, scope, status, decided_by, source_url, checked_on) values
  ('RU-XX', 'x', 'x', 'country', 'block', 'x', 'https://x.invalid', '2026-10-31')`))) === '23514');

// 7. Privileges: nobody but supabase_auth_admin (absent in the harness) runs the hook; ops functions are service-only.
for (const role of ['anon', 'authenticated', 'service_role']) {
  const can = (await sys(`select has_function_privilege($1, 'public.hook_before_user_created(jsonb)', 'execute') ok`, [role])).rows[0].ok;
  check(`${role} cannot execute the hook`, can === false);
}
for (const fn of ['ops_count_check(text,text,text)', 'ops_regwatch_record(jsonb)', 'ops_regwatch_triage(bigint,text,text)',
  'ops_compliance_report(date,date)', 'ops_compliance_retention(timestamp with time zone)']) {
  const r = (await sys(`select has_function_privilege('anon', 'public.${fn}', 'execute') a,
    has_function_privilege('authenticated', 'public.${fn}', 'execute') u,
    has_function_privilege('service_role', 'public.${fn}', 'execute') s`)).rows[0];
  check(`${fn}: service_role only`, !r.a && !r.u && r.s);
}
check('a signed-in user cannot call the hook', (await codeOf(() => as(A, `select public.hook_before_user_created('{}')`))) === '42501');
check('anon cannot read ops tables', (await codeOf(() => asAnon(`select * from ops.compliance_check_counts`))) === '42501');

// 8. Web contribution counts, regulatory watch, report, retention.
await sys(`select public.ops_count_check('web_contribution_region', 'block', 'UA-43')`);
check('web page records a region block', (await counts()).includes('web_contribution_region block UA-43 1'));
check('ops_count_check refuses another check name', (await codeOf(() => sys(`select public.ops_count_check('signup_region', 'pass')`))) === '22023');
check('a non-block outcome cannot carry a jurisdiction', (await codeOf(() => sys(
  `insert into ops.compliance_check_counts values (current_date, 'signup_region', 'pass', 'US', 1)`))) === '23514');

const items = [
  { source: 'federal_register', external_id: '2025-05904', topic: 'coppa', title: "Children's Online Privacy Protection Rule",
    url: 'https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule', published_on: '2025-04-22', doc_type: 'Rule' },
  { source: 'federal_register', external_id: '2026-00001', topic: 'ofac-programs', title: 'Example', url: 'https://www.federalregister.gov/d/2026-00001' },
];
check('watch records two items', (await sys(`select public.ops_regwatch_record($1::jsonb) n`, [JSON.stringify(items)])).rows[0].n === 2);
check('watch is idempotent', (await sys(`select public.ops_regwatch_record($1::jsonb) n`, [JSON.stringify(items)])).rows[0].n === 0);
check('watch refuses a non-https url', (await codeOf(() => sys(`select public.ops_regwatch_record($1::jsonb)`,
  [JSON.stringify([{ ...items[0], external_id: 'x', url: 'http://x' }])]))) === '23514');
const wid = (await sys(`select id from ops.regulatory_watch where external_id = '2025-05904'`)).rows[0].id;
await sys(`select public.ops_regwatch_triage($1, 'relevant', 'amended rule; check consent flows')`, [wid]);
check('triage unknown id fails', (await codeOf(() => sys(`select public.ops_regwatch_triage(999999, 'actioned')`))) === 'P0002');

const report = (await sys(`select public.ops_compliance_report(current_date - 1, current_date) r`)).rows[0].r;
check('report has checks, geo, jurisdictions, regwatch, audit, holds',
  ['checks', 'geo', 'jurisdictions', 'regwatch', 'audit', 'legal_holds_active'].every((k) => k in report));
check('report counts open watch items', report.regwatch.new === 1 && report.regwatch.relevant_open === 1);
check('report shows the geo source', report.geo.source === 'dbip-country-lite' && report.geo.stale === false);

await sys(`insert into ops.compliance_check_counts values (current_date - 800, 'signup_region', 'pass', '', 3)`);
check('retention deletes counts older than two years', (await sys(`select public.ops_compliance_retention() n`)).rows[0].n === 1);

// 9. lock_timeout is set on the hook and the lookup, so a geo load makes the hook fail open, not time out.
const cfg = (await sys(`select p.proname, array_to_string(p.proconfig, ',') c from pg_proc p
  where p.oid in ('public.hook_before_user_created(jsonb)'::regprocedure, 'ops.country_of(inet)'::regprocedure)`)).rows;
check('hook and lookup carry lock_timeout=200ms', cfg.length === 2 && cfg.every((r) => /lock_timeout=200ms/.test(r.c)));

// 10. The migration runs twice.
const file = process.argv.slice(2).find((f) => f.endsWith('20261031000000_compliance_gates.sql'));
const { readFileSync } = await import('node:fs');
let twice = true;
try { await db.exec(readFileSync(file, 'utf8')); } catch (e) { twice = false; console.log(`      second run: ${e.message}`); }
check('migration is safe to run twice', twice);

done();
