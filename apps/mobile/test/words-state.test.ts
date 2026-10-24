/// <reference types="node" />
/**
 * Review before the words are there (EXPERIENCE_PASS_2026-10 S14, S15, S16, package P4): one card per state, one
 * primary and at most one quiet action, never a claim that a recording is kept when its file is empty or missing,
 * never a title that says nobody spoke (D-086). Pure parts (components/capture/words-state.logic.ts) run here; the
 * screen's use of them is checked in its source. Fixtures: the fictional family Asha only (CLAUDE.md).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { en, languageCopy, speechConsentCopy, speechSettingsCopy, wordsCopy } from '@scribe/content';
import { describe, expect, it } from 'vitest';
import {
  LATER_AFTER_MS,
  WAITING_LONG_MS,
  lengthA11y,
  progressClock,
  recordingKept,
  stopLine,
  takeFile,
  waitingHints,
  wordsActionLabel,
  wordsActions,
  wordsCard,
  type WordsAction,
  type WordsInput,
} from '../src/components/capture/words-state.logic';
import type { Job } from '../src/lib/transcription-queue/machine';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

type J = Pick<Job, 'phase' | 'outcome' | 'failure' | 'progress'>;
const job = (j: Partial<J>): J => ({ phase: 'queued', progress: null, ...j });

const base: WordsInput = {
  emptyFile: false,
  job: null,
  download: { ask: false, progress: null, hold: null, lowSpace: false, size: '575 MB', mb: 575, neededSize: '1.6 GB' },
  hints: { long: false, later: false },
  playing: false,
};
const card = (o: Partial<WordsInput> = {}) => wordsCard({ ...base, ...o, download: { ...base.download, ...(o.download ?? {}) } });

/** Every state the card can be in, with an input that reaches it. */
const EVERY: Record<string, Partial<WordsInput>> = {
  writing: {},
  writingRunning: { job: job({ phase: 'running', progress: { done: 1, total: 3 } }) },
  ask: { job: job({ phase: 'waiting_for_pack' }), download: { ...base.download, ask: true } },
  askLowSpace: { job: job({ phase: 'waiting_for_pack' }), download: { ...base.download, ask: true, lowSpace: true } },
  downloading: { job: job({ phase: 'waiting_for_pack' }), download: { ...base.download, progress: 0.4 } },
  wifi: { job: job({ phase: 'waiting_for_pack' }), download: { ...base.download, hold: 'waiting_for_wifi' } },
  noSpace: { job: job({ phase: 'waiting_for_pack' }), download: { ...base.download, hold: 'no_space' } },
  offline: { job: job({ phase: 'waiting_for_pack' }), download: { ...base.download, hold: 'offline' } },
  language: { job: job({ phase: 'waiting_for_language' }) },
  failed: { job: job({ phase: 'failed', failure: 'transcribe_failed' }) },
  decodeFailed: { job: job({ phase: 'failed', failure: 'decode_failed' }) },
  unsupported: { job: job({ phase: 'failed', failure: 'unsupported' }) },
  fileMissing: { job: job({ phase: 'failed', failure: 'file_missing' }) },
  emptyTake: { emptyFile: true },
  unreadable: { unreadable: true },
  noWords: { job: job({ phase: 'done', outcome: 'no_speech' }) },
};

