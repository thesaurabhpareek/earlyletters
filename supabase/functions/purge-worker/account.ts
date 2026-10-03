/**
 * Account deletion execution (DELETION_AND_EXPORT_SPEC 2.6.3, DATA-REQ-019 to
 * -027, -033, -034; TDD 05 5.4 and 7.5) plus the emails around it.
 *
 * Order (DATA-REQ-020), strict: prepare, storage_objects, apple_token_revoke,
 * posthog, powersync_verify, email_provider, receipt_email, auth_user, then
 * verify and finalize. A step that fails is retried with the database backoff
 * (1 minute doubling to 6 hours, record_deletion_step) for 7 days after the
 * request started executing, then marked `failed`, which stops the request and
 * alerts. Every step is idempotent, so a crash at any point is safe to re-run.
 *
 *  - posthog: `not_applicable`. Analytics persons are deleted at request time
 *    by the stateless analytics-forget function (TDD 05 X-02); the server never
 *    holds analytics ids.
 *  - powersync_verify: `not_applicable`. v1.0 has no sync vendor (D-023,
 *    20261004100000_sync_engine.sql).
 */
import { makeClientSecret, revokeAppleToken, unwrapAppleToken } from './lib/apple.ts';
import { ServiceError } from './lib/http.ts';
import { deleteContact, sendEmail } from './lib/resend.ts';
import { codeOf, type Ctx, flag, isTransient, overBudget, sha256Hex } from './context.ts';
import { contributorNoticeEmail, deletionCancelledEmail, deletionCompletedEmail, deletionRequestedEmail } from './emails.ts';
import type { EmailWork, ExecutingRequest, NoticeWork, StepStatus } from './rpc.ts';
import { purgeAccountStorage } from './storage.ts';
import type { StepName } from '../_shared/log/log.ts';

export const STEP_ORDER = [
  'storage_objects', 'apple_token_revoke', 'posthog', 'powersync_verify', 'email_provider', 'receipt_email', 'auth_user',
] as const;
export type OrderedStep = (typeof STEP_ORDER)[number];

/** Retry window before a step is marked failed (DELETION spec 2.6.3). */
export const STEP_RETRY_WINDOW_MS = 7 * 24 * 3600_000;
/** Attempts after which a still-retrying step raises the "repeated failure" alert. */
export const ALERT_AFTER_ATTEMPTS = 5;

interface StepResult {
  status: Exclude<StepStatus, 'pending' | 'failed'>;
  receipt?: Record<string, unknown>;
}

type Outcome = 'finalized' | 'waiting' | 'held' | 'failed' | 'residue' | 'budget';

export async function processExecuting(ctx: Ctx, req: ExecutingRequest): Promise<Outcome> {
  const steps = new Map(req.steps.map((s) => [s.step, s]));
  let receipt: Record<string, unknown> = { ...(req.receipt ?? {}) };
  const merge = async (part: Record<string, unknown>) => {
    receipt = { ...receipt, ...part };
    await ctx.d.mergeReceipt(req.id, part);
  };

  // A pending "save a copy" notice is sent before the books are deleted. It never blocks deletion.
  const notice = steps.get('contributor_export_notice');
  if (notice && notice.status === 'pending') {
    notice.status = await sendNotice(ctx, { request_id: req.id, kind: 'account', scheduled_for: req.executing_at, attempts: notice.attempts }, true);
  }

  if (receipt.prepared !== true) {
    const p = await ctx.d.prepare(req.id);
    if (p?.held) {
      ctx.log.info('account.held', { step: 'prepare' });
      return 'held';
    }
    await merge({ prepared: true, letters: p?.entries ?? 0, books: p?.books ?? 0 });
    ctx.log.info('account.step', { step: 'prepare', outcome: 'ok', counts: { letters: p?.entries ?? 0, books: p?.books ?? 0 } });
  }

  const executingFor = ctx.now().getTime() - new Date(req.executing_at).getTime();
  for (const step of STEP_ORDER) {
    const row = steps.get(step);
    if (!row || row.status === 'done' || row.status === 'not_applicable') continue;
    if (row.status === 'failed') {
      flag(ctx, 'step_failed');
      return 'failed';
    }
    if (new Date(row.next_attempt_at).getTime() > ctx.now().getTime()) {
      if (row.attempts >= ALERT_AFTER_ATTEMPTS) flag(ctx, 'step_retrying');
      return 'waiting';
    }
    if (overBudget(ctx)) return 'budget';
    try {
      const r = await runStep(ctx, step, req, receipt);
      if (r.receipt) await merge(r.receipt);
      await ctx.d.recordStep(req.id, step, r.status);
      row.status = r.status;
      ctx.log.info('account.step', { step, outcome: r.status === 'done' ? 'ok' : 'skipped' });
    } catch (e) {
      const code = codeOf(e);
      const giveUp = executingFor > STEP_RETRY_WINDOW_MS;
      await ctx.d.recordStep(req.id, step, giveUp ? 'failed' : 'pending', code);
      if (giveUp) {
        flag(ctx, 'step_failed');
        ctx.log.error('account.step_failed', { step, code: e instanceof ServiceError ? e.code : 'error', status: e instanceof ServiceError ? e.status : undefined });
        return 'failed';
      }
      if (row.attempts + 1 >= ALERT_AFTER_ATTEMPTS || !isTransient(e)) flag(ctx, 'step_retrying');
      ctx.log.warn('account.step_retry', { step, code: e instanceof ServiceError ? e.code : 'error', status: e instanceof ServiceError ? e.status : undefined, provider: e instanceof ServiceError ? e.provider : undefined });
      return 'waiting';
    }
  }

  // Verify (DATA-REQ-034) before finalize: nothing in Postgres, Storage or Auth still points at the person.
  const uid = req.profile_id;
  const [rows, objects, owned, user] = await Promise.all([
    ctx.d.residue(uid, 'before_finalize'),
    ctx.d.storageResidue(uid, 10),
    ctx.d.ownedObjects(uid, 10),
    ctx.c.auth.getUser(uid),
  ]);
  const residue = rows.length + objects.length + owned.length + (user ? 1 : 0);
  if (residue) {
    flag(ctx, 'residue');
    ctx.log.error('account.residue', { step: 'verify', counts: { residue } });
    return 'residue';
  }

  const finalSteps: Record<string, string> = {};
  for (const s of req.steps) finalSteps[s.step] = s.status;
  const final = {
    request_id: req.id,
    requested_at: req.requested_at,
    completed_at: ctx.now().toISOString(),
    counts: { letters: num(receipt.letters), books: num(receipt.books), objects: num(receipt.objects), rehomed: num(receipt.rehomed) },
    steps: finalSteps,
    apple: typeof receipt.apple === 'string' ? receipt.apple : 'not_apple',
    receipt_email: typeof receipt.receipt_email === 'string' ? receipt.receipt_email : 'not_sent',
    request_email: typeof receipt.request_email === 'string' ? receipt.request_email : 'not_sent',
    verified: true,
  };
  await ctx.d.finalize(req.id, final);
  ctx.log.info('account.finalized', { step: 'finalize', outcome: 'ok' });
  return 'finalized';
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);

