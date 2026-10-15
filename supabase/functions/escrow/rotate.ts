/**
 * Escrow key rotation (F08 6.5 G4, F08-REQ-030). Runs only while ESCROW_TASK_SECRET and
 * ESCROW_ROTATE_FROM / _TO are set (runbook R1 to R6), through POST /escrow/v1/rotate.
 *
 * Each call takes one small batch: for every wrap still on the old version it opens the book key
 * in memory, seals it to the new escrow public key, and stores it with escrow_rewrap_key, which
 * is a compare-and-set that writes the `rotation` log row in the same transaction (each commit is
 * one row, far under 1 s, so the sync watermark is never held back). The first key moved for an
 * account sends that account its one rotation email. Call again until `remaining` is 0.
 */
import { fromHex } from './bytes.ts';
import type { EscrowDb } from './db.ts';
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
  remaining: boolean;
}

export async function rotateBatch(deps: RotateDeps, from: number, to: number, limit: number, reqId: string): Promise<RotateResult> {
  const oldKey = deps.keys[from];
  const newKey = deps.keys[to];
  if (!oldKey || !newKey || from === to) throw new Error('rotation keys');
  const newPk = await publicKeyOf(newKey);
  const batch = await deps.db.rotationBatch(from, limit);
  const res: RotateResult = { rewrapped: 0, failed: 0, emails: 0, emailFailures: 0, remaining: batch.length >= limit };
  for (const row of batch) {
    let bk: Uint8Array;
    try {
      const w = unpackV1(fromHex(row.escrow_wrap_hex));
      bk = await open(oldKey, w.enc, INFO.bookKey, aad.bookKey(row.profile_id, row.child_id, row.key_version, from), w.ct);
    } catch (e) {
      if (!(e instanceof HpkeError)) throw e;
      res.failed++;
      continue;
    }
    const wrap = packV1(await seal(newPk, INFO.bookKey, aad.bookKey(row.profile_id, row.child_id, row.key_version, to), bk));
    bk.fill(0);
    const r = await deps.db.rewrapKey(row.profile_id, row.child_id, row.key_version, from, to, wrap, reqId);
    if (!r.updated) continue;
    res.rewrapped++;
    if (r.first_for_account && r.email) {
      try {
        await deps.mailer.send({ to: r.email, ...render('backup-key-rotated', { when: when(deps.now()) }), idempotencyKey: `escrow-rotated:${row.profile_id}:${to}` });
        res.emails++;
      } catch {
        res.emailFailures++;
      }
    }
  }
  deps.log.info('rotation.batch', { step: 'rotate', counts: { rows: batch.length, opened: res.rewrapped, failed: res.failed, emails: res.emails } });
  if (res.failed || res.emailFailures) deps.log.warn('rotation.failed', { step: 'rotate', counts: { failed: res.failed, emails: res.emailFailures } });
  return res;
}
