/**
 * Review before the words are there (EXPERIENCE_PASS_2026-10 S14, S15, S16, package P4). Pure, tested in Node
 * (test/words-state.test.ts); app/review.tsx draws each card as one InlineState.
 *
 * One card per state, with one primary and at most one quiet action (Close is the header's). The person's
 * recording is never touched here; the actions only open Write, ask the queue again, or keep the recording as a
 * letter waiting for its words (review.tsx keepRecordingOnly, where the Keep step decides).
 *
 *   state        when                                      title                         primary            quiet
 *   writing      queued or being written down (S14)        Writing down what you said.   none               Read it back later, after 15 s with no progress
 *   ask          language not on this phone, no yes yet    Get your words ready          Download on Wi-Fi  Keep the recording
 *   downloading  language on its way, yes given (S15)      Your voice is kept            Keep the recording Use {size} of cellular on a Wi-Fi wait, else Type it instead
 *   language     a language this build does not hear (#260) the waiting-for-language line Keep the recording Type it instead
 *   failed       the words could not be written (S16)      No words yet for this one     Try again          Keep the recording
 *   unsupported  this phone cannot write words down        No words yet for this one     Keep the recording Type it instead
 *   fileMissing  the recording's file is not there         The recording did not save    Type it instead    none
 *   emptyTake    the file holds no sound (0 bytes)         Nothing was recorded          Record again       Type it instead
 *   unreadable   the file has sound the phone cannot open  No words yet for this one     Keep the recording Type it instead
 *                (the launch sweep's unplayable take: an M4A cut off mid-take, D-085)
 *   noWords      written down, and no words in it          No words in this one          Keep the recording Write the words
 *
 * Never a claim that a recording is kept when its file is empty or missing; never a title that says nobody spoke
 * (D-086: the take may hold a laugh or a babble); in the no-words state no Try again (the same audio gives the same
 * result) and no Record again (a new letter belongs on Tonight). The person writes any words; the app never fills
 * them in. Words that arrive are shown exactly as said.
 *
 * Spec note (S14): "a take under 1.5 s goes straight to the empty-take state". Here the empty-take state is shown only
 * for a file with no sound in it (0 bytes, the recorder's `unrecoverable`): "Nothing was recorded" would be untrue for
 * a 1.2 s take that holds a word, so a short take with sound goes to the queue like any other (principle 8).
 */
import { speechConsentCopy, speechSettingsCopy, wordsCopy } from '@scribe/content';
import type { StateKind } from '@/components/ui/state-screen.logic';
import type { LineArtName } from '@/components/ui/line-art.data';
import { copy, fill } from '@/lib/copy';
import { waitingForLanguageNote } from '@/lib/transcription-queue/language-hold';
import type { Job } from '@/lib/transcription-queue/machine';

/** S14: after this long the waiting card adds "Long recordings take a little more time." */
export const WAITING_LONG_MS = 8_000;
/** S14: after this long with no progress the waiting card offers "Read it back later". */
export const LATER_AFTER_MS = 15_000;

export type WordsStateName = 'writing' | 'ask' | 'downloading' | 'language' | 'failed' | 'unsupported' | 'unreadable' | 'fileMissing' | 'emptyTake' | 'noWords';

export type WordsAction = 'retry' | 'keep' | 'type' | 'write' | 'recordAgain' | 'download' | 'cellular' | 'later';

export type WordsInput = {
  /** The take's file holds no sound: the recorder or the launch sweep stored 0 bytes (see `takeFile`). */
  emptyFile: boolean;
  /**
   * The take has sound the phone could not open: the launch sweep marked it unrecoverable with bytes (an M4A cut off
   * mid-take). The recording is kept; its words cannot be written down from it (see `takeFile`).
   */
  unreadable?: boolean;
  job: Pick<Job, 'phase' | 'outcome' | 'failure' | 'progress'> | null;
  /** The language download (D-087): whether to ask, its progress (0 to 1) and why it waits. */
  download: {
    /** No yes yet and nothing under way (speech-consent.logic `showReviewAsk`): ask, and start nothing. */
    ask: boolean;
    progress: number | null;
    hold: 'waiting_for_wifi' | 'no_space' | 'offline' | null;
    /** Not enough free space to ask (speechAskFor: 'low_space'): the ask shows the space line and no download button. */
    lowSpace: boolean;
    /** The download's size from this phone's plan, formatted ("575 MB") and in whole megabytes; never a typed number. */
    size: string;
    mb: number;
    /** The free space the download needs (size plus the engine's reserve), formatted, for the low-space line. */
    neededSize: string;
  };
  /** The waiting card's two hints (S14), from `waitingHints`. */
  hints: { long: boolean; later: boolean };
  /** "Hear it" is playing: the moon holds still (S14). */
  playing: boolean;
};