async function runStep(ctx: Ctx, step: OrderedStep, req: ExecutingRequest, receipt: Record<string, unknown>): Promise<StepResult> {
  const uid = req.profile_id;
  switch (step) {
    case 'storage_objects': {
      const r = await purgeAccountStorage(ctx, req.id, uid);
      return { status: 'done', receipt: { objects: num(receipt.objects) + r.objects, rehomed: num(receipt.rehomed) + r.rehomed } };
    }
    case 'apple_token_revoke':
      return revokeApple(ctx, uid);
    case 'posthog':
      return { status: 'not_applicable', receipt: { posthog: 'at_request' } };
    case 'powersync_verify':
      return { status: 'not_applicable' };
    case 'email_provider': {
      // Sent-email records age out at Resend after 30 days (Verified: Resend docs). Contacts exist
      // only if we ever keep lists (RESEND_CONTACTS=on); v1.0 keeps none.
      if (!ctx.cfg.resendContacts) return { status: 'not_applicable', receipt: { email_provider: 'no_contacts' } };
      const user = await ctx.c.auth.getUser(uid);
      if (!user?.email) return { status: 'not_applicable' };
      await deleteContact(ctx.fetch, ctx.cfg.resendApiKey, user.email);
      return { status: 'done' };
    }
    case 'receipt_email': {
      const user = await ctx.c.auth.getUser(uid);
      if (!user?.email) return { status: 'not_applicable', receipt: { receipt_email: 'no_address' } };
      const mail = deletionCompletedEmail({ completedAt: ctx.now().toISOString(), reference: req.id, hadSubscription: req.had_active_subscription });
      await sendEmail(ctx.fetch, ctx.cfg.resendApiKey, {
        from: ctx.cfg.mailFrom, replyTo: ctx.cfg.replyTo, to: user.email, ...mail, idempotencyKey: `deletion-completed:${req.id}`,
      });
      ctx.log.info('emails.sent', { step: 'receipt_email', provider: 'resend', counts: { emails: 1 } });
      return { status: 'done', receipt: { receipt_email: 'sent' } };
    }
    case 'auth_user': {
      // Supabase refuses to delete a user who still owns Storage objects; check again right before.
      const owned = await ctx.d.ownedObjects(uid, 1);
      if (owned.length) throw new ServiceError('storage', 0, 'ownership');
      await ctx.c.auth.deleteUser(uid);
      return { status: 'done' };
    }
  }
}

