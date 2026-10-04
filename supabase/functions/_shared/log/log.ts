/**
 * The only logger that Edge Functions and ops scripts may use (TDD 06 5.2 and
 * 5.3, LEGAL-REQ-014, DATA_CLASSIFICATION section 2, brief decision 17).
 *
 * A log line carries L2 data only: an event name, closed enums, an HTTP status,
 * a SQLSTATE, counts, durations and a random per-invocation `req_id`. There is
 * no free-text field, so letter text, transcripts, child names, emails, tokens,
 * object paths and person, book or letter ids have no way into a log stream:
 *  - every string field is a closed set (events, error codes, steps, buckets,
 *    providers, tasks, alert kinds) or a fixed shape (HTTP status, SQLSTATE);
 *    anything else is dropped and only counted in `dropped`;
 *  - there is no field for ids of any kind. Correlate by `req_id`, and look an
 *    account up only through an audited runbook (LEGAL-REQ-025);
 *  - exceptions are reduced to `{code, sqlstate, status}`. `message`,
 *    `details`, `hint` and stack frames never leave this module.
 *
 * Runtime neutral: no Deno or Node globals, so the same file runs in Edge
 * Functions (Deno), ops scripts (Node 22 type stripping) and tests.
 * The log canary (`canary.test.ts`) pushes the "Asha" fixtures through every
 * path, and fails if any function or ops script calls `console.*` directly.
 */

export type LogLevel = 'info' | 'warn' | 'error';
export type Outcome = 'ok' | 'client_error' | 'server_error' | 'refused' | 'retry' | 'skipped';

/** Every event name that may be logged. Add a name here in the same change that logs it. */
export const EVENTS = [
  'request.start', 'request.done', 'request.refused', 'request.failed',
  'worker.start', 'worker.paused', 'worker.budget', 'worker.done',
  'purge_due.batch', 'purge_due.failed',
  'buckets.listed', 'buckets.failed',
  'queue.fanout', 'queue.drained', 'queue.row_failed', 'queue.failed',
  'ownership.swept', 'ownership.failed',
  'account.step', 'account.step_retry', 'account.step_failed', 'account.held', 'account.residue',
  'account.finalized', 'account.failed',
  'emails.sent', 'emails.failed',
  'sla.report', 'sla.failed',
  'alert.sent', 'alert.skipped', 'alert.failed',
  'ledger.copied', 'ledger.failed',
  'retention.done', 'retention.failed',
  'forget.accepted', 'forget.refused', 'forget.failed',
  'script.start', 'script.done', 'script.failed',
] as const;
export type EventName = (typeof EVENTS)[number];

/** Error classes we set ourselves. Vendor messages are never logged. */
export const ERROR_CODES = [
  'error', 'timeout', 'network', 'bad_response', 'not_found', 'unauthorized', 'forbidden', 'rate_limited',
  'invalid_input', 'method', 'payload_too_large', 'config', 'paused', 'budget', 'held', 'residue', 'ownership',
  'no_token', 'no_user', 'no_address', 'already_invalid', 'invalid_client', 'invalid_grant', 'decrypt_failed',
  'quota', 'missed', 'unknown_step', 'not_executing', 'sqlstate', 'postgrest_error', 'storage_error',
  'auth_error', 'apple_error', 'posthog_error', 'resend_error', 'type_error', 'syntax_error', 'abort_error',
  'range_error',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number] | `http_${number}`;

/** Count keys that may appear in a log line. Values must be non-negative integers. */
export const COUNT_KEYS = [
  'rows', 'objects', 'requests', 'steps', 'retries', 'ids', 'batches', 'calls', 'books', 'letters',
  'notices', 'alerts', 'failed', 'skipped', 'held', 'more', 'buckets', 'emails', 'files', 'residue',
  'profiles', 'rehomed', 'conditions',
] as const;
export type CountKey = (typeof COUNT_KEYS)[number];

/** Deletion steps (deletion_request_steps.step) plus the worker's own phases. */
export const STEP_NAMES = [
  'prepare', 'storage_objects', 'apple_token_revoke', 'revenuecat', 'posthog', 'email_provider',
  'contributor_export_notice', 'receipt_email', 'auth_user', 'powersync_verify', 'verify', 'finalize',
  'request_email', 'cancel_email',
] as const;
export type StepName = (typeof STEP_NAMES)[number];

