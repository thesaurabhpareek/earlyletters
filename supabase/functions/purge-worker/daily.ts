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
 *
 * The recovery-key access log gets a stricter copy (F08-REQ-042): each run writes
 * yesterday's and today's escrow_unwraps rows (ids, reason, outcome and times; never
 * key bytes) to a NEW file per day per run, `escrow/YYYY-MM-DD.run-<UTC stamp>.jsonl`,
 * uploaded without overwrite, so a later run after a database restore can never
 * replace an earlier file that still shows a use of the key. Days in the week
 * before yesterday with no file at all (the worker was down) are backfilled. Then
 * the backup sweep: orphans after 30 days, unconfirmed reservations after 24 hours,
 * restore requests past their window, log rows after 24 months (backup_svc_sweep;
 * F08 6.5 D6). Daily is more often than the weekly the spec asks for; each pass is
 * bounded and idempotent.
 */
import { LEDGER_BUCKET } from './lib/buckets.ts';
import type { Ctx } from './context.ts';

export const LEDGER_KEEP_DAYS = 60;
const DAY = 86_400_000;

export const ledgerName = (day: Date): string => `purges/${day.toISOString().slice(0, 10)}.jsonl`;
export const escrowLogName = (day: Date, run: Date): string =>
  `escrow/${day.toISOString().slice(0, 10)}.run-${run.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}.jsonl`;
export const ESCROW_BACKFILL_DAYS = 7;

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

/**
 * The daily copy of the recovery-key access log (escrow_unwraps): one new file per day per run,
 * never overwritten; yesterday and today every run, and any day of the week before with no file.
 */
export async function copyEscrowLog(ctx: Ctx): Promise<{ rows: number; files: number }> {
  const run = ctx.now();
  const today = new Date(Math.floor(run.getTime() / DAY) * DAY);
  const names = (await ctx.c.storage.list(LEDGER_BUCKET, 'escrow', 1000, 0)).filter((e) => !e.isFolder).map((e) => e.name);
  const hasFile = (d: Date) => names.some((n) => n.startsWith(`${d.toISOString().slice(0, 10)}.`));
  const days: Date[] = [];
  for (let back = ESCROW_BACKFILL_DAYS; back >= 2; back--) {
    const d = new Date(today.getTime() - back * DAY);
    if (!hasFile(d)) days.push(d);
  }
  days.push(new Date(today.getTime() - DAY), today);
  let rows = 0, files = 0;
  for (const start of days) {
    const end = new Date(start.getTime() + DAY);
    const page = await ctx.d.escrowLogBetween(start.toISOString(), end.toISOString());
    if (!page.length) continue;
    const body = page.map((r) => JSON.stringify({
      id: r.id, at: r.at, reason: r.reason, outcome: r.outcome, profile: r.profile, subject: r.subject,
      device: r.device, child: r.child, kv: r.kv, ekv: r.ekv, restore: r.restore, req: r.req,
    })).join('\n') + '\n';
    await ctx.c.storage.upload(LEDGER_BUCKET, escrowLogName(start, run), body, 'application/x-ndjson', false);
    rows += page.length;
    files++;
  }
  const cutoff = new Date(today.getTime() - LEDGER_KEEP_DAYS * DAY).toISOString().slice(0, 10);
  const old = names.filter((n) => /^\d{4}-\d{2}-\d{2}\./.test(n) && n.endsWith('.jsonl') && n.slice(0, 10) < cutoff).map((n) => `escrow/${n}`);
  if (old.length) await ctx.c.storage.remove(LEDGER_BUCKET, old);
  ctx.log.info('ledger.copied', { task: 'ledger', counts: { rows, files, skipped: old.length } });
  return { rows, files };
}

export async function runDaily(ctx: Ctx): Promise<void> {
  try {
    await copyLedger(ctx);
  } catch (e) {
    ctx.log.exception('ledger.failed', e, { task: 'ledger' });
  }
  try {
    await copyEscrowLog(ctx);
  } catch (e) {
    ctx.log.exception('ledger.failed', e, { task: 'ledger' });
  }
  try {
    const r = await ctx.d.backupSweep(500);
    ctx.log.info('retention.done', { task: 'retention', counts: { rows: Object.values(r ?? {}).reduce((a, b) => a + (Number(b) || 0), 0) } });
  } catch (e) {
    ctx.log.exception('retention.failed', e, { task: 'retention' });
  }
  try {
    const r = await ctx.d.retention();
    ctx.log.info('retention.done', { counts: { rows: Object.values(r ?? {}).reduce((a, b) => a + (Number(b) || 0), 0) } });
  } catch (e) {
    ctx.log.exception('retention.failed', e, { task: 'retention' });
  }
}