describe('S14: while the words are being written down', () => {
  it('the moon breathes over "Writing down what you said.", with no action at first', () => {
    expect(card()).toMatchObject({ state: 'writing', kind: 'loading', art: 'moon', still: false, title: wordsCopy.preparing, primary: null, quiet: null });
    expect(card().body).toBeUndefined();
  });

  it('a long take shows its parts with a determinate bar', () => {
    const c = card({ job: job({ phase: 'running', progress: { done: 1, total: 3 } }) });
    expect(c.title).toBe('Writing down what you said. Part 2 of 3.');
    expect(c.bar).toBeCloseTo(1 / 3);
    expect(card({ job: job({ phase: 'running', progress: { done: 0, total: 1 } }) }).bar).toBeUndefined();
  });

  it('after 8 s: "Long recordings take a little more time."; after 15 s with no progress: "Read it back later", quiet', () => {
    expect(WAITING_LONG_MS).toBe(8000);
    expect(LATER_AFTER_MS).toBe(15000);
    expect(card({ hints: { long: true, later: false } }).body).toBe(en.review.waitingLong);
    const later = card({ hints: { long: true, later: true } });
    expect(later.quiet).toBe('later');
    expect(later.primary).toBeNull();
    expect(wordsActionLabel('later')).toBe('Read it back later');
  });

  it('the "no progress" clock starts again on a new part or phase, and keeps its time otherwise', () => {
    const a = progressClock({ key: 'running:0', at: 1000 }, 'running:0', 9000);
    expect(a).toEqual({ key: 'running:0', at: 1000 });
    expect(progressClock(a, 'running:1', 9000)).toEqual({ key: 'running:1', at: 9000 });
    expect(progressClock(a, 'waiting_for_pack:0', 12000)).toEqual({ key: 'waiting_for_pack:0', at: 12000 });
  });

  it('the hints follow the clocks, and "Read it back later" never vanishes once offered', () => {
    expect(waitingHints({ elapsedMs: 7999, sinceProgressMs: 7999, laterOffered: false })).toEqual({ long: false, later: false });
    expect(waitingHints({ elapsedMs: 8000, sinceProgressMs: 8000, laterOffered: false })).toEqual({ long: true, later: false });
    expect(waitingHints({ elapsedMs: 20000, sinceProgressMs: 14999, laterOffered: false })).toEqual({ long: true, later: false });
    expect(waitingHints({ elapsedMs: 20000, sinceProgressMs: 15000, laterOffered: false })).toEqual({ long: true, later: true });
    // A new part arrived (since resets), but the button stays where the finger is.
    expect(waitingHints({ elapsedMs: 21000, sinceProgressMs: 0, laterOffered: true }).later).toBe(true);
  });

  it('the moon holds still while "Hear it" plays', () => {
    expect(card({ playing: true }).still).toBe(true);
  });

  it('nothing suggests software is writing the letter: "writing" only as "writing down", no cursor or typing words', () => {
    for (const t of [wordsCopy.preparing, wordsCopy.listening, en.review.waitingLong, en.review.laterButton]) {
      expect(t.replace(/writing down/gi, '')).not.toMatch(/\bwrit(e|es|ing)\b|typing|cursor/i);
    }
  });

  it('the recording length reads aloud as minutes and seconds, never as "0:42"', () => {
    expect(lengthA11y(42_000)).toBe('0 min 42 s recorded');
    expect(lengthA11y(65_400)).toBe('1 min 5 s recorded');
    expect(lengthA11y(null)).toBeNull();
    expect(lengthA11y(0)).toBeNull();
  });
});

describe('S14: why a take stopped, one line above the card or the letter', () => {
  it('leaving the app, a call or an alert, and the app closing each have their own line', () => {
    expect(stopLine({ stopped: 'background', recoveredAt: null, spoken: true, kept: true })).toBe(wordsCopy.pack.stoppedInBackground);
    expect(stopLine({ stopped: 'interruption', recoveredAt: null, spoken: true, kept: true })).toBe(wordsCopy.pack.stoppedInterruption);
    expect(stopLine({ stopped: undefined, recoveredAt: '2026-10-20T19:42:00Z', spoken: true, kept: true })).toBe(wordsCopy.pack.stoppedClosed);
  });

  it('Finish needs no line, a typed letter never has one, and an unknown param is ignored', () => {
    expect(stopLine({ stopped: undefined, recoveredAt: null, spoken: true, kept: true })).toBeNull();
    expect(stopLine({ stopped: 'background', recoveredAt: null, spoken: false, kept: true })).toBeNull();
    expect(stopLine({ stopped: 'banana', recoveredAt: null, spoken: true, kept: true })).toBeNull();
  });

  it('[review A M1] never above a card where no recording was kept: an empty take or a missing file', () => {
    for (const k of ['emptyTake', 'fileMissing']) {
      const c = card(EVERY[k]);
      expect(recordingKept(c), k).toBe(false);
      for (const stopped of ['background', 'interruption', undefined]) {
        expect(stopLine({ stopped, recoveredAt: '2026-10-20T19:42:00Z', spoken: true, kept: recordingKept(c) }), `${k} ${stopped}`).toBeNull();
      }
    }
    // Every other card stands over a kept recording, so the line shows.
    for (const k of ['writing', 'unreadable', 'failed', 'noWords', 'language', 'downloading']) expect(recordingKept(card(EVERY[k])), k).toBe(true);
    expect(recordingKept(null)).toBe(true); // the letter itself, once its words are there
  });

  it('every line says everything before the stop is kept', () => {
    for (const t of [wordsCopy.pack.stoppedInBackground, wordsCopy.pack.stoppedInterruption, wordsCopy.pack.stoppedClosed]) {
      expect(t).toMatch(/Everything before that is kept\.$/);
    }
  });
});

