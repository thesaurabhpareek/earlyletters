/**
 * Row shapes of every table and view an `authenticated` client can read,
 * per the RLS policies and grants in supabase/migrations (post #32).
 *
 * Each interface has a matching column list; a compile-time check pins the
 * two together and test/drift.test.ts compares the list with the columns the
 * migrations create. Tables with RLS on and no client policy (legal_holds,
 * deletion_request_steps, storage_purge_queue, purge_ledger) are service-role
 * only and deliberately absent.
 *
 * Every client-visible table also has a restrictive policy refusing
 * anonymous sessions (policy_documents and policy_versions excepted).
 */
import type {
  Approval,
  AuditAction,
  AuditActorKind,
  AuditSubjectType,
  CaptureMode,
  DeletedReason,
  DeletionRequestKind,
  DeletionRequestStatus,
  DeletionSource,
  DictionaryTermKind,
  EditLevel,
  EntryKind,
  MemberRole,
  Platform,
  PolicyAction,
  PolicyChangeClass,
  PolicyMethod,
} from './enums';
import type {
  Assert,
  ByteaHex,
  IsoDate,
  IsoTimestamp,
  JsonObject,
  JsonValue,
  SameKeys,
  TsVectorText,
  Uuid,
} from './scalars';

export type Access = 'own' | 'members' | 'parents' | 'author' | 'everyone' | 'none';

export interface RelationAccess {
  readonly kind: 'table' | 'view';
  readonly select: Access;
  readonly insert: Access;
  readonly update: Access;
  readonly delete: Access;
  readonly note: string;
}

// ─── profiles ────────────────────────────────────────────────────────────
export interface ProfileRow {
  id: Uuid;
  display_name: string | null;
  signs_as: string | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
}
export const PROFILE_COLUMNS = ['id', 'display_name', 'signs_as', 'created_at', 'updated_at'] as const;
/** Columns a person may change on their own row (id and created_at raise SCIMM). */
export type ProfileUpdate = Partial<Pick<ProfileRow, 'display_name' | 'signs_as'>>;

// ─── children (parents only; members read book_children) ─────────────────
export interface ChildRow {
  id: Uuid;
  name: string;
  date_of_birth: IsoDate | null;
  /** null after the creator's account is deleted. */
  created_by: Uuid | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  deleted_at: IsoTimestamp | null;
  deletion_request_id: Uuid | null;
  nickname: string | null;
  due_date: IsoDate | null;
  photo_path: string | null;
  book_look: string;
  family_can_read: boolean;
  hidden_at: IsoTimestamp | null;
}
export const CHILD_COLUMNS = [
  'id',
  'name',
  'date_of_birth',
  'created_by',
  'created_at',
  'updated_at',
  'deleted_at',
  'deletion_request_id',
  'nickname',
  'due_date',
  'photo_path',
  'book_look',
  'family_can_read',
  'hidden_at',
] as const;
/**
 * Book settings a parent may update. deleted_at, deletion_request_id and
 * created_by raise SCTMB; a non-parent raises SCPAR; consent-gated (SCCON).
 * Books are created only through the create_child RPC.
 */
export type ChildUpdate = Partial<
  Pick<
    ChildRow,
    'name' | 'date_of_birth' | 'nickname' | 'due_date' | 'photo_path' | 'book_look' | 'family_can_read' | 'hidden_at'
  >
>;

// ─── book_children (view: every member of a live book) ────────────────────
export interface BookChildRow {
  id: Uuid;
  name: string;
  nickname: string | null;
  /** 1 to 12, null without a birthday. Never the birth year or due date. */
  birth_month: number | null;
  birth_day: number | null;
}
export const BOOK_CHILD_COLUMNS = ['id', 'name', 'nickname', 'birth_month', 'birth_day'] as const;

// ─── child_members ───────────────────────────────────────────────────────
export interface ChildMemberRow {
  child_id: Uuid;
  profile_id: Uuid;
  role: MemberRole;
  joined_at: IsoTimestamp;
  auto_add_letters: boolean;
}
export const CHILD_MEMBER_COLUMNS = ['child_id', 'profile_id', 'role', 'joined_at', 'auto_add_letters'] as const;

