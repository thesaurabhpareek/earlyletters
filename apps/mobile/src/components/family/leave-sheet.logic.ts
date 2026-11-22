/**
 * The leave sheet's presentation (EXPERIENCE_PASS_2026-10 S60; F11-REQ-011, -027, -028; R4 PT-14, PT-15), pure so it
 * is tested in Node (test/leave-sheet.test.ts). Who can leave stays S04's (lib/family/members.logic.ts canLeave) and
 * the server's (SCLPG, DATA-REQ-016).
 *
 * Build 2 offers no Leave (D-113, lib/family/entry.logic.ts LEAVE_BOOK_OFFERED): /invite/leave answers coming soon
 * and nothing links to the sheet. The sheet is kept, built to the spec, for when left books are listed (BL-444).
 *
 *  - Two equal choices, nothing chosen on arrival; "Leave the book" stays in the outline style and cannot be
 *    tapped until one is chosen, then takes the quiet destructive style.
 *  - The only parent of a book sees `last_parent` and no Leave.
 */
import { familyCopy } from '@scribe/content';
import { renderTemplate } from '@scribe/core';

export type LeaveChoice = 'keep' | 'take_out';

export type LeaveSheetView = 'missing' | 'lastParent' | 'choose' | 'left';

export function leaveSheetView(i: { hasBook: boolean; canLeave: boolean; left: boolean }): LeaveSheetView {
  if (!i.hasBook) return 'missing';
  if (i.left) return 'left';
  return i.canLeave ? 'choose' : 'lastParent';
}

/** The two choices, in this order, each with what follows from it (R4 PT-15). */
export function leaveChoices(coParent: string): { value: LeaveChoice; label: string; help: string }[] {
  const l = familyCopy.leave;
  return [
    { value: 'keep', label: l.keep, help: renderTemplate(l.keepHelp, { coParent }) },
    { value: 'take_out', label: l.takeOut, help: l.takeOutHelp },
  ];
}

/** "Leave the book": disabled and in the outline style until a choice is made, and while the leave runs. */
export function leaveButton(choice: LeaveChoice | null, busy: boolean): { enabled: boolean; variant: 'outline' | 'destructive' } {
  const chosen = choice !== null;
  return { enabled: chosen && !busy, variant: chosen ? 'destructive' : 'outline' };
}
