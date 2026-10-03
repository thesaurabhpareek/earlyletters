/**
 * Every SQLSTATE the client may receive from our database, with what to do
 * about it. Custom codes (SCxxx) are raised by supabase/migrations; standard
 * codes are listed when a client path can produce them.
 *
 * test/drift.test.ts fails if a code raised in the migrations is missing here,
 * or if an entry marked `raisedBy: 'migration'` is no longer raised anywhere.
 *
 * Field meanings:
 *  - category / httpStatus: the HTTP-ish class, for logging and generic
 *    handling. PostgREST picks its own HTTP status for custom SQLSTATEs, so
 *    never branch on the HTTP status; branch on `code`.
 *  - retryable: the same request, unchanged, can succeed later (possibly
 *    after the client action in `clientAction`, such as refreshing the session
 *    or recording consent). false means retrying the same request is pointless.
 *  - sync: what an offline upload queue (PowerSync uploadData) does with the
 *    op: 'retry' with backoff, 'pause' the whole queue and keep the op, or
 *    'reject' the op permanently (move it to rejected writes).
 *  - copyKey: user-facing copy key only. The words live in packages/content.
 *  - clientFacing: false for codes only service-role jobs can hit.
 */

export type ErrorCategory =
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'gone'
  | 'invalid'
  | 'precondition'
  | 'rate_limited'
  | 'transient'
  | 'server';

export type SyncDisposition = 'retry' | 'pause' | 'reject';

export type ClientAction =
  | 'refresh_session'
  | 'show_consent_sheet'
  | 'show_policy_sheet'
  | 'offer_cancel_account_deletion'
  | 'drop_local_row'
  | 'show_message'
  | 'retry_later'
  | 'report_bug'
  | 'alert_ops'
  | 'none';

export interface ApiErrorSpec {
  readonly code: string;
  readonly meaning: string;
  readonly category: ErrorCategory;
  readonly httpStatus: number;
  readonly retryable: boolean;
  readonly sync: SyncDisposition;
  readonly clientAction: ClientAction;
  readonly copyKey: string;
  /** 'migration': raised explicitly in supabase/migrations. 'postgres': raised by Postgres itself. */
  readonly raisedBy: 'migration' | 'postgres';
  readonly clientFacing: boolean;
}

const spec = <C extends string>(s: ApiErrorSpec & { code: C }) => s;

