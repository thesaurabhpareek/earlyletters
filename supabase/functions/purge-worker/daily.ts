/**
 * Once a day: copy the purge ledger out of the database and apply ops
 * retention.
 *
 * Why the copy: purge_ledger lives inside Postgres, so restoring a backup also
 * rolls the ledger back. The `ops-ledger` bucket is not in database backups,
 * so its daily files are what lets the restore runbook re-delete everything
 * purged after the restore point (DATA-REQ-030, TDD 05 5.7, TDD 02 4.2 step 5).
 * Files hold entity types, ids and times only; they are kept 60 days, longer
 * than the 7-day backup window.
 */
import { LEDGER_BUCKET } from './lib/buckets.ts';
import type { Ctx } from './context.ts';

export const LEDGER_KEEP_DAYS = 60;
const DAY = 86_400_000;

export const ledgerName = (day: Date): string => `purges/${day.toISOString().slice(0, 10)}.jsonl`;

export async function copyLedger(ctx: Ctx): Promise<{ rows: number; files: number }> {
  const today = new Date(Math.floor(ctx.now().getTime() / DAY) * DAY);
  let rows = 0, files = 0;
  // Yesterday (complete) and today (so far). Re-writing a day's file is idempotent.
  for (const start of [new Date(today.getTime() - DAY), today]) {
    const end = new Date(start.getTime() + DAY);
    const page = await ctx.d.ledgerSince(start.toISOString(), end.toISOString());
    if (!page.length) continue;
    const body = page.map((r) => JSON.stringify({ t: r.t, id: r.id, at: r.at })).join('\n') + '\n';
    await ctx.c.storage.upload(LEDGER_BUCKET, ledgerName(start), body, 'application/x-ndjson', true);
    rows += page.length;
    files++;
  }
  // Drop files older than the keep window.
  const names = (await ctx.c.storage.list(LEDGER_BUCKET, 'purges', 1000, 0)).filter((e) => !e.isFolder).map((e) => e.name);
  const cutoff = new Date(today.getTime() - LEDGER_KEEP_DAYS * DAY).toISOString().slice(0, 10);
  const old = names.filter((n) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(n) && n.slice(0, 10) < cutoff).map((n) => `purges/${n}`);
  if (old.length) await ctx.c.storage.remove(LEDGER_BUCKET, old);
  ctx.log.info('ledger.copied', { counts: { rows, files, skipped: old.length } });
  return { rows, files };
}

export async function runDaily(ctx: Ctx): Promise<void> {
  try {
    await copyLedger(ctx);
  } catch (e) {
    ctx.log.exception('ledger.failed', e, { task: 'ledger' });
  }
  try {
    const r = await ctx.d.retention();
    ctx.log.info('retention.done', { counts: { rows: Object.values(r ?? {}).reduce((a, b) => a + (Number(b) || 0), 0) } });
  } catch (e) {
    ctx.log.exception('retention.failed', e, { task: 'retention' });
  }
}
