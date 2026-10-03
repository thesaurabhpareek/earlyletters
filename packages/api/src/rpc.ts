/**
 * Every Postgres function `authenticated` may EXECUTE (post #32), as typed
 * PostgREST RPC calls. Parameter names are the SQL names: PostgREST matches
 * arguments by name.
 *
 * kind:
 *  - 'command': changes data.
 *  - 'query':   reads the caller's state.
 *  - 'helper':  granted only so RLS policies and triggers can call it as the
 *               user. Reachable through PostgREST, but apps should not call it.
 *
 * test/drift.test.ts parses the grants, drops and function headers in
 * supabase/migrations and fails if a granted function is missing here, an
 * entry here is not granted, or a parameter, default or return type differs.
 */
import type {
  BookDeletionOutcome,
  ClientDeletionSource,
  ClientPolicyMethod,
  MemberRole,
  Platform,
  PolicyAction,
  PolicyContextKey,
  ReviewDecision,
  ReviewExpectedState,
  Approval,
} from './enums';
import type { ApiErrorSpec, ErrorCode } from './errors';
import { errorSpec } from './errors';
import type { Assert, ByteaHex, ClientUuid7, IsoDate, IsoTimestamp, JsonValue, SameKeys, Uuid } from './scalars';

/** record_policy_act(p_context): allowlisted keys only; age_attested may only be true. */
export type PolicyContext = { age_attested?: true } & Partial<Record<Exclude<PolicyContextKey, 'age_attested'>, JsonValue>>;

/** An RPC without parameters (PostgREST is called with an empty object). */
export type NoArgs = Record<never, never>;

export interface RpcContract {
  // ─── Books ─────────────────────────────────────────────────────────────
  create_child: {
    request: {
      p_id: ClientUuid7;
      p_name: string;
      p_date_of_birth?: IsoDate | null;
      p_due_date?: IsoDate | null;
      /** When the book was made on the device. Dropped by the server when in the future or before 2024. */
      p_client_created_at?: IsoTimestamp | null;
    };
    /** The child id (same as p_id). */
    response: Uuid;
  };
  request_book_deletion: {
    request: { p_child: Uuid; p_source: ClientDeletionSource };
    response: BookDeletionOutcome;
  };
  cancel_book_deletion: {
    request: { p_child: Uuid };
    /** false when the book was not deleted. */
    response: boolean;
  };
  set_member_auto_add: {
    request: { p_child: Uuid; p_member: Uuid; p_on: boolean };
    /** false when p_member is not a contributor of the book. */
    response: boolean;
  };

  // ─── Invites ───────────────────────────────────────────────────────────
  /**
   * Retry-safe invite. The client makes the secrets, the server never sees them:
   *  1. token = 32 random bytes from a CSPRNG, hex encoded (64 lower-case chars);
   *  2. p_token_hash = sha256(utf8(token)) as ByteaHex ('\\x' + 64 hex chars);
   *  3. code = 8 symbols of Crockford base32 (INVITE_CODE_ALPHABET) from a CSPRNG,
   *     shown as XXXX-XXXX; p_code_hash = sha256(utf8(normaliseInviteCode(code)));
   *  4. p_id = a new UUIDv7 (becomes child_invites.id).
   * Persist p_id, token and code together before the first call, and reuse them
   * on every retry: a replay returns the same invite id with no side effects (no
   * new row, no rate-limit count). Put the token in the share link (recipient
   * calls accept_child_invite); a typed code goes to the invite-redeem Edge
   * Function, never to PostgREST. SCCFG means the server's code pepper is not
   * configured: keep the queued invite and retry later.
   */
  create_child_invite: {
    request: {
      p_id: ClientUuid7;
      p_child: Uuid;
      p_role: MemberRole;
      p_token_hash: ByteaHex;
      p_code_hash: ByteaHex;
      p_signs_as?: string | null;
    };
    /** The invite id (same as p_id). No token is returned. */
    response: Uuid;
  };
  revoke_invite: {
    request: { p_invite: Uuid };
    response: boolean;
  };
  accept_child_invite: {
    request: { p_token: string };
    /** The child id joined. */
    response: Uuid;
  };

