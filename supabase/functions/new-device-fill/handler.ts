/**
 * POST { class: 'apple' | 'other', device_id: string } with the signed-in person's access token.
 * The gateway verifies the JWT (verify_jwt ON). Profile and session come ONLY from its claims: `sub` and `session_id`. Any id in
 * the body is ignored. Hosted Auth claim names are [U] until checked against a real token (see the PR).
 * The answer is a bare `{ status: 'ok' }` whether a pending row was filled or not, so the call reveals nothing about the account.
 * Logs: counts and enums only. No session, profile, hash, device id, address or token ever reaches a log or a response.
 */
import { failure, HEADER_REQUEST_ID, success, type ApiErrorCode, httpStatusFor } from '../../../packages/api/src/envelope.ts';
import { byteaOf, hashDevice } from '../_shared/device/hash.ts';
import { createLogger, type LogSink } from '../_shared/log/log.ts';
import { type FetchFn } from '../purge-worker/lib/http.ts';
import { createServiceClient, type ServiceClient } from '../purge-worker/lib/service.ts';

export const MAX_BODY_BYTES = 2048;
export const DEVICE_ID_MIN = 8;
export const DEVICE_ID_MAX = 128;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEVICE_ID = /^[\x21-\x7e]+$/; // printable ASCII, no spaces or control characters

export interface HandlerOptions { fetch?: FetchFn; client?: ServiceClient; logSink?: LogSink }

/** The payload of a bearer JWT. Not a signature check: the platform's gateway did that (verify_jwt ON). */
export function claimsOf(header: string | null): Record<string, unknown> | null {
  const token = (header ?? '').startsWith('Bearer ') ? (header as string).slice(7) : '';
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const v = JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)));
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function makeHandler(env: (n: string) => string | undefined, opts: HandlerOptions = {}): (req: Request) => Promise<Response> {
  return async (req) => {
    const v = (n: string) => (env(n) ?? '').trim();
    const log = createLogger({ fn: 'new-device-fill', version: '1', sink: opts.logSink });
    const reply = (status: number, body: unknown) =>
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', [HEADER_REQUEST_ID]: log.reqId } });
    const fail = (code: ApiErrorCode, retryable: boolean, status = httpStatusFor(code)) => reply(status, failure({ code, retryable }, log.reqId));
    const ok = () => reply(200, success({ status: 'ok' }, log.reqId));

    if (req.method !== 'POST') return fail('bad_request', false, 405);

    // Who: the verified token only. A missing or malformed sub or session_id is a refusal, never a guess.
    const claims = claimsOf(req.headers.get('authorization'));
    const profile = typeof claims?.sub === 'string' && UUID.test(claims.sub) ? claims.sub.toLowerCase() : null;
    const session = typeof claims?.session_id === 'string' && UUID.test(claims.session_id) ? claims.session_id.toLowerCase() : null;
    if (!profile || !session) {
      log.warn('request.refused', { code: 'unauthorized', status: 401 });
      return fail('unauthorized', false);
    }

    if (v('NEW_DEVICE_EMAIL') !== 'on') {
      log.info('fill.dark', { outcome: 'skipped' });
      return ok();
    }
    // While a NEXT key is set the app-supplied hash is written under it, so the sender needs no rekey for it. Both must be 32+.
    const next = v('DEVICE_HASH_KEY_NEXT');
    const current = v('DEVICE_HASH_KEY');
    const key = next ? next : current;
    if (!v('SUPABASE_URL') || !v('SUPABASE_SERVICE_ROLE_KEY') || current.length < 32 || (next !== '' && next.length < 32)) {
      log.error('request.failed', { code: 'config', counts: { failed: 1 } });
      return fail('unavailable', true);
    }

    // What: only the class word and the raw device id, checked here because the database errors only when a row exists.
    let cls: unknown;
    let deviceId: unknown;
    try {
      // Content-Length first, so a declared oversize body is never read; then the real bytes (not characters) of what was read.
      const declared = Number(req.headers.get('content-length'));
      if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) throw new Error('size');
      const text = await req.text();
      if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) throw new Error('size');
      const body = JSON.parse(text);
      cls = body?.class;
      deviceId = body?.device_id;
    } catch {
      /* falls through to the invalid answer below */
    }
    if ((cls !== 'apple' && cls !== 'other') || typeof deviceId !== 'string'
      || deviceId.length < DEVICE_ID_MIN || deviceId.length > DEVICE_ID_MAX || !DEVICE_ID.test(deviceId)) {
      log.warn('request.refused', { code: 'invalid_input', status: 400 });
      return fail('bad_request', false, 400);
    }

    try {
      const hash = await hashDevice(key, profile, deviceId);
      const client = opts.client ?? createServiceClient({ url: v('SUPABASE_URL'), serviceKey: v('SUPABASE_SERVICE_ROLE_KEY'), fetch: opts.fetch });
      const filled = await client.rpc<boolean>('ops_new_device_pending_fill', {
        p_profile: profile, p_session: session, p_class: cls, p_device_hash: byteaOf(hash),
      });
      log.info('fill.done', { outcome: 'ok', counts: { rows: filled === true ? 1 : 0 } });
      return ok(); // the same body for a filled row and for none
    } catch (e) {
      log.exception('request.failed', e, { outcome: 'server_error' });
      return fail('unavailable', true);
    }
  };
}
