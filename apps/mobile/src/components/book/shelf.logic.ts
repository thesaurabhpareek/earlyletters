/**
 * Recently deleted shelf rows (D-085). Pure and tested (shelf.logic.test.ts).
 *
 * A row shows the first words of the letter (so the person can tell which one
 * it is), the day it was deleted and the day it will be erased. The date of
 * erasure is the deletion time plus the shelf days, shown in the phone's own
 * day, never as a countdown (nothing here counts down or counts what is left).
 */
import { isoOf, longDate } from '../../lib/dates';
import { SHELF_DAYS } from '../../lib/shelf-days';
import type { Entry } from '../../lib/store';
import { letterWords } from './letter-words.logic';

export { SHELF_DAYS };

/** The first words of a letter, at most `max` characters, cut at a word and ended with a plain full stop-free trim. */
export function firstWords(text: string, max = 90): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const at = cut.lastIndexOf(' ');
  return (at > max / 2 ? cut.slice(0, at) : cut).trimEnd();
}

export interface ShelfRowView {
  id: string;
  /** First words, or null when there are none to show (waiting for words, or nobody spoke). */
  excerpt: string | null;
  /** 'waiting' | 'nobodySpoke' | 'words' */
  words: ReturnType<typeof letterWords>;
  /** "September 29, 2026": the day the letter is about. */
  letterDate: string;
  /** The day it was deleted, in the phone's local day. */
  deletedDate: string;
  /** The day the launch purge erases it. */
  erasesDate: string;
}

export function shelfRow(e: Entry & { deletedAt: string }, locale?: string): ShelfRowView {
  const words = letterWords(e);
  const erases = new Date(Date.parse(e.deletedAt) + SHELF_DAYS * 24 * 60 * 60 * 1000);
  return {
    id: e.id,
    words,
    excerpt: words === 'words' ? firstWords(e.finalText) || null : null,
    letterDate: longDate(e.occurredOn, locale),
    deletedDate: longDate(isoOf(new Date(e.deletedAt)), locale),
    erasesDate: longDate(isoOf(erases), locale),
  };
}