// ─── child_member_prefs ──────────────────────────────────────────────────
export interface ChildMemberPrefsRow {
  child_id: Uuid;
  profile_id: Uuid;
  signs_as: string | null;
  include_in_reminders: boolean;
  celebrations_paused: boolean;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
}
export const CHILD_MEMBER_PREFS_COLUMNS = [
  'child_id',
  'profile_id',
  'signs_as',
  'include_in_reminders',
  'celebrations_paused',
  'created_at',
  'updated_at',
] as const;
export type ChildMemberPrefsUpsert = Pick<ChildMemberPrefsRow, 'child_id' | 'profile_id'> &
  Partial<Pick<ChildMemberPrefsRow, 'signs_as' | 'include_in_reminders' | 'celebrations_paused'>>;

// ─── child_invites (parents only; written only by RPCs) ──────────────────
export interface ChildInviteRow {
  /** The client's UUIDv7 idempotency key (create_child_invite p_id). */
  id: Uuid;
  child_id: Uuid;
  invited_by: Uuid;
  /** sha256(utf8(token)). The token is made on the device and never sent to or returned by the server. */
  token_hash: ByteaHex;
  role: MemberRole;
  expires_at: IsoTimestamp;
  accepted_by: Uuid | null;
  accepted_at: IsoTimestamp | null;
  created_at: IsoTimestamp;
  revoked_at: IsoTimestamp | null;
  signs_as: string | null;
}
export const CHILD_INVITE_COLUMNS = [
  'id',
  'child_id',
  'invited_by',
  'token_hash',
  'role',
  'expires_at',
  'accepted_by',
  'accepted_at',
  'created_at',
  'revoked_at',
  'signs_as',
] as const;

// ─── entries (author only, every column, any state) ──────────────────────
export interface EntryRow {
  /** Device-generated UUIDv7 (SCCID otherwise); the idempotency key for upserts. */
  id: Uuid;
  child_id: Uuid;
  author_id: Uuid;
  kind: EntryKind;
  occurred_on: IsoDate;
  captured_at: IsoTimestamp;
  capture_mode: CaptureMode;
  edit_level: EditLevel;
  prompt_key: string | null;
  prompt_library_version: number | null;
  engine_version: number;
  raw_transcript: string;
  stt_meta: JsonValue | null;
  machine_edits: JsonValue;
  final_text: string;
  in_book: boolean;
  photo_path: string | null;
  audio_kept_on_device: boolean;
  sounds_like_me: boolean | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  deleted_at: IsoTimestamp | null;
  search: TsVectorText;
  deleted_reason: DeletedReason | null;
  raw_sha256: ByteaHex;
  author_signs_as: string | null;
  approval: Approval;
  reviewed_by: Uuid | null;
  reviewed_at: IsoTimestamp | null;
}
export const ENTRY_COLUMNS = [
  'id',
  'child_id',
  'author_id',
  'kind',
  'occurred_on',
  'captured_at',
  'capture_mode',
  'edit_level',
  'prompt_key',
  'prompt_library_version',
  'engine_version',
  'raw_transcript',
  'stt_meta',
  'machine_edits',
  'final_text',
  'in_book',
  'photo_path',
  'audio_kept_on_device',
  'sounds_like_me',
  'created_at',
  'updated_at',
  'deleted_at',
  'search',
  'deleted_reason',
  'raw_sha256',
  'author_signs_as',
  'approval',
  'reviewed_by',
  'reviewed_at',
] as const;

/** Set by the server; never upload them (approval, reviewed_by, reviewed_at raise SCAPR on update). */
export const ENTRY_SERVER_OWNED_COLUMNS = [
  'created_at',
  'updated_at',
  'search',
  'deleted_reason',
  'raw_sha256',
  'approval',
  'reviewed_by',
  'reviewed_at',
] as const;

/** Fixed after insert (SCIMM). Checked against entries_guard_immutable by the drift test. */
export const ENTRY_IMMUTABLE_COLUMNS = [
  'raw_transcript',
  'captured_at',
  'author_id',
  'child_id',
  'engine_version',
  'created_at',
  'raw_sha256',
] as const;

type EntryServerOwned = (typeof ENTRY_SERVER_OWNED_COLUMNS)[number];
type EntryImmutable = (typeof ENTRY_IMMUTABLE_COLUMNS)[number];
type EntryRequiredOnInsert =
  | 'id'
  | 'child_id'
  | 'author_id'
  | 'kind'
  | 'occurred_on'
  | 'captured_at'
  | 'capture_mode'
  | 'engine_version'
  | 'raw_transcript'
  | 'final_text';

