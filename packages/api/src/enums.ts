/**
 * Database-facing value sets, derived from the CHECK constraints (and a few
 * RPC argument checks) in supabase/migrations. test/drift.test.ts parses the
 * migrations and fails if any list here differs from the SQL.
 *
 * TODO(api): reconcile with packages/core/src/domain.ts once PR #31
 * (fix/analytics-enums-core) merges. The overlapping sets (ENTRY_KINDS,
 * CAPTURE_MODES, EDIT_LEVELS, MEMBER_ROLES, APPROVALS) use the same names so
 * one side can re-export the other. Nothing is imported from core today
 * because #31 is unmerged.
 */

/** entries.kind */
export const ENTRY_KINDS = Object.freeze(['note', 'letter', 'not_much'] as const);
export type EntryKind = (typeof ENTRY_KINDS)[number];

/** entries.capture_mode */
export const CAPTURE_MODES = Object.freeze(['spoken', 'typed', 'mixed'] as const);
export type CaptureMode = (typeof CAPTURE_MODES)[number];

/** entries.edit_level */
export const EDIT_LEVELS = Object.freeze(['clean', 'verbatim'] as const);
export type EditLevel = (typeof EDIT_LEVELS)[number];

/** entries.deleted_reason (server-owned; null while the letter is live) */
export const DELETED_REASONS = Object.freeze([
  'user',
  'account_deletion',
  'book_deletion',
  'leave',
  'move',
  'support',
] as const);
export type DeletedReason = (typeof DELETED_REASONS)[number];

/** entries.approval: family review state (server-owned, B F9) */
export const APPROVALS = Object.freeze(['not_needed', 'pending', 'added', 'set_aside'] as const);
export type Approval = (typeof APPROVALS)[number];

/** review_family_letter(p_decision) */
export const REVIEW_DECISIONS = Object.freeze(['added', 'set_aside'] as const);
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

/** review_family_letter(p_expected) */
export const REVIEW_EXPECTED_STATES = Object.freeze(['pending', 'added', 'set_aside'] as const);
export type ReviewExpectedState = (typeof REVIEW_EXPECTED_STATES)[number];

/** child_members.role and child_invites.role */
export const MEMBER_ROLES = Object.freeze(['parent', 'contributor'] as const);
export type MemberRole = (typeof MEMBER_ROLES)[number];

/** dictionary_terms.kind */
export const DICTIONARY_TERM_KINDS = Object.freeze([
  'child',
  'nickname',
  'family',
  'word',
  'place',
  'self',
] as const);
export type DictionaryTermKind = (typeof DICTIONARY_TERM_KINDS)[number];

/** deletion_requests.kind */
export const DELETION_REQUEST_KINDS = Object.freeze(['account', 'book'] as const);
export type DeletionRequestKind = (typeof DELETION_REQUEST_KINDS)[number];

/** deletion_requests.status */
export const DELETION_REQUEST_STATUSES = Object.freeze([
  'scheduled',
  'cancelled',
  'held',
  'executing',
  'completed',
  'failed',
] as const);
export type DeletionRequestStatus = (typeof DELETION_REQUEST_STATUSES)[number];

/** deletion_requests.source (the column; includes the service-only 'support') */
export const DELETION_SOURCES = Object.freeze(['ios', 'android', 'web', 'support'] as const);
export type DeletionSource = (typeof DELETION_SOURCES)[number];

/** p_source accepted from clients by request_account_deletion and request_book_deletion */
export const CLIENT_DELETION_SOURCES = Object.freeze(['ios', 'android', 'web'] as const);
export type ClientDeletionSource = (typeof CLIENT_DELETION_SOURCES)[number];

/** request_book_deletion return value */
export const BOOK_DELETION_OUTCOMES = Object.freeze(['left_and_removed_own_letters', 'book_scheduled'] as const);
export type BookDeletionOutcome = (typeof BOOK_DELETION_OUTCOMES)[number];

/** audit_events.actor_kind */
export const AUDIT_ACTOR_KINDS = Object.freeze(['user', 'system', 'support'] as const);
export type AuditActorKind = (typeof AUDIT_ACTOR_KINDS)[number];

/** audit_events.action (final constraint, 20261003000000) */
export const AUDIT_ACTIONS = Object.freeze([
  'entry_deleted',
  'entry_restored',
  'purge_run',
  'book_deletion_requested',
  'book_deletion_cancelled',
  'book_purged',
  'left_book',
  'member_removed',
  'account_deletion_requested',
  'account_deletion_cancelled',
  'account_deletion_completed',
  'export_created',
  'legal_hold_placed',
  'legal_hold_released',
  'support_access',
  'restore_replayed',
  'invite_created',
  'invite_revoked',
  'member_joined',
  'family_letter_reviewed',
] as const);
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** audit_events.subject_type */
export const AUDIT_SUBJECT_TYPES = Object.freeze([
  'entry',
  'child',
  'membership',
  'profile',
  'deletion_request',
  'export',
  'legal_hold',
  'system',
] as const);
export type AuditSubjectType = (typeof AUDIT_SUBJECT_TYPES)[number];

/** policy_acceptances.action */
export const POLICY_ACTIONS = Object.freeze(['accept', 'decline', 'withdraw', 'acknowledge'] as const);
export type PolicyAction = (typeof POLICY_ACTIONS)[number];

/**
 * policy_acceptances.method. 'support_assisted' is in the CHECK list but
 * record_policy_act refuses it from clients (22023).
 */
export const POLICY_METHODS = Object.freeze([
  'signin_sheet',
  'reconsent_sheet',
  'consent_sheet',
  'settings_toggle',
  'paywall_purchase',
  'web_contributor_page',
  'web_account_page',
  'support_assisted',
] as const);
export type PolicyMethod = (typeof POLICY_METHODS)[number];
export type ClientPolicyMethod = Exclude<PolicyMethod, 'support_assisted'>;

/** policy_acceptances.platform */
export const PLATFORMS = Object.freeze(['ios', 'android', 'web'] as const);
export type Platform = (typeof PLATFORMS)[number];

/** policy_versions.change_class */
export const POLICY_CHANGE_CLASSES = Object.freeze(['initial', 'major', 'minor', 'patch'] as const);
export type PolicyChangeClass = (typeof POLICY_CHANGE_CLASSES)[number];

/** policy_documents.key: the rows seeded in 20261002020000 (the column itself is a regex CHECK) */
export const POLICY_DOCUMENT_KEYS = Object.freeze([
  'terms',
  'privacy',
  'health-privacy',
  'sensitive-data',
  'ai-processing',
  'analytics',
  'auto-renewal-terms',
  'contributor-notice',
  'backup-recovery',
  'subprocessors',
  'pledge',
  'accessibility',
  'legal-process',
] as const);
export type PolicyDocumentKey = (typeof POLICY_DOCUMENT_KEYS)[number];

/** record_policy_act(p_context): allowlisted keys (anything else raises 22023) */
export const POLICY_CONTEXT_KEYS = Object.freeze([
  'auth',
  'age_attested',
  'age_signal',
  'scope',
  'crash',
  'usage',
  'product',
  'intro_offer',
  'storefront',
  'mode',
] as const);
export type PolicyContextKey = (typeof POLICY_CONTEXT_KEYS)[number];

/** Narrow an unknown string to a member of one of the sets above. */
export function isOneOf<T extends string>(set: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (set as readonly string[]).includes(value);
}
