/**
 * The restore flow (F08 6.5 C), as S07's recovery-key contract v1 routes it
 * (packages/api/src/server/recovery-key.ts, ESCROW_ROUTES createRequest and release):
 *
 *  createRequest  No open request: needs a sign-in in the last 10 minutes (step-up). Makes the
 *                 stop token and one approval code per enrolled device (sealed to that device's
 *                 key), opens the request (72 h hold with another enrolled device, 24 h without),
 *                 then emails the account ("A new iPhone asked") with the stop link. Release waits
 *                 until that email has gone. An open request is returned as it is (safe to repeat).
 *  release        Approved or past the hold: opens each book key in memory with the escrow
 *                 private key for its version, seals it to the requesting device, writes one log
 *                 row per key, emails the account ("We used your recovery key"), marks the request
 *                 released, and only then returns the sealed keys. If the email or the log write
 *                 fails, nothing is returned. Still holding: the hold time.
 *
 * Approving ("Yes, it's mine"), "Not me" and Stop in Settings are main-project RPCs
 * (backup_pending_requests, backup_approve_request, backup_cancel_request), because approving
 * must prove the enrolled device holds its key (the sealed code), which only the database checks.
 * Plaintext key bytes exist only inside one call's memory and are never logged or stored.
 */
import { encodeBase64, encodeBase64Url, fromHex, randomBytes, sha256, toHex } from './bytes.ts';
import type { SealedBox } from './contract.ts';
import { SEAL_SUITE } from './contract.ts';
import type { EscrowDb, RequestState, UnwrapRow } from './db.ts';
import { aad, HpkeError, INFO, open, packV1, seal, unpackV1 } from './hpke.ts';
import { recentSignIn, type VerifiedUser } from './jwt.ts';
import type { Logger } from './log.ts';
import { type Mailer, render, when } from './mail.ts';

export interface RestoreDeps {
  db: EscrowDb;
  mailer: Mailer;
  log: Logger;
  keys: Record<number, Uint8Array>;
  stopUrl: string;
  now: () => Date;
  /** Tests only. */
  random?: (n: number) => Uint8Array;
}

export interface RequestView {
  request_id: string;
  state: 'requested' | 'approved' | 'released';
  hold_until: string;
  is_this_device: true;
}

export type ReleaseResult =
  | { state: 'released'; request_id: string; keys: { child_id: string; key_version: number; sealed: SealedBox }[] }
  | { state: 'requested' | 'approved'; request_id: string; hold_until: string };

/** A refusal the handler turns into an envelope error with a closed detail. */
export class Refusal extends Error {
  readonly code: 'reauth_required' | 'not_found' | 'deleted' | 'gone' | 'no_address' | 'decrypt_failed' | 'unknown_key_version' | 'email';
  readonly status: number;
  readonly retryable: boolean;
  readonly detail?: string;
  constructor(code: Refusal['code'], status: number, opts: { retryable?: boolean; detail?: string } = {}) {
    super(code);
    this.code = code;
    this.status = status;
    this.retryable = opts.retryable ?? false;
    this.detail = opts.detail;
  }
}

const DEVICE = 'an iPhone';
const reference = (requestId: string) => `R-${requestId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
const box = (sealed: { enc: Uint8Array; ct: Uint8Array }): SealedBox => ({ suite: SEAL_SUITE, enc: encodeBase64(sealed.enc), ct: encodeBase64(sealed.ct) });

export async function createRequest(deps: RestoreDeps, user: VerifiedUser, deviceId: string, reqId: string): Promise<RequestView> {
  const { db, log } = deps;
  const rand = deps.random ?? randomBytes;
  if (!user.email) throw new Refusal('no_address', 409); // every use is emailed: no address, no restore
  const ctx = await db.context(user.sub, deviceId);
  if (ctx.deleting) throw new Refusal('deleted', 409, { detail: 'deletion_pending' });
  if (!ctx.has_keys) throw new Refusal('not_found', 404);
  const open = ctx.open_request;
  if (open && (open.notified || open.state === 'released')) {
    return { request_id: open.request_id, state: open.state as RequestView['state'], hold_until: open.hold_until, is_this_device: true };
  }
  // A new request, or one whose email never went out: both need a fresh sign-in.
  if (!recentSignIn(user, Math.floor(deps.now().getTime() / 1000))) throw new Refusal('reauth_required', 401, { detail: 'step_up_required' });
  const token = rand(32);
  const approvals = [];
  for (const d of ctx.enrolled) {
    const code = rand(32);
    const sealed = packV1(await seal(fromHex(d.public_key_hex), INFO.approval, aad.approval(user.sub, d.device_id), code));
    approvals.push({ device_id: d.device_id, code_hash_hex: toHex(await sha256(code)), sealed_code_hex: toHex(sealed) });
  }
  const opened = await db.openRequest(user.sub, deviceId, reqId, await sha256(token), approvals);
  if (opened.created) log.info('restore.requested', { step: 'open', counts: { devices: approvals.length } });
  if (!opened.notified && (opened.created || opened.token_replaced)) {
    const values = {
      when: when(deps.now()), device: DEVICE, holdUntil: when(new Date(opened.hold_until)),
      stopUrl: `${deps.stopUrl}#${encodeBase64Url(token)}`, requestId: reference(opened.request_id), expiresIn: '7 days',
    };
    await sendOrRefuse(deps, 'backup-restore-requested', user.email, values,
      `escrow-restore-requested:${opened.request_id}:${toHex(await sha256(token)).slice(0, 16)}`);
    await db.setState(user.sub, opened.request_id, 'notified');
  }
  return { request_id: opened.request_id, state: opened.state as RequestView['state'], hold_until: opened.hold_until, is_this_device: true };
}

