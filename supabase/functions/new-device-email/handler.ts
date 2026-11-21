/**
 * POST, `Authorization: Bearer <NEW_DEVICE_SENDER_SECRET>` (cron). Dark (takes nothing) unless NEW_DEVICE_EMAIL is "on".
 * One pending row at a time: hash the device -> ops_new_device_record -> for "new": mint the token (SHA-256 only to the
 * database) -> send. (a) record marks the device known, so every failure after the pickup is COUNTED in ops.security_events
 * (not only logged). (c) a null or failed mint still sends, without the link. (e) logs: closed enums and counts only.
 */
import { failure, HEADER_REQUEST_ID, success, type ApiErrorCode, httpStatusFor } from '../../../packages/api/src/envelope.ts';
import { brand } from '@scribe/brand';
import { createLogger, type LogSink } from '../_shared/log/log.ts';
import { safeEqual, ServiceError, type FetchFn } from '../purge-worker/lib/http.ts';
import { sendEmail } from '../purge-worker/lib/resend.ts';
import { createServiceClient, type ServiceClient } from '../purge-worker/lib/service.ts';
import { byteaOf, hashDeviceAll, MIN_KEY_CHARS, newToken, toHex } from './device.ts';
import { composeEmail, notYouUrl } from './mail.ts';

export const MAX_PER_RUN = 25;
const HEX32 = /^[0-9a-f]{32}$/;
export const STAGE = { take: 1, hash: 2, user: 3, record: 4, mint: 5, send: 6 } as const;
type Pending = { session_id: string; profile_id: string; class: string; device_hash: string };
type Verdict = 'first' | 'new' | 'known';
export interface RunCounts { taken: number; sent: number; skipped: number; failed: number; uncounted: number }

export interface HandlerOptions { fetch?: FetchFn; client?: ServiceClient; logSink?: LogSink; now?: () => Date }

