/**
 * The escrow function's HTTP surface (ADR 0017: one envelope, request ids, content-free logs,
 * the edge_light class: p95 600 ms with cold start). Deployed ONLY to the separate project
 * `scribe-escrow`, never to the main project (F08 6.5 G2; runbook B3 to B6).
 *
 *   POST /escrow/v1/restore-requests               open or return a restore request (restore.ts createRequest)
 *   POST /escrow/v1/restore-requests/<id>/release  poll; the sealed keys once released (restore.ts release)
 *   POST /escrow/v1/rotate                         one rotation batch, only while a rotation is configured (rotate.ts)
 * Routes, bodies and answers follow S07's recovery-key contract v1 (contract.ts).
 *
 * Off when ESCROW_SWITCH is neither "on" nor "rotation" (this project's switch; "rotation" serves
 * only /rotate, so restores stay paused during a rotation), when app.escrow_enabled is not on in
 * the main database (SCBKO), or when the app's build flag or remote kill switch keeps the app from
 * calling at all (F08 6.5 C9).
 *
 * Request ids: unlike ADR 0017 point 6, this function never takes the caller's x-request-id. It
 * makes its own for every call and returns it in the header and the envelope, so nothing a client
 * chooses reaches the access log, the request rows or the logs; support correlates by the id the
 * app received.
 *
 * Private keys (review B S1, S2 on PR #151): opening a request needs none, so they are decoded only
 * for a release, after the token is verified, or a rotation, after the task secret is checked
 * (config.ts readKeys). Each must derive its pinned public key (public-keys.ts) or nothing opens,
 * and every decoded byte is zeroed when the call ends.
 */
import { sameString, UUID } from './bytes.ts';
import { type EscrowConfig, readConfig, readKeys, switchMode, type EnvGetter } from './config.ts';
import { ESCROW_ERROR_DETAILS, type Envelope, type EscrowErrorCode, type EscrowErrorDetail } from './contract.ts';
import { escrowDb, type EscrowDb } from './db.ts';
import { type FetchFn, JwksCache, JwtError, verifyAccessToken } from './jwt.ts';
import { type Code, type Logger, makeLogger, randomReqId } from './log.ts';
import { type Mailer, resendMailer } from './mail.ts';
import { type Connector, connect, denoConnector, PgError } from './pg.ts';
import { createRequest, Refusal, release } from './restore.ts';
import { rotateBatch } from './rotate.ts';

export interface HandlerDeps {
  fetch?: FetchFn;
  connector?: Connector;
  /** Tests: a database without the wire protocol. */
  openDb?: (cfg: EscrowConfig) => Promise<EscrowDb>;
  mailer?: (cfg: EscrowConfig) => Mailer;
  logSink?: (line: string) => void;
  now?: () => Date;
  random?: (n: number) => Uint8Array;
  /** Tests: the public keys pinned per version (default public-keys.ts). */
  pinnedPublicKeys?: Readonly<Record<number, string>>;
  /** Tests: sees the decoded private keys, so a test can check they are zeroed when the call ends. */
  observeKeys?: (keys: Record<number, Uint8Array>) => void;
}

/** The private keys were refused (not set, malformed, or not matching their pinned public key). */
class KeysRefused extends Error {}

const MAX_BODY = 1024;

