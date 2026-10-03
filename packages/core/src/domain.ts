/**
 * Shared domain enums (CORE-02). One source for the value sets that the
 * database CHECK constraints, the device store and analytics all use.
 *
 * Each set is a frozen const array plus a union type derived from it, so a
 * caller can both validate at runtime (`isDomainValue`) and narrow at compile
 * time. A test in packages/analytics parses the migration CHECK constraints
 * and fails if a server-backed set here drifts from the database.
 *
 * Server-backed (CHECK constraint in supabase/migrations):
 *   ENTRY_KINDS, CAPTURE_MODES, EDIT_LEVELS, MEMBER_ROLES, APPROVALS,
 *   PLAN_STATES (minus 'none', which means "no subscription row").
 * Device-only (no server column): TRANSCRIPT_STATUSES, DRAFT_STATES.
 * Product-only: OFFER_TRIGGERS.
 *
 * `EditLevel` (types.ts) and `OfferTrigger` (plan.ts) already exist as
 * types; the arrays below are pinned to them by compile-time equality checks
 * instead of redeclaring the names.
 */
import type { OfferTrigger, PlanView } from './plan';
import type { EditLevel } from './types';

/** entries.kind. In the UI every kind is a "letter". */
export const ENTRY_KINDS = Object.freeze(['note', 'letter', 'not_much'] as const);
export type EntryKind = (typeof ENTRY_KINDS)[number];

/** entries.capture_mode. `mixed` is a spoken letter later edited by typing. */
export const CAPTURE_MODES = Object.freeze(['spoken', 'typed', 'mixed'] as const);
export type CaptureMode = (typeof CAPTURE_MODES)[number];

/** entries.edit_level. Same values as `EditLevel` in types.ts. */
export const EDIT_LEVELS = Object.freeze(['clean', 'verbatim'] as const);

/**
 * child_members.role and child_invites.role. The UI says "Co-parent" for
 * `parent` and "Family" for `contributor`; code and analytics use these.
 */
export const MEMBER_ROLES = Object.freeze(['parent', 'contributor'] as const);
export type MemberRole = (typeof MEMBER_ROLES)[number];

/** entries.approval: family review state (B F9). Server-owned. */
export const APPROVALS = Object.freeze(['not_needed', 'pending', 'added', 'set_aside'] as const);
export type Approval = (typeof APPROVALS)[number];

/**
 * Device entries.transcript_status. Only `waiting` (audio saved, words not
 * yet transcribed) is stored; no status is represented as null.
 */
export const TRANSCRIPT_STATUSES = Object.freeze(['waiting'] as const);
export type TranscriptStatus = (typeof TRANSCRIPT_STATUSES)[number];

/** Device drafts.state. */
export const DRAFT_STATES = Object.freeze(['recording', 'ready', 'unrecoverable'] as const);
export type DraftState = (typeof DRAFT_STATES)[number];

/**
 * Plus state as the device sees it (`PlanView['state']`). Under founder
 * decision 3 the device decides Plus from StoreKit; while the pending
 * migrations still define store_subscriptions, every value but `none` is also
 * its status.
 */
export const PLAN_STATES = Object.freeze([
  'none',
  'trial',
  'active',
  'grace',
  'billing_retry',
  'expired',
  'refunded',
  'revoked',
] as const);
export type PlanState = (typeof PLAN_STATES)[number];

/** Why a Plus offer was shown. Same values as `OfferTrigger` in plan.ts. */
export const OFFER_TRIGGERS = Object.freeze([
  'second_child',
  'read_together',
  'backup',
  'themes',
  'chapter_complete',
  'settings',
] as const);

/** Runtime membership check for any of the sets above. */
export function isDomainValue<T extends string>(set: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (set as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Compile-time pins: the build breaks if an array and its existing type differ.
// ---------------------------------------------------------------------------

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const PINS: [
  Same<(typeof EDIT_LEVELS)[number], EditLevel>,
  Same<(typeof OFFER_TRIGGERS)[number], OfferTrigger>,
  Same<PlanState, PlanView['state']>,
] = [true, true, true];
void PINS;
