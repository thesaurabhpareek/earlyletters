/**
 * Affected-user enumeration for an incident (LEGAL-REQ-039, runbook
 * docs/ops/runbooks/incident-notification.md). Target: under one hour.
 *
 *   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... OPS_OPERATOR=<you> \
 *   node scripts/ops/enumerate-affected.ts --project-ref <ref> --ticket INC-7 \
 *     [--all] [--profile <uuid>]... [--child <uuid>]... [--table entries]... [--bucket entry-photos]... \
 *     [--from <iso>] [--until <iso>] [--discovered-at <iso>] --out /secure/path/affected.csv
 *
 * Stdout: counts per category, totals, the audio and escrow flags and the notification clocks.
 * The CSV (profile id, email, categories, counts) is written with mode 0600 to --out.
 */
import { createServiceClient } from '../../supabase/functions/purge-worker/lib/service.ts';
import { buildScope, categoryCounts, clocks, type ScopeResult, toCsv } from './lib/affected.ts';
import { argv, env, exit, fail, parseArgs, print, writePrivate } from './lib/cli.ts';
import { auditFirst } from './lib/runbook.ts';
import { resolveTarget } from './lib/target.ts';

const { flags, lists } = parseArgs(argv());
if (flags.help) {
  print('See the header of scripts/ops/enumerate-affected.ts and docs/ops/runbooks/incident-notification.md');
  exit(0);
}
const t = resolveTarget({ url: env('SUPABASE_URL'), serviceKey: env('SUPABASE_SERVICE_ROLE_KEY'), projectRef: flags['project-ref'], operator: env('OPS_OPERATOR'), ticket: flags.ticket });
if (!t.target) fail(t.problems.join('\n'));
const target = t.target;
const out = typeof flags.out === 'string' ? flags.out : fail('--out <path> is required (outside the repo)');
const { scope, problems } = buildScope({
  all: flags.all === true,
  profiles: lists.profile,
  children: lists.child,
  tables: lists.table,
  buckets: lists.bucket,
  from: typeof flags.from === 'string' ? flags.from : undefined,
  until: typeof flags.until === 'string' ? flags.until : undefined,
});
if (problems.length) fail(problems.join('\n'));

const started = Date.now();
const client = createServiceClient({ url: target.url, serviceKey: target.serviceKey, timeoutMs: 60_000 });
await auditFirst(client, target, { runbook: 'incident_scope', reason: scope.all ? 'whole_database' : 'scoped', detail: { tables: (scope.tables ?? []).length, buckets: (scope.buckets ?? []).length } });
const result = await client.rpc<ScopeResult>('ops_incident_scope', { p_scope: scope });

const emails = new Map<string, string | null>();
let missing = 0;
for (const p of result.profiles) {
  const u = await client.auth.getUser(p.profile_id);
  emails.set(p.profile_id, u?.email ?? null);
  if (!u?.email) missing++;
}
writePrivate(out, toCsv(result.profiles, emails));

print(`Affected people: ${result.totals.profiles} (without an email address: ${missing})`);
print(`Letters in scope: ${result.totals.letters}. Photos in scope: ${result.totals.photos}.`);
print(`Audio stored on the server: ${result.audio_on_server ? 'YES, check Standard versus Vault mode' : 'no (v1.0 keeps recordings on phones)'}`);
print(`Escrow key material present: ${result.escrow_present ? 'YES, decide whether the escrow key was exposed' : 'no'}`);
print('People per data category:');
for (const [c, n] of Object.entries(categoryCounts(result.profiles))) print(`  ${c}: ${n}`);
const discovered = typeof flags['discovered-at'] === 'string' ? new Date(flags['discovered-at']) : new Date();
print('Notification clocks from discovery (counsel decides which apply; use the shortest):');
for (const c of clocks(discovered)) print(`  ${c.name}: ${c.due} (${c.note})`);
print(`List written to ${out} (mode 0600). Took ${Math.round((Date.now() - started) / 1000)} s.`);
