/**
 * Tonight's "From the book" card and the day-zero card (NX-36 S13, BL-790). Pure: no React Native import, so the
 * rules are unit tested in test/tonight-from-the-book.test.ts.
 *
 * A kept letter is chosen by the date, never by a score and never by a model. The same letter shows all day, on every
 * open and every cold start, and the choice moves on at local midnight (the room's clock, `today`):
 *
 *   1. Eligible: a kept letter of the active book with words, in the book (not Private), not a quiet-day mark, not
 *      dated to a month only (F09-REQ-003), and not dated today (today's letter is in the Book; Tonight is for the
 *      next one).
 *   2. A letter dated 28 to 35 days ago takes priority (the newest of them), kicker "A month ago".
 *   3. Otherwise the letters, oldest first, taken by the day count modulo how many there are. No hash, no weight, no
 *      "most loved". Kicker "From the book". With one letter, that letter every day.
 *
 * The words are the parent's own, as stored. The excerpt is a prefix of the letter's text, cut only at a space, never
 * rewritten, summarised or reordered (the constitution). The label VoiceOver reads is capped to whole words.
 * No event is sent for any of it.
 *
 * Reversible (Build 12 decisions 1 and 5): the letter slip is the recommended option; the day-zero card is the
 * recommended option; either can be turned off by deleting its row in the Tonight screen.
 */
import { ageOn, chapterOf } from '@scribe/core';
import { copy, fill } from '@/lib/copy';
import { dayDate, isMonthOnly } from '@/lib/dates';
import type { Entry } from '@/lib/store';
import { graphemes } from '../book/book-cover.logic';
import { daysBetween, RESURFACE_DAYS, spoken } from './draft-card.logic';

/** What the picker reads from an entry. */
export type BookLetter = Pick<Entry, 'id' | 'kind' | 'inBook' | 'occurredOn' | 'capturedAt' | 'finalText'> &
  Partial<Pick<Entry, 'occurredPrecision' | 'authorSignsAs' | 'promptKey'>>;

/** The card shows 3 whole lines at default sizes and 2 at accessibility sizes (the Book's saved-moment constant). */
export const FROM_THE_BOOK_LINES = 3;
export const FROM_THE_BOOK_LINES_LARGE = 2;

/** The most of a letter's opening handed to the card; ExcerptFade clips it to its lines. */
export const EXCERPT_MAX_CHARS = 320;

/** VoiceOver reads at most this many words of the letter before the date. */
export const LABEL_MAX_WORDS = 25;

/**
 * ...and at most this many characters. Text without spaces (Japanese, Chinese) is one "word", so the word cap alone
 * would read the whole letter aloud.
 */
export const LABEL_MAX_CHARS = 200;

export type FromTheBookKind = 'monthAgo' | 'fromTheBook';

export type FromTheBookPick = { letter: BookLetter; kind: FromTheBookKind };

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Whole days from 1970-01-01 to a YYYY-MM-DD date, by UTC noon so no time zone or clock change moves it. */
export function daysSinceEpoch(iso: string): number {
  return Math.round(daysBetween('1970-01-01', iso));
}

/** A letter started from a hard-day prompt (`hard.*`) is never brought back unasked on Tonight. */
export const isHardPrompt = (promptKey: string | null | undefined): boolean => !!promptKey && promptKey.startsWith('hard.');

export function eligibleForTheBook(e: BookLetter, today: string): boolean {
  return e.kind === 'letter' && !isHardPrompt(e.promptKey) && e.inBook && !isMonthOnly(e) && e.finalText.trim() !== '' && e.occurredOn.slice(0, 10) !== today;
}

/**
 * The one kept letter Tonight shows today, or null. `yesterdayPickId` (optional): with more than one letter, a pick
 * equal to it moves to the next letter. The day count already steps by one each day, so this only matters when the
 * book changed overnight.
 */
export function pickFromTheBook(letters: readonly BookLetter[], today: string, yesterdayPickId?: string | null): FromTheBookPick | null {
  const eligible = letters.filter((e) => eligibleForTheBook(e, today));
  if (eligible.length === 0) return null;
  const monthAgo = eligible
    .filter((e) => {
      const age = daysBetween(e.occurredOn, today);
      return age >= RESURFACE_DAYS.from && age <= RESURFACE_DAYS.to;
    })
    .sort((a, b) => cmp(b.occurredOn, a.occurredOn) || cmp(b.capturedAt, a.capturedAt) || cmp(a.id, b.id))[0];
  if (monthAgo) return { letter: monthAgo, kind: 'monthAgo' };
  const oldestFirst = [...eligible].sort((a, b) => cmp(a.occurredOn, b.occurredOn) || cmp(a.capturedAt, b.capturedAt) || cmp(a.id, b.id));
  const n = oldestFirst.length;
  let at = ((daysSinceEpoch(today) % n) + n) % n;
  if (n > 1 && oldestFirst[at].id === yesterdayPickId) at = (at + 1) % n;
  return { letter: oldestFirst[at], kind: 'fromTheBook' };
}

