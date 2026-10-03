/**
 * Copy helper. Every word comes from @scribe/content; screens never
 * hardcode user-facing text. Placeholders are filled with renderTemplate.
 *
 * `{app}` (the public name) is filled here, once, from packages/brand, so
 * in-app copy never types the name and screens can render strings such as
 * `copy.ageGate.stopBody` as they are (CLAUDE.md: the name lives only in
 * packages/brand). Every other placeholder is left for `fill`.
 *
 * Feature-local copy files (`*copy.ts` under src/) are allowed for strings a
 * feature is still settling, but they obey the same rules: the content rules
 * test in packages/content scans them.
 */
import { brand } from '@scribe/brand';
import { en, permissions } from '@scribe/content';
import { renderTemplate } from '@scribe/core';

const APP = /\{app\}/g;

/** Deep copy of `value` with `{app}` replaced by the brand name. Shape and keys are unchanged. */
export function withBrandName<T>(value: T, name: string = brand.name): T {
  if (typeof value === 'string') return value.replace(APP, name) as T;
  if (Array.isArray(value)) return value.map((v) => withBrandName(v, name)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = withBrandName(v, name);
    return out as T;
  }
  return value;
}

export const copy: typeof en = withBrandName(en);

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
 * @deprecated Every string now lives in @scribe/content (3 Oct 2026). This is a
 * thin re-export so existing call sites keep working; new code uses `copy.*`
 * directly (the content key is noted on each line). Remove a line once its
 * last call site has moved.
 */
export const pendingCopy = {
  onboarding: {
    dueDateLabel: copy.onboarding.child.dueDateLabel,
    removeChild: copy.onboarding.child.removeA11y,
    signsAsTitleMany: copy.onboarding.signsAs.titleMany,
    andJoin: copy.common.andJoin,
    mishearTitle: copy.onboarding.promise.mishearTitle,
  },
  listen: copy.listen,
  review: {
    putBack: copy.review.putBackToast,
    editA11yHint: copy.review.editA11yHint,
    removedA11y: copy.review.removedA11y,
    editTextButton: copy.review.editTextButton,
    sampleBanner: copy.review.dev.sampleBanner,
    sampleNotSaved: copy.review.dev.sampleNotSaved,
    voiceOnlyButton: copy.review.voiceOnlyButton,
    waitingTitle: copy.review.waiting.title,
    waitingBody: copy.review.waiting.body,
    voiceOnlyToast: copy.review.destination.voiceOnlyToast,
    changesLabelOne: copy.review.changesLabelOne,
    toChildA11y: copy.review.toChildA11y,
  },
  write: {
    label: copy.write.label,
    savedOnPhone: copy.write.autosaved,
  },
  book: {
    letters: copy.book.chapterLetters,
    letterOne: copy.book.chapterSubtitleOne,
    notes: copy.book.chapterNotes,
    noteOne: copy.book.chapterNoteOne,
    lettersAndNotes: copy.book.chapterMixed,
    waitingForWords: copy.book.waitingForWords,
  },
  readTogether: {
    plusTitle: copy.readTogether.plusGate.title,
    plusBody: copy.readTogether.plusGate.body,
    keepNote: copy.readTogether.plusGate.keepNote,
    emptyBody: copy.readTogether.empty,
  },
  reader: {
    deletedUndoBody: copy.reader.deletedBody,
  },
  tonight: {
    waitingTitle: copy.tonight.draftWaiting.title,
  },
  recordings: {
    orphansTitle: copy.settings.recordings.orphansTitle,
    orphansOne: copy.settings.recordings.orphansOne,
    orphansMany: copy.settings.recordings.orphansMany,
  },
  /** OS purpose strings with `{app}` unfilled; app.config.ts fills it at build time. */
  permissions,
} as const;
