/**
 * What each parent of a shared book can see and do at v1.0 (F11 section 6.2,
 * table "What each parent can see and do"; WP-F11-03). Pure: the screens ask
 * `canDo` before they offer a control, and the tests check the matrix row for
 * row against the spec table (test/family-rules.test.ts).
 *
 * The server is the authority (RLS and the RPCs in supabase/migrations); this
 * table only decides what the app offers, so the app never shows a control
 * the server would refuse.
 *
 * `whose` is the subject of the action seen from the person acting: `own`
 * (their letter, their invite, their settings) or `other` (the other
 * parent's). Book-level actions (settings, invite, leave, delete) are the
 * same for both parents, because parents are equals (F11 D1, B F8).
 */

/** At most two parents per book (D-069, F11 D2). The server enforces it with SCCAP. */
export const MAX_PARENTS_PER_BOOK = 2;
/** The parent whose invite was used can undo the join for 72 hours (F11 D3; Q2 owns the number). */
export const UNDO_JOIN_HOURS = 72;

export const FAMILY_ACTIONS = [
  'write_letter',
  'private_letter_read',
  'private_letter_change',
  'private_letter_delete',
  'book_letter_read',
  'book_letter_change',
  'book_letter_take_out',
  'book_letter_delete',
  'working_material_read',
  'recording_play',
  'book_settings_change',
  'book_delete',
  'invite_coparent',
  'invite_cancel',
  'parent_remove',
  'leave',
  'export',
  'person_settings_change',
] as const;
export type FamilyAction = (typeof FAMILY_ACTIONS)[number];

export type Whose = 'own' | 'other';

/** Yes always, no always, or yes only when the book's state allows it (see `canDo`). */
export type Allowed = 'yes' | 'no' | 'when';

export interface FamilyRule {
  action: FamilyAction;
  own: Allowed;
  other: Allowed;
  /** The F11 table row this rule comes from, word for word as the row label. */
  row: string;
}

/**
 * F11 6.2, one rule per action. `own` is the author parent's column, `other`
 * the other parent's column. Rows the table states for both parents with
 * "Same" have the same value in both columns.
 */
export const FAMILY_MATRIX: readonly FamilyRule[] = [
  { action: 'write_letter', own: 'yes', other: 'yes', row: 'Write letters to {child}' },
  // Own private letters: the author reads, changes and deletes them; the other parent never sees them (B-REQ-011).
  { action: 'private_letter_read', own: 'yes', other: 'no', row: 'Own private letters' },
  { action: 'private_letter_change', own: 'yes', other: 'no', row: 'Own private letters' },
  { action: 'private_letter_delete', own: 'yes', other: 'no', row: 'Own private letters' },
  // Own letters in the book: the author reads, changes, takes out and deletes; the other parent reads text, signature, provenance, date.
  { action: 'book_letter_read', own: 'yes', other: 'yes', row: 'Own letters in the book' },
  { action: 'book_letter_change', own: 'yes', other: 'no', row: 'Own letters in the book' },
  { action: 'book_letter_take_out', own: 'yes', other: 'no', row: 'Own letters in the book' },
  { action: 'book_letter_delete', own: 'yes', other: 'no', row: 'Own letters in the book' },
  { action: 'working_material_read', own: 'yes', other: 'no', row: 'Raw transcript, machine edits, STT metadata, edit history, conflict notes' },
  // The other parent's recordings never reach this phone at v1.0 (DR-07, D-073): "Recording kept on {signsAs}'s phone".
  { action: 'recording_play', own: 'yes', other: 'no', row: 'Recording and listening copy' },
  { action: 'book_settings_change', own: 'yes', other: 'yes', row: 'Book settings: name, nickname, birthday or due date, photo, look, hide' },
  { action: 'book_delete', own: 'when', other: 'when', row: 'Delete the book' },
  { action: 'invite_coparent', own: 'when', other: 'when', row: 'Invite a co-parent' },
  { action: 'invite_cancel', own: 'yes', other: 'yes', row: 'Cancel a pending invite' },
  { action: 'parent_remove', own: 'when', other: 'when', row: 'Remove the other parent' },
  { action: 'leave', own: 'when', other: 'when', row: 'Leave' },
  // Export: own letters and recordings only (LEGAL-REQ-034); the PDF book is F15's call.
  { action: 'export', own: 'yes', other: 'no', row: 'Export' },
  { action: 'person_settings_change', own: 'yes', other: 'no', row: 'Per-person settings (signature, reminders, celebrations, co-parent letter notifications)' },
];

