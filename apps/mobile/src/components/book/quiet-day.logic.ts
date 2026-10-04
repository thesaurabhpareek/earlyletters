/**
 * Quiet-day marks (D-084). "Not much today" stores a mark with no words: the Book shows
 * "A quiet day" with the date, unsigned, and nothing else. Pure and tested
 * (test/quiet-day.test.ts).
 *
 * Old builds saved a template sentence in these rows. `raw_transcript` cannot change (database
 * trigger), so every screen decides by `kind`, never by the text: an old row and a new row look
 * the same, and the old sentence is never shown, read aloud, printed or counted as someone's words.
 */
import { ENGINE_VERSION } from '@scribe/core';
import type { Entry } from '@/lib/store';

export const isQuietMark = (e: Pick<Entry, 'kind'>): boolean => e.kind === 'not_much';

/** The entry a tap on "Not much today" saves: no words anywhere, never in the book, never prompted. */
export function newQuietMark(input: { id: string; occurredOn: string; capturedAt: string }): Entry {
  return {
    id: input.id,
    kind: 'not_much',
    occurredOn: input.occurredOn,
    capturedAt: input.capturedAt,
    // 'typed' only to stay inside the existing capture_mode check; nothing was typed.
    captureMode: 'typed',
    editLevel: 'verbatim',
    promptKey: null,
    engineVersion: ENGINE_VERSION,
    rawTranscript: '',
    machineEdits: [],
    finalText: '',
    inBook: false,
    soundsLikeMe: null,
  };
}

/** A live mark already on this day (the entries are one book's). A second tap adds nothing. */
export function markOn(entries: readonly Entry[], occurredOn: string): Entry | null {
  return entries.find((e) => isQuietMark(e) && e.occurredOn === occurredOn) ?? null;
}

/**
 * What the Book lists: every entry, except a mark on a day that also has a letter or note
 * (that day already has words, so the mark would only add a gap-shaped line).
 */
export function visibleInBook<T extends Pick<Entry, 'kind' | 'occurredOn'>>(entries: readonly T[]): T[] {
  const written = new Set(entries.filter((e) => !isQuietMark(e)).map((e) => e.occurredOn));
  return entries.filter((e) => !isQuietMark(e) || !written.has(e.occurredOn));
}

/** Entries that may be read aloud, printed or moved into the book: words a person said or typed. */
export const isLetterLike = (e: Pick<Entry, 'kind'>): boolean => !isQuietMark(e);

/** What Read together plays and reads: kept in the book, has words (not waiting), and is not a quiet-day mark. */
export function readableInBook<T extends Pick<Entry, 'kind' | 'inBook' | 'transcriptStatus'>>(entries: readonly T[]): T[] {
  return entries.filter((e) => e.inBook && isLetterLike(e) && e.transcriptStatus !== 'waiting');
}

/** Whether the line under a letter's words says who wrote it. Never under an app note (D-084). */
export const showsSignature = (words: 'waiting' | 'nobodySpoke' | 'words'): boolean => words === 'words';