describe('S15: the language is not on this phone yet', () => {
  it('no yes yet: "Get your words ready", the size from the plan, Download on Wi-Fi first, Keep the recording quiet', () => {
    const c = card(EVERY.ask);
    expect(c).toMatchObject({ state: 'ask', title: speechConsentCopy.title, primary: 'download', quiet: 'keep', still: true });
    expect(c.body).toBe('Spoken letters are written down on this phone. One download of 575 MB, on Wi-Fi.');
    expect(c.note).toBeUndefined();
  });

  it('not enough space to ask: the space line and no download button (Keep the recording leads)', () => {
    const c = card(EVERY.askLowSpace);
    expect(c.primary).toBeNull();
    expect(c.quiet).toBe('keep');
    expect(c.note).toBe('This phone needs 1.6 GB of free space first.');
  });

  it('yes given: "Your voice is kept", the real cause, the status line, Keep the recording first', () => {
    const c = card(EVERY.downloading);
    expect(c).toMatchObject({ state: 'downloading', title: en.review.waiting.title, body: en.review.waiting.body, primary: 'keep', quiet: 'type', still: true });
    expect(c.body).toBe('Your words follow once the download is done.');
    expect(c.note).toBe('Getting ready, 40%');
    expect(c.bar).toBe(0.4);
  });

  it('waiting for Wi-Fi: cellular is the quiet action, named with the size, on a tap only (D-087)', () => {
    const c = card(EVERY.wifi);
    expect(c.quiet).toBe('cellular');
    expect(c.note).toBe(speechSettingsCopy.waitingForWifi.replace('{n}', '575'));
    expect(c.bar).toBeUndefined();
    expect(wordsActionLabel('cellular', '575 MB')).toBe('Use 575 MB of cellular');
  });

  it('no space and offline name their cause; every other wait offers Type it instead', () => {
    expect(card(EVERY.noSpace)).toMatchObject({ note: speechSettingsCopy.noSpace.replace('{n}', '575'), quiet: 'type' });
    expect(card(EVERY.offline)).toMatchObject({ note: speechSettingsCopy.downloadFailures.offline, quiet: 'type' });
  });

  it('a language this build does not hear yet (#260): its own line, Keep the recording, Type it instead', () => {
    expect(card(EVERY.language)).toMatchObject({ state: 'language', title: languageCopy.waitingForLanguage, primary: 'keep', quiet: 'type' });
  });

  it('at most two controls plus Close, in every state', () => {
    for (const [name, input] of Object.entries(EVERY)) expect(wordsActions(card(input)).length, name).toBeLessThanOrEqual(2);
  });
});

