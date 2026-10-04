/**
 * One purge-worker run (TDD 02 4.2, TDD 05 7.5, DELETION_AND_EXPORT_SPEC 2.6.3).
 *
 * task 'run' (every 15 minutes from pg_cron):
 *  1. purge_due() in bounded batches while it says "more", at most 10 calls
 *     (supabase/APPLY.md step 13);
 *  2. drain storage_purge_queue through the Storage API (every registered bucket);
 *  3. deletion emails: "save a copy" notices, request and cancellation receipts;
 *  4. execute due account deletions step by step (account.ts);
 *  5. SLA check and at most one content-free alert email (alerts.ts).
 * task 'daily' (once a day): ledger copy and ops retention (daily.ts).
 *
 * The run stops starting new work at the time budget and picks up next run.
 */
import { processExecuting, sendCancelEmail, sendNotice, sendRequestEmail } from './account.ts';
import { checkAndAlert } from './alerts.ts';
import { type Ctx, flag, makeCtx, overBudget, type WorkerDeps } from './context.ts';
import { runDaily } from './daily.ts';
import { drainRows, existingBuckets } from './storage.ts';

export type Task = 'run' | 'daily';

export interface RunSummary {
  task: Task;
  purge: { calls: number; books: number; letters: number; accounts: number; failed: boolean };
  queue: { done: number; failed: number; objects: number };
  accounts: Record<string, number>;
  emails: { notices: number; requests: number; cancels: number };
  alerts: { conditions: number; alerted: number };
  budgetHit: boolean;
}

export const MAX_PURGE_CALLS = 10;

export async function runWorker(deps: WorkerDeps, task: Task = 'run'): Promise<RunSummary> {
  const ctx = makeCtx(deps);
  const started = ctx.now().getTime();
  const summary: RunSummary = {
    task,
    purge: { calls: 0, books: 0, letters: 0, accounts: 0, failed: false },
    queue: { done: 0, failed: 0, objects: 0 },
    accounts: {},
    emails: { notices: 0, requests: 0, cancels: 0 },
    alerts: { conditions: 0, alerted: 0 },
    budgetHit: false,
  };
  ctx.log.info('worker.start', { task: task === 'daily' ? 'ledger' : 'run' });

  if (task === 'daily') {
    await runDaily(ctx);
    ctx.log.info('worker.done', { task: 'ledger', duration_ms: ctx.now().getTime() - started });
    return summary;
  }

  await purgeLoop(ctx, summary);

  let storageOk = true;
  try {
    await existingBuckets(ctx);
  } catch (e) {
    storageOk = false;
    ctx.log.exception('buckets.failed', e, { provider: 'storage' });
  }

  if (storageOk && !overBudget(ctx)) {
    try {
      const rows = await ctx.d.queueDue(200, null);
      const r = await drainRows(ctx, rows);
      summary.queue = { done: r.done, failed: r.failed, objects: r.objects };
    } catch (e) {
      ctx.log.exception('queue.failed', e, { task: 'queue' });
    }
  }

  if (!overBudget(ctx)) {
    try {
      const work = await ctx.d.work(10);
      for (const n of work.notices) {
        if (overBudget(ctx)) break;
        await sendNotice(ctx, n);
        summary.emails.notices++;
      }
      for (const w of work.request_emails) {
        if (overBudget(ctx)) break;
        await sendRequestEmail(ctx, w);
        summary.emails.requests++;
      }
      for (const w of work.cancel_emails) {
        if (overBudget(ctx)) break;
        await sendCancelEmail(ctx, w);
        summary.emails.cancels++;
      }
      if (storageOk) {
        for (const req of work.executing) {
          if (overBudget(ctx)) break;
          try {
            const outcome = await processExecuting(ctx, req);
            summary.accounts[outcome] = (summary.accounts[outcome] ?? 0) + 1;
          } catch (e) {
            summary.accounts.error = (summary.accounts.error ?? 0) + 1;
            ctx.log.exception('account.failed', e, { task: 'accounts' });
          }
        }
      }
    } catch (e) {
      ctx.log.exception('account.failed', e, { task: 'accounts' });
    }
  }

  summary.budgetHit = overBudget(ctx);
  if (summary.budgetHit) ctx.log.warn('worker.budget', { duration_ms: ctx.now().getTime() - started });

  summary.alerts = await checkAndAlert(ctx);
  ctx.log.info('worker.done', {
    task: 'run',
    duration_ms: ctx.now().getTime() - started,
    counts: {
      books: summary.purge.books,
      letters: summary.purge.letters,
      objects: summary.queue.objects,
      requests: Object.values(summary.accounts).reduce((a, b) => a + b, 0),
      alerts: summary.alerts.alerted,
    },
  });
  return summary;
}

async function purgeLoop(ctx: Ctx, summary: RunSummary): Promise<void> {
  for (let i = 0; i < MAX_PURGE_CALLS; i++) {
    if (overBudget(ctx)) return;
    try {
      const r = await ctx.d.purgeDue(500);
      summary.purge.calls++;
      summary.purge.books += r?.books ?? 0;
      summary.purge.letters += r?.entries ?? 0;
      summary.purge.accounts += r?.accounts_due ?? 0;
      ctx.log.info('purge_due.batch', { counts: { books: r?.books ?? 0, letters: r?.entries ?? 0, requests: r?.accounts_due ?? 0, more: r?.more ? 1 : 0 } });
      if (!r?.more) return;
    } catch (e) {
      summary.purge.failed = true;
      flag(ctx, 'purge_failing');
      ctx.log.exception('purge_due.failed', e, { task: 'purge' });
      return;
    }
  }
}