const RULES = new Map<FamilyAction, FamilyRule>(FAMILY_MATRIX.map((r) => [r.action, r]));

export interface BookState {
  /** Parents of the book right now (1 or 2 at v1.0). */
  parents: number;
  /**
   * When the other parent joined through an invite this person made, or null
   * (they joined through the other's invite, or this person started the book
   * alone). Only this opens the 72-hour undo (F11 D3).
   */
  otherJoinedViaMyInviteAt?: string | null;
  /** Epoch ms; needed only for `parent_remove`. */
  now?: number;
}

/** True within 72 hours of a join through this person's own invite (F11 D3, F11-REQ-008). */
export function canUndoJoin(book: BookState): boolean {
  if (!book.otherJoinedViaMyInviteAt || book.now === undefined) return false;
  const at = Date.parse(book.otherJoinedViaMyInviteAt);
  if (Number.isNaN(at) || book.now < at) return false;
  return book.now - at < UNDO_JOIN_HOURS * 60 * 60 * 1000;
}

function when(action: FamilyAction, book: BookState): boolean {
  switch (action) {
    // Only a sole parent deletes the book; with a co-parent, "delete" means leave and take own letters out (F11-REQ-080).
    case 'book_delete':
      return book.parents <= 1;
    // While the book has one parent (B-REQ-007, D2).
    case 'invite_coparent':
      return book.parents < MAX_PARENTS_PER_BOOK;
    // Within 72 hours of a join through own invite; after that only support (F11-REQ-008, F11-REQ-012).
    case 'parent_remove':
      return book.parents >= 2 && canUndoJoin(book);
    // The last parent of a live book cannot leave (SCLPG); the app offers Delete instead (DATA-REQ-016, F11-REQ-011).
    case 'leave':
      return book.parents >= 2;
    default:
      return false;
  }
}

/** Whether the app offers `action` on something that is `whose`, in a book in `book`'s state. */
export function canDo(whose: Whose, action: FamilyAction, book: BookState): boolean {
  const rule = RULES.get(action);
  if (!rule) return false;
  const v = whose === 'own' ? rule.own : rule.other;
  if (v === 'yes') return true;
  if (v === 'no') return false;
  return when(action, book);
}

/**
 * What "Delete the book" does for this person (`request_book_deletion`'s two
 * outcomes, F11-REQ-080): a sole parent deletes it; with a co-parent it
 * becomes leaving and taking own letters out, and the other parent keeps the
 * book and their letters.
 */
export function bookDeleteOutcome(book: BookState): 'delete_book' | 'left_and_removed_own_letters' {
  return book.parents <= 1 ? 'delete_book' : 'left_and_removed_own_letters';
}

/** The leave sheet's two equal choices (F11 6.2 D, F11-REQ-028). */
export type LeaveChoice = 'keep_in_book' | 'take_out';

/** Continue stays disabled until one choice is made; nothing is preselected (R4 PT-14). */
export function leaveContinueEnabled(choice: LeaveChoice | null): boolean {
  return choice === 'keep_in_book' || choice === 'take_out';
}

/** The `p_keep_in_book` argument of `leave_child` for a choice. */
export function keepInBookFor(choice: LeaveChoice): boolean {
  return choice === 'keep_in_book';
}

/**
 * The other parent's Plus never covers this phone at v1.0 (F11-REQ-017,
 * DR-03, D-080): no server tells one parent that the other pays, so the plan
 * rules always receive `coveredByOtherParent: false`. Plus reaches a co-parent
 * only through Apple Family Sharing, which StoreKit reports on its own.
 */
export function coParentPlanCover(): { coveredByOtherParent: false } {
  return { coveredByOtherParent: false };
}
