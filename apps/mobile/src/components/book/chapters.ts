import { ageLabel, ageOn, chapterOf } from '@scribe/core';
import { copy, fill } from '@/lib/copy';
import type { Child, Entry } from '@/lib/store';
import { authorOf } from '@/components/child/child-store';

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

/** Chapters newest first; entries inside newest first (the store already orders them). */
export function groupChapters(entries: BookEntry[], child: Child): Chapter[] {
  const byKey = new Map<string, Chapter>();
  for (const e of entries) {
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
    const n = ch.data.length;
    ch.countLine = n === 1 ? copy.book.chapterSubtitleOne : fill(copy.book.chapterSubtitle, { count: n });
    const authors = [...new Set(ch.data.map((e) => authorOf(e, child)))];
    ch.fromLine = fill(copy.book.signature, { signsAs: authors.join(', ') });
  }
  return chapters;
}

const SHORT_DATE: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };

/** Card dateline: "TUESDAY 29 SEPTEMBER · 16 MONTHS AND 1 WEEK". */
export function shortDateline(child: Child, onISO: string): string {
  const [y, m, d] = onISO.split('-').map(Number);
  const date = new Date(y, m - 1, d).toLocaleDateString(undefined, SHORT_DATE);
  if (!child.birthday) return date.toUpperCase();
  const age = ageOn(child.birthday, onISO);
  return age.days < 0 ? date.toUpperCase() : `${date} · ${ageLabel(age)}`.toUpperCase();
}

export type Provenance = 'spokenTidied' | 'spokenExact' | 'typed';

export function provenanceOf(e: Entry): Provenance {
  if (e.captureMode === 'typed') return 'typed';
  if (e.editLevel === 'verbatim' || e.machineEdits.length === 0 || e.finalText === e.rawTranscript) return 'spokenExact';
  return 'spokenTidied';
}