export function makeHandler(env: EnvGetter, deps: HandlerDeps = {}) {
  const fetchFn: FetchFn = deps.fetch ?? ((u, i) => fetch(u, i));
  const now = deps.now ?? (() => new Date());
  // deno-lint-ignore no-console
  const sink = deps.logSink ?? ((l: string) => console.log(l));
  let jwks: JwksCache | null = null;

  return async (req: Request): Promise<Response> => {
    const started = now().getTime();
    const reqId = randomReqId();
    const log = makeLogger(sink, env('ESCROW_VERSION') ?? '1', reqId);
    const reply = <T>(status: number, body: Envelope<T>) => {
      log.info(status < 400 ? 'request.done' : status >= 500 ? 'request.failed' : 'request.refused', {
        status, duration_ms: now().getTime() - started, ...(body.ok ? {} : { code: body.error.code as Code }),
      });
      return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'x-request-id': reqId, 'cache-control': 'no-store' } });
    };
    const fail = (status: number, code: EscrowErrorCode, retryable = false, sqlstate?: string, detail?: string) =>
      reply(status, {
        ok: false,
        error: { code, retryable, ...(sqlstate ? { sqlstate } : {}), ...(isDetail(detail) ? { detail } : {}) },
        requestId: reqId,
      });

    log.info('request.start');
    if (req.method !== 'POST') return fail(405, 'bad_request');
    const mode = switchMode(env);
    if (mode === 'off') return fail(503, 'paused', true, undefined, 'escrow');
    const path = new URL(req.url).pathname.replace(/\/+$/, '');
    const releaseMatch = /\/escrow\/v1\/restore-requests\/([0-9a-f-]{36})\/release$/.exec(path);
    const route = path.endsWith('/escrow/v1/restore-requests') ? 'create'
      : releaseMatch && UUID.test(releaseMatch[1]) ? 'release'
      : path.endsWith('/escrow/v1/rotate') ? 'rotate' : null;
    if (!route) return fail(404, 'not_found');
    if (mode === 'rotation' && route !== 'rotate') return fail(503, 'paused', true, undefined, 'escrow');

    const raw = await req.text().catch(() => '');
    if (raw.length > MAX_BODY) return fail(413, 'payload_too_large');
    let body: Record<string, unknown> = {};
    try {
      body = raw ? JSON.parse(raw) : {};
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('shape');
    } catch {
      return fail(400, 'bad_request');
    }
    const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');

    // No private key is decoded here: loadKeys runs only for a release or a rotation, after the
    // caller is checked, and `finally` zeroes whatever it decoded, whatever the outcome.
    const pinned = deps.pinnedPublicKeys;
    const { config } = readConfig(env, pinned);
    if (!config) return fail(503, 'unavailable', true);
    let db: EscrowDb | null = null;
    let keys: Record<number, Uint8Array> | null = null;
    const loadKeys = async (): Promise<Record<number, Uint8Array>> => {
      const r = await readKeys(env, config.keyVersions, pinned);
      if (!r.keys) throw new KeysRefused();
      keys = r.keys;
      deps.observeKeys?.(r.keys);
      return r.keys;
    };
    const mailer = deps.mailer ? deps.mailer(config) : resendMailer(fetchFn, config.resendApiKey, config.mailFrom, config.replyTo);
    try {
      if (route === 'rotate') {
        if (!config.rotation) return fail(404, 'not_found'); // no rotate route unless a rotation is configured
        if (!sameString(bearer, config.rotation.secret)) return fail(401, 'unauthorized');
        const k = await loadKeys();
        db = await openDatabase(config, deps);
        const r = await rotateBatch({ db, mailer, log, keys: k, now, pinned }, config.rotation.from, config.rotation.to, reqId);
        return reply(200, { ok: true, data: r, requestId: reqId });
      }

      const deviceId = typeof body.device_id === 'string' ? body.device_id.toLowerCase() : '';
      if (!UUID.test(deviceId) || Object.keys(body).length !== 1) return fail(400, 'bad_request');
      jwks ??= new JwksCache(config.mainUrl, fetchFn, () => now().getTime());
      const user = await verifyAccessToken(bearer, { mainUrl: config.mainUrl, jwks, nowSec: Math.floor(now().getTime() / 1000) });
      const k = route === 'release' ? await loadKeys() : {};
      db = await openDatabase(config, deps);
      const rd = { db, mailer, log, keys: k, stopUrl: config.stopUrl, now, random: deps.random };
      const data = route === 'create'
        ? await createRequest(rd, user, deviceId, reqId)
        : await release(rd, user, deviceId, releaseMatch![1], reqId);
      return reply(200, { ok: true, data, requestId: reqId });
    } catch (e) {
      if (e instanceof KeysRefused) {
        // A key that does not match its pinned public key (a slip typing it from paper) or is not
        // set: nothing opens until the founder fixes the setting (runbook K6, section 6).
        await alert(config, mailer, log, 'keys');
        return fail(503, 'unavailable', true);
      }
      if (e instanceof JwtError) return e.code === 'unavailable' ? fail(503, 'unavailable', true) : fail(401, 'unauthorized');
      if (e instanceof Refusal) {
        const code: EscrowErrorCode = e.code === 'reauth_required' ? 'reauth_required' : e.code === 'session' ? 'unauthorized'
          : e.code === 'not_found' ? 'not_found'
          : e.code === 'deleted' ? 'deleted' : e.code === 'gone' ? 'gone' : e.code === 'email' ? 'unavailable'
          : e.code === 'no_address' ? 'bad_request' : 'internal';
        if (e.status >= 500 && e.code !== 'email') await alert(config, mailer, log, e.code);
        return fail(e.status, code, e.retryable, undefined, e.detail);
      }
      if (e instanceof PgError) {
        const s = e.code;
        if (s === 'SCRAT') {
          await alert(config, mailer, log, e.detail === 'limit_keys' ? 'limit_keys' : 'limit_restores'); // F08 6.5 C8: over a limit pages the founder
          return fail(429, 'rate_limited', false, s, e.detail);
        }
        if (s === 'SCBKO') return fail(503, 'paused', true, s, 'escrow');
        if (s === '28000' && e.detail === 'session_ended') return fail(401, 'unauthorized', false, s, 'session_ended');
        if (s === 'SCDEL') return fail(409, 'deleted', false, s, e.detail);
        if (s === 'P0002') return fail(404, 'not_found', false, s, e.detail);
        if (s === '22023' || s === 'SCIMM') return fail(400, 'bad_request', false, s);
        log.error('request.failed', { code: 'db', sqlstate: /^[0-9A-Z]{5}$/.test(s) ? s : undefined });
        return fail(503, 'unavailable', true);
      }
      log.error('request.failed', { code: 'error' });
      return fail(500, 'internal', true);
    } finally {
      if (db) await db.close().catch(() => {});
      if (keys) for (const k of Object.values(keys as Record<number, Uint8Array>)) k.fill(0);
    }
  };
}