export type WordsCard = {
  state: WordsStateName;
  kind: StateKind;
  art: LineArtName;
  /** The drawing holds still: every state but writing, and writing while "Hear it" plays. */
  still: boolean;
  title: string;
  body?: string;
  /** One extra quiet line under the body: the download's status, or the space it needs. */
  note?: string;
  /** A thin determinate bar (0 to 1): parts written down, or the download's progress. */
  bar?: number;
  primary: WordsAction | null;
  quiet: WordsAction | null;
};

/** The button label for an action. */
export function wordsActionLabel(a: WordsAction, size = ''): string {
  switch (a) {
    case 'retry':
      return copy.errors.transcriptionFailed.button;
    case 'keep':
      return copy.review.voiceOnlyButton;
    case 'type':
      return wordsCopy.pack.typeButton;
    case 'write':
      return wordsCopy.waiting.writeButton;
    case 'recordAgain':
      return wordsCopy.noSpeech.recordAgainButton;
    case 'download':
      return speechConsentCopy.downloadButton;
    case 'cellular':
      return fill(wordsCopy.pack.mobileDataButton, { size });
    case 'later':
      return copy.review.laterButton;
  }
}

function writing(i: WordsInput): WordsCard {
  const progress = i.job?.phase === 'running' ? i.job.progress : null;
  const total = progress?.total ?? 0;
  const done = progress?.done ?? 0;
  const part = Math.min(total, done + 1);
  return {
    state: 'writing',
    kind: 'loading',
    art: 'moon',
    still: i.playing,
    title: total > 1 ? fill(wordsCopy.listening, { n: part, count: total }) : wordsCopy.preparing,
    body: i.hints.long ? copy.review.waitingLong : undefined,
    // The recogniser's own progress within each part when it reports it (whisper.rn), else a step per part; no bar
    // before the first part starts (preparing: reading the recording, finding speech, opening the model).
    // If the recogniser never reports (no callback), the first part shows its words and no bar, never an empty bar
    // that looks stuck; later parts step per part.
    bar: progress?.fraction !== undefined && total > 0 ? progress.fraction : total > 1 && done > 0 ? done / total : undefined,
    primary: null,
    quiet: i.hints.later ? 'later' : null,
  };
}

function languageDownload(i: WordsInput): WordsCard {
  const d = i.download;
  if (d.ask) {
    // No yes yet (D-087): ask, with the size from the plan. Nothing starts on its own.
    return {
      state: 'ask',
      kind: 'empty',
      art: 'moon',
      still: true,
      title: speechConsentCopy.title,
      body: fill(speechConsentCopy.body, { size: d.size }),
      note: d.lowSpace ? fill(speechConsentCopy.lowSpace, { size: d.neededSize }) : undefined,
      primary: d.lowSpace ? null : 'download',
      quiet: 'keep',
    };
  }
  const note =
    d.hold === 'waiting_for_wifi'
      ? fill(speechSettingsCopy.waitingForWifi, { n: d.mb })
      : d.hold === 'no_space'
        ? fill(speechSettingsCopy.noSpace, { n: d.mb })
        : d.hold === 'offline'
          ? speechSettingsCopy.downloadFailures.offline
          : d.progress !== null
            ? fill(speechSettingsCopy.downloading, { n: Math.floor(d.progress * 100) })
            : undefined;
  return {
    state: 'downloading',
    kind: 'empty',
    art: 'moon',
    still: true, // determinate: a still drawing and the bar (HIG Progress indicators)
    title: copy.review.waiting.title,
    body: copy.review.waiting.body,
    note,
    bar: d.progress !== null && d.hold === null ? d.progress : undefined,
    primary: 'keep',
    // Cellular is used only on a tap, this download only (D-087).
    quiet: d.hold === 'waiting_for_wifi' ? 'cellular' : 'type',
  };
}

/**
 * The clock for "no progress" (S14): it starts again whenever the job shows a sign of progress, a new part done or a
 * change of phase (`key`), and keeps its time otherwise.
 */
export function progressClock(prev: { key: string; at: number }, key: string, now: number): { key: string; at: number } {
  return prev.key === key ? prev : { key, at: now };
}

/**
 * The waiting card's hints (S14): "Long recordings take a little more time." after 8 s, and "Read it back later"
 * after 15 s with no progress (a new part, or a change of phase). Once offered, "Read it back later" stays, so a
 * control never vanishes from under a finger when the next part arrives.
 */
