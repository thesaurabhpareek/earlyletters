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
 * Off when ESCROW_SWITCH is not "on" (this project's switch), when app.escrow_enabled is not on
 * in the main database (SCBKO), or when the app's build flag or remote kill switch keeps the app
 * from calling at all (F08 6.5 C9).
 */
import { sameString, UUID } from './bytes.ts';
import { type EscrowConfig, readConfig, switchOn, type EnvGetter } from './config.ts';
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
}

const MAX_BODY = 1024;

export function makeHandler(env: EnvGetter, deps: HandlerDeps = {}) {
  const fetchFn: FetchFn = deps.fetch ?? ((u, i) => fetch(u, i));
  const now = deps.now ?? (() => new Date());
  // deno-lint-ignore no-console
  const sink = deps.logSink ?? ((l: string) => console.log(l));
  let jwks: JwksCache | null = null;

  return async (req: Request): Promise<Response> => {
    const started = now().getTime();
    const given = req.headers.get('x-request-id') ?? '';
    const reqId = /^[0-9a-f]{12}$/.test(given) ? given : randomReqId();
    // What the access log and restore_requests store: always made here, never the caller's id,
    // so nobody can choose or collide the ids on their own log rows. Log lines carry both.
    const auditId = randomReqId();
    const log = makeLogger(sink, env('ESCROW_VERSION') ?? '1', reqId, auditId);
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
    if (!switchOn(env)) return fail(503, 'paused', true, undefined, 'escrow');
    const { config } = readConfig(env);
    if (!config) return fail(503, 'unavailable', true);
    const path = new URL(req.url).pathname.replace(/\/+$/, '');
    const releaseMatch = /\/escrow\/v1\/restore-requests\/([0-9a-f-]{36})\/release$/.exec(path);
    const route = path.endsWith('/escrow/v1/restore-requests') ? 'create'
      : releaseMatch && UUID.test(releaseMatch[1]) ? 'release'
      : path.endsWith('/escrow/v1/rotate') && config.rotation ? 'rotate' : null;
    if (!route) return fail(404, 'not_found');

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

    let db: EscrowDb | null = null;
    const mailer = deps.mailer ? deps.mailer(config) : resendMailer(fetchFn, config.resendApiKey, config.mailFrom, config.replyTo);
    try {
      if (route === 'rotate') {
        if (!config.rotation || !sameString(bearer, config.rotation.secret)) return fail(401, 'unauthorized');
        db = await openDatabase(config, deps);
        const r = await rotateBatch({ db, mailer, log, keys: config.keys, now }, config.rotation.from, config.rotation.to, 50, auditId);
        return reply(200, { ok: true, data: r, requestId: reqId });
      }

      const deviceId = typeof body.device_id === 'string' ? body.device_id.toLowerCase() : '';
      if (!UUID.test(deviceId) || Object.keys(body).length !== 1) return fail(400, 'bad_request');
      jwks ??= new JwksCache(config.mainUrl, fetchFn, () => now().getTime());
      const user = await verifyAccessToken(bearer, { mainUrl: config.mainUrl, jwks, nowSec: Math.floor(now().getTime() / 1000) });
      db = await openDatabase(config, deps);
      const rd = { db, mailer, log, keys: config.keys, stopUrl: config.stopUrl, now, random: deps.random };
      const data = route === 'create'
        ? await createRequest(rd, user, deviceId, auditId)
        : await release(rd, user, deviceId, releaseMatch![1], auditId);
      return reply(200, { ok: true, data, requestId: reqId });
    } catch (e) {
      if (e instanceof JwtError) return e.code === 'unavailable' ? fail(503, 'unavailable', true) : fail(401, 'unauthorized');
      if (e instanceof Refusal) {
        const code: EscrowErrorCode = e.code === 'reauth_required' ? 'reauth_required' : e.code === 'not_found' ? 'not_found'
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
        if (s === 'SCSES') return fail(401, 'unauthorized', false, s);
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
      // Best effort: this call's copies of the private keys do not outlive it.
      for (const k of Object.values(config.keys)) k.fill(0);
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