/** Bucket names that may be logged (L2). Kept equal to the worker's registry by a test. */
export const LOGGABLE_BUCKETS = ['entry-photos', 'entry-audio', 'inbox', 'child-photos', 'avatars', 'exports', 'ops-ledger'] as const;
export type LoggableBucket = (typeof LOGGABLE_BUCKETS)[number];

export const PROVIDERS = ['apple', 'posthog', 'resend', 'storage', 'auth', 'postgrest'] as const;
export type Provider = (typeof PROVIDERS)[number];

export const TASKS = ['run', 'purge', 'queue', 'accounts', 'emails', 'sla', 'ledger', 'retention', 'forget', 'script'] as const;
export type Task = (typeof TASKS)[number];

/** Conditions the worker can alert on (docs/ops/runbooks). */
export const ALERT_KINDS = [
  'tombstones_overdue', 'request_stuck', 'step_failed', 'step_retrying', 'queue_stuck', 'purge_silent',
  'purge_failing', 'residue', 'apple_no_token', 'apple_config', 'holds_review', 'scheduled_overdue',
] as const;
export type AlertKind = (typeof ALERT_KINDS)[number];

export const REASONS = ['account_deletion', 'device_after_deletion'] as const;
export type Reason = (typeof REASONS)[number];

/** Every function or script that logs. `config` and `content` are the platform owner's document functions. */
export const FUNCTIONS = ['purge-worker', 'analytics-forget', 'ops-script', 'config', 'content'] as const;
export type FunctionName = (typeof FUNCTIONS)[number];

export interface LogFields {
  outcome?: Outcome;
  status?: number;
  sqlstate?: string;
  code?: ErrorCode;
  duration_ms?: number;
  counts?: Partial<Record<CountKey, number>>;
  step?: StepName;
  /** Storage bucket name (L2). Never an object path. */
  bucket?: LoggableBucket;
  provider?: Provider;
  task?: Task;
  alert?: AlertKind;
  reason?: Reason;
  cold_start?: boolean;
}

export interface LogLine extends LogFields {
  ts: string;
  level: LogLevel;
  fn: FunctionName | 'unknown';
  version: string;
  req_id: string;
  event: EventName | 'invalid_event';
  dropped?: number;
}

export type LogSink = (line: string) => void;

const SQLSTATE_RE = /^[0-9A-Z]{5}$/;
const HTTP_CODE_RE = /^http_[1-5][0-9]{2}$/;
const OUTCOMES: readonly Outcome[] = ['ok', 'client_error', 'server_error', 'refused', 'retry', 'skipped'];

const has = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === 'string' && (list as readonly string[]).includes(v);
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 1e9;

export function isErrorCode(v: unknown): v is ErrorCode {
  return has(ERROR_CODES, v) || (typeof v === 'string' && HTTP_CODE_RE.test(v));
}

/** Validates one set of fields; returns the clean copy and how many fields were dropped. */
export function sanitize(fields: unknown): { clean: LogFields; dropped: number } {
  const clean: LogFields = {};
  let dropped = 0;
  if (fields === undefined || fields === null) return { clean, dropped };
  if (typeof fields !== 'object' || Array.isArray(fields)) return { clean, dropped: 1 };
  for (const [k, v] of Object.entries(fields as Record<string, unknown>)) {
    switch (k) {
      case 'outcome':
        if (has(OUTCOMES, v)) clean.outcome = v; else dropped++;
        break;
      case 'status':
        if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 599) clean.status = v; else dropped++;
        break;
      case 'sqlstate':
        if (typeof v === 'string' && SQLSTATE_RE.test(v)) clean.sqlstate = v; else dropped++;
        break;
      case 'code':
        if (isErrorCode(v)) clean.code = v; else dropped++;
        break;
      case 'duration_ms':
        if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 3.6e6) clean.duration_ms = Math.round(v); else dropped++;
        break;
      case 'counts': {
        if (!v || typeof v !== 'object' || Array.isArray(v)) { dropped++; break; }
        const counts: Partial<Record<CountKey, number>> = {};
        for (const [ck, cv] of Object.entries(v as Record<string, unknown>)) {
          if (has(COUNT_KEYS, ck) && isCount(cv)) counts[ck] = cv; else dropped++;
        }
        if (Object.keys(counts).length) clean.counts = counts;
        break;
      }
      case 'step':
        if (has(STEP_NAMES, v)) clean.step = v; else dropped++;
        break;
      case 'bucket':
        if (has(LOGGABLE_BUCKETS, v)) clean.bucket = v; else dropped++;
        break;
      case 'provider':
        if (has(PROVIDERS, v)) clean.provider = v; else dropped++;
        break;
      case 'task':
        if (has(TASKS, v)) clean.task = v; else dropped++;
        break;
      case 'alert':
        if (has(ALERT_KINDS, v)) clean.alert = v; else dropped++;
        break;
      case 'reason':
        if (has(REASONS, v)) clean.reason = v; else dropped++;
        break;
      case 'cold_start':
        if (typeof v === 'boolean') clean.cold_start = v; else dropped++;
        break;
      default:
        dropped++;
    }
  }
  return { clean, dropped };
}

