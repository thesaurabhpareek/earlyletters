/**
 * Escrow key rotation (F08 6.5 G4, F08-REQ-030). Runs only while ESCROW_TASK_SECRET and
 * ESCROW_ROTATE_FROM / _TO are set here AND app.escrow_rotation = '<from>:<to>' is set in the main
 * database (runbook R1 to R6), through POST /escrow/v1/rotate.
 *
 * Each call walks the wraps still on the old version in small batches after a keyset cursor, up to
 * a row budget: for every one it opens the book key in memory, seals it to the new escrow public
 * key, zeroes the plaintext, and stores it with escrow_rewrap_key, a compare-and-set that writes
 * the `rotation` log row and the account's notice row in the same transaction (each commit is one
 * row, far under 1 s, so the sync watermark is never held back). A wrap that will not open is
 * logged once as a `rotation` row with outcome `failed`, counted and passed over, so it never
 * stalls the rest; the next call tries it again.
 *
 * Then the emails: every notice not yet sent (one per account per rotation) is sent under the
 * notice id as its idempotency key and marked; a failed send stays due for the next call. Call
 * again until `remaining` is false and `notices_pending` is 0.
 */
import { fromHex } from './bytes.ts';
import type { EscrowDb, RotationCursor } from './db.ts';
import { aad, HpkeError, INFO, open, packV1, publicKeyOf, seal, unpackV1 } from './hpke.ts';
import type { Logger } from './log.ts';
import { type Mailer, render, when } from './mail.ts';

export interface RotateDeps {
  db: EscrowDb;
  mailer: Mailer;
  log: Logger;
  keys: Record<number, Uint8Array>;
  now: () => Date;
}

export interface RotateResult {
  rewrapped: number;
  failed: number;
  emails: number;
  emailFailures: number;
  /** More wraps may be left on the old version (the row budget ran out). */
  remaining: boolean;
  /** Rotation emails still to send after this call. */
  notices_pending: number;
}

export const ROTATE_BATCH = 50;
export const ROTATE_BUDGET = 200;

export async function rotateBatch(deps: RotateDeps, from: number, to: number, reqId: string,
  opts: { batch?: number; budget?: number } = {}): Promise<RotateResult> {
  const oldKey = deps.keys[from];
  const newKey = deps.keys[to];
  if (!oldKey || !newKey || from === to) throw new Error('rotation keys');
  const batchSize = opts.batch ?? ROTATE_BATCH;
  const budget = opts.budget ?? ROTATE_BUDGET;
  const newPk = await publicKeyOf(newKey);
  const res: RotateResult = { rewrapped: 0, failed: 0, emails: 0, emailFailures: 0, remaining: false, notices_pending: 0 };
  let cursor: RotationCursor = null;
  let seen = 0;
  for (;;) {
    if (seen >= budget) {
      res.remaining = true;
      break;
    }
    const batch = await deps.db.rotationBatch(from, to, cursor, Math.min(batchSize, budget - seen));
    if (!batch.length) break;
    for (const row of batch) {
      seen++;
      cursor = { profile_id: row.profile_id, child_id: row.child_id, key_version: row.key_version };
      let bk: Uint8Array;
      try {
        const w = unpackV1(fromHex(row.escrow_wrap_hex));
        bk = await open(oldKey, w.enc, INFO.bookKey, aad.bookKey(row.profile_id, row.child_id, row.key_version, from), w.ct);
      } catch (e) {
        if (!(e instanceof HpkeError)) throw e;
        res.failed++;
        await deps.db.rotationFailed(row.profile_id, row.child_id, row.key_version, from, to, reqId);
        continue;
      }
      const wrap = packV1(await seal(newPk, INFO.bookKey, aad.bookKey(row.profile_id, row.child_id, row.key_version, to), bk));
      bk.fill(0);
      const r = await deps.db.rewrapKey(row.profile_id, row.child_id, row.key_version, from, to, wrap, reqId);
      if (r.updated) res.rewrapped++;
    }
  }

  // One email per account per rotation, retried until sent.
  const due = await deps.db.rotationNoticesDue(to, 50);
  let pending = due.length;
  for (const n of due) {
    let ok = false;
    try {
      await deps.mailer.send({ to: n.email, ...render('backup-key-rotated', { when: when(deps.now()) }), idempotencyKey: `escrow-key-rotated:${n.notice_id}` });
      ok = true;
      res.emails++;
    } catch {
      res.emailFailures++;
    }
    pending = (await deps.db.rotationNoticeSent(n.notice_id, ok)).pending;
  }
  res.notices_pending = pending;

  deps.log.info('rotation.batch', { step: 'rotate', counts: { rows: seen, opened: res.rewrapped, failed: res.failed, emails: res.emails } });
  if (res.failed || res.emailFailures) deps.log.warn('rotation.failed', { step: 'rotate', counts: { failed: res.failed, emails: res.emailFailures } });
  return res;
}
