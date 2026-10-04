/**
 * Deletion verification across Postgres, Storage and Auth (LEGAL-REQ-029,
 * DATA-REQ-034; runbook docs/ops/runbooks/stuck-deletion.md). Run on staging
 * for the G2 release gate (TDD 05 9.4) and on production after any manual fix.
 *
 *   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... OPS_OPERATOR=<you> \
 *   node scripts/ops/verify-deletion.ts --project-ref <ref> --ticket DEL-12 --profile <former profile uuid> \
 *     [--request <deletion request uuid>] [--analytics-id <uuid>]...
 *
 * With POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID set and --analytics-id given,
 * also checks that PostHog has no person left for those ids (the id goes to PostHog
 * only, in the request to PostHog; it is never printed).
 * Exit code 0 when every check passes, 1 otherwise. Prints check names and counts only.
 */
import { createServiceClient } from '../../supabase/functions/purge-worker/lib/service.ts';
import { argv, env, exit, fail, parseArgs, print } from './lib/cli.ts';
import { auditFirst } from './lib/runbook.ts';
import { resolveTarget, UUID_RE } from './lib/target.ts';
import { evaluateDeletion, type Gathered } from './lib/verify.ts';

const { flags, lists } = parseArgs(argv());
if (flags.help) {
  print('See the header of scripts/ops/verify-deletion.ts');
  exit(0);
}
const t = resolveTarget({ url: env('SUPABASE_URL'), serviceKey: env('SUPABASE_SERVICE_ROLE_KEY'), projectRef: flags['project-ref'], operator: env('OPS_OPERATOR'), ticket: flags.ticket });
if (!t.target) fail(t.problems.join('\n'));
const target = t.target;
const profile = typeof flags.profile === 'string' && UUID_RE.test(flags.profile) ? flags.profile.toLowerCase() : fail('--profile <uuid> is required');
const request = typeof flags.request === 'string' ? (UUID_RE.test(flags.request) ? flags.request : fail('--request must be a UUID')) : null;
const analyticsIds = (lists['analytics-id'] ?? []).filter((x) => UUID_RE.test(x));

const client = createServiceClient({ url: target.url, serviceKey: target.serviceKey, timeoutMs: 60_000 });
await auditFirst(client, target, { runbook: 'verify_deletion', reason: 'post_deletion_check', targetProfile: profile, detail: { analytics_ids: analyticsIds.length } });

let posthog: number | null = null;
const phKey = env('POSTHOG_PERSONAL_API_KEY');
const phProject = env('POSTHOG_PROJECT_ID');
const phHost = (env('POSTHOG_HOST') || 'https://us.posthog.com').replace(/\/+$/, '');
if (analyticsIds.length && phKey && /^[0-9]+$/.test(phProject)) {
  posthog = 0;
  for (const id of analyticsIds) {
    const res = await fetch(`${phHost}/api/projects/${phProject}/persons/?distinct_id=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${phKey}` } });
    if (!res.ok) fail(`PostHog lookup failed with HTTP ${res.status}`);
    const body = (await res.json()) as { results?: unknown[] };
    posthog += Array.isArray(body.results) ? body.results.length : 0;
  }
}

const gathered: Gathered = {
  residue: await client.rpc('ops_deletion_residue', { p_uid: profile, p_phase: 'after_finalize' }),
  storageResidue: await client.rpc('ops_storage_residue', { p_uid: profile, p_limit: 100 }),
  owned: await client.rpc('ops_storage_owned_by', { p_uid: profile, p_limit: 100 }),
  authUserExists: (await client.auth.getUser(profile)) !== null,
  appleTokenRows: ((await client.rpc<unknown[]>('ops_apple_token_get', { p_profile: profile })) ?? []).length,
  request: request ? await client.rpc('ops_deletion_request_status', { p_request: request }) : null,
  posthogPersonsFound: posthog,
};
const { ok, checks } = evaluateDeletion(gathered);
for (const c of checks) print(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name} (${c.detail})`);
if (!analyticsIds.length) print('SKIP  posthog: no --analytics-id given (ids are never stored on the server; the device sent them at request time)');
print(ok ? 'Deletion verified.' : 'Deletion NOT verified. See docs/ops/runbooks/stuck-deletion.md');
exit(ok ? 0 : 1);