/** A zero-width joiner or a virama (halant) joins to what follows; a cut must not end on one. */
const DANGLING_END = /[\u200D\u094D\u09CD\u0A4D\u0ACD\u0B4D\u0BCD\u0C4D\u0CCD\u0D4D\u0DCA]+$/;

/** Cut text to `max` user-perceived characters (graphemes), never ending on a joiner or virama. Always a verbatim prefix. */
function graphemePrefix(text: string, max: number): string {
  return graphemes(text).slice(0, max).join('').replace(DANGLING_END, '');
}

/**
 * The letter's opening, verbatim: a prefix of the text (leading space dropped), at most `max` characters (counted by
 * grapheme), cut back to the last space when it must be cut. Never a changed or added character.
 */
export function excerptOf(finalText: string, max: number = EXCERPT_MAX_CHARS): string {
  const text = finalText.trimStart();
  const parts = graphemes(text);
  if (parts.length <= max) return text.trimEnd();
  const cut = parts.slice(0, max).join(''); // by grapheme: never half of a surrogate pair, emoji sequence or cluster
  if (/\s/.test(text.charAt(cut.length))) return cut.trimEnd();
  const space = cut.search(/\s\S*$/);
  // No space in the whole opening (Japanese, Chinese, one very long word): cut at `max` graphemes, still a verbatim prefix.
  return (space > 0 ? cut.slice(0, space) : cut.replace(DANGLING_END, '')).trimEnd();
}

/**
 * The first `max` whole words of the text, single-spaced, for a screen reader, and never more than `maxChars`
 * characters (graphemes): whole words are dropped to fit, and a single run with no spaces is cut at `maxChars`
 * graphemes, never ending on a joiner or virama.
 */
export function cappedWords(text: string, max: number = LABEL_MAX_WORDS, maxChars: number = LABEL_MAX_CHARS): string {
  const words = text.split(/\s+/).filter(Boolean).slice(0, max);
  while (words.length > 1 && graphemes(words.join(' ')).length > maxChars) words.pop();
  const out = words.join(' ');
  return graphemes(out).length > maxChars ? graphemePrefix(out, maxChars) : out;
}

export type FromTheBookCard = {
  id: string;
  kicker: string;
  /** The parent's opening words, verbatim. */
  excerpt: string;
  /** "Month 3 · Saturday, October 14, 2026": the child's age at the letter and the day (the Book's date format). */
  dateline: string;
  /** "From Mama". */
  signature: string;
  /** One element for VoiceOver: kicker, the first words (capped), the date. "Opens the letter." is the hint, read once */
  a11yLabel: string;
};

/** The child's month of age at a letter, or null before the birth (the Book's chapter rule). */
function monthAt(birthday: string | null, iso: string): number | null {
  if (!birthday || ageOn(birthday, iso).days < 0) return null;
  return chapterOf(birthday, iso);
}

function stageAt(birthday: string | null, iso: string): string {
  const month = monthAt(birthday, iso);
  if (month === null) return copy.book.beforeYouChapter;
  if (month === 0) return copy.book.chapterNewborn;
  return fill(copy.book.chapterTitle, { month });
}

export function fromTheBookCard(pick: FromTheBookPick, child: { birthday: string | null; signsAs: string }): FromTheBookCard {
  const { letter, kind } = pick;
  const kicker = kind === 'monthAgo' ? copy.tonight.resurfaced.kicker : copy.tonight.fromTheBook.kicker;
  const day = dayDate(letter.occurredOn);
  return {
    id: letter.id,
    kicker,
    excerpt: excerptOf(letter.finalText),
    dateline: `${stageAt(child.birthday, letter.occurredOn)} · ${day}`,
    signature: fill(copy.book.signature, { signsAs: letter.authorSignsAs ?? child.signsAs }),
    a11yLabel: spoken([kicker, cappedWords(letter.finalText), fill(copy.tonight.resurfaced.a11y, { date: day })]),
  };
}

/* ------------------------------------------------------------------ */
/* Day zero                                                            */
/* ------------------------------------------------------------------ */

export type DayZeroCard = { title: string; line: string; a11yLabel: string };

/**
 * The empty-book card shows only while the book has no letter at all (a quiet-day mark is not a letter). It states
 * what exists: the book. No count, no gap, no progress.
 */
export function showsDayZero(entries: readonly Pick<Entry, 'kind'>[]): boolean {
  return !entries.some((e) => e.kind === 'letter');
}

export function dayZeroCard(childName: string): DayZeroCard {
  const f = copy.tonight.fromTheBook;
  const title = childName.trim() ? fill(f.emptyTitle, { child: childName }) : f.emptyTitleNameless;
  return { title, line: f.emptyLine, a11yLabel: spoken([title, f.emptyLine]) };
}
