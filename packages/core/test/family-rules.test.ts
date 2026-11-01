/**
 * Who may do what in a shared book (PRD V2 F11 section 6.2; WP-F11-03). The table below is the
 * spec's "What each parent can see and do (v1.0)" written out row by row: one column for the
 * author parent (the viewer wrote the letter) and one for the other parent. `canDo` must equal it.
 */
import { describe, expect, it } from 'vitest';
import { decide, NO_PLAN, type PlanView } from '../src/plan';
import {
  bookIsFull,
  bookPlanContext,
  canDo,
  DEFAULT_MAX_PARENTS_PER_BOOK,
  deleteBookOutcome,
  FAMILY_ACTIONS,
  type BookState,
  type FamilyAction,
} from '../src/family-rules';

const SOLE: BookState = { parents: 1 };
const SHARED: BookState = { parents: 2 };

/**
 * F11 6.2, one row per line of the spec table. `author` and `other` are what each column says,
 * as actions: for letter rows the author column is the `_own` action and the other-parent column
 * the `_others` one; book rows are the same for both columns.
 */
const TABLE: { row: string; author: [FamilyAction, boolean][]; other: [FamilyAction, boolean][] }[] = [
  { row: 'Write letters to {child}: Yes, Yes', author: [['write_letter', true]], other: [['write_letter', true]] },
  {
    row: 'Own private letters: read, edit, delete; never sees them',
    author: [['read_private_own', true], ['edit_private_own', true], ['delete_private_own', true]],
    other: [['read_private_others', false]],
  },
  {
    row: 'Own letters in the book: read, edit, take out, delete; reads text, signature, provenance, date',
    author: [['read_in_book_own', true], ['edit_in_book_own', true], ['take_out_of_book_own', true], ['delete_in_book_own', true]],
    other: [['read_in_book_others', true], ['take_out_of_book_others', false]],
  },
  {
    row: 'Raw transcript, machine edits, speech metadata, edit history, conflict notes: author only; never',
    author: [['read_working_material_own', true]],
    other: [['read_working_material_others', false]],
  },
  {
    row: 'Recording and listening copy: on the author\'s phone; "Recording kept on {signsAs}\'s phone"',
    author: [['play_recording_own', true]],
    other: [['play_recording_others', false]],
  },
  {
    row: 'Edit or delete the other parent\'s words: n/a; never',
    author: [],
    other: [['edit_others', false], ['delete_others', false]],
  },
  { row: 'Book settings: edit, edit', author: [['edit_book_settings', true]], other: [['edit_book_settings', true]] },
  { row: 'Cancel a pending invite: yes, yes', author: [['cancel_invite', true]], other: [['cancel_invite', true]] },
  { row: 'Export: own letters and recordings, same', author: [['export_own', true]], other: [['export_own', true]] },
  {
    row: 'Per-person settings: own only, own only',
    author: [['edit_person_settings_own', true], ['edit_person_settings_others', false]],
    other: [['edit_person_settings_own', true], ['edit_person_settings_others', false]],
  },
];