/**
 * Insert or upsert (on id) of the caller's own letter. author_id must be the
 * caller; the book must be live and the caller a member (42501 or SCDEL);
 * consent-gated (SCCON). A contributor's in_book means "send to the parents".
 * deleted_at may be set for a letter created and deleted offline; the server
 * replaces the time with its own clock.
 */
export type EntryInsert = Pick<EntryRow, EntryRequiredOnInsert> &
  Partial<Omit<EntryRow, EntryRequiredOnInsert | EntryServerOwned>>;

/**
 * Update of the caller's own letter. Setting deleted_at tombstones it (the
 * server sets the time); clearing it raises SCTMB, use restore_entry.
 */
export type EntryUpdate = Partial<Omit<EntryRow, EntryServerOwned | EntryImmutable | 'id'>>;

// ─── book_entries (view: letters a member may read, without working material) ──
export interface BookEntryRow {
  id: Uuid;
  child_id: Uuid;
  author_id: Uuid;
  author_signs_as: string | null;
  kind: EntryKind;
  occurred_on: IsoDate;
  captured_at: IsoTimestamp;
  capture_mode: CaptureMode;
  edit_level: EditLevel;
  prompt_key: string | null;
  prompt_library_version: number | null;
  engine_version: number;
  final_text: string;
  in_book: boolean;
  photo_path: string | null;
  audio_kept_on_device: boolean;
  sounds_like_me: boolean | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  /** Non-null only on the caller's own rows. */
  deleted_at: IsoTimestamp | null;
  search: TsVectorText;
  approval: Approval;
}
export const BOOK_ENTRY_COLUMNS = [
  'id',
  'child_id',
  'author_id',
  'author_signs_as',
  'kind',
  'occurred_on',
  'captured_at',
  'capture_mode',
  'edit_level',
  'prompt_key',
  'prompt_library_version',
  'engine_version',
  'final_text',
  'in_book',
  'photo_path',
  'audio_kept_on_device',
  'sounds_like_me',
  'created_at',
  'updated_at',
  'deleted_at',
  'search',
  'approval',
] as const;

// ─── entry_versions (author only) ────────────────────────────────────────
export interface EntryVersionRow {
  id: Uuid;
  entry_id: Uuid;
  final_text: string;
  in_book: boolean;
  created_at: IsoTimestamp;
  machine_edits: JsonValue | null;
  superseded_by: Uuid | null;
}
export const ENTRY_VERSION_COLUMNS = [
  'id',
  'entry_id',
  'final_text',
  'in_book',
  'created_at',
  'machine_edits',
  'superseded_by',
] as const;

// ─── dictionary_terms (owner, all operations) ────────────────────────────
export interface DictionaryTermRow {
  id: Uuid;
  owner_id: Uuid;
  /** null means every book. Unique per (owner, book, lower(term)). */
  child_id: Uuid | null;
  term: string;
  kind: DictionaryTermKind;
  heard_as: string[];
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
}
export const DICTIONARY_TERM_COLUMNS = [
  'id',
  'owner_id',
  'child_id',
  'term',
  'kind',
  'heard_as',
  'created_at',
  'updated_at',
] as const;
export type DictionaryTermInsert = Pick<DictionaryTermRow, 'owner_id' | 'term' | 'kind'> &
  Partial<Pick<DictionaryTermRow, 'id' | 'child_id' | 'heard_as'>>;

// ─── audit_events (own rows, read only) ──────────────────────────────────
export interface AuditEventRow {
  /** bigint identity; PostgREST sends it as a JSON number. */
  id: number;
  at: IsoTimestamp;
  actor_id: Uuid | null;
  actor_kind: AuditActorKind;
  action: AuditAction;
  subject_type: AuditSubjectType | null;
  subject_id: Uuid | null;
  child_id: Uuid | null;
  detail: JsonObject;
}
export const AUDIT_EVENT_COLUMNS = [
  'id',
  'at',
  'actor_id',
  'actor_kind',
  'action',
  'subject_type',
  'subject_id',
  'child_id',
  'detail',
] as const;

// ─── deletion_requests (own rows, read only) ─────────────────────────────
export interface DeletionRequestRow {
  id: Uuid;
  kind: DeletionRequestKind;
  profile_id: Uuid | null;
  child_id: Uuid | null;
  status: DeletionRequestStatus;
  source: DeletionSource;
  requested_at: IsoTimestamp;
  scheduled_for: IsoTimestamp;
  cancelled_at: IsoTimestamp | null;
  executing_at: IsoTimestamp | null;
  completed_at: IsoTimestamp | null;
  had_active_subscription: boolean | null;
  receipt: JsonObject;
}
export const DELETION_REQUEST_COLUMNS = [
  'id',
  'kind',
  'profile_id',
  'child_id',
  'status',
  'source',
  'requested_at',
  'scheduled_for',
  'cancelled_at',
  'executing_at',
  'completed_at',
  'had_active_subscription',
  'receipt',
] as const;