  // ─── Letters ───────────────────────────────────────────────────────────
  delete_entry: {
    request: { p_entry: Uuid };
    response: boolean;
  };
  restore_entry: {
    request: { p_entry: Uuid };
    response: boolean;
  };
  review_family_letter: {
    request: { p_entry: Uuid; p_decision: ReviewDecision; p_expected?: ReviewExpectedState };
    /** The approval state after the call (the current state when another parent acted first). */
    response: Approval;
  };
  withdraw_family_letter: {
    request: { p_entry: Uuid };
    response: boolean;
  };

  // ─── Account ───────────────────────────────────────────────────────────
  request_account_deletion: {
    request: { p_source: ClientDeletionSource; p_had_active_subscription?: boolean | null };
    /** RETURNS TABLE: PostgREST sends an array (one row). */
    response: Array<{ request_id: Uuid; scheduled_for: IsoTimestamp }>;
  };
  cancel_account_deletion: {
    request: NoArgs;
    /** false when there was no cancellable request. */
    response: boolean;
  };

  // ─── Policies and consent ──────────────────────────────────────────────
  /**
   * Retry-safe policy act. p_id is a device UUIDv7 made once per act and
   * becomes policy_acceptances.id. Reuse the same key and arguments on every
   * retry: a replay returns the same id and records nothing new.
   */
  record_policy_act: {
    request: {
      p_id: ClientUuid7;
      p_document: string;
      p_version: string;
      p_action: PolicyAction;
      p_method: ClientPolicyMethod;
      p_surface: string;
      p_app_version: string;
      p_platform: Platform;
      p_locale?: string | null;
      p_client_recorded_at?: IsoTimestamp | null;
      p_rendered_sha256?: ByteaHex | null;
      p_context?: PolicyContext;
    };
    /** The policy_acceptances row id. */
    response: Uuid;
  };
  policy_actions_needed: {
    request: NoArgs;
    response: Array<{ document: string; version: string; effective_at: IsoTimestamp; summary: string }>;
  };
  my_sync_gate: {
    request: NoArgs;
    response: Array<{ terms_current: boolean; age_attested: boolean; sensitive_data: boolean; content_allowed: boolean }>;
  };

  // ─── Helpers (granted for RLS and triggers) ────────────────────────────
  is_child_member: { request: { p_child: Uuid }; response: boolean };
  is_child_parent: { request: { p_child: Uuid }; response: boolean };
  child_is_live: { request: { p_child: Uuid }; response: boolean };
  can_read_entry_photo: { request: { p_name: string }; response: boolean };
  is_anonymous: { request: NoArgs; response: boolean };
  require_user: { request: NoArgs; response: Uuid };
  my_role_in: { request: { p_child: Uuid }; response: MemberRole | null };
  my_auto_add_in: { request: { p_child: Uuid }; response: boolean };
  can_write_content: { request: NoArgs; response: boolean };
  require_content_consent: { request: NoArgs; response: null };
  is_valid_client_uuid7: { request: { p_id: Uuid }; response: boolean };
}

export type RpcName = keyof RpcContract;
export type RpcRequest<N extends RpcName> = RpcContract[N]['request'];
export type RpcResponse<N extends RpcName> = RpcContract[N]['response'];

export type RpcKind = 'command' | 'query' | 'helper';

/**
 * How a retry after a lost response behaves (decision 17: safe under retries).
 *  - client_id: the request carries a device UUIDv7 idempotency key. Same key
 *    and same arguments returns the original result with no side effects;
 *    the same key with different arguments (or another user's key) raises
 *    SCCID. Make the key once per intent, persist it, and reuse it (with the
 *    same arguments) on every retry.
 *  - compare_and_set: applies only from the state named in `param`.
 *  - natural: repeating the call converges on the same end state.
 *  - none: each call creates something new; retry only when the first call surely failed.
 */
export type Idempotency =
  | { readonly kind: 'client_id'; readonly param: string }
  | { readonly kind: 'compare_and_set'; readonly param: string }
  | { readonly kind: 'natural' }
  | { readonly kind: 'none'; readonly note: string };

export interface RpcParam {
  readonly name: string;
  /** SQL type as written in the migration signature. */
  readonly sqlType: string;
  /** Has a SQL default, so it may be omitted. */
  readonly optional: boolean;
}

export interface RpcSpec {
  readonly kind: RpcKind;
  readonly params: readonly RpcParam[];
  /** RETURNS clause, whitespace-normalised, lower case. */
  readonly sqlReturns: string;
  readonly idempotency: Idempotency;
  /** Calls require_content_consent (may raise SCCON). */
  readonly consentGated: boolean;
  /** Anonymous sessions may call it (otherwise SCANO or false). */
  readonly allowsAnonymous: boolean;
  /** Codes this RPC can raise directly or through the guards it calls. */
  readonly errors: readonly ErrorCode[];
  readonly migration: string;
}