const NAME_CODES: Record<string, ErrorCode> = {
  TypeError: 'type_error',
  SyntaxError: 'syntax_error',
  RangeError: 'range_error',
  AbortError: 'abort_error',
  TimeoutError: 'timeout',
};

/** The class, SQLSTATE and HTTP status of an error, and nothing else. */
export function errorFields(err: unknown): { code: ErrorCode; sqlstate?: string; status?: number } {
  const e = (err ?? {}) as { name?: unknown; sqlstate?: unknown; code?: unknown; status?: unknown };
  const out: { code: ErrorCode; sqlstate?: string; status?: number } = { code: 'error' };
  if (typeof e.name === 'string' && NAME_CODES[e.name]) out.code = NAME_CODES[e.name];
  if (isErrorCode(e.code)) out.code = e.code;
  if (typeof e.sqlstate === 'string' && SQLSTATE_RE.test(e.sqlstate)) out.sqlstate = e.sqlstate;
  if (typeof e.status === 'number' && Number.isInteger(e.status) && e.status >= 0 && e.status <= 599) out.status = e.status;
  return out;
}

export interface Logger {
  readonly reqId: string;
  info(event: EventName, fields?: LogFields): void;
  warn(event: EventName, fields?: LogFields): void;
  error(event: EventName, fields?: LogFields): void;
  /** Logs an exception as its class, SQLSTATE and HTTP status only. */
  exception(event: EventName, err: unknown, fields?: LogFields): void;
}

export interface LoggerOptions {
  fn: FunctionName;
  version?: string;
  sink?: LogSink;
  now?: () => Date;
  reqId?: string;
}

/** Random, never derived from a user or a request (TDD 06 5.3). 12 hex characters. */
export function newReqId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export const REQ_ID_RE = /^[0-9a-f]{12}$/;

// The single console call in all function and ops-script code. Everything else goes through createLogger.
const defaultSink: LogSink = (line) => console.log(line);

export function createLogger(opts: LoggerOptions): Logger {
  const fn = has(FUNCTIONS, opts.fn) ? opts.fn : 'unknown';
  const version = typeof opts.version === 'string' && /^[0-9][0-9A-Za-z.]{0,15}$/.test(opts.version) ? opts.version : '0';
  const reqId = typeof opts.reqId === 'string' && REQ_ID_RE.test(opts.reqId) ? opts.reqId : newReqId();
  const sink = opts.sink ?? defaultSink;
  const now = opts.now ?? (() => new Date());

  const emit = (level: LogLevel, event: unknown, fields?: unknown) => {
    const { clean, dropped } = sanitize(fields);
    const line: LogLine = {
      ts: now().toISOString(),
      level,
      fn,
      version,
      req_id: reqId,
      event: has(EVENTS, event) ? event : 'invalid_event',
      ...clean,
    };
    if (dropped) line.dropped = dropped;
    try {
      sink(JSON.stringify(line));
    } catch {
      // A logging failure never breaks the caller.
    }
  };

  return {
    reqId,
    info: (event, fields) => emit('info', event, fields),
    warn: (event, fields) => emit('warn', event, fields),
    error: (event, fields) => emit('error', event, fields),
    exception: (event, err, fields) => emit('error', event, { ...(fields ?? {}), ...errorFields(err) }),
  };
}

/** A logger that keeps raw lines in memory (tests and dry runs). */
export function memoryLogger(fn: FunctionName = 'purge-worker'): Logger & { lines: LogLine[]; raw: string[] } {
  const lines: LogLine[] = [];
  const raw: string[] = [];
  const logger = createLogger({
    fn,
    version: '0',
    sink: (l) => {
      raw.push(l);
      lines.push(JSON.parse(l) as LogLine);
    },
  });
  return Object.assign(logger, { lines, raw });
}
