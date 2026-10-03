/**
 * Restore drill (DATA-REQ-031, quarterly) and restore replay (DATA-REQ-030,
 * after any real restore). Runbook: docs/ops/runbooks/restore-drill.md.
 *
 * Drill: restore the latest backup into a scratch project first (Dashboard), then
 *   SUPABASE_URL=https://<scratch>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<scratch key> \
 *   PROD_SUPABASE_URL=https://<prod>.supabase.co PROD_SERVICE_ROLE_KEY=<prod key> OPS_OPERATOR=<you> \
 *   node scripts/ops/restore-drill.ts --mode drill --project-ref <scratch> --prod-ref <prod> --ticket DRILL-2026Q4 \
 *     --restore-point <backup time, ISO> --started-at <when you clicked restore, ISO> [--replay] [--sample 200] [--out drill.json]
 *
 * Real restore (before reopening the project to clients):
 *   SUPABASE_URL=https://<restored>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... OPS_OPERATOR=<you> \
 *   node scripts/ops/restore-drill.ts --mode restore --project-ref <restored> --ticket INC-9 \
 *     --restore-point <ISO> --started-at <ISO> [--out restore.json]
 *
 * Prints counts and check results only. --out gets a JSON record with counts, timings and the verdict.
 */
import { createServiceClient, type ServiceClient } from '../../supabase/functions/purge-worker/lib/service.ts';
import { argv, env, exit, fail, parseArgs, print, writePrivate } from './lib/cli.ts';
import { chunk, compareCounts, compareSamples, drillVerdict, ledgerFileNames, parseLedger, type LedgerRow } from './lib/drill.ts';
import { auditFirst } from './lib/runbook.ts';
import { projectRefOf, resolveTarget } from './lib/target.ts';

const { flags } = parseArgs(argv());
if (flags.help) {
  print('See the header of scripts/ops/restore-drill.ts and docs/ops/runbooks/restore-drill.md');
  exit(0);
}
const mode = flags.mode === 'drill' || flags.mode === 'restore' ? flags.mode : fail('--mode drill | restore is required');
const t = resolveTarget({ url: env('SUPABASE_URL'), serviceKey: env('SUPABASE_SERVICE_ROLE_KEY'), projectRef: flags['project-ref'], operator: env('OPS_OPERATOR'), ticket: flags.ticket });
if (!t.target) fail(t.problems.join('\n'));
const target = t.target;
const restorePoint = typeof flags['restore-point'] === 'string' && !Number.isNaN(Date.parse(flags['restore-point'])) ? new Date(flags['restore-point']) : fail('--restore-point <ISO time> is required');
const startedAt = typeof flags['started-at'] === 'string' && !Number.isNaN(Date.parse(flags['started-at'])) ? new Date(flags['started-at']) : fail('--started-at <ISO time> is required');
const replay = mode === 'restore' || flags.replay === true;
const sampleSize = Math.min(Math.max(Number(flags.sample ?? 200) || 200, 10), 5000);

const restored = createServiceClient({ url: target.url, serviceKey: target.serviceKey, timeoutMs: 120_000 });
let prod: ServiceClient | null = null;
if (mode === 'drill') {
  const url = env('PROD_SUPABASE_URL');
  const ref = projectRefOf(url);
  if (!ref || flags['prod-ref'] !== ref) fail('drill mode needs PROD_SUPABASE_URL, PROD_SERVICE_ROLE_KEY and a matching --prod-ref');
  if (ref === target.projectRef) fail('the drill must restore into a scratch project, not production');
  prod = createServiceClient({ url, serviceKey: env('PROD_SERVICE_ROLE_KEY'), timeoutMs: 120_000 });
  await auditFirst(prod, { ...target, projectRef: ref }, { runbook: 'restore_drill', reason: 'quarterly_drill_read' });
}
await auditFirst(restored, target, { runbook: mode === 'drill' ? 'restore_drill' : 'restore_replay', reason: mode === 'drill' ? 'quarterly_drill' : 'post_restore_replay' });

// 1. Structure of the restored copy.
const health = await restored.rpc<Record<string, number>>('ops_schema_health', {});
print(`Schema health: ${Object.entries(health).map(([k, v]) => `${k}=${v}`).join(' ')}`);

