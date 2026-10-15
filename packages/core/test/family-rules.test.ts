import { describe, expect, it } from 'vitest';
import {
  FAMILY_ACTIONS,
  FAMILY_MATRIX,
  MAX_PARENTS_PER_BOOK,
  UNDO_JOIN_HOURS,
  bookDeleteOutcome,
  canDo,
  canUndoJoin,
  coParentPlanCover,
  keepInBookFor,
  leaveContinueEnabled,
  type BookState,
  type FamilyAction,
} from '../src/family-rules';
import { NO_PLAN, decide } from '../src/plan';

const HOUR = 60 * 60 * 1000;
const JOIN = '2026-10-15T09:00:00.000Z';
const T = Date.parse(JOIN);
const SOLE: BookState = { parents: 1 };
const SHARED: BookState = { parents: 2 };

/**
 * F11 section 6.2, "What each parent can see and do (v1.0)", transcribed:
 * [action, author parent (own), other parent]. 'sole' = only as sole parent;
 * 'one' = while the book has one parent; '72h' = within 72 hours of a join
 * through own invite; 'two' = when there is another parent to stay with the book.
 */
const TABLE_6_2: ReadonlyArray<[FamilyAction, string, string]> = [
  ['write_letter', 'yes', 'yes'], // Write letters to {child}: Yes | Yes
  ['private_letter_read', 'yes', 'no'], // Own private letters: Read, edit, delete | Never sees them
  ['private_letter_change', 'yes', 'no'],
  ['private_letter_delete', 'yes', 'no'],
  ['book_letter_read', 'yes', 'yes'], // Own letters in the book: Read, edit, take out, delete | Reads text, signature, provenance, date
  ['book_letter_change', 'yes', 'no'],
  ['book_letter_take_out', 'yes', 'no'],
  ['book_letter_delete', 'yes', 'no'], // also: Edit or delete the other parent's words: Never
  ['working_material_read', 'yes', 'no'], // Raw transcript, machine edits, ...: Author only | Never
  ['recording_play', 'yes', 'no'], // Recording: on the author's phone | "Recording kept on {signsAs}'s phone"
  ['book_settings_change', 'yes', 'yes'], // Book settings: Edit | Edit
  ['book_delete', 'sole', 'sole'], // Delete the book: Only as sole parent | Same
  ['invite_coparent', 'one', 'one'], // Invite a co-parent: Yes, while the book has one parent | Same
  ['invite_cancel', 'yes', 'yes'], // Cancel a pending invite: Yes | Yes
  ['parent_remove', '72h', '72h'], // Remove the other parent: Only within 72 hours of a join through own invite | Same
  ['leave', 'two', 'two'], // Leave: Yes, keeping or taking out own letters | Same (sole parent: SCLPG, F11-REQ-011)
  ['export', 'yes', 'no'], // Export: Own letters and recordings | Same (each their own)
  ['person_settings_change', 'yes', 'no'], // Per-person settings: Own only | Own only
];

function expected(cell: string, book: BookState): boolean {
  switch (cell) {
    case 'yes':
      return true;
    case 'no':
      return false;
    case 'sole':
      return book.parents === 1;
    case 'one':
      return book.parents < 2;
    case 'two':
      return book.parents >= 2;
    case '72h':
      return book.parents >= 2 && canUndoJoin(book);
    default:
      throw new Error(cell);
  }
}

const STATES: BookState[] = [
  SOLE,
  SHARED,
  { parents: 2, otherJoinedViaMyInviteAt: JOIN, now: T + HOUR },
  { parents: 2, otherJoinedViaMyInviteAt: JOIN, now: T + 73 * HOUR },
  { parents: 2, otherJoinedViaMyInviteAt: null, now: T + HOUR },
];

