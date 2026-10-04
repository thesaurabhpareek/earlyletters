/**
 * What screens call. Typed from the catalogue: a wrong event name or value is
 * a compile error, and the helpers turn raw numbers into buckets.
 *
 *   import { trackLetterSaved } from '@/lib/analytics/track';
 *   trackLetterSaved({ mode: 'spoken', inBook: false, childIndex: 0, ... });
 *
 * Events whose properties are plain enums use `track` directly:
 *   track('error_shown', { code: 'save_failed' });
 *
 * Every helper is a no-op until the person says yes. Where each one is called
 * from is listed in docs/analytics/TRACKING_PLAN.md section 9 ("To wire").
 */
import { childOrdinal, type PromptKindValue } from '@scribe/analytics';
import { PROMPTS } from '@scribe/content';
import { listChildren } from '@/lib/store';
import { analytics, trackers } from './index';

export const track = analytics.track;

/** 0-based position of a book among the visible books (helpers take `childIndex`); 0 when unknown. */
export function childIndexOf(childId: string | null | undefined): number {
  const i = childId ? listChildren().findIndex((c) => c.id === childId) : -1;
  return i < 0 ? 0 : i;
}

/** `child_ordinal` / `ordinal` value for a book: first, second or third_plus. Never the name or id. */
export function ordinalOf(childId: string | null | undefined) {
  return childOrdinal(childIndexOf(childId));
}

export const {
  trackLetterSaved,
  trackCaptureStarted,
  trackCaptureDiscarded,
  trackTranscriptionCompleted,
  trackBookOpened,
  trackReadTogetherStarted,
  trackReadTogetherEnded,
  trackInviteCreated,
  trackInviteAccepted,
  trackExportStarted,
  trackExportCompleted,
  trackExportFailed,
  trackReminderSchedule,
  trackMachineEditsRejected,
  trackColdStart,
  trackLanguageSet,
  trackPackDownload,
} = trackers;

/** The kind of a prompt (opening, gap, hard, family, together) for `prompt_kind`; null without one. Never the key or text. */
export function promptKindOf(promptKey: string | null | undefined): PromptKindValue | null {
  if (!promptKey) return null;
  return PROMPTS.find((p) => p.key === promptKey)?.kind ?? null;
}

// The last time an evening reminder opened the app (memory only, this process).
let reminderOpenedAt: number | null = null;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export function noteReminderOpened(at: number = Date.now()): void {
  reminderOpenedAt = at;
}

/** `from_notification_2h`: the letter is saved within two hours of a reminder opening the app. */
export function fromReminderWithin2h(now: number = Date.now()): boolean {
  return reminderOpenedAt !== null && now - reminderOpenedAt >= 0 && now - reminderOpenedAt <= TWO_HOURS_MS;
}

/** Words in a letter, for `words_bucket` only (the text never leaves this function). */
export function wordCountOf(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/u).length : 0;
}