const isDetail = (d: unknown): d is EscrowErrorDetail => typeof d === 'string' && (ESCROW_ERROR_DETAILS as readonly string[]).includes(d);

async function openDatabase(config: EscrowConfig, deps: HandlerDeps): Promise<EscrowDb> {
  if (deps.openDb) return deps.openDb(config);
  return escrowDb(await connect(config.dbUrl, { connector: deps.connector ?? denoConnector, caCerts: config.dbCaCerts }));
}

/** One content-free email to the founder (no ids, no addresses, no counts beyond the kind). */
async function alert(config: EscrowConfig, mailer: Mailer, log: Logger, kind: string): Promise<void> {
  try {
    await mailer.send({
      to: config.alertTo,
      subject: `Escrow alert: ${kind}`,
      text: `The escrow function refused or failed a call: ${kind}. See docs/ops/BACKUP_RUNBOOK.md, "What an access-log alert means". Request ${log.reqId}.`,
      html: `<p>The escrow function refused or failed a call: ${kind}. See docs/ops/BACKUP_RUNBOOK.md, "What an access-log alert means". Request ${log.reqId}.</p>`,
      idempotencyKey: `escrow-alert:${kind}:${new Date().toISOString().slice(0, 13)}`,
    });
    log.info('alert.sent', { code: kind === 'limit_keys' || kind === 'limit_restores' ? 'rate_limited' : 'error' });
  } catch {
    log.warn('alert.failed');
  }
}