async function revokeApple(ctx: Ctx, uid: string): Promise<StepResult> {
  const [row] = await ctx.d.appleTokenGet(uid);
  if (!row) {
    const user = await ctx.c.auth.getUser(uid);
    if (user?.providers.includes('apple')) {
      // No stored refresh token (the code exchange at sign-in failed or predates it). There is
      // nothing we hold to revoke; the receipt says so and the founder is told (TDD 04 3.1.1, F-04).
      flag(ctx, 'apple_no_token');
      return { status: 'not_applicable', receipt: { apple: 'no_token' } };
    }
    return { status: 'not_applicable', receipt: { apple: 'not_apple' } };
  }
  const apple = ctx.cfg.apple;
  const kek = ctx.cfg.tokenKeks[row.key_version];
  if (!apple || !kek || !apple.clientIds.includes(row.client_id)) {
    flag(ctx, 'apple_config');
    throw new ServiceError('apple', 0, 'config');
  }
  const token = await unwrapAppleToken(kek, uid, row.ciphertext);
  const secret = await makeClientSecret(apple, row.client_id, ctx.now().getTime());
  let outcome;
  try {
    outcome = await revokeAppleToken(ctx.fetch, { clientId: row.client_id, clientSecret: secret, token });
  } catch (e) {
    if (e instanceof ServiceError && e.code === 'invalid_client') flag(ctx, 'apple_config');
    throw e;
  }
  await ctx.d.appleTokenDelete(uid);
  return { status: 'done', receipt: { apple: outcome } };
}

// ---------------------------------------------------------------------------
// Emails around a request: received, cancelled, and the contributor notice.
// ---------------------------------------------------------------------------

export async function sendNotice(ctx: Ctx, n: NoticeWork, beforePrepare = false): Promise<StepStatus> {
  try {
    const contributors = await ctx.d.contributors(n.request_id);
    if (!contributors.length) {
      await ctx.d.recordStep(n.request_id, 'contributor_export_notice', 'not_applicable');
      return 'not_applicable';
    }
    const mail = contributorNoticeEmail({ scheduledFor: n.scheduled_for });
    let sent = 0;
    for (const id of contributors) {
      const user = await ctx.c.auth.getUser(id);
      if (!user?.email) continue;
      await sendEmail(ctx.fetch, ctx.cfg.resendApiKey, {
        from: ctx.cfg.mailFrom, replyTo: ctx.cfg.replyTo, to: user.email, ...mail,
        idempotencyKey: `contributor-notice:${await sha256Hex(`${n.request_id}:${id}`)}`,
      });
      sent++;
    }
    await ctx.d.recordStep(n.request_id, 'contributor_export_notice', 'done');
    ctx.log.info('emails.sent', { step: 'contributor_export_notice', provider: 'resend', counts: { emails: sent } });
    return 'done';
  } catch (e) {
    // Never blocks the deletion: at execution time a last failure is recorded as failed.
    const status: StepStatus = beforePrepare ? 'failed' : 'pending';
    try {
      await ctx.d.recordStep(n.request_id, 'contributor_export_notice', status, codeOf(e));
    } catch {
      // next run retries
    }
    if (beforePrepare || n.attempts + 1 >= ALERT_AFTER_ATTEMPTS) flag(ctx, beforePrepare ? 'step_failed' : 'step_retrying');
    ctx.log.warn('emails.failed', { step: 'contributor_export_notice', provider: 'resend', code: e instanceof ServiceError ? e.code : 'error' });
    return status;
  }
}

export async function sendRequestEmail(ctx: Ctx, w: EmailWork): Promise<void> {
  await sendLifecycleEmail(ctx, w, 'request_email', () => deletionRequestedEmail({ scheduledFor: w.scheduled_for, reference: w.id }), `deletion-requested:${w.id}`);
}

export async function sendCancelEmail(ctx: Ctx, w: EmailWork): Promise<void> {
  await sendLifecycleEmail(ctx, w, 'cancel_email', () => deletionCancelledEmail({ reference: w.id }), `deletion-cancelled:${w.id}:${w.cancelled_at ?? ''}`);
}

async function sendLifecycleEmail(
  ctx: Ctx,
  w: EmailWork,
  step: Extract<StepName, 'request_email' | 'cancel_email'>,
  compose: () => { subject: string; text: string },
  idempotencyKey: string,
): Promise<void> {
  try {
    const user = await ctx.c.auth.getUser(w.profile_id);
    if (!user?.email) {
      await ctx.d.mergeReceipt(w.id, { [step]: 'no_address' });
      return;
    }
    await sendEmail(ctx.fetch, ctx.cfg.resendApiKey, {
      from: ctx.cfg.mailFrom, replyTo: ctx.cfg.replyTo, to: user.email, ...compose(), idempotencyKey,
    });
    await ctx.d.mergeReceipt(w.id, { [step]: 'sent' });
    ctx.log.info('emails.sent', { step, provider: 'resend', counts: { emails: 1 } });
  } catch (e) {
    // Retried on the next run while the request is inside the 2-day email window.
    ctx.log.warn('emails.failed', { step, provider: 'resend', code: e instanceof ServiceError ? e.code : 'error' });
  }
}