// 2. The ledger since the restore point: daily files in the ops-ledger bucket (survive a restore),
//    plus, in a drill, production's live purge_ledger.
const ledgerSource = prod ?? restored;
const texts: string[] = [];
let filesFound = 0;
for (const name of ledgerFileNames(restorePoint, new Date())) {
  const text = await ledgerSource.storage.download('ops-ledger', name);
  if (text) {
    texts.push(text);
    filesFound++;
  }
}
if (prod) {
  const live = await prod.rpc<{ t: string; id: string; at: string }[]>('ops_ledger_between', { p_from: restorePoint.toISOString(), p_until: new Date().toISOString(), p_limit: 100000 });
  texts.push(live.map((r) => JSON.stringify(r)).join('\n'));
}
const ledger = parseLedger(texts, restorePoint);
print(`Ledger since the restore point: ${ledger.rows.length} ids from ${filesFound} files (${ledger.skipped} malformed lines skipped)`);

// 3. Replay: re-delete what was purged after the restore point.
let replayed: { entries: number; books: number; profiles: number } | null = null;
if (replay) {
  replayed = { entries: 0, books: 0, profiles: 0 };
  for (const part of chunk<LedgerRow>(ledger.rows, 500)) {
    const r = await restored.rpc<{ entries: number; books: number; profiles_to_delete: string[] }>('ops_replay_ledger', { p_rows: part });
    replayed.entries += r.entries;
    replayed.books += r.books;
    for (const uid of r.profiles_to_delete) {
      // Restored storage metadata may still name objects; clear them through the Storage API, then the Auth user.
      const owned = await restored.rpc<{ bucket_id: string; name: string }[]>('ops_storage_owned_by', { p_uid: uid, p_limit: 5000 });
      const byBucket = new Map<string, string[]>();
      for (const o of owned) byBucket.set(o.bucket_id, [...(byBucket.get(o.bucket_id) ?? []), o.name]);
      for (const [bucket, names] of byBucket) for (const part2 of chunk(names, 100)) await restored.storage.remove(bucket, part2);
      await restored.auth.deleteUser(uid);
      replayed.profiles++;
    }
  }
  print(`Replayed: ${replayed.entries} letters, ${replayed.books} books, ${replayed.profiles} accounts deleted again`);
}

// 4. Compare with production (drill only).
let sample = null;
let countDiffs: ReturnType<typeof compareCounts> = [];
if (prod) {
  const [a, b] = [await prod.rpc<Record<string, number>>('ops_row_counts', {}), await restored.rpc<Record<string, number>>('ops_row_counts', {})];
  countDiffs = compareCounts(a, b);
  print(countDiffs.length ? 'Row count differences (production vs restored):' : 'Row counts match.');
  for (const d of countDiffs) print(`  ${d.table}: ${d.a} vs ${d.b}`);
  const s = await restored.rpc<{ id: string; sha: string }[]>('ops_raw_sha', { p_ids: null, p_limit: sampleSize, p_before: restorePoint.toISOString() });
  const p = await prod.rpc<{ id: string; sha: string }[]>('ops_raw_sha', { p_ids: s.map((x) => x.id), p_limit: sampleSize, p_before: new Date().toISOString() });
  sample = compareSamples(s, p, new Set(ledger.rows.filter((r) => r.t === 'entry').map((r) => r.id)));
  print(`raw_sha256 sample: ${sample.sampled} letters, ${sample.matched} match, ${sample.mismatched} differ, ${sample.purged} purged since, ${sample.unexplained} unexplained`);
}

// 5. Timings and verdict.
const rtoMinutes = Math.round((Date.now() - startedAt.getTime()) / 60_000);
const rpoHours = (startedAt.getTime() - restorePoint.getTime()) / 3_600_000;
const verdict = drillVerdict({ health, rtoMinutes, rpoHours, sample, replayed });
print(`RTO observed: ${rtoMinutes} min (target 240). Backup age at restore: ${rpoHours.toFixed(1)} h (target 24).`);
for (const f of verdict.findings) print(`FINDING  ${f}`);
print(verdict.pass ? 'PASS' : 'FAIL: write up the gap in the drill log (docs/ops/runbooks/restore-drill.md)');
if (mode === 'restore') {
  print('Before reopening to clients: bump the sync epoch so phones re-upload what the restore lost:');
  print(`  select public.sync_begin_epoch('database_restore', '${restorePoint.toISOString()}');   (service role; 20261004100000_sync_engine.sql)`);
}
if (typeof flags.out === 'string') {
  writePrivate(flags.out, JSON.stringify({
    mode, at: new Date().toISOString(), restore_point: restorePoint.toISOString(), started_at: startedAt.toISOString(),
    rto_minutes: rtoMinutes, rpo_hours: Number(rpoHours.toFixed(2)), health, ledger: { ids: ledger.rows.length, files: filesFound },
    replayed, count_diffs: countDiffs, sample, verdict,
  }, null, 2));
  print(`Record written to ${flags.out}`);
}
exit(verdict.pass ? 0 : 1);