// ─── policy_documents and policy_versions (everyone, including anon) ─────
export interface PolicyDocumentRow {
  key: string;
  title: string;
  needs_affirmative_act: boolean;
}
export const POLICY_DOCUMENT_COLUMNS = ['key', 'title', 'needs_affirmative_act'] as const;

export interface PolicyVersionRow {
  document: string;
  version: string;
  major: number;
  minor: number;
  patch: number;
  change_class: PolicyChangeClass;
  requires_reconsent: boolean;
  published_at: IsoTimestamp;
  new_users_from: IsoTimestamp;
  effective_at: IsoTimestamp;
  content_sha256: ByteaHex;
  url: string;
  summary: string;
}
export const POLICY_VERSION_COLUMNS = [
  'document',
  'version',
  'major',
  'minor',
  'patch',
  'change_class',
  'requires_reconsent',
  'published_at',
  'new_users_from',
  'effective_at',
  'content_sha256',
  'url',
  'summary',
] as const;

// ─── policy_acceptances (own rows, read only; write via record_policy_act) ──
export interface PolicyAcceptanceRow {
  /** The client's UUIDv7 idempotency key (record_policy_act p_id) for client-recorded acts. */
  id: Uuid;
  profile_id: Uuid | null;
  subject_hash: ByteaHex | null;
  pseudonymised_at: IsoTimestamp | null;
  document: string;
  version: string;
  action: PolicyAction;
  method: PolicyMethod;
  surface: string;
  accepted_at: IsoTimestamp;
  client_recorded_at: IsoTimestamp | null;
  app_version: string;
  platform: Platform;
  locale: string | null;
  rendered_sha256: ByteaHex | null;
  context: JsonObject;
}
export const POLICY_ACCEPTANCE_COLUMNS = [
  'id',
  'profile_id',
  'subject_hash',
  'pseudonymised_at',
  'document',
  'version',
  'action',
  'method',
  'surface',
  'accepted_at',
  'client_recorded_at',
  'app_version',
  'platform',
  'locale',
  'rendered_sha256',
  'context',
] as const;

// ─── my_policy_state (view: the caller's latest act per document) ────────
export interface MyPolicyStateRow {
  document: string;
  version: string;
  action: PolicyAction;
  accepted_at: IsoTimestamp;
}
export const MY_POLICY_STATE_COLUMNS = ['document', 'version', 'action', 'accepted_at'] as const;

// ─── Registry ────────────────────────────────────────────────────────────
export interface RowContract {
  profiles: ProfileRow;
  children: ChildRow;
  book_children: BookChildRow;
  child_members: ChildMemberRow;
  child_member_prefs: ChildMemberPrefsRow;
  child_invites: ChildInviteRow;
  entries: EntryRow;
  book_entries: BookEntryRow;
  entry_versions: EntryVersionRow;
  dictionary_terms: DictionaryTermRow;
  audit_events: AuditEventRow;
  deletion_requests: DeletionRequestRow;
  policy_documents: PolicyDocumentRow;
  policy_versions: PolicyVersionRow;
  policy_acceptances: PolicyAcceptanceRow;
  my_policy_state: MyPolicyStateRow;
}
export type RelationName = keyof RowContract;
export type Row<R extends RelationName> = RowContract[R];

export const RELATION_COLUMNS = Object.freeze({
  profiles: PROFILE_COLUMNS,
  children: CHILD_COLUMNS,
  book_children: BOOK_CHILD_COLUMNS,
  child_members: CHILD_MEMBER_COLUMNS,
  child_member_prefs: CHILD_MEMBER_PREFS_COLUMNS,
  child_invites: CHILD_INVITE_COLUMNS,
  entries: ENTRY_COLUMNS,
  book_entries: BOOK_ENTRY_COLUMNS,
  entry_versions: ENTRY_VERSION_COLUMNS,
  dictionary_terms: DICTIONARY_TERM_COLUMNS,
  audit_events: AUDIT_EVENT_COLUMNS,
  deletion_requests: DELETION_REQUEST_COLUMNS,
  policy_documents: POLICY_DOCUMENT_COLUMNS,
  policy_versions: POLICY_VERSION_COLUMNS,
  policy_acceptances: POLICY_ACCEPTANCE_COLUMNS,
  my_policy_state: MY_POLICY_STATE_COLUMNS,
} as const);

