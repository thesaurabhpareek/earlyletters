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
 * The recovery-key access log gets the same treatment (F08-REQ-042): the last
 * week's escrow_unwraps rows are merged into `escrow/YYYY-MM-DD.jsonl` (ids, reason,
 * outcome and times; never key bytes), never overwritten, so a database restore
 * cannot quietly drop a use of the key. Then the backup sweep: orphans after 30 days, unconfirmed
 * reservations after 7, restore requests past their window, log rows after 24
 * months (backup_svc_sweep; F08 6.5 D6). Daily is more often than the weekly the
 * spec asks for; each pass is bounded and idempotent.
 */
import { LEDGER_BUCKET } from './lib/buckets.ts';
import type { Ctx } from './context.ts';

export const LEDGER_KEEP_DAYS = 60;
const DAY = 86_400_000;

export const ledgerName = (day: Date): string => `purges/${day.toISOString().slice(0, 10)}.jsonl`;
export const escrowLogName = (day: Date): string => `escrow/${day.toISOString().slice(0, 10)}.jsonl`;

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

/** How many past days each run re-checks, so a missed run or two is filled in later. */
export const ESCROW_BACKFILL_DAYS = 7;

/**
 * The daily copy of the recovery-key access log (escrow_unwraps), same keep window.
 * Never overwrites what an earlier run copied: each day's file is the union (by row id) of what
 * it already holds and what the table holds now. So a database restored to an earlier point
 * cannot shrink a file and drop a use of the key; the rows it lost stay in the copy. Each run
 * re-checks the last ESCROW_BACKFILL_DAYS days, so a missed run is caught up, and writes a file
 * only when it gains rows.
 */
export async function copyEscrowLog(ctx: Ctx): Promise<{ rows: number; files: number }> {
  const today = new Date(Math.floor(ctx.now().getTime() / DAY) * DAY);
  let rows = 0, files = 0;
  for (let back = ESCROW_BACKFILL_DAYS; back >= 0; back--) {
    const start = new Date(today.getTime() - back * DAY);
    const end = new Date(start.getTime() + DAY);
    const page = await ctx.d.escrowLogBetween(start.toISOString(), end.toISOString());
    if (!page.length) continue;
    const existing = await ctx.c.storage.download(LEDGER_BUCKET, escrowLogName(start));
    const lines = new Map<string, string>();
    for (const l of (existing ?? '').split('\n')) {
      if (!l.trim()) continue;
      let id: unknown;
      try { id = (JSON.parse(l) as { id?: unknown }).id; } catch { id = undefined; }
      lines.set(id === undefined ? `line:${lines.size}` : String(id), l); // keep even a line we cannot read
    }
    const before = lines.size;
    for (const r of page) {
      if (lines.has(String(r.id))) continue;
      lines.set(String(r.id), JSON.stringify({
        id: r.id, at: r.at, reason: r.reason, outcome: r.outcome, profile: r.profile, subject: r.subject,
        device: r.device, child: r.child, kv: r.kv, ekv: r.ekv, restore: r.restore, req: r.req,
      }));
    }
    if (lines.size === before) continue;
    const body = [...lines.values()].join('\n') + '\n';
    await ctx.c.storage.upload(LEDGER_BUCKET, escrowLogName(start), body, 'application/x-ndjson', true);
    rows += lines.size - before;
    files++;
  }
  const names = (await ctx.c.storage.list(LEDGER_BUCKET, 'escrow', 1000, 0)).filter((e) => !e.isFolder).map((e) => e.name);
  const cutoff = new Date(today.getTime() - LEDGER_KEEP_DAYS * DAY).toISOString().slice(0, 10);
  const old = names.filter((n) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(n) && n.slice(0, 10) < cutoff).map((n) => `escrow/${n}`);
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