describe('canDo equals F11 table 6.2 (WP-F11-03)', () => {
  it('[F11-REQ-009] the matrix has one rule per action and covers every row of the table', () => {
    expect(FAMILY_MATRIX.map((r) => r.action)).toEqual([...FAMILY_ACTIONS]);
    expect(TABLE_6_2.map((r) => r[0])).toEqual([...FAMILY_ACTIONS]);
  });

  it('[F11-REQ-009] every action, for both parents, in every book state, matches the table', () => {
    for (const [action, own, other] of TABLE_6_2) {
      for (const book of STATES) {
        expect(canDo('own', action, book), `${action} own ${JSON.stringify(book)}`).toBe(expected(own, book));
        expect(canDo('other', action, book), `${action} other ${JSON.stringify(book)}`).toBe(expected(other, book));
      }
    }
  });

  it("[F11-REQ-082] nobody changes or deletes the other parent's words", () => {
    for (const book of STATES) {
      for (const a of ['book_letter_change', 'book_letter_delete', 'book_letter_take_out', 'private_letter_change', 'private_letter_delete'] as const) {
        expect(canDo('other', a, book)).toBe(false);
      }
    }
  });

  it("[F11-REQ-085] working material is the author's only", () => {
    expect(canDo('own', 'working_material_read', SHARED)).toBe(true);
    expect(canDo('other', 'working_material_read', SHARED)).toBe(false);
  });

  it("[F11-REQ-015] the other parent's recording never plays on this phone", () => {
    expect(canDo('other', 'recording_play', SHARED)).toBe(false);
  });

  it('[F11-REQ-010] no approval between parents: the other parent reads a letter in the book', () => {
    expect(canDo('other', 'book_letter_read', SHARED)).toBe(true);
    expect(canDo('other', 'private_letter_read', SHARED)).toBe(false);
  });

  it('[F11-REQ-004] invites stop at two parents', () => {
    expect(MAX_PARENTS_PER_BOOK).toBe(2);
    expect(canDo('own', 'invite_coparent', SOLE)).toBe(true);
    expect(canDo('own', 'invite_coparent', SHARED)).toBe(false);
  });

  it('[F11-REQ-008] the undo is open to the parent whose invite was used, for 72 hours', () => {
    expect(UNDO_JOIN_HOURS).toBe(72);
    expect(canDo('own', 'parent_remove', { parents: 2, otherJoinedViaMyInviteAt: JOIN, now: T + 71 * HOUR })).toBe(true);
    expect(canDo('own', 'parent_remove', { parents: 2, otherJoinedViaMyInviteAt: JOIN, now: T + 73 * HOUR })).toBe(false);
    // The parent who joined through the other's invite never gets it.
    expect(canDo('own', 'parent_remove', { parents: 2, otherJoinedViaMyInviteAt: null, now: T + HOUR })).toBe(false);
    // A clock before the join, or no clock, never opens it.
    expect(canUndoJoin({ parents: 2, otherJoinedViaMyInviteAt: JOIN, now: T - HOUR })).toBe(false);
    expect(canUndoJoin({ parents: 2, otherJoinedViaMyInviteAt: JOIN })).toBe(false);
    expect(canUndoJoin({ parents: 2, otherJoinedViaMyInviteAt: 'garbage', now: T })).toBe(false);
  });

  it('[F11-REQ-012] after 72 hours no client path removes a parent', () => {
    for (const whose of ['own', 'other'] as const) expect(canDo(whose, 'parent_remove', { parents: 2, otherJoinedViaMyInviteAt: JOIN, now: T + 72 * HOUR })).toBe(false);
  });

  it('[F11-REQ-011] a sole parent cannot leave; they are offered Delete', () => {
    expect(canDo('own', 'leave', SOLE)).toBe(false);
    expect(canDo('own', 'book_delete', SOLE)).toBe(true);
    expect(canDo('own', 'leave', SHARED)).toBe(true);
    expect(canDo('own', 'book_delete', SHARED)).toBe(false);
  });

  it('[F11-REQ-080] delete with a co-parent means leave and take own letters out', () => {
    expect(bookDeleteOutcome(SOLE)).toBe('delete_book');
    expect(bookDeleteOutcome(SHARED)).toBe('left_and_removed_own_letters');
  });

  it('an unknown action is never allowed', () => {
    expect(canDo('own', 'fly' as FamilyAction, SHARED)).toBe(false);
  });
});

describe('the leave sheet (F11 6.2 D)', () => {
  it('[F11-REQ-028] nothing is preselected and Continue waits for a choice', () => {
    expect(leaveContinueEnabled(null)).toBe(false);
    expect(leaveContinueEnabled('keep_in_book')).toBe(true);
    expect(leaveContinueEnabled('take_out')).toBe(true);
  });

  it('[F11-REQ-011] maps the choice to leave_child(p_keep_in_book)', () => {
    expect(keepInBookFor('keep_in_book')).toBe(true);
    expect(keepInBookFor('take_out')).toBe(false);
  });
});

describe('Plus and the co-parent (DR-03)', () => {
  it("[F11-REQ-017] the app never assumes the other parent's Plus", () => {
    const cover = coParentPlanCover();
    expect(cover).toEqual({ coveredByOtherParent: false });
    const d = decide({
      now: '2026-10-15T09:00:00.000Z',
      feature: 'theme_extra',
      surface: 'normal',
      isBirthday: false,
      signedIn: true,
      viewer: { roleInBook: 'parent', own: NO_PLAN },
      book: cover,
    });
    expect(d.kind).not.toBe('allow');
  });
});
