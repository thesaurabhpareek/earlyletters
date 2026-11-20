/**
 * The Book page redesign's pure parts (proposals/book-page.md 2 to 4; BL-660, BL-675, BL-676). The screen
 * ((tabs)/book.tsx), the cover band, the letter card and the Months sheet only draw what this says. Tested in
 * test/book-page.test.ts. Nothing here reads or writes a letter's words.
 */
import { ageLabel, ageOn } from '@scribe/core';
import { copy, fill } from '@/lib/copy';
import { isAccessibilitySize } from '@/lib/a11y.logic';
import { formatClock, spokenDuration } from '@/lib/player/player.logic';
import type { Child } from '@/lib/store';
import { chapterHeading, openerOf, type Chapter } from './chapters';
import { bookCopy } from './copy';

/**
 * The cover band's age line (book.cover.age): months only, in plain words ("18 months", "1 month"), weeks or days in
 * the first month ("3 weeks"), never "and 2 weeks". "Before You" while expecting or before the birthday.
 */
export function coverAge(child: Pick<Child, 'birthday'>, todayISO: string): string {
  if (!child.birthday) return copy.book.beforeYouChapter;
  const age = ageOn(child.birthday, todayISO);
  if (age.days < 0) return copy.book.beforeYouChapter;
  return ageLabel({ ...age, weeks: 0 });
}

/** The cover band's lit edge: the lamp's amber at 40 percent (5.6). */
export const LIT_EDGE_ALPHA = 0.4;
/**
 * The light inside the cover band: gold at the scheme's peak times this. Build 1's lit month card used 0.5; over the
 * lamp's own pool at its peak that leaves dark mode's textMuted at 4.27:1, under 4.5. At 0.35 it holds 4.56:1 (the
 * check book-page.md 3 asks for, in test/book-page.test.ts).
 */
export const LIT_BAND_STRENGTH = 0.35;

/** Visible lines of a Book card's excerpt (book-page.md 2): three, or two at accessibility sizes (AX1 and above). */
export const BOOK_EXCERPT_LINES = { standard: 3, accessibility: 2 } as const;

export function bookExcerptLines(fontScale: number): number {
  return isAccessibilitySize(fontScale) ? BOOK_EXCERPT_LINES.accessibility : BOOK_EXCERPT_LINES.standard;
}

/** At accessibility sizes the card's footer (signature, Private, voice marker) stacks instead of sharing a row. */
export function cardFooterStacks(fontScale: number): boolean {
  return isAccessibilitySize(fontScale);
}

/**
 * The quiet voice marker on a card with a recording (book.card.voice, book.card.voiceA11y): "Voice 1:06" beside a
 * small waveform glyph, and "Voice recording, 1 minute 6 seconds" for VoiceOver. A glyph and a word, so colour is
 * never the only signal, and never a play button. Null when there is no recording length to say.
 */
export function voiceMarker(durationMs: number | null | undefined): { text: string; a11y: string } | null {
  if (!durationMs || durationMs <= 0) return null;
  const seconds = Math.round(durationMs / 1000);
  return { text: fill(bookCopy.cardVoice, { duration: formatClock(seconds) }), a11y: fill(bookCopy.cardVoiceA11y, { duration: spokenDuration(seconds) }) };
}

/** One row of the Months sheet: only a month that has letters, and only what exists in it. */
export interface MonthRow {
  key: string;
  /** Where the chapter is in the Book's list, to jump to. */
  sectionIndex: number;
  /** "18 months", "The first weeks", "Before You". */
  label: string;
  /** "3 letters, from Mama and Papa" (book.months.row: the count line and the from line, spoken form). */
  line: string;
  /** "18 months. 3 letters, from Mama and Papa", one VoiceOver element. */
  a11yLabel: string;
}

/**
 * The Months sheet's rows, newest first like the Book: months with letters only (a month of only quiet days, or the
 * current month before its first letter, is not a place to go). No count of months, no empty months.
 */
export function monthRows(chapters: readonly Chapter[]): MonthRow[] {
  const rows: MonthRow[] = [];
  chapters.forEach((ch, sectionIndex) => {
    if (!ch.countLine) return;
    const label = chapterHeading(ch.month);
    const line = openerOf(ch).lineSpoken;
    rows.push({ key: ch.key, sectionIndex, label, line, a11yLabel: `${label}. ${line}` });
  });
  return rows;
}

/** The Months button shows once there is more than one month to go to (book-page.md 2 "Scale to 400 letters"). */
export const MONTHS_BUTTON_MIN_ROWS = 2;

export function showsMonthsButton(rows: readonly MonthRow[]): boolean {
  return rows.length >= MONTHS_BUTTON_MIN_ROWS;
}

/**
 * The compact sticky month line in the inline bar after scroll ("16 months   July 12 to August 11"), for the chapter
 * at the top of the list. Null before any chapter is known.
 */
export function compactMonth(chapters: readonly Chapter[], key: string | null): { heading: string; range: string | null; a11yLabel: string } | null {
  const ch = chapters.find((c) => c.key === key) ?? null;
  if (!ch) return null;
  const o = openerOf(ch);
  return { heading: o.heading, range: o.range, a11yLabel: [o.heading, o.range].filter(Boolean).join(', ') };
}

/**
 * The chapter at the top of the list, from the rows a list says are on screen (newest first): the first one's
 * section. Null when nothing is on screen.
 */
export function topChapterKey(viewable: readonly { section?: { key?: string } | null }[]): string | null {
  for (const v of viewable) if (v.section?.key) return v.section.key;
  return null;
}

/* ------------------------------------------------------------------ */
/* Going to a month (book-page.md 3): fade out, move at once, fade in  */
/* ------------------------------------------------------------------ */

/**
 * Where a month is in the Book's list now, found again by its key: the list can change between the tap and the move
 * (a co-parent's deletion, a sync rebuild). Null when the month is gone or has no letters any more.
 */
export function jumpTarget(chapters: readonly Pick<Chapter, 'key' | 'countLine'>[], key: string): number | null {
  const i = chapters.findIndex((c) => c.key === key);
  return i >= 0 && chapters[i]!.countLine ? i : null;
}

/** How many times a jump tries a month the list has not measured yet before it gives up and fades back in. */
export const JUMP_MAX_TRIES = 5;

/** The screen's side of a jump: the list and its fade. */
export interface JumpSteps {
  /** Fade the list out, then call `next` (always, also when the fade was cut short). */
  fadeOut: (next: () => void) => void;
  /** The month's current place in the list, or null when it is gone (jumpTarget). */
  locate: () => number | null;
  /** Move there at once. False when the list could not reach it yet (scrollToIndexFailed: not measured). */
  scroll: (sectionIndex: number) => boolean;
  /** Call `retry` once after the next layout (or frame), when cells near the target have been measured. */
  afterLayout: (retry: () => void) => void;
  /** Fade the list back in. */
  fadeIn: () => void;
}

/**
 * Runs a jump: the list always comes back. A month that is gone is not moved to; a month not measured yet is tried
 * again after the next layout, up to `maxTries` in all; a throw anywhere still fades the list back in.
 */
export function runJump(steps: JumpSteps, maxTries: number = JUMP_MAX_TRIES): void {
  const attempt = (n: number) => {
    let retrying = false;
    try {
      const at = steps.locate();
      if (at === null) return;
      if (!steps.scroll(at) && n < maxTries) {
        steps.afterLayout(() => attempt(n + 1));
        retrying = true;
      }
    } finally {
      if (!retrying) steps.fadeIn();
    }
  };
  steps.fadeOut(() => attempt(1));
}
