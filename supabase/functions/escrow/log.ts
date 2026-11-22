/**
 * The escrow function's logger: the same rules as supabase/functions/_shared/log/log.ts
 * (LEGAL-REQ-014, ADR 0017 rule 5), kept inside this folder so that no code shared with the
 * main project runs next to the escrow key (docs/ops/BACKUP_RUNBOOK.md, "One function, one
 * folder"). A line carries a closed event name, closed codes, an HTTP status, a SQLSTATE,
 * counts, a duration and a random per-invocation req_id. There is no field for ids, emails,
 * tokens, keys, paths or free text, so none can reach a log stream.
 */

export const EVENTS = [
  'request.start', 'request.done', 'request.refused', 'request.failed',
  'restore.requested', 'restore.waiting', 'restore.released', 'restore.closed',
  'rotation.batch', 'rotation.failed',
  'email.sent', 'email.failed', 'alert.sent', 'alert.failed',
] as const;
export type EventName = (typeof EVENTS)[number];

export const CODES = [
  'error', 'config', 'paused', 'method', 'not_found', 'bad_request', 'payload_too_large', 'unauthorized',
  'reauth_required', 'forbidden', 'rate_limited', 'deleted', 'conflict', 'no_address', 'decrypt_failed',
  'unknown_key_version', 'db', 'email', 'timeout', 'unavailable', 'internal',
] as const;
export type Code = (typeof CODES)[number];

export const COUNT_KEYS = ['keys', 'opened', 'failed', 'devices', 'rows', 'emails'] as const;
export type CountKey = (typeof COUNT_KEYS)[number];

export const STEPS = ['context', 'open', 'notify', 'load', 'unwrap', 'record', 'email', 'release', 'rotate'] as const;
export type Step = (typeof STEPS)[number];

export interface Fields {
  status?: number;
  code?: Code;
  sqlstate?: string;
  step?: Step;
  duration_ms?: number;
  counts?: Partial<Record<CountKey, number>>;
}

const has = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === 'string' && (list as readonly string[]).includes(v);

export function clean(fields: Fields = {}): { out: Fields; dropped: number } {
  const out: Fields = {};
  let dropped = 0;
  for (const [k, v] of Object.entries(fields as Record<string, unknown>)) {
    if (k === 'status' && Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 599) out.status = v as number;
    else if (k === 'code' && has(CODES, v)) out.code = v;
    else if (k === 'sqlstate' && typeof v === 'string' && /^[0-9A-Z]{5}$/.test(v)) out.sqlstate = v;
    else if (k === 'step' && has(STEPS, v)) out.step = v;
    else if (k === 'duration_ms' && typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 3.6e6) out.duration_ms = Math.round(v);
    else if (k === 'counts' && v && typeof v === 'object' && !Array.isArray(v)) {
      const c: Partial<Record<CountKey, number>> = {};
      for (const [ck, cv] of Object.entries(v as Record<string, unknown>)) {
        if (has(COUNT_KEYS, ck) && Number.isInteger(cv) && (cv as number) >= 0 && (cv as number) <= 1e6) c[ck] = cv as number;
        else dropped++;
      }
      if (Object.keys(c).length) out.counts = c;
    } else dropped++;
  }
  return { out, dropped };
}

export interface Logger {
  info(event: EventName, fields?: Fields): void;
  warn(event: EventName, fields?: Fields): void;
  error(event: EventName, fields?: Fields): void;
  readonly reqId: string;
}

export const randomReqId = (): string => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, '0')).join('');

/** The version a line may carry: the same closed shape as supabase/functions/_shared/log/log.ts, else '0'. */
export const VERSION_SHAPE = /^[0-9][0-9A-Za-z.]{0,15}$/;

export function makeLogger(sink: (line: string) => void, rawVersion: string, reqId = randomReqId()): Logger {
  // ESCROW_VERSION is a setting, so it is checked here, before it can reach any line (review B N1).
  const version = typeof rawVersion === 'string' && VERSION_SHAPE.test(rawVersion) ? rawVersion : '0';
  const line = (level: 'info' | 'warn' | 'error', event: EventName, fields?: Fields) => {
    const { out, dropped } = clean(fields);
    const e = has(EVENTS, event) ? event : 'request.failed';
    sink(JSON.stringify({ ts: new Date().toISOString(), level, fn: 'escrow', version, req_id: reqId, event: e, ...out, ...(dropped ? { dropped } : {}) }));
  };
  return {
    reqId,
    info: (e, f) => line('info', e, f),
    warn: (e, f) => line('warn', e, f),
    error: (e, f) => line('error', e, f),
  };
}

export function memoryLogger(version = 'test', reqId?: string): Logger & { raw: string[] } {
  const raw: string[] = [];
  return Object.assign(makeLogger((l) => raw.push(l), version, reqId), { raw });
}
