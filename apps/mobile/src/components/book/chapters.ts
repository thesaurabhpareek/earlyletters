import { ageOn, chapterOf } from '@scribe/core';
import { copy, fill, pendingCopy } from '@/lib/copy';
import { ageText, dayDate } from '@/lib/dates';
import type { Child, Entry } from '@/lib/store';
import { authorOf } from '@/components/child/child-store';
import { isQuietMark, visibleInBook } from './quiet-day.logic';

type BookEntry = Entry;

export interface Chapter {
  key: string;
  /** Month of age (0 = the first weeks); null = Before You. */
  month: number | null;
  title: string;
  countLine: string;
  fromLine: string;
  data: BookEntry[];
}

/** Month-of-age chapter for a date, or null when it falls before birth (or birth is unknown). */
export function monthFor(child: Child, onISO: string): number | null {
  if (!child.birthday) return null;
  if (ageOn(child.birthday, onISO).days < 0) return null;
  return chapterOf(child.birthday, onISO);
}

export function chapterTitle(month: number | null): string {
  if (month === null) return copy.book.beforeYouChapter;
  if (month === 0) return copy.book.chapterNewborn;
  return fill(copy.book.chapterTitle, { month });
}

/**
 * Chapters newest first; entries inside newest first (the store already orders them).
 * A quiet-day mark is listed (as a small row) unless that day has a letter; it never enters a
 * count or the "From" line (D-084).
 */
export function groupChapters(entries: BookEntry[], child: Child): Chapter[] {
  const byKey = new Map<string, Chapter>();
  for (const e of visibleInBook(entries)) {
    const month = monthFor(child, e.occurredOn);
    const key = month === null ? 'before' : `m${month}`;
    let ch = byKey.get(key);
    if (!ch) {
      ch = { key, month, title: chapterTitle(month), countLine: '', fromLine: '', data: [] };
      byKey.set(key, ch);
    }
    ch.data.push(e);
  }
  const chapters = [...byKey.values()].sort((a, b) => (b.month ?? -1) - (a.month ?? -1));
  for (const ch of chapters) {
    ch.countLine = countLine(ch.data);
    // A chapter of only quiet days says nothing about who wrote: there is nothing written.
    const authors = [...new Set(ch.data.filter((e) => !isQuietMark(e)).map((e) => authorOf(e, child)))];
    ch.fromLine = authors.length ? fill(copy.book.signature, { signsAs: authors.join(', ') }) : '';
  }
  return chapters;
}

/** "3 letters", "1 note", "2 letters and 1 note": only the kinds that exist. Quiet days are never counted; none left gives ''. */
export function countLine(all: BookEntry[]): string {
  const p = pendingCopy.book;
  const entries = all.filter((e) => !isQuietMark(e));
  if (entries.length === 0) return '';
  const letters = entries.filter((e) => e.kind === 'letter').length;
  const notes = entries.length - letters;
  const l = letters === 1 ? p.letterOne : fill(p.letters, { count: letters });
  const n = notes === 1 ? p.noteOne : fill(p.notes, { count: notes });
  if (letters && notes) return fill(p.lettersAndNotes, { letters: l, notes: n });
  return notes ? n : l;
}

/**
 * Card dateline: "Tuesday, September 29, 2026" (one format everywhere, lib/dates). Shown in
 * caps through the Text `caps` style, never .toUpperCase(), so VoiceOver reads words
 * (TDD 09 A11Y-F13). The chapter already names the month of age.
 */
export function shortDateline(_child: Child, onISO: string): string {
  return dayDate(onISO);
}

/** Spoken form for VoiceOver: "Tuesday, 29 September 2026, 7 months and 1 week". */
export function datelineA11y(child: Child, onISO: string): string {
  const age = ageText(child, onISO);
  return age ? `${dayDate(onISO)}, ${age}` : dayDate(onISO);
}

export type Provenance = 'spokenTidied' | 'spokenExact' | 'typed';

export function provenanceOf(e: Entry): Provenance {
  if (e.captureMode === 'typed') return 'typed';
  if (e.editLevel === 'verbatim' || e.machineEdits.length === 0 || e.finalText === e.rawTranscript) return 'spokenExact';
  return 'spokenTidied';
}
