/**
 * BL-1723: "Not much today" always answers. The tap either keeps the mark with no words (D-084) or, when the mark cannot
 * be saved, says so in a calm line. It is never silent, never a count, never a gap. Pure and tested
 * (test/quiet-day-answers.test.ts); `start-capture.ts` runs it against the store.
 */
import { markOn, newQuietMark } from '@/components/book/quiet-day.logic';
import type { Entry } from '@/lib/store';

export type QuietDayKept = { kind: 'quietDay'; markId: string };
export type QuietDayNotSaved = { kind: 'quietDayNotSaved' };

/**
 * One mark a day: a second tap finds the first and adds nothing. A save that throws returns `quietDayNotSaved`, and
 * nothing else changes, so the next tap tries again. No words are written by the app.
 */
export function keepQuietDay(input: {
  day: string;
  now: string;
  id: () => string;
  entries: () => readonly Entry[];
  save: (mark: Entry) => void;
}): QuietDayKept | QuietDayNotSaved {
  try {
    const existing = markOn(input.entries(), input.day);
    const mark = existing ?? newQuietMark({ id: input.id(), occurredOn: input.day, capturedAt: input.now });
    if (!existing) input.save(mark);
    return { kind: 'quietDay', markId: mark.id };
  } catch {
    return { kind: 'quietDayNotSaved' };
  }
}

/** What Home shows for an answer: the kept line with Undo, or one calm line (the registered "Nothing you saved has changed" words). */
export type QuietDayResponse = { shown: 'kept'; markId: string } | { shown: 'line'; text: string };

export function quietDayResponse(answer: QuietDayKept | QuietDayNotSaved, notSavedLine: string): QuietDayResponse {
  return answer.kind === 'quietDay' ? { shown: 'kept', markId: answer.markId } : { shown: 'line', text: notSavedLine };
}