/** Who may do what, per RLS (summary for humans and tests; the SQL is the authority). */
export const RELATION_ACCESS: Readonly<Record<RelationName, RelationAccess>> = Object.freeze({
  profiles: { kind: 'table', select: 'members', insert: 'none', update: 'own', delete: 'none', note: 'Yourself and co-members of your books; edit yourself. Created by the auth trigger.' },
  children: { kind: 'table', select: 'parents', insert: 'none', update: 'parents', delete: 'none', note: 'Parents only (holds birth year and due date). Create with create_child.' },
  book_children: { kind: 'view', select: 'members', insert: 'none', update: 'none', delete: 'none', note: 'Every member of a live book. Read only.' },
  child_members: { kind: 'table', select: 'members', insert: 'none', update: 'none', delete: 'own', note: 'Members of the same book. Delete your own row to leave (SCLPG for the last parent).' },
  child_member_prefs: { kind: 'table', select: 'own', insert: 'own', update: 'own', delete: 'own', note: 'Your own per-book prefs; consent-gated writes.' },
  child_invites: { kind: 'table', select: 'parents', insert: 'none', update: 'none', delete: 'none', note: 'Parents of the book. Written only by invite RPCs.' },
  entries: { kind: 'table', select: 'author', insert: 'author', update: 'author', delete: 'none', note: 'Author only, every column. Delete is a tombstone (update or delete_entry).' },
  book_entries: { kind: 'view', select: 'members', insert: 'none', update: 'none', delete: 'none', note: 'B F9 visibility without raw transcript, hash, machine edits or STT metadata. Read only.' },
  entry_versions: { kind: 'table', select: 'author', insert: 'none', update: 'none', delete: 'none', note: 'Versions of your own letters, written by trigger.' },
  dictionary_terms: { kind: 'table', select: 'own', insert: 'own', update: 'own', delete: 'own', note: 'Your own names and words; consent-gated writes.' },
  audit_events: { kind: 'table', select: 'own', insert: 'none', update: 'none', delete: 'none', note: 'Events where you are the actor.' },
  deletion_requests: { kind: 'table', select: 'own', insert: 'none', update: 'none', delete: 'none', note: 'Your own requests. Written only by deletion RPCs.' },
  policy_documents: { kind: 'table', select: 'everyone', insert: 'none', update: 'none', delete: 'none', note: 'Readable by anon and authenticated.' },
  policy_versions: { kind: 'table', select: 'everyone', insert: 'none', update: 'none', delete: 'none', note: 'Readable by anon and authenticated.' },
  policy_acceptances: { kind: 'table', select: 'own', insert: 'none', update: 'none', delete: 'none', note: 'Your own acts. Write with record_policy_act.' },
  my_policy_state: { kind: 'view', select: 'own', insert: 'none', update: 'none', delete: 'none', note: 'Your latest act per document. Read only.' },
});

// Compile-time: every column list matches its row interface exactly.
type ColumnsMatch<R extends RelationName> = SameKeys<keyof RowContract[R], (typeof RELATION_COLUMNS)[R][number]>;
export type _RowColumnChecks = [
  Assert<ColumnsMatch<'profiles'>>,
  Assert<ColumnsMatch<'children'>>,
  Assert<ColumnsMatch<'book_children'>>,
  Assert<ColumnsMatch<'child_members'>>,
  Assert<ColumnsMatch<'child_member_prefs'>>,
  Assert<ColumnsMatch<'child_invites'>>,
  Assert<ColumnsMatch<'entries'>>,
  Assert<ColumnsMatch<'book_entries'>>,
  Assert<ColumnsMatch<'entry_versions'>>,
  Assert<ColumnsMatch<'dictionary_terms'>>,
  Assert<ColumnsMatch<'audit_events'>>,
  Assert<ColumnsMatch<'deletion_requests'>>,
  Assert<ColumnsMatch<'policy_documents'>>,
  Assert<ColumnsMatch<'policy_versions'>>,
  Assert<ColumnsMatch<'policy_acceptances'>>,
  Assert<ColumnsMatch<'my_policy_state'>>,
];