const p = <N extends string>(name: N, sqlType: string, optional = false) => ({ name, sqlType, optional }) as const;
const AUTH: readonly ErrorCode[] = ['28000', 'SCANO'];
const NATURAL = { kind: 'natural' } as const;

export const RPC_CATALOG = Object.freeze({
  create_child: {
    kind: 'command',
    params: [
      p('p_id', 'uuid'),
      p('p_name', 'text'),
      p('p_date_of_birth', 'date', true),
      p('p_due_date', 'date', true),
      p('p_client_created_at', 'timestamptz', true),
    ],
    sqlReturns: 'uuid',
    idempotency: { kind: 'client_id', param: 'p_id' },
    consentGated: true,
    allowsAnonymous: false,
    errors: [...AUTH, 'SCCID', 'SCPRG', 'SCCON', '22023'],
    migration: '20261003010000_children_and_entitlements.sql',
  },
  request_book_deletion: {
    kind: 'command',
    params: [p('p_child', 'uuid'), p('p_source', 'text')],
    sqlReturns: 'text',
    idempotency: NATURAL,
    consentGated: false,
    allowsAnonymous: false,
    errors: [...AUTH, '22023', 'SCPAR'],
    migration: '20261003000000_security_and_family.sql',
  },
  cancel_book_deletion: {
    kind: 'command',
    params: [p('p_child', 'uuid')],
    sqlReturns: 'boolean',
    idempotency: NATURAL,
    consentGated: false,
    allowsAnonymous: false,
    errors: [...AUTH, 'SCPAR', 'SCACD'],
    migration: '20261003000000_security_and_family.sql',
  },
  set_member_auto_add: {
    kind: 'command',
    params: [p('p_child', 'uuid'), p('p_member', 'uuid'), p('p_on', 'boolean')],
    sqlReturns: 'boolean',
    idempotency: NATURAL,
    consentGated: false,
    allowsAnonymous: false,
    errors: [...AUTH, 'SCPAR'],
    migration: '20261003000000_security_and_family.sql',
  },
  create_child_invite: {
    kind: 'command',
    params: [
      p('p_id', 'uuid'),
      p('p_child', 'uuid'),
      p('p_role', 'text'),
      p('p_token_hash', 'bytea'),
      p('p_code_hash', 'bytea'),
      p('p_signs_as', 'text', true),
    ],
    sqlReturns: 'uuid',
    idempotency: { kind: 'client_id', param: 'p_id' },
    consentGated: true,
    allowsAnonymous: false,
    errors: [...AUTH, 'SCCID', 'SCINV', '22023', 'SCPAR', 'SCDEL', 'SCCON', 'SCRAT', 'SCCFG'],
    migration: '20261003000000_security_and_family.sql',
  },
  revoke_invite: {
    kind: 'command',
    params: [p('p_invite', 'uuid')],
    sqlReturns: 'boolean',
    idempotency: NATURAL,
    consentGated: false,
    allowsAnonymous: false,
    errors: [...AUTH, 'P0002'],
    migration: '20261003000000_security_and_family.sql',
  },
  accept_child_invite: {
    kind: 'command',
    params: [p('p_token', 'text')],
    sqlReturns: 'uuid',
    idempotency: NATURAL,
    consentGated: true,
    allowsAnonymous: false,
    errors: [...AUTH, 'SCINV', 'SCCON'],
    migration: '20261003000000_security_and_family.sql',
  },
  delete_entry: {
    kind: 'command',
    params: [p('p_entry', 'uuid')],
    sqlReturns: 'boolean',
    idempotency: NATURAL,
    consentGated: false,
    allowsAnonymous: false,
    errors: [...AUTH, 'P0002'],
    migration: '20261003000000_security_and_family.sql',
  },
  restore_entry: {
    kind: 'command',
    params: [p('p_entry', 'uuid')],
    sqlReturns: 'boolean',
    idempotency: NATURAL,
    consentGated: false,
    allowsAnonymous: false,
    errors: [...AUTH, 'P0002', 'SCACD', 'SCDEL'],
    migration: '20261003000000_security_and_family.sql',
  },
  review_family_letter: {
    kind: 'command',
    params: [p('p_entry', 'uuid'), p('p_decision', 'text'), p('p_expected', 'text', true)],
    sqlReturns: 'text',
    idempotency: { kind: 'compare_and_set', param: 'p_expected' },
    consentGated: true,
    allowsAnonymous: false,
    errors: [...AUTH, '22023', 'P0002', 'SCDEL', 'SCCON'],
    migration: '20261003000000_security_and_family.sql',
  },
  withdraw_family_letter: {
    kind: 'command',
    params: [p('p_entry', 'uuid')],
    sqlReturns: 'boolean',
    idempotency: NATURAL,
    consentGated: false,
    allowsAnonymous: false,
    errors: [...AUTH, 'P0002'],
    migration: '20261003000000_security_and_family.sql',
  },
  request_account_deletion: {
    kind: 'command',
    params: [p('p_source', 'text'), p('p_had_active_subscription', 'boolean', true)],
    sqlReturns: 'table (request_id uuid, scheduled_for timestamptz)',
    idempotency: NATURAL,
    consentGated: false,
    allowsAnonymous: false,
    errors: [...AUTH, '22023'],
    migration: '20261003000000_security_and_family.sql',
  },
  cancel_account_deletion: {
    kind: 'command',
    params: [],
    sqlReturns: 'boolean',
    idempotency: NATURAL,
    consentGated: false,
    allowsAnonymous: false,
    errors: AUTH,
    migration: '20261003000000_security_and_family.sql',
  },
  record_policy_act: {
    kind: 'command',
    params: [
      p('p_id', 'uuid'),
      p('p_document', 'text'),
      p('p_version', 'text'),
      p('p_action', 'text'),
      p('p_method', 'text'),
      p('p_surface', 'text'),
      p('p_app_version', 'text'),
      p('p_platform', 'text'),
      p('p_locale', 'text', true),
      p('p_client_recorded_at', 'timestamptz', true),
      p('p_rendered_sha256', 'bytea', true),
      p('p_context', 'jsonb', true),
    ],
    sqlReturns: 'uuid',
    idempotency: { kind: 'client_id', param: 'p_id' },
    consentGated: false,
    allowsAnonymous: true,
    errors: ['28000', 'SCANO', 'SCCID', '22023', 'P0002', 'SCVER', '23514'],
    migration: '20261003000000_security_and_family.sql',
  },
  policy_actions_needed: {
    kind: 'query',
    params: [],
    sqlReturns: 'table (document text, version text, effective_at timestamptz, summary text)',
    idempotency: NATURAL,
    consentGated: false,
    allowsAnonymous: false,
    errors: AUTH,
    migration: '20261003000000_security_and_family.sql',
  },
  my_sync_gate: {
    kind: 'query',
    params: [],
    sqlReturns: 'table (terms_current boolean, age_attested boolean, sensitive_data boolean, content_allowed boolean)',
    idempotency: NATURAL,
    consentGated: false,
    allowsAnonymous: false,
    errors: AUTH,
    migration: '20261003000000_security_and_family.sql',
  },
  is_child_member: {
    kind: 'helper',
    params: [p('p_child', 'uuid')],
    sqlReturns: 'boolean',
    idempotency: NATURAL,
    consentGated: false,
    allowsAnonymous: true,
    errors: [],
    migration: '20260930000000_scribe_core.sql',
  },
  is_child_parent: {
    kind: 'helper',
    params: [p('p_child', 'uuid')],
    sqlReturns: 'boolean',
    idempotency: NATURAL,
    consentGated: false,
    allowsAnonymous: true,
    errors: [],
    migration: '20261002020000_data_governance.sql',
  },
  child_is_live: {
    kind: 'helper',
    params: [p('p_child', 'uuid')],
    sqlReturns: 'boolean',
    idempotency: NATURAL,
    consentGated: false,
    allowsAnonymous: true,
    errors: [],
    migration: '20261002020000_data_governance.sql',
  },
  can_read_entry_photo: {
    kind: 'helper',
    params: [p('p_name', 'text')],
    sqlReturns: 'boolean',
    idempotency: NATURAL,
    consentGated: false,
    allowsAnonymous: true,
    errors: [],
    migration: '20261003000000_security_and_family.sql',
  },
  is_anonymous: {
    kind: 'helper',
    params: [],
    sqlReturns: 'boolean',
    idempotency: NATURAL,
    consentGated: false,
    allowsAnonymous: true,
    errors: [],
    migration: '20261003000000_security_and_family.sql',
  },
  require_user: {
    kind: 'helper',
    params: [],
    sqlReturns: 'uuid',
    idempotency: NATURAL,
    consentGated: false,
    allowsAnonymous: false,
    errors: AUTH,
    migration: '20261003000000_security_and_family.sql',
  },
  my_role_in: {
    kind: 'helper',
    params: [p('p_child', 'uuid')],
    sqlReturns: 'text',
    idempotency: NATURAL,
    consentGated: false,
    allowsAnonymous: true,
    errors: [],
    migration: '20261003000000_security_and_family.sql',
  },
  my_auto_add_in: {
    kind: 'helper',
    params: [p('p_child', 'uuid')],
    sqlReturns: 'boolean',
    idempotency: NATURAL,
    consentGated: false,
    allowsAnonymous: true,
    errors: [],
    migration: '20261003000000_security_and_family.sql',
  },
  can_write_content: {
    kind: 'helper',
    params: [],
    sqlReturns: 'boolean',
    idempotency: NATURAL,
    consentGated: false,
    allowsAnonymous: true,
    errors: [],
    migration: '20261003000000_security_and_family.sql',
  },
  require_content_consent: {
    kind: 'helper',
    params: [],
    sqlReturns: 'void',
    idempotency: NATURAL,
    consentGated: true,
    allowsAnonymous: false,
    errors: [...AUTH, 'SCCON'],
    migration: '20261003000000_security_and_family.sql',
  },
  is_valid_client_uuid7: {
    kind: 'helper',
    params: [p('p_id', 'uuid')],
    sqlReturns: 'boolean',
    idempotency: NATURAL,
    consentGated: false,
    allowsAnonymous: true,
    errors: [],
    migration: '20261003000000_security_and_family.sql',
  },
} satisfies Record<RpcName, RpcSpec>);

