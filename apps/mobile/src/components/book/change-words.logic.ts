/**
 * "Change words" on a saved letter's page (BL-413). The person's changes are author edits against the words as kept
 * (store letterAuthorEdits); each has its own row and its own Put it back. This file names a change for its row and
 * says when the page offers the control. Display only: it never writes words. Pure; tested in
 * test/letter-change-words.test.ts.
 */
import type { AuthorEdit } from '@scribe/core';

/** What one change read as kept, and what it reads now: the row says "{from} to {to}". */
export interface ChangeRow {
  from: string;
  to: string;
}

const WORD_BEFORE = /(\S+\s*)$/;
const WORD_AFTER = /^(\s*\S+)/;

/**
 * The row for one change. A change that only added words or only took words out, or one that reads the same once
 * trimmed (a line break), names the word on each side of it too, so neither side of the row is ever empty and the
 * two never read alike. Only the words as kept and the change's own replacement are shown: nothing is made up.
 */
export function changeRow(base: string, edit: AuthorEdit): ChangeRow {
  const from = base.slice(edit.start, edit.end).trim();
  const to = edit.replacement.trim();
  if (from && to && from !== to) return { from, to };
  const before = base.slice(0, edit.start).match(WORD_BEFORE)?.[1] ?? '';
  const after = base.slice(edit.end).match(WORD_AFTER)?.[1] ?? '';
  return {
    from: (before + base.slice(edit.start, edit.end) + after).trim(),
    to: (before + edit.replacement + after).trim(),
  };
}

/**
 * Whether the page offers "Change words": the person's own letter in a book this phone has not left, with words on the
 * page, and the store would take the change (`canChange`: read, not waiting for Review, not a quiet-day mark).
 * Words waiting for review are read and kept in Review first; that card stays the only way in until then.
 */
export function offersChangeWords(input: { editable: boolean; hasWords: boolean; canChange: boolean }): boolean {
  return input.editable && input.hasWords && input.canChange;
}
