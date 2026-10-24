/**
 * Who may do what in a shared book (PRD V2 F11 section 6.2, "What each parent can see and do
 * (v1.0)"; decisions D1 to D4; D-069; WP-F11-03). One function, `canDo`, that the screens use to
 * decide what to offer and the tests use to pin the table. The server enforces every rule on its
 * own (RLS and the membership functions); this file never grants anything the server would refuse.
 *
 * Letter rules come in pairs: `..._own` for a letter the viewer wrote, `..._others` for one the
 * other parent wrote. Book rules depend on how many parents the book has.
 *
 * Family contributors are absent from the v1.0 build (B1, D4): every action is refused for them
 * here, and the server refuses the role while `contributors_enabled` is off.
 *
 * Pure: no clock (pass `now`), no store, no platform API.
 */
import { undoJoinOpen } from './invite';

export type FamilyRole = 'parent' | 'contributor';

export const FAMILY_ACTIONS = [
  'write_letter',
  // A private letter (never added to the book).
  'read_private_own',
  'edit_private_own',
  'delete_private_own',
  'read_private_others',
  // A letter in the book.
  'read_in_book_own',
  'edit_in_book_own',
  'take_out_of_book_own',
  'delete_in_book_own',
  'read_in_book_others',
  'edit_others',
  'delete_others',
  'take_out_of_book_others',
  // Raw transcript, machine edits, speech metadata, edit history, conflict notes (K-09).
  'read_working_material_own',
  'read_working_material_others',
  // The recording and its listening copy (D-073, DR-07).
  'play_recording_own',
  'play_recording_others',
  // The book.
  'edit_book_settings',
  'delete_book',
  'invite_coparent',
  'cancel_invite',
  'undo_join',
  'remove_other_parent',
  'leave_book',
  'export_own',
  'edit_person_settings_own',
  'edit_person_settings_others',
] as const;
export type FamilyAction = (typeof FAMILY_ACTIONS)[number];

/** At most two parents per book (D-069, D2). The server's `app.max_parents_per_book` wins. */
export const DEFAULT_MAX_PARENTS_PER_BOOK = 2;

export interface BookState {
  /** Parents of the book now, the viewer included. A book only on this phone has 1. */
  parents: number;
  /** Defaults to DEFAULT_MAX_PARENTS_PER_BOOK. */
  maxParents?: number;
  /**
   * For `undo_join`: the other parent's join, when it came through an invite. `invitedByViewer`
   * is true when the viewer made that invite.
   */
  join?: { invitedByViewer: boolean; joinedAt: string } | null;
  /** ISO time, needed for `undo_join` only. */
  now?: string;
}

/** True when no further parent can join (D2). */
export function bookIsFull(book: Pick<BookState, 'parents' | 'maxParents'>): boolean {
  return book.parents >= (book.maxParents ?? DEFAULT_MAX_PARENTS_PER_BOOK);
}

/** Always allowed for a parent, whatever the book (F11 6.2 rows that say Yes and Yes). */
const PARENT_ALWAYS: ReadonlySet<FamilyAction> = new Set<FamilyAction>([
  'write_letter',
  'read_private_own',
  'edit_private_own',
  'delete_private_own',
  'read_in_book_own',
  'edit_in_book_own',
  'take_out_of_book_own',
  'delete_in_book_own',
  'read_in_book_others',
  'read_working_material_own',
  'play_recording_own',
  'edit_book_settings',
  'cancel_invite',
  'export_own',
  'edit_person_settings_own',
]);

/**
 * Never, for anyone, from the app or the API (K-09, K-10, DATA-REQ-015, D-073, B F8).
 * Removing the other parent after the undo window goes through the support runbook only (F11-REQ-012).
 */
const NEVER: ReadonlySet<FamilyAction> = new Set<FamilyAction>([
  'read_private_others',
  'edit_others',
  'delete_others',
  'take_out_of_book_others',
  'read_working_material_others',
  'play_recording_others',
  'remove_other_parent',
  'edit_person_settings_others',
]);

/** May this person do this in this book? Total: an unknown action is refused. */
export function canDo(role: FamilyRole, action: FamilyAction, book: BookState): boolean {
  if (role !== 'parent') return false; // contributors: absent from v1.0 (B1, D4)
  if (NEVER.has(action)) return false;
  if (PARENT_ALWAYS.has(action)) return true;
  switch (action) {
    case 'delete_book':
      // Only a sole parent deletes the book; with a co-parent, "delete" means leave and take own letters out (F11-REQ-080).
      return book.parents <= 1;
    case 'invite_coparent':
      return !bookIsFull(book);
    case 'leave_book':
      // A sole parent cannot leave (SCLPG); they delete the book instead (DATA-REQ-016).
      return book.parents >= 2;
    case 'undo_join':
      // Only the parent whose invite was used, inside 72 hours of that join (D3, F11-REQ-008).
      return !!book.join && book.join.invitedByViewer && !!book.now && undoJoinOpen(book.join.joinedAt, book.now);
    default:
      return false;
  }
}

/** What "Delete the book" does here (F11 6.2 table; `request_book_deletion`). */
export function deleteBookOutcome(book: Pick<BookState, 'parents'>): 'delete_book' | 'leave_and_remove_own_letters' {
  return book.parents <= 1 ? 'delete_book' : 'leave_and_remove_own_letters';
}

/**
 * The book context for the Plus engine (`plan.ts` `DecideInput.book`). Plus reaches a co-parent
 * only through Apple Family Sharing, which shows up as their own entitlement; the app never
 * assumes the other parent's Plus (DR-03, D-080, F11-REQ-017). So a book is never "covered by
 * the other parent" in v1.0, whatever the book holds.
 */
export function bookPlanContext(): { coveredByOtherParent: false } {
  return { coveredByOtherParent: false };
}