export const RPC_NAMES = Object.freeze(Object.keys(RPC_CATALOG) as RpcName[]);

// Compile-time: catalog keys equal contract keys, and each request's keys
// equal the catalog's parameter names.
type ParamNames<N extends RpcName> = (typeof RPC_CATALOG)[N]['params'][number] extends infer P
  ? P extends { name: infer K } ? K : never
  : never;
type RequestKeysMatch<N extends RpcName> = SameKeys<keyof RpcRequest<N>, ParamNames<N> & string>;
export type _RpcCatalogKeys = Assert<SameKeys<keyof typeof RPC_CATALOG, RpcName>>;
export type _RpcRequestKeys = Assert<{ [N in RpcName]: RequestKeysMatch<N> }[RpcName]>;

// ─── Calling ─────────────────────────────────────────────────────────────

/** The error shape PostgREST returns (supabase-js passes it through as `error`). */
export interface RpcTransportError {
  code: string;
  message: string;
  details?: string | null;
  hint?: string | null;
}

/**
 * Anything that can call a PostgREST RPC: inject a configured client that
 * signs requests with the user's JWT and sets a request id header. This
 * package has no supabase-js dependency.
 */
export interface RpcTransport {
  rpc(fn: string, args?: Record<string, unknown>): PromiseLike<{ data: unknown; error: RpcTransportError | null }>;
}

export interface ApiError {
  readonly code: string;
  /** undefined for a code this contract does not know: treat as unexpected. */
  readonly spec: ApiErrorSpec | undefined;
  readonly message: string;
  readonly details: string | null;
  readonly hint: string | null;
}

export type RpcResult<N extends RpcName> =
  | { readonly ok: true; readonly data: RpcResponse<N> }
  | { readonly ok: false; readonly error: ApiError };

export type CallRpc = <N extends RpcName>(
  client: RpcTransport,
  name: N,
  args: RpcRequest<N>,
) => Promise<RpcResult<N>>;

/**
 * Thin typed wrapper. No validation of the response body: the types are the
 * contract, and the drift test keeps them honest against the SQL. Thrown
 * transport errors (network) propagate to the caller unchanged.
 */
export const callRpc: CallRpc = async (client, name, args) => {
  const { data, error } = await client.rpc(name, args as Record<string, unknown>);
  if (error) {
    return {
      ok: false,
      error: {
        code: error.code,
        spec: errorSpec(error.code),
        message: error.message,
        details: error.details ?? null,
        hint: error.hint ?? null,
      },
    };
  }
  return { ok: true, data: data as RpcResponse<typeof name> };
};