describe('S16: when the words do not come', () => {
  it('failed, can retry: "No words yet for this one", "The recording is kept.", Try again, Keep the recording', () => {
    for (const k of ['failed', 'decodeFailed']) {
      expect(card(EVERY[k])).toMatchObject({ state: 'failed', kind: 'error', art: 'envelope', title: en.errors.transcriptionFailed.title, body: en.errors.transcriptionFailed.body, primary: 'retry', quiet: 'keep' });
    }
  });

  it('the file is missing: "The recording did not save", Type it instead, and nothing else', () => {
    const c = card(EVERY.fileMissing);
    expect(c).toMatchObject({ state: 'fileMissing', title: en.review.missingFile.title, primary: 'type', quiet: null });
    expect(c.body).toBeUndefined();
  });

  it('an empty take: "Nothing was recorded", Record again, Type it instead, the page drawing', () => {
    expect(card(EVERY.emptyTake)).toMatchObject({ state: 'emptyTake', art: 'page', title: en.review.emptyTake.title, body: en.review.emptyTake.body, primary: 'recordAgain', quiet: 'type' });
    // The empty file wins over whatever the queue says.
    expect(card({ emptyFile: true, job: job({ phase: 'done', outcome: 'no_speech' }) }).state).toBe('emptyTake');
  });

  it('no words in it: "No words in this one", Keep the recording, Write the words; no Try again, no Record again', () => {
    const c = card(EVERY.noWords);
    expect(c).toMatchObject({ state: 'noWords', art: 'envelope', title: wordsCopy.noSpeech.title, body: wordsCopy.noSpeech.body, primary: 'keep', quiet: 'write' });
    expect(wordsActions(c)).not.toContain('retry');
    expect(wordsActions(c)).not.toContain('recordAgain');
    expect(wordsActionLabel('write')).toBe('Write the words');
  });

  it('[review A H1] an unrecoverable take is empty only with no bytes; with bytes it is unreadable, never "Nothing was recorded"', () => {
    // The launch sweep marks a killed take unrecoverable when it has bytes the probe cannot open (an M4A cut off mid-take).
    expect(takeFile({ state: 'unrecoverable', audioBytes: 900_000 })).toBe('unreadable');
    expect(takeFile({ state: 'unrecoverable', audioBytes: 0 })).toBe('empty');
    expect(takeFile({ state: 'unrecoverable', audioBytes: null })).toBe('empty');
    expect(takeFile({ state: 'ready', audioBytes: 900_000 })).toBeNull();
    expect(takeFile({ state: 'ready', audioBytes: 0 })).toBeNull();
  });

  it('[review A H1] a sweep-marked take with sound offers Keep the recording and says it is kept', () => {
    const c = card({ unreadable: true });
    expect(c).toMatchObject({ state: 'unreadable', title: en.errors.transcriptionFailed.title, body: 'The recording is kept.', primary: 'keep', quiet: 'type' });
    expect(c.title).not.toBe(en.review.emptyTake.title);
    expect(wordsActions(c)).not.toContain('recordAgain');
  });

  it('no state claims a recording is kept when its file is empty or missing', () => {
    for (const k of ['emptyTake', 'fileMissing']) {
      const c = card(EVERY[k]);
      expect(wordsActions(c), k).not.toContain('keep');
      expect(`${c.title} ${c.body ?? ''}`, k).not.toMatch(/\bkept\b/i);
    }
  });

  it('no title says or implies that nobody spoke (D-086)', () => {
    for (const [name, input] of Object.entries(EVERY)) expect(card(input).title, name).not.toMatch(/no(body| one)|didn'?t (speak|talk|say)|no talking|silen/i);
  });

  it('the hard moments hold still: only writing breathes', () => {
    for (const [name, input] of Object.entries(EVERY)) expect(card(input).still, name).toBe(!name.startsWith('writing'));
  });

  it('every label comes from packages/content and fits a button (22 characters)', () => {
    const all: WordsAction[] = ['retry', 'keep', 'type', 'write', 'recordAgain', 'download', 'cellular', 'later'];
    for (const a of all) {
      const label = wordsActionLabel(a, '575 MB');
      expect(label.length, a).toBeGreaterThan(0);
      expect(label.length, a).toBeLessThanOrEqual(22);
    }
  });
});

describe('Review uses the card (source)', () => {
  const review = code(src('app/review.tsx'));

  it('one card for every state before the words, drawn as InlineState with its drawing and stillness', () => {
    expect(review).toMatch(/<InlineState\s+kind=\{card\.kind\}\s+art=\{card\.art\}\s+still=\{card\.still\}/);
    // Empty only with no bytes, the same rule as Tonight's card (review A H1).
    expect(review).toMatch(/const file = takeFile\(draft\);/);
    expect(review).toMatch(/emptyFile: file === 'empty',\s*unreadable: file === 'unreadable',/);
    expect(review).not.toMatch(/emptyFile: phase === 'waiting'/);
  });

  it('the stop line shows only above a kept recording (review A M1)', () => {
    expect(review).toMatch(/stopLine\(\{ stopped, recoveredAt: draft\.recoveredAt, spoken, kept: recordingKept\(card\) \}\)/);
  });

  it('the waiting clocks are wired: the progress clock restarts on progress, and "Read it back later" latches (review A L4)', () => {
    expect(review).toMatch(/progress\.current = progressClock\(progress\.current, progressKey, Date\.now\(\)\);/);
    expect(review).toMatch(/sinceProgressMs: Date\.now\(\) - progress\.current\.at/);
    expect(review).toMatch(/if \(writingNow && hints\.later\) laterOffered\.current = true;/);
    expect(review).toMatch(/laterOffered: laterOffered\.current \}\)/);
  });

  it('the footer never repeats "Keep the recording": only sample words (development) keep it there', () => {
    expect(review).toMatch(/spoken && phase === 'ready' && isSample/);
    expect(review).not.toMatch(/canKeepVoice|wordsCopy\.pack\.keepButton/);
  });

  it('Write the words and Type it instead open Write for this recording; the app never fills words in', () => {
    expect(review).toMatch(/write: \(\) => router\.replace\(\{ pathname: '\/write', params: \{ draftId: draft\.id \} \}\)/);
  });

  it('"Read it back later" closes Review and leaves the queue running', () => {
    expect(review).toMatch(/later: \(\) => \(router\.canGoBack\(\) \? router\.back\(\) : router\.replace\('\/'\)\)/);
    const later = review.slice(review.indexOf('later: () =>'), review.indexOf('later: () =>') + 120);
    expect(later).not.toMatch(/cancel|retryWords|remove/i);
  });

  it('"Hear it" is offered only when there is a sound to hear', () => {
    expect(review).toMatch(/const hasSound = spoken && file !== 'empty' && !\(job\?\.phase === 'failed' && job\.failure === 'file_missing'\)/);
    expect(review).toMatch(/: hasSound \? \(/);
  });

  it('[review B L4] a change of card is said aloud (VoiceOver ignores live regions on iOS): the title, then "Read it back later" when it appears', () => {
    const status = review.slice(review.indexOf('function WordsStatus('), review.indexOf('const action = (a: WordsAction | null)'));
    expect(status).toMatch(/if \(!before\) return;/);
    expect(status).toMatch(/if \(before\.state !== now\.state\) announce\(card\.title\);/);
    expect(status).toMatch(/else if \(!before\.later && now\.later\) announce\(wordsActionLabel\('later'\)\);/);
    expect(review).toMatch(/import \{ announce, useIsAccessibilitySize, useTheme \} from '@\/lib\/a11y';/);
  });

  it('Review is an unlit room (5.8 rows 4 and 4a)', () => {
    expect(review).toMatch(/\buseUnlitRoom\(\);/);
  });

  it('the stop line sits in footnote, textMuted', () => {
    expect(review).toMatch(/<Text variant="footnote" tone="muted" accessibilityLiveRegion="polite" testID="review\.stopLine">/);
  });

  it('InlineState draws a still drawing for any kind, and holds loading still on request (P1 component, S14 to S16)', () => {
    const inline = code(src('components/ui/state-screen.tsx'));
    expect(inline).toMatch(/<Breathe paused=\{!focused \|\| still\}>/);
    expect(inline).toMatch(/<LineArt name=\{drawing\} width=\{96\} animate=\{false\}/);
  });
});
