/**
 * Recently deleted shelf rows (D-085, EXPERIENCE_PASS S38, S63). Pure and tested (shelf.logic.test.ts,
 * test/book-shelf.test.ts).
 *
 * A row shows the first words of the letter (so the person can tell which one it is), who it is from, and one
 * line joining the day it was deleted and the day it is kept until: "Deleted October 13. Kept here until
 * November 12." The second date is the deletion time plus the shelf days, shown in the phone's own day, never as a
 * countdown (nothing here counts down or counts what is left), and always as a date still to come.
 *
 * Erase now is offered only where it can do what it says. A build that syncs has no Erase now until the server
 * erase exists (WP-F16-13, F17-REQ-025): store.eraseEntry refuses in a sync build today, so the honest shelf shows
 * Restore and the date line, and the letter goes at the server purge.
 */
import { dateLocale, isMonthOnly, isoOf, longDate, monthOnlyDateline } from '../../lib/dates';
import { SHELF_DAYS } from '../../lib/shelf-days';
import type { Child, Entry } from '../../lib/store';
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

const dayMonthFormats = new Map<string, Intl.DateTimeFormat>();
/**
 * "October 13" (en-US) or "13 October" (en-GB), from the device's English locale (lib/dates' rule). The shelf's 30
 * days and a month of age never need the year. Also the Book's month range (chapters.ts).
 */
export function monthDay(iso: string, locale?: string): string {
  const loc = dateLocale(locale);
  let f = dayMonthFormats.get(loc);
  if (!f) {
    f = new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'long', timeZone: 'UTC' });
    dayMonthFormats.set(loc, f);
  }
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return f.format(new Date(Date.UTC(y, m - 1, d, 12)));
}

export interface ShelfRowView {
  id: string;
  /** First words, or null when there are none to show (waiting for words, or nobody spoke). */
  excerpt: string | null;
  /** Every word of the letter, for the two-line fade and the accessibility label; null when there are none. */
  fullText: string | null;
  /** 'waiting' | 'nobodySpoke' | 'words' */
  words: ReturnType<typeof letterWords>;
  /** "September 29, 2026": the day the letter is about; "Sometime in Month 3" for a letter dated to a month only. */
  letterDate: string;
  /** The day it was deleted, in the phone's local day. */
  deletedDate: string;
  /** The day the launch purge erases it. */
  erasesDate: string;
  /** "October 13": the deleted day for the joined line. */
  deletedDay: string;
  /** "November 12": the last day it waits here, for the joined line. */
  keptUntilDay: string;
}

/**
 * `child` is the letter's book: a letter dated to a month only shows that month (F09-REQ-003), never the stored day,
 * which is only where its month of age starts.
 */
export function shelfRow(e: Entry & { deletedAt: string }, locale?: string, child?: Pick<Child, 'birthday'> | null): ShelfRowView {
  const words = letterWords(e);
  const erases = new Date(Date.parse(e.deletedAt) + SHELF_DAYS * 24 * 60 * 60 * 1000);
  const deletedISO = isoOf(new Date(e.deletedAt));
  const erasesISO = isoOf(erases);
  const text = words === 'words' ? e.finalText.replace(/\s+/g, ' ').trim() : '';
  return {
    id: e.id,
    words,
    excerpt: words === 'words' ? firstWords(e.finalText) || null : null,
    fullText: text || null,
    letterDate: isMonthOnly(e) && child ? monthOnlyDateline(child, e.occurredOn) : longDate(e.occurredOn, locale),
    deletedDate: longDate(deletedISO, locale),
    erasesDate: longDate(erasesISO, locale),
    deletedDay: monthDay(deletedISO, locale),
    keptUntilDay: monthDay(erasesISO, locale),
  };
}

/**
 * The one date line under a shelf card: "Deleted October 13. Kept here until November 12." Built from the two keys
 * (`deletedOn` "Deleted {date}", `erasesOn` "Kept here until {date}"), each a sentence, so no word is new.
 */
export function shelfDateLine(v: Pick<ShelfRowView, 'deletedDay' | 'keptUntilDay'>, words: { deletedOn: string; erasesOn: string }): string {
  const fillDate = (t: string, date: string) => t.replace('{date}', date);
  return `${fillDate(words.deletedOn, v.deletedDay)}. ${fillDate(words.erasesOn, v.keptUntilDay)}.`;
}

/**
 * What a shelf card offers. Restore always. Erase now only when this build can erase for good everywhere the letter
 * is: always on a phone that does not sync; in a sync build only once the server erase exists (`serverErase`, from
 * the sync stream when WP-F16-13 lands; until then nothing passes it, so a sync build shows no Erase now).
 */
export function shelfActions(build: { sync: boolean; serverErase?: boolean }): { restore: true; eraseNow: boolean } {
  return { restore: true, eraseNow: !build.sync || build.serverErase === true };
}

/**
 * What the shelf says after Restore (S38): "Back in Asha's book." naming the letter's book, or the open one. When no
 * book can be named at all, the same line without a name, so it never reads "Back in 's book." (P5 critics' pass, L9).
 */
export function restoredLine(words: { restoredToast: string; restoredToastNoName: string }, bookName: string | null | undefined): string {
  const name = bookName?.trim();
  return name ? words.restoredToast.replace('{child}', () => name) : words.restoredToastNoName;
}

/**
 * What Erase now did, from what the store answered and what the shelf holds afterwards (P5 critics' pass, S6).
 *   erased  the letter and its recording are gone: "Letter erased."
 *   kept    the store refused (the recording's file could not be removed, so the row stays for another try, D-085) and the
 *           letter is still on the shelf: say so, and say that the letter was not erased (nothing about the file: part of it
 *           may be gone).
 *   gone    refused, but the letter is no longer on the shelf either (restored or erased on another phone while the
 *           sheet was open): nothing to say, the card has already left.
 */
export type EraseOutcome = 'erased' | 'kept' | 'gone';

export function eraseOutcome(erased: boolean, stillOnShelf: boolean): EraseOutcome {
  if (erased) return 'erased';
  return stillOnShelf ? 'kept' : 'gone';
}
