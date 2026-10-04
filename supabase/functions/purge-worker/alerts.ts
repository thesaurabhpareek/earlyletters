/**
 * SLA monitor and content-free alerts (DATA-REQ-036, LEGAL-REQ-031, -038; TDD 05
 * 5.4 "SLA monitor"). One email to the alert inbox (hello@ by default) per run
 * at most, listing condition kinds and counts with the runbook to open. Each
 * kind alerts at most once a day (ops_alert_claim), so a stuck request does not
 * mail every 15 minutes. If the email fails, the claims are released so the
 * next run tries again.
 */
import { sendEmail } from './lib/resend.ts';
import { ServiceError } from './lib/http.ts';
import type { AlertKind } from '../_shared/log/log.ts';
import { type Ctx, flag } from './context.ts';
import { alertEmail } from './emails.ts';
import type { SlaReport } from './rpc.ts';

export const ALERT_COOLDOWN_MINUTES = 24 * 60;
/** The worker runs every 15 minutes and calls purge_due itself, so a 2-hour gap means nothing is running it. */
export const PURGE_SILENT_MINUTES = 120;

export function conditionsFromSla(sla: SlaReport): [AlertKind, number][] {
  const out: [AlertKind, number][] = [];
  const add = (k: AlertKind, n: number | null | undefined) => {
    if (typeof n === 'number' && n > 0) out.push([k, n]);
  };
  add('tombstones_overdue', sla.tombstones_overdue);
  add('request_stuck', sla.requests_executing_over_24h);
  add('step_failed', sla.steps_failed);
  add('step_retrying', sla.steps_retrying);
  add('queue_stuck', (sla.queue_stuck ?? 0) + (sla.queue_attempts_high ?? 0));
  add('scheduled_overdue', sla.scheduled_overdue);
  add('holds_review', sla.holds_past_review);
  if (sla.purge_run_age_minutes === null || sla.purge_run_age_minutes > PURGE_SILENT_MINUTES) add('purge_silent', 1);
  return out;
}

export async function checkAndAlert(ctx: Ctx): Promise<{ conditions: number; alerted: number }> {
  try {
    const sla = await ctx.d.sla();
    for (const [k, n] of conditionsFromSla(sla)) flag(ctx, k, n);
    ctx.log.info('sla.report', { counts: { conditions: ctx.conditions.size } });
  } catch (e) {
    ctx.log.exception('sla.failed', e, { task: 'sla' });
  }
  if (!ctx.conditions.size) return { conditions: 0, alerted: 0 };

  const claimed: { kind: AlertKind; count: number }[] = [];
  for (const [kind, count] of ctx.conditions) {
    try {
      if (await ctx.d.alertClaim(kind, ALERT_COOLDOWN_MINUTES)) claimed.push({ kind, count });
      else ctx.log.info('alert.skipped', { alert: kind });
    } catch (e) {
      ctx.log.exception('alert.failed', e, { alert: kind });
    }
  }
  if (!claimed.length) return { conditions: ctx.conditions.size, alerted: 0 };

  const mail = alertEmail({ conditions: claimed, run: ctx.log.reqId, at: ctx.now() });
  try {
    await sendEmail(ctx.fetch, ctx.cfg.resendApiKey, {
      from: ctx.cfg.mailFrom, to: ctx.cfg.alertTo, ...mail, idempotencyKey: `ops-alert:${ctx.log.reqId}`,
    });
    for (const c of claimed) ctx.log.warn('alert.sent', { alert: c.kind, counts: { alerts: 1 } });
    return { conditions: ctx.conditions.size, alerted: claimed.length };
  } catch (e) {
    ctx.log.error('alert.failed', { provider: 'resend', code: e instanceof ServiceError ? e.code : 'error' });
    for (const c of claimed) {
      try {
        await ctx.d.alertReset(c.kind);
      } catch {
        // stays claimed; the next day's run alerts again
      }
    }
    return { conditions: ctx.conditions.size, alerted: 0 };
  }
}