export const API_ERRORS = Object.freeze({
  // Custom SQLSTATEs (raised in supabase/migrations).
  SCANO: spec({
    code: 'SCANO',
    meaning: 'Anonymous sessions are refused (the only exception is recording the web contributor notice).',
    category: 'forbidden',
    httpStatus: 403,
    retryable: false,
    sync: 'reject',
    clientAction: 'refresh_session',
    copyKey: 'api.error.anonymous_session',
    raisedBy: 'migration',
    clientFacing: true,
  }),
  SCCON: spec({
    code: 'SCCON',
    meaning:
      'Consent missing before content is stored: current Terms with age attestation and sensitive-data consent. The detail lists terms, age, sensitive-data.',
    category: 'precondition',
    httpStatus: 428,
    retryable: true,
    sync: 'pause',
    clientAction: 'show_consent_sheet',
    copyKey: 'api.error.consent_required',
    raisedBy: 'migration',
    clientFacing: true,
  }),
  SCINV: spec({
    code: 'SCINV',
    meaning:
      'Invite cannot be created or accepted: bad role, token hash already used by another invite (generate a new token and key), not found, used, revoked, expired, or already a member.',
    category: 'conflict',
    httpStatus: 409,
    retryable: false,
    sync: 'reject',
    clientAction: 'show_message',
    copyKey: 'api.error.invite_unusable',
    raisedBy: 'migration',
    clientFacing: true,
  }),
  SCRAT: spec({
    code: 'SCRAT',
    meaning: 'Rate limited: at most 20 invites per book and 20 per parent in any 24 hours.',
    category: 'rate_limited',
    httpStatus: 429,
    retryable: true,
    sync: 'retry',
    clientAction: 'retry_later',
    copyKey: 'api.error.rate_limited',
    raisedBy: 'migration',
    clientFacing: true,
  }),
  SCAPR: spec({
    code: 'SCAPR',
    meaning: 'entries.approval, reviewed_by and reviewed_at are server-owned; the client tried to change them.',
    category: 'invalid',
    httpStatus: 422,
    retryable: false,
    sync: 'reject',
    clientAction: 'report_bug',
    copyKey: 'api.error.unexpected',
    raisedBy: 'migration',
    clientFacing: true,
  }),
  SCIMM: spec({
    code: 'SCIMM',
    meaning:
      'Immutable column changed: entries raw_transcript, raw_sha256, captured_at, created_at, author_id, child_id, engine_version; profiles id, created_at.',
    category: 'invalid',
    httpStatus: 422,
    retryable: false,
    sync: 'reject',
    clientAction: 'report_bug',
    copyKey: 'api.error.unexpected',
    raisedBy: 'migration',
    clientFacing: true,
  }),
  SCTMB: spec({
    code: 'SCTMB',
    meaning:
      'Illegal tombstone transition: restoring a letter by update (use restore_entry), editing a deleted letter, or tombstoning or re-owning a book directly.',
    category: 'conflict',
    httpStatus: 409,
    retryable: false,
    sync: 'reject',
    clientAction: 'show_message',
    copyKey: 'api.error.deleted_item',
    raisedBy: 'migration',
    clientFacing: true,
  }),
  SCLPG: spec({
    code: 'SCLPG',
    meaning: 'The last parent cannot leave a live book; delete the book instead.',
    category: 'conflict',
    httpStatus: 409,
    retryable: false,
    sync: 'reject',
    clientAction: 'show_message',
    copyKey: 'api.error.last_parent',
    raisedBy: 'migration',
    clientFacing: true,
  }),
  SCDEL: spec({
    code: 'SCDEL',
    meaning: 'The book or letter is deleted (new or edited letters in a deleted book, restoring a letter before its book, inviting to a deleted book).',
    category: 'gone',
    httpStatus: 410,
    retryable: false,
    sync: 'reject',
    clientAction: 'show_message',
    copyKey: 'api.error.book_deleted',
    raisedBy: 'migration',
    clientFacing: true,
  }),
  SCPAR: spec({
    code: 'SCPAR',
    meaning: 'Parents only: book settings, invites, auto-add, deleting or restoring a book.',
    category: 'forbidden',
    httpStatus: 403,
    retryable: false,
    sync: 'reject',
    clientAction: 'show_message',
    copyKey: 'api.error.parents_only',
    raisedBy: 'migration',
    clientFacing: true,
  }),
  SCACD: spec({
    code: 'SCACD',
    meaning: 'An account deletion is pending; cancel it to restore these letters or this book.',
    category: 'conflict',
    httpStatus: 409,
    retryable: false,
    sync: 'reject',
    clientAction: 'offer_cancel_account_deletion',
    copyKey: 'api.error.account_deletion_pending',
    raisedBy: 'migration',
    clientFacing: true,
  }),
  SCPRG: spec({
    code: 'SCPRG',
    meaning: 'This letter or book id was purged for good and can never come back (also on upsert).',
    category: 'gone',
    httpStatus: 410,
    retryable: false,
    sync: 'reject',
    clientAction: 'drop_local_row',
    copyKey: 'api.error.deleted_for_good',
    raisedBy: 'migration',
    clientFacing: true,
  }),
  SCCID: spec({
    code: 'SCCID',
    meaning:
      'Client id or idempotency key is not a device UUIDv7 (version, variant, timestamp), or was already used with different arguments or by another user. Not retryable: the offline queue rejects the write. A replay with the same key and arguments is a normal success, not this error.',
    category: 'invalid',
    httpStatus: 422,
    retryable: false,
    sync: 'reject',
    clientAction: 'report_bug',
    copyKey: 'api.error.unexpected',
    raisedBy: 'migration',
    clientFacing: true,
  }),
  SCVER: spec({
    code: 'SCVER',
    meaning: 'A newer policy version must be accepted first (record_policy_act).',
    category: 'conflict',
    httpStatus: 409,
    retryable: false,
    sync: 'reject',
    clientAction: 'show_policy_sheet',
    copyKey: 'api.error.policy_version_outdated',
    raisedBy: 'migration',
    clientFacing: true,
  }),
  SCCFG: spec({
    code: 'SCCFG',
    meaning: 'A server setting is missing (app.consent_pepper); raised when a profile is deleted. Ops alert, not a client error.',
    category: 'server',
    httpStatus: 503,
    retryable: true,
    sync: 'retry',
    clientAction: 'alert_ops',
    copyKey: 'api.error.server_unavailable',
    raisedBy: 'migration',
    clientFacing: false,
  }),

  // Standard SQLSTATEs raised explicitly in supabase/migrations.
  '28000': spec({
    code: '28000',
    meaning: 'Not signed in (no auth.uid()).',
    category: 'unauthenticated',
    httpStatus: 401,
    retryable: true,
    sync: 'pause',
    clientAction: 'refresh_session',
    copyKey: 'api.error.signed_out',
    raisedBy: 'migration',
    clientFacing: true,
  }),
  '22023': spec({
    code: '22023',
    meaning:
      'Invalid argument: names, dates, decision, policy context keys, deletion source, captured_at more than a day ahead, support-assisted acts from a client, invite token hash not 32 bytes.',
    category: 'invalid',
    httpStatus: 400,
    retryable: false,
    sync: 'reject',
    clientAction: 'report_bug',
    copyKey: 'api.error.unexpected',
    raisedBy: 'migration',
    clientFacing: true,
  }),
  P0002: spec({
    code: 'P0002',
    meaning: 'Not found, also when the caller may not see it (entries, invites, policy versions).',
    category: 'not_found',
    httpStatus: 404,
    retryable: false,
    sync: 'reject',
    clientAction: 'show_message',
    copyKey: 'api.error.not_found',
    raisedBy: 'migration',
    clientFacing: true,
  }),
  '55000': spec({
    code: '55000',
    meaning: 'Service role only: a deletion request is not in the expected state.',
    category: 'conflict',
    httpStatus: 409,
    retryable: false,
    sync: 'reject',
    clientAction: 'none',
    copyKey: 'api.error.unexpected',
    raisedBy: 'migration',
    clientFacing: false,
  }),
  P0001: spec({
    code: 'P0001',
    meaning:
      'A plain RAISE EXCEPTION without an errcode (policy_versions and policy_acceptances guards, reachable only by the service role today). Treat as unexpected.',
    category: 'server',
    httpStatus: 500,
    retryable: false,
    sync: 'reject',
    clientAction: 'report_bug',
    copyKey: 'api.error.unexpected',
    raisedBy: 'postgres',
    clientFacing: true,
  }),

  // Standard SQLSTATEs raised by Postgres on client paths.
  '42501': spec({
    code: '42501',
    meaning: 'Insufficient privilege or a row-level security check failed (for example a letter for a book you are not a member of).',
    category: 'forbidden',
    httpStatus: 403,
    retryable: false,
    sync: 'reject',
    clientAction: 'show_message',
    copyKey: 'api.error.not_allowed',
    raisedBy: 'postgres',
    clientFacing: true,
  }),
  '23505': spec({
    code: '23505',
    meaning: 'Unique violation (for example the same dictionary term twice for one book, ignoring case; an insert that should have been an upsert).',
    category: 'conflict',
    httpStatus: 409,
    retryable: false,
    sync: 'reject',
    clientAction: 'show_message',
    copyKey: 'api.error.already_exists',
    raisedBy: 'postgres',
    clientFacing: true,
  }),
  '23514': spec({
    code: '23514',
    meaning: 'CHECK constraint failed (lengths, enum values, scoped photo paths, a family letter in the book without approval).',
    category: 'invalid',
    httpStatus: 400,
    retryable: false,
    sync: 'reject',
    clientAction: 'report_bug',
    copyKey: 'api.error.unexpected',
    raisedBy: 'postgres',
    clientFacing: true,
  }),
  '40001': spec({
    code: '40001',
    meaning: 'Serialization failure; the transaction can be retried as is.',
    category: 'transient',
    httpStatus: 503,
    retryable: true,
    sync: 'retry',
    clientAction: 'retry_later',
    copyKey: 'api.error.try_again',
    raisedBy: 'postgres',
    clientFacing: true,
  }),
} as const);

export type ErrorCode = keyof typeof API_ERRORS;
export const ERROR_CODES = Object.freeze(Object.keys(API_ERRORS) as ErrorCode[]);

/** Custom SQLSTATEs only (5 characters starting with SC). */
export const CUSTOM_ERROR_CODES = Object.freeze(ERROR_CODES.filter((c) => c.startsWith('SC')));

export function isKnownErrorCode(code: unknown): code is ErrorCode {
  return typeof code === 'string' && Object.prototype.hasOwnProperty.call(API_ERRORS, code);
}

/** The spec for a code, or undefined for a code this contract does not know (treat as unexpected). */
export function errorSpec(code: unknown): ApiErrorSpec | undefined {
  return isKnownErrorCode(code) ? API_ERRORS[code] : undefined;
}

/**
 * Upload-queue disposition for any code. An unknown code (or no code, as for
 * network failures) is retried with backoff: a letter is never dropped because
 * this contract did not recognise an error.
 */
export function syncDisposition(code: unknown): SyncDisposition {
  return errorSpec(code)?.sync ?? 'retry';
}
