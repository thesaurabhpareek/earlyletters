/**
 * Copy helper. Every word comes from @scribe/content; screens never
 * hardcode user-facing text. Placeholders are filled with renderTemplate.
 */
import { en } from '@scribe/content';
import { renderTemplate } from '@scribe/core';
import { permissionCopy } from './permission-copy';

export const copy = en;

export function fill(text: string, values: Record<string, string | number> = {}): string {
  return renderTemplate(text, values);
}

/** English plural choice for counted strings until packages/content has plural forms (TDD 09 7.2 item 2). */
export function plural<T>(count: number, one: T, other: T): T {
  return new Intl.PluralRules('en').select(count) === 'one' ? one : other;
}

/** Time-of-day greeting key, per en.tonight.greeting. */
export function greetingKey(hour = new Date().getHours()): keyof typeof en.tonight.greeting {
  if (hour < 5) return 'lateNight';
  if (hour < 8) return 'earlyMorning';
  if (hour < 12) return 'morning';
  if (hour < 14) return 'midday';
  if (hour < 18) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

/**
 * TODO(PM): strings missing from packages/content/src/strings.en.ts, used by
 * the capture screens (Mobile A). Written to VOICE.md rules (no dashes,
 * curly quotes, ellipses or emoji). The comment is the proposed key. When the
 * key lands in @scribe/content, switch the call site to `copy.<key>` and
 * delete the line here so the content rule tests cover it.
 */
export const pendingCopy = {
  onboarding: {
    dueDateLabel: 'Due date', // onboarding.child.dueDateLabel (also proposed by Mobile B)
    removeChild: 'Remove {child}', // onboarding.child.removeA11y (twins: remove an extra name row)
    signsAsTitleMany: 'What do {child} call you?', // onboarding.signsAs.titleMany (twins: plural verb)
    andJoin: '{a} and {b}', // common.andJoin (names list: "Asha and Dev")
    mishearTitle: 'We can mishear', // onboarding.promise.mishearTitle (body reuses settings.help.mistakes)
  },
  listen: {
    toChild: 'To {child}', // listen.toChild (DESIGN_LANGUAGE 12, Listening)
    audience: 'Only you, until you add it to the book.', // listen.audience (DESIGN_LANGUAGE 1.7)
    elapsedA11y: '{minutes} min {seconds} s recorded', // listen.elapsedA11y
    discardButton: 'Let it go', // listen.discardButton
    discardTitle: 'Let this recording go?', // listen.discardTitle
    discardBody: 'It will be removed from this phone.', // listen.discardBody
    discardConfirm: 'Take it off this phone', // listen.discardConfirm
    keepButton: 'Keep it', // listen.keepButton
  },
  review: {
    putBack: 'Put back.', // review.putBackToast (MOTION 5d)
    editA11yHint: 'Edited. Double tap to see what you said.', // review.editA11yHint (COMPONENTS 2.19)
    removedA11y: 'Words left out here', // review.removedA11y
    editTextButton: 'Change words', // review.editTextButton
    sampleBanner: 'Sample words for testing, not your recording.', // dev builds only; may stay out of content
    sampleNotSaved: 'Sample words are never saved. Keep the recording only, or type it.', // dev builds only; may stay out of content
    voiceOnlyButton: 'Keep recording only', // review.voiceOnlyButton (ADR 0001: audio-only until the model is ready)
    waitingTitle: 'Your voice is kept', // review.waiting.title (TDD 03 FM-9: no transcriber yet)
    waitingBody: 'Words are not ready on this phone yet. Keep the recording now and the words can come later. You can also type it.', // review.waiting.body
    voiceOnlyToast: 'Recording kept on this phone.', // review.destination.voiceOnlyToast
    changesLabelOne: '1 small fix', // review.changesLabel one form (TDD 09 L4; content has only "{count} small fixes")
    toChildA11y: 'To {child}. Change', // review.toChildA11y (TDD 09 A11Y-F12)
  },
  write: {
    label: 'Your letter', // write.label (VoiceOver; visually hidden)
    savedOnPhone: 'Saved on this phone', // write.autosaved (COMPONENTS 2.8)
  },
  book: {
    letters: '{count} letters', // book.chapterLetters (replaces chapterSubtitle when all are letters)
    letterOne: '1 letter', // book.chapterSubtitleOne (exists)
    notes: '{count} notes', // book.chapterNotes
    noteOne: '1 note', // book.chapterNoteOne
    lettersAndNotes: '{letters} and {notes}', // book.chapterMixed
    waitingForWords: 'A recording, waiting for its words.', // book.waitingForWords (voice-only letter, TDD 01 OQ-11)
  },
  readTogether: {
    plusTitle: 'Read together is part of Plus', // readTogether.plusGate.title
    plusBody: 'You have read together {count} times for free. Plus keeps it open whenever you like.', // readTogether.plusGate.body
    keepNote: 'Every letter you have made stays open to read, play and export, with or without Plus.', // readTogether.plusGate.keepNote
    emptyBody: 'Letters you add to the book will be here to read together.', // readTogether.empty
  },
  reader: {
    deletedUndoBody: 'You can still undo this, or close to go back to the book.', // reader.deletedBody (no timed return, TDD 09 A11Y-F03)
  },
  tonight: {
    waitingTitle: 'A letter is waiting to be read back.', // tonight.draftWaiting.title
  },
  recordings: {
    orphansTitle: 'Recordings without a letter', // settings.recordings.orphansTitle (TDD 01 3.2.4)
    orphansOne: '1 recording on this phone is not part of a letter yet. It stays on this phone.', // settings.recordings.orphansOne
    orphansMany: '{count} recordings on this phone are not part of a letter yet. They stay on this phone.', // settings.recordings.orphansMany
  },
  /** iOS microphone purpose string, from docs/legal/app-store-privacy-labels.md 4 (counsel review pending). */
  permissions: permissionCopy,
} as const;