export function makeHandler(env: (n: string) => string | undefined, opts: HandlerOptions = {}): (req: Request) => Promise<Response> {
  return async (req) => {
    const v = (n: string) => (env(n) ?? '').trim();
    const now = opts.now ?? (() => new Date());
    const log = createLogger({ fn: 'new-device-email', version: '1', sink: opts.logSink, now });
    const reply = (status: number, body: unknown) =>
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', [HEADER_REQUEST_ID]: log.reqId } });
    const fail = (code: ApiErrorCode, retryable: boolean, status = httpStatusFor(code)) => reply(status, failure({ code, retryable }, log.reqId));

    if (req.method !== 'POST') return fail('bad_request', false, 405);
    // (c) The bearer check comes first: a caller without the secret always gets 401, never a config answer (no oracle).
    const secret = v('NEW_DEVICE_SENDER_SECRET');
    const auth = req.headers.get('authorization') ?? '';
    if (secret.length < 32 || !safeEqual(auth.startsWith('Bearer ') ? auth.slice(7) : '', secret)) {
      log.warn('request.refused', { code: 'unauthorized', status: 401 });
      return fail('unauthorized', false);
    }
    // (a) The config gate answers BEFORE any row is taken: a short or missing key would fail every row after pickup deleted it.
    const keyNext = v('DEVICE_HASH_KEY_NEXT');
    const needed = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'DEVICE_HASH_KEY'].filter((n) => !v(n));
    const badKey = v('DEVICE_HASH_KEY').length < MIN_KEY_CHARS || (keyNext.length > 0 && keyNext.length < MIN_KEY_CHARS);
    if (needed.length || badKey) {
      log.error('request.failed', { code: 'config', counts: { failed: needed.length + (badKey ? 1 : 0) } });
      return fail('unavailable', true);
    }
    if (v('NEW_DEVICE_EMAIL') !== 'on') {
      log.info('device.dark', { outcome: 'skipped' });
      return reply(200, success({ status: 'dark' }, log.reqId));
    }

    const client = opts.client ?? createServiceClient({ url: v('SUPABASE_URL'), serviceKey: v('SUPABASE_SERVICE_ROLE_KEY'), fetch: opts.fetch });
    const fetchFn: FetchFn = opts.fetch ?? ((i, init) => fetch(i, init));
    const from = v('MAIL_FROM') || `${brand.name} <${brand.support.email}>`;
    const counts: RunCounts = { taken: 0, sent: 0, skipped: 0, failed: 0, uncounted: 0 };

    // The operator-visible counter (b). If even this write fails the run answers 503 so the cron's own history shows it.
    const countFailure = async (stage: number, err: unknown) => {
      counts.failed++;
      log.exception('device.failed', err, { outcome: 'server_error', counts: { failures: stage } });
      try {
        await client.rpc('ops_security_event_write', {
          p_kind: 'new_device_hook_failed', p_n: 1, p_subject_hash: null, p_request_id: log.reqId, p_detail: { sender: true, stage },
        });
      } catch (e) {
        counts.uncounted++;
        log.exception('device.failed', e, { outcome: 'server_error', counts: { failures: 0 } });
      }
    };

    for (let i = 0; i < MAX_PER_RUN; i++) {
      let row: Pending | undefined;
      try {
        row = (await client.rpc<Pending[]>('ops_new_device_pending_take', { p_session: null, p_limit: 1 }))?.[0];
      } catch (e) {
        await countFailure(STAGE.take, e);
        break;
      }
      if (!row) break;
      counts.taken++;
      let stage: number = STAGE.hash;
      try {
        let hash: string;
        let oldHash: string | null = null;
        if (HEX32.test(row.device_hash ?? '')) hash = row.device_hash;
        else {
          // No id from the app: each sign-in counts as its own device, so it is never "known" by accident (file 08 section 3).
          const all = await hashDeviceAll({ current: v('DEVICE_HASH_KEY'), next: keyNext || undefined }, row.profile_id, `session:${row.session_id}`);
          hash = toHex(all[all.length - 1]); // the new-key hash when a next key is set, else the current one
          if (all.length > 1) oldHash = toHex(all[0]);
        }
        stage = STAGE.user;
        const user = await client.auth.getUser(row.profile_id);
        if (!user?.email) throw new ServiceError('auth', 0, 'no_address');
        stage = STAGE.record;
        // NDR-2: with a next key, move an old-key row to the new hash BEFORE record. If both exist the old row rolls off; nothing is deleted.
        if (oldHash) await client.rpc<string>('ops_new_device_rekey', { p_profile: row.profile_id, p_old_hash: `\\x${oldHash}`, p_new_hash: `\\x${hash}` });
        const verdict = await client.rpc<Verdict>('ops_new_device_record', { p_profile: row.profile_id, p_device_hash: `\\x${hash}`, p_class: row.class === 'apple' ? 'apple' : 'other' });
        if (verdict !== 'new') {
          counts.skipped++;
          log.info('device.skipped', { outcome: 'skipped' });
          continue;
        }
        // From here the device is known: any failure must be counted, never only logged (a).
        let url: string | null = null;
        stage = STAGE.mint;
        try {
          const token = await newToken();
          const expires = await client.rpc<string | null>('ops_new_device_token_mint', {
            p_profile: row.profile_id, p_session: row.session_id, p_token_hash: byteaOf(token.hash), p_ttl: '48 hours',
          });
          url = expires ? notYouUrl(token.plain) : null; // null: the 21st token of a day. The email still goes (c).
          if (!url) log.warn('device.degraded', { outcome: 'skipped', code: 'rate_limited' });
        } catch (e) {
          await countFailure(STAGE.mint, e);
        }
        stage = STAGE.send;
        const mail = composeEmail({ deviceClass: row.class, at: now(), url });
        const out = { from, to: user.email, ...mail, idempotencyKey: `new-device:${log.reqId}:${i}`, replyTo: brand.support.email };
        try {
          await sendEmail(fetchFn, v('RESEND_API_KEY'), out);
        } catch (e) {
          if (!(e instanceof ServiceError) || !e.transient) throw e;
          await sendEmail(fetchFn, v('RESEND_API_KEY'), out); // one retry; the same idempotency key, so never two emails
        }
        counts.sent++;
        log.info('device.sent', { outcome: 'ok', provider: 'resend' });
      } catch (e) {
        await countFailure(stage, e);
      }
    }
    log.info('request.done', { status: counts.uncounted ? 503 : 200, counts: { rows: counts.taken, emails: counts.sent, skipped: counts.skipped, failed: counts.failed } });
    return counts.uncounted ? fail('unavailable', true) : reply(200, success(counts, log.reqId));
  };
}