export async function release(deps: RestoreDeps, user: VerifiedUser, deviceId: string, requestId: string, reqId: string): Promise<ReleaseResult> {
  const { db, log } = deps;
  if (!user.email) throw new Refusal('no_address', 409);
  const loaded = await db.loadWraps(user.sub, deviceId, requestId);
  if (loaded.state !== 'ready') {
    const s = loaded.state as RequestState;
    if (s === 'cancelled' || s === 'expired' || s === 'released') {
      log.info('restore.closed', { step: 'load' });
      throw new Refusal('gone', 410, { detail: s === 'cancelled' ? 'cancelled' : 'expired' });
    }
    log.info('restore.waiting', { step: 'load' });
    return { state: s as 'requested' | 'approved', request_id: requestId, hold_until: (loaded as { hold_until?: string }).hold_until ?? '' };
  }
  if (!('keys' in loaded)) throw new Refusal('not_found', 404);

  // Open each wrap in memory and seal it to the requesting device.
  const devicePk = fromHex(loaded.device_public_key_hex);
  const rows: UnwrapRow[] = [];
  const out: { child_id: string; key_version: number; sealed: SealedBox }[] = [];
  for (const k of loaded.keys) {
    const sk = deps.keys[k.escrow_key_version];
    let bk: Uint8Array | null = null;
    if (sk) {
      try {
        const w = unpackV1(fromHex(k.escrow_wrap_hex));
        bk = await open(sk, w.enc, INFO.bookKey, aad.bookKey(user.sub, k.child_id, k.key_version, k.escrow_key_version), w.ct);
        if (bk.length !== 32) bk = null;
      } catch (e) {
        if (!(e instanceof HpkeError)) throw e;
        bk = null;
      }
    }
    rows.push({ child_id: k.child_id, key_version: k.key_version, escrow_key_version: k.escrow_key_version, outcome: bk ? 'opened' : 'failed' });
    if (bk) {
      const sealed = await seal(devicePk, INFO.release, aad.release(user.sub, deviceId, requestId, k.child_id, k.key_version), bk);
      bk.fill(0);
      out.push({ child_id: k.child_id, key_version: k.key_version, sealed: box(sealed) });
    }
  }
  const opened = rows.filter((r) => r.outcome === 'opened').length;
  // Log first: no sealed key leaves before its row exists (F08-REQ-042).
  await db.recordUnwraps(user.sub, deviceId, requestId, rows, reqId);
  log.info('restore.released', { step: 'unwrap', counts: { keys: rows.length, opened, failed: rows.length - opened } });
  if (!opened) throw new Refusal(loaded.keys.some((k) => !deps.keys[k.escrow_key_version]) ? 'unknown_key_version' : 'decrypt_failed', 500);

  // Then the email, the record of use we cannot edit afterwards (F08 6.5 C7).
  await sendOrRefuse(deps, 'backup-key-used', user.email, { when: when(deps.now()), device: DEVICE, requestId: reference(requestId) },
    `escrow-restore-released:${requestId}`);
  await db.setState(user.sub, requestId, 'released');
  return { state: 'released', request_id: requestId, keys: out };
}

async function sendOrRefuse(deps: RestoreDeps, id: 'backup-restore-requested' | 'backup-key-used', to: string, values: Record<string, string>, idempotencyKey: string) {
  const m = render(id, values);
  try {
    await deps.mailer.send({ to, ...m, idempotencyKey });
    deps.log.info('email.sent', { step: 'email', counts: { emails: 1 } });
  } catch {
    deps.log.warn('email.failed', { step: 'email', code: 'email' });
    throw new Refusal('email', 503, { retryable: true });
  }
}