describe('canDo equals the F11 6.2 table', () => {
  for (const t of TABLE) {
    it(`[F11-REQ-009] ${t.row}`, () => {
      for (const book of [SOLE, SHARED]) {
        for (const [action, want] of [...t.author, ...t.other]) expect(canDo('parent', action, book), `${action} with ${book.parents} parent(s)`).toBe(want);
      }
    });
  }

  it('the table covers every action except the book rows tested below', () => {
    const inTable = new Set(TABLE.flatMap((t) => [...t.author, ...t.other].map(([a]) => a)));
    const bookRows: FamilyAction[] = ['delete_book', 'invite_coparent', 'undo_join', 'remove_other_parent', 'leave_book'];
    expect([...FAMILY_ACTIONS].filter((a) => !inTable.has(a)).sort()).toEqual([...bookRows].sort());
  });

  it('[F11-REQ-080] delete the book: only a sole parent; with a co-parent it means leave and take own letters out', () => {
    expect(canDo('parent', 'delete_book', SOLE)).toBe(true);
    expect(canDo('parent', 'delete_book', SHARED)).toBe(false);
    expect(deleteBookOutcome(SOLE)).toBe('delete_book');
    expect(deleteBookOutcome(SHARED)).toBe('leave_and_remove_own_letters');
  });

  it('[F11-REQ-004] invite a co-parent: yes while the book has one parent, never into a full book', () => {
    expect(DEFAULT_MAX_PARENTS_PER_BOOK).toBe(2);
    expect(canDo('parent', 'invite_coparent', SOLE)).toBe(true);
    expect(canDo('parent', 'invite_coparent', SHARED)).toBe(false);
    expect(bookIsFull(SHARED)).toBe(true);
    expect(bookIsFull(SOLE)).toBe(false);
    // The server's setting wins (support can raise it, D2); the app follows what it is told.
    expect(canDo('parent', 'invite_coparent', { parents: 2, maxParents: 3 })).toBe(true);
    expect(bookIsFull({ parents: 3, maxParents: 3 })).toBe(true);
  });

  it('[F11-REQ-011] [DATA-REQ-016] leave: with a co-parent, yes; a sole parent cannot leave (they delete instead)', () => {
    expect(canDo('parent', 'leave_book', SHARED)).toBe(true);
    expect(canDo('parent', 'leave_book', SOLE)).toBe(false);
  });

  it('[F11-REQ-008] undo a join: only the parent whose invite was used, inside 72 hours', () => {
    const joinedAt = '2026-10-15T20:00:00.000Z';
    const mine = (now: string): BookState => ({ parents: 2, join: { invitedByViewer: true, joinedAt }, now });
    expect(canDo('parent', 'undo_join', mine('2026-10-18T19:00:00.000Z'))).toBe(true); // T+71h
    expect(canDo('parent', 'undo_join', mine('2026-10-18T21:00:00.000Z'))).toBe(false); // T+73h
    expect(canDo('parent', 'undo_join', { parents: 2, join: { invitedByViewer: false, joinedAt }, now: '2026-10-16T00:00:00.000Z' })).toBe(false);
    expect(canDo('parent', 'undo_join', { parents: 2, join: null, now: '2026-10-16T00:00:00.000Z' })).toBe(false);
    expect(canDo('parent', 'undo_join', { parents: 2, join: { invitedByViewer: true, joinedAt } })).toBe(false); // no clock, no offer
  });

  it('[F11-REQ-012] [B-REQ-010] removing the other parent is never a client action (support runbook only)', () => {
    for (const book of [SOLE, SHARED, { parents: 2, join: { invitedByViewer: true, joinedAt: '2026-10-15T20:00:00.000Z' }, now: '2026-10-15T21:00:00.000Z' }]) {
      expect(canDo('parent', 'remove_other_parent', book)).toBe(false);
    }
  });

  it('[F11-REQ-003] family contributors are absent from v1.0: nothing is offered to them', () => {
    for (const action of FAMILY_ACTIONS) {
      expect(canDo('contributor', action, SOLE), action).toBe(false);
      expect(canDo('contributor', action, SHARED), action).toBe(false);
    }
  });

  it('[F11-REQ-082] [K-10] nobody edits or deletes another person\'s words, in any book', () => {
    for (const book of [SOLE, SHARED, { parents: 3, maxParents: 3 }]) {
      for (const action of ['edit_others', 'delete_others', 'take_out_of_book_others'] as const) expect(canDo('parent', action, book)).toBe(false);
    }
  });

  it('refuses an action it does not know', () => {
    expect(canDo('parent', 'publish_book' as FamilyAction, SHARED)).toBe(false);
  });
});

describe('Plus and the other parent (DR-03, D-080)', () => {
  const NOW = '2026-10-15T09:00:00.000Z';
  const base = { now: NOW, surface: 'normal' as const, isBirthday: false, signedIn: true, online: true };

  it('[F11-REQ-017] a co-parent outside the payer\'s Apple Family is Free: the book is never covered by the other parent', () => {
    expect(bookPlanContext()).toEqual({ coveredByOtherParent: false });
    const coParent = { roleInBook: 'parent' as const, own: NO_PLAN };
    expect(decide({ ...base, feature: 'theme_extra', viewer: coParent, book: bookPlanContext() })).toEqual({ kind: 'offer', trigger: 'themes', needsSignIn: false });
  });

  it('[F11-REQ-017] Plus that reaches the co-parent through Family Sharing is their own entitlement', () => {
    const shared: PlanView = { state: 'active', effectiveUntil: '2027-10-15T09:00:00.000Z', verifiedAt: NOW, environment: 'production', isTester: false };
    expect(decide({ ...base, feature: 'theme_extra', viewer: { roleInBook: 'parent', own: shared }, book: bookPlanContext() })).toEqual({ kind: 'allow', via: 'plus_own' });
  });
});