export function waitingHints(s: { elapsedMs: number; sinceProgressMs: number; laterOffered: boolean }): { long: boolean; later: boolean } {
  return { long: s.elapsedMs >= WAITING_LONG_MS, later: s.laterOffered || s.sinceProgressMs >= LATER_AFTER_MS };
}

/** The card for Review while there are no words to read (S14 to S16). */
export function wordsCard(i: WordsInput): WordsCard {
  if (i.emptyFile) {
    return {
      state: 'emptyTake',
      kind: 'empty',
      art: 'page',
      still: true,
      title: copy.review.emptyTake.title,
      body: copy.review.emptyTake.body,
      primary: 'recordAgain',
      quiet: 'type',
    };
  }
  if (i.unreadable) {
    const t = copy.errors.transcriptionFailed;
    return { state: 'unreadable', kind: 'error', art: 'envelope', still: true, title: t.title, body: t.body, primary: 'keep', quiet: 'type' };
  }
  const job = i.job;
  if (job?.phase === 'failed') {
    if (job.failure === 'file_missing') {
      return { state: 'fileMissing', kind: 'error', art: 'page', still: true, title: copy.review.missingFile.title, primary: 'type', quiet: null };
    }
    const t = copy.errors.transcriptionFailed;
    if (job.failure === 'unsupported') {
      return { state: 'unsupported', kind: 'error', art: 'envelope', still: true, title: t.title, body: t.body, primary: 'keep', quiet: 'type' };
    }
    return { state: 'failed', kind: 'error', art: 'envelope', still: true, title: t.title, body: t.body, primary: 'retry', quiet: 'keep' };
  }
  if (job?.phase === 'done' && job.outcome === 'no_speech') {
    return {
      state: 'noWords',
      kind: 'empty',
      art: 'envelope',
      still: true,
      title: wordsCopy.noSpeech.title,
      body: wordsCopy.noSpeech.body,
      primary: 'keep',
      quiet: 'write',
    };
  }
  const languageWait = waitingForLanguageNote(job);
  if (languageWait) {
    return { state: 'language', kind: 'empty', art: 'moon', still: true, title: languageWait, primary: 'keep', quiet: 'type' };
  }
  if (job?.phase === 'waiting_for_pack') return languageDownload(i);
  return writing(i);
}

/** Every action the card offers, primary first (for the "at most two controls plus Close" rule, S15). */
export function wordsActions(card: Pick<WordsCard, 'primary' | 'quiet'>): WordsAction[] {
  return [card.primary, card.quiet].filter((a): a is WordsAction => a !== null);
}

/**
 * What an `unrecoverable` draft holds, by the same rule as Tonight's card (draft-card.logic.ts `draftState`): empty
 * when no bytes were stored, unreadable when it has bytes the phone could not open. Any other draft is neither.
 */
export function takeFile(d: { state: string; audioBytes: number | null }): 'empty' | 'unreadable' | null {
  if (d.state !== 'unrecoverable') return null;
  return d.audioBytes ? 'unreadable' : 'empty';
}

/** Whether the card on screen stands over a kept recording: not when the file is empty or missing (S16). */
export function recordingKept(card: Pick<WordsCard, 'state'> | null): boolean {
  return !(card && (card.state === 'emptyTake' || card.state === 'fileMissing'));
}

/**
 * Why a take stopped early, one line above the card or the letter (S14): leaving the app, a call or an alert (Listen's
 * `stopped` param), or the app closing (the launch sweep found the take: `recoveredAt`). Finish needs no line. Every
 * line ends "Everything before that is kept.", so none shows when no recording was kept (S16: `kept` false).
 */
export function stopLine(s: { stopped?: string | null; recoveredAt: string | null; spoken: boolean; kept: boolean }): string | null {
  if (!s.spoken || !s.kept) return null;
  if (s.stopped === 'background') return wordsCopy.pack.stoppedInBackground;
  if (s.stopped === 'interruption') return wordsCopy.pack.stoppedInterruption;
  if (s.recoveredAt) return wordsCopy.pack.stoppedClosed;
  return null;
}

/** The recording's length as VoiceOver reads it ("0 min 42 s recorded"), or null when it is not known. */
export function lengthA11y(ms: number | null | undefined): string | null {
  if (!ms || !Number.isFinite(ms) || ms <= 0) return null;
  const s = Math.round(ms / 1000);
  return fill(copy.listen.elapsedA11y, { minutes: Math.floor(s / 60), seconds: s % 60 });
}
